---
name: review-art
description: "Review, đánh giá kỹ thuật và thẩm mỹ cho asset đồ họa, sprite sheet, animation hoặc concept art 2D theo chuẩn Game Studio và tự động đề xuất prompt tiếp theo."
argument-hint: "[ảnh hoặc đường dẫn ảnh cần review]"
user-invocable: true
allowed-tools: Read, Write, RunCommand
---

# /review-art — Quy Trình Review Asset Đồ Họa & Sprite Sheet Chuẩn Game Studio

Kỹ năng này thực hiện quy trình kiểm tra toàn diện (QA Audit & Visual Review) đối với các asset 2D (concept lineup, sprite sheet Idle, Run, Jump, Attack, VFX...) nhằm đảm bảo asset sẵn sàng import Unity mà không bị lỗi runtime.

---

## 1. Tiêu Chí Đánh Giá 6 Trụ Cột (6-Pillar Review Rubric)

Mỗi lần review một ảnh hoặc sprite sheet, AI phải thẩm định qua 6 tiêu chí:

### 1. Trắc diện & Hướng nhìn (Camera & Facing Direction)
- [ ] Góc nhìn 2D Orthographic phẳng hoàn toàn (True side profile, không chéo 2.5D, không isometric, không top-down).
- [ ] Hướng quay mặt: Luôn quay mặt sang phải (**Facing Right**) chuẩn xác.

### 2. Đường chân & Trọng tâm (Baseline & Anchor Consistency)
- [ ] **Độ lệch Baseline ($\Delta Y$):** Chân của nhân vật có chạm cùng một đường nằm ngang cố định xuyên suốt mọi frame không? (Dung sai $\le 1\text{px}$).
- [ ] **Trôi trọng tâm ($\Delta X$):** Nhân vật có diễn hoạt tại chỗ (in-place) không? Thân người/pelvis có bị trôi dạt (drift) lệch sang trái/phải bất thường không?

### 3. Nhịp điệu & Pha hành động (Action Breakdown & Readability)
- [ ] **Độ rõ của các pha:** Phân rõ Anticipation (Lấy đà) $\rightarrow$ Active (Ra đòn/Bật nhảy) $\rightarrow$ Follow-through $\rightarrow$ Recovery $\rightarrow$ Loop.
- [ ] **Silhouette Readability:** Hình bóng nhân vật có rõ ràng, dễ nhận diện ở độ phân giải nhỏ ($64 \times 64\text{ px}$) không?

### 4. Quy chuẩn Pixel Art & Nền (Pixel Grid & Background)
- [ ] **Độ sắc nét:** Điểm ảnh vuông sắc cạnh (crisp integer pixels), không bị mờ nhòe (anti-aliasing/blur/bilinear filter).
- [ ] **Đường viền (Outline):** Viền tối màu $1-2\text{px}$ bao quanh cơ thể rõ ràng.
- [ ] **Phông nền (Background):** Ưu tiên nền trong suốt với alpha thật (`A = 0`), clean alpha edges, không có bóng đổ sàn và không có white/dark halo. Chỉ chấp nhận nền trắng `#FFFFFF` hoặc đen `#000000` khi generator không hỗ trợ alpha; asset fallback phải qua Smart Edge Defringe & Color Bleeding và halo gate trước khi được coi là Production Ready.

### 5. Phân tách Body & VFX (Decoupling Contract)
- [ ] **Kiểm tra Bake:** Body animation (đấm, đá, cào, nhảy) có bị "bake" ngọn lửa, tia điện hoặc vệt chém dính vào tay chân không?
- [ ] **Chuẩn modular:** Body phải sạch sẽ để lập trình viên có thể gắn VFX prefab và tái sử dụng cho nhiều chiêu thức khác nhau.

### 6. Khả năng đưa vào Unity (Unity Production Readiness)
- [ ] Có thể cắt bằng `Grid by Cell Size` hay cần custom bounds?
- [ ] Tỷ lệ kích thước nhân vật so với các animation khác (Idle, Run, Jump) có đồng nhất không?

---

## 2. Thang Điểm Đánh Giá (Review Verdicts)

| Kết Luận (Verdict) | Ý Nghĩa Kỹ Thuật | Hành Động Tiếp Theo |
| :--- | :--- | :--- |
| **Production Ready** | Đạt chuẩn toàn bộ 6 tiêu chí, baseline phẳng, cell chuẩn, không bake VFX | Cắt sprite, cấu hình TextureImporter (Point/None/PPU 32) và đưa vào Unity. |
| **Reference Approved** | Đạt về tạo hình và silhouette, nhưng còn lệch nhẹ baseline hoặc cần căn chỉnh lại cell | Cần tool auto-alignment hoặc xử lý tuck offset trước khi import. |
| **Prototype Only** | Chỉ dùng để test cơ chế tạm thời, tỉ lệ hoặc phong cách chưa đồng bộ | Giữ làm nháp, cần ren lại bản hoàn thiện cho bản chính thức. |
| **Reject / Regenerate** | Sai góc nhìn, trôi baseline quá lớn, hoặc bake VFX dính chặt vào body | Bỏ ảnh, sử dụng prompt điều chỉnh để tạo lại. |

---

## 3. Quy Tắc Bắt Buộc: Cung Cấp Prompt Sẵn Dùng (Proactive Prompt Rule)

Theo quy định `AGENTS.md`, mọi báo cáo review **BẮT BUỘC CHỦ ĐỘNG** cung cấp sẵn:
1. **Prompt chỉnh sửa (nếu cần tinh chỉnh lại)** HOẶC
2. **Prompt cho asset tiếp theo (VFX, Animation nối tiếp, Sound prompt)** được tinh chỉnh chính xác theo contract của dự án để người dùng copy dùng ngay.
