---
name: ui-state-matrix-test
description: "Kiểm thử ma trận tổ hợp trạng thái UI (1-2-3 Pet Switch + Chuỗi Mở Menu & AABB Overlap Detector) theo kiến trúc AltTester, Unity Automated QA và Regression Games State-Machine Playtesting cho Tiến Hóa Tối Thượng."
allowed-tools: "exec_command, apply_patch"
metadata:
  argument-hint: "[scene | issue-key | full]"
  user-invocable: "true"
---

# /ui-state-matrix-test — Bộ Kiểm Thử Ma Trận Tổ Hợp Trạng Thái UI & AABB Overlap Detector

Kỹ năng này chịu trách nhiệm kiểm thử toàn diện ma trận trạng thái giao diện (Combinatorial State-Machine UI Testing), phát hiện triệt để lỗi đè giao diện (UI Overlap) và xung đột modal trong Unity, kết hợp tinh hoa từ các framework kiểm thử AI Game hàng đầu:
- **AltTester Unity SDK**: Điều khiển UI hierarchy, query `By.Path` / `By.Name`, tính toán screen-space coordinates và mô phỏng user input theo kịch bản tương tác thực.
- **Unity Automated QA (`com.unity.automated-testing`)**: Ghi nhận chuỗi thao tác, tự động duyệt ma trận trạng thái (state permutation) và assert AABB bounding-box.
- **Regression Games State-Machine Playtesting**: Mô hình hóa luồng chuyển trạng thái có trọng số (State Axis A $\times$ State Axis B) để phát hiện edge case khi người chơi đổi Pet nhanh hoặc mở menu dồn dập.

---

## 1. Năm Thiết Quân Luật Bất Biến (The 5 Mandatory Invariants)

### Invariant 1: Co Giãn Dynamic Party Bất Biến (Dynamic Party Scaling Invariant)
- **Quy tắc**: Party strip slots `[1]`, `[2]`, `[3]`, nút `[KHO O]`, huy hiệu hệ nguyên tố, và 4 nút kỹ năng `[Q]`, `[E]`, `[R]`, `[F]` bắt buộc phải tự động co giãn và hiển thị chính xác theo số lượng Pet đang sở hữu:
  - Khi Party = 1: Chỉ hiện duy nhất Slot 1 + `[KHO O]`. Các slot 2, 3 ẩn hoàn toàn.
  - Khi Party = 2: Hiện Slot 1 & 2 + `[KHO O]`. Slot 3 ẩn.
  - Khi Party = 3: Hiện đầy đủ Slot 1, 2, 3 + `[KHO O]`.
- **Cấm tuyệt đối**: Cấm thanh party đè lên nút `[V] Tiến Hóa`, nút `[H] Bình Máu`, hoặc thanh máu `Alpha Boss Bar`.

### Invariant 2: Độc Tôn Modal Đang Mở (Modal Mutual Exclusion Invariant / Single Active Modal Law)
- **Quy tắc**: Tại bất kỳ frame hình nào, **chỉ duy nhất $\le 1$ Modal toàn màn hình được phép Active**.
- **Cơ chế**: Khi người chơi đang mở bất kỳ modal nào (`[B]` Túi Đồ, `[O]` Kho Linh Thú, `[M]` Sơ Đồ Khu Vực, `[ESC]` Cài Đặt, `Bảng Kết Quả Trận Đấu`) mà nhấn phím nóng mở modal khác:
  - Hệ thống `UiModalExclusivityCoordinator` bắt buộc phải tự động đóng/ẩn modal trước đó và chuyển sang modal mới.
  - Cấm tuyệt đối hiện tượng modal chồng đè lên modal (modal-on-modal stacking) làm kẹt focus hoặc che lấp nút `[X]` đóng modal.

