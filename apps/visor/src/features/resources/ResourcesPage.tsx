import { useOutletContext } from 'react-router-dom';
import { useCallStore } from './store/useCallStore';
import { NewCallView } from './components/NewCallView';
import { SpeechCatalog } from './components/SpeechCatalog/SpeechCatalog';
import { ObjectionManager } from './components/ObjectionManager/ObjectionManager';
import { QuickObjections } from './components/QuickObjections/QuickObjections';
import { SpeechModal } from './components/modals/SpeechModal';
import { ObjectionModal } from './components/modals/ObjectionModal';
import { AddStepModal } from './components/modals/AddStepModal';
import { BookOpen, Phone, AlertTriangle, StickyNote, GraduationCap } from 'lucide-react';
import CareerCatalog from './components/CareerCatalog/CareerCatalog';

const tabs = [
  { id: 'speeches' as const, label: 'Speeches', icon: BookOpen },
  { id: 'newcall' as const, label: 'Nueva Llamada', icon: Phone },
  { id: 'objections' as const, label: 'Manejo Objeciones', icon: AlertTriangle },
  { id: 'notes' as const, label: 'Mis Notas', icon: StickyNote },
  { id: 'carreras' as const, label: 'Recursos', icon: GraduationCap },
];

export default function ResourcesPage() {
  const { darkMode, openNotesPanel } = useOutletContext<{ darkMode: boolean; openNotesPanel: () => void }>();
  const { activeTab, setActiveTab } = useCallStore();

  return (
    <div className="h-full overflow-y-auto p-6 pb-32">
      <h2 className={`text-lg font-bold font-display mb-6 ${darkMode ? 'text-stone-100' : 'text-stone-900'}`}>
        📚 Centro de Recursos
      </h2>

      {/* Tab bar */}
      <div className={`inline-flex p-1 rounded-2xl mb-8 ${darkMode ? 'bg-[#1c1a18] border border-[#3e382f]' : 'bg-stone-50 border border-stone-200'}`}>
        {tabs.map(tab => (
          <button key={tab.id}
            onClick={() => tab.id === 'notes' ? openNotesPanel() : setActiveTab(tab.id)}
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

      {/* Tab content */}
      {activeTab === 'speeches' && <SpeechCatalog darkMode={darkMode} />}
      {activeTab === 'newcall' && <NewCallView darkMode={darkMode} />}
      {activeTab === 'objections' && <ObjectionManager darkMode={darkMode} />}
      {activeTab === 'carreras' && <CareerCatalog darkMode={darkMode} />}

      {/* Global overlays */}
      <QuickObjections darkMode={darkMode} />
      <SpeechModal darkMode={darkMode} />
      <ObjectionModal darkMode={darkMode} />
      <AddStepModal darkMode={darkMode} />
    </div>
  );
}
