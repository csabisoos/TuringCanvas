/**
 * LR(0) / SLR(1) Parsing Suite and Parse Tree Construction
 * Pure TypeScript — zero UI, zero DOM.
 */

import type { GrammarData } from '../../types/grammar';
import { computeFirstSets, computeFollowSets } from './LL1Parser';

export interface LR0Item {
  ruleIndex: number;
  lhs: string;
  rhs: string[];
  dot: number;
}

export interface LRState {
  id: number;
  items: LR0Item[];
}

export interface LRTransition {
  fromStateId: number;
  toStateId: number;
  symbol: string;
}

export interface ParseTreeNode {
  id: string;
  label: string;
  children: ParseTreeNode[];
}

export interface LRAction {
  type: 'shift' | 'reduce' | 'accept';
  targetStateId?: number;
  ruleIndex?: number;
}

export interface SLR1TableResult {
  states: LRState[];
  transitions: LRTransition[];
  actionTable: Map<number, Map<string, LRAction[]>>;
  gotoTable: Map<number, Map<string, number>>;
  hasConflicts: boolean;
  rules: { lhs: string; rhs: string[] }[];
}

export interface SLR1Step {
  stepIndex: number;
  stateStack: number[];
  symbolStack: string[];
  remainingInput: string;
  action: string;
}

export interface SLR1SimulationResult {
  accepted: boolean;
  error?: string;
  steps: SLR1Step[];
  parseTreeRoot?: ParseTreeNode;
}

function itemKey(item: LR0Item): string {
  return `${String(item.ruleIndex)}:${String(item.dot)}`;
}

function itemsKey(items: LR0Item[]): string {
  return items
    .map(itemKey)
    .sort()
    .join('|');
}

/**
 * Computes the closure of a set of LR(0) items.
 */
function closure(
  initialItems: LR0Item[],
  rules: { lhs: string; rhs: string[] }[],
  variables: Set<string>
): LR0Item[] {
  const itemMap = new Map<string, LR0Item>();
  for (const item of initialItems) {
    itemMap.set(itemKey(item), item);
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (const item of Array.from(itemMap.values())) {
      // Check symbol after dot
      if (item.dot < item.rhs.length) {
        const nextSym = item.rhs[item.dot] ?? '';
        if (variables.has(nextSym)) {
          // For each rule with lhs == nextSym
          for (let rIdx = 0; rIdx < rules.length; rIdx++) {
            const r = rules[rIdx];
            if (r.lhs === nextSym) {
              const newItem: LR0Item = {
                ruleIndex: rIdx,
                lhs: r.lhs,
                rhs: r.rhs[0] === 'ε' && r.rhs.length === 1 ? [] : r.rhs,
                dot: 0,
              };
              const k = itemKey(newItem);
              if (!itemMap.has(k)) {
                itemMap.set(k, newItem);
                changed = true;
              }
            }
          }
        }
      }
    }
  }

  return Array.from(itemMap.values());
}

/**
 * Computes GOTO(I, X)
 */
function gotoFunction(
  items: LR0Item[],
  symbol: string,
  rules: { lhs: string; rhs: string[] }[],
  variables: Set<string>
): LR0Item[] {
  const movedItems: LR0Item[] = [];

  for (const item of items) {
    if (item.dot < item.rhs.length && item.rhs[item.dot] === symbol) {
      movedItems.push({
        ruleIndex: item.ruleIndex,
        lhs: item.lhs,
        rhs: item.rhs,
        dot: item.dot + 1,
      });
    }
  }

  if (movedItems.length === 0) return [];
  return closure(movedItems, rules, variables);
}

/**
 * Builds the canonical collection of LR(0) item sets and transition DFA.
 */
