import { allSkills, getTest, type Section } from '../taxonomy';
import type { Difficulty, Question, TestId } from '../types';
import { pCorrect, questionRating, type SkillMastery, START_RATING, updateMastery } from './elo';

/**
 * Onboarding diagnostic. SAT mirrors its two-stage routing at small scale: per section a
 * routing block across every domain, then an easier or harder block chosen from the first
 * block's ability estimate. ACT is linear (the real ACT is not adaptive). Every number here is
 * a design choice (inference), not College Board or ACT data, so they are kept tunable.
 */
export const DIAGNOSTIC = {
  routingItems: 10,
  routedItems: 10,
  /** ACT: one linear block per section. */
  linearItems: 10,
  /** Ability at or above this routes to the harder block: the scale midpoint (difficulty 3). */
  routeCut: START_RATING,
  /** Domain estimate needed to place out of a unit: a difficulty-4 question's rating. */
  placeRating: questionRating(4),
  /** Domain items needed before placement is allowed. */
  minItemsToPlace: 2,
  /** MAP prior on section ability (Elo points). Keeps all-right / all-wrong estimates finite. */
  sectionPriorSd: 200,
  /** Domain estimates shrink toward the section estimate with this prior. */
  domainPriorSd: 150,
  /** Weakest domains shown as focus areas. */
  focusCount: 3,
} as const;

/** Share of easy (1–2) / medium (3) / hard (4–5) items per block. */
export type Mix = { easy: number; medium: number; hard: number };
export const MIX: Record<'routing' | 'harder' | 'easier', Mix> = {
  routing: { easy: 1 / 3, medium: 1 / 3, hard: 1 / 3 },
  harder: { easy: 0.2, medium: 0.35, hard: 0.45 },
  easier: { easy: 0.45, medium: 0.35, hard: 0.2 },
};

type Band = keyof Mix;
const BANDS: Band[] = ['easy', 'medium', 'hard'];
const bandOf = (d: Difficulty): Band => (d <= 2 ? 'easy' : d === 3 ? 'medium' : 'hard');

export interface DiagnosticBlock {
  sectionId: string;
  stage: 'routing' | 'routed' | 'linear';
}

/** Block plan before routing: SAT gets routing blocks (routed blocks are added after each), ACT linear. */
export function diagnosticPlan(test: TestId): DiagnosticBlock[] {
  return getTest(test).sections.map((s) => ({ sectionId: s.id, stage: test === 'sat' ? 'routing' : 'linear' }));
}

/** Largest-remainder split of n across weights, ≥1 each when n allows. */
function apportion(n: number, weights: number[]): number[] {
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  const floors = n >= weights.length ? weights.map(() => 1) : weights.map(() => 0);
  const left = n - floors.reduce((a, b) => a + b, 0);
  const raw = weights.map((w) => (w / total) * left);
  const out = floors.map((f, i) => f + Math.floor(raw[i]));
  const order = raw.map((r, i) => [r - Math.floor(r), i] as const).sort((a, b) => b[0] - a[0]);
  for (let k = 0; out.reduce((a, b) => a + b, 0) < n; k++) out[order[k % order.length][1]]++;
  return out;
}

/**
 * Picks a block for one section: items spread across domains by blueprint weight (domains with
 * no questions are skipped), difficulty by `mix`, skills varied, then ordered easy → hard
 * (SAT RW also in its module domain order).
 */
export function pickBlock(
  pool: Question[],
  section: Section,
  n: number,
  mix: Mix,
  exclude: Set<string> = new Set(),
  rng: () => number = Math.random,
): Question[] {
  const domains = section.domains
    .map((d) => ({ d, qs: shuffle(pool.filter((q) => !exclude.has(q.id) && d.skills.some((k) => k.id === q.skillId)), rng) }))
    .filter((x) => x.qs.length > 0);
  if (!domains.length) return [];
  const quotas = apportion(n, domains.map((x) => x.d.weight));
  const picked: Question[] = [];
  const leftovers: Question[] = [];
  domains.forEach(({ qs }, i) => {
    const bands = apportion(quotas[i], BANDS.map((b) => mix[b]));
    const slots = BANDS.flatMap((b, j) => Array<Band>(bands[j]).fill(b));
    const usedSkills = new Map<string, number>();
    const left = qs.slice();
    for (const band of slots) {
      if (!left.length) break;
      const dist = (q: Question) => Math.abs(BANDS.indexOf(bandOf(q.difficulty)) - BANDS.indexOf(band));
      // Nearest band first, then least-used skill so a domain's items cover its skills.
      left.sort((a, b) => dist(a) - dist(b) || (usedSkills.get(a.skillId) ?? 0) - (usedSkills.get(b.skillId) ?? 0));
      const q = left.shift()!;
      usedSkills.set(q.skillId, (usedSkills.get(q.skillId) ?? 0) + 1);
      picked.push(q);
    }
    leftovers.push(...left);
  });
  // A domain with too few questions hands its slots to the others.
  picked.push(...shuffle(leftovers, rng).slice(0, Math.max(0, n - picked.length)));
  const domainRank = (q: Question) => {
    const id = section.domains.find((d) => d.skills.some((k) => k.id === q.skillId))!.id;
    return section.moduleOrder ? section.moduleOrder.indexOf(id) : 0;
  };
  return picked.sort((a, b) => domainRank(a) - domainRank(b) || a.difficulty - b.difficulty);
}

