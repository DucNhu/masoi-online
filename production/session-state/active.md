# Active Session State — Ma Sói Game Studio

- **Thời gian cập nhật**: 2026-10-02, Asia/Ho_Chi_Minh.
- **Mục tiêu cấp bách**: Hoàn thành ứng dụng Quản trò Ma Sói Offline (bộ bài Tú lơ khơ 2-10, J, Q, K, A) phục vụ người dùng chơi tối nay (deadline: 6 tiếng) trên iPhone 16 Pro.
- **Quy trình áp dụng**: Game Studio hierarchy (BA → PM → Executor → QA) từ `pokemon-battle` (`Claude-Code-Game-Studios`), RTK token-saving proxy, single source of truth session memory.

## Trạng thái GitHub & Deploy
- **Repository Remote**: `https://github.com/DucNhu/masoi-online.git`
- **Branch**: `main` (Đã push thành công toàn bộ mã nguồn).
- **GitHub Actions**: Đã cấu hình `.github/workflows/deploy.yml` tự động build và deploy lên GitHub Pages.
- **Đường dẫn GitHub Pages**: `https://ducnhu.github.io/masoi-online/` (Chạy trên kết nối bảo mật HTTPS).
- **Tính năng PWA Offline**: Đã đăng ký `registerSW({ immediate: true })` trong [src/main.tsx](file:///Users/duc/my-projects/ma-soi-online/src/main.tsx). Khi người dùng mở link HTTPS trên Safari và bấm "Thêm vào MH chính", ứng dụng sẽ được lưu vĩnh viễn vào bộ nhớ iPhone và hoạt động 100% khi mất mạng.

## Trạng thái Local
- Dev server đang chạy:
  - Localhost: `http://localhost:5173/ma-soi-offline/`
  - iPhone 16 Pro (cùng mạng): `http://172.20.10.5:5173/ma-soi-offline/`
