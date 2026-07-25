"use client";

import { useEffect, useRef, useState } from "react";
import {
  AppWindow,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  Code2,
  Eye,
  Flag,
  GripVertical,
  Image as ImageIcon,
  LayoutDashboard,
  Lightbulb,
  Link2,
  Megaphone,
  MonitorSmartphone,
  MousePointerClick,
  Palette,
  PencilLine,
  Plus,
  Rocket,
  Save,
  School,
  Share2,
  Sparkles,
  SquareCheckBig,
  Trash2,
  Type,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";

type Phase = "plan" | "screen" | "action" | "test";
type BlockType =
  | "hero"
  | "text"
  | "notice"
  | "schedule"
  | "journal"
  | "checklist"
  | "button"
  | "gallery"
  | "custom";
type ThemeId = "violet" | "mint" | "orange" | "navy";
type IconName =
  | "rocket"
  | "text"
  | "notice"
  | "calendar"
  | "journal"
  | "check"
  | "button"
  | "gallery"
  | "code"
  | "book"
  | "school"
  | "sparkles";

type WebBlock = {
  id: string;
  type: BlockType;
  icon: IconName;
  title: string;
  description: string;
  items: string[];
  script?: string;
};

type ProjectPlan = {
  topic: string;
  audience: string;
  goal: string;
};

type WebProject = {
  id: string;
  name: string;
  tagline: string;
  plan: ProjectPlan;
  theme: ThemeId;
  accent?: string;
  canvas?: string;
  radius?: number;
  fontScale?: number;
  columns?: 1 | 2;
  blocks: WebBlock[];
};

type ProjectTemplate = {
  id: string;
  name: string;
  tag: string;
  icon: IconName;
  description: string;
  project: WebProject;
};

type CatalogItem = {
  type: BlockType;
  group: "screen" | "action";
  icon: IconName;
  name: string;
  hint: string;
  description: string;
  items?: string[];
  script?: string;
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
): WebBlock => ({
  id: uid(),
  type,
  icon,
  title,
  description,
  items,
  script,
});

const themes: Array<{ id: ThemeId; name: string; color: string; canvas: string }> = [
  { id: "violet", name: "보라", color: "#6d5dfc", canvas: "#f6f4ff" },
  { id: "mint", name: "민트", color: "#087f68", canvas: "#effbf7" },
  { id: "orange", name: "주황", color: "#e6672e", canvas: "#fff7f1" },
  { id: "navy", name: "남색", color: "#244a73", canvas: "#f1f6fb" },
];

const catalog: CatalogItem[] = [
  {
    type: "hero",
    group: "screen",
    icon: "rocket",
    name: "첫 화면",
    hint: "큰 제목과 소개",
    description: "방문자에게 가장 먼저 보여줄 내용을 적어 보세요.",
  },
  {
    type: "text",
    group: "screen",
    icon: "text",
    name: "글 상자",
    hint: "제목과 설명",
    description: "알려 주고 싶은 내용을 자유롭게 적어 보세요.",
  },
  {
    type: "notice",
    group: "screen",
    icon: "notice",
    name: "알림 카드",
    hint: "중요한 소식",
    description: "꼭 확인해야 할 내용을 눈에 띄게 보여줘요.",
  },
  {
    type: "schedule",
    group: "screen",
    icon: "calendar",
    name: "일정표",
    hint: "시간과 활동",
    description: "순서대로 진행할 활동을 보여줘요.",
    items: ["09:30 시작하기", "10:00 활동하기", "11:30 함께 나누기"],
  },
  {
    type: "gallery",
    group: "screen",
    icon: "gallery",
    name: "사진 모음",
    hint: "활동 장면",
    description: "기억하고 싶은 장면을 모아 둘 공간이에요.",
    items: ["오늘의 첫 장면", "함께 만든 결과", "가장 즐거운 순간"],
  },
  {
    type: "journal",
    group: "action",
    icon: "journal",
    name: "기록 입력",
    hint: "내용을 쓰고 저장",
    description: "질문에 답하면서 오늘의 활동을 기록해요.",
    items: ["오늘 새롭게 배운 것은?", "가장 재미있었던 활동은?", "다음에 더 해보고 싶은 것은?"],
  },
  {
    type: "checklist",
    group: "action",
    icon: "check",
    name: "미션 체크",
    hint: "완료 여부 표시",
    description: "완료한 미션을 하나씩 체크해 보세요.",
    items: ["첫 번째 미션", "두 번째 미션", "친구에게 보여주기"],
  },
  {
    type: "button",
    group: "action",
    icon: "button",
    name: "이동 버튼",
    hint: "다른 곳으로 연결",
    description: "버튼을 누르면 다음 활동으로 이동해요.",
    items: ["다음 활동 보기"],
  },
  {
    type: "custom",
    group: "action",
    icon: "code",
    name: "자유 기능",
    hint: "내 방식대로 조립",
    description: "명령 블록을 줄마다 연결해 나만의 기능을 만들어요.",
    script:
      "제목: 나만의 설문\n글: 오늘 활동은 어땠나요?\n선택: 정말 재미있었어요 | 새로웠어요 | 조금 어려웠어요\n긴입력: 그렇게 생각한 이유\n버튼: 내 답변 저장",
  },
];

const campProject: WebProject = {
  id: "camp-starter",
  name: "AI 캠프 기록장",
  tagline: "오늘 배우고 만든 것을 차곡차곡 남겨요",
  plan: {
    topic: "AI 캠프 활동 기록",
    audience: "캠프에 참여한 학생",
    goal: "일정과 미션을 확인하고, 배운 내용과 느낀 점을 매일 기록한다.",
  },
  theme: "violet",
  accent: "#6d5dfc",
  canvas: "#f6f4ff",
  radius: 18,
  fontScale: 1,
  columns: 1,
  blocks: [
    makeBlock(
      "hero",
      "rocket",
      "2026 여름 AI 캠프",
      "상상한 아이디어를 직접 만들고, 오늘의 성장을 기록해요.",
    ),
    makeBlock(
      "notice",
      "notice",
      "오늘의 안내",
      "활동이 끝날 때마다 미션을 체크하고, 배운 내용을 한 문장 이상 남겨 주세요.",
    ),
    makeBlock(
      "schedule",
      "calendar",
      "오늘의 일정",
      "하루 활동 순서를 확인해요.",
      ["09:30 AI와 친해지기", "10:20 나만의 웹 기획", "11:10 화면 블록 조립", "13:30 기능 연결", "15:00 작품 발표"],
    ),
    makeBlock(
      "checklist",
      "check",
      "오늘의 미션",
      "완료한 활동을 하나씩 체크해 보세요.",
      ["웹 이름과 목적 정하기", "화면 블록 3개 이상 넣기", "기록 기능 연결하기", "친구 작품 테스트하기"],
    ),
    makeBlock(
      "journal",
      "journal",
      "나의 캠프 기록",
      "오늘의 배움과 느낌을 내 말로 남겨요.",
      ["오늘 새롭게 알게 된 것은?", "만들면서 해결한 문제는?", "내일 더 해보고 싶은 것은?"],
    ),
  ],
};

const templates: ProjectTemplate[] = [
  {
    id: "camp",
    name: "캠프 기록장",
    tag: "첫 수업",
    icon: "rocket",
    description: "일정, 미션, 배운 내용을 매일 기록해요.",
    project: campProject,
  },
  {
    id: "reading",
    name: "독서 기록장",
    tag: "독서",
    icon: "book",
    description: "읽은 책과 기억에 남는 생각을 모아요.",
    project: {
      id: "reading-starter",
      name: "나의 독서 기록장",
      tagline: "한 권의 책에서 발견한 나의 생각",
      plan: {
        topic: "나의 독서 활동",
        audience: "책을 좋아하는 친구와 선생님",
        goal: "읽은 책과 인상 깊은 문장, 나의 감상을 꾸준히 기록한다.",
      },
      theme: "orange",
      accent: "#e6672e",
      canvas: "#fff7f1",
      radius: 16,
      fontScale: 1,
      columns: 1,
      blocks: [
        makeBlock("hero", "book", "나의 독서 기록장", "책 속에서 찾은 생각을 천천히 꺼내 보아요."),
        makeBlock("text", "text", "이번 달 읽는 책", "책 제목과 작가, 읽기 시작한 날을 적어 보세요."),
        makeBlock(
          "journal",
          "journal",
          "오늘의 독서 기록",
          "읽고 난 뒤 떠오른 생각을 저장해요.",
          ["오늘 읽은 책과 쪽수", "인상 깊은 문장", "그 문장이 마음에 남은 이유"],
        ),
      ],
    },
  },
  {
    id: "class",
    name: "우리 반 알림장",
    tag: "학급",
    icon: "school",
    description: "공지, 준비물, 학급 일정을 한눈에 보여줘요.",
    project: {
      id: "class-starter",
      name: "우리 반 알림장",
      tagline: "오늘의 준비와 약속을 함께 확인해요",
      plan: {
        topic: "학급 생활 안내",
        audience: "우리 반 학생과 보호자",
        goal: "공지와 일정, 준비물을 빠뜨리지 않고 확인한다.",
      },
      theme: "mint",
      accent: "#087f68",
      canvas: "#effbf7",
      radius: 14,
      fontScale: 1,
      columns: 2,
      blocks: [
        makeBlock("hero", "school", "우리 반 알림장", "서로 돕고 함께 자라는 즐거운 교실"),
        makeBlock("notice", "notice", "꼭 확인해요", "내일 체육 활동이 있어요. 편한 옷과 물병을 준비해 주세요."),
        makeBlock("checklist", "check", "내일 준비물", "준비한 물건을 체크해요.", ["필기도구", "물병", "체육복"]),
        makeBlock("schedule", "calendar", "이번 주 일정", "중요한 학급 일정을 확인해요.", ["월요일 독서 활동", "수요일 체육 활동", "금요일 모둠 발표"]),
      ],
    },
  },
  {
    id: "blank",
    name: "빈 웹",
    tag: "자유",
    icon: "sparkles",
    description: "내 아이디어로 처음부터 시작해요.",
    project: {
      id: "blank-starter",
      name: "나의 첫 웹",
      tagline: "내 아이디어를 소개합니다",
      plan: {
        topic: "",
        audience: "",
        goal: "",
      },
      theme: "navy",
      accent: "#244a73",
      canvas: "#f1f6fb",
      radius: 14,
      fontScale: 1,
      columns: 1,
      blocks: [],
    },
  },
];

const iconMap: Record<IconName, LucideIcon> = {
  rocket: Rocket,
  text: Type,
  notice: Megaphone,
  calendar: CalendarDays,
  journal: PencilLine,
  check: SquareCheckBig,
  button: MousePointerClick,
  gallery: ImageIcon,
  code: Code2,
  book: BookOpen,
  school: School,
  sparkles: Sparkles,
};

const phases: Array<{
  id: Phase;
  number: number;
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  { id: "plan", number: 1, title: "기획하기", description: "무엇을 만들지 정해요", icon: Lightbulb },
  { id: "screen", number: 2, title: "화면 만들기", description: "보이는 블록을 놓아요", icon: LayoutDashboard },
  { id: "action", number: 3, title: "기능 연결", description: "입력과 동작을 붙여요", icon: WandSparkles },
  { id: "test", number: 4, title: "테스트하기", description: "직접 써보고 공유해요", icon: Eye },
];

const cloneProject = (project: WebProject): WebProject => ({
  ...project,
  id: uid(),
  plan: { ...project.plan },
  blocks: project.blocks.map((block) => ({
    ...block,
    id: uid(),
    items: [...block.items],
    script: block.script ?? "",
  })),
});

function normalizeProject(project: WebProject): WebProject {
  const theme = themes.find((item) => item.id === project.theme) ?? themes[0];
  return {
    ...project,
    id: project.id || uid(),
    plan: project.plan ?? { topic: "", audience: "", goal: "" },
    accent: project.accent ?? theme.color,
    canvas: project.canvas ?? theme.canvas,
    radius: project.radius ?? 16,
    fontScale: project.fontScale ?? 1,
    columns: project.columns === 2 ? 2 : 1,
    blocks: Array.isArray(project.blocks)
      ? project.blocks.map((block) => ({
          ...block,
          id: block.id || uid(),
          items: Array.isArray(block.items) ? block.items : [],
          script: block.script ?? "",
        }))
      : [],
  };
}

function encodeProject(project: WebProject) {
  const bytes = new TextEncoder().encode(JSON.stringify(project));
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function decodeProject(value: string): WebProject | null {
  try {
    const binary = atob(value);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return normalizeProject(JSON.parse(new TextDecoder().decode(bytes)) as WebProject);
  } catch {
    return null;
  }
}

function BlockIcon({ name, size = 18 }: { name: IconName; size?: number }) {
  const Icon = iconMap[name];
  return <Icon aria-hidden="true" size={size} strokeWidth={2.15} />;
}

export default function Home() {
  const [project, setProject] = useState<WebProject>(() => cloneProject(campProject));
  const [phase, setPhase] = useState<Phase>("plan");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState("준비됨");
  const [shareStatus, setShareStatus] = useState("내 웹 공유");
  const [toast, setToast] = useState("");
  const loadedRef = useRef(false);

  const selectedBlock =
    project.blocks.find((block) => block.id === selectedId) ?? null;
  const currentTheme =
    themes.find((item) => item.id === project.theme) ?? themes[0];
  const planScore = [
    project.plan.topic,
    project.plan.audience,
    project.plan.goal,
  ].filter((value) => value.trim()).length;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const shared = window.location.hash.startsWith("#web=")
        ? decodeProject(window.location.hash.slice(5))
        : null;
      const saved = localStorage.getItem("my-web-maker-project");

      if (shared) {
        setProject(shared);
        setToast("공유된 웹 프로젝트를 불러왔어요.");
      } else if (saved) {
        try {
          setProject(normalizeProject(JSON.parse(saved) as WebProject));
        } catch {
          localStorage.removeItem("my-web-maker-project");
        }
      }
      loadedRef.current = true;
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loadedRef.current) return;
    setSaveStatus("저장 중");
    const timer = window.setTimeout(() => {
      localStorage.setItem("my-web-maker-project", JSON.stringify(project));
      setSaveStatus("자동 저장됨");
    }, 400);

    return () => window.clearTimeout(timer);
  }, [project]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const applyTemplate = (template: ProjectTemplate) => {
    setProject(cloneProject(template.project));
    setSelectedId(null);
    setToast(`${template.name}으로 기획을 시작했어요.`);
  };

  const addBlock = (type: BlockType) => {
    const item = catalog.find((catalogItem) => catalogItem.type === type);
    if (!item) return;
    const block = makeBlock(
      item.type,
      item.icon,
      item.name,
      item.description,
      item.items ? [...item.items] : [],
      item.script ?? "",
    );
    setProject((current) => ({
      ...current,
      blocks: [...current.blocks, block],
    }));
    setSelectedId(block.id);
    setToast(`${item.name} 블록을 화면에 놓았어요.`);
  };

  const updateBlock = (changes: Partial<WebBlock>) => {
    if (!selectedId) return;
    setProject((current) => ({
      ...current,
      blocks: current.blocks.map((block) =>
        block.id === selectedId ? { ...block, ...changes } : block,
      ),
    }));
  };

  const removeBlock = () => {
    if (!selectedId) return;
    setProject((current) => ({
      ...current,
      blocks: current.blocks.filter((block) => block.id !== selectedId),
    }));
    setSelectedId(null);
    setToast("블록을 삭제했어요.");
  };

  const moveBlock = (direction: -1 | 1) => {
    if (!selectedId) return;
    setProject((current) => {
      const index = current.blocks.findIndex((block) => block.id === selectedId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.blocks.length) {
        return current;
      }
      const blocks = [...current.blocks];
      [blocks[index], blocks[nextIndex]] = [blocks[nextIndex], blocks[index]];
      return { ...current, blocks };
    });
  };

  const dropBlock = (targetId: string) => {
    if (!draggingId || draggingId === targetId) return;
    setProject((current) => {
      const sourceIndex = current.blocks.findIndex(
        (block) => block.id === draggingId,
      );
      const targetIndex = current.blocks.findIndex(
        (block) => block.id === targetId,
      );
      if (sourceIndex < 0 || targetIndex < 0) return current;
      const blocks = [...current.blocks];
      const [moved] = blocks.splice(sourceIndex, 1);
      blocks.splice(targetIndex, 0, moved);
      return { ...current, blocks };
    });
    setDraggingId(null);
  };

  const copyShareLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}#web=${encodeProject(project)}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus("링크 복사됨");
      setToast("친구에게 보낼 웹 프로젝트 링크를 복사했어요.");
      window.setTimeout(() => setShareStatus("내 웹 공유"), 1800);
    } catch {
      window.prompt("아래 링크를 복사해 주세요.", url);
    }
  };

  const phaseIndex = phases.findIndex((item) => item.id === phase);
  const goNext = () => {
    const next = phases[Math.min(phaseIndex + 1, phases.length - 1)];
    setPhase(next.id);
  };

  return (
    <main
      className="maker-shell"
      style={
        {
          "--accent": project.accent ?? currentTheme.color,
          "--accent-soft": `color-mix(in srgb, ${project.accent ?? currentTheme.color} 12%, white)`,
          "--web-canvas": project.canvas ?? currentTheme.canvas,
          "--card-radius": `${project.radius ?? 16}px`,
          "--web-scale": project.fontScale ?? 1,
        } as React.CSSProperties
      }
    >
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <AppWindow size={21} />
          </div>
          <div>
            <strong>나만의 웹 만들기</strong>
            <span>기획부터 직접 만드는 웹 스튜디오</span>
          </div>
        </div>
        <div className="topbar-actions">
          <span className="save-status">
            <i aria-hidden="true" />
            {saveStatus}
          </span>
          <button className="share-button" type="button" onClick={copyShareLink}>
            <Share2 aria-hidden="true" size={15} />
            {shareStatus}
          </button>
        </div>
      </header>

      <section className="maker-intro">
        <div>
          <span className="eyebrow">WEB MAKER STUDIO</span>
          <h1>생각하고, 놓아 보고, 직접 움직이게 만들어요.</h1>
          <p>
            앱 인벤터처럼 화면 블록과 기능 블록을 조립해 나만의 웹을 완성해 보세요.
            첫 프로젝트는 캠프의 하루를 기록하는 웹이에요.
          </p>
        </div>
        <div className="intro-project">
          <Rocket aria-hidden="true" size={21} />
          <span>지금 만드는 프로젝트</span>
          <strong>{project.name || "이름 없는 웹"}</strong>
        </div>
      </section>

      <nav className="phase-nav" aria-label="웹 만들기 단계">
        {phases.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === phase;
          return (
            <button
              aria-current={isActive ? "step" : undefined}
              className={isActive ? "active" : ""}
              key={item.id}
              type="button"
              onClick={() => setPhase(item.id)}
            >
              <span className="phase-number">{item.number}</span>
              <Icon aria-hidden="true" size={17} />
              <span>
                <strong>{item.title}</strong>
                <small>{item.description}</small>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="maker-workspace">
        <aside className="left-panel panel">
          {phase === "plan" && (
            <PlanPanel
              project={project}
              planScore={planScore}
              onApplyTemplate={applyTemplate}
              onChange={setProject}
              onNext={goNext}
            />
          )}

          {phase === "screen" && (
            <ScreenPanel
              project={project}
              theme={currentTheme}
              onAddBlock={addBlock}
              onChange={setProject}
              onNext={goNext}
            />
          )}

          {phase === "action" && (
            <ActionPanel onAddBlock={addBlock} onNext={goNext} />
          )}

          {phase === "test" && (
            <TestPanel
              planScore={planScore}
              blockCount={project.blocks.length}
              hasAction={project.blocks.some((block) =>
                ["journal", "checklist", "button", "custom"].includes(block.type),
              )}
              onShare={copyShareLink}
            />
          )}
        </aside>

        <section className="canvas-panel panel">
          <div className="panel-heading canvas-heading">
            <div>
              <span className="panel-kicker">화면 구성</span>
              <h2>내 웹의 블록</h2>
              <p>끌어서 순서를 바꾸고, 선택해서 내용을 편집하세요.</p>
            </div>
            <span className="block-count">{project.blocks.length}개</span>
          </div>

          {project.blocks.length === 0 ? (
            <div className="empty-canvas">
              <MonitorSmartphone aria-hidden="true" size={30} />
              <h3>아직 화면이 비어 있어요</h3>
              <p>‘화면 만들기’에서 첫 화면이나 글 상자를 놓아 보세요.</p>
              <button type="button" onClick={() => setPhase("screen")}>
                화면 블록 보러 가기
              </button>
            </div>
          ) : (
            <div className="block-stack">
              {project.blocks.map((block, index) => (
                <button
                  className={`maker-block ${selectedId === block.id ? "selected" : ""} ${draggingId === block.id ? "dragging" : ""}`}
                  draggable
                  key={block.id}
                  type="button"
                  onClick={() => setSelectedId(block.id)}
                  onDragEnd={() => setDraggingId(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDragStart={() => setDraggingId(block.id)}
                  onDrop={() => dropBlock(block.id)}
                >
                  <span className="drag-handle">
                    <GripVertical aria-hidden="true" size={15} />
                    {index + 1}
                  </span>
                  <span className="block-icon">
                    <BlockIcon name={block.icon} />
                  </span>
                  <span className="block-copy">
                    <small>{blockTypeLabel[block.type]}</small>
                    <strong>{block.title}</strong>
                    <span>{block.description}</span>
                  </span>
                  <span className="edit-label">편집</span>
                </button>
              ))}
            </div>
          )}

          {selectedBlock && (
            <BlockEditor
              block={selectedBlock}
              onChange={updateBlock}
              onMove={moveBlock}
              onRemove={removeBlock}
            />
          )}
        </section>

        <aside className="preview-panel panel">
          <div className="panel-heading preview-heading">
            <div>
              <span className="panel-kicker">실시간 미리보기</span>
              <h2>내 웹 테스트</h2>
              <p>입력하고 체크하면서 실제처럼 써보세요.</p>
            </div>
            <span className="live-badge">
              <i aria-hidden="true" /> LIVE
            </span>
          </div>
          <WebPreview project={project} onToast={setToast} />
          <p className="local-note">
            <Save aria-hidden="true" size={13} />
            제작 내용과 미리보기 기록은 지금 사용하는 기기에 저장돼요.
          </p>
        </aside>
      </div>

      {toast && (
        <div className="toast" role="status">
          <span aria-hidden="true">
            <Check size={13} strokeWidth={3} />
          </span>
          {toast}
        </div>
      )}
    </main>
  );
}

function PlanPanel({
  project,
  planScore,
  onApplyTemplate,
  onChange,
  onNext,
}: {
  project: WebProject;
  planScore: number;
  onApplyTemplate: (template: ProjectTemplate) => void;
  onChange: React.Dispatch<React.SetStateAction<WebProject>>;
  onNext: () => void;
}) {
  return (
    <>
      <div className="panel-heading">
        <span className="panel-step">1</span>
        <div>
          <h2>무엇을 만들까요?</h2>
          <p>예시를 고른 뒤 내 아이디어로 바꿔 보세요.</p>
        </div>
      </div>

      <div className="template-grid">
        {templates.map((template) => (
          <button
            className="template-card"
            key={template.id}
            type="button"
            onClick={() => onApplyTemplate(template)}
          >
            <span className="template-icon">
              <BlockIcon name={template.icon} size={19} />
            </span>
            <span>
              <strong>
                {template.name}
                <small>{template.tag}</small>
              </strong>
              <span>{template.description}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="planner-card">
        <div className="section-title">
          <div>
            <Flag aria-hidden="true" size={16} />
            <strong>내 웹 기획서</strong>
          </div>
          <span>{planScore}/3 완성</span>
        </div>
        <label>
          <span>무슨 주제인가요?</span>
          <input
            placeholder="예: AI 캠프 활동 기록"
            value={project.plan.topic}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                plan: { ...current.plan, topic: event.target.value },
              }))
            }
          />
        </label>
        <label>
          <span>누가 사용할까요?</span>
          <input
            placeholder="예: 캠프에 참여한 학생"
            value={project.plan.audience}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                plan: { ...current.plan, audience: event.target.value },
              }))
            }
          />
        </label>
        <label>
          <span>이 웹으로 무엇을 할까요?</span>
          <textarea
            placeholder="예: 매일 배운 내용과 느낀 점을 기록한다."
            rows={3}
            value={project.plan.goal}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                plan: { ...current.plan, goal: event.target.value },
              }))
            }
          />
        </label>
      </div>

      <button className="next-button" type="button" onClick={onNext}>
        다음: 화면 만들기
        <LayoutDashboard aria-hidden="true" size={15} />
      </button>
    </>
  );
}

