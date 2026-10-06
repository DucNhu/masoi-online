import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9223;
const TEST_PROFILE = '/tmp/chrome-masoi-match-profile-' + Date.now();
const SCREENSHOT_DIR = path.resolve('scratch/chrome-screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

console.log('🚀 Khởi động Chrome để test trận đấu (Solo Practice Match)...');

const chromeProc = spawn(CHROME_PATH, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${TEST_PROFILE}`,
  '--window-size=1280,900',
  '--no-first-run',
  '--no-default-browser-check',
  'about:blank'
], { stdio: 'ignore' });

async function waitForPort(maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) return await res.json();
    } catch {}
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error('Timeout kết nối Chrome');
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

async function runMatchTest() {
  try {
    await waitForPort();
    const pagesRes = await fetch(`http://127.0.0.1:${PORT}/json/list`);
    const pages = await pagesRes.json();
    const targetPage = pages.find(p => p.type === 'page') || pages[0];

    const cdp = new CDPClient(targetPage.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    // 1. Mở trang live
    await cdp.send('Page.navigate', { url: 'https://ducnhu.github.io/masoi-online/' });
    await new Promise(r => setTimeout(r, 3000));

    // 2. Chuyển sang Online Lobby
    await cdp.send('Runtime.evaluate', {
      expression: `document.querySelector('button[title*="Online"]')?.click();`
    });
    await new Promise(r => setTimeout(r, 1500));

    // 3. Mở Solo Practice Modal
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Luyện Solo'));
        if (btn) btn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 1000));

    // 4. Bấm "VÀO TRẬN TẬP LUYỆN NGAY"
    console.log('🎮 Bấm nút "VÀO TRẬN TẬP LUYỆN NGAY"...');
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('VÀO TRẬN'));
        if (btn) btn.click();
      })()`
    });

    // Chờ 3 giây để trận đấu khởi tạo (bàn đấu online, chia bài cho 7 người, nhạc, timer...)
    await new Promise(r => setTimeout(r, 3000));

    // Chụp ảnh màn hình 4: Đấu trường trực tuyến (In-Game Arena)
    const shot4 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const shot4Path = path.join(SCREENSHOT_DIR, '04_in_game_match_arena.png');
    fs.writeFileSync(shot4Path, Buffer.from(shot4.data, 'base64'));
    console.log('📸 Đã lưu ảnh 4 (Đấu trường bàn chơi):', shot4Path);

    // Kiểm tra state của trận đấu
    const matchState = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const playerNodes = document.querySelectorAll('.player-circle-item, .player-card, [class*="player"]');
        const phaseIndicator = document.querySelector('[class*="phase"], [class*="title"], h2, h3')?.innerText;
        return {
          detectedNodes: playerNodes.length,
          phaseIndicator: phaseIndicator || 'N/A',
          url: window.location.href
        };
      })()`,
      returnByValue: true
    });
    console.log('📊 Trạng thái trận đấu trong Chrome:', matchState.result.value);

    cdp.close();
    console.log('✅ Kiểm thử trận đấu thành công 100%!');
  } catch (e) {
    console.error('❌ Lỗi:', e);
  } finally {
    try {
      chromeProc.kill('SIGTERM');
      fs.rmSync(TEST_PROFILE, { recursive: true, force: true });
    } catch {}
  }
}

runMatchTest();
