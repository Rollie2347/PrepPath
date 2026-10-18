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
  /**
   * MC: index into choices. SPR: every correct value as an integer, a/b or terminating decimal
   * (one per distinct right answer; equivalent forms are accepted by the grader).
   */
  answer: number | string[];
  /** Why each wrong choice is tempting, as an error code from the skill pattern spec. */
  distractors?: { index: number; errorType: string }[];
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
