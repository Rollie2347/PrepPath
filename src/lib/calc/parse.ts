/**
 * Expression parser for the graphing calculator. Supports + − × ÷ ^, implicit multiplication
 * (2x, 3(x+1), xy, 2sin(x)), unary minus, functions, π and e, single-letter variables, and
 * user functions f(x). Parses to an AST that is compiled to a fast closure.
 */

export type Node =
  | { t: 'num'; v: number }
  | { t: 'var'; name: string }
  | { t: 'neg'; a: Node }
  | { t: 'bin'; op: '+' | '-' | '*' | '/' | '^'; a: Node; b: Node }
  | { t: 'call'; name: string; args: Node[] };

/** Built-in functions. Trig functions honour the angle mode passed at evaluation time. */
export const FUNCTIONS = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sqrt', 'abs', 'ln', 'log', 'exp', 'floor', 'ceil', 'round'] as const;
const FN_SET = new Set<string>(FUNCTIONS);
const TRIG = new Set(['sin', 'cos', 'tan']);
const INV_TRIG = new Set(['asin', 'acos', 'atan']);

type Tok = { k: 'num'; v: number } | { k: 'id'; v: string } | { k: 'op'; v: string };

export class ParseError extends Error {}

function tokenize(src: string): Tok[] {
  const s = src
    .replace(/[×·]/g, '*')
    .replace(/÷/g, '/')
    .replace(/[−–]/g, '-')
    .replace(/π/g, ' pi ')
    .replace(/√/g, ' sqrt ');
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) {
      i++;
    } else if (/[0-9.]/.test(c)) {
      const m = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i));
      if (!m) throw new ParseError(`Bad number near "${s.slice(i, i + 4)}"`);
      out.push({ k: 'num', v: Number(m[1]) });
      i += m[1].length;
    } else if (/[a-zA-Z]/.test(c)) {
      // Longest known function / constant name first; otherwise one letter at a time so "xy" = x·y.
      const rest = s.slice(i);
      const word = [...FUNCTIONS, 'pi'].sort((a, b) => b.length - a.length).find((f) => rest.startsWith(f));
      const v = word ?? c;
      out.push({ k: 'id', v });
      i += v.length;
    } else if ('+-*/^(),'.includes(c)) {
      out.push({ k: 'op', v: c });
      i++;
    } else {
      throw new ParseError(`Unexpected "${c}"`);
    }
  }
  return out;
}

/** Pratt parser. `userFns` are names defined as f(x) = … so "f(2)" is a call, not f·2. */
export function parse(src: string, userFns: Set<string> = new Set()): Node {
  const toks = tokenize(src);
  let p = 0;
  const peek = () => toks[p];
  const isOp = (v: string) => peek()?.k === 'op' && peek()!.v === v;
  const expect = (v: string) => {
    if (!isOp(v)) throw new ParseError(`Expected "${v}"`);
    p++;
  };
  /** Tokens that can start a factor, so "2x" or ")(" mean multiplication. */
  const startsFactor = () => {
    const t = peek();
    return !!t && (t.k === 'num' || t.k === 'id' || (t.k === 'op' && t.v === '('));
  };

  function primary(): Node {
    const t = toks[p++];
    if (!t) throw new ParseError('Incomplete expression');
    if (t.k === 'num') return { t: 'num', v: t.v };
    if (t.k === 'op' && t.v === '(') {
      const e = expr(0);
      expect(')');
      return e;
    }
    if (t.k === 'op' && t.v === '-') return { t: 'neg', a: power() };
    if (t.k === 'op' && t.v === '+') return power();
    if (t.k === 'id') {
      if (t.v === 'pi') return { t: 'num', v: Math.PI };
      if (FN_SET.has(t.v) || userFns.has(t.v)) {
        // Allow "sin x" and "sin(x)"; user functions need parentheses.
        if (isOp('(')) {
          p++;
          const args = [expr(0)];
          while (isOp(',')) {
            p++;
            args.push(expr(0));
          }
          expect(')');
          return { t: 'call', name: t.v, args };
        }
        if (FN_SET.has(t.v)) return { t: 'call', name: t.v, args: [power()] };
      }
      if (t.v === 'e' && !userFns.has('e')) return { t: 'num', v: Math.E };
      return { t: 'var', name: t.v };
    }
    throw new ParseError(`Unexpected "${t.v}"`);
  }

  /** Right-associative ^ binds tighter than unary minus on its left: -x^2 = -(x^2). */
  function power(): Node {
    const base = primary();
    if (isOp('^')) {
      p++;
      return { t: 'bin', op: '^', a: base, b: power() };
    }
    return base;
  }

  function term(): Node {
    let left = power();
    for (;;) {
      if (isOp('*') || isOp('/')) {
        const op = toks[p++].v as '*' | '/';
        left = { t: 'bin', op, a: left, b: power() };
      } else if (startsFactor()) {
        left = { t: 'bin', op: '*', a: left, b: power() };
      } else return left;
    }
  }

  function expr(_min: number): Node {
    let left = term();
    while (isOp('+') || isOp('-')) {
      const op = toks[p++].v as '+' | '-';
      left = { t: 'bin', op, a: left, b: term() };
    }
    return left;
  }

  const e = expr(0);
  if (p < toks.length) throw new ParseError(`Unexpected "${toks[p].v}"`);
  return e;
}

