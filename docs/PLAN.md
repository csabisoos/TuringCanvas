# Automata Editor - Project Plan

## Project Overview

A modern, offline-capable Progressive Web App (PWA) alternative to JFLAP for visualizing and simulating formal languages and finite automata.
**Tech Stack:** React, TypeScript, Vite, Tailwind CSS, Zustand (State), React Flow (Graph UI), Vitest (Testing).
**Architecture:** Strict separation of concerns (Core Domain Logic vs. UI/Visualization).
**Development Strategy:** Test-Driven Development (TDD) for core logic and state management to ensure AI agents have a strict feedback loop.

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

## Phase 5: Application UI & Integration

* [x] Build the main layout (Sidebar for tools, Canvas area, Topbar). — *Completed 2026-09-26*
* [x] Create controls to switch between "Edit Mode" and "Simulate Mode". — *Completed 2026-09-26*
* [ ] Integrate the Core Domain logic with the Visual Engine (run visual simulations).
* [ ] Implement step-by-step simulation visual feedback (highlighting active nodes).

## Phase 6: PWA & Polish

* [ ] Install `vite-plugin-pwa` and configure service workers for 100% offline use.
* [ ] Add web manifest (icons, name, theme colors).
* [ ] Final bug fixes, accessibility (a11y) improvements, and UI polish.
* [ ] Deploy to GitHub Pages or Vercel.