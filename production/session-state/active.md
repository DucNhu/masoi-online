# Active Session State — Ma Sói Game Studio

- **Thời gian cập nhật**: 2026-11-11 23:20 (Asia/Ho_Chi_Minh) — Sprint 37, Sprint 38 & Sprint 39 [100% COMPLETE & VERIFIED].
- **Lưu ý vận hành**: Quota sub-agent model Flash đã hết. Toàn bộ code & test do Coordinator trực tiếp thực thi và kiểm chứng.

## Sprint 37 — Sửa điều khiển phím mũi tên 3D [DONE]
- Sửa công thức vector di chuyển theo hướng mắt nhìn camera `computeCameraRelativeMovement()`.
- Chặn cuộn trang (`preventDefault` cho Arrow keys + Space). Nhả phím khi `blur`.
- Test: `tests/sprint37ControlsAndScheduler.test.mjs` (7 test) PASS 100%.

## Sprint 38 — Account Gate 1 ô nhập & Supabase Cloud Integration [DONE & LIVE VERIFIED]
- Database: Supabase Project `masoi-online` (`qjoeeryaocljubdrvpdq`) đã chạy thành công `supabase/migrations/001_account_gate.sql`.
- Đã xác thực trực tiếp trên Cloud: Concurrency race condition, multi-device blocking, release session on leave, reload persistence qua sessionStorage.
- Test: `tests/sprint38AccountGate.test.mjs` (32 test) + E2E Chrome PASS 100%.

## Sprint 39 — Kết Bạn (Hunter Code), Hẹn Giờ Chơi & Thông Báo Service Worker [DONE & VERIFIED]
- **Mã Thợ Săn (Hunter Code)**: Sinh mã chuẩn `HS-XXXXXX` cho từng user; tìm kiếm, gửi lời mời, chấp nhận (quan hệ 2 chiều), từ chối và hủy bạn bè (`src/logic/friendService.ts`).
- **Hẹn Giờ Chơi ("Hẹn chơi sau mấy tiếng")**: Tạo lịch hẹn với bạn bè hoặc công khai, các preset nhanh `Sau 1h, 2h, 3h, 4h, 6h`, chọn lều bàn chơi (`src/logic/schedulerService.ts`).
- **Service Worker & Push Notifications (Nhắc trước 15 phút)**:
  - `public/sw-notifications.js` lắng nghe `notificationclick` (focus tab game / chuyển đến lều hẹn) và `push`.
  - `src/logic/notificationService.ts` quản lý quyền thông báo, âm thanh chuông báo, rung haptic và gửi notification chuẩn PWA.
  - Vòng lặp Daemon chạy ngầm mỗi 10s kiểm tra mốc `now >= scheduledAt - 15 * 60 * 1000` để bắn thông báo.
  - Có nút "Test 15p" trong modal để người dùng thử nghiệm thông báo trình duyệt ngay tức thì!
- **Giao diện Modal 3D**: `src/components/FriendsAndSchedulerModal.tsx` tích hợp nút `👥 Bạn Bè & Hẹn Giờ` ở cả thanh điều khiển trên và thanh Dock dưới của Đấu trường 3D Campfire.
- **Test**: `tests/sprint39FriendsAndScheduler.test.mjs` (13 test) PASS 100%. Toàn bộ 27 test suites trong dự án PASS.
- **Git & Deploy**: Commit `b727b18` pushed lên `feature/ma-soi-online` và `main`. GitHub Pages / Vercel tự động build.

## 1. Kiểm thử
- `npm run verify`: lint 0 error, 78/78 skills, 27 bộ test suites PASS, build PASS.

## 2. Hành Động Tiếp Theo (Single Next Action)
- Báo cáo người dùng vào trải nghiệm tính năng Kết Bạn & Hẹn Giờ Chơi (kèm nút Test Thông Báo 15p).
- Nếu người dùng muốn đồng bộ dữ liệu Bạn bè lên Supabase Cloud: chạy thêm `supabase/migrations/002_friends_and_scheduler.sql` (hiện tại đã có LocalStorage fallback hoạt động ngay tức thì).
