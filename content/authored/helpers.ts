/**
 * Passage helper for ACT English: write the passage once with numbered spots like
 * `[[1|the original wording]]`, then `at(passage, 1)` returns it with only spot 1 underlined
 * (`__...__`, rendered underlined in the app) and every other spot as plain text.
 */
export function at(passage: string, n: number): string {
  return passage.replace(/\[\[(\d+)\|([^\]]*)\]\]/g, (_m, k: string, text: string) => (Number(k) === n ? `__${text}__` : text));
}

/** The passage with no underlines (for whole-passage questions). */
export const plain = (passage: string) => passage.replace(/\[\[\d+\|([^\]]*)\]\]/g, '$1');

/** FNV-1a hash, used to seed a stable per-question shuffle. */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

type MC = { stem: string; choices?: string[]; answer: number | string[]; explanation: string };

/** Stable permutation of `positions`, seeded by the item's text. */
function permute(q: MC, positions: number[]): number[] {
  let seed = hash(q.stem + q.choices!.join('|'));
  const p = positions.slice();
  for (let i = p.length - 1; i > 0; i--) {
    seed = Math.imul(seed ^ (seed >>> 15), 0x2c1b3c6d) >>> 0;
    const j = seed % (i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }
  return p;
}

/** Choice letters used as references in explanations ("C is…", "B and C", "(D)"). */
const LETTER_REF =
  /(?<!(?:Passage|Text|Sentence|Grade|Ms\.) )\b([A-D])\b(?=(?: (?:is|are|and|or|puts|adds|uses|makes|creates|also|repeats|repeat|changes|has|says|states|still|runs|run|each|would|splits|split|leaves|scrambles|gives|drops|lacks|mixes|mix|wrongly|turns|places|pile|joins|attach|attaches)\b)|[,)])/g;

/**
 * Reorders each multiple-choice item's choices with a shuffle seeded by its stem and choices, so
 * the key's position is spread across A–D and stays stable when the file is re-run. Items whose
 * first choice is NO CHANGE keep it first (ACT convention) and shuffle only B–D. Letter
 * references in the explanation are rewritten to match.
 */
export function shuffled<T extends MC>(items: T[]): T[] {
  return items.map((q) => {
    if (!q.choices || typeof q.answer !== 'number') return q;
    const fixed = q.choices[0] === 'NO CHANGE' ? 1 : 0;
    const order = [...Array(fixed).keys(), ...permute(q, q.choices.map((_, i) => i).slice(fixed))];
    const letter = (old: string) => 'ABCD'[order.indexOf('ABCD'.indexOf(old))];
    return {
      ...q,
      choices: order.map((i) => q.choices![i]),
      answer: order.indexOf(q.answer),
      explanation: q.explanation.replace(LETTER_REF, (_m, l: string) => letter(l)),
    };
  });
}

/** Shuffles only NO CHANGE items; others (keep/delete, sentence placement) keep their order. */
export const shuffledNoChange = <T extends MC>(items: T[]): T[] => items.map((q) => (q.choices?.[0] === 'NO CHANGE' ? shuffled([q])[0] : q));

const SPOT = /\[\[(\d+)\|([^\]]*)\]\]/g;
const spots = (p: string) => [...p.matchAll(SPOT)].map((m) => ({ n: Number(m[1]), text: m[2] }));

/** Swap the underlined original with choice `k`, which then becomes the key. */
export type Flip = { k: number; explanation: string };

/**
 * Finishes a passage set:
 * 1. Each spot's correct wording is taken from its own question (the keyed choice, or the
 *    original when NO CHANGE is right). Every other question then shows that spot corrected,
 *    so excerpts never contain uncorrected errors outside the underline.
 * 2. `flips[n]` swaps spot n's original wording with a wrong choice, so the original becomes
 *    the answer (keeps NO CHANGE from being right too often).
 */
export function finalize<T extends MC & { stimulus?: string }>(items: T[], passages: string[], flips: Record<number, Flip> = {}): T[] {
  const where = items.map((q) => {
    for (const [pi, p] of passages.entries()) for (const s of spots(p)) if (q.stimulus?.includes(at(p, s.n))) return { pi, ...s };
    return null;
  });
  const fix = new Map<string, string>();
  items.forEach((q, i) => {
    const w = where[i];
    if (w && q.choices?.[0] === 'NO CHANGE' && typeof q.answer === 'number') fix.set(`${w.pi}:${w.n}`, q.answer === 0 ? w.text : q.choices[q.answer]);
  });
  const render = (pi: number, n: number | null) =>
    passages[pi].replace(SPOT, (_m, k: string, t: string) => (Number(k) === n ? `__${t}__` : (fix.get(`${pi}:${k}`) ?? t)));
  const used = new Set<number>();
  const out = items.map((q, i) => {
    if (!q.stimulus) return q;
    let s = q.stimulus;
    const w = where[i];
    if (w) s = s.replace(at(passages[w.pi], w.n), render(w.pi, w.n));
    passages.forEach((p, pi) => {
      if (s.includes(plain(p))) s = s.replace(plain(p), render(pi, null));
    });
    const f = w && flips[w.n];
    if (!f || !q.choices || q.choices[0] !== 'NO CHANGE' || q.answer !== 0) {
      if (f) throw new Error(`Flip ${w!.n} needs a NO CHANGE item keyed to NO CHANGE.`);
      return { ...q, stimulus: s };
    }
    used.add(w.n);
    const choices = [...q.choices];
    choices[f.k] = w.text;
    return { ...q, stimulus: s.replace(`__${w.text}__`, `__${q.choices[f.k]}__`), choices, answer: f.k, explanation: f.explanation };
  });
  const unused = Object.keys(flips).filter((n) => !used.has(Number(n)));
  if (unused.length) throw new Error(`Unused flips: ${unused.join(', ')}`);
  return out;
}
