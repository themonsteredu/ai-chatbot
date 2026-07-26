import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "나만의 웹앱 만들기",
    short_name: "내 웹앱",
    description:
      "학생이 직접 만든 활동 기록과 질문·답을 휴대폰에 저장해 계속 사용하는 웹앱",
    start_url: "/?run=saved",
    display: "standalone",
    background_color: "#f4f2ff",
    theme_color: "#6956e8",
    orientation: "portrait",
    icons: [
      {
        src: "/app-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
