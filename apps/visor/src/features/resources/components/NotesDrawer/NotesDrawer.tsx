import { useCallStore } from '../../store/useCallStore';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface Props { darkMode: boolean; }

export function NotesDrawer({ darkMode }: Props) {
  const { showNotesDrawer, setShowNotesDrawer, notes, currentNote, setCurrentNote, addNote, deleteNote } = useCallStore();

  return (
    <AnimatePresence>
      {showNotesDrawer && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setShowNotesDrawer(false)} />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed top-0 right-0 h-full w-80 z-50 shadow-2xl flex flex-col ${
              darkMode ? 'bg-[#1c1a18] border-l border-[#3e382f]' : 'bg-white border-l border-stone-200'
            }`}>
            <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-[#3e382f]' : 'border-stone-200'}`}>
              <h3 className={`text-sm font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                📝 Notas de la Llamada
              </h3>
              <button onClick={() => setShowNotesDrawer(false)}
                className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-[#24211e] text-stone-400' : 'hover:bg-stone-100 text-stone-500'}`}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className={`p-4 border-b ${darkMode ? 'border-[#3e382f]' : 'border-stone-200'}`}>
              <textarea value={currentNote} onChange={(e) => setCurrentNote(e.target.value)}
                placeholder="Escribe tu nota aquí..." rows={4}
                className={`w-full p-3 rounded-xl border text-xs focus:outline-none transition-all resize-none ${
                  darkMode ? 'bg-[#24211e] border-[#3e382f] text-stone-200 placeholder-stone-500 focus:border-[#d4a373]'
                  : 'bg-[#fcfbf9] border-[#dfd9cc] text-stone-800 placeholder-stone-400 focus:border-[#d4a373]'
                }`} />
              <button onClick={() => { if (currentNote.trim()) addNote(currentNote); }}
                className={`w-full mt-2 py-2 rounded-xl border text-[10px] font-bold transition-all ${
                  darkMode ? 'bg-amber-900/30 border-amber-800/40 text-amber-400 hover:bg-amber-900/50'
                  : 'bg-[#faedcd] border-[#d4a373] text-[#b57b54] hover:bg-[#ffeec2]'
                }`}>Guardar Nota</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notes.length === 0 ? (
                <p className={`text-center text-[10px] py-8 ${darkMode ? 'text-stone-600' : 'text-stone-300'}`}>Sin notas aún</p>
              ) : notes.map(note => (
                <div key={note.id} className={`p-3 rounded-xl border ${darkMode ? 'bg-amber-900/10 border-amber-900/20' : 'bg-amber-50 border-amber-100'}`}>
                  <p className={`text-[10px] leading-relaxed ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>{note.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[8px] text-stone-400">{new Date(note.timestamp).toLocaleString()}</p>
                    <button onClick={() => deleteNote(note.id)} className="text-[8px] text-red-400 hover:text-red-300">Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
