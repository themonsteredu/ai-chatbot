/**
 * 학생이 등록한 질문 가운데 비슷한 것을 찾습니다.
 *
 * 외부 생성형 AI는 쓰지 않습니다. 학생이 직접 적은 질문과 답만으로 움직이고,
 * 찾지 못하면 학생이 정한 안내 문구를 보여 줍니다.
 */

import type { QaItem } from "./project/types";

const tokenize = (value: string) =>
  value
    .toLocaleLowerCase()
    .replace(/[?!.,]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);

export function matchQuestion(question: string, questions: QaItem[]) {
  const questionTokens = tokenize(question);
  const normalize = (value: string) =>
    value.toLocaleLowerCase().replace(/[?!.,\s]/g, "");
  const normalizedQuestion = normalize(question);

  // 똑같이 적었으면 두말할 것 없이 그 질문입니다.
  const exact = questions.find(
    (item) => normalize(item.label) === normalizedQuestion,
  );
  if (exact) return exact;

  /*
   * 예전에는 등록한 질문의 낱말이 **전부** 들어 있어야 찾았습니다. 그래서
   * "오늘 숙제"라고 등록해 두면 학생이 "숙제"라고만 물었을 때 답을 못 찾았습니다.
   * 이제는 겹치는 낱말이 가장 많은 질문을 고릅니다. 하나도 안 겹치면 여전히
   * 찾지 못한 것으로 두어, 엉뚱한 답이 나오지 않게 합니다.
   */
  let best: QaItem | undefined;
  let bestScore = 0;

  for (const item of questions) {
    const labelTokens = tokenize(item.label);
    if (labelTokens.length === 0) continue;

    const hits = labelTokens.filter((label) =>
      questionTokens.some(
        (token) => label.includes(token) || token.includes(label),
      ),
    ).length;
    if (hits === 0) continue;

    // 등록한 낱말이 몇 개나 맞았는지를 봅니다. 짧은 질문이 괜히 유리해지지
    // 않도록 맞은 개수도 함께 셉니다.
    const score = hits / labelTokens.length + hits / 100;
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }

  return best;
}
