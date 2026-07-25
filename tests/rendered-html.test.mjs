import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("implements a direct-manipulation web studio", async () => {
  const [page, studio, canvas, inspector, preview, project] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(
      new URL("../app/components/web-studio.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../app/components/studio-canvas.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../app/components/inspector-panel.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../app/components/preview-modal.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../lib/studio/project.ts", import.meta.url), "utf8"),
  ]);

  assert.match(page, /WebStudio/);
  assert.match(studio, /my-web-studio-project-v3/);
  assert.match(studio, /copyShareLink/);
  assert.match(studio, /\/api\/records/);
  assert.match(canvas, /pointermove/);
  assert.match(canvas, /mode: "move" \| "resize"/);
  assert.match(canvas, /application\/x-web-studio-element/);
  assert.match(inspector, /위치와 크기/);
  assert.match(inspector, /색과 모양/);
  assert.match(inspector, /기록 저장/);
  assert.match(preview, /sandbox="allow-forms allow-popups allow-scripts"/);
  assert.match(project, /AI 캠프 기록 웹/);
  assert.match(project, /buildPreviewDocument/);
});

test("keeps Supabase writes server-side with restricted schema", async () => {
  const [layout, packageJson, recordRoute, supabaseClient, schema] =
    await Promise.all([
      readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
      readFile(new URL("../package.json", import.meta.url), "utf8"),
      readFile(new URL("../app/api/records/route.ts", import.meta.url), "utf8"),
      readFile(new URL("../lib/supabase/server.ts", import.meta.url), "utf8"),
      readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8"),
    ]);

  assert.match(layout, /<html lang="ko">/);
  assert.match(layout, /WEB MAKER/);
  assert.match(packageJson, /"name": "my-web-maker"/);
  assert.match(packageJson, /"build": "next build"/);
  assert.doesNotMatch(
    packageJson,
    /vinext|wrangler|cloudflare|react-loading-skeleton/i,
  );
  assert.match(packageJson, /"@supabase\/supabase-js"/);
  assert.match(recordRoute, /getSupabase/);
  assert.match(recordRoute, /camp_records/);
  assert.match(supabaseClient, /SUPABASE_PUBLISHABLE_KEY/);
  assert.doesNotMatch(studioSafe(supabaseClient), /service_role/i);
  assert.match(schema, /enable row level security/);
  assert.match(schema, /grant insert/);
  assert.match(schema, /revoke all/);
  await assert.rejects(access(new URL(".openai/hosting.json", root)));
});

function studioSafe(value) {
  return value.replaceAll("publishable", "");
}
