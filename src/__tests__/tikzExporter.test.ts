import { describe, it, expect } from 'vitest';
import { exportToTikZ } from '../core/io/TikZExporter';
import type { AutomataNode, AutomataEdge } from '../types/ui';

describe('LaTeX TikZ Exporter', () => {
  it('generates standard compilable TikZ automata code for a DFA', () => {
    const nodes: AutomataNode[] = [
      { id: 'q0', position: { x: 0, y: 0 }, label: 'q0', isInitial: true, isAccepting: false },
      { id: 'q1', position: { x: 200, y: 0 }, label: 'q1', isInitial: false, isAccepting: true },
    ];
    const edges: AutomataEdge[] = [
      { id: 'e0', source: 'q0', target: 'q1', symbols: ['a'] },
      { id: 'e1', source: 'q0', target: 'q0', symbols: ['b'] },
      { id: 'e2', source: 'q1', target: 'q0', symbols: ['b'] },
      { id: 'e3', source: 'q1', target: 'q1', symbols: ['ε'] },
    ];

    const tikz = exportToTikZ(nodes, edges);

    expect(tikz).toContain('\\begin{tikzpicture}');
    expect(tikz).toContain('\\end{tikzpicture}');
    expect(tikz).toContain('\\usetikzlibrary{automata, positioning}');

    // Nodes
    expect(tikz).toContain('\\node[state, initial] (q0)');
    expect(tikz).toContain('\\node[state, accepting] (q1)');

    // Transitions
    expect(tikz).toContain('edge [loop'); // for self loops
    expect(tikz).toContain('edge [bend left]'); // for bidirectional pair
    expect(tikz).toContain('\\varepsilon'); // epsilon converted to latex
  });

  it('handles node with both initial and accepting attributes', () => {
    const nodes: AutomataNode[] = [
      { id: 'q0', position: { x: 100, y: 100 }, label: 'q0', isInitial: true, isAccepting: true },
    ];
    const tikz = exportToTikZ(nodes, []);
    expect(tikz).toContain('\\node[state, initial, accepting] (q0)');
  });
});
