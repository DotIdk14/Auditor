import { useCallStore } from '../../store/useCallStore';
import { getRecommendedBlocks } from '../../data/engine/flowEngine';
import type { FlowRecommendation } from '../../data/engine/flowEngine';
import { getSectionMeta } from '../../data/sections/sectionMeta';
import type { SmartBlock } from '../../types';
import { BulletScriptPanel } from './cards/BulletScriptPanel';
import { ConvictionScale } from './cards/ConvictionScale';
import { ObjectionDeepCard } from './cards/ObjectionDeepCard';
import { SectionWrapper } from './cards/SectionWrapper';
import { BienvenidaSection } from './sections/BienvenidaSection';
import { SondeoSection } from './sections/SondeoSection';
import { CostosSection } from './sections/CostosSection';
import { NavigationBar } from './NavigationBar';
import { objectionReasons } from '../../data/defaultObjections';

interface Props { darkMode: boolean; }

const PERSONALIZAR_TABS = [
  { id: 'beneficios', label: 'Beneficios', icon: '⚡', blockIds: ['pers_modalidad', 'pers_validez', 'pers_acompanamiento', 'pers_licenciatura', 'pers_beneficio_personalizado'] },
];

const PERSUASION_TABS = [
  { id: 'urgencia', label: 'Urgencia', icon: '⏳', blockIds: ['persu_tiempo', 'persu_futuro'] },
  { id: 'emocion', label: 'Emoción', icon: '💙', blockIds: ['persu_graduacion', 'persu_orgullo'] },
  { id: 'compromiso', label: 'Compromiso', icon: '🤝', blockIds: ['persu_letra', 'persu_titulo'] },
];

const ACORDAR_TABS = [
  { id: 'cierre', label: 'Cierre', icon: '📝', blockIds: ['acordar_exito', 'acordar_no', 'acordar_seguimiento', 'acordar_escalacion'] },
];

const GENERIC_TABS = [
  { id: 'scripts', label: 'Scripts', icon: '📋', blockIds: [] as string[] },
];

