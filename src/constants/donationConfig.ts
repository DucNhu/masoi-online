/**
 * Sprint 44: Hệ Thống Tài Trợ Duy Trì Server, Nạp Coin Web (VietQR Napas 24/7)
 * & Tuân Thủ Pháp Luật 100% (Zero-Gambling Compliance)
 *
 * MÔ HÌNH HOẠT ĐỘNG:
 * - 100% Tự nguyện quyên góp (Donation/Patronage) phục vụ duy trì chi phí máy chủ, PWA & WebRTC Mesh.
 * - KHÔNG PHẢI cờ bạc, KHÔNG cá cược, KHÔNG có tính năng đổi thưởng ra tiền mặt hoặc tài sản ngoài đời thực.
 * - Tuân thủ nghiêm ngặt Luật An ninh mạng & Nghị định quản lý dịch vụ Internet/Trò chơi trực tuyến tại Việt Nam.
 */

export interface DonationPackage {
  id: string;
  name: string;
  nameEn: string;
  priceVND: number;
  priceUSD: number;
  coins: number;
  bonusBadge: string;
  bonusBadgeEn: string;
  bonusTitle: string;
  bonusTitleEn: string;
  icon: string;
  popular?: boolean;
  descriptionVi: string;
  descriptionEn: string;
}

export interface BankConfig {
  bankId: string;       // Mã ngân hàng theo Napas (VD: 'MBBank', 'ICB', 'VCB', 'TCB', 'ACB')
  bankName: string;     // Tên hiển thị ngân hàng
  accountNo: string;    // Số tài khoản ngân hàng nhận tiền
  accountName: string;  // Tên chủ tài khoản
  defaultMemoPrefix: string; // Tiền tố nội dung chuyển khoản
}

export interface GlobalPaymentConfig {
  buyMeACoffeeUrl: string;
  paypalMeUrl: string;
  kofiUrl: string;
  customNote?: string;
}

export interface DonationHistoryItem {
  id: string;
  packageId?: string;
  packageName: string;
  amountVND: number;
  amountUSD?: number;
  coinsReceived: number;
  bonusTitle?: string;
  bonusBadge?: string;
  timestamp: number;
  method: 'VIETQR' | 'REWARDED_AD' | 'CUSTOM_DONATION' | 'GLOBAL_SPONSOR' | 'BUYMEACOFFEE' | 'PAYPAL' | 'KOFI';
}

/**
 * 4 Gói tài trợ thân thiện - Thiết kế theo văn hóa Việt & tinh thần cộng đồng làng Sói
 */
export const DONATION_PACKAGES: DonationPackage[] = [
  {
    id: 'COFFEE',
    name: '☕ Cà Phê Trứng',
    nameEn: '☕ Hot Coffee',
    priceVND: 10000,
    priceUSD: 1,
    coins: 1000,
    bonusBadge: '🥉 Supporter Đồng',
    bonusBadgeEn: '🥉 Bronze Supporter',
    bonusTitle: 'Người Hâm Mộ',
    bonusTitleEn: 'Camp Fan',
    icon: '☕',
    descriptionVi: 'Mời đội ngũ phát triển một ly cà phê ấm lòng để thức đêm code game.',
    descriptionEn: 'Treat the dev team to an egg coffee for late-night coding sessions.',
  },
  {
    id: 'PHO',
    name: '🍜 Phở Bò Tái Nạm',
    nameEn: '🍜 Campfire Ramen',
    priceVND: 25000,
    priceUSD: 3,
    coins: 3000,
    bonusBadge: '🥈 Supporter Bạc',
    bonusBadgeEn: '🥈 Silver Supporter',
    bonusTitle: 'Nhà Bảo Trợ',
    bonusTitleEn: 'Village Patron',
    icon: '🍜',
    popular: true,
    descriptionVi: 'Bát phở nóng hổi tiếp sức duy trì server WebRTC Mesh mượt mà 24/7.',
    descriptionEn: 'A warm bowl of Pho to power our 24/7 WebRTC Mesh server.',
  },
  {
    id: 'PIZZA',
    name: '🍕 Pizza Lửa Trại',
    nameEn: '🍕 Bonfire Pizza',
    priceVND: 50000,
    priceUSD: 5,
    coins: 7500,
    bonusBadge: '🥇 Supporter Vàng',
    bonusBadgeEn: '🥇 Gold Supporter',
    bonusTitle: 'Hiệp Sĩ Rừng Sâu',
    bonusTitleEn: 'Forest Knight',
    icon: '🍕',
    descriptionVi: 'Bữa tiệc pizza quanh đống lửa trại, tài trợ chi phí băng thông âm thanh 3D.',
    descriptionEn: 'Campfire pizza party supporting 3D spatial audio bandwidth.',
  },
  {
    id: 'VIP_PATRON',
    name: '👑 Vương Giả Làng Sói',
    nameEn: '👑 Grand Werewolf Patron',
    priceVND: 100000,
    priceUSD: 10,
    coins: 20000,
    bonusBadge: '💎 Supporter Kim Cương',
    bonusBadgeEn: '💎 Diamond Patron',
    bonusTitle: 'Đại Gia Trăng Rằm',
    bonusTitleEn: 'Moonlight VIP',
    icon: '👑',
    descriptionVi: 'Đại ân nhân của Làng Sói, tài trợ hạ tầng máy chủ và bảo trì hệ thống dài hạn.',
    descriptionEn: 'Grand Patron of Werewolf Village, securing long-term server infrastructure.',
  },
];

