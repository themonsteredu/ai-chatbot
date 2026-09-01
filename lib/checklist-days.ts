/**
 * 활동 체크를 날짜별로 나눠 담습니다.
 *
 * 할 일은 미리 적어 배포하는데, 쓰는 사람은 날마다 새로 시작합니다. 날짜가
 * 없으면 어제 체크한 것이 오늘도 체크된 채로 남고, 내일 할 일을 적어 두면 오늘
 * 목록에 섞여 버립니다. 그래서 체크와 직접 적은 할 일을 날짜별로 나눕니다.
 *
 * 날짜는 웹앱을 쓰는 기기의 시각으로 셉니다. 교실에서 쓰는 자정 기준이라 UTC를
 * 쓰면 오후 세 시부터 다음 날이 되어 버립니다.
 */

import type { ListItem } from "./project/types";

/** 하루치 기록입니다. */
export type DayEntry = { checked: string[]; custom: ListItem[] };

/** 날짜(2026-09-01) → 그날의 기록입니다. */
export type ChecklistDays = Record<string, DayEntry>;

/** 며칠치까지 들고 있을지입니다. 오래된 날은 저장 공간을 위해 버립니다. */
export const KEEP_DAYS = 60;

const pad = (value: number) => String(value).padStart(2, "0");

/** 저장 키로 쓰는 날짜입니다. */
export function dayKey(date: Date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const parseDay = (key: string) => {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
};

export const isDayKey = (value: unknown): value is string =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

/** 날짜를 하루씩 옮깁니다. 달과 해는 알아서 넘어갑니다. */
export function shiftDay(key: string, days: number) {
  const date = parseDay(key);
  date.setDate(date.getDate() + days);
  return dayKey(date);
}

/** 두 날짜가 며칠 떨어져 있는지입니다. */
export function daysBetween(from: string, to: string) {
  const gap = parseDay(to).getTime() - parseDay(from).getTime();
  return Math.round(gap / 86_400_000);
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** 학생이 읽는 날짜 이름입니다. 가까운 날은 말로 부릅니다. */
export function dayName(key: string, todayKey: string) {
  const gap = daysBetween(todayKey, key);
  if (gap === 0) return "오늘";
  if (gap === -1) return "어제";
  if (gap === 1) return "내일";
  const date = parseDay(key);
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAYS[date.getDay()]})`;
}

const asStrings = (value: unknown) =>
  Array.isArray(value) ? value.filter((one): one is string => typeof one === "string") : [];

const asItems = (value: unknown): ListItem[] =>
  Array.isArray(value)
    ? value
        .filter(
          (one): one is Record<string, unknown> =>
            Boolean(one) && typeof one === "object",
        )
        .map((one, index) => ({
          id: typeof one.id === "string" && one.id ? one.id : `my-${index + 1}`,
          text: typeof one.text === "string" ? one.text : "",
        }))
        .filter((one) => one.text)
    : [];

export const emptyDay = (): DayEntry => ({ checked: [], custom: [] });

/**
 * 저장해 둔 기록을 날짜별 모양으로 읽습니다.
 *
 * 날짜를 쓰기 전에 저장한 기록은 날짜가 없습니다. 그 기록은 오늘 것으로 봅니다.
 * 옮기지 않고 베껴 두어서, '날마다 새로 시작'을 다시 끄면 예전 목록이 그대로
 * 돌아옵니다.
 */
export function readDays(
  state: Record<string, unknown>,
  todayKey: string,
): ChecklistDays {
  const raw =
    state.days && typeof state.days === "object" && !Array.isArray(state.days)
      ? (state.days as Record<string, unknown>)
      : null;

  if (!raw) {
    const seeded: DayEntry = {
      checked: asStrings(state.checked),
      custom: asItems(state.custom),
    };
    return { [todayKey]: seeded };
  }

  const days: ChecklistDays = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!isDayKey(key) || !value || typeof value !== "object") continue;
    const entry = value as Record<string, unknown>;
    days[key] = { checked: asStrings(entry.checked), custom: asItems(entry.custom) };
  }
  if (!days[todayKey]) days[todayKey] = emptyDay();
  return days;
}

/** 그날의 기록입니다. 없으면 빈 하루를 돌려줍니다. */
export function dayOf(days: ChecklistDays, key: string): DayEntry {
  return days[key] ?? emptyDay();
}

/**
 * 하루치를 고쳐 넣습니다. 아무것도 적지 않은 날과 너무 오래된 날은 함께
 * 치웁니다. 기기 저장 공간이 캠프 사진과 한 칸을 나눠 쓰기 때문입니다.
 */
export function writeDay(
  days: ChecklistDays,
  key: string,
  entry: DayEntry,
  todayKey: string,
): ChecklistDays {
  const next: ChecklistDays = { ...days, [key]: entry };
  const out: ChecklistDays = {};
  for (const [day, value] of Object.entries(next)) {
    const empty = value.checked.length === 0 && value.custom.length === 0;
    // 오늘과 보고 있는 날은 비어 있어도 남겨 둡니다. 적는 중일 수 있습니다.
    if (empty && day !== todayKey && day !== key) continue;
    if (Math.abs(daysBetween(todayKey, day)) > KEEP_DAYS) continue;
    out[day] = value;
  }
  return out;
}
