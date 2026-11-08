import { useState, useEffect, type ReactElement } from 'react';
import { useAutomataStore } from '../../store/useAutomataStore';

export function ExportLatexModal(): ReactElement | null {
  const isOpen = useAutomataStore((s) => s.isLatexModalOpen);
  const latexCode = useAutomataStore((s) => s.latexCode);
  const close = useAutomataStore((s) => s.closeLatexModal);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(latexCode);
      setCopied(true);
      setTimeout(() => { setCopied(false); }, 2000);
    } catch {
      // Ignore clipboard write failures gracefully
      setCopied(false);
    }
  }

  function handleDownload(): void {
    const blob = new Blob([latexCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'automaton.tex';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="latex-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
    >
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-gray-900/80">
          <div className="flex items-center gap-2">
            <h2 id="latex-modal-title" className="text-base font-semibold text-white">
              Export LaTeX / TikZ
            </h2>
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
              automata
            </span>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close LaTeX modal"
            className="text-gray-400 hover:text-white rounded-md p-1 transition-colors hover:bg-gray-800"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col gap-3 overflow-hidden">
          <p className="text-xs text-gray-400">
            Copy or download this ready-to-compile TikZ snippet for your LaTeX paper or assignment.
          </p>
          <div className="flex-1 bg-gray-950 border border-gray-800 rounded-lg p-3 font-mono text-xs text-indigo-200 overflow-auto whitespace-pre select-all">
            {latexCode}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-800 bg-gray-900/80 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { void handleCopy(); }}
              className="px-4 py-2 rounded-md bg-indigo-600 text-white font-medium text-xs hover:bg-indigo-500 transition-colors shadow-sm cursor-pointer"
            >
              {copied ? '✓ Copied to Clipboard!' : 'Copy Code'}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2 rounded-md bg-gray-800 text-gray-200 font-medium text-xs hover:bg-gray-700 hover:text-white transition-colors cursor-pointer"
            >
              Download .tex
            </button>
          </div>
          <button
            type="button"
            onClick={close}
            className="px-4 py-2 rounded-md bg-gray-800 text-gray-400 font-medium text-xs hover:bg-gray-700 hover:text-white transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
