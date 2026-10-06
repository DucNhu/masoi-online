import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9226;
const PREVIEW_PORT = 4174;
const TEST_PROFILE = '/tmp/chrome-mobile-test-profile-' + Date.now();
const SCREENSHOT_DIR = path.resolve('scratch/chrome-screenshots/mobile');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

console.log('📱 Khởi động kiểm thử Mobile (iPhone 16 Pro Viewport) trên Chrome...');

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

async function runMobileTest() {
  let chromeProc = null;
  try {
    await waitForServer(`http://127.0.0.1:${PREVIEW_PORT}/masoi-online/`);

    chromeProc = spawn(CHROME_PATH, [
      '--headless=new',
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${TEST_PROFILE}`,
      '--window-size=393,852',
      '--no-first-run',
      '--no-default-browser-check',
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

    // Emulate iPhone 16 Pro (393 x 852, DPR 3.0, Mobile touch)
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 393,
      height: 852,
      deviceScaleFactor: 3,
      mobile: true,
      fitWindow: false,
    });
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true });

    const PREVIEW_URL = `http://localhost:${PREVIEW_PORT}/masoi-online/`;
    await cdp.send('Page.navigate', { url: PREVIEW_URL });
    await new Promise(r => setTimeout(r, 2000));

    // Ảnh 1: Mobile Homepage
    const shot1 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOT_DIR, '01_mobile_home.png'), Buffer.from(shot1.data, 'base64'));

    // Chuyển sang Online
    await cdp.send('Runtime.evaluate', {
      expression: `document.querySelector('button[title*="Online"]')?.click();`
    });
    await new Promise(r => setTimeout(r, 1500));

    // Ảnh 2: Mobile Online Lobby
    const shot2 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOT_DIR, '02_mobile_online_lobby.png'), Buffer.from(shot2.data, 'base64'));

    // Bấm Luyện Solo AI
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Luyện Solo'));
        if (btn) btn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 1000));

    // Ảnh 3: Mobile Solo Modal
    const shot3 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOT_DIR, '03_mobile_solo_modal.png'), Buffer.from(shot3.data, 'base64'));

    // Vào trận
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('VÀO TRẬN'));
        if (btn) btn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 2500));

    // Ảnh 4: Mobile Game Arena
    const shot4 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOT_DIR, '04_mobile_game_arena.png'), Buffer.from(shot4.data, 'base64'));

    console.log('✅ Hoàn thành test mobile trên Chrome!');
    cdp.close();
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

runMobileTest();
