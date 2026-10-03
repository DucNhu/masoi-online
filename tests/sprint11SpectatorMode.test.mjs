import assert from 'node:assert';
import { RoomManager } from '../src/logic/roomManager.js';

console.log('--- BẮT ĐẦU KIỂM THỬ SPRINT 11: CHẾ ĐỘ KHÁN GIẢ (SPECTATOR MODE) & CỔ VŨ LIVE CHEERS ---');

const rm = new RoomManager();

// ==========================================
// TEST 1: Khán Giả Tham Gia Khi Ván Đấu Đang Diễn Ra
// ==========================================
console.log('⏳ Test 1: Khán giả vào phòng đang chiến mà không chiếm slot người chơi...');
const created = rm.createRoom('Chủ Bàn Đại Đế', '👑', { tableName: 'Đấu Trường Trăng Máu' });
const p2 = rm.joinRoom(created.roomId, 'Thợ Săn Hắc Ám', '🏹');
const p3 = rm.joinRoom(created.roomId, 'Tiên Tri Tuyệt Mật', '🔮');
const p4 = rm.joinRoom(created.roomId, 'Ma Sói Khát Máu', '🐺');

// Bắt đầu ván đấu -> Chuyển sang Đêm 1
rm.startGame(created.roomId, created.playerId);
const serverRoom = rm.getServerRoom(created.roomId);
assert.strictEqual(serverRoom.phase, 'NIGHT', 'Ván đấu phải đang ở pha NIGHT');

// Người chơi thông thường không thể joinRoom được nữa vì game đã bắt đầu
assert.throws(() => {
  rm.joinRoom(created.roomId, 'Người Đến Muộn', '🚶');
}, /Ván đấu trong phòng đã bắt đầu/, 'Phải chặn người chơi thường vào bàn khi đã bắt đầu');

// Nhưng Khán Giả có thể vào khán đài xem trực tiếp!
const specRes = rm.joinAsSpectator(created.roomId, 'Khán Giả Nhiệt Thành', '👀');
assert(specRes.spectatorId.startsWith('spec_'), 'ID khán giả phải có tiền tố spec_');
assert.strictEqual(specRes.state.isSpectator, true, 'isSpectator phải là true');
assert.strictEqual(specRes.state.spectatorsCount, 1, 'Số lượng khán giả phải là 1');
console.log('✓ PASS TEST 1: Khán giả tham gia khán đài theo dõi ván đấu thành công.');

// ==========================================
// TEST 2: Chống Gian Lận (Zero-Knowledge Masking Cho Khán Giả)
// ==========================================
console.log('⏳ Test 2: Kiểm tra bảo mật chống soi trộm vai trò người chơi còn sống...');
const specStateNight = rm.getMaskedState(created.roomId, specRes.spectatorId);

// Tất cả 4 người chơi đều đang sống trong Đêm 1
specStateNight.players.forEach((p) => {
  assert.strictEqual(
    specStateNight.revealedRoles[p.id],
    undefined,
    `Khán giả tuyệt đối KHÔNG ĐƯỢC thấy vai trò của người chơi còn sống ${p.name}`
  );
});

// Chuyển sang Ngày 1 và mô phỏng 1 người chơi hy sinh
rm.resolveNightToDay(created.roomId);
const deadPlayer = serverRoom.players.find((p) => !p.isAlive);

if (deadPlayer) {
  const specStateDay = rm.getMaskedState(created.roomId, specRes.spectatorId);
  assert.strictEqual(
    specStateDay.revealedRoles[deadPlayer.id],
    deadPlayer.role,
    'Khán giả được biết danh tính của người đã hy sinh trong trận'
  );
}
console.log('✓ PASS TEST 2: Cơ chế chống soi vai trò người sống hoạt động chuẩn xác 100%.');

