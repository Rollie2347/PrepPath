import { calls, compile, parse, ParseError, variables, type EvalEnv, type Node, type Scope } from './parse';

export interface Viewport {
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
}

export type LineResult =
  | { kind: 'empty' }
  | { kind: 'error'; message: string }
  | { kind: 'value'; value: number }
  | { kind: 'param'; name: string; value: number }
  | { kind: 'fn'; f: (x: number) => number; name?: string }
  | { kind: 'vertical'; x: number }
  | { kind: 'implicit'; F: (x: number, y: number) => number }
  | { kind: 'point'; x: number; y: number };

const DEF_FN = /^\s*([a-wzA-Z])\s*\(\s*x\s*\)\s*=(.+)$/;
const DEF_PARAM = /^\s*([a-wzA-Z])\s*=(.+)$/;

/** Splits "lhs = rhs" (one top-level =). Inequalities are not graphed yet. */
function sides(text: string): [string, string] | null {
  if (/[<>≤≥]/.test(text)) throw new ParseError('Inequalities are not supported yet');
  const parts = text.split('=');
  if (parts.length > 2) throw new ParseError('Use only one "="');
  return parts.length === 2 ? [parts[0], parts[1]] : null;
}

/**
 * Evaluates every line together, Desmos-style: `a = 3` lines become parameters (sliders), `f(x) = …`
 * lines become callable functions, and everything else graphs or evaluates against them.
 */
export function evaluateLines(texts: string[], degrees: boolean): LineResult[] {
  const fnDefs = new Map<string, Node>();
  const userFns = new Set<string>();
  for (const t of texts) {
    const m = DEF_FN.exec(t);
    if (m) userFns.add(m[1]);
  }
  const env: EvalEnv = { degrees, fns: {} };
  const params: Scope = {};

  // Parameters may reference each other; resolve in a few passes.
  const paramNodes = new Map<string, Node>();
  texts.forEach((t) => {
    const m = DEF_PARAM.exec(t);
    if (!m || m[1] === 'x' || m[1] === 'y' || userFns.has(m[1])) return;
    try {
      const n = parse(m[2], userFns);
      const vs = variables(n);
      if (!vs.has('x') && !vs.has('y')) paramNodes.set(m[1], n);
    } catch {
      /* reported per line below */
    }
  });
  for (let pass = 0; pass < 4; pass++)
    for (const [name, n] of paramNodes) params[name] = compile(n, env)(params);

  for (const t of texts) {
    const m = DEF_FN.exec(t);
    if (!m) continue;
    try {
      fnDefs.set(m[1], parse(m[2], userFns));
    } catch {
      /* reported per line */
    }
  }
  for (const [name, body] of fnDefs) {
    let compiled: ((s: Scope) => number) | null = null;
    env.fns[name] = (args) => {
      compiled ??= compile(body, env);
      return compiled({ ...params, x: args[0] });
    };
  }

  return texts.map((text): LineResult => {
    if (!text.trim()) return { kind: 'empty' };
    try {
      const fm = DEF_FN.exec(text);
      if (fm) {
        const f = env.fns[fm[1]];
        return { kind: 'fn', name: fm[1], f: (x) => f([x]) };
      }
      const pm = DEF_PARAM.exec(text);
      if (pm && paramNodes.has(pm[1])) return { kind: 'param', name: pm[1], value: params[pm[1]] };

      const point = /^\s*\((.+),(.+)\)\s*$/.exec(text);
      if (point && !text.includes('=')) {
        const px = compile(parse(point[1], userFns), env)(params);
        const py = compile(parse(point[2], userFns), env)(params);
        return { kind: 'point', x: px, y: py };
      }

      const lr = sides(text);
      if (!lr) {
        const n = parse(text, userFns);
        const vs = variables(n);
        unknownCheck(vs, params, calls(n), env);
        const g = compile(n, env);
        if (vs.has('y')) return { kind: 'error', message: 'Add "=" to graph an equation in x and y' };
        if (vs.has('x')) return { kind: 'fn', f: (x) => g({ ...params, x }) };
        return { kind: 'value', value: g(params) };
      }
      const [lhsSrc, rhsSrc] = lr;
      const lhs = parse(lhsSrc, userFns);
      const rhs = parse(rhsSrc, userFns);
      const lv = variables(lhs);
      const rv = variables(rhs);
      unknownCheck(new Set([...lv, ...rv]), params, new Set([...calls(lhs), ...calls(rhs)]), env);
      const L = compile(lhs, env);
      const R = compile(rhs, env);
      // y = f(x)
      if (lhs.t === 'var' && lhs.name === 'y' && !rv.has('y')) return { kind: 'fn', f: (x) => R({ ...params, x }) };
      if (rhs.t === 'var' && rhs.name === 'y' && !lv.has('y')) return { kind: 'fn', f: (x) => L({ ...params, x }) };
      // x = c
      if (lhs.t === 'var' && lhs.name === 'x' && !rv.has('x') && !rv.has('y')) return { kind: 'vertical', x: R(params) };
      if (rhs.t === 'var' && rhs.name === 'x' && !lv.has('x') && !lv.has('y')) return { kind: 'vertical', x: L(params) };
      // Anything else in x and/or y is an implicit curve F(x, y) = 0.
      return { kind: 'implicit', F: (x, y) => L({ ...params, x, y }) - R({ ...params, x, y }) };
    } catch (e) {
      return { kind: 'error', message: e instanceof Error ? e.message : String(e) };
    }
  });
}

