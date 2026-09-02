"use client";

import { Check, CloudOff, Loader2, RefreshCw, Smartphone } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { detectBrowser } from "../../lib/install-guide";

/**
 * 인터넷이 막혀도 이 앱이 열리게, 지금 화면이 쓰는 파일을 미리 담아 둡니다.
 *
 * 학교망이나 보안 프로그램이 이 주소를 막는 곳이 있습니다. 막히지 않는 곳에서
 * 한 번 열어 담아 두면, 그 뒤로는 서비스워커가 담아 둔 것을 꺼내 주어 앱이
 * 열립니다. 반 제출과 공유 코드만 인터넷이 필요합니다.
 */

type Status = "idle" | "working" | "ready" | "failed" | "unsupported";

const ICONS = [
  "/",
  "/app-icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
  "/apple-touch-icon.png",
];

/** 이 화면이 실제로 불러 쓴 같은 주소의 파일들입니다. */
function collectUrls() {
  const urls = new Set<string>(ICONS);
  const add = (raw: string) => {
    try {
      const url = new URL(raw, window.location.href);
      if (url.origin === window.location.origin) {
        urls.add(url.pathname + url.search);
      }
    } catch {
      // 이상한 주소는 건너뜁니다.
    }
  };
  document
    .querySelectorAll<HTMLScriptElement>("script[src]")
    .forEach((script) => add(script.src));
  document
    .querySelectorAll<HTMLLinkElement>(
      'link[rel="stylesheet"], link[rel="manifest"], link[rel="preload"], link[rel="modulepreload"]',
    )
    .forEach((link) => add(link.href));
  return [...urls];
}

/** 서비스워커에 담아 달라고 부탁하고, 다 담았는지 답을 기다립니다. */
async function precache(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;
  const registration = await navigator.serviceWorker.ready;
  const worker = registration.active;
  if (!worker) return false;

  return new Promise<boolean>((resolve) => {
    const channel = new MessageChannel();
    const timer = window.setTimeout(() => resolve(false), 30_000);
    channel.port1.onmessage = (event) => {
      window.clearTimeout(timer);
      resolve(event.data?.ok === true);
    };
    worker.postMessage({ type: "precache", urls: collectUrls() }, [
      channel.port2,
    ]);
  });
}

export function OfflineReady() {
  const [status, setStatus] = useState<Status>("idle");
  const [installedApp, setInstalledApp] = useState(false);
  // 아이폰·아이패드는 홈 화면 아이콘 앱이 Safari와 저장 공간을 따로 씁니다.
  // Safari에 담은 것은 아이콘으로 열 때 없습니다. 아이콘으로도 한 번 열어야 합니다.
  const [ios, setIos] = useState(false);

  const run = useCallback(async () => {
    if (!("serviceWorker" in navigator)) {
      setStatus("unsupported");
      return;
    }
    setStatus("working");
    try {
      setStatus((await precache()) ? "ready" : "failed");
    } catch {
      setStatus("failed");
    }
  }, []);

  useEffect(() => {
    // 설치 정보 링크는 화면이 뜬 뒤에 붙습니다. 그것까지 담으려고 잠깐 기다립니다.
    const timer = window.setTimeout(() => {
      const navigatorWithStandalone = navigator as Navigator & {
        standalone?: boolean;
      };
      setInstalledApp(
        window.matchMedia("(display-mode: standalone)").matches ||
          navigatorWithStandalone.standalone === true,
      );
      setIos(detectBrowser(navigator.userAgent).startsWith("ios"));
      void run();
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [run]);

  if (status === "unsupported" || status === "idle") return null;

  // 아이패드·아이폰의 Safari 탭에서는 "담았다"가 반쪽짜리입니다. 초록색으로
  // 두면 다 된 줄 알고 학교에 가서 빈 창을 만납니다.
  const iosTabOnly = status === "ready" && ios && !installedApp;

  return (
    <div
      className={`offline-ready ${status}${iosTabOnly ? " ios-tab" : ""}`}
      role="status"
    >
      {status === "working" && (
        <>
          <Loader2 size={13} aria-hidden="true" className="spin" />
          <span>학교에서도 열리게 담는 중…</span>
        </>
      )}
      {iosTabOnly && (
        <>
          <Smartphone size={13} aria-hidden="true" />
          <span>
            <b>Safari에는 담았어요. 홈 화면 아이콘은 따로 담아야 해요.</b> 공유
            버튼 → ‘홈 화면에 추가’를 한 다음, <b>인터넷이 되는 동안</b> 그
            아이콘으로 한 번 열어 주세요. 그때 이 줄이 초록색이 되면 끝이에요.
          </span>
        </>
      )}
      {status === "ready" && !iosTabOnly && (
        <>
          <Check size={13} aria-hidden="true" />
          <span>
            <b>담아 뒀어요.</b>{" "}
            {installedApp
              ? "이 아이콘은 이제 인터넷이 막혀도 열려요."
              : "인터넷이 막혀도 이 앱은 열려요."}{" "}
            반 제출과 QR만 인터넷이 필요해요.
          </span>
        </>
      )}
      {status === "failed" && (
        <>
          <CloudOff size={13} aria-hidden="true" />
          <span>
            지금 이 인터넷으로는 담지 못했어요. 이미 담아 둔 게 있으면 그걸로
            열려요. 인터넷이 되는 곳에서 다시 열면 새로 담아요.
          </span>
          <button type="button" onClick={() => void run()}>
            <RefreshCw size={12} aria-hidden="true" />
            다시 담기
          </button>
        </>
      )}
    </div>
  );
}
