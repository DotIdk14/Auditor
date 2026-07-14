import { useCallStore } from '../../store/useCallStore';
import { CheckCircle2, Circle } from 'lucide-react';

interface Props { darkMode: boolean; }

const SONDEO_OPTIONS = [
  'Crecer laboralmente',
  'Cambiar de área',
  'Mejorar oportunidades',
  'Objetivo personal / obtener título',
  'Apoyo familiar',
  'Promoción o ascenso',
];

export function SondeoSelector({ darkMode }: Props) {
  const { callVariables, setCallVariables } = useCallStore();
  const selected = callVariables['RESPUESTA DE SONDEO'] || '';

  return (
    <div className={`rounded-2xl border-[2px] p-4 ${darkMode ? 'bg-[#24211e] border-amber-800/30' : 'bg-amber-50/50 border-amber-200'}`}>
      <p className={`text-[11px] font-bold font-display mb-1 ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
        ¿Qué respondió el cliente?
      </p>
      <p className={`text-[8px] mb-3 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
        Selecciona la motivación principal. Se usará en el speech de Personalizar.
      </p>
      <div className="flex flex-wrap gap-2">
        {SONDEO_OPTIONS.map(option => {
          const isSelected = selected === option;
          return (
            <button key={option}
              onClick={() => setCallVariables(prev => ({ ...prev, 'RESPUESTA DE SONDEO': isSelected ? '' : option }))}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 text-[11px] font-bold transition-all ${
                isSelected
                  ? darkMode ? 'bg-amber-900/50 border-amber-600 text-amber-200 shadow-lg shadow-amber-900/20 scale-105' : 'bg-amber-100 border-amber-500 text-amber-800 shadow-lg shadow-amber-200/40 scale-105'
                  : darkMode ? 'bg-[#1c1a18] border-[#3e382f] text-stone-400 hover:border-amber-800/40 hover:text-amber-400'
                    : 'bg-white border-stone-200 text-stone-500 hover:border-amber-300 hover:text-amber-700'
              }`}>
              {isSelected ? <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> : <Circle className="w-3 h-3 shrink-0" />}
              {option}
            </button>
          );
        })}
      </div>
      {selected && (
        <p className={`text-[8px] mt-2 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
          Se sustituirá <span className="font-bold text-amber-500">[RESPUESTA DE SONDEO]</span> en los scripts de Personalizar.
        </p>
      )}
    </div>
  );
}
