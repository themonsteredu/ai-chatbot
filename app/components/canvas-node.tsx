"use client";

import type { CSSProperties, PointerEvent } from "react";
import { Check, Code2, ImageIcon } from "lucide-react";

import type { StudioElement } from "@/lib/studio/types";

function nodeStyle(item: StudioElement): CSSProperties {
  return {
    left: item.x,
    top: item.y,
    width: item.width,
    height: item.height,
    transform: `rotate(${item.rotation}deg)`,
    background: item.style.fill,
    color: item.style.color,
    fontFamily: `${item.style.fontFamily}, sans-serif`,
    fontSize: item.style.fontSize,
    fontWeight: item.style.fontWeight,
    lineHeight: item.style.lineHeight,
    letterSpacing: item.style.letterSpacing,
    borderRadius: item.style.borderRadius,
    borderWidth: item.style.borderWidth,
    borderColor: item.style.borderColor,
    borderStyle: "solid",
    opacity: item.style.opacity,
    textAlign: item.style.textAlign,
    boxShadow: item.style.shadow ? "0 18px 45px rgba(23,23,23,.14)" : "none",
    display: item.hidden ? "none" : "flex",
  };
}

export function CanvasNode({
  item,
  selected,
  editing,
  onBeginMove,
  onBeginResize,
  onEdit,
  onFinishEdit,
  onSelect,
  onUpdateContent,
}: {
  item: StudioElement;
  selected: boolean;
  editing: boolean;
  onBeginMove: (event: PointerEvent<HTMLElement>) => void;
  onBeginResize: (event: PointerEvent<HTMLButtonElement>) => void;
  onEdit: () => void;
  onFinishEdit: () => void;
  onSelect: () => void;
  onUpdateContent: (content: string) => void;
}) {
  const className = [
    "canvas-node",
    `canvas-${item.kind}`,
    selected ? "selected" : "",
    item.locked ? "locked" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={className}
      data-node-id={item.id}
      style={nodeStyle(item)}
      onDoubleClick={(event) => {
        event.stopPropagation();
        if (!item.locked && !["image", "checklist", "html"].includes(item.kind)) {
          onEdit();
        }
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
        onSelect();
        if (!item.locked && !editing) onBeginMove(event);
      }}
    >
      {editing ? (
        <textarea
          autoFocus
          className="inline-content-editor"
          value={item.content}
          onBlur={(event) => {
            onUpdateContent(event.target.value);
            onFinishEdit();
          }}
          onChange={(event) => onUpdateContent(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") event.currentTarget.blur();
          }}
          onPointerDown={(event) => event.stopPropagation()}
        />
      ) : (
        <NodeContent item={item} />
      )}
      {selected && !item.locked && (
        <>
          <span className="selection-name">{item.name}</span>
          <button
            aria-label="요소 크기 조절"
            className="resize-handle"
            type="button"
            onPointerDown={(event) => {
              event.stopPropagation();
              onBeginResize(event);
            }}
          />
        </>
      )}
    </article>
  );
}

function NodeContent({ item }: { item: StudioElement }) {
  if (item.kind === "input") {
    return (
      <div className="canvas-input-content">
        <strong>{item.content}</strong>
        <span>{item.placeholder || "여기에 입력하세요"}</span>
      </div>
    );
  }

  if (item.kind === "checklist") {
    return (
      <div className="canvas-checklist-content">
        {item.items.map((label) => (
          <span key={`${item.id}:${label}`}>
            <i>
              <Check aria-hidden="true" size={9} />
            </i>
            {label}
          </span>
        ))}
      </div>
    );
  }

  if (item.kind === "image") {
    return item.imageUrl ? (
      <span
        aria-label="사용자 이미지"
        className="canvas-image-preview"
        role="img"
        style={{ backgroundImage: `url("${item.imageUrl}")` }}
      />
    ) : (
      <span className="canvas-placeholder">
        <ImageIcon aria-hidden="true" size={21} />
        IMAGE
      </span>
    );
  }

  if (item.kind === "html") {
    return (
      <span className="canvas-code-placeholder">
        <Code2 aria-hidden="true" size={23} />
        <strong>HTML BLOCK</strong>
        <small>아래 코드 창에서 직접 편집</small>
      </span>
    );
  }

  return <span className="node-text">{item.content}</span>;
}
