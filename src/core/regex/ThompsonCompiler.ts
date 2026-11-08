/**
 * ThompsonCompiler — Synthesizes an NFA from a Regular Expression AST
 *
 * Implements Thompson's Construction algorithm.
 * Pure TypeScript: zero UI, zero React, zero DOM.
 */
import type { RegexNode } from './RegexAST';
import type { AutomataEdge, AutomataNode } from '../../types/ui';
import { applyHierarchicalLayout } from '../layout/graphLayout';

interface Fragment {
  startId: string;
  acceptId: string;
  nodes: { id: string; label: string }[];
  transitions: { source: string; target: string; symbol: string }[];
}

export class ThompsonCompiler {
  private stateCounter = 0;

  private nextStateId(): string {
    const id = `q${this.stateCounter.toString()}`;
    this.stateCounter++;
    return id;
  }

  private compileNode(node: RegexNode): Fragment {
    switch (node.type) {
      case 'literal': {
        const startId = this.nextStateId();
        const acceptId = this.nextStateId();
        return {
          startId,
          acceptId,
          nodes: [
            { id: startId, label: startId },
            { id: acceptId, label: acceptId },
          ],
          transitions: [{ source: startId, target: acceptId, symbol: node.value }],
        };
      }

      case 'epsilon': {
        const startId = this.nextStateId();
        const acceptId = this.nextStateId();
        return {
          startId,
          acceptId,
          nodes: [
            { id: startId, label: startId },
            { id: acceptId, label: acceptId },
          ],
          transitions: [{ source: startId, target: acceptId, symbol: 'ε' }],
        };
      }

      case 'empty_set': {
        const startId = this.nextStateId();
        const acceptId = this.nextStateId();
        return {
          startId,
          acceptId,
          nodes: [
            { id: startId, label: startId },
            { id: acceptId, label: acceptId },
          ],
          transitions: [],
        };
      }

      case 'concat': {
        const left = this.compileNode(node.left);
        const right = this.compileNode(node.right);
        return {
          startId: left.startId,
          acceptId: right.acceptId,
          nodes: [...left.nodes, ...right.nodes],
          transitions: [
            ...left.transitions,
            { source: left.acceptId, target: right.startId, symbol: 'ε' },
            ...right.transitions,
          ],
        };
      }

      case 'union': {
        const left = this.compileNode(node.left);
        const right = this.compileNode(node.right);
        const startId = this.nextStateId();
        const acceptId = this.nextStateId();
        return {
          startId,
          acceptId,
          nodes: [
            { id: startId, label: startId },
            ...left.nodes,
            ...right.nodes,
            { id: acceptId, label: acceptId },
          ],
          transitions: [
            { source: startId, target: left.startId, symbol: 'ε' },
            { source: startId, target: right.startId, symbol: 'ε' },
            ...left.transitions,
            ...right.transitions,
            { source: left.acceptId, target: acceptId, symbol: 'ε' },
            { source: right.acceptId, target: acceptId, symbol: 'ε' },
          ],
        };
      }

      case 'star': {
        const child = this.compileNode(node.child);
        const startId = this.nextStateId();
        const acceptId = this.nextStateId();
        return {
          startId,
          acceptId,
          nodes: [
            { id: startId, label: startId },
            ...child.nodes,
            { id: acceptId, label: acceptId },
          ],
          transitions: [
            { source: startId, target: child.startId, symbol: 'ε' },
            { source: startId, target: acceptId, symbol: 'ε' },
            ...child.transitions,
            { source: child.acceptId, target: child.startId, symbol: 'ε' },
            { source: child.acceptId, target: acceptId, symbol: 'ε' },
          ],
        };
      }

      case 'plus': {
        const child = this.compileNode(node.child);
        const startId = this.nextStateId();
        const acceptId = this.nextStateId();
        return {
          startId,
          acceptId,
          nodes: [
            { id: startId, label: startId },
            ...child.nodes,
            { id: acceptId, label: acceptId },
          ],
          transitions: [
            { source: startId, target: child.startId, symbol: 'ε' },
            ...child.transitions,
            { source: child.acceptId, target: child.startId, symbol: 'ε' },
            { source: child.acceptId, target: acceptId, symbol: 'ε' },
          ],
        };
      }
    }
  }

  public static compile(ast: RegexNode): {
    nodes: AutomataNode[];
    edges: AutomataEdge[];
  } {
    const compiler = new ThompsonCompiler();
    const fragment = compiler.compileNode(ast);

    // Build raw nodes
    const rawNodes: AutomataNode[] = fragment.nodes.map((n) => ({
      id: n.id,
      position: { x: 0, y: 0 },
      label: n.label,
      isInitial: n.id === fragment.startId,
      isAccepting: n.id === fragment.acceptId,
    }));

    // Group transitions by source -> target
    const edgeMap = new Map<
      string,
      { source: string; target: string; symbols: Set<string> }
    >();
    for (const t of fragment.transitions) {
      const key = `${t.source}->${t.target}`;
      let entry = edgeMap.get(key);
      if (!entry) {
        entry = { source: t.source, target: t.target, symbols: new Set() };
        edgeMap.set(key, entry);
      }
      entry.symbols.add(t.symbol);
    }

    const edges: AutomataEdge[] = [];
    let edgeIdx = 0;
    for (const entry of edgeMap.values()) {
      edges.push({
        id: `e_thompson_${edgeIdx.toString()}`,
        source: entry.source,
        target: entry.target,
        symbols: Array.from(entry.symbols),
      });
      edgeIdx++;
    }

    // Apply layout so graph is cleanly readable
    const nodes = applyHierarchicalLayout(rawNodes, edges);

    return { nodes, edges };
  }
}
