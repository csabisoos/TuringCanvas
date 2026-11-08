import { useState, useMemo, type ReactElement } from 'react';
import { useAutomataStore } from '../../store/useAutomataStore';
import { validateAutomaton } from '../../core/validation';

export function ValidationBadge(): ReactElement | null {
  const nodes = useAutomataStore((s) => s.nodes);
  const edges = useAutomataStore((s) => s.edges);
  const completeDFAWithTrap = useAutomataStore((s) => s.completeDFAWithTrap);

  const [isOpen, setIsOpen] = useState(false);

  const validation = useMemo(() => {
    if (nodes.length === 0) return null;
    return validateAutomaton(nodes, edges);
  }, [nodes, edges]);

  if (!validation) return null;

  const nodeMap = new Map(nodes.map((n) => [n.id, n.label || n.id]));

  let badgeColor = 'bg-emerald-950 text-emerald-300 border-emerald-700';
  let badgeText = 'DFA ✓';

  if (!validation.hasInitialState) {
    badgeColor = 'bg-red-950 text-red-300 border-red-800';
    badgeText = validation.initialStateCount === 0 ? 'No Start State' : 'Multiple Start States';
  } else if (validation.epsilonTransitionsCount > 0) {
    badgeColor = 'bg-purple-950 text-purple-300 border-purple-800';
    badgeText = `NFA (${validation.epsilonTransitionsCount.toString()} ε)`;
  } else if (validation.nonDeterministicTransitions.length > 0) {
    badgeColor = 'bg-amber-950 text-amber-300 border-amber-800';
    badgeText = 'NFA (Non-det)';
  } else if (validation.missingTransitions.length > 0) {
    badgeColor = 'bg-amber-950 text-amber-300 border-amber-800';
    badgeText = `DFA (${validation.missingTransitions.length.toString()} missing)`;
  }

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => { setIsOpen(!isOpen); }}
        className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${badgeColor}`}
        aria-label="View automaton determinism and completeness validation"
      >
        <span>{badgeText}</span>
        <span className="text-[10px] opacity-70">▼</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => { setIsOpen(false); }}
          />
          <div className="absolute right-0 mt-2 w-80 rounded-xl bg-gray-900 border border-gray-800 shadow-2xl p-4 z-50 text-xs text-gray-200">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-800 font-semibold text-gray-100">
              <span>Automaton Diagnostic</span>
              <button
                type="button"
                onClick={() => { setIsOpen(false); }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              <div>
                <span className="text-gray-400 font-medium">Type: </span>
                <span className="font-semibold text-indigo-300">
                  {validation.isDFA ? 'Deterministic Finite Automaton (DFA)' : 'Nondeterministic Finite Automaton (NFA)'}
                </span>
              </div>

              {!validation.hasInitialState && (
                <div className="p-2 rounded bg-red-950/60 border border-red-800 text-red-300">
                  ⚠ Must have exactly one initial state.
                </div>
              )}

              {validation.unreachableStateIds.length > 0 && (
                <div>
                  <span className="text-gray-400">Unreachable states ({validation.unreachableStateIds.length}): </span>
                  <div className="flex flex-wrap gap-1 mt-1 font-mono">
                    {validation.unreachableStateIds.map((id) => (
                      <span key={id} className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 text-[11px]">
                        {nodeMap.get(id) ?? id}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {validation.missingTransitions.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-400 font-medium">
                      Missing transitions ({validation.missingTransitions.length}):
                    </span>
                  </div>
                  <div className="p-2 rounded bg-gray-950 border border-gray-800 max-h-28 overflow-y-auto space-y-1 font-mono text-[11px]">
                    {validation.missingTransitions.map((m, idx) => (
                      <div key={idx} className="flex justify-between text-gray-400">
                        <span>{nodeMap.get(m.fromStateId) ?? m.fromStateId}</span>
                        <span className="text-indigo-400">on &apos;{m.symbol}&apos;</span>
                        <span className="text-red-400">→ missing</span>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      completeDFAWithTrap();
                      setIsOpen(false);
                    }}
                    className="w-full mt-2 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors cursor-pointer text-center"
                  >
                    Complete DFA with Trap State
                  </button>
                </div>
              )}

              {validation.nonDeterministicTransitions.length > 0 && (
                <div>
                  <span className="text-amber-400 font-medium">
                    Nondeterministic transitions ({validation.nonDeterministicTransitions.length}):
                  </span>
                  <div className="p-2 mt-1 rounded bg-gray-950 border border-gray-800 max-h-24 overflow-y-auto space-y-1 font-mono text-[11px]">
                    {validation.nonDeterministicTransitions.map((nd, idx) => (
                      <div key={idx} className="text-gray-300">
                        {nodeMap.get(nd.fromStateId) ?? nd.fromStateId} on &apos;{nd.symbol}&apos; →{' '}
                        {nd.targetStateIds.map((id) => nodeMap.get(id) ?? id).join(', ')}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {validation.isDFA && (
                <div className="p-2 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs text-center font-medium">
                  ✓ Valid complete DFA: exactly 1 transition per alphabet symbol on each state.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
