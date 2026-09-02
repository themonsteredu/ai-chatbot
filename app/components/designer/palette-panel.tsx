"use client";

import { ChevronDown } from "lucide-react";
import { useState, type DragEvent, type PointerEvent } from "react";
import type { ComponentNode, ComponentTypeId } from "../../../lib/chatbot-studio";
import { CATEGORIES, REGISTRY } from "../../../lib/components/registry";
import { canAdd } from "../../../lib/project/tree";
import { PartIcon } from "../runtime/part-icon";

export const PALETTE_MIME = "application/x-webapp-component";

type PalettePanelProps = {
  nodes: ComponentNode[];
  onAdd: (type: ComponentTypeId) => void;
  /** 손가락으로 부품을 집을 때 붙는 손잡이입니다. */
  onTouchDragStart?: (
    type: ComponentTypeId,
    name: string,
  ) => { onPointerDown: (event: PointerEvent<HTMLElement>) => void };
};

export function PalettePanel({
  nodes,
  onAdd,
  onTouchDragStart,
}: PalettePanelProps) {
  const [closed, setClosed] = useState<Record<string, boolean>>({});

  return (
    <>
      <div className="panel-title palette-title">
        <span>팔레트</span>
        <small>끌어 놓거나, 놓을 자리를 고르고 눌러요</small>
      </div>
      {CATEGORIES.map((category) => {
        const open = !closed[category.id];
        return (
          <div className="palette-category" key={category.id}>
            <button
              className={`palette-section-heading ${open ? "open" : ""}`}
              type="button"
              aria-expanded={open}
              onClick={() =>
                setClosed((current) => ({
                  ...current,
                  [category.id]: open,
                }))
              }
            >
              <span>{category.label}</span>
              <b>{category.types.length}</b>
              <ChevronDown size={14} aria-hidden="true" />
            </button>
            {open && (
              <div className="palette-list">
                {category.types.map((type) => {
                  const spec = REGISTRY[type];
                  const allowed = canAdd(nodes, type);
                  return (
                    <button
                      className="palette-item"
                      draggable={allowed}
                      disabled={!allowed}
                      key={type}
                      type="button"
                      title={
                        allowed
                          ? spec.hint
                          : `${spec.name}은(는) 화면에 하나만 놓을 수 있어요.`
                      }
                      onDragStart={(event: DragEvent<HTMLButtonElement>) => {
                        event.dataTransfer.setData(PALETTE_MIME, type);
                        event.dataTransfer.effectAllowed = "copy";
                      }}
                      {...(allowed
                        ? (onTouchDragStart?.(type, spec.name) ?? {})
                        : {})}
                      onClick={() => onAdd(type)}
                    >
                      <span className={`palette-icon ${spec.tone}`}>
                        <PartIcon type={type} size={18} />
                      </span>
                      <strong>{spec.name}</strong>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
