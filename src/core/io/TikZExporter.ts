import type { AutomataNode, AutomataEdge } from '../../types/ui';
import { EPSILON } from '../../types/automata';

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9]/g, '_');
}

function formatLabel(label: string): string {
  // If label is like q0, q_0, q12 -> $q_{0}$
  const match = /^([a-zA-Z]+)_?(\d+)$/.exec(label);
  if (match?.[1] && match[2]) {
    return `$${match[1]}_{${match[2]}}$`;
  }
  return `$${label}$`;
}

function formatSymbols(symbols: string[]): string {
  return symbols
    .map((s) => (s === 'ε' || s === EPSILON || s === '' ? '\\varepsilon' : s))
    .join(', ');
}

export function exportToTikZ(nodes: AutomataNode[], edges: AutomataEdge[]): string {
  // Find min coordinates to normalize positions
  let minX = Infinity;
  let minY = Infinity;
  for (const n of nodes) {
    if (n.position.x < minX) minX = n.position.x;
    if (n.position.y < minY) minY = n.position.y;
  }
  if (minX === Infinity) {
    minX = 0;
    minY = 0;
  }

  // Scale: 75 pixels = 1.5 cm -> factor = 0.02
  const scale = 0.02;

  const lines: string[] = [
    '% Requires: \\usepackage{tikz}',
    '% \\usetikzlibrary{automata, positioning}',
    '\\begin{tikzpicture}[shorten >=1pt, node distance=2.5cm, on grid, auto]',
  ];

  // Render nodes
  for (const node of nodes) {
    const styles = ['state'];
    if (node.isInitial) styles.push('initial');
    if (node.isAccepting) styles.push('accepting');

    const cleanId = sanitizeId(node.id);
    const x = ((node.position.x - minX) * scale).toFixed(2);
    // In TikZ, positive Y is up, whereas screen canvas positive Y is down
    const y = (-((node.position.y - minY) * scale)).toFixed(2);
    const label = formatLabel(node.label || node.id);

    lines.push(`  \\node[${styles.join(', ')}] (${cleanId}) at (${x}, ${y}) {${label}};`);
  }

  if (edges.length > 0) {
    lines.push('');
    lines.push('  \\path[->]');

    // Detect bidirectional edges between pairs of distinct nodes
    const edgePairs = new Set<string>();
    for (const e of edges) {
      if (e.source !== e.target) {
        edgePairs.add(`${e.source}->${e.target}`);
      }
    }

    const pathStatements: string[] = [];

    for (const edge of edges) {
      const from = sanitizeId(edge.source);
      const to = sanitizeId(edge.target);
      const symText = formatSymbols(edge.symbols);

      if (edge.source === edge.target) {
        pathStatements.push(`    (${from}) edge [loop above] node {${symText}} (${to})`);
      } else {
        const isBidirectional = edgePairs.has(`${edge.target}->${edge.source}`);
        const edgeOpt = isBidirectional ? ' [bend left]' : '';
        pathStatements.push(`    (${from}) edge${edgeOpt} node {${symText}} (${to})`);
      }
    }

    lines.push(`${pathStatements.join('\n')};`);
  }

  lines.push('\\end{tikzpicture}');

  return lines.join('\n');
}
