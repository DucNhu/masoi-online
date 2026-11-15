---
name: player-eye-audit
description: "Đóng vai Người Dùng / Game Thủ Khó Tính (Strict Player-Eye Critic) tự động quét định kỳ mỗi 15 phút bằng Subagent Terminal CLI (dàn tài khoản Pro xoay vòng qua agy-manager, bảo vệ 100% quota tài khoản Ultra chính): trực tiếp mở ảnh chụp màn chơi, giao diện đa ngôn ngữ (Việt-Anh-Trung-Hàn-Nhật) và nghe file âm thanh/SFX bằng read_file để bắt lỗi thẩm mỹ, tràn chữ/lỗi font UI, âm thanh câm/lệch nhịp, bố cục vô lý, ô vuông/nhọn lệch chuẩn, chữ thừa gây rối mắt, luồng trải nghiệm ngược đời và từng ô vật phẩm xấu; tự động tạo hoặc đẩy task lên Jira (In Progress) để Studio PM luôn lên Jira lấy task về sửa."
allowed-tools: "exec_command, apply_patch"
metadata:
  argument-hint: "[start-15m | once | ui | gameplay | art | l10n | audio]"
  user-invocable: "true"
---

# /player-eye-audit — Chế Độ "Đóng Vai Người Dùng Khó Tính" Quét Trực Tiếp Game Mỗi 15 Phút & Đẩy Task Lên Jira Cho PM

Kỹ năng này biến phiên trò chuyện thành **Trạm Điều Phối Người Dùng / Game Thủ Khó Tính (Strict Player-Eye & Ear Critic)**, tự động chạy định kỳ **mỗi 15 phút (`*/15 * * * *`)**.

Nguyên lý vận hành cốt lõi:
1. **Trọng Tâm Ưu Tiên & Giới Hạn Tối Đa 3 Lần Review (Focus Priority & Max 3-Review Cap)**:
   - **Tập trung chủ lực vào 3 mảng chính**:
     1. **Lỗi Giao diện & Hiển thị (UI / HUD / Modals / Text Display)**: Đè lấn nút bấm, tràn chữ, lệch khung, trùng lặp thông tin, mất chữ/số cấp độ, ô vật phẩm/kho thú lỗi hiển thị.
     2. **Lỗi Bản đồ & Địa hình (Map & Terrain)**: Vẽ dính nhân vật lên tranh nền tĩnh, đảo đá bay không trụ đỡ, rách đường ghép vân đất/đá, hở đáy màn hình, nhân vật/quái/vật thể đứng lơ lửng không chạm đất.
     3. **Lỗi Âm thanh & Đa ngôn ngữ (Audio/SFX & 5-Language L10n)**: Hành động câm tiếng, âm thanh bíp giả lập/lệch nhịp, lỗi ô vuông phông chữ Trung–Hàn–Nhật, tràn chữ khi đổi ngôn ngữ.
   - **Hạn chế bắt lỗi Pet, Kỹ năng & Ngưng soi Biểu cảm (nhưng BẮT BUỘC soi 100% từng ảnh trong slide, từng frame đơn của GIF, bắt lỗi thủng tròng mắt, tách nền, giải phẫu 5 chân & biến dạng loài)**:
     - **Thiết Quân Luật Bắt Buộc Soi 100% Từng Ảnh Trong Slide & Từng Frame Đơn Cấu Thành GIF (/learn Mandatory All-Slide & All-Frame Inspection Law — 2026-11-15)**:
       - Khi kiểm định bất kỳ task nào hoặc một bộ slide/GIF, Subagent và Kiểm định viên **BẮT BUỘC dùng `read_file` mở xem trực tiếp bằng mắt 100% tất cả các bức ảnh VÀ toàn bộ từng file `.png` đơn lẻ cấu thành nên ảnh động GIF** (ví dụ: GIF 4 frame `attack_00..03` hoặc `faint_00..03` phải mở đủ cả 4 file `.png` đơn lẻ).
       - **Cấm tuyệt đối** chỉ mở 1 frame đại diện rồi suy diễn cả bộ đạt chuẩn.
       - Trên từng frame đơn lẻ, bắt buộc kiểm tra: (1) Đếm đủ số lượng chi (đúng 4 chân chuẩn, cấm dị dạng mọc thừa 5 chân hoặc cụt mất 1 chân, cấm vạt phẳng ngang ngực), (2) Sạch 100% mảng nền trắng kẹt ở khe hẹp giữa các đuôi, bờm cổ, nách và gầm bụng, (3) Không bị cắt cụt mép đầu/đuôi/chân và không dính tia sét/khói VFX rời trên sprite cơ thể, (4) Đúng huyết thống tiến hóa từ Cấp 1 & Cấp 2 (ví dụ: cấm biến Khủng long Thảo Mộc Mầm Gai thành Rùa, cấm biến Cáo thành Kỳ Lân), (5) Chân tiếp đất đúng tâm bóng đổ tròn.
     - **Biểu cảm (Facial Expression)**: Hạn chế tối đa việc bắt lỗi biểu cảm; **nếu nhân vật/Linh thú đã có biểu cảm phản xạ rồi thì THÔI KHÔNG BẮT NỮA** (tuyệt đối không trả task chỉ vì mắt nhắm chưa chặt hay nét miệng/mày).
     - **Tuyệt đối cấm bỏ sót lỗi thủng tròng mắt / mất lòng trắng do tách nền (De-matting Cavity Bug)**: CẤM TUYỆT ĐỐI nhầm lẫn giữa "biểu cảm" với "lỗi tách nền làm thủng trong suốt (Alpha = 0) hoặc mất lòng trắng mắt/răng/ngực". Mắt Linh thú bị mất lòng trắng hoặc rỗng xuyên thấu nền là lỗi kỹ thuật đồ họa hỏng nặng, BẮT BUỘC PHẢI BẮT VÀ TẠO TASK SỬA NGAY.
     - **Linh thú & Kỹ năng (Pet & Skill VFX)**: Bắt buộc bắt ngay các lỗi hiển thị hỏng nặng (thủng tròng mắt/nội thể, chưa tách nền trắng ở khe đuôi/cổ/bụng, dị dạng 5 chân/cụt chân, cắt cụt mép khung hình, dính VFX rời, mất hình, đơ 1 ảnh tĩnh hoặc biến dạng loài hoàn toàn so với cấp trước).
   - **Chốt chặn Tối Đa 3 Lần Review (Max 3 Reviews Per Issue)**:
     - **Mỗi lỗi / mỗi task tuyệt đối KHÔNG trả về quá 3 lần review**. Trước khi trả một task về `In Progress`, bắt buộc kiểm tra lịch sử bình luận của task: nếu đã qua 3 lần review mà không còn lỗi hỏng nặng về giao diện/hiển thị/địa hình thì **duyệt cho qua (`In Review`) ngay lập tức**, cấm trả đi trả lại vô tận.
