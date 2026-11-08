import { describe, it, expect } from 'vitest';
import {
  rewriteLSystem,
  generateTurtleSegments,
  computeBoundingBox,
  L_SYSTEM_PRESETS,
} from '../core/lsystem/LSystemEngine';
import type { LSystemRule } from '../types/lsystem';

describe('L-System String Rewriting Engine', () => {
  it('returns axiom at depth 0', () => {
    const rules: LSystemRule[] = [{ predecessor: 'F', successor: 'F+F-F' }];
    expect(rewriteLSystem('F', rules, 0)).toBe('F');
  });

  it('performs parallel string rewriting (Algae system)', () => {
    const rules: LSystemRule[] = [
      { predecessor: 'A', successor: 'AB' },
      { predecessor: 'B', successor: 'A' },
    ];
    // n=0: A
    // n=1: AB
    // n=2: ABA
    // n=3: ABAAB
    // n=4: ABAABABA
    expect(rewriteLSystem('A', rules, 1)).toBe('AB');
    expect(rewriteLSystem('A', rules, 2)).toBe('ABA');
    expect(rewriteLSystem('A', rules, 3)).toBe('ABAAB');
    expect(rewriteLSystem('A', rules, 4)).toBe('ABAABABA');
  });

  it('preserves symbols without matching rules', () => {
    const rules: LSystemRule[] = [{ predecessor: 'F', successor: 'F+F' }];
    expect(rewriteLSystem('F-F', rules, 1)).toBe('F+F-F+F');
  });
});

describe('Turtle Graphics Geometry Generator', () => {
  it('generates line segments for simple forward commands', () => {
    const segments = generateTurtleSegments('FF', 90, 10, ['F']);
    expect(segments).toHaveLength(2);
    expect(segments[0]).toEqual({
      x1: 0,
      y1: 0,
      x2: 10,
      y2: 0,
      branchDepth: 0,
    });
    expect(segments[1]?.x1).toBeCloseTo(10);
    expect(segments[1]?.y1).toBeCloseTo(0);
    expect(segments[1]?.x2).toBeCloseTo(20);
    expect(segments[1]?.y2).toBeCloseTo(0);
  });

  it('respects turn commands (+ and -)', () => {
    // F + F with 90 degree turn:
    // First goes (0,0)->(10,0) (heading 0)
    // +90 turns to angle pi/2 (pointing down or up depending on convention)
    const segments = generateTurtleSegments('F+F', 90, 10, ['F']);
    expect(segments).toHaveLength(2);
    expect(segments[0]?.x2).toBeCloseTo(10);
    expect(segments[0]?.y2).toBeCloseTo(0);
    // Second segment starts at (10,0)
    expect(segments[1]?.x1).toBeCloseTo(10);
    expect(segments[1]?.y1).toBeCloseTo(0);
    // x2 should remain 10, y2 changes by 10
    expect(segments[1]?.x2).toBeCloseTo(10);
    expect(Math.abs(segments[1]?.y2 ?? 0)).toBeCloseTo(10);
  });

  it('handles stack push [ and pop ] branching correctly', () => {
    // F[+F]-F:
    // main trunk, branch, then turn from previous trunk position
    const segments = generateTurtleSegments('F[+F]-F', 90, 10, ['F']);
    expect(segments).toHaveLength(3);
    // Branch has depth 1
    expect(segments[1]?.branchDepth).toBe(1);
    // Main after pop resumes from (10, 0)
    expect(segments[2]?.x1).toBeCloseTo(10);
    expect(segments[2]?.y1).toBeCloseTo(0);
    expect(segments[2]?.branchDepth).toBe(0);
  });

  it('computes bounding box accurately', () => {
    const segments = generateTurtleSegments('F+F+F+F', 90, 10, ['F']);
    const bbox = computeBoundingBox(segments);
    expect(bbox.width).toBeCloseTo(10);
    expect(bbox.height).toBeCloseTo(10);
  });
});

describe('L-System Presets Library', () => {
  it('contains classic fractal presets', () => {
    const ids = L_SYSTEM_PRESETS.map((p) => p.id);
    expect(ids).toContain('koch');
    expect(ids).toContain('sierpinski');
    expect(ids).toContain('dragon');
    expect(ids).toContain('plant');
  });

  it('generates non-empty fractal geometries for Koch curve at depth 2', () => {
    const koch = L_SYSTEM_PRESETS.find((p) => p.id === 'koch');
    if (!koch) throw new Error('Koch preset not found');
    const expanded = rewriteLSystem(koch.axiom, koch.rules, 2);
    expect(expanded.length).toBeGreaterThan(koch.axiom.length);
    const segments = generateTurtleSegments(expanded, koch.angle, 5, koch.drawSymbols);
    expect(segments.length).toBeGreaterThan(0);
  });
});
