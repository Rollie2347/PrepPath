// Usage: npm run verify [-- --limit 50]
// Independently solves every draft WITHOUT seeing the key. Drafts whose solved answer matches
// the key and that the solver judges unambiguous become `verified`; others become `rejected`.
import { isCorrect } from '../../shared/grading';
import { allSkills } from '../../shared/taxonomy';

import { arg, readBank, writeBank } from './bank';
import { jsonCall } from './claude';

const limit = Number(arg('limit') ?? 50);
const CONCURRENCY = 4;

const SYSTEM = `You are an expert SAT/ACT tutor checking practice questions for a prep app.
Solve the question yourself from scratch. Then judge it: is there exactly one defensible answer, is it free of factual errors, and does it match the stated skill?`;

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['answer', 'unambiguous', 'matchesSkill', 'problems'],
  properties: {
    answer: { type: 'string', description: 'The letter (A–D) for multiple choice, or the numeric answer for student-produced response.' },
    unambiguous: { type: 'boolean' },
    matchesSkill: { type: 'boolean' },
    problems: { type: 'array', items: { type: 'string' } },
  },
};

const bank = readBank();
const skills = new Map(allSkills().map((s) => [s.id, s.name]));
const drafts = bank.filter((q) => q.reviewStatus === 'draft').slice(0, limit);
let verified = 0;

async function check(q: (typeof bank)[number]) {
  const choices = q.choices?.map((c, i) => `${String.fromCharCode(65 + i)}) ${c}`).join('\n') ?? '(student-produced response — no choices)';
  try {
    const v = await jsonCall<{ answer: string; unambiguous: boolean; matchesSkill: boolean; problems: string[] }>({
      system: SYSTEM,
      effort: 'high',
      schema: SCHEMA,
      user: `Skill: ${skills.get(q.skillId)}\n\n${q.stimulus ? `${q.stimulus}\n\n` : ''}${q.stem}\n\n${choices}`,
    });
    const response = q.choices ? v.answer.trim().toUpperCase().charCodeAt(0) - 65 : v.answer;
    const agrees = isCorrect(q, response);
    const ok = agrees && v.unambiguous && v.matchesSkill;
    q.reviewStatus = ok ? 'verified' : 'rejected';
    q.pipeline = {
      ...q.pipeline,
      verifiedAnswer: response,
      notes: [...(agrees ? [] : [`Solver answered ${v.answer}`]), ...(v.matchesSkill ? [] : ['Off-skill']), ...v.problems],
    };
    if (ok) verified++;
  } catch (e) {
    console.error(`${q.id}: ${e instanceof Error ? e.message : e}`);
  }
}

for (let i = 0; i < drafts.length; i += CONCURRENCY) {
  await Promise.all(drafts.slice(i, i + CONCURRENCY).map(check));
  writeBank(bank);
}
console.log(`Checked ${drafts.length}: ${verified} verified, ${drafts.length - verified} rejected or errored.`);
