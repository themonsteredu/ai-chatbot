import assert from "node:assert/strict";
import test from "node:test";
import {
  LIMITS,
  TOO_LONG_MESSAGE,
  emptyState,
  evaluate,
  resolveProp,
  runEvent,
  startState,
  tickSeconds,
  rememberedVars,
} from "../lib/blocks/interpreter.ts";
import { nodeIndex } from "../lib/project/tree.ts";

const design = nodeIndex([
  { id: "b1", type: "button", name: "버튼1", props: { label: "누르기" } },
  { id: "l1", type: "label", name: "글자1", props: { text: "처음 글" } },
  { id: "s1", type: "slider", name: "슬라이더1", props: { value: 3 } },
  { id: "k1", type: "checkbox", name: "체크박스1", props: {} },
]);

const text = (v) => ({ k: "text", v });
const num = (v) => ({ k: "num", v });
const program = (body, componentId = "b1", event = "click") => ({
  events: [{ id: "e1", componentId, event, body }],
  variables: [],
});

test("reads a value from the design, then from what blocks changed", () => {
  const state = emptyState();
  assert.equal(resolveProp(design, state, "l1", "text"), "처음 글");
  // 설계에 없는 속성은 사전의 기본값을 씁니다.
  assert.equal(resolveProp(design, state, "l1", "bold"), false);
  assert.equal(resolveProp(design, state, "k1", "checked"), false);
  // 없는 부품을 물어도 터지지 않습니다.
  assert.equal(resolveProp(design, state, "없음", "text"), "");
});

test("a button click can change another part — the thing v3 could never do", () => {
  const after = runEvent(
    program([
      {
        id: "a1",
        kind: "set-prop",
        target: "l1",
        prop: "text",
        value: text("버튼이 바꾼 글"),
      },
    ]),
    design,
    emptyState(),
    { componentId: "b1", event: "click" },
  );
  assert.equal(resolveProp(design, after, "l1", "text"), "버튼이 바꾼 글");
});

test("leaves the state it was handed untouched", () => {
  const before = emptyState();
  const snapshot = JSON.parse(JSON.stringify(before));
  runEvent(
    program([
      { id: "a1", kind: "set-prop", target: "l1", prop: "text", value: text("바뀜") },
      { id: "a2", kind: "set-var", name: "점수", value: num(5) },
    ]),
    design,
    before,
    { componentId: "b1", event: "click" },
  );
  assert.deepEqual(before, snapshot);
});

test("runs both sides of a condition", () => {
  const blocks = program([
    {
      id: "a1",
      kind: "if",
      test: { k: "cmp", op: ">", a: { k: "prop", target: "s1", prop: "value" }, b: num(5) },
      then: [{ id: "t1", kind: "show-message", value: text("큰 값") }],
      otherwise: [{ id: "f1", kind: "show-message", value: text("작은 값") }],
    },
  ]);

  const low = runEvent(blocks, design, emptyState(), {
    componentId: "b1",
    event: "click",
  });
  assert.equal(low.message, "작은 값");

  const raised = { ...emptyState(), props: { s1: { value: 9 } } };
  const high = runEvent(blocks, design, raised, {
    componentId: "b1",
    event: "click",
  });
  assert.equal(high.message, "큰 값");
});

test("counts with a variable inside a repeat", () => {
  const after = runEvent(
    program([
      { id: "a1", kind: "set-var", name: "셈", value: num(0) },
      {
        id: "a2",
        kind: "repeat",
        times: num(4),
        body: [
          {
            id: "b1",
            kind: "set-var",
            name: "셈",
            value: { k: "math", op: "+", a: { k: "var", name: "셈" }, b: num(3) },
          },
        ],
      },
      {
        id: "a3",
        kind: "show-message",
        value: { k: "join", parts: [text("모두 "), { k: "var", name: "셈" }, text("점")] },
      },
    ]),
    design,
    emptyState(),
    { componentId: "b1", event: "click" },
  );
  assert.equal(after.vars["셈"], 12);
  assert.equal(after.message, "모두 12점");
});

