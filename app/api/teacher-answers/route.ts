import { createHash, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { renderAnswerKeyHtml } from "./render";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;

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

function matchesCode(input: string, expected: string) {
  // 길이가 달라도 비교 시간이 같도록 해시로 맞춘 뒤 비교합니다.
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

function fail(message: string, status: number) {
  return Response.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  const expected = process.env.TEACHER_ACCESS_CODE?.trim();
  if (!expected) {
    return fail(
      "교사 코드가 아직 설정되지 않았습니다. 배포 환경 변수 TEACHER_ACCESS_CODE를 등록한 뒤 다시 시도해 주세요.",
      503,
    );
  }

  const now = Date.now();
  const key = clientKey(request);
  if (isLockedOut(key, now)) {
    return fail(
      "코드를 여러 번 잘못 입력했습니다. 5분 뒤에 다시 시도해 주세요.",
      429,
    );
  }

  let code = "";
  try {
    const body = await request.json();
    if (typeof body?.code === "string") code = body.code.trim();
  } catch {
    return fail("요청 형식이 올바르지 않습니다.", 400);
  }

  if (!code || !matchesCode(code, expected)) {
    recordFailure(key, now);
    return fail("교사 코드가 올바르지 않습니다.", 401);
  }

  attempts.delete(key);

  const generatedAt = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "long",
  }).format(new Date(now));

  return new Response(renderAnswerKeyHtml(generatedAt), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="teacher-answer-key.html"; filename*=UTF-8\'\'%EA%B5%90%EC%82%AC%EC%9A%A9-%EC%98%88%EC%8B%9C-%EB%8B%B5%EC%95%88.html',
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
