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
    serviceWorkerRegistration,
    studioManifest,
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
      readFile(
        new URL("../app/components/service-worker.tsx", import.meta.url),
        "utf8",
      ),
      readFile(new URL("../app/manifest.ts", import.meta.url), "utf8"),
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
  assert.match(installer, /‘\{appName\}’ 설치/);
  assert.match(installer, /beforeinstallprompt/);
  assert.match(installer, /홈 화면에 추가/);
  // 학생 웹앱을 실행하는 동안에는 문서의 매니페스트 링크를 나중에 추가되는 것까지
  // 그 웹앱 것으로 바꿔 두고, 편집 화면으로 돌아갈 때 원래대로 되돌립니다.
  assert.match(installer, /link\[rel="manifest"\]/);
  assert.match(installer, /claimedManifests/);
  assert.match(installer, /new MutationObserver/);
  assert.match(installer, /restoreDocumentMetadata/);
  assert.match(serviceWorkerRegistration, /serviceWorker\.register\("\/sw\.js"\)/);
  assert.match(manifestRoute, /id: `\/student-webapps\/\$\{id\}`/);
  assert.match(manifestRoute, /display: "standalone"/);

  // 홈 화면에 설치한 앱은 브라우저와 저장 공간이 달라(특히 아이폰) 저장해 둔
  // 내용을 못 읽습니다. 그래서 설계 내용을 시작 주소에 함께 실어 보냅니다.
  assert.match(manifestRoute, /start_url: `\/\?\$\{startUrl\.toString\(\)\}`/);
  assert.match(manifestRoute, /startUrl\.set\("project", project\)/);
  assert.match(manifestRoute, /MAX_PROJECT_LENGTH/);
  assert.match(manifestRoute, /BASE64\.test\(requestedProject\)/);
  assert.match(installer, /project: encodedProject/);
  assert.match(player, /project=\{project\}/);
  // 설치한 앱 안에서 고친 내용을 시작 주소가 되돌리면 안 됩니다.
  assert.match(studio, /const seedOnly = runMode === "saved"/);
  assert.match(studio, /if \(sharedProject && seedOnly && nextAppId\)|sharedProject && seedOnly && nextAppId/);
  assert.match(manifestRoute, /icon-192\.png/);
  assert.match(manifestRoute, /purpose: "maskable"/);
  assert.match(serviceWorker, /my-webapp-shell-v3/);
  assert.match(serviceWorker, /icon-maskable-512\.png/);

  // 제작 도구 자체도 갤럭시에서 ‘앱 설치’가 뜨고 아이폰에서 홈 화면 아이콘이
  // 제대로 나오도록 매니페스트와 PNG 아이콘을 갖춥니다.
  assert.match(studioManifest, /display: "standalone"/);
  assert.match(studioManifest, /start_url: "\/"/);
  assert.match(studioManifest, /sizes: "192x192"/);
  assert.match(studioManifest, /sizes: "512x512"/);
  assert.match(studioManifest, /purpose: "maskable"/);
  assert.match(layout, /apple-touch-icon\.png/);
  assert.match(layout, /<ServiceWorkerRegistration \/>/);

  for (const icon of [
    "icon-192.png",
    "icon-512.png",
    "icon-maskable-512.png",
    "apple-touch-icon.png",
  ]) {
    const file = await stat(new URL(`public/${icon}`, root));
    assert.ok(file.size > 0, `${icon} 아이콘 파일이 있어야 합니다.`);
  }
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

