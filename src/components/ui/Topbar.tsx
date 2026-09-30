import type { ReactElement } from 'react';
import { useAutomataStore } from '../../store/useAutomataStore';

// ── Component ─────────────────────────────────────────────────────────────────

export function Topbar(): ReactElement {
  const editorMode = useAutomataStore((s) => s.editorMode);
  const setEditorMode = useAutomataStore((s) => s.setEditorMode);
  const returnToMenu = useAutomataStore((s) => s.returnToMenu);
  const nodes = useAutomataStore((s) => s.nodes);
  const edges = useAutomataStore((s) => s.edges);

  const handleHomeClick = (): void => {
    const hasChanges = nodes.length > 0 || edges.length > 0;
    if (hasChanges && !window.confirm('You have unsaved changes. Return to Main Menu anyway?')) {
      return;
    }
    returnToMenu(false); // keep workspace for potential return
  };

  return (
    <header className="flex-none h-14 border-b border-gray-800 bg-gray-900 flex items-center px-4 gap-4 shadow-lg z-10">
      {/* Brand */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center font-bold text-white text-xs select-none shrink-0"
          role="img"
          aria-label="TuringCanvas logo"
        >
          TC
        </div>
        <span className="text-base font-semibold tracking-tight text-white truncate">
          TuringCanvas
        </span>
        <span className="px-1.5 py-0.5 rounded-full bg-indigo-950 text-indigo-400 text-[10px] font-medium border border-indigo-800 shrink-0" aria-label="alpha release">
          alpha
        </span>
      </div>

      {/* Home / Menu button */}
      <button
        type="button"
        onClick={handleHomeClick}
        aria-label="Back to Main Menu"
        className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-900"
      >
        <HomeIcon />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Mode toggle */}
      <div
        role="group"
        aria-label="Editor mode"
        className="flex items-center bg-gray-800 rounded-lg p-1 gap-1"
      >
        <ModeButton
          id="mode-edit-btn"
          label="Edit"
          ariaLabel="Switch to Edit Mode"
          icon={<PencilIcon />}
          active={editorMode === 'edit'}
          onClick={() => { setEditorMode('edit'); }}
        />
        <ModeButton
          id="mode-simulate-btn"
          label="Simulate"
          ariaLabel="Switch to Simulate Mode"
          icon={<PlayIcon />}
          active={editorMode === 'simulate'}
          onClick={() => { setEditorMode('simulate'); }}
        />
      </div>
    </header>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface ModeButtonProps {
  id: string;
  label: string;
  ariaLabel: string;
  icon: ReactElement;
  active: boolean;
  onClick: () => void;
}

function ModeButton({ id, label, ariaLabel, icon, active, onClick }: ModeButtonProps): ReactElement {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={ariaLabel}
      className={[
        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-800',
        active
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700',
      ].join(' ')}
    >
      {icon}
      {label}
    </button>
  );
}

// ── Icons (inline SVG — zero bundle-size overhead) ────────────────────────────

function PencilIcon(): ReactElement {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

function PlayIcon(): ReactElement {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function HomeIcon(): ReactElement {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
