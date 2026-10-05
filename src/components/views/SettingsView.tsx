import type { ReactElement, ReactNode } from 'react';
import { useAutomataStore } from '../../store/useAutomataStore';
import { UserPreferences } from '../../store/useAutomataStore';

export function SettingsView(): ReactNode {
  const preferences = useAutomataStore((s) => s.preferences);
  const updatePreferences = useAutomataStore((s) => s.updatePreferences);

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'editor', label: 'Editor' },
    { id: 'simulation', label: 'Simulation' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'shortcuts', label: 'Shortcuts' },
    { id: 'advanced', label: 'Advanced' },
  ];

  const handleTabChange = (tabId: string) => {
    // Scroll or state management could go here
  };

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      {/* Tab navigation */}
      <div className="flex border-b border-gray-800 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id)}
            className={`
              px-4 py-2 rounded-t-md text-sm font-medium transition-colors duration-150
              ${preferences.theme === 'dark' ? 'text-gray-300 bg-gray-800' : 'text-gray-600 bg-gray-200'}
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1
              ${tab.id === 'general' ? 'border-b-2 border-indigo-600 text-indigo-400 bg-indigo-900/30' : 'border-b-2 border-transparent'}
            `
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content panels */}
      <div className="space-y-6">
        {/* General tab */}
        <div id="general" className="hidden">
          <h2 className="text-lg font-medium text-white mb-4">General</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">
                Theme
                <select
                  value={preferences.theme}
                  onChange={(e) => updatePreferences({ theme: e.target.value as 'dark' | 'light' | 'system' })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="system">System</option>
                </select>
              </label>
              <label className="block text-sm text-gray-300 mb-1.5">
                Auto-Save
                <input
                  type="checkbox"
                  checked={preferences.autoSave}
                  onChange={(e) =>
                    updatePreferences({ autoSave: e.target.checked })
                  }
                  className="w-4 h-4 rounded bg-indigo-600 cursor-pointer border-gray-600"
                />
              </label>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1.5">
                Show Grid
                <input
                  type="checkbox"
                  checked={preferences.showGrid}
                  onChange={(e) => updatePreferences({ showGrid: e.target.checked })}
                  className="w-4 h-4 rounded bg-indigo-600 cursor-pointer border-gray-600"
                />
              </label>
              <label className="block text-sm text-gray-300 mb-1.5">
                Snap to Grid
                <input
                  type="checkbox"
                  checked={preferences.snapToGrid}
                  onChange={(e) => updatePreferences({ snapToGrid: e.target.checked })}
                  className="w-4 h-4 rounded bg-indigo-600 cursor-pointer border-gray-600"
                />
              </label>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1.5">
                Animation Speed
                <input
                  type="number"
                  value={String(preferences.animationSpeed)}
                  onChange={(e) =>
                    updatePreferences({ animationSpeed: Number(e.target.value) })
                  }
                  min="0.1"
                  max="10"
                  step="0.1"
                  className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Editor tab */}
        <div id="editor" className="hidden">
          <h2 className="text-lg font-medium text-white mb-4">Editor</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">
                Font Size
                <input
                  type="number"
                  value={String(preferences.fontSize)}
                  onChange={(e =>
                    updatePreferences({ fontSize: Number(e.target.value) }))}
                  min="8"
                  max="24"
                  step="1"
                  className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </label>
              <label className="block text-sm text-gray-300 mb-1.5">
                Edge Curvature
                <input
                  type="number"
                  value={String(preferences.edgeCurvature)}
                  onChange={(e =>
                    updatePreferences({ edgeCurvature: Number(e.target.value) }))}
                  min="0"
                  max="1"
                  step="0.01"
                  className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </label>
              <label className="block text-sm text-gray-300 mb-1.5">
                Handle Size
                <input
                  type="number"
                  value={String(preferences.handleSize)}
                  onChange={(e =>
                    updatePreferences({ handleSize: Number(e.target.value) }))}
                  min="8"
                  max="24"
                  step="1"
                  className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </label>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1.5">
                Debug Mode
                <input
                  type="checkbox"
                  checked={preferences.debugMode}
                  onChange={(e => updatePreferences({ debugMode: e.target.checked }))}
                  className="w-4 h-4 rounded bg-indigo-600 cursor-pointer border-gray-600"
                />
              </label>
              <label className="block text-sm text-gray-300 mb-1.5">
                Telemetry
                <input
                  type="checkbox"
                  checked={preferences.telemetry}
                  onChange={(e => updatePreferences({ telemetry: e.target.checked }))}
                  className="w-4 h-4 rounded bg-indigo-600 cursor-pointer border-gray-600"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Simulation tab */}
        <div id="simulation" className="hidden">
          <h2 className="text-lg font-medium text-white mb-4">Simulation</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">
                Step Speed
                <input
                  type="number"
                  value={String(preferences.animationSpeed)}
                  onChange={(e =>
                    updatePreferences({ animationSpeed: Number(e.target.value) }))}
                  min="0.5"
                  max="5"
                  step="0.1"
                  className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </label>
              <label className="block text-sm text-gray-300 mb-1.5">
                Highlight Duration
                <input
                  type="number"
                  value={String(preferences.animationSpeed)}
                  onChange={(e =>
                    updatePreferences({ animationSpeed: Number(e.target.value) }))}
                  min="0.1"
                  max="5"
                  step="0.1"
                  className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </label>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1.5">
                Tape Visualization
                <select
                  className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus-border-transparent"
                >
                  <option value="lines">Lines</option>
                  <option value="colors">Color bands</option>
                  <option value="empty">Empty</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        {/* Appearance tab */}
        <div id="appearance" className="hidden">
          <h2 className="text-lg font-medium text-white mb-4">Appearance</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">
                Density
                <select
                  className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="comfortable">Comfortable</option>
                  <option value="compact">Compact</option>
                </select>
              </label>
              <label className="block text-sm text-gray-300 mb-1.5">
                Accent Color
                <select
                  className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="indigo">Indigo</option>
                  <option value="teal">Teal</option>
                  <option value="amber">Amber</option>
                </select>
              </label>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1.5">
                Animations
                <select
                  className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="enabled">Enabled</option>
                  <option value="reduced">Reduced Motion</option>
                  <option value="disabled">Disabled</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        {/* Shortcuts tab */}
        <div id="shortcuts" className="hidden">
          <h2 className="text-lg font-medium text-white mb-4">Shortcuts</h2>
          <p className="text-sm text-gray-500 mb-4">
            Customizable keyboard shortcuts coming soon. Current shortcuts are managed
            by the application and cannot be modified at this time.
          </p>
          <div className="bg-gray-800 p-4 rounded-md border border-gray-700">
            <p className="text-xs text-gray-400">No custom shortcuts defined</p>
          </div>
        </div>

        {/* Advanced tab */}
        <div id="advanced" className="hidden">
          <h2 className="text-lg font-medium text-white mb-4">Advanced</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">
                Debug Mode
                <input
                  type="checkbox"
                  checked={preferences.debugMode}
                  onChange={(e) => updatePreferences({ debugMode: e.target.checked })}
                  className="w-4 h-4 rounded bg-indigo-600 cursor-pointer border-gray-600"
                />
              </label>
              <p className="text-sm text-gray-400 mt-1">
                Enable debug logging and additional diagnostics.
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-2">
                Reset all preferences and cached data?
              </p>
              <button
                type="button"
                onClick={() => updatePreferences({ debugMode: true })} // placeholder
                className="px-4 py-1.5 rounded-md bg-red-600 text-white text-sm hover:bg-red-500 transition-colors"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}