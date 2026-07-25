"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  BookOpen,
  CalendarDays,
  Cat,
  Check,
  CircleCheckBig,
  Code2,
  GitBranch,
  GripVertical,
  Hammer,
  Lightbulb,
  LockKeyhole,
  Megaphone,
  MessageCircle,
  Palette,
  PencilLine,
  Puzzle,
  Rocket,
  Save,
  School,
  Send,
  Smile,
  Sparkles,
  Split,
  TextCursorInput,
  Trash2,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";

type BlockType =
  | "announcement"
  | "journal"
  | "checklist"
  | "schedule"
  | "faq"
  | "choice"
  | "custom";

type ThemeId = "violet" | "mint" | "sunset" | "navy";

type IconName =
  | "megaphone"
  | "pencil"
  | "checklist"
  | "calendar"
  | "lightbulb"
  | "split"
  | "sparkles"
  | "rocket"
  | "school"
  | "book"
  | "puzzle"
  | "code";

type AvatarId = "bot" | "cat" | "sparkles" | "rocket" | "book" | "smile";

type BotBlock = {
  id: string;
  type: BlockType;
  icon: IconName;
  title: string;
  description: string;
  items: string[];
  script?: string;
};

type BotConfig = {
  name: string;
  subtitle: string;
  welcome: string;
  emoji: AvatarId;
  theme: ThemeId;
  accent?: string;
  canvas?: string;
  radius?: number;
  fontScale?: number;
  menuColumns?: 1 | 2;
  blocks: BotBlock[];
};

type Template = {
  id: string;
  name: string;
  tag: string;
  icon: IconName;
  description: string;
  config: BotConfig;
};

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const makeBlock = (
  type: BlockType,
  icon: IconName,
  title: string,
  description: string,
  items: string[] = [],
  script = "",
): BotBlock => ({ id: uid(), type, icon, title, description, items, script });

const cloneConfig = (config: BotConfig): BotConfig =>
  normalizeConfig({
    ...config,
    blocks: config.blocks.map((block) => ({
      ...block,
      id: uid(),
      items: [...block.items],
      script: block.script ?? "",
    })),
  });

const blockCatalog: Array<{
  type: BlockType;
  icon: IconName;
  name: string;
  hint: string;
  defaultDescription: string;
  items?: string[];
  script?: string;
}> = [
  {
    type: "custom",
    icon: "code",
    name: "직접 기능 만들기",
    hint: "한국어 명령으로 동작을 설계해요",
    defaultDescription: "내가 직접 순서와 동작을 작성한 기능이에요.",
    script:
      "말하기: 안녕하세요! 직접 만든 기능이에요.\n질문하기: 이름이 무엇인가요?\n입력받기: 이름\n저장하기: 이름\n말하기: 반가워요, {{이름}}님!",
  },
  {
    type: "announcement",
    icon: "megaphone",
    name: "안내",
    hint: "소식과 공지를 보여줘요",
    defaultDescription: "새로운 안내 내용을 입력해 주세요.",
  },
  {
    type: "journal",
    icon: "pencil",
    name: "기록",
    hint: "생각과 활동을 남겨요",
    defaultDescription: "오늘의 생각이나 활동을 자유롭게 기록해 보세요.",
  },
  {
    type: "checklist",
    icon: "checklist",
    name: "체크리스트",
    hint: "미션을 하나씩 완료해요",
    defaultDescription: "완료한 항목에 체크해 보세요.",
    items: ["첫 번째 미션", "두 번째 미션", "마무리 확인"],
  },
  {
    type: "schedule",
    icon: "calendar",
    name: "일정",
    hint: "순서와 시간을 알려줘요",
    defaultDescription: "오늘의 일정을 확인해 보세요.",
    items: ["09:30 시작하기", "10:00 활동하기", "11:30 함께 나누기"],
  },
  {
    type: "faq",
    icon: "lightbulb",
    name: "질문 답변",
    hint: "자주 묻는 질문에 답해요",
    defaultDescription: "궁금한 질문을 선택해 보세요.",
    items: ["어떻게 시작하나요?", "무엇을 준비하나요?", "도움은 어디서 받나요?"],
  },
  {
    type: "choice",
    icon: "split",
    name: "선택",
    hint: "버튼으로 다음 길을 골라요",
    defaultDescription: "어떤 활동을 해볼까요?",
    items: ["첫 번째 선택", "두 번째 선택"],
  },
];

