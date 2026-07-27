"use client";

import {
  AlertCircle,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCw,
  Users,
} from "lucide-react";
import { useState } from "react";
import { encodeProject, normalizeProject } from "../../lib/chatbot-studio";
import { buildRecordsHtml, type StudentRecord } from "./record-viewer";

type ClassApp = {
  studentName: string;
  appId: string;
  appName: string;
  project: unknown;
  updatedAt: string;
};

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

/** 학생 작품을 편집 화면에서 그대로 열 수 있는 주소를 만듭니다. */
function openHref(app: ClassApp) {
  const params = new URLSearchParams({
    run: "install",
    app: app.appId,
    project: encodeProject(normalizeProject(app.project)),
  });
  return `/?${params.toString()}`;
}

export function ClassRoster({ teacherCode }: { teacherCode: string }) {
  const [classCode, setClassCode] = useState("");
  const [apps, setApps] = useState<ClassApp[] | null>(null);
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (loading || !classCode.trim()) return;

    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/class-webapps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "class",
          classCode: classCode.trim(),
          teacherCode,
        }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setError(body?.error ?? "목록을 가져오지 못했습니다.");
        setApps(null);
        setRecords([]);
        return;
      }
      setApps(body.apps ?? []);

      // 웹앱 목록과 별개로, 학생이 보낸 캠프 기록도 함께 가져옵니다.
      const recordsResponse = await fetch("/api/class-webapps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "records",
          classCode: classCode.trim(),
          teacherCode,
        }),
      });
      const recordsBody = await recordsResponse.json().catch(() => null);
      setRecords(recordsResponse.ok ? (recordsBody?.records ?? []) : []);
    } catch {
      setError("연결에 실패했습니다. 잠시 뒤 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  const openRecords = (entries: StudentRecord[]) => {
    const view = window.open("", "_blank");
    if (!view) {
      setError("팝업이 막혀 있습니다. 이 사이트의 팝업을 허용해 주세요.");
      return;
    }
    view.document.write(buildRecordsHtml(classCode.trim(), entries));
    view.document.close();
  };

  const byStudent = new Map<string, ClassApp[]>();
  for (const app of apps ?? []) {
    const list = byStudent.get(app.studentName) ?? [];
    list.push(app);
    byStudent.set(app.studentName, list);
  }

  return (
    <div className="class-roster">
      <form className="class-roster-form" onSubmit={load}>
        <label>
          <span>반 코드</span>
          <input
            type="text"
            value={classCode}
            placeholder="예: 5학년3반"
            onChange={(event) => {
              setClassCode(event.target.value);
              if (error) setError("");
            }}
          />
        </label>
        <button type="submit" disabled={loading || !classCode.trim()}>
          {loading ? (
            <>
              <Loader2 size={15} aria-hidden="true" className="spin" />
              불러오는 중
            </>
          ) : (
            <>
              <Users size={15} aria-hidden="true" />
              제출 현황 보기
            </>
          )}
        </button>
        {apps && !loading && (
          <button
            type="button"
            className="class-roster-refresh"
            onClick={() => load()}
          >
            <RefreshCw size={14} aria-hidden="true" />
            새로 고침
          </button>
        )}
      </form>

      {error && (
        <p className="teacher-gate-error" role="alert">
          <AlertCircle size={15} aria-hidden="true" />
          {error}
        </p>
      )}

      {apps && apps.length === 0 && (
        <p className="class-roster-empty">
          이 반으로 제출된 웹앱이 아직 없습니다. 학생에게 반 코드
          <b> {classCode.trim()} </b>를 알려 주고 ‘반에 제출하기’를 누르게
          해 주세요.
        </p>
      )}

      {apps && records.length > 0 && (
        <div className="class-roster-records">
          <div>
            <b>
              <FileText size={14} aria-hidden="true" />
              캠프 기록 {records.length}명 도착
            </b>
            <small>
              {records
                .map((entry) => entry.studentName)
                .slice(0, 8)
                .join(", ")}
              {records.length > 8 ? " 외" : ""}
            </small>
          </div>
          <span>
            <button type="button" onClick={() => openRecords(records)}>
              전체 보기·인쇄
            </button>
          </span>
        </div>
      )}

      {apps && apps.length > 0 && (
        <>
          <p className="class-roster-count">
            학생 {byStudent.size}명 · 웹앱 {apps.length}개
          </p>
          <ul className="class-roster-list">
            {[...byStudent.entries()].map(([student, studentApps]) => (
              <li key={student}>
                <b>{student}</b>
                <ul>
                  {studentApps.map((app) => (
                    <li key={app.appId}>
                      <span>{app.appName}</span>
                      <small>{formatWhen(app.updatedAt)}</small>
                      <a href={openHref(app)} target="_blank" rel="noreferrer">
                        <ExternalLink size={13} aria-hidden="true" />
                        열기
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
