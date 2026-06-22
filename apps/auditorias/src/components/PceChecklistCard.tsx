import React, { useState, useMemo } from 'react';
import { Check, X, AlertCircle, ChevronDown, ChevronUp, GraduationCap } from 'lucide-react';
import { UtelAnalysis, UtelChecklistItem } from '../types';

interface PceChecklistCardProps {
  utelData?: UtelAnalysis;
  globalScore: number;
}

/** Trunca título a N caracteres manteniendo legibilidad */
function truncTitle(title: string, maxLen: number): string {
  if (title.length <= maxLen) return title;
  return title.substring(0, maxLen).trimEnd() + '\u2026';
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

  // ── Puntaje a mostrar (utelData o fallback de score global) ──
  const displayScore = utelData?.totalScore ?? (globalScore / 10);
  const isCompliant = utelData?.isCompliant ?? (displayScore >= 7.0);

  // ── Tema de modalidad ──
  const modalidad = utelData?.modalidadDetectada || '';
  const modalityTheme = useMemo(() => {
    switch (modalidad) {
      case 'LÍNEA':
        return { badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30', icon: 'text-amber-400' };
      case 'EJECUTIVA':
        return { badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30', icon: 'text-blue-400' };
      case 'HÍBRIDA':
        return { badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: 'text-emerald-400' };
      default:
        return { badge: 'bg-zinc-800 text-gray-400 border-zinc-700', icon: 'text-zinc-400' };
    }
  }, [modalidad]);

  return (
    <div className="bg-[#111111] rounded-2xl border border-[#222222] p-6 shadow-md flex flex-col gap-5" id="pce-rubric-card-top">
      {/* ── Encabezado con score circular ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-200 flex items-center gap-1.5">
            📋 Rúbrica PCE
          </span>
          {modalidad && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${modalityTheme.badge}`}>
              <GraduationCap className={`w-3 h-3 ${modalityTheme.icon}`} />
              {modalidad}
            </span>
          )}
        </div>

        {/* Score circular compacto */}
        <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
          <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-zinc-800"
              strokeWidth="3"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={isCompliant ? 'text-[#00c8a5]' : 'text-amber-500'}
              strokeDasharray={`${displayScore * 10}, 100`}
              strokeWidth="3"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <span className={`text-sm font-extrabold font-mono ${isCompliant ? 'text-white' : 'text-amber-400'}`}>
            {displayScore.toFixed(1)}
          </span>
        </div>
      </div>

      {/* ── Desglose de categorías ── */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-mono text-gray-500 font-black uppercase tracking-widest block mb-1">
          Desglose de Puntos Evaluados
        </span>

        <div className="flex flex-col gap-2">
          {utelData?.checklist.map((item: UtelChecklistItem) => {
            const isExpanded = expandedChecklistId === item.id;
            const isPassed = item.status === 'passed';

            // Título: completo al expandir, truncado al colapsar
            const displayTitle = isExpanded
              ? item.title
              : truncTitle(item.title, 16);

            // Porcentaje de progreso de la categoría
            const progressPercent = Math.min(100, (item.score / item.weight) * 100);

            return (
              <div
                key={item.id}
                className={`border rounded-xl overflow-hidden transition-all duration-200 flex flex-col ${
                  isExpanded
                    ? 'border-indigo-500/60 bg-[#141418]'
                    : 'border-[#222222] bg-[#111111]/80 hover:border-[#333333]'
                }`}
              >
                {/* ── Fila colapsada ── */}
                <div
                  onClick={() => toggleChecklistDropdown(item.id)}
                  className="flex items-center justify-between p-3 px-4 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5">
                    {isPassed ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-[#00c8a5] flex items-center justify-center shrink-0 border border-emerald-500/30">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/25">
                        <AlertCircle className="w-3 h-3" />
                      </div>
                    )}

                    <span
                      className={`text-xs font-bold tracking-wide uppercase ${
                        isPassed ? 'text-gray-200' : 'text-rose-300'
                      }`}
                      title={item.title}
                    >
                      {displayTitle}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-sm font-bold font-mono ${isPassed ? 'text-gray-100' : 'text-rose-300'}`}>
                      {item.score.toFixed(2)} <span className="text-gray-500 text-xs font-normal">pt</span>
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-indigo-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                    )}
                  </div>
                </div>

                {/* ── Contenido expandido ── */}
                {isExpanded && (
                  <div className="px-4 pb-4 flex flex-col gap-3">
                    {/* Barra de progreso */}
                    <div className="w-full h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isPassed ? 'bg-[#00c8a5]' : 'bg-rose-500'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    {/* Subitems (parámetros de la matriz) */}
                    {item.subitems && item.subitems.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                          Verificación de Parámetros de la Matriz:
                        </span>

                        <div className="flex flex-col gap-1">
                          {item.subitems.map((sub) => (
                            <div key={sub.id} className="flex items-center justify-between py-1">
                              <div className="flex items-center gap-2.5">
                                {sub.checked ? (
                                  <div className="w-4 h-4 rounded bg-emerald-500/15 border border-emerald-500/40 text-[#00c8a5] flex items-center justify-center shrink-0">
                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                  </div>
                                ) : (
                                  <div className="w-4 h-4 rounded bg-[#1a1a1a] border border-[#2a2a2a] text-gray-600 flex items-center justify-center shrink-0">
                                    <X className="w-2.5 h-2.5 stroke-[2]" />
                                  </div>
                                )}
                                <span className={`text-xs ${sub.checked ? 'text-gray-300' : 'text-gray-500'}`}>
                                  {sub.name}
                                </span>
                              </div>
                              <span className={`font-mono text-xs font-semibold shrink-0 ${
                                sub.checked ? 'text-emerald-400/80' : 'text-gray-600'
                              }`}>
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
