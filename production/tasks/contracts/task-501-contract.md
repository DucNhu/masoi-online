# Task Contract: TASK-501

## Identity
- Task ID / title: TASK-501: Schema PublicTableInfo, API listPublicTables(), joinTable() & Golden Hours Calculation Engine
- Product goal / approved scope reference: Hệ thống Bàn Chơi Trực Tiếp (Table Browser) và Cơ Chế Khung Giờ Vàng Chống Bot (Zero-Bot Golden Hours).
- Owner role / reason this role is needed: System Architect & Backend Developer (Định nghĩa kiểu dữ liệu an toàn, xử lý logic thời gian thực và quản lý phòng tập trung).
- Thread ID / status: READY
- Priority / player value: P0 (Nền tảng cho người chơi duyệt và tham gia bàn chơi trực tiếp thay vì nhập mã thủ công, đồng thời quy tụ người thật theo khung giờ vàng).

## Inputs and dependencies
- Canonical requirement / GDD / ADR / user decision: Yêu cầu của PO: "oke thêm chế độ khác đi, đổi tên tú lơ khơ đi, giờ sẽ là 1 game ma sói chơi thật, có thể join table. game ma sói chống bot, vì để chống bot nên game sẽ k có bot, mà quy tụ người chơi vào khoảng tgian, khung giờ nhất định trong ngày".
- Input files and relevant evidence/hash/version: `src/types/multiplayer.ts`, `src/logic/roomManager.ts`.
- Dependencies and satisfied/unsatisfied evidence: Sprint 5 đã hoàn thành (8/8 test suites pass).

## File lease and permissions
- Exact writable paths:
  - `src/types/multiplayer.ts`
  - `src/utils/goldenHours.ts`
  - `src/logic/roomManager.ts`
- Read-only paths / files owned by another task:
  - `src/components/*` (do Frontend đảm nhiệm)
  - `production/session-state/active.md` (chỉ PM cập nhật)
- Out of scope: UI components, CSS styles.

## Deliverable and acceptance
- Implementable output:
  1. `PublicTableInfo` interface trong `src/types/multiplayer.ts`:
     - `roomId: string`, `tableName: string`, `hostName: string`, `hostAvatar: string`, `currentPlayers: number`, `maxPlayers: number`, `phase: RoomPhase`, `isPrivate: boolean`, `enableMayor?: boolean`, `createdAt: number`.
  2. `src/utils/goldenHours.ts`:
     - Định nghĩa 3 phiên giờ vàng: Trưa (11:30 - 13:30), Tối Hoàng Kim (19:30 - 23:30), Đêm Trăng Máu (23:30 - 01:30).
     - Hàm `getGoldenHourStatus(now?: Date)` trả về: `isOpen`, `activeSession`, `nextSession`, `secondsRemaining`, `formattedCountdown`, `rsvpCount`.
     - Hàm `registerRSVP()` lưu trữ và tăng số người báo danh vào `localStorage`.
  3. `RoomManager.listPublicTables()`:
     - Trả về danh sách các bàn chơi mở (không private), ưu tiên bàn đang `LOBBY` và còn chỗ trống.
     - Tự động sinh `tableName` (ví dụ: "Bàn Săn Sói #[Mã]" hoặc tên do Host đặt).
- Acceptance criteria:
  - Gọi `listPublicTables()` trả về danh sách chính xác các bàn đang hoạt động.
  - Gọi `getGoldenHourStatus()` tính toán chính xác đếm ngược thời gian và trạng thái mở cổng làng.
  - Zero role leak: Không rò rỉ vai trò người chơi trong `PublicTableInfo`.

## Verification and result
- Exact validation commands: `npm run verify`
- Expected evidence files/log/XML and required assertions/counts: Unit test cho RoomManager và GoldenHours pass 100%.
