"use client";

import { useCallback, useEffect, useRef } from "react";

/** .phone의 실제 크기입니다. 이 비율을 지켜야 진짜 휴대폰처럼 보입니다. */
const PHONE_WIDTH = 330;
const PHONE_HEIGHT = 674;

/**
 * 1160px 이하에서는 기존 반응형 규칙이 크기를 정하므로 건드리지 않습니다.
 * 넓은 화면에만 남는 공간을 채우도록 키웁니다.
 */
const WIDE_FROM = 1161;
const MIN_SCALE = 0.85;
const MAX_SCALE = 1.5;

/**
 * 미리보기 무대의 남는 공간에 맞춰 휴대폰을 키웁니다. 글자와 배치는 330px 기준
 * 그대로 두고 전체를 확대하기 때문에, 커져도 실제 휴대폰에서 보이는 모습과
 * 같습니다.
 */
export function usePhoneScale() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  const apply = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    if (window.innerWidth < WIDE_FROM) {
      stage.style.removeProperty("--phone-scale");
      return;
    }

    // 여백은 화면 폭에 따라 달라지므로 실제 값에서 읽습니다.
    const style = window.getComputedStyle(stage);
    const paddingX =
      parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const paddingY =
      parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);

    const availableWidth = stage.clientWidth - paddingX;
    const availableHeight = stage.clientHeight - paddingY;
    if (availableWidth <= 0 || availableHeight <= 0) return;

    const scale = Math.min(
      availableWidth / PHONE_WIDTH,
      availableHeight / PHONE_HEIGHT,
      MAX_SCALE,
    );
    stage.style.setProperty(
      "--phone-scale",
      String(Math.max(MIN_SCALE, Math.round(scale * 1000) / 1000)),
    );
  }, []);

  // 편집 화면은 불러오기가 끝난 뒤에 그려지기 때문에, 효과가 도는 시점에는
  // 무대가 아직 없습니다. 요소가 붙는 순간에 맞춰 재도록 콜백 ref를 씁니다.
  const setStage = useCallback(
    (node: HTMLDivElement | null) => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      stageRef.current = node;
      if (!node) return;

      const observer = new ResizeObserver(apply);
      observer.observe(node);
      observerRef.current = observer;
      apply();
    },
    [apply],
  );

  useEffect(() => {
    window.addEventListener("resize", apply);
    return () => {
      window.removeEventListener("resize", apply);
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [apply]);

  return setStage;
}
