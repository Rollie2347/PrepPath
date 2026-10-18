// Usage: npm run generate -- --skill sat.math.alg.lin1 --difficulty 3 --count 10 [--dry-run]
// Writes new questions to the bank as `draft`. Run verify, then review, before publish.
// --dry-run prints the prompt and exits without calling the API.
import { randomUUID } from 'node:crypto';

import { allSkills, getTest } from '../../shared/taxonomy';
import type { Difficulty, Question } from '../../shared/types';

import { appendBank, arg, readBank, similarity, type BankRow } from './bank';
import { jsonCall, MODEL } from './claude';
import { sectionSpecFor, specFor } from './specs';
import { validateQuestion } from './validate';

const skillId = arg('skill');
const difficulty = Number(arg('difficulty')) as Difficulty;
const count = Number(arg('count') ?? 10);
const dryRun = process.argv.includes('--dry-run');

const skill = allSkills().find((s) => s.id === skillId);
if (!skill || ![1, 2, 3, 4, 5].includes(difficulty) || !(count >= 1 && count <= 25)) {
  console.error('Usage: --skill <skillId> --difficulty 1-5 --count 1-25 [--dry-run]');
  process.exit(1);
}
const spec = specFor(skill.id);
const sectionSpec = sectionSpecFor(skill.sectionId);
if (!spec || !sectionSpec) {
  console.error(`No pattern spec for ${skill.id} yet. ACT English, Reading and Science are generated as passage units (not built yet).`);
  process.exit(1);
}
const test = getTest(skill.test);
const section = test.sections.find((s) => s.id === skill.sectionId)!;
const domain = section.domains.find((d) => d.id === skill.domainId)!;

/** SAT Math is ~25% student-produced response. */
const SPR_SHARE = 0.25;
const sprCount = spec.spr ? Math.round(count * SPR_SHARE) : 0;
const band = difficulty <= 2 ? 'easy' : difficulty === 3 ? 'medium' : 'hard';

const DIFFICULTY: Record<Difficulty, string> = {
  1: 'easiest: one direct step; most test-takers answer correctly',
  2: 'easy: two steps or one common trap',
  3: 'medium: a typical mid-module question',
  4: 'hard: about 30% of test-takers correct',
  5: 'hardest: the toughest questions on the real test',
};

const SYSTEM = `You write original practice questions for a free ${test.name} prep app. Students improve by learning the test's recurring item patterns, so every question must follow the official pattern for its skill exactly: the same stem wording, passage shape, key construction and distractor logic as the real test, with entirely new content.
Never reproduce or paraphrase questions, passages or answer choices from College Board, ACT, or any prep company, and never base a question on a known sample item (including the official framework and practice-test samples).
Every question has exactly one defensible correct answer. Every wrong choice is wrong for a reason a teacher can name: give it one of the listed error codes.
Explanations teach the fastest reliable method in 2–5 short sentences, then name the error behind the most tempting wrong choice in one line (e.g. "B is the value of 3x, not x").`;

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
        required: ['stimulus', 'stem', 'choices', 'answerIndex', 'sprAnswers', 'distractors', 'governingClue', 'tag', 'inContext', 'explanation'],
        properties: {
          stimulus: { type: 'string', description: 'Passage, given equation, table (Markdown) or context; empty string if none.' },
          stem: { type: 'string' },
          choices: { type: 'array', items: { type: 'string' }, description: 'Exactly 4, or empty for student-produced response.' },
          answerIndex: { type: 'integer', description: 'Index of the correct choice, or -1 for student-produced response.' },
          sprAnswers: {
            type: 'array',
            items: { type: 'string' },
            description: 'SPR only: each distinct correct value as an integer, a/b fraction or terminating decimal. Do NOT list equivalent forms. Empty for multiple choice.',
          },
          distractors: {
            type: 'array',
            description: 'One entry per wrong choice (3 for MC, empty for SPR).',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['index', 'errorType', 'rationale'],
              properties: { index: { type: 'integer' }, errorType: { type: 'string' }, rationale: { type: 'string' } },
            },
          },
          governingClue: { type: 'string', description: 'The span, table cell, or step that proves the key.' },
          tag: { type: 'string', description: 'Subskill tag id from the list given, or empty string.' },
          inContext: { type: 'boolean', description: 'True if set in a real-world context.' },
          explanation: { type: 'string' },
        },
      },
    },
  },
};

type Gen = {
  stimulus: string;
  stem: string;
  choices: string[];
  answerIndex: number;
  sprAnswers: string[];
  distractors: { index: number; errorType: string; rationale: string }[];
  governingClue: string;
  tag: string;
  inContext: boolean;
  explanation: string;
};

const bank = readBank();
const sameSkill = bank.filter((q) => q.skillId === skill.id);
const avoid = sameSkill.slice(-30).map((q) => `- ${(q.stimulus ?? '').slice(0, 80)} | ${q.stem.slice(0, 100)}`).join('\n');
const list = (xs: string[]) => xs.map((x) => `- ${x}`).join('\n');

