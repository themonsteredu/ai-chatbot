"use client";

import {
  AlertCircle,
  ExternalLink,
  FileText,
  ListChecks,
  Loader2,
  RefreshCw,
  School,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { encodeProject, normalizeProject } from "../../lib/chatbot-studio";
import { dayKey, dayName } from "../../lib/checklist-days";
import {
  collectDays,
  readChecklistRecords,
  summarizeDay,
  type ChecklistRecord,
} from "../../lib/class-checklists";
import { buildRecordsHtml, type StudentRecord } from "./record-viewer";

type ClassSummary = {
  classCode: string;
  studentCount: number;
  appCount: number;
  recordCount: number;
  updatedAt: string;
};

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
  // 기본 PIN으로 열렸는지입니다. 학생 이름과 사진이 보이는 화면이라 알려 줍니다.
  const [defaultPin, setDefaultPin] = useState(false);
  const [records, setRecords] = useState<StudentRecord[]>([]);
  // 날짜별 할 일입니다. 학생이 활동 체크에서 보낸 것만 모입니다.
  const [checklists, setChecklists] = useState<ChecklistRecord[]>([]);
  const [day, setDay] = useState("");
  // 반 코드를 외우지 않아도 되도록, 들어오자마자 반 목록을 먼저 보여 줍니다.
  const [classes, setClasses] = useState<ClassSummary[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadClasses = useCallback(async () => {
    try {
      const response = await fetch("/api/class-webapps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "classes", teacherCode }),
      });
      const body = await response.json().catch(() => null);
      setClasses(response.ok ? (body?.classes ?? []) : []);
    } catch {
      setClasses([]);
    }
  }, [teacherCode]);

  useEffect(() => {
    // 화면이 붙은 뒤에 불러와, 그리는 도중에 상태를 바꾸지 않게 합니다.
    const timer = window.setTimeout(loadClasses, 0);
    return () => window.clearTimeout(timer);
  }, [loadClasses]);

  const load = async (event?: React.FormEvent, code?: string) => {
    event?.preventDefault();
    const target = (code ?? classCode).trim();
    if (loading || !target) return;
    if (code) setClassCode(code);

    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/class-webapps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "class",
          classCode: target,
          teacherCode,
        }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setError(body?.error ?? "목록을 가져오지 못했습니다.");
        setApps(null);
        setRecords([]);
        setChecklists([]);
        return;
      }
      setApps(body.apps ?? []);
      setDefaultPin(body.defaultPin === true);
      setChecklists([]);

      // 웹앱 목록과 별개로, 학생이 보낸 캠프 기록도 함께 가져옵니다.
      const recordsResponse = await fetch("/api/class-webapps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "records",
          classCode: target,
          teacherCode,
        }),
      });
      const recordsBody = await recordsResponse.json().catch(() => null);
      setRecords(recordsResponse.ok ? (recordsBody?.records ?? []) : []);

      // 날짜별 할 일은 기록과 종류만 다르고 같은 자리에서 옵니다.
      const dayResponse = await fetch("/api/class-webapps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "records",
          kind: "checklist",
          classCode: target,
          teacherCode,
        }),
      });
      const dayBody = await dayResponse.json().catch(() => null);
      const days = dayResponse.ok
        ? readChecklistRecords(dayBody?.records ?? [])
        : [];
      setChecklists(days);
      // 가장 최근 날짜를 먼저 보여 줍니다. 오늘 것이 있으면 오늘입니다.
      setDay(collectDays(days)[0] ?? "");
      loadClasses();
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

      {classes && classes.length > 0 && (
        <div className="class-list">
          <b>
            <School size={14} aria-hidden="true" />
            우리 반 목록 · {classes.length}개
          </b>
          <ul>
            {classes.map((entry) => (
              <li key={entry.classCode}>
                <button
                  type="button"
                  className={
                    entry.classCode === classCode.trim() ? "active" : ""
                  }
                  onClick={() => load(undefined, entry.classCode)}
                >
                  <strong>{entry.classCode}</strong>
                  <small>
                    학생 {entry.studentCount}명 · 웹앱 {entry.appCount}개
                    {entry.recordCount > 0
                      ? ` · 캠프 기록 ${entry.recordCount}명`
                      : ""}
                  </small>
                  <em>{formatWhen(entry.updatedAt)}</em>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {classes && classes.length === 0 && !apps && (
        <p className="class-roster-empty">
          아직 제출된 반이 없습니다. 학생에게 반 코드를 알려 주고 ‘반에
          제출하기’를 누르게 해 주세요.
        </p>
      )}

      {apps && defaultPin && (
        <p className="class-roster-default-pin" role="status">
          이 화면은 기본 PIN <b>3035</b>로 열립니다. 이 번호는 소스에 적혀
          있어 학생도 알아낼 수 있습니다. 학생 이름과 사진이 보이는 화면이니,
          수업 중에 아이들 앞에 띄워 두지 마세요.
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

      {apps && checklists.length > 0 && (
        <div className="class-roster-days">
          <header>
            <b>
              <ListChecks size={14} aria-hidden="true" />
              날짜별 할 일 · {checklists.length}명
            </b>
            <label>
              <span>날짜</span>
              <select value={day} onChange={(event) => setDay(event.target.value)}>
                {collectDays(checklists).map((one) => (
                  <option key={one} value={one}>
                    {one} · {dayName(one, dayKey())}
                  </option>
                ))}
              </select>
            </label>
          </header>
          <ul>
            {summarizeDay(checklists, day).map((line, index) => (
              <li key={`${line.studentName}:${line.title}:${index}`}>
                <div>
                  <b>{line.studentName}</b>
                  <small>{line.title}</small>
                  <em className={line.done === line.total ? "all-done" : ""}>
                    {line.done}/{line.total}
                  </em>
                </div>
                <ul>
                  {line.items.map((item, place) => (
                    <li
                      key={`${item.text}:${place}`}
                      className={item.done ? "done" : ""}
                    >
                      {item.text}
                      {item.own && <span>직접 적음</span>}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
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
