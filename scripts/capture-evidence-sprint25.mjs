import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9229;
const PREVIEW_PORT = 4177;
const TEST_PROFILE = '/tmp/chrome-3d-evidence-' + Date.now();
const SCREENSHOT_DIR = path.resolve('scratch/chrome-screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

console.log('🚀 1. Khởi động Vite Preview Server trên cổng', PREVIEW_PORT, '...');
const previewProc = spawn('npx', ['vite', 'preview', '--port', String(PREVIEW_PORT), '--host'], {
  stdio: 'ignore'
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

async function captureEvidence() {
  let chromeProc = null;
  try {
    await waitForServer(`http://127.0.0.1:${PREVIEW_PORT}/ma-soi-offline/`);
    console.log('✅ Vite Preview Server đã sẵn sàng!');

    console.log('🚀 2. Khởi động Chrome với CDP port', PORT, '...');
    chromeProc = spawn(CHROME_PATH, [
      '--headless=new',
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${TEST_PROFILE}`,
      '--window-size=1280,950',
      '--no-first-run',
      '--no-default-browser-check',
      '--enable-webgl',
      'about:blank'
    ], { stdio: 'ignore' });

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

    const PREVIEW_URL = `http://localhost:${PREVIEW_PORT}/ma-soi-offline/`;
    console.log(`🌐 3. Điều hướng Chrome đến: ${PREVIEW_URL}`);
    await cdp.send('Page.navigate', { url: PREVIEW_URL });
    await new Promise(r => setTimeout(r, 2000));

    // Shot 1: Mở Phòng Thay Đồ 3D (Wardrobe)
    console.log('✨ 4. Mở modal Phòng Thay Đồ 3D...');
    await cdp.send('Runtime.evaluate', {
      expression: `document.querySelector('button[title*="Phòng Thay Đồ"]')?.click();`
    });
    await new Promise(r => setTimeout(r, 2000));

    // Bấm tab Mũ & Nón, chọn Vương Miện hoặc Nón Lá
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const tabs = Array.from(document.querySelectorAll('button'));
        const hatTab = tabs.find(b => b.innerText.includes('Mũ & Nón'));
        if (hatTab) hatTab.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    // Bấm chọn Vương Miện
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const options = Array.from(document.querySelectorAll('div, button'));
        const crown = options.find(el => el.innerText?.includes('Vương Miện Vàng'));
        if (crown) crown.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    // Bấm Tru Trăng
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const howlBtn = buttons.find(b => b.innerText.trim() === 'Tru Trăng');
        if (howlBtn) howlBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 1000));

    const shotWardrobe = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const shotWardrobePath = path.join(SCREENSHOT_DIR, '07_3d_wardrobe_modal.png');
    fs.writeFileSync(shotWardrobePath, Buffer.from(shotWardrobe.data, 'base64'));
    console.log('📸 Đã lưu ảnh Phòng Thay Đồ 3D (Vương Miện + Tru Trăng):', shotWardrobePath);

    // Bấm Lưu Trang Phục 3D để đóng Modal
    console.log('💾 5. Bấm Lưu Trang Phục 3D...');
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const saveBtn = buttons.find(b => b.innerText.includes('Lưu Trang Phục 3D') || b.innerText.includes('Hủy Bỏ'));
        if (saveBtn) saveBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 1200));

    // Shot 2: Chuyển sang Tab Người Chơi (Bàn tròn 10 ghế 3D)
    console.log('🔥 6. Chuyển sang tab Người Chơi (3D Campfire Arena)...');
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const navButtons = Array.from(document.querySelectorAll('.nav-item, button'));
        const playerTab = navButtons.find(b => b.innerText.includes('Người Chơi'));
        if (playerTab) playerTab.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 2500)); // Đợi Three.js render 10 ghế lửa trại

    const shotArena = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const shotArenaPath = path.join(SCREENSHOT_DIR, '09_3d_campfire_arena_day.png');
    fs.writeFileSync(shotArenaPath, Buffer.from(shotArena.data, 'base64'));
    console.log('📸 Đã lưu ảnh Bàn tròn 3D Campfire:', shotArenaPath);

    cdp.close();
    console.log('🎉 Hoàn thành chụp ảnh bằng chứng Sprint 25!');
  } catch (err) {
    console.error('❌ Lỗi:', err);
  } finally {
    if (chromeProc) {
      try {
        chromeProc.kill('SIGTERM');
        setTimeout(() => {
          try { fs.rmSync(TEST_PROFILE, { recursive: true, force: true }); } catch {}
        }, 500);
      } catch {}
    }
    if (previewProc) {
      try { previewProc.kill('SIGTERM'); } catch {}
    }
  }
}

captureEvidence();
