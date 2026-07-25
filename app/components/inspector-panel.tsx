"use client";

import { useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ExternalLink,
  Eye,
  EyeOff,
  Link2,
  Lock,
  MessageSquareText,
  MousePointerClick,
  Save,
  Trash2,
  Unlock,
} from "lucide-react";

import { elementLabels } from "@/lib/studio/project";
import type {
  ElementStyle,
  StudioAction,
  StudioElement,
  StudioProject,
  TextAlign,
} from "@/lib/studio/types";

type InspectorTab = "design" | "action";

export function InspectorPanel({
  project,
  selected,
  onRemove,
  onUpdateCanvas,
  onUpdateElement,
  onUpdateStyle,
}: {
  project: StudioProject;
  selected: StudioElement | null;
  onRemove: () => void;
  onUpdateCanvas: (changes: Partial<StudioProject["canvas"]>) => void;
  onUpdateElement: (changes: Partial<StudioElement>) => void;
  onUpdateStyle: (changes: Partial<ElementStyle>) => void;
}) {
  const [tab, setTab] = useState<InspectorTab>("design");

  return (
    <aside className="studio-sidebar inspector-sidebar">
      <div className="inspector-tabs">
        <button
          aria-pressed={tab === "design"}
          className={tab === "design" ? "active" : ""}
          type="button"
          onClick={() => setTab("design")}
        >
          디자인
        </button>
        <button
          aria-pressed={tab === "action"}
          className={tab === "action" ? "active" : ""}
          type="button"
          onClick={() => setTab("action")}
        >
          동작
        </button>
      </div>

      {!selected && (
        <section className="inspector-section">
          <div className="inspector-heading">
            <span>PAGE</span>
            <strong>캔버스 설정</strong>
          </div>
          <div className="property-grid">
            <NumberField
              label="W"
              value={project.canvas.width}
              onChange={(width) => onUpdateCanvas({ width })}
            />
            <NumberField
              label="H"
              value={project.canvas.height}
              onChange={(height) => onUpdateCanvas({ height })}
            />
          </div>
          <ColorField
            label="배경"
            value={project.canvas.background}
            onChange={(background) => onUpdateCanvas({ background })}
          />
          <p className="empty-selection">
            캔버스에서 요소를 선택하면 위치, 크기, 색, 글꼴과 동작을 직접
            조절할 수 있어요.
          </p>
        </section>
      )}

      {selected && tab === "design" && (
        <>
          <section className="inspector-section element-summary">
            <div>
              <span>{elementLabels[selected.kind]}</span>
              <input
                aria-label="레이어 이름"
                value={selected.name}
                onChange={(event) =>
                  onUpdateElement({ name: event.target.value })
                }
              />
            </div>
            <div className="element-actions">
              <button
                aria-label={selected.hidden ? "요소 보이기" : "요소 숨기기"}
                type="button"
                onClick={() => onUpdateElement({ hidden: !selected.hidden })}
              >
                {selected.hidden ? (
                  <EyeOff aria-hidden="true" size={14} />
                ) : (
                  <Eye aria-hidden="true" size={14} />
                )}
              </button>
              <button
                aria-label={selected.locked ? "잠금 해제" : "잠금"}
                type="button"
                onClick={() => onUpdateElement({ locked: !selected.locked })}
              >
                {selected.locked ? (
                  <Lock aria-hidden="true" size={14} />
                ) : (
                  <Unlock aria-hidden="true" size={14} />
                )}
              </button>
              <button aria-label="요소 삭제" type="button" onClick={onRemove}>
                <Trash2 aria-hidden="true" size={14} />
              </button>
            </div>
          </section>

          <section className="inspector-section">
            <div className="inspector-heading">
              <span>FRAME</span>
              <strong>위치와 크기</strong>
            </div>
            <div className="property-grid">
              <NumberField
                label="X"
                value={selected.x}
                onChange={(x) => onUpdateElement({ x })}
              />
              <NumberField
                label="Y"
                value={selected.y}
                onChange={(y) => onUpdateElement({ y })}
              />
              <NumberField
                label="W"
                min={32}
                value={selected.width}
                onChange={(width) => onUpdateElement({ width })}
              />
              <NumberField
                label="H"
                min={24}
                value={selected.height}
                onChange={(height) => onUpdateElement({ height })}
              />
              <NumberField
                label="각도"
                value={selected.rotation}
                onChange={(rotation) => onUpdateElement({ rotation })}
              />
              <NumberField
                label="투명"
                max={100}
                min={0}
                value={Math.round(selected.style.opacity * 100)}
                onChange={(opacity) => onUpdateStyle({ opacity: opacity / 100 })}
              />
            </div>
          </section>

          {!["image", "html", "checklist"].includes(selected.kind) && (
            <section className="inspector-section">
              <div className="inspector-heading">
                <span>CONTENT</span>
                <strong>텍스트</strong>
              </div>
              <textarea
                rows={4}
                value={selected.content}
                onChange={(event) =>
                  onUpdateElement({ content: event.target.value })
                }
              />
            </section>
          )}

          {selected.kind === "checklist" && (
            <section className="inspector-section">
              <div className="inspector-heading">
                <span>ITEMS</span>
                <strong>체크 항목</strong>
              </div>
              <textarea
                rows={5}
                value={selected.items.join("\n")}
                onChange={(event) =>
                  onUpdateElement({
                    items: event.target.value
                      .split("\n")
                      .map((item) => item.trim())
                      .filter(Boolean),
                  })
                }
              />
            </section>
          )}

          {selected.kind === "input" && (
            <section className="inspector-section">
              <div className="inspector-heading">
                <span>FIELD</span>
                <strong>입력 설정</strong>
              </div>
              <TextField
                label="필드 이름"
                value={selected.fieldName}
                onChange={(fieldName) => onUpdateElement({ fieldName })}
              />
              <TextField
                label="안내 문구"
                value={selected.placeholder}
                onChange={(placeholder) => onUpdateElement({ placeholder })}
              />
            </section>
          )}

          {selected.kind === "image" && (
            <section className="inspector-section">
              <div className="inspector-heading">
                <span>MEDIA</span>
                <strong>이미지 주소</strong>
              </div>
              <TextField
                label="URL"
                value={selected.imageUrl}
                onChange={(imageUrl) => onUpdateElement({ imageUrl })}
              />
            </section>
          )}

          <section className="inspector-section">
            <div className="inspector-heading">
              <span>APPEARANCE</span>
              <strong>색과 모양</strong>
            </div>
            <ColorField
              label="채우기"
              value={normalizeColor(selected.style.fill)}
              onChange={(fill) => onUpdateStyle({ fill })}
            />
            <ColorField
              label="글자"
              value={normalizeColor(selected.style.color)}
              onChange={(color) => onUpdateStyle({ color })}
            />
            <ColorField
              label="테두리"
              value={normalizeColor(selected.style.borderColor)}
              onChange={(borderColor) => onUpdateStyle({ borderColor })}
            />
            <div className="property-grid">
              <NumberField
                label="글자"
                min={6}
                value={selected.style.fontSize}
                onChange={(fontSize) => onUpdateStyle({ fontSize })}
              />
              <NumberField
                label="굵기"
                max={900}
                min={100}
                step={50}
                value={selected.style.fontWeight}
                onChange={(fontWeight) => onUpdateStyle({ fontWeight })}
              />
              <NumberField
                label="곡률"
                min={0}
                value={selected.style.borderRadius}
                onChange={(borderRadius) => onUpdateStyle({ borderRadius })}
              />
              <NumberField
                label="선"
                min={0}
                value={selected.style.borderWidth}
                onChange={(borderWidth) => onUpdateStyle({ borderWidth })}
              />
            </div>
            <div className="align-buttons" aria-label="텍스트 정렬">
              {(
                [
                  ["left", AlignLeft],
                  ["center", AlignCenter],
                  ["right", AlignRight],
                ] as Array<[TextAlign, typeof AlignLeft]>
              ).map(([align, Icon]) => (
                <button
                  aria-label={`${align} 정렬`}
                  aria-pressed={selected.style.textAlign === align}
                  className={selected.style.textAlign === align ? "active" : ""}
                  key={align}
                  type="button"
                  onClick={() => onUpdateStyle({ textAlign: align })}
                >
                  <Icon aria-hidden="true" size={14} />
                </button>
              ))}
              <button
                aria-pressed={selected.style.shadow}
                className={selected.style.shadow ? "active" : ""}
                type="button"
                onClick={() =>
                  onUpdateStyle({ shadow: !selected.style.shadow })
                }
              >
                그림자
              </button>
            </div>
          </section>
        </>
      )}

      {selected && tab === "action" && (
        <section className="inspector-section action-inspector">
          <div className="inspector-heading">
            <span>INTERACTION</span>
            <strong>클릭했을 때</strong>
          </div>
          <div className="action-options">
            {actionOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  aria-pressed={selected.action === option.id}
                  className={selected.action === option.id ? "active" : ""}
                  key={option.id}
                  type="button"
                  onClick={() => onUpdateElement({ action: option.id })}
                >
                  <Icon aria-hidden="true" size={16} />
                  <span>
                    <strong>{option.name}</strong>
                    <small>{option.hint}</small>
                  </span>
                </button>
              );
            })}
          </div>
          {selected.action !== "none" && (
            <label className="action-value">
              <span>
                {selected.action === "open-link"
                  ? "연결 주소"
                  : selected.action === "show-message"
                    ? "보여줄 메시지"
                    : "기록 제목"}
              </span>
              <textarea
                rows={4}
                value={selected.actionValue}
                onChange={(event) =>
                  onUpdateElement({ actionValue: event.target.value })
                }
              />
            </label>
          )}
          <div className="action-note">
            <Link2 aria-hidden="true" size={14} />
            <p>
              동작은 미리보기에서 실행됩니다. ‘기록 저장’은 입력 요소의
              값을 모아 캠프 DB로 보냅니다.
            </p>
          </div>
        </section>
      )}
    </aside>
  );
}

const actionOptions: Array<{
  id: StudioAction;
  name: string;
  hint: string;
  icon: typeof MousePointerClick;
}> = [
  { id: "none", name: "동작 없음", hint: "선택만 가능", icon: MousePointerClick },
  { id: "save-record", name: "기록 저장", hint: "입력값을 DB로", icon: Save },
  {
    id: "show-message",
    name: "메시지",
    hint: "알림창 보여주기",
    icon: MessageSquareText,
  },
  { id: "open-link", name: "링크 열기", hint: "다른 웹으로 이동", icon: ExternalLink },
];

function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="number-field">
      <span>{label}</span>
      <input
        max={max}
        min={min}
        step={step}
        type="number"
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="color-field">
      <span>{label}</span>
      <i style={{ background: value }} />
      <input
        aria-label={`${label} 색상`}
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <code>{value.toUpperCase()}</code>
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-field">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function normalizeColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : "#000000";
}
