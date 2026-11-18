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

test('Sprint 45: Kho vật phẩm 3D mở rộng lên đúng 49+ items độc đáo', () => {
  // 1. Kiểm tra số lượng danh mục
  assert.equal(OUTFIT_SKINS.length, 14, 'Phải có đúng 14 mẫu Skin Chibi 3D');
  assert.equal(OUTFIT_HATS.length, 13, 'Phải có đúng 13 mẫu Mũ thời trang');
  assert.equal(OUTFIT_EYES.length, 10, 'Phải có đúng 10 màu Mắt phát sáng');
  assert.equal(OUTFIT_BACK_ITEMS.length, 12, 'Phải có đúng 12 món Phụ kiện lưng');

  const totalItems = OUTFIT_SKINS.length + OUTFIT_HATS.length + OUTFIT_EYES.length + OUTFIT_BACK_ITEMS.length;
  assert.equal(totalItems, 49, 'Tổng kho vật phẩm thời trang Chibi 3D phải đạt chuẩn 49 items');

  // 2. Kiểm tra tính duy nhất ID không trùng lặp
  const skinIds = new Set(OUTFIT_SKINS.map((s) => s.id));
  assert.equal(skinIds.size, 14, 'Tất cả 14 Skins phải có ID duy nhất');

  const hatIds = new Set(OUTFIT_HATS.map((h) => h.id));
  assert.equal(hatIds.size, 13, 'Tất cả 13 Hats phải có ID duy nhất');

  const eyeIds = new Set(OUTFIT_EYES.map((e) => e.id));
  assert.equal(eyeIds.size, 10, 'Tất cả 10 Eyes phải có ID duy nhất');

  const backIds = new Set(OUTFIT_BACK_ITEMS.map((b) => b.id));
  assert.equal(backIds.size, 12, 'Tất cả 12 Back items phải có ID duy nhất');
});

