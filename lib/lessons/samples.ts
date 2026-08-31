/**
 * 수업에 그대로 쓸 수 있는 예시 웹앱입니다.
 *
 * 각각 일부러 서로 다른 기능을 씁니다. 하나만 보면 "이 도구로 뭘 만들 수
 * 있는지"가 좁아 보이기 때문입니다.
 *
 *   1차시 · 나를 소개하는 카드   → 기본 부품과 첫 블록
 *   2차시 · 우리 반 설문판       → 입력 부품, 변수, 조건
 *   3차시 · 학교 안내 도우미     → 배치 부품, 같은 부품 여러 개, 챗봇
 *   4차시 · 우리 반 알림장       → 빈 웹앱에서 시작하는 초등 40분 수업의 목표물
 *
 * 여기 담긴 것은 설계뿐입니다. 학생이 실행하며 적는 글과 사진은 늘 그렇듯
 * 그 기기에만 남습니다.
 */

import { PROJECT_SCHEMA_VERSION } from "../project/types";
import type { WebAppProject } from "../project/types";

export type SampleId =
  | "intro-card"
  | "class-survey"
  | "school-guide"
  | "notice-board";

export type Sample = {
  id: SampleId;
  order: number;
  /** 학생에게 보여 줄 이름입니다. */
  name: string;
  /** 이 예시로 무엇을 배우는지 한 줄로. */
  goal: string;
  /** 이 예시에서만 쓰는 기능입니다. 세 예시가 겹치지 않게 골랐습니다. */
  focus: string[];
  minutes: number;
  project: WebAppProject;
};

/* ------------------------------------------------------------------ */
/* 1차시 · 나를 소개하는 카드                                          */
/* ------------------------------------------------------------------ */

const INTRO_CARD: WebAppProject = {
  version: PROJECT_SCHEMA_VERSION,
  template: "blank",
  title: "나를 소개하는 카드",
  appName: "나를 소개해요",
  subtitle: "사진 한 장과 짧은 소개",
  accent: "#e65387",
  screenBackground: "#fff5f8",
  screens: [
    {
      id: "s1",
      name: "Screen1",
      children: [
        {
          id: "c1",
          type: "image",
          name: "내사진",
          props: { alt: "나를 보여 주는 사진" },
        },
        {
          id: "c2",
          type: "label",
          name: "이름",
          props: {
            text: "김민수",
            fontSize: "xl",
            bold: true,
            align: "center",
          },
        },
        {
          id: "c3",
          type: "label",
          name: "소개말",
          props: {
            text: "눌러서 인사를 받아 보세요",
            align: "center",
            textColor: "#e65387",
          },
        },
        {
          id: "c4",
          type: "divider",
          name: "구분선1",
          props: { padding: "sm" },
        },
        {
          id: "c5",
          type: "button",
          name: "인사버튼",
          props: { label: "안녕! 눌러 줘" },
        },
      ],
    },
  ],
  // 버튼 하나가 다른 부품의 글을 바꾸는, 가장 짧은 블록입니다.
  blocks: {
    events: [
      {
        id: "e1",
        componentId: "c5",
        event: "click",
        body: [
          {
            id: "a1",
            kind: "set-prop",
            target: "c3",
            prop: "text",
            value: { k: "text", v: "반가워요! 오늘도 좋은 하루 보내요." },
          },
        ],
      },
    ],
    variables: [],
  },
};

/* ------------------------------------------------------------------ */
/* 2차시 · 우리 반 설문판                                              */
/* ------------------------------------------------------------------ */

