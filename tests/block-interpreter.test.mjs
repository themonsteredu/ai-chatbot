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
