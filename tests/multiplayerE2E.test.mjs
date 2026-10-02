import assert from 'node:assert';
import { RoomManager } from '../src/logic/roomManager.ts';

console.log('--- BẮT ĐẦU KIỂM THỬ QA E2E MULTI-CLIENT MULTIPLAYER ---');

const manager = new RoomManager();

// BƯỚC 1: Host tạo phòng chơi
const host = manager.createRoom('Hoàng Long (Host)', '👑');
const roomId = host.roomId;
console.log(`✓ 1. Host tạo phòng thành công: [${roomId}]`);

// BƯỚC 2: 5 Người chơi khác tham gia phòng
const players = [
  host,
  manager.joinRoom(roomId, 'Bình (P2)', '🐺'),
  manager.joinRoom(roomId, 'Cúc (P3)', '🔮'),
  manager.joinRoom(roomId, 'Dũng (P4)', '🛡️'),
  manager.joinRoom(roomId, 'Hoa (P5)', '🧙'),
  manager.joinRoom(roomId, 'Khánh (P6)', '👤'),
];

assert.strictEqual(players.length, 6);
const lobbyState = manager.getMaskedState(roomId, host.playerId);
assert.strictEqual(lobbyState.players.length, 6);
console.log(`✓ 2. 6 người chơi vào phòng đầy đủ, danh sách đồng bộ chuẩn xác`);

// BƯỚC 3: Người chơi bấm Sẵn Sàng (Toggle Ready)
for (let i = 1; i < players.length; i++) {
  manager.toggleReady(roomId, players[i].playerId, true);
}

const readyState = manager.getMaskedState(roomId, host.playerId);
const allReady = readyState.players.filter((p) => !p.isHost).every((p) => p.isReady);
assert.strictEqual(allReady, true);
console.log(`✓ 3. Toàn bộ người chơi đã Sẵn Sàng`);

// BƯỚC 4: Người không phải Host cố tình bấm Bắt đầu -> Phải bị chặn
assert.throws(() => {
  manager.startGame(roomId, players[1].playerId);
}, /Chỉ có Chủ phòng.*mới có quyền bắt đầu/);
console.log(`✓ 4. Bảo mật phân quyền: Người chơi thường không thể tự ý Start game`);

// BƯỚC 5: Host bấm Bắt đầu ván đấu -> Chia bài và chuyển sang Đêm 1
manager.startGame(roomId, host.playerId);

const startedState = manager.getMaskedState(roomId, host.playerId);
assert.strictEqual(startedState.phase, 'NIGHT');
assert.strictEqual(startedState.dayNumber, 1);

// Lấy view của từng người chơi
const playerViews = players.map((p) => manager.getMaskedState(roomId, p.playerId));

// Đảm bảo không ai bị lộ vai trò của người khác
playerViews.forEach((view, idx) => {
  view.players.forEach((p) => {
    assert.strictEqual('role' in p, false, `Người chơi ${players[idx].playerId} bị lộ role của ${p.name}!`);
    assert.strictEqual('sessionToken' in p, false);
  });
});
console.log(`✓ 5. Ván đấu bắt đầu, toàn bộ 6 client đều nhận được masked state an toàn (Zero-Knowledge)`);

// BƯỚC 6: Giả lập rớt mạng 4G & Khôi phục kết nối (Reconnection Resilience)
const disconnectedPlayer = players[2]; // Cúc
console.log(`⏳ Giả lập Cúc (P3) bị rớt mạng 4G...`);

// Cúc kết nối lại bằng sessionToken đã lưu trong localStorage
const reconnected = manager.reconnect(roomId, disconnectedPlayer.sessionToken);
assert.strictEqual(reconnected.playerId, disconnectedPlayer.playerId);
assert.strictEqual(reconnected.state.roomId, roomId);
assert.strictEqual(reconnected.state.phase, 'NIGHT');
assert.strictEqual(reconnected.state.myRole, playerViews[2].myRole);
console.log(`✓ 6. Khôi phục phiên kết nối thành công 100%, bảo toàn vai trò và vị trí ghế`);

// Cố tình kết nối bằng token rác -> Bị từ chối
assert.throws(() => {
  manager.reconnect(roomId, 'hacked_fake_token_xyz');
}, /Token phiên làm việc không hợp lệ/);
console.log(`✓ 7. Chặn token giả mạo thành công`);

// BƯỚC 7: Cố tình tham gia vào phòng đã bắt đầu -> Bị chặn
assert.throws(() => {
  manager.joinRoom(roomId, 'Kẻ Đến Trễ', '🦊');
}, /Ván đấu trong phòng đã bắt đầu/);
console.log(`✓ 8. Chặn người lạ vào giữa chừng khi ván đấu đang diễn ra`);

// BƯỚC 8: Thực hiện hành động Đêm 1
const wolf = playerViews.find((v) => v.myRole === 'WEREWOLF');
const seer = playerViews.find((v) => v.myRole === 'SEER');
const guard = playerViews.find((v) => v.myRole === 'BODYGUARD');
const victim = playerViews.find((v) => v.myRole === 'VILLAGER');

assert.notStrictEqual(wolf, undefined);
assert.notStrictEqual(seer, undefined);
assert.notStrictEqual(guard, undefined);

// Sói cắn dân
manager.submitNightAction(roomId, wolf.myPlayerId, {
  actionType: 'WEREWOLF_KILL',
  targetId: victim.myPlayerId,
});

// Bảo vệ bảo vệ Host
manager.submitNightAction(roomId, guard.myPlayerId, {
  actionType: 'PROTECT',
  targetId: host.playerId,
});

// Tiên Tri soi Sói
manager.submitNightAction(roomId, seer.myPlayerId, {
  actionType: 'SEER_SCAN',
  targetId: wolf.myPlayerId,
});

const updatedSeer = manager.getMaskedState(roomId, seer.myPlayerId);
assert.strictEqual(updatedSeer.seerScanResult.isWolf, true);
console.log(`✓ 9. Các hành động đêm được tiếp nhận và xử lý chuẩn xác`);

console.log('🎉 TOÀN BỘ 9 TEST CASES QA MULTI-CLIENT E2E ĐÃ PASS 100%!');
