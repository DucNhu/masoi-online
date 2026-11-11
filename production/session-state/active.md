# Active Session State — Ma Sói Game Studio

- **Thời gian cập nhật**: 2026-11-11 22:00 (Asia/Ho_Chi_Minh) — Sprint 37 (điều khiển phím 3D) + Sprint 38 (Account Gate) [COMPLETED, chờ Supabase keys].
- **Lưu ý vận hành**: Quota sub-agent model Flash đã hết (reset sau ~57h tính từ 2026-11-11 21:26). Sprint 37/38 làm trực tiếp trên phiên chính.

## Sprint 37 — Sửa điều khiển phím mũi tên 3D [DONE]
- Nguyên nhân: công thức cũ đúng ở góc camera mặc định (90°) nhưng **đảo chiều Lên/Xuống & Trái/Phải khi xoay camera**; phím mũi tên làm trình duyệt cuộn trang; mất focus thì nhân vật chạy mãi.
- Sửa trong `src/components/arena3d/CampfireScene.ts`: `computeCameraRelativeMovement()` (static, có test), `SCROLL_KEYS` + `preventDefault`, nhả phím khi `blur`.
- Test: `tests/sprint37ControlsAndScheduler.test.mjs` (7 test, quét 36 góc camera).

## Sprint 38 — Account Gate 1 ô nhập [DONE ở client, server chờ cấu hình]
- Quyết định PO (2026-11-11): Supabase; **chặn máy thứ 2** khi tài khoản đang online; **chỉ tên tài khoản, không mật khẩu**.
- `supabase/migrations/001_account_gate.sql`: bảng `players` (RLS khóa, anon không đọc/ghi trực tiếp), RPC `enter_account` / `account_heartbeat` / `leave_account`, khóa dòng để 2 máy bấm cùng lúc chỉ 1 máy thắng. TTL phiên 45s, heartbeat 15s.
- `src/logic/accountService.ts`: validate (3–20 ký tự, chữ có dấu/số/_), `SupabaseAccountBackend` (REST RPC, không cần SDK), `LocalAccountBackend` (cùng luật, dùng khi chưa có keys), `AccountSession` (heartbeat, chống double-submit, mất mạng không văng, phát hiện bị chiếm phiên).
- `src/components/AccountGate.tsx` bọc `<App/>` trong `src/main.tsx`; tự vào lại khi reload (theo từng tab qua sessionStorage); nhả phiên khi đóng tab (`pagehide` + `keepalive`); nút "Thoát TK" trong Tủ Đồ 3D.
- Test: `tests/sprint38AccountGate.test.mjs` (32 test) + E2E Chrome 2 tab `scratch/e2e-account-gate.mjs` 14/14 PASS (phát hiện và sửa lỗi tab A reload bị nhảy sang tài khoản tab B).
- **SQL CHƯA chạy trên Postgres thật (NOT RUN)** — cần Supabase project.

## 1. Kiểm thử
- `npm run verify`: lint 0 error, 78/78 skills, toàn bộ test suites PASS (gồm sprint37 + sprint38), build PASS.

## 2. Hành Động Tiếp Theo (Single Next Action)
- Người dùng tạo Supabase project → chạy `supabase/migrations/001_account_gate.sql` trong SQL Editor → gửi `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` để PM cấu hình Vercel env + GitHub Pages secrets và chạy E2E trên server thật.
- Backlog đã thiết kế, chờ duyệt: Kết bạn + Hẹn giờ chơi + thông báo Service Worker trước 15 phút.
