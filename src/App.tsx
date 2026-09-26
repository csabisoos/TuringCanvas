import type { ReactElement } from 'react';
import { Topbar } from './components/ui/Topbar';
import { Sidebar } from './components/ui/Sidebar';
import { AutomataCanvas } from './components/canvas/AutomataCanvas';

function App(): ReactElement {
  return (
    <div className="h-screen bg-gray-950 text-gray-100 flex flex-col overflow-hidden">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <Topbar />

      {/* ── Body: sidebar + canvas ──────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-hidden">
          <AutomataCanvas />
        </main>
      </div>
    </div>
  );
}

export default App;
