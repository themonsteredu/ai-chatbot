import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { normalizeProject } from "../lib/project/normalize.ts";
import { migrateV3, normalizeLegacy } from "../lib/project/migrate-v3.ts";
import { NOTICE_PROJECT } from "../lib/project/defaults.ts";
import { findNode, walk } from "../lib/project/tree.ts";

const fixture = (name) =>
  JSON.parse(
    readFileSync(new URL(`./fixtures/v3-${name}.json`, import.meta.url), "utf8"),
  );

const typesOf = (project) =>
  project.screens[0].children.map((node) => node.type);

test("carries every v3 template into the component tree", () => {
  assert.deepEqual(typesOf(normalizeProject(fixture("blank"))), [
    // 빈 웹앱은 기능이 하나도 켜져 있지 않지만, 꺼 둔 기능 안에 학생이 적어 둔
    // 글이 남아 있을 수 있어 감춘 채로 함께 옮깁니다.
    "notice-card",
    "checklist",
    "journal",
    "camp-report",
    "button",
    "chatbot",
  ]);
  assert.ok(
    normalizeProject(fixture("blank")).screens[0].children.every(
      (node) => node.props.visible === false,
    ),
    "빈 웹앱에서 옮겨 온 부품은 전부 감춰져 있어야 합니다.",
  );

  // 캠프 예시는 안내 카드와 캠프 기록만 보입니다.
  const camp = normalizeProject(fixture("camp"));
  const campVisible = camp.screens[0].children.filter(
    (node) => node.props.visible !== false,
  );
  assert.deepEqual(
    campVisible.map((node) => node.type),
    ["notice-card", "camp-report"],
  );

  const notice = normalizeProject(fixture("notice"));
  const noticeVisible = notice.screens[0].children.filter(
    (node) => node.props.visible !== false,
  );
  assert.deepEqual(
    noticeVisible.map((node) => node.type),
    ["notice-card", "checklist", "journal", "button", "chatbot"],
  );
});

test("keeps the words the student wrote", () => {
  const notice = normalizeProject(fixture("notice"));
  const card = notice.screens[0].children.find(
    (node) => node.type === "notice-card",
  );
  assert.equal(card.props.title, "오늘의 알림");
  assert.match(card.props.body, /수학 익힘책 42~43쪽/);

  const checklist = notice.screens[0].children.find(
    (node) => node.type === "checklist",
  );
  assert.deepEqual(
    checklist.props.items.map((item) => item.text),
    ["과학 교과서", "필통과 색연필", "가정통신문"],
  );

  const chatbot = notice.screens[0].children.find(
    (node) => node.type === "chatbot",
  );
  assert.equal(chatbot.props.qa.length, 3);
  assert.equal(chatbot.props.qa[0].label, "오늘 숙제");
  assert.equal(chatbot.props.qa[0].icon, "book");
  assert.equal(chatbot.props.botName, "알림장 도우미");
});

test("turns the hardcoded button behaviour into a real, editable block", () => {
  // v3에서 버튼의 동작은 코드에 박혀 있어 학생이 손댈 수 없었습니다. 옮겨 온
  // 프로젝트에는 진짜 블록이 하나 들어 있어야 합니다.
  const notice = normalizeProject(fixture("notice"));
  assert.equal(notice.blocks.events.length, 1);

  const [event] = notice.blocks.events;
  assert.equal(event.event, "click");
  const button = findNode(notice.screens[0].children, event.componentId);
  assert.equal(button.type, "button");
  assert.equal(button.props.label, "오늘 알림 확인 완료");

  assert.deepEqual(event.body, [
    {
      id: "a1",
      kind: "show-message",
      value: { k: "text", v: "좋아요! 오늘 알림을 모두 확인했어요." },
    },
  ]);
});

test("gives every component a unique id and name", () => {
  for (const name of ["blank", "camp", "notice"]) {
    const project = normalizeProject(fixture(name));
    const ids = new Set();
    const names = new Set();
    for (const { node } of walk(project.screens[0].children)) {
      assert.ok(!ids.has(node.id), `${name}: 아이디가 겹칩니다 — ${node.id}`);
      assert.ok(!names.has(node.name), `${name}: 이름이 겹칩니다 — ${node.name}`);
      ids.add(node.id);
      names.add(node.name);
    }
  }
});

