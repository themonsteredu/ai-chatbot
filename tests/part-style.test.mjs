import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  FONT_STACK,
  containerStyle,
  partStyle,
} from "../app/components/runtime/style.ts";
import { REGISTRY } from "../lib/components/registry.ts";

const root = new URL("../", import.meta.url);

test("hands a chosen colour down to the parts that paint themselves", () => {
  const style = partStyle({ textColor: "#e65387", background: "#16a982" });

  assert.equal(style.color, "#e65387");
  assert.equal(style.backgroundColor, "#16a982");
  // CSS가 제 색을 정해 둔 자리는 이 변수로 학생이 고른 색을 받습니다.
  assert.equal(style["--part-ink"], "#e65387");
  assert.equal(style["--part-surface"], "#16a982");
});

test("leaves the web app's own colours alone when nothing is chosen", () => {
  const style = partStyle({ textColor: "", background: "" });

  assert.equal(style.color, undefined);
  assert.equal(style.backgroundColor, undefined);
  assert.equal(style["--part-ink"], undefined);
  assert.equal(style["--part-surface"], undefined);
});

test("lets the button face carry the colour, not the frame around it", () => {
  const style = partStyle({ background: "#16a982" }, { innerFill: true });

  assert.equal(style.backgroundColor, undefined);
  assert.equal(style["--part-surface"], "#16a982");
});

test("keeps a layout part's colour from leaking into the parts inside it", () => {
  // 흘려보내면 안에 담은 버튼까지 배치 부품 색으로 칠해집니다.
  const style = containerStyle({ background: "#16a982" });

  assert.equal(style.backgroundColor, "#16a982");
  assert.equal(style["--part-ink"], undefined);
  assert.equal(style["--part-surface"], undefined);
});

test("turns the font a student picked into a real font stack", () => {
  assert.equal(partStyle({ font: "myeongjo" }).fontFamily, FONT_STACK.myeongjo);
  assert.match(partStyle({ font: "typewriter" }).fontFamily, /monospace$/);
  // 기본과 모르는 값은 본문 글꼴을 그대로 씁니다.
  assert.equal(partStyle({ font: "" }).fontFamily, undefined);
  assert.equal(partStyle({ font: "없는글꼴" }).fontFamily, undefined);
});

test("every font a student can pick has a font stack behind it", () => {
  const options = REGISTRY.label.props.find((prop) => prop.key === "font")?.options;
  assert.ok(options?.length > 1, "글꼴 고를 거리가 없습니다.");

  for (const option of options) {
    if (option.value === "") continue;
    const stack = FONT_STACK[option.value];
    assert.ok(stack, `${option.label}: 실제 글꼴이 없습니다.`);
    // 기기에 글꼴이 없어도 비슷한 글꼴로 나오도록 마지막에 갈래를 적어 둡니다.
    assert.match(stack, /(sans-serif|serif|cursive|monospace)$/);
  }
});

test("lets the student's colour win wherever the CSS sets one of its own", async () => {
  const css = await readFile(new URL("app/globals.css", root), "utf8");

  // 버튼 얼굴은 세 가지 모양 모두 학생이 고른 색을 씁니다.
  assert.match(
    css,
    /\.part-button-face \{[^}]*background: var\(--part-surface,[^}]*color: var\(--part-ink,/s,
  );
  assert.match(
    css,
    /\.part-button-face\.outline \{[^}]*color: var\(--part-ink,/s,
  );
  assert.match(css, /\.part-button-face\.soft \{[^}]*color: var\(--part-ink,/s);
  // 웹앱 기능 카드의 본문 글씨도 마찬가지입니다.
  assert.match(css, /\.notice-card p \{[^}]*color: var\(--part-ink,/s);
  // 색을 안 고른 부품이 아무 색도 못 받는 일이 없도록 기본값을 함께 적습니다.
  const naked = css.match(/var\(--part-(ink|surface)\)/g);
  assert.equal(naked, null, `기본값 없는 색 변수가 있습니다 — ${naked}`);
});
