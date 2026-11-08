import { useState, useEffect, type ReactElement } from 'react';
import { useAutomataStore } from '../../store/useAutomataStore';

export function BatchTestModal(): ReactElement | null {
  const isOpen = useAutomataStore((s) => s.isBatchModalOpen);
  const setOpen = useAutomataStore((s) => s.setBatchModalOpen);
  const testCases = useAutomataStore((s) => s.testCases);
  const addTestCase = useAutomataStore((s) => s.addTestCase);
  const removeTestCase = useAutomataStore((s) => s.removeTestCase);
  const updateTestCase = useAutomataStore((s) => s.updateTestCase);
  const clearTestCases = useAutomataStore((s) => s.clearTestCases);
  const runAllTestCases = useAutomataStore((s) => s.runAllTestCases);
  const hasNodes = useAutomataStore((s) => s.nodes.length > 0);

  const [newInput, setNewInput] = useState('');
  const [newExpected, setNewExpected] = useState<'accept' | 'reject' | 'any'>('any');
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape' && isOpen) {
        setOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, setOpen]);

  if (!isOpen) return null;

  const testedCases = testCases.filter((tc) => tc.actual !== undefined);
  const passedCount = testedCases.filter((tc) => tc.passed).length;
  const passRate = testedCases.length > 0 ? Math.round((passedCount / testedCases.length) * 100) : 0;

  function handleAddRow(): void {
    addTestCase(newInput, newExpected === 'any' ? undefined : newExpected);
    setNewInput('');
  }

  function handleImport(): void {
    const lines = importText.split('\n');
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      const parts = line.split(',');
      const input = (parts[0] ?? '').trim();
      const expectedRaw = (parts[1] ?? '').trim().toLowerCase();
      const expected = expectedRaw === 'accept' ? 'accept' : expectedRaw === 'reject' ? 'reject' : undefined;
      addTestCase(input, expected);
    }
    setImportText('');
    setShowImport(false);
  }

  function handleExport(): void {
    const csvContent = testCases
      .map((tc) => `${tc.input},${tc.expected ?? ''},${tc.actual ?? ''},${tc.passed ? 'pass' : 'fail'}`)
      .join('\n');
    const blob = new Blob([`Input,Expected,Actual,Status\n${csvContent}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'test_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="batch-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
    >
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-gray-900/80">
          <div className="flex items-center gap-3">
            <h2 id="batch-modal-title" className="text-base font-semibold text-white">
              Multiple Run (Batch Testing)
            </h2>
            {testedCases.length > 0 && (
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  passRate === 100
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}
              >
                {passedCount} / {testedCases.length} Passed ({passRate}%)
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => { setOpen(false); }}
            aria-label="Close batch test modal"
            className="text-gray-400 hover:text-white rounded-md p-1 transition-colors hover:bg-gray-800"
          >
            ✕
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-5 py-3 bg-gray-950/60 border-b border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={runAllTestCases}
              disabled={testCases.length === 0 || !hasNodes}
              className="px-3 py-1.5 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              ▶ Run All
            </button>
            <button
              type="button"
              onClick={() => { setShowImport(!showImport); }}
              className="px-3 py-1.5 rounded-md bg-gray-800 text-gray-300 font-medium hover:bg-gray-700 hover:text-white transition-colors cursor-pointer"
            >
              {showImport ? 'Hide Import' : 'Import List'}
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={testCases.length === 0}
              className="px-3 py-1.5 rounded-md bg-gray-800 text-gray-300 font-medium hover:bg-gray-700 hover:text-white disabled:opacity-40 transition-colors cursor-pointer"
            >
              Export CSV
            </button>
          </div>
          <button
            type="button"
            onClick={clearTestCases}
            disabled={testCases.length === 0}
            className="px-2.5 py-1.5 rounded-md text-red-400 hover:bg-red-950/40 disabled:opacity-40 transition-colors cursor-pointer"
          >
            Clear All
          </button>
        </div>

        {/* Import Panel */}
        {showImport && (
          <div className="p-4 bg-gray-950 border-b border-gray-800 flex flex-col gap-2">
            <p className="text-xs text-gray-400">
              Enter one test string per line, optionally followed by comma and expected outcome (e.g. <code className="text-indigo-300 font-mono">aabb,accept</code>):
            </p>
            <textarea
              value={importText}
              onChange={(e) => { setImportText(e.target.value); }}
              placeholder="a,accept&#10;b,reject&#10;aa&#10;ab,reject"
              rows={4}
              className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 font-mono text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleImport}
                disabled={!importText.trim()}
                className="px-3 py-1 rounded bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 disabled:opacity-40"
              >
                Import
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-y-auto p-5">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400">
                <th className="pb-2 font-medium w-12">#</th>
                <th className="pb-2 font-medium">Input String</th>
                <th className="pb-2 font-medium w-32">Expected</th>
                <th className="pb-2 font-medium w-28">Actual</th>
                <th className="pb-2 font-medium w-24">Status</th>
                <th className="pb-2 font-medium w-16 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-mono">
              {testCases.map((tc, idx) => (
                <tr key={tc.id} className="hover:bg-gray-800/30">
                  <td className="py-2.5 text-gray-500">{idx + 1}</td>
                  <td className="py-2.5">
                    <input
                      type="text"
                      value={tc.input}
                      onChange={(e) => { updateTestCase(tc.id, { input: e.target.value }); }}
                      placeholder="ε"
                      className="bg-transparent border-b border-transparent hover:border-gray-700 focus:border-indigo-500 px-1 py-0.5 text-indigo-200 font-semibold focus:outline-none w-full"
                    />
                  </td>
                  <td className="py-2.5">
                    <select
                      value={tc.expected ?? 'any'}
                      onChange={(e) => {
                        const val = e.target.value as 'accept' | 'reject' | 'any';
                        updateTestCase(tc.id, { expected: val === 'any' ? undefined : val });
                      }}
                      className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="any">Any</option>
                      <option value="accept">Accept</option>
                      <option value="reject">Reject</option>
                    </select>
                  </td>
                  <td className="py-2.5">
                    {tc.actual === 'accept' && (
                      <span className="text-emerald-400 font-semibold">Accept</span>
                    )}
                    {tc.actual === 'reject' && (
                      <span className="text-red-400 font-semibold">Reject</span>
                    )}
                    {tc.actual === 'error' && (
                      <span className="text-amber-400 text-[11px]" title={tc.errorMessage}>
                        Error ⚠
                      </span>
                    )}
                    {tc.actual === undefined && <span className="text-gray-600">—</span>}
                  </td>
                  <td className="py-2.5">
                    {tc.actual !== undefined && (
                      tc.passed ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-xs">
                          ✓ Pass
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-400 font-bold text-xs">
                          ✗ Fail
                        </span>
                      )
                    )}
                    {tc.actual === undefined && <span className="text-gray-600">—</span>}
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => { removeTestCase(tc.id); }}
                      aria-label="Remove test case"
                      className="text-gray-500 hover:text-red-400 transition-colors p-1"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}

              {/* Add row row */}
              <tr className="bg-gray-950/30">
                <td className="py-2 text-gray-600">+</td>
                <td className="py-2">
                  <input
                    type="text"
                    value={newInput}
                    onChange={(e) => { setNewInput(e.target.value); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddRow(); }}
                    placeholder="New test input (e.g. 010)"
                    className="bg-gray-800/80 border border-gray-700/80 rounded px-2 py-1 text-gray-200 text-xs w-full focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </td>
                <td className="py-2">
                  <select
                    value={newExpected}
                    onChange={(e) => { setNewExpected(e.target.value as 'accept' | 'reject' | 'any'); }}
                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="any">Any</option>
                    <option value="accept">Accept</option>
                    <option value="reject">Reject</option>
                  </select>
                </td>
                <td colSpan={2} />
                <td className="py-2 text-right">
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="px-2.5 py-1 rounded bg-indigo-600 text-white font-medium text-xs hover:bg-indigo-500 transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-800 bg-gray-900/80 flex items-center justify-between">
          <div className="text-xs text-gray-400">
            {testCases.length} total test case{testCases.length === 1 ? '' : 's'}
          </div>
          <button
            type="button"
            onClick={() => { setOpen(false); }}
            className="px-4 py-2 rounded-md bg-gray-800 text-gray-300 font-medium text-xs hover:bg-gray-700 hover:text-white transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