/**
 * Cấu hình Ngân Hàng Mặc Định
 */
export const DEFAULT_BANK_CONFIG: BankConfig = {
  bankId: 'MBBank',
  bankName: 'MB Bank (Quân Đội)',
  accountNo: '0388888888',
  accountName: 'DUCNHU / MA SOI ONLINE',
  defaultMemoPrefix: 'MASOI',
};

export const BANK_CONFIG = DEFAULT_BANK_CONFIG;

export const BANK_STORAGE_KEY = 'ma_soi_bank_config';
export const DONATION_HISTORY_KEY = 'ma_soi_donation_history';
export const PLAYER_COINS_KEY = 'ma_soi_player_coins';
export const PLAYER_TITLE_KEY = 'ma_soi_player_title';
export const PLAYER_BADGE_KEY = 'ma_soi_player_badge';

/**
 * Danh sách ngân hàng phổ biến hỗ trợ tạo nhanh VietQR Napas
 */
export const SUPPORTED_BANKS = [
  { id: 'MBBank', name: 'MB Bank (Ngân Hàng Quân Đội)' },
  { id: 'VCB', name: 'Vietcombank (Ngoại Thương Việt Nam)' },
  { id: 'ICB', name: 'VietinBank (Công Thương Việt Nam)' },
  { id: 'BIDV', name: 'BIDV (Đầu Tư & Phát Triển)' },
  { id: 'TCB', name: 'Techcombank (Kỹ Thương Việt Nam)' },
  { id: 'ACB', name: 'ACB (Á Châu)' },
  { id: 'VPB', name: 'VPBank (Việt Nam Thịnh Vượng)' },
  { id: 'TPB', name: 'TPBank (Tiên Phong)' },
  { id: 'STB', name: 'Sacombank (Sài Gòn Thương Tín)' },
  { id: 'VIB', name: 'VIB (Quốc Tế Việt Nam)' },
  { id: 'MSB', name: 'MSB (Hàng Hải Việt Nam)' },
];

/**
 * Lấy cấu hình ngân hàng hiện tại (Ưu tiên localStorage, fallback cấu hình mặc định)
 */
export function getBankConfig(): BankConfig {
  try {
    const raw = localStorage.getItem(BANK_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.bankId && parsed.accountNo) {
        return {
          ...DEFAULT_BANK_CONFIG,
          ...parsed,
        };
      }
    }
  } catch {
    // fallback
  }
  return { ...DEFAULT_BANK_CONFIG };
}

/**
 * Lưu cấu hình ngân hàng tùy biến vào localStorage
 */
export function saveBankConfig(config: Partial<BankConfig>): BankConfig {
  const current = getBankConfig();
  const updated: BankConfig = {
    ...current,
    ...config,
  };
  try {
    localStorage.setItem(BANK_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('ma-soi-bank-config-update', { detail: updated }));
  } catch {
    // ignore
  }
  return updated;
}

/**
 * Cấu hình Cổng Thanh Toán & Tài Trợ Quốc Tế (Global Web Distribution)
 */
export const DEFAULT_GLOBAL_PAYMENT_CONFIG: GlobalPaymentConfig = {
  buyMeACoffeeUrl: 'https://buymeacoffee.com/ducnhu',
  paypalMeUrl: 'https://paypal.me/ducnhu',
  kofiUrl: 'https://ko-fi.com/ducnhu',
};

export const GLOBAL_PAYMENT_STORAGE_KEY = 'ma_soi_global_payment_config';

/**
 * Lấy cấu hình thanh toán quốc tế (Ưu tiên localStorage, fallback mặc định)
 */
export function getGlobalPaymentConfig(): GlobalPaymentConfig {
  try {
    const raw = localStorage.getItem(GLOBAL_PAYMENT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          ...DEFAULT_GLOBAL_PAYMENT_CONFIG,
          ...parsed,
        };
      }
    }
  } catch {
    // fallback
  }
  return { ...DEFAULT_GLOBAL_PAYMENT_CONFIG };
}

/**
 * Lưu cấu hình thanh toán quốc tế vào localStorage
 */
export function saveGlobalPaymentConfig(cfg: Partial<GlobalPaymentConfig>): GlobalPaymentConfig {
  const current = getGlobalPaymentConfig();
  const updated: GlobalPaymentConfig = {
    ...current,
    ...cfg,
  };
  try {
    localStorage.setItem(GLOBAL_PAYMENT_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('ma-soi-global-payment-config-update', { detail: updated }));
  } catch {
    // ignore
  }
  return updated;
}

