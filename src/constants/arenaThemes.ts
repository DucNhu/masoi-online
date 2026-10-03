export type ArenaThemeId = 'BLOOD_MOON' | 'GOTHIC_CASTLE' | 'MISTY_SWAMP' | 'ENCHANTED_FOREST';

export interface ArenaThemeConfig {
  id: ArenaThemeId;
  name: string;
  icon: string;
  badge: string;
  backgroundGradient: string;
  borderColor: string;
  accentGlow: string;
  description: string;
}

export const ARENA_THEMES: Record<ArenaThemeId, ArenaThemeConfig> = {
  BLOOD_MOON: {
    id: 'BLOOD_MOON',
    name: 'Đêm Trăng Máu',
    icon: '🩸',
    badge: 'MẶC ĐỊNH',
    backgroundGradient: 'radial-gradient(circle at 50% -10%, rgba(139, 30, 45, 0.35), transparent 50%), radial-gradient(circle at 10% 40%, rgba(45, 27, 78, 0.4), transparent 50%)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
    accentGlow: 'rgba(239, 68, 68, 0.25)',
    description: 'Bầu trời đỏ như máu, ánh trăng tròn kích phát bản năng hung bạo của loài Sói.',
  },
  GOTHIC_CASTLE: {
    id: 'GOTHIC_CASTLE',
    name: 'Lâu Đài Gothic',
    icon: '🏰',
    badge: 'VIP',
    backgroundGradient: 'radial-gradient(circle at 50% -10%, rgba(217, 119, 6, 0.25), transparent 50%), radial-gradient(circle at 80% 50%, rgba(30, 41, 59, 0.6), transparent 60%)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
    accentGlow: 'rgba(245, 158, 11, 0.25)',
    description: 'Kiến trúc cổ xưa uy nghiêm, nơi những quý tộc giấu kín bí mật ghê rợn.',
  },
  MISTY_SWAMP: {
    id: 'MISTY_SWAMP',
    name: 'Đầm Lầy Sương Mù',
    icon: '🌫️',
    badge: 'HUYỀN BÍ',
    backgroundGradient: 'radial-gradient(circle at 50% -10%, rgba(16, 185, 129, 0.25), transparent 50%), radial-gradient(circle at 20% 60%, rgba(6, 78, 59, 0.5), transparent 60%)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
    accentGlow: 'rgba(16, 185, 129, 0.25)',
    description: 'Sương mù dày đặc che khuất tầm nhìn, tiếng thì thầm của linh hồn vất vưởng.',
  },
  ENCHANTED_FOREST: {
    id: 'ENCHANTED_FOREST',
    name: 'Rừng Rậm Thần Thoại',
    icon: '🌲',
    badge: 'HUYỀN ẢO',
    backgroundGradient: 'radial-gradient(circle at 50% -10%, rgba(168, 85, 247, 0.3), transparent 50%), radial-gradient(circle at 70% 40%, rgba(14, 165, 233, 0.3), transparent 50%)',
    borderColor: 'rgba(168, 85, 247, 0.35)',
    accentGlow: 'rgba(168, 85, 247, 0.25)',
    description: 'Rừng nguyên sinh ngập tràn bụi phép thuật và sự bảo hộ của các vị thần cổ đại.',
  },
};
