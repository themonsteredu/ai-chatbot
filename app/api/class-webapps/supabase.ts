/**
 * Supabase REST(PostgREST)를 fetch로 직접 부릅니다. 서비스 키는 서버에만 두고
 * 브라우저로 내려보내지 않기 때문에, 이 파일은 라우트 핸들러에서만 불러옵니다.
 * 클라이언트 컴포넌트에서 import하지 마세요.
 */

const TABLE = "class_webapps";

export type ClassWebAppRow = {
  class_code: string;
  student_name: string;
  app_id: string;
  app_name: string;
  project: unknown;
  updated_at: string;
};

export function readConfig() {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/+$/, "") ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  return { url, key, ready: Boolean(url && key) };
}

function headers(key: string, extra: Record<string, string> = {}) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function request(path: string, init: RequestInit) {
  const { url, key, ready } = readConfig();
  if (!ready) throw new Error("SUPABASE_NOT_CONFIGURED");

  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: headers(key, (init.headers as Record<string, string>) ?? {}),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`SUPABASE_${response.status}: ${detail.slice(0, 300)}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

/** 같은 반·학생·웹앱이면 덮어쓰고, 없으면 새로 넣습니다. */
export async function saveWebApp(row: {
  classCode: string;
  studentName: string;
  appId: string;
  appName: string;
  project: unknown;
}) {
  const payload = {
    class_code: row.classCode,
    student_name: row.studentName,
    app_id: row.appId,
    app_name: row.appName,
    project: row.project,
    updated_at: new Date().toISOString(),
  };

  const result = (await request(
    `${TABLE}?on_conflict=class_code,student_name,app_id`,
    {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        Prefer: "resolution=merge-duplicates,return=representation",
      },
    },
  )) as ClassWebAppRow[] | null;

  return result?.[0] ?? null;
}

/** 학생 본인이 다른 기기에서 이어서 하려고 자기 것만 불러옵니다. */
export async function listStudentWebApps(
  classCode: string,
  studentName: string,
) {
  const params = new URLSearchParams({
    class_code: `eq.${classCode}`,
    student_name: `eq.${studentName}`,
    select: "app_id,app_name,project,updated_at",
    order: "updated_at.desc",
  });
  return ((await request(`${TABLE}?${params}`, { method: "GET" })) ??
    []) as ClassWebAppRow[];
}

/** 교사가 반 전체 제출 현황을 봅니다. */
export async function listClassWebApps(classCode: string) {
  const params = new URLSearchParams({
    class_code: `eq.${classCode}`,
    select: "student_name,app_id,app_name,project,updated_at",
    order: "student_name.asc,updated_at.desc",
  });
  return ((await request(`${TABLE}?${params}`, { method: "GET" })) ??
    []) as ClassWebAppRow[];
}

const RECORD_TABLE = "class_records";

export type ClassRecordRow = {
  class_code: string;
  student_name: string;
  record: unknown;
  updated_at: string;
};

/** 학생이 보낸 캠프 기록을 저장합니다. 같은 학생이 다시 보내면 덮어씁니다. */
export async function saveRecordRow(row: {
  classCode: string;
  studentName: string;
  record: unknown;
}) {
  const payload = {
    class_code: row.classCode,
    student_name: row.studentName,
    record: row.record,
    updated_at: new Date().toISOString(),
  };
  const result = (await request(
    `${RECORD_TABLE}?on_conflict=class_code,student_name`,
    {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        Prefer: "resolution=merge-duplicates,return=representation",
      },
    },
  )) as ClassRecordRow[] | null;
  return result?.[0] ?? null;
}

/** 교사가 반 전체의 캠프 기록을 봅니다. */
export async function listRecordRows(classCode: string) {
  const params = new URLSearchParams({
    class_code: `eq.${classCode}`,
    select: "student_name,record,updated_at",
    order: "student_name.asc",
  });
  return ((await request(`${RECORD_TABLE}?${params}`, { method: "GET" })) ??
    []) as ClassRecordRow[];
}
