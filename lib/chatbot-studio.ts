export type StudioMode = "designer" | "blocks";

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

export type ChatbotProject = {
  title: string;
  botName: string;
  subtitle: string;
  greeting: string;
  accent: string;
  screenBackground: string;
  inputPlaceholder: string;
  fallbackResponse: string;
  inputEnabled: boolean;
  actions: QuickAction[];
};

export type SelectedTarget = "screen" | "bot" | "greeting" | "input" | string;

export const DEFAULT_PROJECT: ChatbotProject = {
  title: "우리 반 AI 알림장",
  botName: "AI 알림장 챗봇",
  subtitle: "우리 반 소식을 쉽고 빠르게",
  greeting:
    "안녕하세요! 궁금한 버튼을 눌러 보세요. 오늘의 학교생활을 알기 쉽게 알려드릴게요.",
  accent: "#6956e8",
  screenBackground: "#f4f2ff",
  inputPlaceholder: "궁금한 내용을 직접 입력해 보세요",
  fallbackResponse:
    "아직 배우지 못한 질문이에요. 아래 질문 버튼 중 하나를 눌러 주세요.",
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
      label: "부모님께 전달할 말",
      response: "금요일 체험학습 참가 동의서를 목요일까지 제출해 주세요.",
      icon: "home",
    },
    {
      id: "learned",
      label: "오늘 배운 것",
      response: "오늘은 분수의 크기 비교와 식물의 한살이를 배웠어요.",
      icon: "sparkles",
    },
    {
      id: "reflection",
      label: "오늘의 소감",
      response: "오늘 가장 기억에 남는 일을 한 문장으로 적어 볼까요?",
      icon: "heart",
    },
  ],
};

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

export function normalizeProject(value: unknown): ChatbotProject {
  if (!value || typeof value !== "object") return DEFAULT_PROJECT;

  const candidate = value as Partial<ChatbotProject>;
  const actions = Array.isArray(candidate.actions)
    ? (candidate.actions as unknown[])
        .filter(
          (action): action is Record<string, unknown> =>
            Boolean(action) && typeof action === "object",
        )
        .slice(0, 12)
        .map((action, index) => ({
          id: textOr(action.id, `action-${index + 1}`),
          label: textOr(action.label, `질문 ${index + 1}`),
          response: textOr(
            action.response,
            "이 버튼을 눌렀을 때 보여 줄 답을 적어 주세요.",
          ),
          icon: VALID_ICONS.includes(action.icon as ActionIcon)
            ? (action.icon as ActionIcon)
            : "message",
        }))
    : DEFAULT_PROJECT.actions;

  return {
    title: textOr(candidate.title, DEFAULT_PROJECT.title),
    botName: textOr(candidate.botName, DEFAULT_PROJECT.botName),
    subtitle: textOr(candidate.subtitle, DEFAULT_PROJECT.subtitle),
    greeting: textOr(candidate.greeting, DEFAULT_PROJECT.greeting),
    accent: isHexColor(candidate.accent)
      ? candidate.accent
      : DEFAULT_PROJECT.accent,
    screenBackground: isHexColor(candidate.screenBackground)
      ? candidate.screenBackground
      : DEFAULT_PROJECT.screenBackground,
    inputPlaceholder: textOr(
      candidate.inputPlaceholder,
      DEFAULT_PROJECT.inputPlaceholder,
    ),
    fallbackResponse: textOr(
      candidate.fallbackResponse,
      DEFAULT_PROJECT.fallbackResponse,
    ),
    inputEnabled:
      typeof candidate.inputEnabled === "boolean"
        ? candidate.inputEnabled
        : DEFAULT_PROJECT.inputEnabled,
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
