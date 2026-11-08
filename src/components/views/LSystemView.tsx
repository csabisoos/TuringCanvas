import { useState, useMemo, type ReactElement } from 'react';
import { useAutomataStore } from '../../store/useAutomataStore';
import {
  L_SYSTEM_PRESETS,
  rewriteLSystem,
  generateTurtleSegments,
  computeBoundingBox,
} from '../../core/lsystem/LSystemEngine';
import { LSystemCanvas } from '../lsystem/LSystemCanvas';
import type { LSystemPreset, LSystemRule, ColorTheme } from '../../types/lsystem';

export function LSystemView(): ReactElement {
  const returnToDashboard = useAutomataStore((s) => s.returnToDashboard);

  // Selected preset or custom
  const [selectedPresetId, setSelectedPresetId] = useState<string>('plant');

  const defaultPreset: LSystemPreset = useMemo(
    () => L_SYSTEM_PRESETS.find((p) => p.id === selectedPresetId) ?? L_SYSTEM_PRESETS[0],
    [selectedPresetId]
  );

  // Working state
  const [axiom, setAxiom] = useState<string>(defaultPreset.axiom);
  const [rules, setRules] = useState<LSystemRule[]>(defaultPreset.rules);
  const [angle, setAngle] = useState<number>(defaultPreset.angle);
  const [iterations, setIterations] = useState<number>(defaultPreset.defaultIterations);
  const [drawSymbolsStr, setDrawSymbolsStr] = useState<string>(
    defaultPreset.drawSymbols.join(', ')
  );

  // Styling options
  const [theme, setTheme] = useState<ColorTheme>('emerald');
  const [lineWidth, setLineWidth] = useState<number>(1.5);

  // Switch preset
  const handleSelectPreset = (preset: LSystemPreset): void => {
    setSelectedPresetId(preset.id);
    setAxiom(preset.axiom);
    setRules(preset.rules);
    setAngle(preset.angle);
    setIterations(preset.defaultIterations);
    setDrawSymbolsStr(preset.drawSymbols.join(', '));
    if (preset.id === 'plant') setTheme('emerald');
    else if (preset.id === 'dragon') setTheme('neon');
    else if (preset.id === 'sierpinski') setTheme('sunset');
  };

  // Rule management
  const handleRulePredecessorChange = (index: number, val: string): void => {
    setRules((prev) =>
      prev.map((r, i) => (i === index ? { ...r, predecessor: val.slice(0, 1) } : r))
    );
  };

  const handleRuleSuccessorChange = (index: number, val: string): void => {
    setRules((prev) =>
      prev.map((r, i) => (i === index ? { ...r, successor: val } : r))
    );
  };

  const handleAddRule = (): void => {
    setRules([...rules, { predecessor: 'F', successor: 'F' }]);
  };

  const handleRemoveRule = (index: number): void => {
    setRules(rules.filter((_, i) => i !== index));
  };

  // Computed results
  const drawSymbols = useMemo(() => {
    return drawSymbolsStr
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }, [drawSymbolsStr]);

  const expandedString = useMemo(() => {
    return rewriteLSystem(axiom, rules, iterations);
  }, [axiom, rules, iterations]);

  const segments = useMemo(() => {
    return generateTurtleSegments(expandedString, angle, 10, drawSymbols);
  }, [expandedString, angle, drawSymbols]);

  const bbox = useMemo(() => {
    return computeBoundingBox(segments);
  }, [segments]);

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-950 text-gray-100 overflow-hidden">
      {/* Top Header */}
      <div className="px-6 py-3 border-b border-gray-800 bg-gray-900/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { returnToDashboard(); }}
            className="px-2.5 py-1 text-xs rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors cursor-pointer"
          >
            ← Back to Dashboard
          </button>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              <span>L-System Fractal Explorer</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-900/50 text-indigo-400 border border-indigo-700 font-normal">
                Turtle Graphics
              </span>
            </h1>
            <p className="text-xs text-gray-400">
              Parallel Lindenmayer string rewriting engine and interactive 2D fractal renderer
            </p>
          </div>
        </div>

        {/* Live Metrics */}
        <div className="flex items-center gap-4 text-xs font-mono bg-gray-950 px-3 py-1.5 rounded-lg border border-gray-800">
          <div className="flex flex-col">
            <span className="text-gray-500 uppercase text-[10px]">String Length</span>
            <span className="font-semibold text-indigo-300">{expandedString.length.toLocaleString()}</span>
          </div>
          <div className="w-px h-6 bg-gray-800" />
          <div className="flex flex-col">
            <span className="text-gray-500 uppercase text-[10px]">Segments</span>
            <span className="font-semibold text-emerald-300">{segments.length.toLocaleString()}</span>
          </div>
          <div className="w-px h-6 bg-gray-800" />
          <div className="flex flex-col">
            <span className="text-gray-500 uppercase text-[10px]">Depth</span>
            <span className="font-semibold text-amber-300">{iterations}</span>
          </div>
        </div>
      </div>

      {/* Main Content: Sidebar Controls + Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Controls Drawer */}
        <div className="w-84 border-r border-gray-800 bg-gray-900/40 p-4 overflow-y-auto flex flex-col gap-5 shrink-0">
          {/* Preset Buttons */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Presets Library
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {L_SYSTEM_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => { handleSelectPreset(preset); }}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium text-left truncate transition-colors cursor-pointer ${
                    selectedPresetId === preset.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-gray-800/80 text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                  title={preset.description}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Axiom & Rules */}
          <div className="flex flex-col gap-3 p-3 bg-gray-900/90 rounded-xl border border-gray-800">
            <div className="flex flex-col gap-1">
              <label htmlFor="lsystem-axiom" className="text-xs font-bold text-gray-300">
                Axiom (Initial String)
              </label>
              <input
                id="lsystem-axiom"
                type="text"
                value={axiom}
                onChange={(e) => { setAxiom(e.target.value); }}
                className="px-2.5 py-1.5 bg-gray-950 border border-gray-800 rounded font-mono text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-300">Replacement Rules</span>
                <button
                  onClick={handleAddRule}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                >
                  + Add Rule
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                {rules.map((rule, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={rule.predecessor}
                      maxLength={1}
                      onChange={(e) => { handleRulePredecessorChange(idx, e.target.value); }}
                      className="w-8 px-1.5 py-1 text-center bg-gray-950 border border-gray-800 rounded font-mono text-xs text-amber-400 focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-xs text-gray-500">→</span>
                    <input
                      type="text"
                      value={rule.successor}
                      onChange={(e) => { handleRuleSuccessorChange(idx, e.target.value); }}
                      className="flex-1 px-2 py-1 bg-gray-950 border border-gray-800 rounded font-mono text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    {rules.length > 1 && (
                      <button
                        onClick={() => { handleRemoveRule(idx); }}
                        className="p-1 text-gray-500 hover:text-red-400 text-xs transition-colors cursor-pointer"
                        title="Remove Rule"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Iteration Depth Slider */}
          <div className="flex flex-col gap-1.5 p-3 bg-gray-900/90 rounded-xl border border-gray-800">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-gray-300">Iterations (Depth)</span>
              <span className="font-mono text-amber-400 font-semibold">{iterations}</span>
            </div>
            <input
              type="range"
              min={0}
              max={selectedPresetId === 'dragon' ? 14 : 7}
              value={iterations}
              onChange={(e) => { setIterations(Number(e.target.value)); }}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            {iterations >= 6 && selectedPresetId !== 'dragon' && (
              <span className="text-[11px] text-amber-400/90 font-medium">
                ⚠️ High recursion depth may generate {'>'}100,000 segments.
              </span>
            )}
          </div>

          {/* Angle Controls */}
          <div className="flex flex-col gap-2 p-3 bg-gray-900/90 rounded-xl border border-gray-800">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-gray-300">Turn Angle</span>
              <span className="font-mono text-indigo-400 font-semibold">{angle}°</span>
            </div>
            <input
              type="range"
              min={0}
              max={180}
              step={1}
              value={angle}
              onChange={(e) => { setAngle(Number(e.target.value)); }}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex gap-1">
              {[25, 60, 90, 120].map((deg) => (
                <button
                  key={deg}
                  onClick={() => { setAngle(deg); }}
                  className={`flex-1 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                    angle === deg
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
                  }`}
                >
                  {deg}°
                </button>
              ))}
            </div>
          </div>

          {/* Visual Appearance & Styling */}
          <div className="flex flex-col gap-2.5 p-3 bg-gray-900/90 rounded-xl border border-gray-800">
            <span className="text-xs font-bold text-gray-300">Palette Theme</span>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {(
                [
                  { id: 'emerald', label: '🌿 Emerald' },
                  { id: 'neon', label: '⚡ Neon' },
                  { id: 'sunset', label: '🌅 Sunset' },
                  { id: 'monochrome', label: '⚪ Slate' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setTheme(t.id); }}
                  className={`px-2.5 py-1.5 rounded text-xs font-medium text-left transition-colors cursor-pointer ${
                    theme === t.id
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center text-xs pt-1">
              <span className="text-gray-400">Line Width</span>
              <span className="font-mono text-gray-300">{lineWidth}px</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={lineWidth}
              onChange={(e) => { setLineWidth(Number(e.target.value)); }}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Symbols reference guide */}
          <div className="p-3 bg-gray-950/60 rounded-xl border border-gray-800 text-[11px] text-gray-400 flex flex-col gap-1">
            <span className="font-bold text-gray-300">Turtle Reference:</span>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 font-mono text-[10px]">
              <span><b className="text-indigo-400">F, G</b> : draw forward</span>
              <span><b className="text-indigo-400">f</b> : pen up</span>
              <span><b className="text-indigo-400">+</b> : turn right θ</span>
              <span><b className="text-indigo-400">-</b> : turn left θ</span>
              <span><b className="text-indigo-400">[</b> : push state</span>
              <span><b className="text-indigo-400">]</b> : pop state</span>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col h-full bg-gray-950 overflow-hidden">
          <LSystemCanvas
            segments={segments}
            bbox={bbox}
            theme={theme}
            lineWidth={lineWidth}
          />
        </div>
      </div>
    </div>
  );
}
