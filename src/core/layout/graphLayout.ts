import type { AutomataNode, AutomataEdge } from '../../types/ui';

export type LayoutAlgorithm = 'circular' | 'hierarchical' | 'force';

export function applyCircularLayout(nodes: AutomataNode[]): AutomataNode[] {
  if (nodes.length === 0) return [];
  if (nodes.length === 1) {
    return [{ ...nodes[0], position: { x: 250, y: 200 } }];
  }

  // Put initial state first so it starts at the left-most or top position
  const sorted = [...nodes].sort((a, b) => {
    if (a.isInitial) return -1;
    if (b.isInitial) return 1;
    return a.id.localeCompare(b.id);
  });

  const count = sorted.length;
  const radius = Math.max(140, count * 35);
  const centerX = 300;
  const centerY = 250;

  return sorted.map((node, index) => {
    const angle = (2 * Math.PI * index) / count - Math.PI;
    const x = Math.round(centerX + radius * Math.cos(angle));
    const y = Math.round(centerY + radius * Math.sin(angle));
    return {
      ...node,
      position: { x, y },
    };
  });
}

export function applyHierarchicalLayout(
  nodes: AutomataNode[],
  edges: AutomataEdge[],
): AutomataNode[] {
  if (nodes.length === 0) return [];

  const initialNode = nodes.find((n) => n.isInitial) ?? nodes[0];
  const ranks = new Map<string, number>();

  // BFS to assign levels/ranks
  const queue: { id: string; rank: number }[] = [{ id: initialNode.id, rank: 0 }];
  ranks.set(initialNode.id, 0);

  const adjacency = new Map<string, Set<string>>();
  for (const n of nodes) adjacency.set(n.id, new Set());
  for (const e of edges) {
    adjacency.get(e.source)?.add(e.target);
  }

  while (queue.length > 0) {
    const curr = queue.shift();
    if (!curr) break;

    const neighbors = adjacency.get(curr.id);
    if (neighbors) {
      for (const target of neighbors) {
        if (!ranks.has(target)) {
          ranks.set(target, curr.rank + 1);
          queue.push({ id: target, rank: curr.rank + 1 });
        }
      }
    }
  }

  // Assign maxRank + 1 to any unreachable nodes
  let maxRank = 0;
  for (const r of ranks.values()) {
    if (r > maxRank) maxRank = r;
  }
  for (const n of nodes) {
    if (!ranks.has(n.id)) {
      maxRank++;
      ranks.set(n.id, maxRank);
    }
  }

  // Group nodes by rank
  const byRank = new Map<number, AutomataNode[]>();
  for (const n of nodes) {
    const r = ranks.get(n.id) ?? 0;
    let group = byRank.get(r);
    if (!group) {
      group = [];
      byRank.set(r, group);
    }
    group.push(n);
  }

  const result: AutomataNode[] = [];
  const rankGapX = 180;
  const nodeGapY = 110;
  const startX = 100;
  const centerY = 240;

  for (const [rank, group] of byRank.entries()) {
    const x = startX + rank * rankGapX;
    const groupHeight = (group.length - 1) * nodeGapY;
    const startY = centerY - groupHeight / 2;

    group.forEach((node, idx) => {
      const y = Math.round(startY + idx * nodeGapY);
      result.push({
        ...node,
        position: { x, y },
      });
    });
  }

  return result;
}

export function applyForceLayout(
  nodes: AutomataNode[],
  edges: AutomataEdge[],
  iterations = 50,
): AutomataNode[] {
  if (nodes.length <= 1) return nodes;

  const width = 600;
  const height = 450;
  const area = width * height;
  const k = Math.sqrt(area / nodes.length);

  // Initialize positions with slight offset if they overlap
  const posMap = new Map<string, { x: number; y: number }>();
  nodes.forEach((n, idx) => {
    let px = n.position.x;
    let py = n.position.y;
    if (px === 0 && py === 0) {
      px = 100 + (idx % 5) * 80;
      py = 100 + Math.floor(idx / 5) * 80;
    }
    posMap.set(n.id, { x: px + (Math.random() - 0.5) * 5, y: py + (Math.random() - 0.5) * 5 });
  });

  let temp = width / 10;
  const cooling = temp / (iterations + 1);

  for (let iter = 0; iter < iterations; iter++) {
    const disp = new Map<string, { x: number; y: number }>();
    for (const n of nodes) {
      disp.set(n.id, { x: 0, y: 0 });
    }

    // Repulsive forces between all node pairs
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const u = nodes[i]?.id ?? '';
        const v = nodes[j]?.id ?? '';
        const posU = posMap.get(u);
        const posV = posMap.get(v);
        if (!posU || !posV) continue;

        let dx = posU.x - posV.x;
        let dy = posU.y - posV.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 1) {
          dx = Math.random() - 0.5;
          dy = Math.random() - 0.5;
          dist = Math.sqrt(dx * dx + dy * dy);
        }

        const force = (k * k) / dist;
        const dispU = disp.get(u);
        const dispV = disp.get(v);
        if (dispU && dispV) {
          dispU.x += (dx / dist) * force;
          dispU.y += (dy / dist) * force;
          dispV.x -= (dx / dist) * force;
          dispV.y -= (dy / dist) * force;
        }
      }
    }

    // Attractive forces along edges
    for (const edge of edges) {
      if (edge.source === edge.target) continue;
      const posU = posMap.get(edge.source);
      const posV = posMap.get(edge.target);
      if (!posU || !posV) continue;

      const dx = posU.x - posV.x;
      const dy = posU.y - posV.y;
      const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      const force = (dist * dist) / k;

      const dispU = disp.get(edge.source);
      const dispV = disp.get(edge.target);
      if (dispU && dispV) {
        dispU.x -= (dx / dist) * force;
        dispU.y -= (dy / dist) * force;
        dispV.x += (dx / dist) * force;
        dispV.y += (dy / dist) * force;
      }
    }

    // Apply displacement limited by temperature
    for (const n of nodes) {
      const p = posMap.get(n.id);
      const d = disp.get(n.id);
      if (!p || !d) continue;
      const dist = Math.max(1, Math.sqrt(d.x * d.x + d.y * d.y));

      p.x += (d.x / dist) * Math.min(dist, temp);
      p.y += (d.y / dist) * Math.min(dist, temp);

      // Bounds
      p.x = Math.max(80, Math.min(800, p.x));
      p.y = Math.max(80, Math.min(600, p.y));
    }

    temp = Math.max(0, temp - cooling);
  }

  return nodes.map((node) => {
    const finalPos = posMap.get(node.id) ?? node.position;
    return {
      ...node,
      position: { x: Math.round(finalPos.x), y: Math.round(finalPos.y) },
    };
  });
}

export function autoLayout(
  nodes: AutomataNode[],
  edges: AutomataEdge[],
  algorithm: LayoutAlgorithm,
): AutomataNode[] {
  switch (algorithm) {
    case 'circular':
      return applyCircularLayout(nodes);
    case 'hierarchical':
      return applyHierarchicalLayout(nodes, edges);
    case 'force':
      return applyForceLayout(nodes, edges);
  }
}
