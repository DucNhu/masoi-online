---
name: review-art
description: "Review, đánh giá kỹ thuật và thẩm mỹ cho asset đồ họa, sprite sheet, animation hoặc concept art 2D theo chuẩn Game Studio và tự động đề xuất prompt tiếp theo."
allowed-tools: "exec_command, view_image, apply_patch"
metadata:
  argument-hint: "[ảnh hoặc đường dẫn ảnh cần review]"
  user-invocable: "true"
---

# /review-art — Quy Trình Review Asset Đồ Họa & Sprite Sheet Chuẩn Game Studio

Kỹ năng này thực hiện quy trình kiểm tra toàn diện (QA Audit & Visual Review) đối với các asset 2D (concept lineup, sprite sheet Idle, Run, Jump, Attack, VFX...) nhằm đảm bảo asset sẵn sàng import Unity mà không bị lỗi runtime.

## Phạm vi, quyền ghi và công cụ

- Mặc định **read-only**, trả review và prompt trong chat; không tự generate, chỉnh ảnh, lưu báo cáo, sửa GDD hoặc import. Đọc `production/session-state/active.md` trước kế hoạch; PM sở hữu memory, executor trả handoff thay vì sửa file đó.
- Nếu có yêu cầu lưu báo cáo, trình bày exact intended output path trước mutation và đối chiếu approval hiện có: chỉ scope đã nêu được phép ghi, không hỏi lại phần đã duyệt; hỏi nếu thiếu quyền/mở rộng scope. Yêu cầu review/prompt không cấp quyền saving/modifying/generating/integrating; khuyến nghị trong verdict cũng không cấp quyền thực thi.
- Dùng `exec_command` đọc/đo không ghi file, `view_image` xem source local, `apply_patch` chỉ để lưu văn bản khi được duyệt. `allowed-tools` chỉ là thông tin, không cấp quyền hoặc bảo đảm tool có sẵn. `imagegen` (`image_gen.imagegen` nếu phiên cung cấp) dành cho task generation/edit riêng đã được yêu cầu, không gọi tự động từ review.
- Hỏi bằng `functions.request_user_input_async` nếu phiên cung cấp; `functions.request_user_input` chỉ cho câu hỏi tùy chọn trong Plan mode. Không có tool hỏi hoặc cần approval thì hỏi trực tiếp trong chat. App approval chỉ qua cơ chế ứng dụng, không chuyển việc để bypass sandbox.
- Nếu stage/concept/source/scope chưa rõ, hỏi trước kết luận phụ thuộc; không tự chọn canonical, regenerate hay overwrite. Thiếu source/tool/licensing thì gate phụ thuộc `BLOCKED`; không retry GUI khi blocker chưa đổi, không cài tool hoặc dùng fallback trả phí.

---

## 1. Tiêu Chí Đánh Giá 7 Trụ Cột (7-Pillar Review Rubric)

Mỗi lần review một ảnh hoặc sprite sheet, AI phải thẩm định qua 7 tiêu chí:

### 1. Trắc diện & Hướng nhìn (Camera & Facing Direction)
- [ ] Góc nhìn 2D Orthographic phẳng hoàn toàn (True side profile, không chéo 2.5D, không isometric, không top-down).
- [ ] Hướng quay mặt: Luôn quay mặt sang phải (**Facing Right**) chuẩn xác.

### 2. Đường chân & Trọng tâm (Baseline & Anchor Consistency)
- [ ] **Độ lệch Baseline ($\Delta Y$):** Chân của nhân vật có chạm cùng một đường nằm ngang cố định xuyên suốt mọi frame không? (Dung sai $\le 1\text{px}$).
- [ ] **Trôi trọng tâm ($\Delta X$):** Nhân vật có diễn hoạt tại chỗ (in-place) không? Thân người/pelvis có bị trôi dạt (drift) lệch sang trái/phải bất thường không?
- [ ] **Khóa bàn chân cố định (Zero Foot Sliding — Tiêu chuẩn chốt 2026-10-12):** Trong các hoạt ảnh diễn hoạt tại chỗ (Idle, Cast, Charge), 4 bàn chân có cắm chặt cố định 100% xuống mặt sàn không? Tuyệt đối cấm hiện tượng bàn chân bị trôi dạt sang ngang, co duỗi hay trượt chân giữa các frame.

