/**
 * L-System (Lindenmayer System) & 2D Turtle Graphics Core Engine
 * Pure TypeScript — zero UI, zero DOM dependencies.
 */

import type {
  LSystemRule,
  LSystemPreset,
  TurtleState,
  LineSegment,
  BoundingBox,
} from '../../types/lsystem';

/**
 * Performs parallel rewriting of the axiom string according to production rules.
 * Limits expansion to avoid memory exhaustion (max 300,000 chars).
 */
export function rewriteLSystem(
  axiom: string,
  rules: LSystemRule[],
  iterations: number
): string {
  const ruleMap = new Map<string, string>();
  for (const rule of rules) {
    ruleMap.set(rule.predecessor, rule.successor);
  }

  let current = axiom;
  const MAX_LENGTH = 300000;

  for (let iter = 0; iter < iterations; iter++) {
    let next = '';
    for (const char of current) {
      const replacement = ruleMap.get(char);
      next += replacement ?? char;

      if (next.length > MAX_LENGTH) {
        return next;
      }
    }
    current = next;
  }

  return current;
}

/**
 * Interprets an L-system expanded string into 2D line segments via Turtle Graphics.
 */
export function generateTurtleSegments(
  instructions: string,
  angleDeg: number,
  stepLength = 10,
  drawSymbols: string[] = ['F', 'G']
): LineSegment[] {
  const angleRad = (angleDeg * Math.PI) / 180;
  const drawSet = new Set(drawSymbols);

  const segments: LineSegment[] = [];
  const stack: TurtleState[] = [];

  let cur: TurtleState = {
    x: 0,
    y: 0,
    angle: 0, // 0 radians points along +x axis
  };

  for (const char of instructions) {
    if (drawSet.has(char)) {
      const nx = cur.x + stepLength * Math.cos(cur.angle);
      const ny = cur.y + stepLength * Math.sin(cur.angle);

      segments.push({
        x1: cur.x,
        y1: cur.y,
        x2: nx,
        y2: ny,
        branchDepth: stack.length,
      });

      cur = { ...cur, x: nx, y: ny };
    } else if (char === 'f') {
      // Forward without drawing (pen up)
      cur = {
        ...cur,
        x: cur.x + stepLength * Math.cos(cur.angle),
        y: cur.y + stepLength * Math.sin(cur.angle),
      };
    } else if (char === '+') {
      cur = { ...cur, angle: cur.angle + angleRad };
    } else if (char === '-') {
      cur = { ...cur, angle: cur.angle - angleRad };
    } else if (char === '[') {
      stack.push({ ...cur });
    } else if (char === ']') {
      const popped = stack.pop();
      if (popped !== undefined) {
        cur = popped;
      }
    }
  }

  return segments;
}

/**
 * Computes the axis-aligned bounding box for a collection of line segments.
 */
export function computeBoundingBox(segments: LineSegment[]): BoundingBox {
  if (segments.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const seg of segments) {
    if (seg.x1 < minX) minX = seg.x1;
    if (seg.x2 < minX) minX = seg.x2;
    if (seg.x1 > maxX) maxX = seg.x1;
    if (seg.x2 > maxX) maxX = seg.x2;

    if (seg.y1 < minY) minY = seg.y1;
    if (seg.y2 < minY) minY = seg.y2;
    if (seg.y1 > maxY) maxY = seg.y1;
    if (seg.y2 > maxY) maxY = seg.y2;
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Classic L-System Presets
 */
export const L_SYSTEM_PRESETS: LSystemPreset[] = [
  {
    id: 'koch',
    name: 'Koch Snowflake',
    description: 'Classic self-similar snowflake with triangular protrusions',
    axiom: 'F--F--F',
    rules: [{ predecessor: 'F', successor: 'F+F--F+F' }],
    angle: 60,
    defaultIterations: 3,
    drawSymbols: ['F'],
  },
  {
    id: 'sierpinski',
    name: 'Sierpinski Arrowhead',
    description: 'Equilateral triangle with recursively subdivided holes',
    axiom: 'A',
    rules: [
      { predecessor: 'A', successor: 'B-A-B' },
      { predecessor: 'B', successor: 'A+B+A' },
    ],
    angle: 60,
    defaultIterations: 5,
    drawSymbols: ['A', 'B'],
  },
  {
    id: 'dragon',
    name: 'Dragon Curve',
    description: 'Space-filling boundary formed by repeatedly folding a paper strip in half',
    axiom: 'FX',
    rules: [
      { predecessor: 'X', successor: 'X+YF+' },
      { predecessor: 'Y', successor: '-FX-Y' },
    ],
    angle: 90,
    defaultIterations: 9,
    drawSymbols: ['F'],
  },
  {
    id: 'plant',
    name: 'Fractal Plant',
    description: 'Realistic biological branch structure with nested stems and leaves',
    axiom: 'X',
    rules: [
      { predecessor: 'X', successor: 'F+[[X]-X]-F[-FX]+X' },
      { predecessor: 'F', successor: 'FF' },
    ],
    angle: 25,
    defaultIterations: 4,
    drawSymbols: ['F'],
  },
  {
    id: 'hilbert',
    name: 'Hilbert Curve',
    description: 'Continuous fractal space-filling curve with high locality preserve',
    axiom: 'L',
    rules: [
      { predecessor: 'L', successor: '+RF-LFL-FR+' },
      { predecessor: 'R', successor: '-LF+RFR+FL-' },
    ],
    angle: 90,
    defaultIterations: 4,
    drawSymbols: ['F'],
  },
  {
    id: 'cantor',
    name: 'Cantor Dust',
    description: 'Ternary set with recursive middle-third removal',
    axiom: 'F',
    rules: [
      { predecessor: 'F', successor: 'FfF' },
      { predecessor: 'f', successor: 'fff' },
    ],
    angle: 90,
    defaultIterations: 3,
    drawSymbols: ['F'],
  },
];
