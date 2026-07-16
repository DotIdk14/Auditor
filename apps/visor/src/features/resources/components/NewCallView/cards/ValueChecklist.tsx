import type { ValueCheckItem } from '../../../types';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface Props {
  items: ValueCheckItem[];
  darkMode: boolean;
  onToggle: (id: string) => void;
}

export function ValueChecklist({ items, darkMode, onToggle }: Props) {
  const checkedCount = items.filter(i => i.checked).length;
  const allChecked = checkedCount === items.length;

  return (
    <div className={`rounded-xl border p-5 ${darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-stone-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <p className={`text-[10px] font-bold ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
          📋 CHECKLIST DE VALOR PRECIO
        </p>
        <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
          allChecked
            ? darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
            : darkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-100 text-amber-700'
        }`}>
          {checkedCount}/{items.length}
        </span>
      </div>

      {!allChecked && (
        <div className={`flex items-center gap-2 p-2.5 rounded-xl mb-3 ${
          darkMode ? 'bg-amber-500/5 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'
        }`}>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <p className={`text-[9px] ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>
            Aún no has construido suficiente valor. Primero completa los puntos.
          </p>
        </div>
      )}

      <div className="space-y-1">
        {items.map(item => (
          <button key={item.id} onClick={() => onToggle(item.id)}
            className="w-full flex items-center gap-2 p-2 rounded-lg transition-all text-left hover:bg-white/5">
            <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
              item.checked
                ? darkMode ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-emerald-100 border-emerald-400'
                : darkMode ? 'border-white/20' : 'border-stone-300'
            }`}>
              {item.checked && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
            </div>
            <span className={`text-[10px] font-bold ${
              item.checked
                ? darkMode ? 'text-stone-600 line-through' : 'text-stone-400 line-through'
                : darkMode ? 'text-stone-200' : 'text-stone-700'
            }`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
