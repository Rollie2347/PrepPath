// Usage: npm run batch -- --tests sat,act [--per 2] [--parallel 4] [--dry-run]
// Runs generate.ts for every skill that has a pattern spec × each difficulty, a few at a time.
// generate.ts appends to the bank, so parallel runs are safe; run verify afterwards.
import { spawn } from 'node:child_process';

import { allSkills } from '../../shared/taxonomy';
import type { TestId } from '../../shared/types';

import { arg } from './bank';
import { specFor } from './specs';

const tests = (arg('tests') ?? 'sat').split(',') as TestId[];
const per = Number(arg('per') ?? 2);
const parallel = Number(arg('parallel') ?? 4);
const dryRun = process.argv.includes('--dry-run');

/** ACT Math is linear and ordered easy → hard; three bands cover it for now. */
const DIFFICULTIES: Record<TestId, number[]> = { sat: [1, 2, 3, 4, 5], act: [2, 3, 4] };

const jobs = tests.flatMap((t) =>
  allSkills(t)
    .filter((k) => specFor(k.id))
    .flatMap((k) => DIFFICULTIES[t].map((d) => ({ skill: k.id, difficulty: d }))),
);
console.log(`${jobs.length} generate calls × ${per} items = up to ${jobs.length * per} drafts.`);
if (dryRun) process.exit(0);

function run(job: (typeof jobs)[number]): Promise<void> {
  return new Promise((resolve) => {
    const p = spawn('npx', ['tsx', '--env-file=../../.env', 'generate.ts', '--skill', job.skill, '--difficulty', String(job.difficulty), '--count', String(per)], {
      shell: true,
    });
    let out = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (out += d));
    p.on('close', () => {
      console.log(`[${job.skill} d${job.difficulty}] ${out.trim().split('\n').slice(-6).join('\n  ')}`);
      resolve();
    });
  });
}

const queue = [...jobs];
await Promise.all(
  Array.from({ length: parallel }, async () => {
    while (queue.length) await run(queue.shift()!);
  }),
);
console.log('Batch done. Next: npm run verify -- --limit 1000');
