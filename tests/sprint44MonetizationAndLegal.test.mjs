import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DONATION_PACKAGES,
  DEFAULT_BANK_CONFIG,
  getBankConfig,
  saveBankConfig,
  generateVietQrUrl,
  REWARDED_AD_CONFIG,
  LEGAL_DISCLAIMER_VI,
  LEGAL_DISCLAIMER_EN,
} from '../src/constants/donationConfig.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function readSource(relativePath) {
  const fullPath = path.join(projectRoot, relativePath);
  return fs.readFileSync(fullPath, 'utf8');
}

test('Sprint 44 - TASK-4401: Cấu hình DONATION_PACKAGES có đủ 4 gói, giá tiền chuẩn VNĐ và tỷ lệ thưởng hợp lý', () => {
  assert.equal(DONATION_PACKAGES.length, 4, 'Phải có chính xác 4 gói tài trợ');

  const [coffee, pho, pizza, vip] = DONATION_PACKAGES;

  // 1. Gói COFFEE (10.000 VNĐ -> 1.000 Coin)
  assert.equal(coffee.id, 'COFFEE');
  assert.equal(coffee.priceVND, 10000);
  assert.equal(coffee.coins, 1000);
  assert.ok(coffee.name.includes('Cà Phê'));
  assert.ok(coffee.bonusBadge.includes('Đồng'));
  assert.ok(coffee.bonusTitle.includes('Người Hâm Mộ'));

  // 2. Gói PHO (25.000 VNĐ -> 3.000 Coin, Gói phổ biến nhất)
  assert.equal(pho.id, 'PHO');
  assert.equal(pho.priceVND, 25000);
  assert.equal(pho.coins, 3000);
  assert.equal(pho.popular, true, 'Gói Phở Bò phải được gắn cờ popular = true');
  assert.ok(pho.name.includes('Phở Bò'));
  assert.ok(pho.bonusBadge.includes('Bạc'));
  assert.ok(pho.bonusTitle.includes('Nhà Bảo Trợ'));

  // 3. Gói PIZZA (50.000 VNĐ -> 7.500 Coin)
  assert.equal(pizza.id, 'PIZZA');
  assert.equal(pizza.priceVND, 50000);
  assert.equal(pizza.coins, 7500);
  assert.ok(pizza.name.includes('Pizza'));
  assert.ok(pizza.bonusBadge.includes('Vàng'));
  assert.ok(pizza.bonusTitle.includes('Hiệp Sĩ'));

  // 4. Gói VIP_PATRON (100.000 VNĐ -> 20.000 Coin)
  assert.equal(vip.id, 'VIP_PATRON');
  assert.equal(vip.priceVND, 100000);
  assert.equal(vip.coins, 20000);
  assert.ok(vip.name.includes('Vương Giả'));
  assert.ok(vip.bonusBadge.includes('Kim Cương'));
  assert.ok(vip.bonusTitle.includes('Đại Gia'));

  // Kiểm tra cấu hình Rewarded Ad
  assert.equal(REWARDED_AD_CONFIG.durationSeconds, 15, 'Thời gian xem quảng cáo là 15 giây');
  assert.equal(REWARDED_AD_CONFIG.coinReward, 300, 'Thưởng xem quảng cáo là 300 Coin');
});

test('Sprint 44 - TASK-4402: Hàm generateVietQrUrl sinh đúng định dạng URL VietQR Napas 24/7', () => {
  const url = generateVietQrUrl('MBBank', '0388888888', 25000, 'MASOI PHO THOSAN', 'compact2');
  assert.ok(url.startsWith('https://img.vietqr.io/image/'), 'URL phải bắt đầu bằng VietQR API gateway');
  assert.ok(url.includes('MBBank-0388888888-compact2.png'), 'URL phải chứa bankId, accountNo và template');
  assert.ok(url.includes('amount=25000'), 'URL phải chứa số tiền chuẩn');
  assert.ok(url.includes('addInfo=MASOI%20PHO%20THOSAN'), 'Memo phải được encodeURIComponent an toàn');

  // Test trường hợp số tài khoản có dấu cách và số tiền lẻ
  const urlTrimmed = generateVietQrUrl('ICB', ' 1028 8888 9999 ', 50000.8, 'TEST DONATE', 'compact');
  assert.ok(urlTrimmed.includes('ICB-102888889999-compact.png'));
  assert.ok(urlTrimmed.includes('amount=50000'));
});

