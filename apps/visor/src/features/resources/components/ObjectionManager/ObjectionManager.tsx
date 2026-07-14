import { useCallStore } from '../../store/useCallStore';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Circle, ChevronDown, Plus, Pencil, Trash2 } from 'lucide-react';
import { defaultObjectionCategories, objectionReasons } from '../../data/defaultObjections';

interface Props { darkMode: boolean; }

export function ObjectionManager({ darkMode }: Props) {
  const {
    usedResponses, expandedSections, callCostReason,
    getMergedObjections, toggleSection, toggleUsedResponse,
    openCreateObjectionModal, openEditObjectionModal, handleDeleteObjection,
  } = useCallStore();

  const mergedObjections = getMergedObjections();

  const checkRelevance = (catId: string) => {
    if (!callCostReason) return false;
    const r = objectionReasons.find(rs => rs.id === callCostReason);
    return r?.matchedObjections.includes(catId) ?? false;
  };

  return (
    <div className="space-y-4">
      <div className={`flex items-center justify-between p-4 rounded-2xl border ${darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'}`}>
        <div className="space-y-1">
          <p className={`text-[11px] font-bold ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>Manejo de Objeciones</p>
          <p className={`text-[9px] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
            {usedResponses.length} respuestas utilizadas · {defaultObjectionCategories.length} categorías
          </p>
        </div>
        {usedResponses.length > 0 && (
          <button onClick={() => useCallStore.setState({ usedResponses: [] })}
            className={`text-[9px] font-bold px-3 py-1.5 rounded-xl border transition-all ${
              darkMode ? 'border-red-900/40 text-red-400 hover:bg-red-950/20' : 'border-red-200 text-red-500 hover:bg-red-50'
            }`}>Limpiar</button>
        )}
      </div>

      {mergedObjections.map((cat) => {
        const isExpanded = expandedSections.includes(`obj_${cat.id}`);
        const relevant = checkRelevance(cat.id);
        return (
          <div key={cat.id} className={`rounded-2xl border overflow-hidden transition-all ${
            relevant ? darkMode ? 'bg-amber-950/10 border-amber-800/30' : 'bg-amber-50/50 border-amber-200'
            : darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'
          }`}>
            <button onClick={() => toggleSection(`obj_${cat.id}`)}
              className={`w-full flex items-center justify-between p-4 transition-all ${darkMode ? 'hover:bg-[#24211e]' : 'hover:bg-stone-50'}`}>
              <div className="flex items-center gap-3">
                <span className="text-lg">{cat.icon}</span>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-xs font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>{cat.title}</h3>
                    {relevant && <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-200 text-amber-700'}`}>Relevante</span>}
                  </div>
                  <p className={`text-[9px] mt-0.5 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>{cat.responses.length} respuestas</p>
                </div>
              </div>
              <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className={`w-4 h-4 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`} />
              </motion.div>
            </button>
            {isExpanded && (
              <div className={`border-t ${darkMode ? 'border-[#3e382f]' : 'border-[#dfd9cc]'}`}>
                <div className="p-4">
                  <div className={`text-[10px] italic p-3 rounded-lg mb-4 ${darkMode ? 'bg-[#24211e] text-stone-400' : 'bg-stone-50 text-stone-500'}`}>
                    {cat.objection}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {cat.responses.map((resp) => {
                      const isUsed = usedResponses.includes(resp.id);
                      const isCustom = resp.isCustom === true;
                      return (
                        <div key={resp.id} className={`rounded-xl border-[2px] p-4 transition-all flex flex-col ${isCustom ? 'border-dashed ' : ''}${
                          isUsed ? darkMode ? 'bg-emerald-950/15 border-emerald-800/30' : 'bg-emerald-50/60 border-emerald-200'
                          : isCustom ? darkMode ? 'bg-[#24211e] border-amber-800/40' : 'bg-stone-50 border-amber-300'
                          : darkMode ? 'bg-[#24211e] border-[#4a4036]' : 'bg-stone-50 border-stone-200'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <h4 className={`text-[11px] font-bold font-display truncate ${isUsed ? 'line-through opacity-60' : ''} ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>{resp.title}</h4>
                              {isCustom && <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${darkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>MI objeción</span>}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {isCustom && (
                                <>
                                  <button onClick={() => openEditObjectionModal(cat.id, resp)}
                                    className={`p-1 rounded-lg transition-all hover:scale-110 ${darkMode ? 'text-stone-500 hover:text-amber-400' : 'text-stone-400 hover:text-amber-600'}`}><Pencil className="w-3 h-3" /></button>
                                  <button onClick={() => handleDeleteObjection(cat.id, resp.id)}
                                    className={`p-1 rounded-lg transition-all hover:scale-110 ${darkMode ? 'text-stone-500 hover:text-red-400' : 'text-stone-400 hover:text-red-600'}`}><Trash2 className="w-3 h-3" /></button>
                                </>
                              )}
                              <button onClick={() => toggleUsedResponse(resp.id)}
                                className={`p-1 rounded-lg transition-all hover:scale-110 ${isUsed ? 'text-emerald-500' : darkMode ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600'}`}>
                                {isUsed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                          <div className={`text-[10px] leading-relaxed p-3 rounded-lg whitespace-pre-line flex-1 ${isUsed ? darkMode ? 'bg-emerald-950/10 text-stone-500' : 'bg-emerald-50/40 text-stone-500' : darkMode ? 'bg-[#1c1a18] text-stone-400' : 'bg-white text-stone-600'}`}>
                            {resp.content}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button onClick={() => openCreateObjectionModal(cat.id)}
                    className={`w-full mt-3 flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed text-[10px] font-bold transition-all ${
                      darkMode ? 'border-[#4a4036] text-stone-500 hover:border-amber-800/40 hover:text-amber-400'
                      : 'border-stone-200 text-stone-400 hover:border-amber-300 hover:text-amber-600'
                    }`}>
                    <Plus className="w-3.5 h-3.5" /> Agregar objeción
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
