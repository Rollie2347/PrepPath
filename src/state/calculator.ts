import { useSyncExternalStore } from 'react';

import type { Viewport } from '@/lib/calc/model';

/** Calculator state lives for the app session, so expressions survive closing the sheet mid-lesson. */
export interface CalcState {
  lines: { id: number; text: string; hidden: boolean }[];
  degrees: boolean;
  view: Viewport;
}

export const HOME_VIEW: Viewport = { xmin: -10, xmax: 10, ymin: -10, ymax: 10 };

let state: CalcState = { lines: [{ id: 1, text: '', hidden: false }], degrees: false, view: HOME_VIEW };
let nextId = 2;
const listeners = new Set<() => void>();

export function setCalc(update: (s: CalcState) => CalcState) {
  state = update(state);
  listeners.forEach((l) => l());
}

export const newLine = (text = '') => ({ id: nextId++, text, hidden: false });

export function useCalc(): CalcState {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => state,
  );
}
