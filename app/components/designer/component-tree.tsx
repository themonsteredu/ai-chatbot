"use client";

import {
  ChevronDown,
  ChevronUp,
  EyeOff,
  GripVertical,
  IndentDecrease,
  IndentIncrease,
  Smartphone,
} from "lucide-react";
import { useEffect, useRef, type DragEvent } from "react";
import type { ComponentNode, WebAppProject } from "../../../lib/chatbot-studio";
import { REGISTRY } from "../../../lib/components/registry";
import type { MoveStep } from "../../../lib/project/tree";
import { PartIcon } from "../runtime/part-icon";

export const REORDER_MIME = "application/x-webapp-reorder";

/**
 * 고른 부품을 눌러서 옮기는 단추들입니다. 태블릿에는 끌어 놓기가 없어, 배치
 * 부품에 담고 빼는 길이 이것뿐입니다.
 */
const MOVES: Array<{
  step: MoveStep;
  label: string;
  hint: string;
  Icon: typeof ChevronUp;
}> = [
  { step: "up", label: "위로", hint: "한 칸 위로 옮기기", Icon: ChevronUp },
  { step: "down", label: "아래로", hint: "한 칸 아래로 옮기기", Icon: ChevronDown },
  {
    step: "in",
    label: "안으로",
    hint: "바로 옆 배치 부품 안에 넣기",
    Icon: IndentIncrease,
  },
  {
    step: "out",
    label: "밖으로",
    hint: "배치 부품 밖으로 빼기",
    Icon: IndentDecrease,
  },
];

export type TreeSelection = "screen" | "header" | string;

type ComponentTreeProps = {
  project: WebAppProject;
  selected: TreeSelection;
  onSelect: (selection: TreeSelection) => void;
  onDragStartNode: (nodeId: string, event: DragEvent<HTMLElement>) => void;
  onDropBefore: (nodeId: string, event: DragEvent<HTMLElement>) => void;
  onDropInside: (parentId: string, event: DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
  dropTargetId: string;
  onDragOverNode: (target: string, event: DragEvent<HTMLElement>) => void;
  onDragLeaveNode: (target: string) => void;
  /** 고른 부품을 눌러서 한 칸 옮깁니다. */
  onMove: (nodeId: string, step: MoveStep) => void;
  canMove: (nodeId: string, step: MoveStep) => boolean;
};

/**
 * 고른 부품 아래에 붙는 옮기기 줄입니다. 목록 맨 아래 부품을 고르면 줄이 화면
 * 밖으로 밀려나므로, 나오자마자 스스로 보이는 자리까지 굴려 옵니다.
 */
function MoveBar({
  node,
  onMove,
  canMove,
}: {
  node: ComponentNode;
  onMove: (nodeId: string, step: MoveStep) => void;
  canMove: (nodeId: string, step: MoveStep) => boolean;
}) {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bar.current?.scrollIntoView({ block: "nearest" });
  }, [node.id]);

  return (
    <div className="tree-move" ref={bar}>
      {MOVES.map(({ step, label, hint, Icon }) => (
        <button
          key={step}
          type="button"
          disabled={!canMove(node.id, step)}
          title={`${node.name} ${hint}`}
          aria-label={`${node.name} ${hint}`}
          onClick={() => onMove(node.id, step)}
        >
          <Icon size={13} aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  );
}

export function ComponentTree({
  project,
  selected,
  onSelect,
  onDragStartNode,
  onDropBefore,
  onDropInside,
  onDragEnd,
  dropTargetId,
  onDragOverNode,
  onDragLeaveNode,
  onMove,
  canMove,
}: ComponentTreeProps) {
  const screen = project.screens[0];

  const renderNode = (node: ComponentNode, depth: number) => {
    const spec = REGISTRY[node.type];
    const hidden = node.props.visible === false;

    return (
      <div className="tree-branch" key={node.id}>
        <button
          className={`${selected === node.id ? "selected" : ""} ${
            depth > 0 ? "nested-tree-item" : ""
          } ${dropTargetId === `before:${node.id}` ? "tree-drop-target" : ""}`}
          type="button"
          draggable
          style={{ paddingLeft: `${10 + depth * 14}px` }}
          onClick={() => onSelect(node.id)}
          onDragStart={(event) => onDragStartNode(node.id, event)}
          onDragEnd={onDragEnd}
          onDragOver={(event) => {
            event.preventDefault();
            onDragOverNode(`before:${node.id}`, event);
          }}
          onDragLeave={() => onDragLeaveNode(`before:${node.id}`)}
          onDrop={(event) => {
            event.stopPropagation();
            onDropBefore(node.id, event);
          }}
        >
          <span className="tree-icon">
            <PartIcon type={node.type} size={13} />
          </span>
          <span>
            <strong>{node.name}</strong>
            <small>{spec.name}</small>
          </span>
          {hidden && <EyeOff size={12} aria-hidden="true" />}
          <GripVertical className="tree-grip" size={14} aria-hidden="true" />
        </button>
        {selected === node.id && (
          <MoveBar node={node} onMove={onMove} canMove={canMove} />
        )}
        {spec.acceptsChildren && (
          <div
            className={`tree-children ${
              dropTargetId === `inside:${node.id}` ? "tree-drop-target" : ""
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onDragOverNode(`inside:${node.id}`, event);
            }}
            onDragLeave={() => onDragLeaveNode(`inside:${node.id}`)}
            onDrop={(event) => {
              event.stopPropagation();
              onDropInside(node.id, event);
            }}
          >
            {(node.children ?? []).map((child) => renderNode(child, depth + 1))}
            {(node.children ?? []).length === 0 && (
              <span className="tree-empty">비어 있어요</span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="component-tree">
      <button
        className={selected === "screen" ? "selected" : ""}
        type="button"
        onClick={() => onSelect("screen")}
      >
        <span className="tree-icon">
          <Smartphone size={13} aria-hidden="true" />
        </span>
        <span>
          <strong>{screen.name}</strong>
          <small>{project.title}</small>
        </span>
        <ChevronDown size={13} aria-hidden="true" />
      </button>
      <div className="tree-children">
        <button
          className={`nested-tree-item ${selected === "header" ? "selected" : ""}`}
          type="button"
          onClick={() => onSelect("header")}
        >
          <span className="tree-icon">
            <Smartphone size={13} aria-hidden="true" />
          </span>
          <span>
            <strong>AppHeader1</strong>
            <small>앱 머리글</small>
          </span>
        </button>
        {screen.children.map((node) => renderNode(node, 1))}
      </div>
    </div>
  );
}