test("survives a project written by hand in the wild", () => {
  // 학생 기기에서 나온 프로젝트는 모르는 열쇠가 섞이거나 값이 빠져 있을 수 있습니다.
  const messy = {
    template: "알 수 없음",
    title: "내 웹앱",
    accent: "빨강",
    noticeEnabled: true,
    noticeTitle: "제목",
    checklistItems: [{ text: "아이디 없는 줄" }, null, "글자만"],
    actions: [{ label: "질문", icon: "우주선" }],
    featureOrder: ["chatbot", "notice", "없는기능", "chatbot"],
    나중에추가한열쇠: true,
  };

  const project = normalizeProject(messy);
  assert.equal(project.version, 4);
  assert.equal(project.template, "blank");
  assert.equal(project.accent, "#6956e8", "이상한 색은 기본값으로 돌아갑니다.");
  assert.equal(project.title, "내 웹앱");

  // featureOrder를 존중하되, 켜 둔 기능이 먼저 옵니다.
  const visible = project.screens[0].children.filter(
    (node) => node.props.visible !== false,
  );
  assert.deepEqual(
    visible.map((node) => node.type),
    ["notice-card"],
  );

  const checklist = project.screens[0].children.find(
    (node) => node.type === "checklist",
  );
  assert.deepEqual(
    checklist.props.items.map((item) => item.text),
    ["아이디 없는 줄"],
  );
  assert.ok(checklist.props.items[0].id, "아이디가 없으면 지어 줘야 합니다.");

  const chatbot = project.screens[0].children.find(
    (node) => node.type === "chatbot",
  );
  assert.equal(chatbot.props.qa[0].icon, "message", "모르는 아이콘은 기본값입니다.");
});

test("respects the caps v3 enforced", () => {
  const project = normalizeProject({
    chatbotEnabled: true,
    actions: Array.from({ length: 30 }, (unused, index) => ({
      id: `q${index}`,
      label: `질문 ${index}`,
      response: "답",
      icon: "message",
    })),
    checklistEnabled: true,
    checklistItems: Array.from({ length: 30 }, (unused, index) => ({
      id: `i${index}`,
      text: `항목 ${index}`,
    })),
  });

  const chatbot = project.screens[0].children.find(
    (node) => node.type === "chatbot",
  );
  const checklist = project.screens[0].children.find(
    (node) => node.type === "checklist",
  );
  assert.equal(chatbot.props.qa.length, 12);
  assert.equal(checklist.props.items.length, 10);
});

test("leaves an already-migrated project alone", () => {
  const once = normalizeProject(fixture("notice"));
  const twice = normalizeProject(once);
  assert.deepEqual(twice, once, "두 번 정리해도 같은 결과여야 합니다.");

  // 사전에 없는 속성과 가리킬 곳 없는 블록은 걷어 냅니다.
  const tampered = JSON.parse(JSON.stringify(once));
  tampered.screens[0].children[0].props.있지도않은속성 = "값";
  tampered.blocks.events.push({
    id: "e9",
    componentId: "사라진부품",
    event: "click",
    body: [],
  });
  const cleaned = normalizeProject(tampered);
  assert.equal(cleaned.screens[0].children[0].props.있지도않은속성, undefined);
  assert.equal(cleaned.blocks.events.length, 1);
});

test("drops blocks whose event the component does not have", () => {
  const base = normalizeProject(fixture("notice"));
  const label = base.screens[0].children.find((node) => node.type === "notice-card");
  base.blocks.events.push({
    id: "e2",
    // 안내 카드에는 클릭 이벤트가 없습니다.
    componentId: label.id,
    event: "click",
    body: [],
  });
  assert.equal(normalizeProject(base).blocks.events.length, 1);
});

test("stores only the props that differ from the default", () => {
  const project = normalizeProject(NOTICE_PROJECT);
  const button = project.screens[0].children.find(
    (node) => node.type === "button",
  );
  // 기본값 그대로인 꾸미기 속성은 담기지 않아야 주소가 짧아집니다.
  assert.deepEqual(Object.keys(button.props), ["label"]);
});

test("normalizeLegacy keeps the v3 clean-up rules", () => {
  const legacy = normalizeLegacy({ title: "제목만 있는 프로젝트" });
  assert.equal(legacy.appName, "제목만 있는 프로젝트");
  assert.equal(legacy.featureOrder.length, 6);
  assert.equal(migrateV3(legacy).screens[0].children.length, 6);
});
