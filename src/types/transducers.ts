/**
 * Transducers Domain Types (Mealy and Moore Machines)
 */

import type { State } from './automata';

export interface MealyTransition {
  fromStateId: string;
  toStateId: string;
  inputSymbol: string;
  outputSymbol: string;
}

export interface MealyData {
  states: Map<string, State>;
  inputAlphabet: Set<string>;
  outputAlphabet: Set<string>;
  transitions: MealyTransition[];
  initialStateId: string;
}

export interface MooreState extends State {
  outputSymbol: string;
}

export interface MooreTransition {
  fromStateId: string;
  toStateId: string;
  inputSymbol: string;
}

export interface MooreData {
  states: Map<string, MooreState>;
  inputAlphabet: Set<string>;
  outputAlphabet: Set<string>;
  transitions: MooreTransition[];
  initialStateId: string;
}

export interface TransducerStep {
  stepIndex: number;
  stateId: string;
  inputConsumed: string;
  outputProduced: string;
  cumulativeOutput: string;
  remainingInput: string;
}

export interface TransducerSimulationResult {
  steps: TransducerStep[];
  output: string;
  statePath: string[];
}
