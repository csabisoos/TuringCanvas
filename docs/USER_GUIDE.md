# User Guide

> A complete manual for constructing and simulating finite automata in TuringCanvas. Designed for university students and educators in Theory of Computation courses.

---

## 🖥️ Interface Overview

TuringCanvas uses a three-panel layout optimized for automata construction:

```
┌─────────────────────────────────────────────────────────────┐
│  TOPBAR                    [Edit] [Simulate]                │
├───────────┬─────────────────────────────────────────────────┤
│           │                                                 │
│  SIDEBAR  │              AUTOMATA CANVAS                    │
│           │                                                 │
│  (Tools)  │   • Drag background to pan                     │
│           │   • Scroll to zoom                             │
│           │   • Mini-map (bottom-right) for navigation     │
│           │                                                 │
└───────────┴─────────────────────────────────────────────────┘
```

### Topbar
| Element | Purpose |
|---------|---------|
| **TuringCanvas** | Application title and version badge |
| **Edit / Simulate Toggle** | Switches between **Edit Mode** (graph construction) and **Simulate Mode** (step-through execution) |

### Sidebar (Context-Aware)
The sidebar content changes based on the active mode:

| Mode | Panels Available |
|------|------------------|
| **Edit** | Graph • Selection • Canvas |
| **Simulate** | Test String • Controls • Result |

---

## 🎭 Edit Mode vs. Simulate Mode

| Aspect | Edit Mode | Simulate Mode |
|--------|-----------|---------------|
| **Purpose** | Build/modify the automaton graph | Execute step-by-step simulation on an input string |
| **Canvas Interaction** | Drag states, create transitions, edit labels | Read-only (pan/zoom only) |
| **Sidebar Tools** | Add State, Add Transition, Mark Initial/Accepting, Delete | Input field, Start/Step/Reset buttons |
| **Visual Feedback** | Selection highlights, handle visibility | Active-state amber glow, step counter |

> **Tip:** You can only switch to **Simulate Mode** when the graph has at least one state.

---

## ✏️ Graph Editing (Edit Mode)

### 1. Adding States

**Method A — Sidebar Button (Recommended)**
1. Click **Add State** in the *Graph* section of the sidebar
2. A new state `qN` appears staggered in a grid (wraps every 5 columns)
3. The **very first state** is automatically marked as **Initial** (▶ arrow)

**Method B — Keyboard Shortcut**
- Press `S` anywhere on the canvas (when not editing a label)

**State Visual Language**
| Visual Cue | Meaning |
|------------|---------|
| `▶` arrow on left | **Initial state** (exactly one per automaton) |
| Double ring (indigo) | **Accepting (final) state** |
| Single ring (gray/indigo) | Regular state |
| Amber glow + pulse | **Currently active** during simulation |

### 2. Adding Transitions

TuringCanvas offers **two complementary workflows** for creating transitions:

#### Workflow 1: Select & Connect (Fast for small graphs)
1. Click **one state** → it highlights
2. Hold `Shift` and click a **second state** → both selected
3. Click **Add Transition** in sidebar → creates an ε-transition from first → second
4. Click the **edge label** to edit symbols

#### Workflow 2: Drag-to-Connect (Precise for complex graphs)
1. Click **Add Transition** in sidebar (no states selected) → button turns emerald, "Connect mode" banner appears
2. Hover a state → **handles appear** on left (target) and right (source)
3. **Drag from the right handle** (source) of the origin state
4. **Drop on the left handle** (target) of the destination state
5. Click **Add Transition** again (or press `Escape`) to exit Connect mode

> **Why two modes?** The explicit Connect mode prevents accidental edge creation while repositioning states — a common frustration in other tools.

### 3. Editing Transition Symbols

1. **Click the edge label** (shows symbols like `a, b, ε`)
2. An inline input appears — type symbols separated by commas
   - Example: `a, b, ε` or `0, 1`
   - Use `ε` (or leave empty) for epsilon transitions
3. Press `Enter` or click away to commit

**Symbol Rules:**
- Each symbol is a **single Unicode character**
- Multi-character symbols are not supported (per formal definition)
- `ε` is a display alias for the internal empty-string epsilon symbol

### 4. Marking States as Initial / Accepting

| Action | How To | Constraints |
|--------|--------|-------------|
| **Mark Initial** | Select **exactly one state** → click **Mark Initial** in *Selection* panel | Only one initial state allowed; clears previous |
| **Toggle Accepting** | Select **exactly one state** → click **Mark Accepting** | Any number of accepting states allowed |

### 5. Deleting Elements

1. Select one or more states and/or edges (click + `Shift` for multi-select)
2. Click **Delete Selected** in *Selection* panel (red button)
3. All selected elements and their incident edges are removed

### 6. Editing State Labels

**Double-click** any state label → inline editor opens → type new label → `Enter` to save, `Escape` to cancel.

---

## ▶️ Simulation (Simulate Mode)

### Starting a Simulation

1. Switch to **Simulate Mode** via Topbar toggle
2. Enter a **test string** in the input field (e.g., `aabb`, `0101`, `ε` for empty string)
3. Press **Start** or hit `Enter`

**What happens internally:**
1. The visual graph is translated to a core **NFA** (handles both DFA/NFA uniformly)
2. The **full traversal is pre-computed** (all steps at once)
3. Step 0 = initial ε-closure (before consuming any symbol)

