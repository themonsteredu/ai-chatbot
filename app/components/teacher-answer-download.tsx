"use client";

import {
  AlertCircle,
  AlertTriangle,
  Check,
  Copy,
  Download,
  KeyRound,
  Loader2,
  LogOut,
  Printer,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Session = {
  code: string;
  role: "admin" | "instructor";
  instructorCode?: string;
  instructorCodeIsDefault?: boolean;
};

const ROLE_LABEL = {
  admin: "운영자",
  instructor: "강사",
} as const;

async function readError(response: Response) {
  const body = await response.json().catch(() => null);
  return body?.error ?? "요청을 처리하지 못했습니다.";
}

export function TeacherAnswerDownload() {
  const [code, setCode] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const objectUrl = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    },
    [],
  );

  const check = async (event: React.FormEvent) => {
    event.preventDefault();
    if (checking || !code.trim()) return;

    setChecking(true);
    setError("");
    try {
      const response = await fetch("/api/teacher-answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, action: "check" }),
      });

      if (!response.ok) {
        setError(await readError(response));
        return;
      }

      const body = await response.json();
      setSession({ code, ...body });
      setCode("");
    } catch {
      setError("연결에 실패했습니다. 인터넷 상태를 확인한 뒤 다시 시도해 주세요.");
    } finally {
      setChecking(false);
    }
  };

  const download = async () => {
    if (!session || downloading) return;

    setDownloading(true);
    setError("");
    try {
      const response = await fetch("/api/teacher-answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: session.code, action: "download" }),
      });

      if (!response.ok) {
        setError(await readError(response));
        return;
      }

      const blob = await response.blob();
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      const url = URL.createObjectURL(blob);
      objectUrl.current = url;

      const link = document.createElement("a");
      link.href = url;
      // 한글 파일명을 넣으면 크로뮴이 download 속성을 통째로 버리고 확장자 없는
      // ‘download’로 저장해 파일이 열리지 않습니다. 이름은 영문으로 둡니다.
      link.download = "teacher-answer-key.html";
      document.body.appendChild(link);
      link.click();
      link.remove();

      setDownloadUrl(url);
    } catch {
      setError("연결에 실패했습니다. 인터넷 상태를 확인한 뒤 다시 시도해 주세요.");
    } finally {
      setDownloading(false);
    }
  };

  const signOut = () => {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = null;
    setSession(null);
    setDownloadUrl("");
    setError("");
    setCopied(false);
  };

  const copyInstructorCode = async () => {
    if (!session?.instructorCode) return;
    try {
      await navigator.clipboard.writeText(session.instructorCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("복사하지 못했습니다. 코드를 직접 적어 주세요.");
    }
  };

  if (!session) {
    return (
      <form className="teacher-gate" onSubmit={check}>
        <label className="teacher-gate-field">
          <span>운영자 또는 강사 코드</span>
          <span className="teacher-gate-input">
            <KeyRound size={16} aria-hidden="true" />
            <input
              type="password"
              value={code}
              autoComplete="off"
              placeholder="발급받은 코드를 입력하세요"
              onChange={(event) => {
                setCode(event.target.value);
                if (error) setError("");
              }}
            />
          </span>
        </label>

        <button
          className="teacher-gate-submit"
          type="submit"
          disabled={checking || !code.trim()}
        >
          {checking ? (
            <>
              <Loader2 size={16} aria-hidden="true" className="spin" />
              확인하는 중
            </>
          ) : (
            <>
              <ShieldCheck size={16} aria-hidden="true" />
              확인
            </>
          )}
        </button>

        {error && (
          <p className="teacher-gate-error" role="alert">
            <AlertCircle size={15} aria-hidden="true" />
            {error}
          </p>
        )}
      </form>
    );
  }

  return (
    <div className="teacher-session">
      <div className="teacher-session-head">
        <span className={`teacher-role ${session.role}`}>
          {ROLE_LABEL[session.role]}로 확인됨
        </span>
        <button type="button" className="teacher-signout" onClick={signOut}>
          <LogOut size={14} aria-hidden="true" />
          코드 지우기
        </button>
      </div>

      <button
        className="teacher-gate-submit"
        type="button"
        onClick={download}
        disabled={downloading}
      >
        {downloading ? (
          <>
            <Loader2 size={16} aria-hidden="true" className="spin" />
            준비하는 중
          </>
        ) : (
          <>
            <Download size={16} aria-hidden="true" />
            예시 답안 내려받기
          </>
        )}
      </button>

      {downloadUrl && (
        <p className="teacher-gate-done" role="status">
          내려받기가 시작되었습니다.
          <a href={downloadUrl} target="_blank" rel="noreferrer">
            <Printer size={14} aria-hidden="true" />
            새 창에서 열어 인쇄하기
          </a>
        </p>
      )}

      {error && (
        <p className="teacher-gate-error" role="alert">
          <AlertCircle size={15} aria-hidden="true" />
          {error}
        </p>
      )}

      {session.role === "admin" && session.instructorCode && (
        <div className="teacher-code-box">
          <div className="teacher-code-row">
            <div>
              <b>강사용 코드</b>
              <small>다른 강사분께 알려 주는 코드입니다</small>
            </div>
            <code>{session.instructorCode}</code>
            <button type="button" onClick={copyInstructorCode}>
              {copied ? (
                <>
                  <Check size={14} aria-hidden="true" />
                  복사됨
                </>
              ) : (
                <>
                  <Copy size={14} aria-hidden="true" />
                  복사
                </>
              )}
            </button>
          </div>

          {session.instructorCodeIsDefault && (
            <p className="teacher-code-warning">
              <AlertTriangle size={15} aria-hidden="true" />
              지금은 기본값이라 학생도 쉽게 맞힐 수 있습니다. 배포 환경 변수
              <code>TEACHER_INSTRUCTOR_CODE</code>를 바꾸면 이 코드도 함께
              바뀝니다.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