export function variables(n: Node, out: Set<string> = new Set()): Set<string> {
  if (n.t === 'var') out.add(n.name);
  else if (n.t === 'neg') variables(n.a, out);
  else if (n.t === 'bin') {
    variables(n.a, out);
    variables(n.b, out);
  } else if (n.t === 'call') n.args.forEach((a) => variables(a, out));
  return out;
}

export function calls(n: Node, out: Set<string> = new Set()): Set<string> {
  if (n.t === 'call') {
    out.add(n.name);
    n.args.forEach((a) => calls(a, out));
  } else if (n.t === 'neg') calls(n.a, out);
  else if (n.t === 'bin') {
    calls(n.a, out);
    calls(n.b, out);
  }
  return out;
}

export type Scope = Record<string, number>;
export type UserFn = (args: number[]) => number;
export interface EvalEnv {
  degrees: boolean;
  fns: Record<string, UserFn>;
}

/** Compiles an AST to a closure over a variable scope. Unknown variables evaluate to NaN. */
export function compile(n: Node, env: EvalEnv): (s: Scope) => number {
  switch (n.t) {
    case 'num':
      return () => n.v;
    case 'var':
      return (s) => s[n.name] ?? NaN;
    case 'neg': {
      const a = compile(n.a, env);
      return (s) => -a(s);
    }
    case 'bin': {
      const a = compile(n.a, env);
      const b = compile(n.b, env);
      switch (n.op) {
        case '+':
          return (s) => a(s) + b(s);
        case '-':
          return (s) => a(s) - b(s);
        case '*':
          return (s) => a(s) * b(s);
        case '/':
          return (s) => a(s) / b(s);
        case '^':
          return (s) => pow(a(s), b(s));
      }
    }
    // falls through (exhaustive above)
    case 'call': {
      const args = n.args.map((x) => compile(x, env));
      const user = env.fns[n.name];
      if (user) return (s) => user(args.map((f) => f(s)));
      const k = env.degrees ? Math.PI / 180 : 1;
      const one = (f: (v: number) => number) => (s: Scope) => f(args[0](s));
      if (TRIG.has(n.name)) {
        const f = Math[n.name as 'sin' | 'cos' | 'tan'];
        return one((v) => f(v * k));
      }
      if (INV_TRIG.has(n.name)) {
        const f = Math[n.name as 'asin' | 'acos' | 'atan'];
        return one((v) => f(v) / k);
      }
      switch (n.name) {
        case 'sqrt':
          return one(Math.sqrt);
        case 'abs':
          return one(Math.abs);
        case 'ln':
          return one(Math.log);
        case 'log':
          // log(x) is base 10; log(b, x) is base b.
          return args.length === 2 ? (s) => Math.log(args[1](s)) / Math.log(args[0](s)) : one(Math.log10);
        case 'exp':
          return one(Math.exp);
        case 'floor':
          return one(Math.floor);
        case 'ceil':
          return one(Math.ceil);
        case 'round':
          return one(Math.round);
      }
      return () => NaN;
    }
  }
}

/** Real power: negative bases with odd-denominator rational exponents (e.g. x^(1/3)) stay real. */
function pow(a: number, b: number): number {
  if (a >= 0 || Number.isInteger(b)) return a ** b;
  for (const d of [3, 5, 7, 9]) {
    const n = b * d;
    if (Math.abs(n - Math.round(n)) < 1e-9) return Math.round(n) % 2 === 0 ? (-a) ** b : -((-a) ** b);
  }
  return NaN;
}
