# Active Session State — Ma Sói Game Studio

- **Thời gian cập nhật**: 2026-10-03 13:30 (Asia/Ho_Chi_Minh) — Autonomous Heartbeat Iteration 23 Verified.
- **Mục tiêu**: Sprint 5 (Vai Trò Mở Rộng, Timer Tùy Chỉnh, 12 Avatar Ma Sói) đã hoàn tất và kiểm chứng 100%. Sẵn sàng tiếp nhận định hướng Sprint 6 hoặc đóng gói Native App.
- **Quyết định định hướng**: Nền tảng **React + TypeScript + Capacitor** (Thẻ bài / Bàn tròn / Avatar ma mị, siêu nhẹ, hỗ trợ cả Web + iOS + Android).
- **Nhánh làm việc**: `feature/ma-soi-online`.
- **Quy trình áp dụng**: Game Studio Hierarchy (BA → PM → Executor → QA) + Autonomous Day & Night Engine.

---

## 1. Kết Quả Triển Khai Sprint 5 (Expanded Rules & Customization)
- **TASK-401 [DONE]**: 
  - Thêm vai trò Thị Trưởng (`MAYOR`) vào hệ thống vai trò. Phiếu biểu quyết của Thị Trưởng tính gấp đôi (x2 weight).
  - Cơ chế Di chúc Thị Trưởng: Tự động chuyển giao huy hiệu quyền lực cho người sống sót kế tiếp nếu Thị Trưởng bị xử tử hoặc bị sói cắn chết.
  - Kẻ Ngốc (`IDIOT`): Cơ chế miễn tử khi bị vote treo cổ lần đầu, lật bài công khai và bị tước quyền bỏ phiếu ở các ngày tiếp theo.
  - Tùy chỉnh thời gian các pha: Thảo luận (30s..120s), Bỏ phiếu (15s..60s), Đêm (15s..40s).
- **TASK-402 [DONE]**:
  - `src/constants/avatars.ts`: Danh mục 12 Avatar Ma Sói huyền bí kèm câu khẩu hiệu và màu sắc aura glow.
  - `src/components/AvatarPickerModal.tsx`: Modal chọn avatar phong cách neon ma mị, tích hợp phản hồi rung Haptics Native.
- **TASK-403 [DONE]**:
  - UI Cài đặt phòng nâng cao (Advanced Host Settings) trong `OnlineLobby.tsx`.
  - Hiển thị badge `👑 Thị Trưởng (2 phiếu)` và `🃏 Kẻ Ngốc (Lật Bài)` trên danh sách người chơi và tòa án bỏ phiếu của `OnlinePlayerGameView.tsx`.
- **TASK-404 [DONE]**:
  - `tests/sprint5ExpandedRules.test.mjs`: Bộ kiểm thử tự động 6 test cases đạt chuẩn 100%.

---

## 2. Trạng Thái Kỹ Thuật (System Health)
- **Lint**: `oxlint` PASSED 100% (0 errors, 0 warnings trên 35 files).
- **Unit & E2E Test Suite**: **8 / 8 Test Suites PASSED 100%** (27/27 tasks đã hoàn thành).
- **Production Build**: Tối ưu siêu nhẹ **430KB** (Vite + TypeScript + PWA precache).
- **Mobile Native Shell**: Đồng bộ thành công dist -> ios & android qua `npm run mobile:sync`.

---

## 3. Hành Động Tiếp Theo Duy Nhất (Single Next Action)
- Tạo local commit cho Sprint 5 và báo cáo kết quả cho người dùng (Chờ lệnh trực tiếp nếu người dùng muốn git push).
