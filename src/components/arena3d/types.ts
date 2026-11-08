export type WolfSkinId =
  | 'WOLF_GRAY'
  | 'WOLF_SNOW'
  | 'WOLF_BLOOD'
  | 'WOLF_SHADOW'
  | 'WOLF_GOLD'
  | 'CAMPER_GIRL'
  | 'KITSUNE_FOX';

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

export const DEFAULT_PLAYER_COINS = 1500;
export const DEFAULT_UNLOCKED_ITEMS = ['WOLF_GRAY', 'NONE', 'CONICAL_HAT', 'RED'];

export interface OutfitSkinItem {
  id: WolfSkinId;
  name: string;
  nameEn: string;
  hex: number;
  desc: string;
  descEn: string;
  icon: string;
  price: number;
  archetype: 'HUMAN_CAMPER' | 'HUMAN_SEER' | 'HUMAN_HUNTER' | 'HUMAN_WITCH' | 'KITSUNE' | 'WEREWOLF' | 'CAMPER_GIRL';
  hairColor: number;
  skinTone: number;
  jacketColor: number;
  scarfColor: number;
}

export const OUTFIT_SKINS: OutfitSkinItem[] = [
  {
    id: 'WOLF_GRAY',
    name: '🏕️ Phượt Thủ Cắm Trại',
    nameEn: '🏕️ Outdoor Camper',
    hex: 0x2563eb,
    desc: 'Áo khoác xanh cổ vịt, khăn quàng đỏ ấm áp, tinh thần phượt dã ngoại.',
    descEn: 'Cobalt puffer jacket, warm crimson scarf, energetic outdoor adventurer.',
    icon: '🏕️',
    price: 0,
    archetype: 'HUMAN_CAMPER',
    hairColor: 0x78350f, // Tóc nâu hạt dẻ
    skinTone: 0xfed7aa,  // Da hồng hào khỏe khoắn
    jacketColor: 0x2563eb,
    scarfColor: 0xdc2626,
  },
  {
    id: 'WOLF_SNOW',
    name: '🔮 Pháp Sư Tiên Tri',
    nameEn: '🔮 Arcane Seer',
    hex: 0x6366f1,
    desc: 'Áo choàng tím sao đêm, tóc bạch kim thanh tú, thấu thị tương lai.',
    descEn: 'Starlight purple robe, platinum hair, visionary arcane mysteries.',
    icon: '🔮',
    price: 300,
    archetype: 'HUMAN_SEER',
    hairColor: 0xf1f5f9, // Tóc bạch kim
    skinTone: 0xffedd5,  // Da trắng sáng mịn màng
    jacketColor: 0x4f46e5,
    scarfColor: 0x06b6d4,
  },
  {
    id: 'WOLF_GOLD',
    name: '🏹 Thợ Săn Rừng Thông',
    nameEn: '🏹 Pine Forest Hunter',
    hex: 0x059669,
    desc: 'Áo khoác da xanh rêu, khăn quàng hổ phách, xạ thủ cừ khôi của bản làng.',
    descEn: 'Forest emerald coat, amber scarf, legendary marksman of the wild.',
    icon: '🏹',
    price: 250,
    archetype: 'HUMAN_HUNTER',
    hairColor: 0xd97706, // Tóc vàng hổ phách
    skinTone: 0xfed7aa,
    jacketColor: 0x059669,
    scarfColor: 0xf59e0b,
  },
  {
    id: 'WOLF_SHADOW',
    name: '🧪 Phù Thủy Giả Kim',
    nameEn: '🧪 Alchemist Witch',
    hex: 0x7c3aed,
    desc: 'Trang phục dạ yến huyền bí tím thẫm, tóc tím khói ma mị.',
    descEn: 'Deep violet alchemical tunic, smoke purple hair, potion master.',
    icon: '🧪',
    price: 350,
    archetype: 'HUMAN_WITCH',
    hairColor: 0xa855f7, // Tóc tím khói
    skinTone: 0xffedd5,
    jacketColor: 0x7c3aed,
    scarfColor: 0x334155,
  },
  {
    id: 'WOLF_BLOOD',
    name: '🐺 Sói Hồng Nguyệt',
    nameEn: '🐺 Blood Werewolf',
    hex: 0x991b1b,
    desc: 'Dạng hóa sói dũng mãnh dưới ánh trăng máu, tai sói sắc sảo.',
    descEn: 'Ferocious beast awakening under the crimson moon, smooth werewolf form.',
    icon: '🐺',
    price: 500,
    archetype: 'WEREWOLF',
    hairColor: 0x991b1b, // Bờm đỏ huyết
    skinTone: 0x475569,  // Da lông sói
    jacketColor: 0x7f1d1d,
    scarfColor: 0x1e1b4b,
  },
  {
    id: 'CAMPER_GIRL',
    name: '🌸 Nữ Sinh Cắm Trại',
    nameEn: '🌸 Camper Girl',
    hex: 0xec4899,
    desc: 'Áo hoodie hồng pastel, mái tóc đen dài bồng bềnh dễ thương.',
    descEn: 'Pastel pink hoodie, charming dark hair, cheerful camp student.',
    icon: '🌸',
    price: 200,
    archetype: 'CAMPER_GIRL',
    hairColor: 0x1e293b, // Tóc đen mượt
    skinTone: 0xfed7aa,
    jacketColor: 0xec4899,
    scarfColor: 0xf8fafc,
  },
  {
    id: 'KITSUNE_FOX',
    name: '🦊 Hồ Ly Tinh Linh',
    nameEn: '🦊 Spirit Kitsune',
    hex: 0xf97316,
    desc: 'Áo lễ hội đỏ trắng, tai cáo trắng hồng xinh xắn và đuôi bồng bềnh.',
    descEn: 'Sacred shrine vest, cute white-pink fox ears, mystical trickster.',
    icon: '🦊',
    price: 450,
    archetype: 'KITSUNE',
    hairColor: 0xfff1f2, // Bạch kim ánh hồng
    skinTone: 0xffedd5,
    jacketColor: 0xdc2626,
    scarfColor: 0xffffff,
  },
];

