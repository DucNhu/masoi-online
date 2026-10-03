# Task Contract: TASK-502

## Identity
- Task ID / title: TASK-502: Xây dựng UI Sảnh Bàn Chơi (Table Lobby), Banner Khung Giờ Vàng & Modal Xác Thực Người Thật
- Product goal / approved scope reference: Giao diện trực quan cho người chơi chọn bàn vào ngay (1-click Join), theo dõi đợt mở cổng làng khung giờ vàng và xác thực người thật chống bot.
- Owner role / reason this role is needed: Frontend Lead Developer (Thao tác trên React components, touch UX di động, micro-animations và neon theme).
- Thread ID / status: READY
- Priority / player value: P0 (Trải nghiệm người dùng cốt lõi cho chế độ Join Table và Khung Giờ Vàng).

## Inputs and dependencies
- Canonical requirement / GDD / ADR / user decision: Yêu cầu của PO: Có thể join table, chống bot, quy tụ người chơi vào khung giờ nhất định trong ngày.
- Input files and relevant evidence/hash/version: `src/components/OnlineLobby.tsx`, `src/utils/goldenHours.ts`, `src/logic/roomManager.ts`.
- Dependencies and satisfied/unsatisfied evidence: TASK-501 (API listPublicTables và module goldenHours sẵn sàng).

## File lease and permissions
- Exact writable paths:
  - `src/components/OnlineLobby.tsx`
  - `src/components/GoldenHourBanner.tsx`
  - `src/components/HumanVerifyModal.tsx`
  - `src/index.css`
- Read-only paths / files owned by another task:
  - `src/logic/gameEngine.ts`
  - `src/types/*`
- Out of scope: Backend relay WebSocket, audio synthesizers.

## Deliverable and acceptance
- Implementable output:
  1. `GoldenHourBanner.tsx`:
     - Trạng thái Đang Mở: Badge phát sáng `🟢 CỔNG LÀNG ĐANG MỞ — 100% NGƯỜI THẬT`, slogan "Hội tụ thợ săn trực tuyến cùng lúc".
     - Trạng thái Đóng (Chờ phiên tiếp theo): Đồng hồ đếm ngược Live `⏳ Mở Cổng Sau: [HH:MM:SS]`, nút `🔔 Báo Danh Săn Sói (X người đã sẵn sàng)`.
  2. `HumanVerifyModal.tsx`:
     - Mini Anti-Bot Challenge chủ đề ma sói (chạm vào biểu tượng Mặt Trăng / Con Sói theo yêu cầu) để loại trừ script auto-clicker.
     - Sau khi vượt qua, lưu trạng thái xác thực trong session và tự động đưa vào bàn.
  3. Màn hình Sảnh Bàn Chơi (`TABLE_LOBBY`) trong `OnlineLobby.tsx`:
     - Danh sách thẻ Bàn Chơi (Table Cards): Tên bàn, Avatar Host, số ghế (`3/12`), trạng thái `Đang chờ người`, nút "Vào Bàn (Join Table)".
     - Nút "Tạo Bàn Mới" và nút "Nhập Mã Riêng".
     - Nút Làm mới danh sách bàn.
- Acceptance criteria:
  - Bấm vào bàn chơi -> Hiện xác thực người thật (nếu chưa xác thực) -> Vào phòng thành công.
  - Banner đếm ngược thời gian thực mỗi giây mà không lag UI.
  - Tương thích hoàn hảo trên màn hình cảm ứng di động iPhone 16 Pro (touch targets >= 44px).

## Verification and result
- Exact validation commands: `npm run verify`
- Expected evidence files/log/XML and required assertions/counts: Component render sạch, 0 lỗi TypeScript, 0 lỗi Lint.
