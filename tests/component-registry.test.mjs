import assert from "node:assert/strict";
import test from "node:test";
import {
  CATEGORIES,
  COMPONENT_TYPES,
  REGISTRY,
  defaultProps,
  isComponentType,
  propSpec,
} from "../lib/components/registry.ts";

const specs = Object.values(REGISTRY);

test("every component type appears in exactly one category", () => {
  const listed = CATEGORIES.flatMap((category) => category.types);
  assert.equal(listed.length, new Set(listed).size, "카테고리에 부품이 두 번 들어 있습니다.");
  assert.deepEqual(
    [...listed].sort(),
    [...COMPONENT_TYPES].sort(),
    "팔레트에 안 보이거나 사전에 없는 부품이 있습니다.",
  );
});

test("names students read are filled in and unique", () => {
  const names = new Set();
  const prefixes = new Set();
  for (const spec of specs) {
    assert.ok(spec.name.trim(), `${spec.type}: 이름이 비었습니다.`);
    assert.ok(spec.hint.trim(), `${spec.type}: 설명이 비었습니다.`);
    assert.ok(spec.icon.trim(), `${spec.type}: 아이콘 이름이 비었습니다.`);
    assert.ok(!names.has(spec.name), `이름이 겹칩니다 — ${spec.name}`);
    assert.ok(!prefixes.has(spec.namePrefix), `이름 앞머리가 겹칩니다 — ${spec.namePrefix}`);
    names.add(spec.name);
    prefixes.add(spec.namePrefix);
  }
});

test("each default matches the kind it is declared as", () => {
  for (const spec of specs) {
    const keys = new Set();
    for (const prop of spec.props) {
      assert.ok(!keys.has(prop.key), `${spec.type}: 속성 열쇠가 겹칩니다 — ${prop.key}`);
      keys.add(prop.key);
      assert.ok(prop.label.trim(), `${spec.type}.${prop.key}: 이름이 비었습니다.`);

      const value = prop.default;
      switch (prop.kind) {
        case "boolean":
          assert.equal(typeof value, "boolean", `${spec.type}.${prop.key}`);
          break;
        case "number":
        case "range":
          assert.equal(typeof value, "number", `${spec.type}.${prop.key}`);
          break;
        case "itemlist":
        case "qalist":
          assert.ok(Array.isArray(value), `${spec.type}.${prop.key}`);
          assert.ok(prop.maxItems > 0, `${spec.type}.${prop.key}: 상한이 필요합니다.`);
          break;
        case "select":
        case "align":
          assert.equal(typeof value, "string", `${spec.type}.${prop.key}`);
          if (prop.options) {
            assert.ok(
              prop.options.some((option) => option.value === value),
              `${spec.type}.${prop.key}: 기본값이 고를 수 있는 값에 없습니다.`,
            );
          }
          break;
        default:
          assert.equal(typeof value, "string", `${spec.type}.${prop.key}`);
      }
    }
  }
});

test("anything a block can write, a block can also read", () => {
  for (const spec of specs) {
    for (const prop of spec.props) {
      if (!prop.blockWritable) continue;
      assert.ok(
        prop.blockReadable,
        `${spec.type}.${prop.key}: 바꿀 수 있으면 읽을 수도 있어야 합니다.`,
      );
    }
  }
});

test("event ids are unique within a component", () => {
  for (const spec of specs) {
    const ids = spec.events.map((event) => event.id);
    assert.equal(ids.length, new Set(ids).size, `${spec.type}: 이벤트가 겹칩니다.`);
    for (const event of spec.events) {
      assert.ok(event.label.trim(), `${spec.type}.${event.id}: 설명이 비었습니다.`);
    }
  }
});

test("every component carries the shared styling props", () => {
  for (const spec of specs) {
    const keys = new Set(spec.props.map((prop) => prop.key));
    assert.ok(keys.has("visible"), `${spec.type}: 보이기가 없습니다.`);
    assert.ok(keys.has("background"), `${spec.type}: 배경색이 없습니다.`);
    assert.ok(keys.has("width"), `${spec.type}: 너비가 없습니다.`);
    if (!spec.acceptsChildren) {
      // 글자를 직접 그리지 않는 배치 부품만 글자 속성을 뺍니다.
      assert.ok(keys.has("fontSize"), `${spec.type}: 글자 크기가 없습니다.`);
      assert.ok(keys.has("align"), `${spec.type}: 정렬이 없습니다.`);
    }
  }
});

test("only layout components take children", () => {
  const containers = specs.filter((spec) => spec.acceptsChildren).map((s) => s.type);
  assert.deepEqual([...containers].sort(), ["column", "row"]);
});

test("defaultProps fills in every declared prop and hands back fresh arrays", () => {
  for (const spec of specs) {
    const props = defaultProps(spec.type);
    assert.deepEqual(
      Object.keys(props).sort(),
      spec.props.map((prop) => prop.key).sort(),
    );
  }
  // 목록은 복사본이어야 한 부품을 고칠 때 다른 부품이 따라 바뀌지 않습니다.
  const a = defaultProps("checklist");
  const b = defaultProps("checklist");
  a.items[0].text = "바뀐 글";
  assert.equal(b.items[0].text, "첫 번째 할 일");
});

test("looks up types and props safely", () => {
  assert.ok(isComponentType("button"));
  assert.equal(isComponentType("없는부품"), false);
  assert.equal(isComponentType(null), false);
  assert.equal(propSpec("button", "label").kind, "text");
  assert.equal(propSpec("button", "없는속성"), undefined);
});