test('Sprint 44 - TASK-4403: Cam kết pháp lý LEGAL_DISCLAIMER chứa đầy đủ từ khóa chống cờ bạc, không đổi thưởng và phi lợi nhuận', () => {
  // Bản Tiếng Việt
  assert.ok(
    LEGAL_DISCLAIMER_VI.includes('KHÔNG CÓ GIÁ TRỊ QUY ĐỔI'),
    'Điều khoản VI phải khẳng định Coin không có giá trị quy đổi'
  );
  assert.ok(
    LEGAL_DISCLAIMER_VI.includes('tiền mặt'),
    'Điều khoản VI phải nêu rõ không đổi thành tiền mặt'
  );
  assert.ok(
    LEGAL_DISCLAIMER_VI.includes('phi lợi nhuận') || LEGAL_DISCLAIMER_VI.includes('PHI THƯƠNG MẠI'),
    'Điều khoản VI phải nêu rõ dự án phi lợi nhuận / phi thương mại'
  );
  assert.ok(
    LEGAL_DISCLAIMER_VI.includes('không cờ bạc') || LEGAL_DISCLAIMER_VI.includes('đánh bạc'),
    'Điều khoản VI phải nghiêm cấm cờ bạc đánh bạc'
  );
  assert.ok(
    LEGAL_DISCLAIMER_VI.includes('tự nguyện') || LEGAL_DISCLAIMER_VI.includes('TỰ NGUYỆN'),
    'Điều khoản VI phải khẳng định tài trợ là tự nguyện'
  );
  assert.ok(
    LEGAL_DISCLAIMER_VI.includes('máy chủ') || LEGAL_DISCLAIMER_VI.includes('WebRTC'),
    'Điều khoản VI phải giải thích mục đích duy trì máy chủ hạ tầng'
  );

  // Bản Tiếng Anh
  assert.ok(
    LEGAL_DISCLAIMER_EN.includes('ZERO-GAMBLING') || LEGAL_DISCLAIMER_EN.includes('Zero-Gambling'),
    'Điều khoản EN phải có Zero-Gambling compliance'
  );
  assert.ok(
    LEGAL_DISCLAIMER_EN.includes('CANNOT be redeemed') || LEGAL_DISCLAIMER_EN.includes('no cash value'),
    'Điều khoản EN phải khẳng định không đổi thưởng ra tiền thật'
  );
  assert.ok(
    LEGAL_DISCLAIMER_EN.includes('voluntary donations'),
    'Điều khoản EN phải khẳng định tài trợ tự nguyện'
  );
  assert.ok(
    LEGAL_DISCLAIMER_EN.includes('non-profit'),
    'Điều khoản EN phải nêu rõ non-profit'
  );
});

test('Sprint 44 - TASK-4404: BANK_CONFIG hỗ trợ fallback và lưu/đọc cấu hình từ localStorage', () => {
  // Cấu hình mặc định
  assert.equal(DEFAULT_BANK_CONFIG.bankId, 'MBBank');
  assert.equal(DEFAULT_BANK_CONFIG.accountNo, '0388888888');
  assert.ok(DEFAULT_BANK_CONFIG.accountName.includes('DUCNHU'));

  // Kiểm tra getBankConfig fallback an toàn khi không có window / localStorage giả lập
  const config = getBankConfig();
  assert.ok(config.bankId.length > 0);
  assert.ok(config.accountNo.length > 0);
  assert.ok(config.accountName.length > 0);
});

