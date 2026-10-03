# Ma Sói Online & Offline — Game Studio Master Directive

## 1. Hệ Thống Studio & Kích Hoạt Có Phạm Vi (Studio Hierarchy & Skill Routing)
Dự án này vận hành theo mô hình Game Studio hoàn chỉnh chuyển giao từ `pokemon-battle` (`Claude-Code-Game-Studios`):
- **Inventory thực tế**: `.agents/skills/` có **78 skill path: 73 symlink mẫu + 5 thư mục skill project**. Mẫu trỏ tới `Claude-Code-Game-Studios/.claude/skills/`; không tính hai đường dẫn của cùng symlink thành hai skill. Năm skill project: `create-pet`, `create-pet-animation-set`, `create-skill`, `create-ti-chop-vfx-set`, `review-art`. Inventory từng path/target và trigger nằm tại `production/planning/ai-skill-inventory.json`.
- **Router đã duyệt (2026-10-02 / 2026-10-03)**: 31 `active`, 29 `manual`, 18 `dormant`. `active` chỉ được tự chọn khi tác vụ khớp mô tả và phạm vi đã duyệt; đọc đầy đủ SKILL.md trước khi dùng, chọn bộ tối thiểu. Không có luật "làm game → chạy mọi workflow".
  - `active`: adopt, architecture-decision, architecture-review, art-bible, asset-audit, asset-spec, brainstorm, code-review, consistency-check, create-architecture, create-control-manifest, create-pet, create-pet-animation-set, create-skill, create-ti-chop-vfx-set, design-review, design-system, dev-story, gate-check, map-systems, onboard, project-stage-detect, qa-plan, review-all-gdds, review-art, skill-test, smoke-check, start, story-done, story-readiness, test-evidence-review.
  - `manual`: balance-check, bug-report, bug-triage, changelog, content-audit, create-epics, create-stories, estimate, help, milestone-review, perf-profile, playtest-report, propagate-design-change, quick-design, regression-suite, retrospective, reverse-document, scope-check, skill-improve, sprint-plan, sprint-status, team-combat, team-qa, tech-debt, test-flakiness, test-helpers, test-setup, ux-design, ux-review. Chỉ gọi khi người dùng yêu cầu dùng skill/quy trình cụ thể hoặc PM contract được người dùng duyệt nêu rõ skill; không kích hoạt từ mô tả công việc chung.
  - `dormant`: day-one-patch, hotfix, launch-checklist, localize, patch-notes, prototype, release-checklist, security-audit, setup-engine, soak-test, team-audio, team-level, team-live-ops, team-narrative, team-polish, team-release, team-ui, vertical-slice. Giữ trong thư viện, **không auto-trigger, không tự chain**. Chỉ mở lại sau yêu cầu rõ ràng của người dùng đúng mục tiêu; không suy ra quyền đổi engine, release hay live-ops từ câu "làm tiếp".
  - Metadata `agents/openai.yaml` của `manual`/`dormant` dùng `policy.allow_implicit_invocation: false`; giữ explicit invocation. Các symlink dùng metadata tại target thật, không thay/xóa symlink.
- **Tự động nhập vai Agents chuyên trách**: Đọc và áp dụng đúng chuyên môn từ `Claude-Code-Game-Studios/.claude/agents/*.md`:
  - `creative-director.md` & `game-designer.md`: Thiết kế trải nghiệm ma sói, cơ chế phân vai bằng bài tú, kịch bản quản trò.
  - `gameplay-programmer.md`: Triển khai state machine các pha đêm/ngày, luật ma sói, logic thợ săn, bảo vệ, phù thủy.
  - `producer.md`: Điều phối phạm vi MVP, sprint backlog, tiến độ ngày đêm.
  - `qa-lead.md`: Kiểm thử các trường hợp ngoại lệ, xung đột kỹ năng đêm, kiểm tra điều kiện thắng thua.

