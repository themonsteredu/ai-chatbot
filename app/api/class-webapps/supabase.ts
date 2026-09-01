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
  let url = process.env.SUPABASE_URL?.trim().replace(/\/+$/, "") ?? "";
  // 대시보드에서 복사하다 보면 https://가 빠지기 쉬워, 여기서 채워 줍니다.
  if (url && !/^https?:\/\//.test(url)) url = `https://${url}`;
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

  // Prefer: return=minimal이면 201에 본문이 없습니다. 빈 응답을 JSON으로
  // 읽으려 하면 터지므로, 내용이 있을 때만 파싱합니다.
  const text = await response.text();
  if (!text) return null;
  return JSON.parse(text);
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

/**
 * 기록의 종류입니다. 캠프 기록과 날짜별 할 일은 한 학생이 둘 다 보낼 수 있어서
 * 줄을 나눠 둡니다.
 */
export type RecordKind = "camp" | "checklist";

export type ClassRecordRow = {
  class_code: string;
  student_name: string;
  kind: RecordKind;
  record: unknown;
  updated_at: string;
};

/** 학생이 보낸 기록을 저장합니다. 같은 학생·같은 종류면 덮어씁니다. */
export async function saveRecordRow(row: {
  classCode: string;
  studentName: string;
  kind: RecordKind;
  record: unknown;
}) {
  const payload = {
    class_code: row.classCode,
    student_name: row.studentName,
    kind: row.kind,
    record: row.record,
    updated_at: new Date().toISOString(),
  };
  const result = (await request(
    `${RECORD_TABLE}?on_conflict=class_code,student_name,kind`,
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

/** 한 학생이 앞서 보낸 기록입니다. 여러 체크 목록을 합칠 때 씁니다. */
export async function getRecordRow(
  classCode: string,
  studentName: string,
  kind: RecordKind,
) {
  const params = new URLSearchParams({
    class_code: `eq.${classCode}`,
    student_name: `eq.${studentName}`,
    kind: `eq.${kind}`,
    select: "student_name,kind,record,updated_at",
    limit: "1",
  });
  const rows = ((await request(`${RECORD_TABLE}?${params}`, {
    method: "GET",
  })) ?? []) as ClassRecordRow[];
  return rows[0] ?? null;
}

/** 교사가 반 전체의 기록을 봅니다. */
export async function listRecordRows(
  classCode: string,
  kind: RecordKind = "camp",
) {
  const params = new URLSearchParams({
    class_code: `eq.${classCode}`,
    kind: `eq.${kind}`,
    select: "student_name,kind,record,updated_at",
    order: "student_name.asc",
  });
  return ((await request(`${RECORD_TABLE}?${params}`, { method: "GET" })) ??
    []) as ClassRecordRow[];
}

const SHARE_TABLE = "shared_webapps";

/** QR·공유 링크에 담을 짧은 코드로 웹앱 내용을 저장합니다. */
export async function saveSharedProject(id: string, project: unknown) {
  await request(SHARE_TABLE, {
    method: "POST",
    body: JSON.stringify({ id, project }),
    headers: { Prefer: "return=minimal" },
  });
  return id;
}

export async function getSharedProject(id: string) {
  const params = new URLSearchParams({ id: `eq.${id}`, select: "project" });
  const rows = ((await request(`${SHARE_TABLE}?${params}`, {
    method: "GET",
  })) ?? []) as Array<{ project: unknown }>;
  return rows[0]?.project ?? null;
}

/** 표가 실제로 만들어졌는지 확인합니다. 값은 읽지 않고 상태만 봅니다. */
async function probeTable(table: string) {
  try {
    await request(`${table}?select=id&limit=1`, { method: "GET" });
    return "ok";
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "";
    if (message.includes("SUPABASE_404")) return "missing";
    if (message.includes("SUPABASE_401") || message.includes("SUPABASE_403")) {
      return "key-rejected";
    }
    if (/fetch failed|ENOTFOUND|ECONN|Invalid URL/i.test(message)) {
      return "unreachable";
    }
    return `error:${message.slice(0, 40)}`;
  }
}

export async function probeTables() {
  const [webapps, records, share] = await Promise.all([
    probeTable(TABLE),
    probeTable(RECORD_TABLE),
    probeTable(SHARE_TABLE),
  ]);
  return { webapps, records, share };
}

/**
 * 실제로 쓰기가 되는지 확인합니다. 읽기만 보면 RLS가 켜진 상태에서 anon 키를
 * 써도 빈 배열이 성공으로 돌아와 문제를 놓칩니다. 시험용 줄을 넣었다가 지웁니다.
 */
export async function probeWrite() {
  const id = `probe-${Date.now().toString(36)}`;
  try {
    await request(SHARE_TABLE, {
      method: "POST",
      body: JSON.stringify({ id, project: { probe: true } }),
      headers: { Prefer: "return=minimal" },
    });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "";
    if (message.includes("SUPABASE_401") || message.includes("SUPABASE_403")) {
      return "key-cannot-write";
    }
    return `error:${message.slice(0, 60)}`;
  }

  try {
    await request(`${SHARE_TABLE}?id=eq.${id}`, { method: "DELETE" });
  } catch {
    // 지우지 못해도 쓰기는 된 것이라 그대로 둡니다.
  }
  return "ok";
}

/**
 * 어떤 반이 있는지 한눈에 보여 주기 위한 요약입니다. 사진이 들어 있는 본문은
 * 빼고 반 이름과 시각만 읽어 와, 반이 많아도 가볍게 불러옵니다.
 */
export async function listClassSummaries() {
  const pick = new URLSearchParams({
    select: "class_code,student_name,updated_at",
    order: "updated_at.desc",
    limit: "2000",
  }).toString();

  const [apps, records] = await Promise.all([
    request(`${TABLE}?${pick}`, { method: "GET" }) as Promise<
      Array<{ class_code: string; student_name: string; updated_at: string }>
    >,
    request(`${RECORD_TABLE}?${pick}`, { method: "GET" }) as Promise<
      Array<{ class_code: string; student_name: string; updated_at: string }>
    >,
  ]);

  const summary = new Map<
    string,
    {
      classCode: string;
      appCount: number;
      recordCount: number;
      students: Set<string>;
      updatedAt: string;
    }
  >();

  const add = (
    row: { class_code: string; student_name: string; updated_at: string },
    kind: "app" | "record",
  ) => {
    const found = summary.get(row.class_code) ?? {
      classCode: row.class_code,
      appCount: 0,
      recordCount: 0,
      students: new Set<string>(),
      updatedAt: row.updated_at,
    };
    if (kind === "app") found.appCount += 1;
    else found.recordCount += 1;
    found.students.add(row.student_name);
    if (row.updated_at > found.updatedAt) found.updatedAt = row.updated_at;
    summary.set(row.class_code, found);
  };

  (apps ?? []).forEach((row) => add(row, "app"));
  (records ?? []).forEach((row) => add(row, "record"));

  return [...summary.values()]
    .map(({ students, ...rest }) => ({
      ...rest,
      studentCount: students.size,
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
