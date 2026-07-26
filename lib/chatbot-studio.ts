export type StudioMode = "designer" | "blocks";
export type TemplateId = "blank" | "camp" | "notice";

export type ActionIcon =
  | "book"
  | "backpack"
  | "home"
  | "sparkles"
  | "heart"
  | "message";

export type QuickAction = {
  id: string;
  label: string;
  response: string;
  icon: ActionIcon;
};

export type ChecklistItem = {
  id: string;
  text: string;
};

export type WebAppProject = {
  template: TemplateId;
  title: string;
  appName: string;
  subtitle: string;
  accent: string;
  screenBackground: string;
  noticeEnabled: boolean;
  noticeTitle: string;
  noticeBody: string;
  checklistEnabled: boolean;
  checklistTitle: string;
  checklistItems: ChecklistItem[];
  journalEnabled: boolean;
  journalTitle: string;
  journalPrompt: string;
  journalButtonLabel: string;
  campReportEnabled: boolean;
  campReportTitle: string;
  campActivityPrompt: string;
  campReflectionPrompt: string;
  campFinalPrompt: string;
  buttonEnabled: boolean;
  buttonLabel: string;
  buttonMessage: string;
  chatbotEnabled: boolean;
  botName: string;
  greeting: string;
  inputPlaceholder: string;
  fallbackResponse: string;
  inputEnabled: boolean;
  actions: QuickAction[];
};

export type SelectedTarget =
  | "screen"
  | "header"
  | "notice"
  | "checklist"
  | "journal"
  | "camp-report"
  | "button"
  | "chatbot"
  | string;

const BASE_PROJECT: WebAppProject = {
  template: "blank",
  title: "나만의 웹앱",
  appName: "나만의 웹앱",
  subtitle: "내 아이디어를 화면에 담아 보세요",
  accent: "#6956e8",
  screenBackground: "#f4f2ff",
  noticeEnabled: false,
  noticeTitle: "안내 제목",
  noticeBody: "웹앱에서 알려 줄 내용을 적어 보세요.",
  checklistEnabled: false,
  checklistTitle: "나의 할 일",
  checklistItems: [
    { id: "check-1", text: "첫 번째 할 일" },
    { id: "check-2", text: "두 번째 할 일" },
  ],
  journalEnabled: false,
  journalTitle: "나의 기록",
  journalPrompt: "오늘 기억하고 싶은 내용을 적어 보세요.",
  journalButtonLabel: "기록 저장",
  campReportEnabled: false,
  campReportTitle: "나의 3일 캠프 활동 보고서",
  campActivityPrompt: "이번 차시에 배우고 활동한 내용을 적어 보세요.",
  campReflectionPrompt: "활동하면서 느낀 점이나 새롭게 알게 된 점을 적어 보세요.",
  campFinalPrompt:
    "3일 동안 가장 기억에 남은 활동과 앞으로 해 보고 싶은 것을 적어 보세요.",
  buttonEnabled: false,
  buttonLabel: "확인",
  buttonMessage: "버튼을 잘 눌렀어요!",
  chatbotEnabled: false,
  botName: "나의 챗봇",
  greeting: "안녕하세요! 아래에서 궁금한 내용을 골라 주세요.",
  inputPlaceholder: "내가 만든 질문을 입력해 보세요",
  fallbackResponse:
    "아직 내가 답을 만들지 않은 질문이에요. 아래 질문 버튼 중 하나를 골라 주세요.",
  inputEnabled: true,
  actions: [
    {
      id: "first-help",
      label: "도움 요청",
      response: "내가 이 챗봇에 직접 만든 답이에요.",
      icon: "message",
    },
  ],
};

export const BLANK_PROJECT: WebAppProject = {
  ...BASE_PROJECT,
  checklistItems: BASE_PROJECT.checklistItems.map((item) => ({ ...item })),
  actions: BASE_PROJECT.actions.map((action) => ({ ...action })),
};

export const CAMP_PROJECT: WebAppProject = {
  ...BASE_PROJECT,
  template: "camp",
  title: "3일 캠프 활동 기록",
  appName: "나의 3일 캠프 기록",
  subtitle: "하루 4차시, 배움과 사진을 차곡차곡",
  accent: "#3478f6",
  screenBackground: "#eef5ff",
  noticeEnabled: true,
  noticeTitle: "나의 캠프 기록 방법",
  noticeBody:
    "매 차시가 끝날 때 활동 내용, 사진, 느낀 점을 남겨요. 3일차에는 전체 소감을 쓰고 보고서를 인쇄할 수 있어요.",
  checklistEnabled: false,
  journalEnabled: false,
  campReportEnabled: true,
  campReportTitle: "나의 3일 캠프 활동 보고서",
  buttonEnabled: false,
  chatbotEnabled: false,
  actions: [],
};

