import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CampfireScene } from '../src/components/arena3d/CampfireScene.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Helper đọc source code
function readSource(relativePath) {
  const fullPath = path.join(projectRoot, relativePath);
  return fs.readFileSync(fullPath, 'utf8');
}

test('Sprint 41 - TASK-4101: Toán học giới hạn bán kính Camera và hàm clampCameraRadius', () => {
  assert.equal(CampfireScene.MIN_CAMERA_RADIUS, 3.8, 'MIN_CAMERA_RADIUS phải là 3.8');
  assert.equal(CampfireScene.MAX_CAMERA_RADIUS, 24.0, 'MAX_CAMERA_RADIUS phải là 24.0');
  assert.equal(CampfireScene.DEFAULT_ROAM_RADIUS, 8.5, 'DEFAULT_ROAM_RADIUS phải là 8.5');
  assert.equal(CampfireScene.DEFAULT_SEATED_RADIUS, 11.5, 'DEFAULT_SEATED_RADIUS phải là 11.5');

  // Kiểm tra clamp dưới
  assert.equal(CampfireScene.clampCameraRadius(1.0), 3.8, 'Radius nhỏ hơn MIN phải bị clamp về 3.8');
  assert.equal(CampfireScene.clampCameraRadius(-5.0), 3.8, 'Radius âm phải bị clamp về 3.8');
  assert.equal(CampfireScene.clampCameraRadius(3.79), 3.8, 'Radius sát ngưỡng dưới phải về 3.8');

  // Kiểm tra clamp trên
  assert.equal(CampfireScene.clampCameraRadius(25.0), 24.0, 'Radius lớn hơn MAX phải bị clamp về 24.0');
  assert.equal(CampfireScene.clampCameraRadius(999.0), 24.0, 'Radius cực lớn phải về 24.0');

  // Giữ nguyên khi nằm trong khoảng hợp lệ
  assert.equal(CampfireScene.clampCameraRadius(8.5), 8.5, 'Radius 8.5 nằm trong khoảng phải giữ nguyên');
  assert.equal(CampfireScene.clampCameraRadius(15.2), 15.2, 'Radius 15.2 nằm trong khoảng phải giữ nguyên');
});

test('Sprint 41 - TASK-4102: Quy đổi bán kính sang phần trăm Zoom (radiusToZoomPercent)', () => {
  // Mặc định ở chế độ Roaming baseRadius = 8.5
  const defaultZoom = CampfireScene.radiusToZoomPercent(8.5);
  assert.equal(defaultZoom, 100, 'Bán kính mặc định 8.5 phải tương ứng 100% zoom');

  // Phóng to (bán kính nhỏ hơn) -> Phần trăm Zoom tăng (> 100%)
  const zoomInPercent = CampfireScene.radiusToZoomPercent(5.0);
  assert.ok(zoomInPercent > 100, 'Bán kính 5.0 phải cho mức zoom > 100%');
  assert.equal(zoomInPercent, Math.round((8.5 / 5.0) * 100), 'Mức zoom phải tính theo (base / radius) * 100');

  // Thu nhỏ (bán kính lớn hơn) -> Phần trăm Zoom giảm (< 100%)
  const zoomOutPercent = CampfireScene.radiusToZoomPercent(17.0);
  assert.ok(zoomOutPercent < 100, 'Bán kính 17.0 phải cho mức zoom < 100%');
  assert.equal(zoomOutPercent, 50, 'Bán kính 17.0 (gấp đôi 8.5) phải là 50%');

  // Ngưỡng cực đại khi phóng to hết cỡ (3.8)
  const maxZoomPercent = CampfireScene.radiusToZoomPercent(CampfireScene.MIN_CAMERA_RADIUS);
  assert.equal(maxZoomPercent, Math.round((8.5 / 3.8) * 100), 'Zoom max phải khoảng 224%');

  // Ngưỡng cực tiểu khi thu nhỏ hết cỡ (24.0)
  const minZoomPercent = CampfireScene.radiusToZoomPercent(CampfireScene.MAX_CAMERA_RADIUS);
  assert.equal(minZoomPercent, Math.round((8.5 / 24.0) * 100), 'Zoom min phải khoảng 35%');

  // Thử nghiệm với baseRadius của chế độ Seated (11.5)
  const seatedBaseZoom = CampfireScene.radiusToZoomPercent(11.5, 11.5);
  assert.equal(seatedBaseZoom, 100, 'Chế độ seated với baseRadius 11.5 phải cho 100%');
});

