import { RoleDefinition, RoleId, CardRank, CardMappingConfig } from '../types/game';

export const ALL_CARD_RANKS: CardRank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const ROLE_DEFINITIONS: Record<RoleId, RoleDefinition> = {
  WEREWOLF: {
    id: 'WEREWOLF',
    name: 'Ma Sói',
    nameEn: 'Werewolf',
    defaultRank: 'K',
    team: 'WEREWOLF',
    description: 'Thức dậy mỗi đêm cùng đàn sói để chọn 1 nạn nhân cắn chết.',
    nightOrder: 3,
    wakeEveryNight: true,
    iconName: 'Wolf',
    color: '#ef4444',
    badgeBg: 'rgba(239, 68, 68, 0.15)',
  },
  SEER: {
    id: 'SEER',
    name: 'Tiên Tri',
    nameEn: 'Seer',
    defaultRank: 'A',
    team: 'VILLAGE',
    description: 'Mỗi đêm thức dậy soi danh tính 1 người chơi để biết là Sói hay Người tốt.',
    nightOrder: 5,
    wakeEveryNight: true,
    iconName: 'Eye',
    color: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
  },
  WITCH: {
    id: 'WITCH',
    name: 'Phù Thủy',
    nameEn: 'Witch',
    defaultRank: 'Q',
    team: 'VILLAGE',
    description: 'Có 2 bình dược dùng 1 lần trong ván: 1 Bình Cứu (cứu người bị cắn) và 1 Bình Độc (giết 1 người).',
    nightOrder: 4,
    wakeEveryNight: true,
    iconName: 'FlaskRound',
    color: '#a855f7',
    badgeBg: 'rgba(168, 85, 247, 0.15)',
  },
  BODYGUARD: {
    id: 'BODYGUARD',
    name: 'Bảo Vệ',
    nameEn: 'Bodyguard',
    defaultRank: 'J',
    team: 'VILLAGE',
    description: 'Mỗi đêm thức dậy chọn 1 người bảo vệ khỏi cú cắn của Sói (không bảo vệ 1 người 2 đêm liền).',
    nightOrder: 2,
    wakeEveryNight: true,
    iconName: 'Shield',
    color: '#f59e0b',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
  },
  HUNTER: {
    id: 'HUNTER',
    name: 'Thợ Săn',
    nameEn: 'Hunter',
    defaultRank: '10',
    team: 'VILLAGE',
    description: 'Khi bị chết (bị cắn, bị treo cổ hoặc bị đầu độc), có quyền bắn chết thêm 1 người bất kỳ.',
    nightOrder: 0,
    wakeEveryNight: false,
    iconName: 'Crosshair',
    color: '#10b981',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
  },
  CUPID: {
    id: 'CUPID',
    name: 'Thần Tình Yêu',
    nameEn: 'Cupid',
    defaultRank: '9',
    team: 'VILLAGE',
    description: 'Chỉ thức dậy đêm đầu tiên để chọn 2 người làm Cặp đôi. Nếu 1 người chết, người kia chết theo.',
    nightOrder: 1,
    wakeEveryNight: false,
    iconName: 'Heart',
    color: '#ec4899',
    badgeBg: 'rgba(236, 72, 153, 0.15)',
  },
  MINION: {
    id: 'MINION',
    name: 'Kẻ Bán Tơ (Phản Bội)',
    nameEn: 'Minion',
    defaultRank: '8',
    team: 'WEREWOLF',
    description: 'Biết mặt đàn Sói, hỗ trợ Sói thắng nhưng khi Tiên Tri soi thì ra kết quả Dân.',
    nightOrder: 0,
    wakeEveryNight: false,
    iconName: 'VenetianMask',
    color: '#f97316',
    badgeBg: 'rgba(249, 115, 22, 0.15)',
  },
  VILLAGER: {
    id: 'VILLAGER',
    name: 'Dân Làng',
    nameEn: 'Villager',
    defaultRank: ['2', '3', '4', '5', '6', '7', '8', '9'],
    team: 'VILLAGE',
    description: 'Dân làng thuần túy, ngủ say trong đêm, dùng suy luận để vote treo cổ Sói vào ban ngày.',
    nightOrder: 0,
    wakeEveryNight: false,
    iconName: 'User',
    color: '#94a3b8',
    badgeBg: 'rgba(148, 163, 184, 0.15)',
  },
};

export const DEFAULT_CARD_MAPPINGS: CardMappingConfig = {
  'A': 'SEER',       // Át = Tiên Tri
  'K': 'WEREWOLF',   // Già = Ma Sói
  'Q': 'WITCH',      // Đầm = Phù Thủy
  'J': 'BODYGUARD',  // Bồi = Bảo Vệ
  '10': 'HUNTER',    // 10 = Thợ Săn
  '9': 'VILLAGER',   // 9 = Dân Làng
  '8': 'VILLAGER',   // 8 = Dân Làng
  '7': 'VILLAGER',
  '6': 'VILLAGER',
  '5': 'VILLAGER',
  '4': 'VILLAGER',
  '3': 'VILLAGER',
  '2': 'VILLAGER',
};

export const MODERATOR_SCRIPTS = {
  nightSleep: '🌙 Trời đã tối rồi, xin mời cả làng nhắm mắt lại và đi ngủ...',
  bodyguardWake: '🛡️ Bảo Vệ (Lá J) thức dậy! Hãy chỉ tay vào người mà bạn muốn che chắn đêm nay (không chọn người đêm trước)... Cảm ơn Bảo Vệ, mời Bảo Vệ đi ngủ.',
  werewolfWake: '🐺 Đàn Ma Sói (Lá K) thức dậy! Hãy nhìn nhau và thống nhất chọn 1 nạn nhân để cắn đêm nay... Cảm ơn Ma Sói, mời Ma Sói đi ngủ.',
  witchWake: '🧪 Phù Thủy (Lá Q) thức dậy! Đêm nay người này bị cắn [chỉ tay]. Bạn có dùng Bình Cứu không? Bạn có muốn dùng Bình Độc giết ai không? ... Cảm ơn Phù Thủy, mời Phù Thủy đi ngủ.',
  seerWake: '🔮 Tiên Tri (Lá A) thức dậy! Hãy chỉ tay vào 1 người bạn muốn soi... [Quản trò gật đầu nếu là Sói, lắc đầu nếu là Dân/Người tốt]... Cảm ơn Tiên Tri, mời Tiên Tri đi ngủ.',
  dayDawn: '☀️ Trời sáng rồi! Cả làng thức dậy nào...',
};
