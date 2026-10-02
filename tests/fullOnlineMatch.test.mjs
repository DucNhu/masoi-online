import assert from 'node:assert';
import { RoomManager } from '../src/logic/roomManager.ts';

console.log('--- BẮT ĐẦU KIỂM THỬ TRỌN VẸN 1 VÁN ĐẤU ONLINE & PHÂN QUYỀN CHAT STREAM ---');

const manager = new RoomManager();

// 1. Tạo phòng với Host (Alice)
const host = manager.createRoom('Alice 👑', '👑');
const roomId = host.roomId;

// 2. 5 người chơi tham gia phòng (Tổng 6 người chơi)
const p2 = manager.joinRoom(roomId, 'Bob 🐺', '🐺');
const p3 = manager.joinRoom(roomId, 'Cúc 🛡️', '🛡️');
const p4 = manager.joinRoom(roomId, 'Dũng 🔮', '🔮');
const p5 = manager.joinRoom(roomId, 'Hoa 🧙‍♀️', '🧙‍♀️');
const p6 = manager.joinRoom(roomId, 'Giang 🃏', '🃏');

console.log(`✓ 1. Tạo phòng [${roomId}] và 6 người chơi tham gia đầy đủ`);

// 3. Khởi động ván đấu
manager.startGame(roomId, host.playerId);
console.log('✓ 2. Quản trò bắt đầu ván đấu -> Chuyển sang Đêm 1');

// Lấy view của từng người chơi
const getViews = () => ({
  host: manager.getMaskedState(roomId, host.playerId),
  p2: manager.getMaskedState(roomId, p2.playerId),
  p3: manager.getMaskedState(roomId, p3.playerId),
  p4: manager.getMaskedState(roomId, p4.playerId),
  p5: manager.getMaskedState(roomId, p5.playerId),
  p6: manager.getMaskedState(roomId, p6.playerId),
});

let views = getViews();
const allPlayerViews = [views.host, views.p2, views.p3, views.p4, views.p5, views.p6];
const wolfView = allPlayerViews.find((v) => v.myRole === 'WEREWOLF');
const nonWolfView = allPlayerViews.find((v) => v.myRole !== 'WEREWOLF');

assert.notStrictEqual(wolfView, undefined);
assert.notStrictEqual(nonWolfView, undefined);

// 4. KIỂM THỬ PHÂN QUYỀN CHAT BAN ĐÊM (TASK-203)
// - Dân làng cố chat kênh PUBLIC ban đêm -> Phải bị chặn
assert.throws(() => {
  manager.sendChatMessage(roomId, nonWolfView.myPlayerId, 'Có ai ở đó không?', 'PUBLIC');
}, /Đêm tối mọi người đều đang ngủ/);

// - Dân làng cố chat kênh Sói -> Phải bị chặn
assert.throws(() => {
  manager.sendChatMessage(roomId, nonWolfView.myPlayerId, 'Tôi là sói nè', 'WOLF');
}, /Chỉ Ma Sói mới có thể truy cập/);

// - Sói chat trong Hang Sói (kênh WOLF) -> Thành công
manager.sendChatMessage(roomId, wolfView.myPlayerId, 'Đêm nay cắn ai đây đồng đội ơi?', 'WOLF');

// - Kiểm tra Zero-Knowledge: Sói thấy tin, Dân hoàn toàn KHÔNG thấy tin kênh Sói
const wolfUpdated = manager.getMaskedState(roomId, wolfView.myPlayerId);
const nonWolfUpdated = manager.getMaskedState(roomId, nonWolfView.myPlayerId);

assert.strictEqual(
  wolfUpdated.chatMessages.some((m) => m.text.includes('cắn ai đây')),
  true,
  'Sói phải thấy tin nhắn trong Hang Sói'
);
assert.strictEqual(
  nonWolfUpdated.chatMessages.some((m) => m.text.includes('cắn ai đây')),
  false,
  'Dân Làng tuyệt đối không được đọc tin Hang Sói (Zero-Knowledge)'
);
console.log('✓ 3. Phân quyền kênh Chat Hang Sói bảo mật Zero-Knowledge tuyệt đối');

// 5. HÀNH ĐỘNG BAN ĐÊM & CHUYỂN SANG NGÀY
// Sói cắn người chơi nonWolfView
manager.submitNightAction(roomId, wolfView.myPlayerId, {
  actionType: 'WEREWOLF_KILL',
  targetId: nonWolfView.myPlayerId,
});

// Chuyển sang Ngày 1 Thảo luận
manager.resolveNightToDay(roomId);
views = getViews();
assert.strictEqual(views.host.phase, 'DAY_DISCUSSION');
const victim = views.host.players.find((p) => p.id === nonWolfView.myPlayerId);
assert.strictEqual(victim.isAlive, false, 'Nạn nhân bị Sói cắn phải hy sinh');
console.log('✓ 4. Giải quyết đêm thành công, nạn nhân hy sinh, chuyển sang Ngày Thảo Luận');

