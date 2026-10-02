# BA Backlog — Ma Sói Offline (Tú Lơ Khơ Deck)

## Yêu cầu sản phẩm cốt lõi (User Intent)
- **Mục tiêu**: Chơi Ma Sói offline với nhóm bạn tối nay (Deadline: 6 giờ).
- **Thiết bị**: Tối ưu hiển thị và thao tác một tay trên **iPhone 16 Pro** (Mobile Safari / PWA).
- **Công cụ vật lý**: Không dùng bộ bài Ma Sói chuyên dụng mà dùng bộ bài **Tú lơ khơ (2-10, J, Q, K, A)**.
- **Vai trò của App**: Quản trò / Trợ lý ghi nhận (Moderator Assistant / Ledger):
  - Thiết lập số người chơi và gán lá bài rút được sang vai trò.
  - Hướng dẫn lời thoại và trình tự gọi dậy từng đêm (Night Call Sequence).
  - Ghi nhận hành động ban đêm: Bảo vệ bảo vệ ai, Sói cắn ai, Phù thủy cứu/giết ai, Tiên tri soi ai.
  - Tự động giải quyết thương vong vào ban ngày (ai chết, thợ săn bắn ai, cặp đôi chết chùm).
  - Hỗ trợ thảo luận ban ngày: Đồng hồ đếm ngược (Discussion Timer).
  - Hỗ trợ bỏ phiếu treo cổ (Voting Ledger).
  - Tự động kiểm tra điều kiện thắng (Dân thắng / Sói thắng / Cặp đôi khác phe thắng).
  - Lưu trữ lịch sử toàn bộ trận đấu (Game Timeline / Match History).
  - Tự lưu offline (LocalStorage) phòng trường hợp tải lại trang.

## Danh mục Đề xuất Tính năng (Feature Proposals)

### BA-FEATURE-001: Ánh xạ Bài Tú Lơ Khơ sang Vai trò (Card-to-Role Mapping Engine)
- **Mô tả**: Bảng quy ước tiêu chuẩn và cho phép tùy biến:
  - `A` = Tiên Tri (Seer)
  - `K` = Ma Sói (Werewolf)
  - `Q` = Phù Thủy (Witch - 1 bình cứu, 1 bình độc)
  - `J` = Bảo Vệ (Bodyguard)
  - `10` = Thợ Săn (Hunter)
  - `9` = Thần Tình Yêu (Cupid)
  - `8` = Kẻ Phản Bội / Bán Sói (Minion / Lycan)
  - `2 - 7` = Dân Làng (Villagers)
- **Acceptance Criteria**:
  - Có sẵn preset chuẩn.
  - Cho phép quản trò đổi vai trò cho lá bài nếu muốn.
  - Có màn hình tra cứu nhanh "Lá bài <-> Vai trò" để đưa cho người chơi xem luật trước khi bắt đầu.

### BA-FEATURE-002: Thiết lập Người chơi & Gán bài (Player Setup & Role Distribution)
- **Mô tả**: Nhập số lượng người chơi (ví dụ 6 - 15 người), nhập tên hoặc để mặc định Ghế 1..N. Gán lá bài từng người rút được.
- **Acceptance Criteria**:
  - Gán bài nhanh bằng picker bài Tú (số + chất hoặc chỉ số).
  - Tự động tính số lượng Sói vs Dân để cảnh báo nếu mất cân bằng game.
  - Chế độ bảo mật "Privacy Shield": Nút che bài/che vai trò để quản trò an tâm cầm máy đi quanh bàn chơi.

### BA-FEATURE-003: Vòng Lặp Đêm (Night Phase State Machine & Script)
- **Mô tả**: Dẫn dắt Quản trò qua từng bước ban đêm theo đúng thứ tự ưu tiên.
- **Thứ tự**:
  1. Đêm 0 (nếu có Cupid): Cupid ghép đôi 2 người chơi. Sói nhận mặt nhau.
  2. Các đêm tiếp theo:
     - Bảo vệ: chọn bảo vệ 1 người (validation: không bảo vệ 1 người 2 đêm liền).
     - Sói: chọn 1 nạn nhân bị cắn.
     - Phù thủy: thông báo nạn nhân bị cắn, chọn cứu (nếu còn bình) hoặc đầu độc ai (nếu còn bình).
     - Tiên tri: chọn 1 người để soi -> màn hình hiển thị to rõ SÓI hay DÂN để quản trò ra hiệu bí mật.
- **Acceptance Criteria**:
  - Có kịch bản lời thoại gợi ý cho quản trò đọc to.
  - Ghi nhận đầy đủ hành động của từng vai trò trong đêm.

### BA-FEATURE-004: Ban Ngày & Tự động Giải quyết Kết quả (Day Phase & Resolution)
- **Mô tả**: Khi trời sáng, app tự động tính toán người chết dựa trên các hành động đêm:
  - Bị cắn mà không được bảo vệ & không được cứu -> Chết.
  - Bị độc -> Chết.
  - Nếu thợ săn chết -> App nhắc quản trò cho thợ săn kích hoạt phát bắn cuối.
  - Nếu một trong hai người thuộc cặp đôi chết -> Người kia tự động chết theo.
- **Acceptance Criteria**:
  - Danh sách người chết hiển thị rõ ràng, trang trọng.
  - Có bộ đếm giờ thảo luận (Timer) kèm âm thanh gõ chuông / hết giờ.
  - Ghi nhận phiếu biểu quyết treo cổ (Vote tally) và xử tử người bị vote cao nhất.

### BA-FEATURE-005: Kiểm tra Thắng Thua & Nhật ký Ván Đấu (Win Condition & Match Log)
- **Mô tả**: Tự động đánh giá điều kiện kết thúc ván đấu và hiển thị vinh danh phe thắng.
- **Acceptance Criteria**:
  - Sói chết hết -> Dân Thắng.
  - Số Sói >= Số Dân -> Sói Thắng.
  - Cặp đôi khác phe sống sót cuối cùng -> Cặp Đôi Thắng.
  - Tab "Nhật ký ván đấu": Xem lại chi tiết từng lượt đêm ai cắn ai, ai cứu ai, ai soi ai để quản trò giải thích cuối ván.
  - Nút "Ván mới" có xác nhận an toàn, reset trạng thái.
