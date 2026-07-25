"use client";

import {
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Copy,
  GripVertical,
  LayoutPanelTop,
  MessageCircle,
  MousePointerClick,
  Palette,
  Play,
  Plus,
  RotateCcw,
  Save,
  Send,
  Settings2,
  Share2,
  Smartphone,
  Sparkles,
  TextCursorInput,
  Trash2,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  DragEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ACTION_ICON_LABELS,
  DEFAULT_PROJECT,
  normalizeProject,
  type ActionIcon,
  type ChatbotProject,
  type QuickAction,
  type SelectedTarget,
  type StudioMode,
} from "../../lib/chatbot-studio";
import { BlockWorkspace } from "./block-workspace";
import { PhonePreview } from "./phone-preview";

const STORAGE_KEY = "ai-chatbot-inventor-project-v1";

type PaletteKind = "screen" | "bot" | "greeting" | "action" | "input";
type MobilePanel = "palette" | "viewer" | "properties";

type PaletteItem = {
  kind: PaletteKind;
  name: string;
  hint: string;
  icon: LucideIcon;
  tone: "violet" | "yellow" | "mint" | "blue";
};

const paletteItems: PaletteItem[] = [
  {
    kind: "screen",
    name: "화면 배경",
    hint: "앱의 바탕을 꾸며요",
    icon: Smartphone,
    tone: "blue",
  },
  {
    kind: "bot",
    name: "챗봇 머리글",
    hint: "이름과 설명을 보여줘요",
    icon: Bot,
    tone: "violet",
  },
  {
    kind: "greeting",
    name: "첫 인사",
    hint: "처음 말할 내용을 정해요",
    icon: MessageCircle,
    tone: "mint",
  },
  {
    kind: "action",
    name: "질문 버튼",
    hint: "누르면 챗봇이 답해요",
    icon: MousePointerClick,
    tone: "yellow",
  },
  {
    kind: "input",
    name: "질문 입력창",
    hint: "직접 질문할 수 있어요",
    icon: TextCursorInput,
    tone: "blue",
  },
];

const colorChoices = [
  { name: "보라", value: "#6956e8" },
  { name: "파랑", value: "#3478f6" },
  { name: "민트", value: "#16a982" },
  { name: "주황", value: "#f26b3a" },
  { name: "분홍", value: "#e65387" },
];

