import { useCallStore } from '../../store/useCallStore';
import { renderScriptText } from '../../utils/renderScriptText';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Circle, ChevronDown, Plus, Star, Pencil, Trash2 } from 'lucide-react';

interface Props { darkMode: boolean; }

export function SpeechCatalog({ darkMode }: Props) {
  const {
    completedSpeeches, expandedSections, defaultSpeeches: defaults, callVariables,
    getAllSectionsMerged, toggleSection, toggleSpeech, setDefaultSpeech,
    openCreateSpeechModal, openEditSpeechModal, handleDeleteSpeech, resetAll,
  } = useCallStore();

  const allSections = getAllSectionsMerged();
  const totalSpeeches = allSections.reduce((acc, s) => acc + s.speeches.length, 0);
  const completedCount = allSections.reduce(
    (acc, s) => acc + s.speeches.filter(sp => completedSpeeches.includes(sp.id)).length, 0
  );
  const sectionsWithFavorite = allSections.filter(s => defaults[s.id]).length;

  return (
    <div className="space-y-4">
      <div className={`flex items-center justify-between p-4 rounded-2xl border ${darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'}`}>
        <div className="space-y-1">
          <p className={`text-[11px] font-bold ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>Catálogo de Speeches</p>
          <p className={`text-[9px] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
            {completedCount} / {totalSpeeches} speeches completados · {sectionsWithFavorite} / {allSections.length} secciones con favorito
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-24 h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-[#24211e]' : 'bg-stone-100'}`}>
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${totalSpeeches > 0 ? (completedCount / totalSpeeches) * 100 : 0}%` }} />
          </div>
          {completedCount > 0 && (
            <button onClick={resetAll}
              className={`text-[9px] font-bold px-3 py-1.5 rounded-xl border transition-all ${
                darkMode ? 'border-red-900/40 text-red-400 hover:bg-red-950/20' : 'border-red-200 text-red-500 hover:bg-red-50'
              }`}>Reiniciar</button>
          )}
        </div>
      </div>

      {allSections.map((section) => {
        const isExpanded = expandedSections.includes(section.id);
        const sectionCompleted = section.speeches.length > 0 && section.speeches.every(s => completedSpeeches.includes(s.id));
        const sectionProgress = section.speeches.filter(s => completedSpeeches.includes(s.id)).length;
        return (
          <div key={section.id} className={`rounded-2xl border overflow-hidden transition-all ${
            sectionCompleted ? darkMode ? 'bg-emerald-950/10 border-emerald-800/30' : 'bg-emerald-50/50 border-emerald-200'
            : darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'
          }`}>
            <button onClick={() => toggleSection(section.id)}
              className={`w-full flex items-center justify-between p-4 transition-all ${darkMode ? 'hover:bg-[#24211e]' : 'hover:bg-stone-50'}`}>
              <div className="flex items-center gap-3">
                <span className="text-lg">{section.icon}</span>
                <div className="text-left">
                  <h3 className={`text-xs font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>{section.title}</h3>
                  <p className={`text-[9px] mt-0.5 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>{sectionProgress} / {section.speeches.length} speeches</p>
                </div>
                {sectionCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-1" />}
              </div>
              <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className={`w-4 h-4 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`} />
              </motion.div>
            </button>
            {isExpanded && (
              <div className={`border-t ${darkMode ? 'border-[#3e382f]' : 'border-[#dfd9cc]'}`}>
                <div className="p-4 space-y-3">
                  {section.speeches.map((speech) => {
                    const isCompleted = completedSpeeches.includes(speech.id);
                    const isCustom = speech.isCustom === true;
                    const isDefault = defaults[section.id] === speech.id;
                    return (
                      <div key={speech.id} className={`rounded-xl border-[2px] p-4 transition-all ${isCustom ? 'border-dashed ' : ''}${
                        isCompleted ? darkMode ? 'bg-emerald-950/15 border-emerald-800/30' : 'bg-emerald-50/60 border-emerald-200'
                        : isCustom ? darkMode ? 'bg-[#24211e] border-amber-800/40' : 'bg-stone-50 border-amber-300'
                        : darkMode ? 'bg-[#24211e] border-[#4a4036]' : 'bg-stone-50 border-stone-200'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h4 className={`text-[11px] font-bold font-display ${isCompleted ? 'line-through opacity-60' : ''} ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>{speech.title}</h4>
                            {isDefault && <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700'}`}>⭐ Predeterminado</span>}
                            {isCustom && <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>MI speech</span>}
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => setDefaultSpeech(section.id, speech.id)}
                              className={`p-1 rounded-lg transition-all hover:scale-110 ${isDefault ? 'text-yellow-500' : darkMode ? 'text-stone-500 hover:text-yellow-400' : 'text-stone-400 hover:text-yellow-500'}`}
                              title={isDefault ? 'Quitar como predeterminado' : 'Marcar como predeterminado'}>
                              <Star className={`w-3.5 h-3.5 ${isDefault ? 'fill-yellow-500' : ''}`} />
                            </button>
                            {isCustom && (
                              <>
                                <button onClick={() => openEditSpeechModal(section.id, speech)}
                                  className={`p-1 rounded-lg transition-all hover:scale-110 ${darkMode ? 'text-stone-500 hover:text-amber-400' : 'text-stone-400 hover:text-amber-600'}`}><Pencil className="w-3 h-3" /></button>
                                <button onClick={() => handleDeleteSpeech(section.id, speech.id)}
                                  className={`p-1 rounded-lg transition-all hover:scale-110 ${darkMode ? 'text-stone-500 hover:text-red-400' : 'text-stone-400 hover:text-red-600'}`}><Trash2 className="w-3 h-3" /></button>
                              </>
                            )}
                            <button onClick={() => toggleSpeech(speech.id)}
                              className={`p-1 rounded-lg transition-all hover:scale-110 ${isCompleted ? 'text-emerald-500' : darkMode ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600'}`}>
                              {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div className={`text-[10px] leading-relaxed p-3 rounded-lg whitespace-pre-line ${isCompleted ? darkMode ? 'bg-emerald-950/10 text-stone-500' : 'bg-emerald-50/40 text-stone-500' : darkMode ? 'bg-[#1c1a18] text-stone-400' : 'bg-white text-stone-600'}`}>
                          {renderScriptText(speech.content, darkMode, callVariables)}
                        </div>
                      </div>
                    );
                  })}
                  <button onClick={() => openCreateSpeechModal(section.id)}
                    className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed text-[10px] font-bold transition-all ${
                      darkMode ? 'border-[#4a4036] text-stone-500 hover:border-amber-800/40 hover:text-amber-400'
                      : 'border-stone-200 text-stone-400 hover:border-amber-300 hover:text-amber-600'
                    }`}>
                    <Plus className="w-3.5 h-3.5" /> Agregar speech
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
