# Active Session State — Ma Sói Game Studio

- **Thời gian cập nhật**: 2026-10-03 18:00 (Asia/Ho_Chi_Minh) — Autonomous Heartbeat Iteration 34 Verified.
- **Mục tiêu**: **Sprint 15: WebRTC Peer-to-Peer Mesh Cho Nền Tảng Tĩnh Serverless (GitHub Pages Multiplayer) [COMPLETED]**.
- **Quyết định định hướng**: Triển khai giải pháp **Phương án 1 (WebRTC P2P Mesh qua PeerJS & Google STUN)** theo phê duyệt của PO:
  - Cho phép người chơi tạo và tham gia phòng chơi online trực tiếp máy-tới-máy (Peer-to-Peer DataChannel) khi ứng dụng được host trên các máy chủ tĩnh không có Node.js server 24/7 (như GitHub Pages `github.io`).
  - Zero-Knowledge Security: Host authority mã hóa / che giấu vai trò (mask) trước khi gửi qua WebRTC DataChannel, ngăn chặn đối thủ soi bài.
  - Hybrid Architecture: Chạy local dev server ưu tiên Server Relay (`/api/werewolf/rooms/*`), khi deploy GitHub Pages tự động fallback WebRTC P2P.
- **Nhánh làm việc**: `feature/ma-soi-online`.
- **Mô hình vận hành**: Game Studio Hierarchy (PO → PM → Executor Roles: System Architect / Game Engine Dev / QA Lead).

---

## 1. Kết Quả Triển Khai Sprint 15 (WebRTC P2P for GitHub Pages)
- **TASK-1401 [DONE]**:
  - `src/logic/webrtcPeerMesh.ts`:
    - `P2PRoomHost`: Tạo host node với Peer ID `masoi-v1-${roomId}`, bắt tay qua STUN servers của Google (`stun.l.google.com:19302`), xử lý `JOIN_REQUEST`, `CLIENT_ACTION`, phát sóng `STATE_UPDATE`.
    - `P2PRoomClient`: Client node kết nối trực tiếp DataChannel tới Host bằng mã phòng, chuyển tiếp các hành động `NIGHT_ACTION`, `VOTE`, `CHAT`, `CHEER`, `LEAVE`.
- **TASK-1402 [DONE]**:
  - `src/logic/roomManager.ts`:
    - Tích hợp `P2PRoomHost` tự động kích hoạt khi tạo phòng trên môi trường web.
    - Cập nhật các action methods (`toggleReady`, `startGame`, `submitNightAction`, `castVote`, `sendChatMessage`, `sendCheer`, `leaveRoom`, `leaveSpectator`) tự động chuyển tiếp qua P2P client khi phòng ở xa.
  - `src/components/OnlineLobby.tsx`:
    - `executeJoinRoom` & `handleJoinAsSpectator`: Tự động fallback sang WebRTC P2P DataChannel nếu phòng không có trên Server Relay (khi chơi qua link GitHub Pages).
- **TASK-1403 [DONE]**:
  - Zero-Knowledge State Masking: Khách P2P chỉ nhận được `ClientGameState` đã che giấu vai trò, hoàn toàn ngăn chặn hack soi vai trò đối thủ trong inspector/network tool.
- **TASK-1404 [DONE]**:
  - `tests/sprint15WebRTCPeerMesh.test.mjs`: 4/4 test cases PASSED 100%.
  - Toàn bộ **18 Test Suites PASS 100%**.
  - Pipeline verification: `npm run verify` (`oxlint` + `npm test` + `npm run build`) và `npm run mobile:sync` đều PASS 100%.

---

## 2. Trạng Thái Kỹ Thuật (System Health)
- **Lint**: `oxlint` PASSED 100% (0 errors, 0 warnings).
- **Unit & E2E Test Suite**: **18 Test Suites PASSED 100%** (69/69 test cases).
- **Production Build**: Tối ưu siêu nhẹ **609KB** (gồm cả WebRTC DataChannel engine), PWA offline cache sẵn sàng.
- **Mobile Native Shell**: Đồng bộ thành công dist -> ios & android qua `npm run mobile:sync`.
- **Quy tắc Git**: Tuyệt đối không tự ý push lên remote repository khi chưa có lệnh tường minh từ PO.

---

## 3. Hàng Đợi Sprint Tiếp Theo
- Đã hoàn tất 15 Sprints: Hệ thống Ma Sói Online, Trợ lý Quản trò Tú Lơ Khơ Offline, Sảnh Bàn Chơi Khung Giờ Vàng, Bảng Xếp Hạng Elo, Âm Thanh 3D Spatial Panning, Chế Độ Khán Giả, Chế Độ Solo AI, Chủ Đề VIP Arena, Realtime Server Relay Đa Trình Duyệt và WebRTC P2P Serverless Multiplayer cho GitHub Pages.

---

## 4. Hành Động Tiếp Theo Của PM (Single Next Action)
- Tạo local commit cho Sprint 15 (`feat(sprint-15): webrtc p2p serverless multiplayer for github pages`).
- Báo cáo cho PO cơ chế hoạt động trên GitHub Pages và sẵn sàng triển khai.
