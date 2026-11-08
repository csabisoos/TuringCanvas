/**
 * Type definitions for Turing Machines (TM)
 */
import type { State } from './automata';

export type TMHeadDirection = 'L' | 'R' | 'S';

export const TM_BLANK = '□' as const;

export interface TMTransition {
  fromStateId: string;
  toStateId: string;
  readSymbol: string;
  writeSymbol: string;
  direction: TMHeadDirection;
}

export interface TMData {
  states: Map<string, State>;
  inputAlphabet: Set<string>;
  tapeAlphabet: Set<string>; // includes inputAlphabet and blankSymbol
  transitions: TMTransition[];
  blankSymbol: string;
}

export interface TMStep {
  stepIndex: number;
  stateId: string;
  headPosition: number;
  tapeSnapshot: Record<number, string>;
  visibleTape: { index: number; symbol: string }[];
  accepted: boolean;
  halted: boolean;
}

export interface TMResult {
  accepted: boolean;
  halted: boolean;
  finalTape: string;
  steps: TMStep[];
}
