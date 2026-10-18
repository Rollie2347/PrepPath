import type { Question } from './types';

/**
 * Student-produced response (grid-in) grading per the Digital SAT directions:
 * up to 5 characters for a positive answer and 6 for a negative one; a fraction that doesn't fit
 * is entered as a decimal, and a decimal that doesn't fit is truncated or rounded at the fourth
 * digit (so for 2/3: 2/3, .6666, .6667, 0.666, 0.667 are right and 0.66, .67 are wrong); mixed
 * numbers must be improper fractions or decimals; no %, $ or commas.
 */
export const SPR_MAX_CHARS = 5;
export const SPR_MAX_CHARS_NEGATIVE = 6;

/** Exact rational p/q with q > 0. Plain numbers are exact here: SPR fields are at most 6 characters. */
export interface Rational {
  p: number;
  q: number;
}

export type SprParse =
  | { ok: true; value: Rational; kind: 'integer' | 'decimal' | 'fraction'; places: number; length: number }
  | { ok: false; reason: string };

const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
const reduce = (p: number, q: number): Rational => {
  const g = gcd(p, q) || 1;
  return { p: p / g, q: q / g };
};
const eq = (a: Rational, b: Rational) => a.p * b.q === b.p * a.q;
/** Integer floor(a / b) for non-negative integers, without float division error. */
const idiv = (a: number, b: number) => (a - (a % b)) / b;

/**
 * Bluebook "cleansing": typographic minus to '-', doubled slashes or decimal points collapsed.
 * Leading/trailing whitespace is dropped; internal whitespace is kept so "3 1/2" is rejected.
 */
export function cleanseSpr(raw: string): string {
  return raw.trim().replace(/[−–—]/g, '-').replace(/\/{2,}/g, '/').replace(/\.{2,}/g, '.');
}

/** Parse a typed SPR response, enforcing the entry rules. Also usable for a live preview. */
export function parseSprResponse(raw: string): SprParse {
  const s = cleanseSpr(raw);
  if (!s) return { ok: false, reason: 'Enter an answer.' };
  if (/\s/.test(s)) return { ok: false, reason: 'No spaces. Enter a mixed number like 3 1/2 as 7/2 or 3.5.' };
  if (/[%$,]/.test(s)) return { ok: false, reason: "Don't enter %, $ or commas." };
  const neg = s.startsWith('-');
  if (s.length > (neg ? SPR_MAX_CHARS_NEGATIVE : SPR_MAX_CHARS))
    return { ok: false, reason: `Up to ${SPR_MAX_CHARS} characters (${SPR_MAX_CHARS_NEGATIVE} with a minus sign).` };
  const body = neg ? s.slice(1) : s;
  const sign = neg ? -1 : 1;

  const frac = /^(\d+)\/(\d+)$/.exec(body);
  if (frac) {
    const q = Number(frac[2]);
    if (q === 0) return { ok: false, reason: "Denominator can't be 0." };
    return { ok: true, value: reduce(sign * Number(frac[1]), q), kind: 'fraction', places: 0, length: s.length };
  }
  const dec = /^(\d*)(?:\.(\d*))?$/.exec(body);
  if (dec && (dec[1] || dec[2])) {
    const places = dec[2]?.length ?? 0;
    const p = Number((dec[1] || '0') + (dec[2] ?? ''));
    return { ok: true, value: reduce(sign * p, 10 ** places), kind: dec[2] === undefined ? 'integer' : 'decimal', places, length: s.length };
  }
  return { ok: false, reason: 'Use digits, one "/" or ".", and an optional leading "-".' };
}

/** Parse an answer-key value (integer, a/b or terminating decimal) without the entry-length limit. */
export function parseSprKey(key: string): Rational | null {
  const s = cleanseSpr(key).replace(/\s+/g, '');
  const m = /^(-?)(?:(\d+)\/(\d+)|(\d*)(?:\.(\d*))?)$/.exec(s);
  if (!m) return null;
  const sign = m[1] ? -1 : 1;
  if (m[2] !== undefined) return Number(m[3]) === 0 ? null : reduce(sign * Number(m[2]), Number(m[3]));
  if (!m[4] && !m[5]) return null;
  const places = m[5]?.length ?? 0;
  return reduce(sign * Number((m[4] || '0') + (m[5] ?? '')), 10 ** places);
}

/** Truncated and rounded (half away from zero) values of `k` at `places` decimal digits. */
function truncRound(k: Rational, places: number): [Rational, Rational] {
  const scale = 10 ** places;
  const mag = Math.abs(k.p) * scale;
  const sign = k.p < 0 ? -1 : 1;
  const trunc = idiv(mag, k.q);
  const round = idiv(2 * mag + k.q, 2 * k.q);
  return [reduce(sign * trunc, scale), reduce(sign * round, scale)];
}

/**
 * Whether a parsed response matches one key. Exact equality always counts (so 8/12 and 3.50
 * match 2/3 and 7/2). A decimal that isn't exact counts only if it fills the whole field and
 * equals the key truncated or rounded at that many places.
 */
function sprMatches(r: Extract<SprParse, { ok: true }>, key: Rational): boolean {
  if (eq(r.value, key)) return true;
  if (r.kind !== 'decimal') return false;
  const max = r.value.p < 0 || key.p < 0 ? SPR_MAX_CHARS_NEGATIVE : SPR_MAX_CHARS;
  if (r.length !== max) return false;
  const [t, rd] = truncRound(key, r.places);
  return eq(r.value, t) || eq(r.value, rd);
}

/**
 * Whether a key can be entered at all: as an exact form within the field, or as a decimal
 * filling the field. Used by the content pipeline to reject unenterable SPR keys.
 */
export function sprKeyFits(key: string): boolean {
  const k = parseSprKey(key);
  if (!k) return false;
  const max = k.p < 0 ? SPR_MAX_CHARS_NEGATIVE : SPR_MAX_CHARS;
  const sign = k.p < 0 ? '-' : '';
  const a = Math.abs(k.p);
  if ((sign + (k.q === 1 ? `${a}` : `${a}/${k.q}`)).length <= max) return true;
  const intLen = `${idiv(a, k.q)}`.length;
  // Room for at least one decimal digit after the integer part (leading 0 may be dropped).
  return sign.length + (intLen === 1 && a < k.q ? 0 : intLen) + 2 <= max;
}

/**
 * MC: response is the choice index. SPR: `answer` lists every correct value (several only when
 * the item has more than one right answer); extra equivalent forms in older rows are harmless.
 */
export function isCorrect(q: Question, response: number | string): boolean {
  if (typeof q.answer === 'number') return response === q.answer;
  if (typeof response !== 'string') return false;
  const r = parseSprResponse(response);
  if (!r.ok) return false;
  return q.answer.some((a) => {
    const key = parseSprKey(a);
    return key !== null && sprMatches(r, key);
  });
}
