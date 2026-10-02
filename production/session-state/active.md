# Active Session State — Ma Sói Game Studio

- **Thời gian cập nhật**: 2026-10-02 22:48 (Asia/Ho_Chi_Minh) — Bug Fix & Verification Completed.
- **Mục tiêu**: Điều tra và sửa triệt để lỗi chế độ Offline không hiển thị role Bảo Vệ ban đêm.
- **Quyết định định hướng**: Nền tảng **React + TypeScript + Capacitor** (Thẻ bài / Bàn tròn / Avatar ma mị, siêu nhẹ, hỗ trợ cả Web + iOS + Android).
- **Nhánh làm việc**: `feature/ma-soi-online`.
- **Quy trình áp dụng**: Game Studio Hierarchy (BA → PM → Executor → QA) + Autonomous Day & Night Engine.

---

## 1. Kết Quả Xử Lý Bug: Role Bảo Vệ (Offline Mode)
- **Nguyên nhân gốc rễ (Root Cause)**:
  1. `src/components/SetupView.tsx`: Hàm gợi ý `syncRoleDefaults` trước đây đặt ngưỡng `setEnableGuard(newCount >= 6)`. Khi chơi với 4 hoặc 5 người, vai trò Bảo Vệ bị tự động tắt về `false` khiến bài J không được chia vào deck, dẫn đến `hasAliveBodyguard` = `false` trong `NightPhaseView`. (Trong khi bản Online hỗ trợ Bảo Vệ từ 4 người trở lên).
  2. Nguy cơ tràn lá bài (`isOverCapacity`): Khi bật nhiều vai trò đặc biệt vượt quá số người chơi, logic xáo bài trước đây cắt bớt ngẫu nhiên theo `slice(0, players.length)` có thể làm rơi mất lá Bảo Vệ.
  3. `src/components/NightPhaseView.tsx` & `src/components/Header.tsx`: Quản trò chuyển các bước gọi đêm (`currentStepIndex`) nhưng state `gameState.phase` không được cập nhật tương ứng (`NIGHT_BODYGUARD`), khiến Header luôn hiển thị "Đêm 1 • Bắt đầu đêm" thay vì "Đêm 1 • Bảo Vệ". Khi người dùng chuyển tab rồi quay lại, bước gọi đêm bị reset về `INTRO`.
- **Giải pháp triển khai (Solution Applied)**:
  1. Hạ ngưỡng bật mặc định Bảo Vệ xuống `>= 4` người chơi (đồng bộ với logic Online trong `roomManager.ts`).
  2. Bổ sung cảnh báo trực quan & disable nút Xào bài khi số lượng vai trò đặc biệt cấu hình vượt quá số người chơi để ngăn chặn hiện tượng rơi rớt lá bài.
  3. Bổ sung callback `onPhaseChange` hai chiều giữa `NightPhaseView` và `App.tsx`, cập nhật `gameState.phase` theo từng bước gọi (`NIGHT_BODYGUARD`, `NIGHT_WEREWOLF`, `NIGHT_WITCH`, `NIGHT_SEER`, ...), giúp Header hiển thị chính xác tên vai trò và bảo toàn bước gọi khi chuyển Tab.
  4. Bổ sung test suite `tests/offlineGameFlow.test.mjs` tích hợp vào `npm test`.

---

## 2. Trạng Thái Kỹ Thuật (System Health)
- **Lint**: `oxlint` PASSED 100% (0 errors, 0 warnings trên 31 files).
- **Unit & E2E Test Suite**: **7 / 7 Test Suites PASSED 100%**!
  - `tests/gameEngine.test.mjs`: 8 unit tests logic nhân vật & vai trò.
  - `tests/roomProtocol.test.mjs`: 6 unit tests Zero-Knowledge masking.
  - `tests/roomManager.test.mjs`: 9 unit tests Room Manager & State Machine.
  - `tests/multiplayerE2E.test.mjs`: 9 test cases E2E multi-client & Reconnection.
  - `tests/fullOnlineMatch.test.mjs`: 8 test cases full match 2 vòng ngày đêm & Chat Stream phân quyền.
  - `tests/voiceSignaling.test.mjs`: 6 test cases WebRTC Voice Signaling & Night Auto-Mute.
  - `tests/offlineGameFlow.test.mjs`: 3 test cases offline flow, Bodyguard threshold & phase synchronization.
- **Production Build**: Tối ưu siêu nhẹ **403KB** (Vite + TypeScript + PWA precache).
- **Mobile Native Shell**: Đồng bộ thành công dist -> ios (`ios/App/App/public`) & android (`android/app/src/main/assets/public`) qua `npm run mobile:sync`.
- **Autonomous Schedule Daemon**: Đang chạy nền đều đặn 24/7.

---

## 3. Trạng Thái Triển Khai (Deployment Status)
- **Git Push**: Đã hoàn tất commit và push cả 2 nhánh `feature/ma-soi-online` và `main` lên GitHub remote (`origin`).
- **GitHub Actions Deploy**: Tự động kích hoạt workflow `.github/workflows/deploy.yml` khi push nhánh `main` để build và xuất bản GitHub Pages tại `https://ducnhu.github.io/masoi-online/`.

---

## 4. Hành Động Tiếp Theo Duy Nhất (Single Next Action)
- Kiểm tra kết quả xuất bản thực tế trên GitHub Pages và nghiệm thu tính năng hiển thị role Bảo Vệ cùng WebRTC Voice Chat trên môi trường Production.
