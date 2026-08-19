/**
 * 학생이 블록으로 만든 동작을 실제로 실행합니다.
 *
 * 순수 함수입니다. 받은 상태를 고치지 않고 새 상태를 돌려줍니다. 그래서 화면
 * 없이도 시험할 수 있고, 되돌리기가 예전 상태를 그대로 붙들 수 있습니다.
 *
 * 실행에는 한도가 있습니다. 중학생이 반복 안에 반복을 넣다 보면 브라우저가
 * 멈추는데, 그럴 때는 조용히 죽는 대신 "너무 오래 돌아서 멈췄어요"라고
 * 알려 주는 편이 낫습니다.
 */

import { propSpec } from "../components/registry";
import type {
  Action,
  BlockProgram,
  ComponentNode,
  EventId,
  Expr,
  PropValue,
} from "../project/types";

export const LIMITS = { steps: 2000, repeat: 200, depth: 12 } as const;

export const TOO_LONG_MESSAGE = "블록이 너무 오래 돌아서 멈췄어요.";

export type DesignIndex = Record<string, ComponentNode>;

export type RuntimeState = {
  /** 블록이 바꾼 속성입니다. 설계 원본은 건드리지 않습니다. */
  props: Record<string, Record<string, PropValue>>;
  vars: Record<string, PropValue>;
  /** 가장 최근에 보여 준 안내입니다. */
  message: string;
  screen: string;
};

export function emptyState(screen = "s1"): RuntimeState {
  return { props: {}, vars: {}, message: "", screen };
}

/** 지금 화면에 실제로 보이는 값입니다. 블록이 바꾼 값이 설계보다 앞섭니다. */
export function resolveProp(
  design: DesignIndex,
  state: RuntimeState,
  nodeId: string,
  key: string,
): PropValue {
  const override = state.props[nodeId]?.[key];
  if (override !== undefined) return override;
  const node = design[nodeId];
  if (!node) return "";
  const own = node.props[key];
  if (own !== undefined) return own;
  return propSpec(node.type, key)?.default ?? "";
}

/* ------------------------------------------------------------------ */
/* 값 계산                                                             */
/* ------------------------------------------------------------------ */

const asNumber = (value: PropValue): number => {
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "string") {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

export const asText = (value: PropValue): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "참" : "거짓";
  if (Array.isArray(value)) return String(value.length);
  return "";
};

const asBool = (value: PropValue): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  return false;
};

export function evaluate(
  expr: Expr,
  design: DesignIndex,
  state: RuntimeState,
  depth = 0,
): PropValue {
  if (depth > LIMITS.depth) return "";

  switch (expr.k) {
    case "text":
      return expr.v;
    case "num":
      return expr.v;
    case "bool":
      return expr.v;
    case "var":
      return state.vars[expr.name] ?? "";
    case "prop":
      return resolveProp(design, state, expr.target, expr.prop);
    case "math": {
      const a = asNumber(evaluate(expr.a, design, state, depth + 1));
      const b = asNumber(evaluate(expr.b, design, state, depth + 1));
      switch (expr.op) {
        case "+":
          return a + b;
        case "-":
          return a - b;
        case "×":
          return a * b;
        case "÷":
          // 0으로 나누면 무한대가 나와 화면이 이상해집니다. 0으로 둡니다.
          return b === 0 ? 0 : a / b;
      }
      return 0;
    }
    case "cmp": {
      const left = evaluate(expr.a, design, state, depth + 1);
      const right = evaluate(expr.b, design, state, depth + 1);
      if (expr.op === "=" || expr.op === "≠") {
        // 글자끼리는 글자로, 그 밖에는 숫자로 견줍니다.
        const same =
          typeof left === "string" || typeof right === "string"
            ? asText(left) === asText(right)
            : asNumber(left) === asNumber(right);
        return expr.op === "=" ? same : !same;
      }
      const a = asNumber(left);
      const b = asNumber(right);
      switch (expr.op) {
        case ">":
          return a > b;
        case "<":
          return a < b;
        case "≥":
          return a >= b;
        case "≤":
          return a <= b;
      }
      return false;
    }
    case "logic": {
      const a = asBool(evaluate(expr.a, design, state, depth + 1));
      // 앞쪽만으로 답이 정해지면 뒤는 계산하지 않습니다.
      if (expr.op === "그리고" && !a) return false;
      if (expr.op === "또는" && a) return true;
      return asBool(evaluate(expr.b, design, state, depth + 1));
    }
    case "join":
      return expr.parts
        .map((part) => asText(evaluate(part, design, state, depth + 1)))
        .join("");
  }
}

