import { applyCheckpoint, buildPath, isUnlocked } from '../progression/path';
import { advanceQuests, questsFor } from '../progression/quests';

describe('quests', () => {
  it('gives 3 distinct-kind quests, stable per user/day', () => {
    const a = questsFor('uid1', '2026-10-15');
    expect(a).toHaveLength(3);
    expect(new Set(a.map((q) => q.kind)).size).toBe(3);
    expect(questsFor('uid1', '2026-10-15')).toEqual(a);
  });

  it('advances and completes once', () => {
    const states = [
      { id: 'xp30', kind: 'earnXp' as const, target: 30, title: '', gems: 10, progress: 20, done: false },
      { id: 'combo5', kind: 'combo' as const, target: 5, title: '', gems: 10, progress: 0, done: false },
    ];
    const r1 = advanceQuests(states, { xp: 15, perfect: false, bestRun: 3, correct: 8 });
    expect(r1.completed.map((q) => q.id)).toEqual(['xp30']);
    expect(r1.states[1].progress).toBe(3);
    const r2 = advanceQuests(r1.states, { xp: 15, perfect: false, bestRun: 6, correct: 8 });
    expect(r2.completed.map((q) => q.id)).toEqual(['combo5']);
  });
});

describe('isUnlocked', () => {
  const units = buildPath('sat');
  it('opens up to the current node plus the current unit checkpoint', () => {
    expect(isUnlocked(units, {}, units[0].nodes[0].id)).toBe(true);
    expect(isUnlocked(units, {}, units[0].nodes[1].id)).toBe(false);
    expect(isUnlocked(units, {}, units[0].nodes.at(-1)!.id)).toBe(true);
    expect(isUnlocked(units, {}, units[1].nodes.at(-1)!.id)).toBe(false);
  });

  it('unlocks the next unit after a checkpoint', () => {
    const p = applyCheckpoint(units[0], {});
    expect(isUnlocked(units, p, units[1].nodes[0].id)).toBe(true);
  });
});
