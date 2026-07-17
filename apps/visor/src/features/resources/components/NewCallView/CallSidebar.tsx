import { useState } from 'react';
import { useCallStore } from '../../store/useCallStore';
import { defaultSpeechSections } from '../../data/defaultSpeeches';
import { CheckCircle2, ChevronDown, ChevronUp, Plus, RotateCcw } from 'lucide-react';

interface Props { darkMode: boolean; }

export function CallSidebar({ darkMode }: Props) {
  const { callSteps, currentCallStep, visitedSteps, getCallProgress, resetCall, setShowAddStepModal } = useCallStore();
  const progress = getCallProgress();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`rounded-xl border ${darkMode ? 'bg-zinc-900/50 border-white/5' : 'bg-white/50 border-stone-200'}`}>
      <div className="flex items-center gap-2 px-3 py-2">
        <span className={`text-[9px] font-bold shrink-0 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
          Mapa
        </span>
        <div className="flex-1 h-1 rounded-full overflow-hidden bg-black/20">
          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <span className={`text-[8px] font-bold shrink-0 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>{progress}%</span>
        <button onClick={resetCall}
          className={`p-1 rounded-lg transition-all ${darkMode ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600'}`}
          title="Reiniciar">
          <RotateCcw className="w-3 h-3" />
        </button>
        <button onClick={() => setCollapsed(!collapsed)}
          className={`p-1 rounded-lg transition-all ${darkMode ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600'}`}>
          {collapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </button>
      </div>

      {!collapsed && (
        <div className="px-3 pb-3 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {callSteps.map((_, idx) => {
              const step = callSteps[idx];
              const isCurrent = idx === currentCallStep;
              const isCompleted = step.skipped || visitedSteps.has(idx) || idx < currentCallStep;
              const section = step.type === 'section'
                ? defaultSpeechSections.find(s => s.id === step.sectionId)
                : null;
              const icon = step.type === 'custom' ? '✏️' : (section?.icon || '📋');
              const title = step.type === 'custom' ? (step.title || 'Paso') : (section?.title || step.sectionId || '');

              return (
                <button key={step.id} onClick={() => {
                  useCallStore.setState(s => ({ visitedSteps: new Set([...s.visitedSteps, s.currentCallStep]), currentCallStep: idx }));
                }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[9px] font-bold whitespace-nowrap transition-all ${
                    isCurrent
                      ? darkMode ? 'bg-amber-900/30 text-amber-400 border border-amber-800/40' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      : isCompleted
                        ? darkMode ? 'text-emerald-400' : 'text-emerald-600'
                        : darkMode ? 'text-stone-500' : 'text-stone-400'
                  }`}>
                  <span className="text-sm">{icon}</span>
                  <span className="truncate max-w-[80px]">{title}</span>
                  {isCompleted && <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />}
                </button>
              );
            })}
            <button onClick={() => setShowAddStepModal(true)}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-xl border-2 border-dashed text-[9px] font-bold whitespace-nowrap transition-all ${
                darkMode ? 'border-[#4a4036] text-stone-500 hover:border-amber-800/40 hover:text-amber-400'
                : 'border-stone-200 text-stone-400 hover:border-amber-300 hover:text-amber-600'
              }`}>
              <Plus className="w-3 h-3" /> Agregar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