function unknownCheck(vs: Set<string>, params: Scope, fns: Set<string>, env: EvalEnv) {
  for (const v of vs) if (v !== 'x' && v !== 'y' && !(v in params)) throw new ParseError(`Define ${v} (e.g. "${v} = 1") to use it`);
  void fns;
  void env;
}

// ---------------------------------------------------------------- analysis

export interface Poi {
  x: number;
  y: number;
  label: string;
}

const SAMPLES = 600;

function bisect(g: (x: number) => number, a: number, b: number): number {
  let ga = g(a);
  for (let i = 0; i < 60; i++) {
    const m = (a + b) / 2;
    const gm = g(m);
    if (gm === 0) return m;
    if (Math.sign(gm) === Math.sign(ga)) [a, ga] = [m, gm];
    else b = m;
  }
  return (a + b) / 2;
}

/** Golden-section search for an extremum of f on [a, b]; `max` picks maximum. */
function golden(f: (x: number) => number, a: number, b: number, max: boolean): number {
  const r = (Math.sqrt(5) - 1) / 2;
  const s = max ? -1 : 1;
  let c = b - r * (b - a);
  let d = a + r * (b - a);
  for (let i = 0; i < 80; i++) {
    if (s * f(c) < s * f(d)) b = d;
    else a = c;
    c = b - r * (b - a);
    d = a + r * (b - a);
  }
  return (a + b) / 2;
}

/** Sign-change roots of g on the viewport, skipping jumps across asymptotes. */
function roots(g: (x: number) => number, v: Viewport): number[] {
  const out: number[] = [];
  const dx = (v.xmax - v.xmin) / SAMPLES;
  const span = v.ymax - v.ymin;
  let px = v.xmin;
  let py = g(px);
  for (let i = 1; i <= SAMPLES; i++) {
    const x = v.xmin + i * dx;
    const y = g(x);
    if (Number.isFinite(py) && Number.isFinite(y)) {
      if (py === 0) out.push(px);
      else if (Math.sign(py) !== Math.sign(y) && Math.abs(y - py) < span * 2) out.push(bisect(g, px, x));
    }
    px = x;
    py = y;
  }
  return dedupe(out, dx);
}

function dedupe(xs: number[], tol: number): number[] {
  const out: number[] = [];
  for (const x of xs.sort((a, b) => a - b)) if (!out.length || Math.abs(x - out[out.length - 1]) > tol) out.push(x);
  return out;
}

/** Rounds for display the way Desmos does: up to 4 decimals, no trailing zeros. */
export function fmt(n: number): string {
  if (!Number.isFinite(n)) return 'undefined';
  const r = Math.round(n * 1e4) / 1e4;
  return String(Object.is(r, -0) ? 0 : r);
}

/**
 * Points of interest for a selected function curve: x-intercepts, local max/min, y-intercept,
 * and intersections with every other graphed function.
 */