/**
 * Tạo URL ảnh VietQR Napas 24/7 chuẩn công nghệ
 * @param bankId Mã ngân hàng (VD: MBBank, VCB, ICB...)
 * @param accountNo Số tài khoản nhận tiền
 * @param amount Số tiền ủng hộ (VNĐ)
 * @param memo Nội dung chuyển khoản
 * @param template Giao diện QR: compact, compact2, qr_only, print
 */
export function generateVietQrUrl(
  bankId: string,
  accountNo: string,
  amount: number,
  memo: string,
  template: 'compact' | 'compact2' | 'qr_only' | 'print' = 'compact2'
): string {
  const cleanBankId = encodeURIComponent(bankId.trim());
  const cleanAccountNo = encodeURIComponent(accountNo.trim().replace(/\s+/g, ''));
  const cleanAmount = Math.max(0, Math.floor(amount));
  const cleanMemo = encodeURIComponent(memo.trim());

  return `https://img.vietqr.io/image/${cleanBankId}-${cleanAccountNo}-${template}.png?amount=${cleanAmount}&addInfo=${cleanMemo}`;
}

/**
 * Cấu hình Xem Quảng Cáo Nhận Thưởng (Rewarded Ads)
 */
export const REWARDED_AD_CONFIG = {
  durationSeconds: 15, // Thời gian xem quảng cáo tối thiểu: 15 giây
  coinReward: 300,      // Thưởng 300 coin mỗi lần xem xong
  maxPerDay: 10,        // Giới hạn 10 lượt xem/ngày để bảo vệ trải nghiệm người chơi
};

/**
 * ĐIỀU KHOẢN PHÁP LÝ & CAM KẾT KHÔNG CỜ BẠC (ZERO-GAMBLING COMPLIANCE)
 * Bắt buộc hiển thị rõ ràng trên giao diện và tài liệu sản phẩm.
 */
export const LEGAL_DISCLAIMER_VI = `
CAM KẾT PHÁP LÝ & MIỄN TRỪ TRÁCH NHIỆM (ZERO-GAMBLING COMPLIANCE):
1. PHI THƯƠNG MẠI & DUY TRÌ HẠ TẦNG:
   - "Ma Sói Online & 3D Campfire" là dự án game giải trí cộng đồng phi lợi nhuận.
   - Toàn bộ các khoản đóng góp tài trợ (Donation) hoàn toàn mang tính chất TỰ NGUYỆN của người chơi nhằm hỗ trợ chi phí vận hành hạ tầng máy chủ WebRTC Mesh, Hosting Vercel, PWA và duy trì tên miền.
2. TUYỆT ĐỐI KHÔNG CỜ BẠC / KHÔNG ĐỔI THƯỞNG:
   - Đồng tiền ảo (Coin) và các vật phẩm trang phục, phụ kiện 3D trong game chỉ có giá trị trang trí thẩm mỹ và làm đẹp cho nhân vật.
   - TUYỆT ĐỐI KHÔNG CÓ GIÁ TRỊ QUY ĐỔI thành tiền mặt, thẻ cào điện thoại, tài sản ảo hoặc bất kỳ hiện vật nào ngoài đời thực.
   - Game nghiêm cấm mọi hành vi cá cược, đánh bạc, gạ gẫm đổi thưởng dưới mọi hình thức giữa các người chơi.
3. TUÂN THỦ PHÁP LUẬT VIỆT NAM & QUỐC TẾ:
   - Dự án tuân thủ nghiêm chỉnh các quy định của Luật An ninh mạng, Nghị định quản lý dịch vụ Internet và thông tin trên mạng tại Việt Nam và chính sách Google Play / Apple App Store.
`.trim();

export const LEGAL_DISCLAIMER_EN = `
LEGAL DISCLAIMER & ZERO-GAMBLING COMPLIANCE:
1. NON-PROFIT & COMMUNITY INFRASTRUCTURE:
   - "Werewolf Online & 3D Campfire" is a non-profit community social deduction game.
   - All contributions are 100% voluntary donations aimed at covering real-time WebRTC Mesh server, PWA hosting, and cloud infrastructure expenses.
2. STRICT ZERO-GAMBLING & NO REAL-MONEY CASHOUT:
   - In-game Coins, 3D outfits, and badges have aesthetic/decorative value ONLY.
   - Virtual currency and items have ZERO monetary value and CANNOT be redeemed, refunded, or exchanged for real money, gift cards, or physical items under any circumstances.
   - Gambling, betting, and wagering in any form are strictly prohibited.
3. INTERNATIONAL & LOCAL LEGAL COMPLIANCE:
   - The game complies with international consumer protection standards, Google Play, Apple App Store policies, and applicable telecommunications regulations.
`.trim();