const templates: Template[] = [
  {
    id: "blank",
    name: "빈 챗봇",
    tag: "자유 제작",
    icon: "sparkles",
    description: "처음부터 내 아이디어로 만들어요.",
    config: {
      name: "나의 챗봇",
      subtitle: "무엇이든 물어보세요",
      welcome: "안녕하세요! 내가 만든 챗봇이에요. 무엇을 도와드릴까요?",
      emoji: "bot",
      theme: "violet",
      blocks: [],
    },
  },
  {
    id: "camp",
    name: "AI 캠프 기록봇",
    tag: "추천",
    icon: "rocket",
    description: "일정, 미션, 배운 내용을 한곳에 모아요.",
    config: {
      name: "나의 AI 캠프봇",
      subtitle: "배우고, 만들고, 기록해요",
      welcome: "반가워요! 오늘 캠프 활동을 함께 시작해 볼까요?",
      emoji: "rocket",
      theme: "violet",
      blocks: [
        makeBlock(
          "schedule",
          "calendar",
          "오늘의 일정",
          "오늘 진행할 활동 순서예요.",
          ["09:30 AI 만나기", "10:20 챗봇 기획", "11:10 나만의 봇 만들기"],
        ),
        makeBlock(
          "journal",
          "pencil",
          "오늘 배운 내용",
          "오늘 새롭게 알게 된 점을 한 문장으로 남겨 보세요.",
        ),
        makeBlock(
          "checklist",
          "checklist",
          "나의 미션",
          "완료한 미션에 체크해 보세요.",
          ["챗봇 이름 정하기", "대화 기능 3개 넣기", "친구에게 테스트 받기"],
        ),
        makeBlock(
          "faq",
          "lightbulb",
          "궁금한 점",
          "자주 묻는 질문을 골라 보세요.",
          ["챗봇은 어떻게 말하나요?", "내 기록은 어디에 있나요?", "친구에게 어떻게 보여주나요?"],
        ),
      ],
    },
  },
  {
    id: "class",
    name: "우리 반 알림봇",
    tag: "학급",
    icon: "school",
    description: "공지, 준비물, 할 일을 쉽게 안내해요.",
    config: {
      name: "우리 반 알림봇",
      subtitle: "오늘도 즐거운 하루!",
      welcome: "안녕하세요! 오늘의 알림과 준비물을 확인해 보세요.",
      emoji: "smile",
      theme: "mint",
      blocks: [
        makeBlock("announcement", "megaphone", "오늘의 알림", "내일은 체육 활동이 있어요. 편한 옷을 준비해 주세요."),
        makeBlock(
          "checklist",
          "checklist",
          "준비물",
          "준비한 물건에 체크해 보세요.",
          ["필기도구", "물병", "체육복"],
        ),
        makeBlock(
          "schedule",
          "calendar",
          "이번 주 일정",
          "우리 반의 이번 주 중요한 일정이에요.",
          ["월요일 독서 활동", "수요일 체육 활동", "금요일 모둠 발표"],
        ),
      ],
    },
  },
  {
    id: "reading",
    name: "독서 활동봇",
    tag: "독서",
    icon: "book",
    description: "책을 읽고 생각과 질문을 기록해요.",
    config: {
      name: "나의 독서 친구",
      subtitle: "책 속 생각을 꺼내 봐요",
      welcome: "오늘 읽은 책은 어땠나요? 기억하고 싶은 이야기를 들려주세요.",
      emoji: "book",
      theme: "sunset",
      blocks: [
        makeBlock("journal", "pencil", "인상 깊은 문장", "가장 기억에 남는 문장과 그 이유를 적어 보세요."),
        makeBlock("journal", "sparkles", "나의 감상", "책을 읽고 든 생각이나 느낌을 자유롭게 남겨 보세요."),
        makeBlock(
          "choice",
          "split",
          "토론 질문",
          "친구들과 이야기해 보고 싶은 질문을 선택해 보세요.",
          ["주인공의 선택에 동의하나요?", "나라면 어떻게 행동했을까요?"],
        ),
      ],
    },
  },
];

const themes: Array<{ id: ThemeId; name: string; color: string; soft: string }> = [
  { id: "violet", name: "보라", color: "#5b4bff", soft: "#eeecff" },
  { id: "mint", name: "민트", color: "#087f68", soft: "#dff8f1" },
  { id: "sunset", name: "노을", color: "#d9572b", soft: "#fff0e8" },
  { id: "navy", name: "남색", color: "#183153", soft: "#e8f0fb" },
];

const iconMap: Record<IconName, LucideIcon> = {
  megaphone: Megaphone,
  pencil: PencilLine,
  checklist: CircleCheckBig,
  calendar: CalendarDays,
  lightbulb: Lightbulb,
  split: Split,
  sparkles: Sparkles,
  rocket: Rocket,
  school: School,
  book: BookOpen,
  puzzle: Puzzle,
  code: Code2,
};