function ScreenPanel({
  project,
  theme,
  onAddBlock,
  onChange,
  onNext,
}: {
  project: WebProject;
  theme: (typeof themes)[number];
  onAddBlock: (type: BlockType) => void;
  onChange: React.Dispatch<React.SetStateAction<WebProject>>;
  onNext: () => void;
}) {
  return (
    <>
      <div className="panel-heading">
        <span className="panel-step">2</span>
        <div>
          <h2>화면 블록 놓기</h2>
          <p>필요한 블록을 눌러 화면에 추가하세요.</p>
        </div>
      </div>
      <div className="palette-list">
        {catalog
          .filter((item) => item.group === "screen")
          .map((item) => (
            <button
              className="palette-item"
              key={item.type}
              type="button"
              onClick={() => onAddBlock(item.type)}
            >
              <span className="palette-icon">
                <BlockIcon name={item.icon} />
              </span>
              <span>
                <strong>{item.name}</strong>
                <small>{item.hint}</small>
              </span>
              <Plus aria-hidden="true" size={15} />
            </button>
          ))}
      </div>

      <div className="design-card">
        <div className="section-title">
          <div>
            <Palette aria-hidden="true" size={16} />
            <strong>웹 디자인</strong>
          </div>
          <span>직접 조절</span>
        </div>
        <label>
          <span>웹 이름</span>
          <input
            value={project.name}
            onChange={(event) =>
              onChange((current) => ({ ...current, name: event.target.value }))
            }
          />
        </label>
        <label>
          <span>한 줄 소개</span>
          <input
            value={project.tagline}
            onChange={(event) =>
              onChange((current) => ({ ...current, tagline: event.target.value }))
            }
          />
        </label>
        <fieldset className="theme-options">
          <legend>대표 색상</legend>
          {themes.map((item) => (
            <button
              aria-label={`${item.name} 테마`}
              aria-pressed={project.theme === item.id}
              className={project.theme === item.id ? "selected" : ""}
              key={item.id}
              type="button"
              onClick={() =>
                onChange((current) => ({
                  ...current,
                  theme: item.id,
                  accent: item.color,
                  canvas: item.canvas,
                }))
              }
            >
              <i style={{ backgroundColor: item.color }} />
              {item.name}
            </button>
          ))}
        </fieldset>
        <div className="design-row">
          <label>
            <span>강조 색</span>
            <input
              aria-label="강조 색"
              type="color"
              value={project.accent ?? theme.color}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  accent: event.target.value,
                }))
              }
            />
          </label>
          <label>
            <span>배경 색</span>
            <input
              aria-label="배경 색"
              type="color"
              value={project.canvas ?? theme.canvas}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  canvas: event.target.value,
                }))
              }
            />
          </label>
        </div>
        <label className="range-label">
          <span>
            카드 모서리 <b>{project.radius ?? 16}px</b>
          </span>
          <input
            min="4"
            max="28"
            type="range"
            value={project.radius ?? 16}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                radius: Number(event.target.value),
              }))
            }
          />
        </label>
        <label className="range-label">
          <span>
            글자 크기 <b>{Math.round((project.fontScale ?? 1) * 100)}%</b>
          </span>
          <input
            min="0.85"
            max="1.2"
            step="0.05"
            type="range"
            value={project.fontScale ?? 1}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                fontScale: Number(event.target.value),
              }))
            }
          />
        </label>
        <fieldset className="column-options">
          <legend>내용 배치</legend>
          <button
            aria-pressed={(project.columns ?? 1) === 1}
            className={(project.columns ?? 1) === 1 ? "selected" : ""}
            type="button"
            onClick={() => onChange((current) => ({ ...current, columns: 1 }))}
          >
            1열
          </button>
          <button
            aria-pressed={(project.columns ?? 1) === 2}
            className={(project.columns ?? 1) === 2 ? "selected" : ""}
            type="button"
            onClick={() => onChange((current) => ({ ...current, columns: 2 }))}
          >
            2열
          </button>
        </fieldset>
      </div>

      <button className="next-button" type="button" onClick={onNext}>
        다음: 기능 연결
        <WandSparkles aria-hidden="true" size={15} />
      </button>
    </>
  );
}

