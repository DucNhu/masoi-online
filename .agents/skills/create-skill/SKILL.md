---
name: create-skill
description: "Tạo bộ 4 kỹ năng combat cho Pet được nêu rõ và stage đã chốt, gồm body cast và VFX decoupled. Dùng khi yêu cầu full bộ chiêu của Pet; không dùng để tạo/chỉnh AI skill hay SKILL.md."
allowed-tools: "exec_command, apply_patch, view_image, imagegen"
metadata:
  argument-hint: "[pet-id, stage; prompt-only | generate | integrate]"
  user-invocable: "true"
---

# /create-skill — Full Skill Set cho Pet

## Phạm vi, quyền ghi và công cụ

- Chỉ áp dụng cho bộ chiêu combat Pet, không áp dụng audit/authoring AI skill. Đọc `production/session-state/active.md` trước kế hoạch; PM sở hữu memory, executor trả handoff thay vì sửa `active.md`.
- Trước mutation, trình bày exact intended paths và kiểm tra approval task hiện có: chỉ scope đã nêu được phép ghi; không hỏi lại phần đã duyệt, hỏi nếu thiếu quyền/mở rộng scope. Prompt-only/read-only không cho phép lưu/sửa GDD, generate, normalize hoặc integrate; mỗi mode phải nằm trong yêu cầu đã duyệt.
- Nếu Pet/stage/concept/source/mode chưa rõ, hỏi trước bước phụ thuộc; không tự regenerate, đổi canonical hay overwrite. Giữ stats/moveset/frame contract đã chốt và thay đổi người dùng.
- Dùng `exec_command` đọc/kiểm tra, `view_image` xem source local, `apply_patch` sửa văn bản trong scope và `imagegen` (tool `image_gen.imagegen` nếu phiên cung cấp) cho generation/edit ảnh được yêu cầu. Kiểm tra capability/source trước khi gọi; `allowed-tools` chỉ là thông tin, không cấp quyền hoặc bảo đảm tool tồn tại.
- Dùng `functions.request_user_input_async` nếu phiên cung cấp; `functions.request_user_input` chỉ cho câu hỏi tùy chọn trong Plan mode. Không có tool hỏi hoặc cần approval thì hỏi trực tiếp trong chat. App approval chỉ qua cơ chế ứng dụng, không giao agent khác để bypass sandbox.
- Thiếu generation tool/source/licensing thì bước phụ thuộc `BLOCKED`; không retry GUI khi blocker chưa đổi, không cài tool hoặc dùng fallback trả phí. Prompt có thể bàn giao nhưng không thay evidence source đã tạo/import.

## Quy ước bắt buộc

Trong skill này, **full skill luôn có nghĩa là full cả 4 skill của Pet**, không phải chỉ một skill được chọn. Nếu người dùng nêu một Pet và nói “tạo skill”, “full skill” hoặc “tạo full”, mặc định xử lý đủ Skill 1–4 của stage đang dùng.

Mỗi skill phải có hai lớp tách biệt:

1. **Body cast**: animation của Pet, chỉ mô tả anticipation → release/active → peak → recoil → recovery. Không bake projectile, beam, bụi, lá bay, tia sáng hay impact vào body.
2. **VFX**: asset độc lập để gắn qua prefab/`MoveDataSO.vfxPrefab`, có projectile/impact hoặc pulse/beam tùy cơ chế.

## Quy trình

1. Đọc `production/session-state/active.md`, GDD Pet tại `design/pets/<element>/<pet-id>.md`, concept canonical và moveset.
2. Chốt đúng stage và identity theo input đã duyệt. Nếu có nhiều concept mà canonical chưa rõ, hỏi người dùng để chốt trước generation; giữ các bản khác nguyên trạng.
3. Lập bảng đủ 4 skill: tên, unlock level, loại đánh, body frame count, VFX sheet cần có, pivot, FPS, trigger body frame và lifecycle.
4. Tạo prompt riêng cho từng body sheet và từng VFX sheet. Mô tả từng frame; không dùng prompt chung chung. Dùng concept chỉ làm identity reference, không vẽ Pet vào VFX.
5. Chỉ trong mode generate đã được yêu cầu/duyệt, generate source không phá hủy vào (prompt-only chỉ trả prompt):
   - Body: `design/assets/pets/<element>/<pet-id>/stageN/`
   - VFX: `design/assets/vfx/<element>/<pet-id>/`
6. Review đủ cả 4 skill theo rubric `review-art`: facing, anatomy, frame count, baseline/pivot, alpha/halo, body–VFX separation và readability.
7. Chỉ khi người dùng yêu cầu “ghép”, mới chuẩn hóa cell, xử lý alpha, cấu hình TextureImporter, tạo prefab, bind `MoveDataSO`, kiểm tra lifecycle và chạy test/import. Không báo Production Ready nếu chưa kiểm chứng Unity.

## Mặc định VFX theo loại skill

| Loại | Bộ VFX tối thiểu |
|---|---|
| Melee | trail/slash hoặc contact impact, tách sheet nếu timing khác |
| Projectile | projectile loop + impact one-shot |
| AoE pulse | radial pulse one-shot, pivot Center |
| Beam/ultimate | charge/beam/impact hoặc pillar/ground impact, pivot theo mặt đất |

Mỗi sheet là một hàng ngang, cell bằng nhau, alpha thật `A=0`, Point/Uncompressed khi vào Unity, không nền, chữ, watermark, grid hoặc bóng sàn. VFX phải tự kết thúc hoặc trả về pool sau frame cuối.

## Mầm Gai — cấu hình đã biết

Khi gọi với Mầm Gai Stage 1, full set gồm:

- Skill 1 — Cú Húc Mầm Gai / `Bramble Tackle`: body 5 frame + contact/trail impact.
- Skill 2 — Phóng Gai Hạt Nổ / `Thorn Seed Bomb`: body 5 frame + projectile 4 frame loop + impact 4–5 frame.
- Skill 3 — Bào Tử Mê Ngủ & Hút Hồn / `Sleep Spore Drain`: body 6 frame + radial spore pulse/drain 6 frame.
- Skill 4 — Vạn Cây Trỗi Dậy / `Verdant Solar Cataclysm`: body 7 frame + charge/beam/ground-root impact tách riêng.

Cảm hứng Bulbasaur chỉ được dùng ở mức archetype grass starter, hạt, nụ và gai. Không sao chép tên, silhouette, icon, animation timing hoặc hiệu ứng độc quyền; Mầm Gai vẫn giữ palette, nụ sen gai và anatomy canonical riêng.

## Tên file và hoàn tất

Dùng hậu tố `-v2`, `-v3` nếu source đã tồn tại; không ghi đè source cũ trước review gate và approval thay canonical. Không tự tạo GIF preview. Báo từng gate body/VFX/frame/alpha/halo/import/binding/lifecycle/runtime bằng `PASS / CONCERNS / FAIL / BLOCKED / NOT RUN` kèm evidence; không gọi Production Ready khi import/runtime chưa kiểm chứng.

## Bàn giao bước tiếp theo

Kết thúc bằng handoff cho **PM**: exact output file paths từng body/VFX sheet hoặc prefab đã tạo trong scope (giải quyết Pet/stage/slug/version; `không có file — prompt trong chat` nếu prompt-only); owner bước tiếp theo; input GDD/moveset/canonical source; acceptance đủ Skill 1–4, body–VFX độc lập, đúng frame/trigger/alpha/lifecycle; remaining gates và blocker. PM cập nhật `active.md` và quyết định dispatch; skill không tự mở follow-up hoặc auto-import.
