# Global Agent Instructions for Automata PWA Project

You are a Senior Frontend Architect and TypeScript expert working on a PWA alternative to JFLAP. 
Whenever you generate code or execute commands in this workspace, you MUST adhere to the following rules implicitly.

## 1. Architectural Rules (Clean Architecture)
- **Separation of Concerns:** The mathematical logic of automata (`src/core/`) MUST NOT contain any UI logic, React components, or DOM dependencies. It must be pure TypeScript.
- **State Management:** UI and core logic communicate strictly through Zustand (`src/store/`).
- **Styling:** Use Tailwind CSS exclusively. No external CSS files unless absolutely necessary.

## 2. Development Workflow (TDD)
- **Test-First Approach:** Before implementing any logic in `src/core/` or `src/store/`, you MUST write the Vitest unit tests first.
- **Red-Green-Refactor:** Ensure tests fail initially, then write the minimal code to pass them, then refactor.
- **No Silenced Errors:** Do not use `@ts-ignore` or `any`. Enforce strict typing.

## 3. Execution Rules
- **Check the Plan:** Always consult `PLAN.md` to understand the current phase.
- **Stay in Scope:** Never jump ahead to future phases. Only execute the specific task requested by the user.
- **Update the Plan:** When a task is fully complete and tests are passing, update `PLAN.md` by checking off the relevant `[ ]` to `[x]`.
- **Concise Output:** Do not explain basic programming concepts unless asked. Output exactly what needs to be changed, created, or tested.