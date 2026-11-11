import test from 'node:test';
import assert from 'node:assert/strict';
import { CampfireScene } from '../src/components/arena3d/CampfireScene.ts';

// Camera đặt tại roamPosition + (sin θ, cos θ) * r và nhìn về nhân vật.
// => "Lên" phải luôn đưa nhân vật ra XA camera, "Phải" phải đưa sang phải màn hình.
const close = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg}: expected ${b}, got ${a}`);
const move = (angle, f, r) => CampfireScene.computeCameraRelativeMovement(angle, f, r);

test('Sprint 37 - Controls: không có input thì không di chuyển', () => {
  assert.equal(move(0, 0, 0), null);
  assert.equal(move(Math.PI / 3, 1, 0) === null, false);
});

test('Sprint 37 - Controls: camera góc 0 (camera ở +Z nhìn về -Z)', () => {
  const up = move(0, 1, 0);
  close(up.dirX, 0, 'Up X'); close(up.dirZ, -1, 'Up Z');
  const down = move(0, -1, 0);
  close(down.dirX, 0, 'Down X'); close(down.dirZ, 1, 'Down Z');
  const left = move(0, 0, -1);
  close(left.dirX, -1, 'Left X'); close(left.dirZ, 0, 'Left Z');
  const right = move(0, 0, 1);
  close(right.dirX, 1, 'Right X'); close(right.dirZ, 0, 'Right Z');
});

test('Sprint 37 - Controls: camera góc 90° (mặc định), 180°, 270°', () => {
  const up90 = move(Math.PI / 2, 1, 0);
  close(up90.dirX, -1, 'Up90 X'); close(up90.dirZ, 0, 'Up90 Z');
  const right90 = move(Math.PI / 2, 0, 1);
  close(right90.dirX, 0, 'Right90 X'); close(right90.dirZ, -1, 'Right90 Z');

  const up180 = move(Math.PI, 1, 0);
  close(up180.dirX, 0, 'Up180 X'); close(up180.dirZ, 1, 'Up180 Z');

  const right270 = move((3 * Math.PI) / 2, 0, 1);
  close(right270.dirX, 0, 'Right270 X'); close(right270.dirZ, 1, 'Right270 Z');
});

test('Sprint 37 - Controls: "Lên" luôn đi ra xa camera ở MỌI góc xoay (không còn bị đảo chiều)', () => {
  for (let i = 0; i < 36; i++) {
    const angle = (i / 36) * Math.PI * 2;
    const camOffset = { x: Math.sin(angle), z: Math.cos(angle) }; // hướng từ nhân vật tới camera
    const up = move(angle, 1, 0);
    const dot = up.dirX * camOffset.x + up.dirZ * camOffset.z;
    close(dot, -1, `Up phải ngược hướng camera ở góc ${angle.toFixed(2)}`);

    // "Phải" vuông góc với hướng nhìn và nằm bên phải màn hình (cross product Y > 0 theo quy ước Three.js)
    const right = move(angle, 0, 1);
    close(right.dirX * up.dirX + right.dirZ * up.dirZ, 0, 'Right ⟂ Up');
    const crossY = up.dirZ * right.dirX - up.dirX * right.dirZ;
    close(crossY, -1, `Right nằm bên phải hướng Up ở góc ${angle.toFixed(2)}`);
  }
});

test('Sprint 37 - Controls: đi chéo được chuẩn hóa, không nhanh hơn đi thẳng', () => {
  const diag = move(0.7, 1, 1);
  close(Math.hypot(diag.dirX, diag.dirZ), 1, 'độ dài vector chéo');
});

test('Sprint 37 - Controls: nhân vật quay mặt đúng hướng đang đi', () => {
  for (const [f, r] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1]]) {
    const m = move(1.1, f, r);
    close(Math.sin(m.facingAngle), m.dirX, `facing X (${f},${r})`);
    close(Math.cos(m.facingAngle), m.dirZ, `facing Z (${f},${r})`);
  }
});

test('Sprint 37 - Controls: phím mũi tên và Space bị chặn cuộn trang', () => {
  for (const key of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ']) {
    assert.ok(CampfireScene.SCROLL_KEYS.includes(key), `${JSON.stringify(key)} phải nằm trong SCROLL_KEYS`);
  }
  assert.ok(!CampfireScene.SCROLL_KEYS.includes('w'), 'W không cần chặn');
});
