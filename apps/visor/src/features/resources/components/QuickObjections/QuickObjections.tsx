import { useCallStore } from '../../store/useCallStore';
import { defaultObjectionCategories } from '../../data/defaultObjections';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X, ChevronDown, CheckCircle2, Circle } from 'lucide-react';

interface Props { darkMode: boolean; }

export function QuickObjections({ darkMode }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const { usedResponses, toggleUsedResponse } = useCallStore();
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  return (
    <>
      {/* FAB Button */}
      <button onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-30 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl transition-all hover:scale-105 ${
          darkMode ? 'bg-amber-900/80 text-amber-200 shadow-amber-900/30 backdrop-blur-md border border-amber-700/40'
          : 'bg-[#b57b54] text-white shadow-[#b57b54]/30'
        }`}>
        <AlertTriangle className="w-4 h-4" />
        <span className="text-[10px] font-bold">Objeciones</span>
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] overflow-y-auto rounded-t-3xl shadow-2xl ${
                darkMode ? 'bg-[#1c1a18] border-t border-[#3e382f]' : 'bg-white border-t border-stone-200'
              }`}>
              <div className={`flex items-center justify-between p-4 border-b sticky top-0 ${darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-stone-200'}`}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <h3 className={`text-sm font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                    Respuestas Rápidas
                  </h3>
                </div>
                <button onClick={() => setIsOpen(false)}
                  className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-[#24211e] text-stone-400' : 'hover:bg-stone-100 text-stone-500'}`}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 space-y-3">
                {defaultObjectionCategories.map(cat => (
                  <div key={cat.id} className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-[#24211e] border-[#3e382f]' : 'bg-stone-50 border-stone-200'}`}>
                    <button onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
                      className={`w-full flex items-center justify-between p-3 transition-all ${darkMode ? 'hover:bg-[#1c1a18]' : 'hover:bg-white'}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{cat.icon}</span>
                        <span className={`text-[11px] font-bold ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>{cat.title}</span>
                        <span className={`text-[8px] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>({cat.responses.length})</span>
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedCat === cat.id ? 'rotate-180' : ''} ${darkMode ? 'text-stone-500' : 'text-stone-400'}`} />
                    </button>
                    <AnimatePresence>
                      {expandedCat === cat.id && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                          <div className={`px-3 pb-3 space-y-2 border-t ${darkMode ? 'border-[#3e382f]' : 'border-stone-200'}`}>
                            <p className={`text-[9px] italic pt-2 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>{cat.objection}</p>
                            {cat.responses.map(resp => {
                              const isUsed = usedResponses.includes(resp.id);
                              return (
                                <div key={resp.id} className={`rounded-lg p-2.5 transition-all ${isUsed ? 'opacity-50' : ''} ${darkMode ? 'bg-[#1c1a18]' : 'bg-white'}`}>
                                  <div className="flex items-center justify-between mb-1">
                                    <p className={`text-[10px] font-bold ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>{resp.title}</p>
                                    <button onClick={() => toggleUsedResponse(resp.id)}
                                      className={`p-0.5 rounded transition-all ${isUsed ? 'text-emerald-500' : darkMode ? 'text-stone-600 hover:text-stone-300' : 'text-stone-300 hover:text-stone-600'}`}>
                                      {isUsed ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                                    </button>
                                  </div>
                                  <p className={`text-[9px] leading-relaxed ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>{resp.content}</p>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
