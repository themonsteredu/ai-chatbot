import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "나만의 웹앱 만들기 | AI WEB APP LAB",
    short_name: "웹앱 만들기",
    description:
      "학생이 App Inventor처럼 기능을 고르고 속성을 바꾸며 활동 기록장, 알림장과 직접 만든 질문·답 챗봇을 담는 교육용 웹앱 제작 도구입니다.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f4f5f9",
    theme_color: "#6956e8",
    orientation: "any",
    categories: ["education", "productivity"],
    prefer_related_applications: false,
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      { src: "/app-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
