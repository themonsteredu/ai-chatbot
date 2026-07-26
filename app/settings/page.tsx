import { ArrowLeft, Lock, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { TeacherAnswerDownload } from "../components/teacher-answer-download";

export const metadata: Metadata = {
  title: "교사용 설정 | 나만의 웹앱 만들기",
  robots: { index: false, follow: false },
};

export default function SettingsPage() {
  return (
    <main className="worksheets-page">
      <div className="worksheets-shell">
        <Link className="worksheets-back" href="/worksheets">
          <ArrowLeft size={16} aria-hidden="true" />
          활동지로 돌아가기
        </Link>

        <header className="worksheets-heading">
          <span className="worksheets-kicker">TEACHER SETTINGS</span>
          <h1>교사용 설정</h1>
          <p>
            수업을 준비하는 선생님을 위한 자료입니다. 예시 답안은 운영자 또는
            강사 코드를 입력해야 내려받을 수 있고, 운영자로 확인하면 강사용
            코드를 다시 볼 수 있습니다.
          </p>
        </header>

        <section className="teacher-panel">
          <div className="teacher-panel-head">
            <span className="teacher-panel-icon">
              <Lock size={19} aria-hidden="true" />
            </span>
            <div>
              <h2>활동지 예시 답안</h2>
              <p>
                초·중·고 활동지 12종의 문항별 예시 답안, 지도 포인트, 학년군별
                평가 기준표가 한 문서에 담겨 있습니다. 내려받은 파일을 열어
                브라우저에서 A4로 인쇄하거나 PDF로 저장할 수 있습니다.
              </p>
            </div>
          </div>

          <TeacherAnswerDownload />

          <p className="teacher-panel-note">
            <ShieldCheck size={15} aria-hidden="true" />
            답안 내용은 서버에만 있고, 코드가 맞을 때만 전송됩니다. 학생이 이
            화면을 열거나 개발자도구를 확인해도 답안은 보이지 않습니다.
          </p>
        </section>
      </div>
    </main>
  );
}
