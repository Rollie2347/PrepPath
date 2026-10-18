import { contour, evaluateLines, fmt, gridStep, pointsOfInterest, sampleFn, type LineResult, type Viewport } from '../model';
import { compile, parse } from '../parse';

const ev = (src: string, scope: Record<string, number> = {}, degrees = false) => compile(parse(src), { degrees, fns: {} })(scope);
const V: Viewport = { xmin: -10, xmax: 10, ymin: -10, ymax: 10 };
const fnOf = (r: LineResult) => {
  if (r.kind !== 'fn') throw new Error(`expected fn, got ${r.kind}`);
  return r.f;
};

describe('parse', () => {
  it('handles precedence, implicit multiplication and unary minus', () => {
    expect(ev('2+3*4')).toBe(14);
    expect(ev('2x', { x: 5 })).toBe(10);
    expect(ev('3(x+1)', { x: 2 })).toBe(9);
    expect(ev('-x^2', { x: 3 })).toBe(-9);
    expect(ev('2^3^2')).toBe(512);
    expect(ev('(x+1)(x-1)', { x: 3 })).toBe(8);
    expect(ev('xy', { x: 2, y: 4 })).toBe(8);
    expect(ev('2^-1')).toBe(0.5);
  });

  it('supports functions, constants and angle modes', () => {
    expect(ev('sqrt(49)')).toBe(7);
    expect(ev('√16')).toBe(4);
    expect(ev('2π')).toBeCloseTo(2 * Math.PI);
    expect(ev('sin(30)', {}, true)).toBeCloseTo(0.5);
    expect(ev('sin(pi/2)')).toBeCloseTo(1);
    expect(ev('log(1000)')).toBeCloseTo(3);
    expect(ev('log(2, 8)')).toBeCloseTo(3);
    expect(ev('abs(-4)')).toBe(4);
    expect(ev('x^(1/3)', { x: -8 })).toBeCloseTo(-2);
  });

  it('rejects malformed input', () => {
    expect(() => parse('2+')).toThrow();
    expect(() => parse('(3')).toThrow();
    expect(() => parse('3 $ 4')).toThrow();
  });
});

describe('evaluateLines', () => {
  it('classifies values, functions, vertical lines, points and implicit curves', () => {
    const r = evaluateLines(['2+2', 'y = 2x + 1', 'x = 3', '(1, 2)', 'x^2 + y^2 = 25', 'x^2 - 4', ''], false);
    expect(r[0]).toEqual({ kind: 'value', value: 4 });
    expect(fnOf(r[1])(2)).toBe(5);
    expect(r[2]).toEqual({ kind: 'vertical', x: 3 });
    expect(r[3]).toEqual({ kind: 'point', x: 1, y: 2 });
    expect(r[4].kind).toBe('implicit');
    expect(fnOf(r[5])(3)).toBe(5);
    expect(r[6].kind).toBe('empty');
  });

  it('turns a = 3 into a parameter used by other lines (slider)', () => {
    const r = evaluateLines(['a = 3', 'y = ax^2'], false);
    expect(r[0]).toEqual({ kind: 'param', name: 'a', value: 3 });
    expect(fnOf(r[1])(2)).toBe(12);
  });

  it('defines and calls user functions', () => {
    const r = evaluateLines(['f(x) = x^2 + 1', 'f(3)', 'y = f(x) - 1'], false);
    expect(r[1]).toEqual({ kind: 'value', value: 10 });
    expect(fnOf(r[2])(2)).toBe(4);
  });

  it('reports undefined variables and unsupported inequalities', () => {
    const r = evaluateLines(['y = kx', 'y < x'], false);
    expect(r[0].kind).toBe('error');
    expect(r[1].kind).toBe('error');
  });
});

describe('analysis (the Desmos tricks)', () => {
  it('finds intersections of two lines to solve a system', () => {
    const [a, b] = evaluateLines(['y = 3x - 2', 'y = -x + 6'], false).map(fnOf);
    const hits = pointsOfInterest(a, [b], V).filter((p) => p.label.startsWith('intersection'));
    expect(hits).toHaveLength(1);
    expect(hits[0].x).toBeCloseTo(2, 6);
    expect(hits[0].y).toBeCloseTo(4, 6);
  });

  it('finds zeros and the vertex of a parabola', () => {
    const [f] = evaluateLines(['y = x^2 - 6x + 5'], false).map(fnOf);
    const pois = pointsOfInterest(f, [], V);
    const zeros = pois.filter((p) => p.label.startsWith('x-intercept')).map((p) => p.x);
    expect(zeros[0]).toBeCloseTo(1, 6);
    expect(zeros[1]).toBeCloseTo(5, 6);
    const min = pois.find((p) => p.label.startsWith('minimum'))!;
    expect(min.x).toBeCloseTo(3, 4);
    expect(min.y).toBeCloseTo(-4, 6);
    expect(pois.find((p) => p.label.startsWith('y-intercept'))!.y).toBe(5);
  });

  it('does not report asymptote jumps as zeros', () => {
    const [f] = evaluateLines(['y = 1/x'], false).map(fnOf);
    expect(pointsOfInterest(f, [], V).filter((p) => p.label.startsWith('x-intercept'))).toHaveLength(0);
    expect(sampleFn(f, V).length).toBe(2);
  });

  it('traces a circle as an implicit curve', () => {
    const [c] = evaluateLines(['(x-3)^2 + (y+2)^2 = 16'], false);
    if (c.kind !== 'implicit') throw new Error('expected implicit');
    const segs = contour(c.F, V);
    expect(segs.length).toBeGreaterThan(50);
    for (const [x1, y1] of segs) expect(Math.hypot(x1 - 3, y1 + 2)).toBeCloseTo(4, 0);
  });

  it('formats like Desmos and picks tidy grid steps', () => {
    expect(fmt(2.999999999)).toBe('3');
    expect(fmt(-0.00001)).toBe('0');
    expect(fmt(1 / 3)).toBe('0.3333');
    expect(gridStep(20)).toBe(2);
    expect(gridStep(100)).toBe(10);
  });
});
