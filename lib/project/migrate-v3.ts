/**
 * v3(기능 여섯 가지가 켜짐/꺼짐 스위치였던 시절) 프로젝트를 v4 부품 트리로
 * 옮깁니다.
 *
 * 학생 기기와 반 저장소에 이미 저장된 프로젝트가 전부 v3이라 이 길은 계속
 * 살아 있어야 합니다. 정리 규칙은 v3 시절 것을 그대로 옮겨 왔습니다.
 */

import type {
  ActionIcon,
  BlockProgram,
  ComponentNode,
  ListItem,
  QaItem,
  TemplateId,
  WebAppProject,
} from "./types";
import { PROJECT_SCHEMA_VERSION } from "./types";

export type FeatureKind =
  | "notice"
  | "checklist"
  | "journal"
  | "camp-report"
  | "button"
  | "chatbot";

export const DEFAULT_FEATURE_ORDER: FeatureKind[] = [
  "notice",
  "checklist",
  "journal",
  "camp-report",
  "button",
  "chatbot",
];

/** v3 프로젝트의 모양입니다. 읽기 전용으로만 씁니다. */
export type LegacyProject = {
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
  checklistItems: ListItem[];
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
  actions: QaItem[];
  featureOrder: FeatureKind[];
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

const booleanOr = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

const LEGACY_DEFAULTS: LegacyProject = {
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
  campReflectionPrompt:
    "활동하면서 느낀 점이나 새롭게 알게 된 점을 적어 보세요.",
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
  featureOrder: [...DEFAULT_FEATURE_ORDER],
};

/**
 * v3 시절 `normalizeProject`가 하던 정리를 그대로 합니다. 질문 12개, 체크 항목
 * 10개 같은 상한과 색·아이콘 검사가 여기에 있습니다.
 */
export function normalizeLegacy(value: unknown): LegacyProject {
  const candidate = (value ?? {}) as Partial<LegacyProject>;

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
            : ("message" as ActionIcon),
        }))
    : LEGACY_DEFAULTS.actions.map((action) => ({ ...action }));

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
    : LEGACY_DEFAULTS.checklistItems.map((item) => ({ ...item }));

  const featureOrder: FeatureKind[] = (() => {
    const requested = Array.isArray(candidate.featureOrder)
      ? (candidate.featureOrder as unknown[]).filter(
          (kind): kind is FeatureKind =>
            DEFAULT_FEATURE_ORDER.includes(kind as FeatureKind),
        )
      : [];
    const seen = new Set<FeatureKind>();
    const ordered: FeatureKind[] = [];
    for (const kind of [...requested, ...DEFAULT_FEATURE_ORDER]) {
      if (seen.has(kind)) continue;
      seen.add(kind);
      ordered.push(kind);
    }
    return ordered;
  })();

  const template: TemplateId =
    candidate.template === "camp" ||
    candidate.template === "blank" ||
    candidate.template === "notice"
      ? candidate.template
      : "blank";

  const pickText = (key: keyof LegacyProject) =>
    textOr(candidate[key], LEGACY_DEFAULTS[key] as string);
  const pickFlag = (key: keyof LegacyProject) =>
    booleanOr(candidate[key], LEGACY_DEFAULTS[key] as boolean);

  return {
    template,
    title: pickText("title"),
    appName: textOr(candidate.appName, candidate.title ?? LEGACY_DEFAULTS.appName),
    subtitle: pickText("subtitle"),
    accent: isHexColor(candidate.accent)
      ? candidate.accent
      : LEGACY_DEFAULTS.accent,
    screenBackground: isHexColor(candidate.screenBackground)
      ? candidate.screenBackground
      : LEGACY_DEFAULTS.screenBackground,
    noticeEnabled: pickFlag("noticeEnabled"),
    noticeTitle: pickText("noticeTitle"),
    noticeBody: pickText("noticeBody"),
    checklistEnabled: pickFlag("checklistEnabled"),
    checklistTitle: pickText("checklistTitle"),
    checklistItems,
    journalEnabled: pickFlag("journalEnabled"),
    journalTitle: pickText("journalTitle"),
    journalPrompt: pickText("journalPrompt"),
    journalButtonLabel: pickText("journalButtonLabel"),
    campReportEnabled: pickFlag("campReportEnabled"),
    campReportTitle: pickText("campReportTitle"),
    campActivityPrompt: pickText("campActivityPrompt"),
    campReflectionPrompt: pickText("campReflectionPrompt"),
    campFinalPrompt: pickText("campFinalPrompt"),
    buttonEnabled: pickFlag("buttonEnabled"),
    buttonLabel: pickText("buttonLabel"),
    buttonMessage: pickText("buttonMessage"),
    chatbotEnabled: pickFlag("chatbotEnabled"),
    botName: pickText("botName"),
    greeting: pickText("greeting"),
    inputPlaceholder: pickText("inputPlaceholder"),
    fallbackResponse: pickText("fallbackResponse"),
    inputEnabled: pickFlag("inputEnabled"),
    actions,
    featureOrder,
  };
}

