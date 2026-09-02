/**
 * 웹앱 설계를 담는 자료 구조입니다.
 *
 * v3까지는 기능 여섯 가지가 각각 켜짐/꺼짐 스위치 하나였습니다. 그래서 버튼을
 * 두 개 놓을 자리가 아예 없었고, 부품 이름을 바꿀 수도, 부품을 다른 부품 안에
 * 넣을 수도 없었습니다. v4는 App Inventor처럼 **부품 하나하나가 트리의 마디**가
 * 됩니다.
 */

export const PROJECT_SCHEMA_VERSION = 4 as const;

export type TemplateId = "blank" | "camp" | "notice";

export type ActionIcon =
  | "book"
  | "backpack"
  | "home"
  | "sparkles"
  | "heart"
  | "message";

/** 체크 목록·일반 목록의 한 줄입니다. */
export type ListItem = { id: string; text: string };

/** 챗봇에 학생이 직접 등록한 질문과 답 한 쌍입니다. */
export type QaItem = {
  id: string;
  label: string;
  response: string;
  icon: ActionIcon;
};

export type PropValue = string | number | boolean | ListItem[] | QaItem[];

export type ComponentTypeId =
  // 기본
  | "label"
  | "image"
  | "button"
  | "divider"
  | "list"
  // 입력
  | "textbox"
  | "checkbox"
  | "switch"
  | "slider"
  // 배치
  | "row"
  | "column"
  // 기능 (v3부터 쓰던 완성형 부품)
  | "notice-card"
  | "checklist"
  | "journal"
  | "camp-report"
  | "chatbot";

/**
 * 화면에 놓인 부품 하나입니다.
 *
 * `props`에는 **기본값과 다른 값만** 담습니다. 꾸미지 않은 라벨 하나가
 * 스무 개의 기본 속성을 이고 다니면 QR에 실을 주소가 금방 한도를 넘습니다.
 */
export type ComponentNode = {
  id: string;
  type: ComponentTypeId;
  /** 학생이 바꿀 수 있는 이름입니다. 블록에서 부품을 고를 때 보입니다. */
  name: string;
  props: Record<string, PropValue>;
  /** 배치 부품만 가집니다. */
  children?: ComponentNode[];
};

export type Screen = {
  id: string;
  name: string;
  children: ComponentNode[];
};

/* ------------------------------------------------------------------ */
/* 블록                                                                */
/* ------------------------------------------------------------------ */

export type EventId =
  | "open"
  /** 화면이 열려 있는 동안 몇 초마다 되풀이됩니다. */
  | "tick"
  | "click"
  | "change"
  | "item-checked"
  | "saved"
  | "session-saved"
  | "printed"
  | "asked";

/** ‘지금’ 블록이 꺼내 주는 것입니다. */
export type NowPart = "날짜" | "시각" | "요일" | "년" | "월" | "일" | "시" | "분" | "초";

/** 소리 내기 블록이 낼 수 있는 소리입니다. */
export type SoundName = "딩동" | "짝짝" | "삑" | "북";

export type MathOp = "+" | "-" | "×" | "÷";
export type CmpOp = "=" | "≠" | ">" | "<" | "≥" | "≤";
export type LogicOp = "그리고" | "또는";

/** 블록 구멍에 끼우는 값입니다. */
export type Expr =
  | { k: "text"; v: string }
  | { k: "num"; v: number }
  | { k: "bool"; v: boolean }
  | { k: "var"; name: string }
  | { k: "prop"; target: string; prop: string }
  | { k: "math"; op: MathOp; a: Expr; b: Expr }
  | { k: "cmp"; op: CmpOp; a: Expr; b: Expr }
  | { k: "logic"; op: LogicOp; a: Expr; b: Expr }
  | { k: "join"; parts: Expr[] }
  /** min과 max 사이에서 아무 수나 하나 고릅니다. 주사위·뽑기에 씁니다. */
  | { k: "random"; min: Expr; max: Expr }
  /** 오늘 날짜나 지금 시각입니다. */
  | { k: "now"; part: NowPart }
  /** 글자 수입니다. 목록이면 줄 수입니다. */
  | { k: "len"; of: Expr };

/** 이벤트가 일어났을 때 차례로 실행하는 동작입니다. */
export type Action =
  | { id: string; kind: "set-prop"; target: string; prop: string; value: Expr }
  | { id: string; kind: "show-message"; value: Expr }
  | { id: string; kind: "set-var"; name: string; value: Expr }
  | { id: string; kind: "if"; test: Expr; then: Action[]; otherwise?: Action[] }
  | { id: string; kind: "repeat"; times: Expr; body: Action[] }
  | { id: string; kind: "open-screen"; screen: string }
  /** 소리를 냅니다. 맞혔을 때·틀렸을 때를 귀로 알려 줍니다. */
  | { id: string; kind: "play-sound"; sound: SoundName };

export type ActionKind = Action["kind"];

/** 화면이나 부품 하나에 붙은 이벤트 묶음입니다. */
export type EventBlock = {
  id: string;
  /** 부품 아이디, 또는 화면 자체를 뜻하는 "screen". */
  componentId: string;
  event: EventId;
  body: Action[];
  /** "tick"일 때 몇 초마다 되풀이할지입니다. */
  every?: number;
};

export type BlockVariable = {
  name: string;
  initial: Expr;
  /**
   * 켜면 웹앱을 닫았다 열어도 값이 남습니다. 점수나 기록처럼 이어져야 하는
   * 값에 씁니다. 끄면 열 때마다 첫 값으로 시작합니다.
   */
  remember?: boolean;
};

export type BlockProgram = {
  events: EventBlock[];
  variables: BlockVariable[];
};

export const EMPTY_PROGRAM: BlockProgram = { events: [], variables: [] };

/** 화면 자체를 가리키는 블록 대상입니다. */
export const SCREEN_TARGET = "screen";

/* ------------------------------------------------------------------ */
/* 프로젝트                                                            */
/* ------------------------------------------------------------------ */

/**
 * 웹앱 이름·소개·색은 트리에 넣지 않고 그대로 둡니다. 보관함 목록, 홈 화면
 * 설치용 매니페스트, 반 제출 목록이 모두 이 값들을 곧바로 읽기 때문입니다.
 */
export type WebAppProject = {
  version: typeof PROJECT_SCHEMA_VERSION;
  template: TemplateId;
  title: string;
  appName: string;
  subtitle: string;
  accent: string;
  screenBackground: string;
  screens: Screen[];
  blocks: BlockProgram;
};

/** 속성 판에서 지금 무엇을 고르고 있는지 가리킵니다. */
export type Selection =
  | { kind: "screen" }
  | { kind: "header" }
  | { kind: "component"; id: string };
