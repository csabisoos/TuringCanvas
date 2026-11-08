/**
 * MultiTapeTM — k-Tape Turing Machine Model & Simulation Engine (k >= 2)
 *
 * Pure TypeScript: zero UI, zero React, zero DOM.
 */
import type { State } from '../types/automata';
import type {
  MultiTapeTMData,
  MultiTapeTMResult,
  MultiTapeTMStep,
  MultiTapeTMTransition,
} from '../types/multiTapeTM';
import type { TMHeadDirection } from '../types/tm';
import { TM_BLANK } from '../types/tm';

export class MultiTapeTM {
  public readonly data: MultiTapeTMData;

  constructor(
    states: State[],
    inputAlphabet: Set<string>,
    tapeAlphabet: Set<string>,
    tapeCount = 2,
    blankSymbol = TM_BLANK,
  ) {
    if (tapeCount < 2) {
      throw new Error('MultiTapeTM invariant violated: tapeCount must be >= 2.');
    }
    if (states.length === 0) {
      throw new Error('MultiTapeTM invariant violated: state set must be non-empty.');
    }

    const stateMap = new Map<string, State>();
    for (const s of states) {
      if (stateMap.has(s.id)) {
        throw new Error(`MultiTapeTM invariant violated: duplicate state id "${s.id}".`);
      }
      stateMap.set(s.id, s);
    }

    const initials = states.filter((s) => s.isInitial);
    if (initials.length !== 1) {
      throw new Error(
        `MultiTapeTM invariant violated: expected exactly 1 initial state, got ${initials.length.toString()}.`,
      );
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
      tapeCount,
      blankSymbol,
    };
  }

  public addTransition(
    fromStateId: string,
    toStateId: string,
    readSymbols: string[],
    writeSymbols: string[],
    directions: TMHeadDirection[],
  ): void {
    if (readSymbols.length !== this.data.tapeCount) {
      throw new Error(
        `MultiTapeTM error: readSymbols length (${readSymbols.length.toString()}) does not match tape count (${this.data.tapeCount.toString()}).`,
      );
    }
    if (writeSymbols.length !== this.data.tapeCount) {
      throw new Error(
        `MultiTapeTM error: writeSymbols length (${writeSymbols.length.toString()}) does not match tape count (${this.data.tapeCount.toString()}).`,
      );
    }
    if (directions.length !== this.data.tapeCount) {
      throw new Error(
        `MultiTapeTM error: directions length (${directions.length.toString()}) does not match tape count (${this.data.tapeCount.toString()}).`,
      );
    }

    this.data.transitions.push({
      fromStateId,
      toStateId,
      readSymbols: [...readSymbols],
      writeSymbols: [...writeSymbols],
      directions: [...directions],
    });
  }

  private makeVisibleTape(
    tape: Map<number, string>,
    head: number,
    halfWidth = 5,
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

  public simulate(input: string, maxSteps = 1000): MultiTapeTMResult {
    let initial: State | undefined;
    for (const s of this.data.states.values()) {
      if (s.isInitial) {
        initial = s;
        break;
      }
    }

    if (!initial) {
      throw new Error('MultiTapeTM error: initial state not found.');
    }

    const k = this.data.tapeCount;
    const tapes: Map<number, string>[] = [];
    for (let i = 0; i < k; i++) {
      tapes.push(new Map<number, string>());
    }

    // Initialize tape 0 with input
    for (let i = 0; i < input.length; i++) {
      tapes[0]?.set(i, input[i] ?? this.data.blankSymbol);
    }

    const heads: number[] = Array(k).fill(0) as number[];
    let currentState = initial.id;
    const steps: MultiTapeTMStep[] = [];
    let stepCount = 0;
    let accepted = false;
    let halted = false;

    while (stepCount <= maxSteps) {
      const reads: string[] = heads.map(
        (h, idx) => tapes[idx]?.get(h) ?? this.data.blankSymbol,
      );
      const isAccepting = this.data.states.get(currentState)?.isAccepting ?? false;

      // Find matching transition
      let matching: MultiTapeTMTransition | undefined;
      for (const t of this.data.transitions) {
        if (t.fromStateId === currentState) {
          const matches = t.readSymbols.every((sym, idx) => sym === reads[idx]);
          if (matches) {
            matching = t;
            break;
          }
        }
      }

      const visibleTapes = tapes.map((t, idx) =>
        this.makeVisibleTape(t, heads[idx] ?? 0),
      );

      if (!matching) {
        halted = true;
        accepted = isAccepting;
        steps.push({
          stepIndex: stepCount,
          stateId: currentState,
          headPositions: [...heads],
          visibleTapes,
          accepted,
          halted,
        });
        break;
      }

      steps.push({
        stepIndex: stepCount,
        stateId: currentState,
        headPositions: [...heads],
        visibleTapes,
        accepted: isAccepting,
        halted: false,
      });

      // Apply write and head moves
      for (let i = 0; i < k; i++) {
        const h = heads[i] ?? 0;
        const wSym = matching.writeSymbols[i] ?? this.data.blankSymbol;
        tapes[i]?.set(h, wSym);

        const dir = matching.directions[i];
        if (dir === 'L') {
          heads[i] = h - 1;
        } else if (dir === 'R') {
          heads[i] = h + 1;
        }
      }

      currentState = matching.toStateId;
      stepCount++;
    }

    return {
      accepted,
      halted,
      steps,
    };
  }
}

/**
 * Parses multi-tape transition label "r1, r2; w1, w2, d1, d2"
 */
export function parseMultiTapeTransitionLabel(
  label: string,
  tapeCount = 2,
): { read: string[]; write: string[]; dirs: TMHeadDirection[] } {
  const parts = label.split(';');
  const left = parts[0]?.trim() ?? '';
  const right = parts[1]?.trim() ?? '';

  const read = left.split(',').map((s) => s.trim());
  const rightParts = right.split(',').map((s) => s.trim());

  const write = rightParts.slice(0, tapeCount);
  const rawDirs = rightParts.slice(tapeCount);
  const dirs: TMHeadDirection[] = rawDirs.map((d) => {
    const up = d.toUpperCase();
    return up === 'L' || up === 'R' || up === 'S' ? up : 'R';
  });

  return { read, write, dirs };
}

/**
 * Formats multi-tape transition components into "r1, r2; w1, w2, d1, d2"
 */
export function formatMultiTapeTransition(
  read: string[],
  write: string[],
  dirs: TMHeadDirection[],
): string {
  return `${read.join(', ')}; ${write.join(', ')}, ${dirs.join(', ')}`;
}
