import { randomInt } from "node:crypto";
import type { NextRequest } from "next/server";
import { normalizeProject } from "../../../lib/chatbot-studio";
import {
  getSharedProject,
  readConfig,
  saveSharedProject,
} from "../class-webapps/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 새 코드는 외우기 쉬운 6자리 숫자입니다. 예전 12자 코드도 계속 열립니다.
const SHARE_ID = /^(\d{6}|[a-f0-9]{12})$/;

function fail(message: string, status: number) {
  return Response.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  if (!readConfig().ready) {
    return fail("공유 저장소가 아직 연결되지 않았습니다.", 503);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail("요청 형식이 올바르지 않습니다.", 400);
  }

  try {
    if (body.action === "create") {
      if (!body.project || typeof body.project !== "object") {
        return fail("공유할 내용이 없습니다.", 400);
      }
      // 설계에는 사진이 들어가지 않아 보통 2천 자 안팎입니다.
      const project = normalizeProject(body.project);
      if (JSON.stringify(project).length > 200_000) {
        return fail("내용이 너무 큽니다.", 413);
      }
      // 겹치면 다른 번호로 다시 시도합니다.
      let id = "";
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const candidate = String(randomInt(100000, 1000000));
        try {
          await saveSharedProject(candidate, project);
          id = candidate;
          break;
        } catch (caught) {
          const message = caught instanceof Error ? caught.message : "";
          // 기본키 충돌(409)일 때만 새 번호로 재시도합니다.
          if (!message.includes("SUPABASE_409")) throw caught;
        }
      }
      if (!id) return fail("공유 코드를 만들지 못했습니다.", 502);
      return Response.json(
        { id },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    if (body.action === "get") {
      const id = typeof body.id === "string" ? body.id : "";
      if (!SHARE_ID.test(id)) return fail("올바른 공유 코드가 아닙니다.", 400);
      const project = await getSharedProject(id);
      if (!project) return fail("공유된 웹앱을 찾지 못했습니다.", 404);
      return Response.json(
        { project: normalizeProject(project) },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    return fail("알 수 없는 요청입니다.", 400);
  } catch (error) {
    console.error("share failed:", error instanceof Error ? error.message : "");
    return fail("공유 저장소에 연결하지 못했습니다.", 502);
  }
}
