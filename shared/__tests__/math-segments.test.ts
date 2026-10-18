import { proseInMath, splitMath, splitTables } from '../math-segments';

const kinds = (s: string) => splitMath(s).map((g) => `${g.kind[0]}:${g.value}`);

describe('splitMath', () => {
  it('splits inline and display math', () => {
    expect(kinds('Solve $3x + 7 = 22$ now')).toEqual(['t:Solve ', 'i:3x + 7 = 22', 't: now']);
    expect(kinds('$$y=2$$')).toEqual(['d:y=2']);
  });

  it('keeps money signs in prose', () => {
    expect(kinds('Adult tickets cost $8 each, and student tickets cost $5 each, where $x$ is adults.')).toEqual([
      't:Adult tickets cost $8 each, and student tickets cost $5 each, where ',
      'i:x',
      't: is adults.',
    ]);
    expect(kinds('cost about $100 and take weeks, cutting it to about $2.')).toEqual(['t:cost about $100 and take weeks, cutting it to about $2.']);
    expect(kinds('That costs 45 + 252 = $297, and')).toEqual(['t:That costs 45 + 252 = $297, and']);
  });

  it('treats \\$ as a literal dollar in prose and as KaTeX dollar in math', () => {
    expect(kinds('a fee of \\$25 per month')).toEqual(['t:a fee of $25 per month']);
    expect(kinds('a fee of $\\$25$ per month')).toEqual(['t:a fee of ', 'i:\\$25', 't: per month']);
  });

  it('accepts single-character and adjacent math', () => {
    expect(kinds('$5$')).toEqual(['i:5']);
    expect(kinds('$a$, $b$')).toEqual(['i:a', 't:, ', 'i:b']);
  });
});

describe('proseInMath', () => {
  it('ignores \\text and commands, flags running prose', () => {
    expect(proseInMath('$30^\\circ\\text{C}$')).toEqual([]);
    expect(proseInMath('$\\begin{cases} s + l = 30 \\end{cases}$')).toEqual([]);
    expect(proseInMath('$total cost = 5x$')).toEqual(['total cost = 5x']);
  });
});

describe('splitTables', () => {
  it('splits prose and a Markdown table', () => {
    const out = splitTables('Intro line.\n\n| $x$ | 1 | 2 |\n|---|---|---|\n| $f(x)$ | 4 | 5 |\n\nAfter.');
    expect(out).toEqual(['Intro line.\n', { head: ['$x$', '1', '2'], rows: [['$f(x)$', '4', '5']] }, '\nAfter.']);
  });

  it('leaves text without a separator row alone', () => {
    expect(splitTables('| not | a table |')).toEqual(['| not | a table |']);
  });
});

describe('proseInMath: geometry labels', () => {
  it('does not flag capitalized point names', () => {
    expect(proseInMath('$\triangle ABC \cong \triangle DEF$')).toEqual([]);
  });
});
