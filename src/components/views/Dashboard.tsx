import type { ReactElement, ReactNode } from 'react';
import { useAutomataStore } from '../../store/useAutomataStore';
import { ContentView, MachineType } from '../../store/useAutomataStore';
import { getMachineTypesByCategory, getImplementedMachineTypes, MACHINE_TYPES } from '../../types/machineTypes';

const CATEGORIES_ORDER: ('automata' | 'machines' | 'formal-languages' | 'analysis')[] = [
  'automata',
  'machines',
  'formal-languages',
  'analysis',
];

export function Dashboard(): ReactNode {
  const setContentView = useAutomataStore((s) => s.setContentView);

  const implemented = getImplementedMachineTypes();
  const byCategory = getMachineTypesByCategory;

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
          const types = byCategory(category);
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
                      onClick={() => setContentView('editor')}
                      type={t.type as MachineType}
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
                      onClick={() => setContentView('editor')}
                      type={t.type as MachineType}
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
          <div className="space-y-1 text-sm text-gray-500">
            <span className="line-through text-gray-500/50">even-length-strings.jff</span>
            <span className="line-through text-gray-500/50">palindrome-checker.jff</span>
            <span className="line-through text-gray-500/50">dfa-minimization.jff</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-sm font-medium uppercase tracking-wider text-gray-400 mb-2">Quick Actions</h3>
          <div className="flex gap-2 justify-center flex-wrap">
            <button
              type="button"
              onClick={() => setContentView('editor')}
              className="px-4 py-2 rounded-md bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-500 transition-colors"
            >
              New
            </button>
            <button
              type="button"
              onClick={() => setContentView('editor')}
              className="px-4 py-2 rounded-md bg-gray-800 text-gray-300 font-medium text-sm hover:bg-gray-700 transition-colors"
            >
              Open
            </button>
            <button
              type="button"
              onClick={() => setContentView('editor')}
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
  type?: MachineType;
  comingSoon?: boolean;
}

function MachineTypeCard({
  title,
  description,
  icon,
  onClick,
  type,
  comingSoon = false,
}: MachineTypeCardProps): ReactElement {
  const badgeClassName = comingSoon
    ? 'absolute -top-1 -right-1 rounded-full bg-red-500 text-xs text-white px-1.5 py-0.5 font-medium'
    : '';

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
      <span className="w-10 h-10 shrink-0 flex items-center justify-center rounded-lg bg-indigo-950/50 border border-indigo-800 text-indigo-400 {badgeClassName}" aria-hidden="true">
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