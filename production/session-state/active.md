# Active Session State — Ma Sói Game Studio

- **Thời gian cập nhật**: 2026-11-14 07:42 (Asia/Ho_Chi_Minh) — Studio Director: Điêu khắc Tạo hình Chibi Nendoroid 3D (Vòng 3 đạt 10/10 Eye-First Gate), Cấu hình Vercel & PWA Auto-Update + Sprint 41 Friendly Logo & Zoom Controls.
- **Vận hành**: Điều phối song song đa Subagent (`Model: flash`) với Disjoint File Leases + Nghiệm thu 3 vòng bằng mắt thật trên ảnh render WebGL thực tế (`10/10 PASS`).

## Sprint 42 — Điêu Khắc Chibi Nendoroid 3D & Chống Kẹt Cache Deploy Vercel [DONE & 100% VERIFIED]
- **Điêu khắc nhân vật Chibi 3D (`src/components/arena3d/WolfMeshBuilder.ts`) — Xóa bỏ 100% ống trụ rời rạc**:
  1. **Thân & Cổ Áo Choàng**: Khối thân babydoll liền mạch bằng `LatheGeometry` kết hợp cổ áo lá sen bo tròn mềm mại, nơ ruy băng ngực và cúc vàng xinh xắn.
  2. **Vai & Tay Áo Phồng Búp Bê**: Chỏm cầu vai kín tròn xuôi tự nhiên, góc mở tay chữ A duyên dáng (`∓0.38 rad`), tay áo phồng Lantern `LatheGeometry`, bo cổ tay kem và bàn tay tròn mũm mĩm.
  3. **Váy Xếp Ly 14 Múi Lượn Sóng & Ren Lót**: Lưới váy chữ A dập sóng hình sin 14 múi liền khối từ đai eo xuống gấu váy, kèm lớp váy lót ren trắng kem lượn sóng cánh hoa (ngồi không bị giày đâm xuyên váy).
  4. **Đôi Mắt Anime Đa Lớp & Khuôn Mặt**: Lòng trắng ôm cong theo má, tròng mắt ngọc phát sáng dịu, con ngươi tím than sâu thẳm, 3 đốm sáng lấp lánh, hàng mi cong, miệng mèo `:3`, tóc mái ngố không xuyên mũ và 2 răng nanh sói nhí Kemonomimi đáng yêu.
- **Hạ tầng Deploy Vercel & Tự động làm mới PWA (`package.json`, `vercel.json`, `vite.config.ts`, `src/main.tsx`)**:
  - Khóa `engines.node = "22.x"` cho container build Vercel tương thích `vite@8.3`.
  - Khai báo tường minh `framework: "vite"`, `outputDirectory: "dist"`, SPA rewrite loại trừ tài nguyên tĩnh và header `no-cache` cho `sw.js`, `index.html`, `manifest.webmanifest`.
  - Bật `skipWaiting`, `clientsClaim`, `cleanupOutdatedCaches` trong Workbox và lắng nghe `controllerchange` tự động tải bản mới ngay khi có deploy.
  - Phát hiện tên miền `ma-soi-online.vercel.app` hiện đang trỏ vào repo cũ khác (không phải repo `DucNhu/masoi-online`), trong khi bản mới nhất luôn tự động xuất bản tại `https://ducnhu.github.io/masoi-online/`.

## Sprint 41 — Nhận Diện Logo Thân Thiện & Cụm Điều Khiển Zoom Mobile 3D [DONE & 100% VERIFIED]
- **Kết quả nghiệm thu định lượng**:
  - `tests/sprint41FriendlyLogoAndZoom.test.mjs` đạt 9/9 test cases PASS (100%):
    1. TASK-4101: Toán học giới hạn bán kính Camera (`MIN_CAMERA_RADIUS=3.8`, `MAX_CAMERA_RADIUS=24.0`) và hàm `clampCameraRadius`.
    2. TASK-4102: Quy đổi bán kính sang phần trăm Zoom (`radiusToZoomPercent` mặc định 8.5 -> 100%, <8.5 -> >100%, >8.5 -> <100%).
    3. TASK-4103: Tính toán độ cao góc nhìn tương ứng (`computeProportionalHeight` ở cả chế độ Roam và Seated).
    4. TASK-4104: Mã nguồn `CampfireScene.ts` hỗ trợ đầy đủ `zoomIn`, `zoomOut`, `setOnZoomChange`, Pinch-to-Zoom 2 ngón (`touches.length >= 2`).
    5. TASK-4105: Phím tắt thu phóng `+`/`=`/`NumpadAdd` & `-`/`_`/`NumpadSubtract`, chặn cuộn trang với `SCROLL_KEYS`.
    6. TASK-4106: `CampfireArena3DView.tsx` có đủ 3 nút `btn-zoom-in`, `btn-zoom-out`, `btn-zoom-reset`, kích thước 44px, không có `hide-on-mobile`.
    7. TASK-4107: Cơ chế nhấn giữ liên tục (Press & Hold) qua `onPointerDown/Up/Leave/Cancel`, delay 220ms, interval 90ms.
    8. TASK-4108: `public/favicon.svg` loại bỏ hoàn toàn mắt đỏ `#ef4444`, sử dụng mắt hổ phách `amberEye`, khăn quàng `scarfGrad`, trăng vàng `moonGlow`, má hồng và catchlights.
    9. TASK-4109: Nhận diện thương hiệu thân thiện `BRAND_ASSETS.appIcon` tích hợp trên `AccountGate.tsx`, `Header.tsx`, `OnlineLobby.tsx`.

## 1. Kiểm thử
- `npm run test:sprint41`: 9/9 tests PASS.
- `npm run verify`: oxlint 0 error, 80/80 skills PASS, 29/29 test suites PASS, build PWA PASS (366ms).

## 2. Hành Động Tiếp Theo (Single Next Action)
- Git commit và git push tự động lên cả 2 nhánh `feature/ma-soi-online` và `main` để kích hoạt GitHub Pages deploy bản mới nhất cho người dùng trải nghiệm trực quan trên điện thoại và PC.
