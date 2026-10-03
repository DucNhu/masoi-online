# Active Session State — Ma Sói Game Studio

- **Thời gian cập nhật**: 2026-10-03 16:18 (Asia/Ho_Chi_Minh) — Autonomous Execution Sprint 14 DONE.
- **Mục tiêu**: **Sprint 14: Realtime Server Relay & Cross-Browser Synchronization (Safari <-> Chrome <-> Incognito) [COMPLETED]**.
- **Quyết định định hướng**: Giải quyết triệt để vấn đề "phòng không tồn tại" khi người chơi mở trên hai trình duyệt khác nhau (Safari và Chrome ẩn danh) bằng kiến trúc Server Relay tập trung tích hợp trong Vite Dev/Preview Server kết hợp BroadcastChannel Mesh và Server-Sent Events (SSE).
- **Nhánh làm việc**: `feature/ma-soi-online`.
- **Mô hình vận hành**: Game Studio Hierarchy (PO → PM → Executor Roles: Backend Architect / Game Engine Dev / QA Lead).

---

## 1. Kết Quả Triển Khai Sprint 14 (Cross-Browser Realtime Sync)
- **TASK-1301 [DONE]**:
  - `src/server/roomServerPlugin.ts`: Vite Plugin `werewolfRoomServerPlugin` tích hợp trực tiếp vào Node.js dev server:
    - `GET /api/werewolf/rooms`: Danh sách bàn chơi tập trung liên trình duyệt.
    - `GET /api/werewolf/rooms/:roomId`: Trả về dữ liệu phòng cho các trình duyệt khác tìm thấy ngay.
    - `POST /api/werewolf/rooms/sync`: Đồng bộ dữ liệu phòng tức thời khi có người tạo bàn, vào bàn hoặc đổi state.
    - `GET /api/werewolf/rooms/events`: Server-Sent Events (SSE) đẩy cập nhật realtime tức thì tới Safari, Chrome, Tab ẩn danh.
  - `vite.config.ts`: Đăng ký `werewolfRoomServerPlugin()`.
- **TASK-1302 [DONE]**:
  - `src/logic/roomManager.ts`:
    - Tích hợp `BroadcastChannel('masoi_online_mesh')` cho các tab cùng trình duyệt.
    - `ensureRoomSynced(roomId)`: Tự động pull phòng từ Server Relay nếu tạo từ trình duyệt khác (Safari tìm thấy phòng `AHQB47` tạo từ Chrome ngay lập tức).
    - `syncPublicTablesFromRemote()`: Đồng bộ danh sách bàn chơi từ máy chủ mỗi 2.5s.
    - `connectSseForRoom(roomId)`: Lắng nghe luồng SSE để cập nhật state phòng không độ trễ.
  - `src/components/OnlineLobby.tsx`: `executeJoinRoom` và `handleJoinAsSpectator` chuyển sang async tự động sync trước khi join.
- **TASK-1303 [DONE]**:
  - `tests/sprint14CrossBrowserSync.test.mjs`: 3/3 test cases PASSED 100%.
  - Toàn bộ **17 / 17 Test Suites PASS 100%** (65/65 test cases).
  - Pipeline verification: `npm run verify` (`oxlint` + `npm test` + `npm run build`) và `npm run mobile:sync` đều PASS 100%.

---

## 2. Trạng Thái Kỹ Thuật (System Health)
- **Lint**: `oxlint` PASSED 100% (0 errors, 0 warnings).
- **Unit & E2E Test Suite**: **17 / 17 Test Suites PASSED 100%** (65/65 test cases).
- **Production Build**: Tối ưu siêu nhẹ **514KB**, PWA offline cache sẵn sàng.
- **Mobile Native Shell**: Đồng bộ thành công dist -> ios & android qua `npm run mobile:sync`.
- **Quy tắc Git**: Tuyệt đối không tự ý push lên remote repository khi chưa có lệnh tường minh từ PO.

---

## 3. Hàng Đợi Sprint Tiếp Theo
- Đã hoàn tất 14 Sprints: Hệ thống Ma Sói Online, Trợ lý Quản trò Tú Lơ Khơ Offline, Sảnh Bàn Chơi Khung Giờ Vàng, Bảng Xếp Hạng Elo, Âm Thanh 3D Spatial Panning, Chế Độ Khán Giả, Chế Độ Solo AI, Chủ Đề VIP Arena và Realtime Server Relay Đa Trình Duyệt.

---

## 4. Hành Động Tiếp Theo Của PM (Single Next Action)
- Tạo local commit cho Sprint 14 (`feat(sprint-14): realtime server relay and cross-browser synchronization`).
- Giải thích nguyên nhân kỹ thuật và hướng dẫn người dùng thử lại ngay trên Safari & Chrome ẩn danh.
