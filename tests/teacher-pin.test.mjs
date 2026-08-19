import assert from "node:assert/strict";
import test from "node:test";

/**
 * 교사 PIN 규칙을 확인합니다. 라우트는 Next 요청 객체를 받아 여기서 그대로
 * 부르기 어려우므로, 코드를 고르는 규칙만 떼어 와 같은 셈을 확인합니다.
 * 규칙이 바뀌면 이 시험이 먼저 깨져야 합니다.
 */
async function loadAuth(env) {
  const before = {
    TEACHER_ADMIN_CODE: process.env.TEACHER_ADMIN_CODE,
    TEACHER_ACCESS_CODE: process.env.TEACHER_ACCESS_CODE,
    TEACHER_INSTRUCTOR_CODE: process.env.TEACHER_INSTRUCTOR_CODE,
  };
  for (const key of Object.keys(before)) delete process.env[key];
  for (const [key, value] of Object.entries(env)) process.env[key] = value;

  // 모듈이 환경 변수를 부를 때마다 읽으므로 캐시를 비울 필요는 없습니다.
  const mod = await import("../app/api/teacher-auth.ts");
  const result = {
    configured: mod.readTeacherCodes(),
    active: mod.activeTeacherCodes(),
    usingDefault: mod.usingDefaultPin(),
    pin: mod.DEFAULT_TEACHER_PIN,
  };

  for (const key of Object.keys(before)) {
    if (before[key] === undefined) delete process.env[key];
    else process.env[key] = before[key];
  }
  return result;
}

test("opens with the built-in PIN when the school configured nothing", async () => {
  const auth = await loadAuth({});
  assert.equal(auth.pin, "3035");
  assert.deepEqual(auth.configured, []);
  assert.deepEqual(auth.active, ["3035"]);
  assert.equal(auth.usingDefault, true);
});

test("a configured code replaces the built-in PIN rather than joining it", async () => {
  // 학교가 자기 코드를 정한 순간부터, 널리 알려진 번호로는 열리지 않아야 합니다.
  const admin = await loadAuth({ TEACHER_ADMIN_CODE: "우리학교2026" });
  assert.deepEqual(admin.active, ["우리학교2026"]);
  assert.equal(admin.active.includes("3035"), false);
  assert.equal(admin.usingDefault, false);

  const instructor = await loadAuth({ TEACHER_INSTRUCTOR_CODE: "8712" });
  assert.deepEqual(instructor.active, ["8712"]);
  assert.equal(instructor.usingDefault, false);

  const both = await loadAuth({
    TEACHER_ADMIN_CODE: "운영자",
    TEACHER_INSTRUCTOR_CODE: "강사",
  });
  assert.deepEqual(both.active, ["운영자", "강사"]);
  assert.equal(both.usingDefault, false);
});

test("keeps honouring the old variable name", async () => {
  const legacy = await loadAuth({ TEACHER_ACCESS_CODE: "예전코드" });
  assert.deepEqual(legacy.active, ["예전코드"]);
  assert.equal(legacy.usingDefault, false);
});

test("blank or spaces-only settings fall back to the built-in PIN", async () => {
  // 환경 변수를 만들어 두고 값을 비워 둔 배포가 잠겨 버리면 안 됩니다.
  const blank = await loadAuth({ TEACHER_ADMIN_CODE: "   " });
  assert.deepEqual(blank.active, ["3035"]);
  assert.equal(blank.usingDefault, true);
});

test("the roster tells the teacher when the built-in PIN is in use", async () => {
  const { readFile } = await import("node:fs/promises");
  const root = new URL("../", import.meta.url);
  const [route, roster] = await Promise.all([
    readFile(new URL("app/api/class-webapps/route.ts", root), "utf8"),
    readFile(new URL("app/components/class-roster.tsx", root), "utf8"),
  ]);
  // 학생 이름과 사진이 보이는 화면이라, 기본 PIN으로 열렸다는 사실을 숨기면 안 됩니다.
  assert.match(route, /defaultPin: usingDefaultPin\(\)/);
  assert.match(roster, /setDefaultPin\(body\.defaultPin === true\)/);
  assert.match(roster, /class-roster-default-pin/);
  assert.match(roster, /TEACHER_ADMIN_CODE/);
});
