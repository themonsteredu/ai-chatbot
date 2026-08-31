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

test("a configured code joins the built-in PIN instead of replacing it", async () => {
  // 번호 하나(3035)로 모든 교사 화면이 열려야 한다는 운영 결정입니다.
  // 코드를 등록해도 기본 PIN이 막히면 안 됩니다.
  const admin = await loadAuth({ TEACHER_ADMIN_CODE: "우리학교2026" });
  assert.deepEqual(admin.active, ["3035", "우리학교2026"]);
  assert.equal(admin.usingDefault, true);

  const instructor = await loadAuth({ TEACHER_INSTRUCTOR_CODE: "8712" });
  assert.deepEqual(instructor.active, ["3035", "8712"]);

  const both = await loadAuth({
    TEACHER_ADMIN_CODE: "운영자",
    TEACHER_INSTRUCTOR_CODE: "강사",
  });
  assert.deepEqual(both.active, ["3035", "운영자", "강사"]);
});

test("keeps honouring the old variable name", async () => {
  const legacy = await loadAuth({ TEACHER_ACCESS_CODE: "예전코드" });
  assert.deepEqual(legacy.active, ["3035", "예전코드"]);
});

test("blank settings and a re-registered 3035 both leave one clean PIN", async () => {
  // 환경 변수를 만들어 두고 값을 비워 둔 배포가 잠겨 버리면 안 됩니다.
  const blank = await loadAuth({ TEACHER_ADMIN_CODE: "   " });
  assert.deepEqual(blank.active, ["3035"]);
  assert.equal(blank.usingDefault, true);

  // 기본 PIN을 그대로 등록해도 같은 번호가 두 번 들어가지 않아야 합니다.
  const same = await loadAuth({ TEACHER_ADMIN_CODE: "3035" });
  assert.deepEqual(same.active, ["3035"]);
});

test("the roster tells the teacher when the built-in PIN is in use", async () => {
  const { readFile } = await import("node:fs/promises");
  const root = new URL("../", import.meta.url);
  const [route, roster] = await Promise.all([
    readFile(new URL("app/api/class-webapps/route.ts", root), "utf8"),
    readFile(new URL("app/components/class-roster.tsx", root), "utf8"),
  ]);
  // 학생 이름과 사진이 보이는 화면이라, 기본 PIN으로 열린다는 사실을 숨기면 안 됩니다.
  assert.match(route, /defaultPin: usingDefaultPin\(\)/);
  assert.match(roster, /setDefaultPin\(body\.defaultPin === true\)/);
  assert.match(roster, /class-roster-default-pin/);
  assert.match(roster, /3035/);
});
