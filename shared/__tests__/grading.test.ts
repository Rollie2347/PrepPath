import { isCorrect, parseSprResponse, sprKeyFits } from '../grading';
import type { Question } from '../types';

const base = { id: 'q', test: 'sat', sectionId: 'sat.math', skillId: 's', difficulty: 3, stem: '', explanation: '', reviewStatus: 'approved', source: { kind: 'generated', name: '', license: '' } } as const;
const spr = (...answer: string[]) => ({ ...base, answer }) as Question;
const grade = (q: Question, rs: string[]) => rs.map((r) => isCorrect(q, r));

describe('isCorrect: multiple choice', () => {
  it('grades by index', () => {
    const mc = { ...base, choices: ['a', 'b'], answer: 1 } as Question;
    expect(isCorrect(mc, 1)).toBe(true);
    expect(isCorrect(mc, 0)).toBe(false);
    expect(isCorrect(mc, '1')).toBe(false);
  });
});

describe('isCorrect: SPR (College Board directions examples)', () => {
  it('2/3: accepts full-field decimals, rejects short ones', () => {
    const q = spr('2/3');
    expect(grade(q, ['2/3', '.6666', '.6667', '0.666', '0.667'])).toEqual([true, true, true, true, true]);
    expect(grade(q, ['0.66', '.66', '0.67', '.67', '.666', '0.6'])).toEqual([false, false, false, false, false, false]);
  });

  it('7/2 (3½): accepts 3.5, 3.50, 7/2; rejects mixed numbers', () => {
    const q = spr('7/2');
    expect(grade(q, ['3.5', '3.50', '7/2', '14/4'])).toEqual([true, true, true, true]);
    expect(grade(q, ['31/2', '3 1/2', '3'])).toEqual([false, false, false]);
  });

  it('-1/3: six characters allowed with the minus sign', () => {
    const q = spr('-1/3');
    expect(grade(q, ['-1/3', '-.3333', '-0.333', '−1/3'])).toEqual([true, true, true, true]);
    expect(grade(q, ['-.33', '-0.33', '1/3'])).toEqual([false, false, false]);
  });

  it('accepts equivalent fractions and exact decimals', () => {
    expect(grade(spr('2/3'), ['8/12', '4/6'])).toEqual([true, true]);
    expect(grade(spr('3/4'), ['.75', '0.75', '3/4', '6/8'])).toEqual([true, true, true, true]);
    expect(isCorrect(spr('3/4'), '0.7')).toBe(false);
  });

  it('rounds or truncates at the field width for repeating keys', () => {
    const q = spr('46/3'); // 15.333…
    expect(grade(q, ['15.33', '46/3'])).toEqual([true, true]);
    expect(grade(q, ['15.3', '15.34'])).toEqual([false, false]);
    expect(grade(spr('23/3'), ['7.666', '7.667', '7.66', '7.67'])).toEqual([true, true, false, false]);
  });

  it('rejects %, $, commas, spaces and over-long entries', () => {
    expect(grade(spr('1500'), ['1,500', '$1500', '1500%', '15 00'])).toEqual([false, false, false, false]);
    expect(isCorrect(spr('2/3'), '0.6667')).toBe(false);
  });

  it('applies cleansing of doubled slashes and decimal points', () => {
    expect(isCorrect(spr('3/4'), '3//4')).toBe(true);
    expect(isCorrect(spr('7/2'), '3..5')).toBe(true);
  });

  it('accepts any one of several keys', () => {
    const q = spr('-2', '5');
    expect(grade(q, ['5', '-2', '3'])).toEqual([true, true, false]);
  });

  it('stays compatible with older rows listing several forms', () => {
    const q = spr('2/3', '.6666', '.6667', '0.666', '0.667');
    expect(grade(q, ['8/12', '0.667', '0.66'])).toEqual([true, true, false]);
  });

  it('never matches a non-string response or zero denominator', () => {
    expect(isCorrect(spr('2'), 2)).toBe(false);
    expect(isCorrect(spr('2'), '4/0')).toBe(false);
  });
});

describe('parseSprResponse', () => {
  it('gives a reason for invalid entries', () => {
    expect(parseSprResponse('3 1/2')).toMatchObject({ ok: false });
    expect(parseSprResponse('abc')).toMatchObject({ ok: false });
    expect(parseSprResponse('')).toMatchObject({ ok: false });
    expect(parseSprResponse('-12.5')).toMatchObject({ ok: true, kind: 'decimal' });
  });
});

describe('sprKeyFits', () => {
  it('accepts keys enterable as a fraction or full-field decimal', () => {
    expect(['2/3', '46/3', '1000/7', '12.345', '-99999', '0'].map(sprKeyFits)).toEqual([true, true, true, true, true, true]);
    expect(['123456', 'abc', '1/0', '-1234567'].map(sprKeyFits)).toEqual([false, false, false, false]);
  });
});
