import React from 'react';
import { Sparkles } from 'lucide-react';
import { EmotionalAnalysis, SalesCallScore } from '../types';

interface EmotionalAnalysisCardProps {
  emotional?: EmotionalAnalysis;
  score: SalesCallScore;
  customerMood: string;
}

export default function EmotionalAnalysisCard({ emotional, score, customerMood }: EmotionalAnalysisCardProps) {
  const resolvedEmotional: EmotionalAnalysis = emotional || {
    primaryEmotion: "Receptivo / Interesado",
    emotionalJourney: "Estable con propensión positiva a lo largo del diálogo.",
    purchaseAptitudeScore: Math.round(score.global),
    purchaseAptitudeLabel: score.global >= 85 ? "Muy Alto" : score.global >= 65 ? "Alto" : score.global >= 40 ? "Medio" : "Bajo",
    barriersToPurchase: ["Costo de la colegiatura o inscripción inicial"],
    buyingSignals: ["Pregunta detalles de modalidad", "Muestra interés de inicio inmediato"],
    aptitudeReason: `El prospecto demostró una aptitud de compra sólida del ${score.global}%.`
  };

  const moodConfig: Record<string, { emoji: string; text: string; bg: string; border: string; textClass: string }> = {
    receptivo: { emoji: '🤝 Receptivo', text: 'Muestra apertura, escucha activa y responde amablemente.', bg: 'bg-emerald-950/20', border: 'border-emerald-500/30', textClass: 'text-emerald-400' },
    interesado: { emoji: '🤩 Muy Interesado', text: 'Muestra gran entusiasmo por el programa educativo y el costo.', bg: 'bg-teal-950/20', border: 'border-teal-500/30', textClass: 'text-teal-400' },
    neutral: { emoji: '😐 Neutral', text: 'Respuestas pragmáticas, espera aclaración de costos y temario.', bg: 'bg-zinc-900/40', border: 'border-zinc-800', textClass: 'text-gray-400' },
    molesto: { emoji: '⚠️ Molesto / Objeción', text: 'Presenta constantes interrupciones o desacuerdo con ofertas.', bg: 'bg-rose-950/25', border: 'border-rose-500/30', textClass: 'text-rose-400' },
    indiferente: { emoji: '😴 Indiferente', text: 'Monosílabos, parece distraído o con baja atención al asesor.', bg: 'bg-amber-950/20', border: 'border-amber-500/30', textClass: 'text-amber-400' }
  };

  const activeMood = moodConfig[customerMood] || moodConfig.neutral;

  return (
    <div className="bg-[#121212] rounded-2xl border border-[#222222] p-6 shadow-sm flex flex-col gap-5" id="customer-psychology-card">
      <div className="flex items-center justify-between border-b border-[#222222] pb-3">
        <h3 className="text-xs uppercase tracking-wider text-gray-400 font-bold flex items-center gap-1.5 font-sans">
          <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
          Percepción y Comportamiento del Cliente
        </h3>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
          resolvedEmotional.purchaseAptitudeLabel === 'Muy Alto' || resolvedEmotional.purchaseAptitudeLabel === 'Alto'
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
            : resolvedEmotional.purchaseAptitudeLabel === 'Medio'
            ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
            : 'bg-rose-500/10 text-rose-450 border-rose-500/25 text-rose-400'
        }`}>
          Nivel de Cierre: {resolvedEmotional.purchaseAptitudeLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/80 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Intención de Compra</span>
            <p className="text-[11px] text-gray-400">Puntuación numérica estimada a través de objeciones y cierres:</p>
          </div>

          <div className="my-3 flex items-center gap-4">
            <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-zinc-800"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={`transition-all duration-1000 ${
                    (resolvedEmotional.purchaseAptitudeScore ?? 0) >= 75
                      ? 'text-[#00c8a5]'
                      : (resolvedEmotional.purchaseAptitudeScore ?? 0) >= 45
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                  strokeWidth="3.2"
                  strokeDasharray={`${resolvedEmotional.purchaseAptitudeScore ?? 0}, 100`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute text-sm font-black font-mono text-white">
                {resolvedEmotional.purchaseAptitudeScore ?? 0}%
              </div>
            </div>

            <div className="flex-1 space-y-1">
              <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-1.5 rounded-full ${
                    (resolvedEmotional.purchaseAptitudeScore ?? 0) >= 75
                      ? 'bg-[#00c8a5]'
                      : (resolvedEmotional.purchaseAptitudeScore ?? 0) >= 45
                      ? 'bg-amber-400'
                      : 'bg-rose-400'
                  }`}
                  style={{ width: `${resolvedEmotional.purchaseAptitudeScore ?? 0}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-500 block">
                Clasificación: <strong className="text-gray-300 font-medium">{resolvedEmotional.purchaseAptitudeLabel} Intención</strong>
              </span>
            </div>
          </div>
        </div>

        <div className={`rounded-xl p-4 border flex flex-col justify-between ${activeMood.bg} ${activeMood.border}`}>
          <div className="space-y-1">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Sentimiento del Cliente</span>
            <p className="text-[11px] text-gray-400">Tono emocional predominante según el motor auditivo:</p>
          </div>

          <div className="my-2.5 flex items-center gap-3">
            <div className="text-2xl flex-shrink-0 bg-black/20 p-2 rounded-lg border border-white/5">
              {activeMood.emoji.split(' ')[0]}
            </div>
            <div>
              <span className={`text-sm font-black ${activeMood.textClass} block`}>
                {activeMood.emoji.split(' ').slice(1).join(' ')}
              </span>
              <p className="text-[11px] text-gray-300 leading-tight">
                {activeMood.text}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#171717] p-3.5 rounded-xl border border-zinc-800/80">
        <div className="space-y-1 border-b md:border-b-0 md:border-r border-zinc-800 pb-2.5 md:pb-0 md:pr-3">
          <span className="text-[9px] text-indigo-400 font-mono tracking-wider block uppercase font-bold">Camino Mental / Transición</span>
          <span className="text-xs text-indigo-300 font-medium">{resolvedEmotional.primaryEmotion}</span>
          <p className="text-[11px] text-gray-400 leading-normal italic">
            "{resolvedEmotional.emotionalJourney}"
          </p>
        </div>
        <div className="space-y-1 pt-2.5 md:pt-0 md:pl-3">
          <span className="text-[9px] text-[#00c8a5] font-mono tracking-wider block uppercase font-bold">Diagnóstico Cognitivo</span>
          <p className="text-[11px] text-gray-300 leading-relaxed font-sans">
            {resolvedEmotional.aptitudeReason}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest block mb-1.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-[#00c8a5] rounded-full" /> Señales de Compra Detectadas
          </span>
          <div className="flex flex-col gap-1">
            {resolvedEmotional.buyingSignals && resolvedEmotional.buyingSignals.length > 0 ? (
              resolvedEmotional.buyingSignals.map((sig: string, i: number) => (
                <div key={i} className="text-[11px] text-gray-300 bg-[#161616] p-1.5 px-2.5 border border-zinc-800/80 rounded-lg flex items-start gap-2">
                  <span className="text-[#00c8a5] font-bold">✓</span>
                  <span>{sig}</span>
                </div>
              ))
            ) : (
              <span className="text-[11px] text-gray-500 italic">No se observaron señales directas.</span>
            )}
          </div>
        </div>

        <div>
          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest block mb-1.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" /> Objeciones / Barreras
          </span>
          <div className="flex flex-col gap-1">
            {resolvedEmotional.barriersToPurchase && resolvedEmotional.barriersToPurchase.length > 0 ? (
              resolvedEmotional.barriersToPurchase.map((bar: string, i: number) => (
                <div key={i} className="text-[11px] text-gray-300 bg-[#161616] p-1.5 px-2.5 border border-zinc-800/80 rounded-lg flex items-start gap-2">
                  <span className="text-rose-450 font-bold">🚨</span>
                  <span>{bar}</span>
                </div>
              ))
            ) : (
              <span className="text-[11px] text-emerald-400 bg-emerald-950/20 p-2 text-center rounded border border-emerald-900/20">Sin barreras explícitas detectadas.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
