import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GLOBAL_LANGUAGES,
  getStoreAppMetadata,
  STORE_METADATA_MAP,
} from '../src/utils/i18nCatalog.ts';
import capacitorConfig, { STORE_DISPLAY_NAMES } from '../capacitor.config.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function readSource(relativePath) {
  const fullPath = path.join(projectRoot, relativePath);
  return fs.readFileSync(fullPath, 'utf8');
}

test('Sprint 43 - TASK-4301: GLOBAL_LANGUAGES vượt chuẩn 128+ quốc gia và phủ đủ 5 vùng địa lý', () => {
  assert.ok(
    GLOBAL_LANGUAGES.length >= 128,
    `Danh mục ngôn ngữ phải có ít nhất 128 quốc gia (hiện tại: ${GLOBAL_LANGUAGES.length})`
  );

  const regions = new Set(GLOBAL_LANGUAGES.map((item) => item.region));
  const expectedRegions = ['ASIA', 'EUROPE', 'AMERICAS', 'MEA', 'OCEANIA'];

  for (const reg of expectedRegions) {
    assert.ok(regions.has(reg), `Vùng địa lý ${reg} phải có trong danh mục GLOBAL_LANGUAGES`);
    const countInRegion = GLOBAL_LANGUAGES.filter((item) => item.region === reg).length;
    assert.ok(countInRegion > 0, `Vùng ${reg} phải có ít nhất 1 quốc gia (có ${countInRegion})`);
  }

  // Kiểm tra cấu trúc từng entry
  const sample = GLOBAL_LANGUAGES[0];
  assert.equal(sample.code, 'vi-VN');
  assert.equal(sample.uiLang, 'vi');
  assert.ok(sample.flag.length > 0);
  assert.ok(sample.greeting.length > 0);
});

test('Sprint 43 - TASK-4302: getStoreAppMetadata hỗ trợ đầy đủ 10+ ngôn ngữ trọng điểm quốc tế', () => {
  // 1. Kiểm tra Việt Nam (vi-VN)
  const metaVi = getStoreAppMetadata('vi-VN');
  assert.equal(metaVi.locale, 'vi-VN');
  assert.equal(metaVi.appName, 'Ma Sói Online');
  assert.ok(metaVi.subtitle.includes('Voice Chat'));
  assert.ok(metaVi.promoText.includes('Đêm Đồng Thời'));
  assert.ok(metaVi.description.includes('Đấu Trường Lửa Trại 3D'));
  assert.ok(metaVi.keywords.includes('ma soi online'));

  // 2. Kiểm tra English Quốc tế (en-US)
  const metaEn = getStoreAppMetadata('en-US');
  assert.equal(metaEn.locale, 'en-US');
  assert.equal(metaEn.appName, 'Werewolf Online: 3D Campfire');
  assert.ok(metaEn.subtitle.includes('Simultaneous Night'));
  assert.ok(metaEn.keywords.includes('werewolf online'));

  // 3. Kiểm tra Nhật Bản (ja-JP)
  const metaJa = getStoreAppMetadata('ja-JP');
  assert.equal(metaJa.locale, 'ja-JP');
  assert.ok(metaJa.appName.includes('人狼オンライン'));
  assert.ok(metaJa.keywords.includes('人狼'));

  // 4. Kiểm tra Hàn Quốc (ko-KR)
  const metaKo = getStoreAppMetadata('ko-KR');
  assert.equal(metaKo.locale, 'ko-KR');
  assert.ok(metaKo.appName.includes('웨어울프 온라인'));
  assert.ok(metaKo.keywords.includes('마피아'));

  // 5. Kiểm tra Trung Quốc (zh-CN)
  const metaZh = getStoreAppMetadata('zh-CN');
  assert.equal(metaZh.locale, 'zh-CN');
  assert.ok(metaZh.appName.includes('狼人杀3D'));
  assert.ok(metaZh.keywords.includes('狼人杀'));

  // 6. Kiểm tra Tây Ban Nha / LATAM (es-ES)
  const metaEs = getStoreAppMetadata('es-ES');
  assert.equal(metaEs.locale, 'es-ES');
  assert.ok(metaEs.appName.includes('Hombre Lobo 3D'));

  // 7. Kiểm tra Pháp (fr-FR)
  const metaFr = getStoreAppMetadata('fr-FR');
  assert.equal(metaFr.locale, 'fr-FR');
  assert.ok(metaFr.appName.includes('Loups-Garous 3D'));

  // 8. Kiểm tra Đức (de-DE)
  const metaDe = getStoreAppMetadata('de-DE');
  assert.equal(metaDe.locale, 'de-DE');
  assert.ok(metaDe.appName.includes('Werwölfe 3D'));

  // 9. Kiểm tra Bồ Đào Nha / Brazil (pt-BR)
  const metaPt = getStoreAppMetadata('pt-BR');
  assert.equal(metaPt.locale, 'pt-BR');
  assert.ok(metaPt.appName.includes('Lobisomem 3D'));

  // 10. Kiểm tra Thái Lan (th-TH)
  const metaTh = getStoreAppMetadata('th-TH');
  assert.equal(metaTh.locale, 'th-TH');
  assert.ok(metaTh.appName.includes('มนุษย์หมาป่า 3D'));

  // 11. Kiểm tra Indonesia (id-ID)
  const metaId = getStoreAppMetadata('id-ID');
  assert.equal(metaId.locale, 'id-ID');
  assert.ok(metaId.appName.includes('Werewolf 3D'));
});

