"use client";

import { ChevronDown, EyeOff, GripVertical, Smartphone } from "lucide-react";
import type { DragEvent } from "react";
import type { ComponentNode, WebAppProject } from "../../../lib/chatbot-studio";
import { REGISTRY } from "../../../lib/components/registry";
import { PartIcon } from "../runtime/part-icon";

export const REORDER_MIME = "application/x-webapp-reorder";

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
};

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
              <span
                className="tree-line"
                style={{ paddingLeft: `${24 + depth * 14}px` }}
              >
                비어 있어요
              </span>
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
