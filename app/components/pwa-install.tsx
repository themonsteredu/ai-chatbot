"use client";

import { Check, Download, Share2, X } from "lucide-react";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type PwaInstallButtonProps = {
  compact?: boolean;
};

export function PwaInstallButton({
  compact = false,
}: PwaInstallButtonProps) {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

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
    };
  }, []);

  const install = async () => {
    if (installed) return;
    if (!installPrompt) {
      setShowHelp(true);
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setInstallPrompt(null);
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
            홈 화면에 저장
          </>
        )}
      </button>
      {showHelp && !installed && (
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
            <b>아이폰</b>은 Safari의 공유 버튼을 누른 뒤
            <strong> ‘홈 화면에 추가’</strong>를 선택하세요. 안드로이드는
            브라우저 메뉴의 <strong>‘앱 설치’</strong>를 선택하면 됩니다.
          </p>
        </div>
      )}
    </div>
  );
}
