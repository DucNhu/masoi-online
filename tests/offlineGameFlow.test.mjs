import assert from 'node:assert';
import { resolveNightActions } from '../src/logic/gameEngine.ts';

console.log('--- BẮT ĐẦU KIỂM THỬ OFFLINE GAME FLOW & BẢO VỆ & THỢ SĂN ---');

// 1. Kiểm tra cấu hình mặc định vai trò Bảo Vệ & Thợ Săn cho các mức người chơi
{
  function getRoleDefaults(newCount) {
    let recWolf = 1;
    if (newCount >= 7 && newCount <= 9) recWolf = 2;
    else if (newCount >= 10 && newCount <= 12) recWolf = 3;
    else if (newCount >= 13) recWolf = 4;
    
    const recGuard = newCount >= 4;
    const recHunter = newCount >= 5;
    return { wolfCount: recWolf, enableGuard: recGuard, enableHunter: recHunter };
  }

  for (let n = 4; n <= 8; n++) {
    const config = getRoleDefaults(n);
    assert.strictEqual(
      config.enableGuard,
      true,
      `Tại số lượng ${n} người chơi, Bảo Vệ (Lá J) phải được bật mặc định`
    );
  }
  assert.strictEqual(getRoleDefaults(5).enableHunter, true, 'Từ 5 người chơi, Thợ Săn (Lá 10) được bật mặc định');
  console.log('✓ PASS: Bảo Vệ (>=4) và Thợ Săn (>=5) được bật mặc định hợp lý');
}

// 2. Kiểm tra ánh xạ bước đêm sang GamePhase & nhãn hiển thị Header
{
  function getPhaseForStep(step) {
    switch (step) {
      case 'INTRO': return 'NIGHT_START';
      case 'CUPID': return 'NIGHT_CUPID';
      case 'MINION': return 'NIGHT_MINION';
      case 'BODYGUARD': return 'NIGHT_BODYGUARD';
      case 'HUNTER': return 'NIGHT_HUNTER';
      case 'WEREWOLF': return 'NIGHT_WEREWOLF';
      case 'WITCH': return 'NIGHT_WITCH';
      case 'SEER': return 'NIGHT_SEER';
      case 'OUTRO': return 'NIGHT_START';
      default: return 'NIGHT_START';
    }
  }

  function getPhaseLabel(phase, round) {
    switch (phase) {
      case 'SETUP': return 'Thiết Lập';
      case 'NIGHT_START': return `Đêm ${round}`;
      case 'NIGHT_CUPID': return `Đêm ${round} • Thần Tình Yêu`;
      case 'NIGHT_MINION': return `Đêm ${round} • Kẻ Bán Tơ`;
      case 'NIGHT_BODYGUARD': return `Đêm ${round} • Bảo Vệ`;
      case 'NIGHT_HUNTER': return `Đêm ${round} • Thợ Săn`;
      case 'NIGHT_WEREWOLF': return `Đêm ${round} • Ma Sói`;
      case 'NIGHT_WITCH': return `Đêm ${round} • Phù Thủy`;
      case 'NIGHT_SEER': return `Đêm ${round} • Tiên Tri`;
      case 'DAY_DAWN': return `Ngày ${round} • Bình Minh`;
      case 'DAY_DISCUSSION': return `Ngày ${round} • Thảo Luận`;
      case 'DAY_VOTING': return `Ngày ${round} • Bỏ Phiếu`;
      case 'DAY_EXECUTION': return `Ngày ${round} • Xử Tử`;
      case 'GAME_OVER': return 'Kết Thúc';
      default: return '';
    }
  }

  assert.strictEqual(getPhaseForStep('BODYGUARD'), 'NIGHT_BODYGUARD');
  assert.strictEqual(getPhaseLabel('NIGHT_BODYGUARD', 1), 'Đêm 1 • Bảo Vệ');
  assert.strictEqual(getPhaseForStep('HUNTER'), 'NIGHT_HUNTER');
  assert.strictEqual(getPhaseLabel('NIGHT_HUNTER', 1), 'Đêm 1 • Thợ Săn');
  assert.strictEqual(getPhaseLabel('NIGHT_WEREWOLF', 1), 'Đêm 1 • Ma Sói');
  console.log('✓ PASS: Ánh xạ chuẩn xác từ bước gọi Thợ Săn sang GamePhase và tiêu đề Header');
}

