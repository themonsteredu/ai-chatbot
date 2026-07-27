"use client";

import { ArrowUp, Check, Download, Share2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { encodeProject, type WebAppProject } from "../../lib/chatbot-studio";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
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

  // 설치한 앱이 브라우저 저장 공간을 못 읽는 아이폰에서도 열리도록, 설계 내용을
  // 매니페스트에 실어 시작 주소에 담습니다.
  const encodedProject = useMemo(() => encodeProject(project), [project]);

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
    const installedTimer = window.setTimeout(
      () => setInstalled(alreadyInstalled),
      0,
    );

    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const markInstalled = () => {
      setInstalled(true);
      setShowHelp(false);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener("appinstalled", markInstalled);
    return () => {
      window.clearTimeout(installedTimer);
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      window.removeEventListener("appinstalled", markInstalled);
      restoreDocumentMetadata();
    };
  }, [accent, appId, appName, encodedProject]);

  const install = async () => {
    if (installed) return;
    if (!installPrompt) {
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
            <p>
              <b>‘{appName}’</b>을 저장하려면 아이폰은 Safari 아래쪽의
              공유 버튼을 누른 뒤 <strong>‘홈 화면에 추가’</strong>를
              선택하세요. 안드로이드는 브라우저 메뉴의
              <strong> ‘앱 설치’</strong>를 선택하면 됩니다.
            </p>
          </div>,
          document.body,
        )}
    </div>
  );
}
