# Architecture Guide

> Technical deep-dive for developers and contributors. Covers separation of concerns, the Zustand adapter pattern, and the TDD workflow that drives TuringCanvas.

---

## 🏛️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TURINGCANVAS                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────┐      ┌──────────────────────┐                    │
│  │   UI / CANVAS LAYER  │      │    CORE DOMAIN       │                    │
│  │   (src/components)   │      │    (src/core)        │                    │
│  │                      │      │                      │                    │
│  │  • AutomataCanvas    │      │  • DFA.ts            │                    │
│  │  • StateNode         │      │  • NFA.ts            │                    │
│  │  • EditableEdge      │      │                      │                    │
│  │  • Topbar / Sidebar  │      │  Pure TypeScript     │                    │
│  │                      │      │  Zero dependencies   │                    │
│  │  React + React Flow  │      │  Zero React/DOM      │                    │
│  └───────────┬──────────┘      └──────────┬───────────┘                    │
│              │                            │                                │
│              ▼                            ▼                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    ZUSTAND STORE (src/store)                        │   │
│  │  ┌─────────────┐  ┌──────────────────────┐  ┌─────────────────┐    │   │
│  │  │ UI State    │  │ Adapter              │  │ Actions         │    │   │
│  │  │ (nodes,     │  │ (simulationAdapter)  │  │ (addNode,       │    │   │
│  │  │  edges,     │◄─┤  • buildAndSimulate  │  │  simulate,      │    │   │
│  │  │  selection) │  │  • UI → Core mapping │  │  serialize)     │    │   │
│  │  └─────────────┘  └──────────────────────┘  └─────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key Principle:** The **Core Domain** (`src/core`) knows nothing about React, React Flow, or the UI. It is a pure mathematical library. The **UI Layer** knows nothing about DFA/NFA algorithms — it only renders nodes/edges and delegates computation to the store.

---

## 📦 Module Breakdown

### `src/core/` — Pure Mathematical Engine

| File | Responsibility | Key Exports |
|------|----------------|-------------|
| `DFA.ts` | Deterministic Finite Automaton | `class DFA { constructor, addTransition, simulate }` |
| `NFA.ts` | Nondeterministic FA with ε-transitions | `class NFA { constructor, addTransition, getEpsilonClosure, simulate, convertToDFA }` |

**Invariants enforced at construction:**
- Non-empty state set, non-empty alphabet
- Exactly one initial state
- No duplicate state IDs
- DFA: transition function is deterministic (unique `(state, symbol)`)
- NFA: allows multiple transitions per `(state, symbol)`, plus ε-transitions

**Algorithms implemented:**
- `NFA.getEpsilonClosure` — Iterative BFS worklist (handles cycles)
- `NFA.simulate` — Parallel set-of-states execution
- `NFA.convertToDFA` — Rabin-Scott powerset / subset construction

### `src/types/` — Shared Type Contracts

| File | Purpose |
|------|---------|
| `automata.ts` | Core domain types: `State`, `Transition`, `DFAData`, `NFAData`, `Alphabet`, `EPSILON` |
| `ui.ts` | Visual types: `AutomataNode` (with `position`), `AutomataEdge` (with `symbols[]`) |

> **Critical:** `automata.ts` types are used by Core. `ui.ts` types are used by UI/Store. They are **intentionally separate** — the adapter translates between them.

### `src/store/` — Zustand Bridge (Adapter Pattern)

| File | Responsibility |
|------|----------------|
| `useAutomataStore.ts` | Single source of truth for UI state: nodes, edges, selection, editor mode, tool, simulation state. Exposes actions for all mutations. |
| `simulationAdapter.ts` | **The Adapter** — translates `AutomataNode[]` + `AutomataEdge[]` → Core `NFA` → runs simulation → returns step-by-step `Set<string>[]` for UI highlighting. |

**Store State Shape:**
```typescript
interface AutomataState {
  // Visual graph
  nodes: AutomataNode[];
  edges: AutomataEdge[];

  // Editor mode
  editorMode: 'edit' | 'simulate';
  editorTool: 'select' | 'connect';

  // Selection (synced from React Flow)
  selectedNodeIds: string[];
  selectedEdgeIds: string[];

  // Simulation (pre-computed on start)
  activeNodeIds: Set<string>;
  simulationSteps: Set<string>[];  // step 0 = initial ε-closure
  currentStepIndex: number;
  simulationError: string | null;
  simulationAccepted: boolean | null;
}
```

### `src/components/` — React UI Layer

| Component | Role |
|-----------|------|
| `AutomataCanvas.tsx` | React Flow wrapper. Maps store nodes/edges → RF nodes/edges. Handles `onNodesChange`, `onEdgesChange`, `onConnect`. Enforces **Connect Mode** gating. |
| `StateNode.tsx` | Custom RF node. Renders state circle, initial arrow, double-ring for accepting, amber glow for active. Inline label editing (double-click). |
| `EditableEdge.tsx` | Custom RF edge. Renders label with transition symbols. Click-to-edit (planned). |
| `Topbar.tsx` | Mode toggle (Edit/Simulate). |
| `Sidebar.tsx` | Context-aware panels: Edit tools vs. Simulation controls. |

