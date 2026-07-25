export type StudioMode = "designer" | "blocks";
export type TemplateId = "notice" | "camp" | "blank";

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
  | "button"
  | "chatbot"
  | string;

export const NOTICE_PROJECT: WebAppProject = {
  template: "notice",
  title: "우리 반 알림장",
  appName: "우리 반 알림장",
  subtitle: "오늘도 차근차근, 우리 반 하루",
  accent: "#6956e8",
  screenBackground: "#f4f2ff",
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
  buttonEnabled: true,
  buttonLabel: "오늘 알림 확인 완료",
  buttonMessage: "좋아요! 오늘 알림을 모두 확인했어요.",
  chatbotEnabled: true,
  botName: "알림장 AI 도우미",
  greeting: "안녕하세요! 궁금한 내용을 골라 주세요.",
  inputPlaceholder: "궁금한 내용을 직접 입력해 보세요",
  fallbackResponse:
    "아직 배우지 못한 질문이에요. 아래 도움 버튼 중 하나를 눌러 주세요.",
  inputEnabled: true,
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

export const CAMP_PROJECT: WebAppProject = {
  template: "camp",
  title: "AI 캠프 1일차",
  appName: "AI 캠프 1일차",
  subtitle: "오늘의 활동을 하고, 나의 생각을 남겨요",
  accent: "#3478f6",
  screenBackground: "#eef5ff",
  noticeEnabled: true,
  noticeTitle: "오늘의 미션",
  noticeBody:
    "AI와 친해지고, 내 아이디어를 정한 뒤 작은 웹앱을 직접 만들어 봐요.",
  checklistEnabled: true,
  checklistTitle: "1일차 활동",
  checklistItems: [
    { id: "ask-ai", text: "AI에게 질문해 보기" },
    { id: "make-image", text: "AI 그림 만들어 보기" },
    { id: "choose-idea", text: "나만의 웹앱 아이디어 정하기" },
  ],
  journalEnabled: true,
  journalTitle: "오늘의 배움 기록",
  journalPrompt: "가장 신기했던 것과 새롭게 알게 된 것을 적어 보세요.",
  journalButtonLabel: "내 기록 저장",
  buttonEnabled: true,
  buttonLabel: "1일차 활동 완료",
  buttonMessage: "멋져요! AI 캠프 1일차 활동을 모두 마쳤어요.",
  chatbotEnabled: true,
  botName: "캠프 AI 도우미",
  greeting: "막히는 활동이 있나요? 제가 같이 생각해 드릴게요.",
  inputPlaceholder: "활동에 대해 질문해 보세요",
  fallbackResponse:
    "좋은 질문이에요! 활동 안내를 다시 읽고, 궁금한 부분을 조금 더 자세히 적어 주세요.",
  inputEnabled: true,
  actions: [
    {
      id: "schedule",
      label: "오늘 일정",
      response: "AI 알아보기, 그림 만들기, 웹앱 아이디어 정하기 순서예요.",
      icon: "sparkles",
    },
    {
      id: "materials",
      label: "준비물",
      response: "노트북 또는 태블릿, 필기도구, 나만의 아이디어가 필요해요.",
      icon: "backpack",
    },
    {
      id: "activity-help",
      label: "활동 도움",
      response: "먼저 만들고 싶은 사람과 해결하고 싶은 문제를 한 문장으로 적어 보세요.",
      icon: "heart",
    },
  ],
};

export const BLANK_PROJECT: WebAppProject = {
  ...NOTICE_PROJECT,
  template: "blank",
  title: "나만의 웹앱",
  appName: "나만의 웹앱",
  subtitle: "내 아이디어를 화면에 담아 보세요",
  noticeEnabled: false,
  checklistEnabled: false,
  journalEnabled: false,
  buttonEnabled: false,
  chatbotEnabled: true,
  botName: "나의 AI 도우미",
  greeting: "안녕하세요! 무엇을 도와드릴까요?",
  actions: [
    {
      id: "first-help",
      label: "도움 요청",
      response: "어떤 웹앱을 만들고 싶은지 한 문장으로 말해 주세요.",
      icon: "message",
    },
  ],
};

export const DEFAULT_PROJECT = NOTICE_PROJECT;

export const PROJECT_TEMPLATES: Array<{
  id: TemplateId;
  name: string;
  hint: string;
  project: WebAppProject;
}> = [
  {
    id: "notice",
    name: "우리 반 알림장",
    hint: "알림·준비물·기록",
    project: NOTICE_PROJECT,
  },
  {
    id: "camp",
    name: "캠프 1일차",
    hint: "활동·체크·배움 기록",
    project: CAMP_PROJECT,
  },
  {
    id: "blank",
    name: "빈 웹앱",
    hint: "AI 챗봇부터 시작",
    project: BLANK_PROJECT,
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
            "이 버튼을 눌렀을 때 AI가 말할 답을 적어 주세요.",
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
      : "notice";

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