test("keeps the editor and saved web apps responsive across device sizes", async () => {
  const [studio, styles] = await Promise.all([
    readFile(
      new URL("../app/components/chatbot-studio.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(styles, /@media \(max-width: 1360px\)/);
  assert.match(styles, /@media \(max-width: 1160px\)/);
  assert.match(styles, /@media \(max-width: 960px\)/);
  assert.match(styles, /@media \(max-width: 760px\)/);
  assert.match(styles, /@media \(max-width: 430px\)/);
  assert.match(styles, /\.mobile-panel-tabs\.blocks-tabs/);
  assert.match(styles, /min-height: 100dvh/);
  assert.match(styles, /env\(safe-area-inset-bottom\)/);
  assert.match(
    styles,
    /@media \(max-width: 600px\), \(max-height: 600px\) and \(max-width: 960px\)/,
  );
  assert.match(studio, /window\.innerWidth <= 960/);
  assert.match(studio, /mode === "blocks" \? "blocks-tabs" : ""/);
  assert.match(studio, /\{mode === "designer" && \(/);
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

test("keeps the teacher answer key on the server behind an access code", async () => {
  const [answerKey, renderer, route, gate, settings, worksheets] =
    await Promise.all([
      readFile(
        new URL("app/api/teacher-answers/answer-key.ts", root),
        "utf8",
      ),
      readFile(new URL("app/api/teacher-answers/render.ts", root), "utf8"),
      readFile(new URL("app/api/teacher-answers/route.ts", root), "utf8"),
      readFile(
        new URL("app/components/teacher-answer-download.tsx", root),
        "utf8",
      ),
      readFile(new URL("app/settings/page.tsx", root), "utf8"),
      readFile(new URL("app/worksheets/page.tsx", root), "utf8"),
    ]);

  // 학년군 3종과 활동지 12종, 지도 포인트, 평가 기준표가 모두 들어 있어야 합니다.
  assert.match(answerKey, /tone: "elementary"/);
  assert.match(answerKey, /tone: "middle"/);
  assert.match(answerKey, /tone: "high"/);
  assert.equal((answerKey.match(/order: "\d\/4"/g) ?? []).length, 12);
  assert.equal((answerKey.match(/rubric: \[/g) ?? []).length, 3);
  assert.match(renderer, /지도 포인트/);
  assert.match(renderer, /escapeHtml/);

  // 코드 검사는 서버에서, 값은 환경 변수에서만 읽습니다.
  assert.match(route, /process\.env\.TEACHER_ADMIN_CODE/);
  assert.match(route, /process\.env\.TEACHER_ACCESS_CODE/); // 예전 이름도 인정
  assert.match(route, /process\.env\.TEACHER_INSTRUCTOR_CODE/);
  assert.match(route, /timingSafeEqual/);
  assert.match(route, /"Cache-Control": "no-store"/);
  assert.match(route, /export async function POST/);
  assert.doesNotMatch(route, /export async function GET/);
  // 운영자 코드는 소스에 박혀 있으면 안 됩니다.
  assert.doesNotMatch(answerKey, /TEACHER_ADMIN_CODE\s*=/);
  assert.doesNotMatch(gate, /TEACHER_ADMIN_CODE/);

  // 강사 코드는 운영자로 확인했을 때만 응답에 실립니다.
  assert.match(route, /role === "admin" \? codes\.instructor : undefined/);
  assert.match(route, /DEFAULT_INSTRUCTOR_CODE = "1234"/);
  // 기본 강사 코드는 클라이언트 코드에 값으로 들어 있으면 안 됩니다.
  assert.doesNotMatch(gate, /"1234"/);
  assert.match(gate, /instructorCodeIsDefault/);

  // 답안 원본은 라우트와 렌더러 외 어디에서도 불러오지 않아야 합니다.
  // 클라이언트 컴포넌트가 import하면 브라우저 번들에 실려 학생에게 노출됩니다.
  assert.doesNotMatch(gate, /from "[^"]*answer-key"/);
  assert.doesNotMatch(settings, /from "[^"]*answer-key"/);
  assert.match(route, /from "\.\/render"/);
  assert.match(renderer, /from "\.\/answer-key"/);

  // 크로뮴이 한글 download 속성을 버리므로 파일 이름은 영문이어야 합니다.
  const download = gate.match(/link\.download = "([^"]+)"/);
  assert.ok(download, "다운로드 파일 이름을 지정해야 합니다.");
  assert.match(download[1], /^[\x20-\x7e]+\.html$/);

  // 교사용 화면은 검색에 노출되지 않고, 활동지 화면에서 찾아갈 수 있어야 합니다.
  assert.match(settings, /robots: \{ index: false, follow: false \}/);
  assert.match(settings, /<TeacherAnswerDownload \/>/);
  assert.match(worksheets, /href="\/settings"/);
});

test("stores class submissions in Supabase from the server only", async () => {
  const [route, client, schema, submit, roster, studio] = await Promise.all([
    readFile(new URL("app/api/class-webapps/route.ts", root), "utf8"),
    readFile(new URL("app/api/class-webapps/supabase.ts", root), "utf8"),
    readFile(new URL("supabase/schema.sql", root), "utf8"),
    readFile(new URL("app/components/class-submit.tsx", root), "utf8"),
    readFile(new URL("app/components/class-roster.tsx", root), "utf8"),
    readFile(new URL("app/components/chatbot-studio.tsx", root), "utf8"),
  ]);

  // 서비스 키는 서버에서만 읽고, 화면 코드에는 절대 들어가면 안 됩니다.
  assert.match(client, /process\.env\.SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(client, /process\.env\.SUPABASE_URL/);
  for (const clientFile of [submit, roster, studio]) {
    assert.doesNotMatch(clientFile, /SUPABASE_SERVICE_ROLE_KEY/);
    assert.doesNotMatch(clientFile, /from "[^"]*api\/class-webapps\/supabase"/);
  }

  // 반 전체 조회는 교사 코드가 있어야 합니다.
  assert.match(route, /action === "class"/);
  assert.match(route, /teacherCodes\(\)\.includes\(code\)/);
  assert.match(route, /교사 코드가 올바르지 않습니다/);
  // 학생 본인 조회·저장에는 반 코드와 이름이 필요합니다.
  assert.match(route, /CLASS_CODE\.test\(classCode\)/);
  assert.match(route, /normalizeProject\(body\.project\)/);
  // 키가 없으면 기능을 꺼 두고 503으로 알려 줍니다.
  assert.match(route, /readConfig\(\)\.ready/);
  assert.match(route, /503/);

  // 같은 학생이 같은 웹앱을 다시 내면 덮어써야 합니다.
  assert.match(client, /on_conflict=class_code,student_name,app_id/);
  assert.match(client, /resolution=merge-duplicates/);
  assert.match(schema, /unique \(class_code, student_name, app_id\)/);
  assert.match(schema, /enable row level security/);
});

test("grows the phone preview to fill the stage on wide screens", async () => {
  const [hook, studio, css] = await Promise.all([
    readFile(new URL("app/components/use-phone-scale.ts", root), "utf8"),
    readFile(new URL("app/components/chatbot-studio.tsx", root), "utf8"),
    readFile(new URL("app/globals.css", root), "utf8"),
  ]);

  // 휴대폰 비율을 지켜야 실제 기기와 같은 모습이 유지됩니다.
  assert.match(hook, /PHONE_WIDTH = 330/);
  assert.match(hook, /PHONE_HEIGHT = 674/);
  assert.match(hook, /Math\.min\(/);
  assert.match(hook, /MAX_SCALE/);
  // 좁은 화면은 기존 반응형 규칙이 그대로 맡습니다.
  assert.match(hook, /window\.innerWidth < WIDE_FROM/);
  assert.match(hook, /removeProperty\("--phone-scale"\)/);
  // 무대는 불러오기가 끝난 뒤 그려지므로 콜백 ref로 붙는 순간을 잡습니다.
  assert.match(hook, /new ResizeObserver\(apply\)/);
  assert.match(hook, /const setStage = useCallback\(/);
  // 여백이 화면 폭마다 달라도 실제 값을 읽어 계산합니다.
  assert.match(hook, /getComputedStyle\(stage\)/);

  assert.match(studio, /const phoneStageRef = usePhoneScale\(\)/);
  assert.match(studio, /ref=\{phoneStageRef\}/);
  assert.match(css, /transform: scale\(var\(--phone-scale, 1\)\)/);
  assert.match(css, /@media \(min-width: 1161px\)/);
});
