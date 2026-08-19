"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import type { WebAppProject } from "../../../lib/chatbot-studio";

/**
 * 되돌리기·다시 하기입니다.
 *
 * 예전에는 고친 내용이 곧바로 저장되어서 실수를 되돌릴 방법이 없었습니다. 부품을
 * 여러 개 놓고 자유롭게 꾸미게 되면 실수도 그만큼 늘어나므로, 편집을 되돌릴 수
 * 있어야 합니다.
 *
 * 지나간 것·지금 것·앞으로 갈 것을 한 덩어리로 두고 리듀서로 옮깁니다. 셋을 따로
 * 두면 한 번의 편집이 세 번의 상태 변경으로 쪼개져, 빠르게 이어서 고칠 때 한
 * 걸음이 통째로 사라집니다.
 *
 * 글자를 한 자 칠 때마다 한 걸음이 되면 문장을 지우는 데 마흔 번을 눌러야 합니다.
 * 그래서 같은 칸에 이어서 적는 동안에는 한 걸음으로 묶습니다.
 */

const LIMIT = 50;
const COALESCE_MS = 600;

export type CommitMeta = {
  /** 되돌리기 안내에 보여 줄 말입니다. 예: "버튼 추가" */
  label: string;
  /** 같은 열쇠로 잇달아 고치면 한 걸음으로 묶습니다. */
  coalesceKey?: string;
};

type Step = { project: WebAppProject; label: string };

type State = {
  past: Step[];
  present: WebAppProject;
  future: Step[];
};

type Move =
  | {
      type: "commit";
      updater: (project: WebAppProject) => WebAppProject;
      label: string;
      merge: boolean;
    }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "reset"; project: WebAppProject };

function reduce(state: State, move: Move): State {
  switch (move.type) {
    case "commit": {
      const next = move.updater(state.present);
      if (next === state.present) return state;
      return {
        past: move.merge
          ? state.past
          : [...state.past, { project: state.present, label: move.label }].slice(
              -LIMIT,
            ),
        present: next,
        future: [],
      };
    }
    case "undo": {
      if (state.past.length === 0) return state;
      const step = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        present: step.project,
        future: [{ project: state.present, label: step.label }, ...state.future],
      };
    }
    case "redo": {
      if (state.future.length === 0) return state;
      const [step, ...rest] = state.future;
      return {
        past: [...state.past, { project: state.present, label: step.label }].slice(
          -LIMIT,
        ),
        present: step.project,
        future: rest,
      };
    }
    case "reset":
      return { past: [], present: move.project, future: [] };
  }
}

export type ProjectHistory = {
  project: WebAppProject;
  commit: (
    updater: (project: WebAppProject) => WebAppProject,
    meta: CommitMeta,
  ) => void;
  /** 히스토리를 비우고 새로 시작합니다. 웹앱을 불러올 때 씁니다. */
  reset: (project: WebAppProject) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  undoLabel: string;
  redoLabel: string;
};

export function useProjectHistory(initial: WebAppProject): ProjectHistory {
  const [state, dispatch] = useReducer(reduce, {
    past: [],
    present: initial,
    future: [],
  });
  const lastEdit = useRef<{ key: string; at: number } | null>(null);

  const commit = useCallback(
    (updater: (project: WebAppProject) => WebAppProject, meta: CommitMeta) => {
      const now = Date.now();
      const previous = lastEdit.current;
      const merge = Boolean(
        meta.coalesceKey &&
          previous &&
          previous.key === meta.coalesceKey &&
          now - previous.at < COALESCE_MS,
      );
      lastEdit.current = meta.coalesceKey
        ? { key: meta.coalesceKey, at: now }
        : null;
      dispatch({ type: "commit", updater, label: meta.label, merge });
    },
    [],
  );

  const reset = useCallback((project: WebAppProject) => {
    lastEdit.current = null;
    dispatch({ type: "reset", project });
  }, []);

  const undo = useCallback(() => {
    lastEdit.current = null;
    dispatch({ type: "undo" });
  }, []);

  const redo = useCallback(() => {
    lastEdit.current = null;
    dispatch({ type: "redo" });
  }, []);

  // 칸 안에서 글을 지울 때는 브라우저의 되돌리기가 자연스럽습니다. 그때는
  // 프로젝트 전체를 되돌리지 않습니다.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!event.metaKey && !event.ctrlKey) return;
      const key = event.key.toLowerCase();
      if (key !== "z" && key !== "y") return;

      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) {
        return;
      }

      event.preventDefault();
      if (key === "y" || event.shiftKey) redo();
      else undo();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [redo, undo]);

  return {
    project: state.present,
    commit,
    reset,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    undoLabel: state.past[state.past.length - 1]?.label ?? "",
    redoLabel: state.future[0]?.label ?? "",
  };
}
