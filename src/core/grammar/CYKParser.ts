/**
 * CYK (Cocke-Younger-Kasami) Dynamic Programming Parsing Algorithm
 * Pure TypeScript — zero UI, zero DOM.
 */

import type { GrammarData } from '../../types/grammar';

export interface CYKBackPointer {
  variable: string;
  split: number;
  leftVar: string;
  rightVar: string;
}

export interface CYKCell {
  startIdx: number; // 0-based character start index in input
  length: number;   // substring length (1..n)
  variables: Set<string>;
  backPointers: CYKBackPointer[];
}

export interface CYKResult {
  accepted: boolean;
  table: CYKCell[][]; // table[length - 1][startIdx]
}

/**
 * Runs CYK algorithm on an input string.
 * Grammar should be in Chomsky Normal Form (CNF): rules are A -> BC or A -> a (or S -> ε).
 */
export function runCYK(grammar: GrammarData, input: string): CYKResult {
  const { startVariable, productions } = grammar;
  const n = input.length;

  if (n === 0) {
    const derivesEmpty = productions.some(
      (p) => p.lhs === startVariable && p.rhs.length === 1 && p.rhs[0] === 'ε'
    );
    return {
      accepted: derivesEmpty,
      table: [],
    };
  }

  // Pre-index terminal rules (A -> a) and binary rules (A -> B C)
  const termRules = new Map<string, Set<string>>(); // char -> Set<variable>
  const binaryRules: { lhs: string; b: string; c: string }[] = [];

  for (const p of productions) {
    if (p.rhs.length === 1) {
      const sym = p.rhs[0] ?? '';
      if (sym !== 'ε') {
        const vars = termRules.get(sym) ?? new Set<string>();
        vars.add(p.lhs);
        termRules.set(sym, vars);
      }
    } else if (p.rhs.length === 2) {
      binaryRules.push({
        lhs: p.lhs,
        b: p.rhs[0] ?? '',
        c: p.rhs[1] ?? '',
      });
    }
  }

  // Initialize table: table[l - 1][i] holds variables for substring of length l starting at i
  // length l: 1..n
  // start index i: 0..(n - l)
  const table: CYKCell[][] = [];

  for (let l = 1; l <= n; l++) {
    const row: CYKCell[] = [];
    for (let i = 0; i <= n - l; i++) {
      row.push({
        startIdx: i,
        length: l,
        variables: new Set<string>(),
        backPointers: [],
      });
    }
    table.push(row);
  }

  // Base case: length l = 1
  for (let i = 0; i < n; i++) {
    const char = input[i] ?? '';
    const vars = termRules.get(char);
    if (vars) {
      const cell = table[0][i];
      for (const v of vars) {
        cell.variables.add(v);
      }
    }
  }

  // Dynamic programming: length l from 2 to n
  for (let l = 2; l <= n; l++) {
    for (let i = 0; i <= n - l; i++) {
      const cell = table[l - 1][i];

      for (let k = 1; k < l; k++) {
        const leftCell = table[k - 1][i];
        const rightCell = table[l - k - 1][i + k];

        for (const rule of binaryRules) {
          if (leftCell.variables.has(rule.b) && rightCell.variables.has(rule.c)) {
            cell.variables.add(rule.lhs);
            cell.backPointers.push({
              variable: rule.lhs,
              split: k,
              leftVar: rule.b,
              rightVar: rule.c,
            });
          }
        }
      }
    }
  }

  // The string is accepted if the start variable can derive the entire string of length n
  const topCell = table[n - 1][0];
  const accepted = topCell.variables.has(startVariable);

  return {
    accepted,
    table,
  };
}
