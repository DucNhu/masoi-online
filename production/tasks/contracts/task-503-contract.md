# Task Contract: TASK-503

## Identity
- Task ID / title: TASK-503: Đổi tên nhận diện sang Game Ma Sói Thực Thụ, thay thế bài Tú Lơ Khơ bằng Thẻ Bài Ma Sói
- Product goal / approved scope reference: Loại bỏ hoàn toàn định vị phụ thuộc vào Tú lơ khơ, chuyển đổi sang Ma Sói Nguyên Bản với Thẻ Bài Ma Sói (Role Cards).
- Owner role / reason this role is needed: Creative Director & Frontend Developer (Thống nhất văn phong, mỹ thuật thẻ bài và ngôn ngữ giao diện).
- Thread ID / status: READY
- Priority / player value: P1 (Trải nghiệm nhận diện thương hiệu game ma sói chuyên nghiệp, không gây hiểu lầm là trò chơi bài tây).

## Inputs and dependencies
- Canonical requirement / GDD / ADR / user decision: Yêu cầu của PO: "đổi tên tú lơ khơ đi, giờ sẽ là 1 game ma sói chơi thật".
- Input files and relevant evidence/hash/version: `src/components/Header.tsx`, `src/App.tsx`, `src/components/RoleLookupModal.tsx`, `index.html`.
- Dependencies and satisfied/unsatisfied evidence: Sẵn sàng thực hiện song song với TASK-502.

## File lease and permissions
- Exact writable paths:
  - `src/components/Header.tsx`
  - `src/App.tsx`
  - `src/components/RoleLookupModal.tsx`
  - `src/components/SetupView.tsx`
- Read-only paths / files owned by another task:
  - `src/logic/*`
- Out of scope: State machine logic trong game engine.

## Deliverable and acceptance
- Implementable output:
  1. `Header.tsx`:
     - Tên app: `MA SÓI ONLINE` (ở cả chế độ Online lẫn Quản trò).
     - Subtitle: `SẢNH TRỰC TUYẾN 100% NGƯỜI THẬT` / `TRỢ LÝ QUẢN TRÒ TRỰC TIẾP`.
     - Icon nút tra cứu: Đổi tooltip thành "Sách Bí Thư Vai Trò Ma Sói".
  2. `App.tsx`:
     - Đổi tab "Bài Tú" -> "Vai Trò" (Hiển thị thẻ bài Ma Sói: hình ảnh biểu tượng, mô tả kỹ năng, phe phái thay vì quân bài 10, J, Q, K, A).
     - Tab "Người Chơi" hiển thị huy hiệu thẻ vai trò thay vì chỉ số bài tây.
  3. `RoleLookupModal.tsx`:
     - Đổi tên thành "Bí Kíp Các Vai Trò Ma Sói", tập trung mô tả chi tiết năng lực của từng nhân vật trong làng.
- Acceptance criteria:
  - Không còn từ ngữ "Tú lơ khơ" gây hiểu lầm trên giao diện chính.
  - Thẻ vai trò ma sói hiển thị đẹp mắt, phong cách dark fantasy huyền bí.

## Verification and result
- Exact validation commands: `npm run verify`
- Expected evidence files/log/XML and required assertions/counts: Không phá vỡ luồng chơi hiện tại, build pass.