export interface OutfitHatItem {
  id: WolfHatId;
  name: string;
  nameEn: string;
  icon: string;
  desc: string;
  descEn: string;
  price: number;
}

export const OUTFIT_HATS: OutfitHatItem[] = [
  {
    id: 'NONE',
    name: 'Không Đội Mũ',
    nameEn: 'No Hat',
    icon: '❌',
    desc: 'Khoe mái tóc 3D bồng bềnh phong cách',
    descEn: 'Show off your smooth 3D stylized hairstyle',
    price: 0,
  },
  {
    id: 'CONICAL_HAT',
    name: 'Nón Lá Việt Nam',
    nameEn: 'Vietnamese Conical Hat',
    icon: '👒',
    desc: 'Nón lá tre mộc mạc thanh tao truyền thống',
    descEn: 'Traditional bamboo conical hat, rustic and graceful',
    price: 0,
  },
  {
    id: 'WITCH',
    name: 'Mũ Phù Thủy',
    nameEn: 'Witch Hat',
    icon: '🧙‍♀️',
    desc: 'Mũ chóp tím huyền bí với vành uốn lượn',
    descEn: 'Mystical pointed hat with elegant curving brim',
    price: 200,
  },
  {
    id: 'COWBOY',
    name: 'Mũ Cao Bồi',
    nameEn: 'Cowboy Hat',
    icon: '🤠',
    desc: 'Mũ phượt miền Tây da bò phong trần',
    descEn: 'Rugged wild-west leather trail hat',
    price: 250,
  },
  {
    id: 'CROWN',
    name: 'Vương Miện Vàng',
    nameEn: 'Royal Golden Crown',
    icon: '👑',
    desc: 'Vương miện nạm ngọc hoàng gia uy quyền',
    descEn: 'Golden regal crown encrusted with jewels',
    price: 400,
  },
  {
    id: 'BANDANA',
    name: 'Băng Đô Ninja',
    nameEn: 'Ninja Bandana',
    icon: '🥷',
    desc: 'Dải băng đỏ rực cá tính quấn ngang trán',
    descEn: 'Crimson martial headband with fluttering ribbon',
    price: 150,
  },
];

