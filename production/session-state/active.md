# Active Session State — Ma Sói Game Studio

- **Thời gian cập nhật**: 2026-10-02, Asia/Ho_Chi_Minh.
- **Mục tiêu hiện tại**: Chuyển giao sang SPRINT 2 (Ma Sói Online & Đóng gói Mobile iOS/Android qua Capacitor), thiết lập toàn diện hệ thống Schedule & Rule tự vận hành task ngày đêm.
- **Quy trình áp dụng**: Game Studio Hierarchy (BA → PM → Executor → QA) + Autonomous Day & Night Engine.

---

## 1. Hệ Thống Schedule Tự Vận Hành Ngày Đêm (ĐÃ THIẾT LẬP HOÀN CHỈNH)
1. **Studio Daemon CLI (`scripts/studio-daemon.mjs`)**:
   - Chạy kiểm tra định kỳ: `npm run daemon` hoặc `npm run daemon:watch`.
   - Tự động quét backlog `production/tasks/studio-terminal-backlog.md`, xác định task READY kế tiếp.
   - Chạy chuỗi tự động kiểm chứng: `npm run verify` (`oxlint` + `npm test` + `npm run build`).
   - Ghi log nhịp đập ngày đêm vào `production/session-state/daemon-heartbeat.log`.
2. **GitHub Actions Scheduled CI (`.github/workflows/autonomous-ci-cron.yml`)**:
   - Chạy tự động 4 lần/ngày đêm trên GitHub Actions runner (00:00, 06:00, 12:00, 18:00 UTC).
   - Tự động chạy verify và build bundle trên cloud.
3. **Agent Native Scheduler Daemon**:
   - Kích hoạt tiến trình ngầm chu kỳ 30 phút (`task-89`) thông qua công cụ `schedule` để đánh thức AI kiểm tra và xử lý backlog độc lập.

---

## 2. Hệ Thống Quy Tắc Chuyên Biệt Mới (Studio Rules)
1. **`.agents/rules/autonomous-workflow.md`**: Quy định chu trình khép kín 6 bước (Scan -> Contract -> Code -> Verify -> Memory Sync -> Local Commit) kèm quy tắc 3-strike self-healing.
2. **`.agents/rules/mobile-capacitor.md`**: Tiêu chuẩn Viewport Safe-area (Dynamic Island, Home Indicator), Touch Target 48px, Haptic Feedback, và pipeline đóng gói Native cho iOS & Android qua Capacitor.
3. **`.agents/rules/multiplayer-architecture.md`**: Tiêu chuẩn Server-Authoritative, **Zero-Knowledge Payload** (tuyệt đối không gửi lén thông tin vai trò người khác qua network tab), Room Code 6 ký tự, Reconnection resilience.
4. **`AGENTS.md`**: Cập nhật Mục 6 (Autonomous Day & Night Execution Engine) và Mục 7 (Mobile Capacitor & Online Multiplayer Standards).

---

## 3. Trạng Thái Backlog
- **SPRINT 1 (Trợ Lý Quản Trò Offline)**: 8/8 Task **DONE** (Đã deploy và live tại `https://ducnhu.github.io/masoi-online/`).
- **SPRINT 2 (Ma Sói Online & Mobile iOS/Android)**: 7 Task **READY** trong hàng đợi.
  - Task kế tiếp: `TASK-101`: Cấu hình Mobile Native Shell bằng Capacitor cho iOS & Android.

---

## 4. Trạng Thái Kỹ Thuật (System Health)
- **Lint**: `oxlint` PASSED 100% (0 errors, 0 warnings).
- **Game Engine Unit Tests**: 8/8 tests PASSED (`npm test`).
- **Production Build**: `npm run build` PASSED (Vite + TypeScript + PWA precache).
- **Capacitor Config**: Đã khởi tạo `capacitor.config.ts` với `appId: com.masoi.online`, tên app "Ma Sói".

---

## 5. Hành Động Tiếp Theo Duy Nhất (Single Next Action)
- Tạo local branch `feature/ma-soi-online` và tiến hành thực thi `TASK-101` (Cài đặt dependencies Capacitor Native & cấu hình Xcode/Android project structure).