2. **Mọi lỗi trọng tâm phát hiện đều đẩy thẳng thành Task trên Jira để Studio PM lên Jira lấy việc**:
   - Vì **Studio PM luôn lên Jira để lấy task thực thi**, nên bất cứ khi nào Subagent phát hiện lỗi giao diện/hiển thị, bản đồ/địa hình, âm thanh hoặc đa ngôn ngữ trong game (và chưa vượt quá 3 lần review):
     - Nếu đã có task liên quan trên Jira (và số lần review < 3): Ghi nhận xét phê bình thẳng vào task đó và chuyển ngay về `In Progress` (`--assignee dev --force`).
     - Nếu chưa có task trên Jira: **Tự động tạo ngay Task mới trên Jira (`python3 tools/jira_task.py create ...`)** và chuyển sang `In Progress` (`--assignee dev --force`) để PM thấy ngay trong danh sách task trên Jira và lấy về sửa.
3. **Bảo vệ 100% hạn mức tài khoản Ultra chính (`ducnhu2k1`) & Chống phình ngữ cảnh**:
   - Phiên chính (Ultra) chỉ giữ vai trò **Trạm Kích Hoạt Siêu Nhẹ**: Không trực tiếp mở hàng chục bức ảnh/file âm thanh nặng trong phiên chính.
   - **100% công việc mở ảnh, nghe âm thanh, soi 8 lăng kính và tạo/cập nhật task trên Jira được đẩy xuống Subagent độc lập qua Terminal CLI (`agy` + `agy-manager`)** chạy bằng dàn tài khoản Pro dự phòng (`aduckuba41`, `soisatthu001`, `soisatthu008`, `soisatthu010`, `soisatthu011`, `soisatthu012`).
   - Khi báo cáo cho người dùng trên chat: Giao tiếp tự nhiên bằng ngôn ngữ trải nghiệm game và báo rõ đã đẩy task lên Jira cho PM lấy việc (tuyệt đối không dùng từ "vé" ngô nghê, không dùng bảng Markdown, không nêu tên file code).

---

