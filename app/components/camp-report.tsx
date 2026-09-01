"use client";

import NextImage from "next/image";
import {
  Camera,
  Check,
  ChevronLeft,
  CloudUpload,
  FileText,
  ImagePlus,
  Loader2,
  Printer,
  Save,
  Trash2,
} from "lucide-react";
import {
  ChangeEvent,
  MouseEvent,
  useEffect,
  useState,
} from "react";
import type { ComponentNode } from "../../lib/chatbot-studio";
import type { AppRuntime } from "./runtime/use-app-runtime";
import { partStyle } from "./runtime/style";
import { compressPhoto } from "../../lib/image";
import {
  CLASS_CODE_KEY,
  DRAFT_SCOPE_ID,
  readRuntime,
  writeRuntime,
  type RuntimeScope,
} from "../../lib/runtime-store";

type SessionRecord = {
  activity: string;
  reflection: string;
  photo: string;
};

type CampReportData = {
  studentName: string;
  sessions: Record<string, SessionRecord>;
  finalReflection: string;
};

type CampReportProps = {
  /** 화면에 놓인 캠프 기록 부품입니다. 제목과 안내 문구를 여기서 읽습니다. */
  node: ComponentNode;
  runtime: AppRuntime;
  /** 이 웹앱의 기록을 저장할 자리입니다. 웹앱 아이디로 정해집니다. */
  dataScope?: RuntimeScope;
};

const DAYS = [1, 2, 3] as const;
const PERIODS = [1, 2, 3, 4] as const;

const sessionId = (day: number, period: number) => `day-${day}-period-${period}`;

function createEmptyReport(): CampReportData {
  const sessions: Record<string, SessionRecord> = {};
  DAYS.forEach((day) => {
    PERIODS.forEach((period) => {
      sessions[sessionId(day, period)] = {
        activity: "",
        reflection: "",
        photo: "",
      };
    });
  });

  return {
    studentName: "",
    sessions,
    finalReflection: "",
  };
}

function normalizeReport(value: unknown): CampReportData {
  const empty = createEmptyReport();
  if (!value || typeof value !== "object") return empty;
  const candidate = value as Partial<CampReportData>;
  const candidateSessions =
    candidate.sessions && typeof candidate.sessions === "object"
      ? candidate.sessions
      : {};

  return {
    studentName:
      typeof candidate.studentName === "string" ? candidate.studentName : "",
    finalReflection:
      typeof candidate.finalReflection === "string"
        ? candidate.finalReflection
        : "",
    sessions: Object.fromEntries(
      Object.entries(empty.sessions).map(([id, record]) => {
        const candidateRecord = candidateSessions[id];
        if (!candidateRecord || typeof candidateRecord !== "object") {
          return [id, record];
        }
        return [
          id,
          {
            activity:
              typeof candidateRecord.activity === "string"
                ? candidateRecord.activity
                : "",
            reflection:
              typeof candidateRecord.reflection === "string"
                ? candidateRecord.reflection
                : "",
            photo:
              typeof candidateRecord.photo === "string"
                ? candidateRecord.photo
                : "",
          },
        ];
      }),
    ),
  };
}

