/**
 * LL(1) Parsing Suite
 * Pure TypeScript — zero UI, zero DOM.
 *
 * Implements:
 * - FIRST set computation
 * - FOLLOW set computation
 * - LL(1) Parse Table construction and conflict detection
 * - Step-by-step LL(1) parsing simulation
 */

import type { GrammarData, ProductionRule } from '../../types/grammar';

export interface LL1TableResult {
  table: Map<string, Map<string, ProductionRule[]>>;
  hasConflicts: boolean;
  firstSets: Map<string, Set<string>>;
  followSets: Map<string, Set<string>>;
}

export interface LL1Step {
  stepIndex: number;
  stack: string[]; // top of stack is at the end or index 0
  remainingInput: string;
  action: string;
}

export interface LL1SimulationResult {
  accepted: boolean;
  error?: string;
  steps: LL1Step[];
}

/**
 * Computes FIRST(X) for all symbols in the grammar.
 */
export function computeFirstSets(g: GrammarData): Map<string, Set<string>> {
  const { variables, terminals, productions } = g;
  const first = new Map<string, Set<string>>();

  // Terminals: FIRST(a) = {a}
  for (const t of terminals) {
    first.set(t, new Set([t]));
  }
  first.set('ε', new Set(['ε']));

  // Variables: initialize with empty set
  for (const v of variables) {
    first.set(v, new Set<string>());
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (const p of productions) {
      const vFirst = first.get(p.lhs) ?? new Set<string>();
      first.set(p.lhs, vFirst);

      if (p.rhs.length === 1 && p.rhs[0] === 'ε') {
        if (!vFirst.has('ε')) {
          vFirst.add('ε');
          changed = true;
        }
        continue;
      }

      // FIRST of sequence Y1 Y2 ... Yk
      let allHaveEpsilon = true;
      for (const sym of p.rhs) {
        const symFirst = first.get(sym) ?? new Set<string>();
        for (const item of symFirst) {
          if (item !== 'ε' && !vFirst.has(item)) {
            vFirst.add(item);
            changed = true;
          }
        }
        if (!symFirst.has('ε')) {
          allHaveEpsilon = false;
          break;
        }
      }

      if (allHaveEpsilon && !vFirst.has('ε')) {
        vFirst.add('ε');
        changed = true;
      }
    }
  }

  return first;
}

/**
 * Computes FIRST of a sequence of symbols alpha = X1 X2 ... Xk.
 */
export function computeFirstOfSequence(
  sequence: string[],
  firstSets: Map<string, Set<string>>
): Set<string> {
  const result = new Set<string>();
  if (sequence.length === 0 || (sequence.length === 1 && sequence[0] === 'ε')) {
    result.add('ε');
    return result;
  }

  let allHaveEpsilon = true;
  for (const sym of sequence) {
    const symFirst = firstSets.get(sym) ?? new Set<string>([sym]);
    for (const item of symFirst) {
      if (item !== 'ε') {
        result.add(item);
      }
    }
    if (!symFirst.has('ε')) {
      allHaveEpsilon = false;
      break;
    }
  }

  if (allHaveEpsilon) {
    result.add('ε');
  }

  return result;
}

/**
 * Computes FOLLOW(A) for all variables in the grammar.
 */
export function computeFollowSets(
  g: GrammarData,
  firstSets: Map<string, Set<string>>
): Map<string, Set<string>> {
  const { variables, startVariable, productions } = g;
  const follow = new Map<string, Set<string>>();

  for (const v of variables) {
    follow.set(v, new Set<string>());
  }

  // FOLLOW(S) contains $ (end-of-input marker)
  follow.get(startVariable)?.add('$');

  let changed = true;
  while (changed) {
    changed = false;
    for (const p of productions) {
      const a = p.lhs;

      for (let i = 0; i < p.rhs.length; i++) {
        const b = p.rhs[i] ?? '';
        if (!variables.has(b)) continue;

        const bFollow = follow.get(b) ?? new Set<string>();
        follow.set(b, bFollow);

        // beta = remaining symbols after B
        const beta = p.rhs.slice(i + 1);
        const betaFirst = computeFirstOfSequence(beta, firstSets);

        // Rule 1: FIRST(beta) \ {ε} subset of FOLLOW(B)
        for (const item of betaFirst) {
          if (item !== 'ε' && !bFollow.has(item)) {
            bFollow.add(item);
            changed = true;
          }
        }

        // Rule 2: If beta derives ε (or beta is empty), FOLLOW(A) subset of FOLLOW(B)
        if (betaFirst.has('ε')) {
          const aFollow = follow.get(a) ?? new Set<string>();
          for (const item of aFollow) {
            if (!bFollow.has(item)) {
              bFollow.add(item);
              changed = true;
            }
          }
        }
      }
    }
  }

  return follow;
}

