import type { TestId } from '../types';

/**
 * Calculator-strategy units. Each node is a "trick" taught by a card, then practiced on real
 * bank questions from the skills where that trick works. Steps are written so they work the
 * same in Desmos (built into the Digital SAT and the online ACT) and in PrepPath's calculator.
 */
export interface StrategyCard {
  title: string;
  /** When to reach for this trick. */
  when: string;
  steps: string[];
  /** Expressions preloaded into the calculator by "Try it". */
  example: string[];
  /** The trap or limit to remember. */
  watchOut: string;
}

export interface StrategyNodeSpec {
  id: string;
  title: string;
  skillIds: string[];
  card: StrategyCard;
}

export interface StrategyUnitSpec {
  id: string;
  title: string;
  sectionName: string;
  /** The unit is placed right after this domain unit and opens when that unit opens. */
  afterUnit: string;
  intro: string;
  nodes: StrategyNodeSpec[];
}

const intersect = (skillIds: string[], id: string): StrategyNodeSpec => ({
  id,
  title: 'Solve by graphing both sides',
  skillIds,
  card: {
    title: 'Solve by graphing both sides',
    when: 'Any equation or system of two equations, especially when the algebra is messy.',
    steps: [
      'For one equation, type the left side as y = … and the right side as y = … on separate lines.',
      'For a system, type each equation on its own line exactly as given; you do not need to solve for y.',
      'Tap a curve, then tap the gray intersection point to read its coordinates.',
      'For an equation, the x-coordinate is the solution. For a system, the point is (x, y).',
    ],
    example: ['y = 3x - 2', 'y = -x + 6'],
    watchOut: 'Parallel lines never meet (no solution); identical lines overlap everywhere (infinitely many). Read what the question asks: x, y, or something like x + y.',
  },
});

const zeros = (skillIds: string[], id: string): StrategyNodeSpec => ({
  id,
  title: 'Zeros: solve quadratics fast',
  skillIds,
  card: {
    title: 'Zeros: solve quadratics fast',
    when: 'Quadratic, polynomial or radical equations, and "how many solutions" questions.',
    steps: [
      'Move everything to one side so the equation equals 0.',
      'Graph y = (that side).',
      'Tap the curve and read the gray x-intercepts: each one is a solution.',
      'Count the x-intercepts to answer "how many real solutions".',
    ],
    example: ['y = x^2 - 6x - 16'],
    watchOut: 'For radical or rational equations, graph both original sides instead: squaring can add extraneous roots that the graph of the original equation will not show.',
  },
});

const vertex = (skillIds: string[], id: string): StrategyNodeSpec => ({
  id,
  title: 'Max and min from the vertex',
  skillIds,
  card: {
    title: 'Max and min from the vertex',
    when: 'Questions asking for a minimum or maximum value, or where it happens.',
    steps: [
      'Graph the function, e.g. y = 2(x + 3)^2 - 5.',
      'Tap the curve and tap the gray minimum or maximum point.',
      'The y-coordinate is the minimum or maximum value; the x-coordinate is where it occurs.',
    ],
    example: ['y = 2(x + 3)^2 - 5'],
    watchOut: 'The most common wrong answer is the x-coordinate. "What is the minimum value" asks for y.',
  },
});

const sliders = (skillIds: string[], id: string): StrategyNodeSpec => ({
  id,
  title: 'Sliders for unknown constants',
  skillIds,
  card: {
    title: 'Sliders for unknown constants',
    when: 'Questions with a constant like k: "for what value of k does the system have no solution / exactly one solution".',
    steps: [
      'Type the equations with the letter in them, e.g. kx + 3y = 6.',
      'Add a line k = 1. A slider appears.',
      'Drag the slider until the picture matches the condition: parallel lines for no solution, a line touching a parabola once for one solution.',
      'Use the slider to narrow the answer, then check it in the original equations.',
    ],
    example: ['k = 1', 'kx + 3y = 6', '4x + (k + 4)y = 12'],
    watchOut: 'At a value where the lines lie on top of each other there are infinitely many solutions, not none. Check both lines are separate.',
  },
});

