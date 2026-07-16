import type { FlowRecommendation } from '../../../data/engine/flowEngine';
import type { ProspectProfile } from '../../../types';
import { BulletScriptPanel } from '../cards/BulletScriptPanel';

interface Props {
  recommendations: FlowRecommendation[];
  darkMode: boolean;
  callVariables: Record<string, string>;
  profile: ProspectProfile;
}

const BIENVENIDA_TABS = [
  { id: 'apertura', label: 'Apertura', icon: '👋', blockIds: ['bien_agenda', 'bien_rapport', 'bien_reiniciar'] },
];

export function BienvenidaSection({ recommendations, darkMode, callVariables, profile }: Props) {
  const card = `rounded-xl border p-5 ${darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-stone-200'}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left column: Bullet scripts */}
      <div className="lg:col-span-2 space-y-4">
        <BulletScriptPanel
          tabs={BIENVENIDA_TABS}
          recommendations={recommendations}
          darkMode={darkMode}
          callVariables={callVariables}
        />
      </div>

      {/* Right column: Call context */}
      <div className="space-y-4 sticky top-4 self-start">
        <div className={card}>
          <p className={`text-[10px] font-bold mb-3 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
            📞 CONTEXTO DE LLAMADA
          </p>
          <div className="space-y-2.5">
            <div>
              <p className={`text-[8px] font-bold ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>PROSPECTO</p>
              <p className={`text-[12px] font-bold ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                {profile.nombre || '—'}
              </p>
            </div>
            <div>
              <p className={`text-[8px] font-bold ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>CARRERA</p>
              <p className={`text-[12px] font-bold ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                {profile.carrera || '—'}
              </p>
            </div>
            <div className={`h-px ${darkMode ? 'bg-white/5' : 'bg-stone-200'}`} />
            <div>
              <p className={`text-[8px] font-bold ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>OBJETIVO DEL PASO</p>
              <p className={`text-[10px] ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                Establecer rapport, explicar el formato de la llamada, reducir resistencia.
              </p>
            </div>
            <div>
              <p className={`text-[8px] font-bold ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>EMOCIÓN OBJETIVO</p>
              <p className={`text-[10px] font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                🛡️ Confianza
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
