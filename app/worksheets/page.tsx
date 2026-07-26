import {
  ArrowLeft,
  ChevronRight,
  Download,
  FileText,
  Lock,
  Printer,
} from "lucide-react";
import Link from "next/link";

const worksheets = [
  {
    level: "초등학생용",
    tone: "elementary",
    summary: "그림·체크·짧은 문장으로 아이디어를 표현하는 활동지",
    points: ["생활 속 아이디어 찾기", "첫 화면 그리기", "친구와 함께 기능 확인"],
    href: "/webapp-planning-worksheet-elementary.pdf",
  },
  {
    level: "중학생용",
    tone: "middle",
    summary: "사용자 문제와 화면·기능의 작동 과정을 설계하는 활동지",
    points: ["사용자와 문제 정하기", "기능 동작 설계", "챗봇·저장 내용 점검"],
    href: "/webapp-planning-worksheet-middle.pdf",
  },
  {
    level: "고등학생용",
    tone: "high",
    summary: "문제의 근거부터 프로토타입 검증까지 기록하는 활동지",
    points: ["문제 정의와 사용자 분석", "기능 명세와 데이터 설계", "테스트 결과와 개선 결정"],
    href: "/webapp-planning-worksheet-high.pdf",
  },
] as const;

export default function WorksheetsPage() {
  return (
    <main className="worksheets-page">
      <div className="worksheets-shell">
        <Link className="worksheets-back" href="/">
          <ArrowLeft size={16} aria-hidden="true" />
          웹앱 만들기로 돌아가기
        </Link>

        <header className="worksheets-heading">
          <span className="worksheets-kicker">PRINTABLE WORKSHEETS</span>
          <h1>웹앱 기획 활동지</h1>
          <p>
            학생의 학년군에 맞는 양식을 선택해 열고, 브라우저의 인쇄 기능으로
            출력하세요.
          </p>
        </header>

        <section className="worksheet-level-grid" aria-label="학년군별 활동지">
          {worksheets.map((worksheet) => (
            <article
              className={`worksheet-level-card ${worksheet.tone}`}
              key={worksheet.level}
            >
              <div className="worksheet-level-top">
                <span className="worksheet-level-icon">
                  <FileText size={20} aria-hidden="true" />
                </span>
                <span className="worksheet-level-tag">{worksheet.level}</span>
              </div>
              <h2>{worksheet.level}</h2>
              <p>{worksheet.summary}</p>
              <ul>
                {worksheet.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <a
                className="worksheet-open-button"
                href={worksheet.href}
                target="_blank"
                rel="noreferrer"
              >
                <Printer size={16} aria-hidden="true" />
                열어서 인쇄하기
                <Download size={15} aria-hidden="true" />
              </a>
            </article>
          ))}
        </section>

        <aside className="worksheet-print-guide">
          <Printer size={19} aria-hidden="true" />
          <div>
            <b>인쇄 권장 설정</b>
            <span>A4 · 세로 · 실제 크기 또는 100% · 양면 인쇄 가능</span>
          </div>
        </aside>

        <Link className="worksheet-teacher-link" href="/settings">
          <Lock size={20} aria-hidden="true" />
          <span>
            <b>교사용 설정</b>
            <small>
              예시 답안과 평가 기준표는 운영자·강사 코드를 입력해야 내려받을 수
              있어요
            </small>
          </span>
          <ChevronRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </main>
  );
}
