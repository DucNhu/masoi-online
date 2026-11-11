/**
 * Account Gate — Ma Sói 3D (Sprint 38)
 *
 * Một ô nhập duy nhất: tên chưa tồn tại => tự đăng ký, đã tồn tại => đăng nhập.
 * Không mật khẩu (quyết định của PO 2026-11-11). Một tài khoản chỉ online ở 1 thiết bị:
 * thiết bị thứ 2 bị CHẶN cho tới khi phiên cũ thoát hoặc hết hạn heartbeat (45s).
 *
 * Backend:
 *  - SupabaseAccountBackend: gọi RPC trong supabase/migrations/001_account_gate.sql (nguồn chân lý).
 *  - LocalAccountBackend: mô phỏng y hệt luật trên trong bộ nhớ / localStorage để test & chạy offline.
 */

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
export const SESSION_TTL_MS = 45_000;
export const HEARTBEAT_INTERVAL_MS = 15_000;

// Phải khớp 100% với regex trong 001_account_gate.sql
const USERNAME_CHARS =
  /^[a-z0-9_àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+$/;

export type InvalidReason = 'too_short' | 'too_long' | 'bad_chars' | 'missing_session';

export type EnterResult =
  | { status: 'registered' | 'logged_in'; username: string; usernameKey: string }
  | { status: 'blocked'; username: string; retryAfterSeconds: number }
  | { status: 'invalid'; reason: InvalidReason }
  | { status: 'error'; message: string };

export function normalizeUsername(raw: string): string {
  return (raw ?? '').trim().normalize('NFC').toLowerCase();
}

export function validateUsername(raw: string): InvalidReason | null {
  const key = normalizeUsername(raw);
  if (key.length < USERNAME_MIN) return 'too_short';
  if (key.length > USERNAME_MAX) return 'too_long';
  if (!USERNAME_CHARS.test(key)) return 'bad_chars';
  return null;
}

export const INVALID_MESSAGES: Record<InvalidReason, string> = {
  too_short: `Tên cần ít nhất ${USERNAME_MIN} ký tự.`,
  too_long: `Tên tối đa ${USERNAME_MAX} ký tự.`,
  bad_chars: 'Chỉ dùng chữ cái (có dấu được), số và dấu gạch dưới _, không dấu cách.',
  missing_session: 'Không tạo được phiên đăng nhập, hãy tải lại trang.',
};

export interface AccountBackend {
  enter(username: string, sessionId: string, device: string): Promise<EnterResult>;
  heartbeat(username: string, sessionId: string): Promise<boolean>;
  leave(username: string, sessionId: string, keepalive?: boolean): Promise<boolean>;
}

// ---------------------------------------------------------------------------
// Local backend (bộ nhớ hoặc localStorage) — cùng luật với SQL
// ---------------------------------------------------------------------------

interface PlayerRow {
  displayName: string;
  createdAt: number;
  sessionId: string | null;
  device: string | null;
  lastSeen: number | null;
}

export interface RowStore {
  load(): Record<string, PlayerRow>;
  save(rows: Record<string, PlayerRow>): void;
}

export function memoryStore(): RowStore {
  let rows: Record<string, PlayerRow> = {};
  return {
    load: () => rows,
    save: (next) => {
      rows = next;
    },
  };
}

export function localStorageStore(key = 'masoi_local_accounts'): RowStore {
  return {
    load: () => {
      try {
        return JSON.parse(localStorage.getItem(key) || '{}');
      } catch {
        return {};
      }
    },
    save: (rows) => {
      try {
        localStorage.setItem(key, JSON.stringify(rows));
      } catch {
        // bộ nhớ đầy / private mode: bỏ qua
      }
    },
  };
}

export class LocalAccountBackend implements AccountBackend {
  constructor(
    private store: RowStore = memoryStore(),
    private now: () => number = () => Date.now()
  ) {}

  // Mỗi hàm chạy đồng bộ từ đầu tới cuối trước khi trả Promise => nguyên tử trong JS (tương đương row lock).
  async enter(username: string, sessionId: string, device: string): Promise<EnterResult> {
    if (!sessionId) return { status: 'invalid', reason: 'missing_session' };
    const invalid = validateUsername(username);
    if (invalid) return { status: 'invalid', reason: invalid };

    const key = normalizeUsername(username);
    const rows = { ...this.store.load() };
    const t = this.now();
    const row = rows[key];

    if (!row) {
      rows[key] = {
        displayName: username.trim().normalize('NFC'),
        createdAt: t,
        sessionId,
        device: device.slice(0, 120),
        lastSeen: t,
      };
      this.store.save(rows);
      return { status: 'registered', username: rows[key].displayName, usernameKey: key };
    }

    const live = row.sessionId !== null && row.lastSeen !== null && row.lastSeen > t - SESSION_TTL_MS;
    if (live && row.sessionId !== sessionId) {
      const retry = Math.max(1, Math.ceil(((row.lastSeen as number) + SESSION_TTL_MS - t) / 1000));
      return { status: 'blocked', username: row.displayName, retryAfterSeconds: retry };
    }

    rows[key] = { ...row, sessionId, device: device.slice(0, 120), lastSeen: t };
    this.store.save(rows);
    return { status: 'logged_in', username: row.displayName, usernameKey: key };
  }

  async heartbeat(username: string, sessionId: string): Promise<boolean> {
    const key = normalizeUsername(username);
    const rows = { ...this.store.load() };
    const row = rows[key];
    if (!row || row.sessionId !== sessionId) return false;
    rows[key] = { ...row, lastSeen: this.now() };
    this.store.save(rows);
    return true;
  }

  async leave(username: string, sessionId: string): Promise<boolean> {
    const key = normalizeUsername(username);
    const rows = { ...this.store.load() };
    const row = rows[key];
    if (!row || row.sessionId !== sessionId) return false;
    rows[key] = { ...row, sessionId: null, lastSeen: null };
    this.store.save(rows);
    return true;
  }
}

// ---------------------------------------------------------------------------
// Supabase backend (REST RPC, không cần cài SDK)
// ---------------------------------------------------------------------------

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export class SupabaseAccountBackend implements AccountBackend {
  constructor(
    private url: string,
    private anonKey: string,
    private fetchImpl: FetchLike = (...args) => fetch(...args)
  ) {
    this.url = url.replace(/\/+$/, '');
  }

  private async rpc<T>(fn: string, body: Record<string, unknown>, keepalive = false): Promise<T> {
    const res = await this.fetchImpl(`${this.url}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      keepalive,
      headers: {
        'Content-Type': 'application/json',
        apikey: this.anonKey,
        Authorization: `Bearer ${this.anonKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Supabase ${fn} ${res.status}: ${text.slice(0, 200)}`);
    }
    return (await res.json()) as T;
  }

  async enter(username: string, sessionId: string, device: string): Promise<EnterResult> {
    // Kiểm tra trước ở client để báo lỗi ngay, server vẫn kiểm tra lại.
    const invalid = validateUsername(username);
    if (invalid) return { status: 'invalid', reason: invalid };
    try {
      const r = await this.rpc<Record<string, unknown>>('enter_account', {
        p_username: username,
        p_session_id: sessionId,
        p_device: device,
      });
      switch (r.status) {
        case 'registered':
        case 'logged_in':
          return { status: r.status, username: String(r.username), usernameKey: String(r.username_key) };
        case 'blocked':
          return {
            status: 'blocked',
            username: String(r.username),
            retryAfterSeconds: Number(r.retry_after_seconds) || 1,
          };
        case 'invalid':
          return { status: 'invalid', reason: (r.reason as InvalidReason) || 'bad_chars' };
        default:
          return { status: 'error', message: 'Phản hồi máy chủ không hợp lệ.' };
      }
    } catch (err) {
      return { status: 'error', message: err instanceof Error ? err.message : String(err) };
    }
  }

  async heartbeat(username: string, sessionId: string): Promise<boolean> {
    return this.rpc<boolean>('account_heartbeat', { p_username: username, p_session_id: sessionId });
  }

  async leave(username: string, sessionId: string, keepalive = false): Promise<boolean> {
    try {
      return await this.rpc<boolean>('leave_account', { p_username: username, p_session_id: sessionId }, keepalive);
    } catch {
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// AccountSession — quản lý phiên của 1 tab: session id, heartbeat, thoát
// ---------------------------------------------------------------------------

export type SessionState =
  | { kind: 'signed_out' }
  | { kind: 'signed_in'; username: string; usernameKey: string; isNew: boolean }
  | { kind: 'lost'; username: string };

export interface TimerApi {
  setInterval(fn: () => void, ms: number): unknown;
  clearInterval(id: unknown): void;
}

const defaultTimers: TimerApi = {
  setInterval: (fn, ms) => setInterval(fn, ms),
  clearInterval: (id) => clearInterval(id as ReturnType<typeof setInterval>),
};

function randomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  // Fallback UUID v4 cho trình duyệt cũ
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** Mỗi TAB một session id (sessionStorage): tải lại trang giữ nguyên, tab/thiết bị khác thì khác. */
export function getTabSessionId(storage: Pick<Storage, 'getItem' | 'setItem'> | null = safeSessionStorage()): string {
  const KEY = 'masoi_session_id';
  const existing = storage?.getItem(KEY);
  if (existing) return existing;
  const id = randomId();
  storage?.setItem(KEY, id);
  return id;
}

function safeSessionStorage(): Storage | null {
  try {
    return typeof sessionStorage !== 'undefined' ? sessionStorage : null;
  } catch {
    return null;
  }
}

export class AccountSession {
  private state: SessionState = { kind: 'signed_out' };
  private listeners = new Set<(s: SessionState) => void>();
  private timerId: unknown = null;
  private pending: Promise<EnterResult> | null = null;

  constructor(
    private backend: AccountBackend,
    public readonly sessionId: string,
    private device = 'web',
    private timers: TimerApi = defaultTimers
  ) {}

  getState(): SessionState {
    return this.state;
  }

  subscribe(fn: (s: SessionState) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private setState(next: SessionState) {
    this.state = next;
    this.listeners.forEach((fn) => fn(next));
  }

  /** Bấm nút "Vào làng". Bấm liên tục 2 lần chỉ gửi 1 request. */
  enter(username: string): Promise<EnterResult> {
    if (this.pending) return this.pending;
    this.pending = this.doEnter(username).finally(() => {
      this.pending = null;
    });
    return this.pending;
  }

  private async doEnter(username: string): Promise<EnterResult> {
    // Đang đăng nhập tài khoản khác trong cùng tab => nhả tài khoản cũ trước
    if (this.state.kind === 'signed_in' && this.state.usernameKey !== normalizeUsername(username)) {
      await this.leave();
    }
    const result = await this.backend.enter(username, this.sessionId, this.device);
    if (result.status === 'registered' || result.status === 'logged_in') {
      this.setState({
        kind: 'signed_in',
        username: result.username,
        usernameKey: result.usernameKey,
        isNew: result.status === 'registered',
      });
      this.startHeartbeat();
    }
    return result;
  }

  /** Gọi định kỳ; public để test gọi trực tiếp. */
  async beat(): Promise<void> {
    if (this.state.kind !== 'signed_in') return;
    const username = this.state.username;
    try {
      const ok = await this.backend.heartbeat(username, this.sessionId);
      if (!ok && this.state.kind === 'signed_in') {
        this.stopHeartbeat();
        this.setState({ kind: 'lost', username });
      }
    } catch {
      // Mất mạng tạm thời: giữ phiên, lần sau thử lại. Nếu quá 45s server sẽ coi là offline.
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.timerId = this.timers.setInterval(() => {
      void this.beat();
    }, HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat() {
    if (this.timerId !== null) {
      this.timers.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  async leave(keepalive = false): Promise<void> {
    const s = this.state;
    this.stopHeartbeat();
    if (s.kind === 'signed_in') {
      await this.backend.leave(s.username, this.sessionId, keepalive);
    }
    this.setState({ kind: 'signed_out' });
  }

  dispose() {
    this.stopHeartbeat();
    this.listeners.clear();
  }
}

// ---------------------------------------------------------------------------
// Cấu hình mặc định cho app
// ---------------------------------------------------------------------------

function readEnv(name: string): string | undefined {
  try {
    const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
    return env?.[name] || undefined;
  } catch {
    return undefined;
  }
}

const DEFAULT_SUPABASE_URL = 'https://qjoeeryaocljubdrvpdq.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_IHVe3sFbGTA-vXyQrcxvew_yIeMGvmf';

export function isSupabaseConfigured(): boolean {
  const url = readEnv('VITE_SUPABASE_URL') || DEFAULT_SUPABASE_URL;
  const key = readEnv('VITE_SUPABASE_ANON_KEY') || DEFAULT_SUPABASE_ANON_KEY;
  return Boolean(url && key);
}

export function createDefaultBackend(): AccountBackend {
  const url = readEnv('VITE_SUPABASE_URL') || DEFAULT_SUPABASE_URL;
  const key = readEnv('VITE_SUPABASE_ANON_KEY') || DEFAULT_SUPABASE_ANON_KEY;
  if (url && key) return new SupabaseAccountBackend(url, key);
  // Chưa cấu hình Supabase: chạy local (chỉ có hiệu lực trong trình duyệt này)
  return new LocalAccountBackend(localStorageStore());
}
