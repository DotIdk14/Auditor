import { useCallStore } from '../../store/useCallStore';
import { closingFlowSuccess } from '../../data/closingFlow';
import { renderScriptText } from '../../utils/renderScriptText';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';

interface Props { darkMode: boolean; }

export function AcordarStep({ darkMode }: Props) {
  const {
    callInterestDecision, callCostDecision, callCostReason,
    setCallInterestDecision, showDemoInvite, setShowDemoInvite, callVariables,
  } = useCallStore();

  const acordarDecision = callInterestDecision || (callCostDecision === 'yes' ? 'yes' as const : callCostDecision === 'no' ? 'no' as const : null);

  return (
    <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'}`}>
      <AnimatePresence mode="wait">
        {acordarDecision === null && (
          <motion.div key="acdprompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className={`rounded-xl border-[2px] p-5 ${darkMode ? 'bg-[#24211e] border-amber-800/30' : 'bg-amber-50/50 border-amber-200'}`}>
              <p className={`text-[11px] font-bold font-display mb-3 ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                ¿Cómo terminó la conversación?
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
          </motion.div>
        )}

        {acordarDecision === 'yes' && (
          <motion.div key="acy" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-3">
            <div className={`rounded-xl border-[2px] p-5 ${darkMode ? 'bg-[#24211e] border-emerald-800/30' : 'bg-emerald-50/50 border-emerald-200'}`}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${darkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>CIERRE EXITOSO</span>
              </div>
              <div className={`text-[11px] leading-relaxed p-4 rounded-lg whitespace-pre-line ${darkMode ? 'bg-[#1c1a18] text-stone-400' : 'bg-white text-stone-600'}`}>
                {renderScriptText(closingFlowSuccess.content, darkMode, callVariables)}
              </div>
              <div className="mt-4 space-y-2">
                {['Documentos digitales (título, acta de nacimiento, CURP)', 'Solicitud de admisión', 'Primera colegiatura'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${darkMode ? 'border-emerald-700' : 'border-emerald-400'}`}>
                      <span className="text-emerald-500 text-[8px]">✓</span>
                    </div>
                    <span className={`text-[10px] ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {!showDemoInvite ? (
              <button onClick={() => setShowDemoInvite(true)}
                className={`w-full p-3 rounded-xl border-[2px] border-dashed text-center transition-all ${
                  darkMode ? 'border-blue-800/40 bg-blue-950/10 text-blue-400 hover:bg-blue-950/20'
                  : 'border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-50'
                }`}>
                <span className="text-[10px] font-bold font-display">🖥️ ¿Invitar a Demo?</span>
                <p className={`text-[8px] mt-1 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                  Opcional — Mostrar para agendar demostración de aula virtual
                </p>
              </button>
            ) : (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className={`rounded-xl border-[2px] p-5 ${darkMode ? 'bg-[#24211e] border-blue-800/30' : 'bg-blue-50/50 border-blue-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>INVITACIÓN</span>
                  <button onClick={() => setShowDemoInvite(false)}
                    className={`text-[8px] px-2 py-0.5 rounded-lg ${darkMode ? 'text-stone-500 hover:bg-[#1c1a18]' : 'text-stone-400 hover:bg-stone-100'}`}>
                    Cerrar
                  </button>
                </div>
                <p className={`text-[11px] font-bold font-display mb-2 ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                  🖥️ Demostración de Aula Virtual
                </p>
                <div className={`text-[10px] leading-relaxed p-4 rounded-lg whitespace-pre-line ${darkMode ? 'bg-[#1c1a18] text-stone-400' : 'bg-white text-stone-600'}`}>
{`Además de esta llamada, te invito a una demostración en vivo del aula virtual.

En esta sesión un docente te muestra cómo funcionan las clases en tiempo real: cómo accedes a los materiales, participas en clase, entregas tareas y consultas al profesor.

Es la mejor forma de que veas con tus propios ojos cómo serán tus clases.

¿Te gustaría agendarla?`}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${darkMode ? 'bg-blue-950/30' : 'bg-blue-100'}`}>
                    <span className="text-xs">👨‍🏫</span>
                    <span className={`text-[9px] font-bold ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>Impartida por docente</span>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${darkMode ? 'bg-blue-950/30' : 'bg-blue-100'}`}>
                    <span className="text-xs">⏱️</span>
                    <span className={`text-[9px] font-bold ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>~30 min</span>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {acordarDecision === 'no' && (
          <motion.div key="acn" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            <div className={`flex items-center gap-3 p-4 rounded-xl ${darkMode ? 'bg-red-950/20 border border-red-800/30' : 'bg-red-50 border border-red-200'}`}>
              <CheckCircle2 className="w-4 h-4 text-red-500 shrink-0" />
              <div>
                <p className={`text-[10px] font-bold ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>NO — No le interesa</p>
                <p className={`text-[8px] mt-0.5 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                  Selecciona SÍ o NO arriba para continuar al cierre.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
