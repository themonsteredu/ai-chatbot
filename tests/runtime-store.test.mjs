import assert from "node:assert/strict";
import test from "node:test";
import {
  DRAFT_SCOPE_ID,
  clearRuntime,
  readRuntime,
  runtimeKey,
  writeRuntime,
} from "../lib/runtime-store.ts";

/** localStorage 대신 쓰는 아주 작은 대역입니다. 용량 한도를 흉내 낼 수 있습니다. */
function makeStorage({ limit = Infinity } = {}) {
  const map = new Map();
  return {
    map,
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => {
      const used = [...map.entries()]
        .filter(([existing]) => existing !== key)
        .reduce((total, [, held]) => total + held.length, 0);
      if (used + value.length > limit) {
        const error = new Error("QuotaExceededError");
        error.name = "QuotaExceededError";
        throw error;
      }
      map.set(key, value);
    },
    removeItem: (key) => void map.delete(key),
  };
}

test("keys runtime data by app id, not by the editable project title", () => {
  const first = { appId: "app-aaaaaaaa", legacyTitle: "나만의 웹앱" };
  const second = { appId: "app-bbbbbbbb", legacyTitle: "나만의 웹앱" };

  // 이름이 같아도 웹앱이 다르면 저장 자리가 달라야 합니다.
  assert.notEqual(runtimeKey(first, "runtime"), runtimeKey(second, "runtime"));
  assert.equal(runtimeKey(first, "runtime"), "my-webapp-runtime-v2:app-aaaaaaaa");
  assert.equal(runtimeKey(first, "camp"), "my-webapp-camp-report-v2:app-aaaaaaaa");

  const storage = makeStorage();
  writeRuntime(storage, first, "runtime", "첫 번째 기록");
  writeRuntime(storage, second, "runtime", "두 번째 기록");
  assert.equal(readRuntime(storage, first, "runtime"), "첫 번째 기록");
  assert.equal(readRuntime(storage, second, "runtime"), "두 번째 기록");
});

test("survives a project rename", () => {
  const storage = makeStorage();
  const before = { appId: "app-cccccccc", legacyTitle: "우리 반 알림장" };
  writeRuntime(storage, before, "camp", "12차시 기록");

  // 학생이 Screen1 속성에서 프로젝트 이름을 바꿔도 기록은 그대로여야 합니다.
  const after = { appId: "app-cccccccc", legacyTitle: "3학년 2반 알림장" };
  assert.equal(readRuntime(storage, after, "camp"), "12차시 기록");
});

test("moves records saved under the old title-based key exactly once", () => {
  const storage = makeStorage();
  storage.setItem("my-webapp-camp-report-v1:3일 캠프 활동 기록", "예전 사진");
  const scope = { appId: "app-dddddddd", legacyTitle: "3일 캠프 활동 기록" };

  assert.equal(readRuntime(storage, scope, "camp"), "예전 사진");
  // 옮긴 뒤에는 예전 자리를 비웁니다. 사진은 몇 MB라 양쪽에 두면 공간이 찹니다.
  assert.equal(storage.getItem("my-webapp-camp-report-v1:3일 캠프 활동 기록"), null);
  assert.equal(storage.getItem(runtimeKey(scope, "camp")), "예전 사진");
  // 두 번째 읽기도 같은 값이어야 합니다.
  assert.equal(readRuntime(storage, scope, "camp"), "예전 사진");
});

test("keeps the old record readable when there is no room to move it", () => {
  const storage = makeStorage({ limit: 12 });
  storage.map.set("my-webapp-runtime-v1:나만의 웹앱", "아주 긴 예전 기록");
  const scope = { appId: "app-eeeeeeee", legacyTitle: "나만의 웹앱" };

  assert.equal(readRuntime(storage, scope, "runtime"), "아주 긴 예전 기록");
  // 옮기지 못했으면 예전 자리를 지우면 안 됩니다.
  assert.equal(
    storage.getItem("my-webapp-runtime-v1:나만의 웹앱"),
    "아주 긴 예전 기록",
  );
});

test("reports a full disk instead of silently dropping the write", () => {
  const storage = makeStorage({ limit: 5 });
  const scope = { appId: "app-ffffffff", legacyTitle: "" };
  assert.equal(writeRuntime(storage, scope, "runtime", "짧음"), "saved");
  assert.equal(writeRuntime(storage, scope, "runtime", "너무 긴 기록입니다"), "full");
});

test("clears both stores when a web app is deleted", () => {
  const storage = makeStorage();
  const scope = { appId: "app-gggggggg", legacyTitle: "" };
  writeRuntime(storage, scope, "runtime", "할 일");
  writeRuntime(storage, scope, "camp", "사진");

  clearRuntime(storage, "app-gggggggg");
  assert.equal(readRuntime(storage, scope, "runtime"), null);
  assert.equal(readRuntime(storage, scope, "camp"), null);
});

test("falls back to a draft slot before the web app is saved", () => {
  assert.equal(
    runtimeKey({ appId: "", legacyTitle: "" }, "runtime"),
    `my-webapp-runtime-v2:${DRAFT_SCOPE_ID}`,
  );
});
