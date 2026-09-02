/**
 * 내가 만든 웹앱을 다른 브라우저나 다른 기기에서 열 수 있는 주소를 만듭니다.
 *
 * 설치 화면의 주소(?run=install&app=…)에는 설계 내용이 없습니다. 내용은 만든
 * 브라우저의 저장 공간에만 있어서, 그 주소를 다른 브라우저에 붙여 넣으면 빈
 * 화면이 뜹니다. 그래서 공유 주소는 내용을 서버에 맡기고 짧은 코드(sid)를 싣거나,
 * 서버가 없으면 내용을 통째로 싣습니다. 편집 화면의 공유·QR과 설치 화면의
 * '주소 복사'가 같은 주소를 만들도록 여기 한곳에 둡니다.
 */

import {
  canonicalShareOrigin,
  encodeProject,
  type WebAppProject,
} from "../../lib/chatbot-studio";

export type ShareLink = { url: string; code: string };

export async function buildShareLink(
  project: WebAppProject,
  appId: string,
): Promise<ShareLink> {
  const url = new URL("/", canonicalShareOrigin());
  url.searchParams.set("run", "install");
  url.searchParams.set("app", appId);

  try {
    const response = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", project }),
    });
    const json = await response.json().catch(() => null);
    if (!response.ok || !json?.id) throw new Error("share unavailable");
    url.searchParams.set("sid", json.id);
    return { url: url.toString(), code: String(json.id) };
  } catch {
    // 긴 링크에는 사진을 그대로 실을 수 없습니다. 주소가 한도를 넘습니다.
    url.searchParams.set("project", encodeProject(project, { forManifest: true }));
    return { url: url.toString(), code: "" };
  }
}
