-- =====================================================================
-- Ma Sói 3D — Account Gate (Sprint 38)
-- 1 ô nhập duy nhất: tên chưa tồn tại => đăng ký, đã tồn tại => đăng nhập.
-- Chính sách phiên: CHẶN thiết bị mới khi tài khoản đang online ở nơi khác.
-- Mọi kiểm tra chạy NGUYÊN TỬ trong Postgres (row lock) để 2 máy bấm cùng
-- lúc không bao giờ cùng vào được.
--
-- Cách chạy: Supabase Dashboard → SQL Editor → dán toàn bộ file → Run.
-- =====================================================================

create table if not exists public.players (
  username_key  text primary key,                 -- tên đã chuẩn hóa (NFC + lowercase + trim)
  display_name  text not null,                     -- tên hiển thị gốc người chơi gõ
  created_at    timestamptz not null default now(),
  session_id    uuid,                              -- phiên đang giữ tài khoản (null = offline)
  device_label  text,
  last_seen     timestamptz
);

-- Khóa bảng: client (anon key) KHÔNG được đọc/ghi trực tiếp, chỉ gọi qua các hàm bên dưới.
alter table public.players enable row level security;
revoke all on public.players from anon, authenticated;

-- Thời gian một phiên được coi là còn online kể từ heartbeat cuối (client gửi mỗi 15s).
create or replace function public._session_ttl() returns interval
language sql immutable as $$ select interval '45 seconds' $$;

create or replace function public._normalize_username(p_raw text) returns text
language sql immutable as $$ select lower(normalize(btrim(coalesce(p_raw, '')), NFC)) $$;

-- ---------------------------------------------------------------------
-- enter_account: đăng ký hoặc đăng nhập trong 1 lần gọi
-- Trả về: { status: 'registered' | 'logged_in' | 'blocked' | 'invalid', ... }
-- ---------------------------------------------------------------------
create or replace function public.enter_account(
  p_username   text,
  p_session_id uuid,
  p_device     text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_key      text := public._normalize_username(p_username);
  v_display  text := normalize(btrim(coalesce(p_username, '')), NFC);
  v_row      public.players;
  v_inserted boolean := false;
begin
  if p_session_id is null then
    return jsonb_build_object('status', 'invalid', 'reason', 'missing_session');
  end if;
  if char_length(v_key) < 3 then
    return jsonb_build_object('status', 'invalid', 'reason', 'too_short');
  end if;
  if char_length(v_key) > 20 then
    return jsonb_build_object('status', 'invalid', 'reason', 'too_long');
  end if;
  -- Phải khớp 100% với USERNAME_CHARS trong src/logic/accountService.ts
  if v_key !~ '^[a-z0-9_àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+$' then
    return jsonb_build_object('status', 'invalid', 'reason', 'bad_chars');
  end if;

  -- 1) Thử đăng ký: nếu 2 máy cùng đăng ký 1 tên mới, PRIMARY KEY bảo đảm chỉ 1 máy insert thành công.
  insert into public.players (username_key, display_name, session_id, device_label, last_seen)
  values (v_key, v_display, p_session_id, left(p_device, 120), now())
  on conflict (username_key) do nothing
  returning * into v_row;

  if found then
    v_inserted := true;
  else
    -- 2) Tên đã có: khóa dòng rồi mới quyết định, tránh 2 máy cùng chiếm phiên đã hết hạn.
    select * into v_row from public.players where username_key = v_key for update;

    if v_row.session_id is not null
       and v_row.session_id <> p_session_id
       and v_row.last_seen > now() - public._session_ttl() then
      return jsonb_build_object(
        'status', 'blocked',
        'username', v_row.display_name,
        'retry_after_seconds',
          greatest(1, ceil(extract(epoch from (v_row.last_seen + public._session_ttl() - now())))::int)
      );
    end if;

    update public.players
       set session_id = p_session_id,
           device_label = left(p_device, 120),
           last_seen = now()
     where username_key = v_key
     returning * into v_row;
  end if;

  return jsonb_build_object(
    'status', case when v_inserted then 'registered' else 'logged_in' end,
    'username', v_row.display_name,
    'username_key', v_row.username_key,
    'created_at', v_row.created_at
  );
end $$;

-- ---------------------------------------------------------------------
-- heartbeat: gia hạn phiên. false = phiên đã mất (hết hạn và bị máy khác chiếm)
-- ---------------------------------------------------------------------
create or replace function public.account_heartbeat(p_username text, p_session_id uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update public.players
     set last_seen = now()
   where username_key = public._normalize_username(p_username)
     and session_id = p_session_id;
  return found;
end $$;

-- ---------------------------------------------------------------------
-- leave_account: thoát; chỉ phiên đang giữ mới thoát được (không đá người khác)
-- ---------------------------------------------------------------------
create or replace function public.leave_account(p_username text, p_session_id uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update public.players
     set session_id = null, last_seen = null
   where username_key = public._normalize_username(p_username)
     and session_id = p_session_id;
  return found;
end $$;

grant execute on function public.enter_account(text, uuid, text) to anon, authenticated;
grant execute on function public.account_heartbeat(text, uuid) to anon, authenticated;
grant execute on function public.leave_account(text, uuid) to anon, authenticated;
