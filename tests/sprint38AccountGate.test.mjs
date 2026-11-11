import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LocalAccountBackend,
  SupabaseAccountBackend,
  AccountSession,
  memoryStore,
  normalizeUsername,
  validateUsername,
  getTabSessionId,
  SESSION_TTL_MS,
  HEARTBEAT_INTERVAL_MS,
} from '../src/logic/accountService.ts';

// ---------- helpers ----------
function makeClock(start = 1_000_000) {
  let t = start;
  return { now: () => t, advance: (ms) => { t += ms; } };
}
function fakeTimers() {
  const timers = new Map();
  let id = 0;
  return {
    api: {
      setInterval: (fn, ms) => { id += 1; timers.set(id, { fn, ms }); return id; },
      clearInterval: (i) => { timers.delete(i); },
    },
    active: () => timers.size,
    fireAll: () => { for (const { fn } of timers.values()) fn(); },
  };
}
function setup() {
  const clock = makeClock();
  const backend = new LocalAccountBackend(memoryStore(), clock.now);
  return { clock, backend };
}

// =================== Validation ===================

test('Account - chuẩn hóa tên: khoảng trắng, hoa/thường, Unicode NFC', () => {
  assert.equal(normalizeUsername('  Duc_Nhu  '), 'duc_nhu');
  // "Đức" dựng sẵn (NFC) và "Đức" tổ hợp (NFD: u + dấu móc U+031B + dấu sắc U+0301) phải ra cùng 1 key
  assert.equal(normalizeUsername('Đức'), normalizeUsername('Đu\u031B\u0301c'));
  assert.equal(normalizeUsername('Đu\u031B\u0301c'), 'đức');
});

test('Account - kiểm tra tên không hợp lệ', () => {
  assert.equal(validateUsername(''), 'too_short');
  assert.equal(validateUsername('   '), 'too_short');
  assert.equal(validateUsername('ab'), 'too_short');
  assert.equal(validateUsername('a'.repeat(21)), 'too_long');
  assert.equal(validateUsername('duc nhu'), 'bad_chars', 'dấu cách ở giữa');
  assert.equal(validateUsername('duc<script>'), 'bad_chars', 'ký tự HTML');
  assert.equal(validateUsername("x' OR 1=1--"), 'bad_chars', 'SQL injection');
  assert.equal(validateUsername('🐺wolf'), 'bad_chars', 'emoji');
  assert.equal(validateUsername('abc'), null);
  assert.equal(validateUsername('a'.repeat(20)), null);
  assert.equal(validateUsername('Thợ_Săn_99'), null, 'tiếng Việt có dấu được phép');
});

test('Account - tên không hợp lệ thì không tạo tài khoản', async () => {
  const { backend } = setup();
  const r = await backend.enter('ab', 's1', 'web');
  assert.deepEqual(r, { status: 'invalid', reason: 'too_short' });
  const r2 = await backend.enter('abc', 's1', 'web');
  assert.equal(r2.status, 'registered', 'tên "abc" vẫn còn trống');
});

test('Account - thiếu session id bị từ chối', async () => {
  const { backend } = setup();
  assert.deepEqual(await backend.enter('duc', '', 'web'), { status: 'invalid', reason: 'missing_session' });
});

// =================== Đăng ký / đăng nhập 1 ô ===================

test('Account - tên mới => tự đăng ký', async () => {
  const { backend } = setup();
  const r = await backend.enter('DucNhu', 's1', 'iPhone');
  assert.equal(r.status, 'registered');
  assert.equal(r.username, 'DucNhu', 'giữ nguyên cách viết hoa để hiển thị');
  assert.equal(r.usernameKey, 'ducnhu');
});

test('Account - tên đã có, đã thoát => đăng nhập (không tạo trùng)', async () => {
  const { backend } = setup();
  await backend.enter('DucNhu', 's1', 'web');
  await backend.leave('DucNhu', 's1');
  const r = await backend.enter('ducnhu', 's2', 'web');
  assert.equal(r.status, 'logged_in');
  assert.equal(r.username, 'DucNhu', 'tên hiển thị là tên lúc đăng ký đầu tiên');
});

test('Account - tải lại trang (cùng session) vào lại bình thường', async () => {
  const { backend } = setup();
  await backend.enter('duc', 's1', 'web');
  const r = await backend.enter('duc', 's1', 'web');
  assert.equal(r.status, 'logged_in');
});

