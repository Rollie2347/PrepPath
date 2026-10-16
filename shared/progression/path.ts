import { getTest } from '../taxonomy';
import type { TestId } from '../types';

export const LEVELS_PER_NODE = 4;
export const QUESTIONS_PER_LESSON = 10;
export const LEGENDARY_QUESTIONS = 12;
export const CHECKPOINT_QUESTIONS = 15;

export type NodeKind = 'skill' | 'review' | 'chest' | 'checkpoint';

export interface PathNode {
  id: string;
  kind: NodeKind;
  title: string;
  /** Skills this node draws questions from. */
  skillIds: string[];
}

export interface Unit {
  id: string;
  title: string;
  sectionName: string;
  nodes: PathNode[];
}

/**
 * One unit per content domain, in taxonomy order (sections interleaved so a student
 * alternates R&W and Math rather than grinding one section). Each unit:
 * skill nodes, a review node mid-way, a chest, and a checkpoint that allows jumping ahead.
 */
export function buildPath(test: TestId): Unit[] {
  const spec = getTest(test);
  const perSection = spec.sections.map((s) => s.domains.map((d) => ({ s, d })));
  const order: { s: (typeof spec.sections)[number]; d: (typeof spec.sections)[number]['domains'][number] }[] = [];
  const longest = Math.max(...perSection.map((x) => x.length));
  for (let i = 0; i < longest; i++) for (const sec of perSection) if (sec[i]) order.push(sec[i]);

  return order.map(({ s, d }) => {
    const skillNodes: PathNode[] = d.skills.map((k) => ({
      id: `${k.id}`,
      kind: 'skill',
      title: k.name,
      skillIds: [k.id],
    }));
    const all = d.skills.map((k) => k.id);
    const nodes: PathNode[] = [];
    const mid = Math.ceil(skillNodes.length / 2);
    nodes.push(...skillNodes.slice(0, mid));
    if (skillNodes.length > 1) nodes.push({ id: `${d.id}#review`, kind: 'review', title: `${d.name} review`, skillIds: all });
    nodes.push({ id: `${d.id}#chest`, kind: 'chest', title: 'Chest', skillIds: [] });
    nodes.push(...skillNodes.slice(mid));
    nodes.push({ id: `${d.id}#checkpoint`, kind: 'checkpoint', title: `${d.name} checkpoint`, skillIds: all });
    return { id: d.id, title: d.name, sectionName: s.name, nodes };
  });
}

export interface NodeProgress {
  level: number; // 0..LEVELS_PER_NODE
  legendary: boolean;
}

/** Difficulty band a node's current level draws from (level 0 → easiest). */
export function levelDifficulty(level: number): [number, number] {
  const bands: [number, number][] = [
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
  ];
  return bands[Math.min(level, bands.length - 1)];
}

/** First node not yet started/finished — where the bouncing "Start" sits. */
export function currentNode(units: Unit[], progress: Record<string, NodeProgress>): string | null {
  for (const u of units)
    for (const n of u.nodes) if ((progress[n.id]?.level ?? 0) < 1) return n.id;
  return null;
}

/**
 * Whether a node can be played. Nodes up to the current one are open; a checkpoint is also
 * open for the unit the user is currently in (that is how "jump ahead" works).
 */
export function isUnlocked(units: Unit[], progress: Record<string, NodeProgress>, nodeId: string): boolean {
  const flat = units.flatMap((u) => u.nodes);
  const cur = currentNode(units, progress);
  if (cur === null) return flat.some((n) => n.id === nodeId);
  const idx = flat.findIndex((n) => n.id === nodeId);
  if (idx === -1) return false;
  if (idx <= flat.findIndex((n) => n.id === cur)) return true;
  const unit = units.find((u) => u.nodes.some((n) => n.id === cur));
  return !!unit && unit.nodes.at(-1)?.id === nodeId;
}

export function findNode(units: Unit[], nodeId: string): { unit: Unit; node: PathNode } | null {
  for (const unit of units) {
    const node = unit.nodes.find((n) => n.id === nodeId);
    if (node) return { unit, node };
  }
  return null;
}

/** Passing a checkpoint marks every node in the unit as at least level 1 (jump ahead). */
export function applyCheckpoint(unit: Unit, progress: Record<string, NodeProgress>): Record<string, NodeProgress> {
  const next = { ...progress };
  for (const n of unit.nodes) {
    const p = next[n.id] ?? { level: 0, legendary: false };
    next[n.id] = { ...p, level: Math.max(p.level, 1) };
  }
  return next;
}
