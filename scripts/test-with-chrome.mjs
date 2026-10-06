import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9222;
const TEST_PROFILE = '/tmp/chrome-masoi-test-profile-' + Date.now();
const SCREENSHOT_DIR = path.resolve('scratch/chrome-screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

console.log('🚀 Đang khởi động Google Chrome Headless với CDP port', PORT, '...');

const chromeProc = spawn(CHROME_PATH, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${TEST_PROFILE}`,
  '--window-size=1280,900',
  '--no-first-run',
  '--no-default-browser-check',
  'about:blank'
], { stdio: 'ignore' });

// Hàm đợi cổng mở
async function waitForPort(maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch {}
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error('Không thể kết nối đến Chrome sau timeout');
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
    this.eventListeners = new Map();
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
        } else if (data.method && this.eventListeners.has(data.method)) {
          for (const cb of this.eventListeners.get(data.method)) {
            cb(data.params);
          }
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

  on(event, cb) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(cb);
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function runTest() {
  try {
    const versionData = await waitForPort();
    console.log('✅ Chrome đã sẵn sàng! Phiên bản:', versionData.Browser);

    const pagesRes = await fetch(`http://127.0.0.1:${PORT}/json/list`);
    const pages = await pagesRes.json();
    const targetPage = pages.find(p => p.type === 'page') || pages[0];

    const cdp = new CDPClient(targetPage.webSocketDebuggerUrl);
    await cdp.connect();
    console.log('✅ Đã kết nối CDP WebSocket thành công!');

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    const consoleLogs = [];
    cdp.on('Runtime.consoleAPICalled', (params) => {
      const text = params.args.map(a => a.value || a.description || '').join(' ');
      consoleLogs.push(`[Console ${params.type}] ${text}`);
      console.log(` 💬 [Chrome Console] ${params.type}:`, text);
    });

    cdp.on('Runtime.exceptionThrown', (params) => {
      console.error(' ❌ [Chrome Exception]:', params.exceptionDetails.text, params.exceptionDetails.exception?.description);
    });

    // 1. Mở trang live GitHub Pages
    const TARGET_URL = 'https://ducnhu.github.io/masoi-online/';
    console.log(`\n🌐 Đang điều hướng Chrome đến: ${TARGET_URL} ...`);
    await cdp.send('Page.navigate', { url: TARGET_URL });

    // Đợi 3 giây để React hydrate & load tài nguyên
    await new Promise(r => setTimeout(r, 3000));

    // Lấy thông tin tiêu đề và kiểm tra render
    const pageTitle = await cdp.send('Runtime.evaluate', {
      expression: 'document.title'
    });
    console.log('📄 Tiêu đề trang nhận được:', pageTitle.result.value);

    // Chụp ảnh màn hình 1: Trang chủ Quản Trò Offline
    const shot1 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const shot1Path = path.join(SCREENSHOT_DIR, '01_homepage_offline.png');
    fs.writeFileSync(shot1Path, Buffer.from(shot1.data, 'base64'));
    console.log('📸 Đã lưu ảnh 1:', shot1Path);

    // 2. Click nút chuyển sang chế độ Online (Nút Quả Địa Cầu trên Header)
    console.log('\n🔄 Đang thực hiện chuyển sang chế độ ONLINE qua nút bấm Quả Địa Cầu...');
    const clickGlobeResult = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('button[title*="Online"]');
        if (btn) {
          btn.click();
          return { success: true, text: btn.title };
        }
        return { success: false };
      })()`,
      returnByValue: true
    });
    console.log('👉 Kết quả bấm chuyển chế độ:', clickGlobeResult.result.value);

    // Đợi 2 giây để sảnh Online render
    await new Promise(r => setTimeout(r, 2000));

    // Chụp ảnh màn hình 2: Sảnh Online (Online Lobby)
    const shot2 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const shot2Path = path.join(SCREENSHOT_DIR, '02_online_lobby.png');
    fs.writeFileSync(shot2Path, Buffer.from(shot2.data, 'base64'));
    console.log('📸 Đã lưu ảnh 2 (Sảnh Online):', shot2Path);

    // 3. Kiểm tra các thành phần trong Sảnh Online
    const lobbyElements = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean);
        const headers = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.innerText.trim()).filter(Boolean);
        const hasCreateRoom = buttons.some(t => t.includes('Tạo Bàn') || t.includes('Tạo Phòng'));
        const hasJoinRoom = buttons.some(t => t.includes('Vào Bàn') || t.includes('Tham Gia'));
        const hasPractice = buttons.some(t => t.includes('Tập Luyện') || t.includes('Solo'));
        return {
          headers,
          buttonCount: buttons.length,
          sampleButtons: buttons.slice(0, 8),
          hasCreateRoom,
          hasJoinRoom,
          hasPractice
        };
      })()`,
      returnByValue: true
    });
    console.log('🔍 Thành phần Sảnh Online phát hiện:', JSON.stringify(lobbyElements.result.value, null, 2));

    // 4. Thử tương tác: Bấm nút "Tập Luyện Với Bots AI" để kiểm tra tính năng Solo Practice ngay trên web
    console.log('\n🤖 Đang thử nghiệm tương tác: Mở modal Tập Luyện Với Bots AI...');
    const clickPracticeResult = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Tập Luyện') || b.innerText.includes('Solo'));
        if (btn) {
          btn.click();
          return { clicked: true, text: btn.innerText.trim() };
        }
        return { clicked: false };
      })()`,
      returnByValue: true
    });
    console.log('👉 Kết quả bấm nút Tập Luyện:', clickPracticeResult.result.value);

    await new Promise(r => setTimeout(r, 1500));

    // Chụp ảnh màn hình 3: Modal Tập luyện hoặc Tạo bàn
    const shot3 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const shot3Path = path.join(SCREENSHOT_DIR, '03_interactive_test.png');
    fs.writeFileSync(shot3Path, Buffer.from(shot3.data, 'base64'));
    console.log('📸 Đã lưu ảnh 3 (Tương tác modal):', shot3Path);

    cdp.close();
    console.log('\n🎉 Hoàn thành kiểm thử tự động trên Chrome thành công rực rỡ!');
  } catch (err) {
    console.error('❌ Lỗi kiểm thử:', err);
  } finally {
    try {
      chromeProc.kill('SIGTERM');
      fs.rmSync(TEST_PROFILE, { recursive: true, force: true });
    } catch {}
  }
}

runTest();
