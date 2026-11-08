import { useState, useMemo, type ReactElement } from 'react';
import { cfgToTopDownPDA } from '../../core/conversions/cfgToPda';
import { pdaToCFG } from '../../core/conversions/pdaToCfg';
import type { GrammarData } from '../../types/grammar';
import type { PDAData } from '../../types/pda';

interface CfgPdaConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGrammar?: GrammarData;
  currentPda?: PDAData;
}

const SAMPLE_GRAMMAR: GrammarData = {
  variables: new Set(['S']),
  terminals: new Set(['a', 'b']),
  startVariable: 'S',
  productions: [
    { id: '1', lhs: 'S', rhs: ['a', 'S', 'b'] },
    { id: '2', lhs: 'S', rhs: ['ε'] },
  ],
};

const SAMPLE_PDA: PDAData = {
  states: new Map([
    ['q0', { id: 'q0', name: 'q0', isInitial: true, isAccepting: false }],
    ['q1', { id: 'q1', name: 'q1', isInitial: false, isAccepting: true }],
  ]),
  inputAlphabet: new Set(['a', 'b']),
  stackAlphabet: new Set(['Z', 'A']),
  initialStackSymbol: 'Z',
  acceptanceCriteria: 'finalState',
  transitions: [
    { fromStateId: 'q0', toStateId: 'q0', inputSymbol: 'a', popSymbol: 'Z', pushSymbols: ['A', 'Z'] },
    { fromStateId: 'q0', toStateId: 'q1', inputSymbol: 'b', popSymbol: 'A', pushSymbols: [] },
  ],
};

export function CfgPdaConversionModal({
  isOpen,
  onClose,
  currentGrammar,
  currentPda,
}: CfgPdaConversionModalProps): ReactElement | null {
  const [activeTab, setActiveTab] = useState<'cfg-to-pda' | 'pda-to-cfg'>('cfg-to-pda');

  const grammar = currentGrammar ?? SAMPLE_GRAMMAR;
  const pda = currentPda ?? SAMPLE_PDA;

  // CFG -> PDA conversion result
  const convertedPda = useMemo(() => {
    return cfgToTopDownPDA(grammar);
  }, [grammar]);

  // PDA -> CFG conversion result
  const convertedCfg = useMemo(() => {
    return pdaToCFG(pda);
  }, [pda]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden text-gray-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-950/60">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>CFG ↔ PDA Equivalence Conversions</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-900/50 text-indigo-400 border border-indigo-700 font-normal">
                Chomsky-Schützenberger
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              Transform between Context-Free Grammars and Pushdown Automata
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white px-2 py-1 text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-gray-800 bg-gray-950/40 px-6 gap-4 text-xs font-semibold">
          <button
            onClick={() => { setActiveTab('cfg-to-pda'); }}
            className={`py-3 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'cfg-to-pda'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            CFG → Top-Down PDA (LL Parser)
          </button>
          <button
            onClick={() => { setActiveTab('pda-to-cfg'); }}
            className={`py-3 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'pda-to-cfg'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            PDA → CFG (Triples Construction)
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {activeTab === 'cfg-to-pda' ? (
            <div className="flex flex-col gap-4">
              <div className="p-4 bg-gray-950 rounded-xl border border-gray-800">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">
                  Source Grammar Productions
                </span>
                <div className="flex flex-wrap gap-2 font-mono text-xs text-indigo-300">
                  {grammar.productions.map((p) => (
                    <span key={p.id} className="px-2 py-1 bg-gray-900 rounded border border-gray-800">
                      {p.lhs} → {p.rhs.join(' ')}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-gray-950 rounded-xl border border-gray-800 flex flex-col gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Generated Top-Down PDA Transitions (3 States: q0, q1, q2)
                </span>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-gray-800 text-gray-500 text-[11px]">
                        <th className="pb-2">From State</th>
                        <th className="pb-2">Input</th>
                        <th className="pb-2">Pop Stack</th>
                        <th className="pb-2">Push Stack</th>
                        <th className="pb-2">To State</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
                      {convertedPda.data.transitions.map((t, idx) => (
                        <tr key={idx} className="hover:bg-gray-900/50">
                          <td className="py-1.5 text-indigo-300">{t.fromStateId}</td>
                          <td className="py-1.5 text-emerald-400">{t.inputSymbol || 'ε'}</td>
                          <td className="py-1.5 text-amber-300">{t.popSymbol || 'ε'}</td>
                          <td className="py-1.5 text-purple-300">
                            {t.pushSymbols.length > 0 ? t.pushSymbols.join(' ') : 'ε'}
                          </td>
                          <td className="py-1.5 text-indigo-300">{t.toStateId}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="p-4 bg-gray-950 rounded-xl border border-gray-800 flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Generated Grammar Start Variable
                </span>
                <span className="font-mono text-sm font-bold text-indigo-400">
                  {convertedCfg.startVariable}
                </span>
              </div>

              <div className="p-4 bg-gray-950 rounded-xl border border-gray-800 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Generated Productions ({convertedCfg.productions.length})
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto flex flex-col gap-1.5 font-mono text-xs">
                  {convertedCfg.productions.map((p) => (
                    <div
                      key={p.id}
                      className="px-2.5 py-1 bg-gray-900 rounded border border-gray-800 flex items-center gap-2"
                    >
                      <span className="text-amber-400 font-bold">{p.lhs}</span>
                      <span className="text-gray-500">→</span>
                      <span className="text-indigo-300">{p.rhs.join(' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-800 flex justify-end bg-gray-950/60">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-medium cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
