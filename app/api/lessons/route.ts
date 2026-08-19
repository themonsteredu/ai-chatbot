import type { NextRequest } from "next/server";
import { LESSON_PLANS } from "../../../lib/lessons/plans";
import { checkLessonCode } from "../teacher-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 교사용 지도안을 내려 줍니다. 지도안 내용은 서버에만 있어서, 코드를 넣기 전에는
 * 화면 코드나 개발자도구에서도 보이지 않습니다.
 */
export async function POST(request: NextRequest) {
  let code = "";
  try {
    const body = await request.json();
    if (typeof body?.code === "string") code = body.code.trim();
  } catch {
    return Response.json(
      { error: "요청 형식이 올바르지 않습니다." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const gate = checkLessonCode(request, code);
  if (!gate.ok) {
    return Response.json(
      { error: gate.message },
      { status: gate.status, headers: { "Cache-Control": "no-store" } },
    );
  }

  return Response.json(
    { plans: LESSON_PLANS },
    { headers: { "Cache-Control": "no-store" } },
  );
}
