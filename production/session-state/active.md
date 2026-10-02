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
  - Đã triển khai `src/types/multiplayer.ts` & `src/logic/roomProtocol.ts`.
  - Bộ kiểm thử: 6/6 unit tests trong `tests/roomProtocol.test.mjs` PASS 100%.
- **TASK-103 [DONE]**: Triển khai Room Manager Server & WebSocket/Realtime Relay.
  - Đã triển khai `src/logic/roomManager.ts`:
    + Quản lý vòng đời phòng chơi (Tạo phòng, vào phòng bằng mã 6 ký tự, khôi phục sessionToken).
    + Tự động cân bằng và chia vai trò bí mật khi bắt đầu ván (Fischer-Yates shuffle).
    + Quản lý hành động đêm (Sói cắn, Tiên tri soi, Bảo vệ) và broadcast state qua Event Listeners.
  - Bộ kiểm thử: 5/5 unit tests mới trong `tests/roomManager.test.mjs` PASS 100%.
- **TASK-104 [READY]**: Xây dựng UI Online Lobby & Ghép Phòng (Room Join, Player List, Ready status).

---

## 2. Trạng Thái Backlog
- **Tổng số task**: 15 Task.
- **Đã hoàn thành (DONE)**: 11 Task (8 Task Sprint 1 + TASK-101 + TASK-102 + TASK-103).
- **Hàng đợi khả dụng (READY)**: 4 Task (TASK-104 đến TASK-107).
- **Task tiếp theo**: `TASK-104` (Xây dựng UI Online Lobby & Ghép Phòng).

---

## 3. Trạng Thái Kỹ Thuật (System Health)
- **Lint**: `oxlint` PASSED 100% (0 errors, 0 warnings).
- **Unit Test Suite**: 19/19 tests PASSED (8 gameEngine + 6 roomProtocol + 5 roomManager).
- **Production Build**: `npm run build` PASSED (Vite + TypeScript + PWA precache).
- **Autonomous Schedule Daemon**: Đang chạy nền đều đặn 24/7.

---

## 4. Hành Động Tiếp Theo Duy Nhất (Single Next Action)
- Tiến hành thực thi `TASK-104`: Tạo component UI Online Lobby (`src/components/OnlineLobby.tsx` và modal tạo/vào phòng) hỗ trợ sao chép mã phòng, hiển thị danh sách người chơi, trạng thái Ready, và nút Bắt đầu cho Host.
