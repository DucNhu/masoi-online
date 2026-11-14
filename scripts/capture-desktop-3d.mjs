import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9231;
const PREVIEW_PORT = 4179;
const TEST_PROFILE = '/tmp/chrome-desktop-3d-' + Date.now();
const SCREENSHOT_DIR = path.resolve('scratch/chrome-screenshots');

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

async function captureDesktop() {
  let chromeProc = null;
  try {
    await waitForServer(`http://127.0.0.1:${PREVIEW_PORT}/ma-soi-offline/`);
    chromeProc = spawn(CHROME_PATH, [
      '--headless=new',
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${TEST_PROFILE}`,
      '--window-size=1440,900', // Kích thước màn hình PC / Laptop Widescreen
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

    const pagesRes = await fetch(`http://127.0.0.1:${PORT}/json/list`);
    const pages = await pagesRes.json();
    const targetPage = pages.find(p => p.type === 'page') || pages[0];

    const cdp = new CDPClient(targetPage.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    await cdp.send('Page.navigate', { url: `http://localhost:${PREVIEW_PORT}/ma-soi-offline/` });
    await new Promise(r => setTimeout(r, 2000));

    // 1. Mở Phòng Thay Đồ 3D trên Desktop PC (Dual-Pane)
    console.log('✨ 1. Mở modal Phòng Thay Đồ 3D trên Desktop...');
    await cdp.send('Runtime.evaluate', {
      expression: `document.querySelector('button[title*="Phòng Thay Đồ"]')?.click();`
    });
    await new Promise(r => setTimeout(r, 2000));

    const shotWardrobe = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const shotWardrobePath = path.join(SCREENSHOT_DIR, 'desktop_3d_wardrobe_dual_pane.png');
    fs.writeFileSync(shotWardrobePath, Buffer.from(shotWardrobe.data, 'base64'));
    console.log('📸 Đã lưu ảnh Desktop Wardrobe 3D:', shotWardrobePath);

    // Đóng Modal
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const closeBtn = buttons.find(b => b.innerText.includes('Lưu Trang Phục 3D') || b.innerText.includes('Hủy Bỏ'));
        if (closeBtn) closeBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 1000));

    // 2. Chuyển sang Tab Người Chơi (Bàn tròn 3D Widescreen trên Desktop)
    console.log('🔥 2. Chuyển sang Tab Người Chơi (3D Widescreen PC)...');
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const navButtons = Array.from(document.querySelectorAll('.nav-item, button'));
        const playerTab = navButtons.find(b => b.innerText.includes('Người Chơi'));
        if (playerTab) playerTab.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 2500));

    const shotArena = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const shotArenaPath = path.join(SCREENSHOT_DIR, 'desktop_3d_campfire_widescreen.png');
    fs.writeFileSync(shotArenaPath, Buffer.from(shotArena.data, 'base64'));
    console.log('📸 Đã lưu ảnh Desktop 3D Campfire Widescreen:', shotArenaPath);

    cdp.close();
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

captureDesktop();
