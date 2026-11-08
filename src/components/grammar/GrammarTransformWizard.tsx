import { useState, useMemo, type ReactElement } from 'react';
import { Grammar } from '../../core/grammar/Grammar';
import {
  removeLambdaProductions,
  removeUnitProductions,
  removeUselessProductions,
  convertToCNF,
} from '../../core/grammar/GrammarTransformations';
import type { GrammarData } from '../../types/grammar';

interface GrammarTransformWizardProps {
  isOpen: boolean;
  initialGrammar: GrammarData;
  onApply: (grammar: GrammarData) => void;
  onClose: () => void;
}

type Stage = 'lambda' | 'unit' | 'useless' | 'cnf';

export function GrammarTransformWizard({
  isOpen,
  initialGrammar,
  onApply,
  onClose,
}: GrammarTransformWizardProps): ReactElement | null {
  const [currentStage, setCurrentStage] = useState<Stage>('lambda');

  const g1 = useMemo(() => removeLambdaProductions(initialGrammar), [initialGrammar]);
  const g2 = useMemo(() => removeUnitProductions(g1), [g1]);
  const g3 = useMemo(() => removeUselessProductions(g2), [g2]);
  const g4 = useMemo(() => convertToCNF(initialGrammar), [initialGrammar]);

  if (!isOpen) return null;

  const stageData = {
    lambda: {
      title: '1. Eliminate λ (Epsilon) Productions',
      desc: 'Find all nullable variables (variables that can derive ε) and expand combinations without ε.',
      grammar: g1,
    },
    unit: {
      title: '2. Eliminate Unit Productions (A → B)',
      desc: 'Compute unit closures U(A) and replace chain rules with direct non-unit productions.',
      grammar: g2,
    },
    useless: {
      title: '3. Eliminate Useless Symbols',
      desc: 'Remove non-generating variables (cannot derive terminals) and unreachable variables (unreachable from start).',
      grammar: g3,
    },
    cnf: {
      title: '4. Chomsky Normal Form (CNF)',
      desc: 'Decompose long rules into binary cascades (A → BC) and isolate terminals (A → a).',
      grammar: g4,
    },
  }[currentStage];

  const formattedResult = new Grammar(stageData.grammar).toString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden text-gray-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/90">
          <div>
            <h2 className="text-base font-semibold text-white">
              CFG Simplification & CNF Transformation Wizard
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Step-by-step 4-stage pipeline for Context-Free Grammars
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white rounded-md p-1 transition-colors hover:bg-gray-800 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Stage Tabs */}
        <div className="grid grid-cols-4 border-b border-gray-800 bg-gray-950/60 text-xs text-center font-medium">
          {(['lambda', 'unit', 'useless', 'cnf'] as const).map((stage) => {
            const labels = {
              lambda: '1. Remove λ',
              unit: '2. Remove Unit',
              useless: '3. Remove Useless',
              cnf: '4. CNF Conversion',
            };
            const isActive = currentStage === stage;
            return (
              <button
                key={stage}
                onClick={() => { setCurrentStage(stage); }}
                className={`py-2.5 px-2 transition-colors cursor-pointer border-b-2 ${
                  isActive
                    ? 'border-indigo-500 text-indigo-300 bg-indigo-950/20'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-900'
                }`}
              >
                {labels[stage]}
              </button>
            );
          })}
        </div>

        {/* Stage Content */}
        <div className="p-5 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
          <div>
            <h3 className="text-sm font-semibold text-indigo-300">{stageData.title}</h3>
            <p className="text-xs text-gray-400 mt-1">{stageData.desc}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex flex-col gap-1.5">
              <span className="font-semibold text-gray-400">Original Grammar:</span>
              <pre className="p-3 bg-gray-950 border border-gray-800 rounded-lg font-mono text-gray-300 min-h-[140px] whitespace-pre-wrap">
                {new Grammar(initialGrammar).toString() || '(empty)'}
              </pre>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="font-semibold text-emerald-400">Transformed Grammar:</span>
              <pre className="p-3 bg-gray-950 border border-emerald-900/40 rounded-lg font-mono text-emerald-200 min-h-[140px] whitespace-pre-wrap">
                {formattedResult || '(no productions)'}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-800 bg-gray-900/80 flex items-center justify-between">
          <button
            onClick={() => { onApply(stageData.grammar); onClose(); }}
            className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors cursor-pointer shadow-sm"
          >
            Apply This Stage to Editor
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { onApply(g4); onClose(); }}
              className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors cursor-pointer shadow-sm"
            >
              Apply Full CNF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
