-- 나만의 웹 만들기: 캠프 기록 저장 테이블
-- Supabase Dashboard > SQL Editor에서 한 번 실행하세요.

create table if not exists public.camp_records (
  id uuid primary key default gen_random_uuid(),
  project_id text not null
    check (char_length(project_id) between 1 and 120),
  project_name text not null
    check (char_length(project_name) between 1 and 120),
  device_id uuid not null,
  student_name text not null
    check (char_length(student_name) between 1 and 50),
  record_type text not null
    check (record_type in ('journal', 'checklist', 'custom')),
  block_id text not null
    check (char_length(block_id) between 1 and 120),
  block_title text not null
    check (char_length(block_title) between 1 and 120),
  answers jsonb not null default '{}'::jsonb
    check (jsonb_typeof(answers) = 'object'),
  checked_items jsonb not null default '[]'::jsonb
    check (jsonb_typeof(checked_items) = 'array'),
  created_at timestamptz not null default now()
);

create index if not exists camp_records_created_at_idx
  on public.camp_records (created_at desc);

create index if not exists camp_records_project_student_idx
  on public.camp_records (project_id, student_name);

alter table public.camp_records enable row level security;

-- 학생 웹에서는 기록 추가만 허용하고 전체 기록 조회는 허용하지 않습니다.
revoke all on table public.camp_records from anon, authenticated;
grant insert on table public.camp_records to anon, authenticated;

drop policy if exists "Allow validated camp record submissions"
  on public.camp_records;

create policy "Allow validated camp record submissions"
  on public.camp_records
  for insert
  to anon, authenticated
  with check (
    char_length(project_id) between 1 and 120
    and char_length(project_name) between 1 and 120
    and char_length(student_name) between 1 and 50
    and char_length(block_id) between 1 and 120
    and char_length(block_title) between 1 and 120
    and record_type in ('journal', 'checklist', 'custom')
    and jsonb_typeof(answers) = 'object'
    and jsonb_typeof(checked_items) = 'array'
  );

comment on table public.camp_records is
  '학생 캠프 웹에서 제출한 활동 기록과 미션 체크 이력';
