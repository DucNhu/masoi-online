import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DONATION_PACKAGES,
  DEFAULT_GLOBAL_PAYMENT_CONFIG,
  GLOBAL_PAYMENT_STORAGE_KEY,
  getGlobalPaymentConfig,
  saveGlobalPaymentConfig,
} from '../src/constants/donationConfig.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function readSource(relativePath) {
  const fullPath = path.join(projectRoot, relativePath);
  return fs.readFileSync(fullPath, 'utf8');
}

test('Sprint 46 - TASK-4601: 4 Gói DONATION_PACKAGES có giá USD ($1, $3, $5, $10) và metadata Tiếng Anh chuẩn quốc tế', () => {
  assert.equal(DONATION_PACKAGES.length, 4, 'Phải có chính xác 4 gói tài trợ');

  const [coffee, pho, pizza, vip] = DONATION_PACKAGES;

  // 1. Gói COFFEE ($1 USD)
  assert.equal(coffee.id, 'COFFEE');
  assert.equal(coffee.priceUSD, 1, 'Gói Coffee có giá $1 USD');
  assert.equal(coffee.priceVND, 10000);
  assert.equal(coffee.coins, 1000);
  assert.equal(coffee.nameEn, '☕ Hot Coffee');
  assert.equal(coffee.bonusBadgeEn, '🥉 Bronze Supporter');
  assert.equal(coffee.bonusTitleEn, 'Camp Fan');

  // 2. Gói PHO ($3 USD)
  assert.equal(pho.id, 'PHO');
  assert.equal(pho.priceUSD, 3, 'Gói Pho có giá $3 USD');
  assert.equal(pho.priceVND, 25000);
  assert.equal(pho.coins, 3000);
  assert.equal(pho.nameEn, '🍜 Campfire Ramen');
  assert.equal(pho.bonusBadgeEn, '🥈 Silver Supporter');
  assert.equal(pho.bonusTitleEn, 'Village Patron');
  assert.equal(pho.popular, true);

  // 3. Gói PIZZA ($5 USD)
  assert.equal(pizza.id, 'PIZZA');
  assert.equal(pizza.priceUSD, 5, 'Gói Pizza có giá $5 USD');
  assert.equal(pizza.priceVND, 50000);
  assert.equal(pizza.coins, 7500);
  assert.equal(pizza.nameEn, '🍕 Bonfire Pizza');
  assert.equal(pizza.bonusBadgeEn, '🥇 Gold Supporter');
  assert.equal(pizza.bonusTitleEn, 'Forest Knight');

  // 4. Gói VIP_PATRON ($10 USD)
  assert.equal(vip.id, 'VIP_PATRON');
  assert.equal(vip.priceUSD, 10, 'Gói VIP Patron có giá $10 USD');
  assert.equal(vip.priceVND, 100000);
  assert.equal(vip.coins, 20000);
  assert.equal(vip.nameEn, '👑 Grand Werewolf Patron');
  assert.equal(vip.bonusBadgeEn, '💎 Diamond Patron');
  assert.equal(vip.bonusTitleEn, 'Moonlight VIP');
});

test('Sprint 46 - TASK-4602: Cấu hình cổng thanh toán quốc tế GlobalPaymentConfig hoạt động chính xác', () => {
  // Cấu hình mặc định
  assert.equal(DEFAULT_GLOBAL_PAYMENT_CONFIG.buyMeACoffeeUrl, 'https://buymeacoffee.com/ducnhu');
  assert.equal(DEFAULT_GLOBAL_PAYMENT_CONFIG.paypalMeUrl, 'https://paypal.me/ducnhu');
  assert.equal(DEFAULT_GLOBAL_PAYMENT_CONFIG.kofiUrl, 'https://ko-fi.com/ducnhu');
  assert.equal(GLOBAL_PAYMENT_STORAGE_KEY, 'ma_soi_global_payment_config');

  // getGlobalPaymentConfig fallback
  const cfg = getGlobalPaymentConfig();
  assert.ok(cfg.buyMeACoffeeUrl.includes('buymeacoffee.com'));
  assert.ok(cfg.paypalMeUrl.includes('paypal.me'));
  assert.ok(cfg.kofiUrl.includes('ko-fi.com'));

  // saveGlobalPaymentConfig
  const updated = saveGlobalPaymentConfig({
    buyMeACoffeeUrl: 'https://buymeacoffee.com/testpatron',
  });
  assert.equal(updated.buyMeACoffeeUrl, 'https://buymeacoffee.com/testpatron');
  assert.equal(updated.paypalMeUrl, 'https://paypal.me/ducnhu');
});

