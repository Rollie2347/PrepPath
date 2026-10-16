// Usage: npm run generate -- --skill sat.math.alg.lin1 --difficulty 3 --count 10
// Writes new questions to the bank as `draft`. Run verify, then review, before publish.
import { randomUUID } from 'node:crypto';

import { allSkills, getTest } from '../../shared/taxonomy';
import type { Difficulty } from '../../shared/types';

import { arg, readBank, similarity, writeBank, type BankRow } from './bank';
import { jsonCall, MODEL } from './claude';

const skillId = arg('skill');
const difficulty = Number(arg('difficulty')) as Difficulty;
const count = Number(arg('count') ?? 10);

const skill = allSkills().find((s) => s.id === skillId);
if (!skill || ![1, 2, 3, 4, 5].includes(difficulty) || !(count >= 1 && count <= 25)) {
  console.error('Usage: --skill <skillId> --difficulty 1-5 --count 1-25');
  process.exit(1);
}
const test = getTest(skill.test);
const section = test.sections.find((s) => s.id === skill.sectionId)!;
const domain = section.domains.find((d) => d.id === skill.domainId)!;

const FORMAT: Record<string, string> = {
  'sat.rw':
    'Digital SAT Reading and Writing: each question has its own short passage (25–150 words, or a pair of short texts for Cross-Text Connections, or a short passage with a table for quantitative evidence) and exactly 4 answer choices. Literary passages must be public-domain works; quote them exactly and name the author/work. All other passages are original.',
  'sat.math':
    'Digital SAT Math: about 75% multiple choice with exactly 4 choices, about 25% student-produced response (no choices; give every accepted answer form, e.g. ["3/4", ".75", "0.75"]). Use realistic contexts where the skill calls for it.',
  'act.eng':
    'Enhanced ACT English: a passage excerpt with one portion underlined (mark it __like this__ in the stimulus) and exactly 4 choices, the first being "NO CHANGE" where appropriate.',
  'act.math': 'Enhanced ACT Math: multiple choice with exactly 4 choices.',
  'act.read': 'Enhanced ACT Reading: a passage excerpt (150–350 words, original or public-domain) and exactly 4 choices.',
  'act.sci':
    'Enhanced ACT Science: a short experiment/data description with a table rendered as text, and exactly 4 choices. All data must be internally consistent.',
};

const DIFFICULTY: Record<Difficulty, string> = {
  1: 'easiest: one direct step, most test-takers answer correctly',
  2: 'easy: two steps or one common trap',
  3: 'medium: typical mid-test question',
  4: 'hard: multi-step or subtle distractors, about 30% of test-takers correct',
  5: 'hardest: the toughest questions on the real test',
};

const SYSTEM = `You write original practice questions for a free ${test.name} prep app.
Match the official test's style, length, difficulty, and answer-choice design. Never reproduce or paraphrase questions from College Board, ACT, or commercial prep books.
Math uses LaTeX inside $...$. Every question must have exactly one defensible correct answer.
Each explanation should teach the fastest reliable way to solve it in 2–5 short sentences, then say in one line why the most tempting wrong choice is wrong.`;

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['questions'],
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['stimulus', 'stem', 'choices', 'answerIndex', 'acceptedAnswers', 'explanation'],
        properties: {
          stimulus: { type: 'string', description: 'Passage/table/figure text, or empty string if none.' },
          stem: { type: 'string' },
          choices: { type: 'array', items: { type: 'string' }, description: 'Exactly 4, or empty for student-produced response.' },
          answerIndex: { type: 'integer', description: 'Index of the correct choice, or -1 for student-produced response.' },
          acceptedAnswers: { type: 'array', items: { type: 'string' }, description: 'Student-produced response forms; empty for multiple choice.' },
          explanation: { type: 'string' },
        },
      },
    },
  },
};

type Gen = { stimulus: string; stem: string; choices: string[]; answerIndex: number; acceptedAnswers: string[]; explanation: string };

const bank = readBank();
const sameSkill = bank.filter((q) => q.skillId === skill.id);
const avoid = sameSkill.slice(-30).map((q) => `- ${q.stem.slice(0, 160)}`).join('\n');

const { questions } = await jsonCall<{ questions: Gen[] }>({
  system: SYSTEM,
  effort: 'high',
  schema: SCHEMA,
  user: `Write ${count} questions.
Test: ${test.name}
Section: ${section.name}
Content domain: ${domain.name}
Skill: ${skill.name}
Difficulty: ${difficulty}/5 (${DIFFICULTY[difficulty]})
Format: ${FORMAT[section.id]}
Vary contexts and question shapes.${avoid ? `\nAlready in the bank for this skill — do not repeat these:\n${avoid}` : ''}`,
});

let added = 0;
for (const g of questions) {
  const mc = g.choices.length > 0;
  if (mc && (g.choices.length !== 4 || g.answerIndex < 0 || g.answerIndex > 3)) continue;
  if (!mc && (section.id !== 'sat.math' || g.acceptedAnswers.length === 0)) continue;
  if ([...sameSkill, ...bank.slice(-200)].some((q) => similarity(q.stem + q.stimulus, g.stem + g.stimulus) > 0.6)) continue;

  const row: BankRow = {
    id: randomUUID(),
    test: skill.test,
    sectionId: skill.sectionId,
    skillId: skill.id,
    difficulty,
    ...(g.stimulus ? { stimulus: g.stimulus } : {}),
    stem: g.stem,
    ...(mc ? { choices: g.choices } : {}),
    answer: mc ? g.answerIndex : g.acceptedAnswers,
    explanation: g.explanation,
    source: { kind: 'generated', name: `PrepPath original (${MODEL})`, license: 'Proprietary — PrepPath' },
    reviewStatus: 'draft',
    pipeline: { generatedAt: new Date().toISOString(), model: MODEL },
  };
  bank.push(row);
  sameSkill.push(row);
  added++;
}
writeBank(bank);
console.log(`Added ${added}/${questions.length} drafts for ${skill.id} @ difficulty ${difficulty}.`);