test("stops instead of freezing the browser, and says so in Korean", () => {
  const after = runEvent(
    program([
      {
        id: "a1",
        kind: "repeat",
        times: num(LIMITS.repeat),
        body: [
          {
            id: "b1",
            kind: "repeat",
            times: num(LIMITS.repeat),
            body: [{ id: "c1", kind: "set-var", name: "값", value: num(1) }],
          },
        ],
      },
    ]),
    design,
    emptyState(),
    { componentId: "b1", event: "click" },
  );
  assert.equal(after.message, TOO_LONG_MESSAGE);
});

test("ignores a block pointing at a part that is gone, or a prop it may not change", () => {
  const state = emptyState();
  const missing = runEvent(
    program([
      { id: "a1", kind: "set-prop", target: "사라짐", prop: "text", value: text("무시") },
    ]),
    design,
    state,
    { componentId: "b1", event: "click" },
  );
  assert.deepEqual(missing.props, {});

  // padding은 블록에서 바꿀 수 있는 속성이 아닙니다.
  const notWritable = runEvent(
    program([
      { id: "a1", kind: "set-prop", target: "l1", prop: "padding", value: text("lg") },
    ]),
    design,
    state,
    { componentId: "b1", event: "click" },
  );
  assert.deepEqual(notWritable.props, {});
});

test("does nothing when no block is attached to that event", () => {
  const state = emptyState();
  const after = runEvent(program([]), design, state, {
    componentId: "l1",
    event: "click",
  });
  assert.equal(after, state, "블록이 없으면 상태를 새로 만들 필요도 없습니다.");
});

test("joins and compares the way a student would expect", () => {
  const state = { ...emptyState(), vars: { 이름: "민수" } };
  assert.equal(
    evaluate({ k: "join", parts: [{ k: "var", name: "이름" }, text("님 안녕")] }, design, state),
    "민수님 안녕",
  );
  assert.equal(evaluate({ k: "cmp", op: "=", a: text("3"), b: num(3) }, design, state), true);
  assert.equal(evaluate({ k: "cmp", op: "=", a: text("가"), b: text("나") }, design, state), false);
  // 0으로 나눠도 무한대가 나오지 않습니다.
  assert.equal(evaluate({ k: "math", op: "÷", a: num(5), b: num(0) }, design, state), 0);
  // 앞쪽만으로 답이 정해지면 뒤는 보지 않습니다.
  assert.equal(
    evaluate({ k: "logic", op: "그리고", a: { k: "bool", v: false }, b: { k: "var", name: "없음" } }, design, state),
    false,
  );
});

test("sets up variables and runs the screen-open block on start", () => {
  const state = startState(
    {
      events: [
        {
          id: "e1",
          componentId: "screen",
          event: "open",
          body: [
            {
              id: "a1",
              kind: "set-prop",
              target: "l1",
              prop: "text",
              value: { k: "join", parts: [text("점수는 "), { k: "var", name: "점수" }] },
            },
          ],
        },
      ],
      variables: [{ name: "점수", initial: num(10) }],
    },
    design,
    "s1",
  );
  assert.equal(state.vars["점수"], 10);
  assert.equal(resolveProp(design, state, "l1", "text"), "점수는 10");
});

/** 아무 수와 지금 시각은 바깥에서 받습니다. 시험은 정해진 값을 넣습니다. */
const fixedEnv = (random, iso) => ({
  random: () => random,
  now: () => new Date(iso),
});

test("rolls a number between the two ends, either way round", () => {
  const design = {};
  const state = emptyState();
  const roll = (min, max, random) =>
    evaluate({ k: "random", min: { k: "num", v: min }, max: { k: "num", v: max } },
      design, state, 0, fixedEnv(random, "2026-09-01T09:00:00"));

  assert.equal(roll(1, 6, 0), 1);
  assert.equal(roll(1, 6, 0.999), 6);
  assert.equal(roll(1, 6, 0.5), 4);
  // 큰 수를 앞에 적어도 됩니다. 아이들이 순서를 자주 바꿔 적습니다.
  assert.equal(roll(6, 1, 0), 1);
});