const avatarMap: Record<AvatarId, LucideIcon> = {
  bot: Bot,
  cat: Cat,
  sparkles: WandSparkles,
  rocket: Rocket,
  book: BookOpen,
  smile: Smile,
};

const avatarOptions: Array<{ id: AvatarId; label: string }> = [
  { id: "bot", label: "로봇" },
  { id: "cat", label: "고양이" },
  { id: "sparkles", label: "마법" },
  { id: "rocket", label: "로켓" },
  { id: "book", label: "책" },
  { id: "smile", label: "미소" },
];

const blockIconOptions: IconName[] = [
  "megaphone",
  "pencil",
  "checklist",
  "calendar",
  "lightbulb",
  "split",
  "sparkles",
  "code",
];

const defaultIconByType: Record<BlockType, IconName> = {
  announcement: "megaphone",
  journal: "pencil",
  checklist: "checklist",
  schedule: "calendar",
  faq: "lightbulb",
  choice: "split",
  custom: "code",
};

const legacyIconMap: Record<string, IconName> = {
  "📢": "megaphone",
  "✏️": "pencil",
  "📝": "pencil",
  "💭": "sparkles",
  "✅": "checklist",
  "🎒": "checklist",
  "🗓️": "calendar",
  "💡": "lightbulb",
  "🔀": "split",
  "🗣️": "split",
};

const legacyAvatarMap: Record<string, AvatarId> = {
  "🤖": "bot",
  "🚀": "rocket",
  "🏫": "smile",
  "📚": "book",
  "✨": "sparkles",
};

function resolveIconName(value: string, type: BlockType): IconName {
  if (value in iconMap) return value as IconName;
  return legacyIconMap[value] ?? defaultIconByType[type];
}

function resolveAvatar(value: string): AvatarId {
  if (value in avatarMap) return value as AvatarId;
  return legacyAvatarMap[value] ?? "bot";
}

function normalizeConfig(config: BotConfig): BotConfig {
  const selectedTheme =
    themes.find((item) => item.id === config.theme) ?? themes[0];
  return {
    ...config,
    emoji: resolveAvatar(config.emoji),
    accent: config.accent ?? selectedTheme.color,
    canvas: config.canvas ?? "#f8f7ff",
    radius: config.radius ?? 12,
    fontScale: config.fontScale ?? 1,
    menuColumns: config.menuColumns === 1 ? 1 : 2,
    blocks: config.blocks.map((block) => ({
      ...block,
      icon: resolveIconName(block.icon, block.type),
      items: Array.isArray(block.items) ? block.items : [],
      script: block.script ?? "",
    })),
  };
}

function CuteIcon({
  name,
  size = 18,
  strokeWidth = 2.2,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}) {
  const Icon = iconMap[name];
  return <Icon aria-hidden="true" size={size} strokeWidth={strokeWidth} />;
}

function AvatarIcon({ name, size = 21 }: { name: AvatarId; size?: number }) {
  const Icon = avatarMap[name];
  return <Icon aria-hidden="true" size={size} strokeWidth={2.2} />;
}

function encodeConfig(config: BotConfig) {
  const bytes = new TextEncoder().encode(JSON.stringify(config));
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function decodeConfig(value: string): BotConfig | null {
  try {
    const binary = atob(value);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return normalizeConfig(JSON.parse(new TextDecoder().decode(bytes)) as BotConfig);
  } catch {
    return null;
  }
}

type ScriptCommand = {
  id: string;
  kind: "say" | "ask" | "input" | "choice" | "check" | "save" | "condition";
  value: string;
};

const commandKindMap: Record<string, ScriptCommand["kind"]> = {
  말하기: "say",
  질문하기: "ask",
  입력받기: "input",
  선택하기: "choice",
  체크하기: "check",
  저장하기: "save",
  조건: "condition",
};

function parseScript(script: string): ScriptCommand[] {
  return script
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const separator = line.indexOf(":");
      const rawCommand = separator >= 0 ? line.slice(0, separator).trim() : "말하기";
      const value = separator >= 0 ? line.slice(separator + 1).trim() : line;
      return {
        id: `${index}-${rawCommand}-${value}`,
        kind: commandKindMap[rawCommand] ?? "say",
        value,
      };
    });
}

