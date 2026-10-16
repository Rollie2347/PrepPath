// Usage: npm run coverage
// Approved-question counts per skill × difficulty band against the launch target.
import { allSkills } from '../../shared/taxonomy';

import { readBank } from './bank';

const TARGET_PER_BAND = 30;
const BANDS: [string, number[]][] = [
  ['easy 1-2', [1, 2]],
  ['med 3', [3]],
  ['hard 4-5', [4, 5]],
];

const bank = readBank();
const status = { draft: 0, verified: 0, approved: 0, rejected: 0 };
for (const q of bank) status[q.reviewStatus]++;
const checked = status.verified + status.approved + status.rejected;
console.log(`Bank: ${bank.length} total`, status);
if (checked) console.log(`Verifier pass rate: ${Math.round((100 * (status.verified + status.approved)) / checked)}%\n`);

let gaps = 0;
for (const s of allSkills()) {
  const counts = BANDS.map(([, ds]) => bank.filter((q) => q.skillId === s.id && q.reviewStatus === 'approved' && ds.includes(q.difficulty)).length);
  if (counts.some((c) => c < TARGET_PER_BAND)) gaps++;
  console.log(`${s.id.padEnd(28)} ${BANDS.map(([n], i) => `${n}: ${String(counts[i]).padStart(3)}`).join('  ')}`);
}
console.log(`\n${gaps} skills below ${TARGET_PER_BAND} approved per band.`);
