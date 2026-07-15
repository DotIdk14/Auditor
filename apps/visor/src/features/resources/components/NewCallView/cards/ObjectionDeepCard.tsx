import { objectionPsychologyMap } from '../../../data/objections/objectionPsychology';
import { objectionReasons } from '../../../data/defaultObjections';
import { renderScriptText } from '../../../utils/renderScriptText';
import { Brain, MessageSquareWarning, AlertTriangle, MessageCircle, ArrowRight } from 'lucide-react';

interface Props {
  reasonId: string;
  darkMode: boolean;
  callVariables: Record<string, string>;
}

export function ObjectionDeepCard({ reasonId, darkMode, callVariables }: Props) {
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
    </div>
  );
}
