"use client";

import { useState } from "react";
import {
  AlignLeft,
  Box,
  Braces,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Heading1,
  Image,
  Layers3,
  Lock,
  MousePointerClick,
  PanelLeft,
  PenTool,
  Tags,
  TextCursorInput,
  Type,
  Unlock,
  type LucideIcon,
} from "lucide-react";

import { elementLabels } from "@/lib/studio/project";
import type {
  ElementKind,
  ProjectBrief,
  StudioElement,
  StudioProject,
} from "@/lib/studio/types";

type LibraryTab = "insert" | "layers" | "brief";

const elementIcons: Record<ElementKind, LucideIcon> = {
  heading: Heading1,
  text: Type,
  button: MousePointerClick,
  card: Box,
  input: TextCursorInput,
  checklist: CheckSquare,
  badge: Tags,
  image: Image,
  html: Braces,
};

const palette: Array<{ kind: ElementKind; hint: string }> = [
  { kind: "heading", hint: "큰 제목" },
  { kind: "text", hint: "설명 글" },
  { kind: "button", hint: "동작 연결" },
  { kind: "card", hint: "콘텐츠 묶음" },
  { kind: "input", hint: "기록 받기" },
  { kind: "checklist", hint: "미션 체크" },
  { kind: "badge", hint: "작은 라벨" },
  { kind: "image", hint: "이미지 영역" },
  { kind: "html", hint: "직접 코딩" },
];

export function LibraryPanel({
  project,
  selectedId,
  onAdd,
  onBriefChange,
  onMoveLayer,
  onSelect,
  onToggleElement,
}: {
  project: StudioProject;
  selectedId: string | null;
  onAdd: (kind: ElementKind) => void;
  onBriefChange: (changes: Partial<ProjectBrief>) => void;
  onMoveLayer: (id: string, direction: -1 | 1) => void;
  onSelect: (id: string) => void;
  onToggleElement: (
    id: string,
    changes: Partial<Pick<StudioElement, "hidden" | "locked">>,
  ) => void;
}) {
  const [tab, setTab] = useState<LibraryTab>("insert");

  return (
    <aside className="studio-sidebar library-sidebar">
      <nav className="side-tabs" aria-label="제작 도구">
        <button
          aria-pressed={tab === "insert"}
          className={tab === "insert" ? "active" : ""}
          type="button"
          onClick={() => setTab("insert")}
        >
          <PanelLeft aria-hidden="true" size={15} />
          요소
        </button>
        <button
          aria-pressed={tab === "layers"}
          className={tab === "layers" ? "active" : ""}
          type="button"
          onClick={() => setTab("layers")}
        >
          <Layers3 aria-hidden="true" size={15} />
          레이어
        </button>
        <button
          aria-pressed={tab === "brief"}
          className={tab === "brief" ? "active" : ""}
          type="button"
          onClick={() => setTab("brief")}
        >
          <PenTool aria-hidden="true" size={15} />
          기획
        </button>
      </nav>

      {tab === "insert" && (
        <section className="side-section">
          <div className="side-heading">
            <span>INSERT</span>
            <p>캔버스로 끌어다 놓으세요.</p>
          </div>
          <div className="element-palette">
            {palette.map((item) => {
              const Icon = elementIcons[item.kind];
              return (
                <button
                  draggable
                  key={item.kind}
                  type="button"
                  onClick={() => onAdd(item.kind)}
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "copy";
                    event.dataTransfer.setData(
                      "application/x-web-studio-element",
                      item.kind,
                    );
                  }}
                >
                  <span>
                    <Icon aria-hidden="true" size={17} />
                  </span>
                  <strong>{elementLabels[item.kind]}</strong>
                  <small>{item.hint}</small>
                </button>
              );
            })}
          </div>
          <div className="maker-hint">
            <Braces aria-hidden="true" size={15} />
            <p>
              <strong>클릭만 하는 도구가 아니에요.</strong>
              HTML 요소를 놓거나 아래 코드 창에서 CSS와 JavaScript를 직접
              작성할 수 있어요.
            </p>
          </div>
        </section>
      )}

      {tab === "layers" && (
        <section className="side-section">
          <div className="side-heading">
            <span>LAYERS · {project.elements.length}</span>
            <p>위에 있는 요소가 앞에 보여요.</p>
          </div>
          <div className="layer-list">
            {[...project.elements].reverse().map((item) => {
              const Icon = elementIcons[item.kind];
              return (
                <div
                  className={selectedId === item.id ? "selected" : ""}
                  key={item.id}
                >
                  <button
                    className="layer-main"
                    type="button"
                    onClick={() => onSelect(item.id)}
                  >
                    <Icon aria-hidden="true" size={13} />
                    <span>{item.name}</span>
                  </button>
                  <button
                    aria-label={item.hidden ? "레이어 보이기" : "레이어 숨기기"}
                    type="button"
                    onClick={() =>
                      onToggleElement(item.id, { hidden: !item.hidden })
                    }
                  >
                    {item.hidden ? (
                      <EyeOff aria-hidden="true" size={12} />
                    ) : (
                      <Eye aria-hidden="true" size={12} />
                    )}
                  </button>
                  <button
                    aria-label={item.locked ? "레이어 잠금 해제" : "레이어 잠금"}
                    type="button"
                    onClick={() =>
                      onToggleElement(item.id, { locked: !item.locked })
                    }
                  >
                    {item.locked ? (
                      <Lock aria-hidden="true" size={12} />
                    ) : (
                      <Unlock aria-hidden="true" size={12} />
                    )}
                  </button>
                  <button
                    aria-label="레이어 앞으로"
                    type="button"
                    onClick={() => onMoveLayer(item.id, 1)}
                  >
                    <ChevronUp aria-hidden="true" size={12} />
                  </button>
                  <button
                    aria-label="레이어 뒤로"
                    type="button"
                    onClick={() => onMoveLayer(item.id, -1)}
                  >
                    <ChevronDown aria-hidden="true" size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {tab === "brief" && (
        <section className="side-section brief-panel">
          <div className="side-heading">
            <span>PROJECT BRIEF</span>
            <p>만들기 전에 문제와 사용자를 정의해요.</p>
          </div>
          <label>
            <span>어떤 문제를 해결하나요?</span>
            <textarea
              rows={4}
              value={project.brief.problem}
              onChange={(event) =>
                onBriefChange({ problem: event.target.value })
              }
            />
          </label>
          <label>
            <span>누가 사용하나요?</span>
            <textarea
              rows={3}
              value={project.brief.audience}
              onChange={(event) =>
                onBriefChange({ audience: event.target.value })
              }
            />
          </label>
          <label>
            <span>사용 후 무엇이 달라지나요?</span>
            <textarea
              rows={4}
              value={project.brief.outcome}
              onChange={(event) =>
                onBriefChange({ outcome: event.target.value })
              }
            />
          </label>
          <div className="brief-summary">
            <AlignLeft aria-hidden="true" size={14} />
            <span>
              기획 내용은 결과물에 자동으로 박히지 않아요. 학생이 화면을
              만들 때 판단 기준으로 사용합니다.
            </span>
          </div>
        </section>
      )}
    </aside>
  );
}
