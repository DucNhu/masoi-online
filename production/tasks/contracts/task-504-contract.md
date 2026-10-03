# Task Contract: TASK-504

## Identity
- Task ID / title: TASK-504: QA Test Suite Sprint 6 & Pipeline Verification
- Product goal / approved scope reference: Kiểm thử tự động tính đúng đắn của Public Tables, Golden Hours, Anti-Bot Human Gatekeeper và xác minh hệ thống trước khi đóng gói.
- Owner role / reason this role is needed: QA Lead Engineer (Kiểm thử độc lập, đảm bảo chất lượng, tính toán thời gian chính xác và không có hồi quy).
- Thread ID / status: READY
- Priority / player value: P0 (Chốt chặn chất lượng bắt buộc trước khi bàn giao cho PO).

## Inputs and dependencies
- Canonical requirement / GDD / ADR / user decision: Tiêu chuẩn kỹ thuật Game Ma Sói & Tiêu chuẩn QA Game Studio.
- Input files and relevant evidence/hash/version: Các file sau khi hoàn thành TASK-501..503.
- Dependencies and satisfied/unsatisfied evidence: Sau khi TASK-501, 502, 503 hoàn tất.

## File lease and permissions
- Exact writable paths:
  - `tests/sprint6AntiBotAndTableLobby.test.mjs`
  - `package.json` (nếu cần thêm script kiểm thử)
  - `production/qa/evidence/`
- Read-only paths / files owned by another task:
  - `src/` (nếu phát hiện bug, báo lại executor hoặc chỉ sửa cục bộ phục vụ test)
- Out of scope: Tạo branch mới hoặc chạy git push.

## Deliverable and acceptance
- Implementable output:
  1. `tests/sprint6AntiBotAndTableLobby.test.mjs`:
     - Test 1: Tạo phòng và kiểm tra hiển thị trong `listPublicTables()`.
     - Test 2: Bàn riêng tư (`isPrivate: true`) không xuất hiện trong public tables.
     - Test 3: Tính toán trạng thái Khung Giờ Vàng (Phiên Trưa, Tối, Đêm) và đếm ngược chính xác.
     - Test 4: Báo danh RSVP lưu trữ và gia tăng số lượng người thật.
     - Test 5: Xác thực Human Gatekeeper vượt qua khi chọn đúng mục tiêu, chặn khi chọn sai.
     - Test 6: Tham gia bàn (Join Table) tự động cập nhật số lượng ghế và trạng thái.
  2. Báo cáo kiểm chứng QA đầy đủ.
- Acceptance criteria:
  - 100% test cases trong bộ test mới PASS.
  - Chạy `npm run verify` (`oxlint` + `npm test` + `npm run build`) vượt qua không lỗi.
  - Đồng bộ mobile native `npm run mobile:sync` thành công.

## Verification and result
- Exact validation commands: `npm run verify && npm run mobile:sync`
- Expected evidence files/log/XML and required assertions/counts: 9/9 Test suites pass 100%.
