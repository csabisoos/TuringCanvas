/**
 * PDA — Pushdown Automaton Domain Model & Simulation Engine
 *
 * Implements non-deterministic PDA (NPDA) 7-tuple model:
 * (Q, Σ, Γ, δ, q0, Z0, F)
 * Pure TypeScript: zero UI, zero React, zero DOM.
 */
import type { State } from '../types/automata';
import type {
  AcceptanceCriteria,
  PDAConfiguration,
  PDAData,
  PDASimulationStep,
} from '../types/pda';

export class PDA {
  public readonly data: PDAData;

  constructor(
    states: State[],
    inputAlphabet: Set<string>,
    stackAlphabet: Set<string>,
    initialStackSymbol = 'Z',
    acceptanceCriteria: AcceptanceCriteria = 'finalState',
  ) {
    if (states.length === 0) {
      throw new Error('PDA invariant violated: state set must be non-empty.');
    }

    const stateMap = new Map<string, State>();
    for (const s of states) {
      if (stateMap.has(s.id)) {
        throw new Error(`PDA invariant violated: duplicate state id "${s.id}".`);
      }
      stateMap.set(s.id, s);
    }

    const initials = states.filter((s) => s.isInitial);
    if (initials.length !== 1) {
      throw new Error(
        `PDA invariant violated: expected exactly 1 initial state, got ${initials.length.toString()}.`,
      );
    }

    if (inputAlphabet.size === 0) {
      throw new Error('PDA invariant violated: input alphabet must be non-empty.');
    }

    if (stackAlphabet.size === 0) {
      throw new Error('PDA invariant violated: stack alphabet must be non-empty.');
    }

    if (!stackAlphabet.has(initialStackSymbol)) {
      throw new Error(
        `PDA invariant violated: initial stack symbol "${initialStackSymbol}" must be in stack alphabet.`,
      );
    }

    this.data = {
      states: stateMap,
      inputAlphabet: new Set(inputAlphabet),
      stackAlphabet: new Set(stackAlphabet),
      transitions: [],
      initialStackSymbol,
      acceptanceCriteria,
    };
  }

  public setAcceptanceCriteria(criteria: AcceptanceCriteria): void {
    this.data.acceptanceCriteria = criteria;
  }

  public addTransition(
    fromStateId: string,
    toStateId: string,
    inputSymbol: string,
    popSymbol: string,
    pushSymbols: string[],
  ): void {
    if (!this.data.states.has(fromStateId)) {
      throw new Error(`PDA error: fromState "${fromStateId}" does not exist.`);
    }
    if (!this.data.states.has(toStateId)) {
      throw new Error(`PDA error: toState "${toStateId}" does not exist.`);
    }

    const normInput = inputSymbol === 'ε' || inputSymbol === '' ? '' : inputSymbol;
    if (normInput !== '' && !this.data.inputAlphabet.has(normInput)) {
      throw new Error(`PDA error: symbol "${normInput}" is not in input alphabet.`);
    }

    const normPop = popSymbol === 'ε' || popSymbol === '' ? '' : popSymbol;
    if (normPop !== '' && !this.data.stackAlphabet.has(normPop)) {
      throw new Error(`PDA error: symbol "${normPop}" is not in stack alphabet.`);
    }

    const normPush: string[] = [];
    for (const sym of pushSymbols) {
      if (sym !== 'ε' && sym !== '') {
        if (!this.data.stackAlphabet.has(sym)) {
          throw new Error(`PDA error: symbol "${sym}" is not in stack alphabet.`);
        }
        normPush.push(sym);
      }
    }

    this.data.transitions.push({
      fromStateId,
      toStateId,
      inputSymbol: normInput,
      popSymbol: normPop,
      pushSymbols: normPush,
    });
  }

  private configKey(c: PDAConfiguration): string {
    return `${c.stateId}#${c.remainingInput}#${c.stack.join(',')}`;
  }

