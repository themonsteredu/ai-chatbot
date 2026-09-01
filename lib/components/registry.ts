/**
 * 부품 사전입니다. 팔레트·컴포넌트 트리·속성 판·화면 그리기가 모두 이 한 곳에서
 * 나옵니다. 부품을 늘리려면 여기에 항목 하나만 더하면 됩니다.
 *
 * 여기에는 React를 들이지 않습니다. 반 제출과 공유 링크를 처리하는 서버 라우트가
 * 이 파일을 거쳐 프로젝트를 정리하고, 시험도 이 파일을 그대로 불러다 씁니다.
 * 아이콘도 문자열 이름으로만 두고, 실제 그림은 화면 쪽에서 붙입니다.
 */

import type {
  ComponentTypeId,
  EventId,
  ListItem,
  PropValue,
  QaItem,
} from "../project/types";

export type CategoryId = "basic" | "input" | "layout" | "feature";

export type PropKind =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "color"
  | "select"
  | "image"
  | "itemlist"
  | "qalist"
  | "range"
  | "align";

export type PropGroup = "content" | "style" | "behavior";

export type PropSpec = {
  key: string;
  label: string;
  kind: PropKind;
  default: PropValue;
  group: PropGroup;
  /** 글자 길이 제한입니다. text·textarea에만 씁니다. */
  max?: number;
  rows?: number;
  min?: number;
  step?: number;
  /** 목록 속성이 가질 수 있는 최대 줄 수입니다. */
  maxItems?: number;
  options?: Array<{ value: string; label: string }>;
  help?: string;
  /** 블록에서 이 값을 읽을 수 있습니다. */
  blockReadable?: boolean;
  /** 블록에서 이 값을 바꿀 수 있습니다. */
  blockWritable?: boolean;
  /** 속성 판에 보이지 않습니다. 예전 자료를 잃지 않으려고 남겨 둔 값입니다. */
  hidden?: boolean;
};

export type EventSpec = { id: EventId; label: string };

export type ComponentSpec = {
  type: ComponentTypeId;
  name: string;
  hint: string;
  /** lucide 아이콘 이름입니다. 그림은 화면 쪽에서 붙입니다. */
  icon: string;
  category: CategoryId;
  tone: "violet" | "yellow" | "mint" | "blue";
  /** 부품 이름을 자동으로 지을 때 앞에 붙는 말입니다. 버튼1, 버튼2 … */
  namePrefix: string;
  acceptsChildren: boolean;
  /** 한 화면에 몇 개까지 놓을 수 있는지입니다. 없으면 제한이 없습니다. */
  maxPerScreen?: number;
  props: PropSpec[];
  events: EventSpec[];
};

/* ------------------------------------------------------------------ */
/* 모든 부품이 함께 가지는 꾸미기 속성                                  */
/* ------------------------------------------------------------------ */

const FONT_SIZES = [
  { value: "sm", label: "작게" },
  { value: "md", label: "보통" },
  { value: "lg", label: "크게" },
  { value: "xl", label: "아주 크게" },
];

/**
 * 글꼴은 기기에 이미 있는 것만 고르게 합니다. 실제 글꼴 이름은 화면 쪽
 * style.ts가 가지고 있습니다.
 */
const FONTS = [
  { value: "", label: "기본" },
  { value: "gothic", label: "또렷한 고딕" },
  { value: "myeongjo", label: "차분한 명조" },
  { value: "handwriting", label: "손글씨" },
  { value: "typewriter", label: "타자기" },
];

const SPACES = [
  { value: "none", label: "없음" },
  { value: "sm", label: "좁게" },
  { value: "md", label: "보통" },
  { value: "lg", label: "넓게" },
];

const WIDTHS = [
  { value: "full", label: "꽉 채우기" },
  { value: "auto", label: "내용만큼" },
  { value: "half", label: "절반" },
];

/**
 * 색은 빈 문자열이 "정하지 않음"입니다. 그래야 부품마다 색을 고르지 않아도
 * 웹앱 대표 색을 그대로 따라갑니다.
 */
