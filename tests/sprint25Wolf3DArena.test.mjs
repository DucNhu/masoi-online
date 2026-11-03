import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_OUTFIT,
  OUTFIT_SKINS,
  OUTFIT_HATS,
  OUTFIT_EYES,
  OUTFIT_BACK_ITEMS,
} from '../src/components/arena3d/types.ts';
import { WolfCharacter } from '../src/components/arena3d/WolfMeshBuilder.ts';

test('Sprint 25 - 3D Arena: Outfit Catalog integrity and defaults', () => {
  assert.ok(DEFAULT_OUTFIT.skinId, 'Default outfit has skinId');
  assert.ok(DEFAULT_OUTFIT.hatId, 'Default outfit has hatId');
  assert.ok(DEFAULT_OUTFIT.eyeGlowId, 'Default outfit has eyeGlowId');
  assert.ok(DEFAULT_OUTFIT.backItemId, 'Default outfit has backItemId');

  // Kiểm tra tính duy nhất của ID trong catalog
  const skinIds = new Set(OUTFIT_SKINS.map((s) => s.id));
  assert.equal(skinIds.size, OUTFIT_SKINS.length, 'All skins have unique IDs');

  const hatIds = new Set(OUTFIT_HATS.map((h) => h.id));
  assert.equal(hatIds.size, OUTFIT_HATS.length, 'All hats have unique IDs');

  const eyeIds = new Set(OUTFIT_EYES.map((e) => e.id));
  assert.equal(eyeIds.size, OUTFIT_EYES.length, 'All eye glow colors have unique IDs');

  const backIds = new Set(OUTFIT_BACK_ITEMS.map((b) => b.id));
  assert.equal(backIds.size, OUTFIT_BACK_ITEMS.length, 'All back items have unique IDs');

  // Phải có Nón Lá Việt Nam trong catalog
  const conicalHat = OUTFIT_HATS.find((h) => h.id === 'CONICAL_HAT');
  assert.ok(conicalHat, 'Conical hat must exist');
});

test('Sprint 25 - 3D Arena: WolfCharacter creation & outfit swap', () => {
  const wolf = new WolfCharacter(DEFAULT_OUTFIT);
  assert.ok(wolf.root, 'Wolf character root Three.js group created');
  assert.ok(wolf.headGroup, 'Head group created');
  assert.ok(wolf.bodyGroup, 'Body group created');
  assert.equal(wolf.eyes.length, 2, 'Wolf has two eyes');

  // Đổi trang phục sang Sói Tuyết + Mũ Phù Thủy + Áo Choàng
  wolf.updateOutfit({
    skinId: 'WOLF_SNOW',
    hatId: 'WITCH',
    eyeGlowId: 'CYAN',
    backItemId: 'CAPE',
  });

  assert.equal(wolf.outfit.skinId, 'WOLF_SNOW');
  assert.equal(wolf.outfit.hatId, 'WITCH');
  assert.equal(wolf.outfit.eyeGlowId, 'CYAN');
  assert.equal(wolf.outfit.backItemId, 'CAPE');

  // Kiểm tra slot mũ và đồ sau lưng đã được gắn mesh
  assert.ok(wolf.hatSlot.children.length > 0, 'Hat slot has meshes');
  assert.ok(wolf.backSlot.children.length > 0, 'Back slot has meshes');
});

test('Sprint 25 - 3D Arena: WolfCharacter animations & ghost mode for dead players', () => {
  const wolf = new WolfCharacter(DEFAULT_OUTFIT);

  // Thử các hoạt cảnh
  wolf.setAnimation('howl');
  wolf.update(0.016);
  assert.ok(wolf.headGroup.rotation.x < 0, 'Howl tilts head backward towards sky');

  wolf.setAnimation('slumber');
  wolf.update(0.016);
  assert.ok(wolf.headGroup.rotation.x > 0, 'Slumber tilts head downward for sleep');

  wolf.setAnimation('point');
  wolf.update(0.016);

  wolf.setAnimation('idle');
  wolf.update(0.016);

  // Chuyển sang chế độ bóng ma khi chết
  wolf.setGhostMode(true);
  wolf.setGhostMode(false);
});
