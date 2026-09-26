import { useState, type ReactElement } from 'react';
import { useAutomataStore } from '../../store/useAutomataStore';

// ── Component ─────────────────────────────────────────────────────────────────

export function Sidebar(): ReactElement {
  const editorMode = useAutomataStore((s) => s.editorMode);

  return (
    <aside className="w-56 shrink-0 flex flex-col border-r border-gray-800 bg-gray-900 overflow-y-auto">
      {editorMode === 'edit' ? <EditPanel /> : <SimulatePanel />}
    </aside>
  );
}

// ── Edit panel ────────────────────────────────────────────────────────────────

function EditPanel(): ReactElement {
  return (
    <div className="flex flex-col gap-2 p-3">
      <SectionLabel>Graph</SectionLabel>

      <SidebarButton id="sidebar-add-state-btn" icon={<CircleIcon />} disabled>
        Add State
      </SidebarButton>
      <SidebarButton id="sidebar-add-transition-btn" icon={<ArrowIcon />} disabled>
        Add Transition
      </SidebarButton>

      <div className="my-1 border-t border-gray-800" />

      <SectionLabel>Selection</SectionLabel>
      <SidebarButton id="sidebar-mark-initial-btn" icon={<StarIcon />} disabled>
        Mark Initial
      </SidebarButton>
      <SidebarButton id="sidebar-mark-accepting-btn" icon={<CheckCircleIcon />} disabled>
        Mark Accepting
      </SidebarButton>
      <SidebarButton id="sidebar-delete-selected-btn" icon={<TrashIcon />} disabled danger>
        Delete Selected
      </SidebarButton>

      <div className="my-1 border-t border-gray-800" />

      <SectionLabel>Canvas</SectionLabel>
      <SidebarButton id="sidebar-clear-btn" icon={<TrashIcon />} disabled danger>
        Clear All
      </SidebarButton>
    </div>
  );
}

// ── Simulate panel ────────────────────────────────────────────────────────────

function SimulatePanel(): ReactElement {
  const [testInput, setTestInput] = useState('');

  return (
    <div className="flex flex-col gap-3 p-3">
      <SectionLabel>Test String</SectionLabel>

      <div className="flex flex-col gap-1.5">
        <input
          id="simulate-input"
          type="text"
          value={testInput}
          onChange={(e) => setTestInput(e.target.value)}
          placeholder="e.g. aabb"
          aria-label="Input string to simulate"
          className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
        />
      </div>

      <div className="my-1 border-t border-gray-800" />

      <SectionLabel>Controls</SectionLabel>

      <SidebarButton id="simulate-start-btn" icon={<PlayIcon />} disabled>
        Start
      </SidebarButton>
      <SidebarButton id="simulate-step-btn" icon={<StepIcon />} disabled>
        Step
      </SidebarButton>
      <SidebarButton id="simulate-reset-btn" icon={<ResetIcon />} disabled>
        Reset
      </SidebarButton>

      <div className="my-1 border-t border-gray-800" />

      {/* Status placeholder */}
      <div className="rounded-md bg-gray-800 border border-gray-700 px-3 py-2 text-xs text-gray-500 text-center select-none">
        Result will appear here
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
  disabled?: boolean;
  danger?: boolean;
}

function SidebarButton({
  id,
  icon,
  children,
  disabled = false,
  danger = false,
}: SidebarButtonProps): ReactElement {
  const base =
    'flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors duration-100 select-none text-left';
  const normal = disabled
    ? 'text-gray-600 cursor-not-allowed'
    : 'text-gray-300 hover:bg-gray-800 hover:text-white cursor-pointer';
  const dangerCls = danger
    ? disabled
      ? 'text-red-900 cursor-not-allowed'
      : 'text-red-400 hover:bg-red-950 hover:text-red-300'
    : '';

  return (
    <button
      id={id}
      type="button"
      disabled={disabled}
      className={[base, danger ? dangerCls : normal].join(' ')}
    >
      <span className="shrink-0 opacity-70">{icon}</span>
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