## 1. Khởi Động Lịch Quét Tự Động 15 Phút Ngay Khi Gọi Skill

Khi người dùng gọi `/player-eye-audit`:
1. **Bật ngay bộ lập lịch 15 phút (`schedule` tool)**:
   - `CronExpression`: `"*/15 * * * *"`
   - `IsDaemon`: `true`
   - `ExactTiming`: `false`
   - `Prompt`: `"[Player-Eye Critic 15m Trigger] Kích hoạt 1 lượt quét game mới qua Subagent Terminal CLI trên dàn tài khoản Pro (HOME=/Users/duc/.agy-cli-manager/runtime agy -p ...), tuyệt đối không đọc ảnh/audio trực tiếp trên tài khoản Ultra chính. Phát hiện lỗi nào trong game thì cập nhật hoặc tạo mới task trên Jira (In Progress, assignee dev) để Studio PM lên Jira lấy task về sửa."`
2. **Thực hiện ngay Lượt Quét Đầu Tiên (Iteration 0)** bằng Subagent CLI mà không chờ hết 15 phút đầu.

---

## 2. Cơ Chế Thực Thi 100% Qua Subagent Tài Khoản Pro (Zero-Ultra-Quota Consumption)

Mỗi khi đến kỳ 15 phút (hoặc khi chạy lượt đầu tiên), phiên chính **TUYỆT ĐỐI CẤM** dùng công cụ `invoke_subagent` nội bộ của IDE và **TUYỆT ĐỐI CẤM** tự gọi `read_file` mở hàng loạt ảnh/audio trong phiên chính. Thay vào đó, thực hiện đúng quy trình 3 bước:

### Bước 1: Kiểm tra & Đảm bảo Tài Khoản Pro Đang Hoạt Động
- Chạy lệnh kiểm tra nhanh và xoay vòng nếu tài khoản Pro hiện tại chạm hạn mức (`429` / `resource_exhausted` / `BLOCKED_QUOTA`):
  ```bash
  agy-manager current
  ```
  *(Nếu tài khoản hiện tại báo lỗi hết hạn mức trong lần chạy trước, gọi ngay `agy-manager switch-next` hoặc `agy-manager rotate-after-failure`. Tuyệt đối giữ tài khoản Ultra `ducnhu2k1` ở trạng thái `disabled` trong `agy-manager`).*

### Bước 2: Khởi Chạy Subagent Mới Tinh Sạch Qua Terminal CLI
- Mỗi lượt quét 15 phút là **1 tiến trình CLI Subagent hoàn toàn mới** (ngữ cảnh mới 100%, tự hủy sau khi quét xong nên không bao giờ tích tụ rác bộ nhớ qua các lần quét):
  ```bash
  HOME=/Users/duc/.agy-cli-manager/runtime agy -p "Đóng vai Strict Player-Eye Critic theo đúng quy chuẩn .agents/skills/player-eye-audit/SKILL.md:
  1. TẬP TRUNG ƯU TIÊN SỐ 1 vào: Lỗi Giao diện & Hiển thị (UI/HUD/Modals/Chữ), Lỗi Bản đồ & Địa hình (hở đáy, rách vân, lơ lửng không chạm sàn, vẽ dính nhân vật lên nền tĩnh), Lỗi Âm thanh & Đa ngôn ngữ (5 thứ tiếng Việt-Anh-Trung-Hàn-Nhật).
  2. BẮT BUỘC SOI 100% TỪNG ẢNH TRONG SLIDE & TỪNG FRAME ĐƠN (.png 00..03) CẤU THÀNH GIF bằng read_file: Đếm đủ 4 chân (bắt ngay lỗi dị dạng 5 chân hoặc cụt chân/vạt phẳng ngực), bắt lỗi mảng trắng kẹt ở khe đuôi/cổ/bụng, bắt lỗi thủng tròng mắt/mất lòng trắng (de-matting cavity bug), bắt lỗi cắt cụt mép khung hình, dính VFX rời trên body và sai lệch huyết thống loài giữa Cấp 1 -> Cấp 2 -> Cấp 3 (ví dụ Khủng long biến thành Rùa). NGƯNG bắt lỗi biểu cảm nếu nhân vật/Pet đã có biểu cảm phản xạ rồi.
  3. Dùng read_file mở trực tiếp từng ảnh giao diện/bản đồ, từng frame .png đơn lẻ của GIF và nghe trực tiếp từng file âm thanh.
  3. CHỐT CHẶN TỐI ĐA 3 LẦN REVIEW & THIẾT QUÂN LUẬT BẢO VỆ BUG PO GIAO (PO BUG PROTECTION LAW):
     - TUYỆT ĐỐI CẤM can thiệp vào task đang được PO (duc.nhu / Nhữ Hoàng Minh Đức) gán cho Developer để fix bug (hoặc có nhãn 'bug', hoặc comment gần nhất là PO bắt lỗi): BẮT BUỘC ĐỂ NGUYÊN cho Developer xử lý. CẤM TUYỆT ĐỐI lấy cớ 'đã qua 3 lần review' để tự ý đá task ngược lại cho PO khi Developer chưa sửa!
     - Quy tắc 3 lần review CHỈ áp dụng cho các lỗi do BOT tự quét: Nếu một task đã qua 3 lần bot review mà không còn lỗi hỏng nặng, bot dừng bắt lỗi và chuyển In Review. Quy tắc này TUYỆT ĐỐI KHÔNG ĐƯỢC dùng để đè lên yêu cầu sửa lỗi trực tiếp từ PO!
     - Trước khi trả bất kỳ task nào về In Progress, kiểm tra lịch sử task (python3 tools/jira_task.py show <KEY>). Chỉ trả về In Progress (--assignee dev --force) khi số lần bot review < 3.
  4. Dọn rác các thư mục frame tạm quá 30 phút trong /tmp, ghi log chi tiết vào /tmp/player_eye_audit_latest.log và CHỈ IN RA STDOUT TỐI ĐA 5 DÒNG tóm tắt siêu ngắn gọn." --dangerously-skip-permissions
  ```

