# Automata Editor - Project Plan

## Project Overview

A modern, offline-capable Progressive Web App (PWA) alternative to JFLAP for visualizing and simulating formal languages and finite automata.
**Tech Stack:** React, TypeScript, Vite, Tailwind CSS, Zustand (State), React Flow (Graph UI), Vitest (Testing).
**Architecture:** Strict separation of concerns (Core Domain Logic vs. UI/Visualization).
**Development Strategy:** Test-Driven Development (TDD) for core logic and state management to ensure AI agents have a strict feedback loop.
**Master Documents:**
- Gap Analysis: [`docs/JFLAP_GAP_ANALYSIS.md`](JFLAP_GAP_ANALYSIS.md)
- Agent Implementation Roadmap & Prompts: [`docs/ROADMAP_AND_PROMPTS.md`](ROADMAP_AND_PROMPTS.md)

---

## Phase 1: Environment & Foundation ✅ — *Completed 2026-09-24*

* [x] Initialize React + TypeScript project using Vite.
* [x] Install and configure Tailwind CSS (v4 via `@tailwindcss/vite`).
* [x] Set up strict ESLint and Prettier configurations.
* [x] Install and configure `vitest` for unit testing (3 tests passing ✓).
* [x] Establish initial folder structure (`src/core`, `src/components`, `src/store`, `src/types`, `src/__tests__`).
* [x] Clean up Vite boilerplate code — minimal dark-themed `App.tsx` header.
* [x] Add `.gitignore` (excludes `node_modules/`, `dist/`, `coverage/`, `.env*`, logs).

## Phase 2: Core Domain Logic (TDD Approach - No UI) ✅ — *Completed 2026-09-24*

* [x] Define TypeScript interfaces for Automata (`State`, `Transition`, `Automaton`) — `src/types/automata.ts`.
* [x] (TDD Step 1) Write Vitest unit tests for DFA logic (adding states/transitions, processing valid/invalid strings) — `src/__tests__/dfa.test.ts` (26 tests ✓).
* [x] (TDD Step 2) Implement DFA core logic to pass the tests — `src/core/DFA.ts`.
* [x] (TDD Step 1) Write Vitest unit tests for NFA logic and NFA-to-DFA conversion — `src/__tests__/nfa.test.ts` (47 tests ✓).
* [x] (TDD Step 2) Implement NFA core logic to pass the tests — `src/core/NFA.ts` (`addTransition`, `getEpsilonClosure`, `simulate`, `convertToDFA` via Rabin-Scott powerset construction).

## Phase 3: State Management ✅ — *Completed 2026-09-26*

* [x] Install and set up Zustand. — *Completed 2026-09-26*
* [x] Define UI types (`AutomataNode`, `AutomataEdge`) in `src/types/ui.ts`. — *Completed 2026-09-26*
* [x] Create a store to manage the current automaton's state (nodes, edges) — `src/store/useAutomataStore.ts` (20 tests ✓). — *Completed 2026-09-26*
* [x] Write tests for the Zustand store (serialization to JSON). — *Completed 2026-09-26*
* [x] Implement Load/Save (`serialize`/`deserialize`) to pass the tests. — *Completed 2026-09-26*

## Phase 4: Visual Engine (Graph UI) ✅ — *Completed 2026-09-26*

* [x] Install `@xyflow/react` (React Flow v12). — *Completed 2026-09-26*
* [x] Map Zustand store data to React Flow nodes and edges. — *Completed 2026-09-26*
* [x] Implement custom Node components for Automata states (Start state, Accept state styling) — `src/components/canvas/StateNode.tsx`. — *Completed 2026-09-26*
* [x] Implement interactive node dragging and edge creation (transitions between states) — `onNodesChange`, `onEdgesChange`, `onConnect` wired through Zustand store. — *Completed 2026-09-26*

## Phase 5: Application UI & Integration ✅ — *Completed 2026-09-26*

* [x] Build the main layout (Sidebar for tools, Canvas area, Topbar). — *Completed 2026-09-26*
* [x] Create controls to switch between "Edit Mode" and "Simulate Mode". — *Completed 2026-09-26*
* [x] Integrate the Core Domain logic with the Visual Engine (run visual simulations). — *Completed 2026-09-26*
* [x] Implement step-by-step simulation visual feedback (highlighting active nodes). — *Completed 2026-09-26*

## Phase 6: PWA & Polish ✅ — *Completed 2026-09-27*

* [x] Install `vite-plugin-pwa` and configure service workers for 100% offline use. — *Completed 2026-09-27*
* [x] Add web manifest (icons, name, theme colors). — *Completed 2026-09-27*
* [x] Final bug fixes, accessibility (a11y) improvements, and UI polish. — *Completed 2026-09-27*
* [x] Deploy to GitHub Pages via GitHub Actions CI/CD (`.github/workflows/deploy.yml`). — *Completed 2026-09-27*

