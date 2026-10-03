/**
 * Share & Deep Link Invite Module — Ma Sói Online
 * Hỗ trợ tạo đường dẫn mời vào phòng chơi trực tiếp qua tham số ?room=CODE,
 * tận dụng Web Share API của trình duyệt hoặc sao chép clipboard thông minh.
 */

/**
 * Tạo đường dẫn liên kết mời tham gia bàn chơi
 */
export function generateInviteUrl(roomId: string): string {
  if (typeof window === 'undefined') {
    return `https://masoi.app/?room=${roomId}`;
  }
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  return `${origin}${pathname}?room=${encodeURIComponent(roomId)}`;
}

/**
 * Trích xuất mã phòng từ URL hiện tại (nếu người chơi mở link mời)
 */
export function extractRoomCodeFromUrl(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room') || params.get('r');
    if (room && /^[A-Za-z0-9]{4,8}$/.test(room.trim())) {
      return room.trim().toUpperCase();
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * Xóa tham số ?room khỏi URL sau khi đã join để URL sạch sẽ
 */
export function clearRoomCodeFromUrl(): void {
  if (typeof window === 'undefined') return;

  try {
    const rawHref = window.location.search && !window.location.href.includes('?') 
      ? `${window.location.href}${window.location.search}`
      : window.location.href;
    const url = new URL(rawHref);
    url.searchParams.delete('room');
    url.searchParams.delete('r');
    const newPath = url.pathname + (url.search ? url.search : '') + url.hash;
    const docTitle = typeof document !== 'undefined' ? document.title : '';
    window.history.replaceState({}, docTitle, newPath);
  } catch {
    // ignore
  }
}

/**
 * Chia sẻ lời mời vào phòng qua Web Share API hoặc copy clipboard
 */
export async function shareRoomInvite(
  roomId: string,
  tableName?: string
): Promise<{ success: boolean; method: 'native_share' | 'clipboard' | 'fallback'; message: string }> {
  const url = generateInviteUrl(roomId);
  const title = `Vào Chơi Ma Sói — Bàn #${roomId}`;
  const text = `🐺 Tham gia bàn "${tableName || 'Săn Sói'}" cùng mình nhé! 100% người thật không bot. Mã phòng: ${roomId}`;

  // 1. Ưu tiên Web Share API trên thiết bị di động (iOS / Android)
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url,
      });
      return {
        success: true,
        method: 'native_share',
        message: 'Đã mở bảng chia sẻ ứng dụng!',
      };
    } catch (err: unknown) {
      // Người dùng bấm Hủy (AbortError) không phải lỗi
      if (err instanceof Error && err.name === 'AbortError') {
        return {
          success: false,
          method: 'native_share',
          message: 'Đã hủy chia sẻ.',
        };
      }
      // Fallback xuống clipboard nếu share lỗi
    }
  }

  // 2. Fallback sang Clipboard API
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      return {
        success: true,
        method: 'clipboard',
        message: `Đã sao chép liên kết mời bàn #${roomId} vào bộ nhớ tạm!`,
      };
    } catch {
      // Fallback xuống document.execCommand
    }
  }

  // 3. Fallback cuối cùng cho trình duyệt cũ
  if (typeof document !== 'undefined') {
    try {
      const input = document.createElement('textarea');
      input.value = url;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.focus();
      input.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(input);

      if (copied) {
        return {
          success: true,
          method: 'clipboard',
          message: `Đã sao chép liên kết mời bàn #${roomId}!`,
        };
      }
    } catch {
      // ignore
    }
  }

  return {
    success: false,
    method: 'fallback',
    message: `Mã phòng của bạn là ${roomId}. Hãy gửi mã này cho bạn bè!`,
  };
}
