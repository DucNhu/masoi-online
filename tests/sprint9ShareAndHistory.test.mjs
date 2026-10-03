import assert from 'node:assert';
import { RoomManager } from '../src/logic/roomManager.js';
import {
  generateInviteUrl,
  extractRoomCodeFromUrl,
  clearRoomCodeFromUrl,
  shareRoomInvite,
} from '../src/utils/shareInvite.js';

console.log('--- BẮT ĐẦU KIỂM THỬ SPRINT 9: CHIA SẺ PHÒNG & NHẬT KÝ VÁN ĐẤU ---');

// Mock browser window and location if in Node environment
if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    location: {
      origin: 'https://masoi.app',
      pathname: '/',
      search: '',
      href: 'https://masoi.app/',
    },
    history: {
      replaceState: (_state, _title, url) => {
        globalThis.window.location.href = `https://masoi.app${url}`;
        const qIdx = url.indexOf('?');
        globalThis.window.location.search = qIdx !== -1 ? url.substring(qIdx) : '';
      },
    },
  };
}

if (!globalThis.navigator) {
  globalThis.navigator = {};
}
globalThis.navigator.clipboard = {
  writeText: async (text) => {
    globalThis._lastClipboard = text;
  },
};

// ==========================================
// TEST 1: Tạo & Định Dạng Deep Link Mời Bạn Bè
// ==========================================
console.log('⏳ Test 1: Tạo liên kết mời tham gia phòng (generateInviteUrl)...');
const testRoomId = 'ABC888';
const inviteUrl = generateInviteUrl(testRoomId);
assert(inviteUrl.includes('?room=ABC888'), 'URL phải chứa tham số ?room=ABC888');
assert(inviteUrl.startsWith('https://masoi.app'), 'URL phải có origin hợp lệ');
console.log(`✓ PASS TEST 1: Tạo invite link thành công: ${inviteUrl}`);

// ==========================================
// TEST 2: Trích Xuất & Dọn Dẹp Mã Phòng Từ URL
// ==========================================
console.log('⏳ Test 2: Trích xuất mã phòng từ URL (extractRoomCodeFromUrl)...');
globalThis.window.location.search = '?room=WOLF99';
const extracted = extractRoomCodeFromUrl();
assert.strictEqual(extracted, 'WOLF99', 'Phải trích xuất chính xác mã phòng WOLF99');

// Hỗ trợ cả param rút gọn ?r=SÓI
globalThis.window.location.search = '?r=TEST01';
globalThis.window.location.href = 'https://masoi.app/?r=TEST01';
assert.strictEqual(extractRoomCodeFromUrl(), 'TEST01');

// Dọn dẹp URL sau khi trích xuất
clearRoomCodeFromUrl();
assert.strictEqual(globalThis.window.location.search, '', 'Sau khi clear, URL search params phải rỗng');
console.log('✓ PASS TEST 2: Trích xuất và làm sạch URL thành công.');

// ==========================================
// TEST 3: Chia Sẻ Phòng Qua Web Share / Clipboard
// ==========================================
console.log('⏳ Test 3: Chia sẻ liên kết mời vào phòng (shareRoomInvite)...');
const shareRes = await shareRoomInvite(testRoomId, 'Bàn Chiến Thần');
assert.strictEqual(shareRes.success, true);
assert(shareRes.message.includes(testRoomId), 'Thông báo phải nhắc tới mã phòng');
console.log(`✓ PASS TEST 3: Chia sẻ link mời thành công qua cơ chế ${shareRes.method}.`);

// ==========================================
// TEST 4: Tích Lũy Dòng Sự Kiện Nhật Ký Trận Đấu (Timeline History Log)
// ==========================================
console.log('⏳ Test 4: Ghi nhận và truy xuất nhật ký ván đấu chi tiết (Chronological History Log)...');
const rm = new RoomManager();
const created = rm.createRoom('Quản Trò Vĩ Đại', '👑', { tableName: 'Đêm Định Mệnh' });
const p2 = rm.joinRoom(created.roomId, 'Thợ Săn #2', '🏹');
const p3 = rm.joinRoom(created.roomId, 'Tiên Tri #3', '🔮');
const p4 = rm.joinRoom(created.roomId, 'Ma Sói #4', '🐺');

const room = rm.getServerRoom(created.roomId);
assert(room !== undefined);
assert(room.historyLog.length >= 4, 'Phải có log tạo phòng và 3 người chơi tham gia');

// Bắt đầu game -> Chuyển Đêm 1
rm.startGame(created.roomId, created.playerId);
assert(room.historyLog.some(l => l.includes('ĐÊM THỨ 1 BẮT ĐẦU')), 'Phải có log bắt đầu Đêm 1');

// Giải quyết đêm -> Chuyển Ngày 1
rm.resolveNightToDay(created.roomId);
assert(room.historyLog.some(l => l.includes('NGÀY THỨ 1 BẮT ĐẦU')), 'Phải có log chuyển sang Ngày 1');

// Chuyển sang bỏ phiếu treo cổ & vote xử tử Ma Sói #4
rm.startDayVoting(created.roomId);
assert(room.historyLog.some(l => l.includes('bỏ phiếu')), 'Phải có log bắt đầu bỏ phiếu');

const wolf = room.players.find((p) => p.role === 'WEREWOLF');
assert(wolf !== undefined, 'Phải có Ma Sói trong ván đấu');
const livingVillagers = room.players.filter((p) => p.id !== wolf.id && p.isAlive);

for (const v of livingVillagers) {
  rm.castVote(created.roomId, v.id, wolf.id);
}
rm.concludeDayVoting(created.roomId);
assert(room.historyLog.some(l => l.includes('xử tử')), 'Phải có log xử tử người chơi');

// Ma Sói chết -> Dân làng thắng
assert(room.historyLog.some(l => l.includes('CHIẾN THẮNG')), 'Phải có log vinh danh phe chiến thắng');
console.log(`✓ PASS TEST 4: Nhật ký ${room.historyLog.length} sự kiện được ghi lại tuần tự, minh bạch.`);

console.log('\n🎉 TẤT CẢ 4/4 TESTS SPRINT 9 PASS 100%! TÍNH NĂNG CHIA SẺ & NHẬT KÝ ĐÃ SẴN SÀNG!');
