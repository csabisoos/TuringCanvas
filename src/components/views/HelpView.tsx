import type { ReactElement, ReactNode } from 'react';
import { useAutomataStore } from '../../store/useAutomataStore';

export function HelpView(): ReactNode {
  const returnToMenu = useAutomataStore((s) => s.returnToMenu);

  const aboutInfo = {
    title: 'TuringCanvas',
    version: '0.1.0',
    description: 'JFLAP-style automata simulator built with React and TypeScript',
    repository: 'https://github.com/csabisoos/TuringCanvas',
  };

  const keyboardShortcuts = [
    { key: 'Ctrl/Cmd + N', action: 'New File' },
    { key: 'Ctrl/Cmd + O', action: 'Open File' },
    { key: 'Ctrl/Cmd + S', action: 'Save File' },
    { key: 'F', action: 'Focus Canvas' },
    { key: 'Esc', action: 'Exit Focus / Clear Selection' },
    { key: 'Space', action: 'Start/Stop Simulation' },
    { key: 'Arrow Right', action: 'Step Forward' },
    { key: 'Backspace', action: 'Reset Simulation' },
  ];

  const helpSections = [
    {
      title: 'Keyboard Shortcuts',
      items: keyboardShortcuts,
    },
    {
      title: 'About',
      items: [
        { label: 'TuringCanvas', href: aboutInfo.repository, description: 'JFLAP-style automata simulator' },
        { label: 'Version', href: undefined, description: aboutInfo.version },
        { label: 'License', href: undefined, description: 'MIT' },
      ],
    },
  ];

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      {/* Header / About section */}
      <div className="mb-8 border-b border-gray-800 pb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-sm"
            role="img"
            aria-label="TuringCanvas logo"
          >
            TC
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              TuringCanvas
            </h1>
            <p className="text-gray-400">v{aboutInfo.version}</p>
          </div>
        </div>
      </div>

      {/* Help sections */}
      <div className="space-y-8">
        {helpSections.map((section) => (
          <section key={section.title} className="hidden">
            <h2 className="text-lg font-medium text-white mb-4">
              {section.title}
            </h2>
            <div className="space-y-4">
              {section.items.map((item) => {
                if (item.href) {
                  return (
                    <div key={item.label} className="flex items-center gap-2">
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        {item.label}
                      </a>
                      <span className="text-gray-500 text-sm">— {item.description}</span>
                    </div>
                  );
                }
                return (
                  <div key={item.label} className="flex items-center gap-2">
                    <span className="text-gray-400">
                      <kbd className="px-1 py-0.5 rounded text-xs bg-gray-800 text-white">
                        {item.key}
                      </kbd>
                    </span>
                    <span className="text-gray-400 text-sm">— {item.description}</span>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Return to menu button */}
      <div className="mt-8 text-center">
        <button
          type="button"
          onClick={() => returnToMenu(false)}
          className="px-6 py-2 rounded-md bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-500 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}