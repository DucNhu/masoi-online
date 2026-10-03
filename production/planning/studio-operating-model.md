# Studio Operating Model — BA / PM / Execution / QA (Ma Sói Game Studio)

Approved direction: 2026-10-03, Asia/Ho_Chi_Minh. Kế thừa và hợp nhất mô hình Game Studio hoàn chỉnh từ Pokemon Battle (`pokemon-combat`), tối ưu hóa toàn diện cho dự án Ma Sói (Web PWA, Mobile iOS/Android qua Capacitor, Realtime Server Relay và WebRTC P2P Mesh).

## Nguồn quy trình và phương pháp luận
- BMAD analysis → planning → solutioning → implementation/review.
- CrewAI hierarchical process: BA đề xuất → PM điều phối → Executor thực thi → QA kiểm thử độc lập.
- Token killer RTK instructions và persistent session state tại `production/session-state/active.md`.

## Định hướng sản phẩm & Thẩm quyền
- Ứng dụng Ma Sói All-in-One:
  - Trợ lý Quản trò Offline: Sử dụng bộ bài Tú lơ khơ (2-10, J, Q, K, A) để phân vai, dẫn dắt các pha Ngày/Đêm, bấm giờ tranh luận, tự động xử lý kỹ năng và thắng thua.
  - Ma Sói Online Multiplayer: Sảnh phòng chơi, Realtime Server Relay đa trình duyệt, WebRTC P2P Mesh cho nền tảng tĩnh GitHub Pages, Zero-Knowledge role masking chống soi bài.
  - Chế độ Solo Tập Luyện AI Bots: 6-8 Bots AI suy luận cục bộ, phán đoán mục tiêu và biện hộ biểu cảm.
  - Chế độ Khán Giả & Cổ Vũ Live, Âm thanh 3D Spatial Panning, Chủ đề VIP Arena, Bảng xếp hạng Elo.
- Tối ưu hóa đặc biệt trên iPhone 16 Pro & Mobile Touch UX (`safe-area-inset-top`, `touch-action: manipulation`).
- Tuân thủ nghiêm ngặt quy tắc Git Push: Tuyệt đối KHÔNG tự ý push code lên remote repository khi chưa có lệnh tường minh từ người dùng.

## Phân công trách nhiệm (RACI)
| Role | Trách nhiệm | Phạm vi ghi |
|---|---|---|
| Người dùng / Product Owner | Định hướng chiến lược, phê duyệt luật và tính năng, nghiệm thu | Quyết định PO |
| BA (Business Analyst) | Phân tích yêu cầu luật Ma Sói, kịch bản quản trò, tiêu chí nghiệm thu | `production/planning/ba-backlog.md` |
| PM / Producer | Quản lý sprint, điều phối task, kiểm soát lease, hợp nhất state | `production/session-state/active.md`, `production/tasks/studio-terminal-backlog.md` |
| Executor (Frontend/Game Logic) | Triển khai code React, TypeScript, Game Engine, WebRTC, PWA | `src/`, `public/`, config files |
| QA reviewer | Kiểm thử độc lập logic, test cases, xung đột kỹ năng đêm, verify build | `production/qa/evidence/`, test suites |

Tối đa 3 executor độc lập chạy song song với file lease không trùng lặp (`disjoint leases`). Một writer duy nhất cho Game State Machine và Store dùng chung.

## Hệ thống hồ sơ dự án (Single Source of Truth)
- `production/session-state/active.md`: Nguồn sự thật duy nhất về trạng thái hiện tại, quyết định đã chốt, việc đã xong, blocker, và đúng một hành động tiếp theo của PM.
- `production/tasks/studio-terminal-backlog.md`: Hàng đợi thực thi chi tiết của PM.
- `production/planning/ba-backlog.md`: Hàng đợi đề xuất tính năng và kịch bản từ BA.
- `production/planning/ai-skill-inventory.json`: Danh mục quản lý 78 AI skills (trigger: active, manual, dormant).
- `production/tasks/templates/studio-task-contract.md`: Khung hợp đồng giao việc chuẩn hóa.
- `production/qa/evidence/`: Bằng chứng kiểm thử, test results và báo cáo nghiệm thu.

Không tạo thêm bảng theo dõi phụ hay nguồn trạng thái cạnh tranh.

