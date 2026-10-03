import assert from 'node:assert';
import { RoomManager } from '../src/logic/roomManager.js';
import { getGoldenHourStatus, registerRSVP, formatCountdown, GOLDEN_SESSIONS } from '../src/utils/goldenHours.js';

console.log('--- BẮT ĐẦU KIỂM THỬ SPRINT 6: CHỐNG BOT KHUNG GIỜ VÀNG & SẢNH BÀN CHƠI ---');

// ==========================================
// TEST 1: Khám Phá Bàn Chơi Công Khai (Public Table Discovery)
// ==========================================
console.log('⏳ Test 1: Khám phá danh sách bàn chơi công khai (Public Tables)...');
const rm = new RoomManager();

// Khi chưa tạo bàn nào, hệ thống tự động sinh bàn cộng đồng mẫu
const initialTables = rm.listPublicTables();
assert(initialTables.length >= 2, `Cần có ít nhất 2 bàn cộng đồng mẫu ban đầu (nhận được: ${initialTables.length})`);
assert(initialTables[0].phase === 'LOBBY', 'Bàn mẫu ban đầu phải ở trạng thái LOBBY');
assert(initialTables[0].tableName.length > 0, 'Bàn phải có tên bàn rõ ràng');
assert(typeof initialTables[0].currentPlayers === 'number', 'Phải có số người chơi hiện tại');
assert(typeof initialTables[0].maxPlayers === 'number', 'Phải có số người tối đa');
console.log(`✓ PASS TEST 1: Khởi tạo danh sách bàn chơi công khai thành công (${initialTables.length} bàn mẫu).`);

// ==========================================
// TEST 2: Tạo Bàn Mới & Bảo Mật Bàn Riêng Tư (Zero-Knowledge)
// ==========================================
console.log('⏳ Test 2: Tạo bàn công khai mới & cách ly bàn riêng tư...');
const publicRoom = rm.createRoom('Chủ Bàn Sói', '🐺', {
  tableName: 'Bàn #999 • Chiến Trường Đỉnh Cao',
  maxPlayers: 10,
  enableMayor: true,
  isPrivate: false,
});

const privateRoom = rm.createRoom('Phòng Mật', '🔒', {
  tableName: 'Bàn Bí Mật Bạn Bè',
  isPrivate: true,
});

const updatedTables = rm.listPublicTables();
const foundPublic = updatedTables.find(t => t.roomId === publicRoom.roomId);
const foundPrivate = updatedTables.find(t => t.roomId === privateRoom.roomId);

assert(foundPublic !== undefined, 'Bàn công khai phải xuất hiện trong danh sách public tables');
assert.strictEqual(foundPublic.tableName, 'Bàn #999 • Chiến Trường Đỉnh Cao');
assert.strictEqual(foundPublic.enableMayor, true);
assert.strictEqual(foundPrivate, undefined, 'Bàn riêng tư tuyệt đối KHÔNG được xuất hiện trong public tables');
// Đảm bảo không rò rỉ vai trò người chơi
assert(!('role' in foundPublic), 'PublicTableInfo tuyệt đối không được chứa vai trò người chơi (Zero-Knowledge)');
console.log('✓ PASS TEST 2: Tạo bàn công khai thành công & cách ly bàn riêng tư an toàn.');

// ==========================================
// TEST 3: Động Thái Tham Gia Bàn (Join Table Lifecycle)
// ==========================================
console.log('⏳ Test 3: Tham gia bàn chơi trực tiếp (Join Table Lifecycle)...');
const beforeCount = foundPublic.currentPlayers;
rm.joinRoom(publicRoom.roomId, 'Thợ Săn #2', '🏹');

const tablesAfterJoin = rm.listPublicTables();
const tableAfterJoin = tablesAfterJoin.find(t => t.roomId === publicRoom.roomId);
assert.strictEqual(tableAfterJoin.currentPlayers, beforeCount + 1, 'Số người chơi trong bàn phải tăng thêm 1');
console.log(`✓ PASS TEST 3: Tham gia bàn chơi trực tiếp thành công (${tableAfterJoin.currentPlayers} người).`);

// ==========================================
// TEST 4: Engine Khung Giờ Vàng (Golden Hours Status & Countdown)
// ==========================================
console.log('⏳ Test 4: Kiểm tra tính toán Khung Giờ Vàng Săn Sói...');
assert(GOLDEN_SESSIONS.length === 3, 'Hệ thống phải có đủ 3 phiên giờ vàng trong ngày');

// Giả lập 12:00 trưa -> Phải trúng Phiên Trưa (11:30 - 13:30)
const noonDate = new Date('2026-10-03T12:00:00');
const noonStatus = getGoldenHourStatus(noonDate);
assert.strictEqual(noonStatus.isOpen, true, '12:00 trưa phải là giờ mở cổng làng');
assert.strictEqual(noonStatus.activeSession?.id, 'NOON', 'Phiên đang mở phải là NOON');

// Giả lập 20:45 tối -> Phải trúng Phiên Tối Hoàng Kim (19:30 - 23:30)
const primeDate = new Date('2026-10-03T20:45:00');
const primeStatus = getGoldenHourStatus(primeDate);
assert.strictEqual(primeStatus.isOpen, true, '20:45 tối phải là giờ mở cổng làng');
assert.strictEqual(primeStatus.activeSession?.id, 'PRIME', 'Phiên đang mở phải là PRIME');

// Giả lập 15:30 chiều -> Ngoài khung giờ vàng
const offDate = new Date('2026-10-03T15:30:00');
const offStatus = getGoldenHourStatus(offDate);
assert.strictEqual(offStatus.isOpen, false, '15:30 chiều phải ở trạng thái chờ mở cổng');
assert.strictEqual(offStatus.nextSession.id, 'PRIME', 'Phiên tiếp theo phải là PRIME');
assert(offStatus.secondsRemaining > 0, 'Phải có số giây đếm ngược > 0');
console.log('✓ PASS TEST 4: Tính toán chính xác trạng thái Khung Giờ Vàng theo mốc thời gian.');

// ==========================================
// TEST 5: Cơ Chế Báo Danh Chống Bot (RSVP Persistence & Countdown Format)
// ==========================================
console.log('⏳ Test 5: Báo danh điểm danh hẹn giờ (RSVP) & Format đếm ngược...');
const formatted1 = formatCountdown(3665); // 1h 1m 5s
assert(formatted1.includes('01h') && formatted1.includes('01m') && formatted1.includes('05s'), `Format giờ chưa đúng: ${formatted1}`);

const formatted2 = formatCountdown(45); // 00m 45s
assert(formatted2.includes('45s'), `Format giây chưa đúng: ${formatted2}`);

const rsvpResult = registerRSVP();
assert(typeof rsvpResult.newCount === 'number', 'Kết quả RSVP phải có newCount dạng số');
assert(rsvpResult.newCount > 0, 'Số lượng người báo danh phải > 0');
console.log(`✓ PASS TEST 5: Format đếm ngược chuẩn xác & cơ chế Báo danh hoạt động (${rsvpResult.newCount} người).`);

console.log('🎉 TOÀN BỘ 5 TEST CASES SPRINT 6 (CHỐNG BOT & SẢNH BÀN CHƠI) ĐÃ PASS 100%!');
