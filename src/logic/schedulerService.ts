// =====================================================================
// Ma Sói Online & Offline — Match Scheduler & 15m Reminder (Sprint 39)
// Quản lý lịch hẹn chơi ma sói ("hẹn chơi sau mấy tiếng"), đếm ngược
// và kích hoạt thông báo nhắc nhở trước 15 phút.
// =====================================================================

export interface ScheduledMatch {
  id: string;
  hostUsername: string;
  hostDisplayName: string;
  targetFriendUsername?: string;
  targetFriendDisplayName?: string;
  tableName: string; // e.g. "Lều Trăng Máu #1 (8 Người)"
  scheduledAt: number; // Unix timestamp tính bằng mili-giây
  notes?: string;
  notified15m: boolean; // Đã bắn thông báo trước 15 phút chưa
  createdAt: number;
}

export interface CreateMatchInput {
  hostUsername: string;
  hostDisplayName: string;
  targetFriendUsername?: string;
  targetFriendDisplayName?: string;
  tableName?: string;
  hoursLater?: number;
  exactTimestamp?: number;
  notes?: string;
}

const STORAGE_KEY = 'masoi_scheduled_matches_v1';
export const REMINDER_THRESHOLD_MS = 15 * 60 * 1000; // 15 phút = 900,000ms

/**
 * Định dạng đếm ngược thời gian dễ đọc, ví dụ:
 * - "Còn 2 giờ 15 phút"
 * - "Còn 14 phút (Sắp diễn ra!)"
 * - "Đã đến giờ bắt đầu!"
 */
export function formatMatchCountdown(scheduledAt: number, now: number = Date.now()): string {
  const diff = scheduledAt - now;

  if (diff <= 0) {
    const elapsedMinutes = Math.floor(Math.abs(diff) / 60000);
    if (elapsedMinutes < 60) {
      return `Đã bắt đầu (${elapsedMinutes} phút trước)`;
    }
    return 'Đã đến giờ bắt đầu!';
  }

  const minutes = Math.ceil(diff / 60000);
  if (diff <= REMINDER_THRESHOLD_MS) {
    return `Còn ${minutes} phút (Sắp diễn ra!)`;
  }

  if (minutes < 60) {
    return `Còn ${minutes} phút`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (remainingMins === 0) {
    return `Còn ${hours} giờ`;
  }
  return `Còn ${hours} giờ ${remainingMins} phút`;
}

/**
 * Định dạng ngày giờ hiển thị (ví dụ: "21:30 - Hôm nay", "14:00 - Ngày mai")
 */
export function formatScheduledTime(scheduledAt: number): string {
  const date = new Date(scheduledAt);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;

  const today = new Date();
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear();

  if (isToday) return `${timeStr} Hôm nay`;
  if (isTomorrow) return `${timeStr} Ngày mai`;
  return `${timeStr} ngày ${date.getDate()}/${date.getMonth() + 1}`;
}

export class SchedulerService {
  private matches: ScheduledMatch[] = [];

  constructor(private storage: Storage | null = typeof window !== 'undefined' ? window.localStorage : null) {
    this.load();
  }

  private load(): void {
    if (!this.storage) return;
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      if (raw) {
        this.matches = JSON.parse(raw);
      }
    } catch {
      this.matches = [];
    }
  }

  private save(): void {
    if (!this.storage) return;
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(this.matches));
    } catch {
      // Bỏ qua lỗi hạn ngạch storage
    }
  }

  /**
   * Tạo lịch hẹn chơi mới
   */
  createMatch(input: CreateMatchInput, now: number = Date.now()): ScheduledMatch {
    let scheduledAt = input.exactTimestamp;
    if (!scheduledAt) {
      const hours = input.hoursLater && input.hoursLater > 0 ? input.hoursLater : 2;
      scheduledAt = now + hours * 60 * 60 * 1000;
    }

    const match: ScheduledMatch = {
      id: `match_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      hostUsername: input.hostUsername,
      hostDisplayName: input.hostDisplayName,
      targetFriendUsername: input.targetFriendUsername,
      targetFriendDisplayName: input.targetFriendDisplayName,
      tableName: input.tableName || 'Lều Trăng Máu #1',
      scheduledAt,
      notes: input.notes?.trim() || undefined,
      notified15m: false,
      createdAt: now,
    };

    this.matches.push(match);
    this.save();
    return match;
  }

  /**
   * Lấy danh sách lịch hẹn của một người chơi (cả ván do mình tạo và ván bạn bè hẹn mình)
   */
  getMatchesForUser(username: string, now: number = Date.now()): ScheduledMatch[] {
    const key = (username || '').toLowerCase().trim();
    return this.matches
      .filter((m) => {
        // Chỉ lấy những ván chưa quá hạn 4 tiếng
        const isNotExpired = m.scheduledAt > now - 4 * 60 * 60 * 1000;
        const isParticipant =
          m.hostUsername.toLowerCase().trim() === key ||
          (m.targetFriendUsername && m.targetFriendUsername.toLowerCase().trim() === key) ||
          !m.targetFriendUsername; // Lịch hẹn công khai
        return isNotExpired && isParticipant;
      })
      .sort((a, b) => a.scheduledAt - b.scheduledAt);
  }

  /**
   * Hủy lịch hẹn
   */
  cancelMatch(matchId: string, username: string): boolean {
    const key = (username || '').toLowerCase().trim();
    const index = this.matches.findIndex(
      (m) => m.id === matchId && m.hostUsername.toLowerCase().trim() === key
    );
    if (index !== -1) {
      this.matches.splice(index, 1);
      this.save();
      return true;
    }
    return false;
  }

  /**
   * Kiểm tra và kích hoạt thông báo nhắc nhở trước 15 phút.
   * Điều kiện kích hoạt:
   * 1. now >= scheduledAt - 15 phút
   * 2. now < scheduledAt (chưa quá giờ bắt đầu)
   * 3. notified15m === false (chưa từng bắn thông báo)
   */
  checkAndTriggerReminders(
    now: number,
    onTrigger: (match: ScheduledMatch, minutesRemaining: number) => void
  ): ScheduledMatch[] {
    const triggered: ScheduledMatch[] = [];

    for (const match of this.matches) {
      const diff = match.scheduledAt - now;
      if (diff <= REMINDER_THRESHOLD_MS && diff > 0 && !match.notified15m) {
        match.notified15m = true;
        triggered.push(match);
        const minutes = Math.max(1, Math.ceil(diff / 60000));
        onTrigger(match, minutes);
      }
    }

    if (triggered.length > 0) {
      this.save();
    }
    return triggered;
  }
}

export const schedulerService = new SchedulerService();
