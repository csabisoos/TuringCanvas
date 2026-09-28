import { useState, type ReactElement } from 'react';
import { useAutomataStore } from '../../store/useAutomataStore';
// ── Component ─────────────────────────────────────────────────────────────────

export function Sidebar(): ReactElement {
  const editorMode = useAutomataStore((s) => s.editorMode);

  return (
    <aside
      className="w-56 shrink-0 flex flex-col border-r border-gray-800 bg-gray-900 overflow-y-auto"
      aria-label="Editor panel"
    >
      {editorMode === 'edit' ? <EditPanel /> : <SimulatePanel />}
    </aside>
  );
}

// ── Edit panel ────────────────────────────────────────────────────────────────

function EditPanel(): ReactElement {
  const nodes      = useAutomataStore((s) => s.nodes);
  const addNode    = useAutomataStore((s) => s.addNode);
  const clearStore = useAutomataStore((s) => s.clearStore);
  const markInitial   = useAutomataStore((s) => s.markInitial);
  const markAccepting = useAutomataStore((s) => s.markAccepting);
  const deleteSelected = useAutomataStore((s) => s.deleteSelected);
  const addTransition  = useAutomataStore((s) => s.addTransition);

  // Selection is kept in sync with React Flow via useOnSelectionChange in AutomataCanvas.
  const selectedNodeIds = useAutomataStore((s) => s.selectedNodeIds);
  const selectedEdgeIds = useAutomataStore((s) => s.selectedEdgeIds);

  const hasSelection      = selectedNodeIds.length > 0 || selectedEdgeIds.length > 0;
  const singleSelectedNodeId = selectedNodeIds.length === 1 ? selectedNodeIds[0] : null;
  /** True only when exactly 2 nodes are selected — enables the sidebar shortcut. */
  const canAddTransition  = selectedNodeIds.length === 2;

  const isEmpty = nodes.length === 0;

  const [showHint, setShowHint] = useState(false);

  function handleAddTransition(): void {
    if (canAddTransition) {
      // Fast path: two nodes already selected — create a ε transition between them.
      addTransition(selectedNodeIds[0]!, selectedNodeIds[1]!);
    } else {
      // Fallback hint: guide the user to drag-connect handles.
      setShowHint(true);
      setTimeout(() => setShowHint(false), 4000);
    }
  }

  function handleAddState(): void {
    const count = nodes.length;
    // Stagger nodes in a row so each new one is visible immediately.
    // Offset wraps every 5 nodes to start a second row.
    const col = count % 5;
    const row = Math.floor(count / 5);
    addNode({
      id: crypto.randomUUID(),
      label: `q${String(count)}`,
      isInitial: count === 0,   // first node auto-marked initial
      isAccepting: false,
      position: { x: 80 + col * 160, y: 120 + row * 160 },
    });
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      <SectionLabel>Graph</SectionLabel>

      {/* Add State — always enabled in edit mode */}
      <SidebarButton id="sidebar-add-state-btn" icon={<CircleIcon />} aria-label="Add State" onClick={handleAddState}>
        Add State
      </SidebarButton>

      {/* Add Transition — enabled immediately when exactly 2 nodes are selected;
          falls back to a drag-handle hint when fewer/more nodes are selected. */}
      <SidebarButton
        id="sidebar-add-transition-btn"
        icon={<ArrowIcon />}
        aria-label="Add Transition"
        onClick={handleAddTransition}
        active={canAddTransition}
      >
        Add Transition
      </SidebarButton>
      {showHint && (
        <p className="text-[10px] text-indigo-400 px-1 leading-relaxed">
          Select <strong>exactly 2 states</strong> to connect them, or drag
          from the <strong>▶</strong> handle on any state.
        </p>
      )}
      {canAddTransition && (
        <p className="text-[10px] text-emerald-400 px-1 leading-relaxed">
          Click <strong>Add Transition</strong> to connect the 2 selected states.
        </p>
      )}

      <div className="my-1 border-t border-gray-800" />

      <SectionLabel>Selection</SectionLabel>
      <SidebarButton id="sidebar-mark-initial-btn" icon={<StarIcon />} aria-label="Mark selected state as initial" onClick={() => { if (singleSelectedNodeId) markInitial(singleSelectedNodeId); }} disabled={!singleSelectedNodeId}>
        Mark Initial
      </SidebarButton>
      <SidebarButton id="sidebar-mark-accepting-btn" icon={<CheckCircleIcon />} aria-label="Mark selected state as accepting" onClick={() => { if (singleSelectedNodeId) markAccepting(singleSelectedNodeId); }} disabled={!singleSelectedNodeId}>
        Mark Accepting
      </SidebarButton>
      <SidebarButton
        id="sidebar-delete-selected-btn"
        icon={<TrashIcon />}
        aria-label="Delete selected elements"
        onClick={() => deleteSelected(selectedNodeIds, selectedEdgeIds)}
        disabled={!hasSelection}
        danger
      >
        Delete Selected
      </SidebarButton>

      <div className="my-1 border-t border-gray-800" />

      <SectionLabel>Canvas</SectionLabel>
      <SidebarButton id="sidebar-clear-btn" icon={<TrashIcon />} aria-label="Clear all states and transitions" onClick={clearStore} disabled={isEmpty} danger>
        Clear All
      </SidebarButton>
    </div>
  );
}

// ── Simulate panel ────────────────────────────────────────────────────────────

