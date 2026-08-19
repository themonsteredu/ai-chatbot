"use client";

import { createElement } from "react";
import type { ComponentTypeId } from "../../../lib/chatbot-studio";
import { iconFor } from "./icons";

/**
 * 부품 종류에 맞는 그림입니다. 사전은 아이콘을 이름으로만 들고 있어서, 그림을
 * 붙이는 일은 화면 쪽인 여기서 합니다.
 */
export function PartIcon({
  type,
  size = 16,
}: {
  type: ComponentTypeId;
  size?: number;
}) {
  return createElement(iconFor(type), { size, "aria-hidden": true });
}