function commonProps(): PropSpec[] {
  return [
    {
      key: "visible",
      label: "보이기",
      kind: "boolean",
      default: true,
      group: "behavior",
      blockReadable: true,
      blockWritable: true,
    },
    {
      key: "fontSize",
      label: "글자 크기",
      kind: "select",
      default: "md",
      group: "style",
      options: FONT_SIZES,
      blockReadable: true,
      blockWritable: true,
    },
    {
      key: "font",
      label: "글꼴",
      kind: "select",
      default: "",
      group: "style",
      options: FONTS,
      help: "기기에 그 글꼴이 없으면 가장 비슷한 글꼴로 보여 줍니다",
      blockReadable: true,
      blockWritable: true,
    },
    {
      key: "bold",
      label: "굵게",
      kind: "boolean",
      default: false,
      group: "style",
      blockReadable: true,
      blockWritable: true,
    },
    {
      key: "textColor",
      label: "글자색",
      kind: "color",
      default: "",
      group: "style",
      blockReadable: true,
      blockWritable: true,
    },
    {
      key: "background",
      label: "배경색",
      kind: "color",
      default: "",
      group: "style",
      blockReadable: true,
      blockWritable: true,
    },
    {
      key: "align",
      label: "정렬",
      kind: "align",
      default: "left",
      group: "style",
      blockReadable: true,
      blockWritable: true,
    },
    {
      key: "padding",
      label: "여백",
      kind: "select",
      default: "md",
      group: "style",
      options: SPACES,
    },
    {
      key: "width",
      label: "너비",
      kind: "select",
      default: "full",
      group: "style",
      options: WIDTHS,
    },
  ];
}

const text = (
  key: string,
  label: string,
  fallback: string,
  max: number,
  extra: Partial<PropSpec> = {},
): PropSpec => ({
  key,
  label,
  kind: "text",
  default: fallback,
  group: "content",
  max,
  blockReadable: true,
  blockWritable: true,
  ...extra,
});

const area = (
  key: string,
  label: string,
  fallback: string,
  max: number,
  rows = 4,
  extra: Partial<PropSpec> = {},
): PropSpec => ({
  key,
  label,
  kind: "textarea",
  default: fallback,
  group: "content",
  max,
  rows,
  blockReadable: true,
  blockWritable: true,
  ...extra,
});

/* ------------------------------------------------------------------ */
/* 부품 사전                                                           */
/* ------------------------------------------------------------------ */

