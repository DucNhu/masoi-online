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

## Trạng thái GitHub & Deploy
- **Repository Remote**: `https://github.com/DucNhu/masoi-online.git`
- **Commit Local**: `8402fe0` (Đã commit font chữ mới).
- **Trạng thái Build**: PASS 100% (`dist/` đã sẵn sàng).
- **GitHub Pages**: `https://ducnhu.github.io/masoi-online/` (Chờ người dùng xác nhận để push lên `main` và cập nhật `gh-pages`).

## Trạng thái Local
- Dev server đang chạy:
  - Localhost: `http://localhost:5173/ma-soi-offline/`
  - iPhone 16 Pro (cùng mạng): `http://172.20.10.5:5173/ma-soi-offline/`
