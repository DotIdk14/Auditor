import { useCallStore } from '../../store/useCallStore';
import { defaultObjectionCategories } from '../../data/defaultObjections';
import { X } from 'lucide-react';

interface Props { darkMode: boolean; }

const inputCls = (darkMode: boolean) => darkMode
  ? 'bg-[#24211e] border-[#3e382f] text-stone-200 placeholder-stone-500 focus:border-[#d4a373]'
  : 'bg-[#fcfbf9] border-[#dfd9cc] text-stone-800 placeholder-stone-400 focus:border-[#d4a373]';

export function AddStepModal({ darkMode }: Props) {
  const {
    showAddStepModal, addStepForm, addStepMode, setAddStepForm, setAddStepMode, addCustomStep, setShowAddStepModal,
  } = useCallStore();

  if (!showAddStepModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowAddStepModal(false)} />
      <div className={`relative w-full max-w-lg rounded-2xl border shadow-2xl p-6 ${darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-sm font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>➕ Agregar Paso</h3>
          <button onClick={() => setShowAddStepModal(false)}
            className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-[#24211e] text-stone-400' : 'hover:bg-stone-100 text-stone-500'}`}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className={`flex rounded-xl border overflow-hidden mb-4 ${darkMode ? 'border-[#3e382f]' : 'border-[#dfd9cc]'}`}>
          <button onClick={() => setAddStepMode('text')}
            className={`flex-1 py-2 text-[10px] font-bold transition-all ${
              addStepMode === 'text' ? darkMode ? 'bg-amber-900/40 text-amber-400' : 'bg-[#faedcd] text-[#b57b54]' : darkMode ? 'text-stone-500' : 'text-stone-400'
            }`}>Texto Libre</button>
          <button onClick={() => setAddStepMode('objection')}
            className={`flex-1 py-2 text-[10px] font-bold transition-all ${
              addStepMode === 'objection' ? darkMode ? 'bg-amber-900/40 text-amber-400' : 'bg-[#faedcd] text-[#b57b54]' : darkMode ? 'text-stone-500' : 'text-stone-400'
            }`}>Elegir Objeción</button>
        </div>
        <div className="space-y-3">
          <input type="text" placeholder="Título del paso..."
            value={addStepForm.title} onChange={(e) => setAddStepForm({ ...addStepForm, title: e.target.value })}
            className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition-all ${inputCls(darkMode)}`} />
          {addStepMode === 'objection' && (
            <select value={addStepForm.objectionCategoryId}
              onChange={(e) => setAddStepForm({ ...addStepForm, objectionCategoryId: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition-all ${inputCls(darkMode)}`}>
              <option value="">Seleccionar categoría...</option>
              {defaultObjectionCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.title}</option>
              ))}
            </select>
          )}
          <textarea
            placeholder={addStepMode === 'text' ? 'Escribe el contenido del paso...' : 'Selecciona la respuesta a usar...'}
            value={addStepForm.content} onChange={(e) => setAddStepForm({ ...addStepForm, content: e.target.value })} rows={8}
            className={`w-full p-3 rounded-xl border text-xs focus:outline-none transition-all resize-none ${inputCls(darkMode)}`} />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={() => setShowAddStepModal(false)}
            className={`px-4 py-2 rounded-xl border text-[10px] font-bold ${darkMode ? 'border-[#3e382f] text-stone-300' : 'border-[#dfd9cc] text-stone-600'}`}>
            Cancelar
          </button>
          <button onClick={addCustomStep}
            disabled={addStepMode === 'text' ? (!addStepForm.title.trim() || !addStepForm.content.trim()) : (!addStepForm.objectionCategoryId || !addStepForm.content.trim())}
            className="px-4 py-2 rounded-xl bg-[#faedcd] border border-[#d4a373] text-[#b57b54] text-[10px] font-bold hover:bg-[#ffeec2] disabled:opacity-40 disabled:cursor-not-allowed">
            Agregar Paso
          </button>
        </div>
      </div>
    </div>
  );
}
