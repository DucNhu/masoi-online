# Active Session State — Ma Sói Game Studio

- **Thời gian cập nhật**: 2026-11-08 22:02 (Asia/Ho_Chi_Minh) — Sprint 32: Chống Mũ/Tai Che Bảng Tên 3D (`getTopClearanceY` + `depthTest: false`), Raycast Chạm Trực Tiếp Nhân Vật 3D, Tránh Vật Cản Đống Lửa & Sửa Stale Closure Bỏ Phiếu/Khóa Chiêu.
- **Mục tiêu**: **Sửa triệt để lỗi các nhân vật đội mũ (Phù Thủy, Nón Lá, Cao Bồi, Vương Miện) hoặc có tai Sói/Hồ Ly che mất bảng tên 3D trên đầu, đồng thời sửa 4 lỗi tương tác 3D & HUD liên quan [COMPLETED]**.
- **Kết quả thực hiện (Thực thi qua Sub-Agent `flash` với Disjoint File Lease)**:
  1. **Tỷ Lệ Mũ Ôm Đầu & Độ Cao Bảng Tên Động (`src/components/arena3d/WolfMeshBuilder.ts`)**:
     - Hạ khớp `hatSlot.position.set(0, 0.24, 0)` (thay vì `0.34`) để mũ ôm khít đầu Chibi, tinh chỉnh lại kích thước `WITCH`, `CONICAL_HAT`, `COWBOY`, `CROWN`, `BANDANA` cân đối và không bị Z-fighting với mái tóc.
     - Khi nhân vật `WOLF_BLOOD` hoặc `KITSUNE_FOX` đội mũ rộng vành (`CONICAL_HAT`, `WITCH`, `COWBOY`), hai tai tự động nghiêng nhẹ ra ngoài vành mũ (`rotation.z = ±0.58`) thay vì đâm xuyên qua chóp mũ.
     - Bổ sung hàm `public getTopClearanceY(animOffset = 0)` tự động tính chiều cao đỉnh mũ/tai thực tế theo từng trang phục + tư thế đứng/ngồi + nhịp nhún hoạt cảnh (`idle`, `howl`, `walk`, `slumber`), đảm bảo cạnh dưới bảng tên luôn cao hơn đỉnh mũ ít nhất `0.12` đơn vị.
     - Cấu hình `SpriteMaterial` của bảng tên với `depthTest: false`, `depthWrite: false`, `renderOrder = 999` để không bao giờ bị chóp mũ hay vật thể 3D cắt ngang.
  2. **Raycast Bấm Trực Tiếp Lên Người Nhân Vật 3D & Tránh Đống Lửa (`src/components/arena3d/CampfireScene.ts`)**:
     - Gắn `userData = { seatNumber }` lên `char.root` và bổ sung `getSeatFromIntersects()` duyệt ngược cây cha (`.parent`) để người chơi bấm/chạm vào bất kỳ bộ phận nào của nhân vật 3D (đầu, thân, mũ, tay chân hoặc khúc gỗ) đều chọn được ghế đó.
     - Bổ sung `applyCampfireObstaclePushback()` quanh 4 đống lửa (`[0,0]`, `[-16,-14]`, `[16,-14]`, `[0,-24]`, bán kính `1.35`) để nhân vật đi dạo tự động lách qua đống lửa thay vì đi xuyên qua ngọn lửa.
  3. **Sửa Stale Closure Click 3D & Gộp Banner HUD (`src/components/arena3d/CampfireArena3DView.tsx`)**:
     - Dùng `handleSeatInteractionRef` để callback `scene.setOnSeatClick` luôn đọc đúng state mới nhất khi đang trong pha Đêm Đồng Thời 25s hoặc Bỏ Phiếu Ban Ngày.
     - Chuyển các banner thông báo trạng thái (`copyToast`, `lynchNotice`, `hoveredPlayer`, `isRoaming`) xuống `bottom: 70px` và chỉ hiển thị 1 banner ưu tiên cao nhất tại một thời điểm, chấm dứt việc đè lên thanh chọn Lều góc trái trên Mobile.
  4. **Unit Test Kiểm Định Chiều Cao Mũ vs Bảng Tên & Raycast Nhân Vật (`tests/sprint25Wolf3DArena.test.mjs`)**:
     - Bổ sung 2 bài test tự động mới kiểm tra `THREE.Box3().setFromObject(char.headGroup)` cho toàn bộ 6 loại mũ × 3 chủng tộc ở cả tư thế ngồi lẫn đứng đi bộ, và kiểm tra raycast chạm thân/đầu nhân vật trả về đúng `seatNumber`.
- **Nhánh làm việc**: `feature/ma-soi-online` & `main`.
- **Mô hình vận hành**: Game Studio Hierarchy (PO → PM → Flash Sub-Agent → QA Verification → Continuous Deploy).

---

## 1. Kết Quả Kiểm Thử Toàn Diện (System Health & Pipeline Verification)
- **Lint**: `oxlint` PASSED (0 errors).
- **AI Skill Verification**: 78/78 skills PASSED 100%.
- **Unit & Integration Test Suite**: **21 Test Suites PASSED 100%** (83/83 test cases).
- **Production Build**: `tsc -b && vite build` PASSED 100% (0 warnings).
- **Continuous Deploy**: Tự động commit & push lên `feature/ma-soi-online` và `main` theo quy tắc người dùng đã phê duyệt.

---

## 2. Hành Động Tiếp Theo Của PM (Single Next Action)
- Mời người dùng kiểm tra bảng tên 3D trên đầu các nhân vật đội mũ và thao tác chạm trực tiếp vào nhân vật 3D trên điện thoại/máy tính.
