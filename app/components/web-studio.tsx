"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Braces,
  Check,
  Code2,
  Eye,
  PanelBottom,
  Share2,
  Sparkles,
} from "lucide-react";

import {
  createStudioElement,
  getStarterProject,
} from "@/lib/studio/project";
import type {
  ElementKind,
  ElementStyle,
  ProjectBrief,
  StudioElement,
  StudioProject,
} from "@/lib/studio/types";
import { CodeDock } from "./code-dock";
import { InspectorPanel } from "./inspector-panel";
import { LibraryPanel } from "./library-panel";
import { PreviewModal, type PreviewAction } from "./preview-modal";
import { StudioCanvas } from "./studio-canvas";

const STORAGE_KEY = "my-web-studio-project-v3";
const RECORDS_KEY = "my-web-studio-records";
const DEVICE_KEY = "my-web-device-id";

function encodeProject(project: StudioProject) {
  const bytes = new TextEncoder().encode(JSON.stringify(project));
  return btoa(String.fromCharCode(...bytes));
}

function decodeProject(value: string) {
  try {
    const bytes = Uint8Array.from(atob(value), (character) =>
      character.charCodeAt(0),
    );
    const project = JSON.parse(new TextDecoder().decode(bytes)) as StudioProject;
    if (
      typeof project?.name !== "string" ||
      !project.canvas ||
      !Array.isArray(project.elements)
    ) {
      return null;
    }
    return project;
  } catch {
    return null;
  }
}

function getDeviceId() {
  const existing = localStorage.getItem(DEVICE_KEY);
  if (existing) return existing;
  const created = crypto.randomUUID();
  localStorage.setItem(DEVICE_KEY, created);
  return created;
}

