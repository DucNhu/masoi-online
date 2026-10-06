import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9225;
const PREVIEW_PORT = 4173;
const TEST_PROFILE = '/tmp/chrome-preview-test-profile-' + Date.now();
const SCREENSHOT_DIR = path.resolve('scratch/chrome-screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

console.log('🚀 1. Khởi động Vite Preview Server trên cổng', PREVIEW_PORT, '...');
const previewProc = spawn('npx', ['vite', 'preview', '--port', String(PREVIEW_PORT), '--host'], {
  stdio: 'ignore',
  env: { ...process.env, BASE_PATH: '/masoi-online/' }
});

async function waitForServer(url, maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error('Timeout đợi server tại ' + url);
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (e) => reject(e);
      this.ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.id && this.callbacks.has(data.id)) {
          const { res, rej } = this.callbacks.get(data.id);
          this.callbacks.delete(data.id);
          if (data.error) rej(data.error);
          else res(data.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((res, rej) => {
      const msgId = this.id++;
      this.callbacks.set(msgId, { res, rej });
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function runLocalPreviewTest() {
  let chromeProc = null;
  try {
    await waitForServer(`http://127.0.0.1:${PREVIEW_PORT}/masoi-online/`);
    console.log('✅ Vite Preview Server đã sẵn sàng!');

    console.log('🚀 2. Khởi động Chrome Headless với CDP port', PORT, '...');
    chromeProc = spawn(CHROME_PATH, [
      '--headless=new',
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${TEST_PROFILE}`,
      '--window-size=1280,900',
      '--no-first-run',
      '--no-default-browser-check',
      'about:blank'
    ], { stdio: 'ignore' });

    // Đợi Chrome mở port
    let versionData = null;
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
        if (res.ok) {
          versionData = await res.json();
          break;
        }
      } catch {}
      await new Promise(r => setTimeout(r, 200));
    }

    if (!versionData) throw new Error('Không thể kết nối Chrome CDP');
    console.log('✅ Chrome CDP kết nối thành công:', versionData.Browser);

    const pagesRes = await fetch(`http://127.0.0.1:${PORT}/json/list`);
    const pages = await pagesRes.json();
    const targetPage = pages.find(p => p.type === 'page') || pages[0];

    const cdp = new CDPClient(targetPage.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    // 3. Mở URL Local Preview
    const PREVIEW_URL = `http://localhost:${PREVIEW_PORT}/masoi-online/`;
    console.log(`🌐 3. Điều hướng Chrome đến: ${PREVIEW_URL}`);
    await cdp.send('Page.navigate', { url: PREVIEW_URL });
    await new Promise(r => setTimeout(r, 2000));

    // 4. Bấm nút Quả Địa Cầu chuyển sang Online Mode
    console.log('🔄 4. Bấm chuyển sang Online Mode...');
    await cdp.send('Runtime.evaluate', {
      expression: `document.querySelector('button[title*="Online"]')?.click();`
    });
    await new Promise(r => setTimeout(r, 1500));

    // 5. Bấm nút "Luyện Solo (AI)"
    console.log('🤖 5. Bấm nút "Luyện Solo (AI)"...');
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Luyện Solo'));
        if (btn) btn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 1000));

    // 6. Bấm "VÀO TRẬN TẬP LUYỆN NGAY"
    console.log('🎮 6. Bấm "VÀO TRẬN TẬP LUYỆN NGAY"...');
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('VÀO TRẬN'));
        if (btn) btn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 2500));

    // 7. Chụp ảnh màn hình Đấu Trường Trận Đấu Online (Game Arena)
    const shot5 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const shot5Path = path.join(SCREENSHOT_DIR, '05_local_preview_game_arena.png');
    fs.writeFileSync(shot5Path, Buffer.from(shot5.data, 'base64'));
    console.log('📸 Đã lưu ảnh 5 (Đấu trường ván đấu mới nhất):', shot5Path);

    // 8. Bấm mở thẻ bài Tarot bí mật trong trận đấu
    console.log('🃏 8. Bấm nút thẻ bài Tarot để mở Modal lật bài bí mật...');
    const clickCardResult = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        // Tìm button chứa thẻ bài hoặc icon bài
        const cardBtn = document.querySelector('button[title*="lá bài"], button[title*="vai trò"], [class*="card-badge"], [class*="tarot"]');
        if (cardBtn) {
          cardBtn.click();
          return { found: true };
        }
        // Thử click vào thumbnail thẻ bài ở góc
        const allButtons = Array.from(document.querySelectorAll('button'));
        const found = allButtons.find(b => b.innerHTML.includes('webp') || b.innerHTML.includes('img') || b.innerText.includes('Bài'));
        if (found) {
          found.click();
          return { found: true, text: found.innerText };
        }
        return { found: false };
      })()`,
      returnByValue: true
    });
    console.log('👉 Kết quả bấm xem bài Tarot:', clickCardResult.result.value);
    await new Promise(r => setTimeout(r, 1500));

    // 9. Chụp ảnh màn hình Thẻ bài Tarot & Privacy Shield
    const shot6 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const shot6Path = path.join(SCREENSHOT_DIR, '06_secret_tarot_card_modal.png');
    fs.writeFileSync(shot6Path, Buffer.from(shot6.data, 'base64'));
    console.log('📸 Đã lưu ảnh 6 (Modal thẻ bài Tarot):', shot6Path);

    cdp.close();
    console.log('🎉 Toàn bộ quy trình kiểm thử hoàn tất xuất sắc!');
  } catch (err) {
    console.error('❌ Lỗi:', err);
  } finally {
    if (chromeProc) {
      try {
        chromeProc.kill('SIGTERM');
        fs.rmSync(TEST_PROFILE, { recursive: true, force: true });
      } catch {}
    }
    if (previewProc) {
      try { previewProc.kill('SIGTERM'); } catch {}
    }
  }
}

runLocalPreviewTest();
