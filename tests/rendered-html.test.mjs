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
  const [studio, phone, blocks, camp, model, image, store] = await Promise.all([
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
    readFile(new URL("../lib/image.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/runtime-store.ts", import.meta.url), "utf8"),
  ]);

  assert.match(model, /campReportEnabled: true/);
  assert.match(studio, /3일 × 하루 4차시/);
  assert.match(studio, /총 12차시/);
  assert.match(studio, /CampReport1/);
  assert.match(phone, /<CampReport/);
  assert.match(camp, /const DAYS = \[1, 2, 3\]/);
  assert.match(camp, /const PERIODS = \[1, 2, 3, 4\]/);
  assert.match(camp, /배운 내용과 활동/);
  assert.match(camp, /3일 캠프 전체 소감/);
  assert.match(camp, /accept="image\/\*"/);
  assert.match(camp, /capture="environment"/);
  // 사진 줄이기는 lib/image.ts로 옮겼고, 저장 자리는 lib/runtime-store.ts가 정합니다.
  assert.match(image, /canvas\.toDataURL/);
  assert.match(camp, /from "\.\.\/\.\.\/lib\/image"/);
  assert.match(store, /my-webapp-camp-report-v2:/);
  // 예전 이름 기반 자리는 한 번 옮겨 오는 용도로만 남습니다.
  assert.match(store, /my-webapp-camp-report-v1:/);
  assert.doesNotMatch(camp, /\$\{project\.title\}/);
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
  const [route, auth, client, schema, submit, roster, studio] =
    await Promise.all([
      readFile(new URL("app/api/class-webapps/route.ts", root), "utf8"),
      readFile(new URL("app/api/teacher-auth.ts", root), "utf8"),
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
  assert.match(route, /checkTeacherCode\(request, /);
  assert.match(auth, /교사 코드가 올바르지 않습니다/);
  // 학생 이름·사진이 오가는 곳이라 코드 비교는 상수 시간이고 시도 횟수를 셉니다.
  assert.match(auth, /timingSafeEqual/);
  assert.match(auth, /MAX_ATTEMPTS/);
  // 널리 알려진 기본 코드로는 절대 열리면 안 됩니다.
  assert.doesNotMatch(auth, /"1234"/);
  assert.doesNotMatch(route, /"1234"/);
  assert.match(auth, /TEACHER_INSTRUCTOR_CODE \?\? ""/);
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

test("lets students write to-dos, reorder cards, and keep typing with Enter", async () => {
  const [studio, phone, model] = await Promise.all([
    readFile(new URL("app/components/chatbot-studio.tsx", root), "utf8"),
    readFile(new URL("app/components/phone-preview.tsx", root), "utf8"),
    readFile(new URL("lib/chatbot-studio.ts", root), "utf8"),
  ]);

  // 속성 판의 체크 항목 칸: 빈 줄을 지우면 엔터로 줄을 못 바꿉니다.
  // 화면에는 적은 그대로 두고, 웹앱에 넣을 때만 빈 줄을 걸러야 합니다.
  assert.match(studio, /checklistDraft/);
  assert.match(studio, /setChecklistDraft\(lines\.join\("\\n"\)\)/);
  assert.match(studio, /value=\{checklistText\}/);

  // 실행 화면에서 쓰는 사람이 직접 할 일을 적고(엔터 포함) 지울 수 있습니다.
  assert.match(phone, /addCustomItem/);
  assert.match(phone, /removeCustomItem/);
  assert.match(phone, /className="checklist-add"/);
  assert.match(phone, /onSubmit=\{\(event\) => \{/);
  assert.match(phone, /할 일을 적고 엔터를 눌러요/);
  // 직접 적은 할 일도 기기에 저장되어 다시 열어도 남습니다.
  assert.match(phone, /JSON\.stringify\(\{ checkedItems, customItems, journalText \}\)/);

  // 기능 카드 순서는 모델에 저장되고, 미리보기와 컴포넌트 목록이 함께 따릅니다.
  assert.match(model, /featureOrder: FeatureKind\[\]/);
  assert.match(model, /DEFAULT_FEATURE_ORDER/);
  assert.match(phone, /project\.featureOrder\.map/);
  assert.match(studio, /reorderFeature/);
  assert.match(studio, /featureReorderProps/);
  assert.match(studio, /application\/x-webapp-reorder/);
});

test("collects camp records for the teacher and shares apps by QR", async () => {
  const [camp, roster, viewer, route, schema, studio, qr, preview] =
    await Promise.all([
      readFile(new URL("app/components/camp-report.tsx", root), "utf8"),
      readFile(new URL("app/components/class-roster.tsx", root), "utf8"),
      readFile(new URL("app/components/record-viewer.ts", root), "utf8"),
      readFile(new URL("app/api/class-webapps/route.ts", root), "utf8"),
      readFile(new URL("supabase/schema.sql", root), "utf8"),
      readFile(new URL("app/components/chatbot-studio.tsx", root), "utf8"),
      readFile(new URL("app/components/share-qr.tsx", root), "utf8"),
      readFile(new URL("app/components/phone-preview.tsx", root), "utf8"),
    ]);

  // 학생이 휴대폰에서 쓴 캠프 기록을 반 코드로 선생님께 보냅니다.
  assert.match(camp, /선생님께 보내기/);
  assert.match(camp, /action: "save-record"/);
  assert.match(camp, /record: report/);
  // 교사는 반별로 모인 기록을 인쇄용 문서로 봅니다.
  assert.match(roster, /action: "records"/);
  assert.match(roster, /buildRecordsHtml/);
  assert.match(viewer, /캠프 전체 소감/);
  assert.match(viewer, /window\.print\(\)/);
  // 사진은 데이터 주소 형식일 때만 문서에 넣습니다.
  // 사진은 형식 전체를 확인하고, 속성에 넣을 때도 이스케이프합니다. 접두사만 보면
  // `data:image/png;" onerror="…` 같은 값이 따옴표를 빠져나갑니다.
  assert.match(viewer, /PHOTO_DATA_URL\.test\(value\)/);
  assert.match(viewer, /src="\$\{escapeHtml\(session\.photo\)\}"/);
  assert.doesNotMatch(viewer, /startsWith\("data:image\/"\)/);
  assert.match(viewer, /escapeHtml/);
  // 서버는 교사 코드 없이 반 전체 기록을 주지 않고, 지나친 크기를 거릅니다.
  assert.match(route, /action === "save-record"/);
  assert.match(route, /action === "records"/);
  assert.match(route, /4_000_000/);
  assert.match(schema, /class_records/);
  assert.match(schema, /unique \(class_code, student_name\)/);

  // QR: 찍으면 설치 화면이 열리는 공유 주소를 담습니다.
  assert.match(studio, /showShareQr/);
  assert.match(studio, /<ShareQrDialog/);
  assert.match(qr, /QRCode\.toDataURL/);
  assert.match(qr, /errorCorrectionLevel: "L"/);
  assert.match(qr, /홈 화면에 추가/);

  // 편집 화면에서는 기능 카드를 직접 끌어 순서를 바꿉니다.
  assert.match(preview, /feature-slot/);
  assert.match(preview, /onReorder\(moving, kind\)/);
  assert.match(studio, /onReorder=\{reorderFeature\}/);
});

test("keeps install guidance visible above the blurred toolbar", async () => {
  const [installer, css] = await Promise.all([
    readFile(new URL("app/components/pwa-install.tsx", root), "utf8"),
    readFile(new URL("app/globals.css", root), "utf8"),
  ]);

  // 툴바의 backdrop-filter가 fixed의 기준을 툴바로 바꿔 안내가 화면 밖에
  // 그려졌습니다. 안내는 body에 직접 붙여야 합니다.
  assert.match(installer, /createPortal/);
  assert.match(installer, /document\.body/);
  // 브라우저 설치 확인창이 떠 있는 동안 시선을 위로 이끕니다.
  assert.match(installer, /pwa-install-pointer/);
  assert.match(css, /\.pwa-install-help \{\n  position: fixed;/);
  assert.doesNotMatch(css, /\.pwa-install-help \{\n  position: absolute;/);
});

test("builds share and QR links on the public production domain", async () => {
  const [model, studio] = await Promise.all([
    readFile(new URL("lib/chatbot-studio.ts", root), "utf8"),
    readFile(new URL("app/components/chatbot-studio.tsx", root), "utf8"),
  ]);

  // Vercel의 배포별 주소는 로그인 보호가 걸려 학생이 열 수 없습니다.
  // 어떤 주소로 접속했든 링크는 공개 주소로 만들어져야 합니다.
  assert.match(model, /canonicalShareOrigin/);
  assert.match(model, /NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL/);
  // 공유와 QR은 같은 buildShareUrl을 쓰므로 공개 주소 사용은 한 곳에 모입니다.
  assert.match(studio, /new URL\("\/", canonicalShareOrigin\(\)\)/);
  assert.match(studio, /const \{ url \} = await buildShareUrl\(\)/);
  assert.match(studio, /const \{ url, code \} = await buildShareUrl\(\)/);
});

test("keeps QR codes sparse with server-stored share codes", async () => {
  const [studio, shareRoute, client, schema, qr] = await Promise.all([
    readFile(new URL("app/components/chatbot-studio.tsx", root), "utf8"),
    readFile(new URL("app/api/share/route.ts", root), "utf8"),
    readFile(new URL("app/api/class-webapps/supabase.ts", root), "utf8"),
    readFile(new URL("supabase/schema.sql", root), "utf8"),
    readFile(new URL("app/components/share-qr.tsx", root), "utf8"),
  ]);

  // 내용을 서버에 저장하고 짧은 코드만 담아야 QR이 성겨져 잘 읽힙니다.
  assert.match(studio, /buildShareUrl/);
  assert.match(studio, /searchParams\.set\("sid", json\.id\)/);
  // 저장소가 없으면 내용을 통째로 담은 긴 링크로 대체합니다.
  assert.match(studio, /url\.searchParams\.set\("project", encodeProject\(project\)\)/);
  // 링크를 여는 쪽은 짧은 코드로 서버에서 내용을 받아 옵니다.
  assert.match(studio, /action: "get", id: sid/);
  assert.match(shareRoute, /normalizeProject/);
  assert.match(shareRoute, /randomInt/);
  assert.match(client, /shared_webapps/);
  assert.match(schema, /shared_webapps/);
  // QR 여백은 규격(4모듈)을 지켜야 화면 반사 속에서도 경계를 찾습니다.
  assert.match(qr, /margin: 4,/);
});

test("offers a six-digit code path when QR scanning fails", async () => {
  const [route, receive, studio, qr, health] = await Promise.all([
    readFile(new URL("app/api/share/route.ts", root), "utf8"),
    readFile(new URL("app/components/code-receive.tsx", root), "utf8"),
    readFile(new URL("app/components/chatbot-studio.tsx", root), "utf8"),
    readFile(new URL("app/components/share-qr.tsx", root), "utf8"),
    readFile(new URL("app/api/health/route.ts", root), "utf8"),
  ]);

  // 새 공유 코드는 손으로 넣을 수 있는 6자리 숫자이고, 예전 12자 코드도 열립니다.
  assert.match(route, /randomInt\(100000, 1000000\)/);
  assert.match(route, /\\d\{6\}|d\{6\}/);
  assert.match(route, /SUPABASE_409/);
  // QR 대화 상자에 번호가 크게 보이고, 학생은 편집 화면에서 번호로 받습니다.
  assert.match(qr, /qr-code-alt/);
  assert.match(receive, /번호로 앱 받기/);
  assert.match(receive, /run=install&sid=/);
  assert.match(studio, /<CodeReceive \/>/);
  // 점검 주소는 표가 만들어졌는지도 알려 줍니다.
  assert.match(health, /probeTables/);
});

test("lets students take or pick photos and see upload errors", async () => {
  const camp = await readFile(
    new URL("app/components/camp-report.tsx", root),
    "utf8",
  );

  // capture가 박힌 입력 하나만 있으면 휴대폰에서 카메라만 열리고 앨범을 못 씁니다.
  assert.match(camp, /카메라로 찍기/);
  assert.match(camp, /앨범에서 고르기/);
  assert.equal(
    (camp.match(/capture="environment"/g) ?? []).length,
    1,
    "capture는 ‘카메라로 찍기’ 입력에만 있어야 합니다.",
  );
  // 사진 오류는 해당 칸 바로 밑에 보여야 학생이 알아챕니다.
  assert.match(camp, /camp-photo-error/);
  assert.match(camp, /setPhotoError\(\{/);
});

test("reads Supabase responses that have no body", async () => {
  const client = await readFile(
    new URL("app/api/class-webapps/supabase.ts", root),
    "utf8",
  );

  // Prefer: return=minimal이면 201에 본문이 없습니다. 바로 json()을 부르면
  // 저장에 성공하고도 예외가 나서, QR이 조용히 긴 링크로 대체됐습니다.
  assert.match(client, /const text = await response\.text\(\)/);
  assert.match(client, /if \(!text\) return null/);
  assert.doesNotMatch(client, /return response\.json\(\);/);
});

test("records activities per session and reflection only at the end", async () => {
  const [camp, studio, viewer] = await Promise.all([
    readFile(new URL("app/components/camp-report.tsx", root), "utf8"),
    readFile(new URL("app/components/chatbot-studio.tsx", root), "utf8"),
    readFile(new URL("app/components/record-viewer.ts", root), "utf8"),
  ]);

  // 차시에는 활동과 사진만 적고, 느낀 점은 마지막에 한 번만 씁니다.
  assert.doesNotMatch(camp, /placeholder=\{project\.campReflectionPrompt\}/);
  assert.doesNotMatch(camp, /reflection: event\.target\.value/);
  assert.match(camp, /camp-final-reflection/);
  assert.match(camp, /placeholder=\{project\.campFinalPrompt\}/);
  // 완료 판정도 활동과 사진만 봅니다.
  assert.doesNotMatch(camp, /entry\.reflection\.trim\(\)/);
  // 이제 쓰이지 않는 차시별 안내 문구 입력은 속성 판에서 뺐습니다.
  assert.doesNotMatch(studio, /campReflectionPrompt/);
  // 교사 문서는 예전에 적어 둔 느낀 점이 있으면 잃지 않고 보여 줍니다.
  assert.match(viewer, /session\.reflection\?\.trim\(\)/);
});

test("shows every class at once without typing a class code", async () => {
  const [route, client, roster] = await Promise.all([
    readFile(new URL("app/api/class-webapps/route.ts", root), "utf8"),
    readFile(new URL("app/api/class-webapps/supabase.ts", root), "utf8"),
    readFile(new URL("app/components/class-roster.tsx", root), "utf8"),
  ]);

  // 반 목록은 반 코드 없이 교사 코드만으로 부르고, 코드가 틀리면 거절합니다.
  assert.match(route, /action === "classes"/);
  assert.match(
    route,
    /if \(action === "classes"\)[\s\S]{0,220}checkTeacherCode\(request, /,
  );
  // 사진이 든 본문은 빼고 요약만 읽어 와야 반이 많아도 가볍습니다.
  assert.match(client, /select: "class_code,student_name,updated_at"/);
  assert.doesNotMatch(client, /listClassSummaries[\s\S]{0,400}select: "[^"]*project/);
  // 화면에서는 목록이 먼저 뜨고, 눌러서 바로 엽니다.
  assert.match(roster, /class-list/);
  assert.match(roster, /load\(undefined, entry\.classCode\)/);
  assert.match(roster, /studentCount/);
  assert.match(roster, /recordCount/);
});
