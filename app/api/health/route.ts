import { probeTables, readConfig } from "../class-webapps/supabase";

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

  const ready = readConfig().ready;
  return Response.json(
    {
      classStore: ready,
      teacherCode: Boolean(adminCode),
      // 표가 만들어졌는지도 함께 알려 줘, 어떤 SQL이 빠졌는지 바로 보입니다.
      tables: ready ? await probeTables() : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
