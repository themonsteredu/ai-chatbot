/**
 * 부품의 꾸미기 속성을 실제 모양으로 바꿉니다.
 *
 * 학생이 아무 값이나 넣어 화면이 깨지지 않도록, 자유로운 CSS 대신 정해진 값
 * 몇 가지만 씁니다. 색만 직접 고를 수 있습니다.
 *
 * 색을 겉칸에만 칠하면 눈에 보이지 않습니다. 버튼 얼굴이나 카드 제목처럼 제
 * 색을 따로 정해 둔 자리가 CSS에 있어서, 고른 색은 CSS 변수로도 함께
 * 내려보냅니다. globals.css가 그 자리마다 `var(--part-ink, 원래 색)`으로 받아
 * 학생이 고른 색을 먼저 씁니다.
 */

import type { CSSProperties } from "react";
import type { PropValue } from "../../../lib/chatbot-studio";

/** 인라인 스타일에 CSS 변수도 함께 실어 보냅니다. */
export type PartStyle = CSSProperties & Record<`--${string}`, string>;

const FONT_SIZE: Record<string, string> = {
  sm: "12px",
  md: "14px",
  lg: "17px",
  xl: "22px",
};

/**
 * 글꼴은 기기에 이미 있는 것만 씁니다. 교실 태블릿이 인터넷 없이도 같은 웹앱을
 * 열어야 해서 내려받는 글꼴은 두지 않습니다. 앞의 글꼴이 없는 기기는 뒤에 적은
 * 글꼴로 대신 보여 줍니다.
 */
export const FONT_STACK: Record<string, string> = {
  gothic:
    'Pretendard, "Noto Sans KR", "Apple SD Gothic Neo", "맑은 고딕", "Malgun Gothic", sans-serif',
  myeongjo:
    '"Noto Serif KR", "Nanum Myeongjo", AppleMyungjo, 바탕, Batang, serif',
  handwriting:
    '"Nanum Pen Script", Gaegu, 궁서, Gungsuh, "Bradley Hand", "Segoe Print", cursive',
  typewriter:
    'ui-monospace, D2Coding, "Nanum Gothic Coding", 굴림체, GulimChe, Consolas, monospace',
};

const SPACE: Record<string, string> = {
  none: "0px",
  sm: "6px",
  md: "12px",
  lg: "20px",
};

/** 넓은 것부터 좁은 것 차례입니다. 가장자리를 끌어 조절할 때 이 차례로 걸립니다. */
export const WIDTH_STEPS = ["full", "two-thirds", "half", "auto"] as const;

const WIDTH: Record<string, string> = {
  full: "100%",
  "two-thirds": "66%",
  half: "50%",
  auto: "fit-content",
};

const JUSTIFY: Record<string, string> = {
  start: "flex-start",
  center: "center",
  between: "space-between",
};

const text = (value: PropValue | undefined, fallback: string) =>
  typeof value === "string" && value ? value : fallback;

export type StyledProps = Record<string, PropValue>;

export type PartStyleOptions = {
  /**
   * 배경을 겉칸이 아니라 안쪽이 직접 칠합니다. 버튼처럼 눌리는 얼굴이 따로
   * 있는 부품은 겉칸을 칠하면 얼굴 둘레에 색 테두리만 생깁니다.
   */
  innerFill?: boolean;
};

/** 모든 부품이 함께 쓰는 겉모습입니다. */
export function partStyle(
  props: StyledProps,
  options: PartStyleOptions = {},
): PartStyle {
  const style: PartStyle = {};

  const size = FONT_SIZE[text(props.fontSize, "md")];
  if (size) style.fontSize = size;
  if (props.bold === true) style.fontWeight = 800;

  const family = FONT_STACK[text(props.font, "")];
  if (family) style.fontFamily = family;

  const color = text(props.textColor, "");
  if (color) {
    style.color = color;
    style["--part-ink"] = color;
  }

  const background = text(props.background, "");
  if (background) {
    if (!options.innerFill) style.backgroundColor = background;
    style["--part-surface"] = background;
  }

  const align = text(props.align, "left");
  if (align !== "left") style.textAlign = align as CSSProperties["textAlign"];

  const padding = SPACE[text(props.padding, "md")];
  if (padding !== undefined) style.padding = padding;

  const width = WIDTH[text(props.width, "full")];
  if (width) style.width = width;
  // 절반 너비인데 가운데 정렬이면 가운데로 놓이는 게 자연스럽습니다.
  if (width !== "100%" && align === "center") style.marginInline = "auto";

  return style;
}

export function containerStyle(props: StyledProps): PartStyle {
  const style: PartStyle = { gap: SPACE[text(props.gap, "md")] ?? "12px" };

  // 배치 부품은 배경만 칠하고 CSS 변수는 내려보내지 않습니다. 변수는 아래로
  // 흘러서, 안에 담은 버튼까지 배치 부품 색으로 칠해 버립니다.
  const background = text(props.background, "");
  if (background) style.backgroundColor = background;

  const width = WIDTH[text(props.width, "full")];
  if (width) style.width = width;

  const justify = JUSTIFY[text(props.justify, "start")];
  if (justify) style.justifyContent = justify;

  return style;
}

export function isVisible(props: StyledProps) {
  return props.visible !== false;
}
