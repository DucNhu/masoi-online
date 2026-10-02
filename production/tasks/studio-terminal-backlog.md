# Studio Terminal Backlog — Ma Sói Execution Queue

## SPRINT 1: MVP Trợ Lý Quản Trò Offline (Deadline: 6h)

| Task ID | Tên Task | Role | Trạng thái | Dependency | Ghi chú |
|---|---|---|---|---|---|
| TASK-001 | Bê cấu trúc quy trình từ pokemon-battle, thiết lập studio models | PM / Architect | DONE | Không | AGENTS.md, RTK.md, .agents, production/ |
| TASK-002 | Khởi tạo dự án Vite + React + TypeScript + Vanilla CSS | Frontend Lead | READY | TASK-001 | Mobile-first iPhone 16 Pro, CSS design system |
| TASK-003 | Xây dựng Core Game Engine & State Machine (Tú lơ khơ mapping, Day/Night logic, Win conditions) | Game Logic / Engine Dev | READY | TASK-002 | Pure TypeScript engine, LocalStorage persistence, decoupled logic |
| TASK-004 | Xây dựng UI: Setup người chơi & Gán bài Tú Lơ Khơ, Bảng tra cứu vai trò | Frontend Dev | READY | TASK-003 | Quick card picker, Privacy shield toggle |
| TASK-005 | Xây dựng UI: Luồng điều phối Đêm (Night Phase Manager & Script) | Frontend Dev | READY | TASK-003 | Step-by-step caller, Bảo vệ, Sói, Phù thủy, Tiên tri |
| TASK-006 | Xây dựng UI: Luồng Ban Ngày (Resolution, Discussion Timer, Voting Ledger) | Frontend Dev | READY | TASK-003 | Audio/Visual timer, Vote recorder, Hanging execution |
| TASK-007 | Xây dựng UI: Kết quả Thắng Thua, Nhật Ký Ván Đấu & Chi Tiết Lượt Chơi | Frontend Dev | READY | TASK-003 | Match timeline, Win modal, New game reset |
| TASK-008 | Kiểm thử tổng thể QA & Tối ưu trên iPhone 16 Pro (PWA / Touch UX / Safe area) | QA Lead | READY | TASK-004..007 | Local IP check, Safari mobile verification |
