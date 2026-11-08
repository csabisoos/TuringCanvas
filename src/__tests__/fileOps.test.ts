import { describe, it, expect, beforeEach } from 'vitest';
import { generateAutomataSVG } from '../core/io/imageExporter';
import {
  saveRecentFile,
  getRecentFiles,
  deleteRecentFile,
  clearRecentFiles,
} from '../core/io/recentFiles';
import type { AutomataNode, AutomataEdge } from '../types/ui';

describe('Vector SVG Generator (Task 9.3)', () => {
  const nodes: AutomataNode[] = [
    { id: 'q0', label: 'q0', isInitial: true, isAccepting: false, position: { x: 100, y: 100 } },
    { id: 'q1', label: 'q1', isInitial: false, isAccepting: true, position: { x: 300, y: 100 } },
  ];

  const edges: AutomataEdge[] = [
    { id: 'e1', source: 'q0', target: 'q1', symbols: ['a', 'b'] },
    { id: 'e2', source: 'q0', target: 'q0', symbols: ['0'] },
  ];

  it('generates well-formed SVG string with viewBox', () => {
    const svg = generateAutomataSVG(nodes, edges);
    expect(svg).toContain('<svg');
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('viewBox=');
    expect(svg).toContain('</svg>');
  });

  it('renders all state nodes and labels', () => {
    const svg = generateAutomataSVG(nodes, edges);
    expect(svg).toContain('q0');
    expect(svg).toContain('q1');
    expect(svg).toContain('circle');
  });

  it('renders double circle for accepting states', () => {
    const svg = generateAutomataSVG(nodes, edges);
    // Accepting states have two concentric circles
    const circleMatches = (svg.match(/<circle/g) ?? []).length;
    // q0 has 1 circle, q1 has 2 circles -> at least 3 circles total
    expect(circleMatches).toBeGreaterThanOrEqual(3);
  });

  it('renders edge symbol labels', () => {
    const svg = generateAutomataSVG(nodes, edges);
    expect(svg).toContain('a, b');
    expect(svg).toContain('0');
  });
});

describe('Recent Files Storage Operations (Task 9.4)', () => {
  beforeEach(() => {
    clearRecentFiles();
  });

  it('saves and retrieves recent files', () => {
    saveRecentFile('Automaton 1', '{"nodes":[],"edges":[]}', 'fa', 3);
    const files = getRecentFiles();
    expect(files).toHaveLength(1);
    expect(files[0]?.name).toBe('Automaton 1');
    expect(files[0]?.nodeCount).toBe(3);
    expect(files[0]?.machineType).toBe('fa');
  });

  it('deletes a recent file by id', () => {
    saveRecentFile('File A', '{}', 'fa', 2);
    const files = getRecentFiles();
    const id = files[0]?.id;
    if (!id) throw new Error('File ID missing');

    deleteRecentFile(id);
    expect(getRecentFiles()).toHaveLength(0);
  });
});
