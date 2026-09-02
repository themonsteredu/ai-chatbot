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
  NowPart,
  PropValue,
} from "../project/types";

export const LIMITS = { steps: 2000, repeat: 200, depth: 12 } as const;

export const TOO_LONG_MESSAGE = "블록이 너무 오래 돌아서 멈췄어요.";

export type DesignIndex = Record<string, ComponentNode>;

/**
 * 바깥 세상에서 오는 값입니다. 해석기는 순수 함수라야 시험할 수 있어서, 아무
 * 수와 지금 시각을 직접 부르지 않고 이 자리로 받습니다. 시험은 정해진 값을
 * 넣어 늘 같은 답이 나오게 합니다.
 */
export type BlockEnv = {
  /** 0 이상 1 미만입니다. Math.random과 같습니다. */
  random: () => number;
  now: () => Date;
};

export const DEFAULT_ENV: BlockEnv = {
  random: Math.random,
  now: () => new Date(),
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const pad = (value: number) => String(value).padStart(2, "0");

/** ‘지금’ 블록이 꺼내 주는 값입니다. 기기의 시각을 씁니다. */
function nowValue(part: NowPart, date: Date): PropValue {
  switch (part) {
    case "날짜":
      return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
    case "시각":
      return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
    case "요일":
      return WEEKDAYS[date.getDay()];
    case "년":
      return date.getFullYear();
    case "월":
      return date.getMonth() + 1;
    case "일":
      return date.getDate();
    case "시":
      return date.getHours();
    case "분":
      return date.getMinutes();
    case "초":
      return date.getSeconds();
  }
}

export type RuntimeState = {
  /** 블록이 바꾼 속성입니다. 설계 원본은 건드리지 않습니다. */
  props: Record<string, Record<string, PropValue>>;
  vars: Record<string, PropValue>;
  /** 가장 최근에 보여 준 안내입니다. */
  message: string;
  screen: string;
  /**
   * 낼 소리와 그 횟수입니다. 소리는 화면 쪽이 냅니다. 해석기는 순수 함수라
   * 소리를 직접 낼 수 없어서, 같은 소리를 두 번 내도 알아채도록 횟수를 셉니다.
   */
  sound: string;
  soundAt: number;
};

export function emptyState(screen = "s1"): RuntimeState {
  return {
    props: {},
    vars: {},
    message: "",
    screen,
    sound: "",
    soundAt: 0,
  };
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
  env: BlockEnv = DEFAULT_ENV,
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
      const a = asNumber(evaluate(expr.a, design, state, depth + 1, env));
      const b = asNumber(evaluate(expr.b, design, state, depth + 1, env));
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
      const left = evaluate(expr.a, design, state, depth + 1, env);
      const right = evaluate(expr.b, design, state, depth + 1, env);
      if (expr.op === "=" || expr.op === "≠") {
        // 글자끼리는 글자로, 그 밖에는 숫자로 견줍니다.
        const same =
          typeof left === "string" || typeof right === "string"
            ? asText(left) === asText(right)
            : asNumber(left) === asNumber(right);
        return expr.op === "=" ? same : !same;
      }
      // 글자끼리 보는 것들입니다. 퀴즈 채점에 씁니다.
      if (expr.op === "포함" || expr.op === "시작" || expr.op === "끝") {
        const haystack = asText(left);
        const needle = asText(right);
        if (!needle) return false;
        if (expr.op === "포함") return haystack.includes(needle);
        return expr.op === "시작"
          ? haystack.startsWith(needle)
          : haystack.endsWith(needle);
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
      const a = asBool(evaluate(expr.a, design, state, depth + 1, env));
      // 앞쪽만으로 답이 정해지면 뒤는 계산하지 않습니다.
      if (expr.op === "그리고" && !a) return false;
      if (expr.op === "또는" && a) return true;
      return asBool(evaluate(expr.b, design, state, depth + 1, env));
    }
    case "join":
      return expr.parts
        .map((part) => asText(evaluate(part, design, state, depth + 1, env)))
        .join("");
    case "random": {
      // 두 수 사이를 고릅니다. 큰 수를 앞에 적어도 되게 둘을 견줍니다.
      const a = Math.round(asNumber(evaluate(expr.min, design, state, depth + 1, env)));
      const b = Math.round(asNumber(evaluate(expr.max, design, state, depth + 1, env)));
      const low = Math.min(a, b);
      const high = Math.max(a, b);
      return low + Math.floor(env.random() * (high - low + 1));
    }
    case "now":
      return nowValue(expr.part, env.now());
    case "list-item": {
      const list = resolveProp(design, state, expr.target, expr.prop);
      if (!Array.isArray(list)) return "";
      // 아이들은 첫 줄을 1번이라고 셉니다.
      const at = Math.round(asNumber(evaluate(expr.index, design, state, depth + 1, env))) - 1;
      const item = list[at] as { text?: unknown } | undefined;
      return typeof item?.text === "string" ? item.text : "";
    }
    case "slice": {
      const text = asText(evaluate(expr.of, design, state, depth + 1, env));
      const letters = [...text];
      // 아이들은 첫 글자를 1번이라고 셉니다.
      const from = Math.max(
        0,
        Math.round(asNumber(evaluate(expr.from, design, state, depth + 1, env))) - 1,
      );
      const count = Math.max(
        0,
        Math.round(asNumber(evaluate(expr.count, design, state, depth + 1, env))),
      );
      return letters.slice(from, from + count).join("");
    }
    case "tidy": {
      const text = asText(evaluate(expr.of, design, state, depth + 1, env));
      if (expr.how === "빈칸 떼기") return text.trim();
      return expr.how === "모두 소문자"
        ? text.toLowerCase()
        : text.toUpperCase();
    }
    case "len": {
      const value = evaluate(expr.of, design, state, depth + 1, env);
      if (Array.isArray(value)) return value.length;
      return [...asText(value)].length;
    }
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
  env: BlockEnv,
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
          evaluate(action.value, design, state, 0, env),
        );
        break;
      }
      case "show-message":
        state = {
          ...state,
          message: asText(evaluate(action.value, design, state, 0, env)),
        };
        break;
      case "set-var":
        state = {
          ...state,
          vars: {
            ...state.vars,
            [action.name]: evaluate(action.value, design, state, 0, env),
          },
        };
        break;
      case "if": {
        const passed = asBool(evaluate(action.test, design, state, 0, env));
        const branch = passed ? action.then : (action.otherwise ?? []);
        state = runActions(branch, design, state, budget, depth + 1, env);
        break;
      }
      case "repeat": {
        const requested = asNumber(evaluate(action.times, design, state, 0, env));
        const times = Math.max(
          0,
          Math.min(Math.floor(requested), LIMITS.repeat),
        );
        for (let round = 0; round < times; round += 1) {
          if (budget.stopped) break;
          state = runActions(action.body, design, state, budget, depth + 1, env);
        }
        break;
      }
      case "open-screen":
        state = { ...state, screen: action.screen };
        break;
      case "list-add":
      case "list-clear": {
        const node = design[action.target];
        const spec = node ? propSpec(node.type, action.prop) : undefined;
        // 목록 속성에만 씁니다. 다른 속성에 넣으면 화면이 깨집니다.
        if (spec?.kind !== "itemlist") break;
        if (action.kind === "list-clear") {
          state = setProp(state, action.target, action.prop, []);
          break;
        }
        const current = resolveProp(design, state, action.target, action.prop);
        const rows = Array.isArray(current) ? [...current] : [];
        const text = asText(evaluate(action.value, design, state, 0, env)).slice(0, 40);
        if (!text || rows.length >= (spec.maxItems ?? 20)) break;
        // 지웠다 다시 넣어도 겹치지 않는 번호를 짓습니다.
        const taken = new Set(
          rows.map((row) => (row as { id?: string }).id ?? ""),
        );
        let serial = rows.length + 1;
        while (taken.has(`add-${serial}`)) serial += 1;
        rows.push({ id: `add-${serial}`, text });
        state = setProp(state, action.target, action.prop, rows as PropValue);
        break;
      }
      case "play-sound":
        // 소리는 화면 쪽이 냅니다. 여기서는 무엇을 몇 번째로 낼지만 적어 둡니다.
        state = { ...state, sound: action.sound, soundAt: state.soundAt + 1 };
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
  env: BlockEnv = DEFAULT_ENV,
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
    next = runActions(event.body, design, next, budget, 0, env);
  }
  return next;
}