export function pointsOfInterest(f: (x: number) => number, others: ((x: number) => number)[], v: Viewport): Poi[] {
  const pois: Poi[] = [];
  const pt = (x: number, label: string) => {
    const y = f(x);
    if (Number.isFinite(y)) pois.push({ x, y, label: `${label} (${fmt(x)}, ${fmt(y)})` });
  };
  for (const x of roots(f, v)) pt(x, 'x-intercept');
  if (v.xmin <= 0 && v.xmax >= 0 && Number.isFinite(f(0))) pt(0, 'y-intercept');

  const dx = (v.xmax - v.xmin) / SAMPLES;
  let prev = f(v.xmin + dx) - f(v.xmin);
  for (let i = 1; i < SAMPLES; i++) {
    const x = v.xmin + i * dx;
    const d = f(x + dx) - f(x);
    if (Number.isFinite(prev) && Number.isFinite(d) && prev !== 0 && Math.sign(d) !== Math.sign(prev)) {
      const max = prev > 0;
      const ex = golden(f, x - dx, x + dx, max);
      // Skip cusps/asymptotes where the "extremum" is really a jump.
      if (Math.abs(f(ex) - f(x)) < (v.ymax - v.ymin) / 4) pt(ex, max ? 'maximum' : 'minimum');
    }
    if (d !== 0) prev = d;
  }
  for (const g of others) for (const x of roots((t) => f(t) - g(t), v)) pt(x, 'intersection');
  return pois;
}

/** Intersections of a vertical line x = c with function curves. */
export function verticalPois(c: number, fns: ((x: number) => number)[]): Poi[] {
  return fns.flatMap((f) => {
    const y = f(c);
    return Number.isFinite(y) ? [{ x: c, y, label: `intersection (${fmt(c)}, ${fmt(y)})` }] : [];
  });
}

// ---------------------------------------------------------------- sampling

/** Polyline pieces for y = f(x), split at undefined points and asymptote jumps. */
export function sampleFn(f: (x: number) => number, v: Viewport, n = SAMPLES): [number, number][][] {
  const pieces: [number, number][][] = [];
  let cur: [number, number][] = [];
  const span = v.ymax - v.ymin;
  const dx = (v.xmax - v.xmin) / n;
  let last: number | null = null;
  for (let i = 0; i <= n; i++) {
    const x = v.xmin + i * dx;
    const y = f(x);
    const ok = Number.isFinite(y) && Math.abs(y) < 1e7;
    if (!ok || (last !== null && Math.abs(y - last) > span * 3)) {
      if (cur.length > 1) pieces.push(cur);
      cur = [];
    }
    if (ok) cur.push([x, y]);
    last = ok ? y : null;
  }
  if (cur.length > 1) pieces.push(cur);
  return pieces;
}

/** Marching squares: line segments approximating F(x, y) = 0 on the viewport. */
export function contour(F: (x: number, y: number) => number, v: Viewport, cells = 90): [number, number, number, number][] {
  const nx = cells;
  const ny = cells;
  const dx = (v.xmax - v.xmin) / nx;
  const dy = (v.ymax - v.ymin) / ny;
  const g: number[][] = [];
  for (let j = 0; j <= ny; j++) {
    const row: number[] = [];
    for (let i = 0; i <= nx; i++) row.push(F(v.xmin + i * dx, v.ymin + j * dy));
    g.push(row);
  }
  const segs: [number, number, number, number][] = [];
  const lerp = (a: number, b: number) => (a === b ? 0.5 : a / (a - b));
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const a = g[j][i];
      const b = g[j][i + 1];
      const c = g[j + 1][i + 1];
      const d = g[j + 1][i];
      if (![a, b, c, d].every(Number.isFinite)) continue;
      const x0 = v.xmin + i * dx;
      const y0 = v.ymin + j * dy;
      const pts: [number, number][] = [];
      if (Math.sign(a) !== Math.sign(b)) pts.push([x0 + lerp(a, b) * dx, y0]);
      if (Math.sign(b) !== Math.sign(c)) pts.push([x0 + dx, y0 + lerp(b, c) * dy]);
      if (Math.sign(c) !== Math.sign(d)) pts.push([x0 + (1 - lerp(c, d)) * dx, y0 + dy]);
      if (Math.sign(d) !== Math.sign(a)) pts.push([x0, y0 + (1 - lerp(d, a)) * dy]);
      if (pts.length >= 2) segs.push([pts[0][0], pts[0][1], pts[1][0], pts[1][1]]);
      if (pts.length === 4) segs.push([pts[2][0], pts[2][1], pts[3][0], pts[3][1]]);
    }
  return segs;
}

/** Grid spacing that gives roughly 5–10 lines across a span (1, 2, 5 × 10^k). */
export function gridStep(span: number): number {
  const raw = span / 8;
  const p = 10 ** Math.floor(Math.log10(raw));
  const m = raw / p;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
}
