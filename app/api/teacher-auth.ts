import { createHash, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

/**
 * 교사용 요청에 쓰는 PIN 확인입니다.
 *
 * 배포 환경 변수에 코드를 등록하면 **그 코드만** 받습니다. 아무것도 등록하지
 * 않은 배포에서는 기본 PIN으로 엽니다. 학교에서 따로 설정하지 않고도 바로 쓸 수
 * 있어야 하기 때문입니다.
 *
 * 기본 PIN은 소스에 적혀 있어 마음먹은 학생은 알아낼 수 있습니다. 반 명단과
 * 캠프 사진까지 확실히 가리려면 TEACHER_ADMIN_CODE를 등록해 주세요. 등록하는
 * 순간 기본 PIN은 더 이상 통하지 않습니다. 지금 기본 PIN으로 열리고 있으면
 * 반 명단 화면 위에 그 사실을 띄웁니다.
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

/** 아무것도 등록하지 않은 배포에서 쓰는 기본 PIN입니다. */
export const DEFAULT_TEACHER_PIN = "3035";

/** 배포 환경 변수에 등록한 코드입니다. 없으면 빈 배열입니다. */
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

/**
 * 실제로 받아 줄 코드입니다. 등록한 것이 하나라도 있으면 기본 PIN은 빠집니다.
 * 학교가 자기 코드를 정한 순간부터 널리 알려진 번호로는 열리지 않아야 합니다.
 */
export function activeTeacherCodes() {
  const configured = readTeacherCodes();
  return configured.length > 0 ? configured : [DEFAULT_TEACHER_PIN];
}

/**
 * 지금 기본 PIN으로 열리고 있는지입니다. 학생 이름과 사진이 보이는 화면에서
 * 이 사실을 알려 주려고 씁니다.
 */
export function usingDefaultPin() {
  return readTeacherCodes().length === 0;
}

export type TeacherCheck =
  | { ok: true }
  | { ok: false; message: string; status: number };

/** 수업 자료(지도안·활동지 예시 답안)를 여는 확인입니다. */
export function checkLessonCode(
  request: NextRequest,
  code: string,
): TeacherCheck {
  return verify(request, code, activeTeacherCodes());
}

/** 반 명단·학생 작품·캠프 사진을 여는 확인입니다. */
export function checkTeacherCode(
  request: NextRequest,
  code: string,
): TeacherCheck {
  return verify(request, code, activeTeacherCodes());
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