## Vòng đời trạng thái (State Transitions)
- **Đề xuất từ BA**: `PROPOSED_NEEDS_APPROVAL` → `WAITING_INPUT` → `WAITING_DEPENDENCY` → `CANDIDATE_READY` → `BLOCKED`.
- **Thực thi bởi PM**: `READY` → `DISPATCHED` → `IN_PROGRESS` → `REVIEW` → `DONE`. Bất kỳ bước nào cũng có thể chuyển `BLOCKED` hoặc `FAIL` kèm lý do cụ thể; `NOT RUN` ghi nhận cổng kiểm tra chưa chạy.
- `CANDIDATE_READY` chưa phải là `READY`. PM kiểm tra thẩm quyền, dependency, file lease và tiêu chí nghiệm thu trước khi đẩy vào queue thực thi.

## Phân bổ Lease và Giao việc (Dispatch & File Leases)
1. Đọc state/backlog hiện tại trước khi khởi tạo công việc.
2. Công bố `Role → nhiệm vụ → exact writable paths → required evidence`.
3. Ghi nhận Task ID, dependencies và file lease.
4. Không dispatch trùng lặp Task ID hoặc chồng chéo writer trên cùng file logic dùng chung. Reviewer chỉ có quyền read-only trên code của Executor.

## Thực thi theo gói khép kín (Bundled Execution — Approved 2026-10-03)
- Giao việc theo một gói trọn vẹn (Deliverable Batch): chuẩn bị nghiệp vụ → lập trình logic/UI → chạy kiểm thử xác minh liên quan → một biên bản bàn giao evidence.
- PM xác định rõ exact paths, phases, stop conditions và verification budget trước khi dispatch. Executor được phép hoàn thành các phase đã được cấp quyền mà không cần chờ đợi PM prompt giữa từng bước nhỏ.
- Gom các thay đổi liên quan vào một chu trình kiểm thử tinh gọn (`npm test` hoặc sub-suite tương ứng). Không retry mù quáng khi chưa sửa lỗi gốc.
- Tái sử dụng inventory hiện có và evidence đã được chấp thuận.

## Tiêu chí nghiệm thu & Biên bản bằng chứng (Evidence and Acceptance)
- Executor báo cáo danh sách file thay đổi, lệnh kiểm tra đã chạy, exit codes, kết quả test và các cổng chưa hoàn tất.
- Tiêu chí đánh giá độc lập:
  - `PASS`: Đạt chuẩn 100% kèm evidence xác thực.
  - `CONCERNS`: Đạt chức năng nhưng thiếu độ bao phủ hoặc cần lưu ý chất lượng.
  - `FAIL`: Không vượt qua test case hoặc logic bị lỗi.
  - `BLOCKED`: Thiếu quyền truy cập, thiếu input hoặc phụ thuộc task khác.
  - `NOT RUN`: Cổng kiểm tra chưa được kích hoạt.

## Tự động bổ sung công việc liên tục (Continuous Replenishment)
- Khi hàng đợi `READY` trống hoặc toàn bộ task bị chặn, PM tham vấn BA để nhận 1–3 task đề xuất có thể thực thi ngay.
- Mỗi lần chỉ có tối đa 1 yêu cầu gửi tới BA. BA phản hồi danh sách ứng viên cụ thể hoặc `NONE_VALID` kèm lý do/điều kiện mở lại.
- Tránh tạo các task nghiên cứu kéo dài không tạo ra deliverable thực tế. Khi không còn task nào được cấp quyền, PM dừng lại và báo cáo PO lựa chọn chiến lược ngắn gọn trong cùng lượt làm việc (`NEEDS_USER_DECISION`).

## Heartbeat và Báo cáo (Heartbeat & Reporting)
- Chạy kiểm tra định kỳ (10–15 phút hoặc khi có thay đổi). Kiểm tra tính toàn vẹn hệ thống (`oxlint` + `npm test` + `npm run build` + `verify-ai-skills`).
- Giữ yên lặng khi không có thay đổi (Quiet when unchanged) sau khi đã báo cáo checkpoint cần PO quyết định.
- Công thức báo cáo ngắn gọn: **Yêu cầu/quyết định thay đổi → Hành động/trạng thái thực tế → Đúng một hành động tiếp theo**.
