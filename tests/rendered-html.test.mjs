import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("starts with a blank App Inventor-style web app project", async () => {
  const [studio, phone, model] = await Promise.all([
    readFile(
      new URL("../app/components/chatbot-studio.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../app/components/phone-preview.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../lib/chatbot-studio.ts", import.meta.url), "utf8"),
  ]);

  assert.match(studio, /AI WEB APP LAB/);
  assert.match(studio, /나만의 웹앱 만들기/);
  assert.match(studio, /디자이너/);
  assert.match(studio, /블록/);
  assert.match(studio, /팔레트/);
  assert.match(studio, /컴포넌트/);
  assert.match(studio, /속성/);
  assert.match(studio, /my-webapp-inventor-project-v3/);
  assert.match(studio, /application\/x-webapp-component/);
  assert.match(phone, /첫 기능을 추가해 보세요/);
  assert.match(model, /export const DEFAULT_PROJECT = BLANK_PROJECT/);
  assert.ok(
    model.indexOf('id: "blank"') < model.indexOf('id: "camp"'),
    "빈 웹앱이 템플릿 목록의 첫 항목이어야 합니다.",
  );
  assert.match(model, /name: "빈 웹앱"/);
  assert.match(model, /name: "3일 캠프 기록"/);
  assert.match(model, /name: "우리 반 알림장"/);
});

test("provides a persistent 3-day, 12-session printable camp report", async () => {
  const [studio, phone, blocks, camp, model] = await Promise.all([
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
    readFile(
      new URL("../app/components/camp-report.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../lib/chatbot-studio.ts", import.meta.url), "utf8"),
  ]);

  assert.match(model, /campReportEnabled: true/);
  assert.match(studio, /3일 × 하루 4차시/);
  assert.match(studio, /총 12차시/);
  assert.match(studio, /CampReport1/);
  assert.match(phone, /<CampReport/);
  assert.match(camp, /const DAYS = \[1, 2, 3\]/);
  assert.match(camp, /const PERIODS = \[1, 2, 3, 4\]/);
  assert.match(camp, /배운 내용과 활동/);
  assert.match(camp, /느낀 점/);
  assert.match(camp, /3일 캠프 전체 소감/);
  assert.match(camp, /accept="image\/\*"/);
  assert.match(camp, /capture="environment"/);
  assert.match(camp, /canvas\.toDataURL/);
  assert.match(camp, /my-webapp-camp-report-v1/);
  assert.match(camp, /window\.print\(\)/);
  assert.match(camp, /print-report/);
  assert.match(blocks, /12차시 기록을 이 휴대폰에 자동 저장하기/);
  assert.match(blocks, /3일·12차시 활동 보고서 만들기/);
});

test("runs only student-authored chatbot questions and answers", async () => {
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
  const chatbotImplementation = [studio, phone, blocks, model].join("\n");

  assert.match(studio, /내 질문과 답/);
  assert.match(studio, /질문과 답 추가/);
  assert.match(phone, /내가 만든 질문·답만 사용해요/);
  assert.match(phone, /matched\?\.response \?\? project\.fallbackResponse/);
  assert.match(model, /아직 내가 답을 만들지 않은 질문/);
  assert.match(blocks, /내가 만든 답/);
  assert.doesNotMatch(
    chatbotImplementation,
    /api\.openai\.com|OPENAI_API_KEY|generateText|chat\.completions/i,
  );
});

test("saves and installs every student project as its own phone web app", async () => {
  const [
    studio,
    player,
    installer,
    manifestRoute,
    savedWebApps,
    serviceWorker,
    layout,
  ] =
    await Promise.all([
      readFile(
        new URL("../app/components/chatbot-studio.tsx", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL("../app/components/webapp-player.tsx", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL("../app/components/pwa-install.tsx", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL("../app/api/webapp-manifest/route.ts", import.meta.url),
        "utf8",
      ),
      readFile(new URL("../lib/saved-webapps.ts", import.meta.url), "utf8"),
      readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
      readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    ]);

  assert.match(studio, /saveCurrentAsWebApp/);
  assert.match(studio, /내 웹앱 보관함|SavedWebAppLibrary/);
  assert.match(studio, /내 웹앱으로 저장/);
  assert.match(studio, /searchParams\.set\("app", savedApp\.id\)/);
  assert.match(studio, /runMode === "saved"/);
  assert.match(studio, /<WebAppPlayer/);
  assert.match(player, /<PwaInstallButton/);
  assert.match(savedWebApps, /my-webapp-project-v1:/);
  assert.match(savedWebApps, /crypto\.randomUUID/);
  assert.match(savedWebApps, /saveWebApp/);
  assert.match(savedWebApps, /listSavedWebApps/);
  assert.match(installer, /api\/webapp-manifest/);
  assert.match(installer, /student-webapp-manifest/);
  assert.match(installer, /‘\{appName\}’ 설치/);
  assert.match(installer, /beforeinstallprompt/);
  assert.match(installer, /serviceWorker\.register\("\/sw\.js"\)/);
  assert.match(installer, /홈 화면에 추가/);
  assert.match(manifestRoute, /id: `\/student-webapps\/\$\{id\}`/);
  assert.match(manifestRoute, /start_url: `\/\?run=saved&app=\$\{encodeURIComponent\(id\)\}`/);
  assert.match(manifestRoute, /display: "standalone"/);
  assert.match(serviceWorker, /my-webapp-shell-v2/);
  assert.doesNotMatch(layout, /manifest:/);
});

test("ships printable four-page worksheets for all three school levels", async () => {
  const worksheetPaths = [
    "../public/webapp-planning-worksheet-elementary.pdf",
    "../public/webapp-planning-worksheet-middle.pdf",
    "../public/webapp-planning-worksheet-high.pdf",
  ];
  const [studio, worksheetPage, ...worksheetFiles] = await Promise.all([
    readFile(
      new URL("../app/components/chatbot-studio.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../app/worksheets/page.tsx", import.meta.url), "utf8"),
    ...worksheetPaths.flatMap((path) => [
      readFile(new URL(path, import.meta.url)),
      stat(new URL(path, import.meta.url)),
    ]),
  ]);

  assert.match(studio, /웹앱 기획 활동지/);
  assert.match(studio, /\/worksheets/);
  assert.match(worksheetPage, /초등학생용/);
  assert.match(worksheetPage, /중학생용/);
  assert.match(worksheetPage, /고등학생용/);

  for (let index = 0; index < worksheetFiles.length; index += 2) {
    const worksheet = worksheetFiles[index];
    const worksheetInfo = worksheetFiles[index + 1];
    assert.equal(worksheet.subarray(0, 5).toString(), "%PDF-");
    assert.ok(worksheetInfo.size > 50_000);
  }
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
