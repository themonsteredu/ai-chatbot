import {
  probeTables,
  probeWrite,
  readConfig,
} from "../class-webapps/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 배포 상태 점검용입니다. 키 값은 절대 내보내지 않고, 연결 여부만 알려 줍니다.
 */
export async function GET() {
  const adminCode = (
    process.env.TEACHER_ADMIN_CODE ??
    process.env.TEACHER_ACCESS_CODE ??
    ""
  ).trim();

  const config = readConfig();
  // 주소는 비밀이 아니므로, 어느 곳에 연결하는지 호스트만 보여 줍니다.
  let supabaseHost = "";
  try {
    supabaseHost = config.url ? new URL(config.url).host : "";
  } catch {
    supabaseHost = "(주소 형식 오류)";
  }

  return Response.json(
    {
      classStore: config.ready,
      teacherCode: Boolean(adminCode),
      supabaseHost,
      // 표가 만들어졌는지도 함께 알려 줘, 어떤 SQL이 빠졌는지 바로 보입니다.
      tables: config.ready ? await probeTables() : null,
      // 읽기만으로는 anon 키 문제를 놓치므로 쓰기까지 시험합니다.
      canWrite: config.ready ? await probeWrite() : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
