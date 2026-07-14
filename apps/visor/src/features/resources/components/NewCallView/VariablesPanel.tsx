import { useCallStore } from '../../store/useCallStore';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';

interface Props { darkMode: boolean; }

export function VariablesPanel({ darkMode }: Props) {
  const { callVariables, setCallVariables, showVarsPanel, setShowVarsPanel } = useCallStore();
  const filledCount = Object.values(callVariables).filter(v => v.trim()).length;

  return (
    <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'}`}>
      <button onClick={() => setShowVarsPanel(v => !v)}
        className={`w-full flex items-center justify-between p-4 text-left transition-all ${darkMode ? 'hover:bg-[#24211e]' : 'hover:bg-stone-50'}`}>
        <div className="flex items-center gap-2">
          <span className="text-sm">✏️</span>
          <span className={`text-[10px] font-bold font-display ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
            Variables de Llamada
          </span>
          {filledCount > 0 && (
            <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
              {filledCount} configuradas
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${showVarsPanel ? 'rotate-180' : ''} ${darkMode ? 'text-stone-500' : 'text-stone-400'}`} />
      </button>
      <AnimatePresence>
        {showVarsPanel && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className={`px-4 pb-4 pt-0 grid grid-cols-2 gap-3 border-t ${darkMode ? 'border-[#3e382f]' : 'border-stone-200'}`}>
              {[
                { key: 'Nombre', label: 'Nombre del cliente', placeholder: 'Ej: María López' },
                { key: 'Carrera', label: 'Carrera', placeholder: 'Ej: Administración de Empresas' },
              ].map(v => (
                <div key={v.key}>
                  <label className={`block text-[8px] font-bold mb-1 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>{v.label}</label>
                  <input type="text" placeholder={v.placeholder}
                    value={callVariables[v.key] || ''}
                    onChange={(e) => setCallVariables(prev => ({ ...prev, [v.key]: e.target.value }))}
                    className={`w-full px-2.5 py-1.5 rounded-lg border text-[10px] focus:outline-none transition-all ${
                      callVariables[v.key]?.trim()
                        ? darkMode ? 'bg-amber-950/10 border-amber-800/30 text-stone-200 placeholder-stone-600 focus:border-amber-700/50'
                          : 'bg-amber-50/50 border-amber-200 text-stone-800 placeholder-stone-400 focus:border-amber-400'
                        : darkMode ? 'bg-[#24211e] border-[#3e382f] text-stone-300 placeholder-stone-600 focus:border-[#d4a373]'
                          : 'bg-[#fcfbf9] border-[#dfd9cc] text-stone-800 placeholder-stone-400 focus:border-[#d4a373]'
                    }`}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