### Bước 3: Phiên Chính Nhận Kết Quả Tóm Tắt (< 5 Dòng)
- Phiên chính chỉ đọc đúng **5 dòng tóm tắt đầu ra** từ Terminal của Subagent Pro và phản hồi ngắn gọn cho người dùng (không dùng chữ "vé", không dùng bảng Markdown, không nêu tên file code).

---

## 3. Cơ Chế Xử Lý Khi Cuộc Trò Chuyện Quá Dài (Long-Conversation & Context Window Guard)

Vì lịch quét 15 phút (`IsDaemon: true`) chạy liên tục nhiều giờ/nhiều ngày, cuộc trò chuyện chính rất dễ bị dài và đầy bộ nhớ ngữ cảnh. Bắt buộc áp dụng **5 Chốt Chặn Chống Đầy Ngữ Cảnh**:

1. **Cách Ly Ngữ Cảnh Nặng Xuống Ephemeral CLI Subagent (Stateless 15m Runs)**:
   - Mỗi lần đồng hồ 15 phút điểm, toàn bộ việc đọc hàng chục tấm ảnh Full HD, GIF và file âm thanh đều diễn ra bên trong tiến trình `HOME=/Users/duc/.agy-cli-manager/runtime agy -p ...` rồi đóng lại ngay. Phiên chính chỉ nhận về vài dòng chữ tóm tắt nên tốc độ tăng ngữ cảnh của phiên chính giảm đi hơn 95%.
2. **Chế Độ Luân Phiên Quét Sâu Khi Chưa Có Ảnh Mới**:
   - Nếu trong 15 phút qua chưa có ảnh chụp mới sinh ra, Subagent tự động luân phiên quét sâu vào các mảng còn thiếu trong game (ví dụ: lượt này quét sâu Âm thanh/SFX, lượt sau quét sâu Đa ngôn ngữ Việt–Anh–Trung–Hàn–Nhật, lượt sau quét sâu Hoạt ảnh/Tỷ lệ Pet và Địa hình các bản đồ) để tạo hoặc cập nhật task trên Jira cho PM. Nếu toàn bộ 8 lăng kính đều đã có task đang chờ PM xử lý và chưa có bản cập nhật mới, chỉ trả về 1 dòng gọn nhẹ.
3. **Tự Động Chuyển Sang Báo Cáo 1–2 Dòng Khi Hội Thoại Kéo Dài (> 15 Lượt Quét)**:
   - Khi cuộc trò chuyện đã chạy qua nhiều chu kỳ, phiên chính tự động rút gọn phản hồi mỗi 15 phút xuống **đúng 1–2 gạch đầu dòng siêu cô đọng** (nêu lỗi vừa phát hiện trong game và task Jira đã đẩy cho PM).
