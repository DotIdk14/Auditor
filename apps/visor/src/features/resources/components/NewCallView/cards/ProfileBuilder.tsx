import type { ProspectProfile, Motivation, PainPoint } from '../../../types';
import { MOTIVATION_LABELS, MOTIVATION_ICONS, PAIN_LABELS, PAIN_ICONS, EMOTION_LABELS, EMOTION_ICONS } from '../../../types';

interface Props {
  profile: ProspectProfile;
  darkMode: boolean;
  onUpdate: (updates: Partial<ProspectProfile>) => void;
  onUpdateSituation: (updates: Partial<ProspectProfile['situation']>) => void;
  onToggleMotivation: (m: Motivation) => void;
  onTogglePain: (p: PainPoint) => void;
}

const MOTIVATIONS: Motivation[] = [
  'crecer_laboral', 'mejor_salario', 'cambiar_carrera', 'obtener_titulo',
  'familia', 'ascenso', 'emprender', 'superacion_personal', 'requisito_empresa',
];

const PAIN_POINTS: PainPoint[] = [
  'no_tiempo', 'no_dinero', 'no_termino_universidad', 'tiene_hijos',
  'trabaja', 'quiere_ascender', 'no_sabe_que_estudiar', 'otra_universidad',
];

export function ProfileBuilder({ profile, darkMode, onUpdate, onUpdateSituation, onToggleMotivation, onTogglePain }: Props) {
  return (
    <div className="space-y-4">
      {/* Nombre y carrera */}
      <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'}`}>
        <p className={`text-[10px] font-bold mb-3 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
          📋 DATOS DEL PROSPECTO
        </p>
        <div className="grid grid-cols-2 gap-2">
          <input value={profile.nombre} onChange={e => onUpdate({ nombre: e.target.value })}
            placeholder="Nombre"
            className={`text-[11px] px-3 py-2 rounded-xl border ${darkMode ? 'bg-[#24211e] border-[#4a4036] text-stone-200 placeholder-stone-600' : 'bg-stone-50 border-stone-200 text-stone-800 placeholder-stone-400'}`} />
          <input value={profile.carrera} onChange={e => onUpdate({ carrera: e.target.value })}
            placeholder="Carrera"
            className={`text-[11px] px-3 py-2 rounded-xl border ${darkMode ? 'bg-[#24211e] border-[#4a4036] text-stone-200 placeholder-stone-600' : 'bg-stone-50 border-stone-200 text-stone-800 placeholder-stone-400'}`} />
        </div>
      </div>

      {/* Motivaciones */}
      <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'}`}>
        <p className={`text-[10px] font-bold mb-3 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
          🎯 MOTIVACIÓN
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {MOTIVATIONS.map(m => {
            const active = profile.motivations.includes(m);
            return (
              <button key={m} onClick={() => onToggleMotivation(m)}
                className={`text-[9px] font-bold p-2 rounded-xl border-2 transition-all text-left ${
                  active
                    ? darkMode ? 'bg-amber-900/30 border-amber-600/50 text-amber-300' : 'bg-amber-50 border-amber-400 text-amber-700'
                    : darkMode ? 'border-[#4a4036] text-stone-400 hover:border-amber-800/40' : 'border-stone-200 text-stone-500 hover:border-amber-300'
                }`}>
                <span className="mr-1">{MOTIVATION_ICONS[m]}</span>
                {MOTIVATION_LABELS[m]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dolor */}
      <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'}`}>
        <p className={`text-[10px] font-bold mb-3 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
          🔴 DOLOR PRINCIPAL
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {PAIN_POINTS.map(p => {
            const active = profile.painPoints.includes(p);
            return (
              <button key={p} onClick={() => onTogglePain(p)}
                className={`text-[9px] font-bold p-2 rounded-xl border-2 transition-all text-left ${
                  active
                    ? darkMode ? 'bg-red-900/20 border-red-600/40 text-red-400' : 'bg-red-50 border-red-300 text-red-700'
                    : darkMode ? 'border-[#4a4036] text-stone-400 hover:border-red-800/40' : 'border-stone-200 text-stone-500 hover:border-red-300'
                }`}>
                <span className="mr-1">{PAIN_ICONS[p]}</span>
                {PAIN_LABELS[p]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Situación */}
      <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'}`}>
        <p className={`text-[10px] font-bold mb-3 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
          🏠 SITUACIÓN ACTUAL
        </p>
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
                  className={`text-[9px] font-bold px-3 py-1 rounded-lg transition-all ${
                    profile.situation[item.key]
                      ? darkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                      : darkMode ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600'
                  }`}>Sí</button>
                <button onClick={() => onUpdateSituation({ [item.key]: false })}
                  className={`text-[9px] font-bold px-3 py-1 rounded-lg transition-all ${
                    !profile.situation[item.key]
                      ? darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'
                      : darkMode ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600'
                  }`}>No</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Emoción detectada */}
      <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'}`}>
        <p className={`text-[10px] font-bold mb-3 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
          🎭 EMOCIÓN DETECTADA
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          {(['interesado', 'emocionado', 'dudoso', 'resistente', 'satisfecho', 'preocupado', 'indiferente'] as const).map(e => (
            <button key={e} onClick={() => onUpdate({ detectedEmotion: profile.detectedEmotion === e ? null : e })}
              className={`text-[8px] font-bold p-2 rounded-xl border-2 transition-all text-center ${
                profile.detectedEmotion === e
                  ? darkMode ? 'bg-amber-900/30 border-amber-600/50 text-amber-300' : 'bg-amber-50 border-amber-400 text-amber-700'
                  : darkMode ? 'border-[#4a4036] text-stone-400 hover:border-amber-800/40' : 'border-stone-200 text-stone-500 hover:border-amber-300'
              }`}>
              <span className="text-sm block mb-0.5">{EMOTION_ICONS[e]}</span>
              {EMOTION_LABELS[e]}
            </button>
          ))}
        </div>
      </div>

      {/* Tags generados */}
      {profile.generatedTags.length > 0 && (
        <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'}`}>
          <p className={`text-[10px] font-bold mb-2 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
            🏷️ TAGS GENERADOS
          </p>
          <div className="flex flex-wrap gap-1">
            {profile.generatedTags.map(tag => (
              <span key={tag} className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
                darkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'
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
