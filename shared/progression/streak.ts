/** Local calendar day, "YYYY-MM-DD". Always computed on the user's device timezone. */
export type DayKey = string;

export interface Streak {
  count: number;
  /** Last day the daily goal was met (or covered by a freeze). */
  lastDay: DayKey | null;
  freezes: number;
  longest: number;
}

export const MAX_FREEZES = 2;
export const STREAK_MILESTONES = [3, 7, 14, 30, 50, 100, 150, 200, 365];

export function newStreak(): Streak {
  return { count: 0, lastDay: null, freezes: 0, longest: 0 };
}

export function dayKey(d: Date): DayKey {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function daysBetween(a: DayKey, b: DayKey): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
}

/**
 * Settles missed days before `today`: each missed day burns a freeze; once freezes run out
 * the streak resets. Call on app open and before crediting today's goal.
 */
export function settle(s: Streak, today: DayKey): { streak: Streak; freezesUsed: number; lost: boolean } {
  if (!s.lastDay) return { streak: s, freezesUsed: 0, lost: false };
  const missed = daysBetween(s.lastDay, today) - 1;
  if (missed <= 0) return { streak: s, freezesUsed: 0, lost: false };
  if (missed <= s.freezes) {
    // Freezes keep the streak alive but don't add to it.
    const covered = shiftDay(s.lastDay, missed);
    return { streak: { ...s, freezes: s.freezes - missed, lastDay: covered }, freezesUsed: missed, lost: false };
  }
  return { streak: { ...s, count: 0, freezes: 0, lastDay: null }, freezesUsed: s.freezes, lost: s.count > 0 };
}

/** Credits today once the daily XP goal is met. Idempotent within a day. */
export function creditGoal(s: Streak, today: DayKey): { streak: Streak; milestone: number | null } {
  const settled = settle(s, today).streak;
  if (settled.lastDay === today) return { streak: settled, milestone: null };
  const count = settled.count + 1;
  return {
    streak: { ...settled, count, lastDay: today, longest: Math.max(settled.longest, count) },
    milestone: STREAK_MILESTONES.includes(count) ? count : null,
  };
}

export function addFreeze(s: Streak): Streak {
  return { ...s, freezes: Math.min(MAX_FREEZES, s.freezes + 1) };
}

function shiftDay(day: DayKey, n: number): DayKey {
  const [y, m, d] = day.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}
