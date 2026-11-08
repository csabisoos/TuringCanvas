import type { AutomataNode, AutomataEdge } from '../../types/ui';
import { EPSILON } from '../../types/automata';

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function serializeJFF(nodes: AutomataNode[], edges: AutomataEdge[]): string {
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<structure>',
    '\t<type>fa</type>',
    '\t<automaton>',
    '\t\t<!--The list of states.-->',
  ];

  for (const node of nodes) {
    const id = escapeXml(node.id);
    const name = escapeXml(node.label || node.id);
    const x = node.position.x.toFixed(1);
    const y = node.position.y.toFixed(1);

    lines.push(`\t\t<state id="${id}" name="${name}">`);
    lines.push(`\t\t\t<x>${x}</x>`);
    lines.push(`\t\t\t<y>${y}</y>`);
    if (node.isInitial) {
      lines.push('\t\t\t<initial/>');
    }
    if (node.isAccepting) {
      lines.push('\t\t\t<final/>');
    }
    lines.push('\t\t</state>');
  }

  lines.push('\t\t<!--The list of transitions.-->');

  for (const edge of edges) {
    const from = escapeXml(edge.source);
    const to = escapeXml(edge.target);

    for (const sym of edge.symbols) {
      lines.push('\t\t<transition>');
      lines.push(`\t\t\t<from>${from}</from>`);
      lines.push(`\t\t\t<to>${to}</to>`);
      if (sym === 'ε' || sym === EPSILON || sym === '') {
        lines.push('\t\t\t<read/>');
      } else {
        lines.push(`\t\t\t<read>${escapeXml(sym)}</read>`);
      }
      lines.push('\t\t</transition>');
    }
  }

  lines.push('\t</automaton>');
  lines.push('</structure>');

  return lines.join('\n');
}
