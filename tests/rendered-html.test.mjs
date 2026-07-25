import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("implements the App Inventor-inspired AI notice chatbot studio", async () => {
  const [studio, phone, blocks, model] = await Promise.all([
    readFile(
      new URL("../app/components/chatbot-studio.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../app/components/phone-preview.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../app/components/block-workspace.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../lib/chatbot-studio.ts", import.meta.url), "utf8"),
  ]);
  const implementation = [studio, phone, blocks, model].join("\n");

  assert.match(studio, /AI CHATBOT LAB/);
  assert.match(studio, /디자이너/);
  assert.match(studio, /블록/);
  assert.match(studio, /팔레트/);
  assert.match(studio, /컴포넌트/);
  assert.match(studio, /속성/);
  assert.match(studio, /ai-chatbot-inventor-project-v1/);
  assert.match(studio, /application\/x-chatbot-component/);
  assert.match(model, /AI 알림장 챗봇/);
  assert.match(model, /오늘 숙제/);
  assert.match(model, /내일 준비물/);
  assert.match(model, /부모님께 전달할 말/);
  assert.match(model, /오늘 배운 것/);
  assert.match(model, /오늘의 소감/);
  assert.match(phone, /submitQuestion/);
  assert.match(blocks, /버튼을 클릭했을 때/);
  assert.match(blocks, /챗봇이 말하기/);
  assert.doesNotMatch(implementation, /AI 캠프 기록봇|모아랩|광주 길동무/);
});

test("uses Korean metadata and the standard Vercel Next.js runtime", async () => {
  const [layout, packageJson] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /<html lang="ko"/);
  assert.match(layout, /AI 챗봇 LAB/);
  assert.match(packageJson, /"build": "next build"/);
  assert.doesNotMatch(
    packageJson,
    /vinext|wrangler|cloudflare|react-loading-skeleton/i,
  );
  await assert.rejects(access(new URL(".openai/hosting.json", root)));
});