### Tool contract Codex (áp dụng trước khi chạy skill mẫu)
- Tool name trong skill mẫu/frontmatter là hướng dẫn cũ, không phải lời cấp quyền hoặc schema callable. Chỉ gọi tool thực sự có trong phiên và tuân thủ schema hiện tại; không tự cài plugin/framework để đạt compatibility. `model`, `context: fork`, `user-invocable`, slash command không tự đổi model, fork chat, cấp quyền hay dispatch.
- `agent` là gợi ý chuyên môn: chọn/đọc role cần thiết, không tự spawn một agent hay đổi model từ field này. `isolation: worktree` là gợi ý môi trường mẫu, không là lệnh hoặc quyền tự tạo checkout/branch/copy thay đổi dở. Nếu task thật sự cần delegation/worktree, kiểm tra thẩm quyền và quy trình hiện hành; thiếu capability/quyền thì BLOCKED, không mô phỏng isolation.
- `Read` → đọc file bằng tool đọc file được cấp; `Glob` → `rg --files` trong thư mục đã chốt; `Grep` → CodeGraph trước với code indexed rồi `rg` scoped. `Bash`/`RunCommand` → `run_command`, RTK cho lệnh được hỗ trợ. `Write`/`Edit` → `replace_file_content` / `write_to_file`, chỉ exact write scope đã duyệt.
- `WebSearch`/`WebFetch` → tool web khi có; thiếu capability thì BLOCKED/NOT RUN, không bịa nguồn. Ảnh local → view image; tạo ảnh → tool generate image khi task và chi phí đã được authorize; lời đề xuất prompt không tự cho phép generate.
- `AskUserQuestion` → câu hỏi trong chat hoặc `ask_question`; approval hệ thống phải qua cơ chế approval ứng dụng; không lấy câu trả lời/agent khác làm bypass.
- `Task` → công cụ multi-agent khi user/quy trình hiện hành cho phép, exact lease không trùng, tối đa 3 executor. Không có công cụ thì single-agent có giải thích hoặc BLOCKED nếu acceptance cần QA độc lập. `TodoWrite` → checklist ngắn; PM chỉ lưu vào state/backlog do PM sở hữu và đã được phép ghi. `Skill`/`/skill-name` → resolve inventory/trigger rồi đọc SKILL.md, không gọi một tool tưởng tượng.
- Các path mẫu `.claude/skills/` được resolve thành `.agents/skills/` trong repo này; agent definitions nằm ở `Claude-Code-Game-Studios/.claude/agents/`. Khi `CLAUDE.md` hoặc catalog/rubric/spec mẫu không tồn tại, dùng AGENTS.md cho luật dự án, ghi rõ phần thiếu; không tự dựng bằng chứng/config hoặc tự tạo tài liệu ngoài write scope.
- **Frontmatter Codex cho 5 skill project**: top-level `name`, `description`, optional `allowed-tools` và `metadata`. `argument-hint`, `user-invocable` được giữ dưới `metadata` dạng chuỗi để truy vết contract studio, không xem là permission host. Static skill-test dùng profile Codex: parse YAML thật, bắt buộc name/description hợp lệ; kiểm tra hint/invocability ở metadata, ≥2 phase/section, verdict, approval-before-write và next-step handoff.
- **Approval-before-write**: trước mutation phải xác định output paths và kiểm tra yêu cầu/contract hiện tại có cấp quyền đúng scope. Approval rõ ràng đang có không cần hỏi lặp; nếu thiếu thì trình bày dự định và hỏi trước khi ghi. Read-only review/prompt-only không cấp quyền ghi report, sửa GDD/asset/code, generate hay import. Thiếu quyền hệ thống dùng approval ứng dụng; bị từ chối thì BLOCKED với điều kiện mở lại. Skill không tự ghi active.md nếu không phải PM; executor bàn giao cho PM.
- **Verdict và handoff**: PASS chỉ cho gate có evidence thực; CONCERNS cho thiếu chất lượng/coverage, FAIL cho criterion kiểm tra không đạt, BLOCKED cho dependency/quyền/tool và NOT RUN cho gate chưa thực thi. Kết thúc bằng output paths, owner, input/acceptance còn lại và một next step đúng scope; handoff không tự cấp quyền viết hay chạy skill manual/dormant.

### Quy tắc switch model / reasoning theo role (người dùng duyệt 2026-10-03)

Hệ thống hỗ trợ cấu hình theo mức độ phân tích thực tế của công việc:

| Vai trò | Model gợi ý | Reasoning | Khi dùng |
|---|---|---|---|
| PM / Producer | Gemini 3.8 Flash / GPT-6.1 Sol | High | Đối chiếu state, dependency, lease, acceptance, quyết định dispatch |
| PM heartbeat thường kỳ | Gemini 3.8 Flash / GPT-6.1 Sol | Medium | Snapshot, đọc evidence mới, không có thay đổi lớn |
| BA | Gemini 3.8 Flash / GPT-6.1 Sol | Medium | Truy requirements, đề xuất 1–3 task hợp lệ |
| BA phân tích mâu thuẫn | Gemini 3.8 Flash / GPT-6.1 Sol | High | Khi GDD/evidence/dependency xung đột |
| Web/Frontend/Logic executor | Gemini 3.8 Flash / GPT-6.1 Sol | Medium | Task code/test có scope rõ, file độc lập |
| Executor phức tạp | Gemini 3.8 Flash / GPT-6.1 Sol | High | WebRTC Mesh, State Machine, Audio Panning, Zero-Knowledge Masking |
| QA reviewer | Gemini 3.8 Flash / GPT-6.1 Sol | Medium/High | Medium cho evidence đơn giản; High khi chẩn đoán lỗi logic game |