export const NOTICE_PROJECT: WebAppProject = {
  ...BASE_PROJECT,
  template: "notice",
  title: "우리 반 알림장",
  appName: "우리 반 알림장",
  subtitle: "오늘도 차근차근, 우리 반 하루",
  noticeEnabled: true,
  noticeTitle: "오늘의 알림",
  noticeBody:
    "수학 익힘책 42~43쪽을 풀고, 체험학습 동의서는 목요일까지 제출해 주세요.",
  checklistEnabled: true,
  checklistTitle: "내일 준비물",
  checklistItems: [
    { id: "science-book", text: "과학 교과서" },
    { id: "pencil-case", text: "필통과 색연필" },
    { id: "school-letter", text: "가정통신문" },
  ],
  journalEnabled: true,
  journalTitle: "오늘의 한 줄",
  journalPrompt: "오늘 가장 기억에 남는 일을 적어 보세요.",
  journalButtonLabel: "기록 저장",
  campReportEnabled: false,
  buttonEnabled: true,
  buttonLabel: "오늘 알림 확인 완료",
  buttonMessage: "좋아요! 오늘 알림을 모두 확인했어요.",
  chatbotEnabled: true,
  botName: "알림장 도우미",
  greeting: "안녕하세요! 궁금한 내용을 골라 주세요.",
  inputPlaceholder: "내가 만든 질문을 입력해 보세요",
  fallbackResponse:
    "이 챗봇을 만든 학생이 아직 답을 등록하지 않은 질문이에요. 아래 질문 버튼 중 하나를 골라 주세요.",
  actions: [
    {
      id: "homework",
      label: "오늘 숙제",
      response: "오늘 숙제는 수학 익힘책 42~43쪽과 국어 낱말 정리예요.",
      icon: "book",
    },
    {
      id: "supplies",
      label: "내일 준비물",
      response: "내일은 과학 교과서, 필통, 색연필을 챙겨 오세요.",
      icon: "backpack",
    },
    {
      id: "parent-note",
      label: "가정통신문",
      response: "체험학습 참가 동의서를 목요일까지 제출해 주세요.",
      icon: "home",
    },
  ],
};

export const DEFAULT_PROJECT = BLANK_PROJECT;

export const PROJECT_TEMPLATES: Array<{
  id: TemplateId;
  name: string;
  hint: string;
  project: WebAppProject;
}> = [
  {
    id: "blank",
    name: "빈 웹앱",
    hint: "아무 기능 없이 시작",
    project: BLANK_PROJECT,
  },
  {
    id: "camp",
    name: "3일 캠프 기록",
    hint: "12차시·사진·소감·인쇄",
    project: CAMP_PROJECT,
  },
  {
    id: "notice",
    name: "우리 반 알림장",
    hint: "알림·준비물·기록·챗봇",
    project: NOTICE_PROJECT,
  },
];

const VALID_ICONS: ActionIcon[] = [
  "book",
  "backpack",
  "home",
  "sparkles",
  "heart",
  "message",
];

const isHexColor = (value: unknown): value is string =>
  typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);

const textOr = (value: unknown, fallback: string) =>
  typeof value === "string" && value.trim() ? value : fallback;

const booleanOr = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

export function cloneProject(project: WebAppProject): WebAppProject {
  return {
    ...project,
    checklistItems: project.checklistItems.map((item) => ({ ...item })),
    actions: project.actions.map((action) => ({ ...action })),
  };
}

