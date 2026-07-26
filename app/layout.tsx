import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { ServiceWorkerRegistration } from "./components/service-worker";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "나만의 웹앱 만들기 | AI WEB APP LAB",
  description:
    "학생이 App Inventor처럼 기능을 고르고 속성을 바꾸며 활동 기록장, 알림장과 직접 만든 질문·답 챗봇을 담는 교육용 웹앱 제작 도구입니다.",
  icons: {
    // 아이폰·아이패드는 apple-touch-icon으로 SVG를 읽지 못해 PNG를 함께 둡니다.
    icon: [
      { url: "/app-icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  },
  appleWebApp: {
    capable: true,
    title: "웹앱 만들기",
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
      <body>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
