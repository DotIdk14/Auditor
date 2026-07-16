import { useState } from 'react';
import type { SmartBlock, ProfileTag } from '../../../types';
import { PRINCIPLE_LABELS, PRINCIPLE_ICONS, TIMING_LABELS } from '../../../types';
import { renderScriptText } from '../../../utils/renderScriptText';
import { Target, Clock, MessageCircle, CheckCircle2, XCircle, ChevronDown, ChevronUp, Sparkles, ArrowRight } from 'lucide-react';

interface Props {
  block: SmartBlock;
  darkMode: boolean;
  callVariables: Record<string, string>;
  isRecommended?: boolean;
  recommendationReason?: string;
  onMarkUsed?: (blockId: string) => void;
  onSignal?: (blockId: string, signal: 'positive' | 'negative') => void;
}

const PRIORITY_STARS: Record<number, string> = {
  5: '★★★★★',
  4: '★★★★',
  3: '★★★',
  2: '★★',
  1: '★',
};

const TAG_LABELS: Record<ProfileTag, string> = {
  trabaja: 'Trabaja',
  no_trabaja: 'No trabaja',
  tiene_hijos: 'Tiene hijos',
  sin_hijos: 'Sin hijos',
  preocupado_costos: 'Costos',
  preocupado_tiempo: 'Tiempo',
  preocupado_calidad: 'Calidad',
  quiere_crecer: 'Crecer',
  quiere_cambiar: 'Cambiar',
  quiere_titulo: 'Título',
  quiere_ascenso: 'Ascenso',
  quiere_emprender: 'Emprender',
  familia_apoyo: 'Familia',
  primera_universidad: 'Primera uni',
  ya_tiene_opcion: 'Otra opción',
  motivacion_emocional: 'Emocional',
  motivacion_laboral: 'Laboral',
  motivacion_personal: 'Personal',
  dudoso: 'Dudoso',
  resistente: 'Resistente',
};

type Version = 'short' | 'medium' | 'long';

