import { describe, it, expect } from 'vitest';
import { cfgToTopDownPDA } from '../core/conversions/cfgToPda';
import { pdaToCFG } from '../core/conversions/pdaToCfg';
import type { GrammarData } from '../types/grammar';
import type { PDAData } from '../types/pda';

describe('CFG to PDA Top-Down (LL Parser) Conversion', () => {
  it('converts S -> a S b | ε into an equivalent Top-Down PDA', () => {
    const grammar: GrammarData = {
      variables: new Set(['S']),
      terminals: new Set(['a', 'b']),
      startVariable: 'S',
      productions: [
        { id: 'p1', lhs: 'S', rhs: ['a', 'S', 'b'] },
        { id: 'p2', lhs: 'S', rhs: ['ε'] },
      ],
    };

    const pda = cfgToTopDownPDA(grammar);

    expect(pda.data.states.size).toBe(3); // q0 (start), q1 (loop), q2 (accept)
    expect(pda.data.inputAlphabet.has('a')).toBe(true);
    expect(pda.data.inputAlphabet.has('b')).toBe(true);
    expect(pda.data.stackAlphabet.has('S')).toBe(true);

    // Verify simulation of converted PDA
    expect(pda.simulate('')).toBe(true);
    expect(pda.simulate('ab')).toBe(true);
    expect(pda.simulate('aabb')).toBe(true);
    expect(pda.simulate('aab')).toBe(false);
  });
});

describe('PDA to CFG Conversion', () => {
  it('converts a simple PDA into a CFG using the triples construction', () => {
    const pda: PDAData = {
      states: new Map([
        ['q0', { id: 'q0', name: 'q0', isInitial: true, isAccepting: false }],
        ['q1', { id: 'q1', name: 'q1', isInitial: false, isAccepting: true }],
      ]),
      inputAlphabet: new Set(['a']),
      stackAlphabet: new Set(['Z0', 'A']),
      initialStackSymbol: 'Z0',
      acceptanceCriteria: 'finalState',
      transitions: [
        {
          fromStateId: 'q0',
          toStateId: 'q0',
          inputSymbol: 'a',
          popSymbol: 'Z0',
          pushSymbols: ['A', 'Z0'],
        },
        {
          fromStateId: 'q0',
          toStateId: 'q1',
          inputSymbol: 'a',
          popSymbol: 'A',
          pushSymbols: [],
        },
      ],
    };

    const cfg = pdaToCFG(pda);
    expect(cfg.variables.size).toBeGreaterThan(0);
    expect(cfg.productions.length).toBeGreaterThan(0);
    expect(cfg.startVariable).toBe('S');
  });
});
