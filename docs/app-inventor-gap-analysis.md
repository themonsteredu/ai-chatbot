# App Inventor 대비 기능 격차 분석

작성일: 2026-08-19 · 대상 커밋: `6bb4913`

> **상태: 해소됨.** 아래는 진단 시점의 기록입니다. 근본 원인 세 가지와 치명적
> 결함 두 가지는 이후 작업으로 고쳤고, 실제 브라우저에서 확인했습니다.
>
> | 진단 | 지금 |
> | --- | --- |
> | 원인 ① 인스턴스 개념 없음 | 부품 트리로 전환. 같은 부품 여러 개·이름 변경·복제·배치 안에 넣기 |
> | 원인 ② 블록이 그림 | 학생이 조립하는 진짜 블록. 부품 간 상호작용·변수·조건·반복 |
> | 원인 ③ 팔레트가 완성품 | 네 갈래 16종. 글자·사진·입력창·체크박스·스위치·슬라이더·목록·구분선·가로/세로 배치 |
> | 꾸미기 자유도 | 모든 부품이 글자 크기·굵기·색·정렬·배경·여백·너비·보이기 |
> | 되돌리기 없음 | `Ctrl+Z` / `Ctrl+Shift+Z` |
> | 결함 A 이름 바꾸면 기록 소실 | 저장 키가 `appId` 기준. 예전 기록은 처음 열 때 옮겨 옴 |
> | 결함 B 교사 화면 XSS | 사진 형식 전체 검사 + 이스케이프 |
> | 결함 C 교사 코드 `1234` | 코드를 설정해야만 열림. 상수 시간 비교 + 시도 횟수 제한 |
>
> 예전(v3) 프로젝트는 그대로 열립니다. 열 때 트리로 옮겨지고, 코드에 박혀 있던
> 버튼 동작은 학생이 고칠 수 있는 블록이 됩니다.
>
> 아직 남은 것: 다중 화면(Screen2), 프로젝트 파일 내보내기·가져오기,
> 앱별 아이콘.

---

## 0. 한 줄 결론

**껍데기는 App Inventor인데, 알맹이는 설문지다.**

팔레트 / 뷰어 / 컴포넌트 트리 / 속성 4분할, 디자이너↔블록 탭, `Screen1` 라벨,
`NoticeCard1` 같은 컴포넌트 이름까지 App Inventor를 충실히 모사했다. 그런데 학생이
실제로 하는 일은 **미리 정해진 6개 기능을 켜고 끄고, 그 안의 글자를 바꾸는 것**뿐이다.
조립(assembly)이 아니라 빈칸 채우기(fill-in-the-blank)다.

"뭔가 아쉽다"는 체감은 UI 디테일 문제가 아니라 **데이터 모델의 문제**에서 나온다.

---

## 1. 근본 원인 세 가지

### 원인 ① 컴포넌트 "인스턴스"라는 개념 자체가 없다

`lib/chatbot-studio.ts:24-58`의 `WebAppProject`는 트리가 아니라 **평평한 레코드**다.

```ts
export type WebAppProject = {
  noticeEnabled: boolean;   noticeTitle: string;   noticeBody: string;
  checklistEnabled: boolean; checklistTitle: string; checklistItems: ChecklistItem[];
  journalEnabled: boolean;  ...
  buttonEnabled: boolean;   buttonLabel: string;   buttonMessage: string;
  chatbotEnabled: boolean;  ...
  featureOrder: FeatureKind[];   // 6칸짜리 1차원 순서 배열
};
```

기능 6종이 각각 **불리언 스위치 하나**다. 그래서 팔레트에서 부품을 추가한다는 것이
`chatbot-studio.tsx:459-470`에서 이렇게 구현된다:

```ts
const choosePaletteItem = (kind: PaletteKind) => {
  const enabledKey = featureEnabledKey[kind];
  setProject((current) => ({ ...current, [enabledKey]: true }));   // ← 그냥 true
  ...
};
```

