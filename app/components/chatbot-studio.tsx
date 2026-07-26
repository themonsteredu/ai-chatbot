"use client";

import {
  AppWindow,
  BellRing,
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Copy,
  FileText,
  FilePlus2,
  GripVertical,
  Info,
  LayoutPanelTop,
  LibraryBig,
  ListChecks,
  MousePointerClick,
  NotebookPen,
  Palette,
  Play,
  Plus,
  Printer,
  Rocket,
  RotateCcw,
  Settings2,
  Share2,
  Smartphone,
  Sparkles,
  TentTree,
  Trash2,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { DragEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ACTION_ICON_LABELS,
  DEFAULT_PROJECT,
  PROJECT_TEMPLATES,
  cloneProject,
  normalizeProject,
  type ActionIcon,
  type QuickAction,
  type SelectedTarget,
  type StudioMode,
  type TemplateId,
  type WebAppProject,
} from "../../lib/chatbot-studio";
import {
  deleteSavedWebApp,
  isValidWebAppId,
  listSavedWebApps,
  loadSavedWebApp,
  saveWebApp,
  type SavedWebAppSummary,
} from "../../lib/saved-webapps";
import { BlockWorkspace } from "./block-workspace";
import { PhonePreview } from "./phone-preview";
import { SavedWebAppLibrary } from "./saved-webapp-library";
import { WebAppPlayer } from "./webapp-player";

const STORAGE_KEY = "my-webapp-inventor-project-v3";
const LEGACY_INSTALLED_PROJECT_KEY = "my-webapp-installed-project-v1";

type PaletteKind =
  | "screen"
  | "header"
  | "notice"
  | "checklist"
  | "journal"
  | "camp-report"
  | "button"
  | "chatbot";
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
    hint: "웹앱의 바탕을 꾸며요",
    icon: Smartphone,
    tone: "blue",
  },
  {
    kind: "header",
    name: "앱 머리글",
    hint: "이름과 소개를 보여줘요",
    icon: AppWindow,
    tone: "violet",
  },
  {
    kind: "notice",
    name: "안내 카드",
    hint: "중요한 내용을 알려줘요",
    icon: Info,
    tone: "yellow",
  },
  {
    kind: "checklist",
    name: "활동 체크",
    hint: "할 일을 하나씩 완료해요",
    icon: ListChecks,
    tone: "mint",
  },
  {
    kind: "journal",
    name: "나의 기록",
    hint: "생각을 적고 저장해요",
    icon: NotebookPen,
    tone: "blue",
  },
  {
    kind: "camp-report",
    name: "3일 캠프 기록",
    hint: "12차시·사진·소감을 모아요",
    icon: FileText,
    tone: "blue",
  },
  {
    kind: "button",
    name: "일반 버튼",
    hint: "누르면 안내를 보여줘요",
    icon: MousePointerClick,
    tone: "yellow",
  },
  {
    kind: "chatbot",
    name: "나만의 챗봇",
    hint: "내 질문과 답으로 만들어요",
    icon: Bot,
    tone: "violet",
  },
];

const templateIconMap: Record<TemplateId, LucideIcon> = {
  notice: BellRing,
  camp: TentTree,
  blank: FilePlus2,
};

const featureEnabledKey = {
  notice: "noticeEnabled",
  checklist: "checklistEnabled",
  journal: "journalEnabled",
  "camp-report": "campReportEnabled",
  button: "buttonEnabled",
  chatbot: "chatbotEnabled",
} as const;

const colorChoices = [
  { name: "보라", value: "#6956e8" },
  { name: "파랑", value: "#3478f6" },
  { name: "민트", value: "#16a982" },
  { name: "주황", value: "#f26b3a" },
  { name: "분홍", value: "#e65387" },
];