### Invariant 3: Che Chắn & Thứ Tự Hiển Thị Z-Order (Z-Order & World-Space Occlusion Invariant)
- **Quy tắc**: Khi một Modal đang hiển thị:
  - Toàn bộ các layer giao diện tạm thời (Transient HUD: `SkillDetailTooltip`, `FloatingDamageText`, `CombatToastBanner`) bắt buộc phải bị ẩn.
  - Toàn bộ thanh máu quái trong không gian thế giới (`WorldSpaceEnemyHealthBar`) hoặc thực thể quái vật bắt buộc phải nằm sau lớp backdrop làm mờ (`Backdrop Dimmer` Canvas sorting order cao hơn) hoặc bị ẩn tạm thời để không bị lòi chân/mắt qua mép modal.

### Invariant 4: Kiểm Định Không Giao Nhau AABB Không Gian Màn Hình (Screen-Space AABB Zero-Overlap Assertion)
- **Quy tắc**: Mọi cụm UI độc lập (Non-parent-child UI clusters) trên cùng một canvas viewport bắt buộc phải có diện tích giao nhau bằng 0:
  $$\text{Area}(\text{AABB}_A \cap \text{AABB}_B) = 0$$
- **Các cụm kiểm tra bắt buộc**:
  - `TopLeft_PartyHUD` vs `TopCenter_BossBar` / `TopCenter_ZonePill`
  - `TopRight_Minimap` vs `TopRight_InventoryBtn` / `TopRight_SettingsBtn`
  - `BottomLeft_Joystick` vs `BottomCenter_PartyStrip`
  - `BottomRight_SkillButtons` vs `BottomCenter_PartyStrip` vs `ActiveModalRoot`

### Invariant 5: Khôi Phục Trạng Thái Hoàn Hảo (Round-Trip HUD Restoration Invariant)
- **Quy tắc**: Sau chuỗi thao tác chuyển đổi Pet liên tiếp `[1] -> [2] -> [3]` rồi mở lần lượt một loạt menu `[B] -> [O] -> [M] -> [ESC] -> Đóng`:
  - Trạng thái Combat HUD phải được khôi phục nguyên vẹn 100%.
  - Pet đang kích hoạt (Active Pet Slot) vẫn là Pet vừa chọn (Slot 3), chỉ số HP/MP, bộ chiêu và keycaps hiển thị chuẩn xác, không bị reset về mặc định hay mất focus.

---

## 2. Ma Trận Tổ Hợp Trạng Thái Kiểm Thử (The 9-State Combinatorial Matrix)

| State # | Tên Trạng Thái (State Name) | Hành Động & Điều Kiện Kích Hoạt | Tiêu Chí Kiểm Tra (Acceptance Criteria) |
|---|---|---|---|
| **S01** | `1-Pet Combat HUD` | Party chỉ có 1 Pet (Tí Chớp Lv.16) | Chỉ hiện Slot 1; 0 overlap với Potion/Evolution; HUD sạch |
| **S02** | `2-Pet Combat HUD` | Thêm Pet 2 (Mầm Gai Lv.14) vào Party | Hiện Slot 1 & 2; Slot 2 có nhãn phím `[2]`; Spacing chuẩn 8px |
| **S03** | `3-Pet Switch [1]->[2]->[3]` | Thêm Pet 3 (Lam Triều Lv.15); Hot-switch `[3]`; Hiện Alpha Boss Bar | Active slot chuyển sang 3; HUD đổi avatar Lam Triều; Boss bar trên đỉnh không đè Party |
| **S04** | `3-Pet + Tooltip Hover` | Rê chuột/focus vào Kỹ năng `[E]` Bào Tử Ru Ngủ | Tooltip hiện rõ chi tiết; không đè nút skill hay Party HUD |
| **S05** | `Open Túi Đồ [B]` | Nhấn `[B]` mở Ghibli Inventory Modal | Túi đồ hiện; Tooltip tự ẩn; Combat HUD ẩn/occluded; Modal count = 1 |
| **S06** | `Switch Kho Linh Thú [O]` | Nhấn `[O]` khi Túi Đồ đang mở | Túi đồ tự đóng; Kho Linh Thú hiện; Modal count = 1; 0 modal stacking |
| **S07** | `Switch Sơ Đồ Khu Vực [M]` | Nhấn `[M]` khi Kho Linh Thú đang mở | Kho Linh Thú tự đóng; Sơ Đồ Động hiện; Modal count = 1; Nút `[X]` rõ nét |
| **S08** | `Switch Cài Đặt [ESC]` | Nhấn `[ESC]` khi Sơ Đồ đang mở | Sơ đồ tự đóng; Cài Đặt Âm Thanh/Đồ Họa hiện; Modal count = 1 |
| **S09** | `Close All -> Return Combat` | Đóng Modal Cài Đặt | Modal count = 0; Trở lại 3-Pet Combat HUD; Slot 3 Lam Triều vẫn active 100% |