function SimulatePanel(): ReactElement {
  const [testInput, setTestInput] = useState('');

  const startSimulation  = useAutomataStore((s) => s.startSimulation);
  const stepForward      = useAutomataStore((s) => s.stepForward);
  const resetSimulation  = useAutomataStore((s) => s.resetSimulation);
  const currentStepIndex = useAutomataStore((s) => s.currentStepIndex);
  const simulationSteps  = useAutomataStore((s) => s.simulationSteps);
  const simulationError  = useAutomataStore((s) => s.simulationError);
  const simulationAccepted = useAutomataStore((s) => s.simulationAccepted);
  // Disable simulation controls when no automaton has been drawn yet
  const hasNodes = useAutomataStore((s) => s.nodes.length > 0);

  const isRunning = currentStepIndex >= 0;
  const isFinished = simulationAccepted !== null;
  const canStep = isRunning && !isFinished;
  const stepLabel = `${String(Math.max(0, currentStepIndex))} / ${String(Math.max(0, simulationSteps.length - 1))}`;

  function handleStart(): void {
    startSimulation(testInput);
  }

  function handleReset(): void {
    resetSimulation();
    setTestInput('');
  }

  // Start is disabled: no nodes exist, or simulation is already running
  const startDisabled = !hasNodes || isRunning;
  // Reset is enabled once a simulation has been initiated (running or errored)
  const resetDisabled = !isRunning && !simulationError;

  return (
    <div className="flex flex-col gap-3 p-3">
      <SectionLabel>Test String</SectionLabel>

      <div className="flex flex-col gap-1.5">
        <input
          id="simulate-input"
          type="text"
          value={testInput}
          onChange={(e) => { setTestInput(e.target.value); }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleStart(); }}
          disabled={isRunning || !hasNodes}
          placeholder="e.g. aabb"
          aria-label="Input string to simulate"
          aria-describedby={isRunning ? 'simulate-step-counter' : undefined}
          className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono disabled:opacity-40 disabled:cursor-not-allowed"
        />
        {isRunning && (
          <p id="simulate-step-counter" className="text-[10px] text-gray-500 px-1 font-mono">
            Step {stepLabel}
          </p>
        )}
      </div>

      <div className="my-1 border-t border-gray-800" />

      <SectionLabel>Controls</SectionLabel>

      <SidebarButton
        id="simulate-start-btn"
        icon={<PlayIcon />}
        aria-label="Start simulation"
        onClick={handleStart}
        disabled={startDisabled}
      >
        Start
      </SidebarButton>
      <SidebarButton
        id="simulate-step-btn"
        icon={<StepIcon />}
        aria-label="Step forward one symbol"
        onClick={stepForward}
        disabled={!canStep}
      >
        Step
      </SidebarButton>
      <SidebarButton
        id="simulate-reset-btn"
        icon={<ResetIcon />}
        aria-label="Reset simulation"
        onClick={handleReset}
        disabled={resetDisabled}
      >
        Reset
      </SidebarButton>

      <div className="my-1 border-t border-gray-800" />

      {/* Result badge — aria-live so screen readers announce state changes */}
      <div role="status" aria-live="polite" aria-atomic="true">
        {simulationError ? (
          <div className="rounded-md bg-red-950 border border-red-800 px-3 py-2 text-xs text-red-300 text-center select-none leading-snug">
            ⚠ {simulationError}
          </div>
        ) : simulationAccepted === true ? (
          <div className="rounded-md bg-emerald-950 border border-emerald-700 px-3 py-2 text-xs text-emerald-300 text-center select-none font-semibold">
            ✓ Accepted
          </div>
        ) : simulationAccepted === false ? (
          <div className="rounded-md bg-red-950 border border-red-800 px-3 py-2 text-xs text-red-300 text-center select-none font-semibold">
            ✗ Rejected
          </div>
        ) : (
          <div className="rounded-md bg-gray-800 border border-gray-700 px-3 py-2 text-xs text-gray-500 text-center select-none">
            {isRunning ? 'Stepping through…' : 'Press Start to run'}
          </div>
        )}
      </div>
    </div>
  );
}


// ── Shared sub-components ─────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }): ReactElement {
  return (
    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 px-1">
      {children}
    </span>
  );
}

interface SidebarButtonProps {
  id: string;
  icon: ReactElement;
  children: string;
  'aria-label': string;
  disabled?: boolean;
  danger?: boolean;
  /** Highlight the button in an "active/ready" state (emerald accent). */
  active?: boolean;
  onClick?: () => void;
}

function SidebarButton({
  id,
  icon,
  children,
  'aria-label': ariaLabel,
  disabled = false,
  danger = false,
  active = false,
  onClick,
}: SidebarButtonProps): ReactElement {
  const base =
    'flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors duration-100 select-none text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-900';

  // Priority: danger > active > normal.
  let variantCls: string;
  if (danger) {
    variantCls = disabled
      ? 'text-red-900 cursor-not-allowed opacity-50'
      : 'text-red-400 hover:bg-red-950 hover:text-red-300 cursor-pointer';
  } else if (active && !disabled) {
    variantCls = 'text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 cursor-pointer';
  } else {
    variantCls = disabled
      ? 'text-gray-600 cursor-not-allowed opacity-50'
      : 'text-gray-300 hover:bg-gray-800 hover:text-white cursor-pointer';
  }

  return (
    <button
      id={id}
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`${base} ${variantCls}`}
    >
      <span className="shrink-0 opacity-70" aria-hidden="true">{icon}</span>
      {children}
    </button>
  );
}


// ── Icons ─────────────────────────────────────────────────────────────────────

function CircleIcon(): ReactElement {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

function ArrowIcon(): ReactElement {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function StarIcon(): ReactElement {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function CheckCircleIcon(): ReactElement {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function TrashIcon(): ReactElement {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

function PlayIcon(): ReactElement {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function StepIcon(): ReactElement {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="13 17 18 12 13 7" />
      <polyline points="6 17 11 12 6 7" />
    </svg>
  );
}

function ResetIcon(): ReactElement {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-4.95" />
    </svg>
  );
}