const CLASS_SURVEY: WebAppProject = {
  version: PROJECT_SCHEMA_VERSION,
  template: "blank",
  title: "우리 반 설문판",
  appName: "오늘 하루 어땠나요",
  subtitle: "점수를 옮기고 결과를 확인해요",
  accent: "#16a982",
  screenBackground: "#eefaf5",
  screens: [
    {
      id: "s1",
      name: "Screen1",
      children: [
        {
          id: "c1",
          type: "notice-card",
          name: "안내카드1",
          props: {
            title: "오늘 하루 점수",
            body: "막대를 옮겨 오늘 하루를 0점부터 10점까지 매겨 보세요. 아래 버튼을 누르면 결과가 나옵니다.",
          },
        },
        {
          id: "c2",
          type: "slider",
          name: "오늘점수",
          // 0~10점은 슬라이더의 기본값이라 따로 적지 않습니다.
          props: { label: "오늘 하루 점수" },
        },
        {
          id: "c3",
          type: "checkbox",
          name: "숙제체크",
          props: { label: "숙제를 다 했어요" },
        },
        {
          id: "c4",
          type: "switch",
          name: "도움스위치",
          props: { label: "선생님과 이야기하고 싶어요" },
        },
        {
          id: "c5",
          type: "button",
          name: "결과버튼",
          props: { label: "결과 보기" },
        },
        {
          id: "c6",
          type: "label",
          name: "결과글",
          props: {
            text: "버튼을 누르면 여기에 결과가 나와요",
            align: "center",
            bold: true,
            background: "#ffffff",
          },
        },
      ],
    },
  ],
  /*
   * 변수 하나와 조건 하나로 결과가 갈립니다. 학생이 처음 만나는 "만약 ~라면"을
   * 눈으로 확인할 수 있는 가장 작은 예입니다.
   */
  blocks: {
    events: [
      {
        id: "e1",
        componentId: "c5",
        event: "click",
        body: [
          {
            id: "a1",
            kind: "set-var",
            name: "점수",
            value: { k: "prop", target: "c2", prop: "value" },
          },
          {
            id: "a2",
            kind: "if",
            test: {
              k: "cmp",
              op: "≥",
              a: { k: "var", name: "점수" },
              b: { k: "num", v: 7 },
            },
            then: [
              {
                id: "a3",
                kind: "set-prop",
                target: "c6",
                prop: "text",
                value: {
                  k: "join",
                  parts: [
                    { k: "text", v: "오늘은 " },
                    { k: "var", name: "점수" },
                    { k: "text", v: "점! 좋은 하루였네요 🎉" },
                  ],
                },
              },
            ],
            otherwise: [
              {
                id: "a4",
                kind: "set-prop",
                target: "c6",
                prop: "text",
                value: {
                  k: "join",
                  parts: [
                    { k: "text", v: "오늘은 " },
                    { k: "var", name: "점수" },
                    { k: "text", v: "점이에요. 내일은 더 나아질 거예요." },
                  ],
                },
              },
            ],
          },
        ],
      },
    ],
    variables: [{ name: "점수", initial: { k: "num", v: 0 } }],
  },
};

/* ------------------------------------------------------------------ */
/* 3차시 · 학교 안내 도우미                                            */
/* ------------------------------------------------------------------ */

