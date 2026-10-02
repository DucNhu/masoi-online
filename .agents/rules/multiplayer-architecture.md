# Multiplayer Architecture & Security Protocol — Ma Sói Online

Tài liệu quy định kiến trúc đồng bộ thời gian thực (Real-time Synchronization) và an toàn dữ liệu cho Game Ma Sói Online.

## 1. Mô Hình Thẩm Quyền (Server-Authoritative Game Model)
- **Zero Client Trust**: Máy khách (Client) KHÔNG BAO GIỜ có quyền tự phán đoán kết quả ai chết, ai là Sói, hay điều kiện thắng thua.
- **Vai trò của Game Server**:
  - Giữ Game State Master (danh sách người chơi, vai trò thực sự của từng người, hành động đêm, số mạng sống).
  - Phân giải hành động kết thúc đêm và tính toán thương vong.
  - Kiểm tra điều kiện thắng và phát thông báo kết thúc trận.

## 2. Nguyên Tắc An Toàn Dữ Liệu Cốt Lõi: Zero-Knowledge Payload
> **CẢNH BÁO AN NINH CAO NHẤT**: Đây là trò chơi ma sói suy luận ẩn vai. Nếu client có thể mở DevTools / Network Tab mà thấy vai trò của người khác, game hoàn toàn bị phá vỡ!
- **State Masking (Che Giấu Trạng Thái)**:
  - Khi server phát broadcast state cho cả phòng, trường `role` và `card` của người chơi khác BẮT BUỘC phải được mask thành `UNKNOWN` hoặc xóa bỏ hoàn toàn.
  - Client chỉ nhận được:
    1. Vai trò của chính bản thân mình (`myRole`).
    2. Danh sách đồng bọn Sói (CHỈ KHI mình là Ma Sói hoặc Kẻ Bán Tơ).
    3. Nạn nhân được ghép đôi (CHỈ KHI mình là người trong Cặp Đôi).
- **Hành Động Ban Đêm Bí Mật**:
  - Action ban đêm (Sói cắn, Tiên tri soi, Phù thủy độc/cứu, Bảo vệ) gửi qua kênh bảo mật riêng tư tới server.
  - Kết quả Tiên tri soi chỉ gửi duy nhất về socket của Tiên tri.

## 3. Kiến Trúc Phòng Chơi (Room Management & Networking)
- **Room Code**: Mã phòng 6 ký tự gồm chữ cái in hoa và số (ví dụ: `WOLF68`), dễ đọc to và dễ chia sẻ qua tin nhắn.
- **Host & Spectator**:
  - Người tạo phòng là Host có quyền cài đặt luật (số người chơi, thời gian thảo luận, bật/tắt vai trò mở rộng).
  - Hỗ trợ chế độ Khán giả (Spectator) hoặc Quản trò máy (AI Narrator).
- **Khả Năng Chống Rớt Mạng (Reconnection Resilience)**:
  - Mỗi người chơi gắn với một `sessionToken` lưu trong `localStorage`.
  - Nếu mất kết nối WebSocket / 4G rớt sóng:
    + Client tự động kích hoạt retry backoff (1s, 2s, 5s).
    + Khi kết nối lại, gửi `rejoinRoom(roomCode, sessionToken)` -> Server khôi phục ngay trạng thái màn hình hiện tại mà không làm ngắt quãng ván chơi.
