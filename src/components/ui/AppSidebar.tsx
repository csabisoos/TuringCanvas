import type { ReactElement, ReactNode } from 'react';
import { useAutomataStore } from '../../store/useAutomataStore';
import { ContentView } from '../../store/useAutomataStore';

type NavSection =
  | 'dashboard'
  | 'file'
  | 'edit'
  | 'machines'
  | 'tools'
  | 'settings'
  | 'help';

interface NavItem {
  id: NavSection;
  label: string;
  icon: ReactElement;
  badge?: string;
  shortcut?: string;
}

const NAV_ITEMS: NavItem[] = [
  // Dashboard section
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg
        width="16"
        height="16"
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
    ),
  },
  // File section
  {
    id: 'file',
    label: 'File',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 4h18" />
        <path d="M3 8h18" />
        <path d="M3 12h18" />
        <path d="M3 16h18" />
        <path d="M3 20h18" />
      </svg>
    ),
  },
  // Edit section
  {
    id: 'edit',
    label: 'Edit',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      </svg>
    ),
  },
  // Machine Types section
  {
    id: 'machines',
    label: 'Machine Types',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8" cy="12" r="5" />
        <circle cx="16" cy="12" r="5" />
        <line x1="23" y1="9" x2="15" y2="15" />
        <line x1="17" y1="9" x2="15" y2="15" />
      </svg>
    ),
  },
  // Tools section
  {
    id: 'tools',
    label: 'Tools',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 3h2l5 14a2 2 0 0 0 2 1.5h5a2 2 0 0 0 2-1.5l5-14H5" />
      </svg>
    ),
  },
  // Settings section
  {
    id: 'settings',
    label: 'Settings',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0 .33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H3.75a1.65 1.65 0 0 0 1 1.51v.09a1.65 1.65 0 0 0 1 1.82 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82 1.65 1.65 0 0 0 1.51 1h.09a1.65 1.65 0 0 0 1-1.82 1.65 1.65 0 0 0-.33-1.82l.06-.06a2 2 0 0 1 2-2hz" />
      </svg>
    ),
  },
  // Help section
  {
    id: 'help',
    label: 'Help',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M14.7 6.3a1.5 1.5 0 0 0 0 2.12l-.32.32a1.5 1.5 0 1 1-2.12-2.12l.33-.33a1.5 1.5 0 0 1 2.12 0z" />
        <line x1="17" y1="11" x2="21" y2="15" />
        <line x1="17" y1="15" x2="21" y2="11" />
      </svg>
    ),
  },
];

export function AppSidebar(): ReactNode {
  const contentView = useAutomataStore((s) => s.contentView);
  const setContentView = useAutomataStore((s) => s.setContentView);
  const sidebarCollapsed = useAutomataStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAutomataStore((s) => s.toggleSidebar);

  const isActive = (section: NavSection) => contentView === section;

  return (
    <nav
      className="fixed left-0 top-0 bottom-0 w-64 bg-gray-900 text-gray-300 border-r border-gray-800 shadow-2xl transform -translate-x-full sm:translate-x-0 transition-transform duration-300 ease-in-out z-50"
      aria-label="Main navigation"
    >
      {/* Expanded / Collapsed toggle */}
      <div className="flex items-center gap-2 p-2 border-b border-gray-800 cursor-pointer hover:bg-gray-800" onClick={toggleSidebar} aria-label="Toggle sidebar">
        {sidebarCollapsed ? (
          <svg
            width="20"
            height="20"
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
            width="20"
            height="20"
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
      </div>

      {/* Logo */}
      <div className="flex items-center gap-2 px-3 pt-2 text-sm font-medium text-gray-400 sm:hidden">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 2L15 9l9 7-6 5-6-5 9-7z" />
          <path d="M15 9l-9 7 6 5 6-5z" />
        </svg>
        <span className="hidden sm:inline">TuringCanvas</span>
      </div>

      {/* Navigation Sections */}
      <div className="flex flex-col flex-1 space-y-1 px-1 pt-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setContentView(item.id as ContentView)}
            className={`
              flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150
              ${isActive(item.id) ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-900
            `}
            aria-pressed={isActive(item.id)}
            aria-label={item.label}
          >
            <item.icon />
            <span className="hidden sm:inline">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}