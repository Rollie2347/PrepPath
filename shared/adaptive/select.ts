import type { Question } from '../types';
import { pCorrect, questionRating, type SkillMastery, START_RATING } from './elo';

/** Sweet spot for learning: hard enough to stretch, easy enough to keep momentum. */
export const TARGET_P = { min: 0.6, max: 0.75, ideal: 0.68 };

export interface SelectOptions {
  count: number;
  /** Question ids to avoid (recently answered). */
  exclude?: Set<string>;
  /** Legendary rounds: hardest available, ignore the target band. */
  hardest?: boolean;
  rng?: () => number;
}

/**
 * Picks `count` questions for a lesson. Questions inside the target probability band are
 * preferred (shuffled), then the closest outside it. Falls back to excluded questions only
 * when the pool is too small, so a lesson is never short.
 */
export function selectQuestions(
  pool: Question[],
  mastery: Record<string, SkillMastery>,
  opts: SelectOptions,
): Question[] {
  const rng = opts.rng ?? Math.random;
  const ratingFor = (q: Question) => mastery[q.skillId]?.rating ?? START_RATING;
  const fresh = pool.filter((q) => !opts.exclude?.has(q.id));
  const stale = pool.filter((q) => opts.exclude?.has(q.id));

  const rank = (qs: Question[]) => {
    if (opts.hardest) {
      return shuffle(qs, rng).sort((a, b) => b.difficulty - a.difficulty);
    }
    const scored = qs.map((q) => ({ q, p: pCorrect(ratingFor(q), questionRating(q.difficulty)) }));
    const inBand = shuffle(
      scored.filter((s) => s.p >= TARGET_P.min && s.p <= TARGET_P.max),
      rng,
    );
    const outBand = scored
      .filter((s) => s.p < TARGET_P.min || s.p > TARGET_P.max)
      .sort((a, b) => Math.abs(a.p - TARGET_P.ideal) - Math.abs(b.p - TARGET_P.ideal));
    return [...inBand, ...outBand].map((s) => s.q);
  };

  return [...rank(fresh), ...rank(stale)].slice(0, opts.count);
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
