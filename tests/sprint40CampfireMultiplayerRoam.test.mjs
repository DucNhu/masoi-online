import test from 'node:test';
import assert from 'node:assert/strict';
import { CampfireRoamMesh, ROAM_MQTT_TOPIC } from '../src/logic/campfireRoamMesh.ts';
import { DEFAULT_OUTFIT } from '../src/components/arena3d/types.ts';
import { WolfCharacter } from '../src/components/arena3d/WolfMeshBuilder.ts';

test('Sprint 40 - TASK-4001: Khởi tạo CampfireRoamMesh và cấu hình ClientId duy nhất', () => {
  const mesh1 = new CampfireRoamMesh();
  const mesh2 = new CampfireRoamMesh();

  assert.ok(mesh1.clientId, 'Mesh 1 phải có clientId');
  assert.ok(mesh2.clientId, 'Mesh 2 phải có clientId');
  assert.notEqual(mesh1.clientId, mesh2.clientId, 'Hai instance Mesh phải có ClientId khác nhau');
  assert.equal(ROAM_MQTT_TOPIC, 'masoi/v2/campgrounds/roam', 'Topic MQTT Metaverse Roam phải chuẩn hóa');
});

test('Sprint 40 - TASK-4002: Start RoamMesh với thông tin người chơi ban đầu & Online count', () => {
  const mesh = new CampfireRoamMesh();
  mesh.start({
    name: 'Thợ Săn PC',
    outfit: DEFAULT_OUTFIT,
    tentId: 'tent-1',
    isRoaming: true,
    position: { x: 2, y: 0.05, z: 3 },
  });

  assert.equal(mesh.getOnlineCount(), 1, 'Khi chỉ có người chơi cục bộ, online count = 1');
  assert.equal(mesh.getOnlinePlayers().length, 0, 'Chưa có người chơi từ xa');

  mesh.stop();
});

test('Sprint 40 - TASK-4003: Tiếp nhận ROAM_UPDATE từ thiết bị từ xa (Điện thoại gặp Máy tính)', () => {
  const mesh = new CampfireRoamMesh();
  mesh.start({
    name: 'Thợ Săn PC',
    outfit: DEFAULT_OUTFIT,
  });

  let updatedPlayer = null;
  let onlineCount = 0;

  mesh.onPlayerUpdate((p) => {
    updatedPlayer = p;
  });

  mesh.onOnlineCountChange((cnt) => {
    onlineCount = cnt;
  });

  // Giả lập tin nhắn ROAM_UPDATE từ Điện thoại (Mobile)
  const mobilePlayer = {
    id: 'roam_mobile_phone_999',
    name: 'Thợ Săn Mobile 📱',
    outfit: {
      ...DEFAULT_OUTFIT,
      skinId: 'WOLF_SNOW',
    },
    position: { x: 5, y: 0.05, z: 8 },
    facingAngle: 1.57,
    anim: 'walk',
    isRoaming: true,
    seatNumber: null,
    tentId: 'tent-1',
    updatedAt: Date.now(),
  };

  mesh['handleIncomingRawMessage']({
    type: 'ROAM_UPDATE',
    player: mobilePlayer,
  });

  assert.ok(updatedPlayer, 'Phải kích hoạt callback onPlayerUpdate');
  assert.equal(updatedPlayer.id, mobilePlayer.id);
  assert.equal(updatedPlayer.name, 'Thợ Săn Mobile 📱');
  assert.equal(updatedPlayer.outfit.skinId, 'WOLF_SNOW');
  assert.equal(mesh.getOnlineCount(), 2, 'Online count phải tăng lên 2 khi có thêm người chơi Mobile');
  assert.equal(onlineCount, 2, 'Callback onlineCountChange phải nhận giá trị 2');

  mesh.stop();
});

test('Sprint 40 - TASK-4004: Bỏ qua tin nhắn ROAM_UPDATE từ chính mình để tránh vòng lặp phản hồi', () => {
  const mesh = new CampfireRoamMesh();
  mesh.start({ name: 'Thợ Săn Cục Bộ' });

  let updateTriggered = false;
  mesh.onPlayerUpdate(() => {
    updateTriggered = true;
  });

  // Gửi chính clientId của mesh
  mesh['handleIncomingRawMessage']({
    type: 'ROAM_UPDATE',
    player: { id: mesh.clientId, name: 'Chính mình' },
  });

  assert.equal(updateTriggered, false, 'Tuyệt đối không xử lý cập nhật từ chính mình');
  assert.equal(mesh.getOnlineCount(), 1);

  mesh.stop();
});

