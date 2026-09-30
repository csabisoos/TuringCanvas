# TuringCanvas

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)
![React](https://img.shields.io/badge/React-19.3-61dafb.svg)
![Vite](https://img.shields.io/badge/Vite-8.3-646cff.svg)
![PWA](https://img.shields.io/badge/PWA-ready-purple.svg)

> A modern, offline-capable Progressive Web App (PWA) alternative to JFLAP for visualizing and simulating **finite automata** (DFA, NFA). Built with React, TypeScript, and a strict clean-architecture approach.

---

## 📖 Overview

**TuringCanvas** is an interactive, browser-based automata editor designed for students, educators, and researchers in formal language theory. It provides an intuitive graphical interface for constructing **Deterministic Finite Automata (DFA)** and **Nondeterministic Finite Automata (NFA)** with ε-transitions, and simulating them step-by-step on arbitrary input strings.

Unlike traditional desktop tools, TuringCanvas runs entirely in the browser, works **100% offline** after the first load, and requires no installation.

---

## ✨ Core Features

| Category | Features |
|----------|----------|
| **📱 Offline-First PWA** | Installable, works without network, cached via Service Worker (`vite-plugin-pwa`) |
| **🏗️ Clean Architecture** | Strict separation: pure mathematical core (`src/core`) ↔ UI/Canvas layer (`src/components/canvas`) |
| **🔄 Dual Editing Modes** | **Edit Mode** (construct graphs) / **Simulate Mode** (step-through execution) |
| **🎯 Interactive Graph UI** | Drag-to-place states, handle-based edge creation, inline label editing, double-circle accepting states, initial-state arrows |
| **⚙️ Mathematical Rigor** | Core engine enforces DFA/NFA invariants (unique initial state, determinism, ε-closure, subset construction) |
| **🔬 Test-Driven Development** | 100+ Vitest unit tests covering core logic, store actions, and simulation adapter |
| **💾 Persistence** | JSON serialization/deserialization for saving/loading automata |

---

## 🛠 Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Framework** | React 19, TypeScript 5.7 |
| **Build Tool** | Vite 8 |
| **Styling** | Tailwind CSS 4 |
| **State Management** | Zustand 5 |
| **Graph Visualization** | @xyflow/react (React Flow v12) |
| **Testing** | Vitest, @testing-library/react, jsdom |
| **PWA** | vite-plugin-pwa (Workbox) |
| **Linting/Format** | ESLint 10, Prettier 3, TypeScript ESLint |

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 20
- npm ≥ 10

### Installation & Development

```bash
# Clone the repository
git clone https://github.com/csabisoos/TuringCanvas.git
cd TuringCanvas

# Install dependencies
npm install

# Start development server (hot reload)
npm run dev
```

Open `http://localhost:5173` in your browser.

### Production Build & Preview

```bash
# Type-check + production build
npm run build

# Preview the production build locally
npm run preview
```

### Testing

```bash
# Run all unit tests once (CI mode)
npm run test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Linting & Formatting

```bash
# Check formatting and lint
npm run lint
npm run format:check

# Auto-fix linting and formatting issues
npm run lint:fix
npm run format
```

---

## 📚 Documentation

| Document | Audience | Description |
|----------|----------|-------------|
| [**User Guide**](docs/USER_GUIDE.md) | End-users (students, educators) | Complete manual for the interface, edit/simulate modes, and graph operations |
| [**Architecture Guide**](docs/ARCHITECTURE.md) | Developers, contributors | Technical deep-dive: separation of concerns, Zustand adapter pattern, TDD workflow |

---

## 🎓 Educational Use Case

TuringCanvas is designed for **university-level Theory of Computation** courses:

- **Construct** DFAs/NFAs visually for homework assignments
- **Simulate** strings step-by-step to trace acceptance/rejection
- **Convert** NFAs to equivalent DFAs (core engine implements Rabin-Scott powerset construction)
- **Export/Import** automata as JSON for sharing or grading

---

## 🤝 Contributing

Contributions are welcome! Please read the [Architecture Guide](docs/ARCHITECTURE.md) to understand the codebase structure before submitting PRs.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests and linting (`npm run test && npm run lint`)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 🔗 Links

- **Repository**: [github.com/csabisoos/TuringCanvas](https://github.com/csabisoos/TuringCanvas)
- **Issues**: [github.com/csabisoos/TuringCanvas/issues](https://github.com/csabisoos/TuringCanvas/issues)
- **Live Demo**: *(Deployed via GitHub Pages — see Actions workflow)*