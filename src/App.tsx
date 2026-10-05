import type { ReactElement, ComponentType } from 'react';
import { useAutomataStore } from './store/useAutomataStore';
import { Topbar } from './components/ui/Topbar';
import { AppSidebar } from './components/ui/AppSidebar';
import { Dashboard } from './components/views/Dashboard';
import { EditorView } from './components/views/EditorView';
import { SettingsView } from './components/views/SettingsView';
import { HelpView } from './components/views/HelpView';

function App(): ReactElement {
  const contentView = useAutomataStore((s) => s.contentView);

  // Map contentView to the corresponding view component
  const viewComponents: Record<string, ComponentType> = {
    dashboard: Dashboard,
    editor: EditorView,
    settings: SettingsView,
    help: HelpView,
  };

  const ViewComponent = viewComponents[contentView] ?? viewComponents.dashboard;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col overflow-hidden">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <Topbar />

      {/* ── Body: sidebar + switchable content area ─────────────────────── */}
      <div className="flex overflow-hidden">
        {/* Persistent sidebar (always visible in editor mode) */}
        <AppSidebar />

        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Switchable content area based on contentView */}
          <ViewComponent />
        </main>
      </div>
    </div>
  );
}

export default App;