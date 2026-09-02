/**
 * 브라우저가 설치창을 띄워 주지 않을 때, 어떤 메뉴를 눌러야 홈 화면에 앱이
 * 생기는지 브라우저별로 정확히 알려 줍니다.
 *
 * "브라우저 메뉴의 '앱 설치'"처럼 뭉뚱그리면 학생이 메뉴를 못 찾습니다. 삼성
 * 인터넷과 Chrome은 메뉴 이름이 다르고, 카카오톡·네이버 같은 앱 안의 브라우저는
 * 아예 설치가 안 되어 Chrome이나 Safari로 열어야 합니다.
 */

export type BrowserKind =
  | "in-app"
  | "ios-safari"
  | "ios-other"
  | "samsung"
  | "android-chrome"
  | "other";

/** 앱 안에 딸린 브라우저들입니다. 홈 화면에 추가할 길이 없습니다. */
const IN_APP = /KAKAOTALK|NAVER\(inapp|Instagram|FBAN|FBAV|Line\/|DaumApps|Whale\/.*Mobile.*inapp|wv\)/i;

export function detectBrowser(userAgent: string): BrowserKind {
  const ua = userAgent;
  if (IN_APP.test(ua)) return "in-app";

  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && /Mobile/.test(ua));
  if (ios) {
    // 아이폰의 Chrome·네이버·삼성 등은 UA에 제 이름을 붙입니다. 없으면 Safari입니다.
    return /CriOS|FxiOS|EdgiOS|NAVER|SamsungBrowser|Whale/.test(ua)
      ? "ios-other"
      : "ios-safari";
  }

  if (/SamsungBrowser/.test(ua)) return "samsung";
  if (/Android/.test(ua) && /Chrome\//.test(ua)) return "android-chrome";
  return "other";
}

export type InstallGuide = {
  /** 학생이 읽는 한 줄 제목입니다. */
  title: string;
  /** 차례대로 누를 것입니다. */
  steps: string[];
  /** 이 브라우저로는 안 되니 다른 데서 열라는 뜻입니다. */
  needsAnotherBrowser: boolean;
};

export function installGuide(kind: BrowserKind, appName: string): InstallGuide {
  switch (kind) {
    case "in-app":
      return {
        title: "이 앱 안의 브라우저로는 홈 화면에 넣을 수 없어요",
        steps: [
          "오른쪽 위 메뉴(⋮ 또는 공유)에서 ‘다른 브라우저로 열기’ 또는 ‘Chrome으로 열기’를 눌러요",
          "열린 Chrome(아이폰은 Safari)에서 다시 ‘설치’를 눌러요",
        ],
        needsAnotherBrowser: true,
      };
    case "ios-safari":
      return {
        title: `Safari에서 ‘${appName}’을 홈 화면에 넣기`,
        steps: [
          "화면 아래(아이패드는 위) 공유 버튼(네모에서 화살표가 올라가는 모양)을 눌러요",
          "아래로 내려 ‘홈 화면에 추가’를 눌러요",
          "오른쪽 위 ‘추가’를 눌러요",
        ],
        needsAnotherBrowser: false,
      };
    case "ios-other":
      return {
        title: "아이폰·아이패드는 Safari에서 넣는 게 가장 확실해요",
        steps: [
          "주소를 복사해 Safari에서 열어요",
          "공유 버튼 → ‘홈 화면에 추가’ → ‘추가’를 눌러요",
        ],
        needsAnotherBrowser: true,
      };
    case "samsung":
      return {
        title: `삼성 인터넷에서 ‘${appName}’을 홈 화면에 넣기`,
        steps: [
          "오른쪽 아래(또는 위) ≡ 메뉴를 눌러요",
          "‘현재 페이지 추가’ 또는 ‘앱 설치’를 눌러요",
          "‘홈 화면’을 고르고 ‘추가’를 눌러요",
        ],
        needsAnotherBrowser: false,
      };
    case "android-chrome":
      return {
        title: `Chrome에서 ‘${appName}’을 홈 화면에 넣기`,
        steps: [
          "오른쪽 위 ⋮ 메뉴를 눌러요",
          "‘홈 화면에 추가’(또는 ‘앱 설치’)를 눌러요",
          "‘설치’ 또는 ‘추가’를 눌러요",
        ],
        needsAnotherBrowser: false,
      };
    default:
      return {
        title: `‘${appName}’을 홈 화면에 넣기`,
        steps: [
          "브라우저 메뉴(⋮ 또는 공유)를 열어요",
          "‘홈 화면에 추가’나 ‘앱 설치’를 눌러요",
        ],
        needsAnotherBrowser: false,
      };
  }
}
