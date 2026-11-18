# Active Session State — Ma Sói Game Studio

- **Thời gian cập nhật**: 2026-11-18 13:20 (Asia/Ho_Chi_Minh) — Hoàn tất Sprint 44: Hệ Thống Tài Trợ Duy Trì Server, Nạp Coin Web (VietQR Napas 24/7), Quảng Cáo Nhận Thưởng (Rewarded Ads) & Tuân Thủ Pháp Luật 100% (Zero-Gambling Compliance).
- **Vận hành**: `npm run verify` đạt 100% PASS (0 error, 31 bộ test suite, PWA build thành công). Tự động push lên nhánh `feature/ma-soi-online` và `main` để kích hoạt deploy CI/CD.

## Sprint 44 — Hệ Thống Tài Trợ, Nạp Coin VietQR & Zero-Gambling Compliance [DONE & 100% VERIFIED]
- **Tuân Thủ Pháp Luật 100% (Zero-Gambling Compliance)**:
  - Khẳng định 100% bản chất tự nguyện tài trợ (Donation/Patronage) phục vụ chi phí máy chủ WebRTC Mesh, Hosting Vercel & PWA.
  - Tuyệt đối không cờ bạc, không cá cược, không có tính năng đổi thưởng ra tiền mặt hoặc tài sản ngoài đời thực (`LEGAL_DISCLAIMER_VI`, `LEGAL_DISCLAIMER_EN`).
  - Coin và vật phẩm trang phục 3D chỉ có giá trị trang trí thẩm mỹ làm đẹp cho nhân vật trong game.
- **Cấu hình 4 Gói Tài Trợ & VietQR Napas 24/7 (`src/constants/donationConfig.ts`)**:
  - Gói `COFFEE`: '☕ Cà Phê Trứng', 10.000 VNĐ, 1.000 Coin, Badge '🥉 Supporter Đồng', Title 'Người Hâm Mộ'.
  - Gói `PHO`: '🍜 Phở Bò Tái Nạm', 25.000 VNĐ, 3.000 Coin, Badge '🥈 Supporter Bạc', Title 'Nhà Bảo Trợ' (popular).
  - Gói `PIZZA`: '🍕 Pizza Lửa Trại', 50.000 VNĐ, 7.500 Coin, Badge '🥇 Supporter Vàng', Title 'Hiệp Sĩ Rừng Sâu'.
  - Gói `VIP_PATRON`: '👑 Vương Giả Làng Sói', 100.000 VNĐ, 20.000 Coin, Badge '💎 Supporter Kim Cương', Title 'Đại Gia Trăng Rằm'.
  - Hỗ trợ số tiền tùy tâm (Custom Amount) và cấu hình ngân hàng linh hoạt (`BANK_CONFIG` fallback & lưu thiết bị localStorage `ma_soi_bank_config` cho admin/sếp).
  - Hàm `generateVietQrUrl` sinh mã VietQR Napas 24/7 chuẩn công nghệ.
- **Giao Diện Tiệm Nạp & Tài Trợ 3D Glassmorphism (`src/components/DonationShopModal.tsx`)**:
  - Thiết kế chuẩn Werewolf Theme (đen đêm, viền neon vàng gold, hiệu ứng phát sáng mượt mà).
  - 3 Tab chọn:
    1. `💖 Ủng Hộ & Nạp Coin`: Chọn 4 gói hoặc nhập tùy tâm, hiển thị VietQR động, copy STK/Nội dung, nút "Tôi Đã Chuyển Khoản Thành Công!" tự động cộng Coin, gán danh hiệu, lưu lịch sử, bắn confetti và phát âm thanh chuông. Khối Admin sửa nhanh STK ngân hàng nhận tiền thật.
    2. `📺 Xem Quảng Cáo (+300 🪙)`: Bộ đếm 15 giây với progress bar neon, kết thúc mở khóa nhận ngay +300 Coin miễn phí.
    3. `📜 Điều Khoản Pháp Lý`: Hiển thị song ngữ cam kết phi lợi nhuận, không đổi thưởng, cấm cờ bạc theo luật Việt Nam và chuẩn Store quốc tế.
- **Tích Hợp Toàn Diện (`Header.tsx`, `Wardrobe3DModal.tsx`, `App.tsx`)**:
  - `Header.tsx`: Cụm Coin `🪙 1,500 💖` bấm mở trực tiếp `DonationShopModal` với tooltip rõ ràng.
  - `Wardrobe3DModal.tsx`: Nút nạp coin / ủng hộ server 💖 mở modal, đồng thời giữ nút tân thủ +500 coin test.
  - `App.tsx`: Quản lý state `isDonationShopOpen`, lắng nghe sự kiện `ma-soi-open-donation`.
- **Bộ Kiểm Thử Tự Động Sprint 44 (`tests/sprint44MonetizationAndLegal.test.mjs`, `package.json`)**:
  - Đạt 7/7 test cases PASS (100%):
    1. TASK-4401: Cấu hình `DONATION_PACKAGES` có đủ 4 gói, giá tiền chuẩn VNĐ và tỷ lệ thưởng hợp lý.
    2. TASK-4402: Hàm `generateVietQrUrl` sinh đúng định dạng URL VietQR Napas 24/7.
    3. TASK-4403: Cam kết pháp lý `LEGAL_DISCLAIMER_VI` và `EN` chứa đầy đủ từ khóa chống cờ bạc, không đổi thưởng và phi lợi nhuận.
    4. TASK-4404: `BANK_CONFIG` hỗ trợ fallback và lưu/đọc cấu hình từ localStorage.
    5. TASK-4405: File `src/components/DonationShopModal.tsx` tồn tại, chứa đủ 3 tab (VietQR, Rewarded Ad, Legal).
    6. TASK-4406: `Wardrobe3DModal.tsx` và `Header.tsx` có liên kết mở `DonationShopModal`.
    7. TASK-4407: `App.tsx` gắn `DonationShopModal` và lắng nghe sự kiện `ma-soi-open-donation`.

## Sprint 43 — Sẵn Sàng Phát Hành Toàn Cầu (App Store & Google Play) & Đa Ngôn Ngữ Web [DONE & 100% VERIFIED]
- Hoàn tất danh mục 128+ quốc gia i18n, metadata ASO đa ngôn ngữ, key art 3D và tài liệu xuất bản store.

## 1. Kiểm thử Toàn Diện
- `npm run test:sprint44`: 7/7 tests PASS.
- `npm run verify`: oxlint 0 error, 85/85 skills PASS, 31/31 test suites PASS, build PWA PASS (343ms).

## 2. Hành Động Tiếp Theo (Single Next Action)
- Đẩy commit mới lên nhánh `feature/ma-soi-online` và `main` theo quy tắc Continuous Deploy, kích hoạt GitHub Pages và Vercel deploy.