export interface OutfitEyeItem {
  id: WolfEyeGlowId;
  name: string;
  nameEn: string;
  hex: number;
  desc: string;
  descEn: string;
  price: number;
}

export const OUTFIT_EYES: OutfitEyeItem[] = [
  {
    id: 'RED',
    name: 'Đỏ Khát Máu',
    nameEn: 'Crimson Glow',
    hex: 0xef4444,
    desc: 'Ánh nhìn đỏ rực quyết đoán trong bóng đêm',
    descEn: 'Fierce crimson gaze piercing through midnight',
    price: 0,
  },
  {
    id: 'YELLOW',
    name: 'Vàng Hổ Phách',
    nameEn: 'Amber Glow',
    hex: 0xfacc15,
    desc: 'Đôi mắt vàng ấm áp như ngọn lửa trại',
    descEn: 'Warm amber eyes reflecting the dancing campfire',
    price: 100,
  },
  {
    id: 'CYAN',
    name: 'Xanh Tiên Tri',
    nameEn: 'Seer Cyan',
    hex: 0x06b6d4,
    desc: 'Hào quang ngọc bích thấu thị vạn vật',
    descEn: 'Clairvoyant cyan brilliance seeing through secrets',
    price: 150,
  },
  {
    id: 'PURPLE',
    name: 'Tím Phù Thủy',
    nameEn: 'Mystic Purple',
    hex: 0xa855f7,
    desc: 'Ánh mắt phép thuật ma mị quyến rũ',
    descEn: 'Enchanting mystic violet of arcane alchemy',
    price: 200,
  },
  {
    id: 'GREEN',
    name: 'Xanh Ngọc Rừng',
    nameEn: 'Emerald Forest',
    hex: 0x22c55e,
    desc: 'Lấp lánh sức sống tinh linh rừng đại ngàn',
    descEn: 'Vibrant emerald shimmer of ancient forest spirits',
    price: 200,
  },
];

export interface OutfitBackItem {
  id: WolfBackItemId;
  name: string;
  nameEn: string;
  icon: string;
  desc: string;
  descEn: string;
  price: number;
}

export const OUTFIT_BACK_ITEMS: OutfitBackItem[] = [
  {
    id: 'NONE',
    name: 'Không Phụ Kiện',
    nameEn: 'No Accessory',
    icon: '❌',
    desc: 'Gọn nhẹ và thoải mái dã ngoại',
    descEn: 'Lightweight and casual outdoor style',
    price: 0,
  },
  {
    id: 'CAPE',
    name: 'Áo Choàng Đỏ',
    nameEn: 'Crimson Cape',
    icon: '🧣',
    desc: 'Áo choàng nhung đỏ bay phất phơ trong gió',
    descEn: 'Flowing velvet cape fluttering in the night breeze',
    price: 250,
  },
  {
    id: 'SWORD',
    name: 'Thanh Kiếm Sắt',
    nameEn: 'Iron Adventurer Sword',
    icon: '🗡️',
    desc: 'Bảo kiếm dũng sĩ đeo sau lưng bảo vệ bản làng',
    descEn: 'Steel longsword on back ready to defend the camp',
    price: 300,
  },
  {
    id: 'POTION',
    name: 'Bình Dược Huyền Bí',
    nameEn: 'Alchemist Vial',
    icon: '🧪',
    desc: 'Lọ độc dược xanh phát sáng huyền ảo',
    descEn: 'Glowing magical flask pulsing with mysterious potions',
    price: 350,
  },
  {
    id: 'SHIELD',
    name: 'Khiên Gỗ Hộ Vệ',
    nameEn: 'Guardian Shield',
    icon: '🛡️',
    desc: 'Khiên hộ vệ gỗ sồi viền kim loại kiên cố',
    descEn: 'Sturdy oak and iron shield protecting against wolves',
    price: 300,
  },
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
  characterTitle?: string;
  characterIcon?: string;
}

