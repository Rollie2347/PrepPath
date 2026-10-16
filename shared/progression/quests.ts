export type QuestKind = 'earnXp' | 'finishLessons' | 'perfectLessons' | 'combo' | 'correctAnswers';

export interface Quest {
  id: string;
  kind: QuestKind;
  target: number;
  title: string;
  gems: number;
}

export interface QuestState extends Quest {
  progress: number;
  done: boolean;
}

const POOL: Quest[] = [
  { id: 'xp30', kind: 'earnXp', target: 30, title: 'Earn 30 XP', gems: 10 },
  { id: 'xp60', kind: 'earnXp', target: 60, title: 'Earn 60 XP', gems: 15 },
  { id: 'les2', kind: 'finishLessons', target: 2, title: 'Complete 2 lessons', gems: 10 },
  { id: 'les4', kind: 'finishLessons', target: 4, title: 'Complete 4 lessons', gems: 20 },
  { id: 'perf1', kind: 'perfectLessons', target: 1, title: 'Finish a lesson with no mistakes', gems: 15 },
  { id: 'combo5', kind: 'combo', target: 5, title: 'Get 5 in a row', gems: 10 },
  { id: 'combo10', kind: 'combo', target: 10, title: 'Get 10 in a row', gems: 20 },
  { id: 'ans20', kind: 'correctAnswers', target: 20, title: 'Answer 20 questions correctly', gems: 15 },
];

/** Three quests per user per day, deterministic so client and server agree. */
export function questsFor(uid: string, day: string): Quest[] {
  let h = 2166136261;
  for (const c of `${uid}|${day}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  const picked: Quest[] = [];
  const kinds = new Set<QuestKind>();
  for (let i = 0; picked.length < 3 && i < POOL.length * 4; i++) {
    h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0;
    const q = POOL[h % POOL.length];
    if (!kinds.has(q.kind)) {
      kinds.add(q.kind);
      picked.push(q);
    }
  }
  return picked;
}

export interface LessonFacts {
  xp: number;
  perfect: boolean;
  bestRun: number;
  correct: number;
}

export function advanceQuests(states: QuestState[], f: LessonFacts): { states: QuestState[]; completed: QuestState[] } {
  const completed: QuestState[] = [];
  const next = states.map((s) => {
    if (s.done) return s;
    const inc: Record<QuestKind, number> = {
      earnXp: f.xp,
      finishLessons: 1,
      perfectLessons: f.perfect ? 1 : 0,
      correctAnswers: f.correct,
      combo: 0,
    };
    const progress = s.kind === 'combo' ? Math.max(s.progress, f.bestRun) : s.progress + inc[s.kind];
    const done = progress >= s.target;
    const out = { ...s, progress: Math.min(progress, s.target), done };
    if (done) completed.push(out);
    return out;
  });
  return { states: next, completed };
}
