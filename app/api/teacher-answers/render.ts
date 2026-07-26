import {
  ANSWER_KEY_INTRO,
  ANSWER_KEY_TITLE,
  ANSWER_LEVELS,
  type AnswerBlock,
  type AnswerLevel,
} from "./answer-key";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderBlock(block: AnswerBlock) {
  const label = `<p class="block-label">${escapeHtml(block.label)}</p>`;

  if (block.kind === "text") {
    return `${label}<p class="sample">${escapeHtml(block.sample)}</p>`;
  }

  if (block.kind === "list") {
    const items = block.sample
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join("");
    return `${label}<ul class="sample-list">${items}</ul>`;
  }

  const head = block.head
    .map((cell) => `<th>${escapeHtml(cell)}</th>`)
    .join("");
  const rows = block.rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`,
    )
    .join("");
  return `${label}<table class="sample-table"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
}

function renderLevel(level: AnswerLevel) {
  const sheets = level.sheets
    .map((sheet) => {
      const activities = sheet.activities
        .map((activity) => {
          const blocks = activity.blocks.map(renderBlock).join("");
          const guide = activity.guide
            .map((line) => `<li>${escapeHtml(line)}</li>`)
            .join("");
          return `
      <section class="activity">
        <h4><span>${escapeHtml(activity.name)}</span>${escapeHtml(activity.title)}</h4>
        ${blocks}
        <div class="guide">
          <b>지도 포인트</b>
          <ul>${guide}</ul>
        </div>
      </section>`;
        })
        .join("");

      return `
    <article class="sheet">
      <h3><span class="sheet-order">활동지 ${escapeHtml(sheet.order)}</span>${escapeHtml(sheet.title)}</h3>
      <p class="goal"><b>학습 목표</b>${escapeHtml(sheet.goal)}</p>
      ${activities}
    </article>`;
    })
    .join("");

  const rubric = level.rubric
    .map(
      (row) =>
        `<tr><th scope="row">${escapeHtml(row.criterion)}</th><td>${escapeHtml(row.high)}</td><td>${escapeHtml(row.mid)}</td><td>${escapeHtml(row.low)}</td></tr>`,
    )
    .join("");

  return `
  <section class="level ${level.tone}">
    <header class="level-head">
      <span class="level-tag">${escapeHtml(level.level)}</span>
      <h2>${escapeHtml(level.level)} 예시 답안</h2>
      <p class="level-example">기준 예시 앱 · ${escapeHtml(level.example)}</p>
      <p class="level-note">${escapeHtml(level.note)}</p>
    </header>
    ${sheets}
    <article class="sheet rubric-sheet">
      <h3><span class="sheet-order">평가 기준표</span>${escapeHtml(level.level)}</h3>
      <table class="rubric">
        <thead>
          <tr><th>평가 항목</th><th>상</th><th>중</th><th>하</th></tr>
        </thead>
        <tbody>${rubric}</tbody>
      </table>
    </article>
  </section>`;
}

