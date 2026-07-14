import { useCallStore } from '../../store/useCallStore';
import { ClipboardCheck } from 'lucide-react';

interface Props { darkMode: boolean; }

export function SafeReturnChecklist({ darkMode }: Props) {
  const { safeChecklist, toggleSafeCheck } = useCallStore();
  const checkedCount = safeChecklist.filter(i => i.checked).length;

  return (
    <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'}`}>
      <div className={`flex items-center gap-2 px-4 py-2.5 ${darkMode ? 'bg-[#24211e]' : 'bg-stone-50'}`}>
        <ClipboardCheck className="w-3.5 h-3.5 text-amber-500" />
        <span className={`text-[9px] font-bold ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
          Retorno Seguro
        </span>
        <span className={`text-[8px] ml-auto ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
          {checkedCount}/{safeChecklist.length}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5 p-3">
        {safeChecklist.map(item => (
          <button key={item.id} onClick={() => toggleSafeCheck(item.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[9px] font-bold transition-all ${
              item.checked
                ? darkMode ? 'bg-emerald-950/20 border-emerald-800/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : darkMode ? 'bg-[#24211e] border-[#3e382f] text-stone-400 hover:border-amber-800/40' : 'bg-stone-50 border-stone-200 text-stone-500 hover:border-amber-300'
            }`}>
            <span className={`w-3 h-3 rounded border flex items-center justify-center text-[7px] ${
              item.checked
                ? 'border-emerald-500 bg-emerald-500 text-white'
                : darkMode ? 'border-stone-600' : 'border-stone-300'
            }`}>{item.checked ? '✓' : ''}</span>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