const SCHOOL_GUIDE: WebAppProject = {
  version: PROJECT_SCHEMA_VERSION,
  template: "blank",
  title: "학교 안내 도우미",
  appName: "우리 학교 안내",
  subtitle: "궁금한 것을 눌러서 찾아요",
  accent: "#3478f6",
  screenBackground: "#eef4ff",
  screens: [
    {
      id: "s1",
      name: "Screen1",
      children: [
        {
          id: "c1",
          type: "label",
          name: "제목글",
          props: {
            text: "무엇이 궁금한가요?",
            fontSize: "lg",
            bold: true,
            align: "center",
          },
        },
        // 가로 배치 안에 버튼 두 개를 나란히 넣습니다.
        {
          id: "c2",
          type: "row",
          name: "가로배치1",
          props: { gap: "sm" },
          children: [
            {
              id: "c3",
              type: "button",
              name: "급식버튼",
              props: { label: "오늘 급식" },
            },
            {
              id: "c4",
              type: "button",
              name: "시간표버튼",
              props: { label: "시간표" },
            },
          ],
        },
        {
          id: "c5",
          type: "notice-card",
          name: "안내카드1",
          props: {
            title: "안내",
            body: "위의 버튼을 눌러 보세요.",
          },
        },
        {
          id: "c6",
          type: "list",
          name: "장소목록",
          props: {
            title: "찾아가는 길",
            ordered: true,
            items: [
              { id: "p1", text: "1층 — 교무실, 보건실" },
              { id: "p2", text: "2층 — 1학년 교실, 도서실" },
              { id: "p3", text: "3층 — 과학실, 컴퓨터실" },
            ],
          },
        },
        {
          id: "c7",
          type: "chatbot",
          name: "챗봇1",
          props: {
            botName: "학교 도우미",
            greeting: "안녕하세요! 학교에 대해 궁금한 것을 골라 주세요.",
            fallback:
              "아직 답을 만들지 않은 질문이에요. 아래 질문 버튼 중 하나를 골라 주세요.",
            qa: [
              {
                id: "q1",
                label: "도서실 위치",
                response: "도서실은 2층 복도 끝에 있어요.",
                icon: "book" as const,
              },
              {
                id: "q2",
                label: "준비물",
                response: "내일은 체육복과 실내화를 챙겨 오세요.",
                icon: "backpack" as const,
              },
              {
                id: "q3",
                label: "하교 시간",
                response: "월·수·금은 3시 20분, 화·목은 4시 10분에 마쳐요.",
                icon: "home" as const,
              },
            ],
          },
        },
      ],
    },
  ],
  // 버튼 두 개가 같은 안내 카드를 서로 다르게 바꿉니다. 부품 간 상호작용입니다.
  blocks: {
    events: [
      {
        id: "e1",
        componentId: "c3",
        event: "click",
        body: [
          {
            id: "a1",
            kind: "set-prop",
            target: "c5",
            prop: "title",
            value: { k: "text", v: "오늘 급식" },
          },
          {
            id: "a2",
            kind: "set-prop",
            target: "c5",
            prop: "body",
            value: {
              k: "text",
              v: "현미밥, 된장국, 제육볶음, 김치, 요구르트",
            },
          },
        ],
      },
      {
        id: "e2",
        componentId: "c4",
        event: "click",
        body: [
          {
            id: "a3",
            kind: "set-prop",
            target: "c5",
            prop: "title",
            value: { k: "text", v: "오늘 시간표" },
          },
          {
            id: "a4",
            kind: "set-prop",
            target: "c5",
            prop: "body",
            value: { k: "text", v: "국어 · 수학 · 과학 · 체육 · 정보 · 창체" },
          },
        ],
      },
    ],
    variables: [],
  },
};


/* ------------------------------------------------------------------ */
/* 4차시 · 우리 반 알림장 (초등 40분 수업의 목표물)                     */
/* ------------------------------------------------------------------ */

/**
 * 초등 알림장 차시는 빈 웹앱에서 시작합니다. 이 예시는 학생이 따라 만들
 * 완성본이라, 수업에서 실제로 놓을 부품만 담고 챗봇 같은 오늘 안 만드는
 * 것은 넣지 않습니다. 시연이 곧 목표물이어야 하기 때문입니다.
 */
