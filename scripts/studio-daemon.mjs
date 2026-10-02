#!/usr/bin/env node

/**
 * Ma Sói Game Studio — Autonomous Day & Night Task Daemon
 * 
 * Vận hành theo mô hình Studio khép kín:
 * 1. Quét Backlog (`production/tasks/studio-terminal-backlog.md`)
 * 2. Kiểm tra tính toàn vẹn hệ thống (Lint, Tests, Build)
 * 3. Ghi log Heartbeat ngày đêm vào `production/session-state/daemon-heartbeat.log`
 * 4. Đồng bộ Single Source of Truth (`production/session-state/active.md`)
 * 5. Báo hiệu cho AI Agent khi có Task READY cần thực thi.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const PATHS = {
  backlog: path.join(ROOT_DIR, 'production/tasks/studio-terminal-backlog.md'),
  activeState: path.join(ROOT_DIR, 'production/session-state/active.md'),
  heartbeatLog: path.join(ROOT_DIR, 'production/session-state/daemon-heartbeat.log'),
};

function formatNow() {
  const d = new Date();
  return d.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function parseBacklog() {
  if (!fs.existsSync(PATHS.backlog)) {
    return { doneCount: 0, readyTasks: [], total: 0 };
  }

  const content = fs.readFileSync(PATHS.backlog, 'utf-8');
  const lines = content.split('\n');

  let doneCount = 0;
  const readyTasks = [];
  let inTable = false;

  for (const line of lines) {
    if (line.includes('| Task ID |')) {
      inTable = true;
      continue;
    }
    if (inTable && line.startsWith('| TASK-')) {
      const parts = line.split('|').map((s) => s.trim()).filter(Boolean);
      if (parts.length >= 4) {
        const id = parts[0];
        const title = parts[1];
        const role = parts[2];
        const status = parts[3];
        const dep = parts[4] || '';

        if (status === 'DONE') {
          doneCount++;
        } else if (status === 'READY') {
          readyTasks.push({ id, title, role, dep });
        }
      }
    }
  }

  return {
    doneCount,
    readyTasks,
    total: doneCount + readyTasks.length,
  };
}

function runStep(name, command) {
  process.stdout.write(`⏳ Đang chạy: ${name}... `);
  try {
    const output = execSync(command, { cwd: ROOT_DIR, stdio: 'pipe' }).toString();
    console.log(`✅ OK`);
    return { success: true, output };
  } catch (error) {
    console.log(`❌ THẤT BẠI`);
    return {
      success: false,
      output: (error.stdout?.toString() || '') + '\n' + (error.stderr?.toString() || ''),
    };
  }
}

function getGitBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { cwd: ROOT_DIR }).toString().trim();
  } catch {
    return 'unknown';
  }
}

function logHeartbeat(status, summary) {
  const time = formatNow();
  const branch = getGitBranch();
  const entry = `[${time}] [BRANCH: ${branch}] [STATUS: ${status}] ${summary}\n`;

  fs.appendFileSync(PATHS.heartbeatLog, entry, 'utf-8');
}

function runCycle() {
  console.log(`\n======================================================`);
  console.log(`🐺 MA SÓI STUDIO — AUTONOMOUS DAEMON HEARTBEAT [${formatNow()}]`);
  console.log(`======================================================`);

  const branch = getGitBranch();
  console.log(`🌿 Git Branch: ${branch}`);

  // 1. Phân tích backlog
  const backlogStats = parseBacklog();
  console.log(`📊 Backlog: ${backlogStats.doneCount} Task DONE | ${backlogStats.readyTasks.length} Task READY`);

  if (backlogStats.readyTasks.length > 0) {
    const nextTask = backlogStats.readyTasks[0];
    console.log(`🎯 Task Kế Tiếp Trong Queue: [${nextTask.id}] ${nextTask.title} (Role: ${nextTask.role})`);
  } else {
    console.log(`✨ Hàng đợi READY hiện tại trống. Toàn bộ task trong sprint đã hoàn tất!`);
  }

  // 2. Chạy bộ kiểm thử toàn diện
  console.log(`\n--- KIỂM TRA SỨC KHỎE HỆ THỐNG ---`);
  const lintRes = runStep('Kiểm tra Lint (oxlint)', 'npm run lint');
  const testRes = runStep('Kiểm thử Game Engine (gameEngine.test.mjs)', 'npm test');
  const buildRes = runStep('Kiểm thử Production Build (vite build)', 'npm run build');

  const allPassed = lintRes.success && testRes.success && buildRes.success;

  if (allPassed) {
    console.log(`\n🟢 TRẠNG THÁI: TẤT CẢ HỆ THỐNG HOÀN TOÀN XANH! SẴN SÀNG VẬN HÀNH.`);
    logHeartbeat('HEALTHY', `All checks passed (Lint, Tests, Build). Ready Tasks: ${backlogStats.readyTasks.length}`);
  } else {
    console.log(`\n🔴 CẢNH BÁO: CÓ LỖI XẢY RA TRONG CHU TRÌNH KIỂM THỬ!`);
    logHeartbeat('DEGRADED', `Failure detected. Lint: ${lintRes.success}, Tests: ${testRes.success}, Build: ${buildRes.success}`);
  }

  return { allPassed, backlogStats };
}

// CLI Argument Parsing
const args = process.argv.slice(2);
const isWatch = args.includes('--watch');
const intervalArg = args.find((a) => a.startsWith('--interval='));
const intervalMinutes = intervalArg ? parseInt(intervalArg.split('=')[1], 10) : 15;

if (isWatch) {
  console.log(`🔄 Khởi động Daemon ở chế độ Giám sát Ngày Đêm (chu kỳ ${intervalMinutes} phút)...`);
  runCycle();
  setInterval(() => {
    runCycle();
  }, intervalMinutes * 60 * 1000);
} else {
  runCycle();
}
