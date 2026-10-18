// Code-side checks for generated questions: the format rules a model tends to drift on are
// enforced here rather than trusted to the prompt. Returns a list of problems (empty = valid).
import { sprKeyFits } from '../../shared/grading';
import { proseInMath } from '../../shared/math-segments';
import { allSkills } from '../../shared/taxonomy';
import type { Question } from '../../shared/types';

/** Digital SAT RW passage length in "standard words" (characters ÷ 6), Framework v4. */
export const RW_WORDS = { min: 25, max: 150 };
/** SAT math-in-context items are "mostly" ≤ 50 standard words; above this we reject (inference). */
export const MATH_CONTEXT_MAX_WORDS = 80;
export const BLANK = '______';

/** SAT RW skills whose passage ends at a blank the answer completes. */
const BLANK_SKILLS = new Set([
  'sat.rw.cs.words',
  'sat.rw.ii.inferences',
  'sat.rw.ii.evidence_quant',
  'sat.rw.ei.transitions',
  'sat.rw.sec.boundaries',
  'sat.rw.sec.form',
]);

export const standardWords = (text: string) => text.replace(/\s+/g, ' ').trim().length / 6;

/** Passage text without table rows and the literary attribution line (not counted as passage). */
function passageText(stimulus: string): string {
  return stimulus
    .split('\n')
    .filter((l) => !/^\s*\|/.test(l))
    .join('\n');
}

const SKILL_TAGS = new Map(allSkills().map((k) => [k.id, (k.tags ?? []).map((t) => t.id)]));

export function validateQuestion(q: Question): string[] {
  const out: string[] = [];
  const tags = SKILL_TAGS.get(q.skillId) ?? [];
  if (tags.length && !q.tags?.some((t) => tags.includes(t))) out.push(`Needs one subskill tag (${tags.join(', ')}).`);
  const stim = q.stimulus ?? '';
  const all = `${stim}\n${q.stem}\n${(q.choices ?? []).join('\n')}`;

  if (q.choices) {
    if (q.choices.length !== 4) out.push(`Needs 4 choices, has ${q.choices.length}.`);
    if (new Set(q.choices.map((c) => c.trim().toLowerCase())).size !== q.choices.length) out.push('Duplicate choices.');
    if (typeof q.answer !== 'number' || q.answer < 0 || q.answer >= q.choices.length) out.push('Answer index out of range.');
  } else {
    if (q.sectionId !== 'sat.math') out.push('Only SAT Math has student-produced response.');
    if (!Array.isArray(q.answer) || q.answer.length === 0) out.push('SPR needs at least one key.');
    else for (const k of q.answer) if (!sprKeyFits(k)) out.push(`SPR key "${k}" cannot be entered (5 chars, 6 with "-").`);
  }
  if (!q.explanation.trim()) out.push('Missing explanation.');
  // Prose inside $...$ renders without spaces: almost always a money $ written bare.
  const prose = proseInMath(`${all}\n${q.explanation}`);
  if (prose.length) out.push(`Prose inside math ("${prose[0].slice(0, 40)}"): write money as \\$12, never a bare $.`);
  // NOT/EXCEPT/LEAST framing is absent from both enhanced forms and the digital SAT.
  if (/\b(NOT|EXCEPT|LEAST)\b/.test(q.stem)) out.push('No NOT/EXCEPT/LEAST stems.');

  if (q.sectionId === 'sat.rw') {
    const words = standardWords(passageText(stim));
    if (words < RW_WORDS.min || words > RW_WORDS.max) out.push(`Passage is ${Math.round(words)} standard words (needs ${RW_WORDS.min}–${RW_WORDS.max}).`);
    if (/no change/i.test(all)) out.push('Digital SAT has no NO CHANGE option.');
    if (BLANK_SKILLS.has(q.skillId) && !stim.includes(BLANK)) out.push(`Completion skill needs a "${BLANK}" blank in the passage.`);
    if (!BLANK_SKILLS.has(q.skillId) && stim.includes(BLANK)) out.push('This skill does not use a blank.');
    if (q.skillId === 'sat.rw.ei.synthesis') {
      const bullets = stim.split('\n').filter((l) => /^\s*[-•*]\s+/.test(l)).length;
      if (bullets < 4 || bullets > 6) out.push(`Rhetorical Synthesis needs 4–6 bulleted notes, has ${bullets}.`);
      if (!/student|researcher/i.test(stim) || !/goal|wants to/i.test(q.stem)) out.push('Synthesis needs the notes lead-in and a stated goal in the stem.');
    }
    if (q.skillId === 'sat.rw.cs.crosstext' && !(/Text 1/.test(stim) && /Text 2/.test(stim))) out.push('Cross-Text needs Text 1 and Text 2.');
    if (q.skillId === 'sat.rw.ii.evidence_quant' && !/^\s*\|/m.test(stim) && !/graph|figure|chart/i.test(stim)) out.push('Quantitative evidence needs a table or graph.');
  }

  if (q.sectionId === 'sat.math' && standardWords(stim + ' ' + q.stem) > MATH_CONTEXT_MAX_WORDS)
    out.push('SAT Math item text is too long for an in-context item.');

  if (q.test === 'act' && /no change/i.test(all) && q.sectionId !== 'act.eng') out.push('NO CHANGE is ACT English only.');
  return out;
}