  private isAccepted(c: PDAConfiguration): boolean {
    if (c.remainingInput.length > 0) return false;
    const isFinal = this.data.states.get(c.stateId)?.isAccepting ?? false;
    const isEmpty = c.stack.length === 0;

    switch (this.data.acceptanceCriteria) {
      case 'finalState':
        return isFinal;
      case 'emptyStack':
        return isEmpty;
      case 'both':
        return isFinal && isEmpty;
    }
  }

  /**
   * Computes the epsilon-closure of a set of configurations.
   */
  private getEpsilonClosure(
    initialConfigs: PDAConfiguration[],
    maxEpsSteps = 50,
  ): PDAConfiguration[] {
    const result: PDAConfiguration[] = [...initialConfigs];
    const visited = new Set<string>(initialConfigs.map((c) => this.configKey(c)));
    const queue: PDAConfiguration[] = [...initialConfigs];

    let steps = 0;
    while (queue.length > 0 && steps < maxEpsSteps * initialConfigs.length + 50) {
      const curr = queue.shift();
      if (!curr) continue;
      steps++;

      for (const t of this.data.transitions) {
        if (t.fromStateId === curr.stateId && t.inputSymbol === '') {
          // Check stack pop condition
          let canPop = false;
          let remainingStack: string[] = [];

          if (t.popSymbol === '') {
            canPop = true;
            remainingStack = curr.stack;
          } else if (curr.stack.length > 0 && curr.stack[0] === t.popSymbol) {
            canPop = true;
            remainingStack = curr.stack.slice(1);
          }

          if (canPop) {
            const nextStack = [...t.pushSymbols, ...remainingStack];
            const nextConfig: PDAConfiguration = {
              stateId: t.toStateId,
              remainingInput: curr.remainingInput,
              stack: nextStack,
            };

            const key = this.configKey(nextConfig);
            if (!visited.has(key)) {
              visited.add(key);
              result.push(nextConfig);
              queue.push(nextConfig);
            }
          }
        }
      }
    }

    return result;
  }

  /**
   * Generates simulation steps for an input string.
   */
  public getSimulationSteps(
    input: string,
    maxSteps = 100,
  ): PDASimulationStep[] {
    let initial: State | undefined;
    for (const s of this.data.states.values()) {
      if (s.isInitial) {
        initial = s;
        break;
      }
    }

    if (!initial) {
      return [{ stepIndex: 0, configurations: [], accepted: false }];
    }

    const startConfig: PDAConfiguration = {
      stateId: initial.id,
      remainingInput: input,
      stack: [this.data.initialStackSymbol],
    };

    const initialConfigs = this.getEpsilonClosure([startConfig]);
    const isInitialAccepted = initialConfigs.some((c) => this.isAccepted(c));

    const steps: PDASimulationStep[] = [
      {
        stepIndex: 0,
        configurations: initialConfigs,
        accepted: isInitialAccepted,
      },
    ];

    let currentConfigs = initialConfigs;
    let stepNum = 1;

    while (stepNum <= maxSteps) {
      // Find all configurations that still have input to consume
      const nextRawConfigs: PDAConfiguration[] = [];
      const visitedNext = new Set<string>();

      for (const curr of currentConfigs) {
        if (curr.remainingInput.length === 0) continue;
        const sym = curr.remainingInput[0];
        const restInput = curr.remainingInput.slice(1);

        for (const t of this.data.transitions) {
          if (t.fromStateId === curr.stateId && t.inputSymbol === sym) {
            let canPop = false;
            let remainingStack: string[] = [];

            if (t.popSymbol === '') {
              canPop = true;
              remainingStack = curr.stack;
            } else if (curr.stack.length > 0 && curr.stack[0] === t.popSymbol) {
              canPop = true;
              remainingStack = curr.stack.slice(1);
            }

            if (canPop) {
              const nextStack = [...t.pushSymbols, ...remainingStack];
              const nextConfig: PDAConfiguration = {
                stateId: t.toStateId,
                remainingInput: restInput,
                stack: nextStack,
              };

              const key = this.configKey(nextConfig);
              if (!visitedNext.has(key)) {
                visitedNext.add(key);
                nextRawConfigs.push(nextConfig);
              }
            }
          }
        }
      }

      if (nextRawConfigs.length === 0) {
        break;
      }

      const closedConfigs = this.getEpsilonClosure(nextRawConfigs);
      const accepted = closedConfigs.some((c) => this.isAccepted(c));

      steps.push({
        stepIndex: stepNum,
        configurations: closedConfigs,
        accepted,
      });

      currentConfigs = closedConfigs;
      stepNum++;
    }

    return steps;
  }

