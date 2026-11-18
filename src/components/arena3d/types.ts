export type WolfSkinId =
  | 'WOLF_GRAY'
  | 'WOLF_SNOW'
  | 'WOLF_BLOOD'
  | 'WOLF_SHADOW'
  | 'WOLF_GOLD'
  | 'CAMPER_GIRL'
  | 'KITSUNE_FOX'
  | 'WOLF_CYBER'
  | 'VAMPIRE_LORD'
  | 'GHOST_PHANTOM'
  | 'CUPID_ANGEL'
  | 'SAMURAI_RONIN'
  | 'PIRATE_CAPTAIN'
  | 'GOLDEN_ALPHA';

export type WolfHatId =
  | 'NONE'
  | 'CONICAL_HAT'
  | 'WITCH'
  | 'COWBOY'
  | 'CROWN'
  | 'BANDANA'
  | 'HALO'
  | 'PIRATE_HAT'
  | 'CAT_EARS'
  | 'VIKING_HELMET'
  | 'SANTA_HAT'
  | 'BERET'
  | 'STRAW_HAT';

export type WolfEyeGlowId =
  | 'RED'
  | 'YELLOW'
  | 'CYAN'
  | 'PURPLE'
  | 'GREEN'
  | 'PINK_HEART'
  | 'WHITE_STORM'
  | 'ORANGE_SUN'
  | 'VOID_BLACK'
  | 'GOLD_ROYAL';

export type WolfBackItemId =
  | 'NONE'
  | 'CAPE'
  | 'SWORD'
  | 'POTION'
  | 'SHIELD'
  | 'ANGEL_WINGS'
  | 'DEVIL_WINGS'
  | 'CAMPING_BACKPACK'
  | 'BOW_ARROW'
  | 'GUITAR'
  | 'SCYTHE'
  | 'QUIVER';

export interface PlayerOutfitConfig {
  skinId: WolfSkinId;
  hatId: WolfHatId;
  eyeGlowId: WolfEyeGlowId;
  backItemId: WolfBackItemId;
}

/**
 * Thông tin nhân vật 3D đồng bộ thời gian thực trong Khu Cắm Trại (Multiplayer 3D Roam)
 */
