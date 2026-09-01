import {
  ArrowLeft,
  ChevronRight,
  Download,
  FileText,
  Lock,
  Presentation,
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

/**
 * 초등 수업용 자료 묶음입니다. 수업 PPT는 선생님을 따라 만드는 1부와
 * 스스로 바꿔 보는 2부로 되어 있고, 활동지는 A4 두 쪽입니다.
 */
const lessonPacks = [
  {
    order: "1차시",
    title: "나를 소개하는 카드",
    band: "초등 3~4학년",
    summary: "사진과 글자로 내 소개 카드를 만들고, 버튼에 블록을 하나 붙여요.",
    slides: "/lessons/lesson1-intro-card-slides.pptx",
    sheet: "/lessons/lesson1-intro-card-worksheet.pdf",
  },
  {
    order: "2차시",
    title: "우리 반 설문판",
    band: "초등 5~6학년",
    summary: "슬라이더로 점수를 받고, ‘만약 ~라면’으로 답이 달라지게 해요.",
    slides: "/lessons/lesson2-class-survey-slides.pptx",
    sheet: "/lessons/lesson2-class-survey-worksheet.pdf",
  },
  {
    order: "3차시",
    title: "학교 안내 도우미",
    band: "초등 5~6학년 심화",
    summary: "버튼을 나란히 놓고, 버튼마다 다른 안내가 나오게 만들어요.",
    slides: "/lessons/lesson3-school-guide-slides.pptx",
    sheet: "/lessons/lesson3-school-guide-worksheet.pdf",
  },
  {
    order: "4차시",
    title: "우리 반 알림장",
    band: "초등 3~4학년",
    summary: "오늘의 알림과 할 일을 담은 우리 반 알림장을 만들어요.",
    slides: "/lessons/lesson4-notice-board-slides.pptx",
    sheet: "/lessons/lesson4-notice-board-worksheet.pdf",
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

        <Link className="lesson-banner" href="/lessons">
          <span>
            <FileText size={19} aria-hidden="true" />
          </span>
          <span>
            <b>수업 예시와 지도안 보기</b>
            <small>차시별 예시 웹앱 4종 · 수업 흐름 · 평가 기준 · 활동지</small>
          </span>
          <ChevronRight size={16} aria-hidden="true" />
        </Link>

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

        <section className="lesson-pack" aria-label="차시별 수업 자료">
          <header className="lesson-pack-heading">
            <h2>차시별 수업 자료</h2>
            <p>
              수업에 그대로 띄우는 PPT(17장)와 아이들이 쓰는 A4 활동지(2쪽)예요.
              PPT 앞부분은 선생님을 따라 만들고, 뒷부분은 스스로 바꿔 보는
              차례로 되어 있어요.
            </p>
          </header>

          <div className="lesson-pack-grid">
            {lessonPacks.map((pack) => (
              <article className="lesson-pack-card" key={pack.order}>
                <div className="lesson-pack-top">
                  <span className="lesson-pack-order">{pack.order}</span>
                  <span className="lesson-pack-band">{pack.band}</span>
                </div>
                <h3>{pack.title}</h3>
                <p>{pack.summary}</p>
                <div className="lesson-pack-links">
                  <a
                    className="lesson-pack-link slides"
                    href={pack.slides}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Presentation size={16} aria-hidden="true" />
                    수업 PPT 받기
                    <Download size={14} aria-hidden="true" />
                  </a>
                  <a
                    className="lesson-pack-link sheet"
                    href={pack.sheet}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Printer size={16} aria-hidden="true" />
                    활동지 인쇄하기
                    <Download size={14} aria-hidden="true" />
                  </a>
                </div>
              </article>
            ))}
          </div>
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
