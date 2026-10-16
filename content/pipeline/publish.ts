// Usage: npm run publish [-- --dry-run]
// Pushes approved questions to Firestore `questions/` and regenerates ../pack.json (the
// offline pack bundled in the app: up to PACK_PER_SKILL approved questions per skill).
// Needs GOOGLE_APPLICATION_CREDENTIALS pointing at a service-account key for the project.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import type { Question } from '../../shared/types';

import { readBank } from './bank';

const PACK_PER_SKILL = 12;
const dryRun = process.argv.includes('--dry-run');
const here = path.dirname(fileURLToPath(import.meta.url));

const approved: Question[] = readBank()
  .filter((q) => q.reviewStatus === 'approved')
  .map(({ pipeline: _pipeline, ...q }) => q);

const perSkill = new Map<string, Question[]>();
for (const q of approved) perSkill.set(q.skillId, [...(perSkill.get(q.skillId) ?? []), q]);
// Spread the pack across difficulties so the first levels of every node work offline.
const pack = [...perSkill.values()].flatMap((qs) => qs.sort((a, b) => a.difficulty - b.difficulty).slice(0, PACK_PER_SKILL));

if (dryRun) {
  console.log(`Would publish ${approved.length} questions; pack would hold ${pack.length}.`);
  process.exit(0);
}

initializeApp();
const db = getFirestore();
for (let i = 0; i < approved.length; i += 400) {
  const batch = db.batch();
  for (const q of approved.slice(i, i + 400)) {
    const { id, ...data } = q;
    batch.set(db.doc(`questions/${id}`), data);
  }
  await batch.commit();
}
fs.writeFileSync(path.resolve(here, '..', 'pack.json'), JSON.stringify(pack, null, 0) + '\n');
console.log(`Published ${approved.length} questions to Firestore; pack.json holds ${pack.length}.`);
