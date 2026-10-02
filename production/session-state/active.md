# Active Session State — Ma Sói Game Studio

- **Thời gian cập nhật**: 2026-10-02, Asia/Ho_Chi_Minh.
- **Mục tiêu cấp bách**: Hoàn thành ứng dụng Quản trò Ma Sói Offline (bộ bài Tú lơ khơ 2-10, J, Q, K, A) phục vụ người dùng chơi tối nay (deadline: 6 tiếng) trên iPhone 16 Pro.
- **Quy trình áp dụng**: Game Studio hierarchy (BA → PM → Executor → QA) từ `pokemon-battle` (`Claude-Code-Game-Studios`), RTK token-saving proxy, single source of truth session memory.
- **Quy tắc Git Push**: TUYỆT ĐỐI KHÔNG tự ý push code lên remote repository nếu không có xác nhận trực tiếp từ người dùng.

## Cập Nhật Mới Nhất: Setup Tên Người Chơi & Luồng Phát Bài Thực Tế (Zero Cupid / Minion)
1. **Loại bỏ Thần Tình Yêu (Cupid) & Kẻ Bán Tơ (Minion)**:
   - Cập nhật [roles.ts](file:///Users/duc/my-projects/ma-soi-online/src/data/roles.ts): Lá 8 và Lá 9 mặc định là Dân Làng (`VILLAGER`), xóa lời thoại Cupid.
   - Cập nhật [NightPhaseView.tsx](file:///Users/duc/my-projects/ma-soi-online/src/components/NightPhaseView.tsx): Xóa hoàn toàn bước gọi Cupid trong đêm.
   - Cập nhật [RoleLookupModal.tsx](file:///Users/duc/my-projects/ma-soi-online/src/components/RoleLookupModal.tsx) và cheatsheet trong [App.tsx](file:///Users/duc/my-projects/ma-soi-online/src/App.tsx): Bộ bài gồm Sói (K), Tiên Tri (A), Phù Thủy (Q), Bảo Vệ (J), Thợ Săn (10), Dân Làng (2-9).

2. **Nhập Tên Người Chơi Thực Tế**:
   - Thay thế hoàn toàn "Người chơi 1, Người chơi 2" bằng tên thật của bạn bè (Đức, Linh, Tuấn, Hùng, Trang, Mai...).
   - Input nhập nhanh từng tên (nhấn Enter để thêm liên tục).
   - Hỗ trợ nút "Dán Danh Sách Nhanh" (nhập hàng loạt cách nhau bởi dấu phẩy hoặc xuống dòng).
   - Tự động ghi nhớ danh sách người chơi vào `localStorage` (`MA_SOI_SAVED_PLAYERS`) để không cần nhập lại trong các ván sau.

3. **Cấu Hình Bài Tự Động & Xào Bài Ngẫu Nhiên**:
   - Tự động gợi ý cơ cấu Sói, Tiên Tri, Phù Thủy, Bảo Vệ, Thợ Săn, Dân Làng cân bằng theo số lượng người chơi.
   - Nút **"🎲 Xào Bài & Chia Ngẫu Nhiên"**: Fisher-Yates shuffle gán ngẫu nhiên lá bài kèm chất bài thật (♠, ♣, ♦, ♥) cho từng người chơi.
   - Hiệu ứng âm thanh xào bài chân thực bằng Web Audio API.

4. **Giai Đoạn Phát Bài Thực Tế (Physical Dealing Phase)**:
   - Quản trò cầm bộ bài Tú lơ khơ trên tay và nhận hướng dẫn chính xác rút lá nào đưa úp cho ai.
   - 2 chế độ hiển thị linh hoạt: **Lần Lượt (Step-by-Step)** và **Danh Sách (List)**.
   - Chế độ **Bảo Mật (Privacy Mode)**: Ẩn tên vai trò, chỉ hiện ký hiệu lá bài (K♠, A♥...) để người ngồi gần không nhìn lén được thân phận.
   - Thanh tiến độ đếm số bài đã phát (`X / Y người chơi`).
   - Nút **"🌙 Bắt Đầu Ván Đấu (Vào Đêm 1)"** chỉ kích hoạt sau khi đã chia hết bài cho tất cả người chơi.

## Trạng Thái Kiểm Thử & Server
- **Lint**: 0 warnings, 0 errors (`oxlint`).
- **Build**: PASS 100% (`tsc -b && vite build`).
- **Game Engine Unit Tests**: 6/6 test cases PASS (`npx tsx tests/gameEngine.test.mjs`).
- **Server Live**:
  - Localhost: `http://localhost:5173/ma-soi-offline/`
  - iPhone 16 Pro (Cùng Wi-Fi/Hotspot): `http://172.20.10.5:5173/ma-soi-offline/`

## Hành Động Kế Tiếp
- Chờ người dùng trải nghiệm thực tế luồng chia bài và bắt đầu trận đấu trên iPhone 16 Pro.
