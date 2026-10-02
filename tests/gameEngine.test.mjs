import assert from 'node:assert';
import {
  resolveNightActions,
  evaluateWinCondition,
} from '../src/logic/gameEngine.ts';

console.log('--- BẮT ĐẦU KIỂM THỬ GAME ENGINE MA SÓI ---');

// 1. Test Werewolf bite protected by Bodyguard
{
  const state = {
    round: 1,
    phase: 'NIGHT_START',
    players: [
      { id: 'p1', seatNumber: 1, name: 'Sói 1', card: { rank: 'K' }, roleId: 'WEREWOLF', isAlive: true, isLover: false },
      { id: 'p2', seatNumber: 2, name: 'Bảo Vệ', card: { rank: 'J' }, roleId: 'BODYGUARD', isAlive: true, isLover: false },
      { id: 'p3', seatNumber: 3, name: 'Dân', card: { rank: '7' }, roleId: 'VILLAGER', isAlive: true, isLover: false },
    ],
    cardMappings: {},
    witchPotions: { hasHealPotion: true, hasPoisonPotion: true },
    lastProtectedPlayerId: null,
    currentNightAction: {
      protectedPlayerId: 'p3',
      werewolfTargetId: 'p3', // Sói cắn p3, nhưng Bảo vệ đã bảo vệ p3!
      witchSaved: false,
      witchPoisonTargetId: null,
      seerTargetId: null,
    },
    cupidPaired: false,
    lovers: null,
    historyLogs: [],
    winner: null,
    winReason: null,
    hunterPendingRevenge: false,
    hunterPendingPlayerId: null,
    privacyShield: false,
  };

  const outcome = resolveNightActions(state);
  assert.strictEqual(outcome.deadPlayerIds.length, 0, 'Nạn nhân được bảo vệ nên không ai chết');
  console.log('✓ PASS: Sói cắn nhưng Bảo Vệ che chắn -> Không ai chết');
}

// 2. Test Werewolf bite killed, Witch heals
{
  const state = {
    round: 1,
    phase: 'NIGHT_START',
    players: [
      { id: 'p1', seatNumber: 1, name: 'Sói', card: { rank: 'K' }, roleId: 'WEREWOLF', isAlive: true, isLover: false },
      { id: 'p2', seatNumber: 2, name: 'Phù Thủy', card: { rank: 'Q' }, roleId: 'WITCH', isAlive: true, isLover: false },
      { id: 'p3', seatNumber: 3, name: 'Dân', card: { rank: '7' }, roleId: 'VILLAGER', isAlive: true, isLover: false },
    ],
    cardMappings: {},
    witchPotions: { hasHealPotion: true, hasPoisonPotion: true },
    lastProtectedPlayerId: null,
    currentNightAction: {
      protectedPlayerId: null,
      werewolfTargetId: 'p3',
      witchSaved: true, // Phù thủy dùng bình cứu
      witchPoisonTargetId: null,
      seerTargetId: null,
    },
    cupidPaired: false,
    lovers: null,
    historyLogs: [],
    winner: null,
    winReason: null,
    hunterPendingRevenge: false,
    hunterPendingPlayerId: null,
    privacyShield: false,
  };

  const outcome = resolveNightActions(state);
  assert.strictEqual(outcome.deadPlayerIds.length, 0, 'Phù thủy cứu nên không chết');
  console.log('✓ PASS: Sói cắn nhưng Phù Thủy cứu -> Không ai chết');
}

// 3. Test Witch poison kills
{
  const state = {
    round: 1,
    phase: 'NIGHT_START',
    players: [
      { id: 'p1', seatNumber: 1, name: 'Sói', card: { rank: 'K' }, roleId: 'WEREWOLF', isAlive: true, isLover: false },
      { id: 'p2', seatNumber: 2, name: 'Phù Thủy', card: { rank: 'Q' }, roleId: 'WITCH', isAlive: true, isLover: false },
      { id: 'p3', seatNumber: 3, name: 'Dân', card: { rank: '7' }, roleId: 'VILLAGER', isAlive: true, isLover: false },
    ],
    cardMappings: {},
    witchPotions: { hasHealPotion: true, hasPoisonPotion: true },
    lastProtectedPlayerId: null,
    currentNightAction: {
      protectedPlayerId: null,
      werewolfTargetId: null,
      witchSaved: false,
      witchPoisonTargetId: 'p1', // Phù thủy độc Sói!
      seerTargetId: null,
    },
    cupidPaired: false,
    lovers: null,
    historyLogs: [],
    winner: null,
    winReason: null,
    hunterPendingRevenge: false,
    hunterPendingPlayerId: null,
    privacyShield: false,
  };

  const outcome = resolveNightActions(state);
  assert.deepStrictEqual(outcome.deadPlayerIds, ['p1'], 'Sói bị đầu độc phải chết');
  console.log('✓ PASS: Phù Thủy đầu độc Sói -> Sói chết');
}