**결과로 생기는 제약:**

| 하고 싶은 것 | 현재 | 이유 |
|---|---|---|
| 버튼 3개 놓기 | 불가 — 1개 고정 | `buttonEnabled`가 불리언이라 두 번째 인스턴스를 표현할 자리가 없음 |
| 안내 카드 2개 | 불가 | 위와 동일 |
| 부품 이름 바꾸기 | 불가 | `"NoticeCard1"`은 JSX 안의 **문자열 리터럴** (`:1661`). `1`은 장식 |
| 같은 부품 복제 | 불가 | 복사/붙여넣기/복제 기능 없음 |
| 부품을 다른 부품 안에 넣기 | 불가 | 컨테이너(가로배치/세로배치)가 없음. 트리의 들여쓰기는 CSS 클래스뿐 (`:1883-1885`) |
| 드래그해서 원하는 위치에 놓기 | 불가 | `dropPaletteItem`(`:500-508`)이 **드롭 좌표를 버린다**. 화면 맨 위에 놓든 맨 아래에 놓든 결과가 같음 |

즉 팔레트에서 끌어다 놓는 동작이 **클릭과 완전히 동일**하다. "왼쪽 기능을 이곳으로
끌어 놓으세요"(`:1596-1599`)라는 안내가 실제 동작보다 많은 것을 약속하고 있다.

한 가지 예외적으로 여러 개를 만들 수 있는 건 **챗봇 질문·답**(`actions[]`, 최대 12개)뿐이다.
이게 유일하게 "인스턴스"처럼 동작하는 요소라는 점이 시사적이다.

---

### 원인 ② 블록이 코드가 아니라 "그림"이다

`app/components/block-workspace.tsx` 319줄 전체에 `draggable`도, `dataTransfer`도,
드롭 핸들러도, 연결 로직도 **없다**. 모든 블록은 프로젝트 값을 문자열 보간한
하드코딩 JSX다.

```tsx
// block-workspace.tsx:221-242 — '버튼' 블록 스택
{project.buttonEnabled && (
  <article className="block-stack feature-logic-stack" onClick={() => onSelect("button")}>
    <div className="event-block">
      <MousePointerClick size={17} />
      <span><b>{project.buttonLabel}</b> 버튼을 클릭했을 때</span>
    </div>
    <div className="block-connector" aria-hidden="true" />   {/* 장식용 */}
    <div className="action-block blue-block">
      <span><b>“{project.buttonMessage}”</b> 보여 주기</span>
    </div>
  </article>
)}
```

왼쪽 "블록 팔레트"의 칩들도 블록 소스가 아니라 **선택 바로가기 버튼**이다
(`:57-96`, 전부 `onClick={() => onSelect(...)}`). CSS 클래스가 `event` / `condition` /
`value` / `action`으로 Blockly처럼 타입이 있는 척하지만 실제로는 색깔 이름일 뿐이다
(`condition` 칩은 체크리스트 선택, `value` 칩은 기록장 선택).

패널 스스로도 인정하고 있다:

> **기능을 넣으면 블록도 생겨요**
> 디자이너에서 기능을 추가하고, 오른쪽 속성에서 글과 동작을 바꿔 보세요. — `:97-103`

**블록 화면에서 학생이 실제로 만들 수 있는 것은 챗봇 질문·답 추가/순서변경/삭제 3가지뿐**
(`:267-314`). 나머지는 전부 디자이너 토글의 부산물이다.

**따라서 다음이 전부 불가능하다:**

- 변수 (전역/지역) — 개념 자체 없음
- 조건 (만약~라면) — 하드코딩된 챗봇 문장 매칭이 앱 전체의 유일한 분기
- 반복 (각각에 대해 / ~하는 동안)
- 함수/프로시저
- 수·문자·리스트 연산자
- **컴포넌트 간 상호작용** — 버튼이 체크리스트를 건드릴 수 없다. 모든 이벤트의 동작이 자기 자신에게 용접되어 있다
- 화면 이동 (`open another screen`)
- 타이머/센서/위치/사운드

