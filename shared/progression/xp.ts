import type { Difficulty } from '../types';

export const XP = {
  perCorrect: { 1: 2, 2: 2, 3: 3, 4: 3, 5: 4 } as Record<Difficulty, number>,
  lessonComplete: 10,
  perfectLesson: 5,
  /** Every 5 correct answers in a row inside a lesson. */
  comboEvery: 5,
  comboBonus: 3,
  legendaryComplete: 40,
  checkpointPassed: 30,
  boostMultiplier: 2,
} as const;

export interface LessonResult {
  kind: 'lesson' | 'legendary' | 'checkpoint' | 'practice';
  /** Answers in order. Missed questions re-asked at the end appear again. */
  answers: { difficulty: Difficulty; correct: boolean }[];
  /** Legendary/checkpoint pass condition, decided by the lesson rules. */
  passed: boolean;
  /** Active XP boost window (from a chest). */
  boosted?: boolean;
}

export interface XpBreakdown {
  answers: number;
  completion: number;
  perfect: number;
  combo: number;
  total: number;
}

export function lessonXp(r: LessonResult): XpBreakdown {
  let answers = 0;
  let combo = 0;
  let run = 0;
  for (const a of r.answers) {
    if (a.correct) {
      answers += XP.perCorrect[a.difficulty];
      run++;
      if (run % XP.comboEvery === 0) combo += XP.comboBonus;
    } else {
      run = 0;
    }
  }

  // "Perfect" = no misses on the first pass (re-asks only happen after a miss).
  const perfect = r.answers.length > 0 && r.answers.every((a) => a.correct) ? XP.perfectLesson : 0;

  let completion = 0;
  if (r.kind === 'lesson' || r.kind === 'practice') completion = XP.lessonComplete;
  else if (r.passed) completion = r.kind === 'legendary' ? XP.legendaryComplete : XP.checkpointPassed;

  const base = answers + completion + perfect + combo;
  const total = r.boosted ? base * XP.boostMultiplier : base;
  return { answers, completion, perfect, combo, total };
}