test("reads today's date and time from the device", () => {
  const design = {};
  const state = emptyState();
  const env = fixedEnv(0, "2026-09-01T14:05:09");
  const now = (part) => evaluate({ k: "now", part }, design, state, 0, env);

  assert.equal(now("날짜"), "2026년 9월 1일");
  assert.equal(now("시각"), "14:05");
  assert.equal(now("요일"), "화");
  assert.equal(now("월"), 9);
  assert.equal(now("분"), 5);
});

test("counts the letters in a value", () => {
  const design = {};
  const state = { ...emptyState(), vars: { 이름: "김하늘" } };
  assert.equal(evaluate({ k: "len", of: { k: "var", name: "이름" } }, design, state), 3);
  assert.equal(evaluate({ k: "len", of: { k: "num", v: 1234 } }, design, state), 4);
});

test("records the sound to play, counting repeats", () => {
  const program = {
    events: [
      {
        id: "e1",
        componentId: "c1",
        event: "click",
        body: [{ id: "a1", kind: "play-sound", sound: "짝짝" }],
      },
    ],
    variables: [],
  };
  const design = {};
  let state = emptyState();

  state = runEvent(program, design, state, { componentId: "c1", event: "click" });
  assert.equal(state.sound, "짝짝");
  assert.equal(state.soundAt, 1);

  // 같은 소리를 다시 내도 화면이 알아채야 합니다.
  state = runEvent(program, design, state, { componentId: "c1", event: "click" });
  assert.equal(state.soundAt, 2);
});

test("repeats a screen block on the shortest interval the student set", () => {
  const tickProgram = (...seconds) => ({
    events: seconds.map((every, index) => ({
      id: `e${index + 1}`,
      componentId: "screen",
      event: "tick",
      every,
      body: [],
    })),
    variables: [],
  });

  assert.equal(tickSeconds(tickProgram()), 0);
  assert.equal(tickSeconds(tickProgram(5)), 5);
  assert.equal(tickSeconds(tickProgram(10, 2, 60)), 2);
  // 0초마다 되풀이하면 기기가 멈춥니다. 1초가 가장 짧습니다.
  assert.equal(tickSeconds(tickProgram(0)), 1);
});

test("keeps only the variables a student asked to remember", () => {
  const program = {
    events: [],
    variables: [
      { name: "점수", initial: { k: "num", v: 0 }, remember: true },
      { name: "이번판", initial: { k: "num", v: 0 } },
    ],
  };
  const design = {};
  const state = { ...emptyState(), vars: { 점수: 12, 이번판: 3 } };

  assert.deepEqual(rememberedVars(program, state), { 점수: 12 });

  // 다시 열면 기억한 값으로 시작하고, 나머지는 첫 값입니다.
  const started = startState(program, design, "s1", { 점수: 12, 이번판: 99 });
  assert.equal(started.vars.점수, 12);
  assert.equal(started.vars.이번판, 0);
});

/** 목록을 가진 부품 하나짜리 설계입니다. */
const listDesign = () => ({
  c1: {
    id: "c1",
    type: "list",
    name: "목록1",
    props: { items: [{ id: "item-1", text: "첫 줄" }] },
  },
});

const listProgram = (body) => ({
  events: [{ id: "e1", componentId: "c1", event: "click", body }],
  variables: [],
});

test("stacks a new row onto a list, and reads it back", () => {
  const design = listDesign();
  let state = emptyState();
  const program = listProgram([
    { id: "a1", kind: "list-add", target: "c1", prop: "items", value: { k: "text", v: "둘째 줄" } },
  ]);

  state = runEvent(program, design, state, { componentId: "c1", event: "click" });
  const rows = resolveProp(design, state, "c1", "items");
  assert.deepEqual(rows.map((row) => row.text), ["첫 줄", "둘째 줄"]);

  // 몇 번째 줄인지, 몇 줄인지 읽을 수 있어야 합니다. 첫 줄이 1번입니다.
  const nth = (index) =>
    evaluate({ k: "list-item", target: "c1", prop: "items", index: { k: "num", v: index } }, design, state);
  assert.equal(nth(1), "첫 줄");
  assert.equal(nth(2), "둘째 줄");
  assert.equal(nth(9), "");
  assert.equal(
    evaluate({ k: "len", of: { k: "prop", target: "c1", prop: "items" } }, design, state),
    2,
  );
});

