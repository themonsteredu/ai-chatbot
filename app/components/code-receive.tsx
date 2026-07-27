"use client";

import { AlertCircle, Loader2, Ticket } from "lucide-react";
import { useState } from "react";

/**
 * 선생님이 화면에 띄운 6자리 번호로 웹앱을 받는 칸입니다. QR이 안 찍히는
 * 휴대폰을 위한 대체 통로로, 번호가 맞으면 설치 화면으로 이동합니다.
 */
export function CodeReceive() {
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  const ready = /^\d{6}$/.test(code.trim());

  const receive = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ready || checking) return;

    setChecking(true);
    setError("");
    try {
      // 번호가 맞는지 먼저 확인해, 틀린 번호로 화면이 넘어가지 않게 합니다.
      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get", id: code.trim() }),
      });
      if (!response.ok) {
        const json = await response.json().catch(() => null);
        setError(json?.error ?? "번호를 확인하지 못했어요.");
        return;
      }
      window.location.href = `/?run=install&sid=${code.trim()}`;
    } catch {
      setError("연결에 실패했어요. 인터넷을 확인해 주세요.");
      setChecking(false);
    }
  };

  return (
    <form className="code-receive" onSubmit={receive}>
      <label>
        <span>번호로 앱 받기</span>
        <span className="code-receive-row">
          <Ticket size={15} aria-hidden="true" />
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="선생님이 알려 준 6자리"
            value={code}
            onChange={(event) => {
              setCode(event.target.value.replace(/\D/g, ""));
              if (error) setError("");
            }}
          />
          <button type="submit" disabled={!ready || checking}>
            {checking ? (
              <Loader2 size={14} aria-hidden="true" className="spin" />
            ) : (
              "받기"
            )}
          </button>
        </span>
      </label>
      {error && (
        <p className="teacher-gate-error" role="alert">
          <AlertCircle size={14} aria-hidden="true" />
          {error}
        </p>
      )}
    </form>
  );
}
