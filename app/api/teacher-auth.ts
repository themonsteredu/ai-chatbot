import { createHash, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

/**
 * 학생 이름·사진·작품이 오가는 요청에 쓰는 교사 코드 확인입니다.
 *
 * 답안지 라우트와 달리 여기에는 기본 코드가 없습니다. 반 명단과 캠프 사진은
 * 널리 알려진 기본값으로 열려서는 안 되기 때문에, 코드를 등록하지 않은 배포에서는
 * 교사 전용 요청을 아예 받지 않고 무엇을 설정해야 하는지 알려 줍니다.
 */

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

function sameCode(input: string, expected: string) {
  // 길이가 달라도 비교 시간이 같도록 해시로 맞춘 뒤 비교합니다.
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

/**
 * 수업 자료(지도안·활동지 예시 답안)를 여는 코드입니다. 학생 이름이나 사진이
 * 아니라 가르치는 자료라, 아무것도 설정하지 않아도 바로 쓸 수 있게 기본값을
 * 둡니다. 소스에 적혀 있으므로 학생이 알아낼 수 있다는 점은 감안해야 합니다.
 * 진짜로 가려야 하면 TEACHER_ADMIN_CODE를 설정해 주세요.
 */
export const DEFAULT_LESSON_CODE = "3035";

export function readTeacherCodes() {
  // TEACHER_ACCESS_CODE는 운영자 코드만 있던 시절의 이름이라 계속 인정합니다.
  const admin = (
    process.env.TEACHER_ADMIN_CODE ??
    process.env.TEACHER_ACCESS_CODE ??
    ""
  ).trim();
  const instructor = (process.env.TEACHER_INSTRUCTOR_CODE ?? "").trim();
  return [admin, instructor].filter(Boolean);
}

export type TeacherCheck =
  | { ok: true }
  | { ok: false; message: string; status: number };

/**
 * 수업 자료용 확인입니다. 설정한 코드가 있으면 그것도 받고, 없으면 기본 코드로
 * 엽니다. 학생 데이터를 다루는 `checkTeacherCode`와 달리 막아 두지 않습니다.
 */
export function checkLessonCode(
  request: NextRequest,
  code: string,
): TeacherCheck {
  const codes = [...readTeacherCodes(), DEFAULT_LESSON_CODE];
  return verify(request, code, codes);
}

export function checkTeacherCode(
  request: NextRequest,
  code: string,
): TeacherCheck {
  const codes = readTeacherCodes();
  if (codes.length === 0) {
    return {
      ok: false,
      status: 503,
      message:
        "교사 코드가 아직 등록되지 않았습니다. 배포 환경 변수 TEACHER_ADMIN_CODE 또는 TEACHER_INSTRUCTOR_CODE를 설정해 주세요.",
    };
  }
  return verify(request, code, codes);
}

function verify(
  request: NextRequest,
  code: string,
  codes: string[],
): TeacherCheck {
  const key = clientKey(request);
  const now = Date.now();
  const record = attempts.get(key);
  if (record && now > record.until) attempts.delete(key);
  if (record && now <= record.until && record.count >= MAX_ATTEMPTS) {
    return {
      ok: false,
      status: 429,
      message: "교사 코드를 여러 번 틀렸습니다. 5분 뒤에 다시 시도해 주세요.",
    };
  }

  // 코드 개수만큼 항상 비교해서, 몇 번째에서 맞았는지가 시간으로 새지 않게 합니다.
  let matched = false;
  for (const expected of codes) {
    if (sameCode(code, expected)) matched = true;
  }

  if (matched) {
    attempts.delete(key);
    return { ok: true };
  }

  const failure = attempts.get(key);
  if (!failure || now > failure.until) {
    attempts.set(key, { count: 1, until: now + LOCKOUT_MS });
  } else {
    failure.count += 1;
    failure.until = now + LOCKOUT_MS;
  }
  return { ok: false, status: 401, message: "교사 코드가 올바르지 않습니다." };
}
