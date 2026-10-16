import type { XpBreakdown } from './progression/xp';
import type { Difficulty, TestId } from './types';

/** Contracts for Cloud Functions callables, shared by app and functions. */

export interface InitUserRequest {
  displayName: string;
  avatar: string;
  tests: TestId[];
  activeTest: TestId;
  goals: Partial<Record<TestId, { testDate: string | null; current: number | null; target: number }>>;
  dailyXpGoal: number;
  timezoneOffsetMin: number;
  /** Diagnostic placement: units the user tested out of. */
  placedUnits: Record<TestId, string[]>;
}

export interface CompleteLessonRequest {
  test: TestId;
  nodeId: string;
  kind: 'lesson' | 'legendary' | 'checkpoint' | 'practice';
  answers: { questionId: string; response: number | string; timeMs: number }[];
  /** Device-local day, used for streak/day boundaries. */
  localDay: string;
}

export interface CompleteLessonResponse {
  xp: XpBreakdown;
  passed: boolean;
  newLevel: number | null;
  streak: { count: number; milestone: number | null; extended: boolean };
  questsCompleted: string[];
  gemsEarned: number;
  graded: { questionId: string; correct: boolean; difficulty: Difficulty }[];
}

export interface OpenChestResponse {
  gems: number;
  xpBoostMinutes: number;
}

export type ShopItem = 'streakFreeze';
export const SHOP_PRICES: Record<ShopItem, number> = { streakFreeze: 200 };

/** Server-side sanity bounds on completeLesson submissions. */
export const MIN_MS_PER_ANSWER = 1500;
export const MAX_ANSWERS_PER_LESSON = 60;
