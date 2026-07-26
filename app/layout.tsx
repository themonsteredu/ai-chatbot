import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "나만의 웹앱 만들기 | AI WEB APP LAB",
  description:
    "학생이 App Inventor처럼 기능을 고르고 속성을 바꾸며 활동 기록장, 알림장과 직접 만든 질문·답 챗봇을 담는 교육용 웹앱 제작 도구입니다.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/app-icon.svg",
    apple: "/app-icon.svg",
  },
  appleWebApp: {
    capable: true,
    title: "내 웹앱",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#6956e8",
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
