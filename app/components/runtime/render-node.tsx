"use client";

import { EyeOff } from "lucide-react";
import type {
  DragEvent,
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
} from "react";
import type { ComponentNode } from "../../../lib/chatbot-studio";
import { REGISTRY } from "../../../lib/components/registry";
import type { RuntimeScope } from "../../../lib/runtime-store";
import { CampReport } from "../camp-report";
import { WIDTH_STEPS, containerStyle, isVisible } from "./style";
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
  /** 손가락으로 부품을 집을 때 붙는 손잡이입니다. 마우스는 위의 끌어 놓기를 씁니다. */
  onTouchDragStart?: (node: ComponentNode) => {
    onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  };
  /** 가장자리를 끌어 너비를 바꿉니다. */
  onResize?: (nodeId: string, width: string) => void;
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
        // 손가락으로 끌어 놓을 때 여기가 어디인지 알아보는 표입니다.
        data-drop-inside={design ? node.id : undefined}
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
          <span className="part-container-hint">
            여기를 고르고 부품을 눌러요
          </span>
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

/**
 * 고른 부품의 오른쪽 가장자리에 붙는 손잡이입니다. 끌면 너비가 정해진 네 단계로
 * 걸리며 바뀝니다.
 *
 * 픽셀로 자유롭게 늘이지 않는 까닭: 웹앱은 화면 폭에 맞춰 늘어나야 합니다. 만든
 * 아이패드에서 예뻐도 친구 휴대폰에서 깨지면, 초등 교실에서 가장 잡기 어려운
 * 문제가 됩니다.
 */
function ResizeHandle({
  node,
  onResize,
}: {
  node: ComponentNode;
  onResize: (nodeId: string, width: string) => void;
}) {
  const grab = (event: PointerEvent<HTMLElement>) => {
    event.stopPropagation();
    event.preventDefault();
    const slot = event.currentTarget.parentElement;
    if (!slot) return;
    const box = slot.getBoundingClientRect();
    const handle = event.currentTarget;
    handle.setPointerCapture(event.pointerId);

    const pick = (x: number) => {
      // 왼쪽 끝에서 얼마나 왔는지를 보고 가장 가까운 단계를 고릅니다.
      const ratio = Math.max(0, Math.min((x - box.left) / box.width, 1));
      const step =
        ratio > 0.82
          ? "full"
          : ratio > 0.58
            ? "two-thirds"
            : ratio > 0.34
              ? "half"
              : "auto";
      if (step !== (node.props.width ?? "full")) onResize(node.id, step);
    };

    const move = (moving: globalThis.PointerEvent) => pick(moving.clientX);
    const done = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", done);
      handle.removeEventListener("pointercancel", done);
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", done);
    handle.addEventListener("pointercancel", done);
  };

  // 넓은 것이 1, 좁은 것이 4입니다. 읽어 주는 프로그램이 지금 몇 단계인지 말해 줍니다.
  const step = WIDTH_STEPS.indexOf(
    String(node.props.width ?? "full") as (typeof WIDTH_STEPS)[number],
  );

  return (
    <span
      className="part-resize"
      role="slider"
      tabIndex={0}
      aria-label={`${node.name} 너비 조절`}
      aria-valuemin={1}
      aria-valuemax={WIDTH_STEPS.length}
      aria-valuenow={(step < 0 ? 0 : step) + 1}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={grab}
      onKeyDown={(event) => {
        // 손잡이를 못 잡는 학생도 방향키로 넓히고 좁힐 수 있어야 합니다.
        const move =
          event.key === "ArrowRight" ? -1 : event.key === "ArrowLeft" ? 1 : 0;
        if (move === 0) return;
        event.preventDefault();
        event.stopPropagation();
        const next = Math.max(
          0,
          Math.min((step < 0 ? 0 : step) + move, WIDTH_STEPS.length - 1),
        );
        onResize(node.id, WIDTH_STEPS[next]);
      }}
    />
  );
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
      data-drop-before={node.id}
      {...(design.onTouchDragStart?.(node) ?? {})}
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
      {selected && design.onResize && (
        <ResizeHandle node={node} onResize={design.onResize} />
      )}
    </div>
  );
}
