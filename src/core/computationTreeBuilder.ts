/**
 * Nondeterministic Computation Tree Builder
 * Pure TypeScript — zero UI, zero DOM dependencies.
 */

import type { AutomataNode, AutomataEdge } from '../types/ui';
import type { TreeNode, TreeBranchStatus } from '../types/computationTree';
import { EPSILON } from '../types/automata';

interface BuildContext {
  nodeMap: Map<string, AutomataNode>;
  transitions: {
    source: string;
    target: string;
    symbol: string;
  }[];
  maxDepth: number;
}

export function buildComputationTree(
  nodes: AutomataNode[],
  edges: AutomataEdge[],
  input: string,
  maxDepth = 30
): TreeNode | null {
  const initialNode = nodes.find((n) => n.isInitial);
  if (!initialNode) return null;

  const nodeMap = new Map<string, AutomataNode>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  const transitions: { source: string; target: string; symbol: string }[] = [];
  for (const edge of edges) {
    for (const sym of edge.symbols) {
      transitions.push({
        source: edge.source,
        target: edge.target,
        symbol: sym,
      });
    }
  }

  const ctx: BuildContext = {
    nodeMap,
    transitions,
    maxDepth,
  };

  let nodeIdCounter = 0;

  function explore(
    stateId: string,
    remainingInput: string,
    depth: number,
    ancestors: Set<string>,
    consumedSymbol?: string
  ): TreeNode {
    const node = ctx.nodeMap.get(stateId);
    const label = node?.label ?? stateId;
    const isFinal = Boolean(node?.isAccepting);
    const currentId = `tree-node-${String(++nodeIdCounter)}`;

    const configKey = `${stateId}:${remainingInput}`;
    const isLoop = ancestors.has(configKey);

    const nextAncestors = new Set(ancestors);
    nextAncestors.add(configKey);

    const children: TreeNode[] = [];

    if (!isLoop && depth < ctx.maxDepth) {
      const nextChar = remainingInput.length > 0 ? remainingInput[0] : null;

      // Find all transitions on nextChar or EPSILON
      for (const t of ctx.transitions) {
        if (t.source !== stateId) continue;

        if (t.symbol === EPSILON) {
          children.push(
            explore(t.target, remainingInput, depth + 1, nextAncestors, EPSILON)
          );
        } else if (nextChar !== null && t.symbol === nextChar) {
          children.push(
            explore(
              t.target,
              remainingInput.slice(1),
              depth + 1,
              nextAncestors,
              nextChar
            )
          );
        }
      }
    }

    let status: TreeBranchStatus;
    if (remainingInput.length === 0 && isFinal) {
      status = 'accept';
    } else if (children.length === 0) {
      status = 'reject';
    } else {
      status = 'active';
    }

    return {
      id: currentId,
      stateId,
      stateLabel: label,
      remainingInput,
      consumedSymbol,
      status,
      children,
    };
  }

  return explore(initialNode.id, input, 0, new Set());
}