---

## 🔄 Data Flow: Edit → Simulate → Visualize

### 1. Edit Mode (User Interaction)

```
User clicks "Add State"
        │
        ▼
Sidebar → useAutomataStore.addNode(node)
        │
        ▼
Store updates nodes[]  ──►  AutomataCanvas re-renders
        │                         │
        │                    toFlowNode() maps
        │                    AutomataNode → RF Node
        ▼                         ▼
   (Zustand)               React Flow renders
                           StateNode component
```

### 2. Creating a Transition (Connect Mode)

```
User clicks "Add Transition" (no selection)
        │
        ▼
Store: editorTool = 'connect'
        │
        ▼
AutomataCanvas: nodesConnectable = true
        │
        ▼
User drags handle (source) → drops on target handle
        │
        ▼
onConnect(connection) fires
        │
        ▼
Store: addEdge({ source, target, symbols: ['ε'] })
        │
        ▼
Canvas re-renders with new EditableEdge
```

### 3. Simulation (The Adapter Pipeline)

```
User enters "aabb" + clicks Start
        │
        ▼
Store.startSimulation("aabb")
        │
        ▼
simulationAdapter.buildAndSimulate(nodes, edges, "aabb")
        │
        ├─► Infer alphabet from edge symbols (excluding ε)
        ├─► Map AutomataNode[] → Core State[]
        ├─► new NFA(coreStates, alphabet)
        ├─► For each edge.symbols[]: nfa.addTransition(...)
        ├─► Compute initial ε-closure
        ├─► For each input symbol:
        │      move() → ε-closure() → push to steps[]
        └─► Return { initialStep, steps[], accepted }
        │
        ▼
Store receives SimulationResult
        │
        ├─► simulationSteps = [initialStep, ...steps]
        ├─► currentStepIndex = 0
        ├─► activeNodeIds = initialStep
        └─► simulationAccepted = (input.length === 0 ? accepted : null)
        │
        ▼
AutomataCanvas re-renders
        │
        ├─► toFlowNode() reads activeNodeIds
        │      → data.isActive = true for active nodes
        │
        ▼
StateNode receives isActive prop
        │
        ▼
Renders amber glow + ring on active states
```

### 4. Step-Through

```
User clicks "Step"
        │
        ▼
Store.stepForward()
        │
        ├─► currentStepIndex++
        ├─► activeNodeIds = simulationSteps[nextIndex]
        ├─► If last step: compute accepted = any(active).isAccepting
        │
        ▼
Canvas re-renders → new active set highlighted
```

---

## 🔌 The Adapter Pattern: `simulationAdapter.ts`

This is the **critical boundary** between UI and Core.

```typescript
// Input: Pure UI types
export function buildAndSimulate(
  nodes: AutomataNode[],
  edges: AutomataEdge[],
  input: string
): SimulationResult | SimulationError
```

**Translation Rules:**
| UI Concept | Core Concept |
|------------|--------------|
| `AutomataNode.position` | **Ignored** (purely visual) |
| `AutomataNode.label` | `State.name` |
| `AutomataNode.isInitial` | `State.isInitial` |
| `AutomataNode.isAccepting` | `State.isAccepting` |
| `AutomataEdge.symbols[]` | Multiple `NFA.addTransition()` calls |
| Visual `'ε'` string | Core `EPSILON` (`''`) |
| Multiple symbols on one edge | **Expanded** to multiple NFA transitions |

**Why always build an NFA?**
- DFAs are a strict subset of NFAs
- Single code path handles both graph shapes
- No need for "is this a DFA?" detection logic
- Core `NFA.simulate` is the reference algorithm

---

## 🧪 Test-Driven Development (TDD) Workflow

TuringCanvas was built **test-first**. The test suite is the specification.

### Test Structure

```
src/__tests__/
├── dfa.test.ts          # 26 tests — DFA invariants, addTransition, simulate
├── nfa.test.ts          # 47 tests — NFA, ε-closure, simulate, convertToDFA
├── simulation.test.ts   # 15 tests — Adapter: buildAndSimulate integration
├── store.test.ts        # 20 tests — Zustand actions, serialize/deserialize
└── dummy.test.ts        # Placeholder
```

### TDD Cycle Used

```
1. WRITE TEST (Red)
   └─ Define expected behavior in Vitest
      (e.g., "NFA converts to equivalent DFA via subset construction")

2. RUN TEST → FAIL
   └─ Confirms test catches missing implementation

3. IMPLEMENT MINIMAL CODE (Green)
   └─ Write Core logic in src/core/*.ts
   └─ Zero UI, zero React, pure TypeScript

4. REFACTOR
   └─ Clean up, add types, ensure invariants

5. REPEAT
```

