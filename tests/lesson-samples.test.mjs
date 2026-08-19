import assert from "node:assert/strict";
import test from "node:test";
import { SAMPLES, sampleById } from "../lib/lessons/samples.ts";
import { normalizeProject } from "../lib/project/normalize.ts";
import { encodeProject, MANIFEST_PROJECT_LIMIT } from "../lib/project/encode.ts";
import { emptyState, resolveProp, runEvent } from "../lib/blocks/interpreter.ts";
import { nodeIndex, walk } from "../lib/project/tree.ts";
import { REGISTRY } from "../lib/components/registry.ts";

const typesIn = (project) =>
  [...walk(project.screens[0].children)].map((entry) => entry.node.type);

test("every sample survives the normalizer unchanged", () => {
  for (const sample of SAMPLES) {
    const cleaned = normalizeProject(sample.project);
    assert.deepEqual(
      cleaned,
      sample.project,
      `${sample.name}: 정리하면 달라집니다. 오타나 사전에 없는 속성이 있는지 보세요.`,
    );
  }
});

test("the three samples teach different things", () => {
  const sets = SAMPLES.map((sample) => new Set(typesIn(sample.project)));
  // 어느 예시도 다른 예시가 쓰는 부품을 그대로 되풀이하지 않아야 합니다.
  for (let a = 0; a < sets.length; a += 1) {
    for (let b = a + 1; b < sets.length; b += 1) {
      const onlyInA = [...sets[a]].filter((type) => !sets[b].has(type));
      const onlyInB = [...sets[b]].filter((type) => !sets[a].has(type));
      assert.ok(
        onlyInA.length > 0 && onlyInB.length > 0,
        `${SAMPLES[a].name}과 ${SAMPLES[b].name}이 같은 부품만 씁니다.`,
      );
    }
  }

  // 한 예시에만 나오는 특징이 실제로 들어 있는지 확인합니다.
  const byId = Object.fromEntries(SAMPLES.map((s) => [s.id, s.project]));
  assert.ok(typesIn(byId["intro-card"]).includes("image"));
  assert.ok(typesIn(byId["class-survey"]).includes("slider"));
  assert.ok(typesIn(byId["class-survey"]).includes("switch"));
  assert.ok(typesIn(byId["school-guide"]).includes("row"));
  assert.ok(typesIn(byId["school-guide"]).includes("chatbot"));

  // 변수와 조건은 2차시에서만 씁니다.
  assert.equal(byId["class-survey"].blocks.variables.length, 1);
  assert.equal(byId["intro-card"].blocks.variables.length, 0);
  assert.equal(byId["school-guide"].blocks.variables.length, 0);
});

test("every block points at a part that exists and an event it really has", () => {
  for (const sample of SAMPLES) {
    const design = nodeIndex(sample.project.screens[0].children);
    for (const event of sample.project.blocks.events) {
      const node = design[event.componentId];
      assert.ok(node, `${sample.name}: 없는 부품을 가리킵니다 — ${event.componentId}`);
      assert.ok(
        REGISTRY[node.type].events.some((spec) => spec.id === event.event),
        `${sample.name}: ${node.name}에 없는 이벤트입니다 — ${event.event}`,
      );
      assert.ok(event.body.length > 0, `${sample.name}: 빈 블록이 있습니다.`);
    }
  }
});

test("1차시 — pressing the button changes the other label", () => {
  const project = sampleById("intro-card").project;
  const design = nodeIndex(project.screens[0].children);
  const before = resolveProp(design, emptyState(), "c3", "text");
  const after = runEvent(project.blocks, design, emptyState(), {
    componentId: "c5",
    event: "click",
  });
  assert.equal(before, "눌러서 인사를 받아 보세요");
  assert.match(resolveProp(design, after, "c3", "text"), /반가워요/);
});

test("2차시 — the condition really splits on the slider value", () => {
  const project = sampleById("class-survey").project;
  const design = nodeIndex(project.screens[0].children);

  // 기본값 5점 → 낮은 쪽 안내
  const low = runEvent(project.blocks, design, emptyState(), {
    componentId: "c5",
    event: "click",
  });
  assert.equal(low.vars["점수"], 5);
  assert.match(resolveProp(design, low, "c6", "text"), /5점이에요/);
  assert.match(resolveProp(design, low, "c6", "text"), /내일은 더 나아질/);

  // 막대를 9로 올리면 → 높은 쪽 안내
  const raised = { ...emptyState(), props: { c2: { value: 9 } } };
  const high = runEvent(project.blocks, design, raised, {
    componentId: "c5",
    event: "click",
  });
  assert.equal(high.vars["점수"], 9);
  assert.match(resolveProp(design, high, "c6", "text"), /9점! 좋은 하루/);
});

test("3차시 — two buttons change the same card differently", () => {
  const project = sampleById("school-guide").project;
  const design = nodeIndex(project.screens[0].children);

  const meal = runEvent(project.blocks, design, emptyState(), {
    componentId: "c3",
    event: "click",
  });
  assert.equal(resolveProp(design, meal, "c5", "title"), "오늘 급식");
  assert.match(resolveProp(design, meal, "c5", "body"), /제육볶음/);

  const timetable = runEvent(project.blocks, design, meal, {
    componentId: "c4",
    event: "click",
  });
  assert.equal(resolveProp(design, timetable, "c5", "title"), "오늘 시간표");
  assert.match(resolveProp(design, timetable, "c5", "body"), /국어/);

  // 버튼이 배치 부품 안에 들어 있어야 3차시의 학습 목표가 성립합니다.
  const row = project.screens[0].children.find((node) => node.type === "row");
  assert.deepEqual(
    row.children.map((node) => node.name),
    ["급식버튼", "시간표버튼"],
  );
});

test("each sample opens from a link that fits in a QR", () => {
  for (const sample of SAMPLES) {
    assert.ok(
      encodeProject(sample.project, { forManifest: true }).length <
        MANIFEST_PROJECT_LIMIT,
      `${sample.name}: 주소가 너무 깁니다.`,
    );
  }
});

test("samples are described for the teacher", () => {
  const ids = new Set();
  for (const sample of SAMPLES) {
    assert.ok(!ids.has(sample.id));
    ids.add(sample.id);
    assert.ok(sample.name.trim() && sample.goal.trim());
    assert.ok(sample.focus.length >= 3, `${sample.name}: 쓰는 기능을 적어 주세요.`);
    assert.ok(sample.minutes > 0);
  }
  assert.deepEqual(
    SAMPLES.map((sample) => sample.order),
    [1, 2, 3],
  );
});
