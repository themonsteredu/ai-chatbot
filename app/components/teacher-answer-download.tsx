"use client";

import { AlertCircle, Download, KeyRound, Loader2, Printer } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; url: string };

export function TeacherAnswerDownload() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const objectUrl = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    },
    [],
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (status.kind === "loading" || !code.trim()) return;

    setStatus({ kind: "loading" });
    try {
      const response = await fetch("/api/teacher-answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setStatus({
          kind: "error",
          message: body?.error ?? "답안을 가져오지 못했습니다.",
        });
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

      setCode("");
      setStatus({ kind: "ready", url });
    } catch {
      setStatus({
        kind: "error",
        message: "연결에 실패했습니다. 인터넷 상태를 확인한 뒤 다시 시도해 주세요.",
      });
    }
  };

  return (
    <form className="teacher-gate" onSubmit={submit}>
      <label className="teacher-gate-field">
        <span>교사 코드</span>
        <span className="teacher-gate-input">
          <KeyRound size={16} aria-hidden="true" />
          <input
            type="password"
            value={code}
            autoComplete="off"
            placeholder="발급받은 코드를 입력하세요"
            onChange={(event) => {
              setCode(event.target.value);
              if (status.kind === "error") setStatus({ kind: "idle" });
            }}
          />
        </span>
      </label>

      <button
        className="teacher-gate-submit"
        type="submit"
        disabled={status.kind === "loading" || !code.trim()}
      >
        {status.kind === "loading" ? (
          <>
            <Loader2 size={16} aria-hidden="true" className="spin" />
            확인하는 중
          </>
        ) : (
          <>
            <Download size={16} aria-hidden="true" />
            예시 답안 내려받기
          </>
        )}
      </button>

      {status.kind === "error" && (
        <p className="teacher-gate-error" role="alert">
          <AlertCircle size={15} aria-hidden="true" />
          {status.message}
        </p>
      )}

      {status.kind === "ready" && (
        <p className="teacher-gate-done" role="status">
          내려받기가 시작되었습니다.
          <a href={status.url} target="_blank" rel="noreferrer">
            <Printer size={14} aria-hidden="true" />
            새 창에서 열어 인쇄하기
          </a>
        </p>
      )}
    </form>
  );
}
