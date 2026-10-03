# Active Session State — Ma Sói Game Studio

- **Thời gian cập nhật**: 2026-10-03 09:07 (Asia/Ho_Chi_Minh) — Autonomous Heartbeat Iteration 12 Verified.
- **Mục tiêu**: Bổ sung hộp thoại xác nhận (Confirm Dialog / Modal) cho toàn bộ các nút Hủy, Reset, Xóa, Rời phòng/trận và Hành động sinh tử (treo cổ, bắn hạ, sang ngày).
- **Quyết định định hướng**: Nền tảng **React + TypeScript + Capacitor** (Thẻ bài / Bàn tròn / Avatar ma mị, siêu nhẹ, hỗ trợ cả Web + iOS + Android).
- **Nhánh làm việc**: `feature/ma-soi-online`.
- **Quy trình áp dụng**: Game Studio Hierarchy (BA → PM → Executor → QA) + Autonomous Day & Night Engine.

---

## 1. Hệ Thống Hộp Thoại Xác Nhận (Confirm Dialog System)
- **Thành phần cốt lõi**:
  - `src/components/ConfirmModal.tsx`: Component modal đồng bộ phong cách Ma Sói huyền bí (backdrop blur, glassmorphism viền neon, hỗ trợ variant `danger` | `warning` | `info`, rung phản hồi xúc giác Haptics Capacitor).
- **Các màn hình & Hành động được bảo vệ**:
  1. `Header.tsx`: Nút "Bắt Đầu Ván Mới" (Reset Game).
  2. `SetupView.tsx`: 
     - Nút Xóa từng người chơi (thùng rác).
     - Nút Xào Lại Bài khi đang xem bài bí mật.
     - Nút Nhập Nhanh ghi đè danh sách người chơi hiện có.
  3. `NightPhaseView.tsx`: Nút "Đánh Thức Cả Làng (Trời Sáng)" ở bước OUTRO.
  4. `DayDawnView.tsx`: Nút "Xác Nhận Bắn Chết" phát đạn trả thù của Thợ Săn.
  5. `DayDiscussionView.tsx`: Nút "Đặt Lại" (Reset timer thảo luận) khi đồng hồ đang chạy hoặc đã đếm.
  6. `DayVotingView.tsx`: 
     - Nút "Xác Nhận Treo Cổ [Tên]" (loại bỏ người chơi khỏi ván đấu).
     - Nút "Không Treo Cổ Ai (Bỏ Qua & Vào Đêm)".
  7. `GameOverModal.tsx`: Nút "Bắt Đầu Ván Mới" sau khi ván đấu kết thúc.
  8. `OnlineLobby.tsx`: Nút "Rời Phòng" (quay lại từ view ROOM hoặc icon LogOut ở phòng chờ).
  9. `OnlinePlayerGameView.tsx`: Nút "Rời Trận" khi đang tham gia trận đấu online dở dang.

---

## 2. Trạng Thái Kỹ Thuật (System Health)
- **Lint**: `oxlint` PASSED 100% (0 errors, 0 warnings trên 32 files).
- **Unit & E2E Test Suite**: **7 / 7 Test Suites PASSED 100%** (Game Engine, Room Protocol, Room Manager, QA Multi-Client E2E, Full Online Match, WebRTC Voice Signaling, Offline Flow & Thợ Săn).
- **Production Build**: Tối ưu siêu nhẹ **412KB** (Vite + TypeScript + PWA precache).
- **Mobile Native Shell**: Đồng bộ thành công dist -> ios & android qua `npm run mobile:sync`.

---

## 3. Hành Động Tiếp Theo Duy Nhất (Single Next Action)
- Commit local các thay đổi confirm modal và xin xác nhận người dùng trước khi thực hiện `git push`.
