import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { detectBrowser, installGuide } from "../lib/install-guide.ts";

const root = new URL("../", import.meta.url);

const UA = {
  galaxyChrome:
    "Mozilla/5.0 (Linux; Android 13; SM-X510) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  samsung:
    "Mozilla/5.0 (Linux; Android 13; SM-X510) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/117.0.0.0 Safari/537.36",
  ipadSafari:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
  iphoneSafari:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
  iphoneChrome:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.6367.71 Mobile/15E148 Safari/604.1",
  kakao:
    "Mozilla/5.0 (Linux; Android 13; SM-X510) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36 KAKAOTALK/10.6.0",
  naver:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 NAVER(inapp; search; 2000; 12.3.4)",
};

test("tells each browser apart from its user agent", () => {
  assert.equal(detectBrowser(UA.galaxyChrome), "android-chrome");
  assert.equal(detectBrowser(UA.samsung), "samsung");
  // 아이패드 Safari는 요즘 맥처럼 소개하지만 Mobile이 붙어 있습니다.
  assert.equal(detectBrowser(UA.ipadSafari), "ios-safari");
  assert.equal(detectBrowser(UA.iphoneSafari), "ios-safari");
  assert.equal(detectBrowser(UA.iphoneChrome), "ios-other");
  assert.equal(detectBrowser(UA.kakao), "in-app");
  assert.equal(detectBrowser(UA.naver), "in-app");
});

test("names the exact menu each browser hides the install behind", () => {
  assert.match(installGuide("android-chrome", "토끼 공듀").steps.join(" "), /홈 화면에 추가/);
  assert.match(installGuide("samsung", "토끼 공듀").steps.join(" "), /현재 페이지 추가/);
  assert.match(installGuide("ios-safari", "토끼 공듀").steps.join(" "), /공유 버튼/);
  // 앱 안의 브라우저는 다른 브라우저로 열라고 해야 합니다.
  assert.equal(installGuide("in-app", "토끼 공듀").needsAnotherBrowser, true);
  assert.equal(installGuide("ios-other", "토끼 공듀").needsAnotherBrowser, true);
  assert.equal(installGuide("android-chrome", "토끼 공듀").needsAnotherBrowser, false);
  for (const kind of ["in-app", "ios-safari", "ios-other", "samsung", "android-chrome", "other"]) {
    const guide = installGuide(kind, "토끼 공듀");
    assert.ok(guide.title.trim() && guide.steps.length >= 2, kind);
  }
});

test("catches the install signal before the app has finished loading", async () => {
  const [layout, button] = await Promise.all([
    readFile(new URL("app/layout.tsx", root), "utf8"),
    readFile(new URL("app/components/pwa-install.tsx", root), "utf8"),
  ]);
  // 두 번째 방문부터 Chrome은 화면이 뜨기 전에 신호를 보냅니다. 문서 머리에서
  // 먼저 붙잡아 두고, 설치 버튼이 나중에 꺼내 씁니다.
  assert.match(layout, /beforeinstallprompt/);
  assert.match(layout, /__webappInstallPrompt/);
  assert.match(button, /__webappInstallPrompt/);
});
