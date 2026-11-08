import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
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

test('Sprint 31 - 3D Locomotion QA: Character must stand up before walking and swing legs/arms in opposition', () => {
  const wolf = new WolfCharacter(DEFAULT_OUTFIT);

  // 1. Kiểm tra khi mới tạo: isStanding === false, hai chân ở góc gập ngồi
  assert.equal(wolf.isStanding, false, 'Default posture is sitting on tree stump');
  assert.ok(wolf.leftLeg.rotation.x < -1.0, 'Left leg bent forward for sitting');
  assert.ok(wolf.rightLeg.rotation.x < -1.0, 'Right leg bent forward for sitting');

  // 2. Đứng dậy: setStanding(true)
  wolf.setStanding(true);
  assert.equal(wolf.isStanding, true, 'Character stands up tall');
  assert.equal(wolf.leftLeg.rotation.x, 0, 'Left leg straight down');
  assert.equal(wolf.rightLeg.rotation.x, 0, 'Right leg straight down');
  assert.equal(wolf.bodyGroup.position.y, 0.22, 'Body lifted for standing');
  assert.equal(wolf.headGroup.position.y, 1.20, 'Head at standing height');

  // 3. Đang ngồi mà gọi setAnimation('walk'): tự động ép isStanding === true
  wolf.setStanding(false);
  assert.equal(wolf.isStanding, false, 'Character sat back down');

  wolf.setAnimation('walk');
  assert.equal(wolf.isStanding, true, 'Calling walk animation automatically forces standing posture');

  wolf.update(0.1);
  assert.equal(wolf.isStanding, true, 'Character remains standing during walk update');

  // Hai chân vung ngược chiều nhau (opposite swing directions)
  assert.ok(
    wolf.leftLeg.rotation.x * wolf.rightLeg.rotation.x < 0,
    `Legs swing in opposition: leftLeg=${wolf.leftLeg.rotation.x}, rightLeg=${wolf.rightLeg.rotation.x}`
  );

  // Hai tay vung ngược chiều nhau
  assert.ok(
    wolf.leftArm.rotation.x * wolf.rightArm.rotation.x < 0,
    `Arms swing in opposition: leftArm=${wolf.leftArm.rotation.x}, rightArm=${wolf.rightArm.rotation.x}`
  );

  // Hai tay vung ngược chiều với hai chân cùng phía (leftArm opposed to leftLeg)
  assert.ok(
    wolf.leftArm.rotation.x * wolf.leftLeg.rotation.x < 0,
    'Arm and leg on same side swing in opposition for natural humanoid walk'
  );
});

test('Sprint 32 - 3D Hat & Nameplate Clearance QA: Every hat and archetype keeps nameplate strictly above head/hat geometry with depthTest disabled', () => {
  const hatIds = ['NONE', 'CONICAL_HAT', 'WITCH', 'COWBOY', 'CROWN', 'BANDANA'];
  const skinIds = ['WOLF_GRAY', 'WOLF_BLOOD', 'KITSUNE_FOX'];

  for (const skinId of skinIds) {
    for (const hatId of hatIds) {
      const char = new WolfCharacter({
        skinId,
        hatId,
        eyeGlowId: 'RED',
        backItemId: 'NONE',
      });
      char.setNameplate('Thợ Săn #1', 1, true);

      assert.ok(char.nameplateSprite, `Nameplate sprite created for ${skinId} + ${hatId}`);
      assert.equal(
        char.nameplateSprite.material.depthTest,
        false,
        `depthTest must be false for ${skinId} + ${hatId} to prevent 3D occlusion`
      );
      assert.equal(
        char.nameplateSprite.material.depthWrite,
        false,
        `depthWrite must be false for ${skinId} + ${hatId}`
      );
      assert.equal(
        char.nameplateSprite.renderOrder,
        999,
        `renderOrder must be 999 for high priority rendering`
      );

      // 1. Kiểm tra ở tư thế NGỒI (sitting)
      char.setStanding(false);
      char.root.updateMatrixWorld(true);
      const sittingHeadBox = new THREE.Box3().setFromObject(char.headGroup);
      const sittingSpriteBottomY = char.nameplateSprite.position.y - 0.13;
      assert.ok(
        sittingSpriteBottomY > sittingHeadBox.max.y,
        `Sitting: Nameplate bottom (${sittingSpriteBottomY.toFixed(3)}) must be strictly above head/hat top (${sittingHeadBox.max.y.toFixed(3)}) for ${skinId} + ${hatId}`
      );

      // 2. Kiểm tra ở tư thế ĐỨNG / ĐI BỘ (standing & walk animation)
      char.setStanding(true);
      char.setAnimation('walk');
      char.update(0.1);
      char.root.updateMatrixWorld(true);
      const walkingHeadBox = new THREE.Box3().setFromObject(char.headGroup);
      const walkingSpriteBottomY = char.nameplateSprite.position.y - 0.13;
      assert.ok(
        walkingSpriteBottomY > walkingHeadBox.max.y,
        `Walking: Nameplate bottom (${walkingSpriteBottomY.toFixed(3)}) must be strictly above head/hat top (${walkingHeadBox.max.y.toFixed(3)}) for ${skinId} + ${hatId}`
      );
    }
  }
});

test('Sprint 32 - 3D Character Raycast & Seat Interaction QA: Raycast hits on character body or limbs resolve seatNumber', () => {
  const char = new WolfCharacter(DEFAULT_OUTFIT);
  char.root.userData = { seatNumber: 5 };

  // Helper walk-up test simulating getSeatFromIntersects
  const getSeatFromObject = (obj) => {
    let curr = obj;
    while (curr) {
      if (typeof curr.userData?.seatNumber === 'number') {
        return curr.userData.seatNumber;
      }
      curr = curr.parent;
    }
    return null;
  };

  // Check from limb (leftHand -> leftArm -> bodyGroup -> root)
  const leftHandMesh = char.leftArm.children[1];
  assert.ok(leftHandMesh, 'Character has hand mesh');
  assert.equal(getSeatFromObject(leftHandMesh), 5, 'Limb hit resolves seatNumber 5');

  // Check from head (headGroup -> root)
  const headMesh = char.headGroup.children[0];
  assert.ok(headMesh, 'Character has head mesh');
  assert.equal(getSeatFromObject(headMesh), 5, 'Head hit resolves seatNumber 5');
});
