import type { DiagnosticResult } from './adaptive/diagnostic';
import type { SkillMastery } from './adaptive/elo';
import type { NodeProgress } from './progression/path';
import type { Streak } from './progression/streak';
import type { TestId } from './types';

/** users/{uid}. Fields under `game` are written only by Cloud Functions. */
export interface UserDoc {
  displayName: string;
  avatar: string;
  tests: TestId[];
  /** Path currently shown on the Learn tab. */
  activeTest: TestId;
  goals: Partial<Record<TestId, { testDate: string | null; current: number | null; target: number }>>;
  dailyXpGoal: number;
  timezoneOffsetMin: number;
  onboarded: boolean;
  /** League members this user reported or blocked; hidden from their leaderboard. */
  blocked?: string[];
  game: {
    xp: number;
    gems: number;
    streak: Streak;
    leagueTier: number;
    leagueCohort: string | null;
    xpBoostUntil: number | null;
    todayXp: { day: string; xp: number };
  };
}

/** users/{uid}/state/progress — one doc so the path renders from a single read. */
export interface ProgressDoc {
  nodes: Record<string, NodeProgress>;
  mastery: Record<string, SkillMastery>;
  bookmarks: string[];
  /** Question ids missed and not yet answered correctly since. */
  mistakes: string[];
  recent: string[];
  /** Onboarding diagnostic per test, written by completeDiagnostic. */
  diagnostic?: Partial<Record<TestId, DiagnosticResult>>;
}

export const AVATARS = ['🦊', '🐼', '🦉', '🐯', '🐸', '🐙', '🦄', '🐧', '🦁', '🐨', '🐢', '🦖'];

export const DAILY_GOALS = [
  { xp: 20, label: 'Casual' },
  { xp: 50, label: 'Regular' },
  { xp: 100, label: 'Serious' },
  { xp: 150, label: 'Intense' },
];