4. **Cảnh Báo Nén Ngữ Cảnh (`/compact`) Hoặc Chuyển Giao Phiên Mới Tự Động (Session Handover)**:
   - Khi nhận thấy cuộc trò chuyện đã tích lũy quá dài (hoặc trên ~25–30 chu kỳ quét):
     - Ghi toàn bộ trạng thái quét hiện tại vào bộ nhớ tạm để không mất dấu.
     - Chủ động nhắc ngắn gọn người dùng ở cuối câu trả lời: **gợi ý người dùng gõ lệnh `/compact` ngay trên khung chat để nén gọn lịch sử trò chuyện**, hoặc mở một cuộc trò chuyện mới và gọi lại `/player-eye-audit` (toàn bộ task trên Jira vẫn tiếp nối liền mạch 100%).
5. **Tự Động Dọn Rác & Giải Phóng Ổ Cứng Mỗi Lượt Quét (Auto Disk & Cache GC Invariant)**:
   - Mỗi lần Subagent Pro chạy xong một lượt quét 15 phút, bắt buộc tự động chạy bước thu dọn rác ổ cứng ngay trước khi kết thúc tiến trình:
     - Xóa sạch toàn bộ các thư mục frame ảnh chụp tạm thời, ảnh trung gian cắt ghép GIF và log kiểm thử cũ trong thư mục tạm hệ thống đã quá 30 phút.
     - Dọn tự động các phiên bộ nhớ đệm Subagent CLI cũ đã hoàn thành (giữ lại tối đa 5 phiên gần nhất để tra cứu token khi cần, xóa toàn bộ các phiên Subagent cũ hơn) nhằm tránh làm phình ổ cứng máy tính khi treo máy chạy liên tục nhiều ngày.

---

## 4. Bộ Tiêu Chí Soi Dưới Góc Nhìn Người Dùng Thật (The 8 Player-Eye & Ear Lenses — Dành Cho Subagent Thực Thi)

Mỗi lần Subagent chạy quét, **TUYỆT ĐỐI CẤM** chỉ đọc code hay đọc log text. Subagent bắt buộc dùng `read_file` mở trực tiếp các ảnh chụp màn hình PlayMode 1080p, ảnh giao diện qua từng ngôn ngữ (HUD, Modal, Túi đồ, Chọn Pet, Bản đồ), ảnh động GIF và các file âm thanh (`.wav`, `.mp3`, `.ogg`) để phán xét qua **8 Lăng Kính Người Chơi**:

### Lăng kính 1: Bắt Lỗi "Hình Học Thô / Ô Vuông Nhọn / Vẽ Bằng Code Giả Tạp"
- Có khung bảng, thanh máu, hay nút bấm nào là **hình chữ nhật sắc cạnh, ô vuông nhọn hoắt, hoặc hình tròn/tam giác màu bệt vẽ bằng code** trông lạc quẻ với nền tranh vẽ Ghibli mềm mại không?
- Thanh máu quái nổi trên đầu có bị vuông thành sắc cạnh, màu bệt xấu xí, hoặc dính cục nhãn hệ thô kệch bên cạnh không?
- Trên bản đồ có các chấm tròn xanh, ô vuông vàng, tam giác đỏ hay vạch kẻ đứt nét trông như vẽ bằng MS Paint đè lên tranh phong cảnh không?
- **Bắt lỗi "Hội chứng đóng khung chữ ngắn & Hộp lồng hộp (Borderitis on Micro-Text & Box-in-a-Box)"**:
  - Có chỗ nào hiển thị ngắn (1–3 từ, số như Cấp độ `Lv. 5`, Hệ nguyên tố, Số lượng `x10`, Giá tiền, Nhãn tag phụ) lại bị bọc viền hộp cứng (stroke/border) thô ráp làm nát vụn giao diện không?
  - Có tình trạng "hộp lồng hộp" (bên ngoài là thẻ viền, bên trong từng nhãn nhỏ lại vẽ thêm viền con) không?
- **Phân định nguồn gốc viền (Code UI vs Asset ảnh nướng sẵn viền - Baked-In)**:
  - Khi phát hiện viền/khung cứng bao quanh chữ hoặc icon: Zoom 1:1 đối chiếu xem viền là do UI code vẽ stroke hay do asset ảnh bị AI vẽ dính chết viền (baked-in frame)?
  - Nếu do UI code: Giao task dev gỡ bỏ border, chuyển sang typography phân cấp hoặc nền mờ không viền (`borderless soft pill` alpha 10–20%).
  - Nếu do asset ảnh: Giao task art regenerate asset với chỉ thị `borderless, frameless`.

