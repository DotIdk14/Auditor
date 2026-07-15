import { useState } from 'react';
import { useCallStore } from '../../store/useCallStore';
import { StepItem } from './StepItem';
import { RotateCcw, Plus, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

interface Props { darkMode: boolean; }

export function CallSidebar({ darkMode }: Props) {
  const { callSteps, resetCall, getCallProgress, setShowAddStepModal } = useCallStore();
  const progress = getCallProgress();
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <div className="w-10 shrink-0">
        <button onClick={() => setCollapsed(false)}
          className={`w-full flex items-center justify-center p-2 rounded-2xl border transition-all ${
            darkMode ? 'bg-[#1c1a18] border-[#3e382f] text-stone-400 hover:text-stone-200' : 'bg-white border-[#dfd9cc] text-stone-500 hover:text-stone-700'
          }`} title="Expandir mapa">
          <PanelLeftOpen className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-72 shrink-0">
      <div className={`rounded-2xl border p-3 ${darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'}`}>
        <div className="flex items-center justify-between mb-3">
          <p className={`text-[10px] font-bold ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
            Mapa de la llamada
          </p>
          <div className="flex items-center gap-2">
            <span className={`text-[9px] font-bold ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>{progress}%</span>
            <button onClick={resetCall} className={`p-1 rounded-lg transition-all hover:scale-110 ${
              darkMode ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600'
            }`} title="Reiniciar llamada"><RotateCcw className="w-3.5 h-3.5" /></button>
            <button onClick={() => setCollapsed(true)} className={`p-1 rounded-lg transition-all hover:scale-110 ${
              darkMode ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600'
            }`} title="Minimizar mapa"><PanelLeftClose className="w-3.5 h-3.5" /></button>
          </div>
        </div>
        <div className={`w-full h-1.5 rounded-full overflow-hidden mb-3 ${darkMode ? 'bg-[#24211e]' : 'bg-stone-100'}`}>
          <div className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }} />
        </div>
        <div className="space-y-1">
          {callSteps.map((_, idx) => (
            <StepItem key={callSteps[idx].id} idx={idx} darkMode={darkMode} />
          ))}
        </div>
        <button onClick={() => setShowAddStepModal(true)}
          className={`w-full mt-2 flex items-center justify-center gap-1.5 p-2 rounded-xl border-2 border-dashed text-[9px] font-bold transition-all ${
            darkMode ? 'border-[#4a4036] text-stone-500 hover:border-amber-800/40 hover:text-amber-400'
            : 'border-stone-200 text-stone-400 hover:border-amber-300 hover:text-amber-600'
          }`}>
          <Plus className="w-3 h-3" /> Agregar paso
        </button>
      </div>
    </div>
  );
}
