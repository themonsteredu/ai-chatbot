"use client";

import {
  Check,
  ChevronRight,
  CircleHelp,
  Copy,
  LayoutPanelTop,
  LibraryBig,
  Play,
  Plus,
  Printer,
  QrCode,
  Redo2,
  Rocket,
  RotateCcw,
  Settings2,
  Share2,
  Smartphone,
  Trash2,
  Sparkles,
  Undo2,
  Workflow,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import {
  DEFAULT_PROJECT,
  PROJECT_TEMPLATES,
  cloneProject,
  decodeProject,
  normalizeProject,
  type ComponentNode,
  type ComponentTypeId,
  type PropValue,
  type StudioMode,
  type TemplateId,
  type WebAppProject,
} from "../../lib/chatbot-studio";
import { REGISTRY } from "../../lib/components/registry";
import {
  type MoveStep,
  canAdd,
  canStep,
  createNode,
  holdNode,
  duplicateNode,
  findNode,
  insertNode,
  locate,
  moveNode,
  placeNear,
  screenOf,
  removeNode,
  stepNode,
  updateNode,
  walk,
} from "../../lib/project/tree";
import {
  deleteSavedWebApp,
  isValidWebAppId,
  listSavedWebApps,
  loadSavedWebApp,
  saveWebApp,
  type SavedWebAppSummary,
} from "../../lib/saved-webapps";
import { clearRuntime, DRAFT_SCOPE_ID } from "../../lib/runtime-store";
import { BlockCanvas, BlockPalette } from "./blocks/block-editor";
import { ColorField } from "./designer/color-field";
import { ComponentTree, REORDER_MIME } from "./designer/component-tree";
import { buildShareLink } from "./share-link";
import { PALETTE_MIME, PalettePanel } from "./designer/palette-panel";
import {
  targetKey,
  usePointerDrag,
  type DragPayload,
  type DropTarget,
} from "./designer/use-pointer-drag";
import { PropertyEditor } from "./designer/property-editor";
import { useProjectHistory } from "./designer/use-project-history";
import { PhonePreview } from "./phone-preview";
import { ClassSubmit } from "./class-submit";
import { CodeReceive } from "./code-receive";
import { ShareQrDialog } from "./share-qr";
import { usePhoneScale } from "./use-phone-scale";
import { SavedWebAppLibrary } from "./saved-webapp-library";
import { WebAppPlayer } from "./webapp-player";

const STORAGE_KEY = "my-webapp-inventor-project-v3";
const LEGACY_INSTALLED_PROJECT_KEY = "my-webapp-installed-project-v1";

/** 저장 공간이 차서 자동 저장이 막혔을 때 학생에게 띄우는 말입니다. */
const STORAGE_FULL_MESSAGE =
  "저장 공간이 가득 찼어요. 사진을 몇 장 지우거나 '내 웹앱'에서 안 쓰는 웹앱을 지워 주세요.";

type MobilePanel = "build" | "viewer";
type Selected = "screen" | "header" | string;

export function ChatbotStudio() {
  const history = useProjectHistory(cloneProject(DEFAULT_PROJECT));
  const project = history.project;
  // 지금 편집하고 있는 화면입니다. 실행할 때는 블록이 연 화면을 그립니다.
  const [activeScreenId, setActiveScreenId] = useState("");
  const screen = screenOf(project.screens, activeScreenId);

  const [mode, setMode] = useState<StudioMode>("designer");
  const [selected, setSelected] = useState<Selected>("screen");
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("build");
  // 블록에서 변수·조건·반복까지 보여 줄지입니다. 편집 판과 조립 판이 함께 씁니다.
  const [advancedBlocks, setAdvancedBlocks] = useState(false);
  // 수업에 쓰는 도구는 만들 때마다 필요하지 않아 접어 둡니다.
  const [classToolsOpen, setClassToolsOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [activeAppId, setActiveAppId] = useState("");
  // 빈 웹앱으로 열되, 지난번에 만들던 것이 있으면 화면에 바로 되살리지 않고
  // 여기에 들고 있다가 '이어서 만들기'로만 되돌립니다. 공용 태블릿에서 앞
  // 학생 작품이 그대로 뜨지 않게 하려는 것입니다.
  const [resumableDraft, setResumableDraft] = useState<WebAppProject | null>(
    null,
  );
  const [savedApps, setSavedApps] = useState<SavedWebAppSummary[]>([]);
  const [loadError, setLoadError] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState("");
  // 지금 무엇을 어디로 끌고 있는지입니다. 팔레트에서 온 것과 화면에 있던 것을
  // 구분해야 새로 놓을지 옮길지 정할 수 있습니다.
  const [dropTargetId, setDropTargetId] = useState("");
  const [qrShare, setQrShare] = useState<{
    appName: string;
    url: string;
    code: string;
  } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phoneStageRef = usePhoneScale();

  const selectedNode = useMemo(
    () =>
      selected === "screen" || selected === "header"
        ? null
        : findNode(screen.children, selected),
    [screen.children, selected],
  );

  const componentCount = useMemo(
    () => [...walk(screen.children)].length,
    [screen.children],
  );

  /** 웹앱 전체의 부품입니다. 이름과 아이디가 화면을 건너 겹치지 않게 씁니다. */
  const allNodes = useMemo(
    () => project.screens.flatMap((one) => one.children),
    [project.screens],
  );

  /** 웹앱 전체에 놓은 부품 수입니다. 화면이 여러 개일 수 있습니다. */
  const totalComponents = useMemo(
    () =>
      project.screens.reduce(
        (sum, one) => sum + [...walk(one.children)].length,
        0,
      ),
    [project.screens],
  );

  // 지난 작업을 되살릴 수 있고, 아직 아무것도 만들지 않았을 때만 '이어서
  // 만들기' 띠를 띄웁니다. 학생이 부품이나 블록을 하나라도 놓으면 새로
  // 만드는 것으로 보고 띠를 거두며, 그때부터 자동 저장이 다시 켜집니다.
  const showResumeBar =
    resumableDraft !== null &&
    totalComponents === 0 &&
    project.blocks.events.length === 0;

  const reset = history.reset;

  /* ---------------- 불러오기 ---------------- */

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const runMode = params.get("run");
      const requestedAppId = params.get("app");
      const editingAppId = params.get("edit");
      const shared = params.get("project");
      const sid = params.get("sid");

      const hydrate = (sharedProject: WebAppProject | null) => {
        const isStandalone =
          runMode === "1" || runMode === "install" || runMode === "saved";
        let nextAppId = isValidWebAppId(requestedAppId)
          ? requestedAppId!
          : isValidWebAppId(editingAppId)
            ? editingAppId!
            : "";
        let nextProject: WebAppProject | null = null;
        // 편집기를 그냥 열었을 때(주소에 아무 표시가 없을 때) 되살릴 수 있는
        // 지난 작업입니다. 화면은 빈 채로 열고, 이것만 따로 들고 갑니다.
        let draftToResume: WebAppProject | null = null;

        // 설치한 앱의 시작 주소(run=saved)에는 내용이 같이 실려 있습니다. 홈 화면
        // 앱은 브라우저와 저장 공간이 달라 첫 실행 때 이 값으로 채워 넣어야
        // 열립니다. 다만 이미 저장된 내용이 있으면 그쪽이 최신이므로 덮어쓰지
        // 않습니다. 사람이 직접 연 공유 링크(run=install)는 새 내용을 받는 것이
        // 목적이라 언제나 받아 씁니다.
        const seedOnly = runMode === "saved";
        const storedProject =
          sharedProject && seedOnly && nextAppId
            ? loadSavedWebApp(window.localStorage, nextAppId)
            : null;

        if (sharedProject) {
          if (storedProject) {
            nextProject = storedProject;
          } else {
            const savedApp = saveWebApp(
              window.localStorage,
              sharedProject,
              nextAppId || undefined,
            );
            nextAppId = savedApp.id;
            nextProject = sharedProject;
          }

          if (isStandalone) {
            // 주소창에 긴 내용이 남지 않도록 정리합니다.
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
          // 편집기를 그냥 열었습니다. 언제나 빈 웹앱으로 시작하고, 지난번에
          // 만들던 것이 있으면 되살리지 않고 '이어서 만들기'로만 되돌립니다.
          const saved = window.localStorage.getItem(STORAGE_KEY);
          if (saved) {
            try {
              const draft = normalizeProject(JSON.parse(saved));
              const hasContent =
                draft.screens[0].children.length > 0 ||
                draft.blocks.events.length > 0;
              if (hasContent) draftToResume = draft;
            } catch {
              // 깨진 저장분은 무시하고 빈 화면으로 엽니다.
            }
          }
        }

        if (nextProject) {
          reset(nextProject);
        } else if (isStandalone) {
          setLoadError(
            "이 기기에서 이 웹앱의 저장 내용을 찾지 못했어요. 만든 기기에서 다시 공유 링크를 열어 주세요.",
          );
        } else {
          reset(cloneProject(DEFAULT_PROJECT));
        }

        setResumableDraft(draftToResume);
        setActiveAppId(nextAppId);
        setSavedApps(listSavedWebApps(window.localStorage));
        setStandalone(isStandalone);
        setHydrated(true);
      };

      const inlineProject = shared ? decodeProject(shared) : null;
      if (inlineProject || !sid) {
        hydrate(inlineProject);
        return;
      }

      // QR·공유 링크의 짧은 코드는 서버에서 내용을 받아 옵니다.
      fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get", id: sid }),
      })
        .then(async (response) => {
          const json = await response.json().catch(() => null);
          if (!response.ok || !json?.project) return null;
          return normalizeProject(json.project);
        })
        .catch(() => null)
        .then((fetched) => hydrate(fetched));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [reset]);

  /* 되돌리기를 여러 번 눌러도 저장이 몰아치지 않도록 잠깐 모았다 씁니다. */
  useEffect(() => {
    if (!hydrated || standalone) return;
    // '이어서 만들기' 띠가 떠 있는 동안(빈 화면 + 되살릴 작업 있음)에는
    // 저장하지 않습니다. 빈 화면을 그대로 저장하면 되돌릴 내용이 지워지기
    // 때문입니다. 학생이 무언가 만들기 시작하면 띠가 사라지고 다시 저장합니다.
    if (showResumeBar) return;
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
        if (activeAppId) saveWebApp(window.localStorage, project, activeAppId);
        // 자리를 비우고 다시 저장되면 경고를 거둡니다.
        setToast((current) => (current === STORAGE_FULL_MESSAGE ? "" : current));
      } catch {
        // 저장 공간이 차면 setItem이 예외를 냅니다. 그대로 두면 타이머 안에서
        // 조용히 죽어, 학생은 저장된 줄 알고 계속 만들다가 전부 잃습니다.
        // 사진을 여러 장 넣으면 실제로 닿는 한계라 반드시 알려 줘야 합니다.
        setToast(STORAGE_FULL_MESSAGE);
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [activeAppId, hydrated, project, showResumeBar, standalone]);

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

  /* ---------------- 편집 ---------------- */

  const setChildren = (
    change: (children: ComponentNode[]) => ComponentNode[],
    label: string,
    coalesceKey?: string,
  ) => {
    history.commit(
      (current) => ({
        ...current,
        screens: current.screens.map((one) =>
          one.id === screen.id ? { ...one, children: change(one.children) } : one,
        ),
      }),
      { label, coalesceKey },
    );
  };

  const addComponent = (
    type: ComponentTypeId,
    at?: { parentId: string | null; index: number },
  ) => {
    if (!canAdd(screen.children, type)) {
      notify(`${REGISTRY[type].name}은(는) 화면에 하나만 놓을 수 있어요.`);
      return;
    }
    // 화면이 여러 개일 수 있어, 이름과 아이디는 웹앱 전체를 보고 짓습니다.
    const node = createNode(screen.children, type, allNodes);
    // 끌어 놓지 않고 팔레트를 눌렀을 때는, 지금 고른 자리를 따라 놓습니다.
    // 태블릿에는 끌어 놓기가 없어 이 길로만 배치 부품을 채웁니다.
    const place = at ?? placeNear(screen.children, selected);
    setChildren(
      (children) => insertNode(children, node, place),
      `${REGISTRY[type].name} 추가`,
    );
    setSelected(node.id);
    setMobilePanel("build");
    const parent = place.parentId
      ? findNode(screen.children, place.parentId)
      : null;
    notify(
      parent
        ? `${node.name}을(를) ${parent.name} 안에 놓았어요.`
        : `${node.name}을(를) 놓았어요.`,
    );
  };

  /**
   * 부품 목록의 위·아래·안으로·밖으로 단추입니다. 태블릿에는 끌어 놓기가 없어,
   * 이미 놓은 부품을 배치 부품에 담고 빼는 길이 이것뿐입니다.
   */
  const moveStep = (nodeId: string, step: MoveStep) => {
    const node = findNode(screen.children, nodeId);
    if (!node) return;
    setChildren(
      (children) => stepNode(children, nodeId, step),
      `${node.name} 옮기기`,
    );
  };

  /**
   * 배치 부품 안에 다른 부품을 담습니다. 상자를 고른 채로 담을 것을 고르는 쪽이
   * 옆으로 옮겨 놓고 넣는 것보다 쉬워, 담고 나서도 상자를 그대로 고른 채 둡니다.
   * 여러 개를 이어서 담을 수 있습니다.
   */
  const holdIn = (boxId: string, nodeId: string) => {
    const box = findNode(screen.children, boxId);
    const node = findNode(screen.children, nodeId);
    if (!box || !node) return;
    setChildren(
      (children) => holdNode(children, boxId, nodeId),
      `${node.name} 담기`,
    );
    notify(`${node.name}을(를) ${box.name} 안에 담았어요.`);
  };

  /* ---------------- 화면 ---------------- */

  const addScreen = () => {
    if (project.screens.length >= 10) {
      notify("화면은 10개까지 만들 수 있어요.");
      return;
    }
    const taken = new Set(project.screens.map((one) => one.id));
    let serial = project.screens.length + 1;
    while (taken.has(`s${serial}`)) serial += 1;
    const fresh = { id: `s${serial}`, name: `Screen${serial}`, children: [] };
    history.commit(
      (current) => ({ ...current, screens: [...current.screens, fresh] }),
      { label: `${fresh.name} 추가` },
    );
    setActiveScreenId(fresh.id);
    setSelected("screen");
    notify(`${fresh.name}을(를) 만들었어요.`);
  };

  const renameScreen = (screenId: string, name: string) =>
    history.commit(
      (current) => ({
        ...current,
        screens: current.screens.map((one) =>
          one.id === screenId ? { ...one, name: name.slice(0, 24) } : one,
        ),
      }),
      { label: "화면 이름 바꾸기", coalesceKey: `screen-name:${screenId}` },
    );

  const removeScreen = (screenId: string) => {
    if (project.screens.length <= 1) {
      notify("화면은 적어도 하나는 있어야 해요.");
      return;
    }
    const gone = project.screens.find((one) => one.id === screenId);
    const goneIds = new Set(
      [...walk(gone?.children ?? [])].map(({ node }) => node.id),
    );
    history.commit(
      (current) => ({
        ...current,
        screens: current.screens.filter((one) => one.id !== screenId),
        // 사라진 화면의 부품을 가리키던 블록도 함께 걷어 냅니다.
        blocks: {
          ...current.blocks,
          events: current.blocks.events.filter(
            (event) => !goneIds.has(event.componentId),
          ),
        },
      }),
      { label: `${gone?.name ?? "화면"} 삭제` },
    );
    setActiveScreenId("");
    setSelected("screen");
    notify(`${gone?.name ?? "화면"}을(를) 지웠어요. 되돌리기로 되살릴 수 있어요.`);
  };

  const changeProp = (nodeId: string, key: string, value: PropValue) => {
    setChildren(
      (children) =>
        updateNode(children, nodeId, (node) => ({
          ...node,
          props: { ...node.props, [key]: value },
        })),
      "속성 바꾸기",
      `${nodeId}:${key}`,
    );
  };

  const renameNode = (nodeId: string, name: string) => {
    setChildren(
      (children) =>
        updateNode(children, nodeId, (node) => ({ ...node, name })),
      "이름 바꾸기",
      `${nodeId}:name`,
    );
  };

  const duplicate = (nodeId: string) => {
    const node = findNode(screen.children, nodeId);
    if (!node) return;
    if (!canAdd(screen.children, node.type)) {
      notify(`${REGISTRY[node.type].name}은(는) 화면에 하나만 놓을 수 있어요.`);
      return;
    }
    let createdId = "";
    setChildren(
      (children) => {
        const result = duplicateNode(children, nodeId, allNodes);
        createdId = result.created?.id ?? "";
        return result.nodes;
      },
      `${node.name} 복제`,
    );
    if (createdId) setSelected(createdId);
    notify("똑같은 부품을 하나 더 놓았어요.");
  };

  const deleteNode = (nodeId: string) => {
    const node = findNode(screen.children, nodeId);
    if (!node) return;
    // 되돌리기가 있으니 겁주는 확인 창 대신 안내만 띄웁니다.
    history.commit(
      (current) => ({
        ...current,
        screens: current.screens.map((one) =>
          one.id === screen.id
            ? { ...one, children: removeNode(one.children, nodeId) }
            : one,
        ),
        // 사라진 부품을 가리키던 블록도 함께 걷어 냅니다.
        blocks: {
          ...current.blocks,
          events: current.blocks.events.filter(
            (event) => event.componentId !== nodeId,
          ),
        },
      }),
      { label: `${node.name} 삭제` },
    );
    setSelected("screen");
    notify(`${node.name}을(를) 지웠어요. 되돌리기로 되살릴 수 있어요.`);
  };

  /**
   * 예제를 불러오거나 빈 웹앱으로 되돌리면, 지금 편집 중이던 저장된 웹앱에서
   * 손을 뗍니다.
   *
   * 떼지 않으면 자동 저장이 `activeAppId` 자리에 새 내용을 그대로 덮어써서,
   * 보관함에 있던 원래 웹앱이 예제나 빈 화면으로 바뀝니다. 화면은 "되돌리기로
   * 되살릴 수 있어요"라고 하지만 되돌리기는 편집 중인 것만 되살리고 보관함의
   * 사본은 이미 사라진 뒤입니다. 새로 만드는 것으로 보고, 저장은 학생이
   * `내 웹앱으로 저장`을 누를 때 하도록 둡니다.
   */
  const detachFromSavedApp = () => setActiveAppId("");

  const applyTemplate = (templateId: TemplateId) => {
    const template = PROJECT_TEMPLATES.find((item) => item.id === templateId);
    if (!template || template.id === project.template) return;
    history.commit(() => cloneProject(template.project), {
      label: `${template.name} 불러오기`,
    });
    detachFromSavedApp();
    setSelected("screen");
    setMode("designer");
    notify(`${template.name} 예제를 불러왔어요. 되돌리기로 돌아갈 수 있어요.`);
  };

  const resetProject = () => {
    history.commit(() => cloneProject(DEFAULT_PROJECT), {
      label: "빈 웹앱으로 되돌리기",
    });
    detachFromSavedApp();
    setSelected("screen");
    setMode("designer");
    notify("빈 웹앱으로 돌아왔어요. 되돌리기로 되살릴 수 있어요.");
  };

  /** 빈 화면으로 열렸을 때, 지난번에 만들던 것을 다시 불러옵니다. */
  const resumeDraft = () => {
    if (!resumableDraft) return;
    reset(cloneProject(resumableDraft));
    setResumableDraft(null);
    setSelected("screen");
    setMode("designer");
    notify("지난번에 만들던 것을 다시 불러왔어요.");
  };

  /* ---------------- 끌어 놓기 ---------------- */

  const dragged = useRef("");

  const readDrop = (event: DragEvent<HTMLElement>) => {
    const type = event.dataTransfer.getData(PALETTE_MIME) as ComponentTypeId;
    const moving = event.dataTransfer.getData(REORDER_MIME);
    return { type, moving };
  };

  const dropAt = (
    event: DragEvent<HTMLElement>,
    at: { parentId: string | null; index: number },
  ) => {
    event.preventDefault();
    setDropTargetId("");
    const { type, moving } = readDrop(event);
    if (moving) {
      const node = findNode(screen.children, moving);
      if (!node) return;
      setChildren(
        (children) => moveNode(children, moving, at),
        `${node.name} 옮기기`,
      );
      return;
    }
    if (type && type in REGISTRY) addComponent(type, at);
  };

  /**
   * 손가락으로 끌어다 놓았습니다. 마우스 길(dropAt)과 같은 자리 셈을 쓰되,
   * 브라우저 끌어 놓기 사건이 없으므로 집어 든 것을 직접 받습니다.
   */
  const dropByTouch = (payload: DragPayload, target: DropTarget) => {
    if (!target) return;
    let at: { parentId: string | null; index: number } | null = null;
    if (target.kind === "before") {
      at = locate(screen.children, target.nodeId);
    } else if (target.kind === "inside") {
      const parent = findNode(screen.children, target.parentId);
      at = { parentId: target.parentId, index: parent?.children?.length ?? 0 };
    } else {
      at = { parentId: null, index: screen.children.length };
    }
    if (!at) return;

    if (payload.kind === "new") {
      addComponent(payload.type, at);
      return;
    }
    const node = findNode(screen.children, payload.nodeId);
    if (!node) return;
    setChildren(
      (children) => moveNode(children, payload.nodeId, at),
      `${node.name} 옮기기`,
    );
    setSelected(payload.nodeId);
  };

  const { drag, dragHandlers } = usePointerDrag(dropByTouch);

  const designHooks = {
    selectedId: typeof selected === "string" ? selected : "",
    onSelect: (id: string) => selectTarget(id),
    onDropBefore: (nodeId: string, event: DragEvent<HTMLElement>) => {
      const at = locate(screen.children, nodeId);
      if (at) dropAt(event, at);
    },
    onDropInside: (parentId: string, event: DragEvent<HTMLElement>) => {
      const parent = findNode(screen.children, parentId);
      dropAt(event, {
        parentId,
        index: parent?.children?.length ?? 0,
      });
    },
    onDragStartNode: (nodeId: string, event: DragEvent<HTMLElement>) => {
      dragged.current = nodeId;
      event.dataTransfer.setData(REORDER_MIME, nodeId);
      event.dataTransfer.effectAllowed = "move";
    },
    onDragEnd: () => {
      dragged.current = "";
      setDropTargetId("");
    },
    dropTargetId: drag ? targetKey(drag.target) : dropTargetId,
    onDragOverNode: (target: string, event: DragEvent<HTMLElement>) => {
      event.dataTransfer.dropEffect = event.dataTransfer.types.includes(
        REORDER_MIME,
      )
        ? "move"
        : "copy";
      setDropTargetId(target);
    },
    onDragLeaveNode: (target: string) =>
      setDropTargetId((current) => (current === target ? "" : current)),
    onTouchDragStart: (node: ComponentNode) =>
      dragHandlers({ kind: "move", nodeId: node.id, label: node.name }),
    onResize: (nodeId: string, width: string) =>
      changeProp(nodeId, "width", width),
  };

  /* ---------------- 저장·공유 ---------------- */

  const dataScope = {
    appId: activeAppId || DRAFT_SCOPE_ID,
    legacyTitle: project.title,
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

  const restoreClassWebApp = (restored: WebAppProject, restoredId: string) => {
    reset(restored);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(restored));
    const savedApp = saveWebApp(window.localStorage, restored, restoredId);
    setActiveAppId(savedApp.id);
    setSavedApps(listSavedWebApps(window.localStorage));
    notify("반에서 불러온 웹앱으로 이어서 만들어요.");
  };

  const openInstallPage = () => {
    const savedApp = saveCurrentAsWebApp();
    const url = new URL("/", window.location.origin);
    url.searchParams.set("run", "install");
    url.searchParams.set("app", savedApp.id);
    window.location.href = url.toString();
  };

  /**
   * 공유 주소를 만듭니다. 내용을 서버에 저장하고 짧은 코드만 담는 쪽을
   * 먼저 시도합니다. 링크가 짧아야 QR이 성겨져 휴대폰 카메라가 잘 읽습니다.
   * 설치 화면의 '주소 복사'도 같은 주소를 씁니다(share-link.ts).
   */
  const buildShareUrl = async () => {
    const savedApp = saveCurrentAsWebApp();
    return buildShareLink(project, savedApp.id);
  };

  const shareProject = async () => {
    try {
      const { url } = await buildShareUrl();
      try {
        await navigator.clipboard.writeText(url);
        notify("내 웹앱 공유 링크를 복사했어요.");
      } catch {
        window.prompt("아래 링크를 복사해 주세요.", url);
      }
    } catch {
      notify("공유 링크를 만들지 못했어요. 저장 공간을 확인해 주세요.");
    }
  };

  /** 휴대폰 카메라로 찍으면 설치 화면이 열리는 QR을 띄웁니다. */
  const showShareQr = async () => {
    setQrShare({ appName: project.appName, url: "", code: "" });
    try {
      const { url, code } = await buildShareUrl();
      setQrShare({ appName: project.appName, url, code });
    } catch {
      setQrShare(null);
      notify("QR을 만들지 못했어요. 저장 공간을 확인해 주세요.");
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
    // 설계만 지우고 기록을 남겨 두면, 사진 수 MB가 보이지 않는 채로 저장 공간을
    // 차지하다가 다음 웹앱에 딸려 들어갑니다.
    clearRuntime(window.localStorage, app.id);
    setSavedApps(listSavedWebApps(window.localStorage));
    if (app.id === activeAppId) {
      setActiveAppId("");
      window.history.replaceState(null, "", "/");
    }
    notify("웹앱을 보관함에서 삭제했어요.");
  };

  const selectTarget = (target: Selected) => {
    setSelected(target);
    if (window.innerWidth <= 960) setMobilePanel("build");
  };

  /* ---------------- 속성 판 ---------------- */

  const renderProperties = () => {
    if (selectedNode) {
      return (
        <PropertyEditor
          node={selectedNode}
          value={(key) =>
            selectedNode.props[key] ??
            REGISTRY[selectedNode.type].props.find((prop) => prop.key === key)
              ?.default ??
            ""
          }
          onChange={(key, value) => changeProp(selectedNode.id, key, value)}
          onRename={(name) => renameNode(selectedNode.id, name)}
          onDuplicate={() => duplicate(selectedNode.id)}
          onDelete={() => deleteNode(selectedNode.id)}
        />
      );
    }

    if (selected === "header") {
      return (
        <div className="property-form">
          <div className="selected-component-heading">
            <span className="component-symbol violet">
              <Rocket size={16} aria-hidden="true" />
            </span>
            <div>
              <strong>앱 머리글</strong>
              <small>AppHeader1</small>
            </div>
          </div>
          <label>
            <span>웹앱 이름</span>
            <input
              value={project.appName}
              maxLength={26}
              onChange={(event) =>
                history.commit(
                  (current) => ({ ...current, appName: event.target.value }),
                  { label: "웹앱 이름", coalesceKey: "app:name" },
                )
              }
            />
          </label>
          <label>
            <span>한 줄 소개</span>
            <input
              value={project.subtitle}
              maxLength={42}
              onChange={(event) =>
                history.commit(
                  (current) => ({ ...current, subtitle: event.target.value }),
                  { label: "한 줄 소개", coalesceKey: "app:subtitle" },
                )
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
            <strong>{screen.name}</strong>
            <small>웹앱 전체 화면</small>
          </div>
        </div>
        <label>
          <span>프로젝트 이름</span>
          <input
            value={project.title}
            maxLength={32}
            onChange={(event) =>
              history.commit(
                (current) => ({ ...current, title: event.target.value }),
                { label: "프로젝트 이름", coalesceKey: "app:title" },
              )
            }
          />
        </label>
        <ColorField
          label="대표 색"
          value={project.accent}
          onChange={(accent) =>
            history.commit((current) => ({ ...current, accent }), {
              label: "대표 색",
            })
          }
        />
        <ColorField
          label="웹앱 화면 배경"
          value={project.screenBackground}
          onChange={(screenBackground) =>
            history.commit((current) => ({ ...current, screenBackground }), {
              label: "화면 배경",
            })
          }
        />
      </div>
    );
  };

  /* ---------------- 화면 ---------------- */

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
        dataScope={dataScope}
      />
    );
  }

  return (
    <main className="studio-shell">
      {drag && (
        <span
          className="drag-ghost"
          style={{ left: drag.x, top: drag.y }}
          aria-hidden="true"
        >
          {drag.payload.label}
        </span>
      )}
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
            <span>{componentCount}</span>
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
            <span>{project.blocks.events.length}</span>
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
            aria-label="되돌리기"
            title={
              history.canUndo ? `되돌리기: ${history.undoLabel}` : "되돌리기"
            }
            disabled={!history.canUndo}
            onClick={history.undo}
          >
            <Undo2 size={17} aria-hidden="true" />
          </button>
          <button
            className="icon-action"
            type="button"
            aria-label="다시 하기"
            title={
              history.canRedo ? `다시 하기: ${history.redoLabel}` : "다시 하기"
            }
            disabled={!history.canRedo}
            onClick={history.redo}
          >
            <Redo2 size={17} aria-hidden="true" />
          </button>
          <button
            className="icon-action"
            type="button"
            aria-label="빈 웹앱으로 되돌리기"
            title="빈 웹앱으로 되돌리기"
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
            className="header-button"
            type="button"
            aria-label="휴대폰으로 설치하는 QR 보기"
            title="휴대폰 설치 QR"
            onClick={showShareQr}
          >
            <QrCode size={16} aria-hidden="true" />
            QR
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

      {showResumeBar && (
        <div className="resume-draft-bar" role="status">
          <span>
            <RotateCcw size={16} aria-hidden="true" />
            지난번에 만들던 것이 있어요. 새로 시작하려면 그냥 만들면 돼요.
          </span>
          <span className="resume-draft-actions">
            <button type="button" onClick={resumeDraft}>
              이어서 만들기
            </button>
            <button
              type="button"
              className="resume-draft-dismiss"
              aria-label="이 안내 닫기"
              onClick={() => setResumableDraft(null)}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </span>
        </div>
      )}

      <section className="learning-strip" aria-label="웹앱 만들기 순서">
        <div className={mode === "designer" ? "current" : ""}>
          <span>1</span>
          <p>
            <strong>부품 놓기</strong>
            <small>팔레트에서 끌어다 화면에 놓아요</small>
          </p>
        </div>
        <ChevronRight size={15} aria-hidden="true" />
        <div className={mode === "designer" ? "current" : ""}>
          <span>2</span>
          <p>
            <strong>속성 바꾸기</strong>
            <small>글·색·크기를 내 마음대로</small>
          </p>
        </div>
        <ChevronRight size={15} aria-hidden="true" />
        <div className={mode === "blocks" ? "current" : ""}>
          <span>3</span>
          <p>
            <strong>블록으로 움직이기</strong>
            <small>언제 무엇을 할지 직접 만들어요</small>
          </p>
        </div>
        <button
          className="lesson-help"
          type="button"
          onClick={() =>
            notify(
              "부품을 놓고 속성을 바꾼 뒤, 블록 화면에서 ‘언제 무엇을 할지’를 만들어 보세요.",
            )
          }
        >
          <CircleHelp size={15} aria-hidden="true" />
          어떻게 만들어요?
        </button>
      </section>

      <nav className="mobile-panel-tabs" aria-label="편집 영역 전환">
        <button
          className={mobilePanel === "build" ? "active" : ""}
          type="button"
          onClick={() => setMobilePanel("build")}
        >
          <Settings2 size={15} aria-hidden="true" />
          만들기
        </button>
        <button
          className={mobilePanel === "viewer" ? "active" : ""}
          type="button"
          onClick={() => setMobilePanel("viewer")}
        >
          <Smartphone size={15} aria-hidden="true" />
          {mode === "designer" ? "화면" : "블록"}
        </button>
      </nav>

      <div className={`studio-layout ${mode === "blocks" ? "blocks-mode" : ""}`}>
        {/*
          부품을 고르는 곳과 그 부품을 고치는 곳이 화면 양 끝에 떨어져 있으면,
          하나 누를 때마다 시선과 손이 화면을 가로질러야 합니다. 만드는 일은 전부
          이 왼쪽 판에 모으고, 오른쪽은 결과만 보여 줍니다.
        */}
        <aside
          className={`build-panel ${
            mobilePanel === "build" ? "mobile-active" : ""
          }`}
        >
          {mode === "designer" ? (
            <section className="build-section palette-section">
              <PalettePanel
                nodes={screen.children}
                onAdd={(type) => addComponent(type)}
                onTouchDragStart={(type, name) =>
                  dragHandlers({ kind: "new", type, label: name })
                }
              />
            </section>
          ) : (
            <section className="build-section palette-section">
              <BlockPalette
                project={project}
                advanced={advancedBlocks}
                onAdvancedChange={setAdvancedBlocks}
                onChange={(blocks) =>
                  history.commit((current) => ({ ...current, blocks }), {
                    label: "블록 고치기",
                  })
                }
              />
            </section>
          )}

          <section className="build-section components-panel">
            <div className="panel-title horizontal">
              <span>화면</span>
              <small>{project.screens.length}개</small>
            </div>
            <div className="screen-tabs">
              {project.screens.map((one) => (
                <button
                  className={one.id === screen.id ? "active" : ""}
                  key={one.id}
                  type="button"
                  onClick={() => {
                    setActiveScreenId(one.id);
                    setSelected("screen");
                  }}
                >
                  <Smartphone size={13} aria-hidden="true" />
                  {one.name}
                </button>
              ))}
              <button
                className="add-screen"
                type="button"
                title="화면 추가"
                aria-label="화면 추가"
                onClick={addScreen}
              >
                <Plus size={14} aria-hidden="true" />
              </button>
            </div>
            {project.screens.length > 1 && (
              <div className="screen-name-row">
                <input
                  aria-label="화면 이름"
                  value={screen.name}
                  maxLength={24}
                  onChange={(event) => renameScreen(screen.id, event.target.value)}
                />
                <button
                  type="button"
                  aria-label={`${screen.name} 삭제`}
                  title="이 화면 삭제"
                  onClick={() => removeScreen(screen.id)}
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </div>
            )}

            <div className="panel-title horizontal">
              <span>내가 놓은 부품</span>
              <small>{componentCount}개</small>
            </div>
            <ComponentTree
              project={project}
              screenId={screen.id}
              selected={selected}
              {...designHooks}
              onSelect={selectTarget}
              onMove={moveStep}
              canMove={(nodeId, step) => canStep(screen.children, nodeId, step)}
              onHold={holdIn}
            />
          </section>

          <section className="build-section properties-panel">
            <div className="panel-title horizontal">
              <span>속성</span>
              <Settings2 size={14} aria-hidden="true" />
            </div>
            {renderProperties()}
          </section>

          {/* 수업에 쓰는 도구는 만드는 내내 필요하지는 않아 접어 둡니다. */}
          <section className="build-section class-tools">
            <button
              className={`build-section-heading ${classToolsOpen ? "open" : ""}`}
              type="button"
              aria-expanded={classToolsOpen}
              onClick={() => setClassToolsOpen((open) => !open)}
            >
              <span>수업 도구</span>
              <small>예시 · 제출 · 활동지</small>
            </button>
            {classToolsOpen && (
              <div className="build-section-body">
                <div className="panel-title">
                  <span>시작 예시</span>
                  <small>만들고 싶은 웹앱을 골라요</small>
                </div>
                <div className="template-picker">
                  {PROJECT_TEMPLATES.map((template) => (
                    <button
                      className={
                        project.template === template.id ? "selected" : ""
                      }
                      key={template.id}
                      type="button"
                      onClick={() => applyTemplate(template.id)}
                    >
                      <span>
                        <Sparkles size={15} aria-hidden="true" />
                      </span>
                      <span>
                        <strong>{template.name}</strong>
                        <small>{template.hint}</small>
                      </span>
                      {project.template === template.id && (
                        <Check size={13} aria-hidden="true" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="panel-title">
                  <span>반에 제출</span>
                  <small>선생님이 볼 수 있게 올려요</small>
                </div>
                <ClassSubmit
                  ensureAppId={() => saveCurrentAsWebApp().id}
                  project={project}
                  onRestore={restoreClassWebApp}
                />
                <CodeReceive />
                <Link className="worksheet-card" href="/lessons">
                  <span>
                    <Sparkles size={18} aria-hidden="true" />
                  </span>
                  <span>
                    <b>수업 예시 3가지 보기</b>
                    <small>차시별 예시 웹앱과 지도안·활동지</small>
                  </span>
                  <ChevronRight size={15} aria-hidden="true" />
                </Link>
                <Link className="worksheet-card" href="/worksheets">
                  <span>
                    <Printer size={18} aria-hidden="true" />
                  </span>
                  <span>
                    <b>웹앱 기획 활동지 작성</b>
                    <small>초등·중등·고등 학년별 양식을 골라요</small>
                  </span>
                  <ChevronRight size={15} aria-hidden="true" />
                </Link>
              </div>
            )}
          </section>
        </aside>

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
                  <small>
                    {screen.name} · {project.title}
                  </small>
                </div>
                <span className="viewer-tip">
                  화면의 부품을 누르면 왼쪽에서 속성을 바꿀 수 있어요
                </span>
              </header>
              <div
                className="phone-stage"
                ref={phoneStageRef}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "copy";
                }}
                onDrop={(event) =>
                  dropAt(event, {
                    parentId: null,
                    index: screen.children.length,
                  })
                }
              >
                <div className="stage-grid" aria-hidden="true" />
                <div className="screen-label">
                  <Smartphone size={13} aria-hidden="true" />
                  {screen.name}
                </div>
                <PhonePreview
                  project={project}
                  screenId={screen.id}
                  design={designHooks}
                  chromeSelection={
                    selected === "screen" || selected === "header"
                      ? selected
                      : ""
                  }
                  onSelectChrome={selectTarget}
                  onDropAtEnd={(event) =>
                    dropAt(event, {
                      parentId: null,
                      index: screen.children.length,
                    })
                  }
                />
                <p className="drop-hint">
                  <Plus size={14} aria-hidden="true" />
                  왼쪽 부품을 원하는 자리에 끌어 놓으세요
                </p>
              </div>
            </>
          ) : (
            <BlockCanvas
              project={project}
              advanced={advancedBlocks}
              onChange={(blocks) =>
                history.commit((current) => ({ ...current, blocks }), {
                  label: "블록 고치기",
                })
              }
              onSelectComponent={(id) => {
                setMode("designer");
                selectTarget(id);
              }}
            />
          )}
        </section>
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
                <p>블록이 실제로 움직이는지 여기서 바로 시험해 보세요.</p>
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
              <PhonePreview project={project} interactive dataScope={dataScope} />
            </div>
            <footer>
              <span>
                <Check size={14} aria-hidden="true" />
                부품 {totalComponents}개 · 블록 {project.blocks.events.length}개
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

      {qrShare && (
        <ShareQrDialog
          appName={qrShare.appName}
          url={qrShare.url}
          code={qrShare.code}
          onClose={() => setQrShare(null)}
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
