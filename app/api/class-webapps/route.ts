import type { NextRequest } from "next/server";
import { normalizeProject } from "../../../lib/chatbot-studio";
import {
  listClassWebApps,
  listRecordRows,
  listStudentWebApps,
  readConfig,
  saveRecordRow,
  saveWebApp,
} from "./supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const APP_ID = /^[a-z0-9-]{8,80}$/;
const CLASS_CODE = /^[a-zA-Z0-9가-힣-]{2,24}$/;
const MAX_NAME = 20;

function fail(message: string, status: number) {
  return Response.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function ok(body: unknown) {
  return Response.json(body, { headers: { "Cache-Control": "no-store" } });
}

function cleanText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function teacherCodes() {
  const admin = (
    process.env.TEACHER_ADMIN_CODE ??
    process.env.TEACHER_ACCESS_CODE ??
    ""
  ).trim();
  const instructor = (process.env.TEACHER_INSTRUCTOR_CODE ?? "1234").trim();
  return [admin, instructor].filter(Boolean);
}

export async function POST(request: NextRequest) {
  if (!readConfig().ready) {
    return fail(
      "반 저장소가 아직 연결되지 않았습니다. 배포 환경 변수 SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 등록해 주세요.",
      503,
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail("요청 형식이 올바르지 않습니다.", 400);
  }

  const action = cleanText(body.action, 20);
  const classCode = cleanText(body.classCode, 24);
  if (!CLASS_CODE.test(classCode)) {
    return fail("반 코드는 2~24자의 한글·영문·숫자로 적어 주세요.", 400);
  }

  try {
    if (action === "save") {
      const studentName = cleanText(body.studentName, MAX_NAME);
      const appId = cleanText(body.appId, 80);
      if (!studentName) return fail("이름을 적어 주세요.", 400);
      if (!APP_ID.test(appId)) return fail("웹앱 주소가 올바르지 않습니다.", 400);

      // 저장하기 전에 형식을 맞춰, 이상한 값이 그대로 쌓이지 않게 합니다.
      const project = normalizeProject(body.project);
      const saved = await saveWebApp({
        classCode,
        studentName,
        appId,
        appName: project.appName,
        project,
      });
      return ok({ saved: Boolean(saved), updatedAt: saved?.updated_at ?? null });
    }

    if (action === "mine") {
      const studentName = cleanText(body.studentName, MAX_NAME);
      if (!studentName) return fail("이름을 적어 주세요.", 400);
      const rows = await listStudentWebApps(classCode, studentName);
      return ok({
        apps: rows.map((row) => ({
          appId: row.app_id,
          appName: row.app_name,
          project: row.project,
          updatedAt: row.updated_at,
        })),
      });
    }

    if (action === "save-record") {
      const studentName = cleanText(body.studentName, MAX_NAME);
      if (!studentName) return fail("이름을 적어 주세요.", 400);
      if (!body.record || typeof body.record !== "object") {
        return fail("보낼 기록이 없습니다.", 400);
      }
      // 사진이 12장 다 들어가도 넉넉하고, 서버 요청 한도(4.5MB)는 넘지 않는 선입니다.
      const serialized = JSON.stringify(body.record);
      if (serialized.length > 4_000_000) {
        return fail(
          "기록이 너무 큽니다. 사진 몇 장을 지우고 다시 보내 주세요.",
          413,
        );
      }
      const saved = await saveRecordRow({
        classCode,
        studentName,
        record: body.record,
      });
      return ok({ saved: Boolean(saved), updatedAt: saved?.updated_at ?? null });
    }

    if (action === "records") {
      const code = cleanText(body.teacherCode, 100);
      if (!code || !teacherCodes().includes(code)) {
        return fail("교사 코드가 올바르지 않습니다.", 401);
      }
      const rows = await listRecordRows(classCode);
      return ok({
        records: rows.map((row) => ({
          studentName: row.student_name,
          record: row.record,
          updatedAt: row.updated_at,
        })),
      });
    }

    if (action === "class") {
      // 반 전체 목록은 교사 코드가 있어야 봅니다.
      const code = cleanText(body.teacherCode, 100);
      if (!code || !teacherCodes().includes(code)) {
        return fail("교사 코드가 올바르지 않습니다.", 401);
      }
      const rows = await listClassWebApps(classCode);
      return ok({
        apps: rows.map((row) => ({
          studentName: row.student_name,
          appId: row.app_id,
          appName: row.app_name,
          // 교사가 학생 작품을 바로 열어 볼 수 있도록 내용도 함께 보냅니다.
          project: row.project,
          updatedAt: row.updated_at,
        })),
      });
    }

    return fail("알 수 없는 요청입니다.", 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "SUPABASE_NOT_CONFIGURED") {
      return fail("반 저장소가 아직 연결되지 않았습니다.", 503);
    }
    // 실제 오류 내용은 서버 로그에만 남기고, 화면에는 일반 문구만 보여 줍니다.
    console.error("class-webapps failed:", message);
    return fail(
      "반 저장소에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요.",
      502,
    );
  }
}
