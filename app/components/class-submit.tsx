"use client";

import {
  AlertCircle,
  Check,
  CloudDownload,
  CloudUpload,
  ExternalLink,
  Loader2,
  Users,
} from "lucide-react";
import { useState } from "react";
import {
  encodeProject,
  normalizeProject,
  type WebAppProject,
} from "../../lib/chatbot-studio";
import {
  CLASS_CODE_KEY as CLASS_KEY,
  STUDENT_NAME_KEY as NAME_KEY,
} from "../../lib/runtime-store";

type ClassSubmitProps = {
  /** 아직 저장 전이면 먼저 이 기기에 저장하고 웹앱 주소를 돌려줍니다. */
  ensureAppId: () => string;
  project: WebAppProject;
  onRestore: (project: WebAppProject, appId: string) => void;
};

type MineApp = {
  appId: string;
  appName: string;
  project: unknown;
  updatedAt: string;
};

/** 갤러리 목록은 이름표만 옵니다. 내용은 누를 때 하나씩 받아 옵니다. */
type FriendApp = {
  studentName: string;
  appId: string;
  appName: string;
  updatedAt: string;
};

export function ClassSubmit({
  ensureAppId,
  project,
  onRestore,
}: ClassSubmitProps) {
  // 반 코드와 이름은 매번 적기 번거로우니 이 기기에만 기억해 둡니다.
  const [classCode, setClassCode] = useState(() =>
    typeof window === "undefined"
      ? ""
      : (window.localStorage.getItem(CLASS_KEY) ?? ""),
  );
  const [studentName, setStudentName] = useState(() =>
    typeof window === "undefined"
      ? ""
      : (window.localStorage.getItem(NAME_KEY) ?? ""),
  );
  const [busy, setBusy] = useState<"" | "save" | "load" | "friends">("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [mine, setMine] = useState<MineApp[] | null>(null);
  // 선생님이 갤러리를 열어 두었을 때만 채워집니다.
  const [friends, setFriends] = useState<FriendApp[] | null>(null);

  const ready = classCode.trim().length >= 2 && studentName.trim().length >= 1;

  const remember = () => {
    window.localStorage.setItem(CLASS_KEY, classCode.trim());
    window.localStorage.setItem(NAME_KEY, studentName.trim());
  };

  const call = async (body: Record<string, unknown>) => {
    const response = await fetch("/api/class-webapps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        classCode: classCode.trim(),
        studentName: studentName.trim(),
        ...body,
      }),
    });
    const json = await response.json().catch(() => null);
    if (!response.ok) throw new Error(json?.error ?? "요청에 실패했어요.");
    return json;
  };

  const submit = async () => {
    if (!ready || busy) return;
    setBusy("save");
    setError("");
    setMessage("");
    try {
      await call({ action: "save", appId: ensureAppId(), project });
      remember();
      setMessage("반에 제출했어요. 다른 기기에서도 불러올 수 있어요.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "제출하지 못했어요.");
    } finally {
      setBusy("");
    }
  };

  /**
   * 친구들이 반에 제출한 작품을 봅니다. 이름은 필요 없고 반 코드만 씁니다.
   * 선생님이 갤러리를 열지 않았으면 목록 대신 안내가 옵니다.
   */
  const loadFriends = async () => {
    if (classCode.trim().length < 2 || busy) return;
    setBusy("friends");
    setError("");
    setMessage("");
    try {
      const json = await call({ action: "gallery" });
      if (!json.open) {
        setFriends(null);
        setMessage(
          "아직 선생님이 반 작품 갤러리를 열지 않았어요. 선생님께 열어 달라고 해 보세요.",
        );
        return;
      }
      window.localStorage.setItem(CLASS_KEY, classCode.trim());
      setFriends(json.apps ?? []);
      if (!json.apps?.length) setMessage("아직 반에 올라온 작품이 없어요.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "불러오지 못했어요.");
    } finally {
      setBusy("");
    }
  };

  /** 친구 작품은 누를 때 그것만 받아서 새 창으로 엽니다. */
  const openFriend = async (app: FriendApp) => {
    if (busy) return;
    setBusy("friends");
    setError("");
    try {
      const json = await call({ action: "gallery-app", appId: app.appId });
      const params = new URLSearchParams({
        run: "install",
        app: app.appId,
        project: encodeProject(normalizeProject(json.app?.project)),
      });
      window.open(`/?${params.toString()}`, "_blank", "noopener");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "열지 못했어요.");
    } finally {
      setBusy("");
    }
  };

  const loadMine = async () => {
    if (!ready || busy) return;
    setBusy("load");
    setError("");
    setMessage("");
    try {
      const json = await call({ action: "mine" });
      remember();
      setMine(json.apps ?? []);
      if (!json.apps?.length) setMessage("아직 제출한 웹앱이 없어요.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "불러오지 못했어요.");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="class-submit">
      <div className="class-submit-fields">
        <label>
          <span>반 코드</span>
          <input
            type="text"
            value={classCode}
            placeholder="예: 5학년3반"
            onChange={(event) => setClassCode(event.target.value)}
          />
        </label>
        <label>
          <span>내 이름</span>
          <input
            type="text"
            value={studentName}
            placeholder="예: 김민수"
            onChange={(event) => setStudentName(event.target.value)}
          />
        </label>
      </div>

      <div className="class-submit-actions">
        <button type="button" onClick={submit} disabled={!ready || busy !== ""}>
          {busy === "save" ? (
            <Loader2 size={14} aria-hidden="true" className="spin" />
          ) : (
            <CloudUpload size={14} aria-hidden="true" />
          )}
          반에 제출하기
        </button>
        <button
          type="button"
          className="ghost"
          onClick={loadMine}
          disabled={!ready || busy !== ""}
        >
          {busy === "load" ? (
            <Loader2 size={14} aria-hidden="true" className="spin" />
          ) : (
            <CloudDownload size={14} aria-hidden="true" />
          )}
          내 것 불러오기
        </button>
        <button
          type="button"
          className="ghost"
          onClick={loadFriends}
          disabled={classCode.trim().length < 2 || busy !== ""}
        >
          {busy === "friends" ? (
            <Loader2 size={14} aria-hidden="true" className="spin" />
          ) : (
            <Users size={14} aria-hidden="true" />
          )}
          우리 반 작품 보기
        </button>
      </div>

      {message && (
        <p className="class-submit-done" role="status">
          <Check size={14} aria-hidden="true" />
          {message}
        </p>
      )}
      {error && (
        <p className="teacher-gate-error" role="alert">
          <AlertCircle size={15} aria-hidden="true" />
          {error}
        </p>
      )}

      {friends && friends.length > 0 && (
        <ul className="class-submit-list friends">
          {friends.map((app) => (
            <li key={app.appId}>
              <span>
                <b>{app.studentName}</b>
                {app.appName}
              </span>
              <button type="button" onClick={() => openFriend(app)}>
                <ExternalLink size={13} aria-hidden="true" />
                열어 보기
              </button>
            </li>
          ))}
        </ul>
      )}

      {mine && mine.length > 0 && (
        <ul className="class-submit-list">
          {mine.map((app) => (
            <li key={app.appId}>
              <span>{app.appName}</span>
              <button
                type="button"
                onClick={() =>
                  onRestore(normalizeProject(app.project), app.appId)
                }
              >
                이걸로 이어서 하기
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
