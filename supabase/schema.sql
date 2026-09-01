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

-- 활동 체크를 날짜별로 받으면서 기록 종류가 둘이 되었습니다. 예전에 쌓인 줄은
-- 모두 캠프 기록이라 기본값을 'camp'로 둡니다. 이미 만들어 둔 표에도 그대로
-- 다시 실행하면 됩니다.
alter table public.class_records
  add column if not exists kind text not null default 'camp';

-- 같은 학생이 캠프 기록과 할 일 기록을 따로 보낼 수 있어야 하므로, 학생마다
-- 한 줄이던 제약을 종류까지 묶은 것으로 바꿉니다.
alter table public.class_records
  drop constraint if exists class_records_class_code_student_name_key;

create unique index if not exists class_records_student_kind_idx
  on public.class_records (class_code, student_name, kind);

create index if not exists class_records_class_idx
  on public.class_records (class_code, updated_at desc);

alter table public.class_records enable row level security;

-- 반마다 하나씩, 선생님이 정하는 것입니다. 지금은 '작품 갤러리를 열어 둘지'
-- 하나뿐입니다. 기본은 닫힘이라, 선생님이 열기 전에는 학생끼리 반 작품을 볼 수
-- 없습니다.
create table if not exists public.class_settings (
  class_code text primary key,
  gallery_open boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.class_settings enable row level security;

-- QR·공유 링크용 표입니다. 내용을 서버에 두고 링크에는 짧은 코드만 담아,
-- QR이 단순해져 휴대폰 카메라가 쉽게 읽습니다.
create table if not exists public.shared_webapps (
  id text primary key,
  project jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.shared_webapps enable row level security;
