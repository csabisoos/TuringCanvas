/**
 * Machine Type Definitions
 *
 * Complete set of JFLAP-supported automaton/machine types.
 * Organized by category with comingSoon flags for future implementation.
 */

import type { ReactElement } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Machine Type Union
// ─────────────────────────────────────────────────────────────────────────────

export type MachineType =
  | 'fa'           // Finite Automaton (DFA/NFA)
  | 'pda'          // Pushdown Automaton
  | 'tm'           // Turing Machine
  | 'mtm'          // Multi-tape Turing Machine
  | 'mealy'        // Mealy Machine
  | 'moore'        // Moore Machine
  | 'grammar'      // Grammar (CFG)
  | 'l-system'     // L-System
  | 'regex'        // Regular Expression
  | 'cfg-pumping'  // Context-Free Pumping Lemma
  | 'reg-pumping'; // Regular Pumping Lemma

// ─────────────────────────────────────────────────────────────────────────────
// Category Types
// ─────────────────────────────────────────────────────────────────────────────

export type MachineCategory = 'automata' | 'machines' | 'formal-languages' | 'analysis';

// ─────────────────────────────────────────────────────────────────────────────
// Machine Type Definition Interface
// ─────────────────────────────────────────────────────────────────────────────

export interface MachineTypeDef {
  type: MachineType;
  title: string;
  description: string;
  icon: ReactElement;
  category: MachineCategory;
  comingSoon?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Icons (inline SVG — zero bundle-size overhead)
// ─────────────────────────────────────────────────────────────────────────────

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
      <circle cx="8" cy="12" r="5" />
      <circle cx="16" cy="12" r="5" />
      <path d="M13 12H11M11 12l2-2M11 12l2 2" />
      <path d="M3 12h4M5 10l2 2-2 2" />
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
      <circle cx="8" cy="12" r="5" />
      <rect x="14" y="6" width="10" height="12" rx="1" />
      <line x1="14" y1="10" x2="24" y2="10" />
      <line x1="14" y1="14" x2="24" y2="14" />
      <line x1="14" y1="18" x2="24" y2="18" />
      <path d="M13 12H11M11 12l2-2M11 12l2 2" />
      <path d="M3 12h4M5 10l2 2-2 2" />
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
      <rect x="3" y="10" width="18" height="4" rx="1" />
      <line x1="7" y1="10" x2="7" y2="14" />
      <line x1="11" y1="10" x2="11" y2="14" />
      <line x1="15" y1="10" x2="15" y2="14" />
      <line x1="19" y1="10" x2="19" y2="14" />
      <polygon points="11 8 13 10 11 12" />
      <circle cx="18" cy="5" r="4" />
      <path d="M18 1l0 3M16 3l2-2 2 2" />
      <circle cx="18" cy="5" r="6" />
    </svg>
  );
}

function MultiTapeTMIcon(): ReactElement {
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
      <rect x="3" y="6" width="18" height="3" rx="1" />
      <rect x="3" y="11" width="18" height="3" rx="1" />
      <rect x="3" y="16" width="18" height="3" rx="1" />
      <line x1="11" y1="6" x2="11" y2="9" />
      <line x1="11" y1="11" x2="11" y2="14" />
      <line x1="11" y1="16" x2="11" y2="19" />
      <polygon points="11 4 13 6 11 8" />
      <polygon points="11 9 13 11 11 13" />
      <polygon points="11 14 13 16 11 18" />
      <circle cx="20" cy="5" r="3" />
      <path d="M20 2l0 2M18.5 3.5l1.5-1.5 1.5 1.5" />
    </svg>
  );
}

function MealyMachineIcon(): ReactElement {
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
      <circle cx="8" cy="12" r="5" />
      <circle cx="16" cy="12" r="5" />
      <path d="M13 12H11M11 12l2-2M11 12l2 2" />
      <path d="M3 12h4M5 10l2 2-2 2" />
      <circle cx="16" cy="12" r="7" />
      <text x="13" y="13.5" fontSize="6" fill="currentColor" textAnchor="middle">i/o</text>
    </svg>
  );
}

function MooreMachineIcon(): ReactElement {
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
      <circle cx="8" cy="12" r="5" />
      <circle cx="16" cy="12" r="5" />
      <path d="M13 12H11M11 12l2-2M11 12l2 2" />
      <path d="M3 12h4M5 10l2 2-2 2" />
      <circle cx="16" cy="12" r="7" />
      <text x="16" y="6" fontSize="6" fill="currentColor" textAnchor="middle">λ</text>
    </svg>
  );
}

function GrammarIcon(): ReactElement {
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
      <path d="M4 21h16" />
      <path d="M6 17h12" />
      <path d="M8 13h8" />
      <path d="M10 9h4" />
      <path d="M4 7v14" />
    </svg>
  );
}

