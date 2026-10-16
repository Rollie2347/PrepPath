export type TestId = 'sat' | 'act';

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export type ReviewStatus = 'draft' | 'verified' | 'approved' | 'rejected';

export interface Question {
  id: string;
  test: TestId;
  sectionId: string;
  skillId: string;
  /** Cross-cutting tags, e.g. ACT "act.math.modeling". */
  tags?: string[];
  difficulty: Difficulty;
  /** Optional passage / table / figure shown above the stem. Markdown + KaTeX ($...$). */
  stimulus?: string;
  stem: string;
  /** Multiple choice. Omitted for SAT student-produced response (grid-in). */
  choices?: string[];
  /** Index into choices for MC; accepted string forms for grid-in. */
  answer: number | string[];
  explanation: string;
  source: { kind: 'generated' | 'open'; name: string; license: string; url?: string };
  reviewStatus: ReviewStatus;
}

export interface Attempt {
  questionId: string;
  skillId: string;
  difficulty: Difficulty;
  correct: boolean;
  timeMs: number;
  at: number;
}
