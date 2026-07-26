import { NextRequest } from "next/server";

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const APP_ID = /^[a-z0-9-]{8,80}$/;

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

  return Response.json(
    {
      id: `/student-webapps/${id}`,
      name,
      short_name: shorten(name, 12),
      description: `${name} - 학생이 직접 만든 나만의 웹앱`,
      start_url: `/?run=saved&app=${encodeURIComponent(id)}`,
      scope: "/",
      display: "standalone",
      background_color: "#f4f5f9",
      theme_color: accent,
      orientation: "portrait",
      categories: ["education", "productivity"],
      prefer_related_applications: false,
      icons: [
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