### Lăng kính 2: Bắt Lỗi "Rác Thông Tin & Chữ Thừa Trên Màn Hình (HUD Clutter)"
- **Bản đồ thu nhỏ (Minimap)**: Có hiện chữ đếm `"Quái: 4"`, `"Quái: 5"` vô duyên hay làm rớt dòng tên khu vực dưới đáy minimap không? (Người chơi nhìn chấm đỏ trên radar là đủ, không cần chữ đếm số quái).
- **Thanh máu & Ô đổi Linh thú**: Có hiện chữ hệ (`"Điện"`, `"Lôi"`, `"Cỏ"`, `"Nước"`) thừa thãi cạnh thanh máu hoặc đè dưới đáy vòng tròn đổi Pet không?
- **Trên đầu nhân vật & quái**: Có hiện dòng chữ tên Huấn luyện viên, tên Linh thú đồng hành, tên quái hoang dã nhỏ xíu xấu xí hay chữ báo `"HIỆU QUẢ CAO!"` / `"▲ KHẮC HỆ"` / `"MIỄN THƯƠNG 70%!"` to tướng che khuất cả nhân vật và hiệu ứng chiêu thức không?
- **Bản đồ khu vực (Zone Map Modal)**: Có bày ra 4 cái ảnh nhỏ (slide thumbnail) bên dưới lặp lại y hệt bức tranh toàn cảnh ngay phía trên không?

### Lăng kính 3: Soi "Từng Ô Một (Cell-by-Cell Grid Inspection)"
- Khi mở **Túi đồ, Kho Linh thú, Bảng chọn kỹ năng, Bảng chọn Pet**:
  - **Cấm nhìn lướt tổng quan rồi khen đẹp!** Bắt buộc nhìn lần lượt **từng ô một** từ trái qua phải, từ trên xuống dưới:
  - Ô có bị méo, viền không đều, góc chỗ tròn chỗ nhọn không?
  - Hình vật phẩm bên trong từng ô có đẹp và đúng chất giả tưởng phương Đông không, hay bị cắt cụt lá/kẹt mảng nền trắng ở các khe hở âm bản?
  - Chữ số lượng (`x1`, `x2`, `x12`) hoặc chữ cấp độ (`Lv.x`) có đè lấp mất hình vật phẩm/chân Linh thú hoặc nhảy lệch vị trí giữa các ô không?
  - Các biểu tượng chỉ số/hệ trên màn chọn Pet có bị gắn nhầm hệ không?
  - Cụm 4 nút kỹ năng chiến đấu (góc dưới phải) có bị giống hệt nhau (toàn vòng tròn giống nhau không phân biệt được chiêu nào với chiêu nào) không?

### Lăng kính 4: Bắt Lỗi "Luồng Trải Nghiệm Ngược Đời (Broken Player Journey)"
- Luồng vào game có tự nhiên như một game nhập vai thật không?
  - Ví dụ: Chọn Linh thú khởi đầu phải là **Tạo nhân vật $\rightarrow$ Vào bản đồ khởi đầu $\rightarrow$ Đi gặp và nói chuyện với NPC Tiến sĩ $\rightarrow$ Mới mở giao diện nhận Linh thú**, chứ không phải đùng một cái ném thẳng vào màn hình chọn Pet khô khan.
  - Cơ chế ném cầu bắt quái có tự nhiên, có lực và hiệu ứng thu phục đẹp mắt không, hay chỉ là một đường kẻ / vòng tròn thô sơ?

### Lăng kính 5: Bắt Lỗi Địa Hình, Vật Lý Chạm Đất & Hạn Chế Soi Vụn Pet/Biểu Cảm
- **Ưu tiên bắt lỗi Bản đồ & Địa hình**: Nhân vật, Pet, quái, cột mốc đá hay rương báu có bị đứng lơ lửng hở mặt cỏ, chôn lún nửa cột xuống tầng đất ngầm, rách đường nối vân đá ngầm, hở đáy màn hình hay vẽ dính nhân vật giả lên tranh nền tĩnh không?
- **Hạn chế bắt lỗi Pet & Kỹ năng**: Chỉ bắt khi bị lỗi hiển thị hỏng nặng (còn nguyên mảng nền trắng chưa tách, mất hình, đơ 1 frame tĩnh hoặc biến đổi sang loài khác hoàn toàn).
- **Không bắt bẻ Biểu cảm khi đã có phản xạ**: Hạn chế tối đa việc bắt lỗi biểu cảm; nếu nhân vật hoặc Linh thú đã có biểu cảm phản xạ khi trúng đòn/hành động rồi thì **thôi không bắt nữa**, tuyệt đối không trả task vì chi tiết mắt/miệng nhỏ.
- **Giới hạn tối đa 3 lần review**: Mỗi lỗi / mỗi task chỉ review tối đa **3 lần**; đã qua 3 lần và đạt yêu cầu cơ bản là duyệt ngay.

