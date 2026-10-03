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

---

## SPRINT 6: Game Ma Sói Thực Thụ — Sảnh Bàn Chơi (Join Table) & Chống Bot Khung Giờ Vàng (Zero-Bot Golden Hours) — ĐÃ HOÀN THÀNH

| Task ID | Tên Task | Role | Trạng thái | Dependency | Ghi chú |
|---|---|---|---|---|---|
| TASK-501 | Schema PublicTableInfo, API listPublicTables(), joinTable() & Golden Hours Calculation Engine | System Architect / Backend | DONE | SPRINT 5 | `src/types/multiplayer.ts`, `src/utils/goldenHours.ts`, `src/logic/roomManager.ts` |
| TASK-502 | Xây dựng UI Sảnh Bàn Chơi (Table Lobby), Banner Khung Giờ Vàng & Modal Xác Thực Người Thật | Frontend Lead | DONE | TASK-501 | `src/components/OnlineLobby.tsx`, `TableLobbyView`, `GoldenHourBanner`, `HumanVerifyModal` |
| TASK-503 | Đổi tên nhận diện sang Game Ma Sói Thực Thụ, thay thế bài Tú Lơ Khơ bằng Thẻ Bài Ma Sói | Creative / Frontend | DONE | TASK-501 | `src/components/Header.tsx`, `src/App.tsx`, `index.html`, Role Cards |
| TASK-504 | QA Test Suite Sprint 6 & Pipeline Verification | QA Lead | DONE | TASK-501..503 | `tests/sprint6AntiBotAndTableLobby.test.mjs`, `npm run verify` |

---

## SPRINT 7: Hệ Thống Bảng Xếp Hạng Thợ Săn (Elo & Leaderboard), Bộ Huy Hiệu Danh Dự & Chống Phá Game (Anti-Griefing)

| Task ID | Tên Task | Role | Trạng thái | Dependency | Ghi chú |
|---|---|---|---|---|---|
| TASK-601 | Thiết kế Elo Rating Engine, Cấp Bậc Thợ Săn & Hệ Thống Huy Hiệu (Badges System) | Game Engine Dev | DONE | SPRINT 6 | `src/utils/eloRating.ts`, `src/constants/achievements.ts`, 5 bậc Rank, 10 Huy hiệu |
| TASK-602 | Tích hợp tính điểm Elo & Mở khóa Huy hiệu tự động sau trận đấu trong RoomManager | Backend / Architect | DONE | TASK-601 | `src/logic/roomManager.ts`, ghi nhận thành tích & thăng hạng |
| TASK-603 | Xây dựng UI Bảng Xếp Hạng Thợ Săn (Leaderboard), Hồ Sơ Cá Nhân & Modal Báo Cáo Chơi Xấu | Frontend Lead | DONE | TASK-601, 602 | `LeaderboardModal.tsx`, `HunterProfileModal.tsx`, `ReportPlayerModal.tsx` |
| TASK-604 | QA Test Suite Sprint 7: Kiểm thử tính toán Elo, Huy hiệu và pipeline verification | QA Lead | DONE | TASK-601..603 | `tests/sprint7LeaderboardAndProfile.test.mjs`, `npm run verify` |

---

## SPRINT 8: Trải Nghiệm Tương Tác Sống Động Trong Bàn (In-Game Emotes, Web Audio Soundscapes & Visual Atmosphere)

| Task ID | Tên Task | Role | Trạng thái | Dependency | Ghi chú |
|---|---|---|---|---|---|
| TASK-701 | Bộ Âm Thanh Ma Mị Tự Nhiên (Synthesized Web Audio Engine: Tiếng Sói Hú, Chuông Tử Thần, Búa Phán Quyết) | Audio / Engine Dev | DONE | SPRINT 7 | `src/utils/soundEffects.ts` không phụ thuộc file nặng bên ngoài |
| TASK-702 | Hệ Thống Tương Tác Biểu Cảm Nhanh (In-Game Quick Emotes & Reaction Bubbles) | Frontend Lead | DONE | TASK-701 | `src/components/EmotePicker.tsx`, tích hợp Chat & Thảo luận |
| TASK-703 | Nâng Cấp Hiệu Ứng Bầu Trời & Chuyển Pha Trăng Máu (Atmosphere & Phase Transitions) | Creative / Frontend | DONE | TASK-701 | Haptic + Sound + Visual transition Đêm / Ngày |
| TASK-704 | QA Test Suite Sprint 8 & Pipeline Verification | QA Lead | DONE | TASK-701..703 | `tests/sprint8AudioAndEmotes.test.mjs`, `npm run verify` |

