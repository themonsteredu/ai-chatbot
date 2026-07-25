"use client";

import { useState } from "react";
import { Braces, ChevronDown, Code2, FileCode2 } from "lucide-react";

import { elementToHtml } from "@/lib/studio/project";
import type { StudioElement, StudioProject } from "@/lib/studio/types";

type CodeTab = "html" | "css" | "js";

export function CodeDock({
  open,
  project,
  selected,
  onClose,
  onProjectChange,
  onSelectedChange,
}: {
  open: boolean;
  project: StudioProject;
  selected: StudioElement | null;
  onClose: () => void;
  onProjectChange: (changes: Partial<StudioProject>) => void;
  onSelectedChange: (changes: Partial<StudioElement>) => void;
}) {
  const [tab, setTab] = useState<CodeTab>("html");
  if (!open) return null;

  const selectedHtml = selected
    ? elementToHtml(selected)
    : "<!-- 캔버스에서 요소를 선택하세요 -->";
  const htmlEditable = selected?.kind === "html";

  return (
    <section className="code-dock">
      <header>
        <nav aria-label="코드 종류">
          <button
            aria-pressed={tab === "html"}
            className={tab === "html" ? "active" : ""}
            type="button"
            onClick={() => setTab("html")}
          >
            <Braces aria-hidden="true" size={13} />
            HTML
          </button>
          <button
            aria-pressed={tab === "css"}
            className={tab === "css" ? "active" : ""}
            type="button"
            onClick={() => setTab("css")}
          >
            <FileCode2 aria-hidden="true" size={13} />
            CSS
          </button>
          <button
            aria-pressed={tab === "js"}
            className={tab === "js" ? "active" : ""}
            type="button"
            onClick={() => setTab("js")}
          >
            <Code2 aria-hidden="true" size={13} />
            JavaScript
          </button>
        </nav>
        <span>
          {tab === "html" && htmlEditable
            ? "이 HTML 블록은 직접 편집할 수 있어요."
            : tab === "html"
              ? "비주얼 요소의 생성된 HTML입니다."
              : "미리보기에서 바로 실행됩니다."}
        </span>
        <button aria-label="코드 창 닫기" type="button" onClick={onClose}>
          <ChevronDown aria-hidden="true" size={15} />
        </button>
      </header>
      {tab === "html" && (
        <textarea
          aria-label="HTML 코드"
          readOnly={!htmlEditable}
          spellCheck={false}
          value={htmlEditable ? selected?.content : selectedHtml}
          onChange={(event) => onSelectedChange({ content: event.target.value })}
        />
      )}
      {tab === "css" && (
        <textarea
          aria-label="CSS 코드"
          spellCheck={false}
          value={project.customCss}
          onChange={(event) =>
            onProjectChange({ customCss: event.target.value })
          }
        />
      )}
      {tab === "js" && (
        <textarea
          aria-label="JavaScript 코드"
          spellCheck={false}
          value={project.customJs}
          onChange={(event) =>
            onProjectChange({ customJs: event.target.value })
          }
        />
      )}
    </section>
  );
}