### Step-Through Controls

| Button | Action | Keyboard |
|--------|--------|----------|
| **Start** | Initialize simulation at step 0 | `Enter` in input field |
| **Step** | Advance by one input symbol | — |
| **Reset** | Clear simulation, return to edit-ready state | — |

### Visual Feedback During Simulation

| Indicator | Meaning |
|-----------|---------|
| **Amber glow + ring** on state | State is in the **current active set** |
| **Step counter** (e.g., `Step 2 / 4`) | Current position in input string |
| **Green "✓ Accepted"** | Final active set contains an accepting state |
| **Red "✗ Rejected"** | Final active set is empty or has no accepting states |
| **Red "⚠ Error"** | Graph invalid (no initial state, unknown symbols, etc.) |

### Understanding NFA Simulation

TuringCanvas simulates **NFAs natively** using the standard parallel-set algorithm:

```
For each input symbol:
  1. ε-closure(current_states)     ← expand via ε-transitions
  2. move(current_states, symbol)  ← consume symbol
  3. ε-closure(result)             ← expand again
Accept iff any final state is accepting
```

This means:
- **Multiple states can be active simultaneously** (amber highlight on several states)
- **ε-transitions are automatically followed** before and after each symbol
- **DFA simulation is a special case** (only one active state at a time)

---

## 💾 Saving & Loading Automata

### Export (Serialize)
- Not yet exposed in UI — use browser console:
```js
// In DevTools console:
const json = useAutomataStore.getState().serialize();
console.log(json);  // Copy this string
```

### Import (Deserialize)
- Not yet exposed in UI — use browser console:
```js
// In DevTools console:
useAutomataStore.getState().deserialize(`{ "nodes": [...], "edges": [...] }`);
```

> **Roadmap:** File download/upload buttons coming in v1.1.

---

## ⌨️ Keyboard Shortcuts

| Key | Action | Context |
|-----|--------|---------|
| `S` | Add State | Edit Mode, canvas focused |
| `Escape` | Exit Connect Mode / Cancel label edit | Any |
| `Enter` | Commit label edit / Start simulation | Editing label / Simulate input |
| `Delete` / `Backspace` | Delete selected elements | Edit Mode, elements selected |
| `Shift` + Click | Multi-select states/edges | Edit Mode |
| Scroll | Zoom canvas | Any |
| Drag background | Pan canvas | Any |

---

## 🎯 Common Workflows

### Building a DFA for `L = { w | w contains even number of 0s }`

1. **Add State** → `q0` (auto-initial)
2. **Add State** → `q1`
3. **Mark `q0` Accepting** (select `q0` → Mark Accepting)
4. **Add Transition** `q0` → `q0` on `1`
5. **Add Transition** `q0` → `q1` on `0`
6. **Add Transition** `q1` → `q1` on `1`
7. **Add Transition** `q1` → `q0` on `0`
8. Switch to **Simulate**, test `0101` → ✓ Accepted

### Building an NFA with ε for `L = { a^n b^n | n ≥ 0 }`

1. **Add State** `q0` (initial, accepting)
2. **Add State** `q1`
3. **Add State** `q2` (accepting)
4. **Add Transition** `q0` → `q1` on `a`
5. **Add Transition** `q1` → `q1` on `a`
6. **Add Transition** `q1` → `q2` on `ε`
7. **Add Transition** `q2` → `q2` on `b`
8. Test `aabb` → ✓ Accepted (explores ε-path)

---

## 🐛 Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Graph must have exactly one initial state" | Zero or multiple initial states | Use **Mark Initial** on exactly one state |
| "No transitions found" | No edges with non-ε symbols | Add at least one transition with a real symbol |
| Symbol `x` not in alphabet | Input contains symbol not on any edge | Add transition with that symbol, or fix input |
| Simulation shows no active states | NFA dead-ended (no valid path) | Expected for rejected strings |
| Can't drag to create edge | Not in Connect mode | Click **Add Transition** (no selection) to arm Connect mode |
| Label edit loses focus | Clicking outside input | Press `Enter` to commit, `Escape` to cancel |

---

## ♿ Accessibility

- **Keyboard navigable**: All actions reachable via Tab/Enter/Escape
- **Screen reader labels**: ARIA labels on all interactive elements
- **Live regions**: Simulation results announced via `aria-live="polite"`
- **Focus visible**: Custom focus rings on all interactive elements
- **Color contrast**: WCAG AA compliant in both light/dark (dark default)

---

## 📱 Mobile / Touch Support

| Interaction | Touch Equivalent |
|-------------|------------------|
| Pan | One-finger drag on background |
| Zoom | Pinch gesture |
| Select state | Tap |
| Multi-select | Long-press + tap |
| Drag-to-connect | Long-press handle → drag → release on target handle |
| Edit label | Double-tap label |

> **Note:** Touch experience is functional but optimized for desktop. Tablet with stylus works well.

---

## 🔗 Next Steps

- Read the [**Architecture Guide**](ARCHITECTURE.md) to understand the codebase internals
- Explore the **core engine** (`src/core/DFA.ts`, `src/core/NFA.ts`) for algorithm details
- Run tests with `npm run test:watch` to see the TDD suite in action