/**
 * Mealy Machine Core Implementation
 * Pure TypeScript — zero UI, zero DOM.
 *
 * In a Mealy machine, output is produced on transitions:
 * (current_state, input_symbol) -> (next_state, output_symbol)
 */

import type { MealyData, MealyTransition, TransducerSimulationResult, TransducerStep } from '../../types/transducers';

export class MealyMachine {
  private data: MealyData;

  constructor(data: MealyData) {
    this.validate(data);
    this.data = data;
  }

  private validate(data: MealyData): void {
    if (!data.states.has(data.initialStateId)) {
      throw new Error(`Initial state ${data.initialStateId} does not exist in state set.`);
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
      if (!data.outputAlphabet.has(t.outputSymbol)) {
        throw new Error(`Output symbol '${t.outputSymbol}' not in output alphabet.`);
      }
    }
  }

  public getData(): MealyData {
    return this.data;
  }

  public getTransition(fromStateId: string, inputSymbol: string): MealyTransition | undefined {
    return this.data.transitions.find(
      (t) => t.fromStateId === fromStateId && t.inputSymbol === inputSymbol
    );
  }

  public simulate(input: string): TransducerSimulationResult {
    let currentStateId = this.data.initialStateId;
    const statePath: string[] = [currentStateId];
    const steps: TransducerStep[] = [];
    let cumulativeOutput = '';

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
      statePath.push(currentStateId);
      cumulativeOutput += transition.outputSymbol;

      steps.push({
        stepIndex: i,
        stateId: currentStateId,
        inputConsumed: symbol,
        outputProduced: transition.outputSymbol,
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
