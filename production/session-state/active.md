# Active Session State — Ma Sói Game Studio

- **Thời gian cập nhật**: 2026-10-02, Asia/Ho_Chi_Minh.
- **Mục tiêu cấp bách**: Hoàn thành ứng dụng Quản trò Ma Sói Offline (bộ bài Tú lơ khơ 2-10, J, Q, K, A) phục vụ người dùng chơi tối nay (deadline: 6 tiếng) trên iPhone 16 Pro.
- **Quy trình áp dụng**: Game Studio hierarchy (BA → PM → Executor → QA) từ `pokemon-battle` (`Claude-Code-Game-Studios`), RTK token-saving proxy, single source of truth session memory.

## Cập Nhật Typography (100% Tiếng Việt)
- **Vấn đề đã xử lý**: Font `Cinzel` trước đây không hỗ trợ đầy đủ các ký tự tiếng Việt có dấu (SÓI, THỦY, BẢO VỆ, QUẢN TRÒ, TIÊN TRI, THỢ SĂN...) dẫn đến tình trạng lỗi hiển thị (fallback font chữ lộn xộn).
- **Bộ font mới tối ưu**:
  - **Tiêu đề & Game Display**: `Montserrat` (weights 700, 800, 900) — mạnh mẽ, đậm chất gaming điện ảnh, sắc nét, hỗ trợ 100% tiếng Việt không lỗi dấu.
  - **Giao diện & Nội dung**: `Be Vietnam Pro` (weights 400, 500, 600, 700, 800) — thiết kế chuyên biệt cho tiếng Việt bởi các nhà thiết kế Việt Nam, dấu thanh thanh thoát, dễ đọc trong bóng tối.
  - **Tối ưu hiển thị**: Thêm `text-rendering: optimizeLegibility` và `-webkit-font-smoothing: antialiased` cho màn hình Retina của iPhone 16 Pro.

## Cập Nhật Mới: Gói Mở Rộng Vai Trò (Expansion Pack)
- **Mặc định**: Chỉ có các vai trò cơ bản: Ma Sói (K), Tiên Tri (A), Phù Thủy (Q), Bảo Vệ (J), Thợ Săn (10), và Dân Làng (2-9).
- **Tính năng Mở Rộng (Nút "✨ Mở Rộng Vai Trò")**:
  - Khi người dùng bấm nút mở rộng, panel mở rộng xổ ra cho phép bật/tắt linh hoạt 5 vai trò mới:
    1. 💘 **Thần Tình Yêu (Lá 9)**: Thức dậy Đêm 1 ghép đôi 2 người chơi. Một người chết, người kia tuẫn tiết chết theo.
    2. 🎭 **Kẻ Bán Tơ (Lá 8)**: Phe Ma Sói. Nhận diện mặt Sói trong đêm 1. Khi Tiên Tri soi ra kết quả Người tốt (Dân).
    3. 🛡️ **Già Làng (Lá 7)**: Có 2 sinh mạng kiên cường trước đòn cắn của Sói (bị cắn lần đầu không chết). Bị treo cổ hoặc bị đầu độc thì chết ngay.
    4. 🃏 **Kẻ Ngốc (Lá 6)**: Nếu bị dân làng bỏ phiếu treo cổ ban ngày, Kẻ Ngốc lật bài công khai thân phận và được tha chết! Tiếp tục sống nhưng mất quyền biểu quyết.
    5. 🐺 **Bán Sói (Lá 5)**: Ban đầu là Dân Làng. Nếu bị Ma Sói cắn trong đêm, không chết mà lời nguyền thức tỉnh, chính thức biến thành Ma Sói từ đêm tiếp theo!
  - Lá bài số nào không được bật làm vai trò mở rộng thì tự động là **Dân Làng** (2..9).
  - Tích hợp trọn vẹn: State Machine các pha đêm/ngày, giải quyết thương vong trong `gameEngine.ts`, 8 bộ unit test PASS 100%, bảng quy ước bài tú `RoleLookupModal.tsx`.

## Trạng thái GitHub & Deploy
- **Repository Remote**: `https://github.com/DucNhu/masoi-online.git`
- **Trạng thái Build**: PASS 100% (`tsc -b && vite build` tạo `dist/` thành công).
- **Unit Test**: 8/8 test PASS (`npx tsx tests/gameEngine.test.mjs`).

## Trạng thái Local
- Dev server đang chạy:
  - Localhost: `http://localhost:5173/ma-soi-offline/`
  - iPhone 16 Pro (cùng mạng): `http://172.20.10.5:5173/ma-soi-offline/`