test('Sprint 41 - TASK-4103: Tính toán độ cao góc nhìn tương ứng (computeProportionalHeight)', () => {
  // Chế độ Roaming (isRoaming = true)
  const roamDefaultHeight = CampfireScene.computeProportionalHeight(8.5, true);
  assert.equal(Math.round(roamDefaultHeight * 10) / 10, 5.0, 'Độ cao mặc định roaming cho radius 8.5 phải là 5.0');

  // Khi radius nhỏ nhất (MIN_CAMERA_RADIUS = 3.8): clampedRadius = 3.8 -> 3.8 * (5.0 / 8.5) ≈ 2.235
  const roamMinHeight = CampfireScene.computeProportionalHeight(1.0, true);
  assert.ok(roamMinHeight >= 2.2, 'Độ cao roaming luôn được bảo vệ trong giới hạn >= 2.2');
  assert.equal(
    Math.round(roamMinHeight * 1000) / 1000,
    Math.round((3.8 * (5.0 / 8.5)) * 1000) / 1000,
    'Độ cao khi bán kính cực tiểu roaming phải tính theo tỷ lệ bán kính clamped (3.8 * 5 / 8.5)'
  );

  // Khi radius lớn nhất (MAX_CAMERA_RADIUS = 24.0): clampedRadius = 24.0 -> 24 * (5.0 / 8.5) ≈ 14.118 (< 14.5)
  const roamMaxHeight = CampfireScene.computeProportionalHeight(100.0, true);
  assert.ok(roamMaxHeight <= 14.5, 'Độ cao roaming tối đa không vượt quá 14.5');
  assert.equal(
    Math.round(roamMaxHeight * 1000) / 1000,
    Math.round((24.0 * (5.0 / 8.5)) * 1000) / 1000,
    'Độ cao roaming khi bán kính cực đại phải tính theo 24.0 * (5.0 / 8.5)'
  );

  // Chế độ Ngồi bàn (isRoaming = false)
  const seatedDefaultHeight = CampfireScene.computeProportionalHeight(11.5, false);
  assert.equal(Math.round(seatedDefaultHeight * 10) / 10, 7.0, 'Độ cao mặc định seated cho radius 11.5 phải là 7.0');

  // Khi radius nhỏ (radius = 1.0 -> clamped 3.8): 3.8 * (7.0 / 11.5) = 2.313 < 2.6 -> clamp về đúng 2.6
  const seatedMinHeight = CampfireScene.computeProportionalHeight(1.0, false);
  assert.equal(seatedMinHeight, 2.6, 'Độ cao seated khi radius nhỏ phải bị chặn ngưỡng dưới 2.6');

  // Khi radius lớn (radius = 100.0 -> clamped 24.0): 24.0 * (7.0 / 11.5) = 14.608 > 14.5 -> clamp về đúng 14.5
  const seatedMaxHeight = CampfireScene.computeProportionalHeight(100.0, false);
  assert.equal(seatedMaxHeight, 14.5, 'Độ cao seated khi radius lớn phải bị chặn ngưỡng trên 14.5');
});