test('Sprint 40 - TASK-4005: Xử lý ROAM_LEAVE khi thiết bị từ xa rời khỏi khu trại', () => {
  const mesh = new CampfireRoamMesh();
  mesh.start({ name: 'Thợ Săn Host' });

  let leftPlayerId = null;

  mesh.onPlayerLeave((id) => {
    leftPlayerId = id;
  });

  // 1. Mobile tham gia
  mesh['handleIncomingRawMessage']({
    type: 'ROAM_UPDATE',
    player: {
      id: 'mobile_player_123',
      name: 'Mobile Phone',
      outfit: DEFAULT_OUTFIT,
      position: { x: 0, y: 0, z: 0 },
      updatedAt: Date.now(),
    },
  });
  assert.equal(mesh.getOnlineCount(), 2);

  // 2. Mobile rời phòng
  mesh['handleIncomingRawMessage']({
    type: 'ROAM_LEAVE',
    playerId: 'mobile_player_123',
  });

  assert.equal(leftPlayerId, 'mobile_player_123', 'Phải thông báo ID người chơi đã rời');
  assert.equal(mesh.getOnlineCount(), 1, 'Online count phải giảm về 1 sau khi người chơi rời');

  mesh.stop();
});

test('Sprint 40 - TASK-4006: Throttling phát sóng vị trí ~80ms để tối ưu hóa băng thông mạng', () => {
  const mesh = new CampfireRoamMesh();
  mesh.start({ name: 'Thợ Săn Di Chuyển' });

  let directBroadcastCount = 0;
  mesh['broadcastDirect'] = () => {
    directBroadcastCount++;
  };

  mesh.broadcastMyPosition({ position: { x: 1, y: 0.05, z: 1 } });
  mesh.broadcastMyPosition({ position: { x: 1.1, y: 0.05, z: 1.1 } });
  mesh.broadcastMyPosition({ position: { x: 1.2, y: 0.05, z: 1.2 } });

  // Do throttle 80ms, 3 lần gọi liên tiếp cùng 1 frame chỉ gửi 1 lần
  assert.equal(directBroadcastCount, 1, 'Phải throttle các lệnh gửi liên tiếp trong <80ms');

  mesh.stop();
});

test('Sprint 40 - TASK-4007: Đồng bộ mô hình 3D WolfCharacter của người chơi từ xa trong không gian Three.js', () => {
  const remoteWolf = new WolfCharacter(DEFAULT_OUTFIT);
  remoteWolf.setNameplate('Người Chơi Mobile 🐺');
  remoteWolf.setStanding(true);
  remoteWolf.setAnimation('walk');

  assert.ok(remoteWolf.root, 'Remote wolf root group phải tồn tại');
  assert.equal(remoteWolf.isStanding, true, 'Remote wolf phải ở tư thế đứng khi đi dạo');

  // Đặt vị trí ban đầu
  remoteWolf.root.position.set(10, 0.05, 15);
  remoteWolf.root.rotation.y = Math.PI / 2;

  // Giả lập nội suy Lerp di chuyển tới vị trí mới
  const targetPos = { x: 12, y: 0.05, z: 18 };
  remoteWolf.root.position.lerp(targetPos, 0.22);

  assert.ok(remoteWolf.root.position.x > 10, 'Vị trí x phải tiến gần tới targetPos');
  assert.ok(remoteWolf.root.position.z > 15, 'Vị trí z phải tiến gần tới targetPos');

  // Cập nhật outfit sang Sói Tiên Tri
  remoteWolf.updateOutfit({
    skinId: 'WOLF_SNOW',
    hatId: 'WITCH',
    eyeGlowId: 'CYAN',
    backItemId: 'CAPE',
  });
  assert.equal(remoteWolf.outfit.skinId, 'WOLF_SNOW');
  assert.equal(remoteWolf.outfit.hatId, 'WITCH');
});

