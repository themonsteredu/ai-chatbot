"use client";

import { AlertCircle, Loader2, QrCode, X } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

type ShareQrDialogProps = {
  appName: string;
  /** QR에 담을 공유 주소입니다. 웹앱 내용이 함께 실려 있어야 합니다. */
  url: string;
  onClose: () => void;
};

export function ShareQrDialog({ appName, url, onClose }: ShareQrDialogProps) {
  const [result, setResult] = useState<{ url: string; image: string }>({
    url: "",
    image: "",
  });
  const [error, setError] = useState("");
  // 주소가 아직 만들어지는 중이거나 바뀌었으면 이전 그림을 쓰지 않습니다.
  const image = result.url === url ? result.image : "";

  useEffect(() => {
    let cancelled = false;
    if (!url) return undefined;
    // 오류 보정을 가장 낮게 잡아 담을 수 있는 길이를 최대로 씁니다. 웹앱 하나가
    // 이천 자 안팎이라 보통 넉넉하고, 넘치면 아래에서 안내합니다.
    QRCode.toDataURL(url, {
      errorCorrectionLevel: "L",
      margin: 4,
      width: 560,
    })
      .then((dataUrl) => {
        if (!cancelled) setResult({ url, image: dataUrl });
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            "내용이 많아 QR에 담지 못했어요. 사진이 없는 상태로 저장한 뒤 다시 시도하거나, ‘공유’ 버튼으로 링크를 보내 주세요.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="preview-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        className="qr-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={`${appName} 설치 QR`}
      >
        <header>
          <span>
            <QrCode size={16} aria-hidden="true" />
            <b>{appName}</b>
          </span>
          <button type="button" aria-label="닫기" onClick={onClose}>
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        {error ? (
          <p className="qr-error" role="alert">
            <AlertCircle size={15} aria-hidden="true" />
            {error}
          </p>
        ) : image ? (
          // QR은 픽셀이 그대로 보여야 잘 찍히므로 next/image 최적화를 쓰지 않습니다.
          // eslint-disable-next-line @next/next/no-img-element
          <img className="qr-image" src={image} alt={`${appName} 설치 QR 코드`} />
        ) : (
          <p className="qr-loading">
            <Loader2 size={16} aria-hidden="true" className="spin" />
            QR을 만드는 중이에요
          </p>
        )}

        <ol className="qr-steps">
          <li>휴대폰 카메라로 이 QR을 찍어요.</li>
          <li>열린 화면에서 ‘설치’ 또는 ‘홈 화면에 추가’를 눌러요.</li>
          <li>아이폰은 Safari에서 공유 버튼 → ‘홈 화면에 추가’예요.</li>
        </ol>
      </section>
    </div>
  );
}
