import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9230;
const PREVIEW_PORT = 4178;
const TEST_PROFILE = '/tmp/chrome-3d-night-' + Date.now();
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

async function captureNight() {
  let chromeProc = null;
  try {
    await waitForServer(`http://127.0.0.1:${PREVIEW_PORT}/ma-soi-offline/`);
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

    const pagesRes = await fetch(`http://127.0.0.1:${PORT}/json/list`);
    const pages = await pagesRes.json();
    const targetPage = pages.find(p => p.type === 'page') || pages[0];

    const cdp = new CDPClient(targetPage.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    await cdp.send('Page.navigate', { url: `http://localhost:${PREVIEW_PORT}/ma-soi-offline/` });
    await new Promise(r => setTimeout(r, 2000));

    // Chuyển sang Tab Người Chơi (Bàn tròn 10 ghế)
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const navButtons = Array.from(document.querySelectorAll('.nav-item, button'));
        const playerTab = navButtons.find(b => b.innerText.includes('Người Chơi'));
        if (playerTab) playerTab.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 1500));

    // Bấm nút chuyển sang Ban Đêm (Moon icon)
    console.log('🌙 Bấm chuyển sang Ban Đêm...');
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const nightBtn = document.querySelector('button[title*="Ban Đêm"]');
        if (nightBtn) nightBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 2000)); // Đợi hiệu ứng chuyển đêm

    const shotNight = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const shotNightPath = path.join(SCREENSHOT_DIR, '10_3d_campfire_arena_night.png');
    fs.writeFileSync(shotNightPath, Buffer.from(shotNight.data, 'base64'));
    console.log('📸 Đã lưu ảnh Bàn tròn 3D Ban Đêm:', shotNightPath);

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

captureNight();
