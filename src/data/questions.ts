import { collection, getDocs, limit, query, where } from '@react-native-firebase/firestore';

import type { Question } from '@shared/types';

import { db } from '@/lib/firebase';

// Approved questions bundled at build time (written by content/scripts/publish) so the
// first lessons work offline. Firestore holds the full, growing bank.
import bundled from '../../content/pack.json';

const BUNDLED = bundled as Question[];

/** Firestore `in` filters accept at most 30 values. */
const IN_LIMIT = 30;

export async function loadQuestions(skillIds: string[], max = 200): Promise<Question[]> {
  const byId = new Map<string, Question>();
  for (const q of BUNDLED) if (skillIds.includes(q.skillId)) byId.set(q.id, q);

  for (let i = 0; i < skillIds.length; i += IN_LIMIT) {
    try {
      const snap = await getDocs(
        query(
          collection(db, 'questions'),
          where('skillId', 'in', skillIds.slice(i, i + IN_LIMIT)),
          where('reviewStatus', '==', 'approved'),
          limit(max),
        ),
      );
      snap.forEach((d) => byId.set(d.id, { ...(d.data() as Question), id: d.id }));
    } catch {
      // Offline with nothing cached: the bundled pack is all we have.
    }
  }
  return [...byId.values()];
}

export async function loadQuestionsById(ids: string[]): Promise<Question[]> {
  const out = new Map<string, Question>();
  for (const q of BUNDLED) if (ids.includes(q.id)) out.set(q.id, q);
  const missing = ids.filter((id) => !out.has(id));
  for (let i = 0; i < missing.length; i += IN_LIMIT) {
    try {
      const snap = await getDocs(
        query(collection(db, 'questions'), where('__name__', 'in', missing.slice(i, i + IN_LIMIT))),
      );
      snap.forEach((d) => out.set(d.id, { ...(d.data() as Question), id: d.id }));
    } catch {
      // Offline: return what's available.
    }
  }
  return ids.map((id) => out.get(id)).filter((q): q is Question => !!q);
}
