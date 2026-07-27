-- 나만의 웹앱 만들기 — 반 저장소 스키마
-- Supabase 대시보드의 SQL Editor에 붙여 넣고 한 번 실행하세요.

create table if not exists public.class_webapps (
  id uuid primary key default gen_random_uuid(),
  class_code text not null,
  student_name text not null,
  app_id text not null,
  app_name text not null,
  project jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- 같은 반의 같은 학생이 같은 웹앱을 다시 제출하면 덮어씁니다.
  unique (class_code, student_name, app_id)
);

create index if not exists class_webapps_class_idx
  on public.class_webapps (class_code, updated_at desc);

create index if not exists class_webapps_student_idx
  on public.class_webapps (class_code, student_name);

-- 이 표에는 서버만 접근합니다. 브라우저에는 Supabase 키를 두지 않고,
-- 모든 읽기·쓰기가 이 앱의 서버 라우트를 거칩니다. 그래서 익명 키로는
-- 아무것도 읽히지 않도록 RLS를 켜고 정책을 만들지 않습니다.
alter table public.class_webapps enable row level security;

-- 혹시 예전에 만들어 둔 정책이 있다면 지웁니다.
drop policy if exists "public read" on public.class_webapps;
drop policy if exists "public write" on public.class_webapps;

-- 학생이 휴대폰에서 쓴 캠프 기록(12차시 활동·소감·사진)을 선생님이 받는 표입니다.
create table if not exists public.class_records (
  id uuid primary key default gen_random_uuid(),
  class_code text not null,
  student_name text not null,
  record jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- 같은 반의 같은 학생이 다시 보내면 최신 기록으로 덮어씁니다.
  unique (class_code, student_name)
);

create index if not exists class_records_class_idx
  on public.class_records (class_code, updated_at desc);

alter table public.class_records enable row level security;