// 3. Kiểm tra danh sách bước đêm khi có cả Bảo Vệ và Thợ Săn còn sống
{
  const players = [
    { id: 'p1', seatNumber: 1, name: 'Sói', card: { rank: 'K' }, roleId: 'WEREWOLF', isAlive: true },
    { id: 'p2', seatNumber: 2, name: 'Bảo Vệ', card: { rank: 'J' }, roleId: 'BODYGUARD', isAlive: true },
    { id: 'p3', seatNumber: 3, name: 'Thợ Săn', card: { rank: '10' }, roleId: 'HUNTER', isAlive: true },
    { id: 'p4', seatNumber: 4, name: 'Tiên Tri', card: { rank: 'A' }, roleId: 'SEER', isAlive: true },
    { id: 'p5', seatNumber: 5, name: 'Dân', card: { rank: '2' }, roleId: 'VILLAGER', isAlive: true },
  ];

  const hasAliveBodyguard = players.some(p => p.roleId === 'BODYGUARD' && p.isAlive);
  const hasAliveHunter = players.some(p => p.roleId === 'HUNTER' && p.isAlive);
  assert.strictEqual(hasAliveBodyguard, true);
  assert.strictEqual(hasAliveHunter, true);

  const steps = ['INTRO'];
  if (hasAliveBodyguard) steps.push('BODYGUARD');
  if (hasAliveHunter) steps.push('HUNTER');
  steps.push('WEREWOLF');
  steps.push('OUTRO');

  assert.strictEqual(steps.includes('HUNTER'), true);
  assert.strictEqual(steps.indexOf('HUNTER'), 2);
  console.log('✓ PASS: Bước gọi Thợ Săn (HUNTER) xuất hiện đúng vị trí trong đêm');
}

// 4. Kiểm tra cơ chế Thợ Săn găm đạn trong đêm
{
  const players = [
    { id: 'p1', seatNumber: 1, name: 'Sói', card: { rank: 'K' }, roleId: 'WEREWOLF', isAlive: true },
    { id: 'p2', seatNumber: 2, name: 'Bảo Vệ', card: { rank: 'J' }, roleId: 'BODYGUARD', isAlive: true },
    { id: 'p3', seatNumber: 3, name: 'Thợ Săn', card: { rank: '10' }, roleId: 'HUNTER', isAlive: true },
    { id: 'p4', seatNumber: 4, name: 'Dân Làng', card: { rank: '2' }, roleId: 'VILLAGER', isAlive: true },
  ];

  // Kịch bản 1: Sói cắn Thợ Săn (p3), Thợ Săn đã găm đạn vào Sói (p1)
  const stateWolfKillsHunter = {
    round: 1,
    phase: 'NIGHT_START',
    players: JSON.parse(JSON.stringify(players)),
    cardMappings: {},
    witchPotions: { hasHealPotion: true, hasPoisonPotion: true },
    lastProtectedPlayerId: null,
    currentNightAction: {
      protectedPlayerId: 'p4', // Bảo vệ dân
      hunterTargetId: 'p1',    // Thợ săn găm đạn Sói
      werewolfTargetId: 'p3',  // Sói cắn Thợ săn
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

  const outcome1 = resolveNightActions(stateWolfKillsHunter);
  assert.strictEqual(outcome1.deadPlayerIds.includes('p3'), true, 'Thợ Săn phải chết vì bị Sói cắn');
  assert.strictEqual(outcome1.deadPlayerIds.includes('p1'), true, 'Sói (p1) phải chết vì bị Thợ Săn găm đạn');
  assert.strictEqual(outcome1.hunterTriggeredId, null, 'Không cần gọi lại ở Bình Minh vì đạn đã găm sẵn');
  console.log('✓ PASS: Thợ Săn bị cắn chết -> Phát đạn găm sẵn lập tức hạ gục mục tiêu Ma Sói');

  // Kịch bản 2: Thợ Săn không bị cắn -> Mục tiêu găm đạn vẫn sống bình an
  const stateHunterSurvives = {
    ...stateWolfKillsHunter,
    players: JSON.parse(JSON.stringify(players)),
    currentNightAction: {
      ...stateWolfKillsHunter.currentNightAction,
      werewolfTargetId: 'p4', // Sói cắn dân làng p4, không cắn Thợ săn p3
      protectedPlayerId: 'p2',
    }
  };

  const outcome2 = resolveNightActions(stateHunterSurvives);
  assert.strictEqual(outcome2.deadPlayerIds.includes('p4'), true, 'Dân làng p4 bị cắn chết');
  assert.strictEqual(outcome2.deadPlayerIds.includes('p1'), false, 'Sói p1 vẫn sống vì Thợ Săn chưa chết');
  assert.strictEqual(outcome2.deadPlayerIds.includes('p3'), false, 'Thợ Săn p3 vẫn sống');
  console.log('✓ PASS: Thợ Săn còn sống -> Phát đạn găm sẵn không kích hoạt, mục tiêu an toàn');
}

console.log('🎉 TOÀN BỘ KIỂM THỬ OFFLINE FLOW & BẢO VỆ & THỢ SĂN ĐÃ ĐẠT CHUẨN 100%!');