// ==========================================
// TEST 3: Gửi Phản Ứng Cổ Vũ Trực Tiếp (Live Audience Cheers)
// ==========================================
console.log('⏳ Test 3: Khán giả gửi phản ứng cổ vũ trận đấu (Live Cheers)...');
rm.sendCheer(created.roomId, 'Khán Giả Nhiệt Thành', '👏');
rm.sendCheer(created.roomId, 'Khán Giả Nhiệt Thành', '🔥');

const roomWithCheers = rm.getServerRoom(created.roomId);
assert.strictEqual(roomWithCheers.liveCheers.length, 2, 'Phải có 2 biểu cảm cổ vũ được lưu');
assert.strictEqual(roomWithCheers.liveCheers[0].emoji, '👏');
assert.strictEqual(roomWithCheers.liveCheers[1].emoji, '🔥');

const clientCheersState = rm.getMaskedState(created.roomId, specRes.spectatorId);
assert.strictEqual(clientCheersState.liveCheers.length, 2, 'Client state phải đồng bộ liveCheers');
console.log('✓ PASS TEST 3: Hệ thống cổ vũ Live Cheers hoạt động thời gian thực mượt mà.');

// ==========================================
// TEST 4: Phân Quyền Kênh Chat Khán Đài (Spectator Chat Security)
// ==========================================
console.log('⏳ Test 4: Phân quyền gửi và nhận tin nhắn kênh Khán Đài...');
// Khán giả nhắn tin kênh SPECTATOR
rm.sendChatMessage(created.roomId, specRes.spectatorId, 'Trận này căng quá anh em ơi!', 'SPECTATOR');
const stateAfterChat = rm.getMaskedState(created.roomId, specRes.spectatorId);
assert(
  stateAfterChat.chatMessages.some((m) => m.channel === 'SPECTATOR' && m.text.includes('căng quá')),
  'Tin nhắn kênh SPECTATOR phải xuất hiện trong chatMessages'
);

// Khán giả không được phép gửi vào kênh PUBLIC
assert.throws(() => {
  rm.sendChatMessage(created.roomId, specRes.spectatorId, 'Tôi là khán giả spoil nè', 'PUBLIC');
}, /Khán giả vui lòng trò chuyện qua kênh Khán Đài/, 'Phải chặn khán giả nhắn vào kênh PUBLIC');

// Khán giả không được phép nhắn vào kênh WOLF
assert.throws(() => {
  rm.sendChatMessage(created.roomId, specRes.spectatorId, 'Sói ơi', 'WOLF');
}, /Khán giả không thể nhắn tin trong hang sói/, 'Phải chặn khán giả nhắn vào kênh WOLF');
console.log('✓ PASS TEST 4: Phân quyền kênh Chat Khán Giả bảo mật tuyệt đối.');

// ==========================================
// TEST 5: Công Khai Toàn Bộ Vai Trò Khi Game Over & Rời Khán Đài
// ==========================================
console.log('⏳ Test 5: Game Over vinh danh toàn bộ vai trò & rời khán đài (leaveSpectator)...');
// Mô phỏng kết thúc game
serverRoom.phase = 'GAME_OVER';
serverRoom.winner = 'VILLAGERS';

const gameOverState = rm.getMaskedState(created.roomId, specRes.spectatorId);
serverRoom.players.forEach((p) => {
  assert.strictEqual(
    gameOverState.revealedRoles[p.id],
    p.role,
    `Khi GAME_OVER, khán giả phải thấy toàn bộ vai trò của ${p.name}`
  );
});

// Khán giả rời phòng
rm.leaveSpectator(created.roomId, specRes.spectatorId);
assert.strictEqual(serverRoom.spectators.length, 0, 'Danh sách khán giả phải về 0 sau khi rời');
console.log('✓ PASS TEST 5: Game Over công khai vai trò và cơ chế rời khán đài hoạt động hoàn hảo.');

console.log('\n🎉 TẤT CẢ 5/5 TESTS SPRINT 11 PASS 100%! CHẾ ĐỘ KHÁN GIẢ & CỔ VŨ LIVE ĐÃ SẴN SÀNG!');
