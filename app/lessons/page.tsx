import { ArrowLeft, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { LessonGuide } from "../components/lesson-guide";

export const metadata: Metadata = {
  title: "수업 예시와 지도안 | 나만의 웹앱 만들기",
  robots: { index: false, follow: false },
};

export default function LessonsPage() {
  return (
    <main className="worksheets-page">
      <div className="worksheets-shell">
        <Link className="worksheets-back" href="/">
          <ArrowLeft size={16} aria-hidden="true" />
          웹앱 만들기로 돌아가기
        </Link>

        <header className="worksheets-heading">
          <span className="worksheets-kicker">SAMPLE LESSONS</span>
          <h1>수업 예시와 지도안</h1>
          <p>
            이 도구로 무엇을 만들 수 있는지 보여 주는 예시 세 가지입니다. 세
            예시는 일부러 서로 다른 기능을 씁니다. 눌러서 바로 열어 보고, 그대로
            수업에 쓰거나 학교 사정에 맞게 고쳐 쓰세요.
          </p>
        </header>

        <LessonGuide />

        <p className="teacher-panel-note">
          <ShieldCheck size={15} aria-hidden="true" />
          지도안 내용은 서버에만 있고, 코드가 맞을 때만 전송됩니다. 같은
          코드로 반 명단과 학생 작품을 보는 화면도 열립니다.
        </p>
      </div>
    </main>
  );
}
