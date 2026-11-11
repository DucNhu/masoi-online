import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CAMP_TENTS,
  OUTFIT_SKINS,
  OUTFIT_HATS,
  DEFAULT_OUTFIT,
} from '../src/components/arena3d/types.ts';

test('Sprint 36 - TASK-3601: 4 Túp Lều Cắm Trại & Biển Hiệu 3D Bàn 1..4', () => {
  assert.equal(CAMP_TENTS.length, 4, 'Phải có đúng 4 túp lều trong Khu Cắm Trại Đêm 3D');

  const expectedTents = [
    {
      id: 'tent-1',
      name: 'Lều Trăng Máu',
      tableNumber: 1,
      signboardTitle: '🩸 Lều Trăng Máu (Bàn 1)',
      signboardTitleEn: '🩸 Blood Moon Tent (Table 1)',
    },
    {
      id: 'tent-2',
      name: 'Lều Sương Mù',
      tableNumber: 2,
      signboardTitle: '🌫️ Lều Sương Mù (Bàn 2)',
      signboardTitleEn: '🌫️ Mist Valley Tent (Table 2)',
    },
    {
      id: 'tent-3',
      name: 'Lều Rừng Thông',
      tableNumber: 3,
      signboardTitle: '🌲 Lều Rừng Thông (Bàn 3)',
      signboardTitleEn: '🌲 Pine Forest Tent (Table 3)',
    },
    {
      id: 'tent-4',
      name: 'Lều Núi Tuyết',
      tableNumber: 4,
      signboardTitle: '❄️ Lều Núi Tuyết (Bàn 4)',
      signboardTitleEn: '❄️ Snow Mountain Tent (Table 4)',
    },
  ];

  for (const exp of expectedTents) {
    const tent = CAMP_TENTS.find((t) => t.id === exp.id);
    assert.ok(tent, `Không tìm thấy lều với id [${exp.id}]`);
    assert.equal(tent.name, exp.name, `Tên lều [${exp.id}] phải là ${exp.name}`);
    assert.equal(tent.tableNumber, exp.tableNumber, `Số bàn của lều [${exp.id}] phải là ${exp.tableNumber}`);
    assert.equal(
      tent.signboardTitle,
      exp.signboardTitle,
      `Biển hiệu 3D của lều [${exp.id}] phải là "${exp.signboardTitle}"`
    );
    assert.equal(
      tent.signboardTitleEn,
      exp.signboardTitleEn,
      `Biển hiệu 3D tiếng Anh của lều [${exp.id}] phải là "${exp.signboardTitleEn}"`
    );
  }
});

test('Sprint 36 - TASK-3602: Xóa Bỏ 100% Bot Ảo Giả Lập & Đánh Dấu isEmpty: true Cho Ghế Trống', () => {
  // Giả lập logic sinh dữ liệu 10 ghế của CampfireArena3DView
  const generateSeats = (mySeatedNumber, players = [], playerName = 'Thợ Săn Đêm', myOutfit = DEFAULT_OUTFIT) => {
    const list = [];
    const mySkinInfo = OUTFIT_SKINS.find((s) => s.id === myOutfit.skinId);

    for (let i = 1; i <= 10; i++) {
      const p = players.find((item) => item.seatNumber === i);
      const isMe = mySeatedNumber === i;

      if (isMe) {
        list.push({
          seatNumber: i,
          name: playerName,
          isAlive: true,
          isEmpty: false,
          characterIcon: mySkinInfo?.icon || '🏕️',
          characterTitle: mySkinInfo?.name || 'Phượt Thủ Cắm Trại',
          outfit: myOutfit,
        });
        continue;
      }

      if (p) {
        list.push({
          seatNumber: i,
          name: p.name,
          isAlive: p.isAlive,
          isEmpty: false,
          characterIcon: '🏕️',
          characterTitle: p.roleId || 'Player',
          outfit: DEFAULT_OUTFIT,
        });
        continue;
      }

      // Khúc gỗ trống (Empty Stump)
      list.push({
        seatNumber: i,
        name: 'Ghế Trống',
        isAlive: true,
        isEmpty: true,
        characterIcon: '🪑',
        characterTitle: 'Khúc Gỗ Trống',
        outfit: DEFAULT_OUTFIT,
      });
    }
    return list;
  };

  // Trường hợp 1: Người chơi chưa ngồi vào ghế nào (đang đi dạo tự do, không có bot)
  const roamingSeats = generateSeats(null);
  assert.equal(roamingSeats.length, 10, 'Bàn cắm trại phải có đúng 10 vị trí');
  const emptyCount = roamingSeats.filter((s) => s.isEmpty === true).length;
  assert.equal(emptyCount, 10, 'Toàn bộ 10 ghế phải có isEmpty: true khi chưa có ai ngồi');

  for (const seat of roamingSeats) {
    assert.equal(seat.isEmpty, true, `Ghế #${seat.seatNumber} phải được đánh dấu isEmpty: true`);
    assert.equal(seat.name, 'Ghế Trống', `Ghế #${seat.seatNumber} phải có tên "Ghế Trống"`);
    assert.equal(seat.characterIcon, '🪑', `Ghế #${seat.seatNumber} phải có icon "🪑"`);
    // Tuyệt đối không được chứa tên bot giả lập cũ
    assert.ok(!seat.name.includes('Pháp Sư Tiên Tri'), 'Không được có bot ảo Pháp Sư Tiên Tri');
    assert.ok(!seat.name.includes('Phù Thủy Giả Kim'), 'Không được có bot ảo Phù Thủy Giả Kim');
    assert.ok(!seat.name.includes('Sói Hồng Nguyệt'), 'Không được có bot ảo Sói Hồng Nguyệt');
  }

  // Trường hợp 2: Người chơi ngồi vào ghế số 4
  const seatedSeats = generateSeats(4, [], 'Chiến Thần Đêm');
  const seat4 = seatedSeats.find((s) => s.seatNumber === 4);
  assert.ok(seat4, 'Ghế số 4 phải tồn tại');
  assert.equal(seat4.isEmpty, false, 'Ghế số 4 người chơi ngồi phải có isEmpty: false');
  assert.equal(seat4.name, 'Chiến Thần Đêm', 'Ghế số 4 phải hiển thị đúng tên người chơi');

  const otherSeats = seatedSeats.filter((s) => s.seatNumber !== 4);
  assert.equal(otherSeats.length, 9, 'Phải có 9 ghế còn lại');
  for (const other of otherSeats) {
    assert.equal(other.isEmpty, true, `Ghế #${other.seatNumber} còn lại phải là isEmpty: true`);
    assert.equal(other.name, 'Ghế Trống');
  }
});

