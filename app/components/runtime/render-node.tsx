"use client";

import { EyeOff } from "lucide-react";
import type { DragEvent, KeyboardEvent, MouseEvent } from "react";
import type { ComponentNode } from "../../../lib/chatbot-studio";
import { REGISTRY } from "../../../lib/components/registry";
import type { RuntimeScope } from "../../../lib/runtime-store";
import { CampReport } from "../camp-report";
import { containerStyle, isVisible } from "./style";
import type { AppRuntime } from "./use-app-runtime";
import {
  ButtonPart,
  DividerPart,
  ImagePart,
  LabelPart,
  ListPart,
} from "./parts/basic";
import {
  CheckboxPart,
  SliderPart,
  SwitchPart,
  TextboxPart,
} from "./parts/inputs";
import { ChecklistPart, JournalPart, NoticeCardPart } from "./parts/features";
import { ChatbotPart } from "./parts/chatbot";

/** 편집 화면에서만 쓰는 손잡이입니다. 실행 중에는 넘기지 않습니다. */
export type DesignHooks = {
  selectedId: string;
  onSelect: (id: string) => void;
  /** 이 부품 바로 앞에 끌어다 놓았을 때입니다. */
  onDropBefore: (nodeId: string, event: DragEvent<HTMLElement>) => void;
  /** 배치 부품 안쪽에 끌어다 놓았을 때입니다. */
  onDropInside: (parentId: string, event: DragEvent<HTMLElement>) => void;
  onDragStartNode: (nodeId: string, event: DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
  dropTargetId: string;
  onDragOverNode: (nodeId: string, event: DragEvent<HTMLElement>) => void;
  onDragLeaveNode: (nodeId: string) => void;
};

export type RenderNodeProps = {
  node: ComponentNode;
  runtime: AppRuntime;
  campScope: RuntimeScope;
  onOpenChat: (node: ComponentNode) => void;
  design?: DesignHooks;
};

function Part({ node, runtime, campScope, onOpenChat, design }: RenderNodeProps) {
  const spec = REGISTRY[node.type];

  if (spec.acceptsChildren) {
    const children = node.children ?? [];
    return (
      <div
        className={`part-container part-${node.type} ${
          children.length === 0 ? "empty" : ""
        } ${design?.dropTargetId === `inside:${node.id}` ? "drop-inside" : ""}`}
        style={containerStyle(node.props)}
        onDragOver={
          design
            ? (event) => {
                event.preventDefault();
                event.stopPropagation();
                design.onDragOverNode(`inside:${node.id}`, event);
              }
            : undefined
        }
        onDragLeave={
          design ? () => design.onDragLeaveNode(`inside:${node.id}`) : undefined
        }
        onDrop={
          design
            ? (event) => {
                event.stopPropagation();
                design.onDropInside(node.id, event);
              }
            : undefined
        }
      >
        {children.map((child) => (
          <RenderNode
            key={child.id}
            node={child}
            runtime={runtime}
            campScope={campScope}
            onOpenChat={onOpenChat}
            design={design}
          />
        ))}
        {children.length === 0 && (
          <span className="part-container-hint">여기에 부품을 놓아요</span>
        )}
      </div>
    );
  }

  const props = { node, runtime };
  switch (node.type) {
    case "label":
      return <LabelPart {...props} />;
    case "image":
      return <ImagePart {...props} />;
    case "button":
      return <ButtonPart {...props} />;
    case "divider":
      return <DividerPart {...props} />;
    case "list":
      return <ListPart {...props} />;
    case "textbox":
      return <TextboxPart {...props} />;
    case "checkbox":
      return <CheckboxPart {...props} />;
    case "switch":
      return <SwitchPart {...props} />;
    case "slider":
      return <SliderPart {...props} />;
    case "notice-card":
      return <NoticeCardPart {...props} />;
    case "checklist":
      return <ChecklistPart {...props} />;
    case "journal":
      return <JournalPart {...props} />;
    case "chatbot":
      return <ChatbotPart {...props} onOpenSheet={onOpenChat} />;
    case "camp-report":
      return <CampReport node={node} runtime={runtime} dataScope={campScope} />;
    default:
      return null;
  }
}

export function RenderNode(props: RenderNodeProps) {
  const { node, design } = props;
  const hidden = !isVisible(node.props);

  // 실행 중에는 감춘 부품을 그리지 않습니다. 편집 중에는 흐리게 두어야 학생이
  // 다시 찾아 켤 수 있습니다.
  if (hidden && !design) return null;

  if (!design) {
    return <div className="part-slot">{Part(props)}</div>;
  }

  const selected = design.selectedId === node.id;
  const select = (event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>) => {
    event.stopPropagation();
    design.onSelect(node.id);
  };

  return (
    <div
      className={`part-slot design ${selected ? "component-selected" : ""} ${
        hidden ? "part-hidden" : ""
      } ${design.dropTargetId === `before:${node.id}` ? "drop-before" : ""}`}
      role="button"
      tabIndex={0}
      aria-label={node.name}
      draggable
      onClick={select}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        select(event);
      }}
      onDragStart={(event) => design.onDragStartNode(node.id, event)}
      onDragEnd={design.onDragEnd}
      onDragOver={(event) => {
        event.preventDefault();
        design.onDragOverNode(`before:${node.id}`, event);
      }}
      onDragLeave={() => design.onDragLeaveNode(`before:${node.id}`)}
      onDrop={(event) => {
        event.stopPropagation();
        design.onDropBefore(node.id, event);
      }}
    >
      {hidden && (
        <span className="part-hidden-badge">
          <EyeOff size={11} aria-hidden="true" />
          감춤
        </span>
      )}
      {Part(props)}
    </div>
  );
}
