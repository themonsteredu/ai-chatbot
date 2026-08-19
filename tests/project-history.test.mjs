import assert from "node:assert/strict";
import test from "node:test";

/**
 * 되돌리기 자체는 React 훅이라 여기서는 그 안에 든 규칙만 확인합니다.
 * 훅이 쓰는 되돌리기 스택의 셈은 아래와 같아야 합니다.
 */
const LIMIT = 50;

function makeStack() {
  let past = [];
  let present = { n: 0 };
  let future = [];
  return {
    get present() {
      return present;
    },
    get canUndo() {
      return past.length > 0;
    },
    get canRedo() {
      return future.length > 0;
    },
    commit(next, { merge = false } = {}) {
      if (!merge) past = [...past, present].slice(-LIMIT);
      future = [];
      present = next;
    },
    undo() {
      if (past.length === 0) return;
      future = [present, ...future];
      present = past[past.length - 1];
      past = past.slice(0, -1);
    },
    redo() {
      if (future.length === 0) return;
      past = [...past, present].slice(-LIMIT);
      present = future[0];
      future = future.slice(1);
    },
  };
}

test("steps back and forward through edits", () => {
  const stack = makeStack();
  stack.commit({ n: 1 });
  stack.commit({ n: 2 });
  assert.deepEqual(stack.present, { n: 2 });

  stack.undo();
  assert.deepEqual(stack.present, { n: 1 });
  stack.undo();
  assert.deepEqual(stack.present, { n: 0 });
  assert.equal(stack.canUndo, false);

  stack.redo();
  assert.deepEqual(stack.present, { n: 1 });
  stack.redo();
  assert.deepEqual(stack.present, { n: 2 });
  assert.equal(stack.canRedo, false);
});

test("a new edit clears the way forward", () => {
  const stack = makeStack();
  stack.commit({ n: 1 });
  stack.undo();
  stack.commit({ n: 9 });
  assert.equal(stack.canRedo, false);
  assert.deepEqual(stack.present, { n: 9 });
});

test("typing a sentence collapses into one step", () => {
  const stack = makeStack();
  stack.commit({ n: 1 });
  // 같은 칸에 이어 적는 동안에는 걸음을 새로 쌓지 않습니다.
  stack.commit({ n: 2 }, { merge: true });
  stack.commit({ n: 3 }, { merge: true });

  stack.undo();
  assert.deepEqual(stack.present, { n: 0 }, "한 번에 문장 전체가 되돌아가야 합니다.");
});

test("keeps the stack from growing without bound", () => {
  const stack = makeStack();
  for (let index = 1; index <= LIMIT + 20; index += 1) {
    stack.commit({ n: index });
  }
  let steps = 0;
  while (stack.canUndo) {
    stack.undo();
    steps += 1;
  }
  assert.equal(steps, LIMIT);
});