export interface RemoteRoamPlayer {
  id: string;
  name: string;
  outfit: PlayerOutfitConfig;
  position: { x: number; y: number; z: number };
  facingAngle: number;
  anim: 'idle' | 'walk';
  isRoaming: boolean;
  seatNumber: number | null;
  tentId: CampTentId;
  updatedAt: number;
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
  archetype:
    | 'HUMAN_CAMPER'
    | 'HUMAN_SEER'
    | 'HUMAN_HUNTER'
    | 'HUMAN_WITCH'
    | 'KITSUNE'
    | 'WEREWOLF'
    | 'CAMPER_GIRL'
    | 'CYBER_WOLF'
    | 'VAMPIRE'
    | 'GHOST'
    | 'CUPID'
    | 'SAMURAI'
    | 'PIRATE'
    | 'GOLDEN_ALPHA';
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
  {
    id: 'WOLF_CYBER',
    name: '🤖 Sói Cơ Giáp Cyber',
    nameEn: '🤖 Cyber Mech Wolf',
    hex: 0x06b6d4,
    desc: 'Chiến giáp neon tương lai, tai cơ khí phát sáng và đuôi cáp quang.',
    descEn: 'Futuristic neon power armor, glowing cyber ears and fiber-optic tail.',
    icon: '🤖',
    price: 600,
    archetype: 'CYBER_WOLF',
    hairColor: 0x0ea5e9, // Tóc xanh neon công nghệ
    skinTone: 0xe2e8f0,  // Da titan sáng
    jacketColor: 0x0f172a, // Giáp đen carbon
    scarfColor: 0x06b6d4, // Viền neon cyan
  },
  {
    id: 'VAMPIRE_LORD',
    name: '🧛 Bá Tước Ma Cà Rồng',
    nameEn: '🧛 Vampire Lord',
    hex: 0x881337,
    desc: 'Quý tộc bóng đêm với răng nanh sắc nhọn, áo khoác dạ đen phối đỏ nhung.',
    descEn: 'Noble creature of the night with sharp fangs and dark velvet coat.',
    icon: '🧛',
    price: 650,
    archetype: 'VAMPIRE',
    hairColor: 0x18181b, // Tóc mun quý tộc
    skinTone: 0xf8fafc,  // Da trắng tuyết ma cà rồng
    jacketColor: 0x4c0519, // Áo bành tô đỏ rượu vang đậm
    scarfColor: 0x991b1b, // Cà vạt / khăn lụa đỏ huyết
  },
  {
    id: 'GHOST_PHANTOM',
    name: '👻 Bóng Ma U Linh',
    nameEn: '👻 Spectral Phantom',
    hex: 0x67e8f9,
    desc: 'Linh hồn phiêu dạt trong làn sương lam mờ ảo, áo choàng u linh.',
    descEn: 'Wandering ethereal spirit glowing with pale cyan mist.',
    icon: '👻',
    price: 550,
    archetype: 'GHOST',
    hairColor: 0xa5f3fc, // Tóc sương mù lam nhạt
    skinTone: 0xe0f2fe,  // Da phát sáng mờ ảo
    jacketColor: 0x0284c7, // Áo u linh lam đậm
    scarfColor: 0x38bdf8, // Khăn sương khói
  },
  {
    id: 'CUPID_ANGEL',
    name: '👼 Thiên Thần Tình Yêu',
    nameEn: '👼 Cupid Angel',
    hex: 0xf43f5e,
    desc: 'Áo tunic trắng viền vàng thánh thiện, mái tóc vàng bồng bềnh mang lại niềm tin.',
    descEn: 'Holy white tunic trimmed with gold, curly golden locks radiating pure hope.',
    icon: '👼',
    price: 500,
    archetype: 'CUPID',
    hairColor: 0xfef08a, // Tóc vàng óng thiên thần
    skinTone: 0xffedd5,  // Da sáng mịn
    jacketColor: 0xffffff, // Áo tunic trắng tinh khôi
    scarfColor: 0xfbbf24, // Dải ruy băng vàng hoàng gia
  },
  {
    id: 'SAMURAI_RONIN',
    name: '⚔️ Lãng Khách Samurai',
    nameEn: '⚔️ Ronin Samurai',
    hex: 0xb45309,
    desc: 'Võ phục truyền thống quấn đai chiến binh, tóc búi samurai phong trần quả cảm.',
    descEn: 'Traditional warrior gi with battle sash, rugged warrior topknot.',
    icon: '⚔️',
    price: 700,
    archetype: 'SAMURAI',
    hairColor: 0x27272a, // Tóc đen tuyền
    skinTone: 0xfed7aa,  // Da đồng phong sương
    jacketColor: 0x1c1917, // Áo gi đen than chiến trận
    scarfColor: 0xb45309, // Đai kiếm hổ phách
  },
  {
    id: 'PIRATE_CAPTAIN',
    name: '🏴‍☠️ Thuyền Trưởng Hải Tặc',
    nameEn: '🏴‍☠️ Pirate Captain',
    hex: 0x1e3a8a,
    desc: 'Đại úy hải tặc biển sâu, áo bành tô xanh hải quân viền vàng và phong thái phong trần.',
    descEn: 'High seas captain in navy greatcoat with gold embroidery.',
    icon: '🏴‍☠️',
    price: 580,
    archetype: 'PIRATE',
    hairColor: 0x451a03, // Tóc nâu hải tặc
    skinTone: 0xfed7aa,  // Da rám nắng biển cả
    jacketColor: 0x172554, // Áo hải quân đại dương
    scarfColor: 0xb91c1c, // Khăn quàng đỏ cướp biển
  },
  {
    id: 'GOLDEN_ALPHA',
    name: '👑 Sói Đầu Đàn Hoàng Kim',
    nameEn: '👑 Golden Alpha Wolf',
    hex: 0xeab308,
    desc: 'Thủ lĩnh sói tối cao phủ ánh hào quang hoàng kim rực rỡ, tai sói vàng uy nghiêm.',
    descEn: 'Supreme alpha werewolf bathed in radiant golden aura with noble golden ears.',
    icon: '👑',
    price: 800,
    archetype: 'GOLDEN_ALPHA',
    hairColor: 0xfef08a, // Bờm sói vàng kim
    skinTone: 0xfef9c3,  // Da ánh kim
    jacketColor: 0xca8a04, // Áo giáp vàng vương giả
    scarfColor: 0x854d0e, // Khăn quàng hoàng gia
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
  {
    id: 'HALO',
    name: 'Vòng Hào Quang',
    nameEn: 'Angelic Halo',
    icon: '😇',
    desc: 'Vòng hào quang thiên thần vàng rực lơ lửng trên đỉnh đầu',
    descEn: 'Golden sacred halo floating peacefully above the head',
    price: 380,
  },
  {
    id: 'PIRATE_HAT',
    name: 'Mũ Thuyền Trưởng',
    nameEn: 'Captain Pirate Hat',
    icon: '🏴‍☠️',
    desc: 'Mũ hải tặc ba góc kiêu hãnh cắm lông vũ trắng',
    descEn: 'Regal tricorn pirate hat with white plumes',
    price: 320,
  },
  {
    id: 'CAT_EARS',
    name: 'Băng Đô Tai Mèo',
    nameEn: 'Cat Ears Headband',
    icon: '🐱',
    desc: 'Băng đô đen xinh xắn với đôi tai mèo tam giác bông hồng đáng yêu',
    descEn: 'Cute black headband with fluffy pink-inner cat ears',
    price: 220,
  },
  {
    id: 'VIKING_HELMET',
    name: 'Mũ Sừng Viking',
    nameEn: 'Viking Horned Helmet',
    icon: '🛡️',
    desc: 'Mũ sắt chiến binh phương Bắc với cặp sừng cong dũng mãnh',
    descEn: 'Ancient Nordic iron helmet with twin curved horns',
    price: 350,
  },
  {
    id: 'SANTA_HAT',
    name: 'Mũ Giáng Sinh Noel',
    nameEn: 'Santa Holiday Hat',
    icon: '🎅',
    desc: 'Mũ len đỏ rực rỡ viền lông trắng và quả cầu tuyết tròn xoe',
    descEn: 'Festive red holiday cap with fluffy white trim and pom-pom',
    price: 260,
  },
  {
    id: 'BERET',
    name: 'Mũ Nồi Nghệ Sĩ',
    nameEn: 'Artist Wool Beret',
    icon: '🎨',
    desc: 'Mũ nồi dạ đen nghiêng duyên dáng của thi sĩ rừng đêm',
    descEn: 'Chic wool beret tilted with poet elegance',
    price: 180,
  },
  {
    id: 'STRAW_HAT',
    name: 'Mũ Rơm Dã Ngoại',
    nameEn: 'Adventure Straw Hat',
    icon: '👒',
    desc: 'Mũ rơm đan vàng viền ruy băng đỏ thắm của người đi tìm kho báu',
    descEn: 'Classic woven straw hat with vivid crimson ribbon band',
    price: 200,
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
  {
    id: 'PINK_HEART',
    name: 'Hồng Tình Yêu',
    nameEn: 'Romantic Pink',
    hex: 0xf472b6,
    desc: 'Ánh mắt màu kẹo ngọt ngào tan chảy trái tim người đối diện',
    descEn: 'Sweet candy pink glow radiating warmth and charm',
    price: 280,
  },
  {
    id: 'WHITE_STORM',
    name: 'Bão Tuyết Trắng',
    nameEn: 'White Blizzard',
    hex: 0xf8fafc,
    desc: 'Ánh chớp bão tuyết tinh khôi sắc lạnh thấu tâm can',
    descEn: 'Pure crystalline white gaze cold as northern blizzard',
    price: 320,
  },
  {
    id: 'ORANGE_SUN',
    name: 'Cam Hoàng Hôn',
    nameEn: 'Sunset Orange',
    hex: 0xf97316,
    desc: 'Mặt trời lặn rực rỡ chiếu rọi qua rặng thông già',
    descEn: 'Blazing twilight orange glow brimming with fiery energy',
    price: 250,
  },
  {
    id: 'VOID_BLACK',
    name: 'Lam Hư Không',
    nameEn: 'Void Indigo',
    hex: 0x818cf8,
    desc: 'Ánh mắt hư không vũ trụ tím chàm sâu thẳm vô tận',
    descEn: 'Deep cosmic indigo gleam drawing minds into the void',
    price: 360,
  },
  {
    id: 'GOLD_ROYAL',
    name: 'Hoàng Kim Tối Cao',
    nameEn: 'Royal Gold',
    hex: 0xfbbf24,
    desc: 'Hào quang vàng kim đế vương uy nghiêm chói lọi',
    descEn: 'Majestic imperial gold brilliance commanding authority',
    price: 400,
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
  {
    id: 'ANGEL_WINGS',
    name: 'Cánh Thiên Thần',
    nameEn: 'Angelic Wings',
    icon: '🪽',
    desc: 'Cặp cánh thiên thần lông vũ trắng muốt giương rộng 2 bên lưng phát sáng',
    descEn: 'Radiant feathered white angel wings fluttering with gentle aura',
    price: 480,
  },
  {
    id: 'DEVIL_WINGS',
    name: 'Cánh Ác Ma',
    nameEn: 'Demonic Wings',
    icon: '🦇',
    desc: 'Cặp cánh dơi ác ma nhung tím đen viền gai ma mị sắc sảo',
    descEn: 'Dark gothic bat wings of the night with sharp devil horns',
    price: 500,
  },
  {
    id: 'CAMPING_BACKPACK',
    name: 'Balo Cắm Trại',
    nameEn: 'Camp Explorer Backpack',
    icon: '🎒',
    desc: 'Balo du lịch to bản có cuộn túi ngủ trên đầu và bình nước dã ngoại',
    descEn: 'Heavy-duty expedition backpack with rolled sleeping bag and flask',
    price: 320,
  },
  {
    id: 'BOW_ARROW',
    name: 'Cung Tên Thợ Săn',
    nameEn: 'Hunter Longbow',
    icon: '🏹',
    desc: 'Cung gỗ cong thanh thoát và ống đựng tên da bò cắm lông chim đeo chéo',
    descEn: 'Curved wooden bow with strapped quiver and feathered arrows',
    price: 380,
  },
  {
    id: 'GUITAR',
    name: 'Guitar Lửa Trại',
    nameEn: 'Campfire Guitar',
    icon: '🎸',
    desc: 'Đàn guitar gỗ acoustic ấm áp của người kể chuyện quanh đống lửa',
    descEn: 'Warm wooden acoustic guitar strapped for campfire singalongs',
    price: 350,
  },
  {
    id: 'SCYTHE',
    name: 'Lưỡi Hái Tử Thần',
    nameEn: 'Grim Reaper Scythe',
    icon: '💀',
    desc: 'Lưỡi hái tử thần cán đen dài và lưỡi hái bạc cong vút sắc lạnh',
    descEn: 'Ominous reaping scythe with long obsidian shaft and silver curved blade',
    price: 450,
  },
  {
    id: 'QUIVER',
    name: 'Cuộn Bí Kíp Ninja',
    nameEn: 'Ninja Secret Scroll',
    icon: '📜',
    desc: 'Cuộn bí kíp nhẫn giả khổng lồ quấn đai đỏ sau lưng',
    descEn: 'Oversized legendary ninja technique scroll bound with crimson cord',
    price: 280,
  },
];

export interface SeatPlayerInfo {
  seatNumber: number;
  name: string;
  isAlive: boolean;
  isEmpty?: boolean;
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
  tableNumber?: number;
  signboardTitle?: string;
  signboardTitleEn?: string;
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
    playerCount: 0,
    maxPlayers: 10,
    themeColor: '#ef4444',
    banner: '🩸 Trăng Máu',
    campfireColor: 0xf97316,
    tableNumber: 1,
    signboardTitle: '🩸 Lều Trăng Máu (Bàn 1)',
    signboardTitleEn: '🩸 Blood Moon Tent (Table 1)',
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
    playerCount: 0,
    maxPlayers: 8,
    themeColor: '#38bdf8',
    banner: '🌫️ Sương Mù',
    campfireColor: 0x06b6d4,
    tableNumber: 2,
    signboardTitle: '🌫️ Lều Sương Mù (Bàn 2)',
    signboardTitleEn: '🌫️ Mist Valley Tent (Table 2)',
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
    playerCount: 0,
    maxPlayers: 10,
    themeColor: '#10b981',
    banner: '🌲 Rừng Thông',
    campfireColor: 0x10b981,
    tableNumber: 3,
    signboardTitle: '🌲 Lều Rừng Thông (Bàn 3)',
    signboardTitleEn: '🌲 Pine Forest Tent (Table 3)',
  },
  {
    id: 'tent-4',
    name: 'Lều Núi Tuyết',
    nameEn: 'Snow Mountain Tent',
    tagline: 'Đỉnh Bắc Băng Giá • Tuyết Trắng',
    taglineEn: 'Northern Snow Peak • Frost & Stars',
    description: 'Nằm trên đỉnh đồi tuyết trắng xóa phía Bắc khu cắm trại.',
    descriptionEn: 'Perched on the frost-dusted northern snow hill under crisp starlight.',
    position: [0, 0, -24],
    lookAt: [0, 1.2, -24],
    playerCount: 0,
    maxPlayers: 8,
    themeColor: '#38bdf8',
    banner: '❄️ Núi Tuyết',
    campfireColor: 0x38bdf8,
    tableNumber: 4,
    signboardTitle: '❄️ Lều Núi Tuyết (Bàn 4)',
    signboardTitleEn: '❄️ Snow Mountain Tent (Table 4)',
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