---

## SPRINT 9: Chia Sẻ Phòng Nhanh (Share Invite Link), Nhật Ký Ván Đấu (Match History Replay) & Tối Ưu UX

| Task ID | Tên Task | Role | Trạng thái | Dependency | Ghi chú |
|---|---|---|---|---|---|
| TASK-801 | Cơ Chế 1-Click Copy & Share Link Mời Bạn Bè (`?room=CODE` deep link) | Backend / Frontend | DONE | SPRINT 8 | Hỗ trợ Web Share API & Clipboard fallback, auto-fill URL |
| TASK-802 | Nhật Ký Ván Đấu Chi Tiết (Game Chronological Event Log Modal & Timeline) | Game Engine Dev | DONE | TASK-801 | `MatchHistoryModal.tsx`, xem lại toàn bộ sự kiện ván đấu |
| TASK-803 | QA Test Suite Sprint 9 & Pipeline Verification | QA Lead | DONE | TASK-801..802 | `tests/sprint9ShareAndHistory.test.mjs`, `npm run verify` |

---

## SPRINT 10: Tối Ưu Trải Nghiệm Mobile Native, Dynamic Island & Kết Nối Mạng (Network Health & Reconnection Banner)

| Task ID | Tên Task | Role | Trạng thái | Dependency | Ghi chú |
|---|---|---|---|---|---|
| TASK-901 | Tối Ưu An Toàn Viewport & Dynamic Island cho iPhone 16 Pro & Mobile Touch UX | Mobile / Frontend | DONE | SPRINT 9 | `safe-area-inset`, chống double tap zoom, touch target >= 44px |
| TASK-902 | Bảng Thông Báo Trạng Thái Kết Nối & Độ Trễ Mạng (Network Health Ping & Reconnect Toast) | Engine / Frontend | DONE | TASK-901 | Hiển thị Ping thời gian thực và tự động khôi phục kết nối |
| TASK-903 | QA Test Suite Sprint 10 & Release Candidate Audit | QA Lead | DONE | TASK-901..902 | `tests/sprint10MobileAndNetwork.test.mjs`, `npm run verify` |

---

## SPRINT 11: Chế Độ Khán Giả (Spectator Mode / Xem Trực Tiếp) & Bộ Sưu Tập Kịch Bản Trăng Máu
| Task ID | Tên Task | Role | Trạng thái | Dependency | Ghi chú |
|---|---|---|---|---|---|
| TASK-1001 | Hỗ Trợ Chế Độ Khán Giả (Spectator View): Người ngoài vào xem ván đấu không can thiệp kết quả | Game Engine / Architect | DONE | SPRINT 10 | Che giấu vai trò bảo mật chống gian lận, chat khán giả |
| TASK-1002 | UI Khán Giả & Cổ Vũ (Spectator Cheers & Live Reactions) | Frontend Dev | DONE | TASK-1001 | Khán đài xem trận đấu, thả tim/vỗ tay động viên người chơi |
| TASK-1003 | QA Test Suite Sprint 11 & Pipeline Verification | QA Lead | DONE | TASK-1001..1002 | `tests/sprint11SpectatorMode.test.mjs`, `npm run verify` |

---

## SPRINT 12: Chế Độ Tập Luyện Đêm Trăng (Solo Hunter Practice Mode Với AI Bots)
| Task ID | Tên Task | Role | Trạng thái | Dependency | Ghi chú |
|---|---|---|---|---|---|
| TASK-1101 | AI Bot Engine (Hành vi phán đoán ban đêm & phản biện ban ngày của Bot Dân / Bot Sói) | Game Engine Dev | READY | SPRINT 11 | Thuật toán phán đoán suy luận cục bộ, không tốn tài nguyên |
| TASK-1102 | UI Chế Độ Tập Luyện Solo (Luyện kỹ năng Thợ Săn, Tiên Tri, Phù Thủy đối đầu Bot) | Frontend Dev | READY | TASK-1101 | Giúp người mới làm quen luật chơi trước khi vào phòng người thật |
| TASK-1103 | QA Test Suite Sprint 12 & Pipeline Verification | QA Lead | READY | TASK-1101..1102 | `tests/sprint12SoloPractice.test.mjs`, `npm run verify` |



