/**
 * High-Resolution Vector SVG and PNG Exporter for Automata
 * Pure TypeScript SVG generation with browser-based canvas rasterization for PNG.
 */

import type { AutomataNode, AutomataEdge } from '../../types/ui';

interface SVGOptions {
  isDark?: boolean;
  padding?: number;
}

export function generateAutomataSVG(
  nodes: AutomataNode[],
  edges: AutomataEdge[],
  options?: SVGOptions
): string {
  const isDark = options?.isDark ?? true;
  const padding = options?.padding ?? 60;

  if (nodes.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
      <rect width="100%" height="100%" fill="${isDark ? '#030712' : '#ffffff'}" />
      <text x="200" y="150" fill="${isDark ? '#9ca3af' : '#6b7280'}" font-family="sans-serif" font-size="14" text-anchor="middle">Canvas is empty</text>
    </svg>`;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const nodeMap = new Map<string, AutomataNode>();
  for (const n of nodes) {
    nodeMap.set(n.id, n);
    if (n.position.x < minX) minX = n.position.x;
    if (n.position.x > maxX) maxX = n.position.x;
    if (n.position.y < minY) minY = n.position.y;
    if (n.position.y > maxY) maxY = n.position.y;
  }

  // Account for node radius and edge loop extensions
  const viewBoxX = minX - padding - 20;
  const viewBoxY = minY - padding - 50;
  const viewBoxW = maxX - minX + 2 * padding + 80;
  const viewBoxH = maxY - minY + 2 * padding + 80;

  const bgFill = isDark ? '#030712' : '#ffffff';
  const nodeFill = isDark ? '#111827' : '#f3f4f6';
  const nodeStroke = isDark ? '#6366f1' : '#4f46e5';
  const edgeStroke = isDark ? '#818cf8' : '#4338ca';
  const textColor = isDark ? '#f9fafb' : '#111827';
  const badgeBg = isDark ? '#1f2937' : '#e5e7eb';
  const badgeBorder = isDark ? '#374151' : '#d1d5db';

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${String(viewBoxX)} ${String(viewBoxY)} ${String(viewBoxW)} ${String(viewBoxH)}" width="${String(viewBoxW)}" height="${String(viewBoxH)}">\n`;

  // Defs & Arrow Marker
  svg += `  <defs>
    <marker id="svg-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="${edgeStroke}" />
    </marker>
  </defs>\n`;

  // Background
  svg += `  <rect x="${String(viewBoxX)}" y="${String(viewBoxY)}" width="${String(viewBoxW)}" height="${String(viewBoxH)}" fill="${bgFill}" />\n`;

  // Render Edges
  svg += `  <g id="edges">\n`;
  for (const edge of edges) {
    const src = nodeMap.get(edge.source);
    const tgt = nodeMap.get(edge.target);
    if (!src || !tgt) continue;

    const labelText = edge.symbols.join(', ');

    if (edge.source === edge.target) {
      // Self loop
      const cx = src.position.x;
      const cy = src.position.y;
      svg += `    <path d="M ${String(cx - 15)} ${String(cy - 24)} C ${String(cx - 35)} ${String(cy - 75)}, ${String(cx + 35)} ${String(cy - 75)}, ${String(cx + 15)} ${String(cy - 24)}" fill="none" stroke="${edgeStroke}" stroke-width="2" marker-end="url(#svg-arrow)" />\n`;
      // Badge label
      svg += `    <rect x="${String(cx - 16)}" y="${String(cy - 85)}" width="32" height="18" rx="4" fill="${badgeBg}" stroke="${badgeBorder}" stroke-width="1" />\n`;
      svg += `    <text x="${String(cx)}" y="${String(cy - 72)}" fill="${textColor}" font-family="monospace, sans-serif" font-size="11" font-weight="bold" text-anchor="middle">${labelText}</text>\n`;
    } else {
      // Edge between distinct nodes
      const dx = tgt.position.x - src.position.x;
      const dy = tgt.position.y - src.position.y;
      const dist = Math.hypot(dx, dy);
      if (dist === 0) continue;

      const R = 28;
      const x1 = src.position.x + (dx / dist) * R;
      const y1 = src.position.y + (dy / dist) * R;
      const x2 = tgt.position.x - (dx / dist) * R;
      const y2 = tgt.position.y - (dy / dist) * R;

      // Check if reciprocal edge exists to curve slightly
      const hasReciprocal = edges.some(
        (e) => e.source === edge.target && e.target === edge.source
      );

      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;

      if (hasReciprocal) {
        // Curve offset
        const nx = -dy / dist;
        const ny = dx / dist;
        const cx = mx + nx * 25;
        const cy = my + ny * 25;

        svg += `    <path d="M ${String(x1)} ${String(y1)} Q ${String(cx)} ${String(cy)} ${String(x2)} ${String(y2)}" fill="none" stroke="${edgeStroke}" stroke-width="2" marker-end="url(#svg-arrow)" />\n`;
        // Badge label
        svg += `    <rect x="${String(cx - 16)}" y="${String(cy - 9)}" width="32" height="18" rx="4" fill="${badgeBg}" stroke="${badgeBorder}" stroke-width="1" />\n`;
        svg += `    <text x="${String(cx)}" y="${String(cy + 4)}" fill="${textColor}" font-family="monospace, sans-serif" font-size="11" font-weight="bold" text-anchor="middle">${labelText}</text>\n`;
      } else {
        svg += `    <line x1="${String(x1)}" y1="${String(y1)}" x2="${String(x2)}" y2="${String(y2)}" stroke="${edgeStroke}" stroke-width="2" marker-end="url(#svg-arrow)" />\n`;
        // Badge label
        svg += `    <rect x="${String(mx - 16)}" y="${String(my - 9)}" width="32" height="18" rx="4" fill="${badgeBg}" stroke="${badgeBorder}" stroke-width="1" />\n`;
        svg += `    <text x="${String(mx)}" y="${String(my + 4)}" fill="${textColor}" font-family="monospace, sans-serif" font-size="11" font-weight="bold" text-anchor="middle">${labelText}</text>\n`;
      }
    }
  }
  svg += `  </g>\n`;

  // Render Nodes
  svg += `  <g id="nodes">\n`;
  for (const node of nodes) {
    const { x, y } = node.position;

    // Initial arrow
    if (node.isInitial) {
      svg += `    <line x1="${String(x - 55)}" y1="${String(y)}" x2="${String(x - 28)}" y2="${String(y)}" stroke="${nodeStroke}" stroke-width="2.5" marker-end="url(#svg-arrow)" />\n`;
    }

    // Outer circle
    svg += `    <circle cx="${String(x)}" cy="${String(y)}" r="28" fill="${nodeFill}" stroke="${nodeStroke}" stroke-width="2.5" />\n`;

    // Accepting double circle
    if (node.isAccepting) {
      svg += `    <circle cx="${String(x)}" cy="${String(y)}" r="22" fill="none" stroke="${nodeStroke}" stroke-width="1.8" />\n`;
    }

    // State Label
    svg += `    <text x="${String(x)}" y="${String(y + 5)}" fill="${textColor}" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle">${node.label}</text>\n`;

    // Moore machine output label if present
    if (node.mooreOutput) {
      svg += `    <text x="${String(x)}" y="${String(y + 19)}" fill="#a5b4fc" font-family="monospace, sans-serif" font-size="10" text-anchor="middle">/${node.mooreOutput}</text>\n`;
    }
  }
  svg += `  </g>\n`;

  svg += `</svg>`;
  return svg;
}

/**
 * Initiates browser download of vector SVG string.
 */
export function exportSVGFile(svgString: string, filename = 'automaton.svg'): void {
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Renders SVG string to HTML5 Canvas at high DPI and downloads as PNG.
 */
export async function exportPNGFile(
  svgString: string,
  filename = 'automaton.png',
  scale = 2
): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = (): void => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to get 2D canvas context.'));
        return;
      }

      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob): void => {
        URL.revokeObjectURL(url);
        if (!blob) {
          reject(new Error('Failed to convert canvas to blob.'));
          return;
        }
        const pngUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(pngUrl);
        resolve();
      }, 'image/png');
    };

    img.onerror = (): void => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG into image for rasterization.'));
    };

    img.src = url;
  });
}
