export interface WerewolfAvatar {
  id: string;
  name: string;
  emoji: string;
  roleTheme: string;
  auraColor: string;
  glow: string;
  quote: string;
}

export const WEREWOLF_AVATARS: WerewolfAvatar[] = [
  {
    id: 'silver_wolf',
    name: 'Sói Bạc Huyết Nguyệt',
    emoji: '🐺',
    roleTheme: 'WEREWOLF',
    auraColor: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.45)',
    quote: 'Tiếng hú xé tan màn đêm, không con mồi nào thoát khỏi móng vuốt.',
  },
  {
    id: 'mystic_seer',
    name: 'Tiên Tri Tử Đằng',
    emoji: '🔮',
    roleTheme: 'SEER',
    auraColor: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.45)',
    quote: 'Quả cầu pha lê thấu thị bóng tối, kẻ ác không thể che giấu danh tính.',
  },
  {
    id: 'witch_potion',
    name: 'Phù Thủy Độc Dược',
    emoji: '🧪',
    roleTheme: 'WITCH',
    auraColor: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.45)',
    quote: 'Một giọt hồi sinh ban ánh sáng, một giọt độc dược tiễn về hư vô.',
  },
  {
    id: 'iron_guard',
    name: 'Hiệp Sĩ Bảo Vệ',
    emoji: '🛡️',
    roleTheme: 'BODYGUARD',
    auraColor: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.45)',
    quote: 'Lá chắn kiên cường trong đêm đen, thà hy sinh chứ không lùi bước.',
  },
  {
    id: 'shadow_hunter',
    name: 'Thợ Săn Rừng Sâu',
    emoji: '🏹',
    roleTheme: 'HUNTER',
    auraColor: '#10b981',
    glow: 'rgba(16, 185, 129, 0.45)',
    quote: 'Một mũi tên ngắm sẵn trong im lặng, kẻ hạ ta sẽ phải chôn cùng.',
  },
  {
    id: 'village_mayor',
    name: 'Thị Trưởng Quyền Uy',
    emoji: '👑',
    roleTheme: 'MAYOR',
    auraColor: '#facc15',
    glow: 'rgba(250, 204, 21, 0.45)',
    quote: 'Tiếng chuông công lý của ngôi làng, lá phiếu nặng tựa ngàn cân.',
  },
  {
    id: 'joker_fool',
    name: 'Kẻ Ngốc Mặt Nạ',
    emoji: '🃏',
    roleTheme: 'IDIOT',
    auraColor: '#06b6d4',
    glow: 'rgba(6, 182, 212, 0.45)',
    quote: 'Tiếng cười khờ dại che giấu sự thật, thoát khỏi giá treo cổ trong gang tấc.',
  },
  {
    id: 'cursed_lycan',
    name: 'Bán Sói Trăng Tàn',
    emoji: '🩸',
    roleTheme: 'CURSED',
    auraColor: '#8b5cf6',
    glow: 'rgba(139, 92, 246, 0.45)',
    quote: 'Mang dòng máu con người nhưng tiếng gọi hoang dã luôn rạo rực trong tim.',
  },
  {
    id: 'wise_elder',
    name: 'Già Làng Minh Triết',
    emoji: '👴',
    roleTheme: 'ELDER',
    auraColor: '#eab308',
    glow: 'rgba(234, 179, 8, 0.45)',
    quote: 'Trải bao cuộc bể dâu, hai sinh mạng kiên cường trước đòn cắn ác thú.',
  },
  {
    id: 'dark_cupid',
    name: 'Thần Tình Yêu',
    emoji: '💘',
    roleTheme: 'CUPID',
    auraColor: '#ec4899',
    glow: 'rgba(236, 72, 153, 0.45)',
    quote: 'Dây tơ hồng kết duyên đôi lứa, sống cùng nhau và thác cùng nhau.',
  },
  {
    id: 'cunning_minion',
    name: 'Kẻ Bán Tơ Gian Xảo',
    emoji: '🎭',
    roleTheme: 'MINION',
    auraColor: '#f97316',
    glow: 'rgba(249, 115, 22, 0.45)',
    quote: 'Lạc lối trong bóng đêm, sẵn lòng hy sinh để bầy sói thống trị.',
  },
  {
    id: 'hardy_villager',
    name: 'Dân Làng Cần Mẫn',
    emoji: '🌾',
    roleTheme: 'VILLAGER',
    auraColor: '#94a3b8',
    glow: 'rgba(148, 163, 184, 0.45)',
    quote: 'Ngọn đèn dầu thắp sáng gian nhà gỗ, niềm tin chính nghĩa sẽ chiến thắng.',
  },
];

export function getAvatarById(id: string): WerewolfAvatar {
  return WEREWOLF_AVATARS.find((a) => a.id === id) || WEREWOLF_AVATARS[0];
}

export function getDefaultAvatar(): WerewolfAvatar {
  return WEREWOLF_AVATARS[0];
}
