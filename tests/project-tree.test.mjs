import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_NEST_DEPTH,
  canAdd,
  canHold,
  canStep,
  createNode,
  depthOf,
  holdCandidates,
  holdNode,
  duplicateNode,
  findNode,
  insertNode,
  isInside,
  locate,
  moveNode,
  nextName,
  placeNear,
  removeNode,
  stepNode,
  updateNode,
  walk,
} from "../lib/project/tree.ts";

/** 부품 몇 개를 차례로 놓아 트리를 만듭니다. */
function build(types) {
  let nodes = [];
  for (const type of types) {
    const node = createNode(nodes, type);
    nodes = insertNode(nodes, node, { parentId: null, index: nodes.length });
  }
  return nodes;
}

test("lets a student put down as many of one part as they like", () => {
  const nodes = build(["button", "button", "button"]);
  assert.deepEqual(
    nodes.map((node) => node.name),
    ["버튼1", "버튼2", "버튼3"],
  );
  assert.equal(new Set(nodes.map((node) => node.id)).size, 3);
});

test("skips names the student already used", () => {
  let nodes = build(["button"]);
  nodes = updateNode(nodes, nodes[0].id, (node) => ({ ...node, name: "버튼2" }));
  assert.equal(nextName(nodes, "button"), "버튼1");

  nodes = insertNode(nodes, createNode(nodes, "button"), {
    parentId: null,
    index: 1,
  });
  assert.equal(nextName(nodes, "button"), "버튼3");
});

test("holds the one-per-screen parts to one", () => {
  let nodes = build(["camp-report"]);
  assert.equal(canAdd(nodes, "camp-report"), false);
  assert.equal(canAdd(nodes, "chatbot"), true);
  assert.equal(canAdd(nodes, "button"), true);

  nodes = removeNode(nodes, nodes[0].id);
  assert.equal(canAdd(nodes, "camp-report"), true);
});

test("nests parts inside a layout container", () => {
  let nodes = build(["row"]);
  const row = nodes[0];
  assert.deepEqual(row.children, []);

  const label = createNode(nodes, "label");
  nodes = insertNode(nodes, label, { parentId: row.id, index: 0 });
  const button = createNode(nodes, "button");
  nodes = insertNode(nodes, button, { parentId: row.id, index: 1 });

  assert.deepEqual(
    findNode(nodes, row.id).children.map((node) => node.type),
    ["label", "button"],
  );
  assert.deepEqual(locate(nodes, button.id), { parentId: row.id, index: 1 });
  assert.equal([...walk(nodes)].length, 3);
});

test("moves a part between containers", () => {
  let nodes = build(["row", "label"]);
  const [row, label] = nodes;

  nodes = moveNode(nodes, label.id, { parentId: row.id, index: 0 });
  assert.equal(nodes.length, 1);
  assert.deepEqual(
    findNode(nodes, row.id).children.map((node) => node.id),
    [label.id],
  );

  // 다시 바깥으로 꺼냅니다.
  nodes = moveNode(nodes, label.id, { parentId: null, index: 0 });
  assert.deepEqual(nodes.map((node) => node.id), [label.id, row.id]);
});

test("reorders within one list without dropping a slot", () => {
  let nodes = build(["label", "button", "image"]);
  const [first, , third] = nodes;

  // 세 번째를 맨 위로.
  nodes = moveNode(nodes, third.id, { parentId: null, index: 0 });
  assert.deepEqual(
    nodes.map((node) => node.type),
    ["image", "label", "button"],
  );

  // 첫 번째를 맨 아래로. 자기 자리를 빼고 세면 한 칸 모자랍니다.
  nodes = moveNode(nodes, first.id, { parentId: null, index: 3 });
  assert.deepEqual(
    nodes.map((node) => node.type),
    ["image", "button", "label"],
  );
});

