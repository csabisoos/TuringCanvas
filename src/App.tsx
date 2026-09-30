import type { ReactElement } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { useAutomataStore } from './store/useAutomataStore';
import { Topbar } from './components/ui/Topbar';
import { Sidebar } from './components/ui/Sidebar';
import { AutomataCanvas } from './components/canvas/AutomataCanvas';
import { MainMenu } from './components/ui/MainMenu';

function App(): ReactElement {
  const appView = useAutomataStore((s) => s.appView);

  if (appView === 'menu') {
    return <MainMenu />;
  }

  return (
    <div className="h-screen bg-gray-950 text-gray-100 flex flex-col overflow-hidden">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <Topbar />

      {/* ── Body: sidebar + canvas ──────────────────────────────────────── */}
      {/*
        ReactFlowProvider makes the RF internal store (node/edge selection,
        viewport, etc.) available to every component in this subtree —
        including Sidebar, which lives outside the <ReactFlow> element itself.
      */}
      <ReactFlowProvider>
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />

          <main className="flex-1 min-h-0 overflow-hidden">
            <AutomataCanvas />
          </main>
        </div>
      </ReactFlowProvider>
    </div>
  );
}

export default App;
