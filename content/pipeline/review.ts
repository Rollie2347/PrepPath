// Usage: npm run review [-- --skill sat.math.alg.lin1]
// Human review of verified questions in the terminal: (a)pprove, (r)eject, (s)kip, (q)uit.
import readline from 'node:readline/promises';

import { readBank, writeBank, arg } from './bank';

const skill = arg('skill');
const bank = readBank();
const queue = bank.filter((q) => q.reviewStatus === 'verified' && (!skill || q.skillId === skill));
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log(`${queue.length} verified questions waiting for review.\n`);
for (const [i, q] of queue.entries()) {
  console.log('─'.repeat(70));
  console.log(`[${i + 1}/${queue.length}] ${q.skillId} · difficulty ${q.difficulty}`);
  if (q.stimulus) console.log(`\n${q.stimulus}`);
  console.log(`\n${q.stem}\n`);
  q.choices?.forEach((c, j) => console.log(`${j === q.answer ? '*' : ' '} ${String.fromCharCode(65 + j)}) ${c}`));
  if (!q.choices) console.log(`  Accepted: ${(q.answer as string[]).join(' | ')}`);
  console.log(`\nExplanation: ${q.explanation}`);
  if (q.pipeline?.notes?.length) console.log(`Verifier notes: ${q.pipeline.notes.join('; ')}`);

  const a = (await rl.question('\n(a)pprove (r)eject (s)kip (q)uit > ')).trim().toLowerCase();
  if (a === 'q') break;
  if (a === 'a') q.reviewStatus = 'approved';
  if (a === 'r') {
    q.reviewStatus = 'rejected';
    const why = await rl.question('Reason: ');
    q.pipeline = { ...q.pipeline, notes: [...(q.pipeline?.notes ?? []), `Reviewer: ${why}`] };
  }
  writeBank(bank);
}
rl.close();
