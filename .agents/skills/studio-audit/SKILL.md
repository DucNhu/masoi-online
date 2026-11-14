---
name: studio-audit
description: "Tự động rà soát toàn diện dự án Game Studio: đồ họa, âm thanh SFX, hoạt ảnh 3 lớp, kiểm thử tự động và tự động remake ngay các phần chưa hợp lý mà không cần chờ hỏi."
allowed-tools: "run_command, read_file, edit_file, write_file"
metadata:
  argument-hint: "[all | art | audio | combat | scenes]"
  user-invocable: "true"
---

# /studio-audit — Quy Trình Tự Động Rà Soát Toàn Diện & Tự Động Remake Studio

Kỹ năng này được kích hoạt khi người dùng gõ `/studio-audit`, `rà soát`, `/ra-soat`, `audit toàn diện`, hoặc khi Studio có thời gian trống cần tự kiểm tra chất lượng.

> **Nguyên tắc Tối Thượng (Studio Master Invariant)**:
> 1. **Tự động Remake ngay khi phát hiện lỗi**: Không chỉ dừng lại ở việc lập danh sách lỗi; nếu phát hiện ảnh dính mảng trắng canvas, âm thanh bị câm, hoạt cảnh đứng đơ hay test fail, **Studio bắt buộc phải tự động sửa chữa, remake và kiểm định lại ngay tại chỗ**.
> 2. **Không hỏi xin phép những điều hiển nhiên**: Tuyệt đối không dừng lại hỏi người dùng *"Bạn có muốn tôi sửa không?"*.

---

## 1. Trụ Cột Đồ Họa & Tài Nguyên Hình Ảnh (Art & Visual Asset Audit)

### 1.1. Khử Sạch Mảng Trắng Canvas & Khoang Kín Kẹt Nền (Zero Trapped Canvas Cavities)
- **Quy chuẩn sống còn**: Mọi sprite (Pet, Item, Trainer, VFX) tuyệt đối không được có bất kỳ mảng trắng nền canvas nào kẹt lại bên trong cơ thể hoặc các cấu trúc khép kín.
  - Quai cúp rồng (Trophy), dải lụa tù và (Horn), quai bình thuốc (Potion).
  - Khoang hở giữa đuôi cuộn chạm thân, giữa hai tai, khe giữa các chân, kẽ nách, vệt xoáy năng lượng VFX.
- **Kiểm định trực tiếp bằng mắt AI qua 3 Gate (`read_file`) — Cấm dùng script review ảnh**:
  - Tuyệt đối không chạy script Python đếm pixel để kiểm tra ảnh. Bắt buộc mở bảng Dark Checkerboard (Gate 2) và ảnh chụp Scene (Gate 3) bằng `read_file` / `view_file` để nhìn trực tiếp bằng mắt AI. Phát hiện bất kỳ mảng trắng kẹt trong silhouette, rác rìa, dáng đơ, trùng lặp tư thế hay lỗi che khuất trong Scene $\rightarrow$ **FAIL & SỬA TẬN GỐC NGAY LẬP TỨC**.
- **Đối chiếu Dark Checkerboard**:
  - Khi review, bắt buộc đặt ảnh trên nền ca-rô xám tối (`#222222` / `#333333`) để lộ rõ 100% viền halo hoặc mảng trắng còn sót.
- **Bảo tồn cơ thể (Body Anatomy White)**:
  - Giữ nguyên 100% tròng trắng mắt (không đục thủng mắt), đốm lông, ngực/bụng màu sáng tự nhiên.
- **Khóa bàn chân cố định (Zero Foot Sliding & Paw-Locking)**:
  - Hoạt cảnh tại chỗ (Idle, Cast): Bàn chân cắm chặt xuống mặt sàn, dung sai $\Delta Y \le 1\text{px}$, không trượt chân.
- **Hoạt ảnh có hồn (Soulful Animation)**:
  - Mắt phải chớp nhịp nhàng, khẩu hình mở to khi ra chiêu, tai/đuôi/bờm đung đưa theo nhịp thở.

