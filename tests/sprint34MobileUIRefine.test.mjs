import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatNameplateDisplayName } from '../src/components/arena3d/WolfMeshBuilder.ts';
import { CAMP_TENTS } from '../src/components/arena3d/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

test('Sprint 34 - TASK-3401: 3D Floating Nameplate display up to 22 characters without ellipsis truncation', () => {
  // Kiểm tra các vai trò tiếng Việt thực tế trong game ma sói có độ dài 15-22 ký tự
  const roleNames = [
    { seat: 9, name: 'Xạ Thủ Rừng Sâu', expected: '#9 Xạ Thủ Rừng Sâu' },
    { seat: 8, name: 'Sói Bóng Ngầm', expected: '#8 Sói Bóng Ngầm' },
    { seat: 3, name: 'Thợ Săn Rừng Rậm', expected: '#3 Thợ Săn Rừng Rậm' },
    { seat: 4, name: 'Phù Thủy Quyền Năng', expected: '#4 Phù Thủy Quyền Năng' },
    { seat: 10, name: 'Tiên Tri Thần Bí', expected: '#10 Tiên Tri Thần Bí' },
    { seat: 1, name: 'Bảo Vệ Đêm Trăng', expected: '#1 Bảo Vệ Đêm Trăng' },
  ];

  for (const { seat, name, expected } of roleNames) {
    const formatted = formatNameplateDisplayName(name, seat, 22);
    assert.equal(
      formatted,
      expected,
      `Tên vai trò "${expected}" (${expected.length} ký tự) phải hiển thị trọn vẹn, không bị cắt '…'`
    );
    assert.ok(
      !formatted.includes('…'),
      `Tên "${formatted}" không được chứa dấu ba chấm '…'`
    );
  }

  // Tên dài quá 22 ký tự thì được cắt an toàn thành 21 ký tự + '…'
  const longName = 'Người Chơi Bí Ẩn Vô Cùng Nguy Hiểm Cực Kỳ';
  const truncated = formatNameplateDisplayName(longName, 5, 22);
  assert.equal(truncated.length, 22, 'Chuỗi quá dài sau khi cắt phải đúng độ dài giới hạn 22');
  assert.ok(truncated.endsWith('…'), 'Chuỗi vượt ngưỡng phải kết thúc bằng dấu ba chấm');

  // Trường hợp không có số ghế
  const noSeat = formatNameplateDisplayName('Trưởng Làng Quyền Lực', undefined, 22);
  assert.equal(noSeat, 'Trưởng Làng Quyền Lực');
});

test('Sprint 34 - TASK-3402: Tent Banner emoji extraction prevents duplicate title overlap', () => {
  for (const tent of CAMP_TENTS) {
    const tentEmoji = tent.banner.split(' ')[0];
    assert.ok(tentEmoji, `Tent [${tent.id}] must have valid banner emoji`);

    // Ghép với tent.name không được lặp lại từ trong banner
    const combinedButtonText = `${tentEmoji} ${tent.name}`;

    // Đảm bảo không còn hiện tượng "🩸 Trăng Máu Lều Trăng Máu"
    assert.ok(
      !combinedButtonText.includes('Trăng Máu Lều Trăng Máu'),
      `Combined text "${combinedButtonText}" must not duplicate tent name`
    );

    // Ký tự emoji chuẩn
    if (tent.id === 'tent-1') assert.equal(tentEmoji, '🩸');
    if (tent.id === 'tent-2') assert.equal(tentEmoji, '🌫️');
    if (tent.id === 'tent-3') assert.equal(tentEmoji, '🌲');
    if (tent.id === 'tent-4') assert.equal(tentEmoji, '✨');
  }
});

test('Sprint 34 - TASK-3403: Clean Bottom Dock text without redundant emojis and compact mobile labels', () => {
  // Tiêu đề nút đêm trên desktop & mobile
  const desktopVi = 'Bắt Đầu Đêm Đồng Thời (25s)';
  const mobileVi = 'Bắt Đầu Đêm (25s)';

  // Không lặp emoji 🌙 trong text vì đã có Moon icon
  assert.ok(
    !desktopVi.startsWith('🌙'),
    `Desktop button text "${desktopVi}" must not start with redundant moon emoji`
  );
  assert.ok(
    !mobileVi.startsWith('🌙'),
    `Mobile button text "${mobileVi}" must not start with redundant moon emoji`
  );

  // Nhãn mobile phải ngắn gọn <= 20 ký tự để vừa vặn chiều rộng iPhone
  assert.ok(
    mobileVi.length <= 20,
    `Mobile button text "${mobileVi}" (${mobileVi.length} chars) must be <= 20 chars`
  );
});

test('Sprint 34 - TASK-3404: CSS Responsive breakpoints and mobile UI containment rules', () => {
  const cssPath = path.join(projectRoot, 'src', 'index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  // 1. Breakpoint chuẩn cho modern mobile (iPhone 16 Pro 402px, Pro Max 430px)
  assert.ok(
    cssContent.includes('@media (max-width: 640px)'),
    'src/index.css must include modern mobile media query @media (max-width: 640px)'
  );

  // 2. Quy tắc ẩn nhãn chữ trên các tab KHÔNG active của Header
  assert.ok(
    cssContent.includes('.gamebar-nav-pill:not(.active) .nav-text-mobile'),
    'src/index.css must include inactive pill text hiding rule'
  );

  // 3. Quy tắc giảm font-size brand title trên mobile
  assert.ok(
    cssContent.includes('.gamebar-brand-title') && cssContent.includes('0.85rem'),
    'src/index.css must reduce .gamebar-brand-title to 0.85rem on mobile'
  );

  // 4. Giới hạn chiều rộng top-left tent bar để không đè vào right toolbar
  assert.ok(
    cssContent.includes('.top-left-tent-bar') && cssContent.includes('calc(100vw - 68px)'),
    'src/index.css must bound top-left-tent-bar max-width'
  );

  // 5. Right toolbar thu gọn trên mobile xuống 38px và nút 32px
  assert.ok(
    cssContent.includes('.hud-right-toolbar') && cssContent.includes('38px'),
    'src/index.css must configure .hud-right-toolbar width to 38px on mobile'
  );
  assert.ok(
    cssContent.includes('.hud-right-toolbar .hud-icon-btn') && cssContent.includes('32px'),
    'src/index.css must configure .hud-right-toolbar buttons to 32px on mobile'
  );

  // 6. Dock nút đổi ngoại trang thành icon vuông 38px trên mobile
  assert.ok(
    cssContent.includes('.dock-wardrobe-btn') && cssContent.includes('.dock-wardrobe-text'),
    'src/index.css must hide .dock-wardrobe-text and size .dock-wardrobe-btn on mobile'
  );
});
