# AGENTS.md — TuringCanvas Repository Reference

## Project Overview
**TuringCanvas** — PWA alternative to JFLAP for DFA/NFA visualization & simulation. React 19 + TypeScript 5.7 + Vite 8 + Tailwind 4 + Zustand 5 + React Flow 12 + Vitest.

**Architecture:** Strict clean architecture — pure mathematical core (`src/core/`) knows nothing about React/UI. UI layer (`src/components/`) delegates computation to Zustand store (`src/store/`) via adapter (`simulationAdapter.ts`).

---

## Essential Commands

| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Type-check + build | `npm run build` |
| Preview build | `npm run preview` |
| Run tests (CI) | `npm run test` |
| Watch tests | `npm run test:watch` |
| Coverage | `npm run test:coverage` |
| Lint | `npm run lint` |
| Lint + fix | `npm run lint:fix` |
| Format check | `npm run format:check` |
| Format write | `npm run format` |
| Type-check only | `npm run type-check` |

**CI order:** `lint` → `type-check` → `test` (run all before PR)

---

## Architecture Boundaries (Critical)

```
src/core/           # PURE TS — zero React, zero DOM, zero UI deps
  DFA.ts            # Deterministic FA — addTransition, simulate
  NFA.ts            # Nondeterministic FA + ε + convertToDFA (powerset)

src/types/
  automata.ts       # Core domain types (State, Transition, DFAData, NFAData, EPSILON)
  ui.ts             # Visual types (AutomataNode with position, AutomataEdge with symbols[])

src/store/
  useAutomataStore.ts    # Zustand — UI state + actions (nodes, edges, selection, mode, simulation)
  simulationAdapter.ts   # THE ADAPTER — UI types → Core NFA → simulate → step[] for UI

src/components/
  canvas/AutomataCanvas.tsx  # React Flow wrapper, maps store→RF nodes/edges
  canvas/StateNode.tsx       # Custom node (circle, double-ring, handles, inline edit)
  canvas/EditableEdge.tsx    # Custom edge (label rendering)
  ui/Topbar.tsx              # Edit/Simulate toggle
  ui/Sidebar.tsx             # Context panels
```

**Never import from `src/core/` in `src/components/`** — go through store/adapter.

---

## Data Flow: Edit → Simulate

1. **Edit Mode:** User actions → `useAutomataStore` actions → store updates → Canvas re-renders
2. **Connect Mode:** `editorTool='connect'` enables `nodesConnectable` on React Flow → `onConnect` → `addEdge`
3. **Simulate:** `startSimulation(input)` → `simulationAdapter.buildAndSimulate(nodes, edges, input)`
   - Infers alphabet from edge symbols (excludes ε)
   - Maps `AutomataNode[]` → Core `State[]`
   - Builds `NFA`, adds transitions (expands multi-symbol edges)
   - Computes ε-closure + step-by-step simulation
   - Returns `{ initialStep, steps[], accepted }`
4. **Step-through:** `stepForward()`/`stepBack()` → updates `currentStepIndex` + `activeNodeIds` → Canvas highlights

---

## Testing (TDD Mandatory)

| Suite | Scope | Tests |
|-------|-------|-------|
| `dfa.test.ts` | DFA invariants, transitions, simulate | 26 |
| `nfa.test.ts` | NFA, ε-closure, simulate, powerset | 47 |
| `simulation.test.ts` | Adapter integration | 15 |
| `store.test.ts` | Zustand actions, serialize/deserialize | 20 |

**Workflow:** Write test first (Red) → implement minimal code (Green) → refactor. No `@ts-ignore`, no `any`.

**Test config:** `vitest.config.ts` — jsdom, globals, setup `src/test-setup.ts`, include `src/**/__tests__/**/*.test.ts`

---

## Key Conventions

- **Strict TS:** `strict: true`, `noUnusedLocals/Params: true`, `explicit-function-return-type: warn`
- **ESLint:** `typescript-eslint` strict + stylistic + prettier + react-hooks + react-refresh
- **Imports:** `consistent-type-imports: error`
- **Tailwind only** — no external CSS files
- **Connect Mode required** for edge creation (prevents accidental edges)
- **Always NFA in adapter** — DFAs are subset, single code path, no detection logic
- **Pre-compute all simulation steps** — instant step-forward/back, trivial scrubber later

---

## PWA / Deployment

- `vite-plugin-pwa` with `generateSW` — caches all assets, `clientsClaim: true`, `skipWaiting: true`
- Base path: `/` locally, `/TuringCanvas/` on GitHub Pages (via `GITHUB_ACTIONS` env)
- Manifest in `vite.config.ts` — icons expected at `/public/icons/icon-{192,512}.png`

---

## File References

- **Architecture deep-dive:** `docs/ARCHITECTURE.md`
- **User manual:** `docs/USER_GUIDE.md`
- **Project plan (phases):** `docs/PLAN.md`

---

## Agent Instructions (Mandatory Rules)

### 1. Architectural Rules (Clean Architecture)
- **Separation of Concerns:** The mathematical logic of automata (`src/core/`) MUST NOT contain any UI logic, React components, or DOM dependencies. It must be pure TypeScript.
- **State Management:** UI and core logic communicate strictly through Zustand (`src/store/`).
- **Styling:** Use Tailwind CSS exclusively. No external CSS files unless absolutely necessary.

### 2. Development Workflow (TDD)
- **Test-First Approach:** Before implementing any logic in `src/core/` or `src/store/`, you MUST write the Vitest unit tests first.
- **Red-Green-Refactor:** Ensure tests fail initially, then write the minimal code to pass them, then refactor.
- **No Silenced Errors:** Do not use `@ts-ignore` or `any`. Enforce strict typing.

### 3. Execution Rules
- **Check the Plan:** Always consult `PLAN.md` to understand the current phase.
- **Stay in Scope:** Never jump ahead to future phases. Only execute the specific task requested by the user.
- **Update the Plan:** When a task is fully complete and tests are passing, update `PLAN.md` by checking off the relevant `[ ]` to `[x]`.
- **Concise Output:** Do not explain basic programming concepts unless asked. Output exactly what needs to be changed, created, or tested.