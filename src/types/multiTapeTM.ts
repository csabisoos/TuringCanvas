/**
 * Type definitions for Multi-Tape Turing Machines (k >= 2)
 */
import type { State } from './automata';
import type { TMHeadDirection } from './tm';

export interface MultiTapeTMTransition {
  fromStateId: string;
  toStateId: string;
  readSymbols: string[]; // length k
  writeSymbols: string[]; // length k
  directions: TMHeadDirection[]; // length k
}

export interface MultiTapeTMData {
  states: Map<string, State>;
  inputAlphabet: Set<string>;
  tapeAlphabet: Set<string>;
  transitions: MultiTapeTMTransition[];
  tapeCount: number; // k >= 2
  blankSymbol: string;
}

export interface MultiTapeTMStep {
  stepIndex: number;
  stateId: string;
  headPositions: number[]; // length k
  visibleTapes: { index: number; symbol: string }[][]; // length k
  accepted: boolean;
  halted: boolean;
}

export interface MultiTapeTMResult {
  accepted: boolean;
  halted: boolean;
  steps: MultiTapeTMStep[];
}
