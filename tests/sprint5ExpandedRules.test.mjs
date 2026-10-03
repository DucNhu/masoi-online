import assert from 'node:assert';
import { RoomManager } from '../src/logic/roomManager.ts';
import { WEREWOLF_AVATARS, getAvatarById } from '../src/constants/avatars.ts';

console.log('--- BẮT ĐẦU KIỂM THỬ SPRINT 5: VAI TRÒ MỞ RỘNG & TÙY CHỈNH LUẬT ---');

const manager = new RoomManager();

// TEST 1: Khởi tạo phòng với cấu hình Timer và Chức vị tùy chỉnh
{
  const customSettings = {
    discussionTimeSeconds: 90,
    votingTimeSeconds: 45,
    nightActionTimeSeconds: 15,
    enableMayor: true,
    enableFoolImmunity: true,
    allowExpansionRoles: true,
    activeExpansionRoles: ['IDIOT'],
  };

  const { roomId, playerId: hostId, state } = manager.createRoom('Chủ Làng Minh Quân', '👑', customSettings);

  assert.strictEqual(state.phase, 'LOBBY');
  assert.strictEqual(state.players.length, 1);

  // Thêm 3 người chơi để đủ 4 người
  const p2 = manager.joinRoom(roomId, 'Thợ Săn Dũng', '🏹');
  const p3 = manager.joinRoom(roomId, 'Dân Làng An', '🌾');
  const p4 = manager.joinRoom(roomId, 'Thằng Khờ Bé', '🃏');

  manager.toggleReady(roomId, p2.playerId, true);
  manager.toggleReady(roomId, p3.playerId, true);
  manager.toggleReady(roomId, p4.playerId, true);

  // Host bắt đầu ván đấu
  manager.startGame(roomId, hostId);

  const nightState = manager.getMaskedState(roomId, hostId);
  assert.strictEqual(nightState.phase, 'NIGHT');
  assert.strictEqual(nightState.dayNumber, 1);
  assert.strictEqual(nightState.timerSeconds, 15, 'Timer đêm phải nhận giá trị cấu hình 15s');
  assert.strictEqual(nightState.mayorPlayerId, hostId, 'Host được chỉ định làm Thị Trưởng ban đầu');

  console.log('✓ PASS TEST 1: Cấu hình Timer tùy chỉnh & Chỉ định Thị Trưởng ban đầu chuẩn xác');
}

// TEST 2: Thị Trưởng bỏ phiếu có trọng số x2 (2 phiếu)
{
  const { roomId, playerId: hostId } = manager.createRoom('Thị Trưởng Tuấn', '👑', {
    enableMayor: true,
    discussionTimeSeconds: 60,
    votingTimeSeconds: 30,
  });

  const p2 = manager.joinRoom(roomId, 'Người Chơi 2', '🐺');
  const p3 = manager.joinRoom(roomId, 'Người Chơi 3', '🔮');
  const p4 = manager.joinRoom(roomId, 'Người Chơi 4', '🛡️');

  manager.toggleReady(roomId, p2.playerId, true);
  manager.toggleReady(roomId, p3.playerId, true);
  manager.toggleReady(roomId, p4.playerId, true);

  manager.startGame(roomId, hostId);

  // Cho qua đêm sang ngày thảo luận
  manager.resolveNightToDay(roomId);

  // Bắt đầu bỏ phiếu
  manager.startDayVoting(roomId);
  let voteState = manager.getMaskedState(roomId, hostId);
  assert.strictEqual(voteState.phase, 'DAY_VOTING');

  // Thị Trưởng (hostId) vote cho P2
  manager.castVote(roomId, hostId, p2.playerId);

  voteState = manager.getMaskedState(roomId, hostId);
  // Vì là Thị Trưởng nên P2 phải nhận 2 phiếu!
  assert.strictEqual(voteState.voteTally?.[p2.playerId], 2, 'Phiếu của Thị Trưởng phải có trọng số 2 phiếu');

  // P3 vote cho P4 (1 phiếu)
  manager.castVote(roomId, p3.playerId, p4.playerId);
  voteState = manager.getMaskedState(roomId, hostId);
  assert.strictEqual(voteState.voteTally?.[p4.playerId], 1, 'Phiếu người thường có trọng số 1');

  console.log('✓ PASS TEST 2: Lá phiếu của Thị Trưởng tính x2 phiếu công khai và chuẩn xác');
}

// TEST 3: Di chúc Thị Trưởng khi bị treo cổ
{
  const { roomId, playerId: hostId } = manager.createRoom('Thị Trưởng Già', '👑', {
    enableMayor: true,
  });

  const p2 = manager.joinRoom(roomId, 'Người Kế Vị Mai', '🌸');
  const p3 = manager.joinRoom(roomId, 'Dân Làng Bình', '🌾');
  const p4 = manager.joinRoom(roomId, 'Dân Làng Cúc', '🌼');

  manager.toggleReady(roomId, p2.playerId, true);
  manager.toggleReady(roomId, p3.playerId, true);
  manager.toggleReady(roomId, p4.playerId, true);

  manager.startGame(roomId, hostId);
  manager.resolveNightToDay(roomId);
  manager.startDayVoting(roomId);

  // Cả làng (P2, P3, P4) đồng loạt vote treo cổ Thị Trưởng (hostId)
  manager.castVote(roomId, p2.playerId, hostId);
  manager.castVote(roomId, p3.playerId, hostId);
  manager.castVote(roomId, p4.playerId, hostId);
  manager.castVote(roomId, hostId, null); // Thị Trưởng bỏ phiếu trắng -> Kết thúc vote

  const postVoteState = manager.getMaskedState(roomId, p2.playerId);
  const deadMayor = postVoteState.players.find((p) => p.id === hostId);
  assert.strictEqual(deadMayor?.isAlive, false, 'Cựu Thị Trưởng đã bị xử tử');

  // Kiểm tra di chúc truyền ngôi cho người sống sót kế tiếp
  assert.ok(postVoteState.mayorPlayerId !== null && postVoteState.mayorPlayerId !== hostId);
  assert.strictEqual(postVoteState.mayorPlayerId, p2.playerId, 'Huy hiệu Thị Trưởng tự động di chúc truyền cho P2');

  console.log('✓ PASS TEST 3: Di chúc Thị Trưởng tự động truyền ngôi cho người sống sót kế tiếp');
}