  /**
   * Simulates an input string and returns true if accepted.
   */
  public simulate(input: string, maxSteps = 100): boolean {
    const steps = this.getSimulationSteps(input, maxSteps);
    // Accepted if any step has accepted = true
    return steps.some((s) => s.accepted);
  }
}

/**
 * Parses PDA transition string "input, pop; push" (e.g. "a, Z; AZ" or "b, A; ε").
 */
export function parsePDATransitionLabel(label: string): {
  input: string;
  pop: string;
  push: string;
} {
  const parts = label.split(';');
  const left = parts[0]?.trim() ?? '';
  const push = parts[1]?.trim() ?? '';

  const leftParts = left.split(',');
  const input = leftParts[0]?.trim() ?? '';
  const pop = leftParts[1]?.trim() ?? '';

  return { input, pop, push };
}

/**
 * Formats PDA transition components into "input, pop; push".
 */
export function formatPDATransition(
  input: string,
  pop: string,
  push: string,
): string {
  const i = input === '' ? 'ε' : input;
  const p = pop === '' ? 'ε' : pop;
  const pu = push === '' ? 'ε' : push;
  return `${i}, ${p}; ${pu}`;
}

/**
 * Builds a PDA from visual canvas nodes and edges.
 */
export function buildPDAFromCanvas(
  nodes: { id: string; label: string; isInitial: boolean; isAccepting: boolean }[],
  edges: { source: string; target: string; symbols: string[] }[],
  initialStackSymbol = 'Z',
  acceptanceCriteria: AcceptanceCriteria = 'finalState',
): { pda?: PDA; error?: string } {
  const initialNodes = nodes.filter((n) => n.isInitial);
  if (initialNodes.length !== 1) {
    return { error: 'PDA must have exactly one initial state.' };
  }

  const inputAlphabet = new Set<string>();
  const stackAlphabet = new Set<string>([initialStackSymbol]);

  interface ParsedTrans {
    from: string;
    to: string;
    input: string;
    pop: string;
    push: string[];
  }

  const parsedTransitions: ParsedTrans[] = [];

  for (const edge of edges) {
    for (const sym of edge.symbols) {
      const parsed = parsePDATransitionLabel(sym);
      const input = parsed.input === 'ε' ? '' : parsed.input;
      const pop = parsed.pop === 'ε' ? '' : parsed.pop;
      const pushSymbols =
        parsed.push === 'ε' || parsed.push === ''
          ? []
          : parsed.push.split('');

      if (input !== '') inputAlphabet.add(input);
      if (pop !== '') stackAlphabet.add(pop);
      for (const p of pushSymbols) {
        stackAlphabet.add(p);
      }

      parsedTransitions.push({
        from: edge.source,
        to: edge.target,
        input,
        pop,
        push: pushSymbols,
      });
    }
  }

  // Ensure non-empty input alphabet
  if (inputAlphabet.size === 0) {
    inputAlphabet.add('a');
  }

  const states: State[] = nodes.map((n) => ({
    id: n.id,
    name: n.label,
    isInitial: n.isInitial,
    isAccepting: n.isAccepting,
  }));

  try {
    const pda = new PDA(
      states,
      inputAlphabet,
      stackAlphabet,
      initialStackSymbol,
      acceptanceCriteria,
    );
    for (const t of parsedTransitions) {
      pda.addTransition(t.from, t.to, t.input, t.pop, t.push);
    }
    return { pda };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to build PDA.';
    return { error: msg };
  }
}