export function renderAnswerKeyHtml(generatedAt: string) {
  const intro = ANSWER_KEY_INTRO.map(
    (line) => `<li>${escapeHtml(line)}</li>`,
  ).join("");
  const levels = ANSWER_LEVELS.map(renderLevel).join("");

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeHtml(ANSWER_KEY_TITLE)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 28px 20px 60px;
    background: #f4f5f9;
    color: #232a43;
    font-family: "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", system-ui, sans-serif;
    line-height: 1.65;
  }
  .shell { width: min(940px, 100%); margin: 0 auto; }
  .doc-head {
    padding: 26px 26px 22px;
    border-top: 6px solid #6956e8;
    border-radius: 16px;
    background: #fff;
  }
  .doc-head .kicker {
    color: #6956e8; font-size: 12px; font-weight: 900; letter-spacing: .14em;
  }
  .doc-head h1 { margin: 8px 0 6px; font-size: 30px; letter-spacing: -.04em; }
  .doc-head .meta { margin: 0; color: #6b7189; font-size: 13px; }
  .teacher-only {
    display: inline-block; margin-top: 14px; padding: 6px 12px;
    border-radius: 999px; background: #ffe8ef; color: #c2185b;
    font-size: 12px; font-weight: 800;
  }
  .intro { margin: 16px 0 0; padding-left: 18px; color: #4a5169; font-size: 14px; }
  .intro li { margin-bottom: 6px; }
  .print-bar { margin: 18px 0 26px; }
  .print-bar button {
    padding: 11px 18px; border: 0; border-radius: 11px;
    background: #232a43; color: #fff; font-size: 14px; font-weight: 800; cursor: pointer;
  }
  .level { margin-bottom: 34px; }
  .level-head {
    padding: 20px 22px; border-radius: 14px; background: #fff;
    border-left: 6px solid var(--tone, #6956e8);
  }
  .level.elementary { --tone: #e6ad18; }
  .level.middle { --tone: #6956e8; }
  .level.high { --tone: #1f9d76; }
  .level-tag {
    display: inline-block; padding: 4px 10px; border-radius: 999px;
    background: var(--tone); color: #fff; font-size: 12px; font-weight: 800;
  }
  .level-head h2 { margin: 10px 0 4px; font-size: 22px; }
  .level-example { margin: 0 0 8px; color: var(--tone); font-size: 13px; font-weight: 800; }
  .level-note { margin: 0; color: #4a5169; font-size: 13px; }
  .sheet {
    margin-top: 14px; padding: 20px 22px; border: 1px solid #e2e4ef;
    border-radius: 14px; background: #fff;
  }
  .sheet h3 { margin: 0 0 10px; font-size: 18px; }
  .sheet-order {
    display: inline-block; margin-right: 9px; padding: 3px 9px;
    border-radius: 7px; background: #eff0f7; color: #4a5169;
    font-size: 12px; font-weight: 800; vertical-align: middle;
  }
  .goal { margin: 0 0 14px; padding: 10px 13px; border-radius: 9px;
    background: #f7f8fc; color: #4a5169; font-size: 13px; }
  .goal b { margin-right: 8px; color: #232a43; }
  .activity { margin-top: 16px; padding-top: 14px; border-top: 1px dashed #dfe2ee; }
  .activity h4 { margin: 0 0 9px; font-size: 15px; }
  .activity h4 span {
    display: inline-block; margin-right: 8px; padding: 2px 8px;
    border-radius: 6px; background: #232a43; color: #fff; font-size: 11px;
  }
  .block-label { margin: 12px 0 5px; color: #6b7189; font-size: 12px; font-weight: 800; }
  .sample {
    margin: 0; padding: 11px 13px; border-left: 3px solid #b8c0f0;
    border-radius: 0 8px 8px 0; background: #f7f8fc; font-size: 14px;
  }
  .sample-list { margin: 0; padding-left: 20px; font-size: 14px; }
  .sample-table, .rubric { width: 100%; border-collapse: collapse; font-size: 13px; }
  .sample-table th, .sample-table td, .rubric th, .rubric td {
    padding: 8px 10px; border: 1px solid #e2e4ef; text-align: left; vertical-align: top;
  }
  .sample-table thead th, .rubric thead th { background: #f2f3f9; font-size: 12px; }
  .rubric th[scope="row"] { background: #f7f8fc; width: 18%; }
  .guide {
    margin-top: 12px; padding: 11px 14px; border-radius: 9px;
    background: #fff8e6; border: 1px solid #f4e2b0;
  }
  .guide b { display: block; margin-bottom: 5px; color: #8a6100; font-size: 12px; }
  .guide ul { margin: 0; padding-left: 18px; font-size: 13px; color: #4a4433; }
  .guide li { margin-bottom: 4px; }

  @media print {
    body { padding: 0; background: #fff; }
    .print-bar { display: none; }
    .level { break-before: page; }
    .level:first-of-type { break-before: auto; }
    .sheet, .activity { break-inside: avoid; }
    .doc-head, .level-head, .sheet { border-radius: 0; }
  }
  @page { size: A4; margin: 14mm; }
</style>
</head>
<body>
<div class="shell">
  <header class="doc-head">
    <span class="kicker">TEACHER ANSWER KEY</span>
    <h1>${escapeHtml(ANSWER_KEY_TITLE)}</h1>
    <p class="meta">나만의 웹앱 만들기 · AI·SW 프로젝트 수업 · 내려받은 날짜 ${escapeHtml(generatedAt)}</p>
    <span class="teacher-only">교사용 자료 · 학생 배부 금지</span>
    <ul class="intro">${intro}</ul>
  </header>
  <div class="print-bar">
    <button type="button" onclick="window.print()">인쇄하기 / PDF로 저장</button>
  </div>
  ${levels}
</div>
</body>
</html>
`;
}