const user = `Write ${count} questions.
Test: ${test.name}
Section: ${section.name}
Content domain: ${domain.name}
Skill: ${skill.name}
Difficulty: ${difficulty}/5 (${DIFFICULTY[difficulty]})

FORMAT
${sectionSpec.format}

PATTERN FOR THIS SKILL
Stems (use one of these verbatim, filling bracketed slots; vary across the batch):
${list(spec.stems)}
Stimulus: ${spec.stimulus}
Key: ${spec.key}
Distractor error codes (each wrong choice gets exactly one; the code must describe exactly how that choice arises, so build each wrong choice FROM its error; use "other" with a precise rationale rather than a code that does not fit):
${Object.entries(spec.distractors).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

DIFFICULTY DIALS for ${band} items: ${sectionSpec.knobs[band]}${band === 'hard' && spec.hard ? `; ${spec.hard}` : ''}.
Make items harder only through the reasoning, the stimulus and the closeness of the foils, never through convoluted stem wording.
${skill.tags?.length ? `\nSubskill tags (set "tag" to one id; spread the batch across them):\n${list(skill.tags.map((t) => `${t.id} (${t.name})`))}\n` : ''}${
  sprCount ? `\nMake ${sprCount} of the ${count} items student-produced response (no choices; answerIndex -1; keys that fit 5 characters, 6 if negative).\n` : ''
}
NEVER
${list([...sectionSpec.never, ...(spec.never ?? [])])}

Vary contexts, numbers and question shapes across the batch.${avoid ? `\nAlready in the bank for this skill — do not repeat these:\n${avoid}` : ''}`;

if (dryRun) {
  console.log(`=== SYSTEM ===\n${SYSTEM}\n\n=== USER ===\n${user}`);
  process.exit(0);
}

const { questions } = await jsonCall<{ questions: Gen[] }>({ system: SYSTEM, user, schema: SCHEMA, effort: 'high' });

const codes = new Set(Object.keys(spec.distractors));
const fresh: BankRow[] = [];
const rejected: string[] = [];
for (const g of questions) {
  const mc = g.choices.length > 0;
  const tags = [
    ...(skill.tags?.some((t) => t.id === g.tag) ? [g.tag] : []),
    // In-context share is a Math blueprint target (SAT ~30%, ACT 24–29%); RW passages are all "in context".
    ...(g.inContext && section.inContext ? [`${section.id}.context`] : []),
    ...(section.crossTags ?? []).filter((t) => t === 'act.math.modeling' && g.inContext),
  ];
  const q: Question = {
    id: randomUUID(),
    test: skill.test,
    sectionId: skill.sectionId,
    skillId: skill.id,
    ...(tags.length ? { tags } : {}),
    difficulty,
    ...(g.stimulus ? { stimulus: g.stimulus } : {}),
    stem: g.stem,
    ...(mc ? { choices: g.choices } : {}),
    answer: mc ? g.answerIndex : g.sprAnswers,
    ...(mc ? { distractors: g.distractors.map(({ index, errorType }) => ({ index, errorType })) } : {}),
    explanation: g.explanation,
    source: { kind: 'generated', name: `PrepPath original (${MODEL})`, license: 'Proprietary — PrepPath' },
    reviewStatus: 'draft',
  };
  const problems = validateQuestion(q);
  if (!mc && !spec.spr) problems.push('This skill is multiple choice only.');
  if (mc) {
    const wrong = new Set([0, 1, 2, 3].filter((i) => i !== g.answerIndex));
    const covered = new Set(g.distractors.map((d) => d.index));
    if (covered.size !== 3 || [...covered].some((i) => !wrong.has(i))) problems.push('Distractor entries must cover the three wrong choices.');
    for (const d of g.distractors) if (!codes.has(d.errorType)) problems.push(`Unknown error code ${d.errorType}.`);
  }
  if ([...sameSkill, ...bank.slice(-200)].some((b) => similarity(b.stem + (b.stimulus ?? ''), g.stem + g.stimulus) > 0.6)) problems.push('Near-duplicate.');
  if (problems.length) {
    rejected.push(`${g.stem.slice(0, 60)}… → ${problems.join(' ')}`);
    continue;
  }
  const row: BankRow = {
    ...q,
    pipeline: {
      generatedAt: new Date().toISOString(),
      model: MODEL,
      governingClue: g.governingClue,
      distractorRationale: g.distractors.map((d) => `${String.fromCharCode(65 + d.index)} ${d.errorType}: ${d.rationale}`),
    },
  };
  fresh.push(row);
  bank.push(row);
  sameSkill.push(row);
}
appendBank(fresh);
console.log(`Added ${fresh.length}/${questions.length} drafts for ${skill.id} @ difficulty ${difficulty}.`);
if (rejected.length) console.log(`Rejected by validator:\n${rejected.map((r) => `  - ${r}`).join('\n')}`);
