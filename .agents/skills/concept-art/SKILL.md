---
name: concept-art
description: "Tạo prompt AI Art vẽ tranh phong cảnh, mood painting, scenery concept art chuẩn HD 2D Anime Cel-Shaded & Solarpunk Việt Nam cho các vùng đất trên dải đất chữ S."
allowed-tools: "exec_command, apply_patch"
metadata:
  argument-hint: "[tên địa danh hoặc cảm xúc phong cảnh, ví dụ: 'thăng long', 'bạch mộc sơn', 'hạ long', 'hoàng sa']"
  user-invocable: "true"
---

# /concept-art — Bộ Sinh Prompt Phong Cảnh Chuẩn Studio (Landscape & Environment Concept Art)

Kỹ năng này kích hoạt role **Senior Environment Concept Artist & Art Director** của Game Studio, chịu trách nhiệm thiết kế và cung cấp ngay lập tức các bộ prompt chất lượng cao (copy-paste ready) cho **ChatGPT CLI (`codex exec`)** để vẽ tranh phong cảnh cho dự án **Tiến Hóa Tối Thượng**.

---

## 1. Định Hướng Mỹ Thuật Bắt Buộc (Art Direction)

- **Phong cách cốt lõi:** Kết hợp giữa **HD 2D Anime Cel-Shaded Crisp** (> 1,000 màu, đường nét sắc nét, màu sắc trong trẻo) và **Solarpunk Việt Nam** (tương lai xanh, năng lượng sạch, hiện đại hòa cùng thiên nhiên hùng vĩ).
- **Tỉ lệ khung hình (Aspect Ratio):** Mặc định luôn là **16:9 Cinematic Landscape** (ngang) để dùng làm tranh minh họa hoặc Parallax Background trong game 2D side-scrolling.
- **Quy chuẩn đặt tên (Naming Rule):** Tên địa danh thiên nhiên và đô thị bắt buộc sử dụng **từ Hán-Việt** (ví dụ: *Đô Thành Thăng Long, Bạch Mộc Sơn, Vịnh Thủy Long, Phong Nha Thần Động, Cố Đô Ngự Hải, Cao Nguyên Đất Đỏ, Tân Thành Ánh Dương, Cửu Long Thủy Thổ, Quần Đảo Hoàng Sa & Trường Sa*).
- **Thiết Quân Luật Cấm Tuyệt Đối Vẽ Dính Nhân Vật / Linh Thú Lên Tranh Bối Cảnh (Zero Baked-In Characters/Pets)**:
  - Bản chuẩn mực [`stage_chatgpt_02_bamboo_meadow_encounter.png`](file:///Users/duc/my-projects/pokemon-combat/design/assets/chatgpt_concepts/stage_chatgpt_02_bamboo_meadow_encounter.png) và 100% tranh bối cảnh màn chơi (`stage_concept_*`, `stage_encounter_*`, Parallax Layers) **TUYỆT ĐỐI CẤM** vẽ dính con người (Trainer), Linh thú đồng hành hay quái vật lên tranh nền tĩnh. Bối cảnh bắt buộc sạch 100% không nhân vật / không thú vật.
  - **Địa Hình Liền Khối Vững Chắc 100% (Zero Floating Sky Rocks)**: Mọi thềm nhảy địa hình trong tranh chuẩn mực và tranh màn chơi bắt buộc có chân đế/trụ đá liền khối chạm đất hoặc lòng suối, hoặc bục tre có trụ đỡ cắm đáy; tuyệt đối không có hòn đảo đá nào bay lơ lửng giữa không trung.
  - **Dàn Dựng Chạm Trán Thực Chuẩn Quy Cách**: Mọi ảnh "Phối cảnh chạm trán / Luồng sinh thái quái" của bản đồ bắt buộc phải dàn dựng trong Unity Scene bằng Sprite Nhân vật thật + Linh thú thật của dự án + Quái vật thật có tách nền và bóng đổ DynamicDropShadow, hoặc là tranh phân tầng địa hình sạch 100% không dính nhân vật.
- **Tập trung 100% vào đại cảnh thiên nhiên, kiến trúc, ánh sáng môi trường và bầu không khí.**

---

## 2. Cấu Trúc Đầu Ra Bắt Buộc Khi Được Kích Hoạt

Mỗi khi người dùng gọi `/concept-art [địa danh/mô tả]`, AI **BẮT BUỘC** xuất ra prompt chuẩn hóa:

### Prompt ChatGPT CLI (`codex exec` / `imagegen`)
- **Cấu hình ChatGPT bắt buộc**: luôn chạy model `gpt-6-astra` + mức suy luận `medium` (đã khóa trong `.codex/config.toml` của dự án để tối ưu quota); CLI ảnh trực tiếp dùng `gpt-image-2` quality `high`. Lỗi/hết quota → dừng & báo cáo, cấm âm thầm fallback.
- Cấu trúc đoạn văn tiếng Anh trau chuốt, mô tả chi tiết chiều sâu 3 lớp (tiền cảnh, trung cảnh, hậu cảnh), bầu trời, ánh sáng mặt trời/đèn điện solarpunk, giữ vững phong cách **HD 2D Anime Cel-Shaded Crisp** (cấm 16-bit retro pixel art và cấm 3D photorealistic).

---

## 3. Danh Mục Các Địa Danh Tiêu Biểu Trong Dự Án
1. **Đô Thành Thăng Long** (Bắc Bộ - Thủ đô Solarpunk, hồ sen, tàu điện trên cao).
2. **Bạch Mộc Sơn** (Tây Bắc - Đỉnh núi Fansipan / Sa Pa mù sương, ruộng bậc thang).
3. **Vịnh Thủy Long** (Hạ Long - Hàng ngàn đảo đá vôi xanh ngọc bích).
4. **Phong Nha Thần Động** (Quảng Bình - Hang Sơn Đoòng thạch nhũ phát sáng).
5. **Cố Đô Ngự Hải** (Huế & Đà Nẵng - Cung đình cổ kính ven biển).
6. **Cao Nguyên Đất Đỏ** (Tây Nguyên - Đất đỏ bazan, đồi chè, thác nước, điện gió).
7. **Tân Thành Ánh Dương** (Nam Bộ - TP.HCM hiện đại, kênh rạch xanh, năng lượng mặt trời).
8. **Cửu Long Thủy Thổ** (Miền Tây - Sông nước Chín Rồng, chợ nổi, rừng tràm).
9. **Quần Đảo Hoàng Sa & Trường Sa** (Biển Đông - Hải đăng sừng sững, rạn san hô thiêng liêng).


---

## 4. Gate và Bàn Giao Bước Tiếp Theo (Handoff & Verification Gate)

### Quy định quyền ghi và phê duyệt (Approval-before-write contract)
- Trước mutation, phải trình bày rõ ràng exact paths và kiểm tra phạm vi phê duyệt (approval) của task hiện tại.
- Quyền ghi chỉ bao phủ đúng scope đã được phê duyệt (approval-before-write); nếu thiếu phê duyệt hoặc mở rộng phạm vi ngoài scope thì phải dừng lại xin ý kiến người dùng.

### Đánh giá Gate và Handoff
- Mọi kết quả nghiệm thu phải được kết luận với verdict rõ ràng:
  - `PASS`: Toàn bộ tiêu chí đạt 10/10 và các bài test xanh.
  - `CONCERNS`: Còn tồn tại điểm cần theo dõi thêm.
  - `FAIL`: Phát hiện lỗi nghiêm trọng chưa khắc phục được.
  - `BLOCKED`: Bị chặn bởi dependency hoặc thiếu công cụ.
  - `NOT RUN`: Các bước kiểm thử chưa được thực thi.
- Kết thúc bằng handoff cho PM với đúng một hành động tiếp theo (next step) cụ thể, ghi nhận trạng thái vào `production/session-state/active.md`.
