import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "나만의 웹앱 만들기 | AI WEB APP LAB",
  description:
    "학생이 App Inventor처럼 기능을 고르고 속성을 바꾸며 알림장, 캠프 활동장, 기록장과 AI 챗봇이 담긴 나만의 웹앱을 만드는 교육용 제작 도구입니다.",
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
