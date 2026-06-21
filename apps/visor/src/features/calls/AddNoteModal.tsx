import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageSquare, Check } from 'lucide-react';
import { useCalls } from '../../hooks/useCalls';
import { useCreateNote } from '../../hooks/useContacts';

interface Props {
  darkMode: boolean;
  onClose: () => void;
}

export default function AddNoteModal({ darkMode, onClose }: Props) {
  const [selectedCallId, setSelectedCallId] = useState('');
  const [text, setText] = useState('');
  const { data: calls = [] } = useCalls({});
  const createNote = useCreateNote();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCallId || !text.trim()) return;

    try {
      await createNote.mutateAsync({ callId: selectedCallId, text: text.trim() });
      onClose();
    } catch (err) {
      console.error('[ADD_NOTE] Error:', err);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`w-full max-w-lg rounded-[5px] border-[3px] p-6 shadow-2xl ${
            darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <MessageSquare className={`w-5 h-5 ${darkMode ? 'text-[#d4a373]' : 'text-[#b57b54]'}`} />
              <h2 className={`text-sm font-bold font-display ${darkMode ? 'text-stone-100' : 'text-stone-800'}`}>
                Agregar Nota
              </h2>
            </div>
            <button onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-[#24211e] text-stone-400' : 'hover:bg-stone-100 text-stone-500'
              }`}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Seleccionar llamada */}
            <div>
              <label className={`text-[10px] font-bold mb-1 block ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                Llamada / Auditoría *
              </label>
              <select
                value={selectedCallId}
                onChange={(e) => setSelectedCallId(e.target.value)}
                required
                className={`w-full border rounded-xl py-2.5 px-3.5 text-xs focus:outline-none transition-all ${
                  darkMode
                    ? 'bg-[#24211e] border-[#3e382f] text-stone-200 focus:border-[#d4a373] focus:ring-1 focus:ring-[#d4a373]'
                    : 'bg-[#fcfbf9] border-[#dfd9cc] text-stone-800 focus:border-[#d4a373] focus:ring-1 focus:ring-[#d4a373]'
                }`}
              >
                <option value="">Selecciona una llamada...</option>
                {calls.map((call: any) => (
                  <option key={call.id} value={call.id}>
                    {call.title} — {call.agent}
                  </option>
                ))}
              </select>
            </div>

            {/* Texto de la nota */}
            <div>
              <label className={`text-[10px] font-bold mb-1 block ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                Nota *
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escribe tu nota aquí..."
                required
                rows={4}
                className={`w-full border rounded-xl py-2.5 px-3.5 text-xs focus:outline-none transition-all resize-none ${
                  darkMode
                    ? 'bg-[#24211e] border-[#3e382f] text-stone-200 placeholder-stone-600 focus:border-[#d4a373] focus:ring-1 focus:ring-[#d4a373]'
                    : 'bg-[#fcfbf9] border-[#dfd9cc] text-stone-800 placeholder-stone-400 focus:border-[#d4a373] focus:ring-1 focus:ring-[#d4a373]'
                }`}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  darkMode ? 'text-stone-400 hover:bg-[#24211e]' : 'text-stone-500 hover:bg-stone-100'
                }`}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createNote.isPending || !selectedCallId || !text.trim()}
                className="flex items-center gap-1.5 px-5 py-2 bg-[#faedcd] border border-[#d4a373] text-[#b57b54] hover:bg-[#ffeec2] font-bold rounded-xl transition-all text-xs cursor-pointer disabled:opacity-50"
              >
                {createNote.isPending ? (
                  <div className="w-4 h-4 border-2 border-[#b57b54]/30 border-t-[#b57b54] rounded-full animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                {createNote.isPending ? 'Guardando...' : 'Guardar Nota'}
              </button>
            </div>

            {createNote.isError && (
              <p className="text-[10px] text-rose-500 mt-2">
                Error al guardar la nota. Intenta de nuevo.
              </p>
            )}
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