### Lăng kính 6: Thiếu Phương Án Lựa Chọn Cho Người Dùng
- Với các hạng mục thiết kế giao diện nhạy cảm (cụm nút kỹ năng, khung túi đồ, thanh máu, bảng thời tiết), nếu chỉ đưa ra 1 kiểu duy nhất mà trông vẫn chưa tới tầm $\rightarrow$ Bắt buộc yêu cầu tạo **2–3 phương án trực quan khác nhau** để người dùng chọn.

### Lăng kính 7: Soi Giao Diện Đa Ngôn Ngữ (Việt – Anh – Trung – Hàn – Nhật & Chế Độ Khóa Vùng Quốc Tế)
- **Kiểm tra vỡ khung & tràn chữ khi đổi ngôn ngữ**:
  - Câu tiếng Anh thường dài hơn tiếng Việt và chữ Trung/Nhật/Hàn có độ cao dòng khác nhau $\rightarrow$ Bắt buộc chụp và soi giao diện ở cả **5 ngôn ngữ (Việt, Anh, Trung, Hàn, Nhật)** xem chữ có bị tràn ra ngoài viền nút bấm, đè lên biểu tượng, bị cắt cụt mất chữ, hay rớt dòng kỳ quặc làm lệch bố cục không.
- **Kiểm tra lỗi phông chữ đa quốc gia (Zero Tofu `□` Defect)**:
  - Khi chuyển sang **Tiếng Trung, Tiếng Hàn, Tiếng Nhật**, soi kỹ từng ký tự xem có bất kỳ chữ nào bị biến thành **ô vuông lỗi font (`□`), dấu hỏi chấm, hoặc nhảy sang phông chữ hệ thống thô kệch** lệch hẳn với phong cách nghệ thuật của game không.
- **Kiểm tra tính nhất quán dịch thuật & Chốt ẩn Tiếng Việt**:
  - Có chỗ nào đang chọn Tiếng Anh/Trung/Hàn/Nhật mà vẫn sót chữ Tiếng Việt cứng (hardcoded text) chưa dịch không?
  - Khi bật chế độ **Bản Phát Hành Quốc Tế**, kiểm tra xem lựa chọn Tiếng Việt đã được ẩn hoàn toàn khỏi bảng Cài đặt và chỉ còn đúng 4 ngôn ngữ quốc tế (Anh – Trung – Hàn – Nhật) chưa.

### Lăng kính 8: Soi Trải Nghiệm Âm Thanh & Nhạc Nền (Audio, SFX & BGM Player-Ear Critic)
- **Nghe trực tiếp file âm thanh bằng `read_file` & Kiểm tra sự kiện âm thanh trong màn chơi**:
  - **Cấm nghiệm thu âm thanh chỉ bằng cách nhìn tên file có tồn tại!** Bắt buộc mở file âm thanh bằng `read_file` để nghe chất lượng thực tế và đối chiếu với trạng thái trong game.
- **Bắt lỗi "Hành Động Câm" (Silent Action Defect)**:
  - Mọi tương tác có hình đều phải có tiếng tương ứng: Bước chân chạy trên cỏ/đá, nhảy và tiếp đất, lướt né, từng đòn đánh/chiêu thức riêng biệt của Linh thú, tiếng trúng đòn/nhận sát thương, tiếng ném và thu phục bằng Linh Cầu, tiếng bấm nút/mở bảng giao diện, và nhạc nền khu vực. Thiếu bất kỳ âm thanh nào khiến cảm giác chơi bị "câm" và hẫng $\rightarrow$ Giao task lên Jira cho PM xử lý bổ sung ngay.
- **Bắt lỗi "Âm Thanh Rác / Chói Tai / Lệch Nhịp / Lạc Quẻ"**:
  - Âm thanh có bị rè, vỡ tiếng (clipping), dùng tiếng bíp sóng sin điện tử rẻ tiền, quá to át hết nhạc nền hoặc quá nhỏ nghe không rõ không?
  - Tiếng bước chân, tiếng nổ chiêu thức có khớp đúng khoảnh khắc va chạm trên hình động không, hay hình đánh xong 1 giây sau tiếng mới kêu?
  - Màu sắc âm thanh có hợp với chất liệu của từng Linh thú (ví dụ: hệ Lôi phải có tiếng phóng điện giòn uy lực, hệ Hỏa có tiếng bùng lửa ấm và dày, hệ Thủy/Mộc có tiếng nước và lá tự nhiên) không?