const equiv = (skillIds: string[], id: string): StrategyNodeSpec => ({
  id,
  title: 'Check equivalent expressions',
  skillIds,
  card: {
    title: 'Check equivalent expressions',
    when: '"Which expression is equivalent to…" questions.',
    steps: [
      'Graph the given expression as y = ….',
      'Graph an answer choice on the next line.',
      'If the two curves lie exactly on top of each other everywhere, they are equivalent. Tap a color dot to hide one and compare.',
      'Try the next choice until one overlaps completely.',
    ],
    example: ['y = (x + 4)^2 - (x^2 - 3x + 2)', 'y = 11x + 14'],
    watchOut: 'Curves that cross once or twice are not equivalent. Zoom out to make sure they match everywhere, not just near the origin.',
  },
});

const circles: StrategyNodeSpec = {
  id: 'sat.calc.circles',
  title: 'Circles: see the center and radius',
  skillIds: ['sat.math.geo.circles'],
  card: {
    title: 'Circles: see the center and radius',
    when: 'Circle equations, including the expanded form x² + y² + ax + by + c = 0.',
    steps: [
      'Type the whole equation as given; no need to complete the square first.',
      'Read the center from the middle of the circle on the grid.',
      'The radius is the distance from the center to any edge, e.g. half the width.',
      'Confirm with the formula: (x − h)² + (y − k)² = r² has center (h, k).',
    ],
    example: ['x^2 + y^2 - 8x + 6y - 11 = 0'],
    watchOut: 'If the equation has a constant k, the picture alone may not be enough: add k as a slider or complete the square.',
  },
};

const trig: StrategyNodeSpec = {
  id: 'sat.calc.trig',
  title: 'Degree mode for trig',
  skillIds: ['sat.math.geo.trig'],
  card: {
    title: 'Degree mode for trig',
    when: 'Any trig value or sin/cos equation.',
    steps: [
      'Check the angle mode before you type: DEG for degrees, RAD for radians.',
      'Quick check: sin(30) should give 0.5 in degree mode.',
      'For sin(a) = cos(b) questions, use the fact that the angles add to 90°, and confirm by evaluating both sides.',
    ],
    example: ['sin(30)', 'cos(60)'],
    watchOut: 'Desmos and PrepPath start in radians. A wrong mode gives a confident but wrong decimal.',
  },
};

export const STRATEGY_UNITS: Record<TestId, StrategyUnitSpec[]> = {
  sat: [
    {
      id: 'sat.calc',
      title: 'Desmos tricks',
      sectionName: 'Math strategy',
      afterUnit: 'sat.math.alg',
      intro: 'The Digital SAT has Desmos built in on every Math question. These tricks turn it into a time saver.',
      nodes: [
        intersect(['sat.math.alg.lin1', 'sat.math.alg.systems'], 'sat.calc.intersect'),
        zeros(['sat.math.adv.nonlineq'], 'sat.calc.zeros'),
        vertex(['sat.math.adv.nonlinfn'], 'sat.calc.vertex'),
        sliders(['sat.math.alg.systems', 'sat.math.adv.nonlineq'], 'sat.calc.sliders'),
        equiv(['sat.math.adv.equiv'], 'sat.calc.equiv'),
        circles,
        trig,
      ],
    },
  ],
  act: [
    {
      id: 'act.calc',
      title: 'Graphing calculator tricks',
      sectionName: 'Math strategy',
      afterUnit: 'act.math.alg',
      intro: 'The online ACT includes Desmos; on paper you can bring a graphing calculator (no CAS). The same tricks work on both.',
      nodes: [
        intersect(['act.math.alg.linear', 'act.math.alg.systems'], 'act.calc.intersect'),
        zeros(['act.math.alg.quadratic', 'act.math.alg.polynomial', 'act.math.alg.rational_radical'], 'act.calc.zeros'),
        vertex(['act.math.alg.quadratic'], 'act.calc.vertex'),
        equiv(['act.math.alg.equiv', 'act.math.alg.polynomial', 'act.math.alg.quadratic'], 'act.calc.equiv'),
      ],
    },
  ],
};

export function strategyCard(nodeId: string): StrategyCard | null {
  for (const units of Object.values(STRATEGY_UNITS)) for (const u of units) for (const n of u.nodes) if (n.id === nodeId) return n.card;
  return null;
}