이벤트도 6종이 하드코딩되어 있고, 각 이벤트에 붙는 동작이 **1:1로 고정**이다.
"버튼을 클릭했을 때 → 메시지 보여주기" 말고 다른 걸 시킬 방법이 없다.

---

### 원인 ③ 팔레트가 "UI 부품"이 아니라 "완성된 앱 기능"이다

`chatbot-studio.tsx:98-155`의 팔레트 8종:

| 종류 | 성격 |
|---|---|
| 화면 배경, 앱 머리글 | 항상 존재, 추가/삭제 불가 |
| 안내 카드 | 완성된 기능 |
| 활동 체크 | 완성된 기능 |
| 나의 기록 | 완성된 기능 |
| **3일 캠프 기록** | 완성된 기능 — 3일×4차시=12차시로 **구조 고정** (`camp-report.tsx:45-46`) |
| 일반 버튼 | 준-부품 |
| 나만의 챗봇 | 완성된 기능 |

App Inventor의 팔레트는 `Label` `Button` `TextBox` `Image` `Slider` 같은 **레고 블록**이다.
여기 팔레트는 **이미 조립된 완성품**이다. "알림장"과 "캠프 기록"은 만든 사람이 상상한
바로 그 앱이고, 학생은 그 3가지 조합 밖으로 나갈 수 없다.

그래서 **30명이 만들면 30개가 다 비슷하게 나온다.** 이게 "만들 수 있는 앱이 뻔하다"의
정확한 원인이다.

기본 부품 중 없는 것: 라벨(자유 텍스트), 이미지, 입력창, 체크박스 단품, 스위치,
슬라이더, 목록, 구분선, 가로/세로 배치.

---

## 2. 꾸미기 자유도

`renderProperties()`(`chatbot-studio.tsx:715-1221`)는 기능마다 손으로 쓴 폼이 이어붙은
`if` 체인이다. 앱 전체를 통틀어 **시각 속성은 딱 2개**다:

- `accent` (대표 색) — 프리셋 5개 + 컬러 피커
- `screenBackground` (화면 배경색)

나머지는 전부 글자 입력이다. 부품별로 없는 것:

`Width` / `Height` / `FontSize` / `FontBold` / `TextColor` / `BackgroundColor` /
`AlignHorizontal` / `Visible` / `Enabled` / `Image` / `Shape` / 여백 / 부품 이름 변경

App Inventor의 `Label` 하나가 가진 속성이 약 15개인데, 여기 `AppHeader`는 2개
(`appName`, `subtitle`)다. `Screen1`도 3개(이름, 대표색, 배경색)뿐이다.

### 그 밖의 상한선

| 항목 | 상한 | 위치 |
|---|---|---|
| 챗봇 질문·답 | 12개 | `:404-407`, `lib:282` |
| 체크리스트 항목 | 10개 | `MAX_CHECKLIST_ITEMS` `:76` |
| 가장 긴 자유 입력란 | 220자 (`noticeBody`) | `maxLength` |
| 실행 중 대화 기록 | 최근 4개 | `phone-preview.tsx:230` `slice(-4)` |
| 캠프 기록 구조 | 3일 × 4차시 고정 | `camp-report.tsx:45-46` |
| 화면 | **1개** | 어디에도 `screens` 배열 없음 |

---

## 3. 편집 경험에서 빠진 것

| 기능 | 상태 |
|---|---|
| **되돌리기 / 다시 실행** | **없음.** 히스토리 스택 자체가 없고, `setProject` 직후 이펙트(`:351-358`)가 즉시 localStorage에 기록. 학생이 실수를 되돌릴 방법이 없다 |
| 복사 / 붙여넣기 / 복제 | 없음 |
| 부품 이름 변경 | 없음 |
| Delete 키로 삭제 | 없음. 속성 패널의 빨간 버튼 + `window.confirm`만 |
| 우클릭 메뉴 | 없음 |
| 다중 선택 | 없음 |
| 프로젝트 파일 내보내기/가져오기 (`.aia` 상당) | 없음 |
| 미디어(이미지) 업로드 | 없음 — 사진은 캠프 기록 **실행 중**에만 |
| 화면 추가 | 없음 |

