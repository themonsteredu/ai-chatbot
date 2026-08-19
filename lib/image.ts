/**
 * 휴대폰 사진은 그대로 두면 한 장에 수 MB라, 브라우저 저장 공간이 금방 찹니다.
 * 긴 변을 720px로 줄이고 JPEG로 다시 저장해서 넣습니다.
 */
export function compressPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("사진 파일만 올릴 수 있어요."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("사진을 읽지 못했어요."));
    reader.onload = () => {
      const image = new window.Image();
      image.onerror = () => reject(new Error("사진을 열지 못했어요."));
      image.onload = () => {
        const maxSide = 720;
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("사진을 줄이지 못했어요."));
          return;
        }
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.66));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
