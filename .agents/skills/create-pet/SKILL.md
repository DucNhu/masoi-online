---
name: create-pet
description: "Tạo file hồ sơ thiết kế chi tiết (GDD specs, chỉ số, moveset, AI prompts copy-paste ready) cho một Pet/Pokemon dựa theo mô tả hoặc hình tượng."
argument-hint: "[mô tả/hình tượng pet, ví dụ: 'pikachu hệ điện', 'charmander hệ lửa']"
user-invocable: true
allowed-tools: Read, Write, AskUserQuestion
---

# /create-pet — Quy Trình Tự Động Tạo Hồ Sơ Pet Chuẩn Game Studio

Kỹ năng này chịu trách nhiệm khởi tạo một file hồ sơ Pet hoàn chỉnh đặt tại `design/pets/<pet-id>.md`.
File này đóng vai trò **Single Source of Truth** kết nối giữa:
1. **Game Designer (GDD & Chỉ số)**: Species, Type, Base Stats, Progression, Moveset (`PokemonDataSO`, `MoveDataSO`).
2. **AI Art Producer (Prompt Generator)**: Bộ prompt copy-paste ready cho ChatGPT/Midjourney (Identity, Idle, Run, Jump, Attack, Hurt, Faint, VFX).
3. **Unity Technical Artist / Gameplay Programmer**: Import specs, cell size, anchor, PPU, hitbox, animation contracts.

---

## 1. Quy Trình Kích Hoạt & Thu Thập Dữ Liệu

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

---

## 2. Tiêu Chuẩn Kỹ Thuật Bắt Buộc Trong File MD Sinh Ra

Mọi file `design/pets/<pet-id>.md` PHẢI tuân thủ nghiêm ngặt:
- **PPU (Pixels Per Unit)**: 32 (1 mét Unity = 32 pixels).
- **Camera Angle**: True 2D Orthographic Side-View, Facing Right.
- **Background**: Transparent background với alpha thật (`A = 0`), clean alpha edges và không đổ bóng sàn. Chỉ fallback sang solid pure white (`#FFFFFF`) khi generator không hỗ trợ alpha; khi đó bắt buộc chạy Smart Edge Defringe & Color Bleeding và kiểm tra white halo trước khi import Unity.
- **Canvas / Cell Size**: 
  - Base Form / Tier 1: $64 \times 64\text{ px}$.
  - Mature / Tier 2: $64 \times 64\text{ px}$ hoặc $96 \times 96\text{ px}$.
  - Ultimate / Tier 3: $96 \times 96\text{ px}$ hoặc $128 \times 128\text{ px}$.
- **Tách biệt Animation Body và Skill VFX**:
  - `Attack_Body`: Chỉ chứa chuyển động cơ thể (lunge, bite, slash motion, recovery) — **KHÔNG bake hiệu ứng lửa/điện/nước vào sprite body**.
  - `Skill_VFX`: Projectile và Impact được xuất thành sprite sheet VFX riêng biệt ($32 \times 32$ hoặc $48 \times 48\text{ px}$).

---

## 3. Cấu Trúc Chuẩn Của File `design/pets/<pet-id>.md`

Mỗi file MD sinh ra phải bao gồm 4 phần đầy đủ:

### Phần 1: Hồ Sơ Cơ Bản & Chỉ Số (Stats & Metadata)
- Tên nguyên bản & Tên cảm hứng.
- Hệ (Primary / Secondary Type).
- Vai trò & Cơ chế di chuyển đặc thù (Grounded, High Jump, Glide, Hover).
- Base Stats (Level 1 Foundation): HP, Attack, Defense, Speed, Exp Yield (chuẩn hóa theo `PokemonDataSO`).

