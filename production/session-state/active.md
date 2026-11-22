# Active Session State — Ma Sói Game Studio

- **Thời gian cập nhật**: 2026-11-22 22:25 (Asia/Ho_Chi_Minh) — Đã kích hoạt Production Vercel chính thức thành công: `https://masoi-online.vercel.app`.
- **Vận hành**: `npm run verify` đạt 100% PASS (0 error, 33 bộ test suite, PWA build thành công). Đã kết nối repo `DucNhu/masoi-online` vào tài khoản Vercel `duc-61dc`.

## Vercel Production Deployment [COMPLETED & LIVE]
- **Tên miền chính thức trên Vercel**: `https://masoi-online.vercel.app`
- **Dashboard quản lý**: `https://vercel.com/duc-61dc/masoi-online`
- **Cơ chế tự động hóa**: Đã liên kết với tài khoản Vercel `duc-61dc`, tự động build và cập nhật production mỗi khi có commit mới.

## Sprint 46 — Phát Hành Web Game Toàn Cầu & Kiếm Tiền Quốc Tế [DONE & 100% VERIFIED]
- **Cấu hình Đơn Giá & Gói Quyên Góp Quốc Tế Chuẩn USD (`src/constants/donationConfig.ts`)**:
  - Cập nhật interface `DonationPackage` hỗ trợ song ngữ & đơn giá USD: `nameEn`, `priceUSD`, `bonusBadgeEn`, `bonusTitleEn`.
  - Chuẩn hóa 4 gói tài trợ theo văn hóa làng Sói:
    1. `COFFEE`: $1 USD (10.000 đ) — '☕ Hot Coffee' (1.000 Coins, 🥉 Bronze Supporter, 'Camp Fan')
    2. `PHO`: $3 USD (25.000 đ) — '🍜 Campfire Ramen' (3.000 Coins, 🥈 Silver Supporter, 'Village Patron', Popular 🔥)
    3. `PIZZA`: $5 USD (50.000 đ) — '🍕 Bonfire Pizza' (7.500 Coins, 🥇 Gold Supporter, 'Forest Knight')
    4. `VIP_PATRON`: $10 USD (100.000 đ) — '👑 Grand Werewolf Patron' (20.000 Coins, 💎 Diamond Patron, 'Moonlight VIP')
  - Tích hợp interface `GlobalPaymentConfig` & hàm tiện ích `getGlobalPaymentConfig()`, `saveGlobalPaymentConfig()`:
    * BuyMeACoffee: `https://buymeacoffee.com/ducnhu`
    * PayPal.Me: `https://paypal.me/ducnhu`
    * Ko-fi: `https://ko-fi.com/ducnhu`

- **Nâng Cấp Giao Diện Tiệm Nạp Coin Quốc Tế (`src/components/DonationShopModal.tsx`)**:
  - Hỗ trợ chuyển đổi mượt mà 2 kênh thanh toán: `⚡ VietQR Napas 24/7 (VNĐ)` và `🌍 Global (USD • PayPal / Buy Me A Coffee / Ko-fi)`.
  - Chế độ Global hiển thị bảng giá chuẩn USD ($1, $3, $5, $10, Custom Amount $1 - $500).
  - 3 Nút cổng thanh toán 1-chạm mở trực tiếp website quốc tế (`target="_blank"`, `rel="noopener noreferrer"`).
  - Khung hướng dẫn ghi chú tên nhân vật (`playerName`) kèm nút Copy nhanh.
  - Nút **"Confirm Global Sponsor / Claim Perks"** ("Xác Nhận Đã Tài Trợ Quốc Tế / Nhận Quà Ngay 🎁"):
    * Tự động cộng Coins, mở khóa Danh hiệu (Title) & Huy hiệu (Badge) quốc tế.
    * Kích hoạt hiệu ứng pháo hoa Confetti và chuông chúc mừng rực rỡ.
    * Ghi nhận lịch sử giao dịch vào `localStorage` với method `'GLOBAL_SPONSOR'`.
  - Khung cấu hình Admin (Settings) cho phép thay đổi linh hoạt URL BuyMeACoffee, PayPal.Me và Ko-fi lưu trên trình duyệt.

- **Kịch Bản Build Phân Phối Trình Duyệt (`package.json`)**:
  - Thêm script `"build:zip": "npm run build && cd dist && zip -r ../werewolf-3d-web.zip . && cd .."`.
  - Sinh thành công gói nén phân phối chuẩn `werewolf-3d-web.zip` (10MB) chứa toàn bộ asset WebGL/Three.js, PWA, Service Worker sẵn sàng upload.

- **Tài Liệu Hướng Dẫn Phát Hành Global Web (`production/web-global-publishing.md`)**:
  - Hướng dẫn từng bước phát hành lên: **itch.io** (HTML5 playable in browser), **CrazyGames**, **GameJolt**, **Poki**.
  - Bộ văn bản Tiếng Anh Copy-Paste hoàn chỉnh: Title, Short Tagline, Long Description, Key Features, Game Controls, FAQ, Disclaimer.

- **Bộ Kiểm Thử Tự Động Sprint 46 (`tests/sprint46GlobalWebAndPaypal.test.mjs`)**:
  - Đạt 6/6 test cases PASS (100%):
    1. 4 Gói DONATION_PACKAGES có giá USD ($1, $3, $5, $10) và metadata Tiếng Anh chuẩn quốc tế.
    2. Cấu hình cổng thanh toán quốc tế GlobalPaymentConfig hoạt động chính xác.
    3. File hướng dẫn phát hành Global Web production/web-global-publishing.md tồn tại và đầy đủ nội dung.
    4. File nén phân phối werewolf-3d-web.zip đã được tạo và có dung lượng hợp lệ (>1MB, thực tế 10MB).
    5. Component DonationShopModal.tsx hỗ trợ chuyển đổi linh hoạt VietQR / Global và các cổng BuyMeACoffee, PayPal, Ko-fi.
    6. package.json có script build:zip và tích hợp test suite sprint46.

## 1. Kiểm thử Toàn Diện
- `npm run test:sprint46`: 6/6 tests PASS.
- `npm run verify`: oxlint 0 error, 85/85 skills PASS, 33/33 test suites PASS, build PWA PASS (392ms).

## 2. Hành Động Tiếp Theo (Single Next Action)
- Đẩy commit mới lên nhánh `feature/ma-soi-online` và `main` theo quy tắc Continuous Deploy, kích hoạt GitHub Pages và Vercel deploy.
