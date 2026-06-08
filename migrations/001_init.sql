
-- ============================================================
-- Curio — Migration 001: initial schema
-- public.users (mirror of auth.users) + resumes
-- ============================================================

-- ------------------------------------------------------------
-- 1) public.users — ตาราง profile ที่ mirror จาก auth.users
-- ------------------------------------------------------------
create table if not exists public.users (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2) Trigger — เมื่อมี user ใหม่ใน auth.users ให้สร้าง row ใน public.users อัตโนมัติ
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 3) resumes — หัวใจของแอป เก็บเนื้อหาเรซูเม่เป็น JSONB
-- ------------------------------------------------------------
create table if not exists public.resumes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users (id) on delete cascade,
  title       text not null default 'Untitled resume',
  content     jsonb not null default '{}'::jsonb,
  template    text not null default 'modern',
  is_public   boolean not null default false,
  slug        text unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 4) Index — เร่ง query ที่ใช้บ่อย
-- ------------------------------------------------------------
-- ดึงเรซูเม่ทั้งหมดของ user คนหนึ่ง (หน้า dashboard)
create index if not exists idx_resumes_user_id on public.resumes (user_id);

-- หาเรซูเม่จาก slug (หน้า public) — เฉพาะที่ public เท่านั้น
create index if not exists idx_resumes_slug on public.resumes (slug) where is_public = true;

-- ------------------------------------------------------------
-- 5) Trigger — อัปเดต updated_at อัตโนมัติทุกครั้งที่แก้ row
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_resumes_updated_at on public.resumes;

create trigger set_resumes_updated_at
  before update on public.resumes
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 6) Row Level Security (safety net)
--    หมายเหตุ: Go ต่อ DB ด้วย service connection จึง bypass RLS อยู่แล้ว
--    RLS นี้เป็นเกราะป้องกันเผลอ query ตรงจาก Data API เท่านั้น
-- ------------------------------------------------------------
alter table public.users   enable row level security;
alter table public.resumes enable row level security;

-- user เห็น/แก้ profile ตัวเองได้
create policy "users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- user จัดการเรซูเม่ของตัวเองได้ทั้งหมด
create policy "users can manage own resumes"
  on public.resumes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ใครก็ดูเรซูเม่ที่ตั้งเป็น public ได้
create policy "anyone can view public resumes"
  on public.resumes for select
  using (is_public = true);