# Ma Sói Online & Offline — Game Studio Master Directive

## 1. Hệ Thống Studio & Tự Động Kích Hoạt (Studio Hierarchy & Auto-Skills)
Dự án này vận hành theo mô hình Game Studio hoàn chỉnh được chuyển giao từ `pokemon-battle` (`Claude-Code-Game-Studios`):
- **Tự động áp dụng Skills**: Toàn bộ skills quy trình chuẩn nằm tại `.agents/skills/` (và `Claude-Code-Game-Studios/.claude/skills/`). Khi người dùng yêu cầu bất kỳ tác vụ nào liên quan đến làm game (khám phá ý tưởng, thiết kế game loop, viết GDD, code frontend logic, cân bằng luật chơi, review code, kiểm thử), AI **BẮT BUỘC TỰ ĐỘNG** đọc và tuân theo file `SKILL.md` tương ứng mà không cần người dùng phải nhắc tên skill:
  - Bắt đầu / Định hướng: `start`, `brainstorm`, `map-systems`
  - Thiết kế & Luật chơi: `design-system`, `balance-check`, `design-review`
  - Kỹ thuật & Web: `create-architecture`, `architecture-decision`, `dev-story`, `code-review`
  - QA & Testing: `qa-plan`, `smoke-check`, `test-setup`, `gate-check`
- **Tự động nhập vai Agents chuyên trách**: Đọc và áp dụng đúng chuyên môn từ `Claude-Code-Game-Studios/.claude/agents/*.md`:
  - `creative-director.md` & `game-designer.md`: Thiết kế trải nghiệm ma sói, cơ chế phân vai bằng bài tú, kịch bản quản trò.
  - `gameplay-programmer.md`: Triển khai state machine các pha đêm/ngày, luật ma sói, logic thợ săn, bảo vệ, phù thủy.
  - `producer.md`: Điều phối phạm vi MVP theo deadline khắt khe (6 tiếng), sprint backlog, tiến độ.
  - `qa-lead.md`: Kiểm thử các trường hợp ngoại lệ, xung đột kỹ năng đêm, kiểm tra điều kiện thắng thua.

### Quy tắc Role Quản lý / Task Manager
- **Quy trình vận hành đã duyệt**: Đọc `production/planning/studio-operating-model.md` khi điều phối studio; dùng `production/tasks/templates/studio-task-contract.md` cho prompt giao việc. Áp dụng BA → PM → Executor → QA trên công cụ hiện có.
- **Commit hằng ngày & Quy tắc Push**: Người dùng cho phép PM commit local các phần trong scope đã kiểm chứng sau đợt làm việc. Kiểm tra diff và stage đúng file/hunk thuộc task. **TUYỆT ĐỐI KHÔNG TỰ Ý PUSH** code lên remote repository dưới bất kỳ hình thức nào khi chưa có sự cho phép trực tiếp từ người dùng (Tuân thủ nghiêm ngặt quy tắc người dùng).
- **Bộ nhớ trạng thái duy nhất**: Khi điều phối nhiều vai trò, role quản lý giữ một nguồn trạng thái duy nhất trong `production/session-state/active.md`, bảo toàn thay đổi dở và kết thúc bằng một hành động tiếp theo cụ thể.
- **BA → PM → Executor → QA**: Khi hàng đợi READY hết hoặc task bị chặn, PM tham vấn BA để chuẩn bị task đề xuất có requirement/reference, dependency, exact write scope, acceptance criteria và evidence.
- **Tự tạo đội hình role theo task & Prompt giao việc**: Với mỗi task không đơn giản, PM tự phân rã mục tiêu và phân công role cụ thể kèm hợp đồng giao việc (`Role → nhiệm vụ → quyền sửa → evidence`).

## 2. Quy Tắc Cốt Lõi: Khám Phá Khách Hàng (Anti-Speculation)
- **Tuyệt đối không suy đoán (Zero Speculation)**: Tuân thủ nghiêm ngặt `client-discovery.md`. Khi khách hàng chưa nói rõ thể loại hay mong muốn, AI đóng vai trò Product Owner (PO) phỏng vấn và làm rõ, KHÔNG ĐƯỢC tự ý gán ghép thể loại hay tự biên tự diễn giải pháp ngoài phạm vi đã thống nhất.

## 3. Tiêu Chuẩn Kỹ Thuật Game Ma Sói (Web & Mobile UX Standards)
- **Data-Driven Rules & Card Mapping**:
  - Ánh xạ bài Tú lơ khơ (2-10, J, Q, K, A) sang các vai trò Ma Sói phải nằm trong config có thể tùy biến linh hoạt, không hardcode.
  - Kịch bản lời thoại của Quản trò (Night Call Script) lưu dưới dạng cấu trúc dữ liệu theo từng pha.
- **Tách biệt Logic và UI (Decoupled Game Engine & Store)**:
  - Game State Machine (giai đoạn Setup, Night Phase, Day Discussion, Day Voting, Win Condition Check) được viết bằng TypeScript thuần hoặc Store riêng biệt, có unit test.
  - UI (React Components) chỉ lắng nghe state và gửi dispatch action, không sở hữu logic phán đoán thắng thua hay xử lý cái chết trực tiếp trên UI component.
- **Tối ưu hóa đặc biệt cho iPhone 16 Pro (Mobile First / PWA)**:
  - Chuẩn viewport: `viewport-fit=cover`, xử lý an toàn cho Dynamic Island và Home Indicator (`safe-area-inset-top`, `safe-area-inset-bottom`).
  - Kích thước chạm (Touch Targets) tối thiểu 44-48px, hạn chế double-tap zoom ngoài ý muốn (`touch-action: manipulation`).
  - Offline-first: Tự động lưu game state vào `localStorage` sau mỗi hành động để không bao giờ bị mất dữ liệu giữa trận nếu lỡ reload trang hoặc khóa màn hình.
- **Thiết kế Thẩm mỹ Cao cấp (Rich Aesthetics - Werewolf Theme)**:
  - Tone màu huyền bí: Đen đêm trăng (`#0a0a12`), tím ma mị (`#2d1b4e`), đỏ máu sói (`#8b1e2d`), vàng trăng rằm (`#f4c430`), xanh ngọc phù thủy (`#10b981`).
  - Glassmorphism, viền neon tinh tế, font chữ hiện đại dễ đọc trong điều kiện ánh sáng yếu (buổi tối khi chơi offline).
  - Privacy Mode (Chế độ Che Màn Hình): Tính năng chống người chơi ngồi cạnh nhìn trộm lá bài/vai trò trên điện thoại Quản trò.

## 4. Tiết Kiệm Token
- Đọc và áp dụng `RTK.md` khi dùng shell; ưu tiên RTK cho đầu ra Git, build và test được hỗ trợ.
- Sử dụng các lệnh tìm kiếm chính xác, tránh đọc các file build rác hoặc node_modules.

## 5. Bộ Nhớ Dự Án (Persistent Project Memory)
- Khi bắt đầu một tác vụ mới, AI **BẮT BUỘC** đọc `production/session-state/active.md` trước khi lập kế hoạch hoặc thay đổi dự án.
- `active.md` là trạng thái bàn giao: mục tiêu hiện tại, quyết định đã chốt, việc đã xong, việc đang làm, blocker, bằng chứng kiểm tra và đúng một hành động tiếp theo.
- Sau mỗi tác vụ có thay đổi đáng kể, AI phải cập nhật `active.md` trong cùng lượt làm việc.
