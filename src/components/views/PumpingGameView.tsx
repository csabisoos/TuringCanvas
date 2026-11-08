import { useState, useMemo, type ReactElement } from 'react';
import { useAutomataStore } from '../../store/useAutomataStore';
import {
  REGULAR_LANGUAGES,
  validatePartition,
  evaluatePump,
} from '../../core/pumping/RegularPumpingGame';
import {
  CF_LANGUAGES,
  validateCFPartition,
  evaluateCFPump,
} from '../../core/pumping/CFPumpingGame';
import type { CFLanguageDef, RegularLanguageDef } from '../../types/pumping';

type GameMode = 'regular' | 'context-free';

export function PumpingGameView(): ReactElement {
  const returnToDashboard = useAutomataStore((s) => s.returnToDashboard);
  const machineType = useAutomataStore((s) => s.machineType);

  const [mode, setMode] = useState<GameMode>(
    machineType === 'cfg-pumping' ? 'context-free' : 'regular'
  );
  const [selectedRegId, setSelectedRegId] = useState(REGULAR_LANGUAGES[0]?.id ?? 'anbn');
  const [selectedCFId, setSelectedCFId] = useState(CF_LANGUAGES[0]?.id ?? 'anbncn');

  // Pumping length parameter m
  const [m, setM] = useState(3);

  // Regular partition: lengths of x and y
  const [xLen, setXLen] = useState(1);
  const [yLen, setYLen] = useState(1);

  // Context-free partition: lengths of u, v, x, y
  const [cfULen, setCfULen] = useState(1);
  const [cfVLen, setCfVLen] = useState(1);
  const [cfXLen, setCfXLen] = useState(0);
  const [cfYLen, setCfYLen] = useState(1);

  // Exponent i to pump
  const [exponentI, setExponentI] = useState(2);

  const currentRegLang: RegularLanguageDef = useMemo(
    () => REGULAR_LANGUAGES.find((l) => l.id === selectedRegId) ?? REGULAR_LANGUAGES[0],
    [selectedRegId]
  );

  const currentCFLang: CFLanguageDef = useMemo(
    () => CF_LANGUAGES.find((l) => l.id === selectedCFId) ?? CF_LANGUAGES[0],
    [selectedCFId]
  );

  // Base string w
  const w = useMemo(() => {
    return mode === 'regular'
      ? currentRegLang.generateString(m)
      : currentCFLang.generateString(m);
  }, [mode, currentRegLang, currentCFLang, m]);

  // Regular partition validation & pump
  const regValidation = useMemo(
    () => validatePartition(w, m, xLen, yLen),
    [w, m, xLen, yLen]
  );

  const regEval = useMemo(() => {
    if (!regValidation.valid || !regValidation.partition) return null;
    return evaluatePump(currentRegLang, regValidation.partition, exponentI, m);
  }, [currentRegLang, regValidation, exponentI, m]);

  // Context-Free partition validation & pump
  const cfValidation = useMemo(
    () => validateCFPartition(w, m, cfULen, cfVLen, cfXLen, cfYLen),
    [w, m, cfULen, cfVLen, cfXLen, cfYLen]
  );

  const cfEval = useMemo(() => {
    if (!cfValidation.valid || !cfValidation.partition) return null;
    return evaluateCFPump(currentCFLang, cfValidation.partition, exponentI, m);
  }, [currentCFLang, cfValidation, exponentI, m]);

  const activeEval = mode === 'regular' ? regEval : cfEval;

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-950 text-gray-100 overflow-hidden">
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { returnToDashboard(); }}
            className="px-2.5 py-1 text-xs rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors cursor-pointer"
          >
            ← Back to Dashboard
          </button>
          <div>
            <h1 className="text-base font-bold text-white">Pumping Lemma Proof Game</h1>
            <p className="text-xs text-gray-400">
              Interactive contradiction proof assistant for non-regular and non-context-free languages
            </p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-gray-950 p-1 rounded-lg border border-gray-800 text-xs font-semibold">
          <button
            onClick={() => { setMode('regular'); }}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              mode === 'regular'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Regular (w = xyz)
          </button>
          <button
            onClick={() => { setMode('context-free'); }}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              mode === 'context-free'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Context-Free (w = uvxyz)
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full flex flex-col gap-6">
        {/* Preset Language Picker */}
        <div className="flex flex-col gap-2 p-4 bg-gray-900 border border-gray-800 rounded-xl">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Select Language to Disprove:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(mode === 'regular' ? REGULAR_LANGUAGES : CF_LANGUAGES).map((lang) => {
              const isSelected =
                mode === 'regular' ? selectedRegId === lang.id : selectedCFId === lang.id;
              return (
                <button
                  key={lang.id}
                  onClick={() => {
                    if (mode === 'regular') setSelectedRegId(lang.id);
                    else setSelectedCFId(lang.id);
                  }}
                  className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500 text-white'
                      : 'bg-gray-950/60 border-gray-800 text-gray-300 hover:border-gray-700'
                  }`}
                >
                  <span className="font-mono text-xs font-bold text-indigo-300">{lang.name}</span>
                  <span className="text-[11px] text-gray-400 line-clamp-2">{lang.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 1: Pumping Length m */}
        <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              1. Pumping Length (m):
            </span>
            <span className="font-mono text-sm font-bold text-amber-300">m = {String(m)}</span>
          </div>
          <input
            type="range"
            min={2}
            max={8}
            value={m}
            onChange={(e) => {
              setM(Number(e.target.value));
              setXLen(1);
              setYLen(1);
              setCfULen(1);
              setCfVLen(1);
              setCfXLen(0);
              setCfYLen(1);
            }}
            className="w-full accent-indigo-500 cursor-pointer"
          />
          <div className="p-2.5 bg-gray-950 rounded-lg border border-gray-800/80 font-mono text-xs flex items-center justify-between">
            <span className="text-gray-400">Chosen word w ∈ L (|w| = {String(w.length)} ≥ m):</span>
            <span className="font-bold text-indigo-300 tracking-wider text-sm">&quot;{w}&quot;</span>
          </div>
        </div>

        {/* Step 2: Partitioning */}
        {mode === 'regular' ? (
          <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                2. Partition w = x y z (|xy| ≤ m, |y| ≥ 1):
              </span>
              <span className={`text-xs font-semibold ${regValidation.valid ? 'text-emerald-400' : 'text-red-400'}`}>
                {regValidation.valid ? '✓ Valid Partition' : `⚠ ${regValidation.error ?? ''}`}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-blue-400 font-semibold">|x|:</span>
                  <span className="font-mono">{String(xLen)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={m - 1}
                  value={xLen}
                  onChange={(e) => { setXLen(Number(e.target.value)); }}
                  className="accent-blue-500 cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-amber-400 font-semibold">|y|:</span>
                  <span className="font-mono">{String(yLen)}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={Math.max(1, m - xLen)}
                  value={yLen}
                  onChange={(e) => { setYLen(Number(e.target.value)); }}
                  className="accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Visual Word Segments */}
            {regValidation.partition && (
              <div className="flex flex-col gap-1.5 pt-2 border-t border-gray-800">
                <span className="text-[11px] text-gray-400 font-medium">Segments Breakdown:</span>
                <div className="flex items-center gap-1.5 font-mono text-sm overflow-x-auto p-2 bg-gray-950 rounded-lg border border-gray-800">
                  <span className="px-2.5 py-1 rounded bg-blue-950 text-blue-300 border border-blue-800" title="x">
                    x = &quot;{regValidation.partition.x || 'ε'}&quot;
                  </span>
                  <span className="px-2.5 py-1 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold" title="y (pumped)">
                    y = &quot;{regValidation.partition.y}&quot;
                  </span>
                  <span className="px-2.5 py-1 rounded bg-purple-950 text-purple-300 border border-purple-800" title="z">
                    z = &quot;{regValidation.partition.z || 'ε'}&quot;
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                2. Partition w = u v x y z (|vxy| ≤ m, |vy| ≥ 1):
              </span>
              <span className={`text-xs font-semibold ${cfValidation.valid ? 'text-emerald-400' : 'text-red-400'}`}>
                {cfValidation.valid ? '✓ Valid Partition' : `⚠ ${cfValidation.error ?? ''}`}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-blue-400 font-semibold">|u|:</span>
                  <span className="font-mono">{String(cfULen)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, w.length - 2)}
                  value={cfULen}
                  onChange={(e) => { setCfULen(Number(e.target.value)); }}
                  className="accent-blue-500 cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-amber-400 font-semibold">|v|:</span>
                  <span className="font-mono">{String(cfVLen)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, m - cfXLen - cfYLen)}
                  value={cfVLen}
                  onChange={(e) => { setCfVLen(Number(e.target.value)); }}
                  className="accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400 font-semibold">|x|:</span>
                  <span className="font-mono">{String(cfXLen)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, m - cfVLen - cfYLen)}
                  value={cfXLen}
                  onChange={(e) => { setCfXLen(Number(e.target.value)); }}
                  className="accent-gray-400 cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-amber-400 font-semibold">|y|:</span>
                  <span className="font-mono">{String(cfYLen)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, m - cfVLen - cfXLen)}
                  value={cfYLen}
                  onChange={(e) => { setCfYLen(Number(e.target.value)); }}
                  className="accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {cfValidation.partition && (
              <div className="flex flex-col gap-1.5 pt-2 border-t border-gray-800">
                <span className="text-[11px] text-gray-400 font-medium">Segments Breakdown:</span>
                <div className="flex items-center gap-1.5 font-mono text-sm overflow-x-auto p-2 bg-gray-950 rounded-lg border border-gray-800">
                  <span className="px-2 py-1 rounded bg-blue-950 text-blue-300 border border-blue-800">
                    u = &quot;{cfValidation.partition.u || 'ε'}&quot;
                  </span>
                  <span className="px-2 py-1 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                    v = &quot;{cfValidation.partition.v || 'ε'}&quot;
                  </span>
                  <span className="px-2 py-1 rounded bg-gray-900 text-gray-300 border border-gray-700">
                    x = &quot;{cfValidation.partition.x || 'ε'}&quot;
                  </span>
                  <span className="px-2 py-1 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                    y = &quot;{cfValidation.partition.y || 'ε'}&quot;
                  </span>
                  <span className="px-2 py-1 rounded bg-purple-950 text-purple-300 border border-purple-800">
                    z = &quot;{cfValidation.partition.z || 'ε'}&quot;
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Pumping Exponent i */}
        <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              3. Pumping Exponent (i):
            </span>
            <span className="font-mono text-sm font-bold text-indigo-400">i = {String(exponentI)}</span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={6}
              value={exponentI}
              onChange={(e) => { setExponentI(Number(e.target.value)); }}
              className="flex-1 accent-indigo-500 cursor-pointer"
            />
            <div className="flex gap-1.5">
              {[0, 1, 2, 3].map((val) => (
                <button
                  key={val}
                  onClick={() => { setExponentI(val); }}
                  className={`w-7 h-7 rounded text-xs font-mono font-bold transition-colors cursor-pointer ${
                    exponentI === val
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {String(val)}
                </button>
              ))}
            </div>
          </div>

          {/* Pumped String Display */}
          {activeEval && (
            <div className="p-3 bg-gray-950 rounded-lg border border-gray-800 flex flex-col gap-2 font-mono text-xs">
              <div className="flex justify-between items-center border-b border-gray-800 pb-1.5">
                <span className="text-gray-400">
                  Pumped String w&apos; = {mode === 'regular' ? 'x yⁱ z' : 'u vⁱ x yⁱ z'} (|w&apos;| ={' '}
                  {String(activeEval.pumped.length)}):
                </span>
                {!activeEval.inLanguage ? (
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                    🎉 Contradiction! w&apos; ∉ L
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-gray-800 text-amber-300">
                    w&apos; ∈ L (Try another i)
                  </span>
                )}
              </div>

              <div className="p-2 bg-gray-900 rounded font-bold text-indigo-300 break-all text-sm tracking-wider">
                &quot;{activeEval.pumped !== '' ? activeEval.pumped : 'ε'}&quot;
              </div>

              <p className="text-xs text-gray-300 font-sans leading-relaxed pt-1">
                {activeEval.explanation}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
