/**
 * CFG to PDA Conversion (Top-Down LL Parser Model)
 * Pure TypeScript — zero UI, zero DOM dependencies.
 */

import { PDA } from '../PDA';
import type { State } from '../../types/automata';
import type { GrammarData } from '../../types/grammar';

/**
 * Converts a Context-Free Grammar into an equivalent Top-Down Pushdown Automaton.
 * Uses the canonical 3-state LL parser construction:
 *   q0 (start) -> q1 (expansion / match loop) -> q2 (accept)
 */
export function cfgToTopDownPDA(grammar: GrammarData): PDA {
  const states: State[] = [
    { id: 'q0', name: 'q0', isInitial: true, isAccepting: false },
    { id: 'q1', name: 'q1', isInitial: false, isAccepting: false },
    { id: 'q2', name: 'q2', isInitial: false, isAccepting: true },
  ];

  const initialStackSymbol = 'Z';
  const stackAlphabet = new Set<string>([
    ...grammar.variables,
    ...grammar.terminals,
    initialStackSymbol,
  ]);

  const inputAlphabet = new Set<string>(
    grammar.terminals.size > 0 ? grammar.terminals : ['a']
  );

  const pda = new PDA(
    states,
    inputAlphabet,
    stackAlphabet,
    initialStackSymbol,
    'finalState'
  );

  // 1. Initial transition: push start symbol onto stack above Z
  pda.addTransition('q0', 'q1', '', initialStackSymbol, [
    grammar.startVariable,
    initialStackSymbol,
  ]);

  // 2. Production transitions: for each A -> alpha, expand variable on top of stack
  for (const prod of grammar.productions) {
    const isEpsilon =
      prod.rhs.length === 0 ||
      (prod.rhs.length === 1 && (prod.rhs[0] === 'ε' || prod.rhs[0] === ''));

    const pushSymbols = isEpsilon ? [] : prod.rhs;
    pda.addTransition('q1', 'q1', '', prod.lhs, pushSymbols);
  }

  // 3. Terminal matching transitions: for each terminal a in Sigma, match input with stack
  for (const terminal of grammar.terminals) {
    pda.addTransition('q1', 'q1', terminal, terminal, []);
  }

  // 4. Accept transition: when stack is back to Z and input is exhausted, move to q2
  pda.addTransition('q1', 'q2', '', initialStackSymbol, []);

  return pda;
}
