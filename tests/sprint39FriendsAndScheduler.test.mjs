import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  FriendService,
  generateHunterCode,
} from '../src/logic/friendService.ts';
import {
  SchedulerService,
  formatMatchCountdown,
  formatScheduledTime,
} from '../src/logic/schedulerService.ts';

// In-memory mock storage
function createMockStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    clear: () => map.clear(),
  };
}

describe('Sprint 39 - Hunter Code & Friend System', () => {
  it('Hunter Code: sinh mã duy nhất, chuẩn hóa chữ hoa và tiền tố HS-', () => {
    const code1 = generateHunterCode('aduckuba41');
    const code2 = generateHunterCode('aduckuba41');
    const codeDiff = generateHunterCode('nguoichoi99');

    assert.equal(code1, code2, 'Cùng username phải sinh ra cùng Hunter Code');
    assert.match(code1, /^HS-[A-Z0-9]{5,8}$/, 'Mã phải có tiền tố HS- và ký tự hợp lệ');
    assert.notEqual(code1, codeDiff, 'Khác username phải sinh ra khác Hunter Code');
  });

  it('Hunter Code: xử lý khoảng trắng thừa và tên rỗng', () => {
    const c1 = generateHunterCode('  ducnhu  ');
    const c2 = generateHunterCode('ducnhu');
    assert.equal(c1, c2, 'Khoảng trắng không làm đổi mã');

    const empty = generateHunterCode('');
    assert.equal(empty, 'HS-WOLF00');
  });

  it('FriendService: gửi lời mời kết bạn thành công', () => {
    const storage = createMockStorage();
    const service = new FriendService(storage);

    const res = service.sendRequest('player_a', 'Người Chơi A', 'player_b');
    assert.equal(res.ok, true);
    assert.match(res.message, /thành công/);

    const pending = service.getPendingRequests('player_b');
    assert.equal(pending.length, 1);
    assert.equal(pending[0].fromUsername, 'player_a');
  });

  it('FriendService: không cho phép tự kết bạn với chính mình', () => {
    const storage = createMockStorage();
    const service = new FriendService(storage);

    const res = service.sendRequest('duc_vip', 'Đức VIP', 'duc_vip');
    assert.equal(res.ok, false);
    assert.match(res.message, /chính mình/);

    const code = generateHunterCode('duc_vip');
    const resCode = service.sendRequest('duc_vip', 'Đức VIP', code);
    assert.equal(resCode.ok, false);
    assert.match(resCode.message, /chính mình/);
  });

  it('FriendService: chặn gửi trùng lặp lời mời đang chờ', () => {
    const storage = createMockStorage();
    const service = new FriendService(storage);

    service.sendRequest('user1', 'User 1', 'user2');
    const dup = service.sendRequest('user1', 'User 1', 'user2');
    assert.equal(dup.ok, false);
    assert.match(dup.message, /chờ phản hồi/);
  });

  it('FriendService: chấp nhận lời mời tạo quan hệ bạn bè 2 chiều', () => {
    const storage = createMockStorage();
    const service = new FriendService(storage);

    const req = service.sendRequest('player_a', 'Người Chơi A', 'player_b');
    assert.equal(req.ok, true);

    const acceptRes = service.acceptRequest(req.request.id, 'player_b');
    assert.equal(acceptRes.ok, true);

    const friendsA = service.getFriends('player_a');
    const friendsB = service.getFriends('player_b');

    assert.equal(friendsA.length, 1);
    assert.equal(friendsA[0].username, 'player_b');

    assert.equal(friendsB.length, 1);
    assert.equal(friendsB[0].username, 'player_a');
  });

  it('FriendService: từ chối lời mời không thêm vào danh sách bạn', () => {
    const storage = createMockStorage();
    const service = new FriendService(storage);

    const req = service.sendRequest('stranger', 'Người Lạ', 'me');
    service.declineRequest(req.request.id);

    const pending = service.getPendingRequests('me');
    assert.equal(pending.length, 0);

    const friends = service.getFriends('me');
    assert.equal(friends.length, 0);
  });

  it('FriendService: xóa bạn bè xóa cả 2 phía', () => {
    const storage = createMockStorage();
    const service = new FriendService(storage);

    const req = service.sendRequest('a', 'A', 'b');
    service.acceptRequest(req.request.id, 'b');

    service.removeFriend('a', 'b');
    assert.equal(service.getFriends('a').length, 0);
    assert.equal(service.getFriends('b').length, 0);
  });
});