### Phần 2: Thiết Kế Kỹ Năng & Đòn Đánh (Moveset & Skills)
- **Skill 1 (Đòn Cơ Bản / Melee)**: Tên chiêu, Loại (Physical/Special), Cooldown, Tầm đánh, Mô tả đòn đánh, Hitbox.
- **Skill 2 (Chiêu Nguyên Tố / Ranged)**: Tên chiêu, Sát thương, Quỹ đạo đạn (Trajectory), Cooldown, Stamina cost.
- **Skill 3 (Chiêu Khống Chế AoE - Stage 1 Lv.16)**: Tác động diện rộng hoặc buff/debuff.
- **Skill 4 (Chiêu Tối Thượng Ultimate - Stage 2 Lv.36)**: Uy lực tối thượng, hiệu ứng rung màn hình.

### Phần 3: Kho Prompt AI Chuẩn Hóa (Copy-Paste Ready ChatGPT & Midjourney)
- **Prompt 01: Concept Lineup (3 Evolutionary Forms)**: Thiết kế diện mạo nguyên bản, không vi phạm bản quyền gốc.
- **Prompt 02: Sprite Sheet Idle (4 frames, Loop)**: Nhịp thở, chuyển động tai/đuôi/lông, cell 64x64.
- **Prompt 03: Sprite Sheet Run (6 frames, Loop)**: Bước chạy nhịp nhàng, khóa root và baseline (với Chim/Cá/Ma: thay bằng bay lượn/bơi uốn sóng/lơ lửng).
- **Prompt 04: Sprite Sheet Jump (4 frames)**: Frame 1 Anticipation $\rightarrow$ Frame 2 Rise $\rightarrow$ Frame 3 Peak/Float $\rightarrow$ Frame 4 Landing/Recover.
- **Prompt 05: Sprite Sheet Skill Cast / Attack Body (5 frames, Decoupled)**: Tuân thủ Mục 19 `design-prompts.md` theo đúng Archetype sinh học của Pet:
  - *Bipedal (2 chân):* Cào chém lunge hoặc gồng ngực há miệng gầm phóng đạn.
  - *Avian (Chim bay):* Co vuốt bổ nhào hoặc giương cánh quạt luồng gió.
  - *Aquatic (Cá bơi):* Uốn lưng quất đuôi hoặc phồng mang phụt luồng nước.
  - *Quadruped (Thú 4 chân):* Bật 4 chân vồ mồi hoặc dậm móng quất đuôi phóng năng lượng.
  - *Floating (Bóng ma):* Co rút đớp cắn hoặc phình to đẩy xung khí ma.
  - *Quy tắc 5 pha:* `F1: Anticipation` $\rightarrow$ `F2: Release (VFX Trigger)` $\rightarrow$ `F3: Peak Extension` $\rightarrow$ `F4: Recoil/Hãm` $\rightarrow$ `F5: Recovery`.
- **Prompt 06: Skill VFX Sheet (Isolated VFX, 4-6 frames)**: Hiệu ứng đạn nguyên tố hoặc tia điện/tia lửa độc lập.
- **Prompt 07: Sprite Sheet Hurt & Faint (5-6 frames)**: Hurt giật lùi, Faint gục ngã/nhắm mắt.

### Phần 4: Unity Technical Specs & Implementation Contract
- Kích thước cell cắt sprite (`Grid by Cell Size`).
- Pivot point: `Bottom Center (0.5, 0.0)` cho pet đứng đất hoặc `Center (0.5, 0.5)` cho chim/cá/ma.
- Filter Mode: `Point (no filter)`.
- Compression: `None`.
- File asset đường dẫn đích:
  - **Hồ sơ thiết kế:** `design/pets/<element>/<pet-id>.md` (ví dụ: `design/pets/fire/pet-fire-a.md`)
  - **Ảnh nguồn asset:** `design/assets/pets/<element>/<pet-id>/stage{1,2,3}/`
  - **Asset Unity:** `Assets/Art/Pokemons/<PetName>/...` và ScriptableObject `Assets/GameData/Pokemons/<PetName>.asset`.