// === KHU CẮM TRẠI ĐÊM 3D: CÁC TÚP LỀU CẮM TRẠI (3D CAMP TENTS) ===
export type CampTentId = 'tent-1' | 'tent-2' | 'tent-3' | 'tent-4';

export interface CampTentInfo {
  id: CampTentId;
  name: string;
  nameEn: string;
  tagline: string;
  taglineEn: string;
  description: string;
  descriptionEn: string;
  position: [number, number, number];
  lookAt: [number, number, number];
  playerCount: number;
  maxPlayers: number;
  themeColor: string;
  banner: string;
  campfireColor: number;
}

export const CAMP_TENTS: CampTentInfo[] = [
  {
    id: 'tent-1',
    name: 'Lều Trăng Máu',
    nameEn: 'Blood Moon Tent',
    tagline: 'Lều Trung Tâm • Rực Lửa Đêm',
    taglineEn: 'Central Tent • Blazing Fire',
    description: 'Túp lều chính nơi các đại hội luận bàn ma sói diễn ra sôi nổi nhất.',
    descriptionEn: 'The grand central pavilion where epic werewolf campfire trials take place.',
    position: [0, 0, 0],
    lookAt: [0, 1.2, 0],
    playerCount: 10,
    maxPlayers: 10,
    themeColor: '#ef4444',
    banner: '🩸 Trăng Máu',
    campfireColor: 0xf97316,
  },
  {
    id: 'tent-2',
    name: 'Lều Sương Mù',
    nameEn: 'Mist Valley Tent',
    tagline: 'Khuất Góc Rừng Tây • Tĩnh Lặng',
    taglineEn: 'Western Deep Woods • Serene',
    description: 'Ẩn sâu trong sương mờ tĩnh lặng của thung lũng phía Tây.',
    descriptionEn: 'Hidden deep in the tranquil silver mists of the western forest.',
    position: [-16, 0, -14],
    lookAt: [-16, 1.2, -14],
    playerCount: 6,
    maxPlayers: 8,
    themeColor: '#38bdf8',
    banner: '🌫️ Sương Mù',
    campfireColor: 0x06b6d4,
  },
  {
    id: 'tent-3',
    name: 'Lều Rừng Thông',
    nameEn: 'Pine Forest Tent',
    tagline: 'Bóng Đại Thụ Đông • Gió Rì Rào',
    taglineEn: 'Eastern Ancient Pines • Whispering Winds',
    description: 'Dưới bóng đại thụ thông ngàn năm rì rào gió lạnh phía Đông.',
    descriptionEn: 'Beneath millennial evergreen pines whispering cold evening winds.',
    position: [16, 0, -14],
    lookAt: [16, 1.2, -14],
    playerCount: 8,
    maxPlayers: 10,
    themeColor: '#10b981',
    banner: '🌲 Rừng Thông',
    campfireColor: 0x10b981,
  },
  {
    id: 'tent-4',
    name: 'Lều Đom Đóm',
    nameEn: 'Firefly Brook Tent',
    tagline: 'Bờ Suối Bắc • Ánh Sáng Huyền Ảo',
    taglineEn: 'Northern Creek • Magical Fireflies',
    description: 'Cạnh bờ suối đom đóm lập lòe huyền bí phía Bắc khu cắm trại.',
    descriptionEn: 'Next to the sparkling stream adorned with magical dancing fireflies.',
    position: [0, 0, -24],
    lookAt: [0, 1.2, -24],
    playerCount: 5,
    maxPlayers: 6,
    themeColor: '#facc15',
    banner: '✨ Đom Đóm',
    campfireColor: 0xfacc15,
  },
];

