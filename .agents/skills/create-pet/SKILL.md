---
name: create-pet
description: "Tạo file hồ sơ thiết kế chi tiết (GDD specs, chỉ số, moveset, AI prompts copy-paste ready) cho một Pet trong Tiến Hóa Tối Thượng (Pet Battle) dựa theo mô tả hoặc hình tượng."
allowed-tools: "exec_command, apply_patch"
metadata:
  argument-hint: "[mô tả/hình tượng pet, ví dụ: 'pikachu hệ điện', 'charmander hệ lửa']"
  user-invocable: "true"
---

# /create-pet — Quy Trình Tự Động Tạo Hồ Sơ Pet Chuẩn Game Studio

Kỹ năng này chịu trách nhiệm khởi tạo một file hồ sơ Pet hoàn chỉnh đặt tại `design/pets/<pet-id>.md`.
File này đóng vai trò **Single Source of Truth** kết nối giữa:
1. **Game Designer (GDD & Chỉ số)**: Species, Type, Base Stats, Progression, Moveset (`PokemonDataSO`, `MoveDataSO`).
2. **AI Art Producer (Prompt Generator)**: Bộ prompt copy-paste ready cho ChatGPT/Midjourney (Identity, Idle, Run, Jump, Attack, Hurt, Faint, VFX).
3. **Unity Technical Artist / Gameplay Programmer**: Import specs, cell size, anchor, PPU, hitbox, animation contracts.

---

## 1. Quy Trình Kích Hoạt & Thu Thập Dữ Liệu

### Phạm vi, quyền ghi và công cụ

- Đây là skill **thiết kế hồ sơ và prompt**, không tự generate ảnh, ghi asset hoặc import Unity. Đọc `production/session-state/active.md` trước khi lập kế hoạch; PM sở hữu file này, executor chỉ trả handoff.
- Trước mutation, trình bày exact paths dự kiến và đối chiếu phê duyệt task hiện có: quyền chỉ bao phủ scope đã nêu; không hỏi lại phần đã duyệt, hỏi người dùng nếu thiếu quyền hoặc mở rộng scope. Yêu cầu prompt-only/read-only không cấp quyền lưu/sửa hồ sơ, asset, generate hay integrate.
- Nếu Pet, stage, concept/source canonical hoặc scope chưa rõ, hỏi trước phần phụ thuộc; không tự regenerate, đổi canonical hay ghi đè. Giữ thay đổi của người dùng và các candidate khác.
- Dùng `exec_command` để đọc/kiểm tra và `apply_patch` để sửa văn bản trong scope đã duyệt. `allowed-tools` chỉ là thông tin, không cấp quyền và không bảo đảm tool tồn tại. Kiểm tra capability trong phiên; thiếu input/tool cần thiết thì ghi `BLOCKED` cho bước phụ thuộc.
- Hỏi bằng `functions.request_user_input_async` chỉ nếu được cung cấp trong phiên; `functions.request_user_input` chỉ dùng câu hỏi tùy chọn trong Plan mode. Khi tool hỏi không có hoặc cần approval, hỏi trực tiếp trong chat. App approval phải qua cơ chế hỗ trợ của ứng dụng, không giao người/agent khác bypass sandbox.
- Thiếu source hoặc licensing cần thiết thì ghi `BLOCKED`; không retry GUI khi blocker chưa đổi, không cài tool hay dùng fallback trả phí. Các contract đã duyệt riêng cho Pet/stage là nguồn thông số; không đổi stats/frame/cell theo ví dụ chung bên dưới.

Khi người dùng gọi `/create-pet [mô tả]` hoặc yêu cầu tạo pet theo hình tượng (ví dụ: `pikachu`, `rùa nước`, `sói bóng tối`):
1. **Nhận diện Archetype & Bản Quyền (IP Protection)**:
   - Nếu người dùng nhắc tên Pokemon gốc (như Pikachu, Charmander, Squirtle), chuyển thành danh pháp nguyên bản của game kèm ghi chú `Cảm hứng thiết kế (Archetype)`.
   - **Tên Pet phải được tạo từ tên tham khảo rồi Việt hoá**, ưu tiên chuyển nghĩa, âm gợi nhớ hoặc đặc tính nổi bật thành một tên Việt ngắn, dễ gọi và không dùng nguyên văn tên IP. Ví dụ: `Pikachu` (chuột điện, tia chớp) → `Tí Chớp`; không dùng tên placeholder như `Pet Điện A` làm tên hiển thị cuối cùng.
   - Ghi rõ ba trường riêng biệt: `Tên hiển thị Việt hoá`, `Mã định danh nội bộ`, và `Tên tham khảo`; tên tham khảo chỉ phục vụ truy vết cảm hứng, không xuất hiện như tên thương mại trong game.
   - Giữ nguyên core fantasy (hệ nguyên tố, form dáng động vật kết hợp, đặc tính tác chiến).