### Lăng kính 9: Bắt Lỗi "Chỉ Khi Chơi Thật Mới Nhận Ra" (Headless Terminal Gameplay Playtest Audit — Cấm Mở Unity GUI)
- **Chạy kiểm toán luồng điều khiển & trạng thái chơi trên Terminal (`python3 tools/gameplay_playtest_audit.py --create-jira`)**:
  - **Tuyệt đối không mở Unity GUI**: Mọi thao tác rà soát xung đột phím bấm, kẹt trạng thái nhân vật/Linh thú, lỗi vật lý sàn nhảy, lỗi cưỡi thú và lỗi thu phục quái đều chạy 100% qua Terminal CLI và đẩy thẳng task lỗi lên Jira (`In Progress`).
  - **Soi xung đột nút bấm & thao tác chồng chéo**: Bấm 1 phím có kích hoạt nhầm 2 hành động cùng lúc không (ví dụ vừa lướt vừa xả chiêu, vừa nhảy vừa ném cầu, mở bản đồ lại làm nhảy xuống khỏi thú cưỡi)? Khi mở các bảng giao diện (Túi đồ, Kho Pet, Bản đồ) thì nhân vật phía dưới có bị chạy nhảy/đánh chiêu ngầm không?
  - **Soi đứt gãy trạng thái khi chuyển đổi nhanh**: Đang cưỡi thú mà bấm đổi Linh thú `1-2-3` có làm mất hình nhân vật hoặc tự ý biến đổi cấp độ Linh thú vĩnh viễn không? Khi Linh thú đang tụt sàn 1 chiều hoặc đang tụ lực tung chiêu mà bị kéo giãn khoảng cách (Leash) có bị kẹt xuyên sàn hoặc mất oan lượt chiêu không? Khi vung tay ném Linh Cầu mà quái vừa gục có bị trừ mất oan bóng trong túi không?

---

## 5. Quy Trình Giao Việc Lên Jira Để Studio PM Luôn Lấy Task Thực Thi

1. **Khi phát hiện bất kỳ điểm xấu / bất hợp lý nào trong game thuộc một task đã có trên Jira** (do Subagent Pro thực thi trực tiếp):
   - Ghi bình luận thẳng thắn, ngắn gọn bằng ngôn ngữ người chơi lên task Jira đó:
     ```bash
     python3 tools/jira_task.py comment <KEY> "👀 [Player-Eye Audit — Chưa Đạt Thẩm Mỹ/Đa Ngôn Ngữ/Âm Thanh]: <Chỉ rõ chính xác ô nào xấu, ngôn ngữ nào tràn chữ/lỗi font, âm thanh nào bị câm/chói/lệch nhịp, luồng nào vô lý>"
     ```
   - Chuyển ngay task đó về trạng thái **`In Progress`** gán cho **`dev`** (`soisatthu003`) để Studio PM thấy và điều phối sửa ngay:
     ```bash
     python3 tools/jira_task.py move <KEY> "In Progress" --assignee dev --force
     ```
2. **Khi phát hiện lỗi mới trong game chưa có task đang mở trên Jira**:
   - Kiểm tra nhanh danh sách task đang mở (`python3 tools/jira_task.py list --open`) để tránh tạo trùng.
   - Nếu chưa có task riêng cho lỗi đó, **tự động tạo ngay Task mới trên Jira và chuyển sang `In Progress` (`--assignee dev --force`)**:
     ```bash
     python3 tools/jira_task.py create "<Tiêu đề Task rõ ràng>" "<Mô tả chi tiết lỗi phát hiện dưới góc nhìn người chơi + Tiêu chí nghiệm thu>"
     ```
   - Nhờ vậy, **Studio PM khi quét Jira sẽ luôn thấy ngay các task cần làm mà không bỏ sót bất kỳ lỗi trải nghiệm nào**.
3. **Báo cáo siêu gọn trong cuộc trò chuyện**:
   - Phiên chính chỉ đọc đúng tối đa 5 dòng tóm tắt từ Subagent Pro và gạch đầu dòng ngắn gọn những lỗi trải nghiệm vừa bắt được trong game cùng mã task trên Jira đã giao cho PM, tuyệt đối không dùng từ "vé", không dùng bảng Markdown và không nêu tên file code.


---

## 6. Gate và Bàn Giao Bước Tiếp Theo (Handoff & Verification Gate)

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
