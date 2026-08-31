"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  emptyState,
  resolveProp,
  runEvent,
  startState,
  type RuntimeState,
} from "../../../lib/blocks/interpreter";
import type {
  ComponentNode,
  EventId,
  ListItem,
  PropValue,
  QaItem,
  WebAppProject,
} from "../../../lib/chatbot-studio";
import { nodeIndex } from "../../../lib/project/tree";
import {
  DRAFT_SCOPE_ID,
  readRuntime,
  writeRuntime,
  type RuntimeScope,
} from "../../../lib/runtime-store";

/**
 * 웹앱을 쓰는 사람 쪽 상태를 한 곳에서 들고 있습니다.
 *
 * - `runtime`  : 블록이 바꾼 속성과 변수. 해석기가 보는 값입니다.
 * - `extra`    : 부품이 저마다 들고 있는 것(체크한 항목, 직접 적은 할 일, 기록 글).
 *                블록이 다루기에는 모양이 제각각이라 따로 둡니다.
 */
type PartState = Record<string, unknown>;

type AppState = {
  runtime: RuntimeState;
  extra: Record<string, PartState>;
};

type SavedShape = {
  props?: unknown;
  vars?: unknown;
  extra?: unknown;
  // v3 시절 모양입니다. 기능이 하나뿐이던 때라 부품 아이디가 없었습니다.
  checkedItems?: unknown;
  customItems?: unknown;
  journalText?: unknown;
};

const asRecord = (value: unknown) =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, never>)
    : {};

/**
 * 예전 저장 내용을 새 모양으로 옮깁니다. 그때는 체크 목록과 기록장이 하나씩만
 * 있었으므로, 화면에서 처음 만나는 그 부품에 붙여 줍니다.
 */
function adoptLegacy(saved: SavedShape, nodes: ComponentNode[]) {
  const extra: Record<string, PartState> = {};
  const firstOf = (type: string) =>
    nodes.find((node) => node.type === type)?.id ?? "";

  const checklistId = firstOf("checklist");
  if (checklistId) {
    const part: PartState = {};
    if (Array.isArray(saved.checkedItems)) {
      part.checked = saved.checkedItems.filter(
        (item): item is string => typeof item === "string",
      );
    }
    if (Array.isArray(saved.customItems)) {
      part.custom = saved.customItems
        .filter(
          (item): item is Record<string, unknown> =>
            Boolean(item) && typeof item === "object",
        )
        .slice(0, 20)
        .map((item, index) => ({
          id: typeof item.id === "string" && item.id ? item.id : `my-${index + 1}`,
          text: typeof item.text === "string" ? item.text : "",
        }))
        .filter((item) => item.text);
    }
    if (Object.keys(part).length > 0) extra[checklistId] = part;
  }

  const journalId = firstOf("journal");
  if (journalId && typeof saved.journalText === "string") {
    extra[journalId] = { text: saved.journalText };
  }

  return extra;
}

export type AppRuntime = {
  interactive: boolean;
  resolve: (node: ComponentNode, key: string) => PropValue;
  text: (node: ComponentNode, key: string) => string;
  bool: (node: ComponentNode, key: string) => boolean;
  num: (node: ComponentNode, key: string) => number;
  items: (node: ComponentNode, key: string) => ListItem[];
  questions: (node: ComponentNode, key: string) => QaItem[];
  setProp: (nodeId: string, key: string, value: PropValue) => void;
  fire: (nodeId: string, event: EventId) => void;
  partState: (nodeId: string) => PartState;
  setPartState: (nodeId: string, patch: PartState) => void;
  message: string;
  clearMessage: () => void;
  storageFull: boolean;
};