2. **Xác định thông số cốt lõi**:
   - **Hệ (Type)**: Lửa, Nước, Cỏ, Điện, Đá, Gió, Bóng Tối, Bình Thường...
   - **Vai trò (Combat Role)**: Speedster (Tốc độ cao), Bruiser (Đấu sĩ cân bằng), Tank (Chống chịu), Nuker/Glass Cannon (Phép tầm xa)...
   - **Gia phả tiến hóa (Evolution Line)**: Dạng Sơ Khai (Base Lv.1) $\rightarrow$ Dạng Trưởng Thành (Stage 1 Lv.16) $\rightarrow$ Dạng Tối Thượng (Stage 2 Lv.36 / Đá Tiến Hóa).
3. **Nguyên Tắc Bắt Buộc: Ưu Tiên 4 Nhóm Chủng Loài Độc Bản Mới (Mandatory Species Diversity Rule)**:
   - Theo chuẩn tài liệu GDD `docs/gdd/pet-species-diversity-and-field-abilities.md`, **tuyệt đối hạn chế việc lặp lại thú 4 chân lông xù quen thuộc** (chó, mèo, chuột, tê giác).
   - Mọi Pet mới mở rộng bắt buộc phải ưu tiên lựa chọn hình thái sinh học từ 4 nhóm chủng loài độc bản Solarpunk Á Đông Việt Nam:
     * **Thực Vật & Linh Dược (Botanical / Flora Spirits)**: Hoa sen ngọc bích, Nấm lân tinh dạ quang, Mộc nhân tre trúc, Thảo dược củ quả.
     * **Khí Tượng & Hiện Tượng Tự Nhiên (Weather & Amorphous Phenomena)**: Linh vân săn mây, Sương mù biến ảo, Bọt sóng thủy triều, Đom đóm lôi điện.
     * **Côn Trùng & Giáp Xác Quang Năng (Chitin & Bio-Solar)**: Kim ngân thiền (ve sầu cơ kim), Thiềm thừ ngậm ngọc, Bọ hung cánh pin quang năng, Chuồn chuồn ngọc.
     * **Cổ Vật & Di Khí Hoạt Hóa (Living Relics & Solarpunk Golems)**: Trống đồng Đông Sơn lơ lửng, Tiểu gốm Bát Tràng men rạn, Thạch trụ trấn trạch phong thủy, Rối nước linh khí.
   - **Kỹ Năng Dã Ngoại Mở Đường (Field Traversal Ability)**: Mỗi Pet mới bắt buộc phải được định nghĩa 1 kỹ năng dã ngoại mở đường tương thích với môi trường (Bắc cầu mộc đằng qua hố sâu, Đóng băng mặt nước/Cột nước bật nhảy, Thiêu rụi gai độc/Soi sáng hang tối, Tạo gió đối lưu nâng lên mỏm đá cụt đường, hoặc Phá vỡ cự thạch mở cửa phụ bản).
   - **Tập Tính Tự Nhiên & Cắm Trại (Wild Ecology & Camping Affinity)**: Xác định rõ tập tính dã ngoại (Ngủ trưa, Tắm nắng, Kiếm quả mọng) và món ăn dã ngoại ưa thích tại các trạm nghỉ chân.

---

## 2. Tiêu Chuẩn Kỹ Thuật Bắt Buộc Trong File MD Sinh Ra

Mọi file `design/pets/<pet-id>.md` PHẢI tuân thủ nghiêm ngặt:
- **Phong cách mỹ thuật**: **HD 2D Anime Cel-Shaded Crisp** (> 1,000 màu, đường nét sắc nét, viền mềm, không vỡ hạt, không dùng retro pixel 16-bit).
- **PPU (Pixels Per Unit)**: **512** cho Stage 1 & Stage 2 (1 mét Unity = 512 pixels); **724** cho Stage 3 Mega Evolution.
- **Camera Angle**: True 2D Orthographic Side-View, Facing Right, cự ly camera cố định ngang ngực nhân vật.
- **Background**: Solid pure white (`#FFFFFF`) khi sinh từ ChatGPT CLI, sau đó bóc nền canvas sạch 100% bằng thuật toán Exterior & Cavity De-matting (`A = 0`). Tuyệt đối không để lại viền mờ white halo (`0.00% halo`).
- **Canvas Dimensions Chuẩn Hóa**:
  - **Tư thế đứng thẳng / Compact** (`Idle`, `Skill 2 Ball`, `Skill 3 Shock`, `Skill 4 Thunder`, `Hurt`, `Faint`): **$512 \times 512\text{ px}$**.
  - **Tư thế phi nước đại / Duỗi thân dài / Vung đòn rộng** (`Run`, `Jump`, `Skill 1 Dash`, `Attack Lunge`): **$768 \times 512\text{ px}$** (giữ nguyên chiều cao 512 và PPU 512 để tương thích 100% world unit Unity và ground alignment).
