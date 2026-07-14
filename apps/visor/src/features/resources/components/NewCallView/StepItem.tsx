import { useCallStore } from '../../store/useCallStore';
import { defaultSpeechSections } from '../../data/defaultSpeeches';
import { CheckCircle2, Circle, ChevronRight, ArrowUp, ArrowDown, Trash2, Plus } from 'lucide-react';

interface Props { darkMode: boolean; }

export function StepItem({ idx, darkMode }: Props & { idx: number }) {
  const {
    callSteps, currentCallStep, visitedSteps, callCostStep, callCostDecision,
    moveCallStep, removeCallStep, toggleSection, setCallCostStep,
  } = useCallStore();
  const step = callSteps[idx];
  const isCurrent = idx === currentCallStep;
  const isCompleted = step.skipped || visitedSteps.has(idx) || idx < currentCallStep;
  const section = step.type === 'section' ? defaultSpeechSections.find(s => s.id === step.sectionId) : null;
  const icon = step.type === 'custom' ? '✏️' : (section?.icon || '📋');
  const title = step.type === 'custom' ? (step.title || 'Paso personalizado') : (section?.title || step.sectionId || '');
  const isCostos = step.type === 'section' && step.sectionId === 'costos';

  return (
    <div key={step.id} className={`flex items-center gap-1.5 rounded-xl p-2 transition-all ${
      isCurrent ? darkMode ? 'bg-amber-900/30 border border-amber-800/40' : 'bg-amber-50 border border-amber-200'
      : isCompleted ? darkMode ? 'bg-emerald-950/10' : 'bg-emerald-50/50' : ''
    }`}>
      <button onClick={() => {
        useCallStore.setState(s => ({ visitedSteps: new Set([...s.visitedSteps, s.currentCallStep]), currentCallStep: idx }));
        if (isCostos) setCallCostStep(0);
      }}
        className="flex items-center gap-1.5 flex-1 min-w-0 text-left">
        <span className={`shrink-0 ${
          isCurrent ? 'text-amber-500' : isCompleted ? 'text-emerald-500' : darkMode ? 'text-stone-600' : 'text-stone-300'
        }`}>
          {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : isCurrent ? <ChevronRight className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
        </span>
        <span className="text-sm shrink-0">{icon}</span>
        <div className="min-w-0 flex-1">
          <p className={`text-[9px] font-bold truncate ${
            isCurrent ? darkMode ? 'text-amber-400' : 'text-amber-700'
            : isCompleted ? darkMode ? 'text-stone-400' : 'text-stone-500'
            : darkMode ? 'text-stone-300' : 'text-stone-700'
          }`}>{title}</p>
          {isCostos && !isCompleted && callCostDecision === null && currentCallStep === idx && (
            <p className={`text-[7px] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
              Paso {callCostStep + 1} de 5
            </p>
          )}
        </div>
      </button>
      <div className="flex items-center gap-0.5 shrink-0">
        <button onClick={() => moveCallStep(idx, 'up')} disabled={idx === 0}
          className={`p-0.5 rounded transition-all disabled:opacity-20 ${darkMode ? 'text-stone-600 hover:text-stone-300' : 'text-stone-300 hover:text-stone-600'}`}>
          <ArrowUp className="w-2.5 h-2.5" />
        </button>
        <button onClick={() => moveCallStep(idx, 'down')} disabled={idx === callSteps.length - 1}
          className={`p-0.5 rounded transition-all disabled:opacity-20 ${darkMode ? 'text-stone-600 hover:text-stone-300' : 'text-stone-300 hover:text-stone-600'}`}>
          <ArrowDown className="w-2.5 h-2.5" />
        </button>
        {step.type === 'custom' && (
          <button onClick={() => removeCallStep(idx)}
            className={`p-0.5 rounded transition-all ${darkMode ? 'text-stone-600 hover:text-red-400' : 'text-stone-300 hover:text-red-500'}`}>
            <Trash2 className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
    </div>
  );
}
