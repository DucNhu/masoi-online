import assert from 'node:assert';
import { generateRoomCode, isValidRoomCode, maskGameStateForPlayer } from '../src/logic/roomProtocol.ts';

console.log('--- BẮT ĐẦU KIỂM THỬ MULTIPLAYER ROOM PROTOCOL ---');

// TEST 1: Kiểm thử sinh mã phòng 6 ký tự
const roomCode = generateRoomCode();
assert.strictEqual(typeof roomCode, 'string');
assert.strictEqual(roomCode.length, 6);
assert.strictEqual(isValidRoomCode(roomCode), true);
assert.strictEqual(isValidRoomCode('WLKF88'), true);
assert.strictEqual(isValidRoomCode('WOLF88'), false); // Chứa chữ O bị loại trừ để chống nhầm lẫn với số 0
assert.strictEqual(isValidRoomCode('ABC'), false); // Quá ngắn
console.log('✓ PASS: Sinh mã phòng ngẫu nhiên 6 ký tự chuẩn');

// Mock dữ liệu ServerGameState
const mockServerState = {
  roomId: 'WOLF88',
  phase: 'NIGHT',
  dayNumber: 1,
  timerSeconds: 30,
  players: [
    {
      id: 'p1',
      name: 'An (Dân Làng)',
      avatar: 'avatar1',
      role: 'VILLAGER',
      isHost: true,
      isReady: true,
      isAlive: true,
      seatNumber: 1,
      hasVoted: false,
      hasActedNight: false,
      sessionToken: 'secret_token_p1',
    },
    {
      id: 'p2',
      name: 'Bình (Ma Sói 1)',
      avatar: 'avatar2',
      role: 'WEREWOLF',
      isHost: false,
      isReady: true,
      isAlive: true,
      seatNumber: 2,
      hasVoted: false,
      hasActedNight: true,
      sessionToken: 'secret_token_p2',
    },
    {
      id: 'p3',
      name: 'Cường (Ma Sói 2)',
      avatar: 'avatar3',
      role: 'WEREWOLF',
      isHost: false,
      isReady: true,
      isAlive: true,
      seatNumber: 3,
      hasVoted: false,
      hasActedNight: false,
      sessionToken: 'secret_token_p3',
      isCoupleWith: 'p1', // Ghép đôi với An
    },
    {
      id: 'p4',
      name: 'Dung (Tiên Tri)',
      avatar: 'avatar4',
      role: 'SEER',
      isHost: false,
      isReady: true,
      isAlive: true,
      seatNumber: 4,
      hasVoted: false,
      hasActedNight: true,
      sessionToken: 'secret_token_p4',
    },
  ],
  nightActions: {
    werewolfTargetId: 'p1',
  },
  seerHistory: {
    p4: { targetId: 'p2', isWolf: true },
  },
  currentVotes: {},
  winner: null,
  historyLog: ['Đêm 1 bắt đầu...'],
};

// TEST 2: Zero-Knowledge cho Dân Làng (An - p1)
const villagerView = maskGameStateForPlayer(mockServerState, 'p1');
assert.strictEqual(villagerView.myRole, 'VILLAGER');
assert.strictEqual(villagerView.teamMates.length, 0); // Không biết ai là ai
// Đảm bảo không có trường `role` hay `sessionToken` trong mảng players
villagerView.players.forEach((p) => {
  assert.strictEqual('role' in p, false, `Người chơi ${p.name} bị lộ trường role trên client!`);
  assert.strictEqual('sessionToken' in p, false, `Lộ sessionToken của ${p.name}!`);
});
console.log('✓ PASS: Dân Làng hoàn toàn bị che giấu vai trò của người khác (Zero-Knowledge)');

// TEST 3: Ma Sói (Bình - p2) nhìn thấy đồng đội Ma Sói (Cường - p3)
const wolfView = maskGameStateForPlayer(mockServerState, 'p2');
assert.strictEqual(wolfView.myRole, 'WEREWOLF');
assert.strictEqual(wolfView.teamMates.includes('p3'), true); // Thấy Cường là sói
assert.strictEqual(wolfView.teamMates.includes('p4'), false); // Không thấy Tiên Tri
console.log('✓ PASS: Ma Sói nhận diện chính xác đồng đội trong đêm');

// TEST 4: Ghép đôi Cupid (Cường - p3 thấy An - p1 là người yêu)
const loverView = maskGameStateForPlayer(mockServerState, 'p3');
assert.strictEqual(loverView.couplePartnerId, 'p1');
console.log('✓ PASS: Cặp đôi nhận diện chính xác một nửa của mình');

// TEST 5: Tiên Tri (Dung - p4) nhận kết quả soi bí mật
const seerView = maskGameStateForPlayer(mockServerState, 'p4');
assert.strictEqual(seerView.seerScanResult.targetId, 'p2');
assert.strictEqual(seerView.seerScanResult.isWolf, true);
// Dân Làng và Sói không nhận được kết quả này
assert.strictEqual(villagerView.seerScanResult, undefined);
assert.strictEqual(wolfView.seerScanResult, undefined);
console.log('✓ PASS: Kết quả soi của Tiên Tri chỉ hiển thị duy nhất cho Tiên Tri');

// TEST 6: Game Over công khai toàn bộ vai trò
const gameOverState = {
  ...mockServerState,
  phase: 'GAME_OVER',
  winner: 'VILLAGERS',
};
const endView = maskGameStateForPlayer(gameOverState, 'p1');
assert.strictEqual(endView.revealedRoles['p2'], 'WEREWOLF');
assert.strictEqual(endView.revealedRoles['p4'], 'SEER');
console.log('✓ PASS: Khi kết thúc trận đấu, toàn bộ vai trò được công khai minh bạch');

console.log('🎉 TOÀN BỘ CÁC BỘ TEST MULTIPLAYER PROTOCOL ĐÃ PASS 100%!');
