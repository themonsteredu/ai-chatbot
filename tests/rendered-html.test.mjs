import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("contains the reusable chatbot maker templates and interactions", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /AI 캠프 기록봇/);
  assert.match(page, /우리 반 알림봇/);
  assert.match(page, /독서 활동봇/);
  assert.match(page, /localStorage\.setItem\("chatbot-maker-project"/);
  assert.match(page, /copyShareLink/);
  assert.match(page, /addBlock/);
  assert.match(page, /moveBlock/);
  assert.match(page, /직접 기능 만들기/);
  assert.match(page, /동작 스크립트/);
  assert.match(page, /parseScript/);
  assert.match(page, /말하기:/);
  assert.match(page, /디자인 세부 편집/);
  assert.match(page, /dropBlock/);
});

test("uses Korean metadata and the standard Vercel Next.js runtime", async () => {
  const [layout, packageJson] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /<html lang="ko">/);
  assert.match(layout, /챗봇 메이커/);
  assert.match(packageJson, /"build": "next build"/);
  assert.doesNotMatch(packageJson, /vinext|wrangler|cloudflare|react-loading-skeleton/i);
  await assert.rejects(access(new URL(".openai/hosting.json", root)));
});
