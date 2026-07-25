export type ElementKind =
  | "heading"
  | "text"
  | "button"
  | "card"
  | "input"
  | "checklist"
  | "badge"
  | "image"
  | "html";

export type StudioAction =
  | "none"
  | "save-record"
  | "show-message"
  | "open-link";

export type TextAlign = "left" | "center" | "right";

export type ElementStyle = {
  fill: string;
  color: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  opacity: number;
  textAlign: TextAlign;
  shadow: boolean;
};

export type StudioElement = {
  id: string;
  kind: ElementKind;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  hidden: boolean;
  locked: boolean;
  content: string;
  items: string[];
  placeholder: string;
  fieldName: string;
  imageUrl: string;
  action: StudioAction;
  actionValue: string;
  style: ElementStyle;
};

export type ProjectBrief = {
  problem: string;
  audience: string;
  outcome: string;
};

export type CanvasSettings = {
  width: number;
  height: number;
  background: string;
};

export type StudioProject = {
  id: string;
  name: string;
  brief: ProjectBrief;
  canvas: CanvasSettings;
  elements: StudioElement[];
  customCss: string;
  customJs: string;
};
