import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "챗봇 메이커 | 아이디어를 대화로 만드는 스튜디오",
  description:
    "학생 누구나 템플릿과 기능 블록을 이용해 자신만의 챗봇을 디자인하고 공유할 수 있는 노코드 제작 도구입니다.",
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
