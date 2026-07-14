import { useCallStore } from '../../store/useCallStore';
import { defaultSpeechSections } from '../../data/defaultSpeeches';
import { renderScriptText } from '../../utils/renderScriptText';
import { SafeReturnChecklist } from './SafeReturnChecklist';
import { VariablesPanel } from './VariablesPanel';
import { SondeoSelector } from './SondeoSelector';
import { InterestDecision } from './InterestDecision';
import { CostFlowStep } from './CostFlowStep';
import { AcordarStep } from './AcordarStep';
import { NavigationBar } from './NavigationBar';
import { AlertCircle, Star, XCircle } from 'lucide-react';
import { CheckCircle2 } from 'lucide-react';

interface Props { darkMode: boolean; }

export function ConversationAssistant({ darkMode }: Props) {
  const {
    currentCallStep, callSteps, callVariables,
    getSectionSpeeches, defaultSpeeches: defaults, callInterestDecision,
    getSafeCallStep, profileTags,
  } = useCallStore();

  const currentStep = getSafeCallStep();
  if (!currentStep) return null;

  if (currentStep.type === 'custom') {
    return (
      <div className="space-y-4">
        <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-xs font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                {currentStep.title || 'Paso personalizado'}
              </h3>
              <p className={`text-[9px] mt-0.5 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                Paso {currentCallStep + 1} de {callSteps.length}
              </p>
            </div>
            <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
              {currentStep.customType === 'objection' ? 'Objeción' : 'Texto libre'}
            </span>
          </div>
        </div>
        <div className={`rounded-xl border-[2px] p-4 ${darkMode ? 'bg-[#24211e] border-[#4a4036]' : 'bg-stone-50 border-stone-200'}`}>
          <div className={`text-[10px] leading-relaxed whitespace-pre-line ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
            {currentStep.content}
          </div>
        </div>
        <NavigationBar darkMode={darkMode} />
      </div>
    );
  }

  const section = defaultSpeechSections.find(s => s.id === currentStep.sectionId);
  const speeches = getSectionSpeeches(currentStep.sectionId || '');

  const isPersonalizar = currentStep.sectionId === 'personalizar';
  const isCostos = currentStep.sectionId === 'costos';
  const isAcordar = currentStep.sectionId === 'acordar';
  const isSondeo = currentStep.sectionId === 'sondeo';

  // Profile-based benefit highlighting for costos
  const profileHighlights: string[] = [];
  if (profileTags.trabaja) profileHighlights.push('flexibilidad de horarios');
  if (profileTags.tieneHijos) profileHighlights.push('clases grabadas 24/7');
  if (profileTags.preocupadoCostos) profileHighlights.push('beca significativa');

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'}`}>
        <div className="flex items-center gap-3">
          <span className="text-lg">{section?.icon || '📋'}</span>
          <div>
            <h3 className={`text-xs font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
              {section?.title || currentStep.sectionId}
            </h3>
            <p className={`text-[9px] mt-0.5 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
              Paso {currentCallStep + 1} de {callSteps.length}
              {currentStep.skipped && <span className="ml-2 text-amber-500 font-bold">· Saltado</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Safe return checklist */}
      <SafeReturnChecklist darkMode={darkMode} />

      {/* Variables panel */}
      <VariablesPanel darkMode={darkMode} />

      {/* Profile tags for sondeo */}
      {isSondeo && (
        <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'}`}>
          <p className={`text-[9px] font-bold mb-2 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
            Perfil del cliente (selecciona lo que aplique):
          </p>
          <div className="flex flex-wrap gap-2">
            {([
              { key: 'trabaja' as const, label: 'Trabaja', icon: '💼' },
              { key: 'tieneHijos' as const, label: 'Tiene Hijos', icon: '👨‍👩‍👧' },
              { key: 'preocupadoCostos' as const, label: 'Preocupado por Costos', icon: '💰' },
            ]).map(tag => (
              <button key={tag.key} onClick={() => useCallStore.getState().toggleProfileTag(tag.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-[10px] font-bold transition-all ${
                  profileTags[tag.key]
                    ? darkMode ? 'bg-amber-900/40 border-amber-600 text-amber-200 scale-105' : 'bg-amber-100 border-amber-500 text-amber-800 scale-105'
                    : darkMode ? 'bg-[#24211e] border-[#3e382f] text-stone-400 hover:border-amber-800/40' : 'bg-white border-stone-200 text-stone-500 hover:border-amber-300'
                }`}>
                <span>{tag.icon}</span> {tag.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Profile benefit highlights for costos */}
      {isCostos && profileHighlights.length > 0 && (
        <div className={`rounded-2xl border p-3 ${darkMode ? 'bg-amber-950/10 border-amber-800/30' : 'bg-amber-50 border-amber-200'}`}>
          <p className={`text-[9px] font-bold mb-1 ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>
            ✨ Beneficios relevantes para este cliente:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {profileHighlights.map(h => (
              <span key={h} className={`text-[8px] font-bold px-2 py-1 rounded-full ${darkMode ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>
                {h}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Speech content area */}
      {isPersonalizar ? (
        <div className="space-y-3">
          <p className={`text-[9px] font-bold ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
            Todos los beneficios que se le otorgan al cliente:
          </p>
          {speeches.map(speech => {
            const isFav = defaults['personalizar'] === speech.id;
            const isCustom = speech.isCustom === true;
            return (
              <div key={speech.id} className={`rounded-xl border-[2px] p-4 ${isFav ? darkMode ? 'bg-[#24211e] border-emerald-800/30' : 'bg-emerald-50/50 border-emerald-200' : darkMode ? 'bg-[#24211e] border-[#4a4036]' : 'bg-stone-50 border-stone-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {isFav && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 shrink-0" />}
                  <h4 className={`text-[11px] font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>{speech.title}</h4>
                  {isCustom && (
                    <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>MI speech</span>
                  )}
                </div>
                <div className={`text-[10px] leading-relaxed p-3 rounded-lg whitespace-pre-line ${darkMode ? 'bg-[#1c1a18] text-stone-400' : 'bg-white text-stone-600'}`}>
                  {renderScriptText(speech.content, darkMode, callVariables)}
                </div>
              </div>
            );
          })}
          <InterestDecision darkMode={darkMode} label="¿Le interesa continuar?" sublabel="Selecciona SÍ o NO para continuar al cierre." />
        </div>
      ) : isCostos ? (
        <CostFlowStep darkMode={darkMode} />
      ) : isAcordar ? (
        <AcordarStep darkMode={darkMode} />
      ) : (() => {
        // Standard step: show favorite speech
        const favId = currentStep.sectionId ? defaults[currentStep.sectionId] : undefined;
        const favSpeech = favId ? speeches.find(s => s.id === favId) : null;
        if (favSpeech) {
          return (
            <div className="space-y-3">
              <div className={`rounded-xl border-[2px] p-4 ${darkMode ? 'bg-[#24211e] border-emerald-800/30' : 'bg-emerald-50/50 border-emerald-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <p className={`text-[11px] font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                    {favSpeech.title}
                  </p>
                  {favSpeech.isCustom && (
                    <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>MI speech</span>
                  )}
                </div>
                <div className={`text-[10px] leading-relaxed p-3 rounded-lg whitespace-pre-line ${darkMode ? 'bg-[#1c1a18] text-stone-400' : 'bg-white text-stone-600'}`}>
                  {renderScriptText(favSpeech.content, darkMode, callVariables)}
                </div>
              </div>
              {isSondeo && <SondeoSelector darkMode={darkMode} />}
            </div>
          );
        }
        return (
          <div className={`flex items-center gap-3 p-4 rounded-xl ${darkMode ? 'bg-[#24211e]' : 'bg-stone-50'}`}>
            <AlertCircle className={`w-5 h-5 shrink-0 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`} />
            <p className={`text-[11px] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
              No hay favorito en esta sección. Selecciona uno en la pestaña <span className="font-bold">Speeches</span>.
            </p>
          </div>
        );
      })()}

      <NavigationBar darkMode={darkMode} />
    </div>
  );
}