// TEST 4: Kẻ Ngốc (IDIOT) lật bài tha chết khi bị biểu quyết treo cổ & mất quyền vote
{
  const { roomId, playerId: hostId } = manager.createRoom('Host Quang', '👑', {
    enableFoolImmunity: true,
  });

  const p2 = manager.joinRoom(roomId, 'Kẻ Ngốc Tèo', '🃏');
  const p3 = manager.joinRoom(roomId, 'Người Chơi 3', '🌾');
  const p4 = manager.joinRoom(roomId, 'Người Chơi 4', '🌾');

  manager.toggleReady(roomId, p2.playerId, true);
  manager.toggleReady(roomId, p3.playerId, true);
  manager.toggleReady(roomId, p4.playerId, true);

  manager.startGame(roomId, hostId);

  // Cân bằng vai trò để tránh điều kiện Sói >= Dân thắng sớm
  // (1 Sói duy nhất: P4, 3 Dân: Host, P3 và P2 Kẻ Ngốc)
  const room = manager['rooms'].get(roomId);
  const p4Player = room.players.find((p) => p.id === p4.playerId);
  if (p4Player) p4Player.role = 'WEREWOLF';
  const hostPlayer = room.players.find((p) => p.id === hostId);
  if (hostPlayer) hostPlayer.role = 'VILLAGER';
  const p3Player = room.players.find((p) => p.id === p3.playerId);
  if (p3Player) p3Player.role = 'VILLAGER';
  const idiotPlayer = room.players.find((p) => p.id === p2.playerId);
  if (idiotPlayer) idiotPlayer.role = 'IDIOT';

  manager.resolveNightToDay(roomId);
  manager.startDayVoting(roomId);

  // Cả làng dồn phiếu xử tử Kẻ Ngốc (P2)
  manager.castVote(roomId, hostId, p2.playerId);
  manager.castVote(roomId, p3.playerId, p2.playerId);
  manager.castVote(roomId, p4.playerId, p2.playerId);
  manager.castVote(roomId, p2.playerId, null);

  const postState = manager.getMaskedState(roomId, p2.playerId);
  const fool = postState.players.find((p) => p.id === p2.playerId);

  // Kẻ Ngốc không chết!
  assert.strictEqual(fool?.isAlive, true, 'Kẻ Ngốc không được chết khi bị treo cổ lần đầu');
  assert.strictEqual(fool?.idiotRevealed, true, 'Kẻ Ngốc đã lật bài công khai');
  assert.strictEqual(postState.revealedRoles[p2.playerId], 'IDIOT', 'Danh tính Kẻ Ngốc được công khai cho cả làng');

  // Đêm kế tiếp -> Sang Ngày tiếp theo
  manager.resolveNightToDay(roomId);
  manager.startDayVoting(roomId);

  // Kẻ Ngốc cố tình bỏ phiếu -> Phải bị chặn!
  let voteBlocked = false;
  try {
    manager.castVote(roomId, p2.playerId, hostId);
  } catch {
    voteBlocked = true;
  }
  assert.strictEqual(voteBlocked, true, 'Kẻ Ngốc đã lật bài bắt buộc bị tước quyền bỏ phiếu');

  console.log('✓ PASS TEST 4: Kẻ Ngốc lật bài thoát chết & bị tước quyền bỏ phiếu ở các vòng sau');
}

// TEST 5: Chuyển giao chức vị Thị Trưởng thủ công (assignMayor)
{
  const { roomId, playerId: hostId } = manager.createRoom('Chủ Làng', '👑', {
    enableMayor: true,
  });
  const p2 = manager.joinRoom(roomId, 'Người Nhận Ngôi', '🛡️');

  manager.assignMayor(roomId, p2.playerId, hostId);

  const state = manager.getMaskedState(roomId, hostId);
  assert.strictEqual(state.mayorPlayerId, p2.playerId, 'Chức vị Thị Trưởng đã chuyển giao sang P2');

  console.log('✓ PASS TEST 5: Chuyển giao chức vị Thị Trưởng thành công');
}

// TEST 6: Kho 12 Avatar Ma Sói Huyền Bí
{
  assert.strictEqual(WEREWOLF_AVATARS.length, 12, 'Kho Avatar Ma Sói phải có đúng 12 avatar');
  const wolfAvatar = getAvatarById('silver_wolf');
  assert.strictEqual(wolfAvatar.emoji, '🐺');
  assert.strictEqual(wolfAvatar.name, 'Sói Bạc Huyết Nguyệt');
  assert.ok(wolfAvatar.auraColor.startsWith('#'));
  assert.ok(wolfAvatar.quote.length > 10);

  const mayorAvatar = getAvatarById('village_mayor');
  assert.strictEqual(mayorAvatar.emoji, '👑');

  console.log('✓ PASS TEST 6: Kho 12 Avatar Ma Sói huyền bí đầy đủ và hợp lệ');
}

console.log('🎉 TOÀN BỘ CÁC BỘ TEST SPRINT 5 (VAI TRÒ MỞ RỘNG & TÙY CHỈNH LUẬT) ĐÃ PASS 100%!');