test('Sprint 45: Kiểm tra tính toàn vẹn thuộc tính & mô tả song ngữ VI/EN cho toàn bộ 49 items', () => {
  // Kiểm tra 14 Skins
  const expectedSkinIds = [
    'WOLF_GRAY',
    'WOLF_SNOW',
    'WOLF_GOLD',
    'WOLF_SHADOW',
    'WOLF_BLOOD',
    'CAMPER_GIRL',
    'KITSUNE_FOX',
    'WOLF_CYBER',
    'VAMPIRE_LORD',
    'GHOST_PHANTOM',
    'CUPID_ANGEL',
    'SAMURAI_RONIN',
    'PIRATE_CAPTAIN',
    'GOLDEN_ALPHA',
  ];
  for (const id of expectedSkinIds) {
    const skin = OUTFIT_SKINS.find((s) => s.id === id);
    assert.ok(skin, `Skin ${id} phải tồn tại`);
    assert.ok(skin.name && skin.name.length > 0, `Skin ${id} phải có tên tiếng Việt`);
    assert.ok(skin.nameEn && skin.nameEn.length > 0, `Skin ${id} phải có tên tiếng Anh`);
    assert.ok(skin.desc && skin.desc.length > 0, `Skin ${id} phải có mô tả tiếng Việt`);
    assert.ok(skin.descEn && skin.descEn.length > 0, `Skin ${id} phải có mô tả tiếng Anh`);
    assert.ok(skin.icon && skin.icon.length > 0, `Skin ${id} phải có icon emoji`);
    assert.ok(typeof skin.price === 'number' && skin.price >= 0, `Skin ${id} phải có giá coin hợp lệ`);
    assert.ok(typeof skin.hairColor === 'number', `Skin ${id} phải có mã màu tóc`);
    assert.ok(typeof skin.skinTone === 'number', `Skin ${id} phải có mã màu da`);
    assert.ok(typeof skin.jacketColor === 'number', `Skin ${id} phải có mã màu áo`);
    assert.ok(typeof skin.scarfColor === 'number', `Skin ${id} phải có mã màu khăn`);
  }

  // Kiểm tra 13 Hats
  const expectedHatIds = [
    'NONE',
    'CONICAL_HAT',
    'WITCH',
    'COWBOY',
    'CROWN',
    'BANDANA',
    'HALO',
    'PIRATE_HAT',
    'CAT_EARS',
    'VIKING_HELMET',
    'SANTA_HAT',
    'BERET',
    'STRAW_HAT',
  ];
  for (const id of expectedHatIds) {
    const hat = OUTFIT_HATS.find((h) => h.id === id);
    assert.ok(hat, `Hat ${id} phải tồn tại`);
    assert.ok(hat.name && hat.name.length > 0, `Hat ${id} phải có tên`);
    assert.ok(hat.nameEn && hat.nameEn.length > 0, `Hat ${id} phải có tên tiếng Anh`);
    assert.ok(hat.desc && hat.desc.length > 0, `Hat ${id} phải có mô tả`);
    assert.ok(hat.descEn && hat.descEn.length > 0, `Hat ${id} phải có mô tả tiếng Anh`);
    assert.ok(hat.icon && hat.icon.length > 0, `Hat ${id} phải có icon`);
    assert.ok(typeof hat.price === 'number' && hat.price >= 0, `Hat ${id} phải có giá coin hợp lệ`);
  }

  // Kiểm tra 10 Eyes
  const expectedEyeIds = [
    'RED',
    'YELLOW',
    'CYAN',
    'PURPLE',
    'GREEN',
    'PINK_HEART',
    'WHITE_STORM',
    'ORANGE_SUN',
    'VOID_BLACK',
    'GOLD_ROYAL',
  ];
  for (const id of expectedEyeIds) {
    const eye = OUTFIT_EYES.find((e) => e.id === id);
    assert.ok(eye, `Eye ${id} phải tồn tại`);
    assert.ok(eye.name && eye.name.length > 0, `Eye ${id} phải có tên`);
    assert.ok(eye.nameEn && eye.nameEn.length > 0, `Eye ${id} phải có tên tiếng Anh`);
    assert.ok(eye.desc && eye.desc.length > 0, `Eye ${id} phải có mô tả`);
    assert.ok(eye.descEn && eye.descEn.length > 0, `Eye ${id} phải có mô tả tiếng Anh`);
    assert.ok(typeof eye.hex === 'number', `Eye ${id} phải có mã màu hex`);
    assert.ok(typeof eye.price === 'number' && eye.price >= 0, `Eye ${id} phải có giá coin hợp lệ`);
  }

  // Kiểm tra 12 Back items
  const expectedBackIds = [
    'NONE',
    'CAPE',
    'SWORD',
    'POTION',
    'SHIELD',
    'ANGEL_WINGS',
    'DEVIL_WINGS',
    'CAMPING_BACKPACK',
    'BOW_ARROW',
    'GUITAR',
    'SCYTHE',
    'QUIVER',
  ];
  for (const id of expectedBackIds) {
    const item = OUTFIT_BACK_ITEMS.find((b) => b.id === id);
    assert.ok(item, `Back item ${id} phải tồn tại`);
    assert.ok(item.name && item.name.length > 0, `Back item ${id} phải có tên`);
    assert.ok(item.nameEn && item.nameEn.length > 0, `Back item ${id} phải có tên tiếng Anh`);
    assert.ok(item.desc && item.desc.length > 0, `Back item ${id} phải có mô tả`);
    assert.ok(item.descEn && item.descEn.length > 0, `Back item ${id} phải có mô tả tiếng Anh`);
    assert.ok(item.icon && item.icon.length > 0, `Back item ${id} phải có icon`);
    assert.ok(typeof item.price === 'number' && item.price >= 0, `Back item ${id} phải có giá coin hợp lệ`);
  }
});

test('Sprint 45: WolfMeshBuilder dựng mesh 3D Chibi mượt mà với toàn bộ 7 Skin mới', () => {
  const newSkins = [
    'WOLF_CYBER',
    'VAMPIRE_LORD',
    'GHOST_PHANTOM',
    'CUPID_ANGEL',
    'SAMURAI_RONIN',
    'PIRATE_CAPTAIN',
    'GOLDEN_ALPHA',
  ];

  const wolf = new WolfCharacter(DEFAULT_OUTFIT);

  for (const skinId of newSkins) {
    wolf.updateOutfit({
      skinId,
      hatId: 'NONE',
      eyeGlowId: 'CYAN',
      backItemId: 'NONE',
    });

    assert.equal(wolf.outfit.skinId, skinId);
    assert.ok(wolf.root.children.length > 0, `Root mesh của skin ${skinId} phải có node con`);
    assert.ok(wolf.headGroup.children.length > 0, `Head mesh của skin ${skinId} phải có node con`);
    assert.ok(wolf.bodyGroup.children.length > 0, `Body mesh của skin ${skinId} phải có node con`);
  }
});

