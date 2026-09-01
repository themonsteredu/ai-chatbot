import assert from "node:assert/strict";
import test from "node:test";
import {
  collectDays,
  readChecklistRecord,
  readChecklistRecords,
  summarizeDay,
} from "../lib/class-checklists.ts";

const record = (studentName, days) => ({
  studentName,
  record: {
    lists: {
      c1: {
        title: "나의 할 일",
        items: [
          { id: "check-1", text: "알림장 확인" },
          { id: "check-2", text: "독서록 쓰기" },
        ],
        days,
      },
    },
  },
});

test("reads only what a class record is supposed to hold", () => {
  const one = readChecklistRecord(
    record("김하늘", {
      "2026-09-01": { checked: ["check-1"], custom: [{ id: "my-1", text: "리코더" }] },
      어제: { checked: ["check-2"] },
    }),
  );

  assert.equal(one.studentName, "김하늘");
  assert.deepEqual(Object.keys(one.lists.c1.days), ["2026-09-01"]);
  assert.equal(one.lists.c1.items.length, 2);

  // 이름이나 목록이 없으면 읽지 않습니다.
  assert.equal(readChecklistRecord({ studentName: "", record: { lists: {} } }), null);
  assert.equal(readChecklistRecord({ studentName: "김하늘", record: null }), null);
  assert.equal(readChecklistRecords([{ studentName: "김하늘" }]).length, 0);
});

test("lists the days a class has sent, newest first", () => {
  const records = readChecklistRecords([
    record("김하늘", { "2026-09-01": { checked: [] }, "2026-09-03": { checked: [] } }),
    record("이바다", { "2026-09-02": { checked: [] }, "2026-09-03": { checked: [] } }),
  ]);

  assert.deepEqual(collectDays(records), ["2026-09-03", "2026-09-02", "2026-09-01"]);
});

test("shows one line per student for the day the teacher picked", () => {
  const records = readChecklistRecords([
    record("김하늘", {
      "2026-09-01": {
        checked: ["check-1", "my-1"],
        custom: [{ id: "my-1", text: "리코더 가져오기" }],
      },
    }),
    // 그날 아무것도 하지 않은 학생입니다.
    record("이바다", { "2026-09-02": { checked: ["check-1"] } }),
  ]);

  const lines = summarizeDay(records, "2026-09-01");
  assert.deepEqual(
    lines.map((line) => `${line.studentName} ${line.done}/${line.total}`),
    ["김하늘 2/3", "이바다 0/2"],
  );

  // 직접 적은 할 일은 따로 표시해 선생님이 구분할 수 있게 합니다.
  const own = lines[0].items.filter((item) => item.own);
  assert.deepEqual(own, [{ text: "리코더 가져오기", done: true, own: true }]);
  assert.deepEqual(
    lines[0].items.map((item) => item.done),
    [true, false, true],
  );
});