// === THANH KỸ NĂNG KIỂU POKEMON COMBAT TRONG PHA ĐÊM ĐỒNG THỜI ===
export type PokemonCombatSkillId = 'WOLF_BITE' | 'SEER_GAZE' | 'GUARD_SHIELD' | 'WITCH_POTION' | 'HUNTER_AIM';

export interface NightCombatSkill {
  id: PokemonCombatSkillId;
  roleName: string;
  roleNameEn: string;
  name: string;
  nameEn: string;
  icon: string;
  description: string;
  descriptionEn: string;
  color: string;
  hotkey: string;
  actionText: string;
  actionTextEn: string;
  highlightHex: number;
}

export const NIGHT_COMBAT_SKILLS: NightCombatSkill[] = [
  {
    id: 'WOLF_BITE',
    roleName: 'Ma Sói',
    roleNameEn: 'Werewolf',
    name: 'Cào Xé (Ma Sói)',
    nameEn: 'Fierce Claw (Werewolf)',
    icon: '🐺',
    description: 'Chọn 1 ghế mục tiêu để cắn trong đêm đen cùng bầy sói.',
    descriptionEn: 'Target a seated player to attack with the wolf pack tonight.',
    color: '#ef4444',
    hotkey: 'Q',
    actionText: 'Cắn Ghế',
    actionTextEn: 'Strike Seat',
    highlightHex: 0xef4444,
  },
  {
    id: 'SEER_GAZE',
    roleName: 'Tiên Tri',
    roleNameEn: 'Seer',
    name: 'Nhãn Cầu Tiên Tri (Tiên Tri)',
    nameEn: 'Astral Sight (Seer)',
    icon: '🔮',
    description: 'Soi ngay lập tức phe của 1 ghế: Phe Sói hay Phe Dân Làng.',
    descriptionEn: 'Reveal the true faction of a player: Werewolf or Village.',
    color: '#06b6d4',
    hotkey: 'W',
    actionText: 'Soi Danh Tính',
    actionTextEn: 'Divine Identity',
    highlightHex: 0x06b6d4,
  },
  {
    id: 'GUARD_SHIELD',
    roleName: 'Bảo Vệ',
    roleNameEn: 'Bodyguard',
    name: 'Khiên Ánh Sáng (Bảo Vệ)',
    nameEn: 'Light Barrier (Guard)',
    icon: '🛡️',
    description: 'Bảo vệ 1 ghế khỏi mọi đòn cắn của Sói trong đêm nay.',
    descriptionEn: 'Shield a player against werewolf attacks this night.',
    color: '#f59e0b',
    hotkey: 'E',
    actionText: 'Bảo Vệ Ghế',
    actionTextEn: 'Protect Seat',
    highlightHex: 0xf59e0b,
  },
  {
    id: 'WITCH_POTION',
    roleName: 'Phù Thủy',
    roleNameEn: 'Witch',
    name: 'Bình Dược Phù Thủy (Phù Thủy)',
    nameEn: 'Witch Elixir (Witch)',
    icon: '🧪',
    description: 'Cứu người bị sói cắn hoặc quăng bình độc tiêu diệt 1 kẻ tình nghi.',
    descriptionEn: 'Save the victim or poison a suspicious player.',
    color: '#a855f7',
    hotkey: 'R',
    actionText: 'Dùng Dược',
    actionTextEn: 'Cast Potion',
    highlightHex: 0xa855f7,
  },
  {
    id: 'HUNTER_AIM',
    roleName: 'Thợ Săn',
    roleNameEn: 'Hunter',
    name: 'Khóa Mục Tiêu (Thợ Săn)',
    nameEn: 'Target Lock (Hunter)',
    icon: '🏹',
    description: 'Ghim 1 mục tiêu kéo theo nếu bản thân hy sinh trong đêm.',
    descriptionEn: 'Lock onto a revenge target if you perish tonight.',
    color: '#f97316',
    hotkey: 'T',
    actionText: 'Khóa Tâm',
    actionTextEn: 'Lock Aim',
    highlightHex: 0xf97316,
  },
];
