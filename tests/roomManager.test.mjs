import assert from 'node:assert';
import { RoomManager } from '../src/logic/roomManager.ts';

console.log('--- BẮT ĐẦU KIỂM THỬ ROOM MANAGER ENGINE ---');

const manager = new RoomManager();

// TEST 1: Tạo phòng mới
const hostRes = manager.createRoom('Người Sáng Lập', '👑');
assert.strictEqual(typeof hostRes.roomId, 'string');
assert.strictEqual(hostRes.roomId.length, 6);
assert.strictEqual(hostRes.state.players.length, 1);
assert.strictEqual(hostRes.state.players[0].isHost, true);
assert.strictEqual(hostRes.state.phase, 'LOBBY');
console.log('✓ PASS: Tạo phòng thành công với Host ghế số 1');

// TEST 2: Người chơi 2, 3, 4 tham gia phòng
const p2Res = manager.joinRoom(hostRes.roomId, 'Người Chơi 2', '🐺');
const p3Res = manager.joinRoom(hostRes.roomId, 'Người Chơi 3', '🛡️');
const p4Res = manager.joinRoom(hostRes.roomId, 'Người Chơi 4', '🔮');

const updatedHostView = manager.getMaskedState(hostRes.roomId, hostRes.playerId);
assert.strictEqual(updatedHostView.players.length, 4);
assert.strictEqual(updatedHostView.players[1].seatNumber, 2);
assert.strictEqual(updatedHostView.players[2].seatNumber, 3);
assert.strictEqual(updatedHostView.players[3].seatNumber, 4);
console.log('✓ PASS: 4 Người chơi tham gia phòng đầy đủ');

// TEST 3: Khôi phục kết nối (Reconnection Resilience)
const reconnectRes = manager.reconnect(hostRes.roomId, p2Res.sessionToken);
assert.strictEqual(reconnectRes.playerId, p2Res.playerId);
assert.strictEqual(reconnectRes.state.roomId, hostRes.roomId);
assert.throws(() => {
  manager.reconnect(hostRes.roomId, 'fake_invalid_token');
}, /Token phiên làm việc không hợp lệ/);
console.log('✓ PASS: Khôi phục phiên kết nối an toàn qua sessionToken');

// TEST 4: Bắt đầu ván đấu & Phân bổ vai trò ngẫu nhiên
manager.startGame(hostRes.roomId, hostRes.playerId);

const nightHostView = manager.getMaskedState(hostRes.roomId, hostRes.playerId);
assert.strictEqual(nightHostView.phase, 'NIGHT');
assert.strictEqual(nightHostView.dayNumber, 1);

// Thu thập vai trò thực tế của 4 người
const allViews = [
  manager.getMaskedState(hostRes.roomId, hostRes.playerId),
  manager.getMaskedState(hostRes.roomId, p2Res.playerId),
  manager.getMaskedState(hostRes.roomId, p3Res.playerId),
  manager.getMaskedState(hostRes.roomId, p4Res.playerId),
];

const assignedRoles = allViews.map((v) => v.myRole);
assert.strictEqual(assignedRoles.includes('WEREWOLF'), true, 'Phải có ít nhất 1 Ma Sói');
assert.strictEqual(assignedRoles.includes('SEER'), true, 'Phải có Tiên Tri');
assert.strictEqual(assignedRoles.includes('BODYGUARD'), true, 'Phải có Bảo Vệ');
console.log('✓ PASS: Chia vai trò cân bằng và chuyển sang Đêm 1');

// TEST 5: Hành động ban đêm
const seerPlayerView = allViews.find((v) => v.myRole === 'SEER');
const wolfPlayerView = allViews.find((v) => v.myRole === 'WEREWOLF');

assert.notStrictEqual(seerPlayerView, undefined);
assert.notStrictEqual(wolfPlayerView, undefined);

// Sói cắn người chơi khác
manager.submitNightAction(hostRes.roomId, wolfPlayerView.myPlayerId, {
  actionType: 'WEREWOLF_KILL',
  targetId: seerPlayerView.myPlayerId,
});

// Tiên Tri soi Sói
manager.submitNightAction(hostRes.roomId, seerPlayerView.myPlayerId, {
  actionType: 'SEER_SCAN',
  targetId: wolfPlayerView.myPlayerId,
});

const updatedSeerView = manager.getMaskedState(hostRes.roomId, seerPlayerView.myPlayerId);
assert.strictEqual(updatedSeerView.seerScanResult.targetId, wolfPlayerView.myPlayerId);
assert.strictEqual(updatedSeerView.seerScanResult.isWolf, true);
console.log('✓ PASS: Thực hiện hành động đêm và gửi kết quả soi chính xác cho Tiên Tri');

console.log('🎉 TOÀN BỘ CÁC BỘ TEST ROOM MANAGER ĐÃ PASS 100%!');
