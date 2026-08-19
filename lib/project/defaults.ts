/**
 * 시작 예시입니다. v3 시절과 같은 세 가지를 그대로 두되, 이제 부품 트리로 씁니다.
 * 수업에서 쓰던 예시가 그대로 열려야 하기 때문에 글과 색은 건드리지 않았습니다.
 */

import type { ComponentNode, TemplateId, WebAppProject } from "./types";
import { PROJECT_SCHEMA_VERSION } from "./types";

const screen = (children: ComponentNode[]) => [
  { id: "s1", name: "Screen1", children },
];

export const BLANK_PROJECT: WebAppProject = {
  version: PROJECT_SCHEMA_VERSION,
  template: "blank",
  title: "나만의 웹앱",
  appName: "나만의 웹앱",
  subtitle: "내 아이디어를 화면에 담아 보세요",
  accent: "#6956e8",
  screenBackground: "#f4f2ff",
  screens: screen([]),
  blocks: { events: [], variables: [] },
};

export const CAMP_PROJECT: WebAppProject = {
  version: PROJECT_SCHEMA_VERSION,
  template: "camp",
  title: "3일 캠프 활동 기록",
  appName: "나의 3일 캠프 기록",
  subtitle: "하루 4차시, 배움과 사진을 차곡차곡",
  accent: "#3478f6",
  screenBackground: "#eef5ff",
  screens: screen([
    {
      id: "c1",
      type: "notice-card",
      name: "안내카드1",
      props: {
        title: "나의 캠프 기록 방법",
        body: "매 차시가 끝날 때 활동 내용, 사진, 느낀 점을 남겨요. 3일차에는 전체 소감을 쓰고 보고서를 인쇄할 수 있어요.",
      },
    },
    {
      id: "c2",
      type: "camp-report",
      name: "캠프기록1",
      props: { title: "나의 3일 캠프 활동 보고서" },
    },
  ]),
  blocks: { events: [], variables: [] },
};

export const NOTICE_PROJECT: WebAppProject = {
  version: PROJECT_SCHEMA_VERSION,
  template: "notice",
  title: "우리 반 알림장",
  appName: "우리 반 알림장",
  subtitle: "오늘도 차근차근, 우리 반 하루",
  accent: "#6956e8",
  screenBackground: "#f4f2ff",
  screens: screen([
    {
      id: "c1",
      type: "notice-card",
      name: "안내카드1",
      props: {
        title: "오늘의 알림",
        body: "수학 익힘책 42~43쪽을 풀고, 체험학습 동의서는 목요일까지 제출해 주세요.",
      },
    },
    {
      id: "c2",
      type: "checklist",
      name: "활동체크1",
      props: {
        title: "내일 준비물",
        items: [
          { id: "science-book", text: "과학 교과서" },
          { id: "pencil-case", text: "필통과 색연필" },
          { id: "school-letter", text: "가정통신문" },
        ],
      },
    },
    {
      id: "c3",
      type: "journal",
      name: "나의기록1",
      props: {
        title: "오늘의 한 줄",
        prompt: "오늘 가장 기억에 남는 일을 적어 보세요.",
      },
    },
    {
      id: "c4",
      type: "button",
      name: "버튼1",
      props: { label: "오늘 알림 확인 완료" },
    },
    {
      id: "c5",
      type: "chatbot",
      name: "챗봇1",
      props: {
        botName: "알림장 도우미",
        greeting: "안녕하세요! 궁금한 내용을 골라 주세요.",
        fallback:
          "이 챗봇을 만든 학생이 아직 답을 등록하지 않은 질문이에요. 아래 질문 버튼 중 하나를 골라 주세요.",
        qa: [
          {
            id: "homework",
            label: "오늘 숙제",
            response: "오늘 숙제는 수학 익힘책 42~43쪽과 국어 낱말 정리예요.",
            icon: "book" as const,
          },
          {
            id: "supplies",
            label: "내일 준비물",
            response: "내일은 과학 교과서, 필통, 색연필을 챙겨 오세요.",
            icon: "backpack" as const,
          },
          {
            id: "parent-note",
            label: "가정통신문",
            response: "체험학습 참가 동의서를 목요일까지 제출해 주세요.",
            icon: "home" as const,
          },
        ],
      },
    },
  ]),
  // 알림장의 버튼은 예전부터 안내를 띄웠습니다. 이제 진짜 블록으로 들어 있어서
  // 학생이 블록 화면에서 바로 고쳐 볼 수 있습니다.
  blocks: {
    events: [
      {
        id: "e1",
        componentId: "c4",
        event: "click",
        body: [
          {
            id: "a1",
            kind: "show-message",
            value: { k: "text", v: "좋아요! 오늘 알림을 모두 확인했어요." },
          },
        ],
      },
    ],
    variables: [],
  },
};

export const DEFAULT_PROJECT = BLANK_PROJECT;

export const PROJECT_TEMPLATES: Array<{
  id: TemplateId;
  name: string;
  hint: string;
  project: WebAppProject;
}> = [
  {
    id: "blank",
    name: "빈 웹앱",
    hint: "아무 기능 없이 시작",
    project: BLANK_PROJECT,
  },
  {
    id: "camp",
    name: "3일 캠프 기록",
    hint: "12차시·사진·소감·인쇄",
    project: CAMP_PROJECT,
  },
  {
    id: "notice",
    name: "우리 반 알림장",
    hint: "알림·준비물·기록·챗봇",
    project: NOTICE_PROJECT,
  },
];

export const ACTION_ICON_LABELS: Array<{
  value: "book" | "backpack" | "home" | "sparkles" | "heart" | "message";
  label: string;
}> = [
  { value: "book", label: "책" },
  { value: "backpack", label: "가방" },
  { value: "home", label: "가정" },
  { value: "sparkles", label: "배움" },
  { value: "heart", label: "마음" },
  { value: "message", label: "대화" },
];