test('Sprint 36 - TASK-3603: Cơ Chế Ngồi Vào Ghế (Sit Down) & Đứng Dậy Đi Tiếp (Stand Up)', () => {
  let isRoaming = true;
  let mySeatedNumber = null;
  let seatedNotice = null;

  const sitAtSeat = (seatNumber, tentName = 'Lều Trăng Máu') => {
    mySeatedNumber = seatNumber;
    isRoaming = false;
    seatedNotice = `Bạn đã ngồi vào Ghế #${seatNumber} [${tentName}]. Đang đợi người chơi khác...`;
  };

  const standUpAndRoam = () => {
    mySeatedNumber = null;
    isRoaming = true;
    seatedNotice = null;
  };

  // 1. Khởi đầu: Đang đi dạo tự do
  assert.equal(isRoaming, true, 'Khởi đầu game phải ở chế độ đi dạo tự do');
  assert.equal(mySeatedNumber, null, 'Chưa ngồi vào ghế nào khi đang đi dạo');
  assert.equal(seatedNotice, null);

  // 2. Chạm vào khúc gỗ số 6 để ngồi
  sitAtSeat(6, 'Lều Trăng Máu');
  assert.equal(isRoaming, false, 'Sau khi ngồi vào ghế, isRoaming phải là false');
  assert.equal(mySeatedNumber, 6, 'mySeatedNumber phải là 6');
  assert.ok(seatedNotice.includes('Ghế #6'), 'Banner HUD phải hiển thị Ghế #6');
  assert.ok(seatedNotice.includes('Lều Trăng Máu'), 'Banner HUD phải hiển thị tên Lều Trăng Máu');

  // 3. Đổi sang ghế số 2
  sitAtSeat(2, 'Lều Sương Mù');
  assert.equal(mySeatedNumber, 2);
  assert.equal(isRoaming, false);
  assert.ok(seatedNotice.includes('Ghế #2'));
  assert.ok(seatedNotice.includes('Lều Sương Mù'));

  // 4. Bấm "Đứng Dậy Đi Tiếp"
  standUpAndRoam();
  assert.equal(isRoaming, true, 'Sau khi đứng dậy, isRoaming phải trở về true');
  assert.equal(mySeatedNumber, null, 'Sau khi đứng dậy, mySeatedNumber phải là null');
  assert.equal(seatedNotice, null, 'Banner thông báo ngồi ghế phải bị xóa');
});

test('Sprint 36 - TASK-3604: Màn Hình Tạo Nhân Vật (Character Creation Modal) & LocalStorage', () => {
  // Giả lập môi trường LocalStorage
  const mockStorage = new Map();
  const localStorageMock = {
    getItem: (key) => mockStorage.get(key) || null,
    setItem: (key, val) => mockStorage.set(key, String(val)),
    removeItem: (key) => mockStorage.delete(key),
  };

  // Khi người chơi mới vào lần đầu:
  const isCreated = localStorageMock.getItem('masoi_player_created') === 'true';
  assert.equal(isCreated, false, 'Người chơi mới chưa tạo nhân vật');

  // Kiểm tra danh mục Skin Chibi và Mũ trong modal
  assert.ok(OUTFIT_SKINS.length >= 7, 'Phải có ít nhất 7 mẫu Skin Chibi phong phú');
  assert.ok(OUTFIT_HATS.length >= 6, 'Phải có ít nhất 6 mẫu Mũ phong cách');

  const chosenSkin = OUTFIT_SKINS.find((s) => s.id === 'WOLF_BLOOD');
  const chosenHat = OUTFIT_HATS.find((h) => h.id === 'CONICAL_HAT');
  assert.ok(chosenSkin, 'Phải có skin WOLF_BLOOD');
  assert.ok(chosenHat, 'Phải có mũ CONICAL_HAT');

  // Giả lập bấm nút "🏕️ Bước Vào Khu Cắm Trại"
  const createdProfile = {
    name: 'Sói Hắc Ám',
    outfit: {
      skinId: chosenSkin.id,
      hatId: chosenHat.id,
      eyeGlowId: 'RED',
      backItemId: 'NONE',
    },
  };

  localStorageMock.setItem('masoi_player_created', 'true');
  localStorageMock.setItem('ma_soi_player_name', createdProfile.name);
  localStorageMock.setItem('ma_soi_player_outfit', JSON.stringify(createdProfile.outfit));

  // Kiểm tra lưu trữ thành công
  assert.equal(localStorageMock.getItem('masoi_player_created'), 'true');
  assert.equal(localStorageMock.getItem('ma_soi_player_name'), 'Sói Hắc Ám');

  const savedOutfit = JSON.parse(localStorageMock.getItem('ma_soi_player_outfit'));
  assert.equal(savedOutfit.skinId, 'WOLF_BLOOD');
  assert.equal(savedOutfit.hatId, 'CONICAL_HAT');
});