export function ConversationAssistantGPS({ darkMode }: Props) {
  const {
    currentCallStep, callSteps, callVariables,
    getSafeCallStep, goToNextCallStep,
    profile, updateProfile, updateProfileSituation, toggleMotivation, togglePainPoint,
    valueChecklist, toggleValueCheck,
    callCostReasonGPS, setCallCostReasonGPS,
    convictionLevel, setConvictionLevel,
    callInterestDecision, setCallInterestDecision,
    customSpeeches, defaultSpeeches: defaults,
    demoAccepted, setDemoAccepted, followUpScheduled, setFollowUpScheduled,
    usedBlockIds,
  } = useCallStore();

  const currentStep = getSafeCallStep();
  if (!currentStep) return null;

  const sectionId = currentStep.sectionId || '';
  const meta = getSectionMeta(sectionId);
  if (!meta) {
    return (
      <div className="space-y-4">
        <div className={`rounded-xl border p-5 ${darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-stone-200'}`}>
          <p className={`text-xs font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
            {currentStep.title || 'Paso personalizado'}
          </p>
          <div className={`text-[10px] leading-relaxed p-3 rounded-lg mt-3 whitespace-pre-line ${darkMode ? 'bg-black/30 text-stone-400' : 'bg-stone-50 text-stone-600'}`}>
            {currentStep.content}
          </div>
        </div>
        <NavigationBar darkMode={darkMode} />
      </div>
    );
  }

  const smartBlockRecs = getRecommendedBlocks(profile, sectionId, usedBlockIds);
  const sectionCustoms = (customSpeeches[sectionId] || []).map(speech => {
    const mockBlock: SmartBlock = {
      id: speech.id,
      title: speech.title,
      icon: '✏️',
      objective: 'Speech personalizado',
      principle: 'compromiso',
      timing: [],
      versions: { short: speech.content, medium: speech.content, long: speech.content },
      followUpQuestions: [],
      positiveSignals: [],
      negativeSignals: [],
      nextIfPositive: '',
      nextIfNegative: '',
      tags: [],
      priority: 5,
      used: false,
    };
    return { block: mockBlock, score: 5, reason: 'Personalizado' } as FlowRecommendation;
  });
  const defaultId = defaults[sectionId];
  const allItems = [...smartBlockRecs, ...sectionCustoms];
  if (defaultId) {
    const idx = allItems.findIndex(i => i.block.id === defaultId);
    if (idx > 0) {
      const [defItem] = allItems.splice(idx, 1);
      allItems.unshift(defItem);
    }
  }
  const recommendations = allItems;
  const currentBlockIndex = recommendations.length > 0 ? 0 : 0;

  const renderSectionContent = () => {
    switch (sectionId) {
      case 'bienvenida':
        return renderBienvenida();
      case 'sondeo':
        return renderSondeo();
      case 'personalizar':
        return renderPersonalizar();
      case 'persuasión':
        return renderPersuasion();
      case 'costos':
        return renderCostos();
      case 'acordar':
        return renderAcordar();
      default:
        return renderGenericSection();
    }
  };

  const renderBienvenida = () => (
    <BienvenidaSection
      recommendations={recommendations}
      darkMode={darkMode}
      callVariables={callVariables}
      profile={profile}
    />
  );

  const renderSondeo = () => (
    <SondeoSection
      recommendations={recommendations}
      darkMode={darkMode}
      callVariables={callVariables}
      profile={profile}
      onUpdate={updateProfile}
      onUpdateSituation={updateProfileSituation}
      onToggleMotivation={toggleMotivation}
      onTogglePain={togglePainPoint}
    />
  );

  const renderPersonalizar = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <BulletScriptPanel
          tabs={PERSONALIZAR_TABS}
          recommendations={recommendations}
          darkMode={darkMode}
          callVariables={callVariables}
        />
      </div>
      <div className="space-y-4">
        <div className={`rounded-xl border p-5 ${darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-stone-200'}`}>
          <p className={`text-[10px] font-bold mb-3 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
            🏷️ PERFIL ACTIVO
          </p>
          {profile.generatedTags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {profile.generatedTags.map(tag => (
                <span key={tag} className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
                  darkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-100 text-amber-700'
                }`}>{tag}</span>
              ))}
            </div>
          ) : (
            <p className={`text-[10px] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
              Completa el sondeo para generar tags.
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderPersuasion = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        {recommendations.length === 0 ? (
          <div className={`rounded-xl border p-5 ${darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-stone-200'}`}>
            <p className={`text-[11px] text-center ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
              Todos los blocks de persuasión ya fueron utilizados o no son relevantes para este perfil.
            </p>
          </div>
        ) : (
          <BulletScriptPanel
            tabs={PERSUASION_TABS}
            recommendations={recommendations}
            darkMode={darkMode}
            callVariables={callVariables}
          />
        )}
      </div>
      <div className="space-y-4" />
    </div>
  );

  const renderCostos = () => (
    <CostosSection
      recommendations={recommendations}
      darkMode={darkMode}
      callVariables={callVariables}
      valueChecklist={valueChecklist}
      onToggleValueCheck={toggleValueCheck}
      callInterestDecision={callInterestDecision}
      onSetCallInterestDecision={setCallInterestDecision}
      callCostReasonGPS={callCostReasonGPS}
      onSetCallCostReasonGPS={setCallCostReasonGPS}
      onNavigateNext={goToNextCallStep}
    />
  );

  const renderAcordar = () => {
    const renderDemoAfterSpeech = (blockId: string, d: boolean) => {
      if (blockId !== 'acordar_no') return null;
      return (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
          {!demoAccepted && !followUpScheduled && (
            <div>
              <p className={`text-[11px] font-bold mb-3 ${d ? 'text-amber-400' : 'text-amber-700'}`}>
                🎓 Demo de Aula Virtual
              </p>
              <p className={`text-[10px] mb-4 ${d ? 'text-stone-400' : 'text-stone-600'}`}>
                Una demostración en vivo del aula virtual puede resolver todas sus dudas. Un docente le mostrará cómo funciona la plataforma, resolverá sus preguntas en tiempo real y verá por sí mismo la calidad del modelo educativo.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setDemoAccepted(true)}
                  className="flex-1 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[11px] font-bold hover:bg-blue-500/20 transition-all">
                  Sí, agendar demo
                </button>
                <button onClick={() => { setDemoAccepted(false); setFollowUpScheduled(false); }}
                  className="py-2.5 px-3 rounded-xl border text-[11px] font-bold transition-all dark:text-stone-400 dark:hover:text-stone-200 dark:border-white/10 dark:hover:bg-white/5 text-stone-500 hover:text-stone-700 border-stone-200 hover:bg-stone-50">
                  No, gracias
                </button>
              </div>
            </div>
          )}
          {demoAccepted && !followUpScheduled && (
            <div>
              <p className={`text-[11px] font-bold mb-3 ${d ? 'text-blue-400' : 'text-blue-700'}`}>
                📅 Agendar Seguimiento
              </p>
              <p className={`text-[10px] mb-4 ${d ? 'text-stone-400' : 'text-stone-600'}`}>
                Un docente te contactará para agendar la demo del aula virtual. Mientras tanto, ¿quieres agendar una llamada de seguimiento para resolver cualquier duda adicional?
              </p>
              <div className="flex gap-2">
                <button onClick={() => setFollowUpScheduled(true)}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold hover:bg-emerald-500/20 transition-all">
                  Sí, agendar seguimiento
                </button>
                <button onClick={() => setDemoAccepted(false)}
                  className="py-2.5 px-3 rounded-xl border text-[11px] font-bold transition-all dark:text-stone-400 dark:hover:text-stone-200 dark:border-white/10 dark:hover:bg-white/5 text-stone-500 hover:text-stone-700 border-stone-200 hover:bg-stone-50">
                  Atrás
                </button>
              </div>
            </div>
          )}
          {followUpScheduled && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">✅</span>
                <p className={`text-[11px] font-bold ${d ? 'text-emerald-400' : 'text-emerald-700'}`}>
                  Demo + Seguimiento agendados
                </p>
              </div>
              <p className={`text-[10px] ${d ? 'text-stone-500' : 'text-stone-400'}`}>
                Un docente te contactará para la demo. También se agendó una llamada de seguimiento. Se envía confirmación por correo.
              </p>
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <BulletScriptPanel
            tabs={ACORDAR_TABS}
            recommendations={recommendations}
            darkMode={darkMode}
            callVariables={callVariables}
            afterSpeech={renderDemoAfterSpeech}
          />
        </div>
        <div className="space-y-4 sticky top-4 self-start">
          <ConvictionScale darkMode={darkMode} onScale={setConvictionLevel} />

          {convictionLevel !== null && convictionLevel <= 6 && (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              <div className={`rounded-xl border p-5 ${darkMode ? 'bg-zinc-900 border-amber-500/20' : 'bg-amber-50/50 border-amber-200'}`}>
                <p className={`text-sm font-black font-display mb-3 ${darkMode ? 'text-stone-100' : 'text-stone-900'}`}>¿Cuál es la razón?</p>
                <div className="space-y-1.5">
                  {objectionReasons.map((reason) => (
                    <button key={reason.id} onClick={() => { setCallCostReasonGPS(reason.id); setDemoAccepted(false); setFollowUpScheduled(false); }}
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
                <ObjectionDeepCard
                  reasonId={callCostReasonGPS}
                  darkMode={darkMode}
                  callVariables={callVariables}
                />
              )}
            </div>
          )}

          {convictionLevel !== null && convictionLevel >= 7 && (
            <div className={`rounded-xl border p-5 ${darkMode ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
              <p className={`text-[11px] font-bold font-display mb-2 ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                ✅ Nivel de convicción alto — ¡Listo para cerrar!
              </p>
              <p className={`text-[10px] ${darkMode ? 'text-stone-500' : 'text-stone-600'}`}>
                "Perfecto. Para tu inscripción necesitamos: documentos digitales, solicitud de admisión y primera colegiatura."
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderGenericSection = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <BulletScriptPanel
          tabs={GENERIC_TABS}
          recommendations={recommendations}
          darkMode={darkMode}
          callVariables={callVariables}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <SectionWrapper
        meta={meta}
        darkMode={darkMode}
        currentBlockIndex={currentBlockIndex}
        totalBlocks={recommendations.length}
        footer={<NavigationBar darkMode={darkMode} />}
      >
        {renderSectionContent()}
      </SectionWrapper>
    </div>
  );
}