export function useAppRuntime(
  project: WebAppProject,
  interactive: boolean,
  dataScope?: RuntimeScope,
): AppRuntime {
  const screen = project.screens[0];
  const blocks = project.blocks;
  const design = useMemo(() => nodeIndex(screen.children), [screen.children]);

  const scopeId = dataScope?.appId ?? DRAFT_SCOPE_ID;
  const scopeLegacyTitle = dataScope?.legacyTitle ?? project.title;

  const [state, setState] = useState<AppState>(() => ({
    runtime: emptyState(screen.id),
    extra: {},
  }));
  const [ready, setReady] = useState(false);
  const [storageFull, setStorageFull] = useState(false);
  /* 저장해 둔 기록을 불러오고, 화면을 열었을 때의 블록을 실행합니다. */
  useEffect(() => {
    if (!interactive) return;
    const timer = window.setTimeout(() => {
      let restored: AppState = {
        runtime: startState(blocks, design, screen.id),
        extra: {},
      };
      try {
        const saved = readRuntime(
          window.localStorage,
          { appId: scopeId, legacyTitle: scopeLegacyTitle },
          "runtime",
        );
        if (saved) {
          const parsed = JSON.parse(saved) as SavedShape;
          const extra =
            parsed.extra === undefined
              ? adoptLegacy(parsed, screen.children)
              : (asRecord(parsed.extra) as Record<string, PartState>);
          // 블록이 바꿔 놓은 속성과 변수는 되살리지 않습니다. 그 값들은 지난번에
          // 프로그램을 돌린 결과일 뿐인데, 되살리면 설계보다 앞서기 때문에
          // (interpreter.ts의 resolveProp) 블록이나 속성을 고쳐도 화면이 예전
          // 값 그대로 남습니다. 학생이 "고쳤는데 왜 안 바뀌지?"에서 막히던
          // 자리입니다. 열 때마다 지금 블록으로 다시 계산합니다.
          //
          // 학생이 적은 것(체크한 항목, 기록장 글, 캠프 기록)은 extra에 있고,
          // 이것만 그대로 이어집니다.
          restored = { runtime: restored.runtime, extra };
        }
      } catch {
        // 저장 내용이 깨졌다고 웹앱까지 못 열리면 안 됩니다.
      }
      setState(restored);
      setReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
    // 웹앱이 바뀌었을 때만 다시 불러옵니다.
    // 웹앱이 바뀌었을 때만 다시 불러옵니다. 블록을 고칠 때마다 기록을 되돌리면
    // 학생이 적던 글이 사라집니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive, scopeId, scopeLegacyTitle, screen.id]);

  /* 바뀔 때마다 이 기기에 저장합니다. */
  useEffect(() => {
    if (!interactive || !ready) return;
    const timer = window.setTimeout(() => {
      const result = writeRuntime(
        window.localStorage,
        { appId: scopeId, legacyTitle: scopeLegacyTitle },
        "runtime",
        // 학생이 적은 것만 남깁니다. 블록이 계산한 속성·변수를 같이 저장하면
        // 다음에 열 때 그 값이 설계를 덮어써서 고친 것이 반영되지 않습니다.
        // 사진이 든 기록에서 저장 공간을 아끼는 효과도 있습니다.
        JSON.stringify({ extra: state.extra }),
      );
      // 저장에 실패한 것을 말없이 넘기면 학생은 저장된 줄 압니다.
      setStorageFull(result === "full");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [interactive, ready, scopeId, scopeLegacyTitle, state]);

  const resolve = useCallback(
    (node: ComponentNode, key: string) => {
      // 편집 화면에서는 블록이 바꾼 값이 아니라 설계한 값을 보여 줍니다.
      if (!interactive) {
        return resolveProp(design, emptyState(screen.id), node.id, key);
      }
      return resolveProp(design, state.runtime, node.id, key);
    },
    [design, interactive, screen.id, state.runtime],
  );

  const setProp = useCallback(
    (nodeId: string, key: string, value: PropValue) => {
      if (!interactive) return;
      setState((current) => ({
        ...current,
        runtime: {
          ...current.runtime,
          props: {
            ...current.runtime.props,
            [nodeId]: { ...(current.runtime.props[nodeId] ?? {}), [key]: value },
          },
        },
      }));
    },
    [interactive],
  );

  const fire = useCallback(
    (nodeId: string, event: EventId) => {
      if (!interactive) return;
      setState((current) => ({
        ...current,
        runtime: runEvent(blocks, design, current.runtime, {
          componentId: nodeId,
          event,
        }),
      }));
    },
    [blocks, design, interactive],
  );

  const setPartState = useCallback(
    (nodeId: string, patch: PartState) => {
      if (!interactive) return;
      setState((current) => ({
        ...current,
        extra: {
          ...current.extra,
          [nodeId]: { ...(current.extra[nodeId] ?? {}), ...patch },
        },
      }));
    },
    [interactive],
  );

  const partState = useCallback(
    (nodeId: string) => state.extra[nodeId] ?? {},
    [state.extra],
  );

  const clearMessage = useCallback(() => {
    setState((current) =>
      current.runtime.message
        ? { ...current, runtime: { ...current.runtime, message: "" } }
        : current,
    );
  }, []);

  return useMemo(
    () => ({
      interactive,
      resolve,
      text: (node, key) => {
        const value = resolve(node, key);
        return typeof value === "string" ? value : String(value ?? "");
      },
      bool: (node, key) => resolve(node, key) === true,
      num: (node, key) => {
        const value = resolve(node, key);
        return typeof value === "number" ? value : Number(value) || 0;
      },
      items: (node, key) => {
        const value = resolve(node, key);
        return Array.isArray(value) ? (value as ListItem[]) : [];
      },
      questions: (node, key) => {
        const value = resolve(node, key);
        return Array.isArray(value) ? (value as QaItem[]) : [];
      },
      setProp,
      fire,
      partState,
      setPartState,
      message: state.runtime.message,
      clearMessage,
      storageFull,
    }),
    [
      clearMessage,
      fire,
      interactive,
      partState,
      resolve,
      setPartState,
      setProp,
      state.runtime.message,
      storageFull,
    ],
  );
}
