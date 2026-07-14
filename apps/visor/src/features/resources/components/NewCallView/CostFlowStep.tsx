import { useCallStore } from '../../store/useCallStore';
import { costFlow } from '../../data/costFlow';
import { objectionReasons } from '../../data/defaultObjections';
import { renderScriptText } from '../../utils/renderScriptText';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, CheckCircle2 } from 'lucide-react';

interface Props { darkMode: boolean; }

export function CostFlowStep({ darkMode }: Props) {
  const {
    callCostStep, callCostDecision, callCostReason, callVariables,
    setCallCostStep, setCallCostDecision, setCallCostReason, jumpToAcordar,
    getMergedObjections,
  } = useCallStore();

  const mergedObjections = getMergedObjections();

  const checkRelevance = (catId: string) => {
    if (!callCostReason) return false;
    const r = objectionReasons.find(rs => rs.id === callCostReason);
    return r?.matchedObjections.includes(catId) ?? false;
  };

  const getSorted = () => {
    if (!callCostReason) return mergedObjections;
    return [...mergedObjections].sort((a, b) => {
      const r = objectionReasons.find(rs => rs.id === callCostReason);
      if (!r) return 0;
      return (r.matchedObjections.includes(a.id) ? -1 : 0) - (r.matchedObjections.includes(b.id) ? -1 : 0);
    });
  };

  const stepColors = [
    { badge: 'bg-amber-900/30 text-amber-400', border: 'border-[#4a4036]' },
    { badge: 'bg-emerald-900/30 text-emerald-400', border: 'border-emerald-800/30' },
    { badge: 'bg-purple-900/30 text-purple-400', border: 'border-purple-800/30' },
    { badge: 'bg-blue-900/30 text-blue-400', border: 'border-blue-800/30' },
    { badge: 'bg-amber-900/30 text-amber-400', border: 'border-amber-800/40' },
  ];

  const stepExtras = [
    <div key="e0" className="grid grid-cols-3 gap-2 mt-4">
      {[{ label: 'Colegiatura', value: '$7,240' }, { label: 'Inscripción', value: '$1,000' }, { label: 'Complemento', value: '$2,000' }].map((item) => (
        <div key={item.label} className={`text-center p-2 rounded-lg border ${darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-stone-200'}`}>
          <p className={`text-[8px] font-bold ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>{item.label}</p>
          <p className={`text-sm font-black ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>{item.value}</p>
        </div>
      ))}
    </div>,
    <div key="e1" className="grid grid-cols-3 gap-2 mt-4">
      {[{ label: 'Colegiatura', old: '$7,240', value: '$2,419' }, { label: 'Inscripción', old: '$1,000', value: 'ANULADA' }, { label: 'Complemento', old: '$2,000', value: '$1,000' }].map((item) => (
        <div key={item.label} className={`text-center p-2 rounded-lg border ${darkMode ? 'bg-emerald-950/20 border-emerald-800/30' : 'bg-emerald-50 border-emerald-200'}`}>
          <p className={`text-[8px] font-bold ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>{item.label}</p>
          <p className={`text-[9px] line-through ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>{item.old}</p>
          <p className={`text-sm font-black ${item.value === 'ANULADA' ? 'text-red-500 line-through' : 'text-emerald-600'}`}>{item.value}</p>
        </div>
      ))}
    </div>,
    <div key="e2" className="grid grid-cols-2 gap-2 mt-4">
      {[{ icon: '🎁', label: 'Tú recibes un beneficio' }, { icon: '👥', label: 'Tu referido también recibe uno' }].map((item) => (
        <div key={item.label} className={`flex items-center gap-2 p-2 rounded-lg border ${darkMode ? 'bg-purple-950/20 border-purple-800/30' : 'bg-purple-50 border-purple-200'}`}>
          <span className="text-sm">{item.icon}</span>
          <p className={`text-[9px] font-bold ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>{item.label}</p>
        </div>
      ))}
    </div>,
    <div key="e3" className="grid grid-cols-2 gap-2 mt-4">
      {[{ icon: '📚', label: 'Cursos exclusivos de Platzi' }, { icon: '🎯', label: 'Metodología práctica' }, { icon: '🏆', label: 'Certificaciones laborales' }, { icon: '🤝', label: 'Comunidad y mentores' }].map((item) => (
        <div key={item.label} className={`flex items-center gap-2 p-2 rounded-lg border ${darkMode ? 'bg-blue-950/20 border-blue-800/30' : 'bg-blue-50 border-blue-200'}`}>
          <span className="text-sm">{item.icon}</span>
          <p className={`text-[9px] font-bold ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>{item.label}</p>
        </div>
      ))}
    </div>,
  ];

  return (
    <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'}`}>
      <p className={`text-[10px] font-bold mb-3 ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}>Flujo de Costos</p>
      <AnimatePresence mode="wait">
        {callCostStep < 4 && callCostDecision === null && (
          <motion.div key={`cs${callCostStep}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
            <div className={`rounded-xl border-[2px] p-5 ${darkMode ? `bg-[#24211e] ${stepColors[callCostStep].border}` : 'bg-stone-50 border-stone-200'}`}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${stepColors[callCostStep].badge}`}>
                  PASO {callCostStep + 1} DE 5
                </span>
                <h4 className={`text-xs font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                  {costFlow.steps[callCostStep].title}
                </h4>
              </div>
              {callCostStep === 0 && (
                <p className={`text-[11px] font-bold mb-3 ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}>¿Tienes dónde tomar nota?</p>
              )}
              <div className={`text-[11px] leading-relaxed p-4 rounded-lg whitespace-pre-line ${darkMode ? 'bg-[#1c1a18] text-stone-400' : 'bg-white text-stone-600'}`}>
                {renderScriptText(costFlow.steps[callCostStep].content, darkMode, callVariables)}
              </div>
              {stepExtras[callCostStep]}
              <button onClick={() => setCallCostStep(callCostStep + 1)}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#faedcd] border border-[#d4a373] text-[#b57b54] text-[10px] font-bold hover:bg-[#ffeec2] transition-all">
                Siguiente <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
        {callCostStep === 4 && callCostDecision === null && (
          <motion.div key="cs4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
            <div className={`rounded-xl border-[2px] p-8 text-center ${darkMode ? 'bg-[#24211e] border-amber-800/40' : 'bg-amber-50 border-amber-200'}`}>
              <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${stepColors[4].badge}`}>PASO 5 DE 5</span>
              <p className={`text-lg font-black font-display mt-4 mb-6 ${darkMode ? 'text-stone-100' : 'text-stone-900'}`}>
                {costFlow.steps[4].prompt}
              </p>
              <div className="flex items-center justify-center gap-4">
                <button onClick={() => { setCallCostDecision('yes'); jumpToAcordar(); }}
                  className="px-8 py-3 rounded-xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-500 transition-all hover:scale-105 shadow-lg shadow-emerald-900/30">SÍ</button>
                <button onClick={() => { setCallCostDecision('no'); jumpToAcordar(); }}
                  className={`px-8 py-3 rounded-xl text-sm font-black transition-all hover:scale-105 border-2 ${
                    darkMode ? 'border-red-800/40 text-red-400 hover:bg-red-950/30' : 'border-red-200 text-red-600 hover:bg-red-50'
                  }`}>NO</button>
              </div>
            </div>
          </motion.div>
        )}
        {callCostDecision !== null && (
          <motion.div key="csdone" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}
            className={`flex items-center gap-3 p-3 rounded-xl ${darkMode ? 'bg-emerald-950/10' : 'bg-emerald-50/50'}`}>
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <p className={`text-[11px] font-bold ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>Sección completada</p>
              <p className={`text-[9px] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                Respuesta: {callCostDecision === 'yes' ? 'SÍ — Confirma interés' : `NO — ${callCostReason ? objectionReasons.find(r => r.id === callCostReason)?.label : 'Requiere seguimiento'}`}
              </p>
            </div>
            <button onClick={() => { setCallCostStep(0); setCallCostDecision(null); setCallCostReason(null); }}
              className={`ml-auto text-[9px] font-bold px-2 py-1 rounded-lg border transition-all ${
                darkMode ? 'border-[#3e382f] text-stone-400 hover:text-stone-200' : 'border-stone-200 text-stone-500 hover:text-stone-700'
              }`}>Repetir</button>
          </motion.div>
        )}

        {/* Acordar sub-flow when NO + no reason */}
        {callCostDecision === 'no' && callCostReason === null && (
          <motion.div key="costno" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className={`rounded-xl border-[2px] p-5 ${darkMode ? 'bg-[#24211e] border-amber-800/30' : 'bg-amber-50/50 border-amber-200'}`}>
              <p className={`text-sm font-black font-display mb-2 ${darkMode ? 'text-stone-100' : 'text-stone-900'}`}>¿Cuál es la razón?</p>
              <p className={`text-[10px] mb-4 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>Selecciona el motivo para ver las objeciones más relevantes primero.</p>
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
          </motion.div>
        )}

        {/* Acordar sub-flow when NO + reason selected → show objections */}
        {callCostDecision === 'no' && callCostReason !== null && (
          <motion.div key="costobjections" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${darkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>OBJECIONES DISPONIBLES</span>
              <span className={`text-[9px] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                Razón: {objectionReasons.find(r => r.id === callCostReason)?.label}
              </span>
            </div>
            {getSorted().map((cat) => {
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
                  {cat.responses.map((resp) => (
                    <div key={resp.id} className="mb-2 last:mb-0">
                      <p className={`text-[9px] font-bold mb-1 ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>{resp.title}</p>
                      <div className={`text-[10px] leading-relaxed p-3 rounded-lg whitespace-pre-line ${darkMode ? 'bg-[#1c1a18] text-stone-400' : 'bg-white text-stone-600'}`}>
                        {resp.content}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
