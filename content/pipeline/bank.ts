// The local question bank: content/bank/questions.jsonl, one Question per line.
// Every pipeline step reads and rewrites it; Firestore only ever receives approved rows.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Question } from '../../shared/types';

const here = path.dirname(fileURLToPath(import.meta.url));
export const BANK = path.resolve(here, '..', 'bank', 'questions.jsonl');

export interface BankRow extends Question {
  /** Pipeline notes: verifier verdicts, rejection reasons. Stripped before publish. */
  pipeline?: {
    verifiedAnswer?: number | string;
    notes?: string[];
    generatedAt?: string;
    model?: string;
    /** What proves the key (span, cell or step), from the generator. */
    governingClue?: string;
    /** "B errorCode: why it tempts" per wrong choice. */
    distractorRationale?: string[];
  };
}

export function readBank(): BankRow[] {
  if (!fs.existsSync(BANK)) return [];
  return fs
    .readFileSync(BANK, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l) as BankRow);
}

export function writeBank(rows: BankRow[]) {
  fs.mkdirSync(path.dirname(BANK), { recursive: true });
  fs.writeFileSync(BANK, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
}

/** Appends rows without rewriting the file, so parallel generate runs cannot clobber each other. */
export function appendBank(rows: BankRow[]) {
  if (!rows.length) return;
  fs.mkdirSync(path.dirname(BANK), { recursive: true });
  fs.appendFileSync(BANK, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
}

export function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

/** Word-trigram Jaccard similarity, used to catch near-duplicate stems. */
export function similarity(a: string, b: string): number {
  const grams = (s: string) => {
    const w = s.toLowerCase().replace(/[^a-z0-9$ ]/g, ' ').split(/\s+/).filter(Boolean);
    const out = new Set<string>();
    for (let i = 0; i + 2 < w.length; i++) out.add(`${w[i]} ${w[i + 1]} ${w[i + 2]}`);
    return out;
  };
  const A = grams(a);
  const B = grams(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const g of A) if (B.has(g)) inter++;
  return inter / (A.size + B.size - inter);
}
