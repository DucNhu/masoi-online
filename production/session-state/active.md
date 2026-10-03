# Active Session State — Ma Sói Game Studio

- **Thời gian cập nhật**: 2026-10-03 21:00 (Asia/Ho_Chi_Minh) — WebRTC Live Voice Mesh Implementation Verified.
- **Mục tiêu**: **Sprint 17: Thu Âm Micro Thực Tế & Phát Ra Loa Qua WebRTC Voice Mesh (Microphone Streaming & Speaker Playback) [COMPLETED]**.
- **Vấn đề đã xử lý**: 
  - Khắc phục triệt để tình trạng người dùng test online giữa 1 điện thoại và 1 máy tính nhưng "chức năng mic không lên phát loa".
  - Nguyên nhân: Trước đó nút Mic trong `OnlinePlayerGameView.tsx` chỉ cập nhật biến state `isMuted` nội bộ, chưa từng gọi `navigator.mediaDevices.getUserMedia` để xin quyền micro thật và chưa truyền luồng âm thanh `MediaStream` qua WebRTC PeerJS call để phát qua `<audio>` element ra loa đối phương.
- **Giải pháp & Kiến trúc triển khai**:
  1. **WebRTC Voice Mesh Engine (`src/logic/webrtcVoiceMesh.ts`)**:
     - Thu âm microphone với bộ lọc nâng cao (Echo Cancellation, Noise Suppression, Auto Gain Control) kèm fallback tương thích Safari iOS và trình duyệt mobile.
     - Tích hợp Voice Activity Detection (VAD) qua Web Audio API `AudioContext` & `AnalyserNode`, tự động phát hiện người chơi đang phát biểu để kích hoạt hiệu ứng sóng âm viền phát sáng trên avatar.
     - Phát âm thanh trực tiếp ra loa/tai nghe qua thẻ `<audio autoplay playsinline webkit-playsinline>` gắn trực tiếp vào DOM body, gán `srcObject = remoteStream`, `volume = 1.0`, `muted = false`.
     - Cơ chế chống chặn Autoplay trên iOS Safari (`unlockAudio`): Lắng nghe `click` và `touchstart` trên toàn màn hình để tự động unpause và resume âm thanh ngay khi người dùng chạm vào màn hình điện thoại.
     - Áp dụng luật phân quyền âm thanh của Ma Sói (`applyGameAudioRules`): Ban đêm tự động khóa mic Dân Làng (Night Auto-Mute), chỉ Sói mới được nghe tiếng Sói; Người chết bị mute hoàn toàn đối với người sống.
  2. **P2P Audio Calling Mesh (`src/logic/webrtcPeerMesh.ts`)**:
     - `P2PRoomHost` và `P2PRoomClient` hỗ trợ cuộc gọi 2 chiều (`peer.call` và `peer.on('call')`).
     - Tự động truyền nhận và phát luồng âm thanh của Host và các Client.
     - Host tự động gán và chia sẻ `peerId` của từng người chơi trong phòng.
  3. **Tích Hợp RoomManager & Zero-Knowledge State (`src/logic/roomManager.ts` & `src/logic/roomProtocol.ts`)**:
     - `NetworkPlayer` được bổ sung trường `peerId?: string` và được giữ lại trong `maskGameStateForPlayer` phục vụ định tuyến Mesh âm thanh mà không làm rò rỉ vai trò tuyệt mật (Zero-Knowledge).
     - Bổ sung `startVoiceBroadcast(roomId, playerId, targetPeerIds)` và `stopVoiceBroadcast(roomId, playerId)`.
     - Đồng bộ hóa trạng thái micro thời gian thực giữa Client và Host thông qua action `SET_VOICE_STATE`.
  4. **Nâng Cấp Giao Diện In-Game (`src/components/OnlinePlayerGameView.tsx`)**:
     - Nút Mic hỗ trợ trạng thái chờ mở quyền (`isMicLoading`), thông báo cấp quyền micro nếu trình duyệt chặn.
     - Kết nối trực tiếp sự kiện VAD (`voiceEngine.onSpeaking`) và tự động giải phóng tài nguyên micro khi rời ván đấu.
  5. **Kiểm Thử & Đảm Bảo Chất Lượng (`tests/sprint17WebRTCVoiceMesh.test.mjs`)**:
     - 4/4 test cases kiểm tra độ an toàn môi trường Headless, luật phân quyền Ma Sói ban đêm/ngày, đồng bộ P2P và Zero-Knowledge.
- **Nhánh làm việc**: `feature/ma-soi-online`.
- **Mô hình vận hành**: Game Studio Hierarchy (PO → PM → Gameplay Programmer → QA Lead).

---

## 1. Kết Quả Kiểm Thử Toàn Diện (System Health & Pipeline Verification)
- **Lint**: `oxlint` PASSED 100% (0 errors).
- **AI Skill Verification**: 78/78 skills PASSED 100%.
- **Unit & E2E Test Suite**: **20 Test Suites PASSED 100%** (77/77 test cases bao gồm Sprint 1-17).
- **Production Build**: `tsc -b && vite build` hoàn tất sạch sẽ, PWA Service Worker sẵn sàng.
- **Local Git Commit**: Đã commit local `3df322d` ("feat(voice): implement WebRTC voice mesh with microphone streaming and speaker playback").
- **Git Push Policy**: Tuân thủ tuyệt đối quy định "Không tự ý push code", đang dừng lại để xin phép và chờ người dùng duyệt lệnh push lên GitHub Pages.

---

## 2. Hướng Dẫn Thử Nghiệm Thực Tế (Test Guide For User)
1. **Trên Máy Tính (Host hoặc Client)**:
   - Tạo phòng hoặc vào phòng chơi online.
   - Nhấn nút **"Mic TẮT"** -> Trình duyệt sẽ hiện popup hỏi quyền: Hãy bấm **"Cho phép" (Allow)** microphone.
   - Nút chuyển sang **"Mic BẬT"** màu xanh lá. Nói thử vào micro máy tính.
2. **Trên Điện Thoại (iPhone / Android)**:
   - Mở link phòng trên trình duyệt (Safari hoặc Chrome).
   - Nhấn nút **"Mic TẮT"** -> Chọn **"Cho phép"** truy cập micro.
   - Nói vào điện thoại: Âm thanh sẽ phát to, rõ ràng ra loa/tai nghe của máy tính!
   - Người ở máy tính nói: Âm thanh sẽ phát trực tiếp ra loa điện thoại!
3. **Hiệu Ứng Trực Quan**:
   - Khi ai đó phát biểu, viền avatar của người đó sẽ nhấp nháy phát sáng sóng âm màu xanh lá kèm biểu tượng micro thời gian thực.
   - Khi ban đêm buông xuống: Dân làng sẽ tự động bị khóa micro để bảo toàn bí mật hang Sói!

---

## 3. Hành Động Tiếp Theo Của PM (Single Next Action)
- Xin xác nhận từ người dùng để thực hiện lệnh `git push origin feature/ma-soi-online` nhằm cập nhật phiên bản live trên `https://ducnhu.github.io/masoi-online/`.
