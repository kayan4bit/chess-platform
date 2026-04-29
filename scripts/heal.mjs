#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * UCX Chess — self-healing CLI.
 *
 * Runs the standard verification pipeline (typecheck → lint → build → tests).
 * If anything fails, sends the failing file + the error log to OpenRouter and
 * applies the LLM's suggested patch, then retries. Up to MAX_ATTEMPTS rounds.
 *
 * Usage:
 *   OPENROUTER_API_KEY=sk-or-... node scripts/heal.mjs            # all stages
 *   node scripts/heal.mjs --stage typecheck                        # just one
 *   node scripts/heal.mjs --dry-run                                # report only
 *
 * Designed to be safe-by-default: never edits files outside the repo, never
 * touches .env / secrets / node_modules / .git, requires the patch to
 * apply cleanly with `git apply --check` before writing it.
 */

import { spawnSync } from 'node:child_process';
import { writeFileSync, readFileSync, existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const REPO_ROOT = resolve(new URL('..', import.meta.url).pathname);
const MAX_ATTEMPTS = Number(process.env.HEAL_MAX_ATTEMPTS ?? 3);
const MODEL = process.env.HEAL_MODEL ?? 'anthropic/claude-3.5-sonnet';
const API_KEY = process.env.OPENROUTER_API_KEY ?? process.env.openrouter;
const DRY_RUN = process.argv.includes('--dry-run');

const STAGES = [
  { name: 'typecheck', cmd: ['yarn', 'typecheck'] },
  { name: 'lint',      cmd: ['yarn', 'lint'] },
  { name: 'test',      cmd: ['yarn', 'workspace', '@chess/backend', 'test'] },
  { name: 'build',     cmd: ['yarn', 'workspaces', 'run', 'build'] },
];

const argv = process.argv.slice(2);
const stageFilter = argv.includes('--stage') ? argv[argv.indexOf('--stage') + 1] : null;
const stages = stageFilter ? STAGES.filter((s) => s.name === stageFilter) : STAGES;

function run(cmd, opts = {}) {
  const r = spawnSync(cmd[0], cmd.slice(1), {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...opts,
  });
  return {
    code: r.status ?? 1,
    stdout: r.stdout ?? '',
    stderr: r.stderr ?? '',
    combined: `${r.stdout ?? ''}\n${r.stderr ?? ''}`,
  };
}

function extractFailingFile(log) {
  // Match common patterns: "src/foo/bar.ts(12,3):", "ESLint:.*src/...:line:col", "FAIL src/...".
  const patterns = [
    /([\w./_-]+\.tsx?)\((\d+),(\d+)\)/,
    /([\w./_-]+\.tsx?):(\d+):(\d+)/,
    /(?:FAIL|ERROR)\s+([\w./_-]+\.[jt]sx?)/,
    /at\s+([\w./_-]+\.[jt]sx?):(\d+):(\d+)/,
  ];
  for (const re of patterns) {
    const m = log.match(re);
    if (m) {
      // Resolve relative to repo root if the path is workspace-relative.
      const candidates = [
        m[1],
        join('apps/backend', m[1]),
        join('apps/frontend', m[1]),
        join('packages/shared', m[1]),
      ].map((p) => resolve(REPO_ROOT, p));
      const found = candidates.find((p) => existsSync(p));
      if (found) return found;
    }
  }
  return null;
}

async function askOpenRouter({ stage, file, sourceText, log }) {
  if (!API_KEY) {
    throw new Error('OPENROUTER_API_KEY not set — cannot self-heal.');
  }
  const system = `You are a senior TypeScript engineer fixing a single file in the UCX Chess repository.\nReturn ONLY a unified diff (\`git apply\` format) that fixes the failing ${stage} output.\nThe diff must:\n- target a single file with paths relative to repo root\n- start with \`diff --git\` and \`--- a/\` / \`+++ b/\`\n- apply cleanly without any context outside the supplied source\n- not modify other files, .env, secrets, or generated artifacts\nIf you cannot fix the issue with high confidence, respond with the literal text \`NO_PATCH\`.`;

  const user = `Stage: ${stage}\nFailing file: ${file}\n\n=== ${stage.toUpperCase()} OUTPUT ===\n${log.slice(-6000)}\n\n=== CURRENT FILE: ${file} ===\n${sourceText}`;

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/kayan4bit/chess-platform',
      'X-Title': 'UCX Chess Self-Heal',
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0,
      max_tokens: 2000,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${txt}`);
  }
  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content ?? '';
  return text.trim();
}

function extractDiff(text) {
  if (text === 'NO_PATCH') return null;
  // Strip code fences if present
  const fenced = text.match(/```(?:diff|patch)?\n([\s\S]*?)```/);
  const diff = fenced ? fenced[1] : text;
  if (!diff.includes('diff --git') && !diff.startsWith('--- ')) return null;
  return diff.trim() + '\n';
}

function applyDiff(diffText) {
  const dir = mkdtempSync(join(tmpdir(), 'heal-'));
  const patchPath = join(dir, 'fix.patch');
  writeFileSync(patchPath, diffText, 'utf8');
  const check = spawnSync('git', ['apply', '--check', patchPath], { cwd: REPO_ROOT, encoding: 'utf8' });
  if (check.status !== 0) {
    return { ok: false, error: `git apply --check failed:\n${check.stderr || check.stdout}` };
  }
  const apply = spawnSync('git', ['apply', patchPath], { cwd: REPO_ROOT, encoding: 'utf8' });
  if (apply.status !== 0) {
    return { ok: false, error: `git apply failed:\n${apply.stderr || apply.stdout}` };
  }
  return { ok: true, patchPath };
}

async function healStage(stage) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    process.stdout.write(`\n→ ${stage.name} (attempt ${attempt}/${MAX_ATTEMPTS})… `);
    const r = run(stage.cmd);
    if (r.code === 0) { console.log('✔'); return true; }
    console.log('✘');
    console.log(r.combined.split('\n').slice(-30).join('\n'));

    if (DRY_RUN) {
      console.log('(dry-run) skipping LLM heal');
      return false;
    }
    if (!API_KEY) {
      console.log('No OPENROUTER_API_KEY available — cannot self-heal.');
      return false;
    }
    const file = extractFailingFile(r.combined);
    if (!file) { console.log('Could not pinpoint failing file. Aborting heal.'); return false; }
    console.log(`Asking ${MODEL} for a patch on ${file.replace(REPO_ROOT + '/', '')}…`);
    const sourceText = readFileSync(file, 'utf8');
    let response;
    try {
      response = await askOpenRouter({ stage: stage.name, file: file.replace(REPO_ROOT + '/', ''), sourceText, log: r.combined });
    } catch (err) {
      console.log(`OpenRouter error: ${err.message}`);
      return false;
    }
    const diff = extractDiff(response);
    if (!diff) { console.log('Model returned no usable diff — aborting heal.'); return false; }
    const applied = applyDiff(diff);
    if (!applied.ok) { console.log(applied.error); return false; }
    console.log(`Applied patch from ${MODEL}. Re-running ${stage.name}.`);
  }
  console.log(`Stage ${stage.name} could not be healed after ${MAX_ATTEMPTS} attempts.`);
  return false;
}

(async () => {
  console.log('UCX Chess self-heal — running pipeline');
  let allGreen = true;
  for (const stage of stages) {
    const ok = await healStage(stage);
    if (!ok) { allGreen = false; break; }
  }
  if (allGreen) {
    console.log('\nAll stages green.');
    if (run(['git', 'status', '--porcelain']).stdout.trim()) {
      console.log('Heal made changes — review with `git diff`.');
    }
    process.exit(0);
  } else {
    process.exit(1);
  }
})();
