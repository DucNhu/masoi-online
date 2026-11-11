// =====================================================================
// Ma Sói Online & Offline — Notification Service (Sprint 39)
// Tích hợp Service Worker & Web Notifications API để gửi thông báo
// trình duyệt nhắc nhở người chơi trước giờ hẹn ván ma sói 15 phút.
// =====================================================================

import type { ScheduledMatch } from './schedulerService';

export class NotificationService {
  private timerId: ReturnType<typeof setInterval> | null = null;
  private soundAudio: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== 'undefined' && typeof Audio !== 'undefined') {
      try {
        // Âm thanh chuông báo ma sói nhẹ nhàng
        this.soundAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        this.soundAudio.volume = 0.6;
      } catch {
        this.soundAudio = null;
      }
    }
  }

  /** Trình duyệt có hỗ trợ Notification không */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /** Trạng thái quyền hiện tại: 'granted' | 'denied' | 'default' */
  getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  /** Yêu cầu người chơi cấp quyền thông báo trình duyệt */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';
    try {
      const res = await Notification.requestPermission();
      return res;
    } catch {
      return 'denied';
    }
  }

  /** Phát âm thanh chuông báo nếu được hỗ trợ */
  playChime(): void {
    if (this.soundAudio) {
      try {
        this.soundAudio.currentTime = 0;
        void this.soundAudio.play().catch(() => {});
      } catch {
        // Trình duyệt có thể chặn autoplay nếu chưa tương tác
      }
    }
  }

  /**
   * Bắn thông báo trình duyệt (Service Worker Notification)
   */
  async showMatchNotification(
    match: ScheduledMatch,
    minutesRemaining: number = 15
  ): Promise<boolean> {
    this.playChime();

    // Rung điện thoại nếu hỗ trợ
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch {
        // Bỏ qua
      }
    }

    if (!this.isSupported() || Notification.permission !== 'granted') {
      return false;
    }

    const title = `🐺 Sắp Đến Giờ Hẹn Ma Sói! (Còn ${minutesRemaining} phút)`;
    const body = `Ván đấu "${match.tableName}" cùng ${
      match.targetFriendDisplayName || 'bạn bè'
    } sắp bắt đầu. Mau vào lều chuẩn bị nhé!`;

    const options: NotificationOptions = {
      body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: `masoi-match-${match.id}`,
      data: {
        matchId: match.id,
        tableName: match.tableName,
        url: typeof window !== 'undefined' ? window.location.href : '/',
      },
    };

    // 1. Thử dùng Service Worker (chuẩn PWA, hiện cả khi tab đang ẩn)
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (reg && 'showNotification' in reg) {
          await reg.showNotification(title, options);
          return true;
        }
      } catch {
        // Fallback sang thông báo thường bên dưới
      }
    }

    // 2. Fallback sang Web Notification API thường
    try {
      new Notification(title, options);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Bắn thông báo thử nghiệm để người dùng test ngay trên máy
   */
  async testNotification(): Promise<boolean> {
    const dummyMatch: ScheduledMatch = {
      id: 'test_demo',
      hostUsername: 'ban',
      hostDisplayName: 'Bạn',
      targetFriendDisplayName: 'Hội Thợ Săn',
      tableName: 'Lều Trăng Máu #1 (Bàn Test)',
      scheduledAt: Date.now() + 15 * 60 * 1000,
      notified15m: false,
      createdAt: Date.now(),
    };
    return this.showMatchNotification(dummyMatch, 15);
  }

  /**
   * Khởi động vòng lặp kiểm tra định kỳ (Daemon) mỗi 10 giây
   */
  startReminderDaemon(
    checkAndTrigger: (onNotify: (match: ScheduledMatch, mins: number) => void) => void
  ): void {
    if (this.timerId !== null) return;

    this.timerId = setInterval(() => {
      checkAndTrigger((match, mins) => {
        void this.showMatchNotification(match, mins);
      });
    }, 10000);
  }

  /** Dừng daemon */
  stopReminderDaemon(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}

export const notificationService = new NotificationService();
