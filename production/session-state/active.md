# Active Session State — Ma Sói Game Studio

- **Thời gian cập nhật**: 2026-10-02, Asia/Ho_Chi_Minh.
- **Mục tiêu hiện tại**: Triển khai SPRINT 2 (Ma Sói Online & Mobile Native iOS/Android).
- **Quyết định định hướng đã chốt**: Giữ nguyên nền tảng **React + TypeScript + Capacitor** (chơi dạng Thẻ bài / Bàn tròn / Avatar / Voice ma mị, siêu nhẹ, hỗ trợ cả Web + iOS + Android).
- **Nhánh làm việc**: `feature/ma-soi-online`.
- **Quy trình áp dụng**: Game Studio Hierarchy (BA → PM → Executor → QA) + Autonomous Day & Night Engine.

---

## 1. Tiến Độ Sprint 2 (Online & Mobile Native)
- **TASK-101 [DONE]**: Cấu hình Mobile Native Shell bằng Capacitor 8 cho iOS & Android (Xcode `ios/`, Gradle `android/`, Haptics, Status bar).
- **TASK-102 [DONE]**: Thiết kế Protocol Realtime Multiplayer & State Synchronization (**Zero-Knowledge**).
  - Đã triển khai `src/types/multiplayer.ts`: Cấu trúc dữ liệu tách biệt giữa `ServerGameState` (tuyệt mật) và `ClientGameState` (đã qua bộ lọc an toàn).
  - Đã triển khai `src/logic/roomProtocol.ts`:
    + `generateRoomCode()` & `isValidRoomCode()`: Sinh mã phòng ngẫu nhiên 6 ký tự không gây nhầm lẫn.
    + `maskGameStateForPlayer()`: Che giấu vai trò toàn bộ người chơi khác, chỉ để lộ `myRole`, đồng đội Sói (chỉ cho Sói/Bán Tơ), người yêu (chỉ cho cặp đôi Cupid), và kết quả soi (chỉ cho Tiên Tri).
  - Bộ kiểm thử: 6/6 unit tests mới trong `tests/roomProtocol.test.mjs` PASS 100%.
- **TASK-103 [READY]**: Triển khai Room Manager Server & WebSocket/Realtime Relay.

---

## 2. Trạng Thái Backlog
- **Tổng số task**: 15 Task.
- **Đã hoàn thành (DONE)**: 10 Task (8 Task Sprint 1 + TASK-101 + TASK-102).
- **Hàng đợi khả dụng (READY)**: 5 Task (TASK-103 đến TASK-107).
- **Task tiếp theo**: `TASK-103` (Triển khai Room Manager & Realtime Connection Manager).

---

## 3. Trạng Thái Kỹ Thuật (System Health)
- **Lint**: `oxlint` PASSED 100% (0 errors, 0 warnings).
- **Unit Test Suite**: 14/14 tests PASSED (8 gameEngine tests + 6 roomProtocol tests).
- **Production Build**: `npm run build` PASSED (Vite + TypeScript + PWA precache).
- **Autonomous Schedule Daemon**: Đang chạy nền đều đặn 24/7.

---

## 4. Hành Động Tiếp Theo Duy Nhất (Single Next Action)
- Bắt tay vào `TASK-103`: Triển khai Room Manager & Realtime WebSocket Client/Relay (`src/logic/roomManager.ts` & network connection adapter) để quản lý tạo phòng, vào phòng, ngắt/nối lại kết nối.
