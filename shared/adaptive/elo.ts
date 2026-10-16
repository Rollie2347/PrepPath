import type { Difficulty } from '../types';

/** Starting rating for a skill the user has never practiced. */
export const START_RATING = 1000;

/**
 * Fixed question ratings by authored difficulty. v1 has no response data to calibrate
 * against; once attempts accumulate, replace with per-question ratings fit from attempts.
 */
const DIFFICULTY_RATING: Record<Difficulty, number> = {
  1: 700,
  2: 850,
  3: 1000,
  4: 1150,
  5: 1300,
};

export function questionRating(d: Difficulty): number {
  return DIFFICULTY_RATING[d];
}

/** Probability a user at `userRating` answers a question at `qRating` correctly. */
export function pCorrect(userRating: number, qRating: number): number {
  return 1 / (1 + 10 ** ((qRating - userRating) / 400));
}

/** K shrinks as the skill accumulates attempts so early answers move the rating fast. */
export function kFactor(attempts: number): number {
  return Math.max(16, 64 / Math.sqrt(1 + attempts / 5));
}

export interface SkillMastery {
  rating: number;
  attempts: number;
  correct: number;
}

export function newMastery(): SkillMastery {
  return { rating: START_RATING, attempts: 0, correct: 0 };
}

export function updateMastery(m: SkillMastery, d: Difficulty, correct: boolean): SkillMastery {
  const expected = pCorrect(m.rating, questionRating(d));
  const rating = m.rating + kFactor(m.attempts) * ((correct ? 1 : 0) - expected);
  return { rating, attempts: m.attempts + 1, correct: m.correct + (correct ? 1 : 0) };
}
