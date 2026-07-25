"use client";

import { useEffect, useState, type DragEvent, type PointerEvent } from "react";
import { Minus, Plus } from "lucide-react";

import { createStudioElement } from "@/lib/studio/project";
import type {
  ElementKind,
  StudioElement,
  StudioProject,
} from "@/lib/studio/types";
import { CanvasNode } from "./canvas-node";

type PointerInteraction = {
  id: string;
  mode: "move" | "resize";
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
};

export function StudioCanvas({
  project,
  selectedId,
  zoom,
  onAddElement,
  onRemoveElement,
  onSelect,
  onSetZoom,
  onUpdateElement,
}: {
  project: StudioProject;
  selectedId: string | null;
  zoom: number;
  onAddElement: (element: StudioElement) => void;
  onRemoveElement: (id: string) => void;
  onSelect: (id: string | null) => void;
  onSetZoom: (zoom: number) => void;
  onUpdateElement: (id: string, changes: Partial<StudioElement>) => void;
}) {
  const [interaction, setInteraction] = useState<PointerInteraction | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!interaction) return;

    const handlePointerMove = (event: globalThis.PointerEvent) => {
      const dx = (event.clientX - interaction.startClientX) / zoom;
      const dy = (event.clientY - interaction.startClientY) / zoom;

      if (interaction.mode === "move") {
        onUpdateElement(interaction.id, {
          x: Math.round(
            Math.max(
              0,
              Math.min(
                project.canvas.width - interaction.startWidth,
                interaction.startX + dx,
              ),
            ),
          ),
          y: Math.round(
            Math.max(
              0,
              Math.min(
                project.canvas.height - interaction.startHeight,
                interaction.startY + dy,
              ),
            ),
          ),
        });
      } else {
        onUpdateElement(interaction.id, {
          width: Math.round(
            Math.max(
              48,
              Math.min(
                project.canvas.width - interaction.startX,
                interaction.startWidth + dx,
              ),
            ),
          ),
          height: Math.round(
            Math.max(
              32,
              Math.min(
                project.canvas.height - interaction.startY,
                interaction.startHeight + dy,
              ),
            ),
          ),
        });
      }
    };

    const handlePointerUp = () => setInteraction(null);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [interaction, onUpdateElement, project.canvas.height, project.canvas.width, zoom]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.matches("input, textarea, select, [contenteditable='true']") ||
        !selectedId
      ) {
        return;
      }

      const selected = project.elements.find((item) => item.id === selectedId);
      if (!selected || selected.locked) return;

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        onRemoveElement(selected.id);
        return;
      }

      const step = event.shiftKey ? 10 : 1;
      const movements: Record<string, { x: number; y: number }> = {
        ArrowLeft: { x: -step, y: 0 },
        ArrowRight: { x: step, y: 0 },
        ArrowUp: { x: 0, y: -step },
        ArrowDown: { x: 0, y: step },
      };
      const movement = movements[event.key];
      if (!movement) return;

      event.preventDefault();
      onUpdateElement(selected.id, {
        x: Math.max(
          0,
          Math.min(
            project.canvas.width - selected.width,
            selected.x + movement.x,
          ),
        ),
        y: Math.max(
          0,
          Math.min(
            project.canvas.height - selected.height,
            selected.y + movement.y,
          ),
        ),
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    onRemoveElement,
    onUpdateElement,
    project.canvas.height,
    project.canvas.width,
    project.elements,
    selectedId,
  ]);

  const beginInteraction = (
    event: PointerEvent<HTMLElement>,
    item: StudioElement,
    mode: PointerInteraction["mode"],
  ) => {
    setInteraction({
      id: item.id,
      mode,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: item.x,
      startY: item.y,
      startWidth: item.width,
      startHeight: item.height,
    });
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const kind = event.dataTransfer.getData(
      "application/x-web-studio-element",
    ) as ElementKind;
    if (!kind) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.round((event.clientX - bounds.left) / zoom - 80));
    const y = Math.max(0, Math.round((event.clientY - bounds.top) / zoom - 30));
    onAddElement(createStudioElement(kind, x, y));
  };

  return (
    <section className="canvas-workspace">
      <div className="canvas-toolbar">
        <div>
          <span>CANVAS</span>
          <strong>
            {project.canvas.width} × {project.canvas.height}
          </strong>
        </div>
        <p>드래그 이동 · 모서리 리사이즈 · 더블클릭 텍스트 편집</p>
        <div className="zoom-control">
          <button
            aria-label="축소"
            type="button"
            onClick={() => onSetZoom(Math.max(0.4, zoom - 0.1))}
          >
            <Minus aria-hidden="true" size={14} />
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button
            aria-label="확대"
            type="button"
            onClick={() => onSetZoom(Math.min(1.2, zoom + 0.1))}
          >
            <Plus aria-hidden="true" size={14} />
          </button>
        </div>
      </div>

      <div
        className="canvas-viewport"
        onPointerDown={() => {
          onSelect(null);
          setEditingId(null);
        }}
      >
        <div
          className="artboard-wrap"
          style={{
            width: project.canvas.width * zoom,
            height: project.canvas.height * zoom,
          }}
        >
          <div
            className="design-artboard"
            style={{
              background: project.canvas.background,
              height: project.canvas.height,
              transform: `scale(${zoom})`,
              width: project.canvas.width,
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "copy";
            }}
            onDrop={handleDrop}
          >
            {project.elements.map((item) => (
              <CanvasNode
                editing={editingId === item.id}
                item={item}
                key={item.id}
                selected={selectedId === item.id}
                onBeginMove={(event) => beginInteraction(event, item, "move")}
                onBeginResize={(event) =>
                  beginInteraction(event, item, "resize")
                }
                onEdit={() => setEditingId(item.id)}
                onFinishEdit={() => setEditingId(null)}
                onSelect={() => onSelect(item.id)}
                onUpdateContent={(content) =>
                  onUpdateElement(item.id, { content })
                }
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