### Running Tests

```bash
# CI mode (used in GitHub Actions)
npm run test

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Categories

| Suite | Focus | Example |
|-------|-------|---------|
| `dfa.test.ts` | Core DFA invariants | `"rejects duplicate (state, symbol) transition"` |
| `nfa.test.ts` | NFA + ε + powerset | `"convertToDFA produces equivalent DFA for a*b*"` |
| `simulation.test.ts` | Adapter integration | `"buildAndSimulate returns steps for NFA with ε"` |
| `store.test.ts` | Zustand actions | `"serialize/deserialize round-trips correctly"` |

---

## 🎯 Key Design Decisions

### 1. Why Zustand over Redux/Context?
- **Minimal boilerplate** — single `create()` call
- **No Provider wrapper** — works anywhere in component tree
- **Selective subscriptions** — `useStore(s => s.nodes)` only re-renders on `nodes` change
- **Middleware-friendly** — easy to add persistence, devtools later

### 2. Why React Flow (@xyflow/react)?
- Battle-tested graph library
- Handle-based connections (critical for directed automata edges)
- Built-in pan/zoom/minimap/background
- Custom node/edge components via `nodeTypes`/`edgeTypes`

### 3. Why Pre-compute All Simulation Steps?
- Enables **instant step-forward/backward** (no re-computation)
- Step index = array index — trivial to implement scrubber later
- Memory cost negligible (max ~100 states × 1000 input length)

### 4. Why Strict Connect Mode?
- Prevents accidental edges during drag-to-reposition
- Makes transition creation **intentional and explicit**
- Aligns with how automata are formally defined (edges are deliberate)

### 5. Why Separate `automata.ts` vs `ui.ts` Types?
- **Core stays pure** — no `position`, no `symbols[]` arrays
- **UI stays flexible** — can add visual-only fields (color, size) without touching Core
- **Adapter is explicit** — translation logic is visible and testable

---

## 📁 File Reference Map

```
src/
├── core/
│   ├── DFA.ts           # Pure DFA implementation
│   └── NFA.ts           # Pure NFA + powerset construction
├── store/
│   ├── useAutomataStore.ts   # Zustand store (UI state + actions)
│   └── simulationAdapter.ts  # UI→Core translation + simulation
├── types/
│   ├── automata.ts    # Core domain types (State, Transition, DFAData, NFAData)
│   └── ui.ts          # Visual types (AutomataNode, AutomataEdge)
├── components/
│   ├── canvas/
│   │   ├── AutomataCanvas.tsx   # React Flow integration
│   │   ├── StateNode.tsx        # Custom node (circle, labels, handles)
│   │   └── EditableEdge.tsx     # Custom edge (label rendering)
│   └── ui/
│       ├── Topbar.tsx           # Mode toggle
│       └── Sidebar.tsx          # Context-aware tool panels
├── __tests__/          # Vitest suites (TDD)
├── App.tsx             # Root layout (Topbar + Sidebar + Canvas)
└── main.tsx            # Entry point
```

---

## 🛠 Extending the System

### Adding a New Automaton Type (e.g., PDA)

1. **Core**: Create `src/core/PDA.ts` with pure logic
2. **Types**: Extend `src/types/automata.ts` with `PDAData`, `StackSymbol`, etc.
3. **Adapter**: Add `buildAndSimulatePDA` in `simulationAdapter.ts` (or new file)
4. **Store**: Add `automatonType` state, switch simulation logic
5. **UI**: New node/edge components if visual representation differs
6. **Tests**: Write `pda.test.ts` **first** (TDD)

### Adding Persistence (LocalStorage / IndexedDB)

```typescript
// In useAutomataStore.ts — add middleware
import { persist } from 'zustand/middleware';

export const useAutomataStore = create<AutomataStore>()(
  persist(
    (set, get) => ({ ... }),
    { name: 'turingcanvas-automaton' }
  )
);
```

### Adding Undo/Redo

```typescript
// In useAutomataStore.ts — add middleware
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
enableMapSet();

export const useAutomataStore = create<AutomataStore>()(
  immer((set, get) => ({ ... }))
);
// Then use `undo/redo` from `zustand/middleware` or custom history
```

---

## 🔗 Related Documents

- [User Guide](USER_GUIDE.md) — End-user manual
- [README](../README.md) — Project overview & quick start
- [Source Code](../src/) — Implementation

---

## 📝 Contribution Checklist

Before submitting a PR:

- [ ] All tests pass (`npm run test`)
- [ ] Linting clean (`npm run lint`)
- [ ] Type-check clean (`npm run type-check`)
- [ ] New Core logic has tests in `src/__tests__/`
- [ ] New UI behavior has store tests if applicable
- [ ] Architecture boundaries respected (Core ≠ UI)
- [ ] Documentation updated if user-facing change

---

*Architecture Guide v1.0 — Reflects codebase state as of Phase 6 completion (2026-09-27)*