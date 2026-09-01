/**
 * 밖에서 들어온 프로젝트를 믿을 수 있는 v4 모양으로 정리합니다.
 *
 * 주소에 실린 값, 6자리 코드로 받아 온 값, 반 저장소에서 읽은 값, 학생 기기에
 * 저장해 둔 값이 모두 여기를 지납니다. 서버 라우트도 이 함수를 쓰기 때문에
 * 브라우저 기능에 기대면 안 됩니다.
 */

import {
  REGISTRY,
  clonePropValue,
  isComponentType,
  propSpec,
  specFor,
} from "../components/registry";
import { migrateV3, normalizeLegacy } from "./migrate-v3";
import { BLANK_PROJECT, DEFAULT_PROJECT } from "./defaults";
import { MAX_NEST_DEPTH, walk } from "./tree";
import type {
  Action,
  ActionIcon,
  BlockProgram,
  ComponentNode,
  ComponentTypeId,
  EventBlock,
  Expr,
  ListItem,
  PropValue,
  QaItem,
  Screen,
  TemplateId,
  WebAppProject,
} from "./types";
import { PROJECT_SCHEMA_VERSION, SCREEN_TARGET } from "./types";

const MAX_COMPONENTS = 120;
const MAX_EVENTS = 60;
const MAX_ACTIONS = 40;
const MAX_EXPR_DEPTH = 8;

const VALID_ICONS: ActionIcon[] = [
  "book",
  "backpack",
  "home",
  "sparkles",
  "heart",
  "message",
];

const isHexColor = (value: unknown): value is string =>
  typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);

const textOr = (value: unknown, fallback: string) =>
  typeof value === "string" && value.trim() ? value : fallback;

/** 속성 하나를 사전이 정한 모양에 맞춥니다. */
function normalizeProp(
  type: ComponentTypeId,
  key: string,
  value: unknown,
): PropValue | null {
  const spec = propSpec(type, key);
  if (!spec) return null;

  switch (spec.kind) {
    case "boolean":
      return typeof value === "boolean" ? value : null;
    case "number":
    case "range": {
      if (typeof value !== "number" || !Number.isFinite(value)) return null;
      return value;
    }
    case "color":
      // 빈 값은 "정하지 않음"이라 그대로 둡니다.
      return value === "" || isHexColor(value) ? (value as string) : null;
    case "select":
    case "align": {
      const allowed = spec.options?.map((option) => option.value);
      if (!allowed) return typeof value === "string" ? value : null;
      return typeof value === "string" && allowed.includes(value) ? value : null;
    }
    case "image":
      // 사진은 이 기기에서 만든 data URL만 받습니다.
      return typeof value === "string" &&
        (value === "" || /^data:image\/[a-z+]+;base64,/i.test(value))
        ? value
        : null;
    case "itemlist": {
      if (!Array.isArray(value)) return null;
      const items: ListItem[] = value
        .filter(
          (item): item is Record<string, unknown> =>
            Boolean(item) && typeof item === "object",
        )
        .slice(0, spec.maxItems ?? 20)
        .map((item, index) => ({
          id: textOr(item.id, `item-${index + 1}`),
          text: typeof item.text === "string" ? item.text : "",
        }));
      return items;
    }
    case "qalist": {
      if (!Array.isArray(value)) return null;
      const items: QaItem[] = value
        .filter(
          (item): item is Record<string, unknown> =>
            Boolean(item) && typeof item === "object",
        )
        .slice(0, spec.maxItems ?? 12)
        .map((item, index) => ({
          id: textOr(item.id, `question-${index + 1}`),
          label: textOr(item.label, `질문 ${index + 1}`),
          response: textOr(
            item.response,
            "이 버튼을 눌렀을 때 챗봇이 말할 답을 적어 주세요.",
          ),
          icon: VALID_ICONS.includes(item.icon as ActionIcon)
            ? (item.icon as ActionIcon)
            : ("message" as ActionIcon),
        }));
      return items;
    }
    case "text":
    case "textarea":
      // 길이 제한은 화면에서만 걸려 있었습니다. 여기서도 잘라 둡니다.
      return typeof value === "string" ? value.slice(0, spec.max ?? 400) : null;
  }
}