/** 화면을 처음 열 때 변수의 첫 값을 채웁니다. */
export function startState(
  program: BlockProgram,
  design: DesignIndex,
  screen: string,
  /** 지난번에 기억해 둔 변수입니다. 첫 값 대신 이것으로 시작합니다. */
  remembered: Record<string, PropValue> = {},
  env: BlockEnv = DEFAULT_ENV,
): RuntimeState {
  let state = emptyState(screen);
  for (const variable of program.variables) {
    const kept = variable.remember ? remembered[variable.name] : undefined;
    state = {
      ...state,
      vars: {
        ...state.vars,
        [variable.name]:
          kept !== undefined
            ? kept
            : evaluate(variable.initial, design, state, 0, env),
      },
    };
  }
  return runEvent(
    program,
    design,
    state,
    { componentId: "screen", event: "open" },
    env,
  );
}

/** 기억하기를 켠 변수만 골라 냅니다. 기기에 저장할 때 씁니다. */
export function rememberedVars(
  program: BlockProgram,
  state: RuntimeState,
): Record<string, PropValue> {
  const out: Record<string, PropValue> = {};
  for (const variable of program.variables) {
    if (!variable.remember) continue;
    const value = state.vars[variable.name];
    if (value !== undefined) out[variable.name] = value;
  }
  return out;
}

/** 몇 초마다 되풀이하는 블록이 있는지, 있으면 가장 짧은 사이가 몇 초인지입니다. */
export function tickSeconds(program: BlockProgram) {
  const seconds = program.events
    .filter((event) => event.event === "tick" && event.componentId === "screen")
    .map((event) => Math.max(1, Math.min(Math.round(event.every ?? 1), 600)));
  return seconds.length > 0 ? Math.min(...seconds) : 0;
}
