/**
 * Test Suite: Sprint 16 — AI Architecture Integration & Verification
 * Kiểm thử tính toàn vẹn của:
 * 1. AI Skills Verification Engine (Node.js & Ruby static verification)
 * 2. AiNarratorService (Local Heuristics, Multi-Provider Architecture, Phase Narration, Bot Speech)
 * 3. Studio Operating Model and Role Router synchronization
 */

import assert from 'node:assert';
import test from 'node:test';
import { verifySkills } from '../scripts/verify-ai-skills.mjs';
import { AiNarratorService } from '../src/logic/aiNarratorService.ts';

test('AI Architecture - TASK-1501: verifySkills executes and passes 100% on 78 skills', () => {
  const report = verifySkills();
  assert.strictEqual(report.verdict, 'PASS', 'Skill verification verdict must be PASS');
  assert.strictEqual(report.failures.length, 0, 'Failures must be empty');
  assert.strictEqual(report.counts.total, 78, 'Total skills must be 78');
  assert.strictEqual(report.counts.template, 73, 'Template skills must be 73');
  assert.strictEqual(report.counts.project, 5, 'Project skills must be 5');
  assert.strictEqual(report.counts.active, 31, 'Active skills must be 31');
  assert.strictEqual(report.counts.manual, 29, 'Manual skills must be 29');
  assert.strictEqual(report.counts.dormant, 18, 'Dormant skills must be 18');
});

test('AI Architecture - TASK-1502: AiNarratorService handles Local Heuristic Night Narration', async () => {
  // Test Night Start
  const night1 = await AiNarratorService.generateNightNarration({
    phase: 'NIGHT_START',
    dayNumber: 1,
  });
  assert.match(night1, /Đêm thứ 1 buông xuống/);

  // Test Werewolf Call
  const wolfCall = await AiNarratorService.generateNightNarration({
    phase: 'WEREWOLF_CALL',
    dayNumber: 1,
  });
  assert.match(wolfCall, /Đàn Sói hãy thức tỉnh/);

  // Test Day Start with Victim
  const dayStartVictim = await AiNarratorService.generateNightNarration({
    phase: 'DAY_START',
    dayNumber: 2,
    victimName: 'Người Chơi A',
  });
  assert.match(dayStartVictim, /Người Chơi A đã bị Sói cắn xé/);

  // Test Day Start with No Victim
  const dayStartPeace = await AiNarratorService.generateNightNarration({
    phase: 'DAY_START',
    dayNumber: 2,
  });
  assert.match(dayStartPeace, /không có ai phải bỏ mạng/);
});

test('AI Architecture - TASK-1503: AiNarratorService generates contextual Bot Speech', async () => {
  // Accused Bot Speech
  const defense = await AiNarratorService.generateBotSpeech({
    botName: 'Arthur',
    botRole: 'VILLAGER',
    isAccused: true,
    recentDeaths: [],
  });
  assert.match(defense, /Oan uổng quá/);

  // Accuser Bot Speech
  const accuse = await AiNarratorService.generateBotSpeech({
    botName: 'Elena',
    botRole: 'SEER',
    suspectedPlayerName: 'Ragnar',
    isAccused: false,
    recentDeaths: [],
  });
  assert.match(accuse, /Ragnar có biểu hiện rất khả nghi/);
});

test('AI Architecture - TASK-1504: AiNarratorService configuration management', () => {
  AiNarratorService.setConfig({
    provider: 'GEMINI',
    geminiApiKey: 'test-dummy-key',
    temperature: 0.9,
  });

  const cfg = AiNarratorService.getConfig();
  assert.strictEqual(cfg.provider, 'GEMINI');
  assert.strictEqual(cfg.geminiApiKey, 'test-dummy-key');
  assert.strictEqual(cfg.temperature, 0.9);

  // Reset to LOCAL
  AiNarratorService.setConfig({ provider: 'LOCAL', geminiApiKey: undefined });
  assert.strictEqual(AiNarratorService.getConfig().provider, 'LOCAL');
});
