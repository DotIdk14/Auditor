import React, { useState } from 'react';
import { Check, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { UtelAnalysis, UtelChecklistItem } from '../types';

interface PceChecklistCardProps {
  utelData?: UtelAnalysis;
  globalScore: number;
}

export default function PceChecklistCard({ utelData, globalScore }: PceChecklistCardProps) {
  const [expandedChecklistId, setExpandedChecklistId] = useState<string | null>("C1");

  const toggleChecklistDropdown = (id: string) => {
    if (expandedChecklistId === id) {
      setExpandedChecklistId(null);
    } else {
      setExpandedChecklistId(id);
    }
  };

  return (
    <div className="bg-[#111111] rounded-2xl border border-[#222222] p-6 shadow-md flex flex-col gap-5" id="pce-rubric-card-top">
      <div className="flex items-center justify-between border-b border-[#222222]/80 pb-3">
        <span className="text-xs uppercase tracking-wider text-gray-300 font-bold font-mono">
          RÚBRICA DE AUDITORÍA PCE UTEL
        </span>
        {utelData ? (
          <span className="inline-flex items-center px-4 py-1.5 rounded-lg text-xs font-black tracking-widest bg-emerald-950/20 text-[#00c8a5] border border-emerald-500/30 uppercase">
            {utelData.isCompliant ? "Llamada Aprobada" : "Faltan Obligatorios (*)"}
          </span>
        ) : (
          <span className="inline-flex items-center px-4 py-1.5 rounded-lg text-xs font-black tracking-widest bg-zinc-800 text-zinc-400 border border-zinc-750 uppercase">
            Auditoría Completa
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 p-5 bg-transparent border border-gray-400 rounded-2xl">
        <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
          <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-zinc-800"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={utelData?.isCompliant ? "text-[#00c8a5]" : "text-amber-500"}
              strokeDasharray={`${(utelData?.totalScore || globalScore / 10) * 10}, 100`}
              strokeWidth="3.5"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="flex flex-col items-center justify-center leading-none">
            <span className="text-xl font-extrabold text-white font-mono">
              {utelData ? utelData.totalScore.toFixed(1) : (globalScore / 10).toFixed(1)}
            </span>
            <span className="text-[10px] text-gray-500 font-mono mt-0.5">/ 10.0</span>
          </div>
        </div>

        <div className="flex flex-col">
          <span className="font-bold text-white text-base">Calificación del PCE</span>
          <p className="text-xs text-gray-400 leading-normal">
            Puntaje acumulado sobre las categorías clave verificadas en la llamada. La estructura y ponderación se apega estrictamente a la matriz oficial UTEL.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-2">
        <span className="text-[10px] font-mono text-gray-400 font-black uppercase tracking-widest block mb-1">
          Desglose de Puntos Evaluados
        </span>

        <div className="flex flex-col gap-3">
          {utelData?.checklist.map((item: UtelChecklistItem) => {
            const isExpanded = expandedChecklistId === item.id;
            const isPassed = item.score >= (item.weight * 0.7);

            const displayTitle = item.title.length > 15 ? `${item.title.substring(0, 11).toUpperCase()}...` : item.title.toUpperCase();

            return (
              <div
                key={item.id}
                className={`border border-[#222222] rounded-2xl overflow-hidden transition-all duration-200 bg-[#111111]/80 flex flex-col justify-between ${
                  isExpanded ? 'border-indigo-500 bg-[#161616] scale-[1.01]' : 'hover:border-zinc-800'
                }`}
              >
                <div
                  onClick={() => toggleChecklistDropdown(item.id)}
                  className="flex items-center justify-between p-3 px-4 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2 max-w-[80%]">
                    {isPassed ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-[#00c8a5] flex items-center justify-center text-xs shrink-0 border border-emerald-500/25">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-450 flex items-center justify-center text-xs shrink-0 border border-rose-500/25">
                        <AlertCircle className="w-3" />
                      </div>
                    )}

                    <span className="text-xs font-bold text-gray-300 tracking-wide truncate" title={item.title}>
                      {displayTitle}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold font-mono text-gray-200">
                      {item.score.toFixed(2)} pt
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-indigo-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-3 bg-[#111111]/70 border-t border-[#222222] flex flex-col gap-2.5">
                    <p className="text-[11px] text-gray-300 leading-normal italic bg-neutral-900/30 p-2 rounded border border-neutral-850/50">
                      {item.feedback}
                    </p>

                    {item.subitems && item.subitems.length > 0 && (
                      <div className="flex flex-col gap-2 bg-[#161616]/80 p-2.5 rounded-lg border border-[#222222]/80">
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
                          Verificación de Parámetros de la Matriz:
                        </span>
                        <div className="grid grid-cols-1 gap-1.5">
                          {item.subitems.map((sub) => (
                            <div key={sub.id} className="flex items-start justify-between text-xs py-0.5">
                              <div className="flex items-center gap-2 max-w-[70%]">
                                {sub.checked ? (
                                  <div className="w-3.5 h-3.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[#00c8a5] flex items-center justify-center text-[9px] scale-90">✓</div>
                                ) : (
                                  <div className="w-3.5 h-3.5 rounded bg-[#202020] border border-[#2d2d2d] text-gray-500 flex items-center justify-center text-[9px] scale-90">𐄂</div>
                                )}
                                <span className={`text-[11px] ${sub.checked ? 'text-gray-300' : 'text-gray-500'}`}>
                                  {sub.name}
                                </span>
                              </div>
                              <span className="font-mono text-[10px] text-gray-400 font-semibold">
                                +{sub.weight.toFixed(2)} pts
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
