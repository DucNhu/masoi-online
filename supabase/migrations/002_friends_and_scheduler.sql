-- =====================================================================
-- Ma Sói 3D — Friends & Match Scheduler (Sprint 39)
-- Bảng lưu trữ danh sách bạn bè và lịch hẹn chơi ma sói.
--
-- Cách chạy: Supabase Dashboard → SQL Editor → dán toàn bộ file → Run.
-- =====================================================================

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_a text not null,
  user_b text not null,
  status text not null default 'pending', -- 'pending' | 'accepted' | 'declined'
  created_at timestamptz not null default now(),
  constraint unique_friendship unique (user_a, user_b)
);

create table if not exists public.scheduled_matches (
  id text primary key,
  host_username text not null,
  host_display_name text not null,
  target_friend_username text,
  target_friend_display_name text,
  table_name text not null,
  scheduled_at timestamptz not null,
  notes text,
  notified_15m boolean not null default false,
  created_at timestamptz not null default now()
);

-- Bảo mật Row Level Security
alter table public.friendships enable row level security;
alter table public.scheduled_matches enable row level security;

-- Cho phép gọi từ client công khai
grant select, insert, update on public.friendships to anon, authenticated;
grant select, insert, update, delete on public.scheduled_matches to anon, authenticated;
