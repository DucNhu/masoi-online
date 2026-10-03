import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSpatialPan } from '../src/utils/soundEffects.ts';
import { ARENA_THEMES } from '../src/constants/arenaThemes.ts';
import { RoomManager } from '../src/logic/roomManager.ts';
import { maskGameStateForPlayer } from '../src/logic/roomProtocol.ts';

test('Sprint 13 - TASK-1201: calculateSpatialPan 3D spatial calculations', () => {
  // 1. Cùng một ghế -> Âm thanh ở chính giữa (pan = 0)
  assert.equal(calculateSpatialPan(1, 1, 8), 0);
  assert.equal(calculateSpatialPan(4, 4, 8), 0);

  // 2. Tổng ghế <= 1 -> Luôn trả về 0
  assert.equal(calculateSpatialPan(1, 2, 1), 0);
  assert.equal(calculateSpatialPan(1, 2, 0), 0);

  // 3. Góc 90 độ bên phải (Ghế 1 nghe Ghế 3 trên bàn 8 chỗ: angle = 2/8 * 2pi = pi/2 -> sin = 1.0)
  const rightPan = calculateSpatialPan(3, 1, 8);
  assert.equal(rightPan, 1.0, 'Ghế 3 lệch 90 độ bên phải so với ghế 1 phải có pan = 1.0');

  // 4. Góc 90 độ bên trái (Ghế 3 nghe Ghế 1 trên bàn 8 chỗ: angle = -2/8 * 2pi = -pi/2 -> sin = -1.0)
  const leftPan = calculateSpatialPan(1, 3, 8);
  assert.equal(leftPan, -1.0, 'Ghế 1 lệch 90 độ bên trái so với ghế 3 phải có pan = -1.0');

  // 5. Đối diện trực diện (Ghế 1 nghe Ghế 5 trên bàn 8 chỗ: angle = 4/8 * 2pi = pi -> sin(pi) ~ 0)
  const oppositePan = calculateSpatialPan(5, 1, 8);
  assert.equal(oppositePan, 0, 'Ghế đối diện nhau trên bàn tròn phải có pan cân bằng = 0');
});

test('Sprint 13 - TASK-1202: ARENA_THEMES configuration completeness', () => {
  const themeIds = ['BLOOD_MOON', 'GOTHIC_CASTLE', 'MISTY_SWAMP', 'ENCHANTED_FOREST'];

  for (const id of themeIds) {
    const theme = ARENA_THEMES[id];
    assert.ok(theme, `Theme ${id} phải tồn tại`);
    assert.equal(theme.id, id);
    assert.ok(theme.name && theme.name.length > 0, `Theme ${id} phải có name`);
    assert.ok(theme.icon && theme.icon.length > 0, `Theme ${id} phải có icon`);
    assert.ok(theme.badge && theme.badge.length > 0, `Theme ${id} phải có badge`);
    assert.ok(theme.backgroundGradient.includes('gradient'), `Theme ${id} phải có backgroundGradient`);
    assert.ok(theme.borderColor.startsWith('rgba'), `Theme ${id} phải có borderColor`);
    assert.ok(theme.accentGlow.startsWith('rgba'), `Theme ${id} phải có accentGlow`);
    assert.ok(theme.description && theme.description.length > 10, `Theme ${id} phải có description chi tiết`);
  }
});

test('Sprint 13 - TASK-1202: RoomManager handles arenaTheme in creation and public listing', () => {
  const rm = new RoomManager();

  // Tạo phòng với theme GOTHIC_CASTLE
  const res = rm.createRoom('Chủ Lâu Đài', '🏰', {
    tableName: 'Đấu Trường Quý Tộc',
    arenaTheme: 'GOTHIC_CASTLE',
    maxPlayers: 8,
  });

  assert.ok(res.roomId);
  assert.equal(res.state.arenaTheme, 'GOTHIC_CASTLE', 'ClientGameState phải nhận đúng arenaTheme');

  // Kiểm tra danh sách bàn công khai
  const publicTables = rm.listPublicTables();
  const table = publicTables.find((t) => t.roomId === res.roomId);
  assert.ok(table, 'Phòng vừa tạo phải xuất hiện trong publicTables');
  assert.equal(table.arenaTheme, 'GOTHIC_CASTLE', 'publicTableInfo phải giữ đúng arenaTheme');
});

test('Sprint 13 - TASK-1202: maskGameStateForPlayer preserves arenaTheme without role leakage', () => {
  const rm = new RoomManager();
  const res = rm.createRoom('Tiên Tri Rừng', '🌲', {
    tableName: 'Rừng Phép Thuật',
    arenaTheme: 'ENCHANTED_FOREST',
  });

  const joinRes = rm.joinRoom(res.roomId, 'Thợ Săn Trẻ', '🏹');
  const maskedState = rm.getMaskedState(res.roomId, joinRes.playerId);

  assert.equal(maskedState.arenaTheme, 'ENCHANTED_FOREST');
  assert.equal(maskedState.tableName, 'Rừng Phép Thuật');

  // Khán giả vào phòng cũng phải nhận được arenaTheme chính xác
  const specRes = rm.joinAsSpectator(res.roomId, 'Khán Giả Rừng', '👀');
  assert.equal(specRes.state.arenaTheme, 'ENCHANTED_FOREST');
});