- **Kiểm Định Giải Phẫu & Tỷ Lệ Bằng Mắt AI (Mục 3.11 AGENTS.md — Cấm Script Đo Tỷ Lệ)**:
  - Không dùng script đếm pixel để đo đầu/thân. Chụp ảnh bảng frame và ảnh trong Scene cạnh Trainer $1.8\text{m}$, AI mở ảnh nhìn trực tiếp bằng `read_file` để kiểm tra đầu/thân/mắt đồng nhất với Idle và mô tả thẳng chỗ nào chưa ổn.
  - Bàn chân tiếp đất phải khóa chết vào baseline sàn đấu ($Y = 486$ trên canvas cao 512, tương đương $95\%$ chiều cao).
- **Quy Tắc Sinh Ảnh Không Cắt Gọt (No Python Cropping / Rescaling Rule)**:
  - **TUYỆT ĐỐI CẤM yêu cầu AI vẽ 5–6 frame trên một tấm sheet dài ngoẵng**: Điều này bắt buộc AI phải zoom-out camera và vẽ nhân vật teo nhỏ $50\%$ để nhét vừa khung.
  - Mỗi frame hoạt cảnh phải được sinh ở độ phân giải gốc chuẩn (Full Resolution Keyframe), nhân vật chiếm trọn **$75\% - 85\%$** diện tích khung hình.
- **Tách biệt Animation Body và Skill VFX**:
  - `Attack_Body`: Chỉ chứa chuyển động cơ thể — **KHÔNG bake hiệu ứng lửa/điện/nước vào sprite body**.
  - `Skill_VFX`: Xuất thành asset độc lập gắn qua prefab/`MoveDataSO.vfxPrefab`.

---

## 3. Cấu Trúc Chuẩn Của File `design/pets/<pet-id>.md`

Mỗi file MD sinh ra phải bao gồm 4 phần đầy đủ:

### Phần 1: Hồ Sơ Cơ Bản & Chỉ Số (Stats & Metadata)
- Tên nguyên bản & Tên cảm hứng.
- Nhóm chủng loài độc bản (Species Archetype: Thực vật & Linh dược / Khí tượng & Hiện tượng / Côn trùng & Giáp xác quang năng / Cổ vật & Di khí hoạt hóa).
- Hệ (Primary / Secondary Type).
- Vai trò & Cơ chế di chuyển đặc thù (Grounded, High Jump, Glide, Hover).
- Kỹ năng dã ngoại mở đường (Field Traversal Ability: Mộc Đằng Kiều, Băng Đột Hoạt, Liêu Nguyên Hỏa, Kinh Phong Đới Thiên, Thạch Phá Cương Đoạn).
- Tập tính sinh thái hoang dã & Món ăn dã ngoại ưa thích (Wild Ecology & Camping Synergy).
- Base Stats (Level 1 Foundation): HP, Attack, Defense, Speed, Exp Yield (chuẩn hóa theo `PokemonDataSO`).

### Phần 2: Thiết Kế Kỹ Năng & Đòn Đánh (Moveset & Skills)
- **Skill 1 (Đòn Cơ Bản / Melee)**: Tên chiêu, Loại (Physical/Special), Cooldown, Tầm đánh, Mô tả đòn đánh, Hitbox.
- **Skill 2 (Chiêu Nguyên Tố / Ranged)**: Tên chiêu, Sát thương, Quỹ đạo đạn (Trajectory), Cooldown, Stamina cost.
- **Skill 3 (Chiêu Khống Chế AoE - Stage 1 Lv.16)**: Tác động diện rộng hoặc buff/debuff.
- **Skill 4 (Chiêu Tối Thượng Ultimate - Stage 2 Lv.36)**: Uy lực tối thượng, hiệu ứng rung màn hình.

