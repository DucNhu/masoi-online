# Game Engine & Werewolf Rule Verification Evidence

- **Task**: TASK-003 / TASK-008 — Core Werewolf Game Engine & Rules Verification
- **Date**: 2026-10-02
- **Environment**: Node v24.3.0, tsx v4.23.15, TypeScript 5.8 / 6.0
- **Test File**: `tests/gameEngine.test.mjs`

## Kết quả kiểm thử tự động (Automated Test Verdicts)
| Scenario | Mô tả kiểm thử | Kết quả | Ghi chú |
|---|---|---|---|
| 1. Bodyguard Protection | Sói cắn người chơi, nhưng Bảo Vệ đã che chắn cùng người đó | **PASS** | Không ai chết trong đêm |
| 2. Witch Heal Potion | Sói cắn người chơi, nhưng Phù Thủy dùng bình cứu | **PASS** | Nạn nhân được hồi sinh, không ai chết |
| 3. Witch Poison Potion | Phù Thủy chọn đầu độc Ma Sói | **PASS** | Sói bị chết do độc dược |
| 4. Lovers Cascade | Cặp đôi được ghép bởi Cupid, 1 người bị cắn chết | **PASS** | Người yêu còn lại tuẫn tiết chết theo |
| 5. Hunter Revenge Shot | Thợ Săn bị chết trong đêm | **PASS** | Kích hoạt cờ `hunterTriggeredId` để bắn trả |
| 6. Win Conditions | - Sói chết hết -> Dân thắng<br>- Số Sói >= Dân -> Sói thắng | **PASS** | Đánh giá chính xác trạng thái kết thúc ván |

**Kết luận chung**: `VERIFIED PASS 100%`.
Game Logic Engine xử lý chính xác tuyệt đối các luật chơi Ma Sói truyền thống kết hợp bộ bài Tú lơ khơ.
