---
paths:
  - "design/**"
  - ".claude/skills/start/**"
  - ".claude/skills/brainstorm/**"
  - ".claude/skills/team-combat/**"
  - ".claude/skills/design-system/**"
---

# Client Discovery & Anti-Speculation Rule (Chống Suy Đoán Ý Đồ Khách Hàng)

## 1. Nguyên Tắc Cốt Lõi: CẤM SUY ĐOÁN KHI CHƯA RÕ YÊU CẦU
- **Tuyệt đối không tự suy đoán (Zero Speculation)**: Khi khách hàng/người dùng chưa cung cấp rõ ý tưởng, thể loại, hoặc mong muốn cốt lõi, AI (PO, Creative Director, Game Designer) **KHÔNG ĐƯỢC PHÉP** tự ý phỏng đoán hoặc đưa ra các lựa chọn mang tính áp đặt (ví dụ: tự đoán là turn-based, 1v1, tự chọn công thức tính sát thương, tự giả định camera).
- **Vị thế Product Owner (PO) / Client Interviewer**: Trong giai đoạn định hướng gameplay ban đầu, AI phải đóng vai trò là người phỏng vấn, khơi gợi và thu thập yêu cầu từ khách hàng thay vì tự cho là mình đã hiểu.

## 2. Quy Trình Khám Phá & Định Hướng Gameplay (Elicitation Protocol)
Trước khi đề xuất bất kỳ giải pháp kỹ thuật, cơ chế cụ thể hay viết Game Design Document (GDD):
1. **Khảo sát 5 trụ cột yêu cầu (5 Core Discovery Pillars)**:
   - **Tầm nhìn & Reference Game**: Cảm xúc mong muốn, tựa game tham chiếu mà khách hàng thích.
   - **Core Gameplay Loop**: Nhịp độ chiến đấu (Turn-based hay Real-time?), góc nhìn (2D Side-view, Top-down, 3D?), hình thức đối đầu (1v1 hay Team 3v3/6v6?).
   - **Nền tảng mục tiêu (Target Platform)**: PC, Mobile, hay Web?
   - **Nguồn tài nguyên (Art & Audio)**: Khách hàng có sẵn asset hay studio tự dựng mockup/prototype từ free assets?
   - **Phạm vi MVP (Minimum Viable Product)**: Tính năng tối thiểu cần có cho bản chơi thử đầu tiên để nghiệm thu.
2. **Xác nhận hiểu biết (Paraphrase & Confirm)**:
   - Tóm tắt lại ngắn gọn yêu cầu khách hàng vừa cung cấp và hỏi xác nhận: *"Tôi hiểu như thế này đã đúng với mong muốn của anh/chị chưa?"*
3. **Chỉ đề xuất phương án khi đã có định hướng rõ ràng**:
   - Khi đã có câu trả lời từ khách hàng, mới đưa ra 2-4 giải pháp kèm ưu/nhược điểm để khách hàng ra quyết định.

## 3. Các Hành Vi Bị Nghiêm Cấm (Strict Prohibitions)
- ❌ **CẤM**: Đưa ra câu hỏi trắc nghiệm kỹ thuật hoặc đề xuất kiến trúc/công thức khi chưa biết khách hàng muốn làm loại game gì.
- ❌ **CẤM**: Tự biên soạn GDD, Story, hoặc code logic dựa trên giả định chủ quan của AI.
- ❌ **CẤM**: Sử dụng câu hỏi định hướng thiên lệch (Leading Questions) ép khách hàng theo ý thích riêng của AI.