// 6. KIỂM THỬ PHÂN QUYỀN CHAT CÕI ÂM (DEAD CHANNEL)
// Nạn nhân đã chết thử chat kênh Làng (PUBLIC) -> Phải bị chặn để chống spoil
assert.throws(() => {
  manager.sendChatMessage(roomId, nonWolfView.myPlayerId, 'Tôi biết ai là sói rồi nè!', 'PUBLIC');
}, /Bạn đã hy sinh, linh hồn chỉ có thể trò chuyện ở cõi âm/);

// Nạn nhân chat kênh Cõi Âm (DEAD) -> Thành công
manager.sendChatMessage(roomId, nonWolfView.myPlayerId, 'Cay quá bị sói cắn đêm 1!', 'DEAD');

// Người sống (Wolf) không thấy tin kênh DEAD, người chết (nonWolf) thấy tin kênh DEAD
const deadView = manager.getMaskedState(roomId, nonWolfView.myPlayerId);
const aliveView = manager.getMaskedState(roomId, wolfView.myPlayerId);

assert.strictEqual(deadView.chatMessages.some((m) => m.text.includes('Cay quá')), true);
assert.strictEqual(aliveView.chatMessages.some((m) => m.text.includes('Cay quá')), false);
console.log('✓ 5. Phân quyền Kênh Chat Cõi Âm chuẩn xác: Người sống không nhận tin người chết');

// 7. BẮT ĐẦU BỎ PHIẾU TREO CỔ (TASK-202)
manager.startDayVoting(roomId);
views = getViews();
assert.strictEqual(views.host.phase, 'DAY_VOTING');

// Với 6 người chơi, hệ thống tự động cân bằng 2 Ma Sói
const wolfViews = allPlayerViews.filter((v) => v.myRole === 'WEREWOLF');
assert.strictEqual(wolfViews.length, 2, 'Với 6 người chơi, hệ thống phân bổ đúng 2 Ma Sói');
const [wolf1, wolf2] = wolfViews;

// Các cử tri còn sống
const livingVoters = views.host.players.filter((p) => p.isAlive);
// Cử tri đầu tiên bỏ phiếu cho Sói 1
const firstVoter = livingVoters[0];
manager.castVote(roomId, firstVoter.id, wolf1.myPlayerId);

// Kiểm tra Live Tally đếm đúng số phiếu khi đang ở DAY_VOTING
const tallyView = manager.getMaskedState(roomId, views.host.myPlayerId);
assert.strictEqual(tallyView.phase, 'DAY_VOTING');
assert.strictEqual(tallyView.voteTally?.[wolf1.myPlayerId], 1);
console.log('✓ 6. Bỏ phiếu công khai & Live Tally đếm chuẩn xác 1 phiếu đầu tiên cho Ma Sói #1');

// Các cử tri còn lại bỏ phiếu nốt cho Sói 1 để kích hoạt concludeDayVoting tự động
livingVoters.slice(1).forEach((p) => {
  manager.castVote(roomId, p.id, wolf1.myPlayerId);
});

// Sói 1 bị treo cổ, nhưng vẫn còn Sói 2 sống -> Ván đấu chuyển sang Đêm 2
const night2State = manager.getMaskedState(roomId, host.playerId);
assert.strictEqual(night2State.phase, 'NIGHT');
assert.strictEqual(night2State.dayNumber, 2);
console.log('✓ 7. Treo cổ Ma Sói #1 thành công! Vẫn còn 1 Ma Sói ẩn mình -> Chuyển sang Đêm thứ 2');

// 8. ĐÊM 2: SÓI 2 HÀNH ĐỘNG & CHUYỂN SANG NGÀY 2
manager.resolveNightToDay(roomId);
const day2State = manager.getMaskedState(roomId, host.playerId);
assert.strictEqual(day2State.phase, 'DAY_DISCUSSION');

// Chuyển sang Bỏ Phiếu Ngày 2
manager.startDayVoting(roomId);

// Cư dân bỏ phiếu treo cổ nốt Sói 2
const livingDay2 = day2State.players.filter((p) => p.isAlive);
livingDay2.forEach((p) => {
  manager.castVote(roomId, p.id, wolf2.myPlayerId);
});

// 9. TỔNG KẾT VÁN ĐẤU & CÔNG KHAI DANH TÍNH (TASK-204)
// Cả 2 Sói đã bị tiêu diệt -> Dân Làng Thắng!
const finalState = manager.getMaskedState(roomId, host.playerId);
assert.strictEqual(finalState.phase, 'GAME_OVER');
assert.strictEqual(finalState.winner, 'VILLAGERS');
assert.strictEqual(Object.keys(finalState.revealedRoles).length, 6, 'Toàn bộ 6 vai trò được lật bài công khai');
console.log('✓ 8. Tiêu diệt toàn bộ Ma Sói -> Phe Dân Làng Thắng & Công khai toàn bộ danh tính');

console.log('🎉 TOÀN BỘ KỊCH BẢN FULL MATCH 2 VÒNG NGÀY ĐÊM & PHÂN QUYỀN CHAT STREAM ĐÃ PASS 100%!');
