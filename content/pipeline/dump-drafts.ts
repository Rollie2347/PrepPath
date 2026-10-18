// Usage: npx tsx dump-drafts.ts [--skill prefix] [--from N] [--limit N]
// Compact listing of draft questions for manual review in a session.
import { arg, readBank } from './bank';

const prefix = arg('skill') ?? '';
const from = Number(arg('from') ?? 0);
const limit = Number(arg('limit') ?? 20);
const drafts = readBank().filter((q) => q.reviewStatus === 'draft' && q.skillId.startsWith(prefix));
console.log(`${drafts.length} drafts`);
for (const [i, q] of drafts.slice(from, from + limit).entries()) {
  console.log(`\n#${from + i} ${q.id.slice(0, 8)} ${q.skillId} d${q.difficulty}`);
  if (q.stimulus) console.log(`S: ${q.stimulus}`);
  console.log(`Q: ${q.stem}`);
  q.choices?.forEach((c, j) => console.log(`${j === q.answer ? '*' : ' '}${'ABCD'[j]}) ${c}`));
  if (!q.choices) console.log(`  key: ${(q.answer as string[]).join(' | ')}`);
}
