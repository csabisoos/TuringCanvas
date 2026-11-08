import { describe, it, expect } from 'vitest';
import { MealyMachine } from '../core/transducers/MealyMachine';
import { MooreMachine } from '../core/transducers/MooreMachine';
import { mealyToMoore, mooreToMealy } from '../core/conversions/transducerConversions';
import type { MealyData, MooreData } from '../types/transducers';

describe('Transducer Conversions', () => {
  describe('mooreToMealy', () => {
    it('converts a Moore machine to an equivalent Mealy machine', () => {
      // Modulo 3 residue Moore machine
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

      const mealyData = mooreToMealy(mooreData);
      const mealy = new MealyMachine(mealyData);
      const moore = new MooreMachine(mooreData);

      // Verify transitions have correct outputs (destination state output)
      // q0 -> q1 on '1' enters q1 which has output '1'
      const t01 = mealyData.transitions.find((t) => t.fromStateId === 'q0' && t.inputSymbol === '1');
      expect(t01?.outputSymbol).toBe('1');

      // q1 -> q2 on '0' enters q2 which has output '2'
      const t12 = mealyData.transitions.find((t) => t.fromStateId === 'q1' && t.inputSymbol === '0');
      expect(t12?.outputSymbol).toBe('2');

      // Test simulation on several inputs
      for (const input of ['110', '101', '00', '1111']) {
        const mooreRes = moore.simulate(input);
        const mealyRes = mealy.simulate(input);
        // Moore output has initial state's output prepended
        expect(mooreRes.output.slice(1)).toBe(mealyRes.output);
      }
    });
  });

  describe('mealyToMoore', () => {
    it('converts a Mealy machine to an equivalent Moore machine with state splitting', () => {
      // 2s complement generator
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

      const mooreData = mealyToMoore(mealyData);
      const moore = new MooreMachine(mooreData);
      const mealy = new MealyMachine(mealyData);

      // In Mealy machine, q1 is entered with output '1' (from q0 on 1 and q1 on 0)
      // and with output '0' (from q1 on 1).
      // Thus q1 must be split into two states: q1 with output 0, and q1 with output 1.
      expect(mooreData.states.size).toBeGreaterThanOrEqual(3);

      // Test simulation equivalence
      for (const input of ['0011', '1000', '0101', '111']) {
        const mealyRes = mealy.simulate(input);
        const mooreRes = moore.simulate(input);
        // Moore output has initial state's output prepended, followed by Mealy output
        expect(mooreRes.output.slice(1)).toBe(mealyRes.output);
      }
    });
  });
});
