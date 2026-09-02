/**
 * 블록을 한국어 문장으로 풀어 씁니다. 화면에서 읽어 주는 말과 시험이 같은
 * 문장을 쓰도록 한 곳에 모아 둡니다.
 */

import { REGISTRY, propSpec } from "../components/registry";
import type {
  Action,
  ComponentNode,
  EventId,
  Expr,
} from "../project/types";
import { SCREEN_TARGET } from "../project/types";

export type NameLookup = Record<string, ComponentNode>;

export function nameOf(design: NameLookup, id: string) {
  if (id === SCREEN_TARGET) return "화면";
  return design[id]?.name ?? "없어진 부품";
}

export function propLabel(design: NameLookup, id: string, key: string) {
  const node = design[id];
  if (!node) return key;
  return propSpec(node.type, key)?.label ?? key;
}

export function eventLabel(design: NameLookup, id: string, event: EventId) {
  if (id === SCREEN_TARGET) return event === "tick" ? "가 있는 동안 되풀이" : "열렸을 때";
  const node = design[id];
  if (!node) return "일어났을 때";
  return (
    REGISTRY[node.type].events.find((spec) => spec.id === event)?.label ??
    "일어났을 때"
  );
}

export function describeExpr(expr: Expr, design: NameLookup): string {
  switch (expr.k) {
    case "text":
      return `“${expr.v}”`;
    case "num":
      return String(expr.v);
    case "bool":
      return expr.v ? "참" : "거짓";
    case "var":
      return `변수 ${expr.name}`;
    case "prop":
      return `${nameOf(design, expr.target)}의 ${propLabel(design, expr.target, expr.prop)}`;
    case "math":
      return `(${describeExpr(expr.a, design)} ${expr.op} ${describeExpr(expr.b, design)})`;
    case "cmp":
      return `(${describeExpr(expr.a, design)} ${expr.op} ${describeExpr(expr.b, design)})`;
    case "logic":
      return `(${describeExpr(expr.a, design)} ${expr.op} ${describeExpr(expr.b, design)})`;
    case "join":
      return expr.parts.map((part) => describeExpr(part, design)).join(" + ");
    case "random":
      return `${describeExpr(expr.min, design)}부터 ${describeExpr(expr.max, design)}까지 아무 수`;
    case "now":
      return `지금 ${expr.part}`;
    case "len":
      return `${describeExpr(expr.of, design)}의 글자 수`;
    case "list-item":
      return `${nameOf(design, expr.target)}의 ${describeExpr(expr.index, design)}번째 줄`;
  }
}

export function describeAction(action: Action, design: NameLookup): string {
  switch (action.kind) {
    case "set-prop":
      return `${nameOf(design, action.target)}의 ${propLabel(
        design,
        action.target,
        action.prop,
      )}을(를) ${describeExpr(action.value, design)}(으)로 바꾸기`;
    case "show-message":
      return `${describeExpr(action.value, design)} 보여 주기`;
    case "set-var":
      return `변수 ${action.name}을(를) ${describeExpr(action.value, design)}(으)로 정하기`;
    case "if":
      return `만약 ${describeExpr(action.test, design)} 이라면`;
    case "repeat":
      return `${describeExpr(action.times, design)}번 반복하기`;
    case "open-screen":
      return `${action.screen} 화면으로 넘기기`;
    case "play-sound":
      return `‘${action.sound}’ 소리 내기`;
    case "list-add":
      return `${nameOf(design, action.target)}에 ${describeExpr(action.value, design)} 한 줄 더하기`;
    case "list-clear":
      return `${nameOf(design, action.target)} 비우기`;
  }
}

/** 동작을 고를 때 보여 주는 목록입니다. 일부러 짧게 유지합니다. */
export const ACTION_CHOICES: Array<{
  kind: Action["kind"];
  label: string;
  hint: string;
  /** 쉬운 모드에서는 감춥니다. */
  advanced?: boolean;
}> = [
  {
    kind: "set-prop",
    label: "부품 바꾸기",
    hint: "다른 부품의 글이나 색을 바꿔요",
  },
  { kind: "show-message", label: "말풍선 보여 주기", hint: "화면에 안내를 띄워요" },
  { kind: "play-sound", label: "소리 내기", hint: "딩동·짝짝 같은 소리를 내요" },
  {
    kind: "list-add",
    label: "목록에 더하기",
    hint: "목록 맨 아래에 한 줄 쌓아요",
  },
  {
    kind: "list-clear",
    label: "목록 비우기",
    hint: "쌓아 둔 줄을 모두 지워요",
    advanced: true,
  },
  {
    kind: "set-var",
    label: "변수 정하기",
    hint: "숫자나 글을 기억해 둬요",
    advanced: true,
  },
  {
    kind: "open-screen",
    label: "화면 넘기기",
    hint: "다른 화면으로 넘어가요",
  },
  { kind: "if", label: "만약 ~라면", hint: "조건에 따라 갈라져요", advanced: true },
  { kind: "repeat", label: "반복하기", hint: "여러 번 되풀이해요", advanced: true },
];
