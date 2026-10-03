import assert from 'node:assert';
import { RoomManager } from '../src/logic/roomManager.js';
import {
  getRankTier,
  getHunterProfile,
  saveHunterProfile,
  recordMatchResult,
  getCommunityLeaderboard,
  reportPlayer,
  RANK_TIERS,
} from '../src/utils/eloRating.js';
import { HUNTER_BADGES } from '../src/constants/achievements.js';

console.log('--- BẮT ĐẦU KIỂM THỬ SPRINT 7: BẢNG XẾP HẠNG THỢ SĂN & HUY HIỆU DANH DỰ ---');

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
// TEST 1: Thang Bậc Xếp Hạng & Huy Hiệu Danh Dự
// ==========================================
console.log('⏳ Test 1: Kiểm tra Thang Bậc Rank Elo & Danh Mục Huy Hiệu...');
assert.strictEqual(RANK_TIERS.length, 5, 'Phải có 5 bậc xếp hạng (Tập Sự -> Huyền Thoại)');
assert.strictEqual(getRankTier(800).id, 'NOVICE', '800 Elo phải là Tập Sự (NOVICE)');
assert.strictEqual(getRankTier(1150).id, 'HUNTER', '1150 Elo phải là Thợ Săn (HUNTER)');
assert.strictEqual(getRankTier(1350).id, 'CAPTAIN', '1350 Elo phải là Đội Trưởng (CAPTAIN)');
assert.strictEqual(getRankTier(1550).id, 'GRAND_SEER', '1550 Elo phải là Pháp Sư (GRAND_SEER)');
assert.strictEqual(getRankTier(1850).id, 'MYTHIC', '1850 Elo phải là Huyền Thoại (MYTHIC)');

assert(HUNTER_BADGES.length >= 10, 'Phải có ít nhất 10 Huy hiệu Danh dự');
const firstBloodBadge = HUNTER_BADGES.find(b => b.id === 'FIRST_BLOOD');
assert(firstBloodBadge !== undefined, 'Phải có huy hiệu FIRST_BLOOD');
assert.strictEqual(firstBloodBadge.category, 'GENERAL');
console.log(`✓ PASS TEST 1: 5 bậc xếp hạng & ${HUNTER_BADGES.length} huy hiệu danh dự chính xác.`);

// ==========================================
// TEST 2: Hồ Sơ Thợ Săn & Tính Điểm Elo Trận Đấu
// ==========================================
console.log('⏳ Test 2: Hồ sơ Thợ Săn & Công thức tính điểm Elo...');
localStorage.clear();
const initialProfile = getHunterProfile();
assert.strictEqual(initialProfile.elo, 1000, 'Elo khởi điểm mặc định là 1000');
assert.strictEqual(initialProfile.matchesPlayed, 0);

// Thắng trận + Sống sót => +25 (thắng) + 5 (sinh tồn) = +30 Elo
const winResult = recordMatchResult(true, true, ['KEEN_EYE']);
assert.strictEqual(winResult.eloChange, 30, 'Thắng + sống sót phải được +30 Elo');
assert.strictEqual(winResult.newProfile.elo, 1030, 'Elo mới phải là 1030');
assert.strictEqual(winResult.newProfile.matchesPlayed, 1);
assert.strictEqual(winResult.newProfile.matchesWon, 1);
assert(winResult.newProfile.unlockedBadges.includes('FIRST_BLOOD'), 'Mở khóa FIRST_BLOOD sau ván đầu');
assert(winResult.newProfile.unlockedBadges.includes('SURVIVOR'), 'Mở khóa SURVIVOR khi sống sót');
assert(winResult.newProfile.unlockedBadges.includes('KEEN_EYE'), 'Mở khóa KEEN_EYE từ context');

// Thua trận + Chết => -15 Elo
const lossResult = recordMatchResult(false, false);
assert.strictEqual(lossResult.eloChange, -15, 'Thua trận + chết phải bị trừ 15 Elo');
assert.strictEqual(lossResult.newProfile.elo, 1015, 'Elo mới phải là 1015');
assert.strictEqual(lossResult.newProfile.matchesPlayed, 2);
assert.strictEqual(lossResult.newProfile.matchesWon, 1);
console.log('✓ PASS TEST 2: Hồ sơ & Công thức tính Elo chuẩn xác (+30 thắng/sống sót, -15 thua).');