---

## 2. Trụ Cột Âm Thanh & SFX (Audio & Game Feel Audit)

### 2.1. Phủ Kín Âm Thanh Toàn Bộ Thao Tác (No Mute Action Policy)
Rà soát `Assets/Scripts/Audio/AudioManager.cs` và đảm bảo toàn bộ các hành vi sau có âm thanh phản hồi:
1. **Di chuyển & Thao tác Trainer**:
   - Chạy (Footsteps), Nhảy (Jump grunt/whoosh), Tiếp đất (Landing thud).
   - Ném bóng bắt quái (`PlayThrowBallSFX`), Bắt dính lắc 3 nhịp (`PlayCatchSuccessSFX`).
2. **Hành vi Pet Đồng Hành**:
   - Tử trận (`OnPetFainted` / Knockback whoosh).
   - Thu hồi về bóng (`PlayPetRecallSFX`).
   - Xuất trận tiếp ứng (`PlayPetDeploySFX`).
   - Đòn tiếp ứng Tag-In Strike theo từng hệ (`PlayTagInStrikeSFX(type)`).
3. **Chiến Đấu & Kỹ Năng Combat**:
   - Đòn đánh trúng đích (`PlayAttackHitSFX`).
   - Phá giáp (Stagger Break chime).
   - Âm thanh kỹ năng 5 hệ (Lôi, Hỏa, Thủy, Thảo, Nham).
4. **Vật Phẩm & UI**:
   - Nhặt vật phẩm (`PlayLootPickupSFX`), Dùng máu/thuốc hồi phục, Click nút bấm UI (`PlayButtonClickSFX`).

---

## 3. Quy Chuẩn Nghiệm Thu 3 Lớp Thao Tác (Player Action 3-Layer Invariant)

Mọi tính năng tương tác do người chơi kích hoạt (Đổi Pet, Tung chiêu, Dùng item, Bắt quái) phải hội tụ đủ 3 lớp:
1. **Lớp 1 — Diễn hoạt thể chất (Character Animation)**:
   - Nhân vật thực thi bắt buộc phải có hoạt cảnh: Lấy đà $\rightarrow$ Tung đòn $\rightarrow$ Thu thế. Cấm đứng trơ Idle.
2. **Lớp 2 — Động lực học & VFX (Projectile & VFX)**:
   - Hiệu ứng xuất hiện đúng mốc vung tay/tung chiêu (Release Frame), decoupled sạch sẽ khỏi sprite cơ thể.
3. **Lớp 3 — Dữ liệu, Trạng thái & SFX (State, Data & Audio)**:
   - Cooldown chuẩn hóa, trừ tài nguyên chính xác, âm thanh tương ứng, kiểm tra trạng thái khống chế (Stun/Freeze).

---

## 4. Toàn Vẹn Kỹ Thuật Unity & Demo Scenes

1. **Chạy toàn bộ Bộ Kiểm Thử EditMode**:
   - Chạy lệnh CLI: `/Applications/Unity/Hub/Editor/6000.6.0f1/Unity.app/Contents/MacOS/Unity -batchmode -projectPath . -runTests -testPlatform EditMode -testResults production/qa/evidence/studio-audit-tests.xml -logFile production/qa/evidence/studio-audit-tests.log`
   - Đảm bảo 100% tests liên quan đều GREEN.
2. **Đồng bộ Scenes**:
   - Mở và build lại `SampleScene.unity` và `GrindingDemoScene.unity` qua `GrindingSceneSetup.BuildDemoScene()`.
   - Kiểm tra log không có missing script references, missing prefabs hay missing audio listeners.

---

## 5. Trụ Cột Môi Trường, Map & Level Design (Scene Level Design & Runtime Invariants)

1. **Kiểm Tra Trực Quan Map Bằng Runtime PlayMode**:
   - Cấm nghiệm thu các phân khu map (Bãi Quái, Trại Nghỉ, Boss Arena) bằng ảnh chụp tĩnh EditMode.
   - Bắt buộc kiểm tra khi PlayMode đang chạy: Spawner phải sinh quái thật trên cỏ, quái có đa dạng loài (Mầm Gai + Tí Chớp), có FlipX ngẫu nhiên, không nhân bản dán hàng ngang.
