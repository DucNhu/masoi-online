import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccountSession,
  SessionState,
  createDefaultBackend,
  getTabSessionId,
  isSupabaseConfigured,
  validateUsername,
  INVALID_MESSAGES,
  USERNAME_MAX,
} from '../logic/accountService';
import { BRAND_ASSETS } from '../constants/assets';

const LAST_USERNAME_KEY = 'masoi_account_username'; // localStorage: chỉ để điền sẵn ô nhập
const TAB_ACCOUNT_KEY = 'masoi_tab_account'; // sessionStorage: tài khoản của RIÊNG tab này, dùng để tự vào lại khi reload

function readTabAccount(): string {
  try {
    return sessionStorage.getItem(TAB_ACCOUNT_KEY) || '';
  } catch {
    return '';
  }
}

function deviceLabel(): string {
  if (typeof navigator === 'undefined') return 'web';
  const ua = navigator.userAgent;
  if (/iPhone|iPad/.test(ua)) return 'iOS';
  if (/Android/.test(ua)) return 'Android';
  if (/Mac/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows';
  return 'web';
}

function readLastUsername(): string {
  try {
    return localStorage.getItem(LAST_USERNAME_KEY) || '';
  } catch {
    return '';
  }
}

/** Ghi tên tài khoản vào các key cũ mà Header / 3D / Lobby đang đọc. */
function applySignedIn(username: string, isNew: boolean) {
  try {
    sessionStorage.setItem(TAB_ACCOUNT_KEY, username);
    localStorage.setItem(LAST_USERNAME_KEY, username);
    localStorage.setItem('ma_soi_player_name', username);
    localStorage.setItem('masoi_player_name', username);
    if (isNew) localStorage.removeItem('masoi_player_created'); // tài khoản mới => mở màn Tạo Nhân Vật
  } catch {
    // ignore
  }
}

interface Props {
  children: React.ReactNode;
}

export const AccountGate: React.FC<Props> = ({ children }) => {
  const session = useMemo(
    () => new AccountSession(createDefaultBackend(), getTabSessionId(), deviceLabel()),
    []
  );
  const [state, setState] = useState<SessionState>(session.getState());
  const [name, setName] = useState<string>(readLastUsername);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockedFor, setBlockedFor] = useState<number>(0);
  const autoTriedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => session.subscribe(setState), [session]);

  const submit = useCallback(
    async (raw: string, silent = false) => {
      const invalid = validateUsername(raw);
      if (invalid) {
        if (!silent) setError(INVALID_MESSAGES[invalid]);
        return;
      }
      setSubmitting(true);
      setError(null);
      const r = await session.enter(raw);
      setSubmitting(false);
      if (r.status === 'registered' || r.status === 'logged_in') {
        applySignedIn(r.username, r.status === 'registered');
        setBlockedFor(0);
      } else if (r.status === 'blocked') {
        setBlockedFor(r.retryAfterSeconds);
        setError(`Tài khoản "${r.username}" đang online ở thiết bị khác.`);
      } else if (r.status === 'invalid') {
        setError(INVALID_MESSAGES[r.reason]);
      } else if (!silent) {
        setError('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.');
      }
    },
    [session]
  );

  // Tải lại trang trong cùng tab: tự vào lại (cùng session id nên không bị chặn bởi chính mình)
  useEffect(() => {
    if (autoTriedRef.current) return;
    autoTriedRef.current = true;
    const last = readTabAccount();
    if (last) void submit(last, true);
  }, [submit]);

  // Đếm ngược khi bị chặn
  useEffect(() => {
    if (blockedFor <= 0) return;
    const t = setTimeout(() => setBlockedFor((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [blockedFor]);

  // Đóng tab / tải lại: nhả phiên ngay để thiết bị khác không phải chờ 45s
  useEffect(() => {
    const onHide = () => {
      void session.leave(true);
    };
    const onLogout = () => {
      void session.leave().then(() => {
        try {
          localStorage.removeItem(LAST_USERNAME_KEY);
          sessionStorage.removeItem(TAB_ACCOUNT_KEY);
        } catch {
          // ignore
        }
      });
    };
    window.addEventListener('pagehide', onHide);
    window.addEventListener('masoi-account-logout', onLogout);
    return () => {
      window.removeEventListener('pagehide', onHide);
      window.removeEventListener('masoi-account-logout', onLogout);
    };
  }, [session]);

  // pagehide cũng bắn khi tab quay lại từ bfcache; khi trang hiện lại thì vào lại
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        const last = readTabAccount();
        if (last) void submit(last, true);
      }
    };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, [submit]);

  if (state.kind === 'signed_in') return <>{children}</>;

  const isLost = state.kind === 'lost';
  const busy = submitting || blockedFor > 0;

  return (
    <div style={styles.backdrop}>
      <form
        style={styles.card}
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy) void submit(name);
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              border: '1.5px solid rgba(250, 204, 21, 0.55)',
              boxShadow: '0 0 20px rgba(250, 204, 21, 0.25), 0 8px 16px rgba(0, 0, 0, 0.4)',
              overflow: 'hidden',
              background: 'radial-gradient(circle, #2e1065 0%, #0f172a 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={BRAND_ASSETS.appIcon}
              alt="Ma Sói 3D Logo"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>
        <h1 style={styles.title}>Ma Sói 3D</h1>
        <p style={styles.subtitle}>
          {isLost
            ? 'Tài khoản vừa được đăng nhập ở thiết bị khác. Bạn đã bị đăng xuất khỏi máy này.'
            : 'Nhập tên tài khoản. Chưa có thì hệ thống tự tạo mới.'}
        </p>

        <label htmlFor="masoi-account-name" style={styles.label}>
          Tên tài khoản
        </label>
        <input
          id="masoi-account-name"
          ref={inputRef}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          maxLength={USERNAME_MAX + 4}
          autoFocus
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="vd: tho_san_99"
          style={styles.input}
          disabled={submitting}
        />

        {error && (
          <div role="alert" style={styles.error}>
            {error}
            {blockedFor > 0 && <div style={{ marginTop: 4 }}>Thử lại sau {blockedFor}s.</div>}
          </div>
        )}

        <button type="submit" disabled={busy} style={{ ...styles.button, opacity: busy ? 0.55 : 1 }}>
          {submitting ? 'Đang vào…' : blockedFor > 0 ? `Chờ ${blockedFor}s` : 'Vào Làng'}
        </button>

        {!isSupabaseConfigured() && (
          <p style={styles.devNote}>
            ⚠️ Chưa kết nối máy chủ tài khoản: đang lưu tạm trong trình duyệt này.
          </p>
        )}
      </form>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 100000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom))',
    background: 'radial-gradient(circle at 50% 30%, #2d1b4e 0%, #0a0a12 70%)',
    fontFamily: "'Be Vietnam Pro', 'Montserrat', sans-serif",
  },
  card: {
    width: '100%',
    maxWidth: 380,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: '28px 22px',
    borderRadius: 22,
    background: 'rgba(15, 15, 30, 0.82)',
    border: '1px solid rgba(244, 196, 48, 0.3)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 30px rgba(245, 158, 11, 0.2)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    color: '#f8fafc',
  },
  title: {
    margin: 0,
    textAlign: 'center',
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 900,
    fontSize: '1.5rem',
    color: '#f4c430',
    letterSpacing: '0.04em',
  },
  subtitle: { margin: '0 0 8px', textAlign: 'center', fontSize: '0.86rem', color: '#cbd5e1', lineHeight: 1.45 },
  label: { fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' },
  input: {
    height: 48,
    padding: '0 14px',
    borderRadius: 14,
    border: '1.5px solid rgba(255,255,255,0.18)',
    background: 'rgba(0,0,0,0.35)',
    color: '#fff',
    fontSize: '1rem', // >= 16px để iOS không tự zoom
    outline: 'none',
    touchAction: 'manipulation',
  },
  error: {
    padding: '10px 12px',
    borderRadius: 12,
    background: 'rgba(139, 30, 45, 0.3)',
    border: '1px solid rgba(239, 68, 68, 0.45)',
    color: '#fecaca',
    fontSize: '0.82rem',
  },
  button: {
    height: 50,
    marginTop: 6,
    borderRadius: 14,
    border: 'none',
    background: 'linear-gradient(135deg, #4338ca 0%, #7c3aed 45%, #ea580c 100%)',
    boxShadow: '0 4px 16px rgba(234, 88, 12, 0.35)',
    color: '#fff',
    fontWeight: 800,
    fontSize: '1rem',
    cursor: 'pointer',
    touchAction: 'manipulation',
  },
  devNote: { margin: '6px 0 0', fontSize: '0.72rem', color: '#fbbf24', textAlign: 'center' },
};
