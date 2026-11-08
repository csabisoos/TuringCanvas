import { describe, it, expect } from 'vitest';
import { MealyMachine } from '../core/transducers/MealyMachine';
import { MooreMachine } from '../core/transducers/MooreMachine';
import type { MealyData, MooreData } from '../types/transducers';

describe('MealyMachine Core Engine', () => {
  it('should simulate a binary inverter (NOT gate)', () => {
    // Single state q0: 0 -> 1, 1 -> 0
    const mealyData: MealyData = {
      states: new Map([
        ['q0', { id: 'q0', name: 'q0', isInitial: true, isAccepting: false }],
      ]),
      inputAlphabet: new Set(['0', '1']),
      outputAlphabet: new Set(['0', '1']),
      transitions: [
        { fromStateId: 'q0', toStateId: 'q0', inputSymbol: '0', outputSymbol: '1' },
        { fromStateId: 'q0', toStateId: 'q0', inputSymbol: '1', outputSymbol: '0' },
      ],
      initialStateId: 'q0',
    };

    const mealy = new MealyMachine(mealyData);
    const result = mealy.simulate('0110');

    expect(result.output).toBe('1001');
    expect(result.statePath).toEqual(['q0', 'q0', 'q0', 'q0', 'q0']);
    expect(result.steps).toHaveLength(4);
    expect(result.steps[0]?.outputProduced).toBe('1');
    expect(result.steps[1]?.outputProduced).toBe('0');
  });

  it('should simulate a 2s complement generator (least significant bit first)', () => {
    // q0: before first 1 (copy 0 -> 0, on 1 -> 1 and goto q1)
    // q1: after first 1 (invert: 0 -> 1, 1 -> 0)
    const mealyData: MealyData = {
      states: new Map([
        ['q0', { id: 'q0', name: 'q0', isInitial: true, isAccepting: false }],
        ['q1', { id: 'q1', name: 'q1', isInitial: false, isAccepting: false }],
      ]),
      inputAlphabet: new Set(['0', '1']),
      outputAlphabet: new Set(['0', '1']),
      transitions: [
        { fromStateId: 'q0', toStateId: 'q0', inputSymbol: '0', outputSymbol: '0' },
        { fromStateId: 'q0', toStateId: 'q1', inputSymbol: '1', outputSymbol: '1' },
        { fromStateId: 'q1', toStateId: 'q1', inputSymbol: '0', outputSymbol: '1' },
        { fromStateId: 'q1', toStateId: 'q1', inputSymbol: '1', outputSymbol: '0' },
      ],
      initialStateId: 'q0',
    };

    const mealy = new MealyMachine(mealyData);
    // For 1100 (LSB first: 0011):
    // 0 -> 0 (q0)
    // 0 -> 0 (q0)
    // 1 -> 1 (q1)
    // 1 -> 0 (q1)
    // Expected output: 0010
    const res = mealy.simulate('0011');
    expect(res.output).toBe('0010');
    expect(res.statePath).toEqual(['q0', 'q0', 'q0', 'q1', 'q1']);
  });

  it('throws error for invalid input symbol', () => {
    const mealyData: MealyData = {
      states: new Map([
        ['q0', { id: 'q0', name: 'q0', isInitial: true, isAccepting: false }],
      ]),
      inputAlphabet: new Set(['0', '1']),
      outputAlphabet: new Set(['0', '1']),
      transitions: [
        { fromStateId: 'q0', toStateId: 'q0', inputSymbol: '0', outputSymbol: '0' },
      ],
      initialStateId: 'q0',
    };

    const mealy = new MealyMachine(mealyData);
    expect(() => mealy.simulate('02')).toThrow(/not in input alphabet/);
  });
});

describe('MooreMachine Core Engine', () => {
  it('should simulate a modulo 3 residue calculator', () => {
    // States q0, q1, q2 representing residue mod 3. Output is '0', '1', '2'.
    // Reading binary MSB first: new_val = (val * 2 + bit) % 3
    // q0: on 0 -> q0, on 1 -> q1. Output '0'
    // q1: on 0 -> q2, on 1 -> q0. Output '1'
    // q2: on 0 -> q1, on 1 -> q2. Output '2'
    const mooreData: MooreData = {
      states: new Map([
        ['q0', { id: 'q0', name: 'q0', isInitial: true, isAccepting: false, outputSymbol: '0' }],
        ['q1', { id: 'q1', name: 'q1', isInitial: false, isAccepting: false, outputSymbol: '1' }],
        ['q2', { id: 'q2', name: 'q2', isInitial: false, isAccepting: false, outputSymbol: '2' }],
      ]),
      inputAlphabet: new Set(['0', '1']),
      outputAlphabet: new Set(['0', '1', '2']),
      transitions: [
        { fromStateId: 'q0', toStateId: 'q0', inputSymbol: '0' },
        { fromStateId: 'q0', toStateId: 'q1', inputSymbol: '1' },
        { fromStateId: 'q1', toStateId: 'q2', inputSymbol: '0' },
        { fromStateId: 'q1', toStateId: 'q0', inputSymbol: '1' },
        { fromStateId: 'q2', toStateId: 'q1', inputSymbol: '0' },
        { fromStateId: 'q2', toStateId: 'q2', inputSymbol: '1' },
      ],
      initialStateId: 'q0',
    };

    const moore = new MooreMachine(mooreData);
    // Input '110' (decimal 6, 6 % 3 = 0):
    // Start q0: output '0'
    // Read '1' -> q1: output '1' (val 1 % 3 = 1)
    // Read '1' -> q0: output '0' (val 3 % 3 = 0)
    // Read '0' -> q0: output '0' (val 6 % 3 = 0)
    // Total output: '0100' (length = input length + 1)
    const result = moore.simulate('110');
    expect(result.output).toBe('0100');
    expect(result.statePath).toEqual(['q0', 'q1', 'q0', 'q0']);
    expect(result.steps).toHaveLength(4);
    expect(result.steps[0]?.outputProduced).toBe('0');
    expect(result.steps[0]?.inputConsumed).toBe('');
    expect(result.steps[1]?.inputConsumed).toBe('1');
    expect(result.steps[1]?.outputProduced).toBe('1');
  });

  it('should support empty string input producing initial state output', () => {
    const mooreData: MooreData = {
      states: new Map([
        ['q0', { id: 'q0', name: 'q0', isInitial: true, isAccepting: false, outputSymbol: 'A' }],
      ]),
      inputAlphabet: new Set(['0', '1']),
      outputAlphabet: new Set(['A']),
      transitions: [],
      initialStateId: 'q0',
    };

    const moore = new MooreMachine(mooreData);
    const result = moore.simulate('');
    expect(result.output).toBe('A');
    expect(result.statePath).toEqual(['q0']);
    expect(result.steps).toHaveLength(1);
  });
});
