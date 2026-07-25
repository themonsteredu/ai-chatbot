import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the chatbot maker studio", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>챗봇 메이커 \| 아이디어를 대화로 만드는 스튜디오<\/title>/i);
  assert.match(html, /어떤 챗봇을 만들까요\?/);
  assert.match(html, /AI 캠프 기록봇/);
  assert.match(html, /우리 반 알림봇/);
  assert.match(html, /독서 활동봇/);
  assert.match(html, /기능 고르기/);
  assert.match(html, /바로 테스트하기/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});

test("keeps the starter preview removed and core interactions present", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /localStorage\.setItem\("chatbot-maker-project"/);
  assert.match(page, /copyShareLink/);
  assert.match(page, /addBlock/);
  assert.match(page, /moveBlock/);
  assert.match(layout, /<html lang="ko">/);
  assert.match(layout, /챗봇 메이커/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
  await assert.rejects(access(new URL("public/_sites-preview", templateRoot)));
});
