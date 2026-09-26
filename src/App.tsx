import type { ReactElement } from 'react';
import { AutomataCanvas } from './components/canvas/AutomataCanvas';

function App(): ReactElement {
  return (
    <div className="h-screen bg-gray-950 text-gray-100 flex flex-col overflow-hidden">
      <header className="flex-none border-b border-gray-800 bg-gray-900 shadow-lg">
        <div className="px-6 py-4 flex items-center gap-3">
          {/* Logo mark */}
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-sm select-none">
            TC
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-white">
            TuringCanvas
          </h1>
          <span className="ml-2 px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-400 text-xs font-medium border border-indigo-800">
            alpha
          </span>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <AutomataCanvas />
      </main>
    </div>
  );
}

export default App;