function ActionPanel({
  onAddBlock,
  onNext,
}: {
  onAddBlock: (type: BlockType) => void;
  onNext: () => void;
}) {
  return (
    <>
      <div className="panel-heading">
        <span className="panel-step">3</span>
        <div>
          <h2>기능 블록 연결</h2>
          <p>웹에서 실제로 움직일 기능을 추가하세요.</p>
        </div>
      </div>
      <div className="palette-list">
        {catalog
          .filter((item) => item.group === "action")
          .map((item) => (
            <button
              className={`palette-item ${item.type === "custom" ? "custom-item" : ""}`}
              key={item.type}
              type="button"
              onClick={() => onAddBlock(item.type)}
            >
              <span className="palette-icon">
                <BlockIcon name={item.icon} />
              </span>
              <span>
                <strong>{item.name}</strong>
                <small>{item.hint}</small>
              </span>
              <Plus aria-hidden="true" size={15} />
            </button>
          ))}
      </div>
      <div className="logic-tip">
        <Code2 aria-hidden="true" size={18} />
        <div>
          <strong>정해진 기능만 쓰지 않아도 돼요</strong>
          <p>
            ‘자유 기능’을 추가하면 제목, 글, 입력, 선택, 체크, 버튼을 원하는
            순서로 직접 연결할 수 있어요.
          </p>
        </div>
      </div>
      <button className="next-button" type="button" onClick={onNext}>
        다음: 테스트하기
        <Eye aria-hidden="true" size={15} />
      </button>
    </>
  );
}

