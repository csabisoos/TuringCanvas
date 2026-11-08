/**
 * L-System (Lindenmayer System) & Turtle Graphics Types
 */

export interface LSystemRule {
  predecessor: string;
  successor: string;
}

export interface LSystemPreset {
  id: string;
  name: string;
  description: string;
  axiom: string;
  rules: LSystemRule[];
  angle: number; // in degrees
  defaultIterations: number;
  drawSymbols: string[]; // characters that produce forward draw lines
}

export interface TurtleState {
  x: number;
  y: number;
  angle: number; // radians
}

export interface LineSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  branchDepth: number;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export type ColorTheme = 'emerald' | 'neon' | 'sunset' | 'monochrome';
