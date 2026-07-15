import { useCallStore } from '../../store/useCallStore';
import { getRecommendedBlocks } from '../../data/engine/flowEngine';
import { getSectionMeta } from '../../data/sections/sectionMeta';
import { SmartBlockCard } from './cards/SmartBlockCard';
import { ProfileBuilder } from './cards/ProfileBuilder';
import { ValueChecklist } from './cards/ValueChecklist';
import { ConvictionScale } from './cards/ConvictionScale';
import { ObjectionDeepCard } from './cards/ObjectionDeepCard';
import { SectionWrapper } from './cards/SectionWrapper';
import { NavigationBar } from './NavigationBar';
import { objectionReasons } from '../../data/defaultObjections';

interface Props { darkMode: boolean; }

export function ConversationAssistantGPS({ darkMode }: Props) {
  const {
    currentCallStep, callSteps, callVariables,
    getSafeCallStep,
    profile, updateProfile, updateProfileSituation, toggleMotivation, togglePainPoint,
    usedBlockIds, markBlockUsed, markBlockSignal,
    valueChecklist, toggleValueCheck,
    callCostReasonGPS, setCallCostReasonGPS,
    convictionLevel, setConvictionLevel,
    callInterestDecision, setCallInterestDecision,
  } = useCallStore();

  const currentStep = getSafeCallStep();
  if (!currentStep) return null;

  const sectionId = currentStep.sectionId || '';
  const meta = getSectionMeta(sectionId);
  if (!meta) {
    return (
      <div className="space-y-4">
        <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'}`}>
          <p className={`text-xs font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
            {currentStep.title || 'Paso personalizado'}
          </p>
          <div className={`text-[10px] leading-relaxed p-3 rounded-lg mt-3 whitespace-pre-line ${darkMode ? 'bg-[#24211e] text-stone-400' : 'bg-stone-50 text-stone-600'}`}>
            {currentStep.content}
          </div>
        </div>
        <NavigationBar darkMode={darkMode} />
      </div>
    );
  }

  const recommendations = getRecommendedBlocks(profile, sectionId, usedBlockIds);
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
    <div className="space-y-3">
      {recommendations.map((rec, i) => (
        <SmartBlockCard
          key={rec.block.id}
          block={rec.block}
          darkMode={darkMode}
          callVariables={callVariables}
          isRecommended={i === 0}
          recommendationReason={rec.reason}
          onMarkUsed={markBlockUsed}
          onSignal={(id, sig) => {
            markBlockSignal(id, sig);
          }}
        />
      ))}
    </div>
  );

  const renderSondeo = () => (
    <div className="space-y-4">
      <ProfileBuilder
        profile={profile}
        darkMode={darkMode}
        onUpdate={updateProfile}
        onUpdateSituation={updateProfileSituation}
        onToggleMotivation={toggleMotivation}
        onTogglePain={togglePainPoint}
      />
      <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'}`}>
        <p className={`text-[10px] font-bold mb-3 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
          🗣️ SPEECHES RECOMENDADOS
        </p>
        <div className="space-y-3">
          {recommendations.map((rec, i) => (
            <SmartBlockCard
              key={rec.block.id}
              block={rec.block}
              darkMode={darkMode}
              callVariables={callVariables}
              isRecommended={i === 0}
              recommendationReason={rec.reason}
              onMarkUsed={markBlockUsed}
              onSignal={(id, sig) => markBlockSignal(id, sig)}
            />
          ))}
        </div>
      </div>
    </div>
  );

  const renderPersonalizar = () => (
    <div className="space-y-4">
      {profile.generatedTags.length > 0 && (
        <div className={`rounded-2xl border p-3 ${darkMode ? 'bg-amber-950/20 border-amber-800/30' : 'bg-amber-50 border-amber-200'}`}>
          <p className={`text-[9px] font-bold ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>
            🏷️ Tags activos: {profile.generatedTags.join(', ')}
          </p>
        </div>
      )}
      <div className="space-y-3">
        {recommendations.map((rec, i) => (
          <SmartBlockCard
            key={rec.block.id}
            block={rec.block}
            darkMode={darkMode}
            callVariables={callVariables}
            isRecommended={i === 0}
            recommendationReason={rec.reason}
            onMarkUsed={markBlockUsed}
            onSignal={(id, sig) => markBlockSignal(id, sig)}
          />
        ))}
      </div>
    </div>
  );

  const renderPersuasion = () => (
    <div className="space-y-3">
      {recommendations.length === 0 && (
        <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-[#24211e] border-[#3e382f]' : 'bg-stone-50 border-[#dfd9cc]'}`}>
          <p className={`text-[10px] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
            Todos los blocks de persuasión ya fueron utilizados o no son relevantes para este perfil.
          </p>
        </div>
      )}
      {recommendations.map((rec, i) => (
        <SmartBlockCard
          key={rec.block.id}
          block={rec.block}
          darkMode={darkMode}
          callVariables={callVariables}
          isRecommended={i === 0}
          recommendationReason={rec.reason}
          onMarkUsed={markBlockUsed}
          onSignal={(id, sig) => markBlockSignal(id, sig)}
        />
      ))}
    </div>
  );

  const renderCostos = () => (
    <div className="space-y-4">
      <ValueChecklist items={valueChecklist} darkMode={darkMode} onToggle={toggleValueCheck} />

      <div className="space-y-3">
        {recommendations.map((rec, i) => (
          <SmartBlockCard
            key={rec.block.id}
            block={rec.block}
            darkMode={darkMode}
            callVariables={callVariables}
            isRecommended={i === 0}
            recommendationReason={rec.reason}
            onMarkUsed={markBlockUsed}
            onSignal={(id, sig) => markBlockSignal(id, sig)}
          />
        ))}
      </div>

      {callInterestDecision === null && (
        <div className={`rounded-2xl border-[2px] p-4 ${darkMode ? 'bg-[#24211e] border-amber-800/30' : 'bg-amber-50/50 border-amber-200'}`}>
          <p className={`text-[11px] font-bold font-display mb-3 ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
            ¿Se adapta a lo que buscas?
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

      {callInterestDecision === 'no' && (
        <div className="space-y-3">
          <div className={`rounded-xl border-[2px] p-5 ${darkMode ? 'bg-[#24211e] border-amber-800/30' : 'bg-amber-50/50 border-amber-200'}`}>
            <p className={`text-sm font-black font-display mb-2 ${darkMode ? 'text-stone-100' : 'text-stone-900'}`}>¿Cuál es la razón?</p>
            <div className="space-y-2">
              {objectionReasons.map((reason) => (
                <button key={reason.id} onClick={() => setCallCostReasonGPS(reason.id)}
                  className={`w-full text-left p-3 rounded-xl border-2 text-[11px] font-bold transition-all ${
                    darkMode ? 'border-[#4a4036] text-stone-300 hover:border-amber-800/40 hover:text-amber-400 hover:bg-amber-950/20'
                    : 'border-stone-200 text-stone-600 hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50'
                  }`}>{reason.label}</button>
              ))}
            </div>
          </div>
          {callCostReasonGPS && (
            <ObjectionDeepCard reasonId={callCostReasonGPS} darkMode={darkMode} callVariables={callVariables} />
          )}
        </div>
      )}

      {callInterestDecision === 'yes' && (
        <div className={`flex items-center gap-3 p-4 rounded-xl ${darkMode ? 'bg-emerald-950/20 border border-emerald-800/30' : 'bg-emerald-50 border border-emerald-200'}`}>
          <p className={`text-[10px] font-bold ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>SÍ — Confirma interés</p>
        </div>
      )}
    </div>
  );

  const renderAcordar = () => (
    <div className="space-y-4">
      <ConvictionScale darkMode={darkMode} onScale={setConvictionLevel} />

      {convictionLevel !== null && convictionLevel <= 6 && (
        <div className="space-y-3">
          <div className={`rounded-xl border-[2px] p-5 ${darkMode ? 'bg-[#24211e] border-amber-800/30' : 'bg-amber-50/50 border-amber-200'}`}>
            <p className={`text-sm font-black font-display mb-2 ${darkMode ? 'text-stone-100' : 'text-stone-900'}`}>¿Cuál es la razón?</p>
            <div className="space-y-2">
              {objectionReasons.map((reason) => (
                <button key={reason.id} onClick={() => setCallCostReasonGPS(reason.id)}
                  className={`w-full text-left p-3 rounded-xl border-2 text-[11px] font-bold transition-all ${
                    darkMode ? 'border-[#4a4036] text-stone-300 hover:border-amber-800/40 hover:text-amber-400 hover:bg-amber-950/20'
                    : 'border-stone-200 text-stone-600 hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50'
                  }`}>{reason.label}</button>
              ))}
            </div>
          </div>
          {callCostReasonGPS && (
            <ObjectionDeepCard reasonId={callCostReasonGPS} darkMode={darkMode} callVariables={callVariables} />
          )}
        </div>
      )}

      {convictionLevel !== null && convictionLevel >= 7 && (
        <div className={`rounded-2xl border-[2px] p-4 ${darkMode ? 'bg-[#1c1a18] border-emerald-800/30' : 'bg-emerald-50 border-emerald-200'}`}>
          <p className={`text-[11px] font-bold font-display mb-2 ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
            ✅ Nivel de convicción alto — ¡Listo para cerrar!
          </p>
          <p className={`text-[9px] ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
            "Perfecto. Para tu inscripción necesitamos: documentos digitales, solicitud de admisión y primera colegiatura."
          </p>
        </div>
      )}

      <div className="space-y-3">
        {recommendations.map((rec, i) => (
          <SmartBlockCard
            key={rec.block.id}
            block={rec.block}
            darkMode={darkMode}
            callVariables={callVariables}
            isRecommended={i === 0}
            recommendationReason={rec.reason}
            onMarkUsed={markBlockUsed}
            onSignal={(id, sig) => markBlockSignal(id, sig)}
          />
        ))}
      </div>
    </div>
  );

  const renderGenericSection = () => (
    <div className="space-y-3">
      {recommendations.map((rec, i) => (
        <SmartBlockCard
          key={rec.block.id}
          block={rec.block}
          darkMode={darkMode}
          callVariables={callVariables}
          isRecommended={i === 0}
          recommendationReason={rec.reason}
          onMarkUsed={markBlockUsed}
          onSignal={(id, sig) => markBlockSignal(id, sig)}
        />
      ))}
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
