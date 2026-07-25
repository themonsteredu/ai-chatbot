import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("contains the reusable web maker planning and block workflow", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /나만의 웹 만들기/);
  assert.match(page, /기획하기/);
  assert.match(page, /화면 만들기/);
  assert.match(page, /기능 연결/);
  assert.match(page, /테스트하기/);
  assert.match(page, /캠프 기록장/);
  assert.match(page, /독서 기록장/);
  assert.match(page, /우리 반 알림장/);
  assert.match(page, /자유 기능/);
  assert.match(page, /parseStudioScript/);
  assert.match(page, /localStorage\.setItem\("my-web-maker-project"/);
  assert.match(page, /my-web-records-/);
  assert.match(page, /copyShareLink/);
  assert.match(page, /dropBlock/);
  assert.match(page, /오늘의 기록을 이 기기에 저장했어요/);
});

test("uses Korean metadata and the standard Vercel Next.js runtime", async () => {
  const [layout, packageJson] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /<html lang="ko">/);
  assert.match(layout, /나만의 웹 만들기/);
  assert.match(packageJson, /"name": "my-web-maker"/);
  assert.match(packageJson, /"build": "next build"/);
  assert.doesNotMatch(
    packageJson,
    /vinext|wrangler|cloudflare|react-loading-skeleton/i,
  );
  await assert.rejects(access(new URL(".openai/hosting.json", root)));
});