const NOTICE_BOARD: WebAppProject = {
  version: PROJECT_SCHEMA_VERSION,
  template: "blank",
  title: "우리 반 알림장",
  appName: "우리 반 알림장",
  subtitle: "오늘 알림과 내일 준비물을 한곳에",
  accent: "#6956e8",
  screenBackground: "#f4f2ff",
  screens: [
    {
      id: "s1",
      name: "Screen1",
      children: [
        {
          id: "c1",
          type: "label",
          name: "제목글",
          props: {
            text: "우리 반 알림장",
            fontSize: "lg",
            bold: true,
            align: "center",
          },
        },
        {
          id: "c2",
          type: "row",
          name: "가로배치1",
          props: { gap: "sm" },
          children: [
            {
              id: "c3",
              type: "button",
              name: "알림버튼",
              props: { label: "오늘 알림" },
            },
            {
              id: "c4",
              type: "button",
              name: "준비물버튼",
              props: { label: "내일 준비물" },
            },
          ],
        },
        {
          id: "c5",
          type: "notice-card",
          name: "안내카드1",
          props: {
            title: "알림판",
            body: "위의 버튼을 눌러 알림을 확인해 보세요.",
          },
        },
        {
          id: "c6",
          type: "checklist",
          name: "할일체크1",
          props: {
            title: "오늘 할 일",
            items: [
              { id: "t1", text: "알림장 확인하기" },
              { id: "t2", text: "수학 익힘책 42~43쪽" },
              { id: "t3", text: "가정통신문 부모님께 드리기" },
            ],
          },
        },
      ],
    },
  ],
  // 버튼 두 개가 같은 안내 카드를 서로 다르게 바꿉니다. 3차시와 같은 짜임이지만
  // 내용이 우리 반 알림이라, 초등 수업에서는 이쪽이 자기 일이 됩니다.
  blocks: {
    events: [
      {
        id: "e1",
        componentId: "c3",
        event: "click",
        body: [
          {
            id: "a1",
            kind: "set-prop",
            target: "c5",
            prop: "title",
            value: { k: "text", v: "오늘의 알림" },
          },
          {
            id: "a2",
            kind: "set-prop",
            target: "c5",
            prop: "body",
            value: {
              k: "text",
              v: "체험학습 동의서를 목요일까지 내 주세요. 수학 익힘책 42~43쪽이 숙제예요.",
            },
          },
        ],
      },
      {
        id: "e2",
        componentId: "c4",
        event: "click",
        body: [
          {
            id: "a3",
            kind: "set-prop",
            target: "c5",
            prop: "title",
            value: { k: "text", v: "내일 준비물" },
          },
          {
            id: "a4",
            kind: "set-prop",
            target: "c5",
            prop: "body",
            value: { k: "text", v: "과학 교과서, 필통과 색연필, 실내화" },
          },
        ],
      },
    ],
    variables: [],
  },
};

export const SAMPLES: Sample[] = [
  {
    id: "intro-card",
    order: 1,
    name: "나를 소개하는 카드",
    goal: "부품을 놓고 속성을 바꾼 뒤, 버튼에 블록 하나를 붙여 봅니다.",
    focus: ["사진", "글자", "구분선", "버튼", "블록 1개"],
    minutes: 45,
    project: INTRO_CARD,
  },
  {
    id: "class-survey",
    order: 2,
    name: "우리 반 설문판",
    goal: "입력 부품에서 값을 읽어, 변수와 조건으로 결과를 나눕니다.",
    focus: ["슬라이더", "체크박스", "스위치", "변수", "만약 ~라면"],
    minutes: 45,
    project: CLASS_SURVEY,
  },
  {
    id: "school-guide",
    order: 3,
    name: "학교 안내 도우미",
    goal: "배치 안에 부품을 넣고, 버튼 여러 개가 같은 카드를 바꾸게 합니다.",
    focus: ["가로 배치", "버튼 여러 개", "목록", "챗봇", "부품 간 상호작용"],
    minutes: 45,
    project: SCHOOL_GUIDE,
  },
  {
    id: "notice-board",
    order: 4,
    name: "우리 반 알림장",
    goal: "빈 웹앱에서 시작해, 우리 반의 진짜 알림을 담은 알림장을 조립합니다.",
    focus: ["빈 웹앱에서 시작", "안내 카드", "활동 체크", "버튼 두 개"],
    minutes: 40,
    project: NOTICE_BOARD,
  },
];

export function sampleById(id: string) {
  return SAMPLES.find((sample) => sample.id === id);
}
