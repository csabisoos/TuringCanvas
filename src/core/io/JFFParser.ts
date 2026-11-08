import type { AutomataNode, AutomataEdge } from '../../types/ui';

export function parseJFF(xmlString: string): { nodes: AutomataNode[]; edges: AutomataEdge[] } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');

  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error(`XML parsing error: ${parserError.textContent ?? 'Invalid XML'}`);
  }

  const structure = doc.querySelector('structure');
  if (!structure) {
    throw new Error('Invalid JFF: Missing <structure> element');
  }

  const typeEl = structure.querySelector('type');
  const machineType = typeEl?.textContent?.trim().toLowerCase();
  if (!machineType || machineType !== 'fa') {
    throw new Error(`Unsupported JFF structure type: "${machineType ?? 'unknown'}". Expected "fa".`);
  }

  const automaton = structure.querySelector('automaton');
  if (!automaton) {
    throw new Error('Invalid JFF: Missing <automaton> element');
  }

  const nodes: AutomataNode[] = [];
  const stateElements = automaton.querySelectorAll('state');

  stateElements.forEach((el, index) => {
    const id = el.getAttribute('id') ?? `q${index.toString()}`;
    const name = el.getAttribute('name') ?? id;

    const xEl = el.querySelector('x');
    const yEl = el.querySelector('y');
    const x = xEl ? parseFloat(xEl.textContent ?? '0') : 100 + index * 120;
    const y = yEl ? parseFloat(yEl.textContent ?? '0') : 100;

    const isInitial = el.querySelector('initial') !== null;
    const isAccepting = el.querySelector('final') !== null;

    nodes.push({
      id,
      position: { x: Number.isNaN(x) ? 100 : x, y: Number.isNaN(y) ? 100 : y },
      label: name,
      isInitial,
      isAccepting,
    });
  });

  // Collect transitions and consolidate symbols by (from, to) pair
  const transitionPairs = new Map<string, { source: string; target: string; symbols: Set<string> }>();
  const transitionElements = automaton.querySelectorAll('transition');

  transitionElements.forEach((el) => {
    const fromEl = el.querySelector('from');
    const toEl = el.querySelector('to');
    if (!fromEl || !toEl) return;

    const source = fromEl.textContent?.trim() ?? '';
    const target = toEl.textContent?.trim() ?? '';
    if (!source || !target) return;

    const readEl = el.querySelector('read');
    let sym = readEl?.textContent?.trim() ?? '';
    if (sym === '' || sym === 'λ' || sym === '&#955;' || sym === '&#949;') {
      sym = 'ε';
    }

    const key = `${source}->${target}`;
    let entry = transitionPairs.get(key);
    if (!entry) {
      entry = { source, target, symbols: new Set() };
      transitionPairs.set(key, entry);
    }
    entry.symbols.add(sym);
  });

  const edges: AutomataEdge[] = [];
  let edgeCounter = 0;

  for (const entry of transitionPairs.values()) {
    edges.push({
      id: `e_jff_${edgeCounter.toString()}`,
      source: entry.source,
      target: entry.target,
      symbols: Array.from(entry.symbols),
    });
    edgeCounter++;
  }

  return { nodes, edges };
}
