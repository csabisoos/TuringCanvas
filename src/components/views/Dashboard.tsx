import { useState, type ReactElement, type ReactNode } from 'react';
import { useAutomataStore } from '../../store/useAutomataStore';
import { getMachineTypesByCategory } from '../../types/machineTypes';
import { getRecentFiles, type RecentFile } from '../../core/io/recentFiles';
import type { MachineType } from '../../types/machineTypes';

const CATEGORIES_ORDER: ('automata' | 'machines' | 'formal-languages' | 'analysis')[] = [
  'automata',
  'machines',
  'formal-languages',
  'analysis',
];

export function Dashboard(): ReactNode {
  const openEditor = useAutomataStore((s) => s.openEditor);
  const setContentView = useAutomataStore((s) => s.setContentView);
  const openFile = useAutomataStore((s) => s.openFile);
  const deserialize = useAutomataStore((s) => s.deserialize);

  const [recentFiles] = useState<RecentFile[]>(() => getRecentFiles());

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <header className="mb-12 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-sm select-none"
            role="img"
            aria-label="TuringCanvas logo"
          >
            TC
          </div>
          <span className="text-2xl font-semibold tracking-tight text-white">
            TuringCanvas
          </span>
        </div>
        <p className="text-gray-400 text-lg max-w-md mx-auto">
          Choose a machine type to begin
        </p>
      </header>

      {/* Machine type cards grouped by category */}
      <main className="w-full max-w-2xl space-y-4">
        {CATEGORIES_ORDER.map((category) => {
          const types = getMachineTypesByCategory(category);
          if (types.length === 0) return null;

          const implementedInCat = types.filter((t) => !t.comingSoon);
          const comingSoonInCat = types.filter((t) => t.comingSoon);

          return (
            <section key={category} className="border-b border-gray-800 pb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-2">
                {category}
              </h2>

              {/* Implemented types */}
              {implementedInCat.length > 0 && (
                <div className="space-y-2">
                  {implementedInCat.map((t) => (
                    <MachineTypeCard
                      key={t.type}
                      title={t.title}
                      description={t.description}
                      icon={t.icon}
                      onClick={() => { openEditor(t.type); }}
                    />
                  ))}
                </div>
              )}

              {/* Coming soon types */}
              {comingSoonInCat.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-700">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Coming soon
                  </p>
                  {comingSoonInCat.map((t) => (
                    <MachineTypeCard
                      key={t.type}
                      title={t.title}
                      description={t.description}
                      icon={t.icon}
                      onClick={() => { openEditor(t.type); }}
                      comingSoon
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </main>

      {/* Recent Files and Quick Actions */}
      <footer className="mt-8 w-full max-w-2xl space-y-4 text-center">
        {/* Recent Files */}
        <div>
          <h3 className="text-sm font-medium uppercase tracking-wider text-gray-400 mb-2">Recent Files</h3>
          {recentFiles.length > 0 ? (
            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
              {recentFiles.map((rf) => (
                <div
                  key={rf.id}
                  onClick={() => {
                    deserialize(rf.json);
                    openEditor((rf.machineType || 'fa') as MachineType);
                  }}
                  className="p-2.5 bg-gray-900 hover:bg-gray-800 rounded-lg border border-gray-800 flex items-center justify-between text-xs cursor-pointer transition-colors"
                >
                  <span className="text-white font-medium">{rf.name}</span>
                  <span className="text-gray-400 font-mono text-[11px]">
                    {rf.nodeCount} states • {new Date(rf.lastModified).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">No recently saved or opened files yet.</p>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-sm font-medium uppercase tracking-wider text-gray-400 mb-2">Quick Actions</h3>
          <div className="flex gap-2 justify-center flex-wrap">
            <button
              type="button"
              onClick={() => { setContentView('editor'); }}
              className="px-4 py-2 rounded-md bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-500 transition-colors"
            >
              New
            </button>
            <button
              type="button"
              onClick={() => { void openFile(); }}
              className="px-4 py-2 rounded-md bg-gray-800 text-gray-300 font-medium text-sm hover:bg-gray-700 transition-colors"
            >
              Open
            </button>
            <button
              type="button"
              onClick={() => { setContentView('editor'); }}
              className="px-4 py-2 rounded-md bg-gray-800 text-gray-300 font-medium text-sm hover:bg-gray-700 transition-colors"
            >
              Examples
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Machine Type Card ────────────────────────────────────────────────────────
interface MachineTypeCardProps {
  title: string;
  description: string;
  icon: ReactElement;
  onClick: () => void;
  comingSoon?: boolean;
}

function MachineTypeCard({
  title,
  description,
  icon,
  onClick,
  comingSoon = false,
}: MachineTypeCardProps): ReactElement {

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-150',
        'bg-gray-900 border-gray-800',
        'hover:border-indigo-500 hover:bg-gray-800 hover:shadow-lg hover:shadow-indigo-500/10',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950',
        'text-left select-none',
      ].join(' ')}
      aria-label={title}
    >
      <span className="w-10 h-10 shrink-0 flex items-center justify-center rounded-lg bg-indigo-950/50 border border-indigo-800 text-indigo-400 relative" aria-hidden="true">
        {icon}
        {comingSoon && (
          <span className="absolute -top-1 -right-1 rounded-full bg-red-500 text-xs text-white px-1.5 py-0.5 font-medium">coming Soon</span>
        )}
      </span>
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-medium text-white truncate">{title}</h3>
        <p className="text-sm text-gray-400 truncate mt-0.5">{description}</p>
      </div>
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-gray-500 shrink-0"
        aria-hidden="true"
      >
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </button>
  );
}