# Active Session State — Ma Sói Game Studio

- **Thời gian cập nhật**: 2026-11-08 16:32 (Asia/Ho_Chi_Minh) — Sprint 29: Tối Giản & Sắp Xếp Lại Toàn Bộ Layout 3D HUD & Header Cho Mobile & Desktop (Zero-Duplication Clean HUD).
- **Mục tiêu**: **Giải quyết triệt để tình trạng rối mắt do nhiều tầng nút chồng chéo trên Mobile và Desktop: thu gọn Header thành 1 hàng mỏng 48px/52px, gom 4 nút Túp Lều thành 1 Pill Dropdown, chuyển thanh công cụ sang cột dọc 38px sát cạnh phải, đưa nút Đêm Đồng Thời xuống Bottom Dock và thu nhỏ bảng tên 3D trên đầu nhân vật [COMPLETED]**.
- **Kết quả thực hiện (Thực thi qua 2 Sub-Agents `flash` song song với Disjoint File Leases)**:
  1. **Header 1 Hàng Siêu Gọn & Responsive Shell (`src/components/Header.tsx`, `src/index.css`, `src/App.tsx`)**:
     - Cố định chiều cao Header 1 dòng (`48px` trên mobile, `52px` trên PC, `flex-wrap: nowrap`).
     - Cụm giữa chỉ giữ 4 mục cốt lõi (`⛺ Trại 3D`, `🌐 Online`, `🃏 Quản Trò`, `📖 Bí Kíp`).
     - Cụm phải gộp chung **Badge Nhân Vật + `🪙 Coin` + Mở Tủ Đồ 3D** vào 1 nút duy nhất, xóa nút Tủ Đồ rời và ẩn các nút bài Tây (`👁️`, `🔄`) khi đang ở màn hình 3D.
  2. **Tối Giản HUD 3D & Bảng Tên Nổi (`src/components/arena3d/CampfireArena3DView.tsx`, `src/components/arena3d/WolfMeshBuilder.ts`)**:
     - **Xóa toàn bộ nút trùng lặp** giữa HUD 3D và Header (xóa Badge Tên/Coin lặp, xóa nút Ngôn ngữ lặp, gộp nút Thử Mẫu & Tủ Đồ).
     - **Góc Trái Trên**: Thay dải 4 nút lều dài ngoằng bằng **1 Pill Dropdown chọn lều** (`🩸 Lều Trăng Máu (10/10) ▾`) kèm 2 icon `🔗` (Copy link) và `🚶` (Đi dạo).
     - **Cạnh Phải**: Gom các nút điều khiển (`✨ Tủ Đồ`, `🌙/☀️ Ngày/Đêm`, `➕/➖ Zoom`, `🔄 Reset`, `⛶ Toàn màn hình`) thành **1 cột dọc mảnh `38px`** sát mép phải.
     - **Chính Giữa Dưới**: Dock hành động gọn đẹp chứa nút **`🌙 Bắt Đầu Đêm Đồng Thời (25s)`** và thanh 5 kỹ năng 1 hàng khi vào đêm.
     - **Bảng Tên Nổi 3D**: Thu nhỏ kích thước (`scale(1.05, 0.26, 1)`) và nền kính mờ nhẹ để 10 nhân vật quanh đống lửa thông thoáng, không che khuất nhau.
- **Nhánh làm việc**: `feature/ma-soi-online` & `main`.
- **Mô hình vận hành**: Game Studio Hierarchy (PO → PM → 2 Parallel Flash Sub-Agents → QA Verification → Continuous Deploy).

---

## 1. Kết Quả Kiểm Thử Toàn Diện (System Health & Pipeline Verification)
- **Lint**: `oxlint` PASSED (0 errors).
- **AI Skill Verification**: 78/78 skills PASSED 100%.
- **Unit & Integration Test Suite**: **21 Test Suites PASSED 100%** (80/80 test cases).
- **Production Build**: `tsc -b && vite build` PASSED 100% trong 386ms (0 warnings).
- **Continuous Deploy**: Tự động commit & push lên `feature/ma-soi-online` và `main` theo quy tắc người dùng đã phê duyệt.

---

## 2. Hành Động Tiếp Theo Của PM (Single Next Action)
- Mời người dùng kiểm tra bố cục mới gọn thoáng trên điện thoại và máy tính.
