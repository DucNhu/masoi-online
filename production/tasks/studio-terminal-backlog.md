# Studio Terminal Backlog — Ma Sói Execution Queue

## SPRINT 1: MVP Trợ Lý Quản Trò Offline (ĐÃ HOÀN THÀNH & DEPLOYED)

| Task ID | Tên Task | Role | Trạng thái | Dependency | Ghi chú |
|---|---|---|---|---|---|
| TASK-001 | Bê cấu trúc quy trình từ pokemon-battle, thiết lập studio models | PM / Architect | DONE | Không | AGENTS.md, RTK.md, .agents, production/ |
| TASK-002 | Khởi tạo dự án Vite + React + TypeScript + Vanilla CSS | Frontend Lead | DONE | TASK-001 | Mobile-first iPhone 16 Pro, CSS design system |
| TASK-003 | Xây dựng Core Game Engine & State Machine (Tú lơ khơ mapping, Day/Night logic, Win conditions) | Game Logic / Engine Dev | DONE | TASK-002 | Pure TypeScript engine, LocalStorage persistence, decoupled logic |
| TASK-004 | Xây dựng UI: Setup người chơi & Gán bài Tú Lơ Khơ, Bảng tra cứu vai trò | Frontend Dev | DONE | TASK-003 | Quick card picker, Privacy shield toggle |
| TASK-005 | Xây dựng UI: Luồng điều phối Đêm (Night Phase Manager & Script) | Frontend Dev | DONE | TASK-003 | Step-by-step caller, Bảo vệ, Sói, Phù thủy, Tiên tri |
| TASK-006 | Xây dựng UI: Luồng Ban Ngày (Resolution, Discussion Timer, Voting Ledger) | Frontend Dev | DONE | TASK-003 | Audio/Visual timer, Vote recorder, Hanging execution |
| TASK-007 | Xây dựng UI: Kết quả Thắng Thua, Nhật Ký Ván Đấu & Chi Tiết Lượt Chơi | Frontend Dev | DONE | TASK-003 | Match timeline, Win modal, New game reset |
| TASK-008 | Kiểm thử tổng thể QA & Tối ưu trên iPhone 16 Pro (PWA / Touch UX / Safe area) | QA Lead | DONE | TASK-004..007 | Deployed GitHub Pages, PWA active, Vietnamese typography |

---

## SPRINT 2: Ma Sói Online & Mobile App (iOS / Android)

| Task ID | Tên Task | Role | Trạng thái | Dependency | Ghi chú |
|---|---|---|---|---|---|
| TASK-101 | Cấu hình Mobile Native Shell bằng Capacitor cho iOS & Android | Mobile Lead | READY | SPRINT 1 | `@capacitor/core`, `@capacitor/ios`, `@capacitor/android`, native safe-areas |
| TASK-102 | Thiết kế Protocol Realtime Multiplayer & State Synchronization (Zero-Knowledge) | System Architect | READY | SPRINT 1 | Room state schema, Zero role leak in client payloads, action dispatch |
| TASK-103 | Triển khai Room Manager Server & WebSocket/Realtime Relay | Backend Dev | READY | TASK-102 | Room code 6 ký tự, Host/Player handshake, Reconnection resilience |
| TASK-104 | Xây dựng UI Online Lobby & Ghép Phòng (Room Join, Player List, Ready status) | Frontend Dev | READY | TASK-103 | Hỗ trợ QR Code phòng, chia sẻ link mời bạn |
| TASK-105 | Xây dựng Giao diện Người Chơi Online (Private Role View, Action submit trong đêm) | Frontend Dev | READY | TASK-103 | Màn hình riêng cho từng client, đếm ngược hành động bí mật |
| TASK-106 | Tối ưu hóa Native UX trên iOS (Dynamic Island, Haptics) & Android (Back button) | Mobile UX Lead | READY | TASK-101, 105 | @capacitor/haptics, @capacitor/status-bar |
| TASK-107 | QA Multi-client E2E & Xử lý mất kết nối (Reconnection, Host Migration) | QA Lead | READY | TASK-104..106 | Kiểm thử đa thiết bị đồng thời |
