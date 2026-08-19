import assert from "node:assert/strict";
import test from "node:test";
import {
  MANIFEST_PROJECT_LIMIT,
  SHARE_PROJECT_LIMIT,
  compactProject,
  decodeProject,
  encodeProject,
} from "../lib/project/encode.ts";
import {
  BLANK_PROJECT,
  CAMP_PROJECT,
  NOTICE_PROJECT,
  PROJECT_TEMPLATES,
} from "../lib/project/defaults.ts";
import { normalizeProject } from "../lib/project/normalize.ts";
import { createNode, insertNode } from "../lib/project/tree.ts";

/** 웹앱을 실제로 만들다 보면 이 정도 부품은 금방 놓습니다. */
function stressProject() {
  let children = [];
  const types = [
    "label",
    "button",
    "image",
    "textbox",
    "checkbox",
    "switch",
    "slider",
    "divider",
    "list",
    "row",
  ];
  for (let index = 0; index < 20; index += 1) {
    const node = createNode(children, types[index % types.length]);
    node.props.visible = true;
    node.props.bold = true;
    node.props.textColor = "#123456";
    node.props.background = "#abcdef";
    node.props.fontSize = "lg";
    if (node.type === "label") node.props.text = "긴 설명을 담은 라벨입니다.";
    if (node.type === "image") {
      node.props.src = `data:image/jpeg;base64,${"A".repeat(9000)}`;
    }
    children = insertNode(children, node, {
      parentId: null,
      index: children.length,
    });
  }
  return normalizeProject({
    ...NOTICE_PROJECT,
    screens: [{ id: "s1", name: "Screen1", children }],
  });
}

test("round-trips every template without losing anything", () => {
  for (const template of PROJECT_TEMPLATES) {
    const source = normalizeProject(template.project);
    const restored = decodeProject(encodeProject(source));
    assert.deepEqual(restored, source, `${template.name}이(가) 달라졌습니다.`);
  }
});

test("round-trips a project a student actually filled out", () => {
  const source = stressProject();
  const restored = decodeProject(encodeProject(source));
  assert.deepEqual(restored, source);
});

test("stays inside the share store's limit", () => {
  for (const project of [BLANK_PROJECT, CAMP_PROJECT, NOTICE_PROJECT]) {
    assert.ok(
      encodeProject(normalizeProject(project)).length < SHARE_PROJECT_LIMIT,
    );
  }
  assert.ok(
    encodeProject(stressProject()).length < SHARE_PROJECT_LIMIT,
    "사진을 잔뜩 넣어도 공유 저장 한도 안에 들어와야 합니다.",
  );
});

test("keeps the home-screen install payload under its much tighter cap", () => {
  // 설치 주소는 12,000자까지입니다. 사진 한 장이 그 자리를 통째로 먹기 때문에
  // 설치용으로 만들 때는 사진을 뺍니다. 설계는 기기에 그대로 남습니다.
  const heavy = stressProject();
  assert.ok(
    encodeProject(heavy).length > MANIFEST_PROJECT_LIMIT,
    "이 시험이 뜻을 가지려면 원본은 한도를 넘어야 합니다.",
  );
  assert.ok(
    encodeProject(heavy, { forManifest: true }).length <
      MANIFEST_PROJECT_LIMIT,
    "설치 주소가 한도를 넘으면 홈 화면에 추가가 조용히 깨집니다.",
  );

  for (const project of [BLANK_PROJECT, CAMP_PROJECT, NOTICE_PROJECT]) {
    assert.ok(
      encodeProject(normalizeProject(project), { forManifest: true }).length <
        MANIFEST_PROJECT_LIMIT,
    );
  }
});

test("drops photos only from the manifest payload", () => {
  const heavy = stressProject();
  const full = JSON.stringify(compactProject(heavy));
  const slim = JSON.stringify(compactProject(heavy, { forManifest: true }));
  assert.match(full, /data:image\/jpeg;base64,/);
  assert.doesNotMatch(slim, /data:image\/jpeg;base64,/);
  // 사진 말고는 그대로 있어야 합니다.
  assert.match(slim, /긴 설명을 담은 라벨입니다\./);
});

test("leaves out props the student never changed", () => {
  const compact = compactProject(normalizeProject(NOTICE_PROJECT));
  const button = compact.screens[0].children.find(
    (node) => node.type === "button",
  );
  assert.deepEqual(Object.keys(button.props), ["label"]);
  // 블록이 없는 빈 웹앱은 blocks 열쇠 자체를 담지 않습니다.
  assert.equal("blocks" in compactProject(normalizeProject(BLANK_PROJECT)), false);
  assert.equal("blocks" in compact, true);
});

test("returns null instead of throwing on a broken link", () => {
  assert.equal(decodeProject("이건 base64가 아니에요"), null);
  assert.equal(decodeProject(""), null);
  assert.equal(decodeProject(btoa("{not json")), null);
});

test("recovers a sensible project from a truncated but valid payload", () => {
  // 주소가 잘려도 JSON이 살아 있으면 열 수 있어야 합니다.
  const restored = decodeProject(btoa(JSON.stringify({ version: 4 })));
  assert.equal(restored.version, 4);
  assert.equal(restored.screens.length, 1);
  assert.deepEqual(restored.screens[0].children, []);
});
