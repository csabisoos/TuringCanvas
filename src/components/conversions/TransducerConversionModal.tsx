import { useState, useMemo, type ReactElement } from 'react';
import { useAutomataStore } from '../../store/useAutomataStore';
import { buildMealyFromCanvas, buildMooreFromCanvas } from '../../store/transducerAdapter';
import { mealyToMoore, mooreToMealy } from '../../core/conversions/transducerConversions';
import type { AutomataEdge, AutomataNode } from '../../types/ui';

interface TransducerConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ConversionSuccess {
  direction: 'Mealy → Moore' | 'Moore → Mealy';
  sourceStats: string;
  targetStats: string;
  newNodes: AutomataNode[];
  newEdges: AutomataEdge[];
  targetMachineType: 'mealy' | 'moore';
}

interface ConversionError {
  error: string;
}

type ConversionResult = ConversionSuccess | ConversionError;

export function TransducerConversionModal({ isOpen, onClose }: TransducerConversionModalProps): ReactElement | null {
  const machineType = useAutomataStore((s) => s.machineType);
  const nodes = useAutomataStore((s) => s.nodes);
  const edges = useAutomataStore((s) => s.edges);
  const applyConvertedDFA = useAutomataStore((s) => s.applyConvertedDFA);
  const openEditor = useAutomataStore((s) => s.openEditor);

  const [applied, setApplied] = useState(false);

  const conversion = useMemo<ConversionResult | null>(() => {
    if (!isOpen) return null;

    if (machineType === 'mealy') {
      const built = buildMealyFromCanvas(nodes, edges);
      if (built.error || !built.mealy) {
        return { error: built.error ?? 'Invalid Mealy Machine.' };
      }
      const mooreData = mealyToMoore(built.mealy.getData());

      // Convert mooreData back to AutomataNode[] and AutomataEdge[]
      const newNodes: AutomataNode[] = [];
      const stateList = Array.from(mooreData.states.values());
      const radius = 180;
      const angleStep = (2 * Math.PI) / Math.max(1, stateList.length);

      stateList.forEach((st, idx) => {
        const angle = idx * angleStep;
        newNodes.push({
          id: st.id,
          label: st.name,
          position: {
            x: 350 + Math.round(radius * Math.cos(angle)),
            y: 250 + Math.round(radius * Math.sin(angle)),
          },
          isInitial: st.isInitial,
          isAccepting: st.isAccepting,
          mooreOutput: st.outputSymbol,
        });
      });

      // Group transitions between pairs of states
      const edgeMap = new Map<string, string[]>();
      for (const t of mooreData.transitions) {
        const key = `${t.fromStateId}->${t.toStateId}`;
        const existing = edgeMap.get(key) ?? [];
        if (!existing.includes(t.inputSymbol)) {
          existing.push(t.inputSymbol);
        }
        edgeMap.set(key, existing);
      }

      const newEdges: AutomataEdge[] = [];
      let eIdx = 1;
      for (const [key, symbols] of edgeMap) {
        const [source, target] = key.split('->');
        if (source && target) {
          newEdges.push({
            id: `e_conv_${String(eIdx++)}`,
            source,
            target,
            symbols,
          });
        }
      }

      return {
        direction: 'Mealy → Moore',
        sourceStats: `${String(nodes.length)} states, ${String(edges.length)} edges`,
        targetStats: `${String(newNodes.length)} states (state-splitting applied), ${String(newEdges.length)} edges`,
        newNodes,
        newEdges,
        targetMachineType: 'moore',
      };
    } else {
      // Moore -> Mealy
      const built = buildMooreFromCanvas(nodes, edges);
      if (built.error || !built.moore) {
        return { error: built.error ?? 'Invalid Moore Machine.' };
      }
      const mealyData = mooreToMealy(built.moore.getData());

      const newNodes: AutomataNode[] = nodes.map((n) => ({
        id: n.id,
        label: n.label,
        position: { ...n.position },
        isInitial: n.isInitial,
        isAccepting: n.isAccepting,
      }));

      // Group Mealy transitions
      const edgeMap = new Map<string, string[]>();
      for (const t of mealyData.transitions) {
        const key = `${t.fromStateId}->${t.toStateId}`;
        const sym = `${t.inputSymbol} / ${t.outputSymbol}`;
        const existing = edgeMap.get(key) ?? [];
        if (!existing.includes(sym)) {
          existing.push(sym);
        }
        edgeMap.set(key, existing);
      }

      const newEdges: AutomataEdge[] = [];
      let eIdx = 1;
      for (const [key, symbols] of edgeMap) {
        const [source, target] = key.split('->');
        if (source && target) {
          newEdges.push({
            id: `e_conv_${String(eIdx++)}`,
            source,
            target,
            symbols,
          });
        }
      }

      return {
        direction: 'Moore → Mealy',
        sourceStats: `${String(nodes.length)} states, ${String(edges.length)} edges`,
        targetStats: `${String(newNodes.length)} states, ${String(newEdges.length)} edges`,
        newNodes,
        newEdges,
        targetMachineType: 'mealy',
      };
    }
  }, [isOpen, machineType, nodes, edges]);

  if (!isOpen) return null;

  function handleApply(): void {
    if (!conversion || 'error' in conversion) return;
    applyConvertedDFA(conversion.newNodes, conversion.newEdges);
    openEditor(conversion.targetMachineType);
    setApplied(true);
    setTimeout(() => {
      onClose();
      setApplied(false);
    }, 600);
  }

  const isError = conversion && 'error' in conversion;
  const isSuccess = conversion && !('error' in conversion);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-lg p-5 flex flex-col gap-4 text-gray-100">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <h2 className="text-lg font-bold text-purple-400">
            Transducer Conversion ({isSuccess ? conversion.direction : 'Mealy ↔ Moore'})
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-md text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {isError ? (
          <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-200 text-sm">
            {conversion.error}
          </div>
        ) : isSuccess ? (
          <div className="flex flex-col gap-3 text-sm">
            <p className="text-gray-300">
              Convert the current transducer graph to an equivalent machine with preserved input/output behavior.
            </p>

            <div className="bg-gray-950 p-3 rounded-lg border border-gray-800 flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Current machine:</span>
                <span className="font-semibold text-indigo-300">{conversion.sourceStats}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Converted machine:</span>
                <span className="font-semibold text-emerald-400">{conversion.targetStats}</span>
              </div>
            </div>

            {conversion.direction === 'Mealy → Moore' && (
              <p className="text-xs text-gray-400 italic">
                Note: States reached with multiple distinct outputs are split according to the standard state-splitting theorem.
              </p>
            )}
          </div>
        ) : null}

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 cursor-pointer"
          >
            Cancel
          </button>
          {isSuccess && (
            <button
              onClick={handleApply}
              disabled={applied}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors cursor-pointer"
            >
              {applied ? 'Applied!' : `Apply ${conversion.direction}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
