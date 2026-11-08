/**
 * Type definitions for Pushdown Automata (PDA)
 */
import type { State } from './automata';

export type AcceptanceCriteria = 'finalState' | 'emptyStack' | 'both';

export interface PDATransition {
  fromStateId: string;
  toStateId: string;
  inputSymbol: string; // alphabet symbol or EPSILON ('')
  popSymbol: string; // stack symbol popped or EPSILON ('')
  pushSymbols: string[]; // stack symbols pushed (index 0 is top of stack, or [] for none)
}

export interface PDAData {
  states: Map<string, State>;
  inputAlphabet: Set<string>;
  stackAlphabet: Set<string>;
  transitions: PDATransition[];
  initialStackSymbol: string; // usually 'Z' or 'Z0'
  acceptanceCriteria: AcceptanceCriteria;
}

export interface PDAConfiguration {
  stateId: string;
  remainingInput: string;
  stack: string[]; // index 0 is top of stack
}

export interface PDASimulationStep {
  stepIndex: number;
  configurations: PDAConfiguration[];
  accepted: boolean;
}