export function CampReport({
  node,
  runtime,
  dataScope,
}: CampReportProps) {
  const interactive = runtime.interactive;
  const fire = runtime.fire;
  const nodeId = node.id;
  const [reportOpen, setReportOpen] = useState(false);
  const [activeDay, setActiveDay] = useState<(typeof DAYS)[number]>(1);
  const [openSessions, setOpenSessions] = useState([sessionId(1, 1)]);
  const [report, setReport] = useState<CampReportData>(() =>
    createEmptyReport(),
  );
  const [storageReady, setStorageReady] = useState(false);
  const [storageStatus, setStorageStatus] = useState("휴대폰에 자동 저장");
  const [uploadingSession, setUploadingSession] = useState("");
  // 사진 오류는 화면 아래 작은 상태줄로는 눈에 띄지 않아, 해당 칸 바로 밑에 보여 줍니다.
  const [photoError, setPhotoError] = useState<{ id: string; message: string } | null>(null);
  // 프로젝트 이름을 키로 쓰면 이름을 바꾸는 순간 12차시 기록과 사진이 사라진
  // 것처럼 보입니다. 웹앱 아이디를 씁니다.
  const scope: RuntimeScope = dataScope ?? {
    appId: DRAFT_SCOPE_ID,
    legacyTitle: "",
  };
  const scopeId = scope.appId;
  const scopeLegacyTitle = scope.legacyTitle;
  // 반 코드는 편집 화면의 ‘반에 제출’과 같은 키를 써서 한 번만 적으면 됩니다.
  const [sendClassCode, setSendClassCode] = useState(() =>
    typeof window === "undefined"
      ? ""
      : (window.localStorage.getItem(CLASS_CODE_KEY) ?? ""),
  );
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!interactive) return;
    const timer = window.setTimeout(() => {
      try {
        const saved = readRuntime(
          window.localStorage,
          { appId: scopeId, legacyTitle: scopeLegacyTitle },
          "camp",
        );
        if (saved) setReport(normalizeReport(JSON.parse(saved)));
      } catch {
        setStorageStatus("저장된 기록을 불러오지 못했어요");
      } finally {
        setStorageReady(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [interactive, scopeId, scopeLegacyTitle]);

  useEffect(() => {
    if (!interactive || !storageReady) return;
    const timer = window.setTimeout(() => {
      const result = writeRuntime(
        window.localStorage,
        { appId: scopeId, legacyTitle: scopeLegacyTitle },
        "camp",
        JSON.stringify(report),
      );
      setStorageStatus(
        result === "saved"
          ? "휴대폰에 자동 저장됨"
          : "저장 공간이 부족해요. 사진을 줄여 주세요",
      );
      if (result === "saved") fire(nodeId, "session-saved");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fire, interactive, nodeId, report, scopeId, scopeLegacyTitle, storageReady]);

  // 차시에는 활동과 사진만 적으므로 그 둘로 완료를 판단합니다.
  const completedCount = Object.values(report.sessions).filter(
    (entry) => entry.activity.trim() || entry.photo,
  ).length;

  const dayCompletedCount = (day: number) =>
    PERIODS.filter((period) => {
      const entry = report.sessions[sessionId(day, period)];
      return entry.activity.trim() || Boolean(entry.photo);
    }).length;

  const updateSession = (id: string, patch: Partial<SessionRecord>) => {
    setReport((current) => ({
      ...current,
      sessions: {
        ...current.sessions,
        [id]: { ...current.sessions[id], ...patch },
      },
    }));
  };

  const uploadPhoto = async (
    event: ChangeEvent<HTMLInputElement>,
    id: string,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploadingSession(id);
    setPhotoError(null);
    setStorageStatus("사진을 저장하는 중");
    try {
      const photo = await compressPhoto(file);
      updateSession(id, { photo });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "사진을 올리지 못했어요.";
      setPhotoError({
        id,
        message: `${message} 다른 사진으로 다시 해 보세요.`,
      });
      setStorageStatus("사진을 올리지 못했어요");
    } finally {
      setUploadingSession("");
    }
  };

  const sendToTeacher = async () => {
    const classCode = sendClassCode.trim();
    const studentName = report.studentName.trim();
    if (!classCode || sending) return;
    if (!studentName) {
      setSendResult({ ok: false, message: "보고서 맨 위의 이름 칸을 먼저 채워 주세요." });
      return;
    }

    setSending(true);
    setSendResult(null);
    try {
      const response = await fetch("/api/class-webapps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-record",
          classCode,
          studentName,
          record: report,
        }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(json?.error ?? "보내지 못했어요.");
      }
      window.localStorage.setItem(CLASS_CODE_KEY, classCode);
      setSendResult({
        ok: true,
        message: "선생님께 보냈어요. 다시 보내면 최신 내용으로 바뀌어요.",
      });
    } catch (caught) {
      setSendResult({
        ok: false,
        message:
          caught instanceof Error ? caught.message : "보내지 못했어요.",
      });
    } finally {
      setSending(false);
    }
  };

  const openReport = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (interactive) setReportOpen(true);
  };

  return (
    <>
      <section className="webapp-card camp-report-card" style={partStyle(node.props)}>
        <div className="camp-report-heading">
          <span className="feature-card-icon blue">
            <FileText size={16} aria-hidden="true" />
          </span>
          <span>
            <small>3 DAYS · 12 CLASSES</small>
            <strong>{runtime.text(node, "title")}</strong>
            <em>활동 · 사진 · 느낀 점을 차시별로 기록해요</em>
          </span>
        </div>
        <div className="camp-day-preview" aria-label="3일 캠프 구성">
          {DAYS.map((day) => (
            <span key={day}>
              <b>{day}일차</b>
              <small>4차시</small>
            </span>
          ))}
        </div>
        <button type="button" onClick={openReport}>
          <FileText size={13} aria-hidden="true" />
          {interactive ? "캠프 기록 열기" : "12차시 기록 미리보기"}
        </button>
      </section>

      {interactive && reportOpen && (
        <section className="camp-report-sheet" aria-label="3일 캠프 활동 기록">
          <header>
            <button
              type="button"
              aria-label="웹앱으로 돌아가기"
              onClick={() => setReportOpen(false)}
            >
              <ChevronLeft size={17} aria-hidden="true" />
            </button>
            <span>
              <small>MY CAMP REPORT</small>
              <strong>{runtime.text(node, "title")}</strong>
            </span>
            <b>{completedCount}/12</b>
          </header>

          <div className="camp-report-scroll">
            <label className="student-name-field">
              <span>이름</span>
              <input
                value={report.studentName}
                placeholder="내 이름을 적어 주세요"
                onChange={(event) =>
                  setReport((current) => ({
                    ...current,
                    studentName: event.target.value,
                  }))
                }
              />
            </label>

            <nav className="camp-day-tabs" aria-label="캠프 날짜 선택">
              {DAYS.map((day) => (
                <button
                  className={activeDay === day ? "active" : ""}
                  key={day}
                  type="button"
                  onClick={() => {
                    setActiveDay(day);
                    setOpenSessions((current) => {
                      const firstSession = sessionId(day, 1);
                      return current.includes(firstSession)
                        ? current
                        : [...current, firstSession];
                    });
                  }}
                >
                  <b>{day}일차</b>
                  <span>{dayCompletedCount(day)}/4 기록</span>
                </button>
              ))}
            </nav>

            <div className="camp-session-list">
              {PERIODS.map((period) => {
                const id = sessionId(activeDay, period);
                const entry = report.sessions[id];
                const hasRecord = Boolean(entry.activity.trim() || entry.photo);

                return (
                  <details
                    className="camp-session-entry"
                    key={id}
                    open={openSessions.includes(id)}
                    onToggle={(event) => {
                      const isOpen = event.currentTarget.open;
                      setOpenSessions((current) =>
                        isOpen
                          ? current.includes(id)
                            ? current
                            : [...current, id]
                          : current.filter((session) => session !== id),
                      );
                    }}
                  >
                    <summary>
                      <span>{period}차시</span>
                      <strong>
                        {hasRecord ? (
                          <>
                            <Check size={12} aria-hidden="true" />
                            기록 중
                          </>
                        ) : (
                          "기록하기"
                        )}
                      </strong>
                    </summary>
                    <div className="camp-session-fields">
                      <label>
                        <span>배운 내용과 활동</span>
                        <textarea
                          value={entry.activity}
                          placeholder={runtime.text(node, "activityPrompt")}
                          onChange={(event) =>
                            updateSession(id, { activity: event.target.value })
                          }
                        />
                      </label>

                      <div className="camp-photo-field">
                        <span>활동 사진</span>
                        {entry.photo ? (
                          <div className="camp-photo-preview">
                            <NextImage
                              src={entry.photo}
                              alt={`${activeDay}일차 ${period}차시 활동 사진`}
                              width={640}
                              height={420}
                              unoptimized
                            />
                            <div>
                              <label>
                                <Camera size={12} aria-hidden="true" />
                                사진 바꾸기
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(event) => uploadPhoto(event, id)}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => updateSession(id, { photo: "" })}
                              >
                                <Trash2 size={12} aria-hidden="true" />
                                삭제
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="camp-photo-choices">
                            <label className="camp-photo-upload">
                              <Camera size={17} aria-hidden="true" />
                              <strong>
                                {uploadingSession === id
                                  ? "저장 중"
                                  : "카메라로 찍기"}
                              </strong>
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                disabled={uploadingSession === id}
                                onChange={(event) => uploadPhoto(event, id)}
                              />
                            </label>
                            <label className="camp-photo-upload">
                              <ImagePlus size={17} aria-hidden="true" />
                              <strong>
                                {uploadingSession === id
                                  ? "저장 중"
                                  : "앨범에서 고르기"}
                              </strong>
                              <input
                                type="file"
                                accept="image/*"
                                disabled={uploadingSession === id}
                                onChange={(event) => uploadPhoto(event, id)}
                              />
                            </label>
                            <small>사진은 이 휴대폰에만 저장돼요</small>
                          </div>
                        )}
                        {photoError?.id === id && (
                          <p className="camp-photo-error" role="alert">
                            {photoError.message}
                          </p>
                        )}
                      </div>

                    </div>
                  </details>
                );
              })}
            </div>

            {activeDay === 3 && (
              <label className="camp-final-reflection">
                <span>
                  <b>3일 캠프 전체 소감</b>
                  <small>마지막 날에 작성해요</small>
                </span>
                <textarea
                  value={report.finalReflection}
                  placeholder={runtime.text(node, "finalPrompt")}
                  onChange={(event) =>
                    setReport((current) => ({
                      ...current,
                      finalReflection: event.target.value,
                    }))
                  }
                />
              </label>
            )}
          </div>

          <div className="report-send">
            <b>선생님께 보내기</b>
            <div className="report-send-row">
              <input
                aria-label="반 코드"
                placeholder="반 코드 (예: 5학년3반)"
                value={sendClassCode}
                onChange={(event) => {
                  setSendClassCode(event.target.value);
                  setSendResult(null);
                }}
              />
              <button
                type="button"
                disabled={sending || !sendClassCode.trim()}
                onClick={sendToTeacher}
              >
                {sending ? (
                  <Loader2 size={13} aria-hidden="true" className="spin" />
                ) : (
                  <CloudUpload size={13} aria-hidden="true" />
                )}
                보내기
              </button>
            </div>
            {sendResult && (
              <p
                className={sendResult.ok ? "report-send-ok" : "report-send-error"}
                role="status"
              >
                {sendResult.message}
              </p>
            )}
          </div>

          <footer>
            <span>
              <Save size={12} aria-hidden="true" />
              {storageStatus}
            </span>
            <button
              type="button"
              onClick={() => {
                runtime.fire(node.id, "printed");
                window.print();
              }}
            >
              <Printer size={13} aria-hidden="true" />
              보고서 인쇄
            </button>
          </footer>
        </section>
      )}

      {interactive && (
        <article className="print-report" aria-label="인쇄용 캠프 활동 보고서">
          <header>
            <span>MY CAMP REPORT</span>
            <h1>{runtime.text(node, "title")}</h1>
            <p>
              이름 <b>{report.studentName || "________________"}</b>
            </p>
          </header>

          {DAYS.map((day) => (
            <section className="print-day" key={day}>
              <h2>{day}일차 활동 기록</h2>
              <div className="print-session-grid">
                {PERIODS.map((period) => {
                  const entry = report.sessions[sessionId(day, period)];
                  return (
                    <article className="print-session" key={period}>
                      <h3>{period}차시</h3>
                      <div className="print-session-body">
                        <div>
                          <h4>배운 내용과 활동</h4>
                          <p>{entry.activity || "기록하지 않았습니다."}</p>
                        </div>
                        <div className="print-photo">
                          {entry.photo ? (
                            <NextImage
                              src={entry.photo}
                              alt={`${day}일차 ${period}차시 활동 사진`}
                              width={640}
                              height={420}
                              unoptimized
                            />
                          ) : (
                            <span>활동 사진</span>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}

          <section className="print-final">
            <h2>3일 캠프를 마치며</h2>
            <p>
              {report.finalReflection ||
                "3일 동안의 전체 소감을 작성해 주세요."}
            </p>
          </section>
        </article>
      )}
    </>
  );
}
