// Usage: npx tsx tally.ts [prefix] — approved questions per skill and difficulty.
import { allSkills } from '../../shared/taxonomy';

import { readBank } from './bank';

const prefix = process.argv[2] ?? '';
const bank = readBank().filter((q) => q.reviewStatus === 'approved');
for (const k of allSkills().filter((s) => s.id.startsWith(prefix))) {
  const qs = bank.filter((q) => q.skillId === k.id);
  const byD = [1, 2, 3, 4, 5].map((d) => qs.filter((q) => q.difficulty === d).length);
  console.log(`${k.id.padEnd(34)} ${String(qs.length).padStart(3)}  d1-5: ${byD.join(' ')}`);
}