/**
 * Builds the LL(1) Parse Table M[A, a].
 */
export function buildLL1Table(g: GrammarData): LL1TableResult {
  const firstSets = computeFirstSets(g);
  const followSets = computeFollowSets(g, firstSets);
  const table = new Map<string, Map<string, ProductionRule[]>>();
  let hasConflicts = false;

  for (const v of g.variables) {
    table.set(v, new Map<string, ProductionRule[]>());
  }

  for (const p of g.productions) {
    const a = p.lhs;
    const row = table.get(a) ?? new Map<string, ProductionRule[]>();
    table.set(a, row);

    const rhsFirst = computeFirstOfSequence(p.rhs, firstSets);

    // For each terminal a in FIRST(alpha)
    for (const term of rhsFirst) {
      if (term !== 'ε') {
        const cell = row.get(term) ?? [];
        cell.push(p);
        if (cell.length > 1) {
          hasConflicts = true;
        }
        row.set(term, cell);
      }
    }

    // If ε in FIRST(alpha), for each b in FOLLOW(A)
    if (rhsFirst.has('ε')) {
      const aFollow = followSets.get(a) ?? new Set<string>();
      for (const b of aFollow) {
        const cell = row.get(b) ?? [];
        if (!cell.includes(p)) {
          cell.push(p);
        }
        if (cell.length > 1) {
          hasConflicts = true;
        }
        row.set(b, cell);
      }
    }
  }

  return {
    table,
    hasConflicts,
    firstSets,
    followSets,
  };
}

/**
 * Simulates LL(1) top-down parsing on an input string.
 */
export function simulateLL1(
  table: Map<string, Map<string, ProductionRule[]>>,
  g: GrammarData,
  input: string,
  maxSteps = 150
): LL1SimulationResult {
  // Input tokens: if symbols are space-separated or single characters
  const tokens = input.includes(' ')
    ? input.split(/\s+/).filter(Boolean)
    : input.split('');
  tokens.push('$');

  const stack: string[] = ['$', g.startVariable];
  const steps: LL1Step[] = [];
  let tokenIdx = 0;
  let stepCount = 0;

  while (stack.length > 0 && stepCount < maxSteps) {
    const top = stack[stack.length - 1] ?? '';
    const currentToken = tokens[tokenIdx] ?? '$';
    const remaining = tokens.slice(tokenIdx).join(' ');

    if (top === '$' && currentToken === '$') {
      steps.push({
        stepIndex: stepCount,
        stack: [...stack],
        remainingInput: remaining,
        action: 'Accept',
      });
      return { accepted: true, steps };
    }

    if (top === currentToken) {
      // Match terminal!
      stack.pop();
      tokenIdx++;
      steps.push({
        stepIndex: stepCount++,
        stack: [...stack],
        remainingInput: remaining,
        action: `Match '${currentToken}'`,
      });
      continue;
    }

    // Nonterminal on top of stack
    if (g.variables.has(top)) {
      const row = table.get(top);
      const cell = row?.get(currentToken);
      const rule = cell?.[0];

      if (!rule) {
        steps.push({
          stepIndex: stepCount,
          stack: [...stack],
          remainingInput: remaining,
          action: `Error: No rule M[${top}, '${currentToken}']`,
        });
        return {
          accepted: false,
          error: `Parsing failed: No production found in M[${top}, '${currentToken}']`,
          steps,
        };
      }

      stack.pop();
      // Push RHS in reverse order (unless ε)
      if (!(rule.rhs.length === 1 && rule.rhs[0] === 'ε')) {
        for (let i = rule.rhs.length - 1; i >= 0; i--) {
          const sym = rule.rhs[i] ?? '';
          stack.push(sym);
        }
      }

      const rhsStr = rule.rhs.join(' ');
      steps.push({
        stepIndex: stepCount++,
        stack: [...stack],
        remainingInput: remaining,
        action: `Apply ${rule.lhs} -> ${rhsStr}`,
      });
      continue;
    }

    // Terminal mismatch
    steps.push({
      stepIndex: stepCount,
      stack: [...stack],
      remainingInput: remaining,
      action: `Mismatch: Expected '${top}', found '${currentToken}'`,
    });
    return {
      accepted: false,
      error: `Syntax error: Expected '${top}' but found '${currentToken}'`,
      steps,
    };
  }

  return {
    accepted: false,
    error: 'Parsing timed out or stack exhausted.',
    steps,
  };
}