function TestPanel({
  planScore,
  blockCount,
  hasAction,
  onShare,
}: {
  planScore: number;
  blockCount: number;
  hasAction: boolean;
  onShare: () => void;
}) {
  const checks = [
    { label: "웹의 주제·사용자·목적 정하기", done: planScore === 3 },
    { label: "화면 블록 3개 이상 놓기", done: blockCount >= 3 },
    { label: "입력이나 동작 기능 연결하기", done: hasAction },
  ];

  return (
    <>
      <div className="panel-heading">
        <span className="panel-step">4</span>
        <div>
          <h2>써보고 완성하기</h2>
          <p>오른쪽 미리보기에서 하나씩 확인하세요.</p>
        </div>
      </div>
      <div className="test-checklist">
        {checks.map((item) => (
          <div className={item.done ? "done" : ""} key={item.label}>
            {item.done ? (
              <CheckCircle2 aria-hidden="true" size={18} />
            ) : (
              <span aria-hidden="true" />
            )}
            <p>
              <strong>{item.label}</strong>
              <small>{item.done ? "완료했어요" : "조금 더 만들어 보세요"}</small>
            </p>
          </div>
        ))}
      </div>
      <div className="test-guide">
        <MonitorSmartphone aria-hidden="true" size={19} />
        <div>
          <strong>테스트 방법</strong>
          <ol>
            <li>미션을 직접 체크해 보기</li>
            <li>기록 내용을 입력하고 저장해 보기</li>
            <li>친구에게 보여주고 의견 받기</li>
          </ol>
        </div>
      </div>
      <button className="share-large" type="button" onClick={onShare}>
        <Share2 aria-hidden="true" size={16} />
        내 웹 링크 복사하기
      </button>
    </>
  );
}