export function buildLR0ItemSets(g: GrammarData): {
  states: LRState[];
  transitions: LRTransition[];
  rules: { lhs: string; rhs: string[] }[];
} {
  const startPrime = `${g.startVariable}'`;
  const augmentedRules: { lhs: string; rhs: string[] }[] = [
    { lhs: startPrime, rhs: [g.startVariable] },
    ...g.productions.map((p) => ({ lhs: p.lhs, rhs: [...p.rhs] })),
  ];

  const variables = new Set(g.variables);
  variables.add(startPrime);

  const allSymbols = new Set<string>();
  for (const v of variables) allSymbols.add(v);
  for (const t of g.terminals) allSymbols.add(t);

  // Initial state 0
  const initClosure = closure(
    [{ ruleIndex: 0, lhs: startPrime, rhs: [g.startVariable], dot: 0 }],
    augmentedRules,
    variables
  );

  const states: LRState[] = [{ id: 0, items: initClosure }];
  const stateKeyMap = new Map<string, number>();
  stateKeyMap.set(itemsKey(initClosure), 0);

  const transitions: LRTransition[] = [];

  let stateIdx = 0;
  while (stateIdx < states.length) {
    const currentState = states[stateIdx];

    for (const sym of allSymbols) {
      const targetItems = gotoFunction(currentState.items, sym, augmentedRules, variables);
      if (targetItems.length === 0) continue;

      const targetKey = itemsKey(targetItems);
      let targetStateId = stateKeyMap.get(targetKey);

      if (targetStateId === undefined) {
        targetStateId = states.length;
        stateKeyMap.set(targetKey, targetStateId);
        states.push({ id: targetStateId, items: targetItems });
      }

      transitions.push({
        fromStateId: currentState.id,
        toStateId: targetStateId,
        symbol: sym,
      });
    }

    stateIdx++;
  }

  return {
    states,
    transitions,
    rules: augmentedRules,
  };
}

/**
 * Constructs the SLR(1) ACTION and GOTO tables.
 */
export function buildSLR1Table(g: GrammarData): SLR1TableResult {
  const { states, transitions, rules } = buildLR0ItemSets(g);
  const first = computeFirstSets(g);
  const follow = computeFollowSets(g, first);

  const actionTable = new Map<number, Map<string, LRAction[]>>();
  const gotoTable = new Map<number, Map<string, number>>();
  let hasConflicts = false;

  for (const s of states) {
    actionTable.set(s.id, new Map<string, LRAction[]>());
    gotoTable.set(s.id, new Map<string, number>());
  }

  // 1. Shift actions and GOTO table from transitions
  for (const t of transitions) {
    if (g.terminals.has(t.symbol)) {
      const row = actionTable.get(t.fromStateId);
      const cell = row?.get(t.symbol) ?? [];
      cell.push({ type: 'shift', targetStateId: t.toStateId });
      row?.set(t.symbol, cell);
      if (cell.length > 1) hasConflicts = true;
    } else if (g.variables.has(t.symbol)) {
      const row = gotoTable.get(t.fromStateId);
      row?.set(t.symbol, t.toStateId);
    }
  }

  // 2. Reduce and Accept actions from completed items
  for (const s of states) {
    const row = actionTable.get(s.id);
    if (!row) continue;

    for (const item of s.items) {
      if (item.dot === item.rhs.length) {
        if (item.ruleIndex === 0) {
          // S' -> S . ==> accept on $
          const cell = row.get('$') ?? [];
          cell.push({ type: 'accept' });
          row.set('$', cell);
          if (cell.length > 1) hasConflicts = true;
        } else {
          // A -> alpha . ==> reduce on FOLLOW(A)
          const followSet = follow.get(item.lhs) ?? new Set<string>();
          for (const lookahead of followSet) {
            const cell = row.get(lookahead) ?? [];
            cell.push({ type: 'reduce', ruleIndex: item.ruleIndex });
            row.set(lookahead, cell);
            if (cell.length > 1) hasConflicts = true;
          }
        }
      }
    }
  }

  return {
    states,
    transitions,
    actionTable,
    gotoTable,
    hasConflicts,
    rules,
  };
}