### Phần 3: Kho Prompt AI Chuẩn Hóa (Copy-Paste Ready ChatGPT CLI)

> **Cấu hình ChatGPT bắt buộc**: luôn chạy model `gpt-6-astra` + mức suy luận `medium` (đã khóa trong `.codex/config.toml` của dự án để tối ưu quota); CLI ảnh trực tiếp dùng `gpt-image-2` quality `high`. Lỗi/hết quota → dừng & báo cáo, cấm âm thầm fallback.
Mỗi prompt bắt buộc phải chứa khối khóa camera và giải phẫu `[SCALE & CAMERA INVARIANT]`:
- **Prompt 01: Concept Lineup (3 Evolutionary Forms)**: Thiết kế diện mạo nguyên bản 3 bậc tiến hóa trên nền trắng.
- **Prompt 02: Idle Keyframes (4 frames rời hoặc 1 slide 4 frame 512x512)**: Nhịp thở sinh học, **mắt phải chớp tự nhiên** (mở to $\rightarrow$ nhắm $\rightarrow$ mở lại), **tai rung, đuôi uốn lượn theo nhịp thở**; cấm mắt trợn trừng đờ đẫn.
- **Prompt 03: Run Keyframes (Canvas 768x512 cho từng frame rời)**: Bước chạy 4 chân phi nước đại (Gallop), tai rạp nhẹ lướt gió, chân cắm chặt baseline $Y=486$. **KHÓA CHẶT ĐẦU VÀ MẮT TO BẰNG 100% IDLE**.
- **Prompt 04: Jump Keyframes (Canvas 768x512, 4-5 frames)**: Pha nhún đà $\rightarrow$ Bật vọt $\rightarrow$ Đạt đỉnh $\rightarrow$ Tiếp đất giảm chấn.
- **Prompt 05: Skill Cast Body (Chuẩn 4-Frame Horizontal Strip Standard, Mục 3.1 AGENTS.md)**: Đúng 4 pha: `F0 Anticipation` $\rightarrow$ `F1 Peak Cast Roar (Miệng mở to gầm vang uy lực, nhe nanh sắc)` $\rightarrow$ `F2 Recoil giật lùi` $\rightarrow$ `F3 Recovery về Idle`.
- **Prompt 06: Skill VFX Isolated (Decoupled VFX)**: Hiệu ứng đạn nguyên tố hoặc tia điện/vệt chém độc lập trên nền đen/trắng bóc alpha.
- **Prompt 07: Hurt & Faint**: Hurt giật lùi nhắm nghiền mắt, Faint gục ngã/nhắm mắt.

### Phần 4: Unity Technical Specs & Implementation Contract
- Kích thước texture: $512 \times 512$ (cho Idle, Cast, Hurt, Faint) hoặc $768 \times 512$ (cho Run, Jump, Dash).
- PPU: `512` (Stage 1/2) hoặc `724` (Stage 3).
- Pivot point: `Center (0.5, 0.5)` kết hợp hệ thống `PokemonVisualGrounding` tự động bám sàn theo alpha hull.
- Filter Mode: `Point (no filter)`.
- Compression: `None` (RGBA 32-bit uncompressed).
- File asset đường dẫn đích:
  - **Hồ sơ thiết kế:** `design/pets/<element>/<pet-id>.md`
  - **Ảnh nguồn asset:** `design/assets/pets/<element>/<pet-id>/stage{1,2,3}/`
  - **Asset Unity:** `Assets/Art/Pokemons/<PetName>/...` và ScriptableObject `Assets/GameData/Pokemons/<PetName>.asset`.

## 4. Gate và bàn giao bước tiếp theo

Trả hồ sơ/prompt và verdict riêng từng gate `PASS / CONCERNS / FAIL / BLOCKED / NOT RUN`, kèm evidence thực tế; không gọi `Production Ready` từ hồ sơ khi import/runtime chưa kiểm chứng. Không tự tạo GIF preview.

Kết thúc bằng handoff cho **PM**: exact output file `design/pets/<element>/<pet-id>.md` đã giải quyết thành path cụ thể (hoặc `không có file — trả trong chat` nếu chưa được duyệt lưu); owner bước tiếp theo; input hồ sơ/concept/stage; acceptance hồ sơ đủ bốn phần, tên Việt hoá và body–VFX/alpha contract; remaining gates asset generation/review/import/runtime cùng verdict. PM cập nhật `active.md` và quyết định dispatch; skill không tự mở follow-up, generate hay auto-import.