export function normalizeProject(value: unknown): WebAppProject {
  if (!value || typeof value !== "object") return cloneProject(DEFAULT_PROJECT);

  const candidate = value as Partial<WebAppProject>;
  const actions = Array.isArray(candidate.actions)
    ? (candidate.actions as unknown[])
        .filter(
          (action): action is Record<string, unknown> =>
            Boolean(action) && typeof action === "object",
        )
        .slice(0, 12)
        .map((action, index) => ({
          id: textOr(action.id, `action-${index + 1}`),
          label: textOr(action.label, `도움 ${index + 1}`),
          response: textOr(
            action.response,
            "이 버튼을 눌렀을 때 챗봇이 말할 답을 적어 주세요.",
          ),
          icon: VALID_ICONS.includes(action.icon as ActionIcon)
            ? (action.icon as ActionIcon)
            : "message",
        }))
    : cloneProject(DEFAULT_PROJECT).actions;

  const checklistItems = Array.isArray(candidate.checklistItems)
    ? (candidate.checklistItems as unknown[])
        .filter(
          (item): item is Record<string, unknown> =>
            Boolean(item) && typeof item === "object",
        )
        .slice(0, 10)
        .map((item, index) => ({
          id: textOr(item.id, `check-${index + 1}`),
          text: textOr(item.text, `활동 ${index + 1}`),
        }))
    : cloneProject(DEFAULT_PROJECT).checklistItems;

  const template: TemplateId =
    candidate.template === "camp" ||
    candidate.template === "blank" ||
    candidate.template === "notice"
      ? candidate.template
      : "blank";

  return {
    template,
    title: textOr(candidate.title, DEFAULT_PROJECT.title),
    appName: textOr(candidate.appName, candidate.title ?? DEFAULT_PROJECT.appName),
    subtitle: textOr(candidate.subtitle, DEFAULT_PROJECT.subtitle),
    accent: isHexColor(candidate.accent)
      ? candidate.accent
      : DEFAULT_PROJECT.accent,
    screenBackground: isHexColor(candidate.screenBackground)
      ? candidate.screenBackground
      : DEFAULT_PROJECT.screenBackground,
    noticeEnabled: booleanOr(
      candidate.noticeEnabled,
      DEFAULT_PROJECT.noticeEnabled,
    ),
    noticeTitle: textOr(candidate.noticeTitle, DEFAULT_PROJECT.noticeTitle),
    noticeBody: textOr(candidate.noticeBody, DEFAULT_PROJECT.noticeBody),
    checklistEnabled: booleanOr(
      candidate.checklistEnabled,
      DEFAULT_PROJECT.checklistEnabled,
    ),
    checklistTitle: textOr(
      candidate.checklistTitle,
      DEFAULT_PROJECT.checklistTitle,
    ),
    checklistItems,
    journalEnabled: booleanOr(
      candidate.journalEnabled,
      DEFAULT_PROJECT.journalEnabled,
    ),
    journalTitle: textOr(candidate.journalTitle, DEFAULT_PROJECT.journalTitle),
    journalPrompt: textOr(
      candidate.journalPrompt,
      DEFAULT_PROJECT.journalPrompt,
    ),
    journalButtonLabel: textOr(
      candidate.journalButtonLabel,
      DEFAULT_PROJECT.journalButtonLabel,
    ),
    campReportEnabled: booleanOr(
      candidate.campReportEnabled,
      DEFAULT_PROJECT.campReportEnabled,
    ),
    campReportTitle: textOr(
      candidate.campReportTitle,
      DEFAULT_PROJECT.campReportTitle,
    ),
    campActivityPrompt: textOr(
      candidate.campActivityPrompt,
      DEFAULT_PROJECT.campActivityPrompt,
    ),
    campReflectionPrompt: textOr(
      candidate.campReflectionPrompt,
      DEFAULT_PROJECT.campReflectionPrompt,
    ),
    campFinalPrompt: textOr(
      candidate.campFinalPrompt,
      DEFAULT_PROJECT.campFinalPrompt,
    ),
    buttonEnabled: booleanOr(
      candidate.buttonEnabled,
      DEFAULT_PROJECT.buttonEnabled,
    ),
    buttonLabel: textOr(candidate.buttonLabel, DEFAULT_PROJECT.buttonLabel),
    buttonMessage: textOr(
      candidate.buttonMessage,
      DEFAULT_PROJECT.buttonMessage,
    ),
    chatbotEnabled: booleanOr(
      candidate.chatbotEnabled,
      DEFAULT_PROJECT.chatbotEnabled,
    ),
    botName: textOr(candidate.botName, DEFAULT_PROJECT.botName),
    greeting: textOr(candidate.greeting, DEFAULT_PROJECT.greeting),
    inputPlaceholder: textOr(
      candidate.inputPlaceholder,
      DEFAULT_PROJECT.inputPlaceholder,
    ),
    fallbackResponse: textOr(
      candidate.fallbackResponse,
      DEFAULT_PROJECT.fallbackResponse,
    ),
    inputEnabled: booleanOr(
      candidate.inputEnabled,
      DEFAULT_PROJECT.inputEnabled,
    ),
    actions,
  };
}

export const ACTION_ICON_LABELS: Array<{
  value: ActionIcon;
  label: string;
}> = [
  { value: "book", label: "책" },
  { value: "backpack", label: "가방" },
  { value: "home", label: "가정" },
  { value: "sparkles", label: "배움" },
  { value: "heart", label: "마음" },
  { value: "message", label: "대화" },
];
