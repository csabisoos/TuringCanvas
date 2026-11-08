import { describe, it, expect } from 'vitest';
import { parseJFF } from '../core/io/JFFParser';
import { serializeJFF } from '../core/io/JFFSerializer';
import type { AutomataNode, AutomataEdge } from '../types/ui';

describe('JFLAP .jff Interoperability', () => {
  const sampleJFF = `<?xml version="1.0" encoding="UTF-8"?>
<structure>
  <type>fa</type>
  <automaton>
    <state id="0" name="q0">
      <x>100.0</x>
      <y>150.0</y>
      <initial/>
    </state>
    <state id="1" name="q1">
      <x>300.0</x>
      <y>150.0</y>
      <final/>
    </state>
    <transition>
      <from>0</from>
      <to>1</to>
      <read>a</read>
    </transition>
    <transition>
      <from>0</from>
      <to>0</to>
      <read>b</read>
    </transition>
    <transition>
      <from>1</from>
      <to>0</to>
      <read/>
    </transition>
  </automaton>
</structure>`;

  it('parses states, coordinates, initial/final flags, and transitions from JFF XML', () => {
    const { nodes, edges } = parseJFF(sampleJFF);

    expect(nodes).toHaveLength(2);
    const q0 = nodes.find((n) => n.id === '0');
    expect(q0).toBeDefined();
    expect(q0?.label).toBe('q0');
    expect(q0?.isInitial).toBe(true);
    expect(q0?.isAccepting).toBe(false);
    expect(q0?.position.x).toBe(100);
    expect(q0?.position.y).toBe(150);

    const q1 = nodes.find((n) => n.id === '1');
    expect(q1).toBeDefined();
    expect(q1?.label).toBe('q1');
    expect(q1?.isInitial).toBe(false);
    expect(q1?.isAccepting).toBe(true);
    expect(q1?.position.x).toBe(300);

    // Transitions:
    // 0 -> 1 on 'a'
    // 0 -> 0 on 'b'
    // 1 -> 0 on ε (<read/>)
    expect(edges.length).toBeGreaterThanOrEqual(3);
    const edge0to1 = edges.find((e) => e.source === '0' && e.target === '1');
    expect(edge0to1?.symbols).toContain('a');

    const edge0to0 = edges.find((e) => e.source === '0' && e.target === '0');
    expect(edge0to0?.symbols).toContain('b');

    const edge1to0 = edges.find((e) => e.source === '1' && e.target === '0');
    expect(edge1to0?.symbols).toContain('ε');
  });

  it('serializes graph into valid JFLAP .jff XML', () => {
    const nodes: AutomataNode[] = [
      { id: '0', position: { x: 50, y: 80 }, label: 'q0', isInitial: true, isAccepting: false },
      { id: '1', position: { x: 200, y: 80 }, label: 'q1', isInitial: false, isAccepting: true },
    ];
    const edges: AutomataEdge[] = [
      { id: 'e0', source: '0', target: '1', symbols: ['a', 'ε'] },
      { id: 'e1', source: '1', target: '1', symbols: ['b'] },
    ];

    const xml = serializeJFF(nodes, edges);
    expect(xml).toContain('<type>fa</type>');
    expect(xml).toContain('<state id="0" name="q0">');
    expect(xml).toContain('<initial/>');
    expect(xml).toContain('<final/>');
    expect(xml).toContain('<read>a</read>');
    expect(xml).toContain('<read/>');
    expect(xml).toContain('<read>b</read>');
  });

  it('supports round-trip export -> import producing identical topology', () => {
    const nodes: AutomataNode[] = [
      { id: '0', position: { x: 100, y: 120 }, label: 'q0', isInitial: true, isAccepting: false },
      { id: '1', position: { x: 250, y: 120 }, label: 'q1', isInitial: false, isAccepting: true },
    ];
    const edges: AutomataEdge[] = [
      { id: 'e0', source: '0', target: '1', symbols: ['a'] },
      { id: 'e1', source: '1', target: '0', symbols: ['b', 'ε'] },
    ];

    const exportedXml = serializeJFF(nodes, edges);
    const reimported = parseJFF(exportedXml);

    expect(reimported.nodes).toHaveLength(2);
    expect(reimported.nodes.find((n) => n.id === '0')?.isInitial).toBe(true);
    expect(reimported.nodes.find((n) => n.id === '1')?.isAccepting).toBe(true);

    const reimported0to1 = reimported.edges.find((e) => e.source === '0' && e.target === '1');
    expect(reimported0to1?.symbols).toContain('a');

    const reimported1to0 = reimported.edges.find((e) => e.source === '1' && e.target === '0');
    expect(reimported1to0?.symbols).toContain('b');
    expect(reimported1to0?.symbols).toContain('ε');
  });

  it('throws an error if XML is malformed or not a supported structure', () => {
    expect(() => parseJFF('<invalid>')).toThrow();
    expect(() => parseJFF('<structure><type>unsupported</type></structure>')).toThrow();
  });
});
