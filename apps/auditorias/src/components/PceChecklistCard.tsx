import React, { useState, useMemo } from 'react';
import { Check, AlertCircle, ChevronDown, ChevronUp, Target, GraduationCap } from 'lucide-react';
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

  // ── Cálculo de items aprobados vs total ──
  const { passedCount, totalCount } = useMemo(() => {
    if (!utelData?.checklist) return { passedCount: 0, totalCount: 5 };
    const passed = utelData.checklist.filter((item) => item.status === 'passed').length;
    return { passedCount: passed, totalCount: utelData.checklist.length };
  }, [utelData]);

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

  // ── Puntaje a mostrar (utelData o fallback de score global) ──
  const displayScore = utelData?.totalScore ?? (globalScore / 10);
  const isCompliant = utelData?.isCompliant ?? (displayScore >= 7.0);

  return (
    <div className="bg-[#111111] rounded-2xl border border-[#222222] p-6 shadow-md flex flex-col gap-5" id="pce-rubric-card-top">
      {/* ── Encabezado ── */}
      <div className="flex items-center justify-between border-b border-[#222222]/80 pb-3 flex-wrap gap-2">
        <span className="text-xs uppercase tracking-wider text-gray-300 font-bold font-mono">
          RÚBRICA DE AUDITORÍA PCE UTEL
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          {modalidad && (
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold border ${modalityTheme.badge}`}>
              <GraduationCap className={`w-3 h-3 ${modalityTheme.icon}`} />
              {modalidad}
            </span>
          )}
          {utelData ? (
            <span className={`inline-flex items-center px-4 py-1.5 rounded-lg text-xs font-black tracking-widest border uppercase ${
              isCompliant
                ? 'bg-emerald-950/20 text-[#00c8a5] border-emerald-500/30'
                : 'bg-amber-950/20 text-amber-400 border-amber-500/30'
            }`}>
              {isCompliant ? 'Llamada Aprobada' : 'Faltan Obligatorios'}
            </span>
          ) : (
            <span className="inline-flex items-center px-4 py-1.5 rounded-lg text-xs font-black tracking-widest bg-zinc-800 text-zinc-400 border border-zinc-750 uppercase">
              Auditoría Completa
            </span>
          )}
        </div>
      </div>

      {/* ── Gauge de puntuación ── */}
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
              className={isCompliant ? 'text-[#00c8a5]' : 'text-amber-500'}
              strokeDasharray={`${displayScore * 10}, 100`}
              strokeWidth="3.5"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="flex flex-col items-center justify-center leading-none">
            <span className={`text-xl font-extrabold font-mono ${isCompliant ? 'text-white' : 'text-amber-400'}`}>
              {displayScore.toFixed(1)}
            </span>
            <span className="text-[10px] text-gray-500 font-mono mt-0.5">/ 10.0</span>
          </div>
        </div>

        <div className="flex flex-col">
          <span className="font-bold text-white text-base">Calificación del PCE</span>
          <p className="text-xs text-gray-400 leading-normal">
            Puntaje acumulado sobre las categorías clave verificadas en la llamada.
            La estructura y ponderación se apega estrictamente a la matriz oficial UTEL.
          </p>
          {utelData && (
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-[10px] font-mono font-bold ${passedCount >= 4 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {passedCount} / {totalCount} categorías aprobadas
              </span>
              <span className="text-[10px] text-gray-500 font-mono">
                (mínimo 7.0 para aprobar)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Desglose de categorías ── */}
      <div className="flex flex-col gap-2 mt-2">
        <span className="text-[10px] font-mono text-gray-400 font-black uppercase tracking-widest block mb-1">
          Desglose de Puntos Evaluados
        </span>

        <div className="flex flex-col gap-3">
          {utelData?.checklist.map((item: UtelChecklistItem) => {
            const isExpanded = expandedChecklistId === item.id;

            // ── Usar el status calculado por el backend (umbral correcto) ──
            const isPassed = item.status === 'passed';

            // ── Título: completo al expandir, truncado al colapsar ──
            const displayTitle = isExpanded
              ? item.title
              : truncTitle(item.title, 18);

            // ── Calcular pts perdidos (subitems no marcados) ──
            const lostPoints = item.subitems
              .filter((s) => !s.checked)
              .reduce((sum, s) => sum + s.weight, 0);

            return (
              <div
                key={item.id}
                className={`border border-[#222222] rounded-2xl overflow-hidden transition-all duration-200 bg-[#111111]/80 flex flex-col justify-between ${
                  isExpanded ? 'border-indigo-500 bg-[#161616] scale-[1.01]' : 'hover:border-zinc-800'
                }`}
              >
                {/* ── Fila colapsada ── */}
                <div
                  onClick={() => toggleChecklistDropdown(item.id)}
                  className="flex items-center justify-between p-3 px-4 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2 max-w-[75%]">
                    {isPassed ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-[#00c8a5] flex items-center justify-center text-xs shrink-0 border border-emerald-500/25">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center text-xs shrink-0 border border-rose-500/25">
                        <AlertCircle className="w-3" />
                      </div>
                    )}

                    <span
                      className={`text-xs font-bold tracking-wide truncate ${
                        isPassed ? 'text-gray-300' : 'text-rose-300'
                      }`}
                      title={item.title}
                    >
                      {displayTitle}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Puntuación como fracción */}
                    <span className={`text-xs font-bold font-mono ${isPassed ? 'text-gray-200' : 'text-rose-300'}`}>
                      {item.score.toFixed(2)}
                      <span className="text-gray-500 font-normal"> / {item.weight.toFixed(2)} pts</span>
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
                  <div className="p-3 bg-[#111111]/70 border-t border-[#222222] flex flex-col gap-2.5">
                    {/* Feedback detallado */}
                    <p className="text-[11px] text-gray-300 leading-normal italic bg-neutral-900/30 p-2 rounded border border-neutral-850/50">
                      {item.feedback}
                    </p>

                    {/* Barra de puntuación visual y umbral */}
                    <div className="flex flex-col gap-1 bg-[#161616]/80 p-2.5 rounded-lg border border-[#222222]/80">
                      <div className="flex items-center justify-between text-[10px] text-gray-400">
                        <span className="font-bold uppercase tracking-wider flex items-center gap-1">
                          <Target className="w-3 h-3 text-indigo-400" />
                          Puntaje de categoría
                        </span>
                        <span>
                          {item.score.toFixed(2)} / {item.weight.toFixed(2)} pts
                        </span>
                      </div>

                      {/* Barra de progreso */}
                      <div className="w-full h-2 bg-[#202020] rounded-full overflow-hidden mt-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isPassed ? 'bg-[#00c8a5]' : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(100, (item.score / item.weight) * 100)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] mt-0.5">
                        <span className={isPassed ? 'text-emerald-400' : 'text-rose-400'}>
                          {isPassed ? 'APROBADA' : 'NO APROBADA'}
                        </span>
                        <span className="text-gray-500">
                          Umbral: ≥ {item.passingThreshold.toFixed(2)} pts
                        </span>
                      </div>
                    </div>

                    {/* Subitems (parámetros de la matriz) */}
                    {item.subitems && item.subitems.length > 0 && (
                      <div className="flex flex-col gap-2 bg-[#161616]/80 p-2.5 rounded-lg border border-[#222222]/80">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                            Verificación de Parámetros de la Matriz:
                          </span>
                          {lostPoints > 0 && (
                            <span className="text-[10px] text-rose-400 font-mono font-bold">
                              -{lostPoints.toFixed(2)} pts perdidos
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 gap-1.5">
                          {item.subitems.map((sub) => (
                            <div key={sub.id} className="flex items-start justify-between text-xs py-0.5">
                              <div className="flex items-center gap-2 max-w-[70%]">
                                {sub.checked ? (
                                  <div className="w-3.5 h-3.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[#00c8a5] flex items-center justify-center text-[9px] scale-90 shrink-0">✓</div>
                                ) : (
                                  <div className="w-3.5 h-3.5 rounded bg-[#202020] border border-[#2d2d2d] text-gray-500 flex items-center justify-center text-[9px] scale-90 shrink-0">𐄂</div>
                                )}
                                <span className={`text-[11px] ${sub.checked ? 'text-gray-300' : 'text-gray-500 line-through'}`}>
                                  {sub.name}
                                </span>
                              </div>
                              <span className={`font-mono text-[10px] font-semibold shrink-0 ${
                                sub.checked ? 'text-gray-400' : 'text-rose-400'
                              }`}>
                                {sub.checked ? `+${sub.weight.toFixed(2)}` : `0.00`} pts
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
