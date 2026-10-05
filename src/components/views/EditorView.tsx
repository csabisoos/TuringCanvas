import type { ReactElement, ReactNode } from 'react';
import { useAutomataStore } from '../../store/useAutomataStore';
import { ContentView } from '../../store/useAutomataStore';
import { EditorMode } from '../../store/useAutomataStore';

import { Topbar } from '../ui/Topbar';
import { AppSidebar } from '../ui/AppSidebar';
import { AutomataCanvas } from '../canvas/AutomataCanvas';

export function EditorView(): ReactNode {
  const contentView = useAutomataStore((s) => s.contentView);
  const setContentView = useAutomataStore((s) => s.setContentView);
  const editorMode = useAutomataStore((s) => s.editorMode);
  const setEditorMode = useAutomataStore((s) => s.setEditorMode);
  const sidebarCollapsed = useAutomataStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAutomataStore((s) => s.toggleSidebar);
  const nodes = useAutomataStore((s) => s.nodes);
  const edges = useAutomataStore((s) => s.edges);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col overflow-hidden">
      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <Topbar />

      {/* ── Body: sidebar + canvas ───────────────────────────────────────── */}
      <div className="flex overflow-hidden">
        {/* Persistent sidebar (always visible in editor mode) */}
        <AppSidebar />

        <main className="flex-1 flex flex-col overflow-hidden">
          <AutomataCanvas />

          {/* Mode toggle at bottom of canvas area */}
          <div className="border-t border-gray-800 bg-gray-900 p-3 flex items-center justify-end">
            <button
              type="button"
              onClick={() => setEditorMode(editorMode === 'edit' ? 'simulate' : 'edit')}
              className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors duration-150"
              aria-label="Switch to edit mode"
            >
              {editorMode === 'edit' ? 'Switch to Simulate' : 'Switch to Edit'}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}