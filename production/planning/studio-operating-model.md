# Studio Operating Model — BA / PM / Execution / QA (Ma Sói Game Studio)

Approved direction: 2026-10-02, Asia/Ho_Chi_Minh. Quy trình Game Studio từ Pokemon Battle được chuyển giao sang Ma Sói (phiên bản chơi Offline bằng bộ bài Tú lơ khơ, tối ưu trên iPhone 16 Pro).

## Nguồn quy trình và phương pháp luận
- BMAD analysis → planning → solutioning → implementation/review.
- CrewAI hierarchical process: BA đề xuất → PM điều phối → Executor thực thi → QA kiểm thử độc lập.
- Token killer RTK instructions và persistent session state tại `production/session-state/active.md`.

## Định hướng sản phẩm & Thẩm quyền
- Mục tiêu cấp bách (Deadline 6 giờ): Ứng dụng trợ lý Quản trò Ma Sói Offline (chơi bằng bài Tú lơ khơ 2-10, J, Q, K, A) chạy mượt mà, trực quan trên iPhone 16 Pro (Mobile Web / PWA).
- Quản trò dùng app để: Thiết lập người chơi, ánh xạ lá bài Tú sang vai trò Ma Sói, theo dõi các pha Đêm / Ngày, ghi nhận hành động (Sói cắn, Tiên tri soi, Phù thủy cứu/giết, Bảo vệ), giải quyết kết quả tự động, bấm giờ tranh luận, kiểm tra thắng thua, lưu nhật ký ván đấu.
- Bảo toàn dữ liệu: Lưu trữ `localStorage` để không mất ván đấu khi tải lại trang trên điện thoại.
- Tuân thủ nghiêm ngặt quy tắc Git Push: Tuyệt đối KHÔNG tự ý push code lên remote repository khi chưa có lệnh rõ ràng từ người dùng.

## Phân công trách nhiệm (RACI)
| Role | Trách nhiệm | Phạm vi ghi |
|---|---|---|
| Người dùng / Product Owner | Định hướng chiến lược, quyết định luật chơi, nghiệm thu thực tế | Quyết định người dùng |
| BA (Business Analyst) | Phân tích yêu cầu luật Ma Sói & mapping bài Tú, tiêu chí nghiệm thu | `production/planning/ba-backlog.md` |
| PM / Producer | Quản lý tiến độ deadline 6h, điều phối task, hợp nhất state | `production/session-state/active.md`, backlog |
| Executor (Frontend/Game Logic) | Code web app Vite + React + TypeScript + Vanilla CSS | `src/`, `public/`, config files |
| QA Lead | Kiểm thử luồng game, test edge cases (bảo vệ 2 đêm liên tiếp, thợ săn, phù thủy, win condition) | `production/qa/evidence/` |

## Bộ nhớ dự án
- `production/session-state/active.md`: Nguồn sự thật duy nhất về trạng thái hiện tại, việc đã xong, blocker, và hành động tiếp theo.
- `production/tasks/studio-terminal-backlog.md`: Hàng đợi thực thi chi tiết.
- `production/planning/ba-backlog.md`: Đề xuất tính năng từ BA.
- `production/qa/evidence/`: Biên bản kiểm thử.
