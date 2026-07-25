import type {
  ElementKind,
  ElementStyle,
  StudioElement,
  StudioProject,
} from "./types";

export const elementLabels: Record<ElementKind, string> = {
  heading: "제목",
  text: "본문",
  button: "버튼",
  card: "카드",
  input: "입력",
  checklist: "체크리스트",
  badge: "배지",
  image: "이미지",
  html: "HTML",
};

const baseStyle: ElementStyle = {
  fill: "transparent",
  color: "#141414",
  fontFamily: "Geist",
  fontSize: 16,
  fontWeight: 500,
  lineHeight: 1.45,
  letterSpacing: 0,
  borderRadius: 0,
  borderWidth: 0,
  borderColor: "#d9d9d4",
  opacity: 1,
  textAlign: "left",
  shadow: false,
};

function element(
  id: string,
  kind: ElementKind,
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
  content: string,
  style: Partial<ElementStyle> = {},
  rest: Partial<StudioElement> = {},
): StudioElement {
  return {
    id,
    kind,
    name,
    x,
    y,
    width,
    height,
    rotation: 0,
    hidden: false,
    locked: false,
    content,
    items: [],
    placeholder: "",
    fieldName: "",
    imageUrl: "",
    action: "none",
    actionValue: "",
    style: { ...baseStyle, ...style },
    ...rest,
  };
}

export function getStarterProject(): StudioProject {
  return {
    id: "ai-camp-free-canvas",
    name: "AI 캠프 기록 웹",
    brief: {
      problem: "캠프에서 배운 것과 만든 것을 시간이 지나면 잊어버린다.",
      audience: "AI 캠프에 참여한 학생",
      outcome: "하루의 미션을 확인하고 자기 언어로 배움을 기록한다.",
    },
    canvas: {
      width: 960,
      height: 760,
      background: "#f3f0e8",
    },
    customCss: `.camp-kicker { text-transform: uppercase; }\n/* 원하는 CSS를 직접 추가하세요 */`,
    customJs: `// 미리보기 안에서 실행되는 JavaScript\nconsole.log("내 웹이 시작됐어요.");`,
    elements: [
      element(
        "camp-label",
        "badge",
        "캠프 배지",
        56,
        48,
        162,
        34,
        "AI CAMP · DAY 01",
        {
          fill: "#c9ff67",
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: 0.8,
          borderRadius: 17,
          textAlign: "center",
        },
      ),
      element(
        "camp-title",
        "heading",
        "메인 제목",
        56,
        106,
        560,
        142,
        "배우고, 만들고,\n오늘을 기록해요.",
        {
          color: "#111111",
          fontSize: 54,
          fontWeight: 820,
          lineHeight: 1.04,
          letterSpacing: -2.4,
        },
      ),
      element(
        "camp-intro",
        "text",
        "소개 글",
        58,
        274,
        390,
        68,
        "AI를 처음 만난 순간부터 내가 만든 결과까지.\n오늘의 생각을 내 방식으로 남겨 보세요.",
        {
          color: "#5f5d56",
          fontSize: 15,
          fontWeight: 450,
          lineHeight: 1.6,
        },
      ),
      element(
        "camp-action",
        "button",
        "시작 버튼",
        56,
        366,
        184,
        48,
        "기록 시작하기",
        {
          fill: "#171717",
          color: "#ffffff",
          fontSize: 14,
          fontWeight: 720,
          borderRadius: 24,
          textAlign: "center",
        },
        {
          action: "show-message",
          actionValue: "좋아요. 오늘의 첫 기록을 시작해 볼까요?",
        },
      ),
      element(
        "camp-orange-card",
        "card",
        "미션 카드 배경",
        518,
        48,
        384,
        348,
        "",
        {
          fill: "#ff6b45",
          borderRadius: 32,
          shadow: true,
        },
      ),
      element(
        "camp-mission-title",
        "heading",
        "미션 제목",
        558,
        89,
        260,
        42,
        "TODAY / 오늘의 미션",
        {
          color: "#171717",
          fontSize: 17,
          fontWeight: 800,
          letterSpacing: -0.3,
        },
      ),
      element(
        "camp-missions",
        "checklist",
        "오늘의 미션",
        558,
        150,
        294,
        188,
        "",
        {
          fill: "rgba(255,255,255,.2)",
          color: "#171717",
          fontSize: 14,
          fontWeight: 650,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: "rgba(20,20,20,.18)",
        },
        {
          items: [
            "나만의 웹 이름 정하기",
            "화면을 직접 배치하기",
            "친구에게 테스트 받기",
          ],
        },
      ),
      element(
        "student-name",
        "input",
        "기록자 이름",
        56,
        474,
        246,
        64,
        "기록자 이름",
        {
          fill: "#ffffff",
          color: "#171717",
          fontSize: 13,
          fontWeight: 650,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "#d8d5cc",
        },
        {
          placeholder: "이름을 입력하세요",
          fieldName: "student_name",
        },
      ),
      element(
        "camp-reflection",
        "input",
        "배움 기록",
        56,
        554,
        430,
        108,
        "오늘 새롭게 알게 된 것은?",
        {
          fill: "#ffffff",
          color: "#171717",
          fontSize: 13,
          fontWeight: 650,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: "#d8d5cc",
        },
        {
          placeholder: "내 생각을 자유롭게 적어 보세요",
          fieldName: "reflection",
        },
      ),
      element(
        "camp-save",
        "button",
        "기록 저장 버튼",
        56,
        682,
        184,
        48,
        "오늘 기록 저장",
        {
          fill: "#171717",
          color: "#ffffff",
          fontSize: 14,
          fontWeight: 720,
          borderRadius: 24,
          textAlign: "center",
        },
        {
          action: "save-record",
          actionValue: "나의 캠프 기록",
        },
      ),
      element(
        "camp-note",
        "card",
        "메모 카드",
        518,
        432,
        384,
        250,
        "MAKE IT YOURS\n\n정답 대신 나다운 선택을.\n완성보다 시도한 과정을 기록해요.",
        {
          fill: "#1b1b1b",
          color: "#f5f2ea",
          fontSize: 18,
          fontWeight: 680,
          lineHeight: 1.55,
          borderRadius: 32,
        },
      ),
    ],
  };
}

