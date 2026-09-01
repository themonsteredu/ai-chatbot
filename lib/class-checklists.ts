/**
 * 학생이 보낸 날짜별 할 일을 선생님 화면에서 읽는 모양으로 정리합니다.
 *
 * 보내는 쪽(활동 체크 부품)과 보는 쪽(반 현황 화면)이 같은 모양을 써야 해서, 두
 * 화면이 함께 쓰는 이 자리에 둡니다. 서버에서 온 값은 믿지 않고 하나씩 확인해
 * 담습니다.
 */

import { isDayKey, type ChecklistDays, type DayEntry } from "./checklist-days";
import type { ListItem } from "./project/types";

/** 활동 체크 하나가 보내는 내용입니다. */
export type ChecklistReport = {
  /** 부품에 적어 둔 목록 이름입니다. */
  title: string;
  /** 미리 적어 배포한 항목입니다. 날마다 그대로 다시 나옵니다. */
  items: ListItem[];
  /** 날짜별 체크와 직접 적은 할 일입니다. */
  days: ChecklistDays;
};

/** 한 학생이 보낸 기록입니다. 활동 체크를 여러 개 놓을 수 있어 부품별로 담습니다. */
export type ChecklistRecord = {
  studentName: string;
  lists: Record<string, ChecklistReport>;
};

/** 그날 한 학생이 무엇을 했는지 한 줄입니다. */
export type DayLine = {
  studentName: string;
  title: string;
  done: number;
  total: number;
  items: Array<{ text: string; done: boolean; own: boolean }>;
};

const asItems = (value: unknown): ListItem[] =>
  Array.isArray(value)
    ? value
        .filter(
          (one): one is Record<string, unknown> =>
            Boolean(one) && typeof one === "object",
        )
        .map((one, index) => ({
          id: typeof one.id === "string" && one.id ? one.id : `item-${index + 1}`,
          text: typeof one.text === "string" ? one.text : "",
        }))
        .filter((one) => one.text)
    : [];

const asDays = (value: unknown): ChecklistDays => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const days: ChecklistDays = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (!isDayKey(key) || !entry || typeof entry !== "object") continue;
    const one = entry as Record<string, unknown>;
    days[key] = {
      checked: Array.isArray(one.checked)
        ? one.checked.filter((id): id is string => typeof id === "string")
        : [],
      custom: asItems(one.custom),
    };
  }
  return days;
};

/** 서버에서 받은 기록 하나를 읽습니다. 읽을 수 없으면 null입니다. */
export function readChecklistRecord(raw: {
  studentName?: unknown;
  record?: unknown;
}): ChecklistRecord | null {
  const studentName =
    typeof raw.studentName === "string" ? raw.studentName.trim() : "";
  const lists = (raw.record as { lists?: unknown } | null)?.lists;
  if (!studentName || !lists || typeof lists !== "object") return null;

  const out: Record<string, ChecklistReport> = {};
  for (const [nodeId, value] of Object.entries(lists as Record<string, unknown>)) {
    if (!value || typeof value !== "object") continue;
    const report = value as Record<string, unknown>;
    out[nodeId] = {
      title: typeof report.title === "string" ? report.title : "할 일",
      items: asItems(report.items),
      days: asDays(report.days),
    };
  }
  return Object.keys(out).length > 0 ? { studentName, lists: out } : null;
}

export function readChecklistRecords(
  raw: Array<{ studentName?: unknown; record?: unknown }>,
) {
  return raw
    .map(readChecklistRecord)
    .filter((one): one is ChecklistRecord => one !== null);
}

/** 반 전체 기록에 들어 있는 날짜입니다. 최근 날짜가 앞에 옵니다. */
export function collectDays(records: ChecklistRecord[]) {
  const days = new Set<string>();
  for (const record of records) {
    for (const list of Object.values(record.lists)) {
      for (const day of Object.keys(list.days)) days.add(day);
    }
  }
  return [...days].sort().reverse();
}

const emptyEntry: DayEntry = { checked: [], custom: [] };

/**
 * 그날 반 아이들이 무엇을 했는지 한 줄씩 만듭니다.
 *
 * 아무것도 하지 않은 학생도 0으로 남깁니다. 누가 아직 안 했는지가 선생님에게는
 * 더 중요한 정보입니다.
 */
export function summarizeDay(records: ChecklistRecord[], day: string) {
  const lines: DayLine[] = [];
  for (const record of records) {
    for (const list of Object.values(record.lists)) {
      const entry = list.days[day] ?? emptyEntry;
      const all = [
        ...list.items.map((item) => ({ ...item, own: false })),
        ...entry.custom.map((item) => ({ ...item, own: true })),
      ];
      lines.push({
        studentName: record.studentName,
        title: list.title,
        done: all.filter((item) => entry.checked.includes(item.id)).length,
        total: all.length,
        items: all.map((item) => ({
          text: item.text,
          done: entry.checked.includes(item.id),
          own: item.own,
        })),
      });
    }
  }
  return lines.sort(
    (a, b) =>
      a.studentName.localeCompare(b.studentName) || a.title.localeCompare(b.title),
  );
}
