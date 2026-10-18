import { settleCohort, nextTier, weekId, TIERS } from '../progression/league';
import { applyCheckpoint, buildPath, currentNode, isUnlocked } from '../progression/path';
import { addFreeze, creditGoal, newStreak, settle } from '../progression/streak';
import { lessonXp, XP } from '../progression/xp';

describe('lessonXp', () => {
  it('awards completion, perfect and combo bonuses', () => {
    const answers = Array.from({ length: 10 }, () => ({ difficulty: 3 as const, correct: true }));
    const r = lessonXp({ kind: 'lesson', answers, passed: true });
    expect(r.answers).toBe(30);
    expect(r.combo).toBe(2 * XP.comboBonus);
    expect(r.perfect).toBe(XP.perfectLesson);
    expect(r.total).toBe(30 + XP.lessonComplete + XP.perfectLesson + 2 * XP.comboBonus);
  });

  it('a miss breaks the combo and the perfect bonus', () => {
    const answers = [true, true, true, true, false, true, true, true, true, true].map((correct) => ({
      difficulty: 1 as const,
      correct,
    }));
    const r = lessonXp({ kind: 'lesson', answers, passed: true });
    expect(r.combo).toBe(XP.comboBonus);
    expect(r.perfect).toBe(0);
  });

  it('failed legendary gets answer XP only; boost doubles', () => {
    const answers = [{ difficulty: 5 as const, correct: true }];
    expect(lessonXp({ kind: 'legendary', answers, passed: false }).completion).toBe(0);
    const boosted = lessonXp({ kind: 'lesson', answers, passed: true, boosted: true });
    expect(boosted.total).toBe(2 * (4 + XP.lessonComplete + XP.perfectLesson));
  });
});

describe('streak', () => {
  it('counts consecutive days once per day', () => {
    let s = newStreak();
    s = creditGoal(s, '2026-10-13').streak;
    s = creditGoal(s, '2026-10-13').streak;
    s = creditGoal(s, '2026-10-14').streak;
    expect(s.count).toBe(2);
  });

  it('freezes cover missed days; running out resets', () => {
    let s = addFreeze(creditGoal(newStreak(), '2026-10-10').streak);
    const kept = settle(s, '2026-10-12');
    expect(kept.freezesUsed).toBe(1);
    expect(kept.streak.count).toBe(1);
    expect(creditGoal(s, '2026-10-12').streak.count).toBe(2);

    s = creditGoal(newStreak(), '2026-10-10').streak;
    const lost = settle(s, '2026-10-13');
    expect(lost.lost).toBe(true);
    expect(lost.streak.count).toBe(0);
  });

  it('crosses month boundaries', () => {
    let s = creditGoal(newStreak(), '2026-10-31').streak;
    s = creditGoal(s, '2026-11-01').streak;
    expect(s.count).toBe(2);
  });

  it('reports milestones', () => {
    let s = newStreak();
    let milestone: number | null = null;
    for (let d = 1; d <= 7; d++) ({ streak: s, milestone } = creditGoal(s, `2026-10-0${d}`));
    expect(milestone).toBe(7);
  });
});

describe('league', () => {
  const members = Array.from({ length: 30 }, (_, i) => ({ uid: `u${i}`, weeklyXp: 300 - i * 10 }));

  it('promotes top 7 and demotes bottom 5', () => {
    const out = settleCohort(members, 2);
    expect([...out.values()].filter((o) => o === 'promote')).toHaveLength(7);
    expect([...out.values()].filter((o) => o === 'demote')).toHaveLength(5);
    expect(out.get('u0')).toBe('promote');
    expect(out.get('u29')).toBe('demote');
  });

  it('no demotion from the bottom tier, no promotion from the top', () => {
    expect([...settleCohort(members, 0).values()]).not.toContain('demote');
    expect([...settleCohort(members, TIERS.length - 1).values()]).not.toContain('promote');
    expect(nextTier(TIERS.length - 1, 'promote')).toBe(TIERS.length - 1);
  });

  it('zero-XP members never promote', () => {
    const idle = [{ uid: 'a', weeklyXp: 0 }];
    expect(settleCohort(idle, 1).get('a')).toBe('demote');
  });

  it('ISO week ids', () => {
    expect(weekId(new Date(Date.UTC(2026, 9, 14)))).toBe('2026-W42');
    expect(weekId(new Date(Date.UTC(2027, 0, 1)))).toBe('2026-W53');
  });
});

describe('path', () => {
  it('covers every SAT skill and ends domain units with checkpoints', () => {
    const units = buildPath('sat').filter((u) => !u.opensWith);
    expect(units).toHaveLength(8);
    const skills = units.flatMap((u) => u.nodes.filter((n) => n.kind === 'skill'));
    expect(skills).toHaveLength(30); // 11 R&W + 19 Math testing points
    for (const u of units) expect(u.nodes.at(-1)?.kind).toBe('checkpoint');
    // Sections interleave: R&W unit, then Math unit.
    expect(units[0].sectionName).toBe('Reading and Writing');
    expect(units[1].sectionName).toBe('Math');
  });

  it('checkpoint jumps the start node past the unit', () => {
    const units = buildPath('act');
    const first = currentNode(units, {});
    expect(first).toBe(units[0].nodes[0].id);
    const after = applyCheckpoint(units[0], {});
    expect(currentNode(units, after)).toBe(units[1].nodes[0].id);
  });
});

describe('strategy units', () => {
  const units = buildPath('sat');
  const calc = units.find((u) => u.id === 'sat.calc')!;

  it('sit right after Algebra and never become the current node', () => {
    expect(units[units.indexOf(calc) - 1].id).toBe('sat.math.alg');
    expect(calc.nodes.every((n) => n.optional)).toBe(true);
    const allBeforeDone = Object.fromEntries(
      units.slice(0, units.indexOf(calc)).flatMap((u) => u.nodes).map((n) => [n.id, { level: 4, legendary: false }]),
    );
    expect(currentNode(units, allBeforeDone)).toBe(units[units.indexOf(calc) + 1].nodes[0].id);
  });

  it('unlock once the Algebra unit opens, without locking later progress', () => {
    expect(isUnlocked(units, {}, calc.nodes[0].id)).toBe(false);
    const p = applyCheckpoint(units[0], {});
    expect(isUnlocked(units, p, calc.nodes[0].id)).toBe(true);
  });

  it('draw only on skills that exist', () => {
    const real = new Set(buildPath('sat').concat(buildPath('act')).flatMap((u) => u.nodes.filter((n) => !n.optional).flatMap((n) => n.skillIds)));
    for (const t of ['sat', 'act'] as const)
      for (const u of buildPath(t).filter((x) => x.opensWith)) for (const n of u.nodes) for (const k of n.skillIds) expect(real.has(k)).toBe(true);
  });
});
