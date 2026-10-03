import test from 'node:test';
import assert from 'node:assert/strict';
import { RoomManager } from '../src/logic/roomManager.ts';
import { P2PRoomHost, P2PRoomClient } from '../src/logic/webrtcPeerMesh.ts';

test('Sprint 15 - TASK-1401: P2PRoomHost and P2PRoomClient instantiation and headless safety', async () => {
  const roomId = 'TEST88';
  let clientActionCalled = false;

  const host = new P2PRoomHost(
    roomId,
    () => { clientActionCalled = true; },
    (playerName, avatar) => ({ playerId: 'p_1', sessionToken: 'token_1' }),
    () => null
  );

  assert.equal(host.roomId, roomId);
  assert.equal(host.isReady, false);

  // Khởi động P2P Host trong headless
  const peerId = await host.start();
  assert.equal(peerId, `masoi-v1-${roomId}`);
  assert.equal(host.isReady, true);

  // Client kết nối
  let receivedState = null;
  const client = new P2PRoomClient(roomId, (st) => { receivedState = st; });
  assert.equal(client.isConnected, false);

  const connResult = await client.connect('Thợ Săn P2P', '🦊', false);
  assert.ok(connResult.playerId);
  assert.ok(connResult.sessionToken);
  assert.equal(client.isConnected, true);

  // Test gửi action
  client.sendAction(connResult.playerId, 'TOGGLE_READY', { isReady: true });

  client.disconnect();
  assert.equal(client.isConnected, false);

  host.destroy();
  assert.equal(host.isReady, false);
});

test('Sprint 15 - TASK-1402: RoomManager P2P Host lifecycle and hasRoom check', () => {
  const rm = new RoomManager();
  assert.equal(rm.hasRoom('NONEXIST'), false);

  const res = rm.createRoom('Host P2P', '👑');
  const cleanId = res.roomId.toUpperCase();
  assert.equal(rm.hasRoom(cleanId), true);

  // Host rời phòng -> phòng bị xóa và P2P host bị giải phóng
  rm.leaveRoom(cleanId, res.playerId);
  assert.equal(rm.hasRoom(cleanId), false);
});

test('Sprint 15 - TASK-1403: RoomManager P2P Client action fallback when room not in local memory', async () => {
  // Giả lập Client trên một máy hoàn toàn không có phòng cục bộ (như trên GitHub Pages)
  const clientRm = new RoomManager();
  const remoteRoomId = 'GITHUB99';

  assert.equal(clientRm.hasRoom(remoteRoomId), false);

  // Kết nối P2P
  const p2pRes = await clientRm.joinRoomViaP2P(remoteRoomId, 'Người Chơi GitHub', '🐺', false);
  assert.ok(p2pRes.playerId);
  assert.ok(p2pRes.sessionToken);

  // Các hành động không được throw lỗi crash mà phải được route an toàn qua P2P client
  assert.doesNotThrow(() => {
    clientRm.toggleReady(remoteRoomId, p2pRes.playerId, true);
    clientRm.castVote(remoteRoomId, p2pRes.playerId, 'target_123');
    clientRm.submitNightAction(remoteRoomId, p2pRes.playerId, { actionType: 'WEREWOLF_KILL', targetId: 'target_456' });
    clientRm.sendChatMessage(remoteRoomId, p2pRes.playerId, 'Chào mọi người trên GitHub Pages!', 'PUBLIC');
    clientRm.sendCheer(remoteRoomId, 'Người Chơi GitHub', '👏');
    clientRm.leaveRoom(remoteRoomId, p2pRes.playerId);
  });
});

test('Sprint 15 - TASK-1404: Zero-Knowledge state masking in P2P broadcast', () => {
  const rm = new RoomManager();
  const res = rm.createRoom('Host Sói', '🐺');
  const roomId = res.roomId;

  rm.joinRoom(roomId, 'Dân Làng A', '👨‍🌾');
  rm.joinRoom(roomId, 'Dân Làng B', '👩‍🌾');
  rm.joinRoom(roomId, 'Dân Làng C', '🧙‍♂️');

  // Bắt đầu game
  rm.startGame(roomId, res.playerId);

  const serverRoom = rm.getServerRoom(roomId);
  assert.ok(serverRoom);

  // Kiểm tra masked state: Người chơi thường không được thấy vai trò của người khác
  const maskedState = rm.getMaskedState(roomId, serverRoom.players[1].id);
  assert.ok(maskedState.myPlayerId);
  assert.ok(maskedState.myRole);

  // Các người chơi khác trong mảng maskedState.players không được lộ role
  const otherPlayers = maskedState.players.filter(p => p.id !== maskedState.myPlayerId);
  otherPlayers.forEach(p => {
    assert.equal(p.role, undefined, 'Vai trò của người chơi khác tuyệt đối không được lộ trong gói tin');
  });
});
