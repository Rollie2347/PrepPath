// Usage: npx tsx ingest.ts <authored.json> [--write]
// Adds questions written and solved by hand (or in a Claude Code session, at no API cost) to the
// bank as `approved`. Each item gets the same checks as generate.ts (format rules, prose inside
// math, near-duplicates), plus `check`: a JS expression that recomputes the answer from the
// problem's own numbers. A number must equal the keyed choice and no other choice; `true` is
// accepted for answers that are not a single number. Without --write it only reports.
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { proseInMath } from '../../shared/math-segments';
import { allSkills, sectionOfSkill } from '../../shared/taxonomy';
import type { Difficulty, Question } from '../../shared/types';

import { appendBank, readBank, similarity, type BankRow } from './bank';
import { validateQuestion } from './validate';

export interface Authored {
  skill: string;
  d: Difficulty;
  inContext?: boolean;
  /** Subskill tag for skills that need one (e.g. SAT boundaries). */
  tag?: string;
  stimulus?: string;
  stem: string;
  choices?: string[];
  /** MC: index of the right choice. SPR: accepted answers. */
  answer: number | string[];
  explanation: string;
  /** Math: JS expression recomputing the answer (number), or a boolean assertion. */
  check?: string;
}

const MODEL = 'claude-opus-5-5 (Claude Code session)';
const file = process.argv[2];
const write = process.argv.includes('--write');
if (!file) {
  console.error('Usage: npx tsx ingest.ts <authored.json> [--write]');
  process.exit(1);
}

/**
 * Numeric value of a choice such as "$1{,}960$", "\$45", "$\frac{7}{3}$", "-3.5", "12%",
 * "$55^\circ$" or "$15$ cm". Multiples of π compare by coefficient ("$72\pi$" → 72), so a
 * check for those returns the coefficient.
 */
export function choiceValue(c: string): number | null {
  const s = c
    .replace(/\\\$/g, '')
    .replace(/\$/g, '')
    .replace(/\{,\}/g, '')
    .replace(/,/g, '')
    .replace(/\\%|%/g, '')
    .replace(/\^\\circ|\^\{\\circ\}|°/g, '')
    .replace(/\\pi\b/g, '')
    .replace(/\\(text|mathrm)\{[^}]*\}/g, '')
    .replace(/\s+[A-Za-z²³][A-Za-z²³ ]*$/, '')
    .replace(/\s+/g, '')
    .replace(/^\\?-/, '-');
  if (s === '' || s === '-') return c.includes('\\pi') ? (s === '-' ? -1 : 1) : null;
  const frac = s.match(/^(-?)\\d?frac\{(-?[\d.]+)\}\{([\d.]+)\}$/);
  if (frac) return (frac[1] ? -1 : 1) * (Number(frac[2]) / Number(frac[3]));
  return /^-?\d*\.?\d+$/.test(s) ? Number(s) : null;
}

const skills = new Map(allSkills().map((k) => [k.id, k]));
const bank = readBank();
// .ts sources can share a passage across items; they default-export Authored[].
const items = (file.endsWith('.json') ? JSON.parse(fs.readFileSync(file, 'utf8')) : (await import(pathToFileURL(path.resolve(file)).href)).default) as Authored[];
const ok: BankRow[] = [];
let bad = 0;

