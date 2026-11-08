import React, { useState, useMemo } from 'react';
import { useAutomataStore } from '../../store/useAutomataStore';
import { parseRegex } from '../../core/regex/RegexParser';
import { ThompsonCompiler } from '../../core/regex/ThompsonCompiler';
import type { RegexNode } from '../../core/regex/RegexAST';

const PRESETS: { label: string; regex: string; desc: string }[] = [
  {
    label: 'Ends with 00',
    regex: '(0+1)*00',
    desc: 'Binary strings ending with two zeros',
  },
  {
    label: 'Contains abb',
    regex: '(a+b)*abb',
    desc: 'Classic NFA benchmark with subword abb',
  },
  {
    label: 'Even length',
    regex: '((a+b)(a+b))*',
    desc: 'Strings of even length over {a, b}',
  },
  {
    label: 'Alternating ba',
    regex: 'a(ba)*b',
    desc: 'Starts with a, ends with b, alternating',
  },
];

export const RegexEditorView: React.FC = (): React.ReactElement => {
  const setContentView = useAutomataStore((s) => s.setContentView);
  const returnToDashboard = useAutomataStore((s) => s.returnToDashboard);
  const applyConvertedDFA = useAutomataStore((s) => s.applyConvertedDFA);

  const [regexInput, setRegexInput] = useState<string>('(0+1)*00');

  // Real-time AST parsing & validation
  const { ast, error } = useMemo<{
    ast: RegexNode | null;
    error: string | null;
  }>(() => {
    if (!regexInput.trim()) {
      return { ast: null, error: 'Please enter a regular expression.' };
    }
    try {
      const parsed = parseRegex(regexInput);
      return { ast: parsed, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Syntax error in regular expression.';
      return { ast: null, error: msg };
    }
  }, [regexInput]);

  const handleGenerate = (): void => {
    if (!ast) return;
    try {
      const { nodes, edges } = ThompsonCompiler.compile(ast);
      applyConvertedDFA(nodes, edges);
      setContentView('editor');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Compilation failed.');
    }
  };

  return (
    <div className="flex-1 bg-gray-950 text-gray-100 flex flex-col p-8 overflow-y-auto">
      {/* Top navigation */}
      <div className="flex items-center justify-between max-w-4xl mx-auto w-full mb-8">
        <button
          onClick={(): void => {
            returnToDashboard();
          }}
          className="px-3.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition flex items-center gap-2"
        >
          <span>←</span> Back to Dashboard
        </button>
        <button
          onClick={(): void => {
            setContentView('editor');
          }}
          className="px-3.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition flex items-center gap-2"
        >
          Go to Canvas <span>→</span>
        </button>
      </div>

      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Title */}
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-xl shadow-lg shadow-purple-900/30">
              ⚡
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Regular Expression → NFA
              </h1>
              <p className="text-sm text-gray-400">
                Thompson&apos;s Construction Compiler with inductive composition
              </p>
            </div>
          </div>
        </div>

        {/* Input box */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
          <label
            htmlFor="regex-input"
            className="block text-xs font-semibold uppercase tracking-wider text-gray-400"
          >
            Regular Expression
          </label>
          <div className="relative">
            <input
              id="regex-input"
              type="text"
              value={regexInput}
              onChange={(e): void => {
                setRegexInput(e.target.value);
              }}
              placeholder="(a+b)*abb"
              className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 font-mono text-lg text-emerald-400 placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </div>

          {/* Validation Status */}
          {error ? (
            <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <span>✕</span> {error}
            </div>
          ) : (
            <div className="p-3 bg-emerald-950/30 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <span>✓</span> Valid regular expression syntax. Ready to compile.
            </div>
          )}

          {/* Presets */}
          <div className="space-y-2 pt-2">
            <div className="text-xs text-gray-400 font-medium">
              Quick Presets:
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={(): void => {
                    setRegexInput(p.regex);
                  }}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs font-mono text-gray-200 transition"
                  title={p.desc}
                >
                  <span className="font-semibold text-purple-300">
                    {p.label}:
                  </span>{' '}
                  {p.regex}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cheat sheet */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-3 text-xs space-y-1">
            <div className="font-semibold text-purple-400">Union / Alternation</div>
            <div className="font-mono text-gray-300">a+b or a|b</div>
            <p className="text-gray-500 text-[11px]">Matches a or b</p>
          </div>
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-3 text-xs space-y-1">
            <div className="font-semibold text-purple-400">Kleene Star</div>
            <div className="font-mono text-gray-300">a* or (a+b)*</div>
            <p className="text-gray-500 text-[11px]">Zero or more repetitions</p>
          </div>
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-3 text-xs space-y-1">
            <div className="font-semibold text-purple-400">Concatenation</div>
            <div className="font-mono text-gray-300">ab or a.b</div>
            <p className="text-gray-500 text-[11px]">a followed by b</p>
          </div>
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-3 text-xs space-y-1">
            <div className="font-semibold text-purple-400">Epsilon (Empty)</div>
            <div className="font-mono text-gray-300">ε or λ</div>
            <p className="text-gray-500 text-[11px]">Empty string transition</p>
          </div>
        </div>

        {/* Generate button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleGenerate}
            disabled={!ast}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition shadow-lg shadow-purple-900/30 flex items-center gap-2 cursor-pointer"
          >
            <span>✨</span> Generate NFA & Open in Canvas
          </button>
        </div>
      </div>
    </div>
  );
};
