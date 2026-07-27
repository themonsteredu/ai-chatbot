/**
 * 학생이 보낸 캠프 기록을 인쇄할 수 있는 문서로 만듭니다. 새 창에 띄우면
 * 선생님이 바로 인쇄하거나 PDF로 저장해 보고서 작성에 쓸 수 있습니다.
 */

type SessionRecord = {
  activity?: string;
  reflection?: string;
  photo?: string;
};

export type StudentRecord = {
  studentName: string;
  updatedAt: string;
  record: {
    studentName?: string;
    sessions?: Record<string, SessionRecord>;
    finalReflection?: string;
  };
};

const DAYS = [1, 2, 3];
const PERIODS = [1, 2, 3, 4];

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isSafePhoto(value: string | undefined): value is string {
  return typeof value === "string" && value.startsWith("data:image/");
}

function renderStudent(entry: StudentRecord) {
  const sessions = entry.record.sessions ?? {};
  const days = DAYS.map((day) => {
    const rows = PERIODS.map((period) => {
      const session = sessions[`day-${day}-period-${period}`] ?? {};
      const photo = isSafePhoto(session.photo)
        ? `<img src="${session.photo}" alt="${day}일차 ${period}차시 사진"/>`
        : "";
      return `
        <div class="session">
          <h4>${day}일차 ${period}차시</h4>
          <p><b>배운 내용과 활동</b>${escapeHtml(session.activity?.trim() || "—")}</p>
          <p><b>느낀 점</b>${escapeHtml(session.reflection?.trim() || "—")}</p>
          ${photo}
        </div>`;
    }).join("");
    return `<section class="day"><h3>${day}일차</h3><div class="sessions">${rows}</div></section>`;
  }).join("");

  return `
  <article class="student">
    <header>
      <h2>${escapeHtml(entry.studentName)}</h2>
      <span>받은 시각 · ${escapeHtml(
        new Date(entry.updatedAt).toLocaleString("ko-KR"),
      )}</span>
    </header>
    ${days}
    <section class="final">
      <h3>3일 캠프 전체 소감</h3>
      <p>${escapeHtml(entry.record.finalReflection?.trim() || "—")}</p>
    </section>
  </article>`;
}

export function buildRecordsHtml(classCode: string, entries: StudentRecord[]) {
  const body = entries.map(renderStudent).join("");
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(classCode)} 캠프 기록 모음</title>
<style>
  body { margin: 0; padding: 24px; font-family: "Apple SD Gothic Neo", "Malgun Gothic", sans-serif; color: #232a43; }
  .top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
  .top h1 { margin: 0; font-size: 22px; }
  .top button { padding: 10px 16px; border: 0; border-radius: 9px; background: #232a43; color: #fff; font-weight: 800; cursor: pointer; }
  .student { margin-bottom: 26px; padding: 18px; border: 1px solid #dfe2ee; border-radius: 12px; break-inside: avoid; }
  .student > header { display: flex; align-items: baseline; justify-content: space-between; border-bottom: 2px solid #232a43; padding-bottom: 8px; margin-bottom: 12px; }
  .student h2 { margin: 0; font-size: 18px; }
  .student header span { color: #6b7189; font-size: 12px; }
  .day h3 { margin: 14px 0 8px; font-size: 14px; color: #6956e8; }
  .sessions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .session { padding: 10px 12px; border: 1px solid #e8eaf2; border-radius: 9px; break-inside: avoid; }
  .session h4 { margin: 0 0 6px; font-size: 12px; }
  .session p { margin: 0 0 6px; font-size: 12px; line-height: 1.6; }
  .session b { display: block; color: #6b7189; font-size: 10px; }
  .session img { width: 100%; max-width: 260px; border-radius: 7px; }
  .final { margin-top: 14px; padding: 12px 14px; background: #f6f7fc; border-radius: 9px; }
  .final h3 { margin: 0 0 6px; font-size: 13px; }
  .final p { margin: 0; font-size: 12.5px; line-height: 1.7; }
  @media print {
    .top button { display: none; }
    .student { page-break-after: always; border: 0; padding: 0; }
    .student:last-child { page-break-after: auto; }
  }
  @page { size: A4; margin: 14mm; }
</style>
</head>
<body>
<div class="top">
  <h1>${escapeHtml(classCode)} · 캠프 기록 ${entries.length}명</h1>
  <button onclick="window.print()">인쇄 / PDF로 저장</button>
</div>
${body}
</body>
</html>`;
}