test('Sprint 41 - TASK-4104: Kiểm tra mã nguồn CampfireScene hỗ trợ đầy đủ API zoom và cảm ứng 2 ngón (Pinch-to-Zoom)', () => {
  const sceneSource = readSource('src/components/arena3d/CampfireScene.ts');

  // Phương thức zoomIn, zoomOut, setOnZoomChange
  assert.ok(sceneSource.includes('public zoomIn('), 'CampfireScene phải có public zoomIn');
  assert.ok(sceneSource.includes('public zoomOut('), 'CampfireScene phải có public zoomOut');
  assert.ok(sceneSource.includes('public setOnZoomChange('), 'CampfireScene phải có setOnZoomChange');
  assert.ok(sceneSource.includes('public getZoomPercent('), 'CampfireScene phải có getZoomPercent');
  assert.ok(sceneSource.includes('public resetCamera('), 'CampfireScene phải có resetCamera');

  // Hỗ trợ cảm ứng Pinch-to-Zoom với e.touches.length >= 2
  assert.ok(sceneSource.includes('touches.length >= 2'), 'CampfireScene phải phát hiện thao tác 2 ngón tay');
  assert.ok(sceneSource.includes('Math.hypot(dx, dy)'), 'CampfireScene phải tính khoảng cách 2 ngón bằng Math.hypot');
  assert.ok(sceneSource.includes('wasPinching = true'), 'CampfireScene phải lưu trạng thái wasPinching để phân tách kéo 1 ngón');
  assert.ok(sceneSource.includes('this.zoom('), 'Pinch-to-zoom phải kích hoạt phương thức zoom');
});

test('Sprint 41 - TASK-4105: Kiểm tra phím tắt Thu/Phóng (+/-/=/_/Numpad) trong CampfireScene', () => {
  const sceneSource = readSource('src/components/arena3d/CampfireScene.ts');

  // Phím tắt zoom in: + hoặc = hoặc NumpadAdd
  assert.ok(
    sceneSource.includes("e.key === '+' || e.key === '=' || e.code === 'NumpadAdd'"),
    'Phím tắt thu phóng phải hỗ trợ +, =, NumpadAdd'
  );
  assert.ok(sceneSource.includes('this.zoomIn('), 'Phím +/= phải gọi this.zoomIn');

  // Phím tắt zoom out: - hoặc _ hoặc NumpadSubtract
  assert.ok(
    sceneSource.includes("e.key === '-' || e.key === '_' || e.code === 'NumpadSubtract'"),
    'Phím tắt thu phóng phải hỗ trợ -, _, NumpadSubtract'
  );
  assert.ok(sceneSource.includes('this.zoomOut('), 'Phím -/_ phải gọi this.zoomOut');

  // Chặn cuộn trang khi bấm phím điều khiển
  assert.ok(sceneSource.includes('SCROLL_KEYS'), 'CampfireScene phải định nghĩa SCROLL_KEYS');
  assert.ok(sceneSource.includes('e.preventDefault()'), 'Phải preventDefault để tránh cuộn trang');
});

test('Sprint 41 - TASK-4106: Kiểm tra CampfireArena3DView có đủ nút Zoom, kích thước 44px và KHÔNG bị hide-on-mobile', () => {
  const viewSource = readSource('src/components/arena3d/CampfireArena3DView.tsx');

  // Test-id các nút
  assert.ok(viewSource.includes('data-testid="btn-zoom-in"'), 'CampfireArena3DView phải có data-testid="btn-zoom-in"');
  assert.ok(viewSource.includes('data-testid="btn-zoom-out"'), 'CampfireArena3DView phải có data-testid="btn-zoom-out"');
  assert.ok(viewSource.includes('data-testid="btn-zoom-reset"'), 'CampfireArena3DView phải có data-testid="btn-zoom-reset"');

  // Kích thước chuẩn Mobile Touch Targets 44px
  assert.ok(viewSource.includes("width: '44px'"), 'Nút zoom phải đạt chuẩn chiều rộng 44px');
  assert.ok(viewSource.includes("height: '44px'"), 'Nút zoom phải đạt chuẩn chiều cao 44px');
  assert.ok(viewSource.includes("minWidth: '44px'"), 'Nút zoom reset phải đạt minWidth 44px');

  // Đảm bảo TUYỆT ĐỐI không có class `hide-on-mobile` làm ẩn nút zoom trên điện thoại
  assert.ok(
    !viewSource.includes('hide-on-mobile'),
    'CampfireArena3DView KHÔNG được chứa class hide-on-mobile'
  );
  assert.ok(
    viewSource.includes('className="floating-zoom-controls"'),
    'Cụm điều khiển zoom phải có class floating-zoom-controls'
  );
});

