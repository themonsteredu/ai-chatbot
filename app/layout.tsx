import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "나만의 웹 만들기 | 기획부터 직접 만드는 웹 스튜디오",
  description:
    "학생 누구나 기획부터 화면 구성, 기능 연결, 테스트까지 앱 인벤터처럼 블록을 조립해 자신만의 웹을 만드는 교육용 제작 도구입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={geist.variable}>{children}</body>
    </html>
  );
}
