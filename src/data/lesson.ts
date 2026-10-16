import { START_RATING } from '@shared/adaptive/elo';
import { selectQuestions } from '@shared/adaptive/select';
import {
  buildPath,
  CHECKPOINT_QUESTIONS,
  LEGENDARY_QUESTIONS,
  levelDifficulty,
  QUESTIONS_PER_LESSON,
} from '@shared/progression/path';
import { allSkills } from '@shared/taxonomy';
import type { Question, TestId } from '@shared/types';
import type { ProgressDoc } from '@shared/user';

import { loadQuestions, loadQuestionsById } from './questions';

export type LessonKind = 'lesson' | 'legendary' | 'checkpoint' | 'practice';

/** Practice-tab sessions use synthetic node ids so they share the lesson screen. */
export const PRACTICE = {
  mistakes: 'practice:mistakes',
  bookmarks: 'practice:bookmarks',
  weakest: 'practice:weakest',
  hardest: 'practice:hardest',
  skill: (skillId: string) => `practice:skill:${skillId}`,
};

const WEAKEST_SKILLS = 3;

export async function buildLesson(
  test: TestId,
  nodeId: string,
  kind: LessonKind,
  progress: ProgressDoc,
): Promise<Question[]> {
  const opts = { exclude: new Set(progress.recent) };

  if (nodeId === PRACTICE.mistakes) return (await loadQuestionsById(progress.mistakes.slice(-QUESTIONS_PER_LESSON))).filter((q) => q.test === test);
  if (nodeId === PRACTICE.bookmarks) return (await loadQuestionsById(progress.bookmarks)).filter((q) => q.test === test).slice(0, QUESTIONS_PER_LESSON);

  if (nodeId.startsWith('practice:')) {
    const skills = allSkills(test);
    let skillIds: string[];
    if (nodeId === PRACTICE.weakest) {
      skillIds = skills
        .map((s) => ({ id: s.id, r: progress.mastery[s.id]?.rating ?? START_RATING }))
        .sort((a, b) => a.r - b.r)
        .slice(0, WEAKEST_SKILLS)
        .map((s) => s.id);
    } else if (nodeId.startsWith('practice:skill:')) {
      skillIds = [nodeId.slice('practice:skill:'.length)];
    } else {
      skillIds = skills.map((s) => s.id);
    }
    const pool = await loadQuestions(skillIds);
    return selectQuestions(pool, progress.mastery, {
      ...opts,
      count: QUESTIONS_PER_LESSON,
      hardest: nodeId === PRACTICE.hardest,
    });
  }

  const node = buildPath(test)
    .flatMap((u) => u.nodes)
    .find((n) => n.id === nodeId);
  if (!node) return [];
  const pool = await loadQuestions(node.skillIds);
  const count = kind === 'legendary' ? LEGENDARY_QUESTIONS : kind === 'checkpoint' ? CHECKPOINT_QUESTIONS : QUESTIONS_PER_LESSON;
  const [lo, hi] = levelDifficulty(progress.nodes[nodeId]?.level ?? 0);
  const banded = kind === 'lesson' ? pool.filter((q) => q.difficulty >= lo && q.difficulty <= hi) : pool;
  return selectQuestions(banded.length >= count ? banded : pool, progress.mastery, {
    ...opts,
    count,
    hardest: kind === 'legendary',
  });
}
