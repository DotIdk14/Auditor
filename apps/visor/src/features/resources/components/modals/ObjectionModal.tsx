import { useCallStore } from '../../store/useCallStore';
import { defaultObjectionCategories } from '../../data/defaultObjections';
import { X } from 'lucide-react';

interface Props { darkMode: boolean; }

const inputCls = (darkMode: boolean) => darkMode
  ? 'bg-[#24211e] border-[#3e382f] text-stone-200 placeholder-stone-500 focus:border-[#d4a373]'
  : 'bg-[#fcfbf9] border-[#dfd9cc] text-stone-800 placeholder-stone-400 focus:border-[#d4a373]';

export function ObjectionModal({ darkMode }: Props) {
  const { showObjectionModal, editingObjection, objectionForm, setObjectionForm, handleSaveObjection } = useCallStore();

  if (!showObjectionModal || !editingObjection) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => useCallStore.setState({ showObjectionModal: false, editingObjection: null })} />
      <div className={`relative w-full max-w-lg rounded-2xl border shadow-2xl p-6 ${darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-sm font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
            {editingObjection.response.id && editingObjection.response.isCustom ? '✏️ Editar Objeción' : '➕ Nueva Respuesta'}
          </h3>
          <button onClick={() => useCallStore.setState({ showObjectionModal: false, editingObjection: null })}
            className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-[#24211e] text-stone-400' : 'hover:bg-stone-100 text-stone-500'}`}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          <p className={`text-[10px] ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
            Categoría: <span className="font-bold">{defaultObjectionCategories.find(c => c.id === editingObjection.categoryId)?.title}</span>
          </p>
          <input type="text" placeholder="Título de la respuesta (ej: Facilidades de pago)"
            value={objectionForm.title} onChange={(e) => setObjectionForm({ ...objectionForm, title: e.target.value })}
            className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition-all ${inputCls(darkMode)}`} />
          <textarea placeholder="Escribe la respuesta a la objeción..."
            value={objectionForm.content} onChange={(e) => setObjectionForm({ ...objectionForm, content: e.target.value })} rows={8}
            className={`w-full p-3 rounded-xl border text-xs focus:outline-none transition-all resize-none ${inputCls(darkMode)}`} />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={() => useCallStore.setState({ showObjectionModal: false, editingObjection: null })}
            className={`px-4 py-2 rounded-xl border text-[10px] font-bold ${darkMode ? 'border-[#3e382f] text-stone-300' : 'border-[#dfd9cc] text-stone-600'}`}>
            Cancelar
          </button>
          <button onClick={handleSaveObjection} disabled={!objectionForm.title.trim() || !objectionForm.content.trim()}
            className="px-4 py-2 rounded-xl bg-[#faedcd] border border-[#d4a373] text-[#b57b54] text-[10px] font-bold hover:bg-[#ffeec2] disabled:opacity-40 disabled:cursor-not-allowed">
            {editingObjection.response.id && editingObjection.response.isCustom ? 'Guardar Cambios' : 'Crear Respuesta'}
          </button>
        </div>
      </div>
    </div>
  );
}