const blockTypeLabel: Record<BlockType, string> = {
  hero: "화면 · 첫 화면",
  text: "화면 · 글 상자",
  notice: "화면 · 알림",
  schedule: "화면 · 일정표",
  journal: "기능 · 기록 입력",
  checklist: "기능 · 미션 체크",
  button: "기능 · 이동 버튼",
  gallery: "화면 · 사진 모음",
  custom: "기능 · 자유 조립",
};

function BlockEditor({
  block,
  onChange,
  onMove,
  onRemove,
}: {
  block: WebBlock;
  onChange: (changes: Partial<WebBlock>) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  const hasItems = ["schedule", "journal", "checklist", "button", "gallery"].includes(
    block.type,
  );

  return (
    <div className="block-editor">
      <div className="section-title editor-title">
        <div>
          <BlockIcon name={block.icon} size={16} />
          <strong>선택한 블록 편집</strong>
        </div>
        <button type="button" onClick={onRemove}>
          <Trash2 aria-hidden="true" size={14} />
          삭제
        </button>
      </div>
      <label>
        <span>블록 제목</span>
        <input
          value={block.title}
          onChange={(event) => onChange({ title: event.target.value })}
        />
      </label>
      <label>
        <span>설명</span>
        <textarea
          rows={3}
          value={block.description}
          onChange={(event) => onChange({ description: event.target.value })}
        />
      </label>
      {hasItems && (
        <label>
          <span>
            {block.type === "journal"
              ? "기록 질문"
              : block.type === "button"
                ? "버튼 이름"
                : "내용 목록"}
            <small>한 줄에 하나씩 입력</small>
          </span>
          <textarea
            rows={5}
            value={block.items.join("\n")}
            onChange={(event) =>
              onChange({
                items: event.target.value
                  .split("\n")
                  .map((item) => item.trim())
                  .filter(Boolean),
              })
            }
          />
        </label>
      )}
      {block.type === "custom" && (
        <div className="script-editor">
          <div>
            <Code2 aria-hidden="true" size={15} />
            <strong>자유 기능 조립</strong>
            <small>{parseStudioScript(block.script ?? "").length}개 블록</small>
          </div>
          <textarea
            aria-label="자유 기능 명령"
            rows={9}
            spellCheck={false}
            value={block.script ?? ""}
            onChange={(event) => onChange({ script: event.target.value })}
          />
          <div className="command-chips" aria-label="사용 가능한 명령">
            {["제목:", "글:", "입력:", "긴입력:", "선택:", "체크:", "버튼:"].map(
              (command) => (
                <code key={command}>{command}</code>
              ),
            )}
          </div>
          <p>
            선택과 체크 항목은 <code>|</code>로 나누세요.
          </p>
        </div>
      )}
      <div className="order-buttons">
        <button type="button" onClick={() => onMove(-1)}>
          위로 이동
        </button>
        <button type="button" onClick={() => onMove(1)}>
          아래로 이동
        </button>
      </div>
    </div>
  );
}

function WebPreview({
  project,
  onToast,
}: {
  project: WebProject;
  onToast: (message: string) => void;
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [records, setRecords] = useState<Record<string, string[]>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const recordsLoadedRef = useRef(false);

  useEffect(() => {
    recordsLoadedRef.current = false;
    const timer = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem(`my-web-records-${project.id}`);
        if (saved) {
          setRecords(JSON.parse(saved) as Record<string, string[]>);
        } else {
          setRecords({});
        }
      } catch {
        localStorage.removeItem(`my-web-records-${project.id}`);
        setRecords({});
      }
      recordsLoadedRef.current = true;
    }, 0);

    return () => window.clearTimeout(timer);
  }, [project.id]);

  useEffect(() => {
    if (!recordsLoadedRef.current) return;
    localStorage.setItem(`my-web-records-${project.id}`, JSON.stringify(records));
  }, [project.id, records]);

  const saveJournal = (block: WebBlock) => {
    const answers = block.items
      .map((question) => drafts[`${block.id}:${question}`]?.trim())
      .filter((answer): answer is string => Boolean(answer));

    if (answers.length === 0) {
      onToast("기록할 내용을 먼저 입력해 주세요.");
      return;
    }

    const entry = `${new Date().toLocaleDateString("ko-KR")} · ${answers.join(" / ")}`;
    setRecords((current) => ({
      ...current,
      [block.id]: [entry, ...(current[block.id] ?? [])],
    }));
    setDrafts((current) => {
      const next = { ...current };
      block.items.forEach((question) => {
        delete next[`${block.id}:${question}`];
      });
      return next;
    });
    onToast("오늘의 기록을 이 기기에 저장했어요.");
  };

  const toggleCheck = (blockId: string, item: string) => {
    const key = `${blockId}:${item}`;
    setChecked((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <div className="device-frame">
      <div className="browser-bar">
        <i aria-hidden="true" />
        <i aria-hidden="true" />
        <i aria-hidden="true" />
        <span>my-web.site</span>
      </div>
      <div className="web-preview">
        <header className="web-header">
          <strong>{project.name || "나의 웹"}</strong>
          <nav aria-label="미리보기 메뉴">
            {project.blocks.slice(0, 3).map((block) => (
              <span key={block.id}>{block.title}</span>
            ))}
          </nav>
        </header>
        <div className={`web-content columns-${project.columns ?? 1}`}>
          {project.blocks.length === 0 && (
            <div className="web-empty">
              <AppWindow aria-hidden="true" size={28} />
              <strong>첫 블록을 놓아 보세요</strong>
              <span>만든 화면이 이곳에 바로 나타나요.</span>
            </div>
          )}
          {project.blocks.map((block) => (
            <PreviewBlock
              block={block}
              checked={checked}
              drafts={drafts}
              key={block.id}
              records={records[block.id] ?? []}
              onDraftChange={(key, value) =>
                setDrafts((current) => ({ ...current, [key]: value }))
              }
              onSave={() => saveJournal(block)}
              onToast={onToast}
              onToggleCheck={(item) => toggleCheck(block.id, item)}
            />
          ))}
        </div>
        <footer className="web-footer">
          <span>{project.name || "나의 웹"}</span>
          <small>내 손으로 직접 만든 웹</small>
        </footer>
      </div>
    </div>
  );
}

function PreviewBlock({
  block,
  checked,
  drafts,
  records,
  onDraftChange,
  onSave,
  onToast,
  onToggleCheck,
}: {
  block: WebBlock;
  checked: Record<string, boolean>;
  drafts: Record<string, string>;
  records: string[];
  onDraftChange: (key: string, value: string) => void;
  onSave: () => void;
  onToast: (message: string) => void;
  onToggleCheck: (item: string) => void;
}) {
  if (block.type === "hero") {
    return (
      <section className="preview-hero">
        <span>
          <Rocket aria-hidden="true" size={13} />
          MY PROJECT
        </span>
        <h1>{block.title}</h1>
        <p>{block.description}</p>
        <button type="button" onClick={() => onToast("첫 활동을 시작했어요.")}>
          기록 시작하기
        </button>
      </section>
    );
  }

  if (block.type === "notice") {
    return (
      <section className="preview-card preview-notice">
        <span className="preview-card-icon">
          <Megaphone aria-hidden="true" size={15} />
        </span>
        <div>
          <h2>{block.title}</h2>
          <p>{block.description}</p>
        </div>
      </section>
    );
  }

  if (block.type === "text") {
    return (
      <section className="preview-card">
        <h2>{block.title}</h2>
        <p>{block.description}</p>
      </section>
    );
  }

  if (block.type === "schedule") {
    return (
      <section className="preview-card">
        <PreviewCardHeading block={block} />
        <ol className="preview-schedule">
          {block.items.map((item) => (
            <li key={`${block.id}:${item}`}>
              <span>{item.split(" ")[0]}</span>
              <strong>{item.split(" ").slice(1).join(" ") || item}</strong>
            </li>
          ))}
        </ol>
      </section>
    );
  }

  if (block.type === "checklist") {
    return (
      <section className="preview-card">
        <PreviewCardHeading block={block} />
        <div className="preview-checks">
          {block.items.map((item) => {
            const isChecked = checked[`${block.id}:${item}`] ?? false;
            return (
              <label className={isChecked ? "checked" : ""} key={`${block.id}:${item}`}>
                <input
                  checked={isChecked}
                  type="checkbox"
                  onChange={() => onToggleCheck(item)}
                />
                <span>{item}</span>
              </label>
            );
          })}
        </div>
      </section>
    );
  }

  if (block.type === "journal") {
    return (
      <section className="preview-card preview-journal">
        <PreviewCardHeading block={block} />
        <div className="journal-fields">
          {block.items.map((question) => (
            <label key={`${block.id}:${question}`}>
              <span>{question}</span>
              <textarea
                placeholder="내 생각을 적어 보세요"
                rows={2}
                value={drafts[`${block.id}:${question}`] ?? ""}
                onChange={(event) =>
                  onDraftChange(`${block.id}:${question}`, event.target.value)
                }
              />
            </label>
          ))}
        </div>
        <button className="preview-save" type="button" onClick={onSave}>
          <Save aria-hidden="true" size={13} />
          오늘 기록 저장
        </button>
        {records.length > 0 && (
          <div className="saved-records">
            <strong>저장한 기록 {records.length}개</strong>
            <p>{records[0]}</p>
          </div>
        )}
      </section>
    );
  }

  if (block.type === "gallery") {
    return (
      <section className="preview-card">
        <PreviewCardHeading block={block} />
        <div className="preview-gallery">
          {block.items.map((item) => (
            <div key={`${block.id}:${item}`}>
              <ImageIcon aria-hidden="true" size={18} />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (block.type === "button") {
    return (
      <section className="preview-card preview-action-card">
        <h2>{block.title}</h2>
        <p>{block.description}</p>
        {(block.items.length ? block.items : ["이동하기"]).map((item) => (
          <button
            key={`${block.id}:${item}`}
            type="button"
            onClick={() => onToast(`‘${item}’ 버튼을 실행했어요.`)}
          >
            {item}
            <Link2 aria-hidden="true" size={13} />
          </button>
        ))}
      </section>
    );
  }

  return (
    <CustomPreview
      block={block}
      drafts={drafts}
      onDraftChange={onDraftChange}
      onToast={onToast}
    />
  );
}

function PreviewCardHeading({ block }: { block: WebBlock }) {
  return (
    <div className="preview-card-heading">
      <span>
        <BlockIcon name={block.icon} size={14} />
      </span>
      <div>
        <h2>{block.title}</h2>
        <p>{block.description}</p>
      </div>
    </div>
  );
}

type StudioCommand = {
  id: string;
  kind: "title" | "text" | "input" | "textarea" | "choice" | "check" | "button";
  value: string;
};

const studioCommandMap: Record<string, StudioCommand["kind"]> = {
  제목: "title",
  글: "text",
  입력: "input",
  긴입력: "textarea",
  선택: "choice",
  체크: "check",
  버튼: "button",
};

function parseStudioScript(script: string): StudioCommand[] {
  return script
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const separator = line.indexOf(":");
      const rawKind = separator >= 0 ? line.slice(0, separator).trim() : "글";
      const value = separator >= 0 ? line.slice(separator + 1).trim() : line;
      return {
        id: `${index}-${rawKind}-${value}`,
        kind: studioCommandMap[rawKind] ?? "text",
        value,
      };
    });
}

function CustomPreview({
  block,
  drafts,
  onDraftChange,
  onToast,
}: {
  block: WebBlock;
  drafts: Record<string, string>;
  onDraftChange: (key: string, value: string) => void;
  onToast: (message: string) => void;
}) {
  const commands = parseStudioScript(block.script ?? "");

  return (
    <section className="preview-card custom-preview">
      {commands.length === 0 && (
        <p>자유 기능 명령을 작성하면 이곳에 결과가 나타나요.</p>
      )}
      {commands.map((command) => {
        if (command.kind === "title") {
          return <h2 key={command.id}>{command.value}</h2>;
        }
        if (command.kind === "text") {
          return <p key={command.id}>{command.value}</p>;
        }
        if (command.kind === "input" || command.kind === "textarea") {
          const key = `${block.id}:${command.id}`;
          return (
            <label key={command.id}>
              <span>{command.value}</span>
              {command.kind === "textarea" ? (
                <textarea
                  placeholder={`${command.value} 입력`}
                  rows={2}
                  value={drafts[key] ?? ""}
                  onChange={(event) => onDraftChange(key, event.target.value)}
                />
              ) : (
                <input
                  placeholder={`${command.value} 입력`}
                  value={drafts[key] ?? ""}
                  onChange={(event) => onDraftChange(key, event.target.value)}
                />
              )}
            </label>
          );
        }
        if (command.kind === "choice") {
          return (
            <div className="custom-options" key={command.id}>
              {command.value.split("|").map((item) => (
                <button
                  key={`${command.id}:${item.trim()}`}
                  type="button"
                  onClick={() => onToast(`‘${item.trim()}’을 선택했어요.`)}
                >
                  {item.trim()}
                </button>
              ))}
            </div>
          );
        }
        if (command.kind === "check") {
          return (
            <div className="custom-checks" key={command.id}>
              {command.value.split("|").map((item) => (
                <label key={`${command.id}:${item.trim()}`}>
                  <input type="checkbox" />
                  <span>{item.trim()}</span>
                </label>
              ))}
            </div>
          );
        }
        return (
          <button
            className="preview-save"
            key={command.id}
            type="button"
            onClick={() => onToast(`‘${command.value}’ 기능을 실행했어요.`)}
          >
            <MousePointerClick aria-hidden="true" size={13} />
            {command.value}
          </button>
        );
      })}
    </section>
  );
}
