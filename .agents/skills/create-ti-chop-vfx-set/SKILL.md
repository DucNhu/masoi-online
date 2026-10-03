---
name: create-ti-chop-vfx-set
description: "Tạo, review và ghép trọn bộ bốn VFX kỹ năng riêng biệt cho Tí Chớp Stage 1. Dùng khi người dùng yêu cầu VFX, hiệu ứng chiêu, điện cầu, vòng điện, vệt lao hoặc thiên lôi của Tí Chớp; không dùng để tạo body animation."
allowed-tools: "exec_command, apply_patch, view_image, imagegen"
metadata:
  argument-hint: "[prompt-only | generate | review | integrate]"
  user-invocable: "true"
---

# /create-ti-chop-vfx-set — Bộ VFX kỹ năng Tí Chớp

Tạo bốn bộ hiệu ứng điện độc lập cho Tí Chớp Stage 1 dựa trên moveset trong `design/pets/electric/pet-electric-a.md`. Cảm hứng cơ chế có thể đến từ fantasy electric mascot combat như lao nhanh, điện cầu, phóng điện diện rộng và gọi sét; tên gọi, silhouette, nhịp hiệu ứng và asset phải là thiết kế nguyên bản của Tí Chớp.

## Phạm vi, quyền ghi và công cụ

- Đọc `production/session-state/active.md` trước kế hoạch; PM sở hữu memory, executor chỉ trả handoff. Giữ nguyên sáu sheet/frame/FPS/trigger đã biết bên dưới; không tự redesign moveset/GDD.
- Trước mutation, trình bày exact intended paths và kiểm tra approval task: chỉ scope đã nêu được phép ghi; không hỏi lại phần đã duyệt, hỏi nếu thiếu quyền/mở rộng scope. Prompt-only/read-only review không cho phép lưu/sửa GDD, generate, normalize hay integrate. Approval generate không tự bao phủ integration.
- Nếu stage/concept/source hoặc mode chưa rõ, hỏi trước bước phụ thuộc; không tự regenerate/overwrite hoặc đổi canonical. Giữ candidate và thay đổi người dùng.
- Dùng `exec_command` đọc/kiểm tra, `view_image` xem source local, `apply_patch` sửa văn bản đã duyệt, `imagegen` (tool `image_gen.imagegen` nếu phiên cung cấp) cho generation/edit ảnh được yêu cầu. Kiểm tra capability/source trước khi gọi; `allowed-tools` chỉ là thông tin, không cấp quyền hoặc bảo đảm tool tồn tại.
- Hỏi bằng `functions.request_user_input_async` nếu phiên cung cấp; `functions.request_user_input` chỉ cho câu hỏi tùy chọn trong Plan mode. Không có tool hỏi hoặc cần approval thì hỏi trực tiếp trong chat. App approval chỉ qua cơ chế ứng dụng, không chuyển việc để bypass sandbox.
- Thiếu generation tool/source/licensing thì bước phụ thuộc `BLOCKED`; không retry GUI khi blocker chưa đổi, không cài tool hoặc dùng fallback trả phí. Bàn giao prompt sẵn có không thay evidence asset/import/runtime.

## Phạm vi chuẩn

| Skill | Asset VFX | Cấu trúc mặc định | Điểm phát |
|---|---|---:|---|
| Cú Lao Chớp Nhoáng | Vệt lao + chớp va chạm | 5 frame trail + 4 frame impact | socket vai/đuôi; impact tại hit point |
| Phóng Tia Điện Cầu | Điện cầu bay + nổ điện | 4 frame loop + 5 frame impact | socket miệng |
| Vòng Xung Điện Làm Choáng | Vòng xung điện lan tròn | 6 frame one-shot | pivot giữa thân |
| Thiên Lôi Thức Tỉnh | Cột sét + va chạm mặt đất | 7 frame one-shot cho mỗi cột | target ground position |

Mỗi phần có nhịp hoặc pivot khác nhau phải là sheet/prefab riêng. Không vẽ Tí Chớp hoặc bất kỳ body nhân vật nào vào VFX.

## Hợp đồng hình ảnh

- Phong cách khớp Tí Chớp: lõi trắng-vàng, cyan điện, xanh lam đậm ở biên; silhouette sắc, dễ đọc trên cả nền sáng và tối.
- PNG có alpha thật (`A = 0`), clean alpha edges, không nền, chữ, nhãn, grid, watermark hoặc bóng sàn.
- Mỗi sheet là một hàng ngang; cell bằng nhau, hiệu ứng nằm trọn trong safe padding và không chạm biên.
- Projectile/vệt lao dùng pivot `Center (0.5, 0.5)`; va chạm mặt đất/cột sét dùng `Bottom Center (0.5, 0.0)`; vòng xung dùng `Center (0.5, 0.5)`.
- Không dùng blur ảnh, bloom bake quá rộng hoặc gradient mờ làm mất cạnh pixel. Glow runtime là lớp vật liệu riêng nếu cần.
- Không sao chép icon, silhouette tia sét, animation timing hoặc tên chiêu độc quyền từ Pokémon. Không đưa Pikachu vào prompt tạo ảnh; dùng Tí Chớp và mô tả cơ chế nguyên bản.
- Không tự tạo GIF preview.

## Breakdown bắt buộc

### 1. Cú Lao Chớp Nhoáng

**Trail — 5 frame, one-shot, 14 FPS:** mồi sáng nhỏ → vệt kéo dài → cực đại → đứt thành nhánh → tan sạch. Vệt chạy ngang sang phải, đầu phát sáng gần socket vai/đuôi, không chứa silhouette cơ thể.