function normalizeNode(
  raw: unknown,
  used: Set<string>,
  budget: { left: number },
  depth: number,
): ComponentNode | null {
  if (!raw || typeof raw !== "object" || budget.left <= 0) return null;
  const candidate = raw as Record<string, unknown>;
  if (!isComponentType(candidate.type)) return null;

  budget.left -= 1;
  const type = candidate.type;
  const spec = specFor(type);

  let id = typeof candidate.id === "string" ? candidate.id.slice(0, 24) : "";
  if (!id || used.has(id)) {
    let index = used.size + 1;
    while (used.has(`c${index}`)) index += 1;
    id = `c${index}`;
  }
  used.add(id);

  const props: Record<string, PropValue> = {};
  const rawProps =
    candidate.props && typeof candidate.props === "object"
      ? (candidate.props as Record<string, unknown>)
      : {};
  for (const [key, value] of Object.entries(rawProps)) {
    const clean = normalizeProp(type, key, value);
    // 기본값과 같은 값은 담지 않습니다. 주소에 실을 길이를 아끼기 위해서입니다.
    if (clean === null) continue;
    const fallback = propSpec(type, key)?.default;
    if (!Array.isArray(clean) && clean === fallback) continue;
    props[key] = clean;
  }

  const node: ComponentNode = {
    id,
    type,
    name: textOr(candidate.name, `${spec.namePrefix}1`).slice(0, 24),
    props,
  };

  if (spec.acceptsChildren) {
    const rawChildren = Array.isArray(candidate.children)
      ? candidate.children
      : [];
    node.children =
      depth >= MAX_NEST_DEPTH
        ? []
        : rawChildren
            .map((child) => normalizeNode(child, used, budget, depth + 1))
            .filter((child): child is ComponentNode => child !== null);
  }

  return node;
}

function normalizeScreens(raw: unknown): Screen[] {
  const list = Array.isArray(raw) ? raw : [];
  const used = new Set<string>();
  const budget = { left: MAX_COMPONENTS };
  const screens: Screen[] = list
    .filter(
      (screen): screen is Record<string, unknown> =>
        Boolean(screen) && typeof screen === "object",
    )
    .slice(0, 10)
    .map((screen, index) => ({
      id: textOr(screen.id, `s${index + 1}`).slice(0, 24),
      name: textOr(screen.name, `Screen${index + 1}`).slice(0, 24),
      children: (Array.isArray(screen.children) ? screen.children : [])
        .map((child) => normalizeNode(child, used, budget, 1))
        .filter((child): child is ComponentNode => child !== null),
    }));

  return screens.length > 0
    ? screens
    : [{ id: "s1", name: "Screen1", children: [] }];
}

/* ------------------------------------------------------------------ */
/* 블록                                                                */
/* ------------------------------------------------------------------ */

const MATH_OPS = new Set(["+", "-", "×", "÷"]);
const CMP_OPS = new Set(["=", "≠", ">", "<", "≥", "≤"]);
const LOGIC_OPS = new Set(["그리고", "또는"]);

