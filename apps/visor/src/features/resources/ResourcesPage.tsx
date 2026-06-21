import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Image, MessageSquareText, AlertTriangle, StickyNote, Copy, Plus, X } from 'lucide-react';

export default function ResourcesPage() {
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const [activeTab, setActiveTab] = useState<'images' | 'speech' | 'objections' | 'notes'>('images');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteContent, setNoteContent] = useState('');

  const tabs = [
    { id: 'images', label: 'Imágenes', icon: Image },
    { id: 'speech', label: 'Speech Ventas', icon: MessageSquareText },
    { id: 'objections', label: 'Manejo Objeciones', icon: AlertTriangle },
    { id: 'notes', label: 'Mis Notas', icon: StickyNote },
  ];

  return (
    <div className="h-full overflow-y-auto p-6 pb-32">
      <h2 className={`text-lg font-bold font-display mb-6 ${darkMode ? 'text-stone-100' : 'text-stone-900'}`}>
        📚 Centro de Recursos
      </h2>

      {/* Tabs */}
      <div className={`inline-flex p-1 rounded-2xl mb-8 ${darkMode ? 'bg-[#1c1a18] border border-[#3e382f]' : 'bg-stone-50 border border-stone-200'}`}>
        {tabs.map(tab => (
          <button key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold transition-all ${
              activeTab === tab.id
                ? darkMode ? 'bg-amber-900/40 text-amber-500 shadow-inner' : 'bg-white text-[#b57b54] shadow-md border border-[#dfd9cc]'
                : darkMode ? 'text-stone-500 hover:text-stone-300' : 'text-stone-500 hover:text-stone-800'
            }`}>
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'images' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((img) => (
            <div key={img} className={`group relative rounded-xl overflow-hidden border cursor-pointer transition-all hover:scale-[1.02] ${
              darkMode ? 'border-[#3e382f]' : 'border-[#dfd9cc]'
            }`}>
              <div className={`aspect-square flex items-center justify-center ${darkMode ? 'bg-[#24211e]' : 'bg-stone-100'}`}>
                <Image className={`w-8 h-8 ${darkMode ? 'text-stone-600' : 'text-stone-300'}`} />
              </div>
              <div className={`p-2 ${darkMode ? 'bg-[#1c1a18]' : 'bg-white'}`}>
                <p className={`text-[9px] font-bold truncate ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                  Recurso visual {img}
                </p>
                <button className="text-[8px] text-[#b57b54] hover:underline mt-1">Copiar Link</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'speech' && (
        <div className="space-y-4 max-w-2xl">
          <div className={`rounded-[5px] border-[3px] p-6 ${
            darkMode ? 'bg-[#24211e] border-[#4a4036] shadow-[4px_4px_0px_#151311]' : 'bg-white border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d]'
          }`}>
            <h3 className={`text-sm font-bold font-display mb-3 ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
              🎯 Apertura
            </h3>
            <p className={`text-[11px] leading-relaxed p-3 rounded-xl ${darkMode ? 'bg-[#1c1a18] text-stone-400' : 'bg-stone-50 text-stone-600'}`}>
              "Buenos días/tardes, me comunico con [nombre] de parte de [institución]. 
              El motivo de mi llamada es darle seguimiento a la información que solicitó acerca de nuestros programas 
              académicos. ¿Me permite unos minutos para comentarle los detalles?"
            </p>
          </div>

          <div className={`rounded-[5px] border-[3px] p-6 ${
            darkMode ? 'bg-[#24211e] border-[#4a4036] shadow-[4px_4px_0px_#151311]' : 'bg-white border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d]'
          }`}>
            <h3 className={`text-sm font-bold font-display mb-3 ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
              💎 Presentación de Valor
            </h3>
            <p className={`text-[11px] leading-relaxed p-3 rounded-xl ${darkMode ? 'bg-[#1c1a18] text-stone-400' : 'bg-stone-50 text-stone-600'}`}>
              "Nuestro programa está diseñado para personas como usted que buscan crecer profesionalmente 
              sin descuidar sus actividades actuales. Contamos con: horarios flexibles, tutores 
              especializados y una plataforma 100% en línea."
            </p>
          </div>
        </div>
      )}

      {activeTab === 'objections' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
          <div className={`rounded-[5px] border-[3px] p-6 ${
            darkMode ? 'bg-[#24211e] border-[#4a4036] shadow-[4px_4px_0px_#151311]' : 'bg-white border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d]'
          }`}>
            <h3 className={`text-sm font-bold font-display mb-2 ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
              💰 "Es muy caro"
            </h3>
            <p className={`text-[10px] leading-relaxed ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
              "Entiendo su perspectiva. Permítame mostrarle las facilidades de pago con las que contamos.
              Puede iniciar con un pago inicial muy accesible y el resto en mensualidades que se ajustan a su presupuesto."
            </p>
          </div>

          <div className={`rounded-[5px] border-[3px] p-6 ${
            darkMode ? 'bg-[#24211e] border-[#4a4036] shadow-[4px_4px_0px_#151311]' : 'bg-white border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d]'
          }`}>
            <h3 className={`text-sm font-bold font-display mb-2 ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
              🤔 "Déjame pensarlo"
            </h3>
            <p className={`text-[10px] leading-relaxed ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
              "Por supuesto, es una decisión importante. ¿Qué tal si agendamos una llamada para 
              resolver cualquier duda que surja? Mientras tanto, le envío la información por correo para que 
              pueda revisarla con calma."
            </p>
          </div>
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="space-y-4">
          <button onClick={() => setShowNoteModal(true)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
              darkMode ? 'border-[#3e382f] text-stone-300 hover:bg-[#24211e]' : 'border-[#dfd9cc] text-stone-600 hover:bg-stone-50'
            }`}>
            <Plus className="w-4 h-4" />
            Nueva Nota
          </button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((note) => (
              <div key={note} className={`p-4 rounded-xl border ${
                darkMode ? 'bg-amber-900/10 border-amber-900/20' : 'bg-amber-50 border-amber-100'
              }`}>
                <p className={`text-[10px] leading-relaxed ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                  Nota de ejemplo #{note}: Recordar seguir el protocolo de saludo institucional 
                  en todas las llamadas.
                </p>
                <p className="text-[8px] text-stone-400 mt-2">Hace {note} día(s)</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowNoteModal(false)} />
          <div className={`relative w-full max-w-lg rounded-2xl border shadow-2xl p-6 ${
            darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-sm font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                📝 Nueva Nota
              </h3>
              <button onClick={() => setShowNoteModal(false)}
                className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-[#24211e] text-stone-400' : 'hover:bg-stone-100 text-stone-500'}`}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              placeholder="Escribe tu nota aquí..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              rows={5}
              className={`w-full p-3 rounded-xl border text-xs focus:outline-none transition-all resize-none ${
                darkMode ? 'bg-[#24211e] border-[#3e382f] text-stone-200 placeholder-stone-500 focus:border-[#d4a373]' : 'bg-[#fcfbf9] border-[#dfd9cc] text-stone-800 placeholder-stone-400 focus:border-[#d4a373]'
              }`}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowNoteModal(false)}
                className={`px-4 py-2 rounded-xl border text-[10px] font-bold ${
                  darkMode ? 'border-[#3e382f] text-stone-300' : 'border-[#dfd9cc] text-stone-600'
                }`}>
                Cancelar
              </button>
              <button className="px-4 py-2 rounded-xl bg-[#faedcd] border border-[#d4a373] text-[#b57b54] text-[10px] font-bold hover:bg-[#ffeec2]">
                Guardar Nota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