/**
 * 꺼 둔 기능도 트리에 넣고 `visible`만 끕니다. v3에서 기능을 화면에서 빼는 것은
 * 지우는 게 아니라 감추는 것이어서, 꺼 둔 안내 카드 안에 학생이 쓴 글이 그대로
 * 남아 있을 수 있습니다. 빼 버리면 그 글을 잃습니다.
 */
export function migrateV3(legacy: LegacyProject): WebAppProject {
  const nodes: ComponentNode[] = [];
  const blocks: BlockProgram = { events: [], variables: [] };
  let serial = 0;
  const nextId = () => `c${(serial += 1)}`;

  const build = (kind: FeatureKind): ComponentNode | null => {
    switch (kind) {
      case "notice":
        return {
          id: nextId(),
          type: "notice-card",
          name: "안내카드1",
          props: { title: legacy.noticeTitle, body: legacy.noticeBody },
        };
      case "checklist":
        return {
          id: nextId(),
          type: "checklist",
          name: "활동체크1",
          props: {
            title: legacy.checklistTitle,
            items: legacy.checklistItems.map((item) => ({ ...item })),
          },
        };
      case "journal":
        return {
          id: nextId(),
          type: "journal",
          name: "나의기록1",
          props: {
            title: legacy.journalTitle,
            prompt: legacy.journalPrompt,
            buttonLabel: legacy.journalButtonLabel,
          },
        };
      case "camp-report":
        return {
          id: nextId(),
          type: "camp-report",
          name: "캠프기록1",
          props: {
            title: legacy.campReportTitle,
            activityPrompt: legacy.campActivityPrompt,
            finalPrompt: legacy.campFinalPrompt,
            reflectionPrompt: legacy.campReflectionPrompt,
          },
        };
      case "button":
        return {
          id: nextId(),
          type: "button",
          name: "버튼1",
          props: { label: legacy.buttonLabel },
        };
      case "chatbot":
        return {
          id: nextId(),
          type: "chatbot",
          name: "챗봇1",
          props: {
            botName: legacy.botName,
            greeting: legacy.greeting,
            inputEnabled: legacy.inputEnabled,
            placeholder: legacy.inputPlaceholder,
            fallback: legacy.fallbackResponse,
            qa: legacy.actions.map((action) => ({ ...action })),
          },
        };
    }
  };

  const enabled: Record<FeatureKind, boolean> = {
    notice: legacy.noticeEnabled,
    checklist: legacy.checklistEnabled,
    journal: legacy.journalEnabled,
    "camp-report": legacy.campReportEnabled,
    button: legacy.buttonEnabled,
    chatbot: legacy.chatbotEnabled,
  };

  // 켜 둔 기능을 화면 순서대로 먼저 놓고, 꺼 둔 기능은 뒤에 숨겨 둡니다.
  const ordered = [
    ...legacy.featureOrder.filter((kind) => enabled[kind]),
    ...legacy.featureOrder.filter((kind) => !enabled[kind]),
  ];

  let buttonNodeId = "";
  for (const kind of ordered) {
    const node = build(kind);
    if (!node) continue;
    if (!enabled[kind]) node.props.visible = false;
    if (kind === "button") buttonNodeId = node.id;
    nodes.push(node);
  }

  // v3에서 버튼의 동작은 코드에 박혀 있었습니다. v4에서는 진짜 블록으로 옮겨서,
  // 예전 프로젝트를 열면 학생이 바로 고쳐 볼 수 있는 블록이 하나 생깁니다.
  if (buttonNodeId && legacy.buttonMessage.trim()) {
    blocks.events.push({
      id: "e1",
      componentId: buttonNodeId,
      event: "click",
      body: [
        {
          id: "a1",
          kind: "show-message",
          value: { k: "text", v: legacy.buttonMessage },
        },
      ],
    });
  }

  return {
    version: PROJECT_SCHEMA_VERSION,
    template: legacy.template,
    title: legacy.title,
    appName: legacy.appName,
    subtitle: legacy.subtitle,
    accent: legacy.accent,
    screenBackground: legacy.screenBackground,
    screens: [{ id: "s1", name: "Screen1", children: nodes }],
    blocks,
  };
}