test("refuses to put a container inside itself", () => {
  let nodes = build(["row"]);
  const row = nodes[0];
  const inner = createNode(nodes, "column");
  nodes = insertNode(nodes, inner, { parentId: row.id, index: 0 });

  assert.ok(isInside(nodes, row.id, inner.id));
  assert.equal(isInside(nodes, inner.id, row.id), false);

  // 바깥 배치를 자기 안쪽 배치로 옮기려 하면 트리가 끊깁니다.
  const unchanged = moveNode(nodes, row.id, { parentId: inner.id, index: 0 });
  assert.deepEqual(unchanged, nodes);
  assert.deepEqual(
    moveNode(nodes, row.id, { parentId: row.id, index: 0 }),
    nodes,
  );
});

test("duplicates a container with everything inside it", () => {
  let nodes = build(["row"]);
  const row = nodes[0];
  nodes = insertNode(nodes, createNode(nodes, "label"), {
    parentId: row.id,
    index: 0,
  });
  nodes = updateNode(nodes, findNode(nodes, row.id).children[0].id, (node) => ({
    ...node,
    props: { ...node.props, text: "복제해 볼 글" },
  }));

  const { nodes: after, created } = duplicateNode(nodes, row.id);
  assert.equal(after.length, 2);
  assert.equal(after[1].id, created.id);
  assert.notEqual(created.id, row.id);
  assert.notEqual(created.name, row.name);
  assert.equal(created.children.length, 1);
  assert.equal(created.children[0].props.text, "복제해 볼 글");
  assert.notEqual(created.children[0].id, findNode(nodes, row.id).children[0].id);

  // 복사본의 속성을 고쳐도 원본은 그대로여야 합니다.
  const ids = new Set();
  for (const { node } of walk(after)) {
    assert.ok(!ids.has(node.id), `아이디가 겹칩니다 — ${node.id}`);
    ids.add(node.id);
  }
});

test("removing a container takes its contents with it", () => {
  let nodes = build(["row", "label"]);
  const row = nodes[0];
  nodes = insertNode(nodes, createNode(nodes, "button"), {
    parentId: row.id,
    index: 0,
  });
  assert.equal([...walk(nodes)].length, 3);

  nodes = removeNode(nodes, row.id);
  assert.equal([...walk(nodes)].length, 1);
  assert.equal(nodes[0].type, "label");
});

test("never changes the tree it was handed", () => {
  const nodes = build(["label", "button"]);
  const snapshot = JSON.parse(JSON.stringify(nodes));

  removeNode(nodes, nodes[0].id);
  moveNode(nodes, nodes[0].id, { parentId: null, index: 1 });
  stepNode(nodes, nodes[0].id, "down");
  updateNode(nodes, nodes[0].id, (node) => ({ ...node, name: "바뀐 이름" }));
  duplicateNode(nodes, nodes[0].id);

  assert.deepEqual(nodes, snapshot, "되돌리기가 예전 상태를 붙들 수 있어야 합니다.");
});

test("counts how deep a part sits inside layout parts", () => {
  let nodes = build(["column"]);
  const column = nodes[0];
  const inner = createNode(nodes, "row");
  nodes = insertNode(nodes, inner, { parentId: column.id, index: 0 });
  const button = createNode(nodes, "button");
  nodes = insertNode(nodes, button, { parentId: inner.id, index: 0 });

  assert.equal(depthOf(nodes, column.id), 0);
  assert.equal(depthOf(nodes, inner.id), 1);
  assert.equal(depthOf(nodes, button.id), 2);
  assert.equal(depthOf(nodes, "없는부품"), -1);
});