/* ------------------------------------------------------------------ */
/* 동작 실행                                                           */
/* ------------------------------------------------------------------ */

type Budget = { steps: number; stopped: boolean };

function setProp(
  state: RuntimeState,
  nodeId: string,
  key: string,
  value: PropValue,
): RuntimeState {
  return {
    ...state,
    props: {
      ...state.props,
      [nodeId]: { ...(state.props[nodeId] ?? {}), [key]: value },
    },
  };
}

function runActions(
  actions: Action[],
  design: DesignIndex,
  input: RuntimeState,
  budget: Budget,
  depth: number,
): RuntimeState {
  let state = input;
  if (depth > LIMITS.depth) return state;

  for (const action of actions) {
    if (budget.stopped) return state;
    budget.steps -= 1;
    if (budget.steps <= 0) {
      budget.stopped = true;
      return { ...state, message: TOO_LONG_MESSAGE };
    }

    switch (action.kind) {
      case "set-prop": {
        // 사전에 없는 속성이나 바꿀 수 없는 속성은 조용히 넘깁니다.
        const node = design[action.target];
        const spec = node ? propSpec(node.type, action.prop) : undefined;
        if (!spec?.blockWritable) break;
        state = setProp(
          state,
          action.target,
          action.prop,
          evaluate(action.value, design, state, 0),
        );
        break;
      }
      case "show-message":
        state = {
          ...state,
          message: asText(evaluate(action.value, design, state, 0)),
        };
        break;
      case "set-var":
        state = {
          ...state,
          vars: {
            ...state.vars,
            [action.name]: evaluate(action.value, design, state, 0),
          },
        };
        break;
      case "if": {
        const passed = asBool(evaluate(action.test, design, state, 0));
        const branch = passed ? action.then : (action.otherwise ?? []);
        state = runActions(branch, design, state, budget, depth + 1);
        break;
      }
      case "repeat": {
        const requested = asNumber(evaluate(action.times, design, state, 0));
        const times = Math.max(
          0,
          Math.min(Math.floor(requested), LIMITS.repeat),
        );
        for (let round = 0; round < times; round += 1) {
          if (budget.stopped) break;
          state = runActions(action.body, design, state, budget, depth + 1);
        }
        break;
      }
      case "open-screen":
        state = { ...state, screen: action.screen };
        break;
    }
  }

  return state;
}

/**
 * 어떤 부품에서 이벤트가 일어났을 때 붙어 있는 블록을 모두 실행합니다.
 * 받은 상태는 고치지 않습니다.
 */
export function runEvent(
  program: BlockProgram,
  design: DesignIndex,
  state: RuntimeState,
  trigger: { componentId: string; event: EventId },
): RuntimeState {
  const matching = program.events.filter(
    (event) =>
      event.componentId === trigger.componentId &&
      event.event === trigger.event,
  );
  if (matching.length === 0) return state;

  const budget: Budget = { steps: LIMITS.steps, stopped: false };
  let next = state;
  for (const event of matching) {
    next = runActions(event.body, design, next, budget, 0);
  }
  return next;
}

/** 화면을 처음 열 때 변수의 첫 값을 채웁니다. */
export function startState(
  program: BlockProgram,
  design: DesignIndex,
  screen: string,
): RuntimeState {
  let state = emptyState(screen);
  for (const variable of program.variables) {
    state = {
      ...state,
      vars: {
        ...state.vars,
        [variable.name]: evaluate(variable.initial, design, state, 0),
      },
    };
  }
  return runEvent(program, design, state, {
    componentId: "screen",
    event: "open",
  });
}
