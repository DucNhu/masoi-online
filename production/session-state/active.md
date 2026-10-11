# Active Session State — Ma Sói Game Studio

- **Thời gian cập nhật**: 2026-10-11 07:27 (Asia/Ho_Chi_Minh) — Sprint 24: Toàn Diện Hóa UI Mobile — Ghim Action Dock Nổi & Modal Ergonomics (Xóa Bỏ Cuộn Trang Để Bấm Nút).
- **Mục tiêu**: **Cập nhật toàn bộ UI cả source, loại bỏ tình trạng trên điện thoại phải cuộn xuống mới bấm được nút thao tác (Primary CTA) [COMPLETED]**.
- **Nguyên nhân cốt lõi đã chẩn đoán**:
  1. Các nút hành động chính (Primary CTA) trước đây nằm ở cuối luồng tài liệu dọc (`position: sticky` hoặc static flow ở cuối danh sách). Khi danh sách người chơi dài (8-12 người) hoặc nội dung modal cao, người dùng trên mobile (iOS Safari, Android Chrome) bắt buộc phải cuộn hết màn hình mới thấy và bấm được nút.
  2. Các modal dialog có nội dung vượt quá chiều cao viewport điện thoại nhưng không phân tách giữa vùng cuộn nội dung (`modal-scroll-body`) và thanh hành động đáy cố định (`modal-pinned-footer`).
  3. Thanh điều hướng đáy (Bottom Nav) trong chế độ Offline chiếm ~64px + safe-area-inset-bottom, dễ che khuất các phần tử ở đáy nếu không có lớp dock chuyên biệt và padding đệm.
- **Giải pháp & Kiến trúc triển khai**:
  1. **Hệ thống Dock Nổi Chuyên Dụng (`src/index.css`)**:
     - `.mobile-action-dock`: Glassmorphism cao cấp, viền neon tinh tế, bóng đổ sâu `box-shadow`, z-index 95.
     - `.mobile-action-dock-offline`: Ghim nổi ở `bottom: calc(var(--safe-bottom) + 68px)`, luôn nằm ngay trên thanh Bottom Nav và dưới ngón tay cái người dùng.
     - `.mobile-action-dock-fullscreen`: Ghim nổi ở `bottom: calc(var(--safe-bottom) + 12px)` cho chế độ Online và toàn màn hình.
     - `.has-dock-padding-offline` & `.has-dock-padding-fullscreen`: Đệm khoảng trống cuối trang (120px / 96px) chống che khuất nội dung khi cuộn.
     - Bộ 3 lớp Modal chuyên biệt cho Mobile: `.modal-fixed-shell` (khống chế `max-height: 90dvh`, chống tràn), `.modal-scroll-body` (cuộn mượt cảm ứng), `.modal-pinned-footer` (ghim nút cố định ở đáy modal).
  2. **Nâng cấp Toàn Bộ Màn Hình Offline (`src/components/`)**:
     - `SetupView.tsx`: Bước 1 (Ghim Dock tóm tắt số vai trò + nút "Xào & Chia Bài"), Bước 2 (Thu gọn preview bài, Ghim Dock tiến độ chia `${dealtCount}/${players.length}` + nút "Vào Đêm 1").
     - `NightPhaseView.tsx`: Ghim Dock tóm tắt mục tiêu đêm + nút "Tiếp Theo ➔" / "Gọi Sáng ☀️".
     - `DayDawnView.tsx`: Ghim Dock xử lý trả thù thợ săn + nút "Vào Thảo Luận ➔".
     - `DayDiscussionView.tsx`: Ghim Dock hiển thị đồng hồ đếm ngược live + nút "Bỏ Phiếu Treo Cổ ➔".
     - `DayVotingView.tsx`: Ghim Dock động hiển thị nghi phạm đang chọn + nút "Treo Cổ" / "Bỏ Qua & Vào Đêm".
  3. **Nâng cấp Sảnh & Bàn Đấu Online (`src/components/`)**:
     - `OnlineLobby.tsx`: Cả 3 giao diện Tạo Bàn, Vào Bàn và Phòng Chờ đều trang bị Dock nổi đáy ghim nút hành động ("Tạo Phòng", "Tham Gia", "Sẵn Sàng / Bắt Đầu") kèm nút phụ.
     - `OnlinePlayerGameView.tsx`: Đáy view đệm `calc(var(--safe-bottom) + 6px)` bảo vệ Dynamic Island / Home Indicator; Popup lá bài dùng `modal-fixed-shell` + `modal-pinned-footer`.
     - `SpectatorLiveView.tsx`: Khung chat và thanh cổ vũ đệm an toàn, các nút đạt chuẩn cảm ứng ≥44px.
  4. **Nâng cấp Toàn Bộ Modal Hộp Thoại (`src/components/`)**:
     - `SoloPracticeModal.tsx`: Tách nội dung và ghim cứng nút "VÀO TRẬN TẬP LUYỆN NGAY" ở đáy.
     - `RoleLookupModal.tsx`: Popup xem bài Tarot nghệ thuật dùng `modal-fixed-shell` + ghim nút "Đóng Xem Bài".
     - `GameOverModal.tsx`: Ghim cố định nút "Bắt Đầu Ván Mới".
     - `LeaderboardModal.tsx`, `HunterProfileModal.tsx`, `MatchHistoryModal.tsx`, `AvatarPickerModal.tsx`, `ReportPlayerModal.tsx`: Tất cả đều dùng modal shell cố định với nút thao tác/đóng ghim đáy vừa vặn tầm tay cái.
- **Nhánh làm việc**: `feature/ma-soi-online`.
- **Mô hình vận hành**: Game Studio Hierarchy (PO → PM → Gameplay Programmer → QA Lead).

---

## 1. Kết Quả Kiểm Thử Toàn Diện (System Health & Pipeline Verification)
- **Lint**: `oxlint` PASSED 100% (0 errors).
- **AI Skill Verification**: 78/78 skills PASSED 100%.
- **Unit & E2E Test Suite**: **20 Test Suites PASSED 100%** (77/77 test cases).
- **Production Build**: `tsc -b && vite build` PASSED (Bundle WebP tối ưu, PWA Service Worker sẵn sàng).
- **Git Push Policy**: Tuân thủ nghiêm ngặt quy tắc người dùng — Không tự ý chạy `git push` khi chưa có lệnh tường minh từ người dùng.

---

## 2. Hành Động Tiếp Theo Của PM (Single Next Action)
- Báo cáo kết quả nâng cấp toàn diện UI Mobile cho người dùng và chờ phản hồi / chỉ đạo tiếp theo.