export function SmartBlockCard({ block, darkMode, callVariables, isRecommended, recommendationReason, onMarkUsed, onSignal }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [version, setVersion] = useState<Version>('medium');

  const principleIcon = PRINCIPLE_ICONS[block.principle];
  const principleLabel = PRINCIPLE_LABELS[block.principle];

  return (
    <div className={`rounded-2xl border-[2px] transition-all overflow-hidden ${
      isRecommended
        ? darkMode ? 'bg-amber-950/20 border-amber-600/50 ring-1 ring-amber-600/20' : 'bg-amber-50 border-amber-400 ring-1 ring-amber-200'
        : block.used
          ? darkMode ? 'bg-[#1c1a18] border-[#3e382f] opacity-60' : 'bg-white border-[#dfd9cc] opacity-60'
          : darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'
    }`}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{block.icon}</span>
            <div>
              <h3 className={`text-[11px] font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                {block.title}
              </h3>
              {isRecommended && recommendationReason && (
                <p className={`text-[8px] mt-0.5 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                  {recommendationReason}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isRecommended && (
              <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-200 text-amber-700'}`}>
                <Sparkles className="w-2.5 h-2.5 inline mr-0.5" /> Recomendado
              </span>
            )}
            {block.used && (
              <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-stone-800 text-stone-500' : 'bg-stone-100 text-stone-400'}`}>
                Usado
              </span>
            )}
            <span className={`text-[8px] ${darkMode ? 'text-stone-600' : 'text-stone-300'}`}>
              {PRIORITY_STARS[block.priority]}
            </span>
          </div>
        </div>

        {/* Meta badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className={`inline-flex items-center gap-1 text-[8px] font-bold px-2 py-0.5 rounded-full ${
            darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'
          }`}>
            <Target className="w-2.5 h-2.5" />
            {block.objective}
          </span>
          <span className={`inline-flex items-center gap-1 text-[8px] font-bold px-2 py-0.5 rounded-full ${
            darkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-700'
          }`}>
            {principleIcon} {principleLabel}
          </span>
          {block.timing.map(t => (
            <span key={t} className={`inline-flex items-center gap-1 text-[8px] font-bold px-2 py-0.5 rounded-full ${
              darkMode ? 'bg-stone-800 text-stone-400' : 'bg-stone-100 text-stone-500'
            }`}>
              <Clock className="w-2.5 h-2.5" />
              {TIMING_LABELS[t]}
            </span>
          ))}
        </div>

        {/* Tags */}
        {block.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {block.tags.map(tag => (
              <span key={tag} className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${
                darkMode ? 'bg-stone-800 text-stone-500' : 'bg-stone-100 text-stone-400'
              }`}>
                {TAG_LABELS[tag] || tag}
              </span>
            ))}
          </div>
        )}

        {/* Version selector */}
        <div className="flex gap-1 mb-3">
          {(['short', 'medium', 'long'] as Version[]).map(v => (
            <button key={v} onClick={() => setVersion(v)}
              className={`text-[8px] font-bold px-2 py-1 rounded-lg transition-all ${
                version === v
                  ? darkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'
                  : darkMode ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600'
              }`}>
              {v === 'short' ? 'Corto' : v === 'medium' ? 'Medio' : 'Largo'}
            </button>
          ))}
        </div>

        {/* Speech content */}
        <div className={`text-[10px] leading-relaxed p-3 rounded-xl whitespace-pre-line ${
          darkMode ? 'bg-[#24211e] text-stone-400' : 'bg-stone-50 text-stone-600'
        }`}>
          {renderScriptText(block.versions[version], darkMode, callVariables)}
        </div>

        {/* Expandable: signals + questions + next */}
        <button onClick={() => setExpanded(!expanded)}
          className={`flex items-center gap-1 mt-3 text-[9px] font-bold ${
            darkMode ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600'
          }`}>
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Menos' : 'Señales, preguntas y siguiente'}
        </button>

        {expanded && (
          <div className="mt-3 space-y-3">
            {/* Follow-up questions */}
            <div>
              <p className={`text-[8px] font-bold mb-1 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                <MessageCircle className="w-3 h-3 inline mr-1" />
                PREGUNTAS DE REGRESO
              </p>
              {block.followUpQuestions.map((q, i) => (
                <div key={i} className={`text-[9px] p-2 rounded-lg mb-1 ${darkMode ? 'bg-[#24211e] text-stone-400' : 'bg-stone-50 text-stone-600'}`}>
                  "{q}"
                </div>
              ))}
            </div>

            {/* Positive signals */}
            <div>
              <p className={`text-[8px] font-bold mb-1 ${darkMode ? 'text-emerald-500' : 'text-emerald-600'}`}>
                <CheckCircle2 className="w-3 h-3 inline mr-1" />
                SEÑALES POSITIVAS
              </p>
              <div className="flex flex-wrap gap-1">
                {block.positiveSignals.map((s, i) => (
                  <span key={i} className={`text-[8px] px-2 py-0.5 rounded-full ${
                    darkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Negative signals */}
            <div>
              <p className={`text-[8px] font-bold mb-1 ${darkMode ? 'text-red-500' : 'text-red-600'}`}>
                <XCircle className="w-3 h-3 inline mr-1" />
                SEÑALES NEGATIVAS
              </p>
              <div className="flex flex-wrap gap-1">
                {block.negativeSignals.map((s, i) => (
                  <span key={i} className={`text-[8px] px-2 py-0.5 rounded-full ${
                    darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'
                  }`}>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Next recommended */}
            {(block.nextIfPositive || block.nextIfNegative) && (
              <div className={`p-2 rounded-lg ${darkMode ? 'bg-[#24211e]' : 'bg-stone-50'}`}>
                <p className={`text-[8px] font-bold mb-1 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                  <ArrowRight className="w-3 h-3 inline mr-1" />
                  SIGUIENTE RECOMENDADO
                </p>
                {block.nextIfPositive && (
                  <p className={`text-[8px] ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    ✅ Si funciona → {block.nextIfPositive}
                  </p>
                )}
                {block.nextIfNegative && (
                  <p className={`text-[8px] ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                    ❌ Si no funciona → {block.nextIfNegative}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Signal buttons */}
        <div className="flex gap-2 mt-3">
          <button onClick={() => onSignal?.(block.id, 'positive')}
            className={`flex-1 py-2 rounded-xl text-[9px] font-bold transition-all ${
              darkMode ? 'bg-emerald-900/20 border border-emerald-800/30 text-emerald-400 hover:bg-emerald-900/30'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100'
            }`}>
            ✅ Funcionó
          </button>
          <button onClick={() => onSignal?.(block.id, 'negative')}
            className={`flex-1 py-2 rounded-xl text-[9px] font-bold transition-all ${
              darkMode ? 'bg-red-900/20 border border-red-800/30 text-red-400 hover:bg-red-900/30'
              : 'bg-red-50 border border-red-200 text-red-700 hover:bg-red-100'
            }`}>
            ❌ No funcionó
          </button>
          <button onClick={() => onMarkUsed?.(block.id)}
            className={`py-2 px-3 rounded-xl text-[9px] font-bold transition-all ${
              darkMode ? 'bg-stone-800 border border-stone-700 text-stone-400 hover:text-stone-200'
              : 'bg-stone-100 border border-stone-200 text-stone-500 hover:text-stone-700'
            }`}>
            ✓ Usado
          </button>
        </div>
      </div>
    </div>
  );
}
