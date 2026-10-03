/**
 * Danh mục Huy Hiệu Danh Dự (Hunter Achievements & Badges)
 * Phần thưởng danh giá dành riêng cho người chơi thật trong Ma Sói Online.
 */

export interface AchievementBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'VILLAGE' | 'WEREWOLF' | 'SPECIAL' | 'GENERAL';
}

export const HUNTER_BADGES: AchievementBadge[] = [
  {
    id: 'FIRST_BLOOD',
    name: 'Khởi Đầu Săn Sói',
    description: 'Tham gia và hoàn thành ván đấu trực tuyến đầu tiên.',
    icon: '⚔️',
    color: '#38bdf8',
    category: 'GENERAL',
  },
  {
    id: 'KEEN_EYE',
    name: 'Mắt Thần Trăng Sáng',
    description: 'Tiên Tri soi chính xác danh tính của Ma Sói trong đêm.',
    icon: '🔮',
    color: '#818cf8',
    category: 'VILLAGE',
  },
  {
    id: 'IRON_SHIELD',
    name: 'Khiên Thép Hộ Thể',
    description: 'Bảo Vệ che chở thành công nạn nhân thoát khỏi vuốt sói.',
    icon: '🛡️',
    color: '#34d399',
    category: 'VILLAGE',
  },
  {
    id: 'MASTER_ALCHEMIST',
    name: 'Dược Sĩ Toàn Năng',
    description: 'Phù Thủy sử dụng thần dược hoặc độc dược thay đổi cục diện trận đấu.',
    icon: '🧪',
    color: '#c084fc',
    category: 'VILLAGE',
  },
  {
    id: 'VENGEFUL_SHOT',
    name: 'Phát Đạn Báo Thù',
    description: 'Thợ Săn khi ngã xuống bắn hạ chuẩn xác kẻ địch.',
    icon: '🏹',
    color: '#f59e0b',
    category: 'VILLAGE',
  },
  {
    id: 'WISE_LEADER',
    name: 'Thị Trưởng Quyền Uy',
    description: 'Đảm nhiệm chức vị Thị Trưởng và dẫn dắt làng giành chiến thắng.',
    icon: '👑',
    color: '#fbbf24',
    category: 'SPECIAL',
  },
  {
    id: 'FOOL_MASTER',
    name: 'Cú Lừa Thế Kỷ',
    description: 'Kẻ Ngốc lật bài thành công khi bị dân làng vote treo cổ.',
    icon: '🃏',
    color: '#ec4899',
    category: 'SPECIAL',
  },
  {
    id: 'SILENT_PREDATOR',
    name: 'Sói Đầu Đàn',
    description: 'Phe Ma Sói tiêu diệt toàn bộ dân làng và giành chiến thắng áp đảo.',
    icon: '🐺',
    color: '#ef4444',
    category: 'WEREWOLF',
  },
  {
    id: 'SURVIVOR',
    name: 'Người Sống Sót Cuối Cùng',
    description: 'Giữ được mạng sống cho đến khi ván đấu phân định thắng bại.',
    icon: '✨',
    color: '#10b981',
    category: 'GENERAL',
  },
  {
    id: 'VETERAN_HUNTER',
    name: 'Thợ Săn Lão Luyện',
    description: 'Thi đấu từ 10 ván Ma Sói trở lên trong cộng đồng người thật.',
    icon: '🏆',
    color: '#eab308',
    category: 'GENERAL',
  },
];
