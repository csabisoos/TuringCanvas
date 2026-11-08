/**
 * Grammar Transformations Pipeline
 * Pure TypeScript — zero UI, zero DOM.
 *
 * Implements:
 * 1. Lambda-production removal
 * 2. Unit-production removal
 * 3. Useless-symbol removal
 * 4. Chomsky Normal Form (CNF) conversion
 */

import type { GrammarData, ProductionRule } from '../../types/grammar';

/**
 * Removes lambda/epsilon productions (A -> ε).
 * If start symbol derives ε, S -> ε is retained or S0 -> S | ε added.
 */
export function removeLambdaProductions(g: GrammarData): GrammarData {
  const { variables, terminals, startVariable, productions } = g;

  // 1. Identify all nullable variables
  const nullable = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const p of productions) {
      if (nullable.has(p.lhs)) continue;

      const isEpsilon = p.rhs.length === 1 && p.rhs[0] === 'ε';
      const allNullable = p.rhs.length > 0 && p.rhs.every((sym) => nullable.has(sym));

      if (isEpsilon || allNullable) {
        nullable.add(p.lhs);
        changed = true;
      }
    }
  }

  // 2. Expand rules omitting subsets of nullable variables
  const newProductions: ProductionRule[] = [];
  let ruleIdx = 1;
  const seenRules = new Set<string>();

  function addRule(lhs: string, rhs: string[]): void {
    if (rhs.length === 0) return;
    const key = `${lhs}->${rhs.join(' ')}`;
    if (!seenRules.has(key)) {
      seenRules.add(key);
      newProductions.push({
        id: `p_nl_${String(ruleIdx++)}`,
        lhs,
        rhs,
      });
    }
  }

  for (const p of productions) {
    if (p.rhs.length === 1 && p.rhs[0] === 'ε') {
      continue;
    }

    // Find indices of nullable variables in this RHS
    const nullableIndices: number[] = [];
    p.rhs.forEach((sym, idx) => {
      if (nullable.has(sym)) {
        nullableIndices.push(idx);
      }
    });

    // Generate 2^k subsets
    const totalCombos = 1 << nullableIndices.length;
    for (let mask = 0; mask < totalCombos; mask++) {
      const candidateRhs: string[] = [];
      let nullIdxCounter = 0;

      for (const sym of p.rhs) {
        if (nullable.has(sym)) {
          // If bit is set, include it; if 0, omit it
          if ((mask & (1 << nullIdxCounter)) !== 0) {
            candidateRhs.push(sym);
          }
          nullIdxCounter++;
        } else {
          candidateRhs.push(sym);
        }
      }

      if (candidateRhs.length > 0) {
        addRule(p.lhs, candidateRhs);
      }
    }
  }

  let finalStart = startVariable;
  const newVariables = new Set(variables);

  // If start variable was nullable, add S0 -> S | ε
  if (nullable.has(startVariable)) {
    const startAppearsOnRhs = newProductions.some((p) => p.rhs.includes(startVariable));
    if (startAppearsOnRhs) {
      finalStart = `${startVariable}0`;
      newVariables.add(finalStart);
      addRule(finalStart, [startVariable]);
      addRule(finalStart, ['ε']);
    } else {
      addRule(startVariable, ['ε']);
    }
  }

  return {
    variables: newVariables,
    terminals: new Set(terminals),
    startVariable: finalStart,
    productions: newProductions,
  };
}

/**
 * Removes unit productions (A -> B where A, B are variables).
 */
export function removeUnitProductions(g: GrammarData): GrammarData {
  const { variables, terminals, startVariable, productions } = g;

  // 1. Compute unit closures U(A) for each variable A
  const unitClosures = new Map<string, Set<string>>();
  for (const v of variables) {
    const closure = new Set<string>([v]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const p of productions) {
        if (closure.has(p.lhs) && p.rhs.length === 1) {
          const target = p.rhs[0] ?? '';
          if (variables.has(target) && !closure.has(target)) {
            closure.add(target);
            changed = true;
          }
        }
      }
    }
    unitClosures.set(v, closure);
  }

  // 2. For each variable A, copy all non-unit productions of B in U(A)
  const newProductions: ProductionRule[] = [];
  const seen = new Set<string>();
  let ruleIdx = 1;

  for (const [v, closure] of unitClosures) {
    for (const b of closure) {
      for (const p of productions) {
        if (p.lhs === b) {
          // Check if p is unit production
          const isUnit = p.rhs.length === 1 && variables.has(p.rhs[0] ?? '');
          if (!isUnit) {
            const key = `${v}->${p.rhs.join(' ')}`;
            if (!seen.has(key)) {
              seen.add(key);
              newProductions.push({
                id: `p_nu_${String(ruleIdx++)}`,
                lhs: v,
                rhs: [...p.rhs],
              });
            }
          }
        }
      }
    }
  }

  return {
    variables: new Set(variables),
    terminals: new Set(terminals),
    startVariable,
    productions: newProductions,
  };
}