---

## Phase 7: Simulation Enhancements & Batch Testing 🚀

* [x] Task 1.1: Bidirectional Stepping (`stepBack`), Timeline Scrubber & Arrow Key Navigation — *Completed 2026-11-08*
* [x] Task 1.2: Fast Run & Simulation Trace Modal — *Completed 2026-11-08*
* [x] Task 1.3: Multiple Run (Batch Testing Suite with Pass/Fail Table) — *Completed 2026-11-08*
* [ ] Task 1.4: Nondeterministic Configuration Tree Visualizer
* [x] Task 1.5: DFA Completeness & Determinism Validator with Auto-Trap State Generation — *Completed 2026-11-08*

## Phase 8: Interoperability, File Formats & Canvas UX 🚀

* [ ] Task 9.1: JFLAP `.jff` XML Parser & Exporter (Full bidirectional compatibility)
* [ ] Task 9.2: LaTeX / TikZ Automata Exporter
* [ ] Task 9.3: High-Res PNG & Vector SVG Export
* [ ] Task 9.4: File System Access API (Open, Save, Save As, Auto-save)
* [ ] Task 10.1: Full Undo / Redo History Stack (Canvas & Store)
* [ ] Task 10.2: Automatic Graph Layout (Force-directed, Circular, Hierarchical)
* [ ] Task 10.3: Canvas Annotations & Sticky Notes

## Phase 9: Automata Transformations & Conversions 🚀

* [ ] Task 2.1: Interactive NFA to DFA Powerset Construction Wizard
* [ ] Task 2.2: DFA Minimization (Hopcroft Equivalence Partitioning & Distinguishable Table)
* [ ] Task 2.3: DFA/NFA to Regular Expression via State Elimination (GNFA)
* [ ] Task 2.4: Regular Expression to NFA via Thompson's Construction
* [ ] Task 2.5: Automata Equivalence & Isomorphism Checker (with Counterexample)

## Phase 10: Pushdown Automata (PDA) Module 🚀

* [ ] Task 3.1: Core PDA Domain Model & Invariants (`src/core/PDA.ts`)
* [ ] Task 3.2: Non-deterministic PDA Simulation Engine (Final state vs Empty stack)
* [ ] Task 3.3: PDA Canvas Adapter, Multi-field Edge Labels (`a, b; c`) & Animated Stack Visualizer
* [ ] Task 3.4: PDA $\leftrightarrow$ Context-Free Grammar (CFG) Conversions

## Phase 11: Turing Machines (TM) Module 🚀

* [ ] Task 4.1: Core 1-Tape Turing Machine Engine (`src/core/TM.ts`, $L/R/S$ moves, infinite tape)
* [ ] Task 4.2: TM Simulation Adapter & Animated Horizontal Tape Ribbon UI
* [ ] Task 4.3: Multi-Tape Turing Machine Engine & Visualization ($k \ge 2$)
* [ ] Task 4.4: Building Block Turing Machines (Macro nodes & subprograms)

## Phase 12: Transducers (Mealy & Moore Machines) 🚀

* [ ] Task 5.1: Core Mealy & Moore Machine Engines (`src/core/transducers/`)
* [ ] Task 5.2: Transducer Canvas Adapters, Output Labels & Synchronous Output Stream Ribbon
* [ ] Task 5.3: Bidirectional Mealy $\leftrightarrow$ Moore Conversions

## Phase 13: Formal Grammars & Parsing (CFG Suite) 🚀

* [ ] Task 6.1: Formal Grammar Core Types & Chomsky Hierarchy Parser (`src/core/grammar/`)
* [ ] Task 6.2: CFG Simplification Pipeline ($\lambda$, Unit, Useless Removal & CNF/GNF)
* [ ] Task 6.3: CYK Parsing Algorithm & Triangular Dynamic Programming Table UI
* [ ] Task 6.4: LL(1) Parsing Suite (FIRST/FOLLOW Sets, Parse Table & Stack Stepper)
* [ ] Task 6.5: SLR(1) / LR(1) Parsing Suite (Item Sets DFA, Action/Goto Tables)
* [ ] Task 6.6: Interactive SVG Derivation Tree / Parse Tree Visualizer

## Phase 14: Pumping Lemma Games & L-Systems 🚀

* [ ] Task 7.1: Regular Pumping Lemma Game Engine ($w = xyz$, Human vs AI)
* [ ] Task 7.2: Regular Pumping Lemma Interactive Partition Sliders UI
* [ ] Task 7.3: Context-Free Pumping Lemma Game ($w = uvxyz$) & 5-Way Partition UI
* [ ] Task 8.1: L-System Rewriting Engine (Axiom, Rules, Stochastic, Depth)
* [ ] Task 8.2: 2D Turtle Graphics HTML5 Canvas Renderer & Classic Fractal Presets
