# Active Session State — Ma Sói Game Studio

- **Thời gian cập nhật**: 2026-10-03 22:20 (Asia/Ho_Chi_Minh) — Sprint 18: Zero-Scroll Visual Arena UI Implementation Verified.
- **Mục tiêu**: **Sprint 18: Tối Ưu Giao Diện Thân Thiện, Responsive Không Cuộn (Zero-Scroll 100dvh), Giàu Hình Ảnh & Thẻ Bài Trực Quan [COMPLETED]**.
- **Yêu cầu người dùng giải quyết**: 
  - *"oke, giờ tôi cần giao diện trông thân thiện hơn, responsive hơn, đừng để user phải scroll, nhiều hình hơn là nhiều chữ"*
- **Giải pháp & Kiến trúc triển khai**:
  1. **Zero-Scroll Viewport Layout (`100dvh`)**:
     - Cố định toàn màn hình `height: 100dvh; max-height: 100dvh; overflow: hidden;` loại bỏ hoàn toàn tình trạng phải cuộn cả trang web (page scroll) trên mobile.
     - Header siêu gọn (48px) chứa: Nút Vai trò rút gọn (chạm mở Full Card Art Modal), Phase Pill trung tâm kèm đếm ngược giây, Nút Mic Voice với sóng âm, Quick Host Switch và Nút Nhật ký/Rời trận.
     - Action Dock cố định ở chân trang (62px): Luôn nằm vừa tầm ngón tay cái, tự động hiển thị nút hành động 1 chạm theo ngữ cảnh (Cắn đêm, Soi đêm, Bảo vệ đêm, Bỏ phiếu ngày, Phiếu trắng).
  2. **Bàn Đấu Trực Quan (Interactive Player Arena Grid)**:
     - Chuyển toàn bộ danh sách người chơi dọc cồng kềnh thành Lưới Card Bàn Tròn 2-4 cột tự động co giãn fit 100% màn hình.
     - Mỗi thẻ ghế ngồi có số ghế to `#1`, `#2`, avatar lớn (44px) biểu cảm sống động.
     - Sóng âm giọng nói động (`wave-bar-1`, `wave-bar-2`, `wave-bar-3`) nhảy múa màu xanh lá ngay dưới avatar khi đang phát biểu qua WebRTC Voice.
     - Hiệu ứng Neon viền phát sáng khi được chạm chọn mục tiêu (`wolf-target-selected` đỏ rực cho Sói, `neon-target-selected` xanh lam cho Soi/Vote).
     - Live Vote Tally: Huy hiệu số phiếu bầu `🗳️ 3` nổi bật góc phải thẻ người chơi.
     - Tương tác 1 chạm trực tiếp: Chạm trực tiếp vào card người chơi trên bàn để cắn/soi/bỏ phiếu, không cần kéo tìm danh sách riêng!
  3. **Responsive Dual-Mode**:
     - **Mobile (< 768px)**: Tab Switcher mỏng `[ 🐺 Bàn Đấu ]` & `[ 💬 Trò Chuyện (Unread Badge) ]`. Tích hợp **Floating Mini Chat Toast** tự nổi lên trong 3.5s trên Bàn Đấu khi có tin nhắn mới giúp người chơi theo dõi trò chuyện mà không cần rời bàn.
     - **Desktop (≥ 768px)**: Tự động kích hoạt Dual-Pane song song (Cột trái Bàn Đấu 60%, Cột phải Kênh Chat 40%) vừa vặn 100vh.
  4. **Thẻ Bài Thần Thoại (Trading Role Card Modal)**:
     - Chạm vào vai trò ở Header để mở Modal Thẻ Bài Holo Foil lấp lánh phong cách Tú Lơ Khơ (Rank A, K, Q, J, 10, 9...), linh vật to lớn, hiệu ứng ánh sáng Hologram và kỹ năng tóm tắt bằng bullet points trực quan, thay thế các đoạn văn bản dài dòng.
  5. **Animations & CSS (`src/index.css`)**:
     - Bổ sung `@keyframes voiceWave1/2/3`, `@keyframes neonSelectPulse`, `@keyframes wolfTargetPulse`, `@keyframes miniToastIn`, `@keyframes holoShimmer`.
- **Nhánh làm việc**: `feature/ma-soi-online`.
- **Mô hình vận hành**: Game Studio Hierarchy (PO → PM → Gameplay Programmer → QA Lead).

---

## 1. Kết Quả Kiểm Thử Toàn Diện (System Health & Pipeline Verification)
- **Lint**: `oxlint` PASSED 100% (0 errors).
- **AI Skill Verification**: 78/78 skills PASSED 100%.
- **Unit & E2E Test Suite**: **20 Test Suites PASSED 100%** (77/77 test cases bao gồm Sprint 1-18).
- **Production Build**: `tsc -b && vite build` hoàn tất sạch sẽ, PWA Service Worker sẵn sàng.
- **Git Push Policy**: Tuân thủ tuyệt đối quy định "Không tự ý push code", đang dừng lại để xin phép và chờ người dùng duyệt lệnh push lên GitHub Pages.

---

## 2. Hướng Dẫn Thử Nghiệm Giao Diện Mới
1. **Trên Điện Thoại**:
   - Giao diện vừa khít 1 màn hình `100dvh`, không còn hiện tượng vuốt cuộn trang gây mỏi tay.
   - Bàn đấu dạng lưới thẻ người chơi trực quan với số ghế, avatar lớn, trạng thái sống chết rõ ràng bằng icon.
   - Khi ai đó nói qua Mic, sóng âm dập dờn nhảy múa ngay dưới avatar.
   - Khi muốn cắn hoặc bỏ phiếu: Chạm thẳng vào thẻ của người đó trên bàn -> Bấm nút to ở Action Dock chân trang.
   - Chạm vào huy hiệu vai trò góc trái trên để chiêm ngưỡng Thẻ Bài Thần Thoại Holo foil cực đẹp.
2. **Trên Máy Tính**:
   - Tự động hiển thị song song 2 cột: Bàn đấu bên trái và Kênh Chat bên phải, thao tác mượt mà không cần chuyển tab.

---

## 3. Hành Động Tiếp Theo Của PM (Single Next Action)
- Tạo local commit và xin xác nhận từ người dùng để thực hiện lệnh `git push origin feature/ma-soi-online` cập nhật bản live mới lên `https://ducnhu.github.io/masoi-online/`.
