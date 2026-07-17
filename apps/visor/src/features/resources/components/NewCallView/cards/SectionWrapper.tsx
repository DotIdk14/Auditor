import type { ReactNode } from 'react';
import type { SectionMeta } from '../../../types';

interface Props {
  meta: SectionMeta;
  darkMode: boolean;
  currentBlockIndex: number;
  totalBlocks: number;
  children: ReactNode;
  footer?: ReactNode;
}

export function SectionWrapper({ meta, darkMode, currentBlockIndex, totalBlocks, children, footer }: Props) {
  return (
    <div className="space-y-4">
      {/* Compact header */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${darkMode ? 'bg-zinc-900/50 border-white/5' : 'bg-white/50 border-stone-200'}`}>
        <span className="text-base shrink-0">{meta.icon}</span>
        <h3 className={`text-[11px] font-bold font-display truncate ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
          {meta.title}
        </h3>
        {totalBlocks > 0 && (
          <div className="flex items-center gap-1.5 ml-auto shrink-0">
            <div className="flex gap-0.5">
              {Array.from({ length: totalBlocks }).map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full ${
                  i <= currentBlockIndex
                    ? 'bg-amber-500'
                    : darkMode ? 'bg-stone-700' : 'bg-stone-300'
                }`} />
              ))}
            </div>
            <span className={`text-[9px] font-bold ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
              {Math.round(((currentBlockIndex + 1) / totalBlocks) * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Children (blocks) */}
      <div className="space-y-4">
        {children}
      </div>

      {/* Footer */}
      {footer}
    </div>
  );
}
