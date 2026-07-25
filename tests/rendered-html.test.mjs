import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("implements the App Inventor-inspired personal web app studio", async () => {
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

  assert.match(studio, /AI WEB APP LAB/);
  assert.match(studio, /나만의 웹앱 만들기/);
  assert.match(studio, /디자이너/);
  assert.match(studio, /블록/);
  assert.match(studio, /팔레트/);
  assert.match(studio, /컴포넌트/);
  assert.match(studio, /속성/);
  assert.match(studio, /my-webapp-inventor-project-v2/);
  assert.match(studio, /application\/x-webapp-component/);
  assert.match(implementation, /우리 반 알림장/);
  assert.match(implementation, /캠프 1일차/);
  assert.match(implementation, /빈 웹앱/);
  assert.match(studio, /안내 카드/);
  assert.match(studio, /활동 체크/);
  assert.match(studio, /나의 기록/);
  assert.match(studio, /일반 버튼/);
  assert.match(studio, /AI 챗봇/);
  assert.match(model, /AI 캠프 1일차/);
  assert.match(model, /오늘의 미션/);
  assert.match(model, /1일차 활동/);
  assert.match(model, /오늘의 배움 기록/);
  assert.match(model, /오늘 숙제/);
  assert.match(model, /내일 준비물/);
  assert.match(model, /AI에게 질문해 보기/);
  assert.match(phone, /toggleChecklistItem/);
  assert.match(phone, /saveJournal/);
  assert.match(phone, /my-webapp-record/);
  assert.match(phone, /AI 챗봇 열기/);
  assert.match(phone, /submitQuestion/);
  assert.match(blocks, /활동을 체크했을 때/);
  assert.match(blocks, /기록을 저장했을 때/);
  assert.match(blocks, /AI 챗봇에게 물었을 때/);
  assert.doesNotMatch(implementation, /모아랩|광주 길동무/);
});

test("uses Korean metadata and the standard Vercel Next.js runtime", async () => {
  const [layout, packageJson] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /<html lang="ko"/);
  assert.match(layout, /나만의 웹앱 만들기/);
  assert.match(packageJson, /"build": "next build"/);
  assert.doesNotMatch(
    packageJson,
    /vinext|wrangler|cloudflare|react-loading-skeleton/i,
  );
  await assert.rejects(access(new URL(".openai/hosting.json", root)));
});