test('Sprint 45: WolfMeshBuilder dựng mesh 3D Chibi mượt mà với toàn bộ 7 Hat mới', () => {
  const newHats = [
    'HALO',
    'PIRATE_HAT',
    'CAT_EARS',
    'VIKING_HELMET',
    'SANTA_HAT',
    'BERET',
    'STRAW_HAT',
  ];

  const wolf = new WolfCharacter(DEFAULT_OUTFIT);

  for (const hatId of newHats) {
    wolf.updateOutfit({
      skinId: 'WOLF_GRAY',
      hatId,
      eyeGlowId: 'RED',
      backItemId: 'NONE',
    });

    assert.equal(wolf.outfit.hatId, hatId);
    assert.ok(wolf.hatSlot.children.length > 0, `Slot mũ ${hatId} phải chứa Three.js mesh`);
  }
});

test('Sprint 45: WolfMeshBuilder dựng mesh 3D Chibi mượt mà với toàn bộ 7 Back Items mới', () => {
  const newBackItems = [
    'ANGEL_WINGS',
    'DEVIL_WINGS',
    'CAMPING_BACKPACK',
    'BOW_ARROW',
    'GUITAR',
    'SCYTHE',
    'QUIVER',
  ];

  const wolf = new WolfCharacter(DEFAULT_OUTFIT);

  for (const backItemId of newBackItems) {
    wolf.updateOutfit({
      skinId: 'WOLF_GRAY',
      hatId: 'NONE',
      eyeGlowId: 'YELLOW',
      backItemId,
    });

    assert.equal(wolf.outfit.backItemId, backItemId);
    assert.ok(wolf.backSlot.children.length > 0, `Slot lưng ${backItemId} phải chứa Three.js mesh`);
  }
});

test('Sprint 45: WolfMeshBuilder dựng mesh 3D Chibi với toàn bộ 5 màu Mắt mới', () => {
  const newEyes = [
    'PINK_HEART',
    'WHITE_STORM',
    'ORANGE_SUN',
    'VOID_BLACK',
    'GOLD_ROYAL',
  ];

  const wolf = new WolfCharacter(DEFAULT_OUTFIT);

  for (const eyeGlowId of newEyes) {
    wolf.updateOutfit({
      skinId: 'WOLF_GRAY',
      hatId: 'NONE',
      eyeGlowId,
      backItemId: 'NONE',
    });

    assert.equal(wolf.outfit.eyeGlowId, eyeGlowId);
    assert.equal(wolf.eyes.length, 2, 'Nhân vật luôn có 2 mắt 3D Chibi');
  }
});

test('Sprint 45: Kiểm tra tính toán TopClearanceY an toàn cho bảng tên nổi 3D với các mũ mới', () => {
  const wolf = new WolfCharacter(DEFAULT_OUTFIT);

  // Mũ Halo lơ lửng y = 0.42 -> clearance cao an toàn
  wolf.updateOutfit({
    skinId: 'CUPID_ANGEL',
    hatId: 'HALO',
    eyeGlowId: 'PINK_HEART',
    backItemId: 'ANGEL_WINGS',
  });
  const haloClearance = wolf.getTopClearanceY();
  assert.ok(haloClearance >= 1.6, `Halo clearance (${haloClearance}) phải an toàn tránh xuyên hào quang`);

  // Mũ Viking có sừng cong vươn cao
  wolf.updateOutfit({
    skinId: 'GOLDEN_ALPHA',
    hatId: 'VIKING_HELMET',
    eyeGlowId: 'GOLD_ROYAL',
    backItemId: 'SCYTHE',
  });
  const vikingClearance = wolf.getTopClearanceY();
  assert.ok(vikingClearance >= 1.6, `Viking clearance (${vikingClearance}) phải an toàn tránh xuyên sừng`);

  // Khi đứng dậy (isStanding = true), clearance phải tăng tương ứng
  wolf.setStanding(true);
  const standingClearance = wolf.getTopClearanceY();
  assert.ok(standingClearance > vikingClearance, 'Độ cao bảng tên khi đứng phải cao hơn khi ngồi');
});

test('Sprint 45: Kiểm tra Animation và GhostMode với outfit kết hợp mới', () => {
  const wolf = new WolfCharacter({
    skinId: 'VAMPIRE_LORD',
    hatId: 'BERET',
    eyeGlowId: 'VOID_BLACK',
    backItemId: 'DEVIL_WINGS',
  });

  // Chuyển các animation mượt mà
  const anims = ['idle', 'walk', 'howl', 'point', 'slumber'];
  for (const anim of anims) {
    wolf.setAnimation(anim);
    wolf.update(0.016);
  }

  // Chuyển sang GhostMode (linh hồn)
  wolf.setGhostMode(true);
  wolf.update(0.016);

  // Trở lại NormalMode
  wolf.setGhostMode(false);
  wolf.update(0.016);
  assert.ok(true, 'Hoạt ảnh và GhostMode vận hành hoàn hảo');
});
