import type { FlowRecommendation } from '../../../data/engine/flowEngine';
import type { CostDecision, ValueCheckItem } from '../../../types';
import { BulletScriptPanel } from '../cards/BulletScriptPanel';
import { ValueChecklist } from '../cards/ValueChecklist';
import { ObjectionDeepCard } from '../cards/ObjectionDeepCard';
import { objectionReasons } from '../../../data/defaultObjections';

interface Props {
  recommendations: FlowRecommendation[];
  darkMode: boolean;
  callVariables: Record<string, string>;
  valueChecklist: ValueCheckItem[];
  onToggleValueCheck: (id: string) => void;
  callInterestDecision: CostDecision;
  onSetCallInterestDecision: (v: CostDecision) => void;
  callCostReasonGPS: string | null;
  onSetCallCostReasonGPS: (v: string | null) => void;
  onNavigateNext?: () => void;
}

const COSTOS_TABS = [
  { id: 'checklist', label: 'Checklist', icon: '📋', blockIds: ['costos_checklist'] },
  { id: 'platzi', label: 'Alianza Platzi', icon: '💚', blockIds: ['costos_platzi'] },
  { id: 'anclaje', label: 'Anclaje', icon: '💰', blockIds: ['costos_pre_precio', 'costos_ancla'] },
  { id: 'beca', label: 'Beca + Beneficios', icon: '🎓', blockIds: ['costos_beca', 'costos_referidos'] },
  { id: 'decision', label: 'Decisión', icon: '⚖️', blockIds: ['costos_decision'] },
];

export function CostosSection({
  recommendations, darkMode, callVariables,
  valueChecklist, onToggleValueCheck,
  callInterestDecision, onSetCallInterestDecision,
  callCostReasonGPS, onSetCallCostReasonGPS,
  onNavigateNext,
}: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left column: Scripts with bullet tabs */}
      <div className="lg:col-span-2 space-y-4">
        <BulletScriptPanel
          tabs={COSTOS_TABS}
          recommendations={recommendations}
          darkMode={darkMode}
          callVariables={callVariables}
        />
      </div>

      {/* Right column: Value checklist + Decision flow */}
      <div className="space-y-4 sticky top-4 self-start">
        <ValueChecklist items={valueChecklist} darkMode={darkMode} onToggle={onToggleValueCheck} />

        {/* Decision */}
        {callInterestDecision === null && (
          <div className={`rounded-xl border p-5 ${darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-stone-200'}`}>
            <p className={`text-[11px] font-bold font-display mb-4 ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
              ¿Se adapta a lo que buscas?
            </p>
            <div className="flex gap-3">
              <button onClick={() => { onSetCallInterestDecision('yes'); onNavigateNext?.(); }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold hover:bg-emerald-500/20 transition-all">
                SÍ — Le interesa
              </button>
              <button onClick={() => onSetCallInterestDecision('no')}
                className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-bold hover:bg-red-500/20 transition-all">
                NO — No le interesa
              </button>
            </div>
          </div>
        )}

        {callInterestDecision === 'no' && (
          <div className="space-y-3">
            <div className={`rounded-xl border p-5 ${darkMode ? 'bg-zinc-900 border-amber-500/20' : 'bg-amber-50/50 border-amber-200'}`}>
              <p className={`text-sm font-black font-display mb-3 ${darkMode ? 'text-stone-100' : 'text-stone-900'}`}>
                ¿Cuál es la razón?
              </p>
              <div className="space-y-1.5">
                {objectionReasons.map((reason) => (
                  <button key={reason.id} onClick={() => onSetCallCostReasonGPS(reason.id)}
                    className={`w-full text-left p-2.5 rounded-xl border text-[11px] font-bold transition-all ${
                      callCostReasonGPS === reason.id
                        ? darkMode ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-amber-100 border-amber-400 text-amber-700'
                        : darkMode ? 'border-white/10 text-stone-400 hover:border-amber-500/30 hover:text-amber-400 hover:bg-amber-500/5'
                        : 'border-stone-200 text-stone-500 hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50'
                    }`}>
                    {reason.label}
                  </button>
                ))}
              </div>
            </div>
            {callCostReasonGPS && (
              <ObjectionDeepCard reasonId={callCostReasonGPS} darkMode={darkMode} callVariables={callVariables} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
