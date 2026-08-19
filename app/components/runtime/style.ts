/**
 * 부품의 꾸미기 속성을 실제 모양으로 바꿉니다.
 *
 * 학생이 아무 값이나 넣어 화면이 깨지지 않도록, 자유로운 CSS 대신 정해진 값
 * 몇 가지만 씁니다. 색만 직접 고를 수 있습니다.
 */

import type { CSSProperties } from "react";
import type { PropValue } from "../../../lib/chatbot-studio";

const FONT_SIZE: Record<string, string> = {
  sm: "12px",
  md: "14px",
  lg: "17px",
  xl: "22px",
};

const SPACE: Record<string, string> = {
  none: "0px",
  sm: "6px",
  md: "12px",
  lg: "20px",
};

const WIDTH: Record<string, string> = {
  full: "100%",
  auto: "fit-content",
  half: "50%",
};

const JUSTIFY: Record<string, string> = {
  start: "flex-start",
  center: "center",
  between: "space-between",
};

const text = (value: PropValue | undefined, fallback: string) =>
  typeof value === "string" && value ? value : fallback;

export type StyledProps = Record<string, PropValue>;

/** 모든 부품이 함께 쓰는 겉모습입니다. */
export function partStyle(props: StyledProps): CSSProperties {
  const style: CSSProperties = {};

  const size = FONT_SIZE[text(props.fontSize, "md")];
  if (size) style.fontSize = size;
  if (props.bold === true) style.fontWeight = 800;

  const color = text(props.textColor, "");
  if (color) style.color = color;

  const background = text(props.background, "");
  if (background) style.backgroundColor = background;

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

export function containerStyle(props: StyledProps): CSSProperties {
  const style: CSSProperties = { gap: SPACE[text(props.gap, "md")] ?? "12px" };

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
