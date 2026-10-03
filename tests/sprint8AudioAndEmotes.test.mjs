import assert from 'node:assert';
import { RoomManager } from '../src/logic/roomManager.js';
import {
  isSoundEnabled,
  setSoundEnabled,
  playVoteSound,
  playWolfHowl,
  playDeathBell,
  playDawnChime,
  playRoosterMorning,
  playCourtGavel,
} from '../src/utils/soundEffects.js';
import { IN_GAME_EMOTES } from '../src/components/EmotePicker.js';

console.log('--- BẮT ĐẦU KIỂM THỬ SPRINT 8: ÂM THANH WEB AUDIO & BIỂU CẢM IN-GAME ---');

// Mock localStorage if in Node environment
const mockStorage = new Map();
if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = {
    getItem: (key) => mockStorage.get(key) || null,
    setItem: (key, val) => mockStorage.set(key, String(val)),
    removeItem: (key) => mockStorage.delete(key),
    clear: () => mockStorage.clear(),
  };
}
if (typeof globalThis.window === 'undefined') {
  globalThis.window = { localStorage: globalThis.localStorage };
}

// ==========================================
// TEST 1: Cấu hình Bật/Tắt Âm Thanh & Độ An Toàn Headless
// ==========================================
console.log('⏳ Test 1: Kiểm tra cấu hình Âm thanh & độ an toàn môi trường Headless...');
assert.strictEqual(isSoundEnabled(), true, 'Mặc định âm thanh phải được BẬT');
setSoundEnabled(false);
assert.strictEqual(isSoundEnabled(), false, 'Sau khi tắt, trạng thái âm thanh phải là FALSE');
setSoundEnabled(true);
assert.strictEqual(isSoundEnabled(), true, 'Bật lại âm thanh thành công');

// Thực thi các hàm âm thanh trong môi trường test (không ném Exception)
assert.doesNotThrow(() => {
  playVoteSound();
  playWolfHowl();
  playDeathBell();
  playDawnChime();
  playRoosterMorning();
  playCourtGavel();
}, 'Các phương thức âm thanh phải an toàn tuyệt đối, không crash khi không có AudioContext');
console.log('✓ PASS TEST 1: Cấu hình âm thanh & an toàn Web Audio API hoạt động hoàn hảo.');

// ==========================================
// TEST 2: Danh Mục Biểu Cảm In-Game (Emote Catalog)
// ==========================================
console.log('⏳ Test 2: Kiểm tra danh mục biểu cảm in-game (IN_GAME_EMOTES)...');
assert(IN_GAME_EMOTES.length >= 8, `Cần ít nhất 8 biểu cảm nhanh (nhận được: ${IN_GAME_EMOTES.length})`);
const wolfEmote = IN_GAME_EMOTES.find(e => e.id === 'wolf');
const voteEmote = IN_GAME_EMOTES.find(e => e.id === 'vote');
const shhEmote = IN_GAME_EMOTES.find(e => e.id === 'shh');

assert(wolfEmote !== undefined, 'Phải có biểu cảm Nghi Sói');
assert.strictEqual(wolfEmote.emoji, '🐺');
assert(voteEmote !== undefined, 'Phải có biểu cảm Treo Cổ');
assert.strictEqual(voteEmote.emoji, '⚖️');
assert(shhEmote !== undefined, 'Phải có biểu cảm Giữ Im Lặng');
assert.strictEqual(shhEmote.emoji, '🤫');
console.log(`✓ PASS TEST 2: Danh mục ${IN_GAME_EMOTES.length} biểu cảm nhanh đầy đủ và hợp lệ.`);

// ==========================================
// TEST 3: Gửi Biểu Cảm Qua Kênh Chat Phòng Chơi
// ==========================================
console.log('⏳ Test 3: Phát biểu cảm vào kênh chat phòng chơi thời gian thực...');
const rm = new RoomManager();
const created = rm.createRoom('Chủ Bàn Sói', '🐺');
const p2 = rm.joinRoom(created.roomId, 'Dân Làng #2', '🌾');

// Giả lập gửi biểu cảm nhanh vào kênh PUBLIC khi ở LOBBY
const testEmote = wolfEmote;
rm.sendChatMessage(
  created.roomId,
  created.playerId,
  `${testEmote.emoji} [${testEmote.label}]`,
  'PUBLIC'
);

const serverRoom = rm.getServerRoom(created.roomId);
assert(serverRoom !== undefined, 'Phải lấy được phòng');
const lastMsg = serverRoom.chatMessages[serverRoom.chatMessages.length - 1];

assert(lastMsg !== undefined, 'Tin nhắn biểu cảm phải được lưu vào phòng');
assert.strictEqual(lastMsg.senderId, created.playerId);
assert.strictEqual(lastMsg.text, '🐺 [Nghi Sói]');
assert.strictEqual(lastMsg.channel, 'PUBLIC');
console.log('✓ PASS TEST 3: Gửi biểu cảm nhanh vào chat phòng chơi thành công.');

// ==========================================
// TEST 4: Phân Quyền Biểu Cảm Kênh Riêng (Zero-Knowledge)
// ==========================================
console.log('⏳ Test 4: Phân quyền biểu cảm Hang Sói & Cõi Âm...');
// Tham gia thêm đủ tối thiểu 4 người chơi
rm.joinRoom(created.roomId, 'Thợ Săn #3', '🏹');
rm.joinRoom(created.roomId, 'Tiên Tri #4', '🔮');

// Bắt đầu game để phân vai
rm.startGame(created.roomId, created.playerId);
const roomAfterStart = rm.getServerRoom(created.roomId);
assert(roomAfterStart !== undefined);

// Tìm người chơi sói và dân
const wolfPlayer = roomAfterStart.players.find(p => p.role === 'WEREWOLF');
const villagerPlayer = roomAfterStart.players.find(p => p.role !== 'WEREWOLF');

if (wolfPlayer) {
  // Sói gửi biểu cảm vào hang sói
  assert.doesNotThrow(() => {
    rm.sendChatMessage(created.roomId, wolfPlayer.id, '🐺 [Sói Hành Động]', 'WOLF');
  }, 'Sói được phép gửi biểu cảm vào hang sói');
}

if (villagerPlayer) {
  // Dân gửi biểu cảm vào hang sói -> Bị chặn
  assert.throws(() => {
    rm.sendChatMessage(created.roomId, villagerPlayer.id, '🐺 [Giả Sói]', 'WOLF');
  }, /Chỉ Ma Sói mới có thể truy cập/);
}
console.log('✓ PASS TEST 4: Bảo mật phân quyền kênh biểu cảm được duy trì tuyệt đối.');

console.log('\n🎉 TẤT CẢ 4/4 TESTS SPRINT 8 PASS 100%! HỆ THỐNG ÂM THANH & BIỂU CẢM ĐÃ HOÀN TẤT!');
