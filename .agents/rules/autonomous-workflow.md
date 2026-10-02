# Autonomous Day & Night Task Protocol — Quy Trình Tự Vận Hành Ngày Đêm

Tài liệu quy định cách thức AI Agent và hệ thống Automation vận hành độc lập, liên tục 24/7 để hoàn thành các task trong backlog mà không làm vỡ kiến trúc hoặc xung đột mã nguồn.

## 1. Vòng Lặp Vận Hành Khép Kín (Closed-Loop Execution)
Mỗi chu kỳ thực thi task ngày đêm bắt buộc tuân theo 6 bước chuẩn:
1. **Heartbeat & Queue Scan**:
   - Chạy `npm run daemon` để quét `production/tasks/studio-terminal-backlog.md`.
   - Lấy task ở trạng thái `READY` có thứ tự ưu tiên cao nhất mà không bị chặn bởi dependency.
2. **Context Activation**:
   - Đọc `production/session-state/active.md` để nắm bối cảnh và các quyết định kỹ thuật đã chốt.
   - Thiết lập Task Contract tương ứng theo mẫu `production/tasks/templates/studio-task-contract.md`.
3. **Thực thi (Implementation)**:
   - Viết code sạch, đúng phạm vi ghi (Write Scope) được cấp phép trong hợp đồng task.
   - Giữ nguyên tính toàn vẹn của các file hiện hữu, tránh sửa lan man ngoài phạm vi task.
4. **Tự Động Kiểm Chứng (Self-Verification Gate)**:
   - Chạy `npm run verify` (`oxlint` + `npm test` + `npm run build`).
   - Nếu có lỗi, kích hoạt chế độ **Self-Healing** (tự sửa lỗi theo stack trace). Tuyệt đối không commit code khi verify thất bại.
5. **Đồng Bộ Bộ Nhớ Dự Án**:
   - Đánh dấu task thành `DONE` trong `studio-terminal-backlog.md`.
   - Cập nhật mục tiêu, kết quả, và hành động kế tiếp vào `production/session-state/active.md`.
   - Ghi log vào `production/session-state/daemon-heartbeat.log`.
6. **Local Commit (Kỷ Luật Git)**:
   - Tạo commit cục bộ (Local Commit) với message chuẩn Conventional Commits (ví dụ: `feat(mobile): ...` hoặc `fix(engine): ...`).
   - **QUY TẮC BẤT DI BẤT DỊCH**: TUYỆT ĐỐI KHÔNG TỰ Ý CHẠY `git push` LÊN REMOTE KHI CHƯA ĐƯỢC NGƯỜI DÙNG PHÊ DUYỆT TRỰC TIẾP.

## 2. Cơ Chế Xử Lý Lỗi & Tự Phục Hồi (Fault Recovery & Rollback)
- **3-Strike Rule**: Nếu sau 3 lần sửa mà `npm run verify` vẫn không vượt qua:
  1. Hủy bỏ (revert) các thay đổi dang dở của task đó (`git checkout .`).
  2. Đánh dấu task thành `BLOCKED` trong backlog kèm lý do cụ thể.
  3. Ghi nhận sự cố vào `production/session-state/active.md` và chuyển sang task độc lập khác hoặc thông báo cho người dùng.

## 3. Tối Ưu Hóa Tài Nguyên & Tiết Kiệm Token (Resource Efficiency)
- Ưu tiên dùng script Node.js cục bộ (`scripts/studio-daemon.mjs`) thay vì gọi LLM cho các bước kiểm tra cú pháp và build.
- Sử dụng các lệnh tìm kiếm chính xác, không đọc file build rác hoặc thư mục `node_modules` / `dist`.
