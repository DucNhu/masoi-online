# Active Session State — Ma Sói Game Studio

- **Thời gian cập nhật**: 2026-11-15 11:25 (Asia/Ho_Chi_Minh) — Hoàn tất Sprint 43: Sẵn Sàng Xuất Bản App Store & Google Play Toàn Cầu + Đa Ngôn Ngữ i18n & Key Art 3D Campfire.
- **Vận hành**: `npm run verify` đạt 100% PASS (0 error, 30 bộ test suite, PWA build thành công). Tự động push lên nhánh `feature/ma-soi-online` và `main` để kích hoạt deploy CI/CD.

## Sprint 43 — Sẵn Sàng Phát Hành Toàn Cầu (App Store & Google Play) & Đa Ngôn Ngữ Web [DONE & 100% VERIFIED]
- **Key Art Lửa Trại 3D Sắc Nét (`public/og-image.jpg`, `public/og-image.png`)**:
  - Đã cập nhật ảnh key art 3D Campfire độ phân giải cao (806KB) làm banner quảng bá mặc định cho OpenGraph, Zalo, Facebook, Twitter và Feature Graphic trên Store.
- **SEO & OpenGraph Quốc Tế (`index.html`)**:
  - Bổ sung `og:locale` (`vi_VN`) cùng danh sách các ngôn ngữ thay thế quốc tế `og:locale:alternate` (`en_US`, `ja_JP`, `ko_KR`, `zh_CN`, `fr_FR`, `es_ES`, `de_DE`).
  - Cập nhật mô tả song ngữ Việt - Anh phục vụ hiển thị rich card preview mượt mà trên toàn cầu.
- **Cấu hình Capacitor Store Metadata (`capacitor.config.ts`)**:
  - Bảo toàn tuyệt đối `appId: 'com.masoi.online'`, `webDir: 'dist'`, bổ sung cấu hình và xuất khẩu `STORE_DISPLAY_NAMES` cho từng vùng quốc gia (`Ma Sói Online` cho `vi`, `Werewolf Online: 3D Campfire` cho quốc tế và bản dịch bản địa hóa cho Nhật, Hàn, Trung, Pháp, Tây Ban Nha, Đức).
- **Engine Trích Xuất Metadata ASO Bản Địa (`src/utils/i18nCatalog.ts`)**:
  - Cung cấp hàm `getStoreAppMetadata(localeCode?: string)` và từ điển `STORE_METADATA_MAP` cho 10+ thị trường trọng điểm: `vi-VN`, `en-US`, `ja-JP`, `ko-KR`, `zh-CN`, `es-ES`, `fr-FR`, `de-DE`, `pt-BR`, `th-TH`, `id-ID`.
  - Hỗ trợ cơ chế prefix matching và fallback thông minh về `en-US` hoặc `vi-VN`.
- **Bộ Tài Liệu Xuất Bản Store Hoàn Chỉnh (`production/store-listing-global.md`)**:
  - Sẵn sàng copy-paste trực tiếp lên Apple App Store Connect và Google Play Console:
    - Bundle ID (`com.masoi.online`), SKU (`MASOI_ONLINE_GLOBAL_2026`), Danh mục (`Games > Board`), Độ tuổi (`12+` / `Teen`).
    - Bản dịch đầy đủ tiêu đề, phụ đề, mô tả ngắn, mô tả chi tiết và từ khóa ASO cho Việt Nam, Quốc tế Anh, Nhật Bản, Hàn Quốc, Tây Ban Nha/LATAM, Thái Lan, Indonesia.
    - Quyền truy cập Native: iOS `NSMicrophoneUsageDescription` (Việt & Anh), Android `RECORD_AUDIO`, `INTERNET`, `VIBRATE`.
    - Quy trình build và đồng bộ Capacitor (`npm run mobile:sync`, `npm run mobile:ios`, `npm run mobile:android`).
- **Bộ Kiểm Thử Tự Động Sprint 43 (`tests/sprint43GlobalStoreAndI18n.test.mjs`, `package.json`)**:
  - Đạt 7/7 test cases PASS (100%):
    1. TASK-4301: `GLOBAL_LANGUAGES` vượt chuẩn 128+ quốc gia (133 entries) và phủ đủ 5 vùng địa lý (`ASIA`, `EUROPE`, `AMERICAS`, `MEA`, `OCEANIA`).
    2. TASK-4302: `getStoreAppMetadata` hỗ trợ đầy đủ 10+ ngôn ngữ trọng điểm quốc tế.
    3. TASK-4303: `getStoreAppMetadata` xử lý fallback tiền tố và mặc định chuẩn xác.
    4. TASK-4304: `index.html` chứa thẻ `og:locale` và các `og:locale:alternate` quốc tế.
    5. TASK-4305: `capacitor.config.ts` bảo toàn `appId: com.masoi.online` và export `STORE_DISPLAY_NAMES`.
    6. TASK-4306: Key art OpenGraph `public/og-image.jpg` và `public/og-image.png` được cập nhật sắc nét (>500KB).
    7. TASK-4307: Tài liệu `production/store-listing-global.md` đầy đủ metadata App Store & Google Play.

## Sprint 42 — Điêu Khắc Chibi Nendoroid 3D & Triển Khai Vercel [DONE & 100% VERIFIED]
- Hoàn tất điêu khắc Chibi 3D Babydoll liền khối và hạ tầng deploy Vercel + PWA Auto-refresh.

## 1. Kiểm thử Toàn Diện
- `npm run test:sprint43`: 7/7 tests PASS.
- `npm run verify`: oxlint 0 error, 80/80 skills PASS, 30/30 test suites PASS, build PWA PASS (418ms).

## 2. Hành Động Tiếp Theo (Single Next Action)
- Đẩy commit mới lên nhánh `feature/ma-soi-online` và `main` theo quy tắc Continuous Deploy, kiểm tra kết quả deploy tự động trên Vercel và GitHub Pages.