test('Sprint 46 - TASK-4603: File hướng dẫn phát hành Global Web production/web-global-publishing.md tồn tại và đầy đủ nội dung', () => {
  const doc = readSource('production/web-global-publishing.md');

  // Kiểm tra các nền tảng phân phối
  assert.ok(doc.includes('itch.io'), 'Tài liệu phải có hướng dẫn itch.io');
  assert.ok(doc.includes('CrazyGames'), 'Tài liệu phải có hướng dẫn CrazyGames');
  assert.ok(doc.includes('GameJolt'), 'Tài liệu phải có hướng dẫn GameJolt');
  assert.ok(doc.includes('Poki'), 'Tài liệu phải có hướng dẫn Poki');

  // Kiểm tra tài liệu copy-paste tiếng Anh
  assert.ok(doc.includes('Werewolf 3D: Campfire Online'), 'Tài liệu phải có Game Title tiếng Anh');
  assert.ok(doc.includes('KEY FEATURES'), 'Tài liệu phải có danh mục Key Features');
  assert.ok(doc.includes('GAME CONTROLS'), 'Tài liệu phải có hướng dẫn Controls');
  assert.ok(doc.includes('VOLUNTARY SUPPORT & SPONSORSHIP'), 'Tài liệu phải có phần Donation quốc tế');
  assert.ok(doc.includes('werewolf-3d-web.zip'), 'Tài liệu phải dẫn link file zip phân phối');
});

test('Sprint 46 - TASK-4604: File nén phân phối werewolf-3d-web.zip đã được tạo và có dung lượng hợp lệ', () => {
  const zipPath = path.join(projectRoot, 'werewolf-3d-web.zip');
  assert.ok(fs.existsSync(zipPath), 'File werewolf-3d-web.zip phải tồn tại ở thư mục gốc');

  const stat = fs.statSync(zipPath);
  assert.ok(stat.size > 1024 * 1024, `Dung lượng zip phải lớn hơn 1MB (thực tế: ${(stat.size / (1024 * 1024)).toFixed(2)}MB)`);
});

test('Sprint 46 - TASK-4605: Component DonationShopModal.tsx hỗ trợ chuyển đổi linh hoạt VietQR / Global và các cổng BuyMeACoffee, PayPal, Ko-fi', () => {
  const modalSource = readSource('src/components/DonationShopModal.tsx');

  // Kiểm tra state kênh thanh toán
  assert.ok(modalSource.includes("paymentMethod"), 'Modal phải có state paymentMethod');
  assert.ok(modalSource.includes("'GLOBAL'"), 'Modal phải có kênh GLOBAL');
  assert.ok(modalSource.includes("'VIETQR'"), 'Modal phải có kênh VIETQR');

  // Kiểm tra 3 cổng thanh toán quốc tế
  assert.ok(modalSource.includes('buyMeACoffeeUrl'), 'Modal phải tích hợp BuyMeACoffee');
  assert.ok(modalSource.includes('paypalMeUrl'), 'Modal phải tích hợp PayPal.Me');
  assert.ok(modalSource.includes('kofiUrl'), 'Modal phải tích hợp Ko-fi');

  // Kiểm tra nút xác nhận Claim Perks & giá USD
  assert.ok(
    modalSource.includes('Confirm Global Sponsor / Claim Perks') || modalSource.includes('Xác Nhận Đã Tài Trợ Quốc Tế'),
    'Modal phải có nút xác nhận nhận quà tài trợ quốc tế'
  );
  assert.ok(modalSource.includes('priceUSD'), 'Modal phải hiển thị giá USD');
  assert.ok(modalSource.includes('handleConfirmGlobalTransfer'), 'Modal phải có handler handleConfirmGlobalTransfer');
  assert.ok(modalSource.includes('handleSaveGlobalAdmin'), 'Modal phải có handler handleSaveGlobalAdmin');
});

test('Sprint 46 - TASK-4606: package.json có script build:zip và tích hợp test suite sprint46', () => {
  const pkgSource = readSource('package.json');
  const pkg = JSON.parse(pkgSource);

  assert.ok(pkg.scripts['build:zip'], 'package.json phải có script build:zip');
  assert.ok(pkg.scripts['build:zip'].includes('werewolf-3d-web.zip'), 'build:zip phải nén thành werewolf-3d-web.zip');
  assert.ok(pkg.scripts['test'].includes('sprint46GlobalWebAndPaypal.test.mjs'), 'Lệnh test phải chạy sprint46');
  assert.ok(pkg.scripts['test:sprint46'], 'package.json phải có script test:sprint46');
});