test('Account - "Duc", " duc ", "DUC" là cùng 1 tài khoản', async () => {
  const { backend } = setup();
  assert.equal((await backend.enter('Duc', 's1', 'web')).status, 'registered');
  const r = await backend.enter(' DUC ', 's2', 'web');
  assert.equal(r.status, 'blocked', 'không được tạo tài khoản thứ 2 trùng tên');
});

// =================== 2 thiết bị cùng 1 tài khoản ===================

test('Account - máy thứ 2 bị CHẶN khi máy 1 đang online', async () => {
  const { backend } = setup();
  await backend.enter('duc', 'phone', 'iPhone');
  const r = await backend.enter('duc', 'laptop', 'Chrome');
  assert.equal(r.status, 'blocked');
  assert.ok(r.retryAfterSeconds >= 1 && r.retryAfterSeconds <= 45);
});

test('Account - máy 1 bấm Thoát => máy 2 vào được ngay', async () => {
  const { backend } = setup();
  await backend.enter('duc', 'phone', 'iPhone');
  assert.equal(await backend.leave('duc', 'phone'), true);
  assert.equal((await backend.enter('duc', 'laptop', 'Chrome')).status, 'logged_in');
});

test('Account - máy 1 tắt tab không thoát (mất heartbeat) => máy 2 vào được sau 45s', async () => {
  const { backend, clock } = setup();
  await backend.enter('duc', 'phone', 'iPhone');
  clock.advance(SESSION_TTL_MS - 1000);
  assert.equal((await backend.enter('duc', 'laptop', 'Chrome')).status, 'blocked', 'chưa đủ 45s');
  clock.advance(1001);
  assert.equal((await backend.enter('duc', 'laptop', 'Chrome')).status, 'logged_in', 'quá 45s');
});

test('Account - heartbeat đều đặn giữ phiên, máy 2 vẫn bị chặn sau nhiều phút', async () => {
  const { backend, clock } = setup();
  await backend.enter('duc', 'phone', 'iPhone');
  for (let i = 0; i < 20; i++) {
    clock.advance(HEARTBEAT_INTERVAL_MS);
    assert.equal(await backend.heartbeat('duc', 'phone'), true);
  }
  assert.equal((await backend.enter('duc', 'laptop', 'Chrome')).status, 'blocked');
});

test('Account - máy 1 quay lại sau khi máy 2 đã chiếm => heartbeat báo mất phiên', async () => {
  const { backend, clock } = setup();
  await backend.enter('duc', 'phone', 'iPhone');
  clock.advance(SESSION_TTL_MS + 1);
  await backend.enter('duc', 'laptop', 'Chrome');
  assert.equal(await backend.heartbeat('duc', 'phone'), false);
  assert.equal((await backend.enter('duc', 'phone', 'iPhone')).status, 'blocked', 'giờ đến lượt máy 1 bị chặn');
});

test('Account - máy 1 khóa màn hình 1 phút nhưng không ai chiếm => vẫn giữ được phiên', async () => {
  const { backend, clock } = setup();
  await backend.enter('duc', 'phone', 'iPhone');
  clock.advance(60_000);
  assert.equal(await backend.heartbeat('duc', 'phone'), true);
});

test('Account - session lạ gọi Thoát không đá được chủ phiên', async () => {
  const { backend } = setup();
  await backend.enter('duc', 'phone', 'iPhone');
  assert.equal(await backend.leave('duc', 'hacker'), false);
  assert.equal((await backend.enter('duc', 'laptop', 'Chrome')).status, 'blocked');
});

test('Account - heartbeat/thoát với tài khoản không tồn tại trả false, không lỗi', async () => {
  const { backend } = setup();
  assert.equal(await backend.heartbeat('ghost', 's1'), false);
  assert.equal(await backend.leave('ghost', 's1'), false);
});

// =================== Race condition: bấm cùng lúc ===================

test('Account - 2 máy cùng đăng ký 1 tên mới cùng lúc => đúng 1 máy thắng', async () => {
  const { backend } = setup();
  const results = await Promise.all([
    backend.enter('newbie', 'A', 'iPhone'),
    backend.enter('NEWBIE', 'B', 'Android'),
  ]);
  const statuses = results.map((r) => r.status).sort();
  assert.deepEqual(statuses, ['blocked', 'registered']);
});

