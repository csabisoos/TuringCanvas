/**
 * GNFA — Generalized Nondeterministic Finite Automaton & State Elimination Algorithm
 *
 * This module is pure TypeScript: zero UI, zero React, zero DOM.
 */
import {
  unionRegex,
  concatRegex,
  starRegex,
} from './regexFormatter';
import type { AutomataEdge, AutomataNode } from '../types/ui';

export interface GNFATransition {
  from: string;
  to: string;
  expression: string;
}

export class GNFA {
  public readonly startState: string;
  public readonly acceptState: string;
  private readonly states: Set<string>;
  private readonly matrix: Map<string, Map<string, string>>;

  constructor(
    states: string[],
    transitions: GNFATransition[],
    startState: string,
    acceptState: string,
  ) {
    this.startState = startState;
    this.acceptState = acceptState;
    this.states = new Set(states);
    this.matrix = new Map();

    // Initialize full transition table with '∅'
    for (const u of states) {
      const row = new Map<string, string>();
      for (const v of states) {
        row.set(v, '∅');
      }
      this.matrix.set(u, row);
    }

    // Populate transitions
    for (const t of transitions) {
      if (this.states.has(t.from) && this.states.has(t.to)) {
        const current = this.matrix.get(t.from)?.get(t.to) ?? '∅';
        const updated = unionRegex(current, t.expression);
        this.matrix.get(t.from)?.set(t.to, updated);
      }
    }
  }

  /**
   * Returns all states still in the GNFA.
   */
  public getRemainingStates(): string[] {
    return Array.from(this.states);
  }

  /**
   * Returns remaining intermediate states (excluding start and accept).
   */
  public getRemainingIntermediateStates(): string[] {
    return Array.from(this.states).filter(
      (s) => s !== this.startState && s !== this.acceptState,
    );
  }

  /**
   * Returns all non-empty transitions currently in the GNFA.
   */
  public getTransitions(): GNFATransition[] {
    const result: GNFATransition[] = [];
    for (const [from, row] of this.matrix.entries()) {
      if (!this.states.has(from)) continue;
      for (const [to, expr] of row.entries()) {
        if (!this.states.has(to)) continue;
        if (expr !== '∅') {
          result.push({ from, to, expression: expr });
        }
      }
    }
    return result;
  }

  /**
   * Eliminates a single intermediate state using the state elimination formula:
   * R_new(p, s) = R(p, s) ∪ (R(p, q_rip) · (R(q_rip, q_rip))* · R(q_rip, s))
   */
  public eliminateState(ripStateId: string): void {
    if (ripStateId === this.startState || ripStateId === this.acceptState) {
      throw new Error('Cannot eliminate start or accept state.');
    }
    if (!this.states.has(ripStateId)) {
      throw new Error(`State ${ripStateId} is not in the GNFA.`);
    }

    const loop = this.matrix.get(ripStateId)?.get(ripStateId) ?? '∅';
    const loopStar = starRegex(loop);

    const remaining = Array.from(this.states).filter((s) => s !== ripStateId);

    for (const p of remaining) {
      if (p === this.acceptState) continue;
      const r_p_rip = this.matrix.get(p)?.get(ripStateId) ?? '∅';
      if (r_p_rip === '∅') continue;

      for (const s of remaining) {
        if (s === this.startState) continue;
        const r_rip_s = this.matrix.get(ripStateId)?.get(s) ?? '∅';
        if (r_rip_s === '∅') continue;

        const r_p_s = this.matrix.get(p)?.get(s) ?? '∅';
        const bypass = concatRegex(concatRegex(r_p_rip, loopStar), r_rip_s);
        const newExpr = unionRegex(r_p_s, bypass);

        this.matrix.get(p)?.set(s, newExpr);
      }
    }

    // Remove ripStateId from the active states
    this.states.delete(ripStateId);
  }

  /**
   * Successively eliminates all remaining intermediate states.
   */
  public eliminateAll(): void {
    while (this.getRemainingIntermediateStates().length > 0) {
      const next = this.getRemainingIntermediateStates()[0];
      if (next) {
        this.eliminateState(next);
      }
    }
  }

  /**
   * Returns the final regular expression between start and accept state.
   */
  public getFinalRegex(): string {
    return this.matrix.get(this.startState)?.get(this.acceptState) ?? '∅';
  }
}

/**
 * Normalizes any visual automaton into a GNFA with unique start and accept states.
 */
export function automatonToGNFA(
  nodes: AutomataNode[],
  edges: AutomataEdge[],
): GNFA {
  const initialNode = nodes.find((n) => n.isInitial);
  if (!initialNode) {
    throw new Error('Automaton has no initial state.');
  }

  const startState = 'q_start';
  const acceptState = 'q_accept';

  const nodeIds = nodes.map((n) => n.id);
  const allStates = [startState, ...nodeIds, acceptState];

  const transitions: GNFATransition[] = [];

  // Transition from startState to original initial state
  transitions.push({
    from: startState,
    to: initialNode.id,
    expression: 'ε',
  });

  // Transitions from all original accept states to acceptState
  for (const node of nodes) {
    if (node.isAccepting) {
      transitions.push({
        from: node.id,
        to: acceptState,
        expression: 'ε',
      });
    }
  }

  // Transitions from visual edges
  for (const edge of edges) {
    for (const sym of edge.symbols) {
      const expr = sym === 'ε' || sym === '' ? 'ε' : sym;
      transitions.push({
        from: edge.source,
        to: edge.target,
        expression: expr,
      });
    }
  }

  return new GNFA(allStates, transitions, startState, acceptState);
}
