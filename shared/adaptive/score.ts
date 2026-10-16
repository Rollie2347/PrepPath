import { getTest, type Section } from '../taxonomy';
import type { Difficulty, TestId } from '../types';
import { pCorrect, questionRating, type SkillMastery, START_RATING } from './elo';

const DIFFICULTIES: Difficulty[] = [1, 2, 3, 4, 5];

/** Expected share correct on a section with an even spread of difficulties. */
export function expectedSectionAccuracy(section: Section, mastery: Record<string, SkillMastery>): number {
  const totalWeight = section.domains.reduce((s, d) => s + d.weight, 0);
  let acc = 0;
  for (const domain of section.domains) {
    const skillP =
      domain.skills.reduce((s, k) => {
        const r = mastery[k.id]?.rating ?? START_RATING;
        return s + DIFFICULTIES.reduce((x, d) => x + pCorrect(r, questionRating(d)), 0) / DIFFICULTIES.length;
      }, 0) / domain.skills.length;
    acc += (domain.weight / totalWeight) * skillP;
  }
  return acc;
}

export interface ScoreEstimate {
  score: number;
  low: number;
  high: number;
  sections: Record<string, number>;
}

/**
 * Rough predicted score. This is a linear map from expected accuracy onto the test scale,
 * NOT an official concordance; the UI must present it as an estimate range. The range
 * narrows as the user answers more questions in the test.
 */
export function predictScore(test: TestId, mastery: Record<string, SkillMastery>): ScoreEstimate {
  const spec = getTest(test);
  const scored = spec.sections.filter((s) =>
    spec.compositeSections ? spec.compositeSections.includes(s.id) : !s.optional,
  );
  const sections: Record<string, number> = {};
  let attempts = 0;
  for (const s of spec.sections) {
    const lo = spec.scale.sectionMin ?? spec.scale.min;
    const hi = spec.scale.sectionMax ?? spec.scale.max;
    sections[s.id] = lo + expectedSectionAccuracy(s, mastery) * (hi - lo);
    for (const d of s.domains) for (const k of d.skills) attempts += mastery[k.id]?.attempts ?? 0;
  }

  let score: number;
  let halfWidth: number;
  if (test === 'sat') {
    score = round(scored.reduce((sum, s) => sum + sections[s.id], 0), 10);
    halfWidth = round(Math.max(40, 150 / Math.sqrt(1 + attempts / 25)), 10);
  } else {
    score = Math.round(scored.reduce((sum, s) => sum + sections[s.id], 0) / scored.length);
    halfWidth = Math.max(1, Math.round(4 / Math.sqrt(1 + attempts / 25)));
  }
  for (const id of Object.keys(sections)) sections[id] = test === 'sat' ? round(sections[id], 10) : Math.round(sections[id]);

  return {
    score,
    low: Math.max(spec.scale.min, score - halfWidth),
    high: Math.min(spec.scale.max, score + halfWidth),
    sections,
  };
}

function round(n: number, step: number) {
  return Math.round(n / step) * step;
}
