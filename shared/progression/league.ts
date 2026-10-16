export const TIERS = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond', 'Legend'] as const;
export type Tier = number; // index into TIERS

export const COHORT_SIZE = 30;
export const PROMOTE = 7;
export const DEMOTE = 5;

export interface Member {
  uid: string;
  weeklyXp: number;
}

export type Outcome = 'promote' | 'stay' | 'demote';

/**
 * End-of-week result for one cohort. Users with 0 XP never promote. Ties keep whoever
 * reached the XP first, so `members` must be ordered by time of last XP gain ascending
 * before sorting (stable sort preserves that order).
 */
export function settleCohort(members: Member[], tier: Tier): Map<string, Outcome> {
  const ranked = members.slice().sort((a, b) => b.weeklyXp - a.weeklyXp);
  const out = new Map<string, Outcome>();
  const top = tier < TIERS.length - 1;
  const bottom = tier > 0;
  ranked.forEach((m, i) => {
    if (top && i < PROMOTE && m.weeklyXp > 0) out.set(m.uid, 'promote');
    else if (bottom && (i >= ranked.length - DEMOTE || m.weeklyXp === 0)) out.set(m.uid, 'demote');
    else out.set(m.uid, 'stay');
  });
  return out;
}

export function nextTier(tier: Tier, o: Outcome): Tier {
  if (o === 'promote') return Math.min(TIERS.length - 1, tier + 1);
  if (o === 'demote') return Math.max(0, tier - 1);
  return tier;
}

/** ISO week id, e.g. "2026-W42". Leagues run Monday 00:00 UTC to Sunday. */
export function weekId(d: Date): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}
