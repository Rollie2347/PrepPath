import raw from '../content/taxonomy.json';

import type { TestId } from './types';

export interface Skill {
  id: string;
  name: string;
}
export interface Domain {
  id: string;
  name: string;
  weight: number;
  questions?: number[];
  skills: Skill[];
}
export interface Section {
  id: string;
  name: string;
  questions: number;
  minutes: number;
  modules?: number;
  optional?: boolean;
  domains: Domain[];
}
export interface TestSpec {
  id: TestId;
  name: string;
  scale: { min: number; max: number; sectionMin?: number; sectionMax?: number };
  compositeSections?: string[];
  sections: Section[];
}

export const TESTS = raw.tests as TestSpec[];

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
