import type { ReactElement } from 'react';
import { useAutomataStore } from '../../store/useAutomataStore';
import { AppSidebar } from '../AppSidebar';

export function Topbar(): ReactElement {
  const sidebarCollapsed = useAutomataStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAutomataStore((s) => s.toggleSidebar);

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

      {/* Spacer / quick help hint */}
      <div className="flex-1" />
    </header>
  );
}