for (const [i, a] of items.entries()) {
  const problems: string[] = [];
  const skill = skills.get(a.skill);
  const section = sectionOfSkill(a.skill);
  if (!skill || !section) {
    console.log(`#${i} unknown skill ${a.skill}`);
    bad++;
    continue;
  }
  const mc = Array.isArray(a.choices);
  const tags = [
    ...(a.tag && skill.tags?.some((t) => t.id === a.tag) ? [a.tag] : []),
    ...(a.inContext && section.inContext ? [`${section.id}.context`] : []),
    ...(section.crossTags ?? []).filter((t) => t === 'act.math.modeling' && a.inContext),
  ];
  const q: BankRow = {
    id: randomUUID(),
    test: section.id.startsWith('sat.') ? 'sat' : 'act',
    sectionId: section.id,
    skillId: a.skill,
    ...(tags.length ? { tags } : {}),
    difficulty: a.d,
    ...(a.stimulus ? { stimulus: a.stimulus } : {}),
    stem: a.stem,
    ...(mc ? { choices: a.choices } : {}),
    answer: a.answer,
    explanation: a.explanation,
    source: { kind: 'generated', name: 'PrepPath original (claude-opus-5-5)', license: 'Proprietary — PrepPath' },
    reviewStatus: 'approved',
    pipeline: { generatedAt: new Date().toISOString(), model: MODEL, verifiedAnswer: mc ? (a.answer as number) : undefined, notes: ['Authored and solved in a Claude Code session; key re-derived by ingest check.'] },
  };

  problems.push(...validateQuestion(q as Question));
  for (const f of [a.stimulus ?? '', a.stem, ...(a.choices ?? []), a.explanation]) {
    const p = proseInMath(f);
    if (p.length) problems.push(`Prose inside math: "${p[0].slice(0, 40)}"`);
  }
  if (![1, 2, 3, 4, 5].includes(a.d)) problems.push('Difficulty must be 1–5.');

  if (a.check !== undefined) {
    let v: unknown;
    try {
      // Trusted input only: check strings come from question files in this repo, run locally.
      v = new Function(`return (${a.check});`)();
    } catch (e) {
      problems.push(`check threw: ${(e as Error).message}`);
    }
    if (typeof v === 'boolean') {
      if (!v) problems.push('check is false.');
    } else if (typeof v === 'number') {
      if (mc) {
        const vals = a.choices!.map(choiceValue);
        const near = (x: number | null) => x !== null && Math.abs(x - v) <= Math.max(1e-6, Math.abs(v) * 1e-9);
        const key = vals[a.answer as number];
        if (key === null) problems.push(`Keyed choice "${a.choices![a.answer as number]}" is not numeric; use a boolean check.`);
        else if (!near(key) && !(Math.abs(key - Math.round(v * 10 ** 4) / 10 ** 4) < 1e-9)) problems.push(`check = ${v}, keyed choice = ${key}.`);
        const others = vals.filter((x, j) => j !== a.answer && near(x));
        if (others.length) problems.push(`check = ${v} also matches another choice.`);
      } else if (!(a.answer as string[]).some((s) => Math.abs(Number(s.includes('/') ? Number(s.split('/')[0]) / Number(s.split('/')[1]) : s) - v) < 1e-6)) {
        problems.push(`check = ${v} not among SPR answers ${JSON.stringify(a.answer)}.`);
      }
    } else if (v !== undefined) problems.push('check must return a number or boolean.');
  } else if (section.id.endsWith('.math')) problems.push('Math items need a check.');

  // Passage and table sets share a stimulus by design, so compare the stem and choices; a stimulus
  // counts only for grid-ins, which have no choices.
  const key = (x: { stem: string; stimulus?: string; choices?: string[] }) => x.stem + ' ' + (x.choices ? x.choices.join(' ') : (x.stimulus ?? ''));
  const dup = [...bank, ...ok].find((b) => b.skillId === a.skill && similarity(key(b), key(a)) > 0.6);
  if (dup) problems.push(`Near-duplicate of ${dup.id.slice(0, 8)}.`);

  if (problems.length) {
    console.log(`#${i} ${a.skill} d${a.d}: ${a.stem.slice(0, 50)}… → ${problems.join(' ')}`);
    bad++;
  } else ok.push(q);
}

if (write && bad === 0) appendBank(ok);
console.log(`${ok.length} ok, ${bad} with problems. ${write ? (bad === 0 ? 'Written.' : 'Nothing written: fix problems first.') : 'Dry run.'}`);