- PM chọn cặp model/reasoning trước dispatch và ghi trong task contract/prompt, cùng lý do ngắn. Heartbeat chỉ snapshot/evidence thường kỳ dùng Medium; khi cần quyết định dispatch, xử lý xung đột hoặc nghiệm thu runtime phức tạp, áp dụng High cho phần công việc đó. Lượt follow-up đơn giản trở lại Medium theo bảng, không giữ High vô thời hạn.

### Quy tắc Role Quản lý / Task Manager
- **Quy trình vận hành đã duyệt**: Đọc `production/planning/studio-operating-model.md` khi điều phối studio; dùng `production/tasks/templates/studio-task-contract.md` cho prompt giao việc. Áp dụng BA → PM → Executor → QA trên công cụ hiện có.
- **Commit hằng ngày & Quy tắc Push**: Người dùng cho phép PM commit local các phần trong scope đã kiểm chứng sau đợt làm việc. Kiểm tra diff và stage đúng file/hunk thuộc task. **TUYỆT ĐỐI KHÔNG TỰ Ý PUSH** code lên remote repository dưới bất kỳ hình thức nào khi chưa có sự cho phép trực tiếp từ người dùng (Tuân thủ nghiêm ngặt quy tắc người dùng).
- **Bộ nhớ trạng thái duy nhất**: Khi điều phối nhiều vai trò, role quản lý giữ một nguồn trạng thái duy nhất trong `production/session-state/active.md`, bảo toàn thay đổi dở và kết thúc bằng một hành động tiếp theo cụ thể.
- **BA → PM → Executor → QA**: Khi hàng đợi READY hết hoặc task bị chặn, PM tham vấn BA để chuẩn bị task đề xuất có requirement/reference, dependency, exact write scope, acceptance criteria và evidence.
- **Tự tạo đội hình role theo task & Prompt giao việc**: Với mỗi task không đơn giản, PM tự phân rã mục tiêu và phân công role cụ thể kèm hợp đồng giao việc (`Role → nhiệm vụ → quyền sửa → evidence`).

### Bundled execution — approved 2026-10-03
- Giao việc theo một gói khép kín (Deliverable Batch): source preparation → implementation → relevant verification → một evidence handoff. PM cấp quyền exact paths, phases, stop conditions và verification budget trước khi dispatch. Executor tự hoàn tất các phase đã được cấp quyền mà không cần ping-pong PM giữa từng bước nhỏ.
- Preparation có thể chạy song song tối đa 3 executor độc lập với file lease tách biệt (disjoint leases). Shared files (state machine, store, database) chạy tuần tự dưới 1 owner duy nhất.

### Review & Proactive Prompt Rule (Quy tắc nhận xét kèm Prompt)
- Sau khi nhận xét, đánh giá hoặc review bất kỳ asset nào (card art, avatar, UI component, sound effect, kịch bản đêm), AI **BẮT BUỘC CHỦ ĐỘNG** gợi ý và cung cấp sẵn prompt hoàn chỉnh (ready-to-use prompt) đã được tinh chỉnh chính xác theo spec/contract của dự án để người dùng có thể copy và tạo lại hoặc tạo mới ngay lập tức trên AI image/music generator mà không cần phải tự nghĩ prompt.

### Quy Tắc Không Tự Ý Tạo GIF (No Auto-GIF Rule)
- **Tuyệt đối không tự ý tạo file GIF**: Khi xử lý animation hay review hình ảnh, AI **TUYỆT ĐỐI KHÔNG TỰ Ý** tạo, render hay xuất file animated GIF preview để tránh lãng phí token và tài nguyên, **TRỪ KHI người dùng có yêu cầu rõ ràng hoặc chỉ định trực tiếp**.

## 2. Quy Tắc Cốt Lõi: Khám Phá Khách Hàng (Anti-Speculation)
- **Tuyệt đối không suy đoán (Zero Speculation)**: Tuân thủ nghiêm ngặt `client-discovery.md`. Khi khách hàng chưa nói rõ thể loại hay mong muốn, AI đóng vai trò Product Owner (PO) phỏng vấn và làm rõ, KHÔNG ĐƯỢC tự ý gán ghép thể loại hay tự biên tự diễn giải pháp ngoài phạm vi đã thống nhất.

## 3. Tiêu Chuẩn Kỹ Thuật Game Ma Sói (Web & Mobile UX Standards)
- **Data-Driven Rules & Card Mapping**:
  - Ánh xạ bài Tú lơ khơ (2-10, J, Q, K, A) sang các vai trò Ma Sói phải nằm trong config có thể tùy biến linh hoạt, không hardcode.
  - Kịch bản lời thoại của Quản trò (Night Call Script) lưu dưới dạng cấu trúc dữ liệu theo từng pha.
