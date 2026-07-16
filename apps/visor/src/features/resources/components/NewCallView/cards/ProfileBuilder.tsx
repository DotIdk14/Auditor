import type { ProspectProfile, Motivation, PainPoint } from '../../../types';
import { MOTIVATION_LABELS, MOTIVATION_ICONS, PAIN_LABELS, PAIN_ICONS, EMOTION_LABELS, EMOTION_ICONS } from '../../../types';

interface Props {
  profile: ProspectProfile;
  darkMode: boolean;
  onUpdate: (updates: Partial<ProspectProfile>) => void;
  onUpdateSituation: (updates: Partial<ProspectProfile['situation']>) => void;
  onToggleMotivation: (m: Motivation) => void;
  onTogglePain: (p: PainPoint) => void;
  section?: 'motivacion' | 'situacion' | 'dolor-futuro';
}

const MOTIVATIONS: Motivation[] = [
  'crecer_laboral', 'mejor_salario', 'cambiar_carrera', 'obtener_titulo',
  'familia', 'ascenso', 'emprender', 'superacion_personal', 'requisito_empresa',
];

const PAIN_POINTS: PainPoint[] = [
  'no_tiempo', 'no_dinero', 'no_termino_universidad', 'tiene_hijos',
  'trabaja', 'quiere_ascender', 'no_sabe_que_estudiar', 'otra_universidad',
];

export function ProfileBuilder({ profile, darkMode, onUpdate, onUpdateSituation, onToggleMotivation, onTogglePain, section }: Props) {
  const card = `rounded-xl border p-4 ${darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-stone-200'}`;
  const label = `text-[10px] font-bold mb-3 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`;
  const input = `text-[11px] px-3 py-2 rounded-xl border ${darkMode ? 'bg-black/30 border-white/10 text-stone-200 placeholder-stone-600' : 'bg-stone-50 border-stone-200 text-stone-800 placeholder-stone-400'}`;
  const inlineToggle = `text-[9px] font-bold px-2.5 py-1 rounded-lg transition-all`;

  const showMotivacion = !section || section === 'motivacion';
  const showSituacion = !section || section === 'situacion';
  const showDolor = !section || section === 'dolor-futuro';
  const showEmocion = !section || section === 'dolor-futuro';
  const showTags = !section || section === 'dolor-futuro';

  return (
    <div className="space-y-3">
      {/* Nombre y carrera */}
      <div className={card}>
        <p className={label}>📋 DATOS DEL PROSPECTO</p>
        <div className="grid grid-cols-2 gap-2">
          <input value={profile.nombre} onChange={e => onUpdate({ nombre: e.target.value })} placeholder="Nombre" className={input} />
          <input value={profile.carrera} onChange={e => onUpdate({ carrera: e.target.value })} placeholder="Carrera" className={input} />
        </div>
      </div>

      {/* Motivaciones */}
      {showMotivacion && (
        <div className={card}>
          <p className={label}>🎯 MOTIVACIÓN</p>
          <div className="grid grid-cols-2 gap-2">
            {MOTIVATIONS.map(m => {
              const active = profile.motivations.includes(m);
              return (
                <button key={m} onClick={() => onToggleMotivation(m)}
                  className={`text-[10px] font-bold p-2 rounded-xl border transition-all text-left ${
                    active
                      ? darkMode ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-400 text-emerald-700'
                      : darkMode ? 'border-white/10 text-stone-400 hover:border-emerald-500/30 hover:text-emerald-400 hover:bg-emerald-500/5' : 'border-stone-200 text-stone-500 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50'
                  }`}>
                  <span className="mr-1.5">{MOTIVATION_ICONS[m]}</span>
                  {MOTIVATION_LABELS[m]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Dolor */}
      {showDolor && (
        <div className={card}>
          <p className={label}>🔴 DOLOR PRINCIPAL</p>
          <div className="grid grid-cols-2 gap-2">
            {PAIN_POINTS.map(p => {
              const active = profile.painPoints.includes(p);
              return (
                <button key={p} onClick={() => onTogglePain(p)}
                  className={`text-[10px] font-bold p-2 rounded-xl border transition-all text-left ${
                    active
                      ? darkMode ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-300 text-red-700'
                      : darkMode ? 'border-white/10 text-stone-400 hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/5' : 'border-stone-200 text-stone-500 hover:border-red-300 hover:text-red-700 hover:bg-red-50'
                  }`}>
                  <span className="mr-1.5">{PAIN_ICONS[p]}</span>
                  {PAIN_LABELS[p]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Situación */}
      {showSituacion && (
        <div className={card}>
          <p className={label}>🏠 SITUACIÓN ACTUAL</p>
          <div className="space-y-2">
            {([
              { key: 'trabaja' as const, label: '¿Trabaja actualmente?' },
              { key: 'tieneHijos' as const, label: '¿Tiene hijos?' },
              { key: 'primeraUniversidad' as const, label: '¿Primera universidad?' },
              { key: 'tieneOtraOpcion' as const, label: '¿Tiene otra opción?' },
            ]).map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <span className={`text-[10px] ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}>{item.label}</span>
                <div className="flex gap-1">
                  <button onClick={() => onUpdateSituation({ [item.key]: true })}
                    className={`${inlineToggle} ${
                      profile.situation[item.key]
                        ? darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                        : darkMode ? 'text-stone-600 hover:text-stone-300 hover:bg-white/5' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'
                    }`}>Sí</button>
                  <button onClick={() => onUpdateSituation({ [item.key]: false })}
                    className={`${inlineToggle} ${
                      !profile.situation[item.key]
                        ? darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-100 text-red-700'
                        : darkMode ? 'text-stone-600 hover:text-stone-300 hover:bg-white/5' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'
                    }`}>No</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emoción detectada */}
      {showEmocion && (
        <div className={card}>
          <p className={label}>🎭 EMOCIÓN DETECTADA</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {(['interesado', 'emocionado', 'dudoso', 'resistente', 'satisfecho', 'preocupado', 'indiferente'] as const).map(e => (
              <button key={e} onClick={() => onUpdate({ detectedEmotion: profile.detectedEmotion === e ? null : e })}
                className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl border transition-all shrink-0 ${
                  profile.detectedEmotion === e
                    ? darkMode ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-400 text-amber-700'
                    : darkMode ? 'border-white/10 text-stone-400 hover:border-amber-500/30 hover:text-amber-400 hover:bg-amber-500/5' : 'border-stone-200 text-stone-500 hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50'
                }`}>
                <span className="text-lg">{EMOTION_ICONS[e]}</span>
                <span className="text-[8px] font-bold whitespace-nowrap">{EMOTION_LABELS[e]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tags generados */}
      {showTags && profile.generatedTags.length > 0 && (
        <div className={card}>
          <p className={label}>🏷️ TAGS GENERADOS</p>
          <div className="flex flex-wrap gap-1">
            {profile.generatedTags.map(tag => (
              <span key={tag} className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
                darkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-100 text-amber-700'
              }`}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