describe('Sprint 39 - Match Scheduler & 15m Reminder', () => {
  it('Scheduler: tạo lịch hẹn với preset hours sau n tiếng', () => {
    const storage = createMockStorage();
    const service = new SchedulerService(storage);
    const now = 1700000000000;

    const match = service.createMatch(
      {
        hostUsername: 'host_1',
        hostDisplayName: 'Chủ Làng',
        tableName: 'Lều Trăng Máu #1',
        hoursLater: 3,
        notes: 'Vào đúng giờ nhé',
      },
      now
    );

    assert.equal(match.scheduledAt, now + 3 * 3600000);
    assert.equal(match.tableName, 'Lều Trăng Máu #1');
    assert.equal(match.notified15m, false);
  });

  it('Scheduler: đếm ngược hiển thị chính xác theo từng mốc thời gian', () => {
    const now = 1700000000000;

    // Còn 2 giờ 30 phút
    const t1 = now + (2 * 3600000 + 30 * 60000);
    assert.equal(formatMatchCountdown(t1, now), 'Còn 2 giờ 30 phút');

    // Còn 14 phút (ngưỡng 15 phút - sắp diễn ra!)
    const t2 = now + 14 * 60000;
    assert.equal(formatMatchCountdown(t2, now), 'Còn 14 phút (Sắp diễn ra!)');

    // Còn 5 phút
    const t3 = now + 5 * 60000;
    assert.equal(formatMatchCountdown(t3, now), 'Còn 5 phút (Sắp diễn ra!)');

    // Đã bắt đầu 10 phút trước
    const tPast = now - 10 * 60000;
    assert.equal(formatMatchCountdown(tPast, now), 'Đã bắt đầu (10 phút trước)');
  });

  it('Scheduler: định dạng ngày giờ hiển thị formatScheduledTime', () => {
    const now = Date.now();
    const str = formatScheduledTime(now);
    assert.match(str, /^[0-2][0-9]:[0-5][0-9]/);
  });

  it('Scheduler: kích hoạt thông báo nhắc nhở chuẩn xác ở mốc trước 15 phút', () => {
    const storage = createMockStorage();
    const service = new SchedulerService(storage);
    const startTime = 1700000000000;

    // Tạo trận đấu lúc T = 1700000000000
    const match = service.createMatch(
      {
        hostUsername: 'aduckuba41',
        hostDisplayName: 'Aduc',
        exactTimestamp: startTime,
        tableName: 'Lều Bàn 2 (Rừng Sương Mù)',
      },
      startTime - 2 * 3600000
    );

    let triggeredCount = 0;
    let triggeredMins = 0;
    const onTrigger = (m, mins) => {
      triggeredCount++;
      triggeredMins = mins;
    };

    // 1. Kiểm tra ở thời điểm trước 20 phút (T - 20m): CHƯA kích hoạt
    const t20mBefore = startTime - 20 * 60000;
    const r1 = service.checkAndTriggerReminders(t20mBefore, onTrigger);
    assert.equal(r1.length, 0);
    assert.equal(triggeredCount, 0);

    // 2. Kiểm tra ở thời điểm trước 14 phút (T - 14m): PHẢI KÍCH HOẠT!
    const t14mBefore = startTime - 14 * 60000;
    const r2 = service.checkAndTriggerReminders(t14mBefore, onTrigger);
    assert.equal(r2.length, 1);
    assert.equal(triggeredCount, 1);
    assert.equal(triggeredMins, 14);
    assert.equal(r2[0].notified15m, true);

    // 3. Kiểm tra lại ở thời điểm trước 10 phút (T - 10m): KHÔNG KÍCH HOẠT LẠI (chống spam)
    const t10mBefore = startTime - 10 * 60000;
    const r3 = service.checkAndTriggerReminders(t10mBefore, onTrigger);
    assert.equal(r3.length, 0);
    assert.equal(triggeredCount, 1);

    // 4. Kiểm tra khi trận đấu đã qua: KHÔNG kích hoạt
    const tPast = startTime + 1000;
    const r4 = service.checkAndTriggerReminders(tPast, onTrigger);
    assert.equal(r4.length, 0);
  });

  it('Scheduler: hủy lịch hẹn thành công chỉ với chính chủ', () => {
    const storage = createMockStorage();
    const service = new SchedulerService(storage);

    const match = service.createMatch({
      hostUsername: 'real_host',
      hostDisplayName: 'Chủ Thật',
      tableName: 'Lều VIP',
    });

    // Kẻ lạ cố hủy -> thất bại
    const failCancel = service.cancelMatch(match.id, 'imposter');
    assert.equal(failCancel, false);

    // Chính chủ hủy -> thành công
    const okCancel = service.cancelMatch(match.id, 'real_host');
    assert.equal(okCancel, true);

    const list = service.getMatchesForUser('real_host');
    assert.equal(list.length, 0);
  });
});
