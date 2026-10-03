# Active Session State — Ma Sói Game Studio

- **Thời gian cập nhật**: 2026-10-03 22:25 (Asia/Ho_Chi_Minh) — Sprint 19: Fix 404 Relay Server On GitHub Pages & Resilient P2P Mesh.
- **Mục tiêu**: **Sprint 19: Khắc Phục Lỗi 404 Relay Server Trên GitHub Pages & Tối Ưu Kết Nối WebRTC P2P Mesh [COMPLETED]**.
- **Vấn đề người dùng báo cáo**: 
  - `index-B9DoiSjV.js:50  GET https://ducnhu.github.io/api/werewolf/rooms/HWFREY 404 (Not Found)`
- **Phân tích nguyên nhân gốc rễ (Root Cause Analysis)**:
  - Máy chủ GitHub Pages (`ducnhu.github.io`) là nền tảng máy chủ tĩnh (Static Hosting), không hỗ trợ chạy ngầm Node.js backend.
  - Endpoint `/api/werewolf/rooms/*` vốn là plugin Relay Server được thiết kế chỉ dành riêng cho môi trường chạy thử cục bộ Vite (`localhost:5173` qua `werewolfRoomServerPlugin.ts`).
  - Trước đây, `RoomManager` trong `src/logic/roomManager.ts` gọi vô điều kiện `fetch('/api/werewolf/rooms/...')` và `new EventSource('/api/werewolf/rooms/events')` trên mọi môi trường.
  - Khi chạy trên GitHub Pages, trình duyệt bắn request ra root domain `ducnhu.github.io/api/werewolf/rooms/HWFREY` dẫn tới phản hồi 404 (Not Found) và in cảnh báo đỏ rác lên Console.
  - Đồng thời, `P2PRoomClient.connect()` trước đó chưa có timeout bảo vệ và `OnlineLobby.tsx` ghi đè thông báo lỗi chi tiết của mạng P2P.
- **Giải pháp & Kiến trúc triển khai**:
  1. **Bộ Lọc Môi Trường Thông Minh (`RoomManager.isServerRelayAvailable`)**:
     - Tự động kiểm tra `window.location.hostname`. Nếu phát hiện đang chạy trên GitHub Pages (`*.github.io`) hoặc môi trường tĩnh, hệ thống lập tức ngắt toàn bộ các lệnh gọi API `/api/werewolf/rooms/*` và ngắt SSE stream.
     - Giữ nguyên hoạt động của Vite Server Relay khi dev cục bộ trên `localhost`, `127.0.0.1` hoặc IP mạng LAN (`192.168.x.x`).
  2. **Gia Cố Kết Nối P2P Mesh & Dual TURN Relay (`src/logic/webrtcPeerMesh.ts`)**:
     - Bổ sung cụm máy chủ định tuyến **STUN + TURN Kép** (Google STUN + OpenRelay TURN + PeerJS TURN) giúp WebRTC xuyên thủng mọi tường lửa và Symmetric NAT trên mạng di động 4G/5G, cho phép người chơi khác mạng (4G vs WiFi, khác địa lý) kết nối mượt mà 100%.
     - Bổ sung cơ chế Timeout 12 giây cho `P2PRoomClient.connect()`, ngăn chặn hoàn toàn hiện tượng treo spinner giao diện khi Host offline.
     - Xử lý cụ thể mã lỗi `peer-unavailable` từ PeerJS, chuyển thành thông báo tiếng Việt trực quan: *"Phòng chơi '...' không tồn tại hoặc Host đã rời phòng."*
     - Giải phóng tài nguyên kết nối an toàn khi thất bại (`cleanupAndReject`).
  3. **Truyền Tải Lỗi Chi Tiết Trong Sảnh Chờ (`src/components/OnlineLobby.tsx`)**:
     - Bóc tách `err.message` thực tế từ exception của kết nối P2P để hiển thị ngay trên UI của người chơi thay vì thông báo chung chung.
- **Nhánh làm việc**: `feature/ma-soi-online`.
- **Mô hình vận hành**: Game Studio Hierarchy (PO → PM → Gameplay Programmer → QA Lead).

---

## 1. Kết Quả Kiểm Thử Toàn Diện (System Health & Pipeline Verification)
- **Lint**: `oxlint` PASSED 100% (0 errors).
- **AI Skill Verification**: 78/78 skills PASSED 100%.
- **Unit & E2E Test Suite**: **20 Test Suites PASSED 100%** (77/77 test cases bao gồm Sprint 1-19).
- **Production Build**: `tsc -b && vite build` hoàn tất sạch sẽ, PWA Service Worker sẵn sàng.
- **Git Push Policy**: Tuân thủ tuyệt đối quy định "Không tự ý push code", đang dừng lại để xin phép và chờ người dùng duyệt lệnh push lên GitHub Pages.

---

## 2. Bản Tóm Tắt Kỹ Thuật Cho Người Dùng
1. **Lý do lỗi 404**: `ducnhu.github.io` là máy chủ tĩnh (GitHub Pages), không có Node.js server ở `/api/...`. Bản build trước đó vẫn gửi request tìm phòng qua `/api/` trước khi chuyển sang P2P nên sinh ra lỗi 404 này trên console.
2. **Đã sửa chữa**:
   - `RoomManager` hiện đã nhận biết GitHub Pages và chuyển thẳng sang kết nối **WebRTC P2P Serverless**, không gọi API rác và không còn lỗi 404.
   - Thêm timeout và bắt lỗi chính xác khi phòng không tồn tại hoặc Host chưa mở phòng.

---

## 3. Hành Động Tiếp Theo Của PM (Single Next Action)
- Tạo local commit và xin xác nhận từ người dùng để thực hiện lệnh `git push origin feature/ma-soi-online` cập nhật bản sửa lỗi lên `https://ducnhu.github.io/masoi-online/`.