`자동 저장` 칩(`:1301-1304`)은 상태와 연결되지 않은 **정적 장식**이다.

### 트리와 화면의 순서가 어긋난다

컴포넌트 트리는 챗봇을 순서 목록에서 빼고(`:1653`) 항상 맨 아래에 붙인다(`:1727-1737`).
학생이 챗봇을 안내 카드 위로 끌어 올리면 **휴대폰 화면에서는 올라가는데 트리에서는 그대로**다.

---

## 4. 그 밖에 발견한 실제 결함

분석 중 기능 격차와 별개로 **동작하는 버그와 보안 문제**를 확인했다.

### 🔴 A. 프로젝트 이름을 바꾸면 학생 기록이 통째로 사라진다

실행 중 저장되는 모든 데이터가 **`project.title`을 키로** 쓴다:

```ts
phone-preview.tsx:99   `my-webapp-runtime-v1:${project.title}`      // 체크·할일·기록
camp-report.tsx:166    `my-webapp-camp-report-v1:${project.title}`  // 12차시 + 사진
```

그런데 `project.title`은 Screen1 속성에서 **학생이 자유롭게 바꿀 수 있다**(`:1166-1173`).

- 이름을 바꾸면 → 빈 키를 읽게 되어 12차시 기록과 사진이 전부 사라진 것처럼 보인다 (복구 불가)
- 같은 템플릿으로 앱을 2개 만들면 → 기본 이름이 같으므로 **두 앱이 같은 데이터를 공유**한다
- 앱을 삭제해도 → `deleteSavedWebApp`(`lib/saved-webapps.ts:120-127`)이 실행 데이터를 지우지 않아 사진 수 MB가 남고, 같은 이름의 다음 앱이 그걸 물려받는다

수업 중 실제로 터질 수 있는 데이터 손실이다. **`appId`를 키로 써야 한다.**

### 🔴 B. 교사 화면에 저장형 XSS

`record-viewer.ts:42-44`에서 사진 값이 **이스케이프 없이** 속성에 들어간다:

```ts
function isSafePhoto(value) { return typeof value === "string" && value.startsWith("data:image/"); }
const photo = isSafePhoto(session.photo)
  ? `<img src="${session.photo}" alt="..."/>` : "";   // ← escapeHtml 없음
```

`escapeHtml`(`:25-31`)은 다른 필드에는 쓰이는데 여기만 빠졌다. `data:image/png;" onerror="…`
같은 값이면 속성을 탈출한다. 이 HTML은 `document.write`로 **교사 브라우저의 동일 출처
팝업**에 주입된다(`class-roster.tsx:127-135`). 제출 API(`save-record`)는 반 코드와 이름만
있으면 통과하고 `record`를 정규화하지 않으므로(`route.ts:117-136`), 학생 누구나 도달 가능하다.

### 🟠 C. 교사 코드 기본값 `1234`

`class-webapps/route.ts:41` — `TEACHER_INSTRUCTOR_CODE`가 비어 있으면 `"1234"`가 그대로
살아 있다. 이 코드 하나로 **모든 반의 명단, 학생 프로젝트 전체, 사진 포함 캠프 기록**을
읽을 수 있다. 비교도 `Array.includes`(비-상수시간)이고 시도 횟수 제한이 없다.
(같은 저장소의 `/api/teacher-answers`는 `timingSafeEqual` + 5회 잠금 + 미설정 시 503까지
제대로 되어 있어서 대비된다.)

### 🟡 D. 잔가지들

