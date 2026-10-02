import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Native Bridge Adapter — Quản lý tính năng chuyên biệt trên iOS & Android
 */
export class NativeBridge {
  private static isInitialized = false;

  /**
   * Khởi tạo các cấu hình Native khi ứng dụng khởi chạy
   */
  public static async init(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (Capacitor.isNativePlatform()) {
      try {
        // Cấu hình Status Bar màu tối tiệp màu với theme Ma Sói
        await StatusBar.setStyle({ style: Style.Dark });
        if (Capacitor.getPlatform() === 'android') {
          await StatusBar.setBackgroundColor({ color: '#08090f' });
        }
      } catch (err) {
        console.warn('StatusBar configuration skipped:', err);
      }
    }
  }

  /**
   * Rung phản hồi xúc giác (Taptic Engine trên iPhone & Haptic Vibrator trên Android)
   */
  public static async hapticImpact(style: 'light' | 'medium' | 'heavy' = 'light'): Promise<void> {
    try {
      if (Capacitor.isPluginAvailable('Haptics')) {
        let impactStyle = ImpactStyle.Light;
        if (style === 'medium') impactStyle = ImpactStyle.Medium;
        else if (style === 'heavy') impactStyle = ImpactStyle.Heavy;

        await Haptics.impact({ style: impactStyle });
        return;
      }
    } catch {
      // Fallback web
    }

    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      const duration = style === 'light' ? 25 : style === 'medium' ? 50 : 100;
      navigator.vibrate(duration);
    }
  }

  /**
   * Rung thông báo sự kiện (Thắng / Chết / Bị cắn)
   */
  public static async hapticNotification(type: 'success' | 'warning' | 'error' = 'success'): Promise<void> {
    try {
      if (Capacitor.isPluginAvailable('Haptics')) {
        let notifType = NotificationType.Success;
        if (type === 'warning') notifType = NotificationType.Warning;
        else if (type === 'error') notifType = NotificationType.Error;

        await Haptics.notification({ type: notifType });
        return;
      }
    } catch {
      // Fallback web
    }

    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      navigator.vibrate([40, 60, 40]);
    }
  }
}
