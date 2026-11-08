/**
 * TM — 1-Tape Turing Machine Model & Simulation Engine
 *
 * Implements standard Turing machine 7-tuple model:
 * (Q, Σ, Γ, δ, q0, □, F)
 * Pure TypeScript: zero UI, zero React, zero DOM.
 */
import type { State } from '../types/automata';
import type {
  TMData,
  TMHeadDirection,
  TMResult,
  TMStep,
  TMTransition,
} from '../types/tm';
import { TM_BLANK } from '../types/tm';

export class TM {
  public readonly data: TMData;

  constructor(
    states: State[],
    inputAlphabet: Set<string>,
    tapeAlphabet: Set<string>,
    blankSymbol = TM_BLANK,
  ) {
    if (states.length === 0) {
      throw new Error('TM invariant violated: state set must be non-empty.');
    }

    const stateMap = new Map<string, State>();
    for (const s of states) {
      if (stateMap.has(s.id)) {
        throw new Error(`TM invariant violated: duplicate state id "${s.id}".`);
      }
      stateMap.set(s.id, s);
    }

    const initials = states.filter((s) => s.isInitial);
    if (initials.length !== 1) {
      throw new Error(
        `TM invariant violated: expected exactly 1 initial state, got ${initials.length.toString()}.`,
      );
    }

    if (inputAlphabet.size === 0) {
      throw new Error('TM invariant violated: input alphabet must be non-empty.');
    }

    const fullTapeAlphabet = new Set(tapeAlphabet);
    for (const a of inputAlphabet) {
      fullTapeAlphabet.add(a);
    }
    fullTapeAlphabet.add(blankSymbol);

    this.data = {
      states: stateMap,
      inputAlphabet: new Set(inputAlphabet),
      tapeAlphabet: fullTapeAlphabet,
      transitions: [],
      blankSymbol,
    };
  }

  public addTransition(
    fromStateId: string,
    toStateId: string,
    readSymbol: string,
    writeSymbol: string,
    direction: TMHeadDirection,
  ): void {
    if (!this.data.states.has(fromStateId)) {
      throw new Error(`TM error: state "${fromStateId}" does not exist.`);
    }
    if (!this.data.states.has(toStateId)) {
      throw new Error(`TM error: state "${toStateId}" does not exist.`);
    }
    if (!this.data.tapeAlphabet.has(readSymbol)) {
      throw new Error(`TM error: read symbol "${readSymbol}" is not in tape alphabet.`);
    }
    if (!this.data.tapeAlphabet.has(writeSymbol)) {
      throw new Error(`TM error: write symbol "${writeSymbol}" is not in tape alphabet.`);
    }

    this.data.transitions.push({
      fromStateId,
      toStateId,
      readSymbol,
      writeSymbol,
      direction,
    });
  }

  private makeVisibleTape(
    tape: Map<number, string>,
    head: number,
    halfWidth = 7,
  ): { index: number; symbol: string }[] {
    const visible: { index: number; symbol: string }[] = [];
    for (let i = head - halfWidth; i <= head + halfWidth; i++) {
      visible.push({
        index: i,
        symbol: tape.get(i) ?? this.data.blankSymbol,
      });
    }
    return visible;
  }

  private extractFinalTape(tape: Map<number, string>): string {
    const nonBlankIndices: number[] = [];
    for (const [idx, sym] of tape.entries()) {
      if (sym !== this.data.blankSymbol && sym !== '') {
        nonBlankIndices.push(idx);
      }
    }
    if (nonBlankIndices.length === 0) return '';
    const min = Math.min(...nonBlankIndices);
    const max = Math.max(...nonBlankIndices);

    let result = '';
    for (let i = min; i <= max; i++) {
      result += tape.get(i) ?? this.data.blankSymbol;
    }
    return result;
  }