// ==========================================
// TEST 3: Bảng Xếp Hạng Cộng Đồng (Community Leaderboard)
// ==========================================
console.log('⏳ Test 3: Bảng Xếp Hạng cộng đồng và vị trí người chơi...');
const leaderboard = getCommunityLeaderboard();
assert(leaderboard.length >= 7, 'Bảng xếp hạng phải có đủ cao thủ cộng đồng và người chơi');
assert(leaderboard.every(item => item.rank > 0 && item.elo > 0), 'Mỗi entry phải có rank và elo hợp lệ');

// Đảm bảo thứ tự sắp xếp Elo giảm dần
for (let i = 0; i < leaderboard.length - 1; i++) {
  assert(leaderboard[i].elo >= leaderboard[i + 1].elo, `Bảng xếp hạng phải xếp theo Elo giảm dần (vị trí ${i} vs ${i + 1})`);
}

const myEntry = leaderboard.find(item => item.name.includes('(Bạn)'));
assert(myEntry !== undefined, 'Bảng xếp hạng phải chứa vị trí của người chơi hiện tại');
assert.strictEqual(myEntry.elo, lossResult.newProfile.elo);
console.log(`✓ PASS TEST 3: Bảng xếp hạng sắp xếp chuẩn xác (Top 1: ${leaderboard[0].name} - ${leaderboard[0].elo} Elo, Bạn rank #${myEntry.rank}).`);

// ==========================================
// TEST 4: Hệ Thống Báo Cáo Phá Game (Anti-Griefing)
// ==========================================
console.log('⏳ Test 4: Báo cáo người chơi vi phạm & bảo vệ cộng đồng...');
const reportRes = reportPlayer('TrollPlayer#123', 'Cố tình rời trận khi đang đấu');
assert.strictEqual(reportRes.success, true);
assert(reportRes.message.includes('Đã gửi báo cáo'), 'Phải trả về thông báo xác nhận tiếp nhận báo cáo');

const savedReports = JSON.parse(localStorage.getItem('masoi_player_reports_v1') || '[]');
assert.strictEqual(savedReports.length, 1);
assert.strictEqual(savedReports[0].reportedName, 'TrollPlayer#123');
console.log('✓ PASS TEST 4: Báo cáo phá game hoạt động thành công.');

// ==========================================
// TEST 5: Tích Hợp RoomManager Game Over & Thăng Hạng
// ==========================================
console.log('⏳ Test 5: Tích hợp RoomManager kết thúc ván đấu & ghi nhận thành tích...');
const rm = new RoomManager();
const created = rm.createRoom('Thợ Săn Trăng Máu', '🐺');
const room = rm.getServerRoom(created.roomId);
assert(room !== undefined, 'Phải tìm thấy phòng server vừa tạo');

// Giả lập ván đấu kết thúc với Dân Làng thắng (Sói chết hết)
room.players = [
  { id: 'p1', name: 'Thợ Săn Trăng Máu', avatar: '🐺', isHost: true, isAlive: true, role: 'SEER' },
  { id: 'p2', name: 'Người Dân #2', avatar: '🌾', isHost: false, isAlive: true, role: 'VILLAGER' },
  { id: 'p3', name: 'Sói Đã Bị Diệt', avatar: '🐺', isHost: false, isAlive: false, role: 'WEREWOLF' },
];

const isGameOver = rm.checkWinCondition(room);
assert.strictEqual(isGameOver, true, 'Ván đấu phải kết thúc khi toàn bộ sói đã chết');
assert.strictEqual(room.phase, 'GAME_OVER');
assert.strictEqual(room.winner, 'VILLAGERS');

// Hồ sơ người chơi địa phương phải được tự động cập nhật
const currentProfile = getHunterProfile();
assert(currentProfile.matchesPlayed > 2, 'Số ván đấu phải được tự động tăng sau game over');
console.log('✓ PASS TEST 5: Kết thúc ván đấu tích hợp ghi nhận Elo và thành tích hoàn hảo.');

console.log('\n🎉 TẤT CẢ 5/5 TESTS SPRINT 7 PASS 100%! HỆ THỐNG XẾP HẠNG & HUY HIỆU ĐÃ SẴN SÀNG!');
