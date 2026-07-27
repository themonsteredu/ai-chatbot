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
  KeyboardEvent,
  MouseEvent,
  useEffect,
  useState,
} from "react";
import type {
  SelectedTarget,
  WebAppProject,
} from "../../lib/chatbot-studio";

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
  project: WebAppProject;
  interactive: boolean;
  selectedTarget?: SelectedTarget;
  onSelect?: (target: SelectedTarget) => void;
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

function compressPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("사진 파일만 올릴 수 있어요."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("사진을 읽지 못했어요."));
    reader.onload = () => {
      const image = new window.Image();
      image.onerror = () => reject(new Error("사진을 열지 못했어요."));
      image.onload = () => {
        const maxSide = 720;
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("사진을 줄이지 못했어요."));
          return;
        }
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.66));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function CampReport({
  project,
  interactive,
  selectedTarget,
  onSelect,
}: CampReportProps) {
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
  const storageKey = `my-webapp-camp-report-v1:${project.title}`;
  // 반 코드는 편집 화면의 ‘반에 제출’과 같은 키를 써서 한 번만 적으면 됩니다.
  const [sendClassCode, setSendClassCode] = useState(() =>
    typeof window === "undefined"
      ? ""
      : (window.localStorage.getItem("my-webapp-class-code-v1") ?? ""),
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
        const saved = window.localStorage.getItem(storageKey);
        if (saved) setReport(normalizeReport(JSON.parse(saved)));
      } catch {
        setStorageStatus("저장된 기록을 불러오지 못했어요");
      } finally {
        setStorageReady(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [interactive, storageKey]);

  useEffect(() => {
    if (!interactive || !storageReady) return;
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(report));
        setStorageStatus("휴대폰에 자동 저장됨");
      } catch {
        setStorageStatus("저장 공간이 부족해요. 사진을 줄여 주세요");
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [interactive, report, storageKey, storageReady]);

  const select = () => {
    if (!interactive) onSelect?.("camp-report");
  };

  const selectOnKeyboard = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      select();
    }
  };

  const completedCount = Object.values(report.sessions).filter(
    (entry) => entry.activity.trim() || entry.reflection.trim() || entry.photo,
  ).length;

  const dayCompletedCount = (day: number) =>
    PERIODS.filter((period) => {
      const entry = report.sessions[sessionId(day, period)];
      return (
        entry.activity.trim() || entry.reflection.trim() || Boolean(entry.photo)
      );
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
      window.localStorage.setItem("my-webapp-class-code-v1", classCode);
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
    else select();
  };

  return (
    <>
      <section
        className={`webapp-card camp-report-card ${
          selectedTarget === "camp-report" ? "component-selected" : ""
        }`}
        role={interactive ? undefined : "button"}
        tabIndex={interactive ? undefined : 0}
        onClick={select}
        onKeyDown={selectOnKeyboard}
      >
        <div className="camp-report-heading">
          <span className="feature-card-icon blue">
            <FileText size={16} aria-hidden="true" />
          </span>
          <span>
            <small>3 DAYS · 12 CLASSES</small>
            <strong>{project.campReportTitle}</strong>
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
              <strong>{project.campReportTitle}</strong>
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
                const hasRecord = Boolean(
                  entry.activity.trim() ||
                    entry.reflection.trim() ||
                    entry.photo,
                );

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
                          placeholder={project.campActivityPrompt}
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

                      <label>
                        <span>느낀 점</span>
                        <textarea
                          value={entry.reflection}
                          placeholder={project.campReflectionPrompt}
                          onChange={(event) =>
                            updateSession(id, {
                              reflection: event.target.value,
                            })
                          }
                        />
                      </label>
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
                  placeholder={project.campFinalPrompt}
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
            <button type="button" onClick={() => window.print()}>
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
            <h1>{project.campReportTitle}</h1>
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
                          <h4>느낀 점</h4>
                          <p>{entry.reflection || "기록하지 않았습니다."}</p>
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
