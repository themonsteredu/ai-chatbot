"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { ComponentTypeId } from "../../../lib/chatbot-studio";

/**
 * 손가락으로 부품을 끌어다 놓습니다.
 *
 * 브라우저가 원래 가진 끌어 놓기(HTML5 drag and drop)는 터치 화면에서 아예
 * 일어나지 않습니다. 그래서 학교 태블릿에서는 팔레트에서 끌어다 놓을 수가
 * 없었습니다. 손가락은 이 갈고리가 따로 받고, 마우스는 그대로 브라우저 것을
 * 씁니다. 두 길이 겹치면 한 번 놓은 것이 두 번 놓입니다.
 *
 * 손가락을 대자마자 끌면 화면을 넘기려던 것과 구별할 수 없습니다. 잠깐 누르고
 * 있어야 집히도록 해서, 목록을 위아래로 넘기는 손짓은 그대로 살립니다.
 */

/** 집어 든 것입니다. 팔레트에서 새로 꺼냈거나, 이미 놓은 부품입니다. */
export type DragPayload =
  | { kind: "new"; type: ComponentTypeId; label: string }
  | { kind: "move"; nodeId: string; label: string };

/** 놓을 자리입니다. 화면에 심어 둔 표를 읽어 정합니다. */
export type DropTarget =
  | { kind: "before"; nodeId: string }
  | { kind: "inside"; parentId: string }
  | { kind: "end" }
  | null;

/** 집었다고 보기까지 눌러야 하는 시간과, 그 전에 움직여도 되는 거리입니다. */
const HOLD_MS = 220;
const SLIP = 10;

export function targetKey(target: DropTarget) {
  if (!target) return "";
  if (target.kind === "before") return `before:${target.nodeId}`;
  if (target.kind === "inside") return `inside:${target.parentId}`;
  return "end";
}

/** 손가락 아래에 무엇이 있는지 보고 놓을 자리를 정합니다. */
function targetAt(x: number, y: number): DropTarget {
  const found = document
    .elementFromPoint(x, y)
    ?.closest<HTMLElement>("[data-drop-before],[data-drop-inside],[data-drop-end]");
  if (!found) return null;
  // 안쪽 표가 먼저입니다. 배치 부품 안의 부품 위에서는 그 부품 앞에 놓입니다.
  const before = found.dataset.dropBefore;
  if (before) return { kind: "before", nodeId: before };
  const inside = found.dataset.dropInside;
  if (inside) return { kind: "inside", parentId: inside };
  return { kind: "end" };
}

type DragState = {
  payload: DragPayload;
  x: number;
  y: number;
  target: DropTarget;
};

export function usePointerDrag(
  onDrop: (payload: DragPayload, target: DropTarget) => void,
) {
  const [drag, setDrag] = useState<DragState | null>(null);
  // 누르고 있는 동안의 일입니다. 다시 그리지 않아도 되어 ref에 둡니다.
  const pending = useRef<{
    payload: DragPayload;
    x: number;
    y: number;
    timer: number;
  } | null>(null);
  const dragging = useRef(false);

  const stop = useCallback(() => {
    if (pending.current) window.clearTimeout(pending.current.timer);
    pending.current = null;
    dragging.current = false;
    setDrag(null);
  }, []);

  /** 부품에 붙입니다. 손가락으로 누르기 시작할 때입니다. */
  const dragHandlers = useCallback(
    (payload: DragPayload) => ({
      onPointerDown: (event: ReactPointerEvent) => {
        // 마우스는 브라우저가 가진 끌어 놓기를 그대로 씁니다.
        if (event.pointerType === "mouse" || event.button !== 0) return;
        const { clientX: x, clientY: y } = event;
        const timer = window.setTimeout(() => {
          if (!pending.current) return;
          dragging.current = true;
          setDrag({ payload, x, y, target: targetAt(x, y) });
        }, HOLD_MS);
        pending.current = { payload, x, y, timer };
      },
    }),
    [],
  );

  useEffect(() => {
    const move = (event: PointerEvent) => {
      const waiting = pending.current;
      if (!waiting) return;
      if (!dragging.current) {
        // 아직 집기 전입니다. 많이 움직였으면 화면을 넘기려는 것으로 봅니다.
        const slipped =
          Math.abs(event.clientX - waiting.x) > SLIP ||
          Math.abs(event.clientY - waiting.y) > SLIP;
        if (slipped) stop();
        return;
      }
      const { clientX: x, clientY: y } = event;
      setDrag((current) =>
        current ? { ...current, x, y, target: targetAt(x, y) } : current,
      );
    };

    const finish = (event: PointerEvent) => {
      if (dragging.current) {
        const target = targetAt(event.clientX, event.clientY);
        const payload = pending.current?.payload;
        if (payload) onDrop(payload, target);
      }
      stop();
    };

    // 집어 든 동안에는 화면이 따라 움직이면 안 됩니다. 이 막음은 passive가
    // 아니어야 먹혀서 따로 답니다.
    const holdStill = (event: TouchEvent) => {
      if (dragging.current) event.preventDefault();
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", stop);
    window.addEventListener("touchmove", holdStill, { passive: false });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", stop);
      window.removeEventListener("touchmove", holdStill);
    };
  }, [onDrop, stop]);

  return { drag, dragHandlers };
}
