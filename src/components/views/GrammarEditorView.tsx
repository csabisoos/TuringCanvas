import { useState, useMemo, type ReactElement } from 'react';
import { useAutomataStore } from '../../store/useAutomataStore';
import { Grammar } from '../../core/grammar/Grammar';
import { GrammarTransformWizard } from '../grammar/GrammarTransformWizard';
import { CYKTableView } from '../grammar/CYKTableView';
import { LL1ParserView } from '../grammar/LL1ParserView';
import { LRParserView } from '../grammar/LRParserView';
import type { GrammarData } from '../../types/grammar';

const PRESETS: { label: string; rules: string; desc: string }[] = [
  {
    label: 'Balanced Parentheses',
    rules: `S -> ( S ) | S S | ε`,
    desc: 'Dyck language of matched pairs of parentheses',
  },
  {
    label: 'Palindromes over {a, b}',
    rules: `S -> a S a | b S b | a | b | ε`,
    desc: 'Context-free language of all palindromic strings',
  },
  {
    label: 'Equal a and b: {aⁿ bⁿ}',
    rules: `S -> a S b | ε`,
    desc: 'Classic non-regular context-free language',
  },
  {
    label: 'Arithmetic Expressions',
    rules: `E -> T E_
E_ -> + T E_ | ε
T -> F T_
T_ -> * F T_ | ε
F -> ( E ) | id`,
    desc: 'Unambiguous LL(1) grammar for arithmetic expressions',
  },
  {
    label: 'Simple SLR(1) Grammar',
    rules: `S -> a S b | c`,
    desc: 'Canonical grammar for testing shift-reduce parsing',
  },
];

type Tab = 'editor' | 'cyk' | 'll1' | 'lr';

export function GrammarEditorView(): ReactElement {
  const returnToDashboard = useAutomataStore((s) => s.returnToDashboard);

  const [rulesText, setRulesText] = useState(PRESETS[0]?.rules ?? 'S -> a S b | ε');
  const [activeTab, setActiveTab] = useState<Tab>('editor');
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Parse grammar live
  const { grammar, parseError } = useMemo(() => {
    try {
      const g = Grammar.fromString(rulesText, 'S');
      return { grammar: g, parseError: null };
    } catch (err: unknown) {
      return {
        grammar: null,
        parseError: err instanceof Error ? err.message : 'Syntax error in grammar rules.',
      };
    }
  }, [rulesText]);

  const grammarData: GrammarData = useMemo(() => {
    return (
      grammar?.getData() ?? {
        variables: new Set(['S']),
        terminals: new Set(),
        startVariable: 'S',
        productions: [],
      }
    );
  }, [grammar]);

  const chomskyType = useMemo(() => {
    if (!grammar) return null;
    return grammar.classifyChomsky();
  }, [grammar]);

  const chomskyBadge = {
    3: { label: 'Type 3: Regular Grammar', color: 'bg-emerald-950 text-emerald-300 border-emerald-700' },
    2: { label: 'Type 2: Context-Free Grammar (CFG)', color: 'bg-indigo-950 text-indigo-300 border-indigo-700' },
    1: { label: 'Type 1: Context-Sensitive Grammar', color: 'bg-amber-950 text-amber-300 border-amber-700' },
    0: { label: 'Type 0: Unrestricted Grammar', color: 'bg-red-950 text-red-300 border-red-700' },
  }[chomskyType ?? 2];

  function handleApplyTransformed(newGrammar: GrammarData): void {
    setRulesText(new Grammar(newGrammar).toString());
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-950 text-gray-100 overflow-hidden">
      {/* Header bar */}
      <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { returnToDashboard(); }}
            className="px-2.5 py-1 text-xs rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors cursor-pointer"
          >
            ← Back to Dashboard
          </button>
          <div>
            <h1 className="text-base font-bold text-white">Context-Free Grammar (CFG) Suite</h1>
            <p className="text-xs text-gray-400">
              Grammar editor, simplification, CYK parsing, and LL(1)/SLR(1) analysis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${chomskyBadge.color}`}>
            {chomskyBadge.label}
          </span>
          <button
            onClick={() => { setIsWizardOpen(true); }}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors cursor-pointer shadow-sm"
          >
            Simplify & CNF Wizard
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-gray-800 bg-gray-900/40 px-6 text-xs font-medium gap-1 shrink-0">
        {[
          { key: 'editor', label: 'Rules Editor' },
          { key: 'cyk', label: 'CYK Dynamic Table' },
          { key: 'll1', label: 'LL(1) Parser' },
          { key: 'lr', label: 'SLR(1) / LR Parser' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => { setActiveTab(t.key as Tab); }}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer ${
              activeTab === t.key
                ? 'border-indigo-500 text-indigo-300 font-semibold bg-indigo-950/20'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-850'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main content body */}
      <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto w-full">
        {activeTab === 'editor' && (
          <div className="flex flex-col gap-5">
            {/* Presets dropdown */}
            <div className="flex items-center gap-3 p-3 bg-gray-900 border border-gray-800 rounded-lg">
              <span className="text-xs text-gray-400 font-medium">Load Preset:</span>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => { setRulesText(p.rules); }}
                    className="px-2.5 py-1 text-xs rounded bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 hover:border-gray-500 transition-colors cursor-pointer"
                    title={p.desc}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rules Textarea */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Production Rules (one per line, e.g. &apos;S -&gt; a S b | ε&apos;):
                </span>
                <span className="text-xs font-mono text-gray-500">
                  {String(grammarData.productions.length)} productions, {String(grammarData.variables.size)} variables, {String(grammarData.terminals.size)} terminals
                </span>
              </div>
              <textarea
                value={rulesText}
                onChange={(e) => { setRulesText(e.target.value); }}
                rows={10}
                className="w-full p-4 bg-gray-900 border border-gray-800 rounded-xl font-mono text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                placeholder="S -> a S b | ε&#10;A -> c A | d"
              />
              {parseError && (
                <div className="text-xs text-red-400 bg-red-950/40 p-2.5 rounded-lg border border-red-800">
                  ⚠ {parseError}
                </div>
              )}
            </div>

            {/* Grammar Summary */}
            <div className="grid grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-3 bg-gray-900 border border-gray-800 rounded-lg">
                <span className="text-gray-500 block mb-1">Start Variable:</span>
                <span className="text-base font-bold text-indigo-400">
                  {grammarData.startVariable}
                </span>
              </div>
              <div className="p-3 bg-gray-900 border border-gray-800 rounded-lg">
                <span className="text-gray-500 block mb-1">Variables (V):</span>
                <span className="text-gray-200">
                  &#123;{Array.from(grammarData.variables).join(', ')}&#125;
                </span>
              </div>
              <div className="p-3 bg-gray-900 border border-gray-800 rounded-lg">
                <span className="text-gray-500 block mb-1">Terminals (Σ):</span>
                <span className="text-gray-200">
                  &#123;{Array.from(grammarData.terminals).join(', ')}&#125;
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cyk' && <CYKTableView grammar={grammarData} />}
        {activeTab === 'll1' && <LL1ParserView grammar={grammarData} />}
        {activeTab === 'lr' && <LRParserView grammar={grammarData} />}
      </div>

      {/* Simplification & CNF Wizard */}
      <GrammarTransformWizard
        isOpen={isWizardOpen}
        initialGrammar={grammarData}
        onApply={handleApplyTransformed}
        onClose={() => { setIsWizardOpen(false); }}
      />
    </div>
  );
}
