import { useRef, useEffect, useState, type ReactElement } from 'react';
import type { LineSegment, BoundingBox, ColorTheme } from '../../types/lsystem';

interface LSystemCanvasProps {
  segments: LineSegment[];
  bbox: BoundingBox;
  theme: ColorTheme;
  lineWidth: number;
}

// Color palette resolver based on theme and branchDepth
function getStrokeStyle(
  theme: ColorTheme,
  seg: LineSegment,
  index: number,
  total: number
): string {
  if (theme === 'monochrome') {
    return '#e2e8f0'; // slate-200
  }

  if (theme === 'emerald') {
    // Natural plant tones from dark green to bright spring leaf
    const shades = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];
    const idx = Math.min(seg.branchDepth, shades.length - 1);
    return shades[idx] ?? '#10b981';
  }

  if (theme === 'sunset') {
    // Warm orange to ruby
    const ratio = total > 1 ? index / total : 0;
    const hue = 30 + ratio * 320; // 30 (orange) to 350 (crimson)
    return `hsl(${String(hue % 360)}, 90%, 60%)`;
  }

  // Neon Cyberpunk theme: Cyan to Violet
  const ratio = total > 1 ? index / total : 0;
  const hue = 180 + ratio * 120; // 180 (cyan) to 300 (magenta)
  return `hsl(${String(hue)}, 95%, 65%)`;
}

export function LSystemCanvas({
  segments,
  bbox,
  theme,
  lineWidth,
}: LSystemCanvasProps): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Pan & Zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const resetView = (): void => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle High-DPI screens
    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = container.clientHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${String(width)}px`;
    canvas.style.height = `${String(height)}px`;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Clear background
    ctx.fillStyle = '#030712'; // gray-950
    ctx.fillRect(0, 0, width, height);

    if (segments.length === 0) {
      ctx.restore();
      return;
    }

    // Compute automatic scale and centering
    const padding = 40;
    const drawWidth = width - 2 * padding;
    const drawHeight = height - 2 * padding;

    const scaleX = bbox.width > 0 ? drawWidth / bbox.width : 1;
    const scaleY = bbox.height > 0 ? drawHeight / bbox.height : 1;
    const baseScale = Math.min(scaleX, scaleY);

    const effectiveScale = baseScale * zoom;

    // Centering offset
    const centerX = width / 2 + pan.x;
    const centerY = height / 2 + pan.y;

    const bboxCenterX = bbox.minX + bbox.width / 2;
    const bboxCenterY = bbox.minY + bbox.height / 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(effectiveScale, effectiveScale);
    ctx.translate(-bboxCenterX, -bboxCenterY);

    // Draw grid background subtly
    ctx.lineWidth = lineWidth / effectiveScale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const totalSegs = segments.length;
    for (const [i, seg] of segments.entries()) {
      ctx.beginPath();
      ctx.strokeStyle = getStrokeStyle(theme, seg, i, totalSegs);
      ctx.moveTo(seg.x1, seg.y1);
      ctx.lineTo(seg.x2, seg.y2);
      ctx.stroke();
    }

    ctx.restore();
    ctx.restore();
  }, [segments, bbox, theme, lineWidth, zoom, pan]);

  // Export current canvas as PNG
  const exportPNG = (): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lsystem-fractal.png';
    a.click();
  };

  return (
    <div
      ref={containerRef}
      className="relative flex-1 w-full h-full bg-gray-950 overflow-hidden select-none cursor-grab active:cursor-grabbing"
      onMouseDown={(e) => {
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      }}
      onMouseMove={(e) => {
        if (!isDragging) return;
        setPan({
          x: e.clientX - dragStartRef.current.x,
          y: e.clientY - dragStartRef.current.y,
        });
      }}
      onMouseUp={() => { setIsDragging(false); }}
      onMouseLeave={() => { setIsDragging(false); }}
      onWheel={(e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.15 : 0.85;
        setZoom((z) => Math.max(0.1, Math.min(50, z * factor)));
      }}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Floating Canvas Controls Overlay */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-gray-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-gray-800 text-xs shadow-lg">
        <button
          onClick={() => { setZoom((z) => Math.min(50, z * 1.25)); }}
          className="p-1 hover:text-white text-gray-400 font-bold transition-colors cursor-pointer"
          title="Zoom In"
        >
          +
        </button>
        <span className="font-mono text-gray-300 min-w-10 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => { setZoom((z) => Math.max(0.1, z / 1.25)); }}
          className="p-1 hover:text-white text-gray-400 font-bold transition-colors cursor-pointer"
          title="Zoom Out"
        >
          -
        </button>
        <div className="w-px h-4 bg-gray-700" />
        <button
          onClick={resetView}
          className="px-2 py-0.5 hover:text-white text-gray-400 transition-colors cursor-pointer"
          title="Reset Pan & Zoom"
        >
          Reset View
        </button>
        <div className="w-px h-4 bg-gray-700" />
        <button
          onClick={exportPNG}
          className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium transition-colors cursor-pointer"
          title="Download PNG"
        >
          Export PNG
        </button>
      </div>
    </div>
  );
}
