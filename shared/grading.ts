import type { Question } from './types';

const norm = (s: string) => s.replace(/\s+/g, '').toLowerCase();

/** MC: response is the choice index. Grid-in: response matches any accepted form. */
export function isCorrect(q: Question, response: number | string): boolean {
  if (typeof q.answer === 'number') return response === q.answer;
  return typeof response === 'string' && q.answer.some((a) => norm(a) === norm(response));
}
