import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import {
  DatabaseConfigurationError,
  getSupabase,
} from "@/lib/supabase/server";

const MAX_BODY_BYTES = 32_768;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RecordType = "journal" | "checklist" | "custom";

type RecordSubmission = {
  projectId: string;
  projectName: string;
  deviceId: string;
  studentName: string;
  recordType: RecordType;
  blockId: string;
  blockTitle: string;
  answers: Record<string, string>;
  checkedItems: string[];
  website?: string;
};

function isText(value: unknown, min: number, max: number): value is string {
  return (
    typeof value === "string" &&
    value.trim().length >= min &&
    value.trim().length <= max
  );
}

function isAnswers(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entries = Object.entries(value);
  return (
    entries.length <= 10 &&
    entries.every(
      ([key, answer]) =>
        isText(key, 1, 200) &&
        typeof answer === "string" &&
        answer.trim().length <= 2_000,
    )
  );
}

function isCheckedItems(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= 50 &&
    value.every((item) => isText(item, 1, 200))
  );
}

function parseSubmission(value: unknown): RecordSubmission | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Partial<RecordSubmission>;
  const recordTypes: RecordType[] = ["journal", "checklist", "custom"];

  if (
    !isText(input.projectId, 1, 120) ||
    !isText(input.projectName, 1, 120) ||
    !isText(input.deviceId, 1, 50) ||
    !UUID_PATTERN.test(input.deviceId) ||
    !isText(input.studentName, 1, 50) ||
    !input.recordType ||
    !recordTypes.includes(input.recordType) ||
    !isText(input.blockId, 1, 120) ||
    !isText(input.blockTitle, 1, 120) ||
    !isAnswers(input.answers) ||
    !isCheckedItems(input.checkedItems)
  ) {
    return null;
  }

  return {
    projectId: input.projectId.trim(),
    projectName: input.projectName.trim(),
    deviceId: input.deviceId,
    studentName: input.studentName.trim(),
    recordType: input.recordType,
    blockId: input.blockId.trim(),
    blockTitle: input.blockTitle.trim(),
    answers: Object.fromEntries(
      Object.entries(input.answers).map(([key, answer]) => [
        key.trim(),
        answer.trim(),
      ]),
    ),
    checkedItems: input.checkedItems.map((item) => item.trim()),
    website: input.website,
  };
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { ok: false, error: "요청 내용이 너무 큽니다." },
      { status: 413 },
    );
  }

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== request.nextUrl.host) {
        return NextResponse.json(
          { ok: false, error: "허용되지 않은 요청입니다." },
          { status: 403 },
        );
      }
    } catch {
      return NextResponse.json(
        { ok: false, error: "올바르지 않은 요청입니다." },
        { status: 400 },
      );
    }
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "JSON 형식을 확인해 주세요." },
      { status: 400 },
    );
  }

  const submission = parseSubmission(rawBody);
  if (!submission) {
    return NextResponse.json(
      { ok: false, error: "기록 내용을 확인해 주세요." },
      { status: 400 },
    );
  }

  // A hidden honeypot field quietly accepts automated spam without saving it.
  if (submission.website) {
    return NextResponse.json({ ok: true });
  }

  try {
    const { error } = await getSupabase().from("camp_records").insert({
      id: randomUUID(),
      project_id: submission.projectId,
      project_name: submission.projectName,
      device_id: submission.deviceId,
      student_name: submission.studentName,
      record_type: submission.recordType,
      block_id: submission.blockId,
      block_title: submission.blockTitle,
      answers: submission.answers,
      checked_items: submission.checkedItems,
    });

    if (error) {
      console.error("Supabase record insert failed", {
        code: error.code,
        message: error.message,
      });
      return NextResponse.json(
        { ok: false, error: "캠프 DB에 기록하지 못했습니다." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof DatabaseConfigurationError) {
      return NextResponse.json(
        { ok: false, error: "캠프 DB 연결 설정이 필요합니다." },
        { status: 503 },
      );
    }

    console.error("Unexpected record insert error", error);
    return NextResponse.json(
      { ok: false, error: "캠프 DB 연결 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
