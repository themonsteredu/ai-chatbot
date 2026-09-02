"use client";

import { Plus, Rocket, Wifi } from "lucide-react";
import { useEffect, useState, type DragEvent } from "react";
import type { ComponentNode, WebAppProject } from "../../lib/chatbot-studio";
import type { RuntimeScope } from "../../lib/runtime-store";
import { DRAFT_SCOPE_ID } from "../../lib/runtime-store";
import { screenOf } from "../../lib/project/tree";
import { ChatbotSheet } from "./runtime/parts/chatbot";
import { RenderNode, type DesignHooks } from "./runtime/render-node";
import { useAppRuntime } from "./runtime/use-app-runtime";

type PhonePreviewProps = {
  project: WebAppProject;
  interactive?: boolean;
  standalone?: boolean;
  /** 이 웹앱을 쓰는 사람의 기록을 저장할 자리입니다. */
  dataScope?: RuntimeScope;
  /** 편집 화면일 때만 넘깁니다. 부품을 고르고 끌어 놓을 수 있게 합니다. */
  design?: DesignHooks;
  /** 화면 바탕이나 머리글을 골랐을 때입니다. */
  onSelectChrome?: (part: "screen" | "header") => void;
  chromeSelection?: "screen" | "header" | "";
  /** 팔레트에서 끌어온 부품을 화면 맨 끝에 놓습니다. */
  onDropAtEnd?: (event: DragEvent<HTMLElement>) => void;
  /** 편집 중에 보고 있는 화면입니다. 실행 중에는 블록이 정합니다. */
  screenId?: string;
};

export function PhonePreview({
  project,
  interactive = false,
  standalone = false,
  dataScope,
  design,
  onSelectChrome,
  chromeSelection = "",
  onDropAtEnd,
  screenId,
}: PhonePreviewProps) {
  const runtime = useAppRuntime(project, interactive, dataScope);
  const [chatNode, setChatNode] = useState<ComponentNode | null>(null);
  // 실행 중에는 블록이 연 화면을, 편집 중에는 학생이 고른 화면을 그립니다.
  const screen = screenOf(
    project.screens,
    interactive ? runtime.screenId : (screenId ?? ""),
  );

  const campScope: RuntimeScope = dataScope ?? {
    appId: DRAFT_SCOPE_ID,
    legacyTitle: project.title,
  };

  // 블록이 보여 준 안내는 잠시 뒤 스스로 사라집니다.
  const message = runtime.message;
  const clearMessage = runtime.clearMessage;
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(clearMessage, 4000);
    return () => window.clearTimeout(timer);
  }, [clearMessage, message]);

  const chromeProps = (part: "screen" | "header") =>
    interactive || !onSelectChrome
      ? {}
      : {
          role: "button" as const,
          tabIndex: 0,
          onClick: (event: { stopPropagation: () => void }) => {
            event.stopPropagation();
            onSelectChrome(part);
          },
          onKeyDown: (event: { key: string; preventDefault: () => void }) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            onSelectChrome(part);
          },
        };

  // 학생이 실제로 쓰는 화면(실행·설치한 웹앱)은 글자와 누를 자리를 읽을 수 있는
  // 크기로 키웁니다. 편집 화면의 미리보기는 설계를 보는 곳이라 그대로 둡니다.
  return (
    <div
      className={`phone ${
        interactive ? "phone-interactive readable-phone" : ""
      } ${standalone ? "standalone-phone" : ""}`}
      style={
        {
          "--phone-accent": project.accent,
          "--phone-bg": project.screenBackground,
        } as React.CSSProperties
      }
    >
      <div className="phone-hardware">
        <span>9:41</span>
        <span className="phone-island" aria-hidden="true" />
        <span className="phone-status-icons">
          <Wifi size={11} aria-hidden="true" />
          <span className="battery" aria-hidden="true" />
        </span>
      </div>

      <section
        className={`phone-screen webapp-screen ${
          chromeSelection === "screen" ? "component-selected" : ""
        }`}
        onClick={() => onSelectChrome?.("screen")}
      >
        <header
          className={`app-hero ${
            chromeSelection === "header" ? "component-selected" : ""
          }`}
          {...chromeProps("header")}
        >
          <span className="app-hero-icon">
            <Rocket size={21} strokeWidth={2.4} aria-hidden="true" />
          </span>
          <span>
            <small>MY WEB APP</small>
            <strong>{project.appName}</strong>
            <em>{project.subtitle}</em>
          </span>
        </header>

        <div
          className={`webapp-scroll ${
            design?.dropTargetId === "end" ? "drop-end" : ""
          }`}
          data-drop-end={design ? "" : undefined}
          onDragOver={onDropAtEnd ? (event) => event.preventDefault() : undefined}
          onDrop={onDropAtEnd}
        >
          {screen.children.map((node) => (
            <RenderNode
              key={node.id}
              node={node}
              runtime={runtime}
              campScope={campScope}
              onOpenChat={setChatNode}
              design={design}
            />
          ))}

          {screen.children.length === 0 && (
            <div className="empty-phone-state">
              <PlusBadge />
              <strong>첫 부품을 놓아 보세요</strong>
              <span>왼쪽 팔레트에서 부품을 골라요.</span>
            </div>
          )}
        </div>

        {message && (
          <p className="webapp-toast" role="status">
            {message}
          </p>
        )}

        {interactive && chatNode && (
          <ChatbotSheet
            node={chatNode}
            runtime={runtime}
            onClose={() => setChatNode(null)}
          />
        )}
      </section>
    </div>
  );
}

function PlusBadge() {
  return (
    <span className="empty-plus" aria-hidden="true">
      <Plus size={16} />
    </span>
  );
}