function encodeProject(project: ChatbotProject) {
  const bytes = new TextEncoder().encode(JSON.stringify(project));
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function decodeProject(value: string) {
  try {
    const binary = atob(value);
    const bytes = Uint8Array.from(binary, (character) =>
      character.charCodeAt(0),
    );
    return normalizeProject(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}

export function ChatbotStudio() {
  const [project, setProject] = useState<ChatbotProject>(DEFAULT_PROJECT);
  const [mode, setMode] = useState<StudioMode>("designer");
  const [selectedTarget, setSelectedTarget] =
    useState<SelectedTarget>("screen");
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("viewer");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedAction = useMemo(
    () => project.actions.find((action) => action.id === selectedTarget),
    [project.actions, selectedTarget],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const shared = new URLSearchParams(window.location.search).get("project");
      const sharedProject = shared ? decodeProject(shared) : null;
      const saved = window.localStorage.getItem(STORAGE_KEY);

      if (sharedProject) {
        setProject(sharedProject);
      } else if (saved) {
        try {
          setProject(normalizeProject(JSON.parse(saved)));
        } catch {
          setProject(DEFAULT_PROJECT);
        }
      }
      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  }, [hydrated, project]);

  useEffect(() => {
    if (!previewOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [previewOpen]);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const notify = (message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2400);
  };

  const updateProject = <Key extends keyof ChatbotProject>(
    key: Key,
    value: ChatbotProject[Key],
  ) => {
    setProject((current) => ({ ...current, [key]: value }));
  };

  const updateAction = (
    id: string,
    patch: Partial<Pick<QuickAction, "label" | "response" | "icon">>,
  ) => {
    setProject((current) => ({
      ...current,
      actions: current.actions.map((action) =>
        action.id === id ? { ...action, ...patch } : action,
      ),
    }));
  };

  const addAction = () => {
    if (project.actions.length >= 12) {
      notify("질문 버튼은 12개까지 만들 수 있어요.");
      return;
    }

    const order = project.actions.length + 1;
    let serial = order;
    while (project.actions.some((action) => action.id === `question-${serial}`)) {
      serial += 1;
    }
    const id = `question-${serial}`;
    setProject((current) => ({
      ...current,
      actions: [
        ...current.actions,
        {
          id,
          label: `새 질문 ${order}`,
          response: "이 버튼을 눌렀을 때 챗봇이 말할 답을 적어 주세요.",
          icon: "message",
        },
      ],
    }));
    setSelectedTarget(id);
    setMobilePanel("properties");
    notify("새 질문 버튼을 추가했어요.");
  };

  const removeAction = (id: string) => {
    const action = project.actions.find((item) => item.id === id);
    if (!action) return;
    if (!window.confirm(`‘${action.label}’ 질문 버튼을 삭제할까요?`)) return;

    setProject((current) => ({
      ...current,
      actions: current.actions.filter((item) => item.id !== id),
    }));
    setSelectedTarget("screen");
    notify("질문 버튼을 삭제했어요.");
  };

  const moveAction = (id: string, direction: -1 | 1) => {
    setProject((current) => {
      const index = current.actions.findIndex((action) => action.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.actions.length) {
        return current;
      }
      const actions = [...current.actions];
      [actions[index], actions[target]] = [actions[target], actions[index]];
      return { ...current, actions };
    });
  };

  const choosePaletteItem = (kind: PaletteKind) => {
    if (kind === "action") {
      addAction();
      return;
    }
    if (kind === "input" && !project.inputEnabled) {
      updateProject("inputEnabled", true);
    }
    setSelectedTarget(kind);
    setMobilePanel("properties");
  };

  const dropPaletteItem = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const kind = event.dataTransfer.getData(
      "application/x-chatbot-component",
    ) as PaletteKind;
    if (paletteItems.some((item) => item.kind === kind)) {
      choosePaletteItem(kind);
    }
  };

  const saveNow = () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    notify("이 기기에 프로젝트를 저장했어요.");
  };

  const resetProject = () => {
    if (!window.confirm("지금 만든 내용을 지우고 처음 예제로 돌아갈까요?")) return;
    setProject(DEFAULT_PROJECT);
    setSelectedTarget("screen");
    setMode("designer");
    notify("AI 알림장 예제로 돌아왔어요.");
  };

  const shareProject = async () => {
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("project", encodeProject(project));

    try {
      await navigator.clipboard.writeText(url.toString());
      notify("공유 링크를 복사했어요.");
    } catch {
      window.prompt("아래 링크를 복사해 주세요.", url.toString());
    }
  };

  const selectTarget = (target: SelectedTarget) => {
    setSelectedTarget(target);
    if (window.innerWidth < 760) setMobilePanel("properties");
  };

  const renderProperties = () => {
    if (selectedAction) {
      return (
        <div className="property-form">
          <div className="selected-component-heading">
            <span className="component-symbol yellow">
              <MousePointerClick size={16} aria-hidden="true" />
            </span>
            <div>
              <strong>질문 버튼</strong>
              <small>QuestionButton</small>
            </div>
          </div>
          <label>
            <span>버튼에 보일 글</span>
            <input
              value={selectedAction.label}
              maxLength={24}
              onChange={(event) =>
                updateAction(selectedAction.id, { label: event.target.value })
              }
            />
          </label>
          <label>
            <span>챗봇이 말할 답</span>
            <textarea
              rows={5}
              value={selectedAction.response}
              maxLength={180}
              onChange={(event) =>
                updateAction(selectedAction.id, {
                  response: event.target.value,
                })
              }
            />
            <small className="field-count">
              {selectedAction.response.length}/180
            </small>
          </label>
          <label>
            <span>버튼 아이콘</span>
            <select
              value={selectedAction.icon}
              onChange={(event) =>
                updateAction(selectedAction.id, {
                  icon: event.target.value as ActionIcon,
                })
              }
            >
              {ACTION_ICON_LABELS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <button
            className="danger-button"
            type="button"
            onClick={() => removeAction(selectedAction.id)}
          >
            <Trash2 size={15} aria-hidden="true" />
            이 질문 버튼 삭제
          </button>
        </div>
      );
    }

    if (selectedTarget === "bot") {
      return (
        <div className="property-form">
          <div className="selected-component-heading">
            <span className="component-symbol violet">
              <Bot size={16} aria-hidden="true" />
            </span>
            <div>
              <strong>챗봇 머리글</strong>
              <small>ChatbotHeader</small>
            </div>
          </div>
          <label>
            <span>챗봇 이름</span>
            <input
              value={project.botName}
              maxLength={24}
              onChange={(event) => updateProject("botName", event.target.value)}
            />
          </label>
          <label>
            <span>한 줄 소개</span>
            <input
              value={project.subtitle}
              maxLength={36}
              onChange={(event) =>
                updateProject("subtitle", event.target.value)
              }
            />
          </label>
        </div>
      );
    }

    if (selectedTarget === "greeting") {
      return (
        <div className="property-form">
          <div className="selected-component-heading">
            <span className="component-symbol mint">
              <MessageCircle size={16} aria-hidden="true" />
            </span>
            <div>
              <strong>첫 인사</strong>
              <small>GreetingMessage</small>
            </div>
          </div>
          <label>
            <span>처음 보여 줄 말</span>
            <textarea
              rows={6}
              value={project.greeting}
              maxLength={180}
              onChange={(event) =>
                updateProject("greeting", event.target.value)
              }
            />
            <small className="field-count">{project.greeting.length}/180</small>
          </label>
        </div>
      );
    }

    if (selectedTarget === "input") {
      return (
        <div className="property-form">
          <div className="selected-component-heading">
            <span className="component-symbol blue">
              <TextCursorInput size={16} aria-hidden="true" />
            </span>
            <div>
              <strong>질문 입력창</strong>
              <small>QuestionInput</small>
            </div>
          </div>
          <label className="toggle-row">
            <span>
              <b>입력창 보이기</b>
              <small>학생이 직접 질문할 수 있어요.</small>
            </span>
            <input
              type="checkbox"
              checked={project.inputEnabled}
              onChange={(event) =>
                updateProject("inputEnabled", event.target.checked)
              }
            />
          </label>
          <label>
            <span>입력 안내 문구</span>
            <input
              value={project.inputPlaceholder}
              maxLength={42}
              onChange={(event) =>
                updateProject("inputPlaceholder", event.target.value)
              }
            />
          </label>
          <label>
            <span>답을 찾지 못했을 때</span>
            <textarea
              rows={5}
              value={project.fallbackResponse}
              maxLength={180}
              onChange={(event) =>
                updateProject("fallbackResponse", event.target.value)
              }
            />
          </label>
        </div>
      );
    }

    return (
      <div className="property-form">
        <div className="selected-component-heading">
          <span className="component-symbol blue">
            <Smartphone size={16} aria-hidden="true" />
          </span>
          <div>
            <strong>Screen1</strong>
            <small>앱 전체 화면</small>
          </div>
        </div>
        <label>
          <span>프로젝트 이름</span>
          <input
            value={project.title}
            maxLength={32}
            onChange={(event) => updateProject("title", event.target.value)}
          />
        </label>
        <fieldset className="color-field">
          <legend>대표 색</legend>
          <div className="color-swatches">
            {colorChoices.map((color) => (
              <button
                className={project.accent === color.value ? "selected" : ""}
                key={color.value}
                type="button"
                style={{ backgroundColor: color.value }}
                aria-label={`${color.name}색 선택`}
                title={color.name}
                onClick={() => updateProject("accent", color.value)}
              >
                {project.accent === color.value && (
                  <Check size={13} aria-hidden="true" />
                )}
              </button>
            ))}
            <label className="custom-color" title="직접 색 고르기">
              <Palette size={14} aria-hidden="true" />
              <input
                type="color"
                value={project.accent}
                aria-label="대표 색 직접 고르기"
                onChange={(event) =>
                  updateProject("accent", event.target.value)
                }
              />
            </label>
          </div>
        </fieldset>
        <label className="color-input-row">
          <span>대화 화면 배경</span>
          <span>
            <input
              type="color"
              value={project.screenBackground}
              aria-label="대화 화면 배경색"
              onChange={(event) =>
                updateProject("screenBackground", event.target.value)
              }
            />
            <code>{project.screenBackground}</code>
          </span>
        </label>
      </div>
    );
  };

  return (
    <main className="studio-shell">
      <header className="studio-topbar">
        <div className="studio-brand">
          <span className="studio-logo">
            <Bot size={23} strokeWidth={2.5} aria-hidden="true" />
          </span>
          <span>
            <strong>AI CHATBOT LAB</strong>
            <small>App Inventor 방식으로 쉽게 만들기</small>
          </span>
        </div>

        <div className="project-name">
          <span>PROJECT</span>
          <strong>{project.title}</strong>
        </div>

        <nav className="mode-tabs" aria-label="제작 화면 전환">
          <button
            className={mode === "designer" ? "active" : ""}
            type="button"
            onClick={() => {
              setMode("designer");
              setMobilePanel("viewer");
            }}
          >
            <LayoutPanelTop size={16} aria-hidden="true" />
            디자이너
          </button>
          <button
            className={mode === "blocks" ? "active" : ""}
            type="button"
            onClick={() => {
              setMode("blocks");
              setMobilePanel("viewer");
            }}
          >
            <Workflow size={16} aria-hidden="true" />
            블록
            <span>{project.actions.length}</span>
          </button>
        </nav>

        <div className="topbar-actions">
          <span className="autosave-state">
            <i aria-hidden="true" />
            자동 저장
          </span>
          <button
            className="icon-action"
            type="button"
            aria-label="처음 예제로 되돌리기"
            title="처음 예제로 되돌리기"
            onClick={resetProject}
          >
            <RotateCcw size={17} aria-hidden="true" />
          </button>
          <button className="header-button" type="button" onClick={saveNow}>
            <Save size={16} aria-hidden="true" />
            저장
          </button>
          <button className="header-button" type="button" onClick={shareProject}>
            <Share2 size={16} aria-hidden="true" />
            공유
          </button>
          <button
            className="run-button"
            type="button"
            onClick={() => setPreviewOpen(true)}
          >
            <Play size={16} fill="currentColor" aria-hidden="true" />
            실행
          </button>
        </div>
      </header>

      <section className="learning-strip" aria-label="챗봇 만들기 순서">
        <div className={mode === "designer" ? "current" : ""}>
          <span>1</span>
          <p>
            <strong>화면 놓기</strong>
            <small>기능을 골라 휴대폰에 넣어요</small>
          </p>
        </div>
        <ChevronRight size={15} aria-hidden="true" />
        <div className={mode === "designer" ? "current" : ""}>
          <span>2</span>
          <p>
            <strong>속성 바꾸기</strong>
            <small>글과 색, 챗봇 답을 적어요</small>
          </p>
        </div>
        <ChevronRight size={15} aria-hidden="true" />
        <div className={mode === "blocks" ? "current" : ""}>
          <span>3</span>
          <p>
            <strong>블록 연결하기</strong>
            <small>질문 버튼과 답을 확인해요</small>
          </p>
        </div>
        <button
          className="lesson-help"
          type="button"
          onClick={() =>
            notify("기능을 누르고 오른쪽 속성만 바꾸면 챗봇이 완성돼요.")
          }
        >
          <CircleHelp size={15} aria-hidden="true" />
          어떻게 만들어요?
        </button>
      </section>

      <nav className="mobile-panel-tabs" aria-label="모바일 편집 영역 전환">
        <button
          className={mobilePanel === "palette" ? "active" : ""}
          type="button"
          onClick={() => setMobilePanel("palette")}
        >
          <Plus size={15} aria-hidden="true" />
          기능
        </button>
        <button
          className={mobilePanel === "viewer" ? "active" : ""}
          type="button"
          onClick={() => setMobilePanel("viewer")}
        >
          <Smartphone size={15} aria-hidden="true" />
          {mode === "designer" ? "화면" : "블록"}
        </button>
        <button
          className={mobilePanel === "properties" ? "active" : ""}
          type="button"
          onClick={() => setMobilePanel("properties")}
        >
          <Settings2 size={15} aria-hidden="true" />
          속성
        </button>
      </nav>

      <div
        className={`studio-layout ${mode === "blocks" ? "blocks-mode" : ""}`}
      >
        {mode === "designer" && (
          <aside
            className={`palette-panel ${
              mobilePanel === "palette" ? "mobile-active" : ""
            }`}
          >
            <div className="panel-title">
              <span>팔레트</span>
              <small>끌어 놓거나 눌러 추가</small>
            </div>
            <div className="palette-section-heading">
              <span>사용자 인터페이스</span>
              <ChevronDown size={14} aria-hidden="true" />
            </div>
            <div className="palette-list">
              {paletteItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    className="palette-item"
                    draggable
                    key={item.kind}
                    type="button"
                    onDragStart={(event) => {
                      event.dataTransfer.setData(
                        "application/x-chatbot-component",
                        item.kind,
                      );
                      event.dataTransfer.effectAllowed = "copy";
                    }}
                    onClick={() => choosePaletteItem(item.kind)}
                  >
                    <span className={`palette-icon ${item.tone}`}>
                      <Icon size={18} strokeWidth={2.2} aria-hidden="true" />
                    </span>
                    <span>
                      <strong>{item.name}</strong>
                      <small>{item.hint}</small>
                    </span>
                    <GripVertical size={15} aria-hidden="true" />
                  </button>
                );
              })}
            </div>
            <div className="palette-guide">
              <span>
                <Sparkles size={16} aria-hidden="true" />
              </span>
              <div>
                <strong>중학생도 바로 시작</strong>
                <p>
                  복잡한 코드를 쓰지 않고 질문과 답만 바꾸면 작동해요.
                </p>
              </div>
            </div>
          </aside>
        )}

        <section
          className={`viewer-panel ${
            mobilePanel === "viewer" ? "mobile-active" : ""
          }`}
        >
          {mode === "designer" ? (
            <>
              <header className="viewer-heading">
                <div>
                  <span>뷰어</span>
                  <small>Screen1 · 휴대폰 화면</small>
                </div>
                <span className="viewer-tip">
                  <MousePointerClick size={14} aria-hidden="true" />
                  화면의 요소를 누르면 속성을 바꿀 수 있어요
                </span>
              </header>
              <div
                className="phone-stage"
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "copy";
                }}
                onDrop={dropPaletteItem}
              >
                <div className="stage-grid" aria-hidden="true" />
                <div className="screen-label">
                  <Smartphone size={13} aria-hidden="true" />
                  Screen1
                </div>
                <PhonePreview
                  project={project}
                  selectedTarget={selectedTarget}
                  onSelect={selectTarget}
                />
                <p className="drop-hint">
                  <Plus size={14} aria-hidden="true" />
                  왼쪽 기능을 이곳으로 끌어 놓으세요
                </p>
              </div>
            </>
          ) : (
            <BlockWorkspace
              project={project}
              selectedTarget={selectedTarget}
              onSelect={selectTarget}
              onAdd={addAction}
              onMove={moveAction}
              onDelete={removeAction}
            />
          )}
        </section>

        <aside
          className={`inspector-panel ${
            mobilePanel === "properties" ? "mobile-active" : ""
          }`}
        >
          <section className="components-panel">
            <div className="panel-title horizontal">
              <span>컴포넌트</span>
              <small>{project.actions.length + 4}개</small>
            </div>
            <div className="component-tree">
              <button
                className={selectedTarget === "screen" ? "selected" : ""}
                type="button"
                onClick={() => selectTarget("screen")}
              >
                <ChevronDown size={13} aria-hidden="true" />
                <span className="tree-icon screen">
                  <Smartphone size={13} aria-hidden="true" />
                </span>
                <span>
                  <strong>Screen1</strong>
                  <small>{project.title}</small>
                </span>
              </button>
              <div className="tree-children">
                <button
                  className={selectedTarget === "bot" ? "selected" : ""}
                  type="button"
                  onClick={() => selectTarget("bot")}
                >
                  <span className="tree-line" aria-hidden="true" />
                  <span className="tree-icon violet">
                    <Bot size={13} aria-hidden="true" />
                  </span>
                  <span>
                    <strong>ChatbotHeader1</strong>
                    <small>{project.botName}</small>
                  </span>
                </button>
                <button
                  className={selectedTarget === "greeting" ? "selected" : ""}
                  type="button"
                  onClick={() => selectTarget("greeting")}
                >
                  <span className="tree-line" aria-hidden="true" />
                  <span className="tree-icon mint">
                    <MessageCircle size={13} aria-hidden="true" />
                  </span>
                  <span>
                    <strong>GreetingMessage1</strong>
                    <small>첫 인사</small>
                  </span>
                </button>
                {project.actions.map((action, index) => (
                  <button
                    className={selectedTarget === action.id ? "selected" : ""}
                    key={action.id}
                    type="button"
                    onClick={() => selectTarget(action.id)}
                  >
                    <span className="tree-line" aria-hidden="true" />
                    <span className="tree-icon yellow">
                      <MousePointerClick size={13} aria-hidden="true" />
                    </span>
                    <span>
                      <strong>QuestionButton{index + 1}</strong>
                      <small>{action.label}</small>
                    </span>
                  </button>
                ))}
                <button
                  className={selectedTarget === "input" ? "selected" : ""}
                  type="button"
                  onClick={() => selectTarget("input")}
                >
                  <span className="tree-line" aria-hidden="true" />
                  <span className="tree-icon blue">
                    <Send size={13} aria-hidden="true" />
                  </span>
                  <span>
                    <strong>QuestionInput1</strong>
                    <small>
                      {project.inputEnabled ? "화면에 보임" : "숨김"}
                    </small>
                  </span>
                </button>
              </div>
            </div>
          </section>

          <section className="properties-panel">
            <div className="panel-title horizontal">
              <span>속성</span>
              <Settings2 size={14} aria-hidden="true" />
            </div>
            {renderProperties()}
          </section>
        </aside>
      </div>

      {previewOpen && (
        <div
          className="preview-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setPreviewOpen(false);
          }}
        >
          <section
            className="preview-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="preview-title"
          >
            <header>
              <div>
                <span className="preview-live">
                  <i aria-hidden="true" />
                  LIVE TEST
                </span>
                <h2 id="preview-title">내 챗봇 실행하기</h2>
                <p>버튼을 누르거나 직접 질문해 보세요.</p>
              </div>
              <button
                type="button"
                aria-label="미리보기 닫기"
                onClick={() => setPreviewOpen(false)}
              >
                <X size={20} aria-hidden="true" />
              </button>
            </header>
            <div className="preview-phone-wrap">
              <PhonePreview project={project} interactive />
            </div>
            <footer>
              <span>
                <Check size={14} aria-hidden="true" />
                질문 버튼 {project.actions.length}개가 연결되어 있어요
              </span>
              <button type="button" onClick={shareProject}>
                <Copy size={14} aria-hidden="true" />
                이 챗봇 공유
              </button>
            </footer>
          </section>
        </div>
      )}

      {toast && (
        <div className="studio-toast" role="status">
          <Check size={16} aria-hidden="true" />
          {toast}
        </div>
      )}
    </main>
  );
}
