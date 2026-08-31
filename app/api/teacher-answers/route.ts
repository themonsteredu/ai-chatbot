import { createHash, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { DEFAULT_TEACHER_PIN } from "../teacher-auth";
import { renderAnswerKeyHtml } from "./render";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;

/**
 * 강사 코드를 따로 등록하지 않았을 때 쓰는 값입니다. 교사용 화면 전체가 같은
 * 번호를 쓰도록 `teacher-auth`의 기본 PIN을 그대로 씁니다.
 */
export const DEFAULT_INSTRUCTOR_CODE = DEFAULT_TEACHER_PIN;

type Role = "admin" | "instructor";

/**
 * 서버 인스턴스 안에서만 유지되는 시도 횟수입니다. 서버리스에서는 인스턴스가
 * 여러 개일 수 있어 완전한 차단은 아니고, 한 사람이 빠르게 반복해서 찍어 보는
 * 것을 늦추는 용도입니다.
 */
const attempts = new Map<string, { count: number; until: number }>();

function clientKey(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

function isLockedOut(key: string, now: number) {
  const record = attempts.get(key);
  if (!record) return false;
  if (now > record.until) {
    attempts.delete(key);
    return false;
  }
  return record.count >= MAX_ATTEMPTS;
}

function recordFailure(key: string, now: number) {
  const record = attempts.get(key);
  if (!record || now > record.until) {
    attempts.set(key, { count: 1, until: now + LOCKOUT_MS });
    return;
  }
  record.count += 1;
  record.until = now + LOCKOUT_MS;
}

function sameCode(input: string, expected: string) {
  // 길이가 달라도 비교 시간이 같도록 해시로 맞춘 뒤 비교합니다.
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

function readCodes() {
  // TEACHER_ACCESS_CODE는 운영자 코드만 있던 시절의 이름이라 계속 인정합니다.
  const admin = (
    process.env.TEACHER_ADMIN_CODE ??
    process.env.TEACHER_ACCESS_CODE ??
    ""
  ).trim();
  const instructor = (
    process.env.TEACHER_INSTRUCTOR_CODE ?? DEFAULT_INSTRUCTOR_CODE
  ).trim();
  return { admin, instructor };
}

function resolveRole(code: string, codes: ReturnType<typeof readCodes>) {
  // 운영자 코드를 먼저 확인합니다. 두 코드가 같게 설정되면 운영자로 봅니다.
  if (codes.admin && sameCode(code, codes.admin)) return "admin" as Role;
  if (codes.instructor && sameCode(code, codes.instructor)) {
    return "instructor" as Role;
  }
  // 기본 PIN은 다른 교사 화면과 같은 규칙으로 언제나 강사로 엽니다. 강사
  // 코드를 다른 번호로 등록해도 기본 PIN이 막히지 않게 따로 확인합니다.
  if (sameCode(code, DEFAULT_INSTRUCTOR_CODE)) return "instructor" as Role;
  return null;
}

function fail(message: string, status: number) {
  return Response.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  // 운영자 코드를 등록하지 않아도 강사 코드(기본 PIN)로 예시 답안을 볼 수
  // 있습니다. 학교가 따로 설정하지 않고도 수업 자료를 쓸 수 있어야 합니다.
  const codes = readCodes();
  const now = Date.now();
  const key = clientKey(request);
  if (isLockedOut(key, now)) {
    return fail(
      "코드를 여러 번 잘못 입력했습니다. 5분 뒤에 다시 시도해 주세요.",
      429,
    );
  }

  let code = "";
  let action = "check";
  try {
    const body = await request.json();
    if (typeof body?.code === "string") code = body.code.trim();
    if (body?.action === "download") action = "download";
  } catch {
    return fail("요청 형식이 올바르지 않습니다.", 400);
  }

  const role = code ? resolveRole(code, codes) : null;
  if (!role) {
    recordFailure(key, now);
    return fail("코드가 올바르지 않습니다.", 401);
  }

  attempts.delete(key);

  if (action === "check") {
    return Response.json(
      {
        role,
        // 강사 코드는 운영자에게만 알려 줍니다. 잊어버렸을 때 확인하는 용도입니다.
        instructorCode: role === "admin" ? codes.instructor : undefined,
        instructorCodeIsDefault:
          role === "admin"
            ? codes.instructor === DEFAULT_INSTRUCTOR_CODE
            : undefined,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const generatedAt = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "long",
  }).format(new Date(now));

  return new Response(renderAnswerKeyHtml(generatedAt), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": 'attachment; filename="teacher-answer-key.html"',
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