export function createStudioElement(
  kind: ElementKind,
  x: number,
  y: number,
): StudioElement {
  const id = crypto.randomUUID();
  const defaults: Record<ElementKind, StudioElement> = {
    heading: element(id, kind, "새 제목", x, y, 360, 88, "더블클릭해서 제목을 바꿔요", {
      fontSize: 38,
      fontWeight: 800,
      lineHeight: 1.08,
      letterSpacing: -1.4,
    }),
    text: element(id, kind, "새 본문", x, y, 320, 80, "내 생각을 직접 적어 보세요.", {
      color: "#555555",
      fontSize: 16,
    }),
    button: element(id, kind, "새 버튼", x, y, 160, 46, "버튼", {
      fill: "#171717",
      color: "#ffffff",
      fontSize: 14,
      fontWeight: 700,
      borderRadius: 23,
      textAlign: "center",
    }),
    card: element(id, kind, "새 카드", x, y, 300, 180, "카드 내용을 직접 구성하세요.", {
      fill: "#ffffff",
      fontSize: 17,
      fontWeight: 650,
      borderRadius: 24,
      borderWidth: 1,
      shadow: true,
    }),
    input: element(id, kind, "새 입력", x, y, 300, 88, "질문을 입력하세요", {
      fill: "#ffffff",
      fontSize: 13,
      fontWeight: 650,
      borderRadius: 16,
      borderWidth: 1,
    }, {
      placeholder: "여기에 입력하세요",
      fieldName: `field_${id.slice(0, 6)}`,
    }),
    checklist: element(id, kind, "새 체크리스트", x, y, 300, 180, "", {
      fill: "#ffffff",
      fontSize: 14,
      fontWeight: 600,
      borderRadius: 20,
      borderWidth: 1,
    }, {
      items: ["첫 번째 할 일", "두 번째 할 일", "세 번째 할 일"],
    }),
    badge: element(id, kind, "새 배지", x, y, 132, 32, "NEW LABEL", {
      fill: "#c9ff67",
      fontSize: 11,
      fontWeight: 800,
      borderRadius: 16,
      textAlign: "center",
    }),
    image: element(id, kind, "새 이미지", x, y, 320, 220, "", {
      fill: "#d9d7d0",
      borderRadius: 24,
    }),
    html: element(
      id,
      kind,
      "HTML 블록",
      x,
      y,
      340,
      190,
      `<div class="my-block">\n  <strong>직접 만든 HTML</strong>\n  <p>태그와 CSS를 마음껏 바꿔 보세요.</p>\n</div>`,
      {
        fill: "#ffffff",
        borderRadius: 16,
        borderWidth: 1,
      },
    ),
  };

  return defaults[kind];
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function textWithBreaks(value: string) {
  return escapeHtml(value).replaceAll("\n", "<br>");
}

export function elementStyleToCss(item: StudioElement) {
  const style = item.style;
  return [
    `left:${item.x}px`,
    `top:${item.y}px`,
    `width:${item.width}px`,
    `height:${item.height}px`,
    `transform:rotate(${item.rotation}deg)`,
    `background:${style.fill}`,
    `color:${style.color}`,
    `font-family:${style.fontFamily},sans-serif`,
    `font-size:${style.fontSize}px`,
    `font-weight:${style.fontWeight}`,
    `line-height:${style.lineHeight}`,
    `letter-spacing:${style.letterSpacing}px`,
    `border-radius:${style.borderRadius}px`,
    `border:${style.borderWidth}px solid ${style.borderColor}`,
    `opacity:${style.opacity}`,
    `text-align:${style.textAlign}`,
    `box-shadow:${style.shadow ? "0 18px 45px rgba(23,23,23,.14)" : "none"}`,
    `display:${item.hidden ? "none" : "flex"}`,
  ].join(";");
}

export function elementToHtml(item: StudioElement) {
  const style = elementStyleToCss(item);
  const common = `class="studio-node studio-${item.kind}" style="${style}" data-node="${item.id}"`;

  if (item.kind === "html") {
    return `<section ${common}>${item.content}</section>`;
  }
  if (item.kind === "input") {
    return `<label ${common}><span>${textWithBreaks(item.content)}</span><textarea name="${escapeHtml(item.fieldName)}" placeholder="${escapeHtml(item.placeholder)}"></textarea></label>`;
  }
  if (item.kind === "checklist") {
    return `<div ${common}>${item.items
      .map(
        (checkItem) =>
          `<label><input type="checkbox" name="missions" value="${escapeHtml(checkItem)}"><span>${textWithBreaks(checkItem)}</span></label>`,
      )
      .join("")}</div>`;
  }
  if (item.kind === "image") {
    const imageStyle = item.imageUrl
      ? `background-image:url('${escapeHtml(item.imageUrl)}');background-size:cover;background-position:center;`
      : "";
    return `<div class="studio-node studio-${item.kind}" style="${style};${imageStyle}" data-node="${item.id}"><span>${item.imageUrl ? "" : "IMAGE"}</span></div>`;
  }
  if (item.kind === "button") {
    return `<button ${common} data-action="${item.action}" data-value="${escapeHtml(item.actionValue)}">${textWithBreaks(item.content)}</button>`;
  }
  const tag = item.kind === "heading" ? "h1" : item.kind === "text" ? "p" : "div";
  return `<${tag} ${common}>${textWithBreaks(item.content)}</${tag}>`;
}

export function buildPreviewDocument(project: StudioProject) {
  const nodes = project.elements.map(elementToHtml).join("\n");
  const safeJs = project.customJs.replaceAll(/<\/script/gi, "<\\/script");

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    *{box-sizing:border-box} html,body{margin:0;min-height:100%;font-family:Arial,"Noto Sans KR",sans-serif}
    body{background:#111;padding:32px;display:flex;justify-content:center}
    #site{width:${project.canvas.width}px;height:${project.canvas.height}px;background:${project.canvas.background};position:relative;overflow:hidden;flex:0 0 auto}
    .studio-node{position:absolute;margin:0;box-sizing:border-box;align-items:center;padding:12px;overflow:hidden}
    .studio-heading,.studio-text,.studio-card{white-space:normal;align-items:flex-start;justify-content:flex-start}
    .studio-button,.studio-badge{justify-content:center;cursor:pointer}
    .studio-input{display:flex;flex-direction:column;align-items:stretch;gap:8px}
    .studio-input span{font-size:.86em}
    .studio-input textarea{width:100%;height:100%;min-height:0;resize:none;border:0;border-radius:10px;background:rgba(0,0,0,.045);padding:10px;font:inherit;outline:none}
    .studio-checklist{display:flex;flex-direction:column;align-items:stretch;justify-content:center;gap:8px}
    .studio-checklist label{display:flex;align-items:center;gap:9px;border-bottom:1px solid rgba(0,0,0,.1);padding:7px 3px}
    .studio-checklist label:last-child{border-bottom:0}
    .studio-checklist input{accent-color:#171717}
    .studio-image{justify-content:center;color:rgba(0,0,0,.4);font-size:12px;letter-spacing:.16em}
    ${project.customCss}
  </style>
</head>
<body>
  <main id="site">${nodes}</main>
  <script>
    document.querySelectorAll("[data-action]").forEach(function(button){
      button.addEventListener("click", function(){
        var action = button.dataset.action;
        var value = button.dataset.value || "";
        if(action === "show-message") alert(value || "동작을 실행했어요.");
        if(action === "open-link" && value) window.open(value, "_blank");
        if(action === "save-record"){
          var answers = {};
          document.querySelectorAll("textarea,input[type=text]").forEach(function(input){
            if(input.name) answers[input.name] = input.value;
          });
          var checked = Array.from(document.querySelectorAll("input[type=checkbox]:checked")).map(function(input){ return input.value; });
          parent.postMessage({source:"web-studio-preview",action:"save-record",elementId:button.dataset.node,value:value,answers:answers,checkedItems:checked},"*");
        }
      });
    });
    ${safeJs}
  </script>
</body>
</html>`;
}
