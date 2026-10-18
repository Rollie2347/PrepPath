import { buildPath, findNode, LEGENDARY_QUESTIONS, legendarySeconds } from '../progression/path';
import { allSkills, secondsPerQuestion, sectionOfSkill, TESTS } from '../taxonomy';

describe('taxonomy', () => {
  it('domain weights sum to 1 and scored counts fit the domain ranges', () => {
    for (const s of TESTS.flatMap((t) => t.sections)) {
      expect(s.domains.reduce((a, d) => a + d.weight, 0)).toBeCloseTo(1, 6);
      const lo = s.domains.reduce((a, d) => a + d.questions![0], 0);
      const hi = s.domains.reduce((a, d) => a + d.questions![1], 0);
      expect(s.scored).toBeGreaterThanOrEqual(lo);
      expect(s.scored).toBeLessThanOrEqual(hi);
      expect(s.scored).toBeLessThanOrEqual(s.questions);
    }
  });

  it('has unique skill ids and no skill id equal to its domain id', () => {
    const ids = allSkills().map((k) => k.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const k of allSkills()) expect(k.id).not.toBe(k.domainId);
  });

  it('keeps the SAT RW module order to the four RW domains', () => {
    const rw = TESTS.find((t) => t.id === 'sat')!.sections.find((s) => s.id === 'sat.rw')!;
    expect([...rw.moduleOrder!].sort()).toEqual(rw.domains.map((d) => d.id).sort());
  });

  it('derives real-test pace per section', () => {
    expect(secondsPerQuestion('act.eng')).toBe(42);
    expect(secondsPerQuestion('sat.math')).toBeCloseTo(95.45, 1);
    expect(sectionOfSkill('sat.math.alg.lin1')?.id).toBe('sat.math');
    expect(sectionOfSkill('nope')).toBeNull();
  });
});

describe('legendarySeconds', () => {
  it('uses the node section pace', () => {
    const node = (test: 'sat' | 'act', id: string) => findNode(buildPath(test), id)!.node;
    expect(legendarySeconds(node('act', 'act.eng.cse.punct'))).toBe(LEGENDARY_QUESTIONS * 42);
    expect(legendarySeconds(node('sat', 'sat.math.alg.lin1'))).toBe(Math.ceil(LEGENDARY_QUESTIONS * (70 * 60) / 44));
  });
});
