// Usage: npm run review [-- --skill sat.math.alg.lin1]
// Human review of verified questions in the terminal: (a)pprove, (r)eject, (s)kip, (q)uit.
// Non-interactive (for scripted review):
//   --dump [--skill X] [--limit N]      print verified questions with key, clue and distractor reasons
//   --approve id1,id2                   approve verified questions by id
//   --reject "id1=reason|id2=reason"    reject questions by id with a reason
import readline from 'node:readline/promises';

import { arg, readBank, writeBank, type BankRow } from './bank';

const skill = arg('skill');
const bank = readBank();
const queue = bank.filter((q) => q.reviewStatus === 'verified' && (!skill || q.skillId === skill));

function show(q: BankRow, header: string) {
  console.log('─'.repeat(70));
  console.log(`${header} ${q.id} · ${q.skillId} · difficulty ${q.difficulty}${q.tags?.length ? ` · ${q.tags.join(', ')}` : ''}`);
  if (q.stimulus) console.log(`\n${q.stimulus}`);
  console.log(`\n${q.stem}\n`);
  q.choices?.forEach((c, j) => console.log(`${j === q.answer ? '*' : ' '} ${String.fromCharCode(65 + j)}) ${c}`));
  if (!q.choices) console.log(`  Accepted: ${(q.answer as string[]).join(' | ')}`);
  console.log(`\nExplanation: ${q.explanation}`);
  if (q.pipeline?.governingClue) console.log(`Clue: ${q.pipeline.governingClue}`);
  if (q.pipeline?.distractorRationale?.length) console.log(`Distractors:\n  ${q.pipeline.distractorRationale.join('\n  ')}`);
  if (q.pipeline?.notes?.length) console.log(`Verifier notes: ${q.pipeline.notes.join('; ')}`);
}

const approve = arg('approve');
const reject = arg('reject');
if (process.argv.includes('--dump')) {
  const n = Number(arg('limit') ?? queue.length);
  queue.slice(0, n).forEach((q, i) => show(q, `[${i + 1}/${queue.length}]`));
  process.exit(0);
}
if (approve || reject) {
  const byId = new Map(bank.map((q) => [q.id, q]));
  let a = 0;
  let r = 0;
  for (const id of approve?.split(',').map((s) => s.trim()).filter(Boolean) ?? []) {
    const q = byId.get(id);
    if (q?.reviewStatus !== 'verified') console.error(`Skip ${id}: not a verified question.`);
    else (q.reviewStatus = 'approved'), a++;
  }
  for (const pair of reject?.split('|').filter(Boolean) ?? []) {
    const [id, ...why] = pair.split('=');
    const q = byId.get(id.trim());
    if (!q) console.error(`Skip ${id}: unknown id.`);
    else {
      q.reviewStatus = 'rejected';
      q.pipeline = { ...q.pipeline, notes: [...(q.pipeline?.notes ?? []), `Reviewer: ${why.join('=').trim()}`] };
      r++;
    }
  }
  writeBank(bank);
  console.log(`Approved ${a}, rejected ${r}.`);
  process.exit(0);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
console.log(`${queue.length} verified questions waiting for review.\n`);
for (const [i, q] of queue.entries()) {
  show(q, `[${i + 1}/${queue.length}]`);
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
