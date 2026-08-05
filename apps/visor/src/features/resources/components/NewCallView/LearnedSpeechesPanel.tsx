import { Sparkles, RefreshCw, AlertTriangle, Trophy, Target, Loader2, BrainCircuit } from 'lucide-react';
import { useCallStore } from '../../store/useCallStore';
import { useAuthStore } from '../../../../auth/authStore';
import { renderScriptText } from '../../utils/renderScriptText';
import { sectionMeta } from '../../data/sections/sectionMeta';
import { defaultObjectionCategories } from '../../data/defaultObjections';
import { SALES_OUTCOME_LABELS } from '../../types';
import type { LearnedSpeech, LearningStatus, TopCallRef } from '../../types';
import {
  useLearnedSpeeches, useLearningStatus, useBestCalls, useRegenerateLearnedSpeeches,
} from '../../hooks/useLearnedSpeeches';

interface Props { darkMode: boolean; }

function formatDate(iso: string | null): string {
  if (!iso) return 'Nunca';
  try {
    return new Date(iso).toLocaleString('es-MX', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function SpeechCard({ speech, darkMode }: { speech: LearnedSpeech; darkMode: boolean }) {
  const callVariables = useCallStore(s => s.callVariables);
  return (
    <div className={`rounded-xl border-[2px] p-3 ${darkMode ? 'bg-[#24211e] border-[#4a4036]' : 'bg-stone-50 border-stone-200'}`}>
      <div className="flex items-center justify-between mb-1.5">
        <h4 className={`text-[10px] font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
          {speech.title}
        </h4>
        <span className={`shrink-0 text-[7px] font-bold px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
          🤖 IA
        </span>
      </div>
      <div className="flex flex-wrap gap-1 mb-2">
        <span className={`text-[7px] px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-zinc-800 text-stone-400' : 'bg-white text-stone-500 border border-stone-200'}`}>
          📞 {speech.sourceCallCount} llamadas
        </span>
        <span className={`text-[7px] px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-zinc-800 text-stone-400' : 'bg-white text-stone-500 border border-stone-200'}`}>
          ⭐ score {speech.avgScore}
        </span>
        <span className={`text-[7px] px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>
          🎉 {speech.winCount} ventas
        </span>
      </div>
      <div className={`text-[10px] leading-relaxed p-3 rounded-lg whitespace-pre-line ${darkMode ? 'bg-[#1c1a18] text-stone-400' : 'bg-white text-stone-600'}`}>
        {renderScriptText(speech.content, darkMode, callVariables)}
      </div>
    </div>
  );
}

export function LearnedSpeechesPanel({ darkMode }: Props) {
  const { data: learnedData, isLoading: loadingLearned } = useLearnedSpeeches();
  const { data: status } = useLearningStatus();
  const { data: bestCallsData, isLoading: loadingBest } = useBestCalls(20);
  const regenerate = useRegenerateLearnedSpeeches();

  const role = useAuthStore(s => s.user?.role);
  const isAdmin = role === 'admin';

  const speeches = learnedData?.speeches || [];
  const bestCalls: TopCallRef[] = bestCallsData?.calls || [];
  const ls = status as LearningStatus | undefined;

  const sectionSpeeches = speeches.filter(s => s.sectionId);
  const objectionSpeeches = speeches.filter(s => s.objectionId);

  const orderedSections = sectionMeta
    .filter(meta => sectionSpeeches.some(s => s.sectionId === meta.id))
    .map(meta => ({
      ...meta,
      items: sectionSpeeches.filter(s => s.sectionId === meta.id),
    }));

  const orderedObjections = defaultObjectionCategories
    .filter(cat => objectionSpeeches.some(s => s.objectionId === cat.id))
    .map(cat => ({
      ...cat,
      items: objectionSpeeches.filter(s => s.objectionId === cat.id),
    }));

  const loading = loadingLearned || (loadingBest && bestCalls.length === 0);

  return (
    <div className="p-3 space-y-3 max-h-[70vh] overflow-y-auto">
      {/* Stats header */}
      <div className={`rounded-xl border p-3 ${darkMode ? 'bg-zinc-900/50 border-white/5' : 'bg-white/50 border-stone-200'}`}>
        <div className="flex items-center gap-2 mb-2">
          <BrainCircuit className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <p className={`text-[10px] font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
            Aprendizaje IA · Top ventas
          </p>
        </div>
        {ls && (
          <div className="flex flex-wrap gap-1">
            <span className={`text-[7px] px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-zinc-800 text-stone-400' : 'bg-white text-stone-500 border border-stone-200'}`}>
              📞 {ls.totalCalls} llamadas auditadas
            </span>
            <span className={`text-[7px] px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-zinc-800 text-stone-400' : 'bg-white text-stone-500 border border-stone-200'}`}>
              🏆 {ls.topCallsCount} ganadoras (promedio {ls.avgTopScore})
            </span>
            <span className={`text-[7px] px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-zinc-800 text-stone-400' : 'bg-white text-stone-500 border border-stone-200'}`}>
              🤖 {ls.generatedSpeechCount} speeches
            </span>
            <span className={`text-[7px] px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-zinc-800 text-stone-400' : 'bg-white text-stone-500 border border-stone-200'}`}>
              🕒 Última regeneración: {formatDate(ls.lastRegeneratedAt)}
            </span>
          </div>
        )}

        {/* Warning banner */}
        {ls && ls.newCallsSince > 0 && (
          <div className={`mt-2.5 flex items-start gap-2 p-2.5 rounded-xl border ${
            ls.warning === 'warning'
              ? darkMode ? 'bg-amber-950/20 border-amber-800/40' : 'bg-amber-50 border-amber-200'
              : darkMode ? 'bg-zinc-800/60 border-white/10' : 'bg-stone-50 border-stone-200'
          }`}>
            <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${ls.warning === 'warning' ? (darkMode ? 'text-amber-400' : 'text-amber-600') : (darkMode ? 'text-stone-500' : 'text-stone-400')}`} />
            <div>
              <p className={`text-[9px] font-bold ${ls.warning === 'warning' ? (darkMode ? 'text-amber-300' : 'text-amber-700') : (darkMode ? 'text-stone-400' : 'text-stone-600')}`}>
                {ls.newCallsSince} {ls.newCallsSince === 1 ? 'llamada nueva' : 'llamadas nuevas'} aún no incorporadas al aprendizaje
              </p>
              <p className={`text-[8px] mt-0.5 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                {isAdmin
                  ? 'Usa "Regenerar" para que la IA aprenda de las nuevas llamadas.'
                  : 'El administrador debe regenerar para actualizar los speeches.'}
              </p>
            </div>
          </div>
        )}

        {/* Admin regenerate button */}
        {isAdmin && (
          <button
            onClick={() => regenerate.mutate()}
            disabled={regenerate.isPending || !ls?.canRegenerate}
            className={`mt-2.5 w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-[10px] font-bold transition-all ${
              darkMode
                ? 'bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 disabled:opacity-40'
                : 'bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 disabled:opacity-40'
            }`}>
            {regenerate.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {regenerate.isPending ? 'Aprendiendo de las mejores llamadas…' : 'Regenerar con las mejores llamadas'}
          </button>
        )}
        {!isAdmin && (
          <p className={`mt-2 text-[8px] italic ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>
            Solo el administrador puede regenerar el aprendizaje para controlar costos de IA.
          </p>
        )}
        {regenerate.isSuccess && (
          <p className={`mt-2 text-[9px] font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
            ✅ {regenerate.data?.count} speeches generados desde las mejores llamadas.
          </p>
        )}
        {regenerate.isError && (
          <p className={`mt-2 text-[9px] font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
            Error al regenerar. Intenta más tarde.
          </p>
        )}
      </div>

      {loading ? (
        <div className={`text-center py-8 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
          <p className="text-[10px]">Cargando aprendizaje…</p>
        </div>
      ) : speeches.length === 0 ? (
        <div className={`rounded-xl border p-6 text-center ${darkMode ? 'bg-zinc-900/50 border-white/5' : 'bg-white/50 border-stone-200'}`}>
          <Sparkles className={`w-6 h-6 mx-auto mb-2 ${darkMode ? 'text-stone-600' : 'text-stone-300'}`} />
          <p className={`text-[10px] font-bold ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
            Aún no hay speeches aprendidos
          </p>
          <p className={`text-[9px] mt-1 ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>
            Cuando un administrador regenere con las mejores llamadas (ventas cerradas o puntaje alto),
            aquí aparecerán los guiones ganadores por etapa y por objeción.
          </p>
        </div>
      ) : (
        <>
          {/* Sections learned */}
          {orderedSections.length > 0 && (
            <div className="space-y-2">
              <p className={`text-[9px] font-bold flex items-center gap-1 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                <Target className="w-3 h-3" /> Por etapa de la llamada
              </p>
              {orderedSections.map(section => (
                <div key={section.id} className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-zinc-900/50 border-white/5' : 'bg-white/50 border-stone-200'}`}>
                  <div className={`flex items-center gap-2 px-3 py-2.5 ${darkMode ? 'bg-[#1c1a18]' : 'bg-stone-50'}`}>
                    <span className="text-sm">{section.icon}</span>
                    <span className={`text-[10px] font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                      {section.title}
                    </span>
                  </div>
                  <div className="p-2 space-y-2">
                    {section.items.map(s => <SpeechCard key={s.id} speech={s} darkMode={darkMode} />)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Objections learned */}
          {orderedObjections.length > 0 && (
            <div className="space-y-2">
              <p className={`text-[9px] font-bold ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                💬 Respuestas a objeciones ganadoras
              </p>
              {orderedObjections.map(cat => (
                <div key={cat.id} className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-zinc-900/50 border-white/5' : 'bg-white/50 border-stone-200'}`}>
                  <div className={`flex items-center gap-2 px-3 py-2.5 ${darkMode ? 'bg-[#1c1a18]' : 'bg-stone-50'}`}>
                    <span className="text-sm">{cat.icon}</span>
                    <span className={`text-[10px] font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                      {cat.title}
                    </span>
                  </div>
                  <div className="p-2 space-y-2">
                    {cat.items.map(s => <SpeechCard key={s.id} speech={s} darkMode={darkMode} />)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Best calls reference */}
      <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-zinc-900/50 border-white/5' : 'bg-white/50 border-stone-200'}`}>
        <div className={`flex items-center gap-2 px-3 py-2.5 ${darkMode ? 'bg-[#1c1a18]' : 'bg-stone-50'}`}>
          <Trophy className={`w-3.5 h-3.5 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
          <span className={`text-[10px] font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
            Mejores llamadas de referencia
          </span>
          <span className={`text-[8px] font-bold shrink-0 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>{bestCalls.length}</span>
        </div>
        <div className="p-2 space-y-2">
          {bestCalls.length === 0 ? (
            <p className={`text-[9px] text-center py-3 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
              Aún no hay llamadas ganadoras auditadas.
            </p>
          ) : (
            bestCalls.map(call => (
              <div key={call.id} className={`rounded-lg border p-2.5 ${darkMode ? 'bg-[#24211e] border-[#3e382f]' : 'bg-stone-50 border-stone-200'}`}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className={`text-[9px] font-bold truncate ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                    {call.fileName}
                  </p>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                      {call.score}
                    </span>
                    {call.salesOutcome && (
                      <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>
                        {SALES_OUTCOME_LABELS[call.salesOutcome] || call.salesOutcome}
                      </span>
                    )}
                  </div>
                </div>
                {call.snippets[0] && (
                  <p className={`text-[8px] leading-relaxed line-clamp-2 ${darkMode ? 'text-stone-500' : 'text-stone-500'}`}>
                    “{call.snippets[0]}”
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