test('Sprint 41 - TASK-4107: Kiểm tra cơ chế nhấn giữ liên tục (Press & Hold) trong CampfireArena3DView', () => {
  const viewSource = readSource('src/components/arena3d/CampfireArena3DView.tsx');

  // Hàm startZoomHold & stopZoomHold
  assert.ok(viewSource.includes('startZoomHold'), 'CampfireArena3DView phải có startZoomHold');
  assert.ok(viewSource.includes('stopZoomHold'), 'CampfireArena3DView phải có stopZoomHold');
  assert.ok(viewSource.includes('triggerZoomStep'), 'CampfireArena3DView phải có triggerZoomStep');

  // Các sự kiện pointer
  assert.ok(viewSource.includes('onPointerDown='), 'Nút zoom phải gắn onPointerDown để bắt đầu nhấn giữ');
  assert.ok(viewSource.includes('onPointerUp='), 'Nút zoom phải gắn onPointerUp để dừng nhấn giữ');
  assert.ok(viewSource.includes('onPointerLeave='), 'Nút zoom phải gắn onPointerLeave để dừng nhấn giữ khi rời chuột');
  assert.ok(viewSource.includes('onPointerCancel='), 'Nút zoom phải gắn onPointerCancel để dừng nhấn giữ');

  // Delay trước khi lặp và tần suất lặp
  assert.ok(viewSource.includes('220'), 'Delay trước khi kích hoạt hold phải là ~220ms');
  assert.ok(viewSource.includes('90'), 'Interval bước zoom khi nhấn giữ phải là ~90ms');
});

test('Sprint 41 - TASK-4108: Nhận diện Logo thân thiện trong favicon.svg (Không còn mắt đỏ, có mắt hổ phách, khăn quàng, trăng khuyết)', () => {
  const faviconSvg = readSource('public/favicon.svg');

  // Tuyệt đối không còn mã màu mắt đỏ đáng sợ #ef4444
  assert.ok(
    !faviconSvg.toLowerCase().includes('#ef4444'),
    'public/favicon.svg tuyệt đối không được có mã màu mắt đỏ #ef4444'
  );

  // Mắt hổ phách ấm áp (amberEye)
  assert.ok(faviconSvg.includes('id="amberEye"'), 'public/favicon.svg phải có gradient amberEye');
  assert.ok(faviconSvg.includes('url(#amberEye)'), 'Mắt sói phải dùng gradient amberEye');

  // Khăn quàng cổ hướng đạo sinh / trăng lưỡi liềm
  assert.ok(faviconSvg.includes('id="scarfGrad"'), 'public/favicon.svg phải có gradient scarfGrad');
  assert.ok(faviconSvg.includes('url(#scarfGrad)'), 'Khăn quàng cổ sói phải dùng gradient scarfGrad');
  assert.ok(faviconSvg.includes('id="moonGlow"'), 'public/favicon.svg phải có ánh trăng moonGlow');

  // Đốm sáng phản chiếu mắt (catchlights) và má hồng phúng phính
  assert.ok(faviconSvg.includes('Catchlights'), 'Phải có đốm sáng catchlights long lanh trong mắt');
  assert.ok(faviconSvg.includes('#f472b6'), 'Phải có màu má hồng phúng phính #f472b6');
});

test('Sprint 41 - TASK-4109: Kiểm tra AccountGate, Header, OnlineLobby hiển thị BRAND_ASSETS.appIcon thân thiện', () => {
  const accountGateSource = readSource('src/components/AccountGate.tsx');
  const headerSource = readSource('src/components/Header.tsx');
  const lobbySource = readSource('src/components/OnlineLobby.tsx');

  // AccountGate
  assert.ok(
    accountGateSource.includes('BRAND_ASSETS.appIcon'),
    'AccountGate.tsx phải sử dụng BRAND_ASSETS.appIcon'
  );

  // Header
  assert.ok(
    headerSource.includes('BRAND_ASSETS.appIcon'),
    'Header.tsx phải sử dụng BRAND_ASSETS.appIcon'
  );

  // OnlineLobby
  assert.ok(
    lobbySource.includes('BRAND_ASSETS.appIcon'),
    'OnlineLobby.tsx phải sử dụng BRAND_ASSETS.appIcon'
  );
  assert.ok(
    lobbySource.includes('BRAND_ASSETS.heroBanner'),
    'OnlineLobby.tsx phải sử dụng BRAND_ASSETS.heroBanner'
  );
});
