import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
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

/**
 * 브라우저가 "이 앱은 설치할 수 있다"고 알리는 beforeinstallprompt를 문서
 * 머리에서 먼저 붙잡아 둡니다.
 *
 * 두 번째 방문부터는 서비스워커와 매니페스트가 이미 있어서 Chrome이 이 신호를
 * 화면이 뜨기도 전에 보냅니다. React가 뜬 뒤에야 듣기 시작하면 놓치고, 설치
 * 버튼은 설치창 대신 "직접 추가하세요" 안내만 띄우게 됩니다. 여기서 잡아 두면
 * 설치 버튼(pwa-install.tsx)이 나중에 꺼내 씁니다.
 */
const CAPTURE_INSTALL_PROMPT = `window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__webappInstallPrompt=e;window.dispatchEvent(new Event("webapp-install-ready"));});`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={geist.variable}>
      <body>
        <Script id="capture-install-prompt" strategy="beforeInteractive">
          {CAPTURE_INSTALL_PROMPT}
        </Script>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
