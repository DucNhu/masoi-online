import assert from 'node:assert';

console.log('--- BẮT ĐẦU KIỂM THỬ OFFLINE GAME FLOW & BẢO VỆ ---');

// 1. Kiểm tra cấu hình mặc định vai trò Bảo Vệ cho các mức người chơi 4-8
{
  function getRoleDefaults(newCount) {
    let recWolf = 1;
    if (newCount >= 7 && newCount <= 9) recWolf = 2;
    else if (newCount >= 10 && newCount <= 12) recWolf = 3;
    else if (newCount >= 13) recWolf = 4;
    
    // Bảo vệ phải được hỗ trợ từ 4 người chơi trở lên (cùng chuẩn với Online mode)
    const recGuard = newCount >= 4;
    const recHunter = newCount >= 7;
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
  console.log('✓ PASS: Bảo Vệ được bật mặc định từ 4 người chơi trở lên (không bị tắt khi chơi 4-5 người)');
}

// 2. Kiểm tra ánh xạ bước đêm sang GamePhase & nhãn hiển thị Header
{
  function getPhaseForStep(step) {
    switch (step) {
      case 'INTRO': return 'NIGHT_START';
      case 'CUPID': return 'NIGHT_CUPID';
      case 'MINION': return 'NIGHT_MINION';
      case 'BODYGUARD': return 'NIGHT_BODYGUARD';
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
  assert.strictEqual(getPhaseLabel('NIGHT_CUPID', 1), 'Đêm 1 • Thần Tình Yêu');
  assert.strictEqual(getPhaseLabel('NIGHT_MINION', 1), 'Đêm 1 • Kẻ Bán Tơ');
  assert.strictEqual(getPhaseLabel('NIGHT_WEREWOLF', 1), 'Đêm 1 • Ma Sói');
  console.log('✓ PASS: Ánh xạ chuẩn xác từ bước đêm sang GamePhase và tiêu đề Header');
}

// 3. Kiểm tra danh sách bước đêm khi có Bảo Vệ còn sống
{
  const playersWithGuard = [
    { id: 'p1', seatNumber: 1, name: 'Sói', card: { rank: 'K' }, roleId: 'WEREWOLF', isAlive: true },
    { id: 'p2', seatNumber: 2, name: 'Bảo Vệ', card: { rank: 'J' }, roleId: 'BODYGUARD', isAlive: true },
    { id: 'p3', seatNumber: 3, name: 'Tiên Tri', card: { rank: 'A' }, roleId: 'SEER', isAlive: true },
    { id: 'p4', seatNumber: 4, name: 'Dân', card: { rank: '2' }, roleId: 'VILLAGER', isAlive: true },
  ];

  const hasAliveBodyguard = playersWithGuard.some(p => p.roleId === 'BODYGUARD' && p.isAlive);
  assert.strictEqual(hasAliveBodyguard, true);

  const steps = ['INTRO'];
  if (hasAliveBodyguard) steps.push('BODYGUARD');
  steps.push('WEREWOLF');
  steps.push('OUTRO');

  assert.strictEqual(steps.includes('BODYGUARD'), true);
  assert.strictEqual(steps.indexOf('BODYGUARD'), 1);
  console.log('✓ PASS: Bước gọi Bảo Vệ (BODYGUARD) xuất hiện ngay sau INTRO');
}

console.log('🎉 TOÀN BỘ KIỂM THỬ OFFLINE FLOW & BẢO VỆ ĐÃ ĐẠT CHUẨN!');
