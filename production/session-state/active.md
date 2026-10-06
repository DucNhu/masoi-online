# Active Session State — Ma Sói Game Studio

- **Thời gian cập nhật**: 2026-10-04 22:55 (Asia/Ho_Chi_Minh) — Sprint 21: Full Visual Asset Organization & UI Integration Verified.
- **Mục tiêu**: **Sprint 21: Tổ Chức Kho Ảnh Đồ Họa Đầy Đủ & Tích Hợp Toàn Diện Giao Diện Game Ma Sói (Web & Mobile UX) [COMPLETED]**.
- **Giải pháp & Kiến trúc triển khai**:
  1. **Tổ chức thư mục tài nguyên (`assets/` & `src/assets/`)**:
     - Phân loại rõ ràng 20 ảnh AI-generated theo 3 danh mục chuẩn Game Studio:
       - `cards/`: 12 lá bài vai trò (werewolf, seer, witch, bodyguard, hunter, villager, cupid, minion, elder, idiot, cursed, mayor) + 1 mặt sau bài huyền bí (`card_back`).
       - `backgrounds/`: 5 hình nền không gian (night_phase, day_dawn, day_voting, win_village, win_werewolf).
       - `brand/`: 2 tài nguyên thương hiệu (hero_banner, app_icon).
     - Giữ nguyên ảnh gốc định dạng cao `.png` trong `assets/` (phục vụ backup/archive/in ấn).
     - Tối ưu nén chuyển đổi toàn bộ sang định dạng `.webp` trong `src/assets/` (giảm ~87% dung lượng từ 60MB xuống ~7.6MB) để game tải tức thì trên mobile 4G/5G.
  2. **Registry tập trung (`src/constants/assets.ts`)**:
     - Cung cấp `ROLE_CARD_IMAGES`, `CARD_BACK_IMAGE`, `PHASE_BACKGROUNDS`, `BRAND_ASSETS` type-safe, import trực tiếp vào bundle Vite.
  3. **Tích hợp sâu rộng vào toàn bộ màn hình Game**:
     - `Header.tsx`: Huy hiệu biểu tượng sói trăng ma mị sắc nét thay cho icon chữ đơn sơ.
     - `OnlineLobby.tsx`: Hero Showcase Banner đậm chất điện ảnh, card back và logo game.
     - `OnlinePlayerGameView.tsx`: Hình nền pha động theo thời gian thực (Đêm/Bình Minh/Biểu Quyết), card thumbnail góc phải kèm Modal lật bài Tarot bí mật (có Privacy Shield che giấu vai trò chống nhìn trộm).
     - `RoleLookupModal.tsx`: Tra cứu 12 vai trò với ảnh bài Tarot, hỗ trợ chế độ xem chi tiết phóng to và lật mặt sau (`card_back`).
     - `SetupView.tsx`: Thẻ bài Tarot lật mở từng người chơi khi chia bài hoặc phát bài offline, tích hợp Privacy Shield.
     - `NightPhaseView.tsx`: Hình nền đêm trăng máu + ảnh minh họa lá bài của từng vai trò khi quản trò gọi thức giấc ban đêm.
     - `DayDawnView.tsx`: Banner bình minh ma mị + chân dung bài Tarot cho các nạn nhân bị hạ gục đêm qua.
     - `DayVotingView.tsx`: Hình nền pháp trường treo cổ + khung xác nhận treo cổ có ảnh Tarot vai trò.
     - `DayDiscussionView.tsx`: Banner không gian tranh luận căng thẳng làng ma sói.
     - `GameOverModal.tsx`: Banner chiến thắng theo phe (Phe Dân / Phe Sói) + danh sách hé lộ toàn bộ bài Tarot người chơi.
     - `SoloPracticeModal.tsx`: Thẻ bài Tarot trực quan cho các vai trò khi chọn luyện tập với AI Bots.
     - `HunterProfileModal.tsx`: Thẻ Rank Thợ Săn bọc nền Hero Banner sang trọng.
- **Nhánh làm việc**: `feature/ma-soi-online`.
- **Mô hình vận hành**: Game Studio Hierarchy (PO → PM → Gameplay Programmer → QA Lead).

---

## 1. Kết Quả Kiểm Thử Toàn Diện (System Health & Pipeline Verification)
- **Lint**: `oxlint` PASSED 100% (0 errors).
- **AI Skill Verification**: 78/78 skills PASSED 100%.
- **Unit & E2E Test Suite**: **20 Test Suites PASSED 100%** (77/77 test cases).
- **Production Build**: `tsc -b && vite build` PASSED (Bundle WebP tối ưu, PWA Service Worker sẵn sàng).
- **Chrome Automation & E2E Live Testing**:
  - Đã chạy kiểm thử tự động với Google Chrome (CDP protocol) trên cả **Desktop** (1280x900) và **Mobile iPhone 16 Pro** (393x852, DPR 3.0, Touch emulation).
  - Kiểm tra trang Live: `https://ducnhu.github.io/masoi-online/` tải tức thì, chuyển sảnh Online, mở modal và kết nối mượt mà.
  - Sửa lỗi chuyển view: bổ sung `setActiveView('ROOM')` trong `handleStartSoloPractice` tại `OnlineLobby.tsx` để người chơi chuyển cảnh tức thì vào Đấu trường Game Arena.
  - Đã lưu trữ bằng chứng ảnh chụp màn hình Chrome tại `scratch/chrome-screenshots/`.
- **Git Push Policy**: Tuân thủ tuyệt đối quy tắc "Không tự ý push code", đang dừng lại để xin phép và chờ người dùng duyệt lệnh push lên GitHub remote.

---

## 2. Hành Động Tiếp Theo Của PM (Single Next Action)
- Báo cáo kết quả kiểm thử Chrome chi tiết và hình ảnh chụp thực tế cho người dùng; commit local bản sửa lỗi `OnlineLobby.tsx` và xin lệnh xác nhận tường minh để thực hiện `git push origin feature/ma-soi-online`.