export default function Home() {
  const [config, setConfig] = useState<BotConfig>(() => cloneConfig(templates[1].config));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState("준비됨");
  const [shareStatus, setShareStatus] = useState("공유 링크 복사");
  const [toast, setToast] = useState("");
  const [mobileTab, setMobileTab] = useState<"build" | "preview">("build");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const selectedBlock = useMemo(
    () => config.blocks.find((block) => block.id === selectedId) ?? null,
    [config.blocks, selectedId],
  );

  const activePreview = useMemo(
    () => config.blocks.find((block) => block.id === activePreviewId) ?? null,
    [config.blocks, activePreviewId],
  );

  const theme = themes.find((item) => item.id === config.theme) ?? themes[0];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const shared = window.location.hash.startsWith("#bot=")
        ? decodeConfig(window.location.hash.slice(5))
        : null;
      const saved = localStorage.getItem("chatbot-maker-project");
      if (shared) {
        setConfig(shared);
        setToast("공유된 챗봇을 불러왔어요.");
      } else if (saved) {
        try {
          setConfig(normalizeConfig(JSON.parse(saved) as BotConfig));
        } catch {
          localStorage.removeItem("chatbot-maker-project");
        }
      }
      loadedRef.current = true;
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loadedRef.current) return;
    const timer = window.setTimeout(() => {
      localStorage.setItem("chatbot-maker-project", JSON.stringify(config));
      setSaveStatus("자동 저장됨");
    }, 450);
    return () => window.clearTimeout(timer);
  }, [config]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const applyTemplate = (template: Template) => {
    setConfig(cloneConfig(template.config));
    setSelectedId(null);
    setActivePreviewId(null);
    setToast(`${template.name} 템플릿을 적용했어요.`);
  };

  const addBlock = (type: BlockType) => {
    const item = blockCatalog.find((catalogItem) => catalogItem.type === type);
    if (!item) return;
    const block = makeBlock(
      type,
      item.icon,
      item.name,
      item.defaultDescription,
      item.items ? [...item.items] : [],
      item.script ?? "",
    );
    setConfig((current) => ({ ...current, blocks: [...current.blocks, block] }));
    setSelectedId(block.id);
    setToast(`${item.name} 기능을 추가했어요.`);
  };

  const updateBlock = (changes: Partial<BotBlock>) => {
    if (!selectedId) return;
    setConfig((current) => ({
      ...current,
      blocks: current.blocks.map((block) =>
        block.id === selectedId ? { ...block, ...changes } : block,
      ),
    }));
  };

  const moveBlock = (direction: -1 | 1) => {
    if (!selectedId) return;
    setConfig((current) => {
      const index = current.blocks.findIndex((block) => block.id === selectedId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.blocks.length) return current;
      const nextBlocks = [...current.blocks];
      [nextBlocks[index], nextBlocks[nextIndex]] = [nextBlocks[nextIndex], nextBlocks[index]];
      return { ...current, blocks: nextBlocks };
    });
  };

  const dropBlock = (targetId: string) => {
    if (!draggingId || draggingId === targetId) return;
    setConfig((current) => {
      const sourceIndex = current.blocks.findIndex((block) => block.id === draggingId);
      const targetIndex = current.blocks.findIndex((block) => block.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) return current;
      const nextBlocks = [...current.blocks];
      const [moved] = nextBlocks.splice(sourceIndex, 1);
      nextBlocks.splice(targetIndex, 0, moved);
      return { ...current, blocks: nextBlocks };
    });
    setDraggingId(null);
  };

  const removeBlock = () => {
    if (!selectedId) return;
    setConfig((current) => ({
      ...current,
      blocks: current.blocks.filter((block) => block.id !== selectedId),
    }));
    setSelectedId(null);
    setToast("기능을 삭제했어요.");
  };

  const copyShareLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}#bot=${encodeConfig(config)}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus("복사 완료!");
      setToast("링크를 받은 사람은 이 챗봇을 바로 볼 수 있어요.");
      window.setTimeout(() => setShareStatus("공유 링크 복사"), 1800);
    } catch {
      window.prompt("아래 공유 링크를 복사해 주세요.", url);
    }
  };

  return (
    <main
      className="app-shell"
      style={
        {
          "--theme": config.accent ?? theme.color,
          "--theme-soft": `color-mix(in srgb, ${config.accent ?? theme.color} 12%, white)`,
          "--chat-canvas": config.canvas ?? "#f8f7ff",
          "--bubble-radius": `${config.radius ?? 12}px`,
          "--chat-scale": config.fontScale ?? 1,
        } as React.CSSProperties
      }
    >
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            C
          </div>
          <div>
            <strong>챗봇 메이커</strong>
            <span>아이디어를 대화로 만드는 스튜디오</span>
          </div>
        </div>
        <div className="topbar-actions">
          <span className="save-status">
            <span className="status-dot" aria-hidden="true" />
            {saveStatus}
          </span>
          <button className="secondary-button" type="button" onClick={() => setActivePreviewId(null)}>
            미리보기 초기화
          </button>
          <button className="primary-button" type="button" onClick={copyShareLink}>
            {shareStatus}
          </button>
        </div>
      </header>

      <section className="template-strip" aria-labelledby="template-title">
        <div className="template-heading">
          <span className="eyebrow">START</span>
          <div>
            <h1 id="template-title">어떤 챗봇을 만들까요?</h1>
            <p>템플릿으로 빠르게 시작하고 내 아이디어에 맞게 바꿔 보세요.</p>
          </div>
        </div>
        <div className="template-list">
          {templates.map((template) => (
            <button
              className="template-card"
              key={template.id}
              type="button"
              onClick={() => applyTemplate(template)}
            >
              <span className="template-icon">
                <CuteIcon name={template.icon} size={20} />
              </span>
              <span>
                <span className="template-name">
                  {template.name}
                  <small>{template.tag}</small>
                </span>
                <span className="template-description">{template.description}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <nav className="mobile-tabs" aria-label="모바일 작업 화면">
        <button
          type="button"
          className={mobileTab === "build" ? "active" : ""}
          onClick={() => setMobileTab("build")}
        >
          <Hammer aria-hidden="true" size={16} /> 만들기
        </button>
        <button
          type="button"
          className={mobileTab === "preview" ? "active" : ""}
          onClick={() => setMobileTab("preview")}
        >
          <MessageCircle aria-hidden="true" size={16} /> 미리보기
        </button>
      </nav>

      <div className={`studio ${mobileTab === "preview" ? "show-preview" : "show-build"}`}>
        <aside className="toolbox panel">
          <div className="panel-heading">
            <span className="step-number">1</span>
            <div>
              <h2>기능 고르기</h2>
              <p>필요한 기능을 눌러 추가하세요.</p>
            </div>
          </div>
          <div className="catalog">
            {blockCatalog.map((item) => (
              <button
                className={`catalog-item ${item.type === "custom" ? "custom-catalog-item" : ""}`}
                key={item.type}
                type="button"
                onClick={() => addBlock(item.type)}
              >
                <span className="catalog-icon">
                  <CuteIcon name={item.icon} />
                </span>
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.hint}</small>
                </span>
                <span className="add-mark">
                  <Sparkles aria-hidden="true" size={13} />
                </span>
              </button>
            ))}
          </div>
          <div className="tip-card">
            <Lightbulb aria-hidden="true" size={18} />
            <p>
              <strong>만들기 팁</strong>
              기능은 3~5개만 골라도 충분히 멋진 챗봇이 돼요.
            </p>
          </div>
        </aside>

        <section className="editor panel">
          <div className="panel-heading editor-heading">
            <span className="step-number">2</span>
            <div>
              <h2>내 챗봇 꾸미기</h2>
              <p>이름과 대화 내용을 자유롭게 바꿔 보세요.</p>
            </div>
          </div>

          <div className="settings-card identity-settings">
            <div className="settings-title">
              <h3>기본 정보</h3>
              <span>챗봇의 첫인상이에요</span>
            </div>
            <div className="form-grid">
              <fieldset className="avatar-field">
                <legend>캐릭터</legend>
                <div className="avatar-options">
                  {avatarOptions.map((avatar) => (
                    <button
                      aria-label={avatar.label}
                      aria-pressed={config.emoji === avatar.id}
                      className={config.emoji === avatar.id ? "selected" : ""}
                      key={avatar.id}
                      type="button"
                      onClick={() =>
                        setConfig((current) => ({ ...current, emoji: avatar.id }))
                      }
                    >
                      <AvatarIcon name={avatar.id} size={18} />
                    </button>
                  ))}
                </div>
              </fieldset>
              <label>
                <span>챗봇 이름</span>
                <input
                  value={config.name}
                  onChange={(event) =>
                    setConfig((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>한 줄 소개</span>
                <input
                  value={config.subtitle}
                  onChange={(event) =>
                    setConfig((current) => ({ ...current, subtitle: event.target.value }))
                  }
                />
              </label>
              <label className="wide-field">
                <span>첫 인사</span>
                <textarea
                  rows={2}
                  value={config.welcome}
                  onChange={(event) =>
                    setConfig((current) => ({ ...current, welcome: event.target.value }))
                  }
                />
              </label>
            </div>
            <fieldset className="theme-picker">
              <legend>대표 색상</legend>
              {themes.map((item) => (
                <button
                  aria-label={`${item.name} 테마`}
                  aria-pressed={config.theme === item.id}
                  className={config.theme === item.id ? "selected" : ""}
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setConfig((current) => ({
                      ...current,
                      theme: item.id,
                      accent: item.color,
                    }))
                  }
                >
                  <span style={{ backgroundColor: item.color }} />
                  {item.name}
                </button>
              ))}
            </fieldset>
            <div className="design-lab">
              <div className="design-lab-heading">
                <Palette aria-hidden="true" size={16} />
                <div>
                  <strong>디자인 세부 편집</strong>
                  <span>정해진 테마 밖으로 직접 조정해 보세요.</span>
                </div>
              </div>
              <div className="design-controls">
                <label className="color-control">
                  <span>강조 색</span>
                  <input
                    type="color"
                    value={config.accent ?? theme.color}
                    onChange={(event) =>
                      setConfig((current) => ({ ...current, accent: event.target.value }))
                    }
                  />
                </label>
                <label className="color-control">
                  <span>대화 배경</span>
                  <input
                    type="color"
                    value={config.canvas ?? "#f8f7ff"}
                    onChange={(event) =>
                      setConfig((current) => ({ ...current, canvas: event.target.value }))
                    }
                  />
                </label>
                <label className="range-control">
                  <span>말풍선 곡률 <b>{config.radius ?? 12}px</b></span>
                  <input
                    min="4"
                    max="24"
                    type="range"
                    value={config.radius ?? 12}
                    onChange={(event) =>
                      setConfig((current) => ({
                        ...current,
                        radius: Number(event.target.value),
                      }))
                    }
                  />
                </label>
                <label className="range-control">
                  <span>대화 글자 <b>{Math.round((config.fontScale ?? 1) * 100)}%</b></span>
                  <input
                    min="0.85"
                    max="1.3"
                    step="0.05"
                    type="range"
                    value={config.fontScale ?? 1}
                    onChange={(event) =>
                      setConfig((current) => ({
                        ...current,
                        fontScale: Number(event.target.value),
                      }))
                    }
                  />
                </label>
                <fieldset className="layout-control">
                  <legend>메뉴 배치</legend>
                  <button
                    aria-pressed={(config.menuColumns ?? 2) === 1}
                    className={(config.menuColumns ?? 2) === 1 ? "selected" : ""}
                    type="button"
                    onClick={() => setConfig((current) => ({ ...current, menuColumns: 1 }))}
                  >
                    1열
                  </button>
                  <button
                    aria-pressed={(config.menuColumns ?? 2) === 2}
                    className={(config.menuColumns ?? 2) === 2 ? "selected" : ""}
                    type="button"
                    onClick={() => setConfig((current) => ({ ...current, menuColumns: 2 }))}
                  >
                    2열
                  </button>
                </fieldset>
              </div>
            </div>
          </div>

          <div className="flow-heading">
            <div>
              <h3>대화 기능</h3>
              <p>카드를 선택하면 내용을 편집할 수 있어요.</p>
            </div>
            <span className="block-count">{config.blocks.length}개 기능</span>
          </div>

          {config.blocks.length === 0 ? (
            <div className="empty-flow">
              <Puzzle aria-hidden="true" size={25} />
              <h3>아직 추가한 기능이 없어요</h3>
              <p>왼쪽에서 기능을 골라 나만의 대화 흐름을 만들어 보세요.</p>
            </div>
          ) : (
            <div className="flow-list">
              {config.blocks.map((block, index) => (
                <button
                  className={`flow-card ${selectedId === block.id ? "selected" : ""} ${draggingId === block.id ? "dragging" : ""}`}
                  draggable
                  key={block.id}
                  type="button"
                  onClick={() => setSelectedId(block.id)}
                  onDragEnd={() => setDraggingId(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDragStart={() => setDraggingId(block.id)}
                  onDrop={() => dropBlock(block.id)}
                >
                  <span className="flow-index">
                    <GripVertical aria-hidden="true" size={12} />
                    {index + 1}
                  </span>
                  <span className="flow-icon">
                    <CuteIcon name={block.icon} />
                  </span>
                  <span className="flow-copy">
                    <strong>{block.title}</strong>
                    <small>{block.description}</small>
                  </span>
                  <span className="flow-edit">편집</span>
                </button>
              ))}
            </div>
          )}

          {selectedBlock && (
            <div className="settings-card block-settings">
              <div className="settings-title">
                <h3 className="settings-heading-with-icon">
                  <CuteIcon name={selectedBlock.icon} size={16} /> 선택한 기능 편집
                </h3>
                <button className="text-danger" type="button" onClick={removeBlock}>
                  <Trash2 aria-hidden="true" size={13} /> 삭제
                </button>
              </div>
              <div className="form-grid block-form">
                <fieldset className="icon-field wide-field">
                  <legend>아이콘</legend>
                  <div className="icon-options">
                    {blockIconOptions.map((icon) => (
                      <button
                        aria-label={`${icon} 아이콘`}
                        aria-pressed={selectedBlock.icon === icon}
                        className={selectedBlock.icon === icon ? "selected" : ""}
                        key={icon}
                        type="button"
                        onClick={() => updateBlock({ icon })}
                      >
                        <CuteIcon name={icon} size={17} />
                      </button>
                    ))}
                  </div>
                </fieldset>
                <label className="wide-field">
                  <span>버튼 이름</span>
                  <input
                    value={selectedBlock.title}
                    onChange={(event) => updateBlock({ title: event.target.value })}
                  />
                </label>
                <label className="wide-field">
                  <span>챗봇 답변</span>
                  <textarea
                    rows={3}
                    value={selectedBlock.description}
                    onChange={(event) => updateBlock({ description: event.target.value })}
                  />
                </label>
                {selectedBlock.type === "custom" && (
                  <div className="script-editor wide-field">
                    <div className="script-editor-heading">
                      <span>
                        <Code2 aria-hidden="true" size={15} /> 동작 스크립트
                      </span>
                      <small>{parseScript(selectedBlock.script ?? "").length}개 동작</small>
                    </div>
                    <textarea
                      aria-label="동작 스크립트"
                      rows={9}
                      spellCheck={false}
                      value={selectedBlock.script ?? ""}
                      onChange={(event) => updateBlock({ script: event.target.value })}
                    />
                    <div className="command-reference" aria-label="사용 가능한 명령">
                      <code>말하기:</code>
                      <code>질문하기:</code>
                      <code>입력받기:</code>
                      <code>선택하기:</code>
                      <code>체크하기:</code>
                      <code>저장하기:</code>
                      <code>조건:</code>
                    </div>
                    <ol className="script-map">
                      {parseScript(selectedBlock.script ?? "").map((command, index) => (
                        <li key={command.id}>
                          <span>{index + 1}</span>
                          <b>{command.kind}</b>
                          <small>{command.value || "내용을 입력하세요"}</small>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                {selectedBlock.type !== "announcement" &&
                  selectedBlock.type !== "journal" &&
                  selectedBlock.type !== "custom" && (
                    <label className="wide-field">
                      <span>목록 항목 <small>한 줄에 하나씩 입력</small></span>
                      <textarea
                        rows={4}
                        value={selectedBlock.items.join("\n")}
                        onChange={(event) =>
                          updateBlock({
                            items: event.target.value
                              .split("\n")
                              .map((item) => item.trim())
                              .filter(Boolean),
                          })
                        }
                      />
                    </label>
                  )}
              </div>
              <div className="order-actions">
                <button type="button" onClick={() => moveBlock(-1)}>
                  ↑ 앞으로
                </button>
                <button type="button" onClick={() => moveBlock(1)}>
                  ↓ 뒤로
                </button>
              </div>
            </div>
          )}
        </section>

        <aside className="preview-panel">
          <div className="preview-heading">
            <div>
              <span className="step-number">3</span>
              <div>
                <h2>바로 테스트하기</h2>
                <p>버튼을 눌러 실제처럼 대화해 보세요.</p>
              </div>
            </div>
            <span className="live-pill">● LIVE</span>
          </div>
          <div className="phone-frame">
            <div className="phone-speaker" aria-hidden="true" />
            <div className="chat-header">
              <div className="bot-avatar">
                <AvatarIcon name={resolveAvatar(config.emoji)} size={21} />
              </div>
              <div>
                <strong>{config.name || "이름 없는 챗봇"}</strong>
                <span>
                  <i aria-hidden="true" /> {config.subtitle || "대화할 준비가 됐어요"}
                </span>
              </div>
            </div>
            <div className="chat-body">
              <div className="message-row">
                <div className="mini-avatar">
                  <AvatarIcon name={resolveAvatar(config.emoji)} size={14} />
                </div>
                <div className="message bot-message">{config.welcome || "안녕하세요!"}</div>
              </div>

              {activePreview && (
                <>
                  <div className="message user-message">{activePreview.title}</div>
                  <div className="message-row">
                    <div className="mini-avatar">
                      <AvatarIcon name={resolveAvatar(config.emoji)} size={14} />
                    </div>
                    <div className="message bot-message">{activePreview.description}</div>
                  </div>
                  <PreviewInteraction block={activePreview} onToast={setToast} />
                </>
              )}

              {!activePreview && config.blocks.length > 0 && (
                <p className="preview-hint">아래 메뉴를 눌러 대화를 시작하세요.</p>
              )}
              {config.blocks.length === 0 && (
                <div className="preview-empty">
                  <Puzzle aria-hidden="true" size={22} />
                  기능을 추가하면 여기에 버튼이 나타나요.
                </div>
              )}
            </div>
            <div className={`quick-actions columns-${config.menuColumns ?? 2}`}>
              {config.blocks.map((block) => (
                <button key={block.id} type="button" onClick={() => setActivePreviewId(block.id)}>
                  <CuteIcon name={block.icon} size={13} />
                  {block.title}
                </button>
              ))}
            </div>
            <div className="chat-input">
              <span>메시지를 입력해 보세요</span>
              <button type="button" aria-label="메시지 보내기">
                <Send aria-hidden="true" size={14} />
              </button>
            </div>
          </div>
          <p className="preview-note">
            <LockKeyhole aria-hidden="true" size={13} /> 지금 만든 내용은 이 기기에 자동으로 저장돼요.
          </p>
        </aside>
      </div>

      {toast && (
        <div className="toast" role="status">
          <span aria-hidden="true"><Check size={13} strokeWidth={3} /></span>
          {toast}
        </div>
      )}
    </main>
  );
}

function PreviewInteraction({
  block,
  onToast,
}: {
  block: BotBlock;
  onToast: (message: string) => void;
}) {
  if (block.type === "custom") {
    return (
      <ScriptInteraction
        commands={parseScript(block.script ?? "")}
        onToast={onToast}
      />
    );
  }

  if (block.type === "journal") {
    return (
      <div className="preview-interaction journal-interaction">
        <textarea aria-label="미리보기 기록 입력" placeholder="여기에 기록해 보세요…" rows={3} />
        <button type="button" onClick={() => onToast("미리보기 기록을 완료했어요!")}>
          기록 완료
        </button>
      </div>
    );
  }

  if (block.type === "checklist") {
    return (
      <div className="preview-interaction preview-checklist">
        {block.items.map((item, index) => (
          <label key={`${item}-${index}`}>
            <input type="checkbox" />
            <span>{item}</span>
          </label>
        ))}
      </div>
    );
  }

  if (block.type === "schedule") {
    return (
      <ol className="preview-interaction preview-schedule">
        {block.items.map((item, index) => (
          <li key={`${item}-${index}`}>
            <span>{index + 1}</span>
            {item}
          </li>
        ))}
      </ol>
    );
  }

  if (block.type === "faq" || block.type === "choice") {
    return (
      <div className="preview-interaction preview-options">
        {block.items.map((item, index) => (
          <button
            key={`${item}-${index}`}
            type="button"
            onClick={() => onToast(`“${item}”을 선택했어요.`)}
          >
            {item}
          </button>
        ))}
      </div>
    );
  }

  return null;
}

function ScriptInteraction({
  commands,
  onToast,
}: {
  commands: ScriptCommand[];
  onToast: (message: string) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const interpolate = (value: string) =>
    value.replace(/\{\{(.+?)\}\}/g, (_, key: string) => values[key.trim()] || `{{${key}}}`);

  if (commands.length === 0) {
    return (
      <div className="preview-interaction script-preview-empty">
        동작 스크립트를 작성하면 여기에 실행 결과가 나타나요.
      </div>
    );
  }

  return (
    <div className="preview-interaction script-preview">
      {commands.map((command) => {
        if (command.kind === "say" || command.kind === "ask") {
          return (
            <div className="script-preview-line" key={command.id}>
              <MessageCircle aria-hidden="true" size={13} />
              <span>{interpolate(command.value)}</span>
            </div>
          );
        }

        if (command.kind === "input") {
          return (
            <label className="script-preview-input" key={command.id}>
              <TextCursorInput aria-hidden="true" size={13} />
              <input
                aria-label={command.value}
                placeholder={`${command.value} 입력`}
                value={values[command.value] ?? ""}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    [command.value]: event.target.value,
                  }))
                }
              />
            </label>
          );
        }

        if (command.kind === "choice") {
          return (
            <div className="script-preview-options" key={command.id}>
              {command.value.split("|").map((option) => (
                <button
                  key={option.trim()}
                  type="button"
                  onClick={() => onToast(`“${option.trim()}”을 선택했어요.`)}
                >
                  {option.trim()}
                </button>
              ))}
            </div>
          );
        }

        if (command.kind === "check") {
          return (
            <div className="script-preview-checks" key={command.id}>
              {command.value.split("|").map((option) => (
                <label key={option.trim()}>
                  <input type="checkbox" />
                  {option.trim()}
                </label>
              ))}
            </div>
          );
        }

        if (command.kind === "save") {
          return (
            <button
              className="script-preview-save"
              key={command.id}
              type="button"
              onClick={() =>
                onToast(
                  `${command.value || "입력값"}${values[command.value] ? ` “${values[command.value]}”` : ""}을 저장했어요.`,
                )
              }
            >
              <Save aria-hidden="true" size={13} /> {command.value || "입력값"} 저장
            </button>
          );
        }

        return (
          <div className="script-preview-condition" key={command.id}>
            <GitBranch aria-hidden="true" size={13} />
            <span>조건: {command.value}</span>
          </div>
        );
      })}
    </div>
  );
}