function normalizeExpr(raw: unknown, depth = 0): Expr | null {
  if (!raw || typeof raw !== "object" || depth > MAX_EXPR_DEPTH) return null;
  const candidate = raw as Record<string, unknown>;

  switch (candidate.k) {
    case "text":
      return typeof candidate.v === "string"
        ? { k: "text", v: candidate.v.slice(0, 400) }
        : null;
    case "num":
      return typeof candidate.v === "number" && Number.isFinite(candidate.v)
        ? { k: "num", v: candidate.v }
        : null;
    case "bool":
      return typeof candidate.v === "boolean"
        ? { k: "bool", v: candidate.v }
        : null;
    case "var":
      return typeof candidate.name === "string" && candidate.name
        ? { k: "var", name: candidate.name.slice(0, 24) }
        : null;
    case "prop":
      return typeof candidate.target === "string" &&
        typeof candidate.prop === "string"
        ? {
            k: "prop",
            target: candidate.target.slice(0, 24),
            prop: candidate.prop.slice(0, 32),
          }
        : null;
    case "math":
    case "cmp":
    case "logic": {
      const a = normalizeExpr(candidate.a, depth + 1);
      const b = normalizeExpr(candidate.b, depth + 1);
      if (!a || !b || typeof candidate.op !== "string") return null;
      if (candidate.k === "math" && MATH_OPS.has(candidate.op)) {
        return { k: "math", op: candidate.op as never, a, b };
      }
      if (candidate.k === "cmp" && CMP_OPS.has(candidate.op)) {
        return { k: "cmp", op: candidate.op as never, a, b };
      }
      if (candidate.k === "logic" && LOGIC_OPS.has(candidate.op)) {
        return { k: "logic", op: candidate.op as never, a, b };
      }
      return null;
    }
    case "join": {
      if (!Array.isArray(candidate.parts)) return null;
      const parts = candidate.parts
        .slice(0, 6)
        .map((part) => normalizeExpr(part, depth + 1))
        .filter((part): part is Expr => part !== null);
      return parts.length > 0 ? { k: "join", parts } : null;
    }
    default:
      return null;
  }
}

function normalizeActions(raw: unknown, depth = 0): Action[] {
  if (!Array.isArray(raw) || depth > 4) return [];
  const out: Action[] = [];
  for (const item of raw.slice(0, MAX_ACTIONS)) {
    if (!item || typeof item !== "object") continue;
    const candidate = item as Record<string, unknown>;
    const id = textOr(candidate.id, `a${out.length + 1}`).slice(0, 24);

    switch (candidate.kind) {
      case "set-prop": {
        const value = normalizeExpr(candidate.value);
        if (
          !value ||
          typeof candidate.target !== "string" ||
          typeof candidate.prop !== "string"
        ) {
          continue;
        }
        out.push({
          id,
          kind: "set-prop",
          target: candidate.target.slice(0, 24),
          prop: candidate.prop.slice(0, 32),
          value,
        });
        break;
      }
      case "show-message": {
        const value = normalizeExpr(candidate.value);
        if (!value) continue;
        out.push({ id, kind: "show-message", value });
        break;
      }
      case "set-var": {
        const value = normalizeExpr(candidate.value);
        if (!value || typeof candidate.name !== "string" || !candidate.name) {
          continue;
        }
        out.push({
          id,
          kind: "set-var",
          name: candidate.name.slice(0, 24),
          value,
        });
        break;
      }
      case "if": {
        const test = normalizeExpr(candidate.test);
        if (!test) continue;
        const otherwise = normalizeActions(candidate.otherwise, depth + 1);
        out.push({
          id,
          kind: "if",
          test,
          then: normalizeActions(candidate.then, depth + 1),
          ...(otherwise.length > 0 ? { otherwise } : {}),
        });
        break;
      }
      case "repeat": {
        const times = normalizeExpr(candidate.times);
        if (!times) continue;
        out.push({
          id,
          kind: "repeat",
          times,
          body: normalizeActions(candidate.body, depth + 1),
        });
        break;
      }
      case "open-screen": {
        if (typeof candidate.screen !== "string") continue;
        out.push({
          id,
          kind: "open-screen",
          screen: candidate.screen.slice(0, 24),
        });
        break;
      }
      default:
        break;
    }
  }
  return out;
}

/**
 * 블록은 부품 아이디로 부품을 가리킵니다. 부품을 지우면 가리킬 곳이 사라지므로
 * 그런 블록은 걷어 냅니다. 이름 바꾸기는 아이디를 건드리지 않아 안전합니다.
 */