test('Sprint 44 - TASK-4405: Component DonationShopModal.tsx tồn tại và có đủ 3 Tab (VietQR, Rewarded Ad, Legal)', () => {
  const modalSource = readSource('src/components/DonationShopModal.tsx');

  // Kiểm tra tồn tại 3 tab
  assert.ok(modalSource.includes("'DONATE'"), 'Modal phải có tab DONATE');
  assert.ok(modalSource.includes("'ADS'"), 'Modal phải có tab ADS');
  assert.ok(modalSource.includes("'LEGAL'"), 'Modal phải có tab LEGAL');

  // Kiểm tra tích hợp VietQR
  assert.ok(modalSource.includes('generateVietQrUrl'), 'Modal phải gọi generateVietQrUrl');
  assert.ok(modalSource.includes('vietQrUrl'), 'Modal phải render ảnh VietQR');
  assert.ok(modalSource.includes('Tôi Đã Chuyển Khoản Thành Công'), 'Modal phải có nút xác nhận chuyển khoản');

  // Kiểm tra tích hợp Rewarded Ads 15s
  assert.ok(modalSource.includes('REWARDED_AD_CONFIG'), 'Modal phải sử dụng REWARDED_AD_CONFIG');
  assert.ok(modalSource.includes('handleStartWatchingAd'), 'Modal phải có logic đếm ngược xem quảng cáo');
  assert.ok(modalSource.includes('handleClaimAdReward'), 'Modal phải có nút nhận thưởng coin');

  // Kiểm tra hiển thị pháp lý
  assert.ok(modalSource.includes('LEGAL_DISCLAIMER_VI'), 'Modal phải hiển thị điều khoản tiếng Việt');
  assert.ok(modalSource.includes('LEGAL_DISCLAIMER_EN'), 'Modal phải hiển thị điều khoản tiếng Anh');
  assert.ok(modalSource.includes('KHÔNG ĐỔI THƯỞNG'), 'Modal phải có huy hiệu Không Đổi Thưởng');
});

test('Sprint 44 - TASK-4406: Wardrobe3DModal.tsx và Header.tsx có liên kết mở DonationShopModal', () => {
  const headerSource = readSource('src/components/Header.tsx');
  const wardrobeSource = readSource('src/components/arena3d/Wardrobe3DModal.tsx');

  // Header.tsx
  assert.ok(
    headerSource.includes('onOpenDonationShop'),
    'HeaderProps phải có prop onOpenDonationShop'
  );
  assert.ok(
    headerSource.includes('Ủng Hộ Server & Nạp Coin 💖'),
    'Header phải có tooltip Ủng Hộ Server & Nạp Coin 💖'
  );
  assert.ok(
    headerSource.includes('profile-badge-coins'),
    'Header phải có cụm bấm coin'
  );

  // Wardrobe3DModal.tsx
  assert.ok(
    wardrobeSource.includes('onOpenDonationShop') || wardrobeSource.includes('ma-soi-open-donation'),
    'Wardrobe3DModal phải có trigger mở shop nạp coin'
  );
  assert.ok(
    wardrobeSource.includes('Nạp Coin 💖') || wardrobeSource.includes('Get Coins 💖'),
    'Wardrobe3DModal phải có nút Nạp Coin'
  );
});

test('Sprint 44 - TASK-4407: App.tsx gắn DonationShopModal và lắng nghe sự kiện ma-soi-open-donation', () => {
  const appSource = readSource('src/App.tsx');

  assert.ok(
    appSource.includes("import { DonationShopModal } from './components/DonationShopModal'"),
    'App.tsx phải import DonationShopModal'
  );
  assert.ok(
    appSource.includes('isDonationShopOpen'),
    'App.tsx phải có state isDonationShopOpen'
  );
  assert.ok(
    appSource.includes('ma-soi-open-donation'),
    'App.tsx phải lắng nghe sự kiện ma-soi-open-donation'
  );
  assert.ok(
    appSource.includes('<DonationShopModal'),
    'App.tsx phải render <DonationShopModal />'
  );
});
