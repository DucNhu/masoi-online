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
  - Bộ kiểm thử: 5/5 unit tests trong `tests/roomManager.test.mjs` PASS 100%.
- **TASK-104 [DONE]**: Xây dựng UI Online Lobby & Ghép Phòng (`src/components/OnlineLobby.tsx`, chuyển đổi linh hoạt Offline/Online trên Header).
- **TASK-105 [DONE]**: Xây dựng Giao diện Người Chơi Online (`src/components/OnlinePlayerGameView.tsx`).
- **TASK-106 [DONE]**: Tối ưu hóa Native UX trên iOS (Dynamic Island, Haptics) & Android (Back button).
  - Đã triển khai `src/utils/nativeBridge.ts`:
    + Tích hợp `@capacitor/status-bar`: Theme tối `#08090f` đồng bộ giao diện ma sói.
    + Tích hợp `@capacitor/haptics`: Rung Taptic Engine chuyên biệt trên iPhone và Vibrator trên Android (haptic impact & haptic notification).
    + Nâng cấp `src/utils/soundEffects.ts` và khởi chạy tại `src/main.tsx`.
    + Đồng bộ hoàn tất `npm run mobile:sync` vào cả Xcode iOS và Gradle Android.
- **TASK-107 [READY]**: QA Multi-client E2E & Xử lý mất kết nối (Reconnection, Host Migration).

---

## 2. Trạng Thái Backlog
- **Tổng số task**: 15 Task.
- **Đã hoàn thành (DONE)**: 14 Task (8 Task Sprint 1 + TASK-101 đến TASK-106).
- **Hàng đợi khả dụng (READY)**: 1 Task duy nhất (**`TASK-107`** - QA E2E & Reconnection).
- **Task tiếp theo**: `TASK-107` (QA Lead: Viết kịch bản kiểm thử E2E đa client đồng thời giả lập 4-6 người chơi).

---

## 3. Trạng Thái Kỹ Thuật (System Health)
- **Lint**: `oxlint` PASSED 100% (0 errors, 0 warnings).
- **Unit Test Suite**: 19/19 tests PASSED.
- **Production Build**: `npm run build` PASSED (Vite + TypeScript + PWA precache).
- **Mobile Native Shell**: Đồng bộ thành công dist -> ios & android qua `npm run mobile:sync`.
- **Autonomous Schedule Daemon**: Tự động kích hoạt theo lịch trình.

---

## 4. Hành Động Tiếp Theo Duy Nhất (Single Next Action)
- Tiến hành thực thi `TASK-107`: Viết bộ kiểm thử `tests/multiplayerE2E.test.mjs` giả lập toàn bộ vòng đời ván đấu đa người chơi online (Host tạo phòng -> 4 người vào -> bắt đầu -> đêm -> rớt mạng nối lại -> sáng -> vote -> phân định thắng thua) và chạy kiểm chứng toàn diện.