/**
 * Removes useless symbols (non-generating and unreachable).
 */
export function removeUselessProductions(g: GrammarData): GrammarData {
  const { terminals, startVariable, productions } = g;

  // Phase 1: Find generating variables (derive terminal strings)
  const generating = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const p of productions) {
      if (generating.has(p.lhs)) continue;

      const allGenOrTerm = p.rhs.every(
        (sym) => sym === 'ε' || terminals.has(sym) || generating.has(sym)
      );
      if (allGenOrTerm) {
        generating.add(p.lhs);
        changed = true;
      }
    }
  }

  // Filter productions to only those with generating LHS and generating/terminal RHS
  const genProductions = productions.filter(
    (p) =>
      generating.has(p.lhs) &&
      p.rhs.every((sym) => sym === 'ε' || terminals.has(sym) || generating.has(sym))
  );

  // Phase 2: Find reachable variables from startVariable
  const reachableVars = new Set<string>();
  const reachableTerms = new Set<string>();
  if (generating.has(startVariable)) {
    reachableVars.add(startVariable);
  }

  changed = true;
  while (changed) {
    changed = false;
    for (const p of genProductions) {
      if (reachableVars.has(p.lhs)) {
        for (const sym of p.rhs) {
          if (generating.has(sym) && !reachableVars.has(sym)) {
            reachableVars.add(sym);
            changed = true;
          } else if (terminals.has(sym) && !reachableTerms.has(sym)) {
            reachableTerms.add(sym);
            changed = true;
          }
        }
      }
    }
  }

  const finalProductions = genProductions.filter(
    (p) =>
      reachableVars.has(p.lhs) &&
      p.rhs.every((sym) => sym === 'ε' || reachableTerms.has(sym) || reachableVars.has(sym))
  );

  return {
    variables: reachableVars,
    terminals: reachableTerms,
    startVariable,
    productions: finalProductions,
  };
}

/**
 * Converts a context-free grammar to Chomsky Normal Form (CNF):
 * Rules are either A -> B C (two variables) or A -> a (single terminal).
 */
export function convertToCNF(g: GrammarData): GrammarData {
  // First simplify
  const g1 = removeLambdaProductions(g);
  const g2 = removeUnitProductions(g1);
  const g3 = removeUselessProductions(g2);

  const { terminals, startVariable } = g3;
  const newVariables = new Set(g3.variables);
  const terminalVarMap = new Map<string, string>();
  let termVarIdx = 1;

  // Step 1: For rules with length >= 2, replace terminals with T_a
  const intermediateProductions: { lhs: string; rhs: string[] }[] = [];

  for (const p of g3.productions) {
    if (p.rhs.length <= 1) {
      intermediateProductions.push({ lhs: p.lhs, rhs: [...p.rhs] });
      continue;
    }

    const newRhs: string[] = [];
    for (const sym of p.rhs) {
      if (terminals.has(sym)) {
        let tvar = terminalVarMap.get(sym);
        if (!tvar) {
          tvar = `T_${sym}_${String(termVarIdx++)}`;
          terminalVarMap.set(sym, tvar);
          newVariables.add(tvar);
        }
        newRhs.push(tvar);
      } else {
        newRhs.push(sym);
      }
    }
    intermediateProductions.push({ lhs: p.lhs, rhs: newRhs });
  }

  // Add rules for T_a -> a
  for (const [term, tvar] of terminalVarMap) {
    intermediateProductions.push({ lhs: tvar, rhs: [term] });
  }

  // Step 2: Break rules of length > 2 into binary cascades
  const finalProductions: ProductionRule[] = [];
  let cascadeIdx = 1;
  let ruleIdx = 1;

  for (const p of intermediateProductions) {
    if (p.rhs.length <= 2) {
      finalProductions.push({
        id: `cnf_${String(ruleIdx++)}`,
        lhs: p.lhs,
        rhs: p.rhs,
      });
      continue;
    }

    // Cascade: A -> B1 C1, C1 -> B2 C2, ..., C_{k-2} -> B_{k-1} B_k
    let currentLhs = p.lhs;
    for (let i = 0; i < p.rhs.length - 2; i++) {
      const nextVar = `C_${String(cascadeIdx++)}`;
      newVariables.add(nextVar);
      finalProductions.push({
        id: `cnf_${String(ruleIdx++)}`,
        lhs: currentLhs,
        rhs: [p.rhs[i] ?? '', nextVar],
      });
      currentLhs = nextVar;
    }

    finalProductions.push({
      id: `cnf_${String(ruleIdx++)}`,
      lhs: currentLhs,
      rhs: [p.rhs[p.rhs.length - 2] ?? '', p.rhs[p.rhs.length - 1] ?? ''],
    });
  }

  return {
    variables: newVariables,
    terminals: new Set(terminals),
    startVariable,
    productions: finalProductions,
  };
}
