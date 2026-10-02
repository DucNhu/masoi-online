import assert from 'node:assert';
import { RoomManager } from '../src/logic/roomManager.ts';

console.log('--- BẮT ĐẦU KIỂM THỬ WEBRTC VOICE SIGNALING & AUDIO PERMISSIONS ---');

const manager = new RoomManager();

// 1. Tạo phòng & người chơi tham gia
const host = manager.createRoom('Minh 👑', '👑');
const roomId = host.roomId;

const p2 = manager.joinRoom(roomId, 'Thảo 🐺', '🐺');
const p3 = manager.joinRoom(roomId, 'Bình 🛡️', '🛡️');
const p4 = manager.joinRoom(roomId, 'An 🔮', '🔮');

// 2. Bắt đầu ván đấu -> Đêm 1
manager.startGame(roomId, host.playerId);
console.log('✓ 1. Ván đấu bắt đầu, chuyển sang Đêm 1');

// Lấy danh sách views
const views = [
  manager.getMaskedState(roomId, host.playerId),
  manager.getMaskedState(roomId, p2.playerId),
  manager.getMaskedState(roomId, p3.playerId),
  manager.getMaskedState(roomId, p4.playerId),
];

const wolfView = views.find((v) => v.myRole === 'WEREWOLF');
const nonWolfView = views.find((v) => v.myRole !== 'WEREWOLF');

assert.notStrictEqual(wolfView, undefined);
assert.notStrictEqual(nonWolfView, undefined);

// 3. Đăng ký nhận Voice Signals
const receivedSignals = [];
const unsubscribeVoice = manager.subscribeVoiceSignal(roomId, (signal) => {
  receivedSignals.push(signal);
});

// TEST 1: Night Auto-Mute: Dân làng cố nói ban đêm -> Phải bị chặn
assert.throws(() => {
  manager.sendVoiceSignal(roomId, {
    senderId: nonWolfView.myPlayerId,
    receiverId: '*',
    signalType: 'MUTE_STATE',
    data: 'speaking',
    timestamp: Date.now(),
  });
}, /Night Auto-Mute: Đêm tối cả làng ngủ say/);
console.log('✓ 2. Night Auto-Mute chặn thành công dân làng phát giọng nói ban đêm');

// TEST 2: Sói cố truyền giọng nói ban đêm tới Dân làng -> Phải bị chặn
assert.throws(() => {
  manager.sendVoiceSignal(roomId, {
    senderId: wolfView.myPlayerId,
    receiverId: nonWolfView.myPlayerId,
    signalType: 'OFFER',
    data: 'sdp_offer_secret',
    timestamp: Date.now(),
  });
}, /Không thể truyền tín hiệu âm thanh tới người ngoài bầy Sói/);
console.log('✓ 3. Chặn rò rỉ âm thanh của Sói sang Dân làng trong đêm');

// TEST 3: Chuyển sang Ngày Thảo Luận (resolveNightToDay)
// Giả sử nonWolfView bị cắn hy sinh
manager.submitNightAction(roomId, wolfView.myPlayerId, {
  actionType: 'WEREWOLF_KILL',
  targetId: nonWolfView.myPlayerId,
});
manager.resolveNightToDay(roomId);

const dayState = manager.getMaskedState(roomId, host.playerId);
assert.strictEqual(dayState.phase, 'DAY_DISCUSSION');
console.log('✓ 4. Chuyển sang Ngày 1 Thảo Luận');

// TEST 4: Người sống nói chuyện ban ngày (setVoiceState)
const alivePlayer = dayState.players.find((p) => p.isAlive);
manager.setVoiceState(roomId, alivePlayer.id, true, false);

const updatedDayView = manager.getMaskedState(roomId, host.playerId);
const talkingPlayer = updatedDayView.players.find((p) => p.id === alivePlayer.id);
assert.strictEqual(talkingPlayer.isSpeaking, true);
assert.strictEqual(talkingPlayer.isMuted, false);
console.log('✓ 5. Cập nhật và đồng bộ trạng thái Micro (Speaking / Muted) thời gian thực');

// TEST 5: Người chết cố gửi giọng nói tới người sống -> Phải bị chặn
const deadPlayer = updatedDayView.players.find((p) => !p.isAlive);
assert.throws(() => {
  manager.sendVoiceSignal(roomId, {
    senderId: deadPlayer.id,
    receiverId: alivePlayer.id,
    signalType: 'OFFER',
    data: 'ghost_whisper',
    timestamp: Date.now(),
  });
}, /Linh hồn không thể truyền giọng nói tới người sống/);
console.log('✓ 6. Âm dương cách biệt: Linh hồn người chết bị chặn nói chuyện với người sống');

unsubscribeVoice();
console.log('🎉 TOÀN BỘ BỘ KIỂM THỬ WEBRTC VOICE SIGNALING ĐÃ PASS 100%!');