  public simulate(input: string, maxSteps = 1000): TMResult {
    let initial: State | undefined;
    for (const s of this.data.states.values()) {
      if (s.isInitial) {
        initial = s;
        break;
      }
    }

    if (!initial) {
      throw new Error('TM error: initial state not found.');
    }

    // Initialize tape
    const tape = new Map<number, string>();
    for (let i = 0; i < input.length; i++) {
      tape.set(i, input[i] ?? this.data.blankSymbol);
    }

    let head = 0;
    let currentState = initial.id;
    const steps: TMStep[] = [];
    let stepCount = 0;

    // Transition lookup: fromState -> readSymbol -> transition
    const transMap = new Map<string, Map<string, TMTransition>>();
    for (const s of this.data.states.values()) {
      transMap.set(s.id, new Map());
    }
    for (const t of this.data.transitions) {
      transMap.get(t.fromStateId)?.set(t.readSymbol, t);
    }

    let accepted = false;
    let halted = false;

    while (stepCount <= maxSteps) {
      const currentRead = tape.get(head) ?? this.data.blankSymbol;
      const isAccepting = this.data.states.get(currentState)?.isAccepting ?? false;

      // Tape snapshot
      const snapshot: Record<number, string> = {};
      for (const [idx, val] of tape.entries()) {
        snapshot[idx] = val;
      }

      const matchingTrans = transMap.get(currentState)?.get(currentRead);

      if (!matchingTrans) {
        // No valid transition: Halt!
        halted = true;
        accepted = isAccepting;
        steps.push({
          stepIndex: stepCount,
          stateId: currentState,
          headPosition: head,
          tapeSnapshot: snapshot,
          visibleTape: this.makeVisibleTape(tape, head),
          accepted,
          halted,
        });
        break;
      }

      // Record step before applying transition
      steps.push({
        stepIndex: stepCount,
        stateId: currentState,
        headPosition: head,
        tapeSnapshot: snapshot,
        visibleTape: this.makeVisibleTape(tape, head),
        accepted: isAccepting,
        halted: false,
      });

      // Apply write
      tape.set(head, matchingTrans.writeSymbol);

      // Move head
      if (matchingTrans.direction === 'L') {
        head--;
      } else if (matchingTrans.direction === 'R') {
        head++;
      }

      // Update state
      currentState = matchingTrans.toStateId;
      stepCount++;
    }

    const finalTape = this.extractFinalTape(tape);

    return {
      accepted,
      halted,
      finalTape,
      steps,
    };
  }
}

/**
 * Parses TM transition label "read; write, dir" (e.g. "0; 1, R" or "a; X, L").
 */
export function parseTMTransitionLabel(label: string): {
  read: string;
  write: string;
  dir: TMHeadDirection;
} {
  const parts = label.split(';');
  const read = parts[0]?.trim() ?? '';
  const right = parts[1]?.trim() ?? '';

  const rightParts = right.split(',');
  const write = rightParts[0]?.trim() ?? '';
  const rawDir = rightParts[1]?.trim().toUpperCase() ?? 'R';
  const dir: TMHeadDirection =
    rawDir === 'L' || rawDir === 'R' || rawDir === 'S' ? rawDir : 'R';

  return { read, write, dir };
}

/**
 * Formats TM transition components into "read; write, dir".
 */
export function formatTMTransition(
  read: string,
  write: string,
  dir: TMHeadDirection,
): string {
  return `${read}; ${write}, ${dir}`;
}

/**
 * Builds a 1-Tape Turing Machine from visual canvas nodes and edges.
 */
export function buildTMFromCanvas(
  nodes: { id: string; label: string; isInitial: boolean; isAccepting: boolean }[],
  edges: { source: string; target: string; symbols: string[] }[],
  blankSymbol = TM_BLANK,
): { tm?: TM; error?: string } {
  const initialNodes = nodes.filter((n) => n.isInitial);
  if (initialNodes.length !== 1) {
    return { error: 'Turing Machine must have exactly one initial state.' };
  }

  const inputAlphabet = new Set<string>();
  const tapeAlphabet = new Set<string>([blankSymbol]);

  interface Parsed {
    from: string;
    to: string;
    read: string;
    write: string;
    dir: TMHeadDirection;
  }

  const parsedTransitions: Parsed[] = [];

  for (const edge of edges) {
    for (const sym of edge.symbols) {
      const parsed = parseTMTransitionLabel(sym);
      if (parsed.read !== blankSymbol && parsed.read !== '') {
        inputAlphabet.add(parsed.read);
      }
      tapeAlphabet.add(parsed.read);
      tapeAlphabet.add(parsed.write);

      parsedTransitions.push({
        from: edge.source,
        to: edge.target,
        read: parsed.read,
        write: parsed.write,
        dir: parsed.dir,
      });
    }
  }

  if (inputAlphabet.size === 0) {
    inputAlphabet.add('0');
  }

  const states: State[] = nodes.map((n) => ({
    id: n.id,
    name: n.label,
    isInitial: n.isInitial,
    isAccepting: n.isAccepting,
  }));

  try {
    const tm = new TM(states, inputAlphabet, tapeAlphabet, blankSymbol);
    for (const t of parsedTransitions) {
      tm.addTransition(t.from, t.to, t.read, t.write, t.dir);
    }
    return { tm };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to build TM.';
    return { error: msg };
  }
}
