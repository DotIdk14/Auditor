import { useState } from 'react';
import { TrendingUp } from 'lucide-react';

interface Props {
  darkMode: boolean;
  onScale: (level: number) => void;
}

export function ConvictionScale({ darkMode, onScale }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  const getColor = (n: number) => {
    if (n <= 3) return darkMode ? 'bg-red-900/30 border-red-800/40 text-red-400' : 'bg-red-50 border-red-300 text-red-700';
    if (n <= 6) return darkMode ? 'bg-amber-900/30 border-amber-800/40 text-amber-400' : 'bg-amber-50 border-amber-300 text-amber-700';
    return darkMode ? 'bg-emerald-900/30 border-emerald-800/40 text-emerald-400' : 'bg-emerald-50 border-emerald-300 text-emerald-700';
  };

  const getLabel = (n: number) => {
    if (n <= 3) return 'Bajo';
    if (n <= 6) return 'Medio';
    return 'Alto';
  };

  return (
    <div className={`rounded-xl border p-5 ${darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-stone-200'}`}>
      <p className={`text-[10px] font-bold mb-2 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
        <TrendingUp className="w-3.5 h-3.5 inline mr-1" />
        ESCALA DE CONVICCIÓN
      </p>
      <p className={`text-[9px] mb-3 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
        "Del 1 al 10, ¿qué tan convencido/a te sientes?"
      </p>

      <div className="grid grid-cols-10 gap-1 mb-3">
        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
          <button key={n} onClick={() => { setSelected(n); onScale(n); }}
            className={`text-[10px] font-bold py-2 rounded-lg border-2 transition-all ${
              selected === n
                ? getColor(n)
                : darkMode ? 'border-[#4a4036] text-stone-500 hover:text-stone-300' : 'border-stone-200 text-stone-400 hover:text-stone-600'
            }`}>
            {n}
          </button>
        ))}
      </div>

      {selected !== null && (
        <div className={`p-3 rounded-xl ${
          selected <= 3
            ? darkMode ? 'bg-red-950/20 border border-red-800/30' : 'bg-red-50 border border-red-200'
            : selected <= 6
              ? darkMode ? 'bg-amber-950/20 border border-amber-800/30' : 'bg-amber-50 border border-amber-200'
              : darkMode ? 'bg-emerald-950/20 border border-emerald-800/30' : 'bg-emerald-50 border border-emerald-200'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
              selected <= 3
                ? darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'
                : selected <= 6
                  ? darkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'
                  : darkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {getLabel(selected)}
            </span>
          </div>
          {selected <= 3 && (
            <p className={`text-[9px] ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
              ⚠️ Nivel bajo — Necesita reconstruir valor. No cerrar aún.
            </p>
          )}
          {selected > 3 && selected <= 6 && (
            <p className={`text-[9px] ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
              💡 Nivel medio — Hay objeciones pendientes. Pregunta: "¿Qué te frena del {selected} al 10?"
            </p>
          )}
          {selected > 6 && (
            <p className={`text-[9px] ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
              ✅ Nivel alto — Cerca de cerrar. Pregunta: "¿Qué te frena del {selected} al 10?" y resuelve.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
