import {
  Backpack,
  Bot,
  BookOpen,
  Columns3,
  FileText,
  Heart,
  Home,
  Image as ImageIcon,
  Info,
  List,
  ListChecks,
  MessageCircle,
  Minus,
  MousePointerClick,
  NotebookPen,
  Rows3,
  SlidersHorizontal,
  Sparkles,
  SquareCheck,
  TextCursorInput,
  ToggleRight,
  Type,
  type LucideIcon,
} from "lucide-react";
import type { ActionIcon, ComponentTypeId } from "../../../lib/chatbot-studio";
import { REGISTRY } from "../../../lib/components/registry";

/** 사전은 아이콘을 이름으로만 들고 있습니다. 그림은 여기서 붙입니다. */
const BY_NAME: Record<string, LucideIcon> = {
  Bot,
  Columns3,
  FileText,
  ImageIcon,
  Info,
  List,
  ListChecks,
  Minus,
  MousePointerClick,
  NotebookPen,
  Rows3,
  SlidersHorizontal,
  SquareCheck,
  TextCursorInput,
  ToggleRight,
  Type,
};

export function iconFor(type: ComponentTypeId): LucideIcon {
  return BY_NAME[REGISTRY[type].icon] ?? Type;
}

/** 챗봇 질문 버튼에 붙는 그림입니다. */
export const QUESTION_ICONS: Record<ActionIcon, LucideIcon> = {
  book: BookOpen,
  backpack: Backpack,
  home: Home,
  sparkles: Sparkles,
  heart: Heart,
  message: MessageCircle,
};
