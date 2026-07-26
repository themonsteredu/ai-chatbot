import {
  normalizeProject,
  type WebAppProject,
} from "./chatbot-studio";

export const SAVED_WEBAPP_INDEX_KEY = "my-webapp-saved-index-v1";
export const SAVED_WEBAPP_PREFIX = "my-webapp-project-v1:";

export type SavedWebAppSummary = {
  id: string;
  appName: string;
  projectTitle: string;
  accent: string;
  createdAt: string;
  updatedAt: string;
};

type WebAppStorage = Pick<
  Storage,
  "getItem" | "setItem" | "removeItem"
>;

const VALID_APP_ID = /^[a-z0-9-]{8,80}$/;

export function isValidWebAppId(value: string | null | undefined) {
  return Boolean(value && VALID_APP_ID.test(value));
}

export function createWebAppId() {
  if (
    typeof globalThis.crypto !== "undefined" &&
    "randomUUID" in globalThis.crypto
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `app-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function projectKey(id: string) {
  return `${SAVED_WEBAPP_PREFIX}${id}`;
}

function parseIndex(value: string | null): SavedWebAppSummary[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item): item is SavedWebAppSummary =>
          Boolean(item) &&
          typeof item === "object" &&
          isValidWebAppId((item as SavedWebAppSummary).id) &&
          typeof (item as SavedWebAppSummary).appName === "string" &&
          typeof (item as SavedWebAppSummary).updatedAt === "string",
      )
      .slice(0, 40);
  } catch {
    return [];
  }
}

export function listSavedWebApps(storage: WebAppStorage) {
  return parseIndex(storage.getItem(SAVED_WEBAPP_INDEX_KEY)).filter((item) =>
    Boolean(storage.getItem(projectKey(item.id))),
  );
}

export function loadSavedWebApp(storage: WebAppStorage, id: string) {
  if (!isValidWebAppId(id)) return null;
  const saved = storage.getItem(projectKey(id));
  if (!saved) return null;

  try {
    return normalizeProject(JSON.parse(saved));
  } catch {
    return null;
  }
}

export function saveWebApp(
  storage: WebAppStorage,
  project: WebAppProject,
  requestedId?: string,
) {
  const id = isValidWebAppId(requestedId)
    ? requestedId!
    : createWebAppId();
  const previous = parseIndex(storage.getItem(SAVED_WEBAPP_INDEX_KEY));
  const existing = previous.find((item) => item.id === id);
  const now = new Date().toISOString();
  const summary: SavedWebAppSummary = {
    id,
    appName: project.appName.trim() || "나만의 웹앱",
    projectTitle: project.title.trim() || "웹앱 프로젝트",
    accent: /^#[0-9a-f]{6}$/i.test(project.accent)
      ? project.accent
      : "#6956e8",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  storage.setItem(projectKey(id), JSON.stringify(project));
  storage.setItem(
    SAVED_WEBAPP_INDEX_KEY,
    JSON.stringify([
      summary,
      ...previous.filter((item) => item.id !== id),
    ].slice(0, 40)),
  );

  return summary;
}

export function deleteSavedWebApp(storage: WebAppStorage, id: string) {
  if (!isValidWebAppId(id)) return;
  storage.removeItem(projectKey(id));
  const next = parseIndex(storage.getItem(SAVED_WEBAPP_INDEX_KEY)).filter(
    (item) => item.id !== id,
  );
  storage.setItem(SAVED_WEBAPP_INDEX_KEY, JSON.stringify(next));
}
