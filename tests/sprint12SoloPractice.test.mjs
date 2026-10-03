import assert from 'node:assert';
import { BotPlayerEngine } from '../src/logic/botPlayerEngine.js';
import { RoomManager } from '../src/logic/roomManager.js';

console.log('--- BẮT ĐẦU KIỂM THỬ SPRINT 12: CHẾ ĐỘ TẬP LUYỆN SOLO VỚI AI BOTS ---');

// ==========================================
// TEST 1: Khởi Tạo Đội Hình Bot AI Đa Dạng
// ==========================================
console.log('⏳ Test 1: Khởi tạo danh sách AI Bots (generatePracticeBots)...');
const humanRole = 'HUNTER';
const bots = BotPlayerEngine.generatePracticeBots(humanRole, 7);

assert.strictEqual(bots.length, 6, 'Phải tạo đủ 6 AI Bots cho ván đấu 7 người');
assert(bots.every((b) => b.isAlive), 'Tất cả Bot ban đầu phải còn sống');

const wolfBots = bots.filter((b) => b.role === 'WEREWOLF');
assert(wolfBots.length >= 1, 'Phải có ít nhất 1 Ma Sói trong đội hình Bot');

// Kiểm tra tri thức đồng đội của Ma Sói
wolfBots.forEach((wolf) => {
  assert(Array.isArray(wolf.knownWolves), 'knownWolves phải là một mảng');
});
console.log(`✓ PASS TEST 1: Khởi tạo 6 Bots AI thành công với ${wolfBots.length} Ma Sói.`);

// ==========================================
// TEST 2: Quyết Định Săn Mồi Ban Đêm Của Bầy Sói AI
// ==========================================
console.log('⏳ Test 2: Quyết định cắn ban đêm của Ma Sói (decideWerewolfNightKill)...');
const allTargets = [
  { id: 'human_player', role: 'HUNTER' },
  { id: 'bot_seer', role: 'SEER' },
  { id: 'bot_guard', role: 'BODYGUARD' },
  { id: 'bot_wolf_1', role: 'WEREWOLF' },
  { id: 'bot_wolf_2', role: 'WEREWOLF' },
];

const targetKillId = BotPlayerEngine.decideWerewolfNightKill(wolfBots, allTargets);
assert(targetKillId !== null, 'Phải chọn được mục tiêu cắn');
assert(targetKillId !== 'bot_wolf_1' && targetKillId !== 'bot_wolf_2', 'Ma Sói tuyệt đối không cắn đồng đội Sói');
console.log(`✓ PASS TEST 2: Ma Sói chọn mục tiêu cắn an toàn: ${targetKillId}`);

// ==========================================
// TEST 3: Quyết Định Soi Đêm Của Tiên Tri AI & Bảo Vệ Của Bảo Vệ AI
// ==========================================
console.log('⏳ Test 3: Kỹ năng soi của Tiên Tri và bảo vệ của Bảo Vệ...');
const seerBot = {
  id: 'bot_seer',
  name: '[AI] Tiên Tri',
  avatar: '🔮',
  role: 'SEER',
  isAlive: true,
  isMayor: false,
  knownWolves: [],
  suspectedPlayers: {},
};

const livingList = [
  { id: 'bot_seer', isAlive: true },
  { id: 'player_1', isAlive: true },
  { id: 'player_2', isAlive: true },
];

const scanTarget = BotPlayerEngine.decideSeerScan(seerBot, livingList);
assert.notStrictEqual(scanTarget, 'bot_seer', 'Tiên Tri không được tự soi chính mình');
assert(scanTarget === 'player_1' || scanTarget === 'player_2', 'Phải soi 1 người chơi còn sống');

// Bảo Vệ không bảo vệ 1 người 2 đêm liên tiếp
const guardBot = {
  id: 'bot_guard',
  name: '[AI] Bảo Vệ',
  avatar: '🛡️',
  role: 'BODYGUARD',
  isAlive: true,
  isMayor: false,
  knownWolves: [],
  suspectedPlayers: {},
};

const protectedTarget = BotPlayerEngine.decideBodyguardProtect(guardBot, livingList, 'player_1');
assert.notStrictEqual(protectedTarget, 'player_1', 'Bảo Vệ không được bảo vệ cùng 1 người 2 đêm liên tiếp');
console.log('✓ PASS TEST 3: Tiên Tri và Bảo Vệ AI đưa ra quyết định hợp lệ.');

// ==========================================
// TEST 4: Quyết Định Bỏ Phiếu & Lời Thoại Phản Biện Của Bot
// ==========================================
console.log('⏳ Test 4: Phán đoán bỏ phiếu ban ngày và lời thoại phản biện...');
const candidates = [
  { id: 'suspect_wolf', isAlive: true },
  { id: 'innocent_villager', isAlive: true },
];

// Nếu Tiên Tri đã biết Sói, 100% vote đúng Sói
const informedSeer = { ...seerBot, knownWolves: ['suspect_wolf'] };
const seerVote = BotPlayerEngine.decideDayVote(informedSeer, candidates);
assert.strictEqual(seerVote, 'suspect_wolf', 'Tiên Tri đã soi ra Sói phải bỏ phiếu xử tử con Sói đó');

// Kiểm tra sinh lời thoại phát biểu
const speech = BotPlayerEngine.generateDaySpeech(informedSeer, [
  { id: 'bot_seer', name: 'Tiên Tri', isAlive: true },
  { id: 'suspect_wolf', name: 'Nghi Phạm Sói', isAlive: true },
]);
assert(typeof speech === 'string' && speech.length > 5, 'Lời thoại phản biện phải có nội dung');
console.log(`✓ PASS TEST 4: Lời thoại phản biện AI: "${speech}"`);

// ==========================================
// TEST 5: Khởi Tạo Ván Đấu Solo Practice Qua RoomManager
// ==========================================
console.log('⏳ Test 5: Tích hợp RoomManager khởi tạo trận đấu Solo...');
const rm = new RoomManager();
const practiceRes = rm.createRoom('Người Chơi Solo', '🏹', {
  tableName: 'Tập Luyện Solo • HUNTER',
  maxPlayers: 7,
  isPrivate: true,
});

const serverRoom = rm.getServerRoom(practiceRes.roomId);
assert(serverRoom !== undefined);

// Gán vai trò cho người chơi
const human = serverRoom.players.find((p) => p.id === practiceRes.playerId);
human.role = 'HUNTER';

// Nạp 6 Bot
const practiceBots = BotPlayerEngine.generatePracticeBots('HUNTER', 7);
practiceBots.forEach((bot, index) => {
  serverRoom.players.push({
    id: bot.id,
    name: bot.name,
    avatar: bot.avatar,
    isHost: false,
    isReady: true,
    isAlive: true,
    seatNumber: index + 2,
    hasVoted: false,
    hasActedNight: false,
    role: bot.role,
    sessionToken: `token_${bot.id}`,
  });
});

assert.strictEqual(serverRoom.players.length, 7, 'Phòng phải có đủ 7 người (1 người + 6 bot)');

// Bắt đầu game
rm.startGame(practiceRes.roomId, practiceRes.playerId);
assert.strictEqual(serverRoom.phase, 'NIGHT', 'Ván đấu solo phải chuyển sang Đêm 1 thành công');
console.log('✓ PASS TEST 5: Ván đấu Tập Luyện Solo 7 người đã bắt đầu mượt mà.');

console.log('\n🎉 TẤT CẢ 5/5 TESTS SPRINT 12 PASS 100%! CHẾ ĐỘ TẬP LUYỆN SOLO AI ĐÃ HOÀN TẤT!');
