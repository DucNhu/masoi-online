/**
 * Golden Hours Engine — Hệ thống Khung Giờ Vàng Săn Sói
 * Triết lý Zero-Bot: 100% người thật, tuyệt đối không có bot AI hay bot ảo.
 * Quy tụ toàn bộ người chơi vào các khung giờ cố định trong ngày để đảm bảo bàn chơi luôn đông đúc và chất lượng.
 */

export interface GoldenSession {
  id: string;
  name: string;
  shortName: string;
  description: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  icon: string;
  badgeColor: string;
}

export const GOLDEN_SESSIONS: GoldenSession[] = [
  {
    id: 'NOON',
    name: 'Phiên Trưa — Làng Thức Giấc',
    shortName: 'Phiên Trưa',
    description: 'Khung giờ nghỉ trưa thư giãn, các bàn chơi 8-10 người tốc chiến.',
    startHour: 11,
    startMinute: 30,
    endHour: 13,
    endMinute: 30,
    icon: '☀️',
    badgeColor: '#f59e0b',
  },
  {
    id: 'PRIME',
    name: 'Phiên Tối Hoàng Kim — Trăng Lên',
    shortName: 'Tối Hoàng Kim',
    description: 'Khung giờ cao điểm đông đúc nhất, quy tụ cao thủ và phòng bàn nhộn nhịp.',
    startHour: 19,
    startMinute: 30,
    endHour: 23,
    endMinute: 30,
    icon: '🌙',
    badgeColor: '#8b5cf6',
  },
  {
    id: 'MIDNIGHT',
    name: 'Phiên Đêm Trăng Máu — Săn Sói Khuya',
    shortName: 'Đêm Trăng Máu',
    description: 'Dành riêng cho các thợ săn cú đêm, kịch tính và căng thẳng tột độ.',
    startHour: 23,
    startMinute: 30,
    endHour: 1,
    endMinute: 30,
    icon: '🌕',
    badgeColor: '#ef4444',
  },
];

export interface GoldenHourStatus {
  isOpen: boolean;
  activeSession: GoldenSession | null;
  nextSession: GoldenSession;
  secondsRemaining: number;
  formattedCountdown: string;
  rsvpCount: number;
  hasRSVPed: boolean;
}

const RSVP_STORAGE_KEY = 'masoi_golden_rsvp_date';
const RSVP_COUNT_KEY = 'masoi_golden_rsvp_count_v2';
const BASE_COMMUNITY_RSVP = 88;

/**
 * Format giây thành chuỗi hiển thị HH:MM:SS
 */
export function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return '00:00:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const pad = (n: number) => n.toString().padStart(2, '0');
  if (hours > 0) {
    return `${pad(hours)}h : ${pad(minutes)}m : ${pad(seconds)}s`;
  }
  return `${pad(minutes)}m : ${pad(seconds)}s`;
}

/**
 * Kiểm tra xem thời điểm hiện tại có đang nằm trong khung giờ của session hay không
 */
function isTimeInSession(date: Date, session: GoldenSession): boolean {
  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const startMinutes = session.startHour * 60 + session.startMinute;
  let endMinutes = session.endHour * 60 + session.endMinute;

  // Xử lý phiên qua đêm (ví dụ 23:30 -> 01:30 ngày hôm sau)
  if (endMinutes < startMinutes) {
    // Phiên vắt qua nửa đêm
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

/**
 * Tính số giây còn lại cho đến khi kết thúc session hiện tại
 */
function getSecondsRemainingInSession(date: Date, session: GoldenSession): number {
  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const currentSecondsInDay = currentMinutes * 60 + date.getSeconds();

  let endMinutes = session.endHour * 60 + session.endMinute;
  if (endMinutes < session.startHour * 60 + session.startMinute) {
    // Vắt qua ngày hôm sau
    if (currentMinutes >= session.startHour * 60 + session.startMinute) {
      endMinutes += 24 * 60;
    }
  }

  const endSecondsInDay = endMinutes * 60;
  return Math.max(0, endSecondsInDay - currentSecondsInDay);
}

/**
 * Tính số giây cho đến khi bắt đầu session kế tiếp
 */
function getSecondsUntilSession(date: Date, session: GoldenSession): number {
  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const currentSecondsInDay = currentMinutes * 60 + date.getSeconds();

  let startMinutes = session.startHour * 60 + session.startMinute;
  if (startMinutes <= currentMinutes) {
    // Đã qua giờ bắt đầu hôm nay, phiên này sẽ diễn ra vào ngày mai
    startMinutes += 24 * 60;
  }

  const startSecondsInDay = startMinutes * 60;
  return Math.max(0, startSecondsInDay - currentSecondsInDay);
}

/**
 * Lấy trạng thái Khung Giờ Vàng hiện tại
 */
export function getGoldenHourStatus(now: Date = new Date()): GoldenHourStatus {
  let activeSession: GoldenSession | null = null;

  for (const session of GOLDEN_SESSIONS) {
    if (isTimeInSession(now, session)) {
      activeSession = session;
      break;
    }
  }

  const isOpen = activeSession !== null;

  // Tìm phiên tiếp theo gần nhất
  let nextSession = GOLDEN_SESSIONS[0];
  let minWaitSeconds = Infinity;

  for (const session of GOLDEN_SESSIONS) {
    if (session === activeSession) continue;
    const wait = getSecondsUntilSession(now, session);
    if (wait < minWaitSeconds) {
      minWaitSeconds = wait;
      nextSession = session;
    }
  }

  const secondsRemaining = isOpen && activeSession
    ? getSecondsRemainingInSession(now, activeSession)
    : minWaitSeconds;

  const formattedCountdown = formatCountdown(secondsRemaining);

  // Lấy dữ liệu RSVP
  let hasRSVPed = false;
  let rsvpCount = BASE_COMMUNITY_RSVP;

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const todayStr = now.toISOString().slice(0, 10);
      const savedDate = localStorage.getItem(RSVP_STORAGE_KEY);
      hasRSVPed = savedDate === todayStr;

      const savedCount = localStorage.getItem(RSVP_COUNT_KEY);
      if (savedCount) {
        rsvpCount = parseInt(savedCount, 10);
      }
    }
  } catch {
    // Fallback nếu không có localStorage
  }

  return {
    isOpen,
    activeSession,
    nextSession,
    secondsRemaining,
    formattedCountdown,
    rsvpCount,
    hasRSVPed,
  };
}

/**
 * Đăng ký báo danh (RSVP) cho hôm nay
 */
export function registerRSVP(now: Date = new Date()): { success: boolean; newCount: number } {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const todayStr = now.toISOString().slice(0, 10);
      const savedDate = localStorage.getItem(RSVP_STORAGE_KEY);

      let currentCount = BASE_COMMUNITY_RSVP;
      const savedCount = localStorage.getItem(RSVP_COUNT_KEY);
      if (savedCount) {
        currentCount = parseInt(savedCount, 10);
      }

      if (savedDate !== todayStr) {
        currentCount += 1;
        localStorage.setItem(RSVP_STORAGE_KEY, todayStr);
        localStorage.setItem(RSVP_COUNT_KEY, currentCount.toString());
        return { success: true, newCount: currentCount };
      }

      return { success: false, newCount: currentCount };
    }
  } catch {
    // ignore
  }
  return { success: true, newCount: BASE_COMMUNITY_RSVP + 1 };
}
