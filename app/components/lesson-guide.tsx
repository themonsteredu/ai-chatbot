"use client";

import {
  ArrowRight,
  CircleAlert,
  ClipboardList,
  KeyRound,
  ListChecks,
  MessageCircleQuestion,
  Play,
  Printer,
  Target,
} from "lucide-react";
import { useState } from "react";
import { encodeProject } from "../../lib/chatbot-studio";
import { SAMPLES, type Sample } from "../../lib/lessons/samples";

type LessonPlan = {
  id: string;
  sampleId: string;
  band: string;
  minutes: number;
  order: number;
  title: string;
  objectives: string[];
  prepare: string[];
  flow: Array<{ phase: string; minutes: number; teacher: string; student: string }>;
  questions: string[];
  pitfalls: Array<{ symptom: string; help: string }>;
  rubric: Array<{ level: string; detail: string }>;
  worksheet: Array<{ prompt: string; hint?: string; lines: number }>;
};

/** 예시를 편집 화면에서 바로 열도록 주소를 만듭니다. */
function openHref(sample: Sample) {
  const params = new URLSearchParams({
    run: "install",
    project: encodeProject(sample.project),
  });
  return `/?${params.toString()}`;
}

export function LessonGuide() {
  const [code, setCode] = useState("");
  const [plans, setPlans] = useState<LessonPlan[] | null>(null);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const unlock = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim() || checking) return;
    setChecking(true);
    setError("");
    try {
      const response = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setError(json?.error ?? "지도안을 열지 못했습니다.");
        return;
      }
      setPlans(json.plans as LessonPlan[]);
    } catch {
      setError("연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요.");
    } finally {
      // 코드를 틀려도 다시 넣을 수 있어야 합니다.
      setChecking(false);
    }
  };

  const sampleFor = (id: string) => SAMPLES.find((sample) => sample.id === id);

  return (
    <>
      <section className="lesson-grid" aria-label="수업 예시">
        {SAMPLES.map((sample) => (
          <article className="lesson-card" key={sample.id}>
            <header>
              <span className="lesson-order">{sample.order}차시</span>
              <h2>{sample.name}</h2>
              <p>{sample.goal}</p>
            </header>

            <ul className="lesson-focus">
              {sample.focus.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <footer>
              <span className="lesson-minutes">{sample.minutes}분</span>
              <a className="lesson-open" href={openHref(sample)}>
                <Play size={14} aria-hidden="true" />
                예시 열어 보기
              </a>
            </footer>
          </article>
        ))}
      </section>

      {!plans && (
        <section className="lesson-gate">
          <div className="lesson-gate-head">
            <span>
              <KeyRound size={18} aria-hidden="true" />
            </span>
            <div>
              <h2>교사용 지도안</h2>
              <p>
                차시별 수업 흐름, 발문, 학생이 자주 막히는 곳, 평가 기준,
                인쇄용 활동지가 들어 있습니다. 코드를 넣으면 열립니다.
              </p>
            </div>
          </div>
          <form onSubmit={unlock}>
            <input
              aria-label="교사 코드"
              type="password"
              inputMode="numeric"
              placeholder="교사 코드"
              value={code}
              maxLength={40}
              onChange={(event) => setCode(event.target.value)}
            />
            <button type="submit" disabled={!code.trim() || checking}>
              {checking ? "확인 중" : "지도안 열기"}
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </form>
          {error && (
            <p className="lesson-gate-error" role="alert">
              {error}
            </p>
          )}
        </section>
      )}

      {plans &&
        plans.map((plan) => {
          const sample = sampleFor(plan.sampleId);
          return (
            <section className="lesson-plan" key={plan.id}>
              <header className="lesson-plan-head">
                <span className="lesson-band">{plan.band}</span>
                <span className="lesson-order">
                  {plan.order}차시 · {plan.minutes}분
                </span>
                <h2>{plan.title}</h2>
                {sample && (
                  <a className="lesson-open" href={openHref(sample)}>
                    <Play size={14} aria-hidden="true" />
                    예시 열기
                  </a>
                )}
                <button
                  className="lesson-print"
                  type="button"
                  onClick={() => printWorksheet(plan)}
                >
                  <Printer size={15} aria-hidden="true" />
                  활동지 인쇄
                </button>
              </header>

              <div className="lesson-plan-body">
                <div className="lesson-block">
                  <h3>
                    <Target size={15} aria-hidden="true" />
                    학습 목표
                  </h3>
                  <ul>
                    {plan.objectives.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <h3>
                    <ClipboardList size={15} aria-hidden="true" />
                    준비물
                  </h3>
                  <ul>
                    {plan.prepare.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="lesson-block wide">
                  <h3>
                    <ListChecks size={15} aria-hidden="true" />
                    수업 흐름
                  </h3>
                  <div className="lesson-flow">
                    {plan.flow.map((step) => (
                      <div className="lesson-step" key={step.phase}>
                        <b>
                          {step.phase}
                          <em>{step.minutes}분</em>
                        </b>
                        <p>
                          <span>교사</span>
                          {step.teacher}
                        </p>
                        <p>
                          <span>학생</span>
                          {step.student}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lesson-block">
                  <h3>
                    <MessageCircleQuestion size={15} aria-hidden="true" />
                    핵심 발문
                  </h3>
                  <ul>
                    {plan.questions.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="lesson-block">
                  <h3>
                    <CircleAlert size={15} aria-hidden="true" />
                    자주 막히는 곳
                  </h3>
                  <dl className="lesson-pitfalls">
                    {plan.pitfalls.map((item) => (
                      <div key={item.symptom}>
                        <dt>{item.symptom}</dt>
                        <dd>{item.help}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div className="lesson-block wide">
                  <h3>평가 기준</h3>
                  <table className="lesson-rubric">
                    <tbody>
                      {plan.rubric.map((item) => (
                        <tr key={item.level}>
                          <th scope="row">{item.level}</th>
                          <td>{item.detail}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          );
        })}
    </>
  );
}

/**
 * 활동지를 새 창에 A4로 띄웁니다. 지도안과 같은 자료라 따로 파일을 만들지 않고
 * 그 자리에서 인쇄하게 합니다.
 */
function printWorksheet(plan: LessonPlan) {
  const escape = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const items = plan.worksheet
    .map(
      (item, index) => `
    <li>
      <p class="q">${index + 1}. ${escape(item.prompt)}</p>
      ${item.hint ? `<p class="hint">${escape(item.hint)}</p>` : ""}
      <div class="lines">${'<span></span>'.repeat(item.lines)}</div>
    </li>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8"/>
<title>${escape(plan.title)} 활동지</title>
<style>
  body { margin: 0; padding: 18mm 14mm; font-family: "Apple SD Gothic Neo", "Malgun Gothic", sans-serif; color: #232a43; }
  .top { display: flex; align-items: flex-end; justify-content: space-between; border-bottom: 2px solid #232a43; padding-bottom: 10px; }
  .top h1 { margin: 0; font-size: 21px; }
  .top small { color: #6b7189; font-size: 12px; }
  .who { display: flex; gap: 18px; margin: 14px 0 20px; font-size: 12px; color: #6b7189; }
  .who b { display: inline-block; min-width: 96px; border-bottom: 1px solid #b9bfd0; }
  ol { margin: 0; padding: 0; list-style: none; }
  li { margin-bottom: 20px; break-inside: avoid; }
  .q { margin: 0 0 4px; font-size: 14px; font-weight: 700; }
  .hint { margin: 0 0 8px; color: #6b7189; font-size: 11.5px; }
  .lines span { display: block; height: 26px; border-bottom: 1px solid #ccd1e0; }
  .foot { margin-top: 22px; padding-top: 10px; border-top: 1px solid #dfe2ee; color: #6b7189; font-size: 11px; }
  button { padding: 9px 15px; border: 0; border-radius: 8px; background: #232a43; color: #fff; font-weight: 800; cursor: pointer; }
  @media print { button { display: none; } body { padding: 0; } }
  @page { size: A4; margin: 14mm; }
</style>
</head>
<body>
<div class="top">
  <div>
    <h1>${escape(plan.title)}</h1>
    <small>${escape(plan.band)} · ${plan.order}차시 활동지(${plan.minutes}분) · 나만의 웹앱 만들기</small>
  </div>
  <button onclick="window.print()">인쇄 / PDF로 저장</button>
</div>
<p class="who"><span>학년 반 번호 <b></b></span><span>이름 <b></b></span></p>
<ol>${items}</ol>
<p class="foot">활동지를 다 채운 뒤, 웹앱을 만들면서 계획과 달라진 점이 있으면 옆에 적어 두세요.</p>
</body>
</html>`;

  // noopener를 주면 브라우저가 창은 열어도 손잡이를 돌려주지 않아, 내용을 쓸 수
  // 없습니다. 우리가 만든 문서를 직접 써 넣는 창이라 빼도 됩니다.
  const win = window.open("", "_blank", "width=900,height=1000");
  if (!win) {
    window.alert("팝업이 막혀 있어요. 브라우저에서 이 사이트의 팝업을 허용해 주세요.");
    return;
  }
  win.document.write(html);
  win.document.close();
}