const SPECS: ComponentSpec[] = [
  /* --- 기본 --- */
  {
    type: "label",
    name: "글자",
    hint: "원하는 문장을 보여줘요",
    icon: "Type",
    category: "basic",
    tone: "violet",
    namePrefix: "글자",
    acceptsChildren: false,
    props: [area("text", "보여 줄 글", "여기에 글을 적어 보세요", 400, 4)],
    events: [],
  },
  {
    type: "image",
    name: "사진",
    hint: "내 사진이나 그림을 넣어요",
    icon: "ImageIcon",
    category: "basic",
    tone: "mint",
    namePrefix: "사진",
    acceptsChildren: false,
    props: [
      {
        key: "src",
        label: "사진",
        kind: "image",
        default: "",
        group: "content",
        blockReadable: true,
        blockWritable: true,
      },
      text("alt", "사진 설명", "내가 넣은 사진", 60),
      {
        key: "rounded",
        label: "모서리 둥글게",
        kind: "boolean",
        default: true,
        group: "style",
      },
    ],
    events: [{ id: "click", label: "눌렀을 때" }],
  },
  {
    type: "button",
    name: "버튼",
    hint: "누르면 블록이 움직여요",
    icon: "MousePointerClick",
    category: "basic",
    tone: "yellow",
    namePrefix: "버튼",
    acceptsChildren: false,
    props: [
      text("label", "버튼에 보일 글", "확인", 28),
      {
        key: "style",
        label: "모양",
        kind: "select",
        default: "solid",
        group: "style",
        options: [
          { value: "solid", label: "꽉 찬" },
          { value: "outline", label: "테두리만" },
          { value: "soft", label: "연한" },
        ],
      },
      {
        key: "enabled",
        label: "누를 수 있음",
        kind: "boolean",
        default: true,
        group: "behavior",
        blockReadable: true,
        blockWritable: true,
      },
    ],
    events: [{ id: "click", label: "클릭했을 때" }],
  },
  {
    type: "divider",
    name: "구분선",
    hint: "내용을 나누는 줄이에요",
    icon: "Minus",
    category: "basic",
    tone: "blue",
    namePrefix: "구분선",
    acceptsChildren: false,
    props: [],
    events: [],
  },
  {
    type: "list",
    name: "목록",
    hint: "여러 줄을 나란히 보여줘요",
    icon: "List",
    category: "basic",
    tone: "blue",
    namePrefix: "목록",
    acceptsChildren: false,
    props: [
      text("title", "목록 제목", "나의 목록", 28),
      {
        key: "items",
        label: "목록 내용",
        kind: "itemlist",
        default: [
          { id: "list-1", text: "첫 번째 줄" },
          { id: "list-2", text: "두 번째 줄" },
        ],
        group: "content",
        maxItems: 20,
        help: "한 줄에 하나씩 적어요",
      },
      {
        key: "ordered",
        label: "번호 붙이기",
        kind: "boolean",
        default: false,
        group: "style",
      },
    ],
    events: [],
  },

  /* --- 입력 --- */
  {
    type: "textbox",
    name: "입력창",
    hint: "쓰는 사람이 글을 적어요",
    icon: "TextCursorInput",
    category: "input",
    tone: "violet",
    namePrefix: "입력창",
    acceptsChildren: false,
    props: [
      text("label", "입력창 이름", "이름", 28),
      text("placeholder", "안내 문구", "여기에 적어 보세요", 44),
      text("value", "적힌 글", "", 400, { group: "behavior" }),
      {
        key: "multiline",
        label: "여러 줄",
        kind: "boolean",
        default: false,
        group: "behavior",
      },
    ],
    events: [{ id: "change", label: "내용이 바뀌었을 때" }],
  },
  {
    type: "checkbox",
    name: "체크박스",
    hint: "하나를 켜고 꺼요",
    icon: "SquareCheck",
    category: "input",
    tone: "mint",
    namePrefix: "체크박스",
    acceptsChildren: false,
    props: [
      text("label", "옆에 보일 글", "확인했어요", 40),
      {
        key: "checked",
        label: "체크됨",
        kind: "boolean",
        default: false,
        group: "behavior",
        blockReadable: true,
        blockWritable: true,
      },
    ],
    events: [{ id: "change", label: "체크가 바뀌었을 때" }],
  },
  {
    type: "switch",
    name: "스위치",
    hint: "켜짐과 꺼짐을 골라요",
    icon: "ToggleRight",
    category: "input",
    tone: "yellow",
    namePrefix: "스위치",
    acceptsChildren: false,
    props: [
      text("label", "옆에 보일 글", "알림 받기", 40),
      {
        key: "on",
        label: "켜짐",
        kind: "boolean",
        default: false,
        group: "behavior",
        blockReadable: true,
        blockWritable: true,
      },
    ],
    events: [{ id: "change", label: "켜짐이 바뀌었을 때" }],
  },
  {
    type: "slider",
    name: "슬라이더",
    hint: "숫자를 밀어서 골라요",
    icon: "SlidersHorizontal",
    category: "input",
    tone: "blue",
    namePrefix: "슬라이더",
    acceptsChildren: false,
    props: [
      text("label", "옆에 보일 글", "정도", 40),
      {
        key: "min",
        label: "가장 작은 값",
        kind: "number",
        default: 0,
        group: "behavior",
      },
      {
        key: "max",
        label: "가장 큰 값",
        kind: "number",
        default: 10,
        group: "behavior",
      },
      {
        key: "value",
        label: "지금 값",
        kind: "range",
        default: 5,
        group: "behavior",
        blockReadable: true,
        blockWritable: true,
      },
    ],
    events: [{ id: "change", label: "값이 바뀌었을 때" }],
  },

  /* --- 배치 --- */
  {
    type: "row",
    name: "가로 배치",
    hint: "부품을 옆으로 나란히",
    icon: "Columns3",
    category: "layout",
    tone: "blue",
    namePrefix: "가로배치",
    acceptsChildren: true,
    props: [
      {
        key: "gap",
        label: "사이 간격",
        kind: "select",
        default: "md",
        group: "style",
        options: SPACES,
      },
      {
        key: "justify",
        label: "가로 정렬",
        kind: "select",
        default: "start",
        group: "style",
        options: [
          { value: "start", label: "왼쪽부터" },
          { value: "center", label: "가운데" },
          { value: "between", label: "양 끝으로" },
        ],
      },
    ],
    events: [],
  },
  {
    type: "column",
    name: "세로 배치",
    hint: "부품을 위아래로 묶어요",
    icon: "Rows3",
    category: "layout",
    tone: "violet",
    namePrefix: "세로배치",
    acceptsChildren: true,
    props: [
      {
        key: "gap",
        label: "사이 간격",
        kind: "select",
        default: "md",
        group: "style",
        options: SPACES,
      },
    ],
    events: [],
  },

  /* --- 기능 (v3부터 쓰던 완성형 부품) --- */
  {
    type: "notice-card",
    name: "안내 카드",
    hint: "중요한 내용을 알려줘요",
    icon: "Info",
    category: "feature",
    tone: "yellow",
    namePrefix: "안내카드",
    acceptsChildren: false,
    props: [
      text("title", "카드 제목", "안내 제목", 28),
      area("body", "안내 내용", "웹앱에서 알려 줄 내용을 적어 보세요.", 220, 6),
    ],
    events: [],
  },
  {
    type: "checklist",
    name: "활동 체크",
    hint: "할 일을 하나씩 완료해요",
    icon: "ListChecks",
    category: "feature",
    tone: "mint",
    namePrefix: "활동체크",
    acceptsChildren: false,
    props: [
      text("title", "체크 목록 제목", "나의 할 일", 28),
      {
        key: "items",
        label: "체크할 항목",
        kind: "itemlist",
        default: [
          { id: "check-1", text: "첫 번째 할 일" },
          { id: "check-2", text: "두 번째 할 일" },
        ],
        group: "content",
        maxItems: 10,
        help: "한 줄에 하나씩 적어요",
      },
      {
        key: "daily",
        label: "날마다 새로 시작",
        kind: "boolean",
        default: true,
        group: "behavior",
        help: "체크와 직접 적은 할 일을 날짜별로 나눠 담아요",
      },
    ],
    events: [{ id: "item-checked", label: "항목을 체크했을 때" }],
  },
  {
    type: "journal",
    name: "나의 기록",
    hint: "생각을 적고 저장해요",
    icon: "NotebookPen",
    category: "feature",
    tone: "blue",
    namePrefix: "나의기록",
    acceptsChildren: false,
    props: [
      text("title", "기록 제목", "나의 기록", 28),
      area("prompt", "입력창 안내 문구", "오늘 기억하고 싶은 내용을 적어 보세요.", 120),
      text("buttonLabel", "저장 버튼 글", "기록 저장", 20),
    ],
    events: [{ id: "saved", label: "기록을 저장했을 때" }],
  },
  {
    type: "camp-report",
    name: "3일 캠프 기록",
    hint: "12차시·사진·소감을 모아요",
    icon: "FileText",
    category: "feature",
    tone: "blue",
    namePrefix: "캠프기록",
    acceptsChildren: false,
    maxPerScreen: 1,
    props: [
      text("title", "보고서 제목", "나의 3일 캠프 활동 보고서", 36),
      area(
        "activityPrompt",
        "활동 입력 안내",
        "이번 차시에 배우고 활동한 내용을 적어 보세요.",
        140,
      ),
      area(
        "finalPrompt",
        "마지막 전체 소감 안내",
        "3일 동안 가장 기억에 남은 활동과 앞으로 해 보고 싶은 것을 적어 보세요.",
        160,
      ),
      // 예전에 적어 둔 문구를 잃지 않으려고 자리만 남겨 둡니다. 차시별 느낀 점
      // 입력은 마지막 소감으로 합쳐져서 속성 판에는 보이지 않습니다.
      {
        key: "reflectionPrompt",
        label: "차시별 느낀 점 안내",
        kind: "textarea",
        default: "",
        group: "content",
        max: 160,
        hidden: true,
      },
    ],
    events: [
      { id: "session-saved", label: "차시 기록을 저장했을 때" },
      { id: "printed", label: "보고서 인쇄를 눌렀을 때" },
    ],
  },
  {
    type: "chatbot",
    name: "나만의 챗봇",
    hint: "내 질문과 답으로 만들어요",
    icon: "Bot",
    category: "feature",
    tone: "violet",
    namePrefix: "챗봇",
    acceptsChildren: false,
    maxPerScreen: 1,
    props: [
      text("botName", "챗봇 이름", "나의 챗봇", 26),
      area("greeting", "첫 인사", "안녕하세요! 아래에서 궁금한 내용을 골라 주세요.", 160),
      {
        key: "inputEnabled",
        label: "직접 질문 입력",
        kind: "boolean",
        default: true,
        group: "behavior",
      },
      text("placeholder", "입력창 안내 문구", "내가 만든 질문을 입력해 보세요", 44),
      area(
        "fallback",
        "답을 찾지 못했을 때",
        "아직 내가 답을 만들지 않은 질문이에요. 아래 질문 버튼 중 하나를 골라 주세요.",
        180,
      ),
      {
        key: "qa",
        label: "내 질문과 답",
        kind: "qalist",
        default: [
          {
            id: "first-help",
            label: "도움 요청",
            response: "내가 이 챗봇에 직접 만든 답이에요.",
            icon: "message" as const,
          },
        ],
        group: "content",
        maxItems: 12,
      },
    ],
    events: [{ id: "asked", label: "질문을 눌렀을 때" }],
  },
];

