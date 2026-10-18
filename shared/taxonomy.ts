import raw from '../content/taxonomy.json';

import type { TestId } from './types';

/** Official sub-skill (e.g. SAT Appendix B convention subskills), stored in `Question.tags`. */
export interface Tag {
  id: string;
  name: string;
}
export interface Skill {
  id: string;
  name: string;
  tags?: Tag[];
  /** Passage formats this skill is limited to (ACT Science models subskills: Conflicting Viewpoints only). */
  formats?: string[];
}
export interface Domain {
  id: string;
  name: string;
  weight: number;
  /** Scored-item range per form. */
  questions?: [number, number];
  /** Per-form item-format ranges, e.g. SAT Math `{ spr: [3, 4] }`. */
  formatMix?: Record<string, [number, number]>;
  skills: Skill[];
}
export interface PassageFormat {
  id: string;
  name: string;
  /** Share of scored items. */
  share: [number, number];
}
export interface Section {
  id: string;
  name: string;
  /** Total items including pretest / field-test items (drives timing). */
  questions: number;
  /** Scored (operational) items. */
  scored: number;
  minutes: number;
  modules?: number;
  optional?: boolean;
  /** Target share of items set in a real-world context. */
  inContext?: number;
  /** Domain order within a module (SAT RW). */
  moduleOrder?: string[];
  crossTags?: string[];
  formats?: PassageFormat[];
  notes?: string;
  domains: Domain[];
}
export interface TestSpec {
  id: TestId;
  name: string;
  scale: { min: number; max: number; sectionMin?: number; sectionMax?: number };
  compositeSections?: string[];
  sections: Section[];
}

export const TESTS = raw.tests as unknown as TestSpec[];

export function getTest(id: TestId): TestSpec {
  const t = TESTS.find((x) => x.id === id);
  if (!t) throw new Error(`Unknown test ${id}`);
  return t;
}

export function allSkills(test?: TestId): (Skill & { test: TestId; sectionId: string; domainId: string })[] {
  return TESTS.filter((t) => !test || t.id === test).flatMap((t) =>
    t.sections.flatMap((s) =>
      s.domains.flatMap((d) => d.skills.map((k) => ({ ...k, test: t.id, sectionId: s.id, domainId: d.id }))),
    ),
  );
}

export function getSection(sectionId: string): Section {
  for (const t of TESTS) for (const s of t.sections) if (s.id === sectionId) return s;
  throw new Error(`Unknown section ${sectionId}`);
}

/** Section that owns a skill, or null for an unknown id. */
export function sectionOfSkill(skillId: string): Section | null {
  for (const t of TESTS) for (const s of t.sections) if (s.domains.some((d) => d.skills.some((k) => k.id === skillId))) return s;
  return null;
}

/** Real-test pace: section minutes ÷ total items (SAT RW ≈71 s, SAT Math ≈95 s, ACT English 42 s). */
export function secondsPerQuestion(sectionId: string): number {
  const s = getSection(sectionId);
  return (s.minutes * 60) / s.questions;
}
