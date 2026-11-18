import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9245;
const PROFILE = '/tmp/chrome-ad-capture-' + Date.now();
const OUTPUT_DIR = '/Users/duc/.gemini/antigravity/brain/b8892a53-ea9e-4c10-a0d2-1ab7f61a754b';
const HTML_PATH = 'file://' + path.resolve('public/ad-video-creator.html');

async function main() {
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${PROFILE}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1200,900'
  ], { stdio: 'ignore' });

  try {
    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
        if (res.ok) {
          const data = await res.json();
          wsUrl = data.webSocketDebuggerUrl;
          break;
        }
      } catch {}
      await new Promise(r => setTimeout(r, 200));
    }

    if (!wsUrl) throw new Error('Cannot connect to Chrome DevTools');

    const ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    function send(method, params = {}) {
      return new Promise((resolve) => {
        const id = msgId++;
        const handler = (event) => {
          const data = JSON.parse(event.data);
          if (data.id === id) {
            ws.removeEventListener('message', handler);
            resolve(data.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    const { targetId } = await send('Target.createTarget', { url: HTML_PATH });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });

    function sendSession(method, params = {}) {
      return new Promise((resolve) => {
        const id = msgId++;
        const handler = (event) => {
          const data = JSON.parse(event.data);
          if (data.id === id) {
            ws.removeEventListener('message', handler);
            resolve(data.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, sessionId, method, params }));
      });
    }

    await sendSession('Page.enable');
    await sendSession('Runtime.enable');
    await new Promise(r => setTimeout(r, 1500));

    // Capture Scene 1
    await sendSession('Runtime.evaluate', { expression: 'renderScene(1.5)' });
    await new Promise(r => setTimeout(r, 300));
    let snap = await sendSession('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'scene1_hook.png'), Buffer.from(snap.data, 'base64'));

    // Capture Scene 2 (Night)
    await sendSession('Runtime.evaluate', { expression: 'renderScene(6.0)' });
    await new Promise(r => setTimeout(r, 300));
    snap = await sendSession('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'scene2_night.png'), Buffer.from(snap.data, 'base64'));

    // Capture Scene 3 (Hunter Reveal)
    await sendSession('Runtime.evaluate', { expression: 'renderScene(12.0)' });
    await new Promise(r => setTimeout(r, 300));
    snap = await sendSession('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'scene3_reveal.png'), Buffer.from(snap.data, 'base64'));

    // Capture Scene 4 (CTA)
    await sendSession('Runtime.evaluate', { expression: 'renderScene(18.0)' });
    await new Promise(r => setTimeout(r, 300));
    snap = await sendSession('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'scene4_cta.png'), Buffer.from(snap.data, 'base64'));

    console.log('SUCCESS_CAPTURED_4_SCENES');
    ws.close();
  } finally {
    chrome.kill('SIGTERM');
    try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch {}
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
