"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Monitor, Smartphone, X } from "lucide-react";

import { buildPreviewDocument } from "@/lib/studio/project";
import type { StudioProject } from "@/lib/studio/types";

export type PreviewAction = {
  source: "web-studio-preview";
  action: "save-record";
  elementId: string;
  value: string;
  answers: Record<string, string>;
  checkedItems: string[];
};

export function PreviewModal({
  open,
  project,
  onAction,
  onClose,
}: {
  open: boolean;
  project: StudioProject;
  onAction: (action: PreviewAction) => void;
  onClose: () => void;
}) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const document = useMemo(() => buildPreviewDocument(project), [project]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const handleMessage = (event: MessageEvent<unknown>) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data as Partial<PreviewAction> | null;
      if (
        !data ||
        data.source !== "web-studio-preview" ||
        data.action !== "save-record" ||
        typeof data.elementId !== "string" ||
        typeof data.value !== "string" ||
        !data.answers ||
        !Array.isArray(data.checkedItems)
      ) {
        return;
      }
      onAction(data as PreviewAction);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("message", handleMessage);
    };
  }, [onAction, onClose, open]);

  if (!open) return null;

  return (
    <div
      className="preview-backdrop"
      role="presentation"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-label="웹 미리보기"
        aria-modal="true"
        className="preview-dialog"
        role="dialog"
      >
        <header>
          <div>
            <span>LIVE PREVIEW</span>
            <strong>{project.name}</strong>
          </div>
          <nav aria-label="미리보기 크기">
            <button
              aria-label="데스크톱 미리보기"
              aria-pressed={device === "desktop"}
              className={device === "desktop" ? "active" : ""}
              type="button"
              onClick={() => setDevice("desktop")}
            >
              <Monitor aria-hidden="true" size={15} />
            </button>
            <button
              aria-label="모바일 미리보기"
              aria-pressed={device === "mobile"}
              className={device === "mobile" ? "active" : ""}
              type="button"
              onClick={() => setDevice("mobile")}
            >
              <Smartphone aria-hidden="true" size={15} />
            </button>
          </nav>
          <button aria-label="미리보기 닫기" type="button" onClick={onClose}>
            <X aria-hidden="true" size={17} />
          </button>
        </header>
        <div className={`preview-stage ${device}`}>
          <iframe
            ref={iframeRef}
            sandbox="allow-forms allow-popups allow-scripts"
            srcDoc={document}
            title={`${project.name} 미리보기`}
          />
        </div>
      </section>
    </div>
  );
}
