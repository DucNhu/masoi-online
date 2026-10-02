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
- **TASK-104 [DONE]**: Xây dựng UI Online Lobby & Ghép Phòng.
  - Đã xây dựng `src/components/OnlineLobby.tsx`:
    + Màn hình chọn Tạo Phòng (nhận mã 6 số) hoặc Vào Phòng bằng mã.
    + Thẻ mã phòng to rõ, hỗ trợ sao chép 1 chạm.
    + Grid ghế ngồi danh sách người chơi (Avatar, Tên, Số ghế, Badge Host 👑, Trạng thái Sẵn Sàng / Chờ).
    + Nút Sẵn sàng cho người chơi & Nút Bắt đầu ván đấu cho Chủ phòng.
    + Tích hợp chuyển đổi chế độ linh hoạt Offline 📱 <-> Online 🌐 trực tiếp trên Header.
  - Đồng bộ assets hoàn tất sang Xcode iOS và Android Studio qua `npm run mobile:sync`.
- **TASK-105 [READY]**: Xây dựng Giao diện Người Chơi Online (Private Role View, Action submit trong đêm).

---

## 2. Trạng Thái Backlog
- **Tổng số task**: 15 Task.
- **Đã hoàn thành (DONE)**: 12 Task (8 Task Sprint 1 + TASK-101 + TASK-102 + TASK-103 + TASK-104).
- **Hàng đợi khả dụng (READY)**: 3 Task (TASK-105 đến TASK-107).
- **Task tiếp theo**: `TASK-105` (Xây dựng màn hình xem vai trò riêng và submit hành động đêm cho từng client online).

---

## 3. Trạng Thái Kỹ Thuật (System Health)
- **Lint**: `oxlint` PASSED 100% (0 errors, 0 warnings).
- **Unit Test Suite**: 19/19 tests PASSED.
- **Production Build**: `npm run build` PASSED (Vite + TypeScript + PWA precache).
- **Mobile Native Shell**: Đồng bộ thành công dist -> ios & android.
- **Autonomous Schedule Daemon**: Đang chạy nền đều đặn 24/7.

---

## 4. Hành Động Tiếp Theo Duy Nhất (Single Next Action)
- Tiến hành thực thi `TASK-105`: Xây dựng component `src/components/OnlinePlayerGameView.tsx` để người chơi xem vai trò mật của mình, xem đồng đội sói (nếu là sói), xem người yêu (nếu ghép đôi), và thực hiện các hành động ban đêm (chọn mục tiêu cắn/soi/cứu/bảo vệ) gửi lên RoomManager.
