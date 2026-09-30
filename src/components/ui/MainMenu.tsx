import type { ReactElement } from 'react';
import { useAutomataStore } from '../../store/useAutomataStore';
import type { MachineType } from '../../store/useAutomataStore';

// ── Component ─────────────────────────────────────────────────────────────────

export function MainMenu(): ReactElement {
  const openEditor = useAutomataStore((s) => s.openEditor);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <header className="mb-12 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-sm select-none"
            role="img"
            aria-label="TuringCanvas logo"
          >
            TC
          </div>
          <span className="text-2xl font-semibold tracking-tight text-white">
            TuringCanvas
          </span>
        </div>
        <p className="text-gray-400 text-lg max-w-md mx-auto">
          Choose a machine type to begin
        </p>
      </header>

      {/* Machine type cards */}
      <main className="w-full max-w-md space-y-4">
        {MACHINE_TYPES.map(({ type, title, description, icon }) => (
          <MachineTypeCard
            key={type}
            title={title}
            description={description}
            icon={icon}
            onClick={() => openEditor(type)}
          />
        ))}
      </main>

      {/* Footer hint */}
      <footer className="mt-12 text-center text-gray-600 text-sm">
        <kbd className="px-2 py-1 bg-gray-800 border border-gray-700 rounded font-mono">
          Tab
        </kbd>{' '}
        to navigate ·{' '}
        <kbd className="px-2 py-1 bg-gray-800 border border-gray-700 rounded font-mono">
          Enter
        </kbd>{' '}
        to select
      </footer>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface MachineTypeCardProps {
  title: string;
  description: string;
  icon: ReactElement;
  onClick: () => void;
}

function MachineTypeCard({ title, description, icon, onClick }: MachineTypeCardProps): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-150',
        'bg-gray-900 border-gray-800',
        'hover:border-indigo-500 hover:bg-gray-800 hover:shadow-lg hover:shadow-indigo-500/10',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950',
        'text-left select-none',
      ].join(' ')}
      aria-label={title}
    >
      <span className="w-10 h-10 shrink-0 flex items-center justify-center rounded-lg bg-indigo-950/50 border border-indigo-800 text-indigo-400" aria-hidden="true">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-medium text-white truncate">{title}</h3>
        <p className="text-sm text-gray-400 truncate mt-0.5">{description}</p>
      </div>
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-gray-500 shrink-0"
        aria-hidden="true"
      >
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </button>
  );
}

// ── Machine type definitions ──────────────────────────────────────────────────

const MACHINE_TYPES: {
  type: MachineType;
  title: string;
  description: string;
  icon: ReactElement;
}[] = [
  {
    type: 'fa',
    title: 'Finite Automaton',
    description: 'DFA / NFA with ε-transitions',
    icon: <FiniteAutomatonIcon />,
  },
  {
    type: 'pda',
    title: 'Pushdown Automaton',
    description: 'Context-free languages with stack',
    icon: <PushdownAutomatonIcon />,
  },
  {
    type: 'tm',
    title: 'Turing Machine',
    description: 'Unbounded tape, universal computation',
    icon: <TuringMachineIcon />,
  },
];

// ── Icons (inline SVG — zero bundle-size overhead) ────────────────────────────

function FiniteAutomatonIcon(): ReactElement {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Two states with a transition */}
      <circle cx="8" cy="12" r="5" />
      <circle cx="16" cy="12" r="5" />
      <path d="M13 12H11M11 12l2-2M11 12l2 2" />
      {/* Initial arrow */}
      <path d="M3 12h4M5 10l2 2-2 2" />
      {/* Accepting double circle */}
      <circle cx="16" cy="12" r="7" />
    </svg>
  );
}

function PushdownAutomatonIcon(): ReactElement {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* State */}
      <circle cx="8" cy="12" r="5" />
      {/* Stack representation */}
      <rect x="14" y="6" width="10" height="12" rx="1" />
      <line x1="14" y1="10" x2="24" y2="10" />
      <line x1="14" y1="14" x2="24" y2="14" />
      <line x1="14" y1="18" x2="24" y2="18" />
      {/* Transition arrow */}
      <path d="M13 12H11M11 12l2-2M11 12l2 2" />
      {/* Initial arrow */}
      <path d="M3 12h4M5 10l2 2-2 2" />
      {/* Accepting double circle */}
      <circle cx="8" cy="12" r="7" />
    </svg>
  );
}

function TuringMachineIcon(): ReactElement {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Tape */}
      <rect x="3" y="10" width="18" height="4" rx="1" />
      <line x1="7" y1="10" x2="7" y2="14" />
      <line x1="11" y1="10" x2="11" y2="14" />
      <line x1="15" y1="10" x2="15" y2="14" />
      <line x1="19" y1="10" x2="19" y2="14" />
      {/* Head */}
      <polygon points="11 8 13 10 11 12" />
      {/* State */}
      <circle cx="18" cy="5" r="4" />
      {/* Initial arrow */}
      <path d="M18 1l0 3M16 3l2-2 2 2" />
      {/* Accepting double circle */}
      <circle cx="18" cy="5" r="6" />
    </svg>
  );
}