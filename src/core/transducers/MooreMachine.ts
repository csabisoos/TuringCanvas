/**
 * Moore Machine Core Implementation
 * Pure TypeScript — zero UI, zero DOM.
 *
 * In a Moore machine, output is associated with states:
 * current_state -> output_symbol
 * (current_state, input_symbol) -> next_state
 */

import type { MooreData, MooreTransition, TransducerSimulationResult, TransducerStep } from '../../types/transducers';

export class MooreMachine {
  private data: MooreData;

  constructor(data: MooreData) {
    this.validate(data);
    this.data = data;
  }

  private validate(data: MooreData): void {
    if (!data.states.has(data.initialStateId)) {
      throw new Error(`Initial state ${data.initialStateId} does not exist in state set.`);
    }

    for (const [id, state] of data.states) {
      if (!data.outputAlphabet.has(state.outputSymbol)) {
        throw new Error(`State ${id} output symbol '${state.outputSymbol}' not in output alphabet.`);
      }
    }

    for (const t of data.transitions) {
      if (!data.states.has(t.fromStateId)) {
        throw new Error(`Transition source state ${t.fromStateId} does not exist.`);
      }
      if (!data.states.has(t.toStateId)) {
        throw new Error(`Transition target state ${t.toStateId} does not exist.`);
      }
      if (!data.inputAlphabet.has(t.inputSymbol)) {
        throw new Error(`Input symbol '${t.inputSymbol}' not in input alphabet.`);
      }
    }
  }

  public getData(): MooreData {
    return this.data;
  }

  public getTransition(fromStateId: string, inputSymbol: string): MooreTransition | undefined {
    return this.data.transitions.find(
      (t) => t.fromStateId === fromStateId && t.inputSymbol === inputSymbol
    );
  }

  public simulate(input: string): TransducerSimulationResult {
    let currentStateId = this.data.initialStateId;
    const initialState = this.data.states.get(currentStateId);
    if (!initialState) {
      throw new Error(`Initial state '${currentStateId}' not found.`);
    }

    const statePath: string[] = [currentStateId];
    let cumulativeOutput = initialState.outputSymbol;

    const steps: TransducerStep[] = [
      {
        stepIndex: 0,
        stateId: currentStateId,
        inputConsumed: '',
        outputProduced: initialState.outputSymbol,
        cumulativeOutput,
        remainingInput: input,
      },
    ];

    for (let i = 0; i < input.length; i++) {
      const symbol = input[i] ?? '';
      if (!this.data.inputAlphabet.has(symbol)) {
        throw new Error(`Symbol '${symbol}' is not in input alphabet.`);
      }

      const transition = this.getTransition(currentStateId, symbol);
      if (!transition) {
        throw new Error(`No transition defined for state '${currentStateId}' on input '${symbol}'.`);
      }

      currentStateId = transition.toStateId;
      const nextState = this.data.states.get(currentStateId);
      if (!nextState) {
        throw new Error(`State '${currentStateId}' not found.`);
      }

      statePath.push(currentStateId);
      cumulativeOutput += nextState.outputSymbol;

      steps.push({
        stepIndex: i + 1,
        stateId: currentStateId,
        inputConsumed: symbol,
        outputProduced: nextState.outputSymbol,
        cumulativeOutput,
        remainingInput: input.slice(i + 1),
      });
    }

    return {
      steps,
      output: cumulativeOutput,
      statePath,
    };
  }
}
