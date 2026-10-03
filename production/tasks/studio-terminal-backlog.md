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

## SPRINT 2: Ma Sói Online & Mobile App (iOS / Android) — ĐÃ HOÀN THÀNH

| Task ID | Tên Task | Role | Trạng thái | Dependency | Ghi chú |
|---|---|---|---|---|---|
| TASK-101 | Cấu hình Mobile Native Shell bằng Capacitor cho iOS & Android | Mobile Lead | DONE | SPRINT 1 | `@capacitor/core`, `@capacitor/ios`, `@capacitor/android`, native safe-areas |
| TASK-102 | Thiết kế Protocol Realtime Multiplayer & State Synchronization (Zero-Knowledge) | System Architect | DONE | SPRINT 1 | Room state schema, Zero role leak in client payloads, action dispatch |
| TASK-103 | Triển khai Room Manager Server & WebSocket/Realtime Relay | Backend Dev | DONE | TASK-102 | Room code 6 ký tự, Host/Player handshake, Reconnection resilience |
| TASK-104 | Xây dựng UI Online Lobby & Ghép Phòng (Room Join, Player List, Ready status) | Frontend Dev | DONE | TASK-103 | Hỗ trợ QR Code phòng, chia sẻ link mời bạn |
| TASK-105 | Xây dựng Giao diện Người Chơi Online (Private Role View, Action submit trong đêm) | Frontend Dev | DONE | TASK-103 | Màn hình riêng cho từng client, đếm ngược hành động bí mật |
| TASK-106 | Tối ưu hóa Native UX trên iOS (Dynamic Island, Haptics) & Android (Back button) | Mobile UX Lead | DONE | TASK-101, 105 | @capacitor/haptics, @capacitor/status-bar |
| TASK-107 | QA Multi-client E2E & Xử lý mất kết nối (Reconnection, Host Migration) | QA Lead | DONE | TASK-104..106 | Kiểm thử đa thiết bị đồng thời |

---

## SPRINT 3: Chu Trình Ván Đấu Trực Tuyến Tự Động & Live Voting (Full Match Online)

| Task ID | Tên Task | Role | Trạng thái | Dependency | Ghi chú |
|---|---|---|---|---|---|
| TASK-201 | Triển khai Full Day-Night Automated State Machine trong RoomManager | Game Engine Dev | DONE | SPRINT 2 | Tự động resolve đêm, thợ săn, già làng, bán sói, chuyển Ngày & kiểm tra thắng thua |
| TASK-202 | Xây dựng UI Day Voting trực tuyến & Tally thời gian thực | Frontend Dev | DONE | TASK-201 | Bỏ phiếu trực tiếp, đếm phiếu công khai, animation xử tử hoặc Kẻ Ngốc lật bài |
| TASK-203 | Triển khai Chat Stream thời gian thực phân quyền (Làng, Sói đêm, Người chết) | Backend/Frontend | DONE | TASK-201 | Bảo mật kênh Sói chỉ Sói đọc được, người chết không spoil cho người sống |
| TASK-204 | QA Test Suite trọn vẹn 1 ván đấu Online từ Đêm 1 đến Game Over | QA Lead | DONE | TASK-201..203 | Đảm bảo tính toán thắng thua chuẩn xác tuyệt đối |

---

## SPRINT 4: WebRTC Voice Chat Trực Tuyến & Âm Thanh Không Gian (Spatial Audio Immersion) — ĐÃ HOÀN THÀNH

| Task ID | Tên Task | Role | Trạng thái | Dependency | Ghi chú |
|---|---|---|---|---|---|
| TASK-301 | Thiết kế WebRTC Voice Signaling Relay & Audio Permissions trong RoomManager | Backend / System Architect | DONE | SPRINT 3 | SDP/ICE relay, cơ chế Night Auto-Mute làng ngủ, kênh Voice Hang Sói |
| TASK-302 | Xây dựng UI Voice Indicator & Bộ Điều Khiển Mic (Mute/Unmute, Speaking Waves) | Frontend Dev | DONE | TASK-301 | Hiệu ứng sóng âm khi người chơi phát biểu, icon mic nhấp nháy theo nhịp |
| TASK-303 | Nâng cấp Hệ thống Âm thanh Không Gian & Sound FX Ma Mị (Sói hú, Gà gáy, Tòa án) | Audio/Frontend Lead | DONE | TASK-301 | Web Audio API synthesizer/procedural sound, không phụ thuộc file ngoài nặng |
| TASK-304 | QA Test Suite kiểm thử tích hợp Voice Signaling & Audio Permissions | QA Lead | DONE | TASK-301..303 | Đảm bảo không rò rỉ âm thanh ban đêm và an toàn tín hiệu P2P |

---

## SPRINT 5: Vai Trò Mở Rộng (Thị Trưởng, Kẻ Ngốc), Tùy Chỉnh Timer Ngày/Đêm & Bộ Sưu Tập Avatar Ma Sói — ĐÃ HOÀN THÀNH

| Task ID | Tên Task | Role | Trạng thái | Dependency | Ghi chú |
|---|---|---|---|---|---|
| TASK-401 | Cập nhật Game Engine & Room Protocol: Vai trò Thị Trưởng (2 phiếu vote, di chúc), Kẻ Ngốc lật bài thoát chết & Cấu hình Timer | Game Engine / Architect | DONE | SPRINT 4 | Mayor x2 vote weight, Idiot reveal immunity, custom phase durations |
| TASK-402 | Xây dựng Bộ Sưu Tập Avatar Ma Sói Huyền Bí & Avatar Picker Modal | Frontend Lead | DONE | SPRINT 4 | 12+ Avatar ma mị, khung viền Neon, aura Glow, lưu LocalStorage |
| TASK-403 | Xây dựng UI Cài Đặt Phòng/Trận Đấu Nâng Cao & Huy Hiệu Thị Trưởng, Kẻ Ngốc trên Bàn Chơi | Frontend Dev | DONE | TASK-401, 402 | Custom timer picker, badge 👑 Thị Trưởng, badge 🃏 Kẻ Ngốc trên bàn tròn |
| TASK-404 | QA Test Suite Sprint 5: Kiểm thử Thị Trưởng x2 vote, Di chúc, Kẻ Ngốc thoát chết, Timer tùy chỉnh | QA Lead | DONE | TASK-401..403 | 100% test coverage cho luật mở rộng Sprint 5 (tests/sprint5ExpandedRules.test.mjs) |