test("empties a list, and refuses to fill one past its limit", () => {
  const design = listDesign();
  let state = emptyState();

  state = runEvent(
    listProgram([{ id: "a1", kind: "list-clear", target: "c1", prop: "items" }]),
    design, state, { componentId: "c1", event: "click" },
  );
  assert.deepEqual(resolveProp(design, state, "c1", "items"), []);

  // 목록 부품은 20줄까지입니다. 반복 블록으로 끝없이 쌓이면 안 됩니다.
  const add = listProgram([
    { id: "a1", kind: "repeat", times: { k: "num", v: 30 },
      body: [{ id: "a2", kind: "list-add", target: "c1", prop: "items", value: { k: "text", v: "줄" } }] },
  ]);
  state = runEvent(add, design, state, { componentId: "c1", event: "click" });
  assert.equal(resolveProp(design, state, "c1", "items").length, 20);
});

test("never lets a list block touch a prop that is not a list", () => {
  // 글자 속성에 줄을 더하면 목록이 아니게 되어 화면이 깨집니다.
  const design = {
    c1: { id: "c1", type: "label", name: "글자1", props: { text: "그대로" } },
  };
  let state = emptyState();
  state = runEvent(
    listProgram([
      { id: "a1", kind: "list-add", target: "c1", prop: "text", value: { k: "text", v: "줄" } },
    ]),
    design, state, { componentId: "c1", event: "click" },
  );
  assert.equal(resolveProp(design, state, "c1", "text"), "그대로");
});

test("turns the page to another screen", () => {
  const program = {
    events: [
      {
        id: "e1",
        componentId: "c1",
        event: "click",
        body: [{ id: "a1", kind: "open-screen", screen: "s2" }],
      },
    ],
    variables: [],
  };
  let state = emptyState("s1");
  assert.equal(state.screen, "s1");

  state = runEvent(program, {}, state, { componentId: "c1", event: "click" });
  assert.equal(state.screen, "s2");
});

test("marks an answer right however the child typed it", () => {
  const design = {};
  const state = { ...emptyState(), vars: { 답: "  Seoul  " } };
  const tidy = { k: "tidy", of: { k: "tidy", of: { k: "var", name: "답" }, how: "빈칸 떼기" }, how: "모두 소문자" };

  // 앞뒤 빈칸과 대·소문자를 맞추면 채점이 됩니다.
  assert.equal(evaluate(tidy, design, state), "seoul");
  assert.equal(
    evaluate({ k: "cmp", op: "=", a: tidy, b: { k: "text", v: "seoul" } }, design, state),
    true,
  );
});

test("compares text the way a quiz needs to", () => {
  const design = {};
  const state = { ...emptyState(), vars: { 글: "우리 반 알림장" } };
  const cmp = (op, b) =>
    evaluate({ k: "cmp", op, a: { k: "var", name: "글" }, b: { k: "text", v: b } }, design, state);

  assert.equal(cmp("포함", "알림"), true);
  assert.equal(cmp("포함", "숙제"), false);
  assert.equal(cmp("시작", "우리"), true);
  assert.equal(cmp("끝", "알림장"), true);
  assert.equal(cmp("끝", "우리"), false);
  // 빈 글자는 아무 데나 들어맞아 채점이 늘 참이 됩니다. 거짓으로 둡니다.
  assert.equal(cmp("포함", ""), false);
});

test("cuts letters out of a word, counting from one", () => {
  const design = {};
  const state = { ...emptyState(), vars: { 이름: "김하늘" } };
  const slice = (from, count) =>
    evaluate(
      { k: "slice", of: { k: "var", name: "이름" }, from: { k: "num", v: from }, count: { k: "num", v: count } },
      design, state,
    );

  assert.equal(slice(1, 1), "김");
  assert.equal(slice(2, 2), "하늘");
  assert.equal(slice(3, 9), "늘");
  // 이상한 수를 넣어도 웹앱이 깨지면 안 됩니다.
  assert.equal(slice(0, 2), "김하");
  assert.equal(slice(-5, 1), "김");
  assert.equal(slice(2, -3), "");
});
