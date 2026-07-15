import { useEffect } from 'react';
import { useCallStore } from '../../store/useCallStore';
import { defaultSpeechSections } from '../../data/defaultSpeeches';
import { objectionReasons } from '../../data/defaultObjections';
import { renderScriptText } from '../../utils/renderScriptText';
import { SondeoSelector } from './SondeoSelector';
import { CostFlowStep } from './CostFlowStep';
import { AcordarStep } from './AcordarStep';
import { NavigationBar } from './NavigationBar';
import { AlertCircle, Star, Sparkles, CheckCircle2, XCircle } from 'lucide-react';

interface Props { darkMode: boolean; }

const SONDEO_TO_SPEECH: Record<string, string> = {
  'Crecer laboralmente': 'modalidad_flexibilidad',
  'Cambiar de área': 'explicacion_licenciatura',
  'Mejorar oportunidades': 'validez_titulacion',
  'Objetivo personal / obtener título': 'validez_titulacion',
  'Apoyo familiar': 'modalidad_flexibilidad',
  'Promoción o ascenso': 'explicacion_licenciatura',
};

export function ConversationAssistant({ darkMode }: Props) {
  const {
    currentCallStep, callSteps, callVariables,
    getSectionSpeeches, defaultSpeeches: defaults,
    getSafeCallStep, setDefaultSpeech,
    callInterestDecision, setCallInterestDecision,
    getMergedObjections, toggleUsedResponse, usedResponses,
    callCostReason, setCallCostReason,
  } = useCallStore();

  const currentStep = getSafeCallStep();
  if (!currentStep) return null;

  const isPersonalizar = currentStep.sectionId === 'personalizar';
  const sondeoAnswer = callVariables['RESPUESTA DE SONDEO'] || '';

  useEffect(() => {
    if (isPersonalizar && sondeoAnswer && !defaults['personalizar']) {
      const recommended = SONDEO_TO_SPEECH[sondeoAnswer];
      if (recommended) {
        setDefaultSpeech('personalizar', recommended);
      }
    }
  }, [isPersonalizar, sondeoAnswer]);

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

  const isCostos = currentStep.sectionId === 'costos';
  const isAcordar = currentStep.sectionId === 'acordar';
  const isSondeo = currentStep.sectionId === 'sondeo';

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

      {/* Speech content area */}
      {isPersonalizar ? (
        <div className="space-y-3">
          <p className={`text-[9px] font-bold ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
            Todos los beneficios que se le otorgan al cliente:
          </p>
          {(() => {
            const recommendedId = sondeoAnswer ? SONDEO_TO_SPEECH[sondeoAnswer] : null;
            const sorted = [...speeches].sort((a, b) => {
              if (a.id === recommendedId) return -1;
              if (b.id === recommendedId) return 1;
              return 0;
            });
            return sorted.map(speech => {
              const isFav = defaults['personalizar'] === speech.id;
              const isRecommended = speech.id === recommendedId;
              const isCustom = speech.isCustom === true;
              return (
                <div key={speech.id} className={`rounded-xl border-[2px] p-4 ${
                  isRecommended
                    ? darkMode ? 'bg-amber-950/20 border-amber-600/50 ring-1 ring-amber-600/20' : 'bg-amber-50 border-amber-400 ring-1 ring-amber-200'
                    : isFav
                      ? darkMode ? 'bg-[#24211e] border-emerald-800/30' : 'bg-emerald-50/50 border-emerald-200'
                      : darkMode ? 'bg-[#24211e] border-[#4a4036]' : 'bg-stone-50 border-stone-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {isRecommended && <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                    {isFav && !isRecommended && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 shrink-0" />}
                    <h4 className={`text-[11px] font-bold font-display ${isRecommended ? 'text-amber-600 dark:text-amber-400' : 'text-stone-200 dark:text-stone-800'}`}>{speech.title}</h4>
                    {isRecommended && (
                      <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-200 text-amber-700'}`}>Recomendado</span>
                    )}
                    {isCustom && (
                      <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>MI speech</span>
                    )}
                  </div>
                  <div className={`text-[10px] leading-relaxed p-3 rounded-lg whitespace-pre-line ${isRecommended ? 'bg-amber-100/50 dark:bg-amber-950/20' : 'bg-[#1c1a18] dark:bg-white'} ${isRecommended ? 'text-stone-700 dark:text-stone-300' : 'text-stone-400 dark:text-stone-600'}`}>
                    {renderScriptText(speech.content, darkMode, callVariables)}
                  </div>
                </div>
              );
            });
          })()}
          
          {/* Interest decision */}
          {callInterestDecision === null && (
            <div className={`rounded-2xl border-[2px] p-4 ${darkMode ? 'bg-[#24211e] border-amber-800/30' : 'bg-amber-50/50 border-amber-200'}`}>
              <p className={`text-[11px] font-bold font-display mb-3 ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                ¿Le interesa continuar?
              </p>
              <p className={`text-[9px] mb-4 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                Selecciona SÍ o NO para continuar al cierre.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setCallInterestDecision('yes')}
                  className="flex-1 py-3 rounded-xl bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-400 text-[11px] font-bold hover:bg-emerald-500/30 transition-all">
                  SÍ — Le interesa
                </button>
                <button onClick={() => setCallInterestDecision('no')}
                  className="flex-1 py-3 rounded-xl bg-red-500/20 border-2 border-red-500/40 text-red-400 text-[11px] font-bold hover:bg-red-500/30 transition-all">
                  NO — No le interesa
                </button>
              </div>
            </div>
          )}

          {/* Interest decision result */}
          {callInterestDecision === 'yes' && (
            <div className={`flex items-center gap-3 p-4 rounded-xl ${darkMode ? 'bg-emerald-950/20 border border-emerald-800/30' : 'bg-emerald-50 border border-emerald-200'}`}>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <p className={`text-[10px] font-bold ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>SÍ — Confirma interés</p>
                <p className={`text-[8px] mt-0.5 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>Continuar al siguiente paso</p>
              </div>
            </div>
          )}

          {callInterestDecision === 'no' && (
            <div className="space-y-3">
              <div className={`flex items-center gap-3 p-4 rounded-xl ${darkMode ? 'bg-red-950/20 border border-red-800/30' : 'bg-red-50 border border-red-200'}`}>
                <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                <div>
                  <p className={`text-[10px] font-bold ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>NO — No le interesa</p>
                  <p className={`text-[8px] mt-0.5 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>Selecciona la razón para ver objeciones relevantes</p>
                </div>
              </div>

              {/* Objection reason selector */}
              {callCostReason === null && (
                <div className={`rounded-xl border-[2px] p-5 ${darkMode ? 'bg-[#24211e] border-amber-800/30' : 'bg-amber-50/50 border-amber-200'}`}>
                  <p className={`text-sm font-black font-display mb-2 ${darkMode ? 'text-stone-100' : 'text-stone-900'}`}>¿Cuál es la razón?</p>
                  <p className={`text-[10px] mb-4 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>Selecciona el motivo para ver las objeciones más relevantes.</p>
                  <div className="space-y-2">
                    {objectionReasons.map((reason) => (
                      <button key={reason.id} onClick={() => setCallCostReason(reason.id)}
                        className={`w-full text-left p-3 rounded-xl border-2 text-[11px] font-bold transition-all ${
                          darkMode ? 'border-[#4a4036] text-stone-300 hover:border-amber-800/40 hover:text-amber-400 hover:bg-amber-950/20'
                          : 'border-stone-200 text-stone-600 hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50'
                        }`}>{reason.label}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Objections list */}
              {callCostReason !== null && (() => {
                const mergedObjections = getMergedObjections();
                const checkRelevance = (catId: string) => {
                  const r = objectionReasons.find(rs => rs.id === callCostReason);
                  return r?.matchedObjections.includes(catId) ?? false;
                };
                const sorted = [...mergedObjections].sort((a, b) => {
                  const r = objectionReasons.find(rs => rs.id === callCostReason);
                  if (!r) return 0;
                  return (r.matchedObjections.includes(a.id) ? -1 : 0) - (r.matchedObjections.includes(b.id) ? -1 : 0);
                });
                return (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${darkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>OBJECIONES DISPONIBLES</span>
                      <span className={`text-[9px] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                        Razón: {objectionReasons.find(r => r.id === callCostReason)?.label}
                      </span>
                      <button onClick={() => setCallCostReason(null)}
                        className={`ml-auto text-[9px] font-bold px-2 py-1 rounded-lg border transition-all ${
                          darkMode ? 'border-[#3e382f] text-stone-400 hover:text-stone-200' : 'border-stone-200 text-stone-500 hover:text-stone-700'
                        }`}>Cambiar</button>
                    </div>
                    {sorted.map((cat) => {
                      const relevant = checkRelevance(cat.id);
                      return (
                        <div key={cat.id} className={`rounded-xl border-[2px] p-4 ${
                          relevant ? darkMode ? 'bg-amber-950/20 border-amber-800/40' : 'bg-amber-50 border-amber-300'
                          : darkMode ? 'bg-[#24211e] border-[#4a4036]' : 'bg-stone-50 border-stone-200'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm">{cat.icon}</span>
                            <h4 className={`text-[11px] font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>{cat.title}</h4>
                            {relevant && (
                              <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-200 text-amber-700'}`}>Relevante</span>
                            )}
                          </div>
                          <p className={`text-[9px] italic mb-2 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>{cat.objection}</p>
                          {cat.responses.map((resp) => {
                            const isUsed = usedResponses.includes(resp.id);
                            return (
                              <div key={resp.id} className="mb-2 last:mb-0">
                                <div className="flex items-center justify-between">
                                  <p className={`text-[9px] font-bold mb-1 ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>{resp.title}</p>
                                  <button onClick={() => toggleUsedResponse(resp.id)}
                                    className={`text-[8px] font-bold px-2 py-0.5 rounded-lg transition-all ${
                                      isUsed
                                        ? darkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                                        : darkMode ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600'
                                    }`}>
                                    {isUsed ? '✓ Usado' : 'Marcar usado'}
                                  </button>
                                </div>
                                <div className={`text-[10px] leading-relaxed p-3 rounded-lg whitespace-pre-line ${isUsed ? 'opacity-50' : ''} ${darkMode ? 'bg-[#1c1a18] text-stone-400' : 'bg-white text-stone-600'}`}>
                                  {resp.content}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
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