/**
 * Simulates Shift-Reduce SLR(1) parsing and builds the parse tree.
 */
export function simulateSLR1(
  slr: SLR1TableResult,
  _g: GrammarData,
  input: string,
  maxSteps = 200
): SLR1SimulationResult {
  const tokens = input.includes(' ')
    ? input.split(/\s+/).filter(Boolean)
    : input.split('');
  tokens.push('$');

  const stateStack: number[] = [0];
  const symbolStack: string[] = ['$'];
  const nodeStack: ParseTreeNode[] = [];
  const steps: SLR1Step[] = [];

  let tokenIdx = 0;
  let stepCount = 0;
  let nodeIdx = 1;

  while (stepCount < maxSteps) {
    const currentState = stateStack[stateStack.length - 1] ?? 0;
    const currentToken = tokens[tokenIdx] ?? '$';
    const remaining = tokens.slice(tokenIdx).join(' ');

    const actionRow = slr.actionTable.get(currentState);
    const actions = actionRow?.get(currentToken) ?? [];

    if (actions.length === 0) {
      steps.push({
        stepIndex: stepCount,
        stateStack: [...stateStack],
        symbolStack: [...symbolStack],
        remainingInput: remaining,
        action: `Error: No action in state ${String(currentState)} on '${currentToken}'`,
      });
      return {
        accepted: false,
        error: `Syntax error in state ${String(currentState)}: unexpected '${currentToken}'`,
        steps,
      };
    }

    const action = actions[0];

    if (action.type === 'shift') {
      const targetState = action.targetStateId ?? 0;
      stateStack.push(targetState);
      symbolStack.push(currentToken);

      nodeStack.push({
        id: `node_${String(nodeIdx++)}`,
        label: currentToken,
        children: [],
      });

      tokenIdx++;
      steps.push({
        stepIndex: stepCount++,
        stateStack: [...stateStack],
        symbolStack: [...symbolStack],
        remainingInput: remaining,
        action: `Shift '${currentToken}' to state ${String(targetState)}`,
      });
    } else if (action.type === 'reduce') {
      const ruleIdx = action.ruleIndex ?? 0;
      const rule = slr.rules[ruleIdx];

      const rhsLen = rule.rhs[0] === 'ε' && rule.rhs.length === 1 ? 0 : rule.rhs.length;
      const children: ParseTreeNode[] = [];

      for (let i = 0; i < rhsLen; i++) {
        stateStack.pop();
        symbolStack.pop();
        const child = nodeStack.pop();
        if (child) {
          children.unshift(child);
        }
      }

      const topState = stateStack[stateStack.length - 1] ?? 0;
      const nextState = slr.gotoTable.get(topState)?.get(rule.lhs);

      if (nextState === undefined) {
        return {
          accepted: false,
          error: `GOTO error: No transition for state ${String(topState)} on variable ${rule.lhs}`,
          steps,
        };
      }

      stateStack.push(nextState);
      symbolStack.push(rule.lhs);

      const parentNode: ParseTreeNode = {
        id: `node_${String(nodeIdx++)}`,
        label: rule.lhs,
        children,
      };
      nodeStack.push(parentNode);

      steps.push({
        stepIndex: stepCount++,
        stateStack: [...stateStack],
        symbolStack: [...symbolStack],
        remainingInput: remaining,
        action: `Reduce by ${rule.lhs} -> ${rule.rhs.join(' ')} (goto state ${String(nextState)})`,
      });
    } else {
      // action.type === 'accept'
      steps.push({
        stepIndex: stepCount,
        stateStack: [...stateStack],
        symbolStack: [...symbolStack],
        remainingInput: remaining,
        action: 'Accept',
      });
      return {
        accepted: true,
        steps,
        parseTreeRoot: nodeStack[nodeStack.length - 1],
      };
    }
  }

  return {
    accepted: false,
    error: 'Parsing timed out or exceeded max step count.',
    steps,
  };
}
