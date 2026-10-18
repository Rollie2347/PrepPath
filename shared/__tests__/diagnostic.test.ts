import { DIAGNOSTIC, estimateRating, MIX, pickBlock, routeMix, scoreDiagnostic, seedMastery } from '../adaptive/diagnostic';
import { START_RATING } from '../adaptive/elo';
import { getSection } from '../taxonomy';
import type { Difficulty, Question } from '../types';

const q = (id: string, skillId: string, difficulty: Difficulty, sectionId = 'sat.math'): Question => ({
  id,
  test: 'sat',
  sectionId,
  skillId,
  difficulty,
  stem: '',
  choices: ['a', 'b', 'c', 'd'],
  answer: 0,
  explanation: '',
  source: { kind: 'generated', name: 'test', license: 'n/a' },
  reviewStatus: 'approved',
});

const MATH_SKILLS = ['sat.math.alg.lin1', 'sat.math.alg.systems', 'sat.math.adv.equiv', 'sat.math.psda.percent', 'sat.math.geo.circles'];
const pool = MATH_SKILLS.flatMap((s) => ([1, 2, 3, 4, 5] as Difficulty[]).flatMap((d) => [q(`${s}-${d}a`, s, d), q(`${s}-${d}b`, s, d)]));

describe('estimateRating', () => {
  it('sits at the prior with no data and moves with answers', () => {
    expect(estimateRating([])).toBe(START_RATING);
    const right = estimateRating(Array(8).fill({ skillId: 's', difficulty: 3, correct: true }));
    const wrong = estimateRating(Array(8).fill({ skillId: 's', difficulty: 3, correct: false }));
    expect(right).toBeGreaterThan(START_RATING + 100);
    expect(wrong).toBeLessThan(START_RATING - 100);
    expect(Number.isFinite(right)).toBe(true);
  });
});

describe('pickBlock', () => {
  const math = getSection('sat.math');
  it('covers every domain with items, follows the mix, and sorts easy to hard', () => {
    const block = pickBlock(pool, math, 10, MIX.routing, new Set(), () => 0.5);
    expect(block).toHaveLength(10);
    const domains = new Set(block.map((x) => x.skillId.split('.').slice(0, 3).join('.')));
    expect(domains).toEqual(new Set(['sat.math.alg', 'sat.math.adv', 'sat.math.psda', 'sat.math.geo']));
    expect(block.map((x) => x.difficulty)).toEqual([...block.map((x) => x.difficulty)].sort((a, b) => a - b));
    const hard = pickBlock(pool, math, 10, MIX.harder, new Set(), () => 0.5);
    const easy = pickBlock(pool, math, 10, MIX.easier, new Set(), () => 0.5);
    const avg = (b: Question[]) => b.reduce((s, x) => s + x.difficulty, 0) / b.length;
    expect(avg(hard)).toBeGreaterThan(avg(easy));
  });

  it('tops up from other domains and respects exclusions', () => {
    const algOnly = pool.filter((x) => x.skillId.startsWith('sat.math.alg'));
    const block = pickBlock(algOnly, math, 10, MIX.routing, new Set([algOnly[0].id]));
    expect(block).toHaveLength(10);
    expect(block.some((x) => x.id === algOnly[0].id)).toBe(false);
    expect(pickBlock([], math, 10, MIX.routing)).toEqual([]);
  });
});

describe('routing and scoring', () => {
  it('routes strong routing blocks to the harder mix', () => {
    expect(routeMix(Array(10).fill({ skillId: 's', difficulty: 3, correct: true }))).toBe(MIX.harder);
    expect(routeMix(Array(10).fill({ skillId: 's', difficulty: 3, correct: false }))).toBe(MIX.easier);
  });

  it('places strong domains, lists weak ones as focus, and seeds mastery', () => {
    const graded = [
      ...Array(6).fill({ skillId: 'sat.math.alg.lin1', difficulty: 4, correct: true }),
      ...Array(4).fill({ skillId: 'sat.math.adv.equiv', difficulty: 2, correct: false }),
    ];
    const r = scoreDiagnostic('sat', graded, 1);
    expect(r.placedUnits).toContain('sat.math.alg');
    expect(r.focus[0]).toBe('sat.math.adv');
    expect(r.sections['sat.rw']).toBeUndefined();
    expect(r.domains['sat.math.alg'].rating).toBeGreaterThanOrEqual(DIAGNOSTIC.placeRating);

    const m = seedMastery('sat', r, graded, { 'sat.math.adv.nonlinfn': { rating: 1234, attempts: 5, correct: 4 } });
    expect(m['sat.math.alg.lin2'].rating).toBe(r.domains['sat.math.alg'].rating);
    expect(m['sat.math.alg.lin2'].attempts).toBe(0);
    expect(m['sat.math.alg.lin1'].attempts).toBe(6);
    expect(m['sat.math.adv.nonlinfn'].rating).toBe(1234); // lesson history kept, no diagnostic items for it
    expect(m['sat.rw.ii.central']).toBeUndefined();
  });
});
