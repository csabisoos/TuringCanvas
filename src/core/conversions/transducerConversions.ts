/**
 * Transducer Conversions: Moore <-> Mealy
 * Pure TypeScript — zero UI, zero DOM.
 */

import type { State } from '../../types/automata';
import type { MealyData, MealyTransition, MooreData, MooreState, MooreTransition } from '../../types/transducers';

/**
 * Converts a Moore Machine to a Mealy Machine.
 * In a Moore machine, output is on states.
 * In the resulting Mealy machine, each transition (q -> p on a) gets output lambda(p).
 */
export function mooreToMealy(moore: MooreData): MealyData {
  const states = new Map<string, State>();
  for (const [id, s] of moore.states) {
    states.set(id, {
      id: s.id,
      name: s.name,
      isInitial: s.isInitial,
      isAccepting: s.isAccepting,
    });
  }

  const transitions: MealyTransition[] = [];
  for (const t of moore.transitions) {
    const targetState = moore.states.get(t.toStateId);
    if (!targetState) {
      continue;
    }
    transitions.push({
      fromStateId: t.fromStateId,
      toStateId: t.toStateId,
      inputSymbol: t.inputSymbol,
      outputSymbol: targetState.outputSymbol,
    });
  }

  return {
    states,
    inputAlphabet: new Set(moore.inputAlphabet),
    outputAlphabet: new Set(moore.outputAlphabet),
    transitions,
    initialStateId: moore.initialStateId,
  };
}

/**
 * Converts a Mealy Machine to a Moore Machine via state-splitting.
 * In a Mealy machine, output is on transitions.
 * Any state q reached with multiple distinct outputs o_1, o_2, ... must be split into (q, o_i).
 */
export function mealyToMoore(mealy: MealyData): MooreData {
  const defaultOutput = mealy.outputAlphabet.values().next().value ?? '0';

  // Group incoming outputs by destination state
  const incomingOutputs = new Map<string, Set<string>>();
  for (const [id] of mealy.states) {
    incomingOutputs.set(id, new Set<string>());
  }
  for (const t of mealy.transitions) {
    incomingOutputs.get(t.toStateId)?.add(t.outputSymbol);
  }

  const newStates = new Map<string, MooreState>();
  // Map from originalStateId -> Map<outputSymbol, newMooreStateId>
  const stateOutputMap = new Map<string, Map<string, string>>();

  for (const [origId, origState] of mealy.states) {
    const outs = incomingOutputs.get(origId) ?? new Set<string>();
    const outMap = new Map<string, string>();
    stateOutputMap.set(origId, outMap);

    const isInitial = origId === mealy.initialStateId;

    if (outs.size === 0) {
      // Unreachable state or initial state with no incoming edges
      const newId = origId;
      newStates.set(newId, {
        id: newId,
        name: origState.name,
        isInitial,
        isAccepting: origState.isAccepting,
        outputSymbol: defaultOutput,
      });
      outMap.set(defaultOutput, newId);
    } else {
      if (isInitial) {
        // Initial state has incoming edges. Create an initial state instance with default output
        // if defaultOutput is not in outs, or create q_init.
        const initId = `${origId}_init`;
        newStates.set(initId, {
          id: initId,
          name: `${origState.name} (start)`,
          isInitial: true,
          isAccepting: origState.isAccepting,
          outputSymbol: defaultOutput,
        });
      }

      for (const o of outs) {
        const newId = outs.size === 1 && !isInitial ? origId : `${origId}_${o}`;
        newStates.set(newId, {
          id: newId,
          name: `${origState.name}/${o}`,
          isInitial: false,
          isAccepting: origState.isAccepting,
          outputSymbol: o,
        });
        outMap.set(o, newId);
      }
    }
  }

  // Generate transitions
  const newTransitions: MooreTransition[] = [];

  for (const t of mealy.transitions) {
    const targetMooreId = stateOutputMap.get(t.toStateId)?.get(t.outputSymbol);
    if (!targetMooreId) {
      continue;
    }

    // Find all Moore copies of fromStateId
    const sourceCopies: string[] = [];
    if (t.fromStateId === mealy.initialStateId && newStates.has(`${t.fromStateId}_init`)) {
      sourceCopies.push(`${t.fromStateId}_init`);
    }
    const fromOutMap = stateOutputMap.get(t.fromStateId);
    if (fromOutMap) {
      for (const copyId of fromOutMap.values()) {
        if (!sourceCopies.includes(copyId)) {
          sourceCopies.push(copyId);
        }
      }
    }

    // If fromStateId had no incoming edges, it is just fromStateId
    if (sourceCopies.length === 0 && newStates.has(t.fromStateId)) {
      sourceCopies.push(t.fromStateId);
    }

    for (const srcId of sourceCopies) {
      newTransitions.push({
        fromStateId: srcId,
        toStateId: targetMooreId,
        inputSymbol: t.inputSymbol,
      });
    }
  }

  // Determine initial state ID
  const initialId = newStates.has(`${mealy.initialStateId}_init`)
    ? `${mealy.initialStateId}_init`
    : mealy.initialStateId;

  return {
    states: newStates,
    inputAlphabet: new Set(mealy.inputAlphabet),
    outputAlphabet: new Set(mealy.outputAlphabet),
    transitions: newTransitions,
    initialStateId: initialId,
  };
}
