/**
 * PDA to CFG Conversion (Triples Construction)
 * Pure TypeScript — zero UI, zero DOM dependencies.
 */

import type { PDAData } from '../../types/pda';
import type { GrammarData, ProductionRule } from '../../types/grammar';

/**
 * Converts a Pushdown Automaton into a Context-Free Grammar
 * using the state-stack-state triples construction: [p, A, q].
 */
export function pdaToCFG(pda: PDAData): GrammarData {
  const stateIds = Array.from(pda.states.keys());
  const initialNode = Array.from(pda.states.values()).find((s) => s.isInitial);
  const startStateId = initialNode?.id ?? stateIds[0];

  const variables = new Set<string>(['S']);
  const terminals = new Set<string>(pda.inputAlphabet);
  const productions: ProductionRule[] = [];
  let prodCounter = 0;

  const getVarName = (p: string, A: string, q: string): string => `[${p},${A},${q}]`;

  // 1. S -> [q0, Z0, q] for every state q in Q
  for (const q of stateIds) {
    const vName = getVarName(startStateId, pda.initialStackSymbol, q);
    variables.add(vName);
    productions.push({
      id: `p-${String(++prodCounter)}`,
      lhs: 'S',
      rhs: [vName],
    });
  }

  // 2. Process all PDA transitions
  for (const t of pda.transitions) {
    const a = t.inputSymbol !== '' ? t.inputSymbol : 'ε';
    const aRhs = a !== 'ε' ? [a] : [];

    const k = t.pushSymbols.length;

    if (k === 0) {
      // Pops A, pushes nothing: [from, pop, to] -> a
      const lhs = getVarName(t.fromStateId, t.popSymbol, t.toStateId);
      variables.add(lhs);
      productions.push({
        id: `p-${String(++prodCounter)}`,
        lhs,
        rhs: aRhs.length > 0 ? aRhs : ['ε'],
      });
    } else if (k === 1) {
      // Pops A, pushes B1: [from, pop, s] -> a [to, B1, s] for all s in Q
      const B1 = t.pushSymbols[0];
      for (const s of stateIds) {
        const lhs = getVarName(t.fromStateId, t.popSymbol, s);
        const rhsVar = getVarName(t.toStateId, B1, s);
        variables.add(lhs);
        variables.add(rhsVar);
        productions.push({
          id: `p-${String(++prodCounter)}`,
          lhs,
          rhs: [...aRhs, rhsVar],
        });
      }
    } else if (k === 2) {
      // Pops A, pushes B1 B2: [from, pop, t] -> a [to, B1, s] [s, B2, t] for all s, t in Q
      const B1 = t.pushSymbols[0];
      const B2 = t.pushSymbols[1];
      for (const s of stateIds) {
        for (const targetState of stateIds) {
          const lhs = getVarName(t.fromStateId, t.popSymbol, targetState);
          const var1 = getVarName(t.toStateId, B1, s);
          const var2 = getVarName(s, B2, targetState);
          variables.add(lhs);
          variables.add(var1);
          variables.add(var2);
          productions.push({
            id: `p-${String(++prodCounter)}`,
            lhs,
            rhs: [...aRhs, var1, var2],
          });
        }
      }
    }
  }

  return {
    variables,
    terminals,
    startVariable: 'S',
    productions,
  };
}
