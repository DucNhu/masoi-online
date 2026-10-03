import test from 'node:test';
import assert from 'node:assert/strict';
import { RoomManager } from '../src/logic/roomManager.ts';
import { werewolfRoomServerPlugin } from '../src/server/roomServerPlugin.ts';

test('Sprint 14 - TASK-1301: werewolfRoomServerPlugin structure and lifecycle', () => {
  const plugin = werewolfRoomServerPlugin();
  assert.equal(plugin.name, 'werewolf-room-server');
  assert.equal(typeof plugin.configureServer, 'function');
  assert.equal(typeof plugin.configurePreviewServer, 'function');
});

test('Sprint 14 - TASK-1302: Cross-browser instance sync between Chrome and Safari simulation', () => {
  // Giả lập 2 runtime riêng biệt: Chrome (Host) và Safari (Player 2)
  const chromeInstance = new RoomManager();
  const safariInstance = new RoomManager();

  // 1. Chrome tạo phòng AHQB47
  const chromeRes = chromeInstance.createRoom('Minh Quân (Chrome)', '🐺', {
    tableName: 'Bàn Trực Tuyến Đa Trình Duyệt',
  });
  const roomId = chromeRes.roomId;
  assert.ok(roomId);

  // Trước khi sync, Safari chưa có phòng này
  assert.throws(() => {
    safariInstance.joinRoom(roomId, 'Lan Anh (Safari)', '🦊');
  }, /không tồn tại/);

  // 2. Giả lập cơ chế Server Relay: Chrome sync state lên máy chủ, Safari nạp về
  const serverMasterState = chromeInstance.getServerRoom(roomId);
  assert.ok(serverMasterState);

  // Giả lập Safari nhận state từ Server Relay
  safariInstance['handleIncomingRemoteRoom'](JSON.parse(JSON.stringify(serverMasterState)));

  // 3. Safari thử join lại phòng -> PHẢI THÀNH CÔNG 100%!
  const safariJoinRes = safariInstance.joinRoom(roomId, 'Lan Anh (Safari)', '🦊');
  assert.ok(safariJoinRes.playerId);
  assert.equal(safariJoinRes.state.players.length, 2, 'Safari phải thấy cả Host và chính mình');

  // 4. Giả lập Safari sync ngược lại state mới có 2 người về Chrome qua Server Relay
  const safariUpdatedMaster = safariInstance.getServerRoom(roomId);
  chromeInstance['handleIncomingRemoteRoom'](JSON.parse(JSON.stringify(safariUpdatedMaster)));

  const chromeMasked = chromeInstance.getMaskedState(roomId, chromeRes.playerId);
  assert.equal(chromeMasked.players.length, 2, 'Chrome Host phải thấy Safari đã vào phòng');
  assert.equal(chromeMasked.players[1].name, 'Lan Anh (Safari)');
});

test('Sprint 14 - TASK-1303: Headless safety of ensureRoomSynced and syncPublicTablesFromRemote', async () => {
  const rm = new RoomManager();
  // Trong môi trường Node (không có window.fetch thật), các hàm này phải chạy êm ru không văng crash
  const synced = await rm.ensureRoomSynced('ROOM99');
  assert.equal(synced, false, 'Phòng không có thật phải trả về false an toàn');

  await assert.doesNotReject(async () => {
    await rm.syncPublicTablesFromRemote();
  }, 'syncPublicTablesFromRemote không được throw lỗi trong môi trường headless');
});
