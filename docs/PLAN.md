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

## Phase 2: Core Domain Logic (TDD Approach - No UI)

* [ ] Define TypeScript interfaces for Automata (`State`, `Transition`, `Automaton`).
* [ ] (TDD Step 1) Write Vitest unit tests for DFA logic (adding states/transitions, processing valid/invalid strings).
* [ ] (TDD Step 2) Implement DFA core logic to pass the tests.
* [ ] (TDD Step 1) Write Vitest unit tests for NFA logic and NFA-to-DFA conversion.
* [ ] (TDD Step 2) Implement NFA core logic to pass the tests.

## Phase 3: State Management

* [ ] Install and set up Zustand.
* [ ] Create a store to manage the current automaton's state (nodes, edges).
* [ ] Write tests for the Zustand store (verifying state updates, serialization to JSON).
* [ ] Implement Load/Save functionality to pass the tests.

## Phase 4: Visual Engine (Graph UI)

* [ ] Install `reactflow` (React Flow).
* [ ] Map Zustand store data to React Flow nodes and edges.
* [ ] Implement custom Node components for Automata states (Start state, Accept state styling).
* [ ] Implement interactive edge creation (transitions between states).

## Phase 5: Application UI & Integration

* [ ] Build the main layout (Sidebar for tools, Canvas area, Topbar).
* [ ] Create controls to switch between "Edit Mode" and "Simulate Mode".
* [ ] Integrate the Core Domain logic with the Visual Engine (run visual simulations).
* [ ] Implement step-by-step simulation visual feedback (highlighting active nodes).

## Phase 6: PWA & Polish

* [ ] Install `vite-plugin-pwa` and configure service workers for 100% offline use.
* [ ] Add web manifest (icons, name, theme colors).
* [ ] Final bug fixes, accessibility (a11y) improvements, and UI polish.
* [ ] Deploy to GitHub Pages or Vercel.