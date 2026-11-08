import { useEffect, type ReactElement } from 'react';
import { useAutomataStore } from '../../store/useAutomataStore';
import { ValidationBadge } from './ValidationBadge';

export function Topbar(): ReactElement {
  const sidebarCollapsed = useAutomataStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAutomataStore((s) => s.toggleSidebar);
  const undo = useAutomataStore((s) => s.undo);
  const redo = useAutomataStore((s) => s.redo);
  const canUndo = useAutomataStore((s) => s.past.length > 0);
  const canRedo = useAutomataStore((s) => s.future.length > 0);
  const openFile = useAutomataStore((s) => s.openFile);
  const saveFile = useAutomataStore((s) => s.saveFile);
  const exportImage = useAutomataStore((s) => s.exportImage);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const isMac = navigator.userAgent.includes('Mac');
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (isCmdOrCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          if (canRedo) redo();
        } else {
          if (canUndo) undo();
        }
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        if (canRedo) redo();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo, canUndo, canRedo]);

  return (
    <header className="flex-none h-14 border-b border-gray-800 bg-gray-900 flex items-center px-4 gap-2 shadow-lg z-10">
      {/* Brand / Menu button */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-900"
        >
          {sidebarCollapsed ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          )}
        </button>
        <div
          className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center font-bold text-white text-xs select-none shrink-0"
          role="img"
          aria-label="TuringCanvas logo"
        >
          TC
        </div>
        <span className="text-base font-semibold tracking-tight text-white truncate">
          TuringCanvas
        </span>
      </div>

      {/* Undo / Redo buttons */}
      <div className="flex items-center gap-1 ml-4 border-l border-gray-800 pl-3">
        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          aria-label="Undo canvas action (Ctrl+Z)"
          title="Undo (Ctrl+Z)"
          className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 7v6h6" />
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
          </svg>
        </button>
        <button
          type="button"
          onClick={redo}
          disabled={!canRedo}
          aria-label="Redo canvas action (Ctrl+Y)"
          title="Redo (Ctrl+Y)"
          className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 7v6h-6" />
            <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
          </svg>
        </button>
      </div>

      {/* File & Export quick actions */}
      <div className="flex items-center gap-1.5 ml-3 border-l border-gray-800 pl-3">
        <button
          type="button"
          onClick={() => { void openFile(); }}
          className="px-2 py-1 text-xs rounded text-gray-300 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
          title="Open File (.json, .jff)"
        >
          Open
        </button>
        <button
          type="button"
          onClick={() => { void saveFile(); }}
          className="px-2 py-1 text-xs rounded text-gray-300 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
          title="Save File (.json)"
        >
          Save
        </button>
        <div className="w-px h-4 bg-gray-800 mx-0.5" />
        <button
          type="button"
          onClick={() => { exportImage('png'); }}
          className="px-2 py-1 text-xs rounded text-indigo-400 hover:text-indigo-300 hover:bg-gray-800 transition-colors cursor-pointer"
          title="Export high-res PNG"
        >
          PNG
        </button>
        <button
          type="button"
          onClick={() => { exportImage('svg'); }}
          className="px-2 py-1 text-xs rounded text-indigo-400 hover:text-indigo-300 hover:bg-gray-800 transition-colors cursor-pointer"
          title="Export vector SVG"
        >
          SVG
        </button>
      </div>

      {/* Spacer / quick help hint */}
      <div className="flex-1" />

      {/* Automaton Validation Diagnostic */}
      <ValidationBadge />
    </header>
  );
}