import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { networkHealth } from '../src/utils/networkHealth.js';

console.log('--- BẮT ĐẦU KIỂM THỬ SPRINT 10: MOBILE NATIVE TOUCH UX & NETWORK HEALTH MONITOR ---');

// ==========================================
// TEST 1: Đánh Giá Chất Lượng Mạng (Network State & Quality Grading)
// ==========================================
console.log('⏳ Test 1: Khởi tạo và phân loại chất lượng mạng (getState)...');
const initialState = networkHealth.getState();
assert(typeof initialState.isOnline === 'boolean', 'isOnline phải là boolean');
assert(typeof initialState.pingMs === 'number', 'pingMs phải là số');
assert(['EXCELLENT', 'GOOD', 'POOR', 'DISCONNECTED'].includes(initialState.quality), 'Quality phải thuộc danh mục hợp lệ');
assert(initialState.lastChecked > 0, 'lastChecked timestamp phải hợp lệ');
console.log(`✓ PASS TEST 1: Khởi tạo Network Health thành công (Ping: ${initialState.pingMs}ms, Chất lượng: ${initialState.quality})`);

// ==========================================
// TEST 2: Đăng Ký Lắng Nghe & Hủy Đăng Ký (Subscribe / Unsubscribe)
// ==========================================
console.log('⏳ Test 2: Cơ chế Event Listener (subscribe / unsubscribe)...');
let callCount = 0;
let lastReceivedState = null;

const unsubscribe = networkHealth.subscribe((state) => {
  callCount++;
  lastReceivedState = state;
});

// Listener phải nhận ngay state hiện tại tại thời điểm subscribe
assert.strictEqual(callCount, 1, 'Listener phải được gọi ngay 1 lần khi đăng ký');
assert.notStrictEqual(lastReceivedState, null, 'State nhận được không được null');

// Hủy đăng ký
unsubscribe();
const countAfterUnsub = callCount;

// Kích hoạt đo ping lại
await networkHealth.measurePing();
assert.strictEqual(callCount, countAfterUnsub, 'Listener đã hủy đăng ký không được nhận thêm sự kiện');
console.log('✓ PASS TEST 2: Cơ chế Subscribe / Unsubscribe hoạt động chính xác 100%.');

// ==========================================
// TEST 3: Đo Độ Trễ Kết Nối Thời Gian Thực (measurePing)
// ==========================================
console.log('⏳ Test 3: Đo đạc Ping thời gian thực (measurePing)...');
const ping = await networkHealth.measurePing();
assert(typeof ping === 'number' && ping > 0, 'Ping phải là số dương hợp lệ');

const stateAfterPing = networkHealth.getState();
assert.strictEqual(stateAfterPing.pingMs, ping, 'State phải cập nhật đúng ping vừa đo');
assert(stateAfterPing.lastChecked >= initialState.lastChecked, 'Timestamp lastChecked phải được làm mới');
console.log(`✓ PASS TEST 3: Đo Ping hoàn tất thành công (Ping đo được: ${ping}ms).`);

// ==========================================
// TEST 4: Tiêu Chuẩn Safe Area & Touch UX Trên iPhone 16 Pro (CSS Verification)
// ==========================================
console.log('⏳ Test 4: Rà soát cấu hình Safe Area Inset, Dynamic Island & Touch Targets trong index.css...');
const cssPath = path.resolve(process.cwd(), 'src/index.css');
const cssContent = fs.readFileSync(cssPath, 'utf-8');

assert(
  cssContent.includes('--safe-top: max(env(safe-area-inset-top'),
  'Phải có cấu hình an toàn cho Dynamic Island (--safe-top)'
);
assert(
  cssContent.includes('--safe-bottom: max(env(safe-area-inset-bottom'),
  'Phải có cấu hình an toàn cho Home Indicator (--safe-bottom)'
);
assert(
  cssContent.includes('touch-action: manipulation'),
  'Phải thiết lập touch-action: manipulation chống trễ click trên mobile'
);
assert(
  cssContent.includes('min-height: 44px'),
  'Phải đảm bảo chuẩn Touch Targets tối thiểu 44px theo Apple HIG'
);
console.log('✓ PASS TEST 4: index.css đáp ứng đầy đủ tiêu chuẩn iPhone 16 Pro & Mobile Touch UX.');

console.log('\n🎉 TẤT CẢ 4/4 TESTS SPRINT 10 PASS 100%! MOBILE TOUCH UX & NETWORK MONITOR SẴN SÀNG!');