test("puts a tapped part inside the layout part the student picked", () => {
  // 태블릿에는 끌어 놓기가 없어, 눌러서도 세로 배치를 채울 수 있어야 합니다.
  let nodes = build(["label", "column"]);
  const column = nodes[1];

  assert.deepEqual(placeNear(nodes, column.id), {
    parentId: column.id,
    index: 0,
  });

  const first = createNode(nodes, "button");
  nodes = insertNode(nodes, first, placeNear(nodes, column.id));
  assert.equal(findNode(nodes, column.id).children.length, 1);

  // 방금 놓은 부품이 골라져 있으면, 다음 부품은 그 바로 뒤에 놓입니다.
  assert.deepEqual(placeNear(nodes, first.id), {
    parentId: column.id,
    index: 1,
  });
  const second = createNode(nodes, "label");
  nodes = insertNode(nodes, second, placeNear(nodes, first.id));
  assert.deepEqual(
    findNode(nodes, column.id).children.map((child) => child.id),
    [first.id, second.id],
  );
});

test("falls back to the end of the screen when nothing useful is picked", () => {
  const nodes = build(["label", "button"]);
  const end = { parentId: null, index: 2 };

  // 화면이나 머리글을 골랐을 때, 아무것도 안 골랐을 때입니다.
  assert.deepEqual(placeNear(nodes, "screen"), end);
  assert.deepEqual(placeNear(nodes, ""), end);
  // 화면 바로 아래 부품을 골랐을 때는 지금까지처럼 맨 끝에 놓습니다.
  assert.deepEqual(placeNear(nodes, nodes[0].id), end);
});

test("never taps a part into a layout stacked deeper than the tree keeps", () => {
  // 정리 규칙이 버리는 깊이까지 들어가면, 놓은 부품이 조용히 사라집니다.
  let nodes = build(["column"]);
  let parent = nodes[0];
  for (let depth = 1; depth <= MAX_NEST_DEPTH; depth += 1) {
    const child = createNode(nodes, "column");
    nodes = insertNode(nodes, child, { parentId: parent.id, index: 0 });
    parent = child;
  }

  assert.equal(depthOf(nodes, parent.id), MAX_NEST_DEPTH);
  assert.deepEqual(placeNear(nodes, parent.id), { parentId: null, index: 1 });
});

test("taps a part into the layout part beside it, and back out again", () => {
  // 태블릿에는 끌어 놓기가 없어, 이 길로만 배치 부품을 채우고 비웁니다.
  let nodes = build(["column", "button"]);
  const [column, button] = nodes;

  assert.equal(canStep(nodes, button.id, "in"), true);
  nodes = stepNode(nodes, button.id, "in");
  assert.deepEqual(nodes.map((node) => node.id), [column.id]);
  assert.deepEqual(
    findNode(nodes, column.id).children.map((child) => child.id),
    [button.id],
  );

  // 밖으로 빼면 담고 있던 배치 부품 바로 뒤에 섭니다.
  assert.equal(canStep(nodes, button.id, "out"), true);
  nodes = stepNode(nodes, button.id, "out");
  assert.deepEqual(nodes.map((node) => node.id), [column.id, button.id]);
  assert.equal(findNode(nodes, column.id).children.length, 0);
  assert.equal(canStep(nodes, button.id, "out"), false);
});

test("goes into the layout part below when there is none above", () => {
  let nodes = build(["button", "column"]);
  const [button, column] = nodes;

  nodes = stepNode(nodes, button.id, "in");
  assert.deepEqual(
    findNode(nodes, column.id).children.map((child) => child.id),
    [button.id],
  );

  // 옆에 배치 부품이 없으면 안으로 넣을 수 없습니다.
  const flat = build(["label", "button"]);
  assert.equal(canStep(flat, flat[1].id, "in"), false);
});

test("moves a part up and down among the parts beside it", () => {
  let nodes = build(["label", "button", "divider"]);
  const [label, button, divider] = nodes;

  assert.equal(canStep(nodes, label.id, "up"), false);
  assert.equal(canStep(nodes, divider.id, "down"), false);

  nodes = stepNode(nodes, button.id, "up");
  assert.deepEqual(nodes.map((node) => node.id), [button.id, label.id, divider.id]);

  nodes = stepNode(nodes, button.id, "down");
  nodes = stepNode(nodes, button.id, "down");
  assert.deepEqual(nodes.map((node) => node.id), [label.id, divider.id, button.id]);
  assert.equal(canStep(nodes, button.id, "down"), false);
});

