import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI 챗봇 LAB | App Inventor 방식 챗봇 만들기",
  description:
    "초등학생과 중학생이 팔레트, 휴대폰 화면, 속성, 블록을 이용해 AI 알림장 챗봇을 만드는 교육용 제작 도구입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={geist.variable}>
      <body>{children}</body>
    </html>
  );
}