function LSystemIcon(): ReactElement {
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
      <path d="M12 22V12" />
      <path d="M12 12l-4-4" />
      <path d="M12 12l4-4" />
      <path d="M8 18l4-4" />
      <path d="M16 18l-4-4" />
      <path d="M8 10l4-4" />
      <path d="M16 10l-4-4" />
      <path d="M4 2l4 4" />
      <path d="M20 2l-4 4" />
    </svg>
  );
}

function RegexIcon(): ReactElement {
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
      <path d="M8 22V4" />
      <path d="M16 22V4" />
      <path d="M4 13h16" />
      <path d="M8 8h8" />
      <circle cx="12" cy="4" r="2" />
      <circle cx="12" cy="20" r="2" />
    </svg>
  );
}

function CFPumpingIcon(): ReactElement {
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
      <path d="M12 2v20" />
      <path d="M2 12h20" />
      <path d="M12 12l4 4M12 12l-4 4M12 12l4-4M12 12l-4-4" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

function RegPumpingIcon(): ReactElement {
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
      <path d="M12 2v20" />
      <path d="M2 12h20" />
      <path d="M8 16h8M8 8h8" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Complete Machine Type Definitions (JFLAP parity)
// ─────────────────────────────────────────────────────────────────────────────

export const MACHINE_TYPES: MachineTypeDef[] = [
  // ── AUTOMATA ──────────────────────────────────────────────────────────────
  {
    type: 'fa',
    title: 'Finite Automaton',
    description: 'DFA / NFA with ε-transitions',
    icon: <FiniteAutomatonIcon />,
    category: 'automata',
  },
  {
    type: 'pda',
    title: 'Pushdown Automaton',
    description: 'Context-free languages with stack',
    icon: <PushdownAutomatonIcon />,
    category: 'automata',
  },
  {
    type: 'tm',
    title: 'Turing Machine',
    description: 'Unbounded tape, universal computation',
    icon: <TuringMachineIcon />,
    category: 'automata',
  },

  // ── MACHINES ──────────────────────────────────────────────────────────────
  {
    type: 'mtm',
    title: 'Multi-tape Turing Machine',
    description: 'Multiple tapes for parallel computation',
    icon: <MultiTapeTMIcon />,
    category: 'machines',
    comingSoon: true,
  },
  {
    type: 'mealy',
    title: 'Mealy Machine',
    description: 'Output depends on state and input',
    icon: <MealyMachineIcon />,
    category: 'machines',
    comingSoon: true,
  },
  {
    type: 'moore',
    title: 'Moore Machine',
    description: 'Output depends only on state',
    icon: <MooreMachineIcon />,
    category: 'machines',
    comingSoon: true,
  },

  // ── FORMAL LANGUAGES ──────────────────────────────────────────────────────
  {
    type: 'grammar',
    title: 'Grammar (CFG)',
    description: 'Context-free grammar editor',
    icon: <GrammarIcon />,
    category: 'formal-languages',
    comingSoon: true,
  },
  {
    type: 'l-system',
    title: 'L-System',
    description: 'Lindenmayer systems for fractals',
    icon: <LSystemIcon />,
    category: 'formal-languages',
    comingSoon: true,
  },
  {
    type: 'regex',
    title: 'Regular Expression',
    description: 'Regex to NFA/DFA conversion',
    icon: <RegexIcon />,
    category: 'formal-languages',
    comingSoon: true,
  },

  // ── ANALYSIS TOOLS ────────────────────────────────────────────────────────
  {
    type: 'cfg-pumping',
    title: 'CF Pumping Lemma',
    description: 'Context-free language proof tool',
    icon: <CFPumpingIcon />,
    category: 'analysis',
    comingSoon: true,
  },
  {
    type: 'reg-pumping',
    title: 'Regular Pumping Lemma',
    description: 'Regular language proof tool',
    icon: <RegPumpingIcon />,
    category: 'analysis',
    comingSoon: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

/** Get all machine types for a specific category */
export function getMachineTypesByCategory(category: MachineCategory): MachineTypeDef[] {
  return MACHINE_TYPES.filter((t) => t.category === category);
}

/** Get a machine type definition by its type */
export function getMachineTypeDef(type: MachineType): MachineTypeDef | undefined {
  return MACHINE_TYPES.find((t) => t.type === type);
}

/** Get all implemented (non-coming-soon) machine types */
export function getImplementedMachineTypes(): MachineTypeDef[] {
  return MACHINE_TYPES.filter((t) => !t.comingSoon);
}

/** Get all machine type values as an array */
export function getAllMachineTypeValues(): MachineType[] {
  return MACHINE_TYPES.map((t) => t.type);
}