// 4. Test Lovers Heartbreak Cascade
{
  const state = {
    round: 1,
    phase: 'NIGHT_START',
    players: [
      { id: 'p1', seatNumber: 1, name: 'Sói', card: { rank: 'K' }, roleId: 'WEREWOLF', isAlive: true, isLover: false },
      { id: 'p2', seatNumber: 2, name: 'Lover 1', card: { rank: '7' }, roleId: 'VILLAGER', isAlive: true, isLover: true },
      { id: 'p3', seatNumber: 3, name: 'Lover 2', card: { rank: '6' }, roleId: 'VILLAGER', isAlive: true, isLover: true },
    ],
    cardMappings: {},
    witchPotions: { hasHealPotion: true, hasPoisonPotion: true },
    lastProtectedPlayerId: null,
    currentNightAction: {
      protectedPlayerId: null,
      werewolfTargetId: 'p2', // Sói cắn Lover 1
      witchSaved: false,
      witchPoisonTargetId: null,
      seerTargetId: null,
    },
    cupidPaired: true,
    lovers: ['p2', 'p3'],
    historyLogs: [],
    winner: null,
    winReason: null,
    hunterPendingRevenge: false,
    hunterPendingPlayerId: null,
    privacyShield: false,
  };

  const outcome = resolveNightActions(state);
  assert(outcome.deadPlayerIds.includes('p2'), 'Lover 1 bị cắn chết');
  assert(outcome.deadPlayerIds.includes('p3'), 'Lover 2 tuẫn tiết chết theo');
  console.log('✓ PASS: Cặp đôi chết chùm khi 1 người bị cắn');
}

// 5. Test Hunter death triggers revenge shot
{
  const state = {
    round: 1,
    phase: 'NIGHT_START',
    players: [
      { id: 'p1', seatNumber: 1, name: 'Sói', card: { rank: 'K' }, roleId: 'WEREWOLF', isAlive: true, isLover: false },
      { id: 'p2', seatNumber: 2, name: 'Thợ Săn', card: { rank: '10' }, roleId: 'HUNTER', isAlive: true, isLover: false },
    ],
    cardMappings: {},
    witchPotions: { hasHealPotion: true, hasPoisonPotion: true },
    lastProtectedPlayerId: null,
    currentNightAction: {
      protectedPlayerId: null,
      werewolfTargetId: 'p2',
      witchSaved: false,
      witchPoisonTargetId: null,
      seerTargetId: null,
    },
    cupidPaired: false,
    lovers: null,
    historyLogs: [],
    winner: null,
    winReason: null,
    hunterPendingRevenge: false,
    hunterPendingPlayerId: null,
    privacyShield: false,
  };

  const outcome = resolveNightActions(state);
  assert.strictEqual(outcome.hunterTriggeredId, 'p2', 'Thợ Săn chết kích hoạt súng báo thù');
  console.log('✓ PASS: Thợ Săn chết kích hoạt phát súng báo thù');
}

// 6. Test Win Condition
{
  // Sói chết hết -> Dân thắng
  const playersAllWolvesDead = [
    { id: 'p1', seatNumber: 1, name: 'Sói', card: { rank: 'K' }, roleId: 'WEREWOLF', isAlive: false, isLover: false },
    { id: 'p2', seatNumber: 2, name: 'Dân', card: { rank: '7' }, roleId: 'VILLAGER', isAlive: true, isLover: false },
  ];
  const win1 = evaluateWinCondition(playersAllWolvesDead, null);
  assert.strictEqual(win1.isOver, true);
  assert.strictEqual(win1.winner, 'VILLAGE');
  console.log('✓ PASS: Sói chết hết -> Phe Dân Làng Thắng');

  // Sói >= Dân -> Sói thắng
  const playersWolvesDominate = [
    { id: 'p1', seatNumber: 1, name: 'Sói 1', card: { rank: 'K' }, roleId: 'WEREWOLF', isAlive: true, isLover: false },
    { id: 'p2', seatNumber: 2, name: 'Sói 2', card: { rank: 'K' }, roleId: 'WEREWOLF', isAlive: true, isLover: false },
    { id: 'p3', seatNumber: 3, name: 'Dân', card: { rank: '7' }, roleId: 'VILLAGER', isAlive: true, isLover: false },
  ];
  const win2 = evaluateWinCondition(playersWolvesDominate, null);
  assert.strictEqual(win2.isOver, true);
  assert.strictEqual(win2.winner, 'WEREWOLF');
  console.log('✓ PASS: Số lượng Sói >= Dân -> Phe Ma Sói Thắng');
}

