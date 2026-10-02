---
name: create-pet-animation-set
description: "Tạo trọn bộ sprite body animation production cho một Pet từ concept đã chọn. Tự động dùng khi người dùng nói tạo full frame, full animation, đủ bộ frame hoặc tạo toàn bộ sprite cho một Pet/stage."
argument-hint: "[pet-id hoặc concept, stage; ví dụ: pet-lam-trieu stage1]"
user-invocable: true
---

# /create-pet-animation-set — Full Body Animation Set

Biến một concept đã được chọn thành bộ sprite body hoàn chỉnh, có thể kiểm định và ghép Unity. Không dùng concept lineup như sprite runtime.

## Nghĩa chuẩn của “full frame”

Nếu người dùng không nói khác, `full frame` nghĩa là **một evolution stage** và gồm đúng 8 PNG horizontal strip độc lập:

| Sheet | Frame | Nội dung tối thiểu |
|---|---:|---|
| Idle | 4 | Neutral → inhale → secondary motion → settle |
| Run | 6 | Contact/compression/push-off đối xứng, loop kín |
| Jump | 5 | Anticipation → launch → apex → descent → landing |
| Skill 1 body | 5 | Anticipation → release → peak → recoil → recovery |
| Skill 2 body | 5 | Anticipation → charge → release → recoil → recovery |
| Skill 3 body | 6 | Pha đặc thù theo GDD, có release/VFX trigger rõ |
| Skill 4 body | 7 | Charge lớn → release → sustain/peak → recoil → recovery |
| Hurt/Faint | 6 | Hurt → recoil → stagger → collapse → faint → faint hold |

Tổng mặc định: **8 sheet / 44 frame body**. `Full evolution line` phải được yêu cầu rõ và lặp bộ này cho từng stage. VFX, concept, portrait, icon và UI không thuộc “full frame body”; tạo riêng khi người dùng yêu cầu.

## Nguồn sự thật và lựa chọn concept

1. Đọc hồ sơ `design/pets/<element>/<pet-id>.md`, Art Bible và concept candidates.
2. Nếu có nhiều concept, review và chọn đúng một source canonical; nêu lý do. Giữ nguyên bản không chọn, không ghi đè.
3. Dùng đúng form của stage được yêu cầu trong concept lineup. Không pha đặc điểm giữa các stage.
4. Nếu hồ sơ thiếu breakdown của action/skill, bổ sung vào hồ sơ trước khi tạo ảnh; không tự bịa chuyển động trái moveset.

## Hợp đồng tạo ảnh

- Tạo **mỗi action bằng một lần image generation riêng**, dùng concept canonical làm identity reference.
- Mỗi prompt phải mô tả từng frame, không dùng mô tả chung chung.
- True 2D orthographic side profile, luôn facing right, scale nhân vật ổn định.
- Mỗi sheet là một hàng ngang với số cell bằng số frame; mọi cell bằng nhau, có safe padding và không để silhouette chạm ranh giới.
- Grounded frame dùng chung baseline; animation in-place phải khóa root/pelvis.
- PNG có alpha thật `A = 0`, clean alpha edge, không nền, bóng sàn, chữ, nhãn, grid hoặc watermark.
- Pixel art dùng hard integer clusters, không blur/anti-alias. Body không chứa projectile, beam, splash, elemental trail, impact hoặc VFX khác.
- Không tự tạo GIF preview.

## Tên và vị trí source

Lưu không phá hủy vào `design/assets/pets/<element>/<pet-id>/stageN/`:

```text
spr_<pet-id>_idle.png
spr_<pet-id>_run.png
spr_<pet-id>_jump.png
spr_<pet-id>_skill_1_<slug>.png
spr_<pet-id>_skill_2_<slug>.png
spr_<pet-id>_skill_3_<slug>.png
spr_<pet-id>_skill_4_<slug>.png
spr_<pet-id>_hurt_faint.png
```

Nếu tên đã tồn tại, tạo hậu tố `-v2`, `-v3` cho đến khi bản mới vượt review gate; chỉ thay canonical sau khi được duyệt.

## Review gate và hoàn tất

Review từng sheet theo `$review-art`. Một bộ chỉ được gọi là hoàn tất khi:

- đủ đúng 8 sheet/44 frame;
- identity, anatomy, palette và hướng nhìn khớp concept;
- frame count, cell, padding, baseline và loop đạt;
- alpha/halo và body–VFX separation đạt;
- file được lưu trong workspace và báo rõ verdict từng sheet.

`Reference Approved` chưa đồng nghĩa `Production Ready`. Chỉ ghép Unity khi sheet đã qua xử lý/slice, TextureImporter đúng chuẩn, reference runtime đã cập nhật và test/import thực sự được xác minh.
