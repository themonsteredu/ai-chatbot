"use client";

import { useEffect } from "react";

/**
 * 제작 도구와 학생 웹앱 모두 같은 앱 셸을 쓰기 때문에 서비스워커는 최상위에서
 * 한 번만 등록합니다. 등록되어 있어야 안드로이드에서 ‘앱 설치’가 뜨고,
 * 설치한 뒤에는 인터넷이 끊겨도 홈 화면 아이콘으로 열립니다.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  return null;
}
