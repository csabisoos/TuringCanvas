import { useState, type ReactElement } from 'react';
import type { NodeProps } from '@xyflow/react';
import { useAutomataStore } from '../../store/useAutomataStore';
import type { AnnotationColor } from '../../types/ui';

export interface AnnotationNodeData {
  text: string;
  color?: AnnotationColor;
  [key: string]: unknown;
}

const COLOR_STYLES: Record<
  AnnotationColor,
  { bg: string; border: string; text: string; dot: string }
> = {
  yellow: {
    bg: 'bg-amber-950/80',
    border: 'border-amber-600/70',
    text: 'text-amber-100',
    dot: 'bg-amber-400',
  },
  blue: {
    bg: 'bg-sky-950/80',
    border: 'border-sky-600/70',
    text: 'text-sky-100',
    dot: 'bg-sky-400',
  },
  green: {
    bg: 'bg-emerald-950/80',
    border: 'border-emerald-600/70',
    text: 'text-emerald-100',
    dot: 'bg-emerald-400',
  },
  purple: {
    bg: 'bg-purple-950/80',
    border: 'border-purple-600/70',
    text: 'text-purple-100',
    dot: 'bg-purple-400',
  },
};

export function AnnotationNode({ id, data }: NodeProps): ReactElement {
  const updateAnnotation = useAutomataStore((s) => s.updateAnnotation);
  const deleteAnnotation = useAutomataStore((s) => s.deleteAnnotation);

  const rawData = data as AnnotationNodeData;
  const colorKey: AnnotationColor = rawData.color ?? 'yellow';
  const style = COLOR_STYLES[colorKey];

  const [text, setText] = useState<string>(rawData.text);
  const [isEditing, setIsEditing] = useState(false);

  const handleBlur = (): void => {
    setIsEditing(false);
    updateAnnotation(id, { text });
  };

  const handleColorChange = (newColor: AnnotationColor): void => {
    updateAnnotation(id, { color: newColor });
  };

  return (
    <div
      className={`min-w-44 max-w-72 rounded-xl border shadow-lg backdrop-blur-md p-3 flex flex-col gap-2 transition-all ${style.bg} ${style.border}`}
    >
      {/* Header bar: drag handle, color palette, delete */}
      <div className="flex items-center justify-between border-b border-white/10 pb-1.5 drag-handle cursor-grab">
        <div className="flex items-center gap-1.5">
          {(['yellow', 'blue', 'green', 'purple'] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => { handleColorChange(c); }}
              className={`w-3 h-3 rounded-full ${COLOR_STYLES[c].dot} hover:scale-125 transition-transform cursor-pointer ${
                colorKey === c ? 'ring-2 ring-white/60' : 'opacity-60'
              }`}
              title={`${c} note`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => { deleteAnnotation(id); }}
          className="text-white/40 hover:text-white text-xs px-1 cursor-pointer"
          title="Delete Note"
        >
          ✕
        </button>
      </div>

      {/* Note Body */}
      {isEditing ? (
        <textarea
          autoFocus
          value={text}
          onChange={(e) => { setText(e.target.value); }}
          onBlur={handleBlur}
          className={`w-full bg-transparent resize-none focus:outline-none font-sans text-xs leading-relaxed ${style.text}`}
          rows={3}
        />
      ) : (
        <div
          onClick={() => { setIsEditing(true); }}
          className={`font-sans text-xs leading-relaxed min-h-8 cursor-text select-text whitespace-pre-wrap ${style.text}`}
        >
          {text || <span className="opacity-40 italic">Click to write note...</span>}
        </div>
      )}
    </div>
  );
}
