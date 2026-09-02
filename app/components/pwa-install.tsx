"use client";

import { ArrowUp, Check, Copy, Download, Share2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { encodeProject, type WebAppProject } from "../../lib/chatbot-studio";
import {
  detectBrowser,
  installGuide,
  type InstallGuide,
} from "../../lib/install-guide";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/** layout.tsx의 머리 스크립트가 화면이 뜨기 전에 붙잡아 둔 신호입니다. */
type WindowWithPrompt = Window & {
  __webappInstallPrompt?: BeforeInstallPromptEvent;
};

type PwaInstallButtonProps = {
  accent: string;
  appId: string;
  appName: string;
  project: WebAppProject;
  compact?: boolean;
};

export function PwaInstallButton({
  accent,
  appId,
  appName,
  project,
  compact = false,
}: PwaInstallButtonProps) {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  // 브라우저의 설치 확인창은 주소창 근처에 작게 떠서 놓치기 쉽습니다.
  // 확인창이 떠 있는 동안 어디를 봐야 하는지 화면에 크게 알려 줍니다.
  const [prompting, setPrompting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  // 설치창이 안 뜰 때 보여 줄, 이 브라우저에 맞는 길입니다.
  const [guide, setGuide] = useState<InstallGuide | null>(null);
  const [copied, setCopied] = useState(false);

  // 설치한 앱이 브라우저 저장 공간을 못 읽는 아이폰에서도 열리도록, 설계 내용을
  // 매니페스트에 실어 시작 주소에 담습니다.
  // 홈 화면 설치 주소는 12,000자까지라 사진은 빼고 싣습니다. 설계는 기기에
  // 그대로 남아 있어서 첫 실행 뒤에는 사진도 다시 보입니다.
  const encodedProject = useMemo(
    () => encodeProject(project, { forManifest: true }),
    [project],
  );

  useEffect(() => {
    const manifestParams = new URLSearchParams({
      id: appId,
      name: appName,
      accent,
      project: encodedProject,
    });
    const manifestHref = `/api/webapp-manifest?${manifestParams.toString()}`;
    // 브라우저는 문서에서 처음 만난 manifest 링크만 사용합니다. 제작 도구용
    // 매니페스트는 React가 하이드레이션을 마친 뒤에 다시 붙이기 때문에, 지금 있는
    // 링크뿐 아니라 나중에 추가되는 링크까지 이 웹앱 것으로 바꿔 둡니다. 그래야
    // 순서와 상관없이 학생이 만든 이름으로 설치되고, 편집 화면으로 돌아갈 때
    // 원래 주소로 되돌릴 수 있습니다.
    const claimedManifests = new Map<HTMLLinkElement, string | null>();
    const claimManifest = (link: HTMLLinkElement) => {
      if (claimedManifests.has(link)) return;
      claimedManifests.set(link, link.getAttribute("href"));
      link.href = manifestHref;
    };

    document
      .querySelectorAll<HTMLLinkElement>('link[rel="manifest"]')
      .forEach(claimManifest);

    let ownManifest: HTMLLinkElement | null = null;
    if (claimedManifests.size === 0) {
      ownManifest = document.createElement("link");
      ownManifest.rel = "manifest";
      ownManifest.href = manifestHref;
      document.head.appendChild(ownManifest);
    }

    const manifestObserver = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (
            node instanceof HTMLLinkElement &&
            node.rel === "manifest" &&
            node !== ownManifest
          ) {
            claimManifest(node);
          }
        }
      }
    });
    manifestObserver.observe(document.head, { childList: true });

    const existingAppleTitle = document.querySelector<HTMLMetaElement>(
      'meta[name="apple-mobile-web-app-title"]',
    );
    const appleTitle = existingAppleTitle ?? document.createElement("meta");
    const previousAppleTitle = existingAppleTitle?.content ?? null;
    if (!existingAppleTitle) {
      appleTitle.name = "apple-mobile-web-app-title";
      document.head.appendChild(appleTitle);
    }
    appleTitle.content = appName;

    const previousDocumentTitle = document.title;
    document.title = appName;

    const restoreDocumentMetadata = () => {
      manifestObserver.disconnect();
      claimedManifests.forEach((previousHref, link) => {
        if (previousHref === null) link.removeAttribute("href");
        else link.setAttribute("href", previousHref);
      });
      ownManifest?.remove();

      if (previousAppleTitle === null) appleTitle.remove();
      else appleTitle.content = previousAppleTitle;

      document.title = previousDocumentTitle;
    };

    const navigatorWithStandalone = navigator as Navigator & {
      standalone?: boolean;
    };
    const alreadyInstalled =
      window.matchMedia("(display-mode: standalone)").matches ||
      navigatorWithStandalone.standalone === true;
    // 화면이 뜨기 전에 온 신호는 문서 머리 스크립트가 붙잡아 두었습니다.
    const stashed = () => (window as WindowWithPrompt).__webappInstallPrompt;
    const installedTimer = window.setTimeout(() => {
      setInstalled(alreadyInstalled);
      const early = stashed();
      if (early) setInstallPrompt(early);
    }, 0);

    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const pickUpStashed = () => {
      const early = stashed();
      if (early) setInstallPrompt(early);
    };
    const markInstalled = () => {
      setInstalled(true);
      setShowHelp(false);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener("webapp-install-ready", pickUpStashed);
    window.addEventListener("appinstalled", markInstalled);
    return () => {
      window.clearTimeout(installedTimer);
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      window.removeEventListener("webapp-install-ready", pickUpStashed);
      window.removeEventListener("appinstalled", markInstalled);
      restoreDocumentMetadata();
    };
  }, [accent, appId, appName, encodedProject]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      window.prompt("아래 주소를 복사해 주세요.", window.location.href);
    }
  };

  const install = async () => {
    if (installed) return;
    if (!installPrompt) {
      // 브라우저가 설치창을 내주지 않으면, 이 브라우저의 메뉴 이름으로 길을 알려 줍니다.
      setGuide(installGuide(detectBrowser(navigator.userAgent), appName));
      setCopied(false);
      setShowHelp(true);
      return;
    }

    setPrompting(true);
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setInstallPrompt(null);
    } finally {
      setPrompting(false);
    }
  };

  return (
    <div className={`pwa-install ${compact ? "compact" : ""}`}>
      <button type="button" onClick={install}>
        {installed ? (
          <>
            <Check size={14} aria-hidden="true" />
            홈 화면에 저장됨
          </>
        ) : (
          <>
            <Download size={14} aria-hidden="true" />
            ‘{appName}’ 설치
          </>
        )}
      </button>
      {/* 툴바의 backdrop-filter가 fixed의 기준을 툴바로 바꿔 말풍선이 화면
          밖에 그려지므로, 안내는 body에 직접 붙입니다. */}
      {prompting &&
        !installed &&
        createPortal(
          <div className="pwa-install-pointer" role="status">
            <ArrowUp size={15} aria-hidden="true" />
            <p>
              화면 <b>위쪽 주소창 근처</b>에 작은 설치 확인창이 떴어요.
              거기에서 <strong>‘설치’</strong>를 눌러 주세요.
            </p>
          </div>,
          document.body,
        )}
      {showHelp &&
        !installed &&
        createPortal(
          <div className="pwa-install-help" role="status">
            <button
              type="button"
              aria-label="설치 안내 닫기"
              onClick={() => setShowHelp(false)}
            >
              <X size={13} aria-hidden="true" />
            </button>
            <Share2 size={16} aria-hidden="true" />
            <div>
              <p>
                <b>{guide?.title ?? `‘${appName}’을 홈 화면에 넣기`}</b>
              </p>
              <ol>
                {(guide?.steps ?? []).map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              {guide?.needsAnotherBrowser && (
                <button
                  className="pwa-install-copy"
                  type="button"
                  onClick={copyLink}
                >
                  <Copy size={12} aria-hidden="true" />
                  {copied ? "주소를 복사했어요" : "이 앱 주소 복사"}
                </button>
              )}
              <small>
                이미 넣었다면 홈 화면에서 ‘{appName}’ 아이콘을 찾아 보세요.
                그 아이콘으로 열면 설치창은 다시 뜨지 않아요.
              </small>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