test("keeps a tapped part from stacking deeper than the tree keeps", () => {
  // 배치 부품을 정리 규칙이 버리는 깊이까지 겹쳐 둡니다.
  let nodes = build(["column"]);
  let deepest = nodes[0];
  for (let depth = 1; depth <= MAX_NEST_DEPTH; depth += 1) {
    const child = createNode(nodes, "column");
    nodes = insertNode(nodes, child, { parentId: deepest.id, index: 0 });
    deepest = child;
  }
  const parentOfDeepest = locate(nodes, deepest.id).parentId;

  // 가장 깊은 배치 부품 옆에 선 부품은 그 안으로 못 들어갑니다.
  const button = createNode(nodes, "button");
  nodes = insertNode(nodes, button, { parentId: parentOfDeepest, index: 1 });
  assert.equal(depthOf(nodes, deepest.id), MAX_NEST_DEPTH);
  assert.equal(canStep(nodes, button.id, "in"), false);
  assert.deepEqual(stepNode(nodes, button.id, "in"), nodes);

  // 안에 부품을 담고 있는 배치 부품은 한 칸 더 얕은 곳에서도 막힙니다.
  let shallow = build(["column", "column"]);
  const filled = shallow[1];
  shallow = insertNode(shallow, createNode(shallow, "label"), {
    parentId: filled.id,
    index: 0,
  });
  assert.equal(canStep(shallow, filled.id, "in"), true);
});

test("holds a part into a layout part that is nowhere near it", () => {
  // 화면 맨 위 부품을 맨 아래 배치 부품에 담습니다. 옆으로 옮기지 않아도 됩니다.
  let nodes = build(["button", "list", "column", "textbox"]);
  const [button, list, column, textbox] = nodes;

  assert.equal(canHold(nodes, column.id, button.id), true);
  nodes = holdNode(nodes, column.id, button.id);
  nodes = holdNode(nodes, column.id, textbox.id);

  assert.deepEqual(nodes.map((node) => node.id), [list.id, column.id]);
  assert.deepEqual(
    findNode(nodes, column.id).children.map((child) => child.id),
    [button.id, textbox.id],
  );
  // 이미 담긴 부품은 다시 담을 것이 없습니다.
  assert.equal(canHold(nodes, column.id, button.id), false);
});

test("never holds a layout part inside something it already holds", () => {
  let nodes = build(["column"]);
  const outer = nodes[0];
  const inner = createNode(nodes, "row");
  nodes = insertNode(nodes, inner, { parentId: outer.id, index: 0 });

  assert.equal(canHold(nodes, inner.id, outer.id), false);
  assert.deepEqual(holdNode(nodes, inner.id, outer.id), nodes);
  // 자기 자신도 담을 수 없습니다.
  assert.equal(canHold(nodes, outer.id, outer.id), false);
  // 배치 부품이 아닌 곳에는 아무것도 담기지 않습니다.
  const flat = build(["label", "button"]);
  assert.equal(canHold(flat, flat[0].id, flat[1].id), false);
});

test("offers every part a layout part could take", () => {
  let nodes = build(["button", "column", "list"]);
  const column = nodes[1];
  const inside = createNode(nodes, "label");
  nodes = insertNode(nodes, inside, { parentId: column.id, index: 0 });

  assert.deepEqual(
    holdCandidates(nodes, column.id).map((node) => node.name),
    ["버튼1", "목록1"],
  );

  // 안에 담긴 것을 다른 배치 부품이 데려갈 수는 있습니다.
  const row = createNode(nodes, "row");
  nodes = insertNode(nodes, row, { parentId: null, index: 0 });
  assert.ok(
    holdCandidates(nodes, row.id).some((node) => node.id === inside.id),
    "배치 부품 안에 있는 부품도 옮겨 담을 수 있어야 합니다.",
  );
});