- `code-receive.tsx:30-34` — 잘못된 6자리 코드를 넣으면 `checking`이 리셋되지 않아 **받기 버튼이 새로고침 전까지 영구 비활성화**된다 (`finally` 없음)
- `phone-preview.tsx:218` — `my-webapp-record-${title}`에 쓰지만 **아무도 읽지 않는다**. "저장했어요" 표시는 실제 왕복하는 저장소와 다른 곳을 가리킨다
- `lib/chatbot-studio.ts:44` — `campReflectionPrompt`가 타입·기본값·정규화에는 있는데 **편집 UI도 없고 렌더러도 읽지 않는다** (죽은 속성)
- `lib/saved-webapps.ts:114` — 인덱스가 40개로 잘리는데 본체 blob은 남아 영구 누수
- `chatbot-studio.tsx:593` — `saveCurrentAsWebApp()`이 try/catch **밖**이라 저장 용량 초과 시 QR 다이얼로그가 "QR을 만드는 중이에요"에서 멈춘다
- `/api/share`에 만료도 사용량 제한도 없다. 6자리 = 90만 조합이라 **열거 가능** → 공유된 프로젝트는 사실상 공개
- `/api/health`가 인증 없이 매 요청마다 Supabase에 **실제 행을 쓴다**

---

## 5. App Inventor 대조표

| 영역 | MIT App Inventor | 현재 | 격차 |
|---|---|---|---|
| 팔레트 | 12개 카테고리 · 100+ 컴포넌트 | 1개 카테고리 · 8개 | 🔴 |
| 컴포넌트 인스턴스 | 무제한 (Button1, Button2…) | 종류당 1개 고정 | 🔴 |
| 배치 컨테이너 | 가로/세로/표/스크롤 배치 | 없음 | 🔴 |
| 속성 | 컴포넌트당 10~25개 | 2~3개, 대부분 텍스트 | 🔴 |
| 블록 편집 | Blockly 전체 (제어/논리/수/문자/리스트/변수/함수) | 읽기 전용 그림 | 🔴 |
| 이벤트 | 컴포넌트마다 고유 이벤트 | 6종 하드코딩, 동작 1:1 고정 | 🔴 |
| 화면 | 다중 스크린 + 화면 이동 | Screen1 하나 | 🔴 |
| 되돌리기 | Ctrl+Z | 없음 | 🔴 |
| 부품 이름 변경 | 가능 | 불가 | 🟠 |
| 미디어 자산 | 업로드 패널 | 없음 | 🟠 |
| 프로젝트 내보내기 | `.aia` 내보내기/가져오기 | 없음 (URL·6자리 코드만) | 🟠 |
| 실기기 테스트 | AI Companion / 에뮬레이터 | 실행 모달 + PWA 설치 | 🟢 잘 되어 있음 |
| 배포 | APK 빌드 + QR | PWA 설치 + QR + 6자리 코드 | 🟢 잘 되어 있음 |
| 교실 운영 | 없음 (Gallery만) | 반 제출·교사 명단·보고서 인쇄·활동지 | 🟢 **App Inventor보다 나음** |

**공정하게 말하면** 배포·설치·교실 운영은 오히려 App Inventor보다 잘 만들어져 있다.
PWA 매니페스트를 앱별로 갈아끼우는 `pwa-install.tsx`의 MutationObserver 처리,
iOS 저장소 분리를 URL 시드로 우회한 설계, Vercel 프리뷰 URL 로그인 문제를 피하는
`canonicalShareOrigin()` — 전부 실전에서 얻은 해법이 코드에 박혀 있다.

**부족한 건 딱 하나, "학생이 조립할 수 있는 폭"이다.**

---

## 6. 개선 로드맵

### 1단계 — 문서 모델을 컴포넌트 트리로 (원인 ①③ 해소)

평평한 레코드를 인스턴스 트리로 바꾼다.

```ts
type ComponentNode = {
  id: string;
  type: ComponentType;          // "label" | "button" | "image" | "row" | "column" | "chatbot" | ...
  name: string;                 // "버튼1" — 학생이 바꿀 수 있음
  props: Record<string, PropValue>;
  children?: ComponentNode[];   // 컨테이너만
};
type Screen = { id: string; name: string; root: ComponentNode[]; blocks: BlockStack[] };
type WebAppProject = { version: 4; screens: Screen[]; ... };
```

