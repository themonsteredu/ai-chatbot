/**
 * 프로젝트 자료를 다루는 입구입니다. 실제 내용은 `lib/project` 아래에 나뉘어
 * 있고, 여기서는 화면과 서버가 쓰는 것만 모아 내보냅니다.
 */

export type StudioMode = "designer" | "blocks";

export {
  PROJECT_SCHEMA_VERSION,
  SCREEN_TARGET,
  EMPTY_PROGRAM,
} from "./project/types";

export type {
  Action,
  ActionIcon,
  ActionKind,
  BlockProgram,
  BlockVariable,
  CmpOp,
  NowPart,
  SoundName,
  ComponentNode,
  ComponentTypeId,
  EventBlock,
  EventId,
  Expr,
  ListItem,
  LogicOp,
  MathOp,
  PropValue,
  QaItem,
  Screen,
  Selection,
  TemplateId,
  WebAppProject,
} from "./project/types";

export {
  ACTION_ICON_LABELS,
  BLANK_PROJECT,
  CAMP_PROJECT,
  DEFAULT_PROJECT,
  NOTICE_PROJECT,
  PROJECT_TEMPLATES,
} from "./project/defaults";

export { cloneProject, normalizeProject } from "./project/normalize";

export {
  MANIFEST_PROJECT_LIMIT,
  SHARE_PROJECT_LIMIT,
  canonicalShareOrigin,
  compactProject,
  decodeProject,
  encodeProject,
} from "./project/encode";
