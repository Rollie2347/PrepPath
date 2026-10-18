export interface Segment {
  kind: 'text' | 'inline' | 'display';
  value: string;
}

/**
 * Splits question text into prose and `$...$` / `$$...$$` math, using Pandoc's rules so a money
 * `$` in prose is not read as math: an opening `$` needs a non-space right after it, and a
 * closing `$` needs a non-space right before it and no digit right after it. A `$` that fails
 * the closing test before a valid closer turns up means the opener was a money sign. `\$` is a
 * literal dollar in prose (and KaTeX's dollar inside math).
 */
export function splitMath(s: string): Segment[] {
  const out: Segment[] = [];
  let text = '';
  const flush = () => {
    if (text) out.push({ kind: 'text', value: text });
    text = '';
  };
  let i = 0;
  while (i < s.length) {
    if (s[i] === '\\' && s[i + 1] === '$') {
      text += '$';
      i += 2;
      continue;
    }
    if (s.startsWith('$$', i)) {
      const close = s.indexOf('$$', i + 2);
      if (close > i + 2) {
        flush();
        out.push({ kind: 'display', value: s.slice(i + 2, close) });
        i = close + 2;
        continue;
      }
    }
    if (s[i] === '$' && s[i + 1] !== undefined && !/\s/.test(s[i + 1])) {
      const close = findCloser(s, i + 1);
      if (close !== -1) {
        flush();
        out.push({ kind: 'inline', value: s.slice(i + 1, close) });
        i = close + 1;
        continue;
      }
    }
    text += s[i];
    i++;
  }
  flush();
  return out;
}

function findCloser(s: string, from: number): number {
  for (let j = from; j < s.length; j++) {
    if (s[j] === '\\') {
      j++;
      continue;
    }
    if (s[j] !== '$') continue;
    const before = s[j - 1];
    const after = s[j + 1] ?? '';
    return j > from && !/\s/.test(before) && !/\d/.test(after) ? j : -1;
  }
  return -1;
}

/** Inline math that holds running prose: the sign of a money `$` the parser could not tell apart. */
export function proseInMath(s: string): string[] {
  return splitMath(s)
    // Lowercase only: capitalized runs inside math are labels such as "\triangle ABC".
    .filter((g) => g.kind === 'inline' && /[a-z]{3,}\s+[a-z]{3,}/.test(g.value.replace(/\\[a-zA-Z]+(\{[^}]*\})?/g, '')))
    .map((g) => g.value);
}

export type Table = { head: string[]; rows: string[][] };
const ROW = /^\s*\|.*\|\s*$/;
const SEPARATOR = /^\s*\|(\s*:?-{2,}:?\s*\|)+\s*$/;
const cells = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((c) => c.trim());

/** Splits text into prose and Markdown tables (a header row, a --- row, then body rows). */
export function splitTables(text: string): (string | Table)[] {
  const lines = text.split('\n');
  const out: (string | Table)[] = [];
  let prose: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (ROW.test(lines[i]) && SEPARATOR.test(lines[i + 1] ?? '')) {
      if (prose.length) out.push(prose.join('\n'));
      prose = [];
      const table: Table = { head: cells(lines[i]), rows: [] };
      i += 2;
      while (i < lines.length && ROW.test(lines[i])) table.rows.push(cells(lines[i++]));
      i--;
      out.push(table);
    } else prose.push(lines[i]);
  }
  if (prose.length) out.push(prose.join('\n'));
  return out;
}
