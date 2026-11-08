/**
 * Transducer Simulation Adapter
 * Maps visual canvas nodes and edges to MealyMachine and MooreMachine instances.
 */

import type { AutomataEdge, AutomataNode } from '../types/ui';
import type { MealyData, MealyTransition, MooreData, MooreState, MooreTransition } from '../types/transducers';
import { MealyMachine } from '../core/transducers/MealyMachine';
import { MooreMachine } from '../core/transducers/MooreMachine';

export interface BuildMealyResult {
  mealy?: MealyMachine;
  error?: string;
}

export interface BuildMooreResult {
  moore?: MooreMachine;
  error?: string;
}

/**
 * Builds a MealyMachine from canvas nodes and edges.
 * Mealy edges have symbols formatted as "input / output" or "input/output".
 */
export function buildMealyFromCanvas(nodes: AutomataNode[], edges: AutomataEdge[]): BuildMealyResult {
  const initialNodes = nodes.filter((n) => n.isInitial);
  if (initialNodes.length !== 1) {
    return { error: 'A Mealy Machine must have exactly one initial state.' };
  }
  const initialStateId = initialNodes[0].id;

  const states = new Map<string, { id: string; name: string; isInitial: boolean; isAccepting: boolean }>();
  for (const n of nodes) {
    states.set(n.id, {
      id: n.id,
      name: n.label || n.id,
      isInitial: n.isInitial,
      isAccepting: n.isAccepting,
    });
  }

  const inputAlphabet = new Set<string>();
  const outputAlphabet = new Set<string>();
  const transitions: MealyTransition[] = [];

  for (const edge of edges) {
    for (const rawSym of edge.symbols) {
      // Expect format "input / output" or "input/output"
      const parts = rawSym.split('/').map((s) => s.trim());
      if (parts.length < 2) {
        return {
          error: `Invalid Mealy transition '${rawSym}'. Expected format 'input / output'.`,
        };
      }
      const inputSymbol = parts[0] ?? '';
      const outputSymbol = parts[1] ?? '';

      inputAlphabet.add(inputSymbol);
      outputAlphabet.add(outputSymbol);

      transitions.push({
        fromStateId: edge.source,
        toStateId: edge.target,
        inputSymbol,
        outputSymbol,
      });
    }
  }

  try {
    const mealyData: MealyData = {
      states,
      inputAlphabet,
      outputAlphabet,
      transitions,
      initialStateId,
    };
    const mealy = new MealyMachine(mealyData);
    return { mealy };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Builds a MooreMachine from canvas nodes and edges.
 * Moore nodes have an output symbol (node.mooreOutput ?? '0').
 * Moore edges have regular input symbols.
 */
export function buildMooreFromCanvas(nodes: AutomataNode[], edges: AutomataEdge[]): BuildMooreResult {
  const initialNodes = nodes.filter((n) => n.isInitial);
  if (initialNodes.length !== 1) {
    return { error: 'A Moore Machine must have exactly one initial state.' };
  }
  const initialStateId = initialNodes[0].id;

  const states = new Map<string, MooreState>();
  const outputAlphabet = new Set<string>();

  for (const n of nodes) {
    const outputSymbol = n.mooreOutput?.trim() ?? '0';
    outputAlphabet.add(outputSymbol);
    states.set(n.id, {
      id: n.id,
      name: n.label || n.id,
      isInitial: n.isInitial,
      isAccepting: n.isAccepting,
      outputSymbol,
    });
  }

  const inputAlphabet = new Set<string>();
  const transitions: MooreTransition[] = [];

  for (const edge of edges) {
    for (const rawSym of edge.symbols) {
      const trimmed = rawSym.trim();
      if (!trimmed) continue;
      inputAlphabet.add(trimmed);
      transitions.push({
        fromStateId: edge.source,
        toStateId: edge.target,
        inputSymbol: trimmed,
      });
    }
  }

  try {
    const mooreData: MooreData = {
      states,
      inputAlphabet,
      outputAlphabet,
      transitions,
      initialStateId,
    };
    const moore = new MooreMachine(mooreData);
    return { moore };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}
