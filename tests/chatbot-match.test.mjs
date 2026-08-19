import assert from "node:assert/strict";
import test from "node:test";
import { matchQuestion } from "../lib/chatbot-match.ts";

const questions = [
  { id: "q1", label: "오늘 숙제", response: "수학 익힘책 42쪽", icon: "book" },
  { id: "q2", label: "내일 준비물", response: "과학 교과서", icon: "backpack" },
  { id: "q3", label: "가정통신문", response: "목요일까지 내요", icon: "home" },
];

const answer = (asked) => matchQuestion(asked, questions)?.response;

test("finds the question the student typed word for word", () => {
  assert.equal(answer("오늘 숙제"), "수학 익힘책 42쪽");
  assert.equal(answer("오늘숙제?"), "수학 익힘책 42쪽");
  assert.equal(answer("가정통신문"), "목요일까지 내요");
});

test("finds it from part of the label too", () => {
  // 예전에는 등록한 낱말이 전부 들어 있어야 찾아서, "숙제"만 물으면 못 찾았습니다.
  assert.equal(answer("숙제"), "수학 익힘책 42쪽");
  assert.equal(answer("숙제 뭐야?"), "수학 익힘책 42쪽");
  assert.equal(answer("준비물 알려 줘"), "과학 교과서");
});

test("picks the question that overlaps most", () => {
  assert.equal(answer("내일 준비물이 뭐예요"), "과학 교과서");
  assert.equal(answer("오늘 숙제 있어요?"), "수학 익힘책 42쪽");
});

test("still gives up rather than answering the wrong thing", () => {
  assert.equal(matchQuestion("점심 메뉴", questions), undefined);
  assert.equal(matchQuestion("체육 시간", questions), undefined);
  assert.equal(matchQuestion("", questions), undefined);
  assert.equal(matchQuestion("숙제", []), undefined);
});

test("ignores questions whose label is too short to match on", () => {
  // 한 글자짜리 낱말은 아무 데나 걸리기 쉬워 세지 않습니다.
  assert.equal(matchQuestion("가", [{ id: "q", label: "가", response: "답", icon: "message" }])?.response, "답");
  assert.equal(matchQuestion("나", [{ id: "q", label: "가", response: "답", icon: "message" }]), undefined);
});