// 7. Test Elder 2 lives against werewolf bite
{
  const elderPlayer = { id: 'p2', seatNumber: 2, name: 'Già Làng', card: { rank: '7' }, roleId: 'ELDER', isAlive: true, isLover: false, elderLivesRemaining: 2 };
  const state = {
    round: 1,
    phase: 'NIGHT_START',
    players: [
      { id: 'p1', seatNumber: 1, name: 'Sói', card: { rank: 'K' }, roleId: 'WEREWOLF', isAlive: true, isLover: false },
      elderPlayer,
    ],
    cardMappings: {},
    witchPotions: { hasHealPotion: true, hasPoisonPotion: true },
    lastProtectedPlayerId: null,
    currentNightAction: {
      protectedPlayerId: null,
      werewolfTargetId: 'p2', // Sói cắn Già Làng
      witchSaved: false,
      witchPoisonTargetId: null,
      seerTargetId: null,
    },
    cupidPaired: false,
    lovers: null,
    historyLogs: [],
    winner: null,
    winReason: null,
    hunterPendingRevenge: false,
    hunterPendingPlayerId: null,
    privacyShield: false,
  };

  const outcome1 = resolveNightActions(state);
  assert.strictEqual(outcome1.deadPlayerIds.length, 0, 'Già Làng bị cắn lần 1 không chết');
  assert.strictEqual(elderPlayer.elderLivesRemaining, 1, 'Già Làng còn lại 1 mạng');
  console.log('✓ PASS: Già Làng sống sót sau lần cắn đầu tiên của Ma Sói');

  // Cắn lần 2 -> Chết
  const outcome2 = resolveNightActions(state);
  assert.deepStrictEqual(outcome2.deadPlayerIds, ['p2'], 'Già Làng bị cắn lần 2 phải chết');
  console.log('✓ PASS: Già Làng bị Sói cắn lần 2 thì hy sinh');
}

// 8. Test Cursed infection by Werewolf bite
{
  const cursedPlayer = { id: 'p2', seatNumber: 2, name: 'Bán Sói', card: { rank: '5' }, roleId: 'CURSED', isAlive: true, isLover: false, isCursedTurned: false };
  const state = {
    round: 1,
    phase: 'NIGHT_START',
    players: [
      { id: 'p1', seatNumber: 1, name: 'Sói', card: { rank: 'K' }, roleId: 'WEREWOLF', isAlive: true, isLover: false },
      cursedPlayer,
    ],
    cardMappings: {},
    witchPotions: { hasHealPotion: true, hasPoisonPotion: true },
    lastProtectedPlayerId: null,
    currentNightAction: {
      protectedPlayerId: null,
      werewolfTargetId: 'p2', // Sói cắn Bán Sói
      witchSaved: false,
      witchPoisonTargetId: null,
      seerTargetId: null,
    },
    cupidPaired: false,
    lovers: null,
    historyLogs: [],
    winner: null,
    winReason: null,
    hunterPendingRevenge: false,
    hunterPendingPlayerId: null,
    privacyShield: false,
  };

  const outcome = resolveNightActions(state);
  assert.strictEqual(outcome.deadPlayerIds.length, 0, 'Bán Sói không chết khi bị cắn');
  assert.strictEqual(cursedPlayer.isCursedTurned, true, 'Bán Sói đã bị lây nhiễm');
  assert.strictEqual(cursedPlayer.roleId, 'WEREWOLF', 'Bán Sói biến thành Ma Sói');
  console.log('✓ PASS: Bán Sói bị cắn biến thành Ma Sói thay vì chết');
}

console.log('🎉 TOÀN BỘ 8 BỘ TEST ĐÃ PASS 100%!');