### 3. Nhịp điệu & Pha hành động (Action Breakdown & Readability)
- [ ] **Độ rõ của các pha:** Phân rõ Anticipation (Lấy đà) $\rightarrow$ Active (Ra đòn/Bật nhảy) $\rightarrow$ Follow-through $\rightarrow$ Recovery $\rightarrow$ Loop.
- [ ] **Silhouette Readability:** Hình bóng nhân vật có rõ ràng, dễ nhận diện ở độ phân giải nhỏ ($64 \times 64\text{ px}$) không?

### 4. Quy chuẩn Pixel Art & Nền (Pixel Grid & Background)
- [ ] **Độ sắc nét:** Điểm ảnh vuông sắc cạnh (crisp integer pixels), không bị mờ nhòe (anti-aliasing/blur/bilinear filter).
- [ ] **Đường viền (Outline):** Viền tối màu $1-2\text{px}$ bao quanh cơ thể rõ ràng.
- [ ] **Đồng bộ Phong cách Chuẩn Mực (Visual Benchmark Alignment — 2026-10-27 & 2026-11-08):** Mọi asset bối cảnh, địa hình, nhân vật và quái vật phải đối chiếu thẩm mỹ đồng bộ với [`stage_chatgpt_02_bamboo_meadow_encounter.png`](file:///Users/duc/my-projects/pokemon-combat/design/assets/chatgpt_concepts/stage_chatgpt_02_bamboo_meadow_encounter.png) (2D Anime Cel-Shaded Solarpunk Việt Nam, ánh sáng ấm áp 12h trưa Ghibli, thảm cỏ xanh non bo tròn dễ thương, bục tre/gỗ và bậc đá lát tự nhiên vững chắc).
- [ ] **Thiết Quân Luật Cấm Tuyệt Đối Vẽ Dính Nhân Vật / Linh Thú Lên Tranh Bối Cảnh (Zero Baked-In Characters/Pets on Stage & Encounter Backgrounds):**
  - Bản chuẩn mực `stage_chatgpt_02_bamboo_meadow_encounter.png` và 100% tranh bối cảnh màn chơi (`stage_concept_*`, `stage_encounter_*`) **TUYỆT ĐỐI CẤM** vẽ dính con người (Trainer), Linh thú đồng hành hay quái vật lên tranh nền tĩnh (tránh tuyệt đối việc AI tự ý bịa ra nhân vật mặc đồ cổ trang hoặc cáo lá nhái Leafeon). Bối cảnh phải sạch 100% không nhân vật / không thú vật.
  - **Địa Hình Liền Khối Vững Chắc 100% (Zero Floating Sky Rocks):** Mọi thềm nhảy địa hình trong tranh chuẩn mực và tranh màn chơi bắt buộc có chân đế/trụ đá liền khối chạm đất hoặc lòng suối, hoặc bục tre có trụ cắm đáy; tuyệt đối không có hòn đảo đá nào bay lơ lửng giữa không trung.
  - **Dàn Dựng Chạm Trán Thực Chuẩn Quy Cách:** Mọi ảnh "Phối cảnh chạm trán / Luồng sinh thái quái" của bản đồ bắt buộc phải dàn dựng trong Unity Scene bằng Sprite Nhân vật thật + Linh thú thật của dự án + Quái vật thật có tách nền và bóng đổ DynamicDropShadow, hoặc là tranh phân tầng địa hình sạch 100% không dính nhân vật.
- [ ] **Phông nền & Pipeline AI Phối Hợp (AI Creation & Refinement Pipeline — 2026-10-27):** Toàn bộ asset gốc mới do **ChatGPT CLI (`codex exec`)** đảm nhiệm sinh ảnh thô; các khâu làm mịn, tinh chỉnh chi tiết, và bóc tách nền do **Recraft AI (`tools/generate_with_recraft.py`)** đảm nhiệm (`removeBackground` hoặc xuất Vector SVG `recraftv4_1_vector`). Nghiêm cấm dùng script python flood-fill/threshold thủ công cũ. Yêu cầu alpha thật (`A = 0`), clean edges, không bóng đổ sàn, 0% halo viền trắng, bảo toàn 100% màu trắng cơ thể và trang phục (`A = 255`).
- [ ] **Truy vết Quota Recraft vào Jira Task:** Mọi lệnh tinh chỉnh asset qua Recraft API bắt buộc ghi nhận số API Units tiêu tốn và số dư còn lại vào comment của Jira Task tương ứng (`python tools/jira_task.py comment <KEY> "..."`).
- [ ] **Phân biệt Màu Cơ Thể (Body White) vs Khoảng Trống Giữa Các Bộ Phận Chạm Nhau (Negative Space Gap):**
  - **Màu cơ thể & Trang phục (Body Anatomy & Clothing):** Thân, mặt, đốm lông, ngực, bụng, tròng mắt, áo thun, tất, giày có màu trắng là **hoàn toàn đúng thiết kế**, giữ nguyên 100% độ đục, nghiêm cấm đục thủng hay xóa nhầm.
  - **Khoảng trống tạo bởi các bộ phận chạm nhau:** Khi các bộ phận cơ thể (như tai chạm vào đuôi, chân chạm chân, tay chạm hông) tiếp xúc/nối với nhau tạo thành khoảng trống/lỗ hổng ở giữa, khoảng trống đó là background xuyên thấu và **bắt buộc phải trong suốt hoàn toàn (Alpha = 0)**.
  - **Điều kiện Regenerate:** Nếu AI vẽ các bộ phận dính chùm dị dạng hoặc khoảng trống giữa tai-đuôi-chân bị bít kín mảng trắng lỗi không thể tách nền sạch tự nhiên $\rightarrow$ **Đánh giá REJECT và yêu cầu RENDER LẠI (REGENERATE)**.
- [ ] **Kiểm Tra Khoang Kín (Enclosed Cavities & Handle Loops):**
  - Đối với Item/Prop có quai cầm (cúp, giỏ, bình, tù và), dải lụa buông, cuống lá, đuôi cuộn, vệt xoáy năng lượng VFX: Phần không gian rỗng bên trong quai/vòng lặp có đạt trong suốt 100% (`A = 0`) không?
  - Bắt buộc kiểm tra ảnh trên nền **Dark Checkerboard** để phát hiện mảng trắng canvas bị kẹt. Nếu còn mảng trắng $\ge 20\text{px}$ $\rightarrow$ Kết luận `Reject / Regenerate qua Recraft AI`, không để lọt đến người dùng.
- [ ] **Soi Lỗi Baked-In Border / Frame Trên Asset UI & Icon (Zero Baked-in Frames — Tiêu chuẩn 2026-11-09):**
  - Đối với mọi asset UI, icon kỹ năng, vật phẩm (item), huy hiệu (badge), avatar: AI có tự tiện vẽ dính thêm khung viền hình chữ nhật, viền bo tròn, hay khung hoa văn trang trí vào ảnh không?
  - Asset bắt buộc phải là biểu tượng/vật thể độc lập (standalone cutout) trên nền trong suốt `Alpha = 0`.
  - Nếu phát hiện viền khung bị nướng chết vào ảnh $\rightarrow$ **Đánh giá REJECT / REGENERATE ngay**, bổ sung chỉ thị `borderless, frameless, no decorative frame, no outer border, no card frame, no bounding box` vào prompt tạo lại.
- [ ] **Soi toàn diện 5 vùng body của từng khung ảnh (Full-Body Granular Visual Audit — Tiêu chuẩn tối thượng 2026-10-13):**
  - **TUYỆT ĐỐI CẤM REVIEW QUA LOA HOẶC CHỈ DỰA VÀO TOOL TỰ ĐỘNG.** Bắt buộc mở ảnh thật bằng công cụ xem ảnh (`view_file` / `view_image`) và soi chi tiết 100% từng khung hình (F0, F1, F2...):
    1. **Tai & Đầu:** Chóp tai, viền lông tai, khoảng trống giữa hai tai (không dính nền canvas).
    2. **Mắt & Mặt:** Tròng mắt, đốm sáng highlight (bảo toàn 100% độ đục, cấm thủng mắt), bờm cổ, má, tia sét.
    3. **Thân & Bụng:** Lông cổ, lông ngực, vùng bụng, đốm lông sáng màu (không xóa nhầm lông cơ thể).
    4. **Đuôi & Vòng uốn kín (Negative Space Cavities):** Vòng cong/xoắn của đuôi tạo lỗ rỗng phải được tẩy sạch 100% nền canvas, không được cắt lẹm vào lông đuôi.
    5. **Chân, Khe Chân & Móng (Leg gaps / Ground contact):** Khe hở giữa các chân trước/sau, kẽ đùi, móng chân chạm sàn phải sạch 100% nền canvas, không dính halo.
  - Frame nào chưa soi đủ cả 5 vùng trên **tuyệt đối không được claim đạt chuẩn hay xuất cho người dùng**.

### 5. Triệt Tiêu Lem Dính Phần Thừa, Lỗ Thủng Pinhole & Co Rút Tỷ Lệ Giữa Các Frame (Zero Frame Bleed, Zero Pinhole & Uniform Scale Law — /learn 2026-10-29)
- [ ] **Cấm Tuyệt Đối Lỗ Thủng Chroma-Key Trên Cơ Thể (Zero Pinhole Corruption):** Nghiêm cấm dùng thuật toán lọc màu nền (chroma-key thresholding) ăn thủng các chấm xanh/trắng (pinholes) lên mặt, da, tay chân hoặc trang phục nhân vật. Bắt buộc tách nền bằng Recraft `removeBackground` trên nền gốc sạch và lấp kín 100% độ đục (`Alpha = 255`) bên trong đường viền cơ thể.
- [ ] **Khóa Đồng Nhất Tỷ Lệ Chiều Cao Nhân Vật Xuyên Suốt Dải Frame (Uniform Character Scale Across Strip):** Nghiêm cấm việc scale độc lập từng frame theo bề ngang tổng `fw` khiến các frame nhân vật vươn tay, đá bay hoặc phóng Linh Cầu/VFX bị thu nhỏ/lùn đi 25–50% so với frame đứng chuẩn. Toàn bộ các frame trong cùng một động tác bắt buộc dùng chung một hệ số tỷ lệ (`strip_scale`) hoặc khóa chiều cao cơ thể đồng nhất.
- [ ] **Cấm Cắt Đôi Linh Cầu / VFX Hoặc Dán Nhầm Sang Lưng Frame Kế Tiếp (Zero Sliced VFX / Cross-Frame Bleed):** Soi kỹ 4 góc và viền biên của từng frame đơn sau khi cắt tách từ dải sheet. Tuyệt đối cấm cắt đôi quả Linh Cầu đang ném, cắt cụt sóng năng lượng, hoặc để phần đuôi/lửa/hạt năng lượng của frame trước bị cắt lọt sang dính vào sau lưng nhân vật ở frame kế tiếp.
- [ ] **Đồng Nhất Trang Phục, Vũ Khí Đặc Trưng & Đổi Chân Chu Kỳ Chạy (Outfit, Prop & Alternating Stride Authenticity):**
  - Cùng một nhân vật phải giữ đúng 100% thiết kế trang phục và vũ khí đặc trưng (ví dụ: kính bảo hộ, khăn quàng, áo khoác, cung tên lục bảo) xuyên suốt mọi động tác `Idle`, `Run`, `Jump`, `Command`.
  - Kiểm tra số lượng chi chuẩn xác (tuyệt đối cấm lỗi AI sinh thừa cánh tay thứ 3 hoặc chân thứ 3).
  - Hoạt ảnh `Run` (6 frame) bắt buộc có nhịp đổi chân trái - phải thực sự (Frames 0–2 chân phải dẫn, Frames 3–5 chân trái dẫn); nghiêm cấm nhân bản `[0,1,2,0,1,2]` từ 3 frame cùng một chân.
- [ ] **Đệm cách ly an toàn (Safe Margin Buffer $\ge 120\text{px}$):** Trên dải sheet gốc, các tư thế phải cách nhau tối thiểu 120-150px, nhân vật vẽ gọn chiếm 55-60% chiều ngang ô để việc cắt chia ô diễn ra an toàn 100%. Nếu có bộ phận chạm biên hoặc lấn sang ô kế bên $\rightarrow$ **INSTANT HARD REJECT**, bắt buộc sinh lại với prompt ép khoảng cách rộng hơn. Tỷ lệ to nhỏ thực tế do code Unity quản lý qua `visualScale`.

### 5. Phân tách Body & VFX (Decoupling Contract)
- [ ] **Kiểm tra Bake:** Body animation (đấm, đá, cào, nhảy) có bị "bake" ngọn lửa, tia điện hoặc vệt chém dính vào tay chân không?
- [ ] **Chuẩn modular:** Body phải sạch sẽ để lập trình viên có thể gắn VFX prefab và tái sử dụng cho nhiều chiêu thức khác nhau.

### 6. Khả năng đưa vào Unity (Unity Production Readiness)
- [ ] Có thể cắt bằng `Grid by Cell Size` hay cần custom bounds?
- [ ] Tỷ lệ kích thước nhân vật so với các animation khác (Idle, Run, Jump) có đồng nhất không?

### 7. Hồn cốt & Biểu cảm sống động (Soulful Expression & Secondary Motion — Tiêu chuẩn chốt 2026-10-12)
- [ ] **Mắt phải chớp (Mandatory Eye Blinking):** Có frame chớp mắt tự nhiên (nhắm/mở nhịp nhàng) trong chu kỳ Idle hoặc animation dài, ánh mắt linh hoạt và có thần, tuyệt đối không trợn trừng đờ đẫn xuyên suốt mọi frame.
- [ ] **Chuyển động phụ họa (Secondary Motion & Breathing):** Các chi tiết ngoại hình/trang trí trên cơ thể (tai rung/vểnh, đuôi uốn lượn ngoe nguẩy, bờm lông/râu/sừng/phụ kiện phập phồng đung đưa) có chuyển động nhịp nhàng theo nhịp thở không? Hay bị đơ cứng như gắn nhựa?
- [ ] **Khẩu hình tung chiêu (Expressive Attack/Cast Mouth):** Khi tung chiêu tấn công/gồng lực, miệng có mở rộng (nhe nanh giận dữ, há to gầm thét, hô hào hoặc ngậm phóng năng lượng) tạo uy lực không? Tuyệt đối cấm ngậm chặt miệng đơ khúc gỗ khi thi triển kỹ năng.

---

## 2. Thang Điểm Đánh Giá (Review Verdicts)

| Kết Luận (Verdict) | Ý Nghĩa Kỹ Thuật | Hành Động Tiếp Theo |
| :--- | :--- | :--- |
| **Production Ready** | Đạt chuẩn toàn bộ 7 tiêu chí, baseline phẳng, cell chuẩn, không bake VFX, hoạt ảnh sống động có hồn | Cắt sprite, cấu hình TextureImporter (Point/None/PPU 32) và đưa vào Unity. |
| **Reference Approved** | Đạt về tạo hình và silhouette, nhưng còn lệch nhẹ baseline hoặc cần căn chỉnh lại cell | Cần tool auto-alignment hoặc xử lý tuck offset trước khi import. |
| **Prototype Only** | Chỉ dùng để test cơ chế tạm thời, tỉ lệ hoặc phong cách chưa đồng bộ | Giữ làm nháp, cần ren lại bản hoàn thiện cho bản chính thức. |
| **Reject / Regenerate** | Sai góc nhìn, trôi baseline quá lớn, bake VFX vào body, hoặc hoạt ảnh đơ cứng/không chớp mắt/không mở miệng khi tung chiêu | Bỏ ảnh, sử dụng prompt điều chỉnh bổ sung chuyển động mắt/tai/đuôi/khẩu hình để tạo lại. |

Các nhãn trên là phân loại art, không là quyền xóa/sửa/generate/import. Báo riêng từng gate identity/frame/cell/baseline/alpha/halo/separation/import/runtime bằng `PASS / CONCERNS / FAIL / BLOCKED / NOT RUN` và evidence. Chỉ gọi `Production Ready` khi các gate bắt buộc, gồm import/runtime thực tế, đã kiểm chứng; review ảnh tĩnh không chứng minh runtime. Giữ contract Pet/stage đã duyệt, không đổi frame/cell/PPU theo ví dụ chung trong rubric.

---

## 3. Quy Tắc Bắt Buộc: Cung Cấp Prompt Sẵn Dùng (Proactive Prompt Rule)

Theo quy định `AGENTS.md`, mọi báo cáo review **BẮT BUỘC CHỦ ĐỘNG** cung cấp sẵn:
1. **Prompt chỉnh sửa (nếu cần tinh chỉnh lại)** HOẶC
2. **Prompt cho asset tiếp theo (VFX, Animation nối tiếp, Sound prompt)** được tinh chỉnh chính xác theo contract của dự án để người dùng copy dùng ngay.

## 4. Bàn giao bước tiếp theo
 
Không tự tạo GIF preview. Khi trình chiếu hoặc review chuỗi frame animation (Idle, Run, Jump, Attack, VFX...), **bắt buộc sử dụng định dạng Carousel (Image Slider)** để người dùng và reviewer có thể lật tuần tự từng frame (`<!-- slide -->`) trực tiếp tại chỗ nhằm kiểm tra độ bám sàn, độ trôi chân và tính mượt mà của chuyển động.
Kết thúc bằng handoff cho **PM**: exact input asset paths và exact output report file nếu đã được duyệt lưu (hoặc `không có file — review/prompt trong chat`); owner bước tiếp theo; input source/concept/GDD/stage và prompt sẵn dùng; acceptance các gate/rubric cần đạt; remaining gates và blocker. PM cập nhật `active.md` và quyết định dispatch; review chỉ đề xuất, không tự mở follow-up, regenerate hay auto-import.
