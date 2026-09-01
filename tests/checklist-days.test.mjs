import assert from "node:assert/strict";
import test from "node:test";
import {
  KEEP_DAYS,
  dayKey,
  dayName,
  dayOf,
  daysBetween,
  readDays,
  shiftDay,
  writeDay,
} from "../lib/checklist-days.ts";

test("names days by the device's own midnight, not UTC", () => {
  // 한국은 UTC보다 아홉 시간 빨라서, UTC로 세면 오후 세 시부터 다음 날이 됩니다.
  assert.equal(dayKey(new Date(2026, 8, 1, 23, 30)), "2026-09-01");
  assert.equal(dayKey(new Date(2026, 8, 1, 0, 1)), "2026-09-01");
});

test("steps a day at a time across months and years", () => {
  assert.equal(shiftDay("2026-09-01", -1), "2026-08-31");
  assert.equal(shiftDay("2026-12-31", 1), "2027-01-01");
  assert.equal(daysBetween("2026-09-01", "2026-09-04"), 3);
  assert.equal(daysBetween("2026-09-01", "2026-08-30"), -2);
});

test("calls the days around today by name", () => {
  const today = "2026-09-01";
  assert.equal(dayName(today, today), "오늘");
  assert.equal(dayName("2026-08-31", today), "어제");
  assert.equal(dayName("2026-09-02", today), "내일");
  assert.equal(dayName("2026-09-04", today), "9월 4일 (금)");
});

test("takes records kept before there were days as today's", () => {
  const today = "2026-09-01";
  const days = readDays(
    { checked: ["check-1"], custom: [{ id: "my-1", text: "리코더 가져오기" }] },
    today,
  );

  assert.deepEqual(days[today].checked, ["check-1"]);
  assert.equal(days[today].custom[0].text, "리코더 가져오기");
  // 옮기지 않고 베껴 두어야, 스위치를 다시 끄면 예전 목록이 돌아옵니다.
});

test("keeps each day's checks and to-dos apart", () => {
  const today = "2026-09-01";
  const tomorrow = "2026-09-02";
  let days = readDays({}, today);

  days = writeDay(days, today, { checked: ["check-1"], custom: [] }, today);
  days = writeDay(
    days,
    tomorrow,
    { checked: [], custom: [{ id: "my-1", text: "독서록 쓰기" }] },
    today,
  );

  assert.deepEqual(days[today].checked, ["check-1"]);
  assert.deepEqual(days[today].custom, []);
  assert.deepEqual(days[tomorrow].checked, []);
  assert.equal(days[tomorrow].custom[0].text, "독서록 쓰기");
  // 저장했다 다시 읽어도 그대로여야 합니다.
  assert.deepEqual(readDays({ days }, today), days);
});

test("drops empty and long-past days so storage stays small", () => {
  const today = "2026-09-01";
  const old = shiftDay(today, -(KEEP_DAYS + 1));
  const yesterday = shiftDay(today, -1);

  const days = writeDay(
    {
      [old]: { checked: ["check-1"], custom: [] },
      [yesterday]: { checked: [], custom: [] },
    },
    today,
    { checked: ["check-2"], custom: [] },
    today,
  );

  assert.deepEqual(Object.keys(days), [today]);
  assert.equal(dayOf(days, yesterday).checked.length, 0);
});

test("ignores anything that is not a day", () => {
  const today = "2026-09-01";
  const days = readDays(
    { days: { 어제: { checked: ["x"] }, "2026-09-01": { checked: ["check-1"] } } },
    today,
  );

  assert.deepEqual(Object.keys(days), [today]);
  assert.deepEqual(days[today].checked, ["check-1"]);
});