**Impact — 4 frame, one-shot, 16 FPS:** điểm chạm nén → flash hình sao lệch → tia ngắn bung ra → hạt điện tắt. Giữ vùng sát thương đọc được nhưng không che toàn bộ mục tiêu.

Trigger trail tại Skill 1 body F2; impact chỉ phát khi hit được xác nhận.

### 2. Phóng Tia Điện Cầu

**Projectile — 4 frame loop, 12 FPS:** lõi năng lượng quay, hai cung điện đổi pha và hạt điện quay quanh; tâm và bán kính không rung để collider ổn định.

**Impact — 5 frame, one-shot, 15 FPS:** lõi co → flash → vòng điện bung → các nhánh đứt → tàn điện biến mất hoàn toàn.

Spawn projectile tại Skill 2 body F3 từ socket miệng. Impact thay projectile khi trúng hoặc hết tầm; không chạy đồng thời hai object sau va chạm.

### 3. Vòng Xung Điện Làm Choáng

**Radial pulse — 6 frame, one-shot, 12 FPS:** lõi nén quanh pivot → vòng nhỏ xuất hiện → vòng mở rộng → bán kính cực đại rõ → cung điện phân rã → alpha về 0. Vòng phải đối xứng quanh pivot và để trống phần giữa đủ nhìn thấy Pet.

Spawn tại Skill 3 body F4. Bán kính gameplay lấy từ dữ liệu chiêu, không suy ra từ kích thước texture; prefab được scale theo cấu hình.

### 4. Thiên Lôi Thức Tỉnh

**Thunder pillar — 7 frame, one-shot, 14 FPS:** marker điện mảnh tại đất → tia dẫn từ trên xuống → cột sét chạm đất → flash cực đại → nhánh sét phụ → dư điện co lại → tắt sạch. Canvas dọc, đầu trên có safe padding và chân cột khóa tại ground pivot.

Spawn ba instance tại Skill 4 body F5 theo ba target ground positions. Screen shake là phản hồi runtime riêng, không bake vào sheet. Mỗi instance phải tự kết thúc hoặc trả về pool sau frame cuối.

## Chế độ thực hiện

- `prompt-only`: trả bốn prompt hoàn chỉnh, mỗi prompt mô tả từng frame, canvas, alpha, pivot, màu và negative constraints.
- `generate`: tạo source theo từng asset độc lập; không gom cả bốn skill vào một ảnh.
- `review`: dùng rubric của `review-art`, kiểm tra frame count, timing, alpha/halo, cell boundary, pivot và khả năng đọc trên nền sáng/tối.
- `integrate`: lưu source dưới `design/assets/vfx/electric/ti-chop/`, xuất frame runtime vào `Assets/Art/VFX/Electric/TiChop/`, tạo prefab và liên kết với `MoveDataSO.vfxPrefab` hoặc event VFX tương ứng.

Nếu người dùng chỉ nói “tạo VFX Tí Chớp”, mặc định bắt đầu bằng `prompt-only` cho cả bốn bộ. Chỉ generate ảnh hoặc thay đổi Unity khi người dùng yêu cầu rõ.

## Tên source canonical

```text
design/assets/vfx/electric/ti-chop/
  vfx_ti-chop_skill_1_dash-trail.png
  vfx_ti-chop_skill_1_impact.png
  vfx_ti-chop_skill_2_electric-orb.png
  vfx_ti-chop_skill_2_impact.png
  vfx_ti-chop_skill_3_radial-pulse.png
  vfx_ti-chop_skill_4_thunder-pillar.png
```

Không ghi đè source chưa duyệt. Dùng hậu tố `-v2`, `-v3`; chỉ chuyển thành canonical sau review gate.

## Unity và điều kiện hoàn tất

- `Texture Type = Sprite (2D and UI)`, `Sprite Mode = Multiple`, `Filter Mode = Point`, `Compression = None`, `alphaIsTransparency = true`.
- Chạy Smart Edge Defringe & Color Bleeding và halo gate trước khi bind runtime.
- Projectile loop; impact, pulse và thunder pillar phát một lần rồi `Auto-Destroy on Animation Finish` hoặc trả về Object Pool.
- Body animation chỉ gửi trigger; gameplay damage/hit/stun không phụ thuộc frame ảnh VFX.
- Xác minh đúng socket, pivot, sorting layer, timing, lifecycle và reference `MoveDataSO` bằng test hoặc Play Mode. Không báo `Production Ready` nếu chưa kiểm tra import/runtime thực tế.

Bộ VFX hoàn tất khi đủ sáu source canonical ở trên, từng sheet qua review, prefab không rò rỉ object và cả bốn skill kích hoạt đúng frame body đã định nghĩa.

## Bàn giao bước tiếp theo

Báo từng gate source/frame/pivot/alpha/halo/separation/import/binding/trigger/lifecycle/runtime bằng `PASS / CONCERNS / FAIL / BLOCKED / NOT RUN`, kèm evidence. Kết thúc bằng handoff cho **PM**: exact output paths sáu sheet hoặc runtime/prefab đã tạo trong scope (nêu version thực, không chỉ thư mục; `không có file — prompt/review trong chat` khi read-only); owner bước tiếp theo; input GDD Tí Chớp Stage 1/source manifest; acceptance sáu sheet cho bốn skill, frame/FPS/pivot/trigger và cleanup đúng contract; remaining gates/blocker. PM cập nhật memory và quyết định dispatch; skill không tự mở follow-up hay auto-import.
