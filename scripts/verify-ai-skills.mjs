#!/usr/bin/env node

/**
 * Node.js Native Profile Verification for AI Skills (Ma Sói Game Studio)
 * Validates frontmatter, YAML schema, tool allowances, verdicts, approval contracts, and inventory consistency.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const INVENTORY_PATH = path.join(ROOT, 'production/planning/ai-skill-inventory.json');
const AGENTS_PATH = path.join(ROOT, 'AGENTS.md');

const NATIVE_KEYS = new Set(['name', 'description', 'license', 'allowed-tools', 'metadata']);
const LEGACY_TOOLS = new Set([
  'Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash', 'RunCommand',
  'WebSearch', 'WebFetch', 'AskUserQuestion', 'Task', 'TodoWrite', 'Skill'
]);

function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error('Missing YAML frontmatter');
  
  const yamlContent = match[1];
  const body = text.slice(match[0].length);
  
  // Basic YAML key-value parser for frontmatter
  const data = {};
  let currentKey = null;
  let inMetadata = false;

  for (const line of yamlContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    if (line.startsWith('metadata:')) {
      data.metadata = {};
      inMetadata = true;
      currentKey = null;
      continue;
    }

    if (inMetadata) {
      if (line.startsWith('  ') || line.startsWith('\t')) {
        const colonIdx = trimmed.indexOf(':');
        if (colonIdx !== -1) {
          const k = trimmed.slice(0, colonIdx).trim();
          let v = trimmed.slice(colonIdx + 1).trim();
          if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
            v = v.slice(1, -1);
          }
          data.metadata[k] = v;
        }
      } else {
        inMetadata = false;
      }
    }

    if (!inMetadata) {
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx !== -1) {
        const k = trimmed.slice(0, colonIdx).trim();
        let v = trimmed.slice(colonIdx + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        data[k] = v;
        currentKey = k;
      }
    }
  }

  return { fm: data, body };
}

function nativeErrors(name, fm, body) {
  const errors = [];
  if (!fm || typeof fm !== 'object') return ['frontmatter must be an object'];

  for (const k of Object.keys(fm)) {
    if (!NATIVE_KEYS.has(k)) {
      errors.push(`unsupported top-level field: ${k}`);
    }
  }

  if (fm.name !== name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || name.length > 64) {
    errors.push('name mismatch or invalid format');
  }

  if (!fm.description || typeof fm.description !== 'string' || fm.description.length > 1024 || /[<>]/.test(fm.description)) {
    errors.push('invalid description');
  }

  const tools = fm['allowed-tools'];
  if (!tools || typeof tools !== 'string' || !tools.trim()) {
    errors.push('missing/advisory tool list');
  } else {
    const list = tools.split(/[,\s]+/).filter(Boolean);
    if (list.some(t => LEGACY_TOOLS.has(t))) {
      errors.push('legacy callable tool alias in frontmatter');
    }
  }

  const meta = fm.metadata;
  if (!meta || typeof meta !== 'object') {
    errors.push('metadata must be a mapping');
  } else {
    if (!meta['argument-hint'] || !meta['argument-hint'].trim()) {
      errors.push('missing argument hint metadata');
    }
    if (meta['user-invocable'] !== 'true') {
      errors.push('missing explicit invocation metadata');
    }
  }

  const sectionMatches = body.match(/^##\s+\S/gm);
  if (!sectionMatches || sectionMatches.length < 2) {
    errors.push('fewer than two workflow sections');
  }

  const verdicts = ['PASS', 'CONCERNS', 'BLOCKED', 'NOT RUN'];
  for (const v of verdicts) {
    if (!body.includes(v)) {
      errors.push(`missing verdict keyword: ${v}`);
    }
  }

  const hasApproval = /trước mutation|trước khi ghi|before writing|approval-before-write/i.test(body) &&
                      /approval|phê duyệt/i.test(body) &&
                      /scope|path/i.test(body);
  if (!hasApproval) {
    errors.push('missing approval-before-write contract');
  }

  if (!/next.step|handoff|hành động tiếp theo/i.test(body)) {
    errors.push('missing next-step handoff');
  }

  return errors;
}

export function verifySkills() {
  if (!fs.existsSync(INVENTORY_PATH)) {
    throw new Error(`Inventory not found at ${INVENTORY_PATH}`);
  }

  const inventory = JSON.parse(fs.readFileSync(INVENTORY_PATH, 'utf-8'));
  const rows = inventory.skills;
  const skillsDir = path.join(ROOT, '.agents/skills');
  const actual = fs.readdirSync(skillsDir).filter(name => {
    return fs.existsSync(path.join(skillsDir, name, 'SKILL.md'));
  }).sort();

  const failures = [];
  const counts = {
    total: rows.length,
    template: rows.filter(r => r.kind === 'template').length,
    project: rows.filter(r => r.kind === 'project').length,
    active: rows.filter(r => r.trigger === 'active').length,
    manual: rows.filter(r => r.trigger === 'manual').length,
    dormant: rows.filter(r => r.trigger === 'dormant').length,
  };

  const inventoryNames = rows.map(r => r.name).sort();
  if (JSON.stringify(inventoryNames) !== JSON.stringify(actual)) {
    failures.push('inventory names do not match .agents/skills directories');
  }

  if (JSON.stringify(counts) !== JSON.stringify(inventory.counts)) {
    failures.push(`declared counts mismatch: expected ${JSON.stringify(inventory.counts)}, got ${JSON.stringify(counts)}`);
  }

  const agentsContent = fs.readFileSync(AGENTS_PATH, 'utf-8');
  for (const mode of ['active', 'manual', 'dormant']) {
    const regex = new RegExp(`^\\s*-\\s*\`${mode}\`:\\s*([^\\n]+)`, 'm');
    const match = agentsContent.match(regex);
    if (!match) {
      failures.push(`AGENTS.md missing routing line for ${mode}`);
      continue;
    }
    const rawList = match[1].split(/\.\s+/)[0].replace(/\.\s*$/, '');
    const listed = rawList.split(',').map(s => s.trim()).filter(Boolean).sort();
    const expected = rows.filter(r => r.trigger === mode).map(r => r.name).sort();
    if (JSON.stringify(listed) !== JSON.stringify(expected)) {
      failures.push(`AGENTS.md router mismatch for ${mode}`);
    }
  }

  const results = [];

  for (const row of rows) {
    const { name, path: relPath, trigger, kind } = row;
    const skillPath = path.join(ROOT, relPath);
    const parentDir = path.dirname(skillPath);

    if (kind === 'template') {
      const isSymlink = fs.lstatSync(parentDir).isSymbolicLink();
      if (!isSymlink) {
        failures.push(`${name}: template skill is not a symlink`);
      }
    }

    let text;
    try {
      text = fs.readFileSync(skillPath, 'utf-8');
    } catch (e) {
      failures.push(`${name}: unable to read SKILL.md (${e.message})`);
      continue;
    }

    let fm, body;
    try {
      const parsed = parseFrontmatter(text);
      fm = parsed.fm;
      body = parsed.body;
    } catch (e) {
      failures.push(`${name}: frontmatter error (${e.message})`);
      continue;
    }

    const issues = kind === 'project' ? nativeErrors(name, fm, body) : [];
    if (issues.length > 0) {
      failures.push(...issues.map(i => `${name}: ${i}`));
      results.push({ name, trigger, verdict: 'FAIL', issues });
    } else {
      results.push({ name, trigger, verdict: 'PASS', issues: [] });
    }
  }

  const report = {
    counts,
    failures,
    verdict: failures.length === 0 ? 'PASS' : 'FAIL',
  };

  return report;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const report = verifySkills();
    console.log(JSON.stringify(report, null, 2));
    if (report.verdict !== 'PASS') {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during skills verification:', err);
    process.exit(1);
  }
}