test('Sprint 43 - TASK-4303: getStoreAppMetadata xử lý fallback tiền tố và mặc định chuẩn xác', () => {
  // Khớp tiền tố ngôn ngữ (prefix match)
  const metaFrCA = getStoreAppMetadata('fr-CA');
  assert.equal(metaFrCA.locale, 'fr-FR', 'fr-CA phải fallback về mẫu tiếng Pháp fr-FR');

  const metaEsMX = getStoreAppMetadata('es-MX');
  assert.equal(metaEsMX.locale, 'es-ES', 'es-MX phải fallback về mẫu tiếng Tây Ban Nha es-ES');

  // Mã không tồn tại phải fallback về en-US (International)
  const metaUnknown = getStoreAppMetadata('zz-ZZ');
  assert.equal(metaUnknown.locale, 'en-US', 'Locale không xác định phải fallback về en-US');

  // Rỗng phải fallback về vi-VN khi không có localStorage
  const metaDefault = getStoreAppMetadata();
  assert.ok(metaDefault.locale === 'vi-VN' || metaDefault.locale === 'en-US');
});

test('Sprint 43 - TASK-4304: index.html chứa thẻ og:locale và các og:locale:alternate quốc tế', () => {
  const htmlContent = readSource('index.html');

  assert.ok(
    htmlContent.includes('<meta property="og:locale" content="vi_VN" />'),
    'index.html phải chứa thẻ og:locale vi_VN'
  );

  const alternateLocales = ['en_US', 'ja_JP', 'ko_KR', 'zh_CN', 'fr_FR', 'es_ES', 'de_DE'];
  for (const alt of alternateLocales) {
    assert.ok(
      htmlContent.includes(`<meta property="og:locale:alternate" content="${alt}" />`),
      `index.html phải chứa thẻ alternate ${alt}`
    );
  }

  // Kiểm tra mô tả song ngữ
  assert.ok(
    htmlContent.includes('Werewolf 3D Online: Campfire Metaverse'),
    'index.html phải chứa phần mô tả quốc tế bằng tiếng Anh'
  );
});

test('Sprint 43 - TASK-4305: capacitor.config.ts bảo toàn appId com.masoi.online và có STORE_DISPLAY_NAMES', () => {
  assert.equal(capacitorConfig.appId, 'com.masoi.online', 'appId phải là com.masoi.online');
  assert.equal(capacitorConfig.webDir, 'dist', 'webDir phải là dist');
  assert.equal(capacitorConfig.appName, 'Ma Sói Online', 'appName phải là Ma Sói Online');

  assert.ok(STORE_DISPLAY_NAMES, 'STORE_DISPLAY_NAMES phải được export');
  assert.equal(STORE_DISPLAY_NAMES.vi.appName, 'Ma Sói Online');
  assert.equal(STORE_DISPLAY_NAMES.default.appName, 'Werewolf Online: 3D Campfire');
  assert.equal(STORE_DISPLAY_NAMES.en.appName, 'Werewolf Online: 3D Campfire');
  assert.ok(STORE_DISPLAY_NAMES.ja.appName.includes('人狼'));
  assert.ok(STORE_DISPLAY_NAMES.ko.appName.includes('웨어울프'));
  assert.ok(STORE_DISPLAY_NAMES.zh.appName.includes('狼人杀'));
});

test('Sprint 43 - TASK-4306: Key art OpenGraph public/og-image.jpg và png được cập nhật sắc nét (>500KB)', () => {
  const jpgPath = path.join(projectRoot, 'public', 'og-image.jpg');
  const pngPath = path.join(projectRoot, 'public', 'og-image.png');

  assert.ok(fs.existsSync(jpgPath), 'public/og-image.jpg phải tồn tại');
  assert.ok(fs.existsSync(pngPath), 'public/og-image.png phải tồn tại');

  const jpgStat = fs.statSync(jpgPath);
  const pngStat = fs.statSync(pngPath);

  assert.ok(
    jpgStat.size > 500 * 1024,
    `public/og-image.jpg phải là ảnh chất lượng cao > 500KB (thực tế: ${Math.round(jpgStat.size / 1024)}KB)`
  );
  assert.ok(
    pngStat.size > 500 * 1024,
    `public/og-image.png phải là ảnh chất lượng cao > 500KB (thực tế: ${Math.round(pngStat.size / 1024)}KB)`
  );
});

test('Sprint 43 - TASK-4307: Tài liệu store-listing-global.md đầy đủ metadata App Store & Google Play', () => {
  const docPath = path.join(projectRoot, 'production', 'store-listing-global.md');
  assert.ok(fs.existsSync(docPath), 'production/store-listing-global.md phải tồn tại');

  const content = fs.readFileSync(docPath, 'utf8');
  assert.ok(content.includes('com.masoi.online'), 'Tài liệu phải chứa Bundle ID com.masoi.online');
  assert.ok(content.includes('NSMicrophoneUsageDescription'), 'Tài liệu phải chứa iOS microphone permission');
  assert.ok(content.includes('android.permission.RECORD_AUDIO'), 'Tài liệu phải chứa Android microphone permission');
  assert.ok(content.includes('npm run mobile:sync'), 'Tài liệu phải hướng dẫn lệnh sync mobile');
  assert.ok(content.includes('npm run mobile:ios'), 'Tài liệu phải hướng dẫn lệnh open ios');
  assert.ok(content.includes('npm run mobile:android'), 'Tài liệu phải hướng dẫn lệnh open android');
  assert.ok(content.includes('12+'), 'Tài liệu phải chứa độ tuổi 12+ App Store');
  assert.ok(content.includes('Teen'), 'Tài liệu phải chứa độ tuổi Teen Google Play');
});
