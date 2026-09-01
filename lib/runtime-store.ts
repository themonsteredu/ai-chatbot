/**
 * 웹앱을 **쓰는 사람**이 남긴 글·사진이 어디에 저장되는지 정하는 곳입니다.
 * 설계 내용(어떤 기능을 놓았는지)과 달리, 이 기록은 그 기기에만 남습니다.
 *
 * 예전에는 프로젝트 이름을 저장 키로 썼습니다. 그런데 이름은 Screen1 속성에서
 * 언제든 바꿀 수 있어서, 이름을 고치면 12차시 기록과 사진이 통째로 사라진 것처럼
 * 보였습니다. 같은 예제로 만든 웹앱 두 개가 같은 기록을 나눠 쓰기도 했고, 웹앱을
 * 지워도 사진은 남아 다음 웹앱이 물려받았습니다. 그래서 이제 웹앱마다 고유한
 * 아이디를 키로 씁니다.
 */

export type RuntimeKind = "runtime" | "camp";

const PREFIX: Record<RuntimeKind, string> = {
  runtime: "my-webapp-runtime-v2:",
  camp: "my-webapp-camp-report-v2:",
};

const LEGACY_PREFIX: Record<RuntimeKind, string> = {
  runtime: "my-webapp-runtime-v1:",
  camp: "my-webapp-camp-report-v1:",
};

/**
 * 어떤 웹앱의 기록인지 가리킵니다. `appId`가 실제 키가 되고, `legacyTitle`은
 * 예전 이름으로 저장해 둔 기록을 한 번 옮겨 오기 위해서만 씁니다.
 */
export type RuntimeScope = {
  appId: string;
  legacyTitle: string;
};

/** 아직 저장하지 않고 편집 중인 웹앱이 쓰는 자리입니다. */
export const DRAFT_SCOPE_ID = "draft";

/**
 * 반 코드와 이름은 반에 제출할 때마다 다시 적기 번거로워 이 기기에만 기억해
 * 둡니다. 여러 화면이 같은 값을 쓰므로 키를 한곳에 둡니다.
 */
export const CLASS_CODE_KEY = "my-webapp-class-code-v1";
export const STUDENT_NAME_KEY = "my-webapp-student-name-v1";

export function runtimeKey(scope: RuntimeScope, kind: RuntimeKind) {
  return `${PREFIX[kind]}${scope.appId || DRAFT_SCOPE_ID}`;
}

/**
 * 이름으로 저장해 둔 예전 기록을 새 키로 한 번만 옮깁니다.
 *
 * 복사가 아니라 이동인 이유: 캠프 사진은 몇 MB까지 커져서, 양쪽에 두면 브라우저
 * 저장 공간이 바로 차 새 저장이 실패합니다. 새 자리에 확실히 쓴 것을 확인한
 * 뒤에만 예전 자리를 지웁니다.
 */
function migrateLegacy(
  storage: Storage,
  scope: RuntimeScope,
  kind: RuntimeKind,
) {
  const title = scope.legacyTitle.trim();
  if (!title) return null;

  const legacyKey = `${LEGACY_PREFIX[kind]}${title}`;
  const legacy = storage.getItem(legacyKey);
  if (legacy === null) return null;

  const key = runtimeKey(scope, kind);
  try {
    storage.setItem(key, legacy);
  } catch {
    // 옮기지 못해도 예전 기록은 그대로 두고, 읽기만 해서 보여 줍니다.
    return legacy;
  }

  if (storage.getItem(key) === legacy) {
    storage.removeItem(legacyKey);
  }
  return legacy;
}

export function readRuntime(
  storage: Storage,
  scope: RuntimeScope,
  kind: RuntimeKind,
) {
  const saved = storage.getItem(runtimeKey(scope, kind));
  if (saved !== null) return saved;
  return migrateLegacy(storage, scope, kind);
}

export type WriteResult = "saved" | "full";

export function writeRuntime(
  storage: Storage,
  scope: RuntimeScope,
  kind: RuntimeKind,
  value: string,
): WriteResult {
  try {
    storage.setItem(runtimeKey(scope, kind), value);
    return "saved";
  } catch {
    return "full";
  }
}

/** 웹앱을 지울 때 그 웹앱의 기록도 함께 치웁니다. */
export function clearRuntime(storage: Storage, appId: string) {
  for (const prefix of Object.values(PREFIX)) {
    storage.removeItem(`${prefix}${appId}`);
  }
}
