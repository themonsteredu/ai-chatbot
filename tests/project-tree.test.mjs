import assert from "node:assert/strict";
import test from "node:test";
import {
  canAdd,
  createNode,
  duplicateNode,
  findNode,
  insertNode,
  isInside,
  locate,
  moveNode,
  nextName,
  removeNode,
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
  updateNode(nodes, nodes[0].id, (node) => ({ ...node, name: "바뀐 이름" }));
  duplicateNode(nodes, nodes[0].id);

  assert.deepEqual(nodes, snapshot, "되돌리기가 예전 상태를 붙들 수 있어야 합니다.");
});
