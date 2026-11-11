// =====================================================================
// Ma Sói Online & Offline — Friend & Hunter Code Service (Sprint 39)
// Quản lý danh sách bạn bè, mã thợ săn (Hunter Code), lời mời kết bạn.
// Hoạt động offline-first với localStorage fallback, hỗ trợ đồng bộ Supabase.
// =====================================================================

export interface FriendEntry {
  username: string;
  displayName: string;
  hunterCode: string;
  avatar?: string;
  addedAt: number;
}

export interface FriendRequest {
  id: string;
  fromUsername: string;
  fromDisplayName: string;
  fromHunterCode: string;
  toUsername: string;
  createdAt: number;
  status: 'pending' | 'accepted' | 'declined';
}

export interface FriendStorageState {
  friends: Record<string, FriendEntry[]>; // username -> danh sách bạn
  requests: FriendRequest[];             // danh sách lời mời đang chờ
}

/**
 * Sinh mã Hunter Code duy nhất và dễ nhớ cho người chơi từ username.
 * Ví dụ: "aduckuba41" -> "HS-ADU7K2"
 */
export function generateHunterCode(username: string): string {
  const clean = (username || '').trim().toLowerCase();
  if (!clean) return 'HS-WOLF00';

  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);
  const code = absHash.toString(36).toUpperCase().padStart(4, '0').slice(0, 4);
  const prefix = clean.replace(/[^a-z0-9]/g, '').slice(0, 3).toUpperCase().padEnd(3, 'X');
  return `HS-${prefix}${code}`;
}

const STORAGE_KEY = 'masoi_friends_system_v1';

export class FriendService {
  private state: FriendStorageState = { friends: {}, requests: [] };

  constructor(private storage: Storage | null = typeof window !== 'undefined' ? window.localStorage : null) {
    this.load();
  }

  private load(): void {
    if (!this.storage) return;
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      if (raw) {
        this.state = JSON.parse(raw);
      }
    } catch {
      this.state = { friends: {}, requests: [] };
    }
  }

  private save(): void {
    if (!this.storage) return;
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Bỏ qua lỗi hạn ngạch storage
    }
  }

  /** Lấy danh sách bạn bè của một user */
  getFriends(username: string): FriendEntry[] {
    const key = username.toLowerCase().trim();
    return this.state.friends[key] || [];
  }

  /** Lấy danh sách lời mời kết bạn gửi đến user này */
  getPendingRequests(username: string): FriendRequest[] {
    const key = username.toLowerCase().trim();
    return this.state.requests.filter(
      (r) => r.toUsername.toLowerCase().trim() === key && r.status === 'pending'
    );
  }

  /** Gửi lời mời kết bạn bằng username hoặc hunter code */
  sendRequest(
    fromUsername: string,
    fromDisplayName: string,
    targetIdentifier: string
  ): { ok: boolean; message: string; request?: FriendRequest } {
    const fromKey = fromUsername.toLowerCase().trim();
    const targetClean = targetIdentifier.trim();

    if (!targetClean) {
      return { ok: false, message: 'Vui lòng nhập Tên tài khoản hoặc Hunter Code.' };
    }

    // Không tự kết bạn với chính mình
    if (
      targetClean.toLowerCase() === fromKey ||
      targetClean.toUpperCase() === generateHunterCode(fromKey)
    ) {
      return { ok: false, message: 'Bạn không thể tự kết bạn với chính mình!' };
    }

    // Kiểm tra xem đã là bạn bè chưa
    const existingFriends = this.getFriends(fromKey);
    const isAlreadyFriend = existingFriends.some(
      (f) =>
        f.username.toLowerCase() === targetClean.toLowerCase() ||
        f.hunterCode.toUpperCase() === targetClean.toUpperCase()
    );
    if (isAlreadyFriend) {
      return { ok: false, message: 'Hai bạn đã là bạn bè của nhau rồi!' };
    }

    // Xác định toUsername (nếu nhập Hunter Code thì tra cứu hoặc giữ nguyên)
    const toUsername = targetClean;

    // Kiểm tra trùng lặp lời mời chưa xử lý
    const duplicate = this.state.requests.find(
      (r) =>
        r.fromUsername.toLowerCase() === fromKey &&
        (r.toUsername.toLowerCase() === toUsername.toLowerCase() ||
          r.toUsername.toUpperCase() === toUsername.toUpperCase()) &&
        r.status === 'pending'
    );
    if (duplicate) {
      return { ok: false, message: 'Bạn đã gửi lời mời kết bạn cho người này rồi, hãy chờ phản hồi nhé!' };
    }

    const req: FriendRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      fromUsername,
      fromDisplayName,
      fromHunterCode: generateHunterCode(fromUsername),
      toUsername,
      createdAt: Date.now(),
      status: 'pending',
    };

    this.state.requests.push(req);
    this.save();
    return { ok: true, message: 'Đã gửi lời mời kết bạn thành công!', request: req };
  }

  /** Chấp nhận lời mời kết bạn */
  acceptRequest(requestId: string, currentUsername: string): { ok: boolean; message: string } {
    const reqIndex = this.state.requests.findIndex((r) => r.id === requestId);
    if (reqIndex === -1) {
      return { ok: false, message: 'Lời mời không tồn tại hoặc đã bị hủy.' };
    }

    const req = this.state.requests[reqIndex];
    const currKey = currentUsername.toLowerCase().trim();

    // Thêm bạn cho cả 2 bên (2 chiều)
    const fromKey = req.fromUsername.toLowerCase().trim();

    if (!this.state.friends[currKey]) this.state.friends[currKey] = [];
    if (!this.state.friends[fromKey]) this.state.friends[fromKey] = [];

    // Thêm người gửi vào list của người nhận
    if (!this.state.friends[currKey].some((f) => f.username.toLowerCase() === fromKey)) {
      this.state.friends[currKey].push({
        username: req.fromUsername,
        displayName: req.fromDisplayName,
        hunterCode: req.fromHunterCode,
        addedAt: Date.now(),
      });
    }

    // Thêm người nhận vào list của người gửi
    if (!this.state.friends[fromKey].some((f) => f.username.toLowerCase() === currKey)) {
      this.state.friends[fromKey].push({
        username: currentUsername,
        displayName: currentUsername,
        hunterCode: generateHunterCode(currentUsername),
        addedAt: Date.now(),
      });
    }

    // Cập nhật trạng thái request
    req.status = 'accepted';
    this.save();
    return { ok: true, message: `Đã kết bạn thành công với ${req.fromDisplayName}!` };
  }

  /** Từ chối lời mời kết bạn */
  declineRequest(requestId: string): { ok: boolean } {
    const req = this.state.requests.find((r) => r.id === requestId);
    if (req) {
      req.status = 'declined';
      this.save();
    }
    return { ok: true };
  }

  /** Xóa bạn bè */
  removeFriend(username: string, friendUsername: string): { ok: boolean } {
    const uKey = username.toLowerCase().trim();
    const fKey = friendUsername.toLowerCase().trim();

    if (this.state.friends[uKey]) {
      this.state.friends[uKey] = this.state.friends[uKey].filter(
        (f) => f.username.toLowerCase() !== fKey
      );
    }
    if (this.state.friends[fKey]) {
      this.state.friends[fKey] = this.state.friends[fKey].filter(
        (f) => f.username.toLowerCase() !== uKey
      );
    }
    this.save();
    return { ok: true };
  }
}

export const friendService = new FriendService();