test('Account - 10 máy tranh 1 phiên vừa hết hạn cùng lúc => đúng 1 máy vào được', async () => {
  const { backend, clock } = setup();
  await backend.enter('hot', 'owner', 'web');
  clock.advance(SESSION_TTL_MS + 1);
  const results = await Promise.all(
    Array.from({ length: 10 }, (_, i) => backend.enter('hot', `dev-${i}`, 'web'))
  );
  assert.equal(results.filter((r) => r.status === 'logged_in').length, 1);
  assert.equal(results.filter((r) => r.status === 'blocked').length, 9);
});

test('Account - 2 tài khoản KHÁC nhau đăng nhập cùng lúc đều thành công', async () => {
  const { backend } = setup();
  const [a, b] = await Promise.all([backend.enter('alice', 'A', 'web'), backend.enter('bob', 'B', 'web')]);
  assert.equal(a.status, 'registered');
  assert.equal(b.status, 'registered');
});

// =================== AccountSession (1 tab) ===================

test('Session - bấm "Vào làng" 2 lần liên tiếp chỉ gửi 1 request', async () => {
  const { backend } = setup();
  let calls = 0;
  const counting = { ...backend, enter: (...a) => { calls += 1; return backend.enter(...a); },
    heartbeat: (...a) => backend.heartbeat(...a), leave: (...a) => backend.leave(...a) };
  const t = fakeTimers();
  const s = new AccountSession(counting, 'tab1', 'web', t.api);
  const [r1, r2] = await Promise.all([s.enter('duc'), s.enter('duc')]);
  assert.equal(calls, 1);
  assert.equal(r1, r2);
  s.dispose();
});

test('Session - đăng nhập thành công bật heartbeat, thoát thì tắt', async () => {
  const { backend } = setup();
  const t = fakeTimers();
  const s = new AccountSession(backend, 'tab1', 'web', t.api);
  await s.enter('duc');
  assert.equal(s.getState().kind, 'signed_in');
  assert.equal(s.getState().isNew, true);
  assert.equal(t.active(), 1);
  await s.leave();
  assert.equal(s.getState().kind, 'signed_out');
  assert.equal(t.active(), 0);
});

test('Session - bị chặn thì không bật heartbeat và vẫn ở trạng thái chưa đăng nhập', async () => {
  const { backend } = setup();
  await backend.enter('duc', 'other-device', 'web');
  const t = fakeTimers();
  const s = new AccountSession(backend, 'tab1', 'web', t.api);
  const r = await s.enter('duc');
  assert.equal(r.status, 'blocked');
  assert.equal(s.getState().kind, 'signed_out');
  assert.equal(t.active(), 0);
});

test('Session - bị máy khác chiếm phiên => chuyển sang "lost" và báo cho UI', async () => {
  const { backend, clock } = setup();
  const t = fakeTimers();
  const s = new AccountSession(backend, 'phone', 'web', t.api);
  const seen = [];
  s.subscribe((st) => seen.push(st.kind));
  await s.enter('duc');
  clock.advance(SESSION_TTL_MS + 1); // điện thoại bị treo, timer không chạy
  await backend.enter('duc', 'laptop', 'web');
  await s.beat();
  assert.equal(s.getState().kind, 'lost');
  assert.deepEqual(seen, ['signed_in', 'lost']);
  assert.equal(t.active(), 0, 'dừng heartbeat sau khi mất phiên');
});

test('Session - mất mạng tạm thời không làm văng tài khoản', async () => {
  const { backend } = setup();
  let offline = false;
  const flaky = {
    enter: (...a) => backend.enter(...a),
    leave: (...a) => backend.leave(...a),
    heartbeat: (...a) => (offline ? Promise.reject(new Error('Failed to fetch')) : backend.heartbeat(...a)),
  };
  const t = fakeTimers();
  const s = new AccountSession(flaky, 'tab1', 'web', t.api);
  await s.enter('duc');
  offline = true;
  await s.beat();
  assert.equal(s.getState().kind, 'signed_in');
  offline = false;
  await s.beat();
  assert.equal(s.getState().kind, 'signed_in');
});

test('Session - đổi sang tài khoản khác trong cùng tab sẽ nhả tài khoản cũ', async () => {
  const { backend } = setup();
  const t = fakeTimers();
  const s = new AccountSession(backend, 'tab1', 'web', t.api);
  await s.enter('alice');
  await s.enter('bob');
  assert.equal(s.getState().usernameKey, 'bob');
  assert.equal((await backend.enter('alice', 'tab2', 'web')).status, 'logged_in', 'alice đã được nhả');
});

