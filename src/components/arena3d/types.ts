export type WolfSkinId = 'WOLF_GRAY' | 'WOLF_SNOW' | 'WOLF_BLOOD' | 'WOLF_SHADOW' | 'WOLF_GOLD';
export type WolfHatId = 'NONE' | 'CONICAL_HAT' | 'WITCH' | 'COWBOY' | 'CROWN' | 'BANDANA';
export type WolfEyeGlowId = 'RED' | 'YELLOW' | 'CYAN' | 'PURPLE' | 'GREEN';
export type WolfBackItemId = 'NONE' | 'CAPE' | 'SWORD' | 'POTION' | 'SHIELD';

export interface PlayerOutfitConfig {
  skinId: WolfSkinId;
  hatId: WolfHatId;
  eyeGlowId: WolfEyeGlowId;
  backItemId: WolfBackItemId;
}

export const DEFAULT_OUTFIT: PlayerOutfitConfig = {
  skinId: 'WOLF_GRAY',
  hatId: 'CONICAL_HAT',
  eyeGlowId: 'RED',
  backItemId: 'NONE',
};

export const OUTFIT_SKINS: { id: WolfSkinId; name: string; hex: number; desc: string }[] = [
  { id: 'WOLF_GRAY', name: 'Sói Xám Rừng Rậm', hex: 0x475569, desc: 'Màu lông xám hoang dã cổ điển' },
  { id: 'WOLF_SNOW', name: 'Sói Tuyết Bắc Cực', hex: 0xe2e8f0, desc: 'Bộ lông trắng muốt như băng tuyết' },
  { id: 'WOLF_BLOOD', name: 'Sói Lửa Huyết Nguyệt', hex: 0x991b1b, desc: 'Lông đỏ rực dưới vầng trăng máu' },
  { id: 'WOLF_SHADOW', name: 'Sói Than Bóng Đêm', hex: 0x1e293b, desc: 'Đen kịt ẩn mình trong bóng tối' },
  { id: 'WOLF_GOLD', name: 'Sói Chúa Hoàng Kim', hex: 0xd97706, desc: 'Lông ánh kim quyền uy thủ lĩnh' },
];

export const OUTFIT_HATS: { id: WolfHatId; name: string; icon: string; desc: string }[] = [
  { id: 'NONE', name: 'Không Đội Mũ', icon: '❌', desc: 'Đầu trần phong trần' },
  { id: 'CONICAL_HAT', name: 'Nón Lá Việt Nam', icon: '👒', desc: 'Nón lá tre mộc mạc thanh nhã' },
  { id: 'WITCH', name: 'Mũ Phù Thủy', icon: '🧙‍♀️', desc: 'Mũ chóp đen huyền bí' },
  { id: 'COWBOY', name: 'Mũ Cao Bồi', icon: '🤠', desc: 'Mũ phượt phương Tây bụi bặm' },
  { id: 'CROWN', name: 'Vương Miện Vàng', icon: '👑', desc: 'Vương miện hoàng gia uy quyền' },
  { id: 'BANDANA', name: 'Băng Đô Ninja', icon: '🥷', desc: 'Dải băng đỏ rực ngang trán' },
];

export const OUTFIT_EYES: { id: WolfEyeGlowId; name: string; hex: number; desc: string }[] = [
  { id: 'RED', name: 'Đỏ Khát Máu', hex: 0xef4444, desc: 'Mắt đỏ rực thợ săn đêm' },
  { id: 'YELLOW', name: 'Vàng Hổ Phách', hex: 0xfacc15, desc: 'Ánh nhìn hoang dã sắc sảo' },
  { id: 'CYAN', name: 'Xanh Tiên Tri', hex: 0x06b6d4, desc: 'Hào quang thấu thị tương lai' },
  { id: 'PURPLE', name: 'Tím Phù Thủy', hex: 0xa855f7, desc: 'Phép thuật bóng đêm ma mị' },
  { id: 'GREEN', name: 'Xanh Ngọc Độc Dược', hex: 0x22c55e, desc: 'Lấp lánh tà thuật rừng thiêng' },
];

export const OUTFIT_BACK_ITEMS: { id: WolfBackItemId; name: string; icon: string; desc: string }[] = [
  { id: 'NONE', name: 'Không Phụ Kiện', icon: '❌', desc: 'Gọn nhẹ' },
  { id: 'CAPE', name: 'Áo Choàng Đỏ', icon: '🧣', desc: 'Áo choàng bay trong gió đêm' },
  { id: 'SWORD', name: 'Thanh Kiếm Sắt', icon: '🗡️', desc: 'Kiếm sắc bén đeo sau lưng' },
  { id: 'POTION', name: 'Bình Độc Dược', icon: '🧪', desc: 'Lọ thuốc phát sáng huyền bí' },
  { id: 'SHIELD', name: 'Khiên Hộ Vệ', icon: '🛡️', desc: 'Khiên gỗ viền sắt bảo vệ bản làng' },
];

export interface SeatPlayerInfo {
  seatNumber: number;
  name: string;
  isAlive: boolean;
  isWerewolf?: boolean;
  isDead?: boolean;
  outfit: PlayerOutfitConfig;
  deathReason?: string;
  isSpeaking?: boolean;
  isTargeted?: boolean;
}
