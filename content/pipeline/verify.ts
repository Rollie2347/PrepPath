// Usage: npm run verify [-- --limit 50]
// Two independent checks per draft:
//  1. Solve: answers the question WITHOUT seeing the key or any distractor rationale.
//  2. Audit: sees the key, each wrong choice's error rationale and the skill's official pattern,
//     and judges pattern fidelity and whether every rationale truly explains its choice.
// Plus the code-side format rules. Passing all three → `verified`; otherwise `rejected`.
import { isCorrect } from '../../shared/grading';
import { allSkills } from '../../shared/taxonomy';

import { arg, readBank, writeBank, type BankRow } from './bank';
import { jsonCall } from './claude';
import { specFor } from './specs';
import { validateQuestion } from './validate';

const limit = Number(arg('limit') ?? 50);
const CONCURRENCY = 4;

const SOLVE_SYSTEM = `You are an expert SAT/ACT tutor checking practice questions for a prep app.
Solve the question yourself from scratch. Then judge: is there exactly one defensible answer, is it free of factual errors, and does it test the stated skill?`;

const SOLVE_SCHEMA = {
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

const AUDIT_SYSTEM = `You audit practice questions for fidelity to the real test. You are given the question, its key, the stated reason each wrong choice is tempting, and the official item pattern for the skill.
Judge two things strictly: (1) does the item look like a real test item for this skill (stem wording, stimulus shape, how the key and wrong choices are built)? (2) does each stated reason accurately describe how that wrong choice arises, and is each wrong choice plausible to a student making that error? Only report problems that would make a careful test writer revise the item.`;

const AUDIT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['matchesPattern', 'distractorsAccurate', 'problems'],
  properties: {
    matchesPattern: { type: 'boolean' },
    distractorsAccurate: { type: 'boolean' },
    problems: { type: 'array', items: { type: 'string' } },
  },
};

const bank = readBank();
const skills = new Map(allSkills().map((s) => [s.id, s.name]));
const drafts = bank.filter((q) => q.reviewStatus === 'draft').slice(0, limit);
let verified = 0;

const letter = (i: number) => String.fromCharCode(65 + i);
const render = (q: BankRow) =>
  `${q.stimulus ? `${q.stimulus}\n\n` : ''}${q.stem}\n\n${q.choices?.map((c, i) => `${letter(i)}) ${c}`).join('\n') ?? '(student-produced response — no choices)'}`;

async function check(q: BankRow) {
  const spec = specFor(q.skillId);
  try {
    const solved = await jsonCall<{ answer: string; unambiguous: boolean; matchesSkill: boolean; problems: string[] }>({
      system: SOLVE_SYSTEM,
      effort: 'high',
      schema: SOLVE_SCHEMA,
      user: `Skill: ${skills.get(q.skillId)}\n\n${render(q)}`,
    });
    const response = q.choices ? solved.answer.trim().toUpperCase().charCodeAt(0) - 65 : solved.answer;
    const agrees = isCorrect(q, response);

    let audit = { matchesPattern: true, distractorsAccurate: true, problems: [] as string[] };
    if (agrees && spec) {
      const key = q.choices ? letter(q.answer as number) : (q.answer as string[]).join(' or ');
      audit = await jsonCall({
        system: AUDIT_SYSTEM,
        effort: 'medium',
        schema: AUDIT_SCHEMA,
        user: `Skill: ${skills.get(q.skillId)}
Official pattern:
Stems: ${spec.stems.join(' | ')}
Stimulus: ${spec.stimulus}
Key: ${spec.key}

--- QUESTION ---
${render(q)}

Key: ${key}
${q.pipeline?.distractorRationale?.length ? `Why each wrong choice tempts:\n${q.pipeline.distractorRationale.join('\n')}` : ''}`,
      });
    }

    const codeProblems = validateQuestion(q);
    const ok = agrees && solved.unambiguous && solved.matchesSkill && audit.matchesPattern && audit.distractorsAccurate && !codeProblems.length;
    q.reviewStatus = ok ? 'verified' : 'rejected';
    q.pipeline = {
      ...q.pipeline,
      verifiedAnswer: response,
      notes: [
        ...(agrees ? [] : [`Solver answered ${solved.answer}`]),
        ...(solved.unambiguous ? [] : ['Ambiguous']),
        ...(solved.matchesSkill ? [] : ['Off-skill']),
        ...(audit.matchesPattern ? [] : ['Off-pattern']),
        ...(audit.distractorsAccurate ? [] : ['Distractor rationale wrong']),
        ...codeProblems,
        ...solved.problems,
        ...audit.problems,
      ],
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