function normalizeBlocks(raw: unknown, screens: Screen[]): BlockProgram {
  const known = new Set<string>([SCREEN_TARGET]);
  for (const screen of screens) {
    for (const { node } of walk(screen.children)) known.add(node.id);
  }

  const candidate =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const events: EventBlock[] = (
    Array.isArray(candidate.events) ? candidate.events : []
  )
    .slice(0, MAX_EVENTS)
    .filter(
      (event): event is Record<string, unknown> =>
        Boolean(event) && typeof event === "object",
    )
    .map((event, index) => ({
      id: textOr(event.id, `e${index + 1}`).slice(0, 24),
      componentId: textOr(event.componentId, SCREEN_TARGET).slice(0, 24),
      event: String(event.event ?? "click") as EventBlock["event"],
      body: normalizeActions(event.body),
    }))
    .filter((event) => known.has(event.componentId))
    .filter((event) => {
      if (event.componentId === SCREEN_TARGET) return event.event === "open";
      const node = findByIdInScreens(screens, event.componentId);
      if (!node) return false;
      return REGISTRY[node.type].events.some((spec) => spec.id === event.event);
    });

  const variables = (
    Array.isArray(candidate.variables) ? candidate.variables : []
  )
    .slice(0, 20)
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === "object",
    )
    .map((item) => ({
      name: textOr(item.name, "값").slice(0, 24),
      initial: normalizeExpr(item.initial) ?? { k: "num" as const, v: 0 },
    }));

  return { events, variables };
}

function findByIdInScreens(screens: Screen[], id: string) {
  for (const screen of screens) {
    for (const { node } of walk(screen.children)) {
      if (node.id === id) return node;
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */

export function cloneProject(project: WebAppProject): WebAppProject {
  const copyNode = (node: ComponentNode): ComponentNode => ({
    ...node,
    props: Object.fromEntries(
      Object.entries(node.props).map(([key, value]) => [
        key,
        clonePropValue(value),
      ]),
    ),
    ...(node.children ? { children: node.children.map(copyNode) } : {}),
  });

  return {
    ...project,
    screens: project.screens.map((screen) => ({
      ...screen,
      children: screen.children.map(copyNode),
    })),
    blocks: JSON.parse(JSON.stringify(project.blocks)) as BlockProgram,
  };
}

function looksLikeV4(candidate: Record<string, unknown>) {
  return candidate.version === PROJECT_SCHEMA_VERSION ||
    Array.isArray(candidate.screens);
}

export function normalizeProject(value: unknown): WebAppProject {
  if (!value || typeof value !== "object") return cloneProject(DEFAULT_PROJECT);
  const candidate = value as Record<string, unknown>;

  // 예전 프로젝트는 v3 정리를 거쳐 트리로 옮긴 뒤, v4와 똑같은 손질을 한 번 더
  // 받습니다. 그래야 어느 길로 들어왔든 결과가 하나로 모입니다.
  return normalizeV4(
    looksLikeV4(candidate)
      ? candidate
      : (migrateV3(normalizeLegacy(candidate)) as unknown as Record<
          string,
          unknown
        >),
  );
}

function normalizeV4(candidate: Record<string, unknown>): WebAppProject {
  const template: TemplateId =
    candidate.template === "camp" ||
    candidate.template === "blank" ||
    candidate.template === "notice"
      ? candidate.template
      : "blank";

  const screens = normalizeScreens(candidate.screens);

  return {
    version: PROJECT_SCHEMA_VERSION,
    template,
    title: textOr(candidate.title, BLANK_PROJECT.title).slice(0, 32),
    appName: textOr(
      candidate.appName,
      textOr(candidate.title, BLANK_PROJECT.appName),
    ).slice(0, 26),
    subtitle: textOr(candidate.subtitle, BLANK_PROJECT.subtitle).slice(0, 42),
    accent: isHexColor(candidate.accent)
      ? candidate.accent
      : BLANK_PROJECT.accent,
    screenBackground: isHexColor(candidate.screenBackground)
      ? candidate.screenBackground
      : BLANK_PROJECT.screenBackground,
    screens,
    blocks: normalizeBlocks(candidate.blocks, screens),
  };
}