팔레트·트리·속성·렌더러를 **하나의 컴포넌트 레지스트리(데이터)** 에서 파생시킨다.
그러면 부품을 늘리는 게 레지스트리에 항목 하나 추가하는 일이 된다.

기본 부품 추가: 라벨 / 이미지 / 버튼 / 입력창 / 체크박스 / 스위치 / 슬라이더 / 구분선 /
목록 + 컨테이너(가로배치·세로배치). 기존 5개 복합 기능(안내 카드·활동 체크·나의 기록·
캠프 기록·챗봇)은 **복합 컴포넌트로 그대로 유지**해서 지금 수업이 안 깨지게 한다.

속성도 스키마 기반으로 바꿔 공통 시각 속성(글자 크기·굵기·색·정렬·배경색·여백·너비·보이기)을
모든 부품에 한 번에 부여한다. → **꾸미기 자유도 해결**

`normalizeProject`가 v3 → v4 **마이그레이션** 지점이 된다. 학생 기기와 Supabase에
이미 저장된 프로젝트가 그대로 열려야 한다.

### 2단계 — 진짜 블록 편집기 (원인 ② 해소)

블록을 데이터로 만들고 해석기를 붙인다.

```ts
type BlockStack = { id: string; event: EventRef; actions: ActionBlock[] };
type ActionBlock =
  | { kind: "setProperty"; targetId: string; prop: string; value: Expr }
  | { kind: "showMessage"; value: Expr }
  | { kind: "setVariable"; name: string; value: Expr }
  | { kind: "if"; cond: Expr; then: ActionBlock[]; else?: ActionBlock[] }
  | { kind: "repeat"; times: Expr; body: ActionBlock[] }
  | { kind: "openScreen"; screenId: string };
type Expr =
  | { kind: "literal"; value: string | number | boolean }
  | { kind: "var"; name: string }
  | { kind: "prop"; targetId: string; prop: string }
  | { kind: "binary"; op: "+" | "-" | "*" | "/" | "=" | ">" | "<" | "and" | "or"; left: Expr; right: Expr }
  | { kind: "join"; parts: Expr[] };
```

- 드래그로 이벤트 스택에 동작 블록을 끼워 넣기
- 소켓은 **드롭다운**으로 부품·속성·값을 고르게 해서 잘못된 프로그램을 만들 수 없게 한다
- 어휘를 일부러 작게 유지한다. Blockly 전체를 옮기면 중학생에게 과하다
- 기존 `.block-stack` / `.event-block` / `.action-block` CSS(`globals.css:2583-2830`)를
  그대로 재사용하면 지금 보이는 모습 그대로 진짜로 동작하게 만들 수 있다

**이 단계가 끝나면 "버튼을 눌렀을 때 → 라벨1의 글자를 '안녕'으로 바꾸기" 같은
컴포넌트 간 상호작용이 학생 손으로 만들어진다.** 그게 App Inventor의 핵심이다.

### 곁들여 반드시 함께 처리할 것

- 실행 데이터 저장 키를 `title` → `appId`로 (4-A). 어차피 모델을 손대는 김에
- 되돌리기/다시 실행 (Ctrl+Z) — 편집 자유도가 올라갈수록 필수
- `record-viewer.ts`의 XSS (4-B)와 교사 기본 코드 `1234` (4-C)

### 시험 전략

현재 `tests/rendered-html.test.mjs` 638줄은 **전부 소스 문자열 정규식 검사**다.
과거 버그 재발 방지 잠금장치로는 쓸모 있지만, 리팩터링하면 대량으로 깨진다.
마이그레이션(v3→v4), 인코딩 왕복, 블록 해석기는 **모듈을 실제로 import 해서 돌리는
단위 테스트**로 새로 만들어야 한다.