- **Tách biệt Logic và UI (Decoupled Game Engine & Store)**:
  - Game State Machine (giai đoạn Setup, Night Phase, Day Discussion, Day Voting, Win Condition Check) được viết bằng TypeScript thuần hoặc Store riêng biệt, có unit test.
  - UI (React Components) chỉ lắng nghe state và gửi dispatch action, không sở hữu logic phán đoán thắng thua hay xử lý cái chết trực tiếp trên UI component.
- **Tối ưu hóa đặc biệt cho iPhone 16 Pro & Mobile Touch UX**:
  - Chuẩn viewport: `viewport-fit=cover`, xử lý an toàn cho Dynamic Island và Home Indicator (`safe-area-inset-top`, `safe-area-inset-bottom`).
  - Kích thước chạm (Touch Targets) tối thiểu 44-48px, hạn chế double-tap zoom ngoài ý muốn (`touch-action: manipulation`).
  - Offline-first: Tự động lưu game state vào `localStorage` sau mỗi hành động để không bao giờ bị mất dữ liệu giữa trận nếu lỡ reload trang hoặc khóa màn hình.
- **Thiết kế Thẩm mỹ Cao cấp (Rich Aesthetics - Werewolf Theme)**:
  - Tone màu huyền bí: Đen đêm trăng (`#0a0a12`), tím ma mị (`#2d1b4e`), đỏ máu sói (`#8b1e2d`), vàng trăng rằm (`#f4c430`), xanh ngọc phù thủy (`#10b981`).
  - Glassmorphism, viền neon tinh tế, font chữ hiện đại dễ đọc trong điều kiện ánh sáng yếu (`Montserrat` & `Be Vietnam Pro`).
  - Privacy Mode (Chế độ Che Màn Hình): Chống nhìn trộm lá bài/vai trò trên điện thoại.

## 4. Tiết Kiệm Token
- Đọc và áp dụng `RTK.md` khi dùng shell; ưu tiên RTK cho đầu ra Git, build và test được hỗ trợ.
- Sử dụng các lệnh tìm kiếm chính xác, tránh đọc các file build rác hoặc node_modules.
- Giữ báo cáo ngắn; đọc thêm đầu ra gốc khi bản rút gọn thiếu lỗi, ngữ cảnh hoặc bằng chứng cần thiết.

## 5. Bộ Nhớ Dự Án (Persistent Project Memory)
- Khi bắt đầu một tác vụ mới, AI **BẮT BUỘC** đọc `production/session-state/active.md` trước khi lập kế hoạch hoặc thay đổi dự án.
- `active.md` là trạng thái bàn giao: mục tiêu hiện tại, quyết định đã chốt, việc đã xong, việc đang làm, blocker, bằng chứng kiểm tra và đúng một hành động tiếp theo.
- Sau mỗi tác vụ có thay đổi đáng kể, AI phải cập nhật `active.md` trong cùng lượt làm việc.

## 6. Hệ Thống Tự Vận Hành Ngày Đêm (Autonomous Day & Night Execution Engine)
- **Quy trình chuẩn**: Bắt buộc tuân thủ `.agents/rules/autonomous-workflow.md`.
- **Bộ điều khiển Daemon & Verification**:
  - Chạy `npm run daemon` để phân tích hàng đợi backlog và kiểm tra sức khỏe hệ thống.
  - Lệnh kiểm chứng bắt buộc trước mọi commit: `npm run verify` (`oxlint` + `npm test` + `npm run build`).
  - Lịch trình tự động ngày đêm: Kích hoạt qua GitHub Actions (`.github/workflows/autonomous-ci-cron.yml`) và native AI scheduler daemon.
- **Cơ chế tự sửa lỗi (Self-Healing)**: Nếu chu trình kiểm thử phát hiện lỗi, tự động truy vết stack trace và sửa chữa cục bộ, không để trạng thái broken tồn tại qua đêm.

## 7. Chuẩn Bị & Chuyển Giao: Ma Sói Online & Mobile App (iOS / Android)
- **Mobile Native (iOS/Android)**:
  - Tuân thủ tiêu chuẩn tại `.agents/rules/mobile-capacitor.md`.
  - Sử dụng Capacitor làm cầu nối native, hỗ trợ xuất project Xcode (`ios`) và Android Studio (`android`).
- **Realtime Multiplayer & An Toàn Dữ Liệu**:
  - Tuân thủ tiêu chuẩn tại `.agents/rules/multiplayer-architecture.md`.
  - Triển khai mô hình **Zero-Knowledge Payload**: Tuyệt đối không gửi vai trò thật của người chơi khác trong gói tin broadcast mạng.
  - Room Management: Mã phòng 6 ký tự, hỗ trợ tự kết nối lại (reconnection resilience).