function encodeProject(project: WebAppProject) {
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
  const [project, setProject] = useState<WebAppProject>(() =>
    cloneProject(DEFAULT_PROJECT),
  );
  const [mode, setMode] = useState<StudioMode>("designer");
  const [selectedTarget, setSelectedTarget] =
    useState<SelectedTarget>("screen");
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("viewer");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [activeAppId, setActiveAppId] = useState("");
  const [savedApps, setSavedApps] = useState<SavedWebAppSummary[]>([]);
  const [loadError, setLoadError] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedAction = useMemo(
    () => project.actions.find((action) => action.id === selectedTarget),
    [project.actions, selectedTarget],
  );

  const visibleFeatureCount =
    1 +
    Number(project.noticeEnabled) +
    Number(project.checklistEnabled) +
    Number(project.journalEnabled) +
    Number(project.campReportEnabled) +
    Number(project.buttonEnabled) +
    Number(project.chatbotEnabled);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const runMode = params.get("run");
      const requestedAppId = params.get("app");
      const editingAppId = params.get("edit");
      const shared = params.get("project");
      const sharedProject = shared ? decodeProject(shared) : null;
      const isStandalone =
        runMode === "1" || runMode === "install" || runMode === "saved";
      let nextAppId = isValidWebAppId(requestedAppId)
        ? requestedAppId!
        : isValidWebAppId(editingAppId)
          ? editingAppId!
          : "";
      let nextProject: WebAppProject | null = null;

      if (sharedProject) {
        const savedApp = saveWebApp(
          window.localStorage,
          sharedProject,
          nextAppId || undefined,
        );
        nextAppId = savedApp.id;
        nextProject = sharedProject;

        if (isStandalone) {
          const installedUrl = new URL("/", window.location.origin);
          installedUrl.searchParams.set(
            "run",
            runMode === "saved" ? "saved" : "install",
          );
          installedUrl.searchParams.set("app", nextAppId);
          window.history.replaceState(null, "", installedUrl);
        }
      } else if (nextAppId) {
        nextProject = loadSavedWebApp(window.localStorage, nextAppId);
      } else if (runMode === "saved") {
        const legacySaved = window.localStorage.getItem(
          LEGACY_INSTALLED_PROJECT_KEY,
        );
        if (legacySaved) {
          try {
            nextProject = normalizeProject(JSON.parse(legacySaved));
            const migrated = saveWebApp(window.localStorage, nextProject);
            nextAppId = migrated.id;
            const migratedUrl = new URL("/", window.location.origin);
            migratedUrl.searchParams.set("run", "saved");
            migratedUrl.searchParams.set("app", nextAppId);
            window.history.replaceState(null, "", migratedUrl);
          } catch {
            nextProject = null;
          }
        }
      } else {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            nextProject = normalizeProject(JSON.parse(saved));
          } catch {
            nextProject = cloneProject(DEFAULT_PROJECT);
          }
        }
      }

      if (nextProject) {
        setProject(nextProject);
      } else if (isStandalone) {
        setLoadError(
          "이 기기에서 이 웹앱의 저장 내용을 찾지 못했어요. 만든 기기에서 다시 공유 링크를 열어 주세요.",
        );
      } else {
        setProject(cloneProject(DEFAULT_PROJECT));
      }

      setActiveAppId(nextAppId);
      setSavedApps(listSavedWebApps(window.localStorage));
      setStandalone(isStandalone);
      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated || standalone) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(project));

    if (activeAppId) {
      saveWebApp(window.localStorage, project, activeAppId);
    }
  }, [activeAppId, hydrated, project, standalone]);

  useEffect(() => {
    if (!previewOpen && !libraryOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setPreviewOpen(false);
      setLibraryOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [libraryOpen, previewOpen]);

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

  const updateProject = <Key extends keyof WebAppProject>(
    key: Key,
    value: WebAppProject[Key],
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
      notify("질문·답은 12개까지 만들 수 있어요.");
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
      chatbotEnabled: true,
      actions: [
        ...current.actions,
        {
          id,
          label: `새 질문 ${order}`,
          response: "이 질문을 눌렀을 때 보여 줄 답을 적어 주세요.",
          icon: "message",
        },
      ],
    }));
    setSelectedTarget(id);
    setMobilePanel("properties");
    notify("나만의 챗봇에 새 질문과 답을 추가했어요.");
  };

  const removeAction = (id: string) => {
    const action = project.actions.find((item) => item.id === id);
    if (!action) return;
    if (!window.confirm(`‘${action.label}’ 질문 버튼을 삭제할까요?`)) return;

    setProject((current) => ({
      ...current,
      actions: current.actions.filter((item) => item.id !== id),
    }));
    setSelectedTarget("chatbot");
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
    if (kind !== "screen" && kind !== "header") {
      const enabledKey =
        featureEnabledKey[kind as keyof typeof featureEnabledKey];
      setProject((current) => ({ ...current, [enabledKey]: true }));
    }
    setSelectedTarget(kind);
    setMobilePanel("properties");
    if (kind !== "screen" && kind !== "header") {
      notify(`${paletteItems.find((item) => item.kind === kind)?.name} 기능을 준비했어요.`);
    }
  };

  const hideFeature = (
    kind: Exclude<PaletteKind, "screen" | "header">,
  ) => {
    const item = paletteItems.find((paletteItem) => paletteItem.kind === kind);
    if (!window.confirm(`‘${item?.name}’ 기능을 화면에서 뺄까요?`)) return;
    const enabledKey = featureEnabledKey[kind];
    setProject((current) => ({ ...current, [enabledKey]: false }));
    setSelectedTarget("screen");
    notify(`${item?.name} 기능을 화면에서 뺐어요.`);
  };

  const applyTemplate = (templateId: TemplateId) => {
    const template = PROJECT_TEMPLATES.find((item) => item.id === templateId);
    if (!template || template.id === project.template) return;
    if (
      !window.confirm(
        `지금 내용을 ‘${template.name}’ 예제로 바꿀까요? 현재 내용은 새 예제로 바뀝니다.`,
      )
    ) {
      return;
    }
    setProject(cloneProject(template.project));
    setSelectedTarget("screen");
    setMode("designer");
    setMobilePanel("viewer");
    notify(`${template.name} 예제를 불러왔어요.`);
  };

  const dropPaletteItem = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const kind = event.dataTransfer.getData(
      "application/x-webapp-component",
    ) as PaletteKind;
    if (paletteItems.some((item) => item.kind === kind)) {
      choosePaletteItem(kind);
    }
  };

  const saveCurrentAsWebApp = () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    const savedApp = saveWebApp(
      window.localStorage,
      project,
      activeAppId || undefined,
    );
    setActiveAppId(savedApp.id);
    setSavedApps(listSavedWebApps(window.localStorage));
    return savedApp;
  };

  const openInstallPage = () => {
    const savedApp = saveCurrentAsWebApp();
    const url = new URL("/", window.location.origin);
    url.searchParams.set("run", "install");
    url.searchParams.set("app", savedApp.id);
    window.location.href = url.toString();
  };

  const resetProject = () => {
    if (!window.confirm("지금 만든 내용을 지우고 빈 웹앱으로 돌아갈까요?"))
      return;
    setProject(cloneProject(DEFAULT_PROJECT));
    setSelectedTarget("screen");
    setMode("designer");
    notify("빈 웹앱으로 돌아왔어요.");
  };

  const shareProject = async () => {
    const savedApp = saveCurrentAsWebApp();
    const url = new URL("/", window.location.origin);
    url.searchParams.set("run", "install");
    url.searchParams.set("app", savedApp.id);
    url.searchParams.set("project", encodeProject(project));

    try {
      await navigator.clipboard.writeText(url.toString());
      notify("내 웹앱 공유 링크를 복사했어요.");
    } catch {
      window.prompt("아래 링크를 복사해 주세요.", url.toString());
    }
  };

  const editStandalone = () => {
    const url = new URL("/", window.location.origin);
    if (activeAppId) url.searchParams.set("edit", activeAppId);
    window.location.href = url.toString();
  };

  const openSavedApp = (app: SavedWebAppSummary) => {
    const url = new URL("/", window.location.origin);
    url.searchParams.set("run", "install");
    url.searchParams.set("app", app.id);
    window.location.href = url.toString();
  };

  const showSavedApps = () => {
    setSavedApps(listSavedWebApps(window.localStorage));
    setLibraryOpen(true);
  };

  const editSavedApp = (app: SavedWebAppSummary) => {
    const url = new URL("/", window.location.origin);
    url.searchParams.set("edit", app.id);
    window.location.href = url.toString();
  };

  const removeSavedApp = (app: SavedWebAppSummary) => {
    if (
      !window.confirm(
        `‘${app.appName}’을 보관함에서 삭제할까요? 홈 화면에 추가한 아이콘은 기기에서 따로 지워야 해요.`,
      )
    ) {
      return;
    }

    deleteSavedWebApp(window.localStorage, app.id);
    setSavedApps(listSavedWebApps(window.localStorage));
    if (app.id === activeAppId) {
      setActiveAppId("");
      window.history.replaceState(null, "", "/");
    }
    notify("웹앱을 보관함에서 삭제했어요.");
  };

  const selectTarget = (target: SelectedTarget) => {
    setSelectedTarget(target);
    if (window.innerWidth <= 960) setMobilePanel("properties");
  };

  const updateChecklistItems = (value: string) => {
    const lines = value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 10);
    updateProject(
      "checklistItems",
      lines.map((text, index) => ({
        id: project.checklistItems[index]?.id ?? `check-${index + 1}`,
        text,
      })),
    );
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
              <strong>내 질문과 답</strong>
              <small>ChatbotQuestion</small>
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
            <span>이 질문에 보여 줄 답</span>
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

    if (selectedTarget === "header") {
      return (
        <div className="property-form">
          <div className="selected-component-heading">
            <span className="component-symbol violet">
              <AppWindow size={16} aria-hidden="true" />
            </span>
            <div>
              <strong>앱 머리글</strong>
              <small>AppHeader</small>
            </div>
          </div>
          <label>
            <span>웹앱 이름</span>
            <input
              value={project.appName}
              maxLength={26}
              onChange={(event) => updateProject("appName", event.target.value)}
            />
          </label>
          <label>
            <span>한 줄 소개</span>
            <input
              value={project.subtitle}
              maxLength={42}
              onChange={(event) =>
                updateProject("subtitle", event.target.value)
              }
            />
          </label>
        </div>
      );
    }

    if (selectedTarget === "notice") {
      return (
        <div className="property-form">
          <div className="selected-component-heading">
            <span className="component-symbol yellow">
              <Info size={16} aria-hidden="true" />
            </span>
            <div>
              <strong>안내 카드</strong>
              <small>NoticeCard</small>
            </div>
          </div>
          <label>
            <span>카드 제목</span>
            <input
              value={project.noticeTitle}
              maxLength={28}
              onChange={(event) =>
                updateProject("noticeTitle", event.target.value)
              }
            />
          </label>
          <label>
            <span>안내 내용</span>
            <textarea
              rows={6}
              value={project.noticeBody}
              maxLength={220}
              onChange={(event) =>
                updateProject("noticeBody", event.target.value)
              }
            />
          </label>
          <button
            className="danger-button"
            type="button"
            onClick={() => hideFeature("notice")}
          >
            <Trash2 size={15} aria-hidden="true" />
            안내 카드 화면에서 빼기
          </button>
        </div>
      );
    }

    if (selectedTarget === "checklist") {
      return (
        <div className="property-form">
          <div className="selected-component-heading">
            <span className="component-symbol mint">
              <ListChecks size={16} aria-hidden="true" />
            </span>
            <div>
              <strong>활동 체크</strong>
              <small>Checklist</small>
            </div>
          </div>
          <label>
            <span>체크 목록 제목</span>
            <input
              value={project.checklistTitle}
              maxLength={28}
              onChange={(event) =>
                updateProject("checklistTitle", event.target.value)
              }
            />
          </label>
          <label>
            <span>체크할 항목 · 한 줄에 하나</span>
            <textarea
              rows={7}
              value={project.checklistItems
                .map((item) => item.text)
                .join("\n")}
              onChange={(event) => updateChecklistItems(event.target.value)}
            />
            <small className="property-help">
              최대 10개까지 만들 수 있어요.
            </small>
          </label>
          <button
            className="danger-button"
            type="button"
            onClick={() => hideFeature("checklist")}
          >
            <Trash2 size={15} aria-hidden="true" />
            활동 체크 화면에서 빼기
          </button>
        </div>
      );
    }

    if (selectedTarget === "journal") {
      return (
        <div className="property-form">
          <div className="selected-component-heading">
            <span className="component-symbol blue">
              <NotebookPen size={16} aria-hidden="true" />
            </span>
            <div>
              <strong>나의 기록</strong>
              <small>MyJournal</small>
            </div>
          </div>
          <label>
            <span>기록 제목</span>
            <input
              value={project.journalTitle}
              maxLength={28}
              onChange={(event) =>
                updateProject("journalTitle", event.target.value)
              }
            />
          </label>
          <label>
            <span>입력창 안내 문구</span>
            <textarea
              rows={4}
              value={project.journalPrompt}
              maxLength={120}
              onChange={(event) =>
                updateProject("journalPrompt", event.target.value)
              }
            />
          </label>
          <label>
            <span>저장 버튼 글</span>
            <input
              value={project.journalButtonLabel}
              maxLength={20}
              onChange={(event) =>
                updateProject("journalButtonLabel", event.target.value)
              }
            />
          </label>
          <button
            className="danger-button"
            type="button"
            onClick={() => hideFeature("journal")}
          >
            <Trash2 size={15} aria-hidden="true" />
            나의 기록 화면에서 빼기
          </button>
        </div>
      );
    }

    if (selectedTarget === "camp-report") {
      return (
        <div className="property-form">
          <div className="selected-component-heading">
            <span className="component-symbol blue">
              <FileText size={16} aria-hidden="true" />
            </span>
            <div>
              <strong>3일 캠프 기록</strong>
              <small>CampReport</small>
            </div>
          </div>
          <div className="camp-structure-note">
            <FileText size={16} aria-hidden="true" />
            <span>
              <b>3일 × 하루 4차시 = 총 12차시</b>
              <small>각 차시에 활동·사진·느낀 점을 기록해요.</small>
            </span>
          </div>
          <label>
            <span>보고서 제목</span>
            <input
              value={project.campReportTitle}
              maxLength={36}
              onChange={(event) =>
                updateProject("campReportTitle", event.target.value)
              }
            />
          </label>
          <label>
            <span>활동 입력 안내</span>
            <textarea
              rows={4}
              value={project.campActivityPrompt}
              maxLength={140}
              onChange={(event) =>
                updateProject("campActivityPrompt", event.target.value)
              }
            />
          </label>
          <label>
            <span>차시별 느낀 점 안내</span>
            <textarea
              rows={4}
              value={project.campReflectionPrompt}
              maxLength={140}
              onChange={(event) =>
                updateProject("campReflectionPrompt", event.target.value)
              }
            />
          </label>
          <label>
            <span>마지막 전체 소감 안내</span>
            <textarea
              rows={4}
              value={project.campFinalPrompt}
              maxLength={160}
              onChange={(event) =>
                updateProject("campFinalPrompt", event.target.value)
              }
            />
          </label>
          <button
            className="danger-button"
            type="button"
            onClick={() => hideFeature("camp-report")}
          >
            <Trash2 size={15} aria-hidden="true" />
            3일 캠프 기록 화면에서 빼기
          </button>
        </div>
      );
    }

    if (selectedTarget === "button") {
      return (
        <div className="property-form">
          <div className="selected-component-heading">
            <span className="component-symbol yellow">
              <MousePointerClick size={16} aria-hidden="true" />
            </span>
            <div>
              <strong>일반 버튼</strong>
              <small>ActionButton</small>
            </div>
          </div>
          <label>
            <span>버튼에 보일 글</span>
            <input
              value={project.buttonLabel}
              maxLength={28}
              onChange={(event) =>
                updateProject("buttonLabel", event.target.value)
              }
            />
          </label>
          <label>
            <span>눌렀을 때 보여 줄 말</span>
            <textarea
              rows={5}
              value={project.buttonMessage}
              maxLength={160}
              onChange={(event) =>
                updateProject("buttonMessage", event.target.value)
              }
            />
          </label>
          <button
            className="danger-button"
            type="button"
            onClick={() => hideFeature("button")}
          >
            <Trash2 size={15} aria-hidden="true" />
            일반 버튼 화면에서 빼기
          </button>
        </div>
      );
    }

    if (selectedTarget === "chatbot") {
      return (
        <div className="property-form">
          <div className="selected-component-heading">
            <span className="component-symbol violet">
              <Bot size={16} aria-hidden="true" />
            </span>
            <div>
              <strong>나만의 챗봇</strong>
              <small>MyChatbot</small>
            </div>
          </div>
          <label>
            <span>챗봇 이름</span>
            <input
              value={project.botName}
              maxLength={26}
              onChange={(event) => updateProject("botName", event.target.value)}
            />
          </label>
          <label>
            <span>첫 인사</span>
            <textarea
              rows={4}
              value={project.greeting}
              maxLength={160}
              onChange={(event) =>
                updateProject("greeting", event.target.value)
              }
            />
          </label>
          <label className="toggle-row">
            <span>
              <b>직접 질문 입력</b>
              <small>내가 만든 질문과 비슷한 문장을 찾아 답해요.</small>
            </span>
            <input
              type="checkbox"
              checked={project.inputEnabled}
              onChange={(event) =>
                updateProject("inputEnabled", event.target.checked)
              }
            />
          </label>
          {project.inputEnabled && (
            <>
              <label>
                <span>입력창 안내 문구</span>
                <input
                  value={project.inputPlaceholder}
                  maxLength={44}
                  onChange={(event) =>
                    updateProject("inputPlaceholder", event.target.value)
                  }
                />
              </label>
              <label>
                <span>답을 찾지 못했을 때</span>
                <textarea
                  rows={4}
                  value={project.fallbackResponse}
                  maxLength={180}
                  onChange={(event) =>
                    updateProject("fallbackResponse", event.target.value)
                  }
                />
              </label>
            </>
          )}
          <button className="secondary-button" type="button" onClick={addAction}>
            <Plus size={15} aria-hidden="true" />
            질문과 답 추가
          </button>
          <button
            className="danger-button"
            type="button"
            onClick={() => hideFeature("chatbot")}
          >
            <Trash2 size={15} aria-hidden="true" />
            나만의 챗봇 화면에서 빼기
          </button>
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
            <small>웹앱 전체 화면</small>
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
          <span>웹앱 화면 배경</span>
          <span>
            <input
              type="color"
              value={project.screenBackground}
              aria-label="웹앱 화면 배경색"
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

  if (!hydrated) {
    return (
      <main className="studio-loading" aria-label="나만의 웹앱 불러오는 중">
        <Rocket size={28} aria-hidden="true" />
        <span>나만의 웹앱을 불러오고 있어요</span>
      </main>
    );
  }

  if (standalone && loadError) {
    return (
      <main className="missing-webapp">
        <span>
          <Smartphone size={27} aria-hidden="true" />
        </span>
        <small>WEB APP NOT FOUND</small>
        <h1>저장한 웹앱을 찾지 못했어요</h1>
        <p>{loadError}</p>
        <Link href="/">웹앱 만들기로 돌아가기</Link>
      </main>
    );
  }

  if (standalone) {
    return (
      <WebAppPlayer
        appId={activeAppId}
        project={project}
        onEdit={editStandalone}
      />
    );
  }

  return (
    <main className="studio-shell">
      <header className="studio-topbar">
        <div className="studio-brand">
          <span className="studio-logo">
            <Rocket size={23} strokeWidth={2.5} aria-hidden="true" />
          </span>
          <span>
            <strong>AI WEB APP LAB</strong>
            <small>나만의 웹앱 만들기</small>
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
            <span>{visibleFeatureCount}</span>
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
          <Link
            className="header-button"
            href="/worksheets"
            aria-label="웹앱 기획 활동지 열기"
            title="웹앱 기획 활동지"
          >
            <Printer size={16} aria-hidden="true" />
            웹앱 기획 활동지
          </Link>
          <button
            className="header-button"
            type="button"
            aria-label="저장한 내 웹앱 열기"
            title="내 웹앱"
            onClick={showSavedApps}
          >
            <LibraryBig size={16} aria-hidden="true" />
            내 웹앱
          </button>
          <button
            className="header-button"
            type="button"
            aria-label="현재 웹앱 공유하기"
            title="공유"
            onClick={shareProject}
          >
            <Share2 size={16} aria-hidden="true" />
            공유
          </button>
          <button
            className="save-app-button"
            type="button"
            aria-label="완성한 내용을 내 웹앱으로 저장"
            title="완성한 내용을 내 웹앱으로 저장"
            onClick={openInstallPage}
          >
            <Smartphone size={16} aria-hidden="true" />
            내 웹앱으로 저장
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

      <section className="learning-strip" aria-label="웹앱 만들기 순서">
        <div className={mode === "designer" ? "current" : ""}>
          <span>1</span>
          <p>
            <strong>예시 고르기</strong>
            <small>빈 웹앱·3일 캠프·알림장에서 시작</small>
          </p>
        </div>
        <ChevronRight size={15} aria-hidden="true" />
        <div className={mode === "designer" ? "current" : ""}>
          <span>2</span>
          <p>
            <strong>기능과 내용 바꾸기</strong>
            <small>캠프 기록·버튼·챗봇을 꾸며요</small>
          </p>
        </div>
        <ChevronRight size={15} aria-hidden="true" />
        <div className={mode === "blocks" ? "current" : ""}>
          <span>3</span>
          <p>
            <strong>움직임 확인하기</strong>
            <small>블록으로 기능의 동작을 살펴봐요</small>
          </p>
        </div>
        <button
          className="lesson-help"
          type="button"
          onClick={() =>
            notify(
              "예시를 고르고, 필요한 기능을 누른 뒤 오른쪽 속성만 바꾸면 돼요.",
            )
          }
        >
          <CircleHelp size={15} aria-hidden="true" />
          어떻게 만들어요?
        </button>
      </section>

      <nav
        className={`mobile-panel-tabs ${
          mode === "blocks" ? "blocks-tabs" : ""
        }`}
        aria-label="화면별 편집 영역 전환"
      >
        {mode === "designer" && (
          <button
            className={mobilePanel === "palette" ? "active" : ""}
            type="button"
            onClick={() => setMobilePanel("palette")}
          >
            <Plus size={15} aria-hidden="true" />
            기능
          </button>
        )}
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
            <Link
              className="worksheet-card"
              href="/worksheets"
            >
              <span>
                <Printer size={18} aria-hidden="true" />
              </span>
              <span>
                <b>웹앱 기획 활동지 작성</b>
                <small>초등·중등·고등 학년별 양식을 골라요</small>
              </span>
              <ChevronRight size={15} aria-hidden="true" />
            </Link>
            <div className="panel-title">
              <span>시작 예시</span>
              <small>만들고 싶은 웹앱을 골라요</small>
            </div>
            <div className="template-picker">
              {PROJECT_TEMPLATES.map((template) => {
                const Icon = templateIconMap[template.id];
                return (
                  <button
                    className={
                      project.template === template.id ? "selected" : ""
                    }
                    key={template.id}
                    type="button"
                    onClick={() => applyTemplate(template.id)}
                  >
                    <span>
                      <Icon size={15} aria-hidden="true" />
                    </span>
                    <span>
                      <strong>{template.name}</strong>
                      <small>{template.hint}</small>
                    </span>
                    {project.template === template.id && (
                      <Check size={13} aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="panel-title palette-title">
              <span>팔레트</span>
              <small>끌어 놓거나 눌러 기능 추가</small>
            </div>
            <div className="palette-section-heading">
              <span>웹앱 기능</span>
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
                        "application/x-webapp-component",
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
                <strong>코드 없이 내 아이디어 완성</strong>
                <p>필요한 기능을 고르고 글만 바꾸면 바로 작동해요.</p>
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
                  <small>Screen1 · 나만의 웹앱</small>
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
              onAddAction={addAction}
              onMoveAction={moveAction}
              onDeleteAction={removeAction}
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
              <small>
                {visibleFeatureCount +
                  (project.chatbotEnabled ? project.actions.length : 0)}
                개
              </small>
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
                <ComponentTreeItem
                  active={selectedTarget === "header"}
                  icon={AppWindow}
                  name="AppHeader1"
                  detail={project.appName}
                  tone="violet"
                  onClick={() => selectTarget("header")}
                />
                {project.noticeEnabled && (
                  <ComponentTreeItem
                    active={selectedTarget === "notice"}
                    icon={Info}
                    name="NoticeCard1"
                    detail={project.noticeTitle}
                    tone="yellow"
                    onClick={() => selectTarget("notice")}
                  />
                )}
                {project.checklistEnabled && (
                  <ComponentTreeItem
                    active={selectedTarget === "checklist"}
                    icon={ClipboardCheck}
                    name="Checklist1"
                    detail={`${project.checklistItems.length}개 활동`}
                    tone="mint"
                    onClick={() => selectTarget("checklist")}
                  />
                )}
                {project.journalEnabled && (
                  <ComponentTreeItem
                    active={selectedTarget === "journal"}
                    icon={NotebookPen}
                    name="MyJournal1"
                    detail={project.journalTitle}
                    tone="blue"
                    onClick={() => selectTarget("journal")}
                  />
                )}
                {project.campReportEnabled && (
                  <ComponentTreeItem
                    active={selectedTarget === "camp-report"}
                    icon={FileText}
                    name="CampReport1"
                    detail="3일 · 12차시 · 인쇄"
                    tone="blue"
                    onClick={() => selectTarget("camp-report")}
                  />
                )}
                {project.buttonEnabled && (
                  <ComponentTreeItem
                    active={selectedTarget === "button"}
                    icon={MousePointerClick}
                    name="ActionButton1"
                    detail={project.buttonLabel}
                    tone="yellow"
                    onClick={() => selectTarget("button")}
                  />
                )}
                {project.chatbotEnabled && (
                  <>
                    <ComponentTreeItem
                      active={selectedTarget === "chatbot"}
                      icon={Bot}
                      name="MyChatbot1"
                      detail={project.botName}
                      tone="violet"
                      onClick={() => selectTarget("chatbot")}
                    />
                    {project.actions.map((action, index) => (
                      <ComponentTreeItem
                        active={selectedTarget === action.id}
                        icon={MousePointerClick}
                        key={action.id}
                        name={`MyQuestion${index + 1}`}
                        detail={action.label}
                        tone="yellow"
                        nested
                        onClick={() => selectTarget(action.id)}
                      />
                    ))}
                  </>
                )}
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
                <h2 id="preview-title">내 웹앱 실행하기</h2>
                <p>활동 기록과 사진 저장, 챗봇 질문·답을 직접 시험해 보세요.</p>
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
                작동하는 기능 {visibleFeatureCount - 1}개가 들어 있어요
              </span>
              <button
                className="preview-save-app"
                type="button"
                onClick={openInstallPage}
              >
                <Smartphone size={14} aria-hidden="true" />
                내 웹앱으로 저장
              </button>
              <button type="button" onClick={shareProject}>
                <Copy size={14} aria-hidden="true" />
                이 웹앱 공유
              </button>
            </footer>
          </section>
        </div>
      )}

      {libraryOpen && (
        <SavedWebAppLibrary
          activeAppId={activeAppId}
          apps={savedApps}
          onClose={() => setLibraryOpen(false)}
          onDelete={removeSavedApp}
          onEdit={editSavedApp}
          onOpen={openSavedApp}
        />
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

type ComponentTreeItemProps = {
  active: boolean;
  icon: LucideIcon;
  name: string;
  detail: string;
  tone: "violet" | "yellow" | "mint" | "blue";
  nested?: boolean;
  onClick: () => void;
};

function ComponentTreeItem({
  active,
  icon: Icon,
  name,
  detail,
  tone,
  nested = false,
  onClick,
}: ComponentTreeItemProps) {
  return (
    <button
      className={`${active ? "selected" : ""} ${
        nested ? "nested-tree-item" : ""
      }`}
      type="button"
      onClick={onClick}
    >
      <span className="tree-line" aria-hidden="true" />
      <span className={`tree-icon ${tone}`}>
        <Icon size={13} aria-hidden="true" />
      </span>
      <span>
        <strong>{name}</strong>
        <small>{detail}</small>
      </span>
    </button>
  );
}
