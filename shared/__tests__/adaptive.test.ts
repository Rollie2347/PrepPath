import { newMastery, pCorrect, questionRating, START_RATING, updateMastery } from '../adaptive/elo';
import { predictScore } from '../adaptive/score';
import { selectQuestions } from '../adaptive/select';
import type { Difficulty, Question } from '../types';

const q = (id: string, difficulty: Difficulty, skillId = 'sat.math.alg.lin1'): Question => ({
  id,
  test: 'sat',
  sectionId: 'sat.math',
  skillId,
  difficulty,
  stem: '',
  choices: ['a', 'b', 'c', 'd'],
  answer: 0,
  explanation: '',
  source: { kind: 'generated', name: 'test', license: 'n/a' },
  reviewStatus: 'approved',
});

describe('elo', () => {
  it('gives 50% against an equally rated question', () => {
    expect(pCorrect(1000, questionRating(3))).toBeCloseTo(0.5);
  });

  it('moves rating up on correct and down on miss, less as attempts grow', () => {
    const m = newMastery();
    const up = updateMastery(m, 3, true);
    const down = updateMastery(m, 3, false);
    expect(up.rating).toBeGreaterThan(START_RATING);
    expect(down.rating).toBeLessThan(START_RATING);
    const seasoned = { ...m, attempts: 200 };
    expect(updateMastery(seasoned, 3, true).rating - START_RATING).toBeLessThan(up.rating - START_RATING);
  });

  it('rewards beating a hard question more than an easy one', () => {
    const m = newMastery();
    expect(updateMastery(m, 5, true).rating).toBeGreaterThan(updateMastery(m, 1, true).rating);
  });
});

describe('selectQuestions', () => {
  const pool = [q('e1', 1), q('e2', 2), q('m1', 3), q('h1', 4), q('h2', 5)];
  const rng = () => 0.42;

  it('prefers questions in the target band for a new user', () => {
    // New user (1000): d2 (850) → p≈0.70 is in band; d1 (700) → 0.85 is not.
    const picked = selectQuestions(pool, {}, { count: 1, rng });
    expect(picked[0].id).toBe('e2');
  });

  it('avoids excluded questions until the pool runs dry', () => {
    const picked = selectQuestions(pool, {}, { count: 5, exclude: new Set(['e2']), rng });
    expect(picked).toHaveLength(5);
    expect(picked[4].id).toBe('e2');
  });

  it('hardest mode returns the hardest first', () => {
    const picked = selectQuestions(pool, {}, { count: 2, hardest: true, rng });
    expect(picked.map((x) => x.difficulty)).toEqual([5, 4]);
  });
});

describe('predictScore', () => {
  it('stays inside the official scales', () => {
    const sat = predictScore('sat', {});
    expect(sat.score).toBeGreaterThanOrEqual(400);
    expect(sat.score).toBeLessThanOrEqual(1600);
    expect(sat.score % 10).toBe(0);
    const act = predictScore('act', {});
    expect(act.score).toBeGreaterThanOrEqual(1);
    expect(act.score).toBeLessThanOrEqual(36);
  });

  it('rises with mastery and narrows with practice', () => {
    const base = predictScore('sat', {});
    const strong = Object.fromEntries(
      ['sat.math.alg.lin1', 'sat.math.alg.lin2', 'sat.math.alg.linfn'].map((id) => [
        id,
        { rating: 1400, attempts: 100, correct: 90 },
      ]),
    );
    const better = predictScore('sat', strong);
    expect(better.score).toBeGreaterThan(base.score);
    expect(better.high - better.low).toBeLessThan(base.high - base.low);
  });

  it('ACT composite excludes science', () => {
    const sciOnly = { 'act.sci.iod': { rating: 1600, attempts: 0, correct: 0 } };
    expect(predictScore('act', sciOnly).score).toBe(predictScore('act', {}).score);
  });
});
