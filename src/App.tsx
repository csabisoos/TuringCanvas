import type { ReactElement } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { Topbar } from './components/ui/Topbar';
import { Sidebar } from './components/ui/Sidebar';
import { AutomataCanvas } from './components/canvas/AutomataCanvas';

function App(): ReactElement {
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

          <main className="flex-1 overflow-hidden">
            <AutomataCanvas />
          </main>
        </div>
      </ReactFlowProvider>
    </div>
  );
}

export default App;