export function WebStudio() {
  const [project, setProject] = useState<StudioProject>(getStarterProject);
  const [selectedId, setSelectedId] = useState<string | null>("camp-title");
  const [zoom, setZoom] = useState(0.72);
  const [codeOpen, setCodeOpen] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState("준비됨");
  const [toast, setToast] = useState("");
  const hydrated = useRef(false);

  const selected =
    project.elements.find((item) => item.id === selectedId) ?? null;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const fromHash = window.location.hash.startsWith("#studio=")
        ? decodeProject(window.location.hash.slice("#studio=".length))
        : null;
      const fromStorage = decodeProject(localStorage.getItem(STORAGE_KEY) ?? "");
      const loaded = fromHash ?? fromStorage;
      if (loaded) {
        setProject(loaded);
        setSelectedId(loaded.elements[0]?.id ?? null);
      }
      hydrated.current = true;
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    setSaveStatus("저장 중");
    const timer = window.setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, encodeProject(project));
      setSaveStatus("자동 저장됨");
    }, 320);
    return () => window.clearTimeout(timer);
  }, [project]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const updateElement = useCallback(
    (id: string, changes: Partial<StudioElement>) => {
      setProject((current) => ({
        ...current,
        elements: current.elements.map((item) =>
          item.id === id ? { ...item, ...changes } : item,
        ),
      }));
    },
    [],
  );

  const addElement = (element: StudioElement) => {
    setProject((current) => ({
      ...current,
      elements: [...current.elements, element],
    }));
    setSelectedId(element.id);
  };

  const addFromPalette = (kind: ElementKind) => {
    const offset = project.elements.length % 7;
    addElement(createStudioElement(kind, 110 + offset * 18, 120 + offset * 18));
  };

  const removeElement = (id: string) => {
    setProject((current) => ({
      ...current,
      elements: current.elements.filter((item) => item.id !== id),
    }));
    setSelectedId((current) => (current === id ? null : current));
  };

  const moveLayer = (id: string, direction: -1 | 1) => {
    setProject((current) => {
      const elements = [...current.elements];
      const index = elements.findIndex((item) => item.id === id);
      const nextIndex = Math.max(
        0,
        Math.min(elements.length - 1, index + direction),
      );
      if (index < 0 || index === nextIndex) return current;
      const [element] = elements.splice(index, 1);
      elements.splice(nextIndex, 0, element);
      return { ...current, elements };
    });
  };

  const copyShareLink = async () => {
    const url = new URL(window.location.href);
    url.hash = `studio=${encodeProject(project)}`;
    try {
      await navigator.clipboard.writeText(url.toString());
      setToast("현재 작업이 담긴 공유 링크를 복사했어요.");
    } catch {
      window.history.replaceState(null, "", url);
      setToast("주소창의 링크를 복사해 주세요.");
    }
  };

  const handlePreviewAction = useCallback(
    async (action: PreviewAction) => {
      const studentName = action.answers.student_name?.trim();
      if (!studentName) {
        setToast("미리보기에서 기록자 이름을 먼저 입력해 주세요.");
        return;
      }

      const answers = { ...action.answers };
      delete answers.student_name;
      const record = {
        projectId: project.id,
        projectName: project.name,
        deviceId: getDeviceId(),
        studentName,
        recordType: "journal" as const,
        blockId: action.elementId,
        blockTitle: action.value || "나의 캠프 기록",
        answers,
        checkedItems: action.checkedItems,
        website: "",
      };

      const existing = JSON.parse(
        localStorage.getItem(RECORDS_KEY) ?? "[]",
      ) as unknown[];
      localStorage.setItem(
        RECORDS_KEY,
        JSON.stringify([...existing.slice(-49), { ...record, savedAt: Date.now() }]),
      );

      try {
        const response = await fetch("/api/records", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(record),
        });
        if (!response.ok) throw new Error("database unavailable");
        setToast("캠프 기록을 DB에 저장했어요.");
      } catch {
        setToast("기기에는 저장했어요. DB 키를 연결하면 함께 쌓입니다.");
      }
    },
    [project.id, project.name],
  );

  return (
    <main className="web-studio">
      <header className="studio-topbar">
        <div className="studio-brand">
          <span>
            <Sparkles aria-hidden="true" size={17} />
          </span>
          <div>
            <strong>WEB MAKER</strong>
            <small>나만의 웹 만들기</small>
          </div>
        </div>
        <div className="project-title">
          <span>PROJECT</span>
          <input
            aria-label="프로젝트 이름"
            value={project.name}
            onChange={(event) =>
              setProject((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
          />
        </div>
        <div className="studio-status">
          <i />
          {saveStatus}
        </div>
        <div className="studio-top-actions">
          <button
            className={codeOpen ? "active" : ""}
            type="button"
            onClick={() => setCodeOpen((open) => !open)}
          >
            <Code2 aria-hidden="true" size={15} />
            코드
          </button>
          <button type="button" onClick={() => setPreviewOpen(true)}>
            <Eye aria-hidden="true" size={15} />
            미리보기
          </button>
          <button className="primary" type="button" onClick={copyShareLink}>
            <Share2 aria-hidden="true" size={15} />
            공유
          </button>
        </div>
      </header>

      <div className="studio-layout">
        <LibraryPanel
          project={project}
          selectedId={selectedId}
          onAdd={addFromPalette}
          onBriefChange={(changes: Partial<ProjectBrief>) =>
            setProject((current) => ({
              ...current,
              brief: { ...current.brief, ...changes },
            }))
          }
          onMoveLayer={moveLayer}
          onSelect={setSelectedId}
          onToggleElement={updateElement}
        />

        <section className="studio-center">
          <StudioCanvas
            project={project}
            selectedId={selectedId}
            zoom={zoom}
            onAddElement={addElement}
            onRemoveElement={removeElement}
            onSelect={setSelectedId}
            onSetZoom={setZoom}
            onUpdateElement={updateElement}
          />
          {codeOpen ? (
            <CodeDock
              open={codeOpen}
              project={project}
              selected={selected}
              onClose={() => setCodeOpen(false)}
              onProjectChange={(changes) =>
                setProject((current) => ({ ...current, ...changes }))
              }
              onSelectedChange={(changes) => {
                if (selected) updateElement(selected.id, changes);
              }}
            />
          ) : (
            <button
              className="open-code-dock"
              type="button"
              onClick={() => setCodeOpen(true)}
            >
              <PanelBottom aria-hidden="true" size={14} />
              코드 열기
            </button>
          )}
        </section>

        <InspectorPanel
          project={project}
          selected={selected}
          onRemove={() => {
            if (selected) removeElement(selected.id);
          }}
          onUpdateCanvas={(changes) =>
            setProject((current) => ({
              ...current,
              canvas: { ...current.canvas, ...changes },
            }))
          }
          onUpdateElement={(changes) => {
            if (selected) updateElement(selected.id, changes);
          }}
          onUpdateStyle={(changes: Partial<ElementStyle>) => {
            if (!selected) return;
            updateElement(selected.id, {
              style: { ...selected.style, ...changes },
            });
          }}
        />
      </div>

      {toast && (
        <div className="studio-toast" role="status">
          <Check aria-hidden="true" size={15} />
          {toast}
        </div>
      )}

      <PreviewModal
        open={previewOpen}
        project={project}
        onAction={handlePreviewAction}
        onClose={() => setPreviewOpen(false)}
      />
      <span className="sr-only">
        <Braces aria-hidden="true" /> 화면 요소를 직접 배치하고 코드를 편집하는
        웹 제작기
      </span>
    </main>
  );
}
