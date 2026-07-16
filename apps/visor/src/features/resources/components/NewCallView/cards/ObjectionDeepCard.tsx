import { objectionPsychologyMap } from '../../../data/objections/objectionPsychology';
import { objectionReasons } from '../../../data/defaultObjections';
import { renderScriptText } from '../../../utils/renderScriptText';
import { Brain, MessageSquareWarning, AlertTriangle, MessageCircle, ArrowRight } from 'lucide-react';

interface Props {
  reasonId: string;
  darkMode: boolean;
  callVariables: Record<string, string>;
  demoAccepted?: boolean;
  followUpScheduled?: boolean;
  onAcceptDemo?: () => void;
  onScheduleFollowUp?: () => void;
  onRejectDemo?: () => void;
  onBackFromFollowUp?: () => void;
}

export function ObjectionDeepCard({
  reasonId, darkMode, callVariables,
  demoAccepted = false, followUpScheduled = false,
  onAcceptDemo, onScheduleFollowUp, onRejectDemo, onBackFromFollowUp,
}: Props) {
  const reason = objectionReasons.find(r => r.id === reasonId);
  if (!reason) return null;

  const relevantCategories = reason.matchedObjections;
  const firstCategory = relevantCategories[0];
  const psychology = firstCategory ? objectionPsychologyMap[firstCategory] : null;

  return (
    <div className="space-y-3">
      {/* Reason header */}
      <div className={`rounded-2xl border-[2px] p-4 ${
        darkMode ? 'bg-[#1c1a18] border-amber-800/30' : 'bg-amber-50 border-amber-200'
      }`}>
        <p className={`text-[10px] font-bold ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>
          Razón: {reason.label}
        </p>
      </div>

      {/* Psychology deep dive */}
      {psychology && (
        <div className={`rounded-2xl border-[2px] p-4 ${
          darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-purple-500" />
            <p className={`text-[10px] font-bold ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
              ANÁLISIS PSICOLÓGICO
            </p>
          </div>

          <div className="space-y-2">
            {/* Real meaning */}
            <div className={`p-2 rounded-xl ${darkMode ? 'bg-[#24211e]' : 'bg-stone-50'}`}>
              <p className={`text-[8px] font-bold mb-0.5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                <MessageSquareWarning className="w-3 h-3 inline mr-1" />
                QUÉ SIGNIFICA REALMENTE
              </p>
              <p className={`text-[9px] ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                {psychology.realMeaning}
              </p>
            </div>

            {/* Emotion behind */}
            <div className={`p-2 rounded-xl ${darkMode ? 'bg-[#24211e]' : 'bg-stone-50'}`}>
              <p className={`text-[8px] font-bold mb-0.5 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                🎭 EMOCIÓN DETRÁS
              </p>
              <p className={`text-[9px] ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                {psychology.emotionBehind}
              </p>
            </div>

            {/* Don't say */}
            <div className={`p-2 rounded-xl border ${darkMode ? 'bg-red-950/20 border-red-800/30' : 'bg-red-50 border-red-200'}`}>
              <p className={`text-[8px] font-bold mb-0.5 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                <AlertTriangle className="w-3 h-3 inline mr-1" />
                QUÉ NO DECIR
              </p>
              <p className={`text-[9px] italic ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                {psychology.dontSay}
              </p>
            </div>

            {/* Recommended speech */}
            <div className={`p-2 rounded-xl border ${darkMode ? 'bg-emerald-950/20 border-emerald-800/30' : 'bg-emerald-50 border-emerald-200'}`}>
              <p className={`text-[8px] font-bold mb-0.5 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                <MessageCircle className="w-3 h-3 inline mr-1" />
                SPEECH RECOMENDADO
              </p>
              <div className={`text-[9px] leading-relaxed p-2 rounded-lg whitespace-pre-line mt-1 ${
                darkMode ? 'bg-[#1c1a18] text-stone-400' : 'bg-white text-stone-600'
              }`}>
                {renderScriptText(psychology.recommendedSpeech, darkMode, callVariables)}
              </div>
            </div>

            {/* Follow up question */}
            <div className={`p-2 rounded-xl ${darkMode ? 'bg-[#24211e]' : 'bg-stone-50'}`}>
              <p className={`text-[8px] font-bold mb-0.5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                <ArrowRight className="w-3 h-3 inline mr-1" />
                PREGUNTA DE REGRESO
              </p>
              <p className={`text-[9px] font-bold ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                "{psychology.followUpQuestion}"
              </p>
            </div>

            {/* After response */}
            <div className={`p-2 rounded-xl ${darkMode ? 'bg-[#24211e]' : 'bg-stone-50'}`}>
              <p className={`text-[8px] font-bold mb-0.5 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                ➡️ DESPUÉS DE RESPONDER
              </p>
              <p className={`text-[9px] ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                {psychology.afterResponse}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Demo flow integrated inside objection deep card */}
      {onAcceptDemo && !demoAccepted && !followUpScheduled && (
        <div className={`rounded-xl border p-4 ${darkMode ? 'bg-zinc-900 border-blue-500/20' : 'bg-blue-50/50 border-blue-200'}`}>
          <p className={`text-[10px] font-bold mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
            🎓 ¿Aún tiene dudas? Demo de Aula Virtual
          </p>
          <p className={`text-[9px] mb-3 ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
            Una demostración en vivo del aula virtual puede resolver todas sus dudas. Un docente le mostrará cómo funciona la plataforma, resolverá sus preguntas en tiempo real y verá por sí mismo la calidad del modelo educativo.
          </p>
          <div className="flex gap-2">
            <button onClick={onAcceptDemo}
              className="flex-1 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-bold hover:bg-blue-500/20 transition-all">
              Sí, agendar demo
            </button>
            <button onClick={onRejectDemo}
              className="py-2 px-3 rounded-xl border text-[10px] font-bold transition-all dark:text-stone-400 dark:hover:text-stone-200 dark:border-white/10 dark:hover:bg-white/5 text-stone-500 hover:text-stone-700 border-stone-200 hover:bg-stone-50">
              No, gracias
            </button>
          </div>
        </div>
      )}
      {onAcceptDemo && demoAccepted && !followUpScheduled && (
        <div className={`rounded-xl border p-4 ${darkMode ? 'bg-blue-500/5 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
          <p className={`text-[10px] font-bold mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
            📅 Agendar Seguimiento
          </p>
          <p className={`text-[9px] mb-3 ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
            Un docente te contactará para agendar la demo del aula virtual. Mientras tanto, ¿quieres agendar una llamada de seguimiento para resolver cualquier duda adicional?
          </p>
          <div className="flex gap-2">
            <button onClick={onScheduleFollowUp}
              className="flex-1 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold hover:bg-emerald-500/20 transition-all">
              Sí, agendar seguimiento
            </button>
            <button onClick={onBackFromFollowUp}
              className="py-2 px-3 rounded-xl border text-[10px] font-bold transition-all dark:text-stone-400 dark:hover:text-stone-200 dark:border-white/10 dark:hover:bg-white/5 text-stone-500 hover:text-stone-700 border-stone-200 hover:bg-stone-50">
              Atrás
            </button>
          </div>
        </div>
      )}
      {onAcceptDemo && followUpScheduled && (
        <div className={`rounded-xl border p-4 ${darkMode ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">✅</span>
            <p className={`text-[10px] font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
              Demo + Seguimiento agendados
            </p>
          </div>
          <p className={`text-[9px] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
            Un docente contactará para la demo. También se agendó una llamada de seguimiento. Se envía confirmación por correo.
          </p>
        </div>
      )}
    </div>
  );
}
