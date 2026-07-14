import { useCallStore } from '../../store/useCallStore';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props { darkMode: boolean; }

export function NavigationBar({ darkMode }: Props) {
  const { currentCallStep, callSteps, goToPrevCallStep, goToNextCallStep, skipCurrentCallStep } = useCallStore();
  const isLast = currentCallStep === callSteps.length - 1;

  return (
    <div className={`flex items-center gap-2 pt-4 border-t ${darkMode ? 'border-[#3e382f]' : 'border-[#dfd9cc]'}`}>
      <button onClick={goToPrevCallStep} disabled={currentCallStep === 0}
        className={`flex items-center gap-1 px-3 py-2 rounded-xl border text-[10px] font-bold transition-all disabled:opacity-30 ${
          darkMode ? 'border-[#3e382f] text-stone-300 hover:bg-[#24211e]' : 'border-[#dfd9cc] text-stone-600 hover:bg-stone-50'
        }`}>
        <ChevronLeft className="w-3 h-3" /> Anterior
      </button>
      <button onClick={skipCurrentCallStep}
        className={`px-3 py-2 rounded-xl border text-[10px] font-bold transition-all ${
          darkMode ? 'border-amber-800/40 text-amber-400 hover:bg-amber-950/20' : 'border-amber-200 text-amber-700 hover:bg-amber-50'
        }`}>Saltar</button>
      <button onClick={isLast ? undefined : goToNextCallStep} disabled={isLast}
        className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#faedcd] border border-[#d4a373] text-[#b57b54] text-[10px] font-bold hover:bg-[#ffeec2] transition-all disabled:opacity-50">
        {isLast ? 'Completar' : <>Siguiente <ChevronRight className="w-3 h-3" /></>}
      </button>
    </div>
  );
}