export interface GradedItem {
  skillId: string;
  difficulty: Difficulty;
  correct: boolean;
}

/** MAP Elo-scale ability under the same logistic model lessons use, with a normal prior. */
export function estimateRating(items: GradedItem[], priorMean: number = START_RATING, priorSd: number = DIAGNOSTIC.sectionPriorSd): number {
  let best = priorMean;
  let bestLp = -Infinity;
  for (let r = 300; r <= 1700; r += 5) {
    let lp = -((r - priorMean) ** 2) / (2 * priorSd ** 2);
    for (const it of items) {
      const p = pCorrect(r, questionRating(it.difficulty));
      lp += Math.log(it.correct ? p : 1 - p);
    }
    if (lp > bestLp) [best, bestLp] = [r, lp];
  }
  return best;
}

/** Mix for a section's second block from its routing-block answers. */
export function routeMix(routing: GradedItem[]): Mix {
  return estimateRating(routing) >= DIAGNOSTIC.routeCut ? MIX.harder : MIX.easier;
}

export interface DomainResult {
  rating: number;
  items: number;
  correct: number;
}
export interface DiagnosticResult {
  at: number;
  /** Always true: ~20 items per section only place coarsely; checkpoints correct it later. */
  provisional: true;
  sections: Record<string, { rating: number; items: number }>;
  domains: Record<string, DomainResult>;
  /** Unit (domain) ids placed out of. */
  placedUnits: string[];
  /** Weakest domains first. */
  focus: string[];
}

/** Section and domain estimates, placement and focus areas from a finished diagnostic. */
export function scoreDiagnostic(test: TestId, graded: GradedItem[], at: number): DiagnosticResult {
  const skills = new Map(allSkills(test).map((k) => [k.id, k]));
  const sections: DiagnosticResult['sections'] = {};
  const domains: DiagnosticResult['domains'] = {};
  for (const s of getTest(test).sections) {
    const inSection = graded.filter((g) => skills.get(g.skillId)?.sectionId === s.id);
    if (!inSection.length) continue;
    const sectionRating = estimateRating(inSection);
    sections[s.id] = { rating: sectionRating, items: inSection.length };
    for (const d of s.domains) {
      const inDomain = inSection.filter((g) => skills.get(g.skillId)?.domainId === d.id);
      if (!inDomain.length) continue;
      domains[d.id] = {
        rating: estimateRating(inDomain, sectionRating, DIAGNOSTIC.domainPriorSd),
        items: inDomain.length,
        correct: inDomain.filter((g) => g.correct).length,
      };
    }
  }
  const placedUnits = Object.entries(domains)
    .filter(([, r]) => r.items >= DIAGNOSTIC.minItemsToPlace && r.rating >= DIAGNOSTIC.placeRating)
    .map(([id]) => id);
  const focus = Object.entries(domains)
    .filter(([id]) => !placedUnits.includes(id))
    .sort((a, b) => a[1].rating - b[1].rating)
    .slice(0, DIAGNOSTIC.focusCount)
    .map(([id]) => id);
  return { at, provisional: true, sections, domains, placedUnits, focus };
}

/**
 * Mastery after the diagnostic. Untouched skills in a tested domain start at the domain
 * estimate (with 0 attempts, so lessons still move them fast); skills that already have lesson
 * history keep it and just take the diagnostic answers as ordinary updates.
 */
export function seedMastery(
  test: TestId,
  result: DiagnosticResult,
  graded: GradedItem[],
  mastery: Record<string, SkillMastery>,
): Record<string, SkillMastery> {
  const next = { ...mastery };
  for (const k of allSkills(test)) {
    const dom = result.domains[k.domainId];
    if (!dom) continue;
    const mine = graded.filter((g) => g.skillId === k.id);
    const prev = next[k.id];
    if (prev && prev.attempts > 0) {
      next[k.id] = mine.reduce((m, g) => updateMastery(m, g.difficulty, g.correct), prev);
    } else {
      next[k.id] = { rating: dom.rating, attempts: mine.length, correct: mine.filter((g) => g.correct).length };
    }
  }
  return next;
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