/** 꾸미기 속성은 구분선과 배치 부품을 포함해 모든 부품이 함께 가집니다. */
function withCommon(spec: ComponentSpec): ComponentSpec {
  const own = new Set(spec.props.map((prop) => prop.key));
  const shared = commonProps().filter((prop) => !own.has(prop.key));
  // 배치 부품은 글자를 직접 그리지 않으므로 글자 속성은 뺍니다.
  const skip = spec.acceptsChildren
    ? new Set(["fontSize", "font", "bold", "textColor", "align"])
    : new Set<string>();
  return {
    ...spec,
    props: [...spec.props, ...shared.filter((prop) => !skip.has(prop.key))],
  };
}

export const REGISTRY: Record<ComponentTypeId, ComponentSpec> = Object.freeze(
  Object.fromEntries(
    SPECS.map((spec) => [spec.type, withCommon(spec)]),
  ) as Record<ComponentTypeId, ComponentSpec>,
);

export const CATEGORIES: Array<{
  id: CategoryId;
  label: string;
  types: ComponentTypeId[];
}> = [
  {
    id: "basic",
    label: "기본",
    types: ["label", "image", "button", "divider", "list"],
  },
  {
    id: "input",
    label: "입력",
    types: ["textbox", "checkbox", "switch", "slider"],
  },
  { id: "layout", label: "배치", types: ["row", "column"] },
  {
    id: "feature",
    label: "웹앱 기능",
    types: ["notice-card", "checklist", "journal", "camp-report", "chatbot"],
  },
];

export const COMPONENT_TYPES = SPECS.map((spec) => spec.type);

export function isComponentType(value: unknown): value is ComponentTypeId {
  return typeof value === "string" && value in REGISTRY;
}

export function specFor(type: ComponentTypeId) {
  return REGISTRY[type];
}

export function propSpec(type: ComponentTypeId, key: string) {
  return REGISTRY[type].props.find((prop) => prop.key === key);
}

/** 목록 속성은 배열이라 그대로 나눠 쓰면 한쪽을 고칠 때 다른 쪽도 바뀝니다. */
export function clonePropValue(value: PropValue): PropValue {
  if (!Array.isArray(value)) return value;
  const items = value as Array<ListItem | QaItem>;
  return items.map((item) => ({ ...item })) as unknown as PropValue;
}

/** 기본값을 모두 채운 속성 묶음입니다. 화면을 그릴 때 씁니다. */
export function defaultProps(type: ComponentTypeId): Record<string, PropValue> {
  const out: Record<string, PropValue> = {};
  for (const prop of REGISTRY[type].props) {
    out[prop.key] = clonePropValue(prop.default);
  }
  return out;
}