test('Session - timer heartbeat thật sự gọi backend', async () => {
  const { backend, clock } = setup();
  const t = fakeTimers();
  const s = new AccountSession(backend, 'tab1', 'web', t.api);
  await s.enter('duc');
  clock.advance(SESSION_TTL_MS - 1);
  t.fireAll();
  await new Promise((r) => setImmediate(r));
  clock.advance(10);
  assert.equal((await backend.enter('duc', 'tab2', 'web')).status, 'blocked', 'heartbeat đã gia hạn phiên');
});

test('Session - mỗi tab có session id riêng, tải lại giữ nguyên', () => {
  const store = new Map();
  const tabA = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
  const id1 = getTabSessionId(tabA);
  const id2 = getTabSessionId(tabA);
  assert.equal(id1, id2, 'reload cùng tab');
  const otherStore = new Map();
  const tabB = { getItem: (k) => otherStore.get(k) ?? null, setItem: (k, v) => otherStore.set(k, v) };
  assert.notEqual(getTabSessionId(tabB), id1, 'tab khác = session khác');
  assert.match(id1, /^[0-9a-f-]{36}$/);
});

// =================== Supabase backend (mock fetch) ===================

function mockFetch(handler) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body) });
    const { status = 200, json } = await handler(url, JSON.parse(init.body));
    return new Response(JSON.stringify(json), { status, headers: { 'Content-Type': 'application/json' } });
  };
  return { fn, calls };
}

test('Supabase - gọi đúng endpoint RPC, header và tham số', async () => {
  const { fn, calls } = mockFetch(() => ({
    json: { status: 'registered', username: 'Duc', username_key: 'duc' },
  }));
  const b = new SupabaseAccountBackend('https://abc.supabase.co/', 'anon-key', fn);
  const r = await b.enter('Duc', '11111111-1111-4111-8111-111111111111', 'iPhone');
  assert.deepEqual(r, { status: 'registered', username: 'Duc', usernameKey: 'duc' });
  assert.equal(calls[0].url, 'https://abc.supabase.co/rest/v1/rpc/enter_account');
  assert.equal(calls[0].init.headers.apikey, 'anon-key');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer anon-key');
  assert.deepEqual(calls[0].body, {
    p_username: 'Duc',
    p_session_id: '11111111-1111-4111-8111-111111111111',
    p_device: 'iPhone',
  });
});

test('Supabase - map trạng thái blocked', async () => {
  const { fn } = mockFetch(() => ({ json: { status: 'blocked', username: 'Duc', retry_after_seconds: 30 } }));
  const b = new SupabaseAccountBackend('https://abc.supabase.co', 'k', fn);
  assert.deepEqual(await b.enter('duc', 's', 'web'), { status: 'blocked', username: 'Duc', retryAfterSeconds: 30 });
});

test('Supabase - tên không hợp lệ bị chặn ở client, không gọi mạng', async () => {
  const { fn, calls } = mockFetch(() => ({ json: {} }));
  const b = new SupabaseAccountBackend('https://abc.supabase.co', 'k', fn);
  assert.deepEqual(await b.enter('a b', 's', 'web'), { status: 'invalid', reason: 'bad_chars' });
  assert.equal(calls.length, 0);
});

test('Supabase - lỗi máy chủ 500 / mất mạng trả "error", không crash', async () => {
  const { fn } = mockFetch(() => ({ status: 500, json: { message: 'boom' } }));
  const b = new SupabaseAccountBackend('https://abc.supabase.co', 'k', fn);
  const r = await b.enter('duc', 's', 'web');
  assert.equal(r.status, 'error');
  assert.match(r.message, /500/);

  const offline = new SupabaseAccountBackend('https://abc.supabase.co', 'k', async () => {
    throw new TypeError('Failed to fetch');
  });
  assert.equal((await offline.enter('duc', 's', 'web')).status, 'error');
  assert.equal(await offline.leave('duc', 's'), false, 'leave nuốt lỗi');
});

test('Supabase - thoát khi đóng tab dùng keepalive', async () => {
  const { fn, calls } = mockFetch(() => ({ json: true }));
  const b = new SupabaseAccountBackend('https://abc.supabase.co', 'k', fn);
  await b.leave('duc', 's', true);
  assert.equal(calls[0].url.endsWith('/rpc/leave_account'), true);
  assert.equal(calls[0].init.keepalive, true);
});
