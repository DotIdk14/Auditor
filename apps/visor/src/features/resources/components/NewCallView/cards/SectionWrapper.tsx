import type { ReactNode } from 'react';
import type { SectionMeta } from '../../../types';
import { Target, Clock, AlertTriangle } from 'lucide-react';

interface Props {
  meta: SectionMeta;
  darkMode: boolean;
  currentBlockIndex: number;
  totalBlocks: number;
  children: ReactNode;
  footer?: ReactNode;
}

const IMPACT_COLORS = {
  bajo: { light: 'bg-stone-100 text-stone-500', dark: 'bg-stone-800 text-stone-400' },
  medio: { light: 'bg-blue-100 text-blue-700', dark: 'bg-blue-900/30 text-blue-400' },
  alto: { light: 'bg-amber-100 text-amber-700', dark: 'bg-amber-900/30 text-amber-400' },
  critico: { light: 'bg-red-100 text-red-700', dark: 'bg-red-900/30 text-red-400' },
};

export function SectionWrapper({ meta, darkMode, currentBlockIndex, totalBlocks, children, footer }: Props) {
  const impact = IMPACT_COLORS[meta.impactLevel];

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'}`}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xl">{meta.icon}</span>
          <div className="flex-1">
            <h3 className={`text-xs font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
              {meta.title}
            </h3>
            <p className={`text-[9px] mt-0.5 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
              {meta.subtitle}
            </p>
          </div>
          <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${darkMode ? impact.dark : impact.light}`}>
            {meta.impactLevel.toUpperCase()}
          </span>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className={`inline-flex items-center gap-1 text-[8px] font-bold px-2 py-0.5 rounded-full ${
            darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'
          }`}>
            <Target className="w-2.5 h-2.5" />
            {meta.objective}
          </span>
          <span className={`inline-flex items-center gap-1 text-[8px] font-bold px-2 py-0.5 rounded-full ${
            darkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-700'
          }`}>
            🎯 {meta.targetEmotion}
          </span>
          <span className={`inline-flex items-center gap-1 text-[8px] font-bold px-2 py-0.5 rounded-full ${
            darkMode ? 'bg-stone-800 text-stone-400' : 'bg-stone-100 text-stone-500'
          }`}>
            <Clock className="w-2.5 h-2.5" />
            ~{meta.estimatedMinutes} min
          </span>
        </div>

        {/* Required info */}
        {meta.requiredInfo.length > 0 && (
          <div className={`p-2 rounded-xl ${darkMode ? 'bg-[#24211e]' : 'bg-stone-50'}`}>
            <p className={`text-[8px] font-bold mb-1 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              INFORMACIÓN REQUERIDA
            </p>
            <div className="flex flex-wrap gap-1">
              {meta.requiredInfo.map((info, i) => (
                <span key={i} className={`text-[8px] px-2 py-0.5 rounded-full ${
                  darkMode ? 'bg-stone-800 text-stone-500' : 'bg-stone-100 text-stone-400'
                }`}>
                  {info}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Progress */}
        {totalBlocks > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[8px] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                Bloque {currentBlockIndex + 1} de {totalBlocks}
              </span>
              <span className={`text-[8px] font-bold ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                {Math.round(((currentBlockIndex + 1) / totalBlocks) * 100)}%
              </span>
            </div>
            <div className={`h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-[#24211e]' : 'bg-stone-100'}`}>
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${((currentBlockIndex + 1) / totalBlocks) * 100}%` }}
              />
            </div>
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
