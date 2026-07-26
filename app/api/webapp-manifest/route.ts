import { NextRequest } from "next/server";

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const APP_ID = /^[a-z0-9-]{8,80}$/;
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

/**
 * 시작 주소에 실을 수 있는 설계 내용의 최대 길이입니다. 보통 웹앱 하나가
 * 2천 자 안팎이라 넉넉하고, 주소가 지나치게 길어져 매니페스트가 깨지는 것을
 * 막습니다.
 */
const MAX_PROJECT_LENGTH = 12000;

function shorten(value: string, length: number) {
  return Array.from(value).slice(0, length).join("");
}

export function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") ?? "";
  if (!APP_ID.test(id)) {
    return Response.json(
      { error: "올바른 웹앱 주소가 아닙니다." },
      { status: 400 },
    );
  }

  const requestedName = request.nextUrl.searchParams.get("name")?.trim();
  const name = shorten(requestedName || "나만의 웹앱", 40);
  const requestedAccent = request.nextUrl.searchParams.get("accent") ?? "";
  const accent = HEX_COLOR.test(requestedAccent)
    ? requestedAccent
    : "#6956e8";

  // 홈 화면에 설치한 앱은 브라우저와 저장 공간이 달라, 아이폰에서는 브라우저에
  // 저장해 둔 내용을 읽지 못합니다. 그래서 설계 내용을 시작 주소에 함께 실어
  // 설치한 앱만으로도 열리게 합니다.
  const requestedProject = request.nextUrl.searchParams.get("project") ?? "";
  const project =
    requestedProject.length > 0 &&
    requestedProject.length <= MAX_PROJECT_LENGTH &&
    BASE64.test(requestedProject)
      ? requestedProject
      : "";

  const startUrl = new URLSearchParams({ run: "saved", app: id });
  if (project) startUrl.set("project", project);

  return Response.json(
    {
      id: `/student-webapps/${id}`,
      name,
      short_name: shorten(name, 12),
      description: `${name} - 학생이 직접 만든 나만의 웹앱`,
      start_url: `/?${startUrl.toString()}`,
      scope: "/",
      display: "standalone",
      background_color: "#f4f5f9",
      theme_color: accent,
      orientation: "portrait",
      categories: ["education", "productivity"],
      prefer_related_applications: false,
      icons: [
        {
          src: "/icon-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/icon-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/icon-maskable-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
        {
          src: "/app-icon.svg",
          sizes: "any",
          type: "image/svg+xml",
          purpose: "any",
        },
      ],
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/manifest+json; charset=utf-8",
      },
    },
  );
}
