# Active Session State — Ma Sói Game Studio

- **Thời gian cập nhật**: 2026-10-02 23:17 (Asia/Ho_Chi_Minh) — Hunter Night Step Implemented & Verified.
- **Mục tiêu**: Bổ sung bước gọi Thợ Săn ban đêm (Lá 10) để găm đạn/ngắm bắn trước trong im lặng theo biến thể gameplay được chọn.
- **Quyết định định hướng**: Nền tảng **React + TypeScript + Capacitor** (Thẻ bài / Bàn tròn / Avatar ma mị, siêu nhẹ, hỗ trợ cả Web + iOS + Android).
- **Nhánh làm việc**: `feature/ma-soi-online`.
- **Quy trình áp dụng**: Game Studio Hierarchy (BA → PM → Executor → QA) + Autonomous Day & Night Engine.

---

## 1. Cơ Chế Thợ Săn Gọi Đêm (Hunter Night Mechanics)
- **Thiết kế & Triển khai**:
  1. `src/types/game.ts`: Bổ sung phase `'NIGHT_HUNTER'` và thuộc tính `hunterTargetId` trong `NightStepAction`.
  2. `src/data/roles.ts`: Cập nhật `HUNTER` với `wakeEveryNight: true`, `nightOrder: 4`, và kịch bản quản trò `hunterWake`.
  3. `src/components/NightPhaseView.tsx`: Thêm bước gọi `HUNTER` ngay sau `BODYGUARD` và trước `WEREWOLF`. Thợ Săn được chọn 1 người sống để găm đạn ngắm bắn (không tự chọn bản thân). Giao diện hiển thị trực quan trạng thái găm đạn.
  4. `src/components/Header.tsx`: Bổ sung nhãn hiển thị `Đêm {round} • Thợ Săn`.
  5. `src/components/SetupView.tsx`: Bật mặc định Thợ Săn từ `>= 5` người chơi trở lên.
  6. `src/logic/gameEngine.ts`: Trong `resolveNightActions`, nếu Thợ Săn bị Ma Sói cắn hoặc Phù Thủy đầu độc, phát đạn găm sẵn lập tức hạ gục mục tiêu. Nếu Thợ Săn còn sống, mục tiêu găm đạn an toàn vô sự.
  7. `tests/offlineGameFlow.test.mjs`: Bổ sung 4 bài test kiểm thử chuỗi gọi đêm Thợ Săn, ngưỡng người chơi và độ chính xác của cơ chế găm đạn báo thù (PASS 100%).

---

## 2. Trạng Thái Kỹ Thuật (System Health)
- **Lint**: `oxlint` PASSED 100% (0 errors, 0 warnings trên 31 files).
- **Unit & E2E Test Suite**: **7 / 7 Test Suites PASSED 100%**!
- **Production Build**: Tối ưu siêu nhẹ **406KB** (Vite + TypeScript + PWA precache).
- **Mobile Native Shell**: Đồng bộ thành công dist -> ios & android qua `npm run mobile:sync`.
- **Autonomous Schedule Daemon**: Đang chạy nền đều đặn 24/7.

---

## 3. Hành Động Tiếp Theo Duy Nhất (Single Next Action)
- Báo cáo hoàn tất triển khai bước gọi Thợ Săn ban đêm cho người dùng, chuẩn bị commit/push khi có lệnh.