---

## 3. Kiến Trúc Kỹ Thuật (Architecture & Tools)

1. **`UiModalExclusivityCoordinator` (`Assets/Scripts/UI/Core/UiModalExclusivityCoordinator.cs`)**:
   - Quản lý tập trung mọi modal trong game.
   - Hàm `RegisterModalOpen(GameObject modalRoot, Action closeCallback)`: Tự động đóng modal hiện tại trước khi mở modal mới.
   - Cung cấp `ActiveModalCount`, `ActiveModalName`, `CloseAllModals()`.
2. **`UiOverlapMatrixAuditor` (`Assets/Scripts/UI/Core/UiOverlapMatrixAuditor.cs`)**:
   - Chuyển đổi `RectTransform` sang tọa độ màn hình (Screen Space Rect via `GetWorldCorners`).
   - Hàm `CheckOverlap(RectTransform a, RectTransform b)` kiểm tra va chạm AABB hình học.
   - Bỏ qua quan hệ cha-con (ancestor-descendant) hoặc các phần tử ẩn (`activeInHierarchy == false`).
3. **NUnit EditMode Tests (`Assets/Scripts/Tests/EditMode/UiCombinatorialStateMatrixTests.cs`)**:
   - Kiểm thử tự động chạy headless không cần mở GUI Unity.
   - Đảm bảo 100% test pass trước khi bàn giao.
4. **Editor Visual Capture (`Assets/Scripts/Editor/CaptureUiStateMatrixEvidence.cs`)**:
   - Tự động sinh Contact Sheet 9 ô 1080p: `production/qa/evidence/PET-401_UI_State_Matrix_123Pet_Menus_1080p.png`.
   - Tự động xuất ảnh động Looping GIF: `production/qa/evidence/PET-401_UI_State_Matrix_Flow.gif`.

---

## 4. Quy Trình Chạy Kiểm Thử & Nghiệm Thu

1. **Chạy Unit Test Headless**:
   ```bash
   /Applications/Unity/Hub/Editor/6000.5.2f1/Unity.app/Contents/MacOS/Unity -batchmode -silent-crashes -runTests -projectPath /Users/duc/my-projects/pokemon-combat -testPlatform EditMode -testResults /tmp/editmode_results.xml -logFile /tmp/unity_test.log
   ```
2. **Chạy Capture Visual Evidence**:
   ```bash
   /Applications/Unity/Hub/Editor/6000.5.2f1/Unity.app/Contents/MacOS/Unity -batchmode -silent-crashes -projectPath /Users/duc/my-projects/pokemon-combat -executeMethod PokemonBattle.EditorScripts.CaptureUiStateMatrixEvidence.CaptureMatrixFromCommandLine -logFile /tmp/capture_matrix.log
   ```
3. **Nghiệm Thu Mắt (Eye-First Law)**:
   - Dùng `read_file` soi trực tiếp `PET-401_UI_State_Matrix_123Pet_Menus_1080p.png` và `PET-401_UI_State_Matrix_Flow.gif`.
   - Đảm bảo 0 lỗi đè chữ, 0 lỗi đè nút, 0 hiện tượng 2 modal mở cùng lúc, và nút `[X]` rõ ràng sắc nét.


---

## 5. Gate và Bàn Giao Bước Tiếp Theo (Handoff & Verification Gate)

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