2. **Quét Triệt Tiêu Vật Thể & Quái Trôi Nổi (Zero-Floating Audit)**:
   - Toàn bộ nhân vật, quái, rương báu, đá tảng phải tiếp xúc mặt đất vững chãi (`MainGround`).
   - Cấm tuyệt đối quái đứng trên mây hoặc tảng đá trôi lơ lửng không có chân đế. Bắt buộc có bóng đổ `DynamicDropShadow`.
3. **Quét Toàn Vẹn Địa Hình (Continuous Terrain Audit)**:
   - Cấm địa hình bị cắt lát thành các dải ngang lơ lửng ("bánh kem 3 tầng"). Mặt đất phải có móng đá tự nhiên liền mạch.
4. **Hàng Rào Mắt Nhìn Độc Quyền Của Studio PM Trước Khi Ký Duyệt (/learn PM Final Eye-First Gatekeeper)**:
   - Subagent thực thi không được phép tự ý kết luận `PASS` hoặc tự chuyển trạng thái Jira sang `In Review`.
   - **Studio PM (Agent chính)** bắt buộc dùng `read_file` mở từng bức ảnh sprite sheet, contact sheet và ảnh chụp PlayMode ra soi trực tiếp bằng mắt theo tiêu chí **Đẹp & Chuẩn 10/10** (0 lỗ thủng pinhole, 0 thu nhỏ tỷ lệ nhân vật giữa các frame, 0 cắt đôi VFX, đúng trang phục/giải phẫu/nhịp chạy đổi chân, không có khối nhựa procedural trôi lơ lửng, các style VFX khác biệt rõ ràng, tỷ lệ Pet đồng hành cân xứng, không có NPC bị cắt nửa người ở rìa camera).
   - Thấy bất kỳ hạt sạn nào $\rightarrow$ **Studio PM lập tức bác bỏ (`REJECTED BY PM EYE-FIRST AUDIT`)**, giữ/trả Jira về `In Progress` (`assignee: dev`) và giao Subagent sửa tận gốc ngay tại chỗ cho đến khi PM nhìn bằng mắt đạt 10/10.

---

## 6. Báo Cáo Kết Quả Sau Audit

Trình bày theo format súc tích:
1. **Danh sách các hạng mục đã rà soát**: (Art, Audio, Animation 3 lớp, Tests, Scenes/Map Level Design).
2. **Các điểm không hợp lý đã phát hiện & ĐÃ TỰ ĐỘNG SỬA NGAY**.
3. **Trạng thái xanh (Evidence)**: Dẫn link file log, XML test, và checkpoint.

---

## 7. Gate và Bàn Giao Bước Tiếp Theo (Handoff & Verification Gate)

### Quy định quyền ghi và phê duyệt (Approval-before-write contract)
- Trước mutation, Studio Audit phải trình bày rõ ràng exact paths và kiểm tra phê duyệt scope; tuân thủ nguyên tắc approval-before-write.
- Quyền ghi chỉ bao phủ đúng scope đã được phê duyệt; không tự ý mở rộng phạm vi ra ngoài task.

### Đánh giá Gate và Handoff
- Kết luận theo từng gate với các mức verdict chuẩn:
  - `PASS`: Toàn bộ tiêu chí đạt 10/10 và các bài test xanh.
  - `CONCERNS`: Còn tồn tại điểm cần theo dõi thêm.
  - `FAIL`: Phát hiện lỗi nghiêm trọng chưa khắc phục được.
  - `BLOCKED`: Bị chặn bởi dependency hoặc thiếu công cụ.
  - `NOT RUN`: Chưa đủ điều kiện để kích hoạt gate kiểm thử.
- Bàn giao handoff cho PM với hành động tiếp theo (next step) cụ thể để lập kế hoạch giải quyết.
