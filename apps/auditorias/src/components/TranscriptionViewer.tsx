import React, { useState } from 'react';
import { Clock, Download, MessageSquare, Flag, Trash2, Plus } from 'lucide-react';
import { TranscriptionUtterance, Nota, Objecion } from '../types';

interface TranscriptionViewerProps {
  transcription: TranscriptionUtterance[];
  notas: Nota[];
  objeciones: Objecion[];
  playbackTime: number;
  onSeekTo: (seconds: number) => void;
  onNotaClick: (start: number, end: number) => void;
  onObjecionClick: (start: number, end: number) => void;
  onDeleteNota: (id: string) => void;
  onDeleteObjecion: (id: string) => void;
  onDownloadTranscript: () => void;
}

export default function TranscriptionViewer({
  transcription, notas, objeciones, playbackTime,
  onSeekTo, onNotaClick, onObjecionClick,
  onDeleteNota, onDeleteObjecion, onDownloadTranscript
}: TranscriptionViewerProps) {
  const [showFullTranscript, setShowFullTranscript] = useState(false);

  const formatTime = (timeInSeconds: number) => {
    if (timeInSeconds === undefined || timeInSeconds === null || isNaN(timeInSeconds)) return "0:00";
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSentimentBubbleStyle = (sentiment: string, isSpeakerSeller: boolean) => {
    if (isSpeakerSeller) {
      switch (sentiment) {
        case 'positive':
          return 'bg-[#061c13] border border-emerald-500/15 text-gray-100 hover:border-emerald-500/30 hover:bg-[#09261b]';
        case 'negative':
          return 'bg-[#240b0f] border border-rose-500/15 text-gray-100 hover:border-rose-500/30 hover:bg-[#2f1015]';
        default:
          return 'bg-[#0e1625] border border-[#3b82f6]/15 text-gray-100 hover:border-[#3b82f6]/30 hover:bg-[#121c2f]';
      }
    } else {
      switch (sentiment) {
        case 'positive':
          return 'bg-[#081a20] border border-teal-500/15 text-gray-100 hover:border-teal-500/35 hover:bg-[#0c242e]';
        case 'negative':
          return 'bg-[#240b0f] border border-rose-500/15 text-gray-100 hover:border-rose-500/35 hover:bg-[#2f1015]';
        default:
          return 'bg-[#161616] border border-zinc-800/80 text-gray-200 hover:border-zinc-700 hover:bg-[#202020]';
      }
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <span className="text-emerald-400 font-bold bg-[#061c13]/80 px-2 py-0.5 rounded-lg border border-emerald-500/15 text-[10px] flex items-center gap-1">😊 Positivo</span>;
      case 'negative':
        return <span className="text-rose-400 font-bold bg-[#240b0f]/80 px-2 py-0.5 rounded-lg border border-rose-500/15 text-[10px] flex items-center gap-1">🚨 Objeción</span>;
      default:
        return <span className="text-yellow-400 font-bold bg-[#242116]/80 px-2 py-0.5 rounded-lg border border-yellow-500/15 text-[10px] flex items-center gap-1">😐 Normal</span>;
    }
  };

  return (
    <div className="bg-[#111111] rounded-2xl border border-[#222222] shadow-md p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-[#222222] pb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">Transcripción Cronológica</h2>
          <p className="text-xs text-gray-400">Mapeado de locutores y sentimientos por enunciado</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-gray-500 flex-wrap">
          <span className="flex items-center gap-1 mr-1"><span className="w-2.2 h-2.2 rounded-full bg-indigo-500 block" /> Vendedor</span>
          <span className="flex items-center gap-1 mr-2"><span className="w-2.2 h-2.2 rounded-full bg-gray-500 block" /> Cliente</span>

          <button
            type="button"
            onClick={onDownloadTranscript}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg border border-[#00c8a5]/25 bg-[#00c8a5]/10 hover:bg-[#00c8a5]/20 text-[#00c8a5] transition-all cursor-pointer outline-none shrink-0"
            id="download-transcript-pdf-btn"
            title="Descargar toda la transcripción organizada como un chat en archivo PDF (.pdf)"
          >
            <Download className="w-3 h-3" />
            <span>Descargar Chat (PDF)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowFullTranscript(!showFullTranscript)}
            className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-indigo-500/25 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-350 transition-all cursor-pointer outline-none shrink-0"
            id="toggle-full-transcript-top"
          >
            {showFullTranscript ? "Vista Compacta ↑" : "Mostrar Completo ↓"}
          </button>
        </div>
      </div>

      <div className={`flex flex-col gap-6 pr-2 custom-scrollbar flex-1 transition-all ${
        showFullTranscript
          ? 'max-h-none'
          : 'min-h-[220px] max-h-[72vh] overflow-y-auto'
      }`}>
        {transcription.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-8 italic">No hay transcripción disponible.</p>
        ) : (
          transcription.map((dialogue: TranscriptionUtterance, index: number) => {
            const isSeller = dialogue.speaker === 'Vendedor';
            const isCurrentTime = playbackTime >= dialogue.start && playbackTime <= dialogue.end;

            return (
              <div
                key={index}
                onClick={() => onSeekTo(dialogue.start)}
                className={`flex flex-col cursor-pointer group transition-all duration-205 w-full ${
                  isSeller ? 'items-start' : 'items-end'
                }`}
                id={`dialogue-row-${index}`}
              >
                <div className={`flex items-center gap-2 mb-2 ${isSeller ? 'flex-row' : 'flex-row-reverse'}`}>
                  <span className="text-white font-bold flex items-center gap-1.5">
                    {isSeller ? (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 border border-indigo-400 text-white flex items-center justify-center text-[10px] font-extrabold shadow-md">V</div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-[#374151] border border-zinc-500 text-gray-100 flex items-center justify-center text-[10px] font-extrabold shadow-md">C</div>
                    )}
                    <span className="text-xs font-semibold tracking-wide text-gray-200">{dialogue.speaker}</span>
                  </span>

                  <span className="font-mono bg-[#141416] border border-zinc-800 text-gray-300 px-2 py-0.5 rounded-md text-[10px] flex items-center gap-1.5 shadow-sm">
                    <Clock className="w-3 h-3 text-gray-400" />
                    {formatTime(dialogue.start)}
                  </span>

                  <span className="scale-95 origin-center">{getSentimentIcon(dialogue.sentiment)}</span>
                </div>

                <div
                  className={`rounded-2xl p-5 transition-all duration-300 w-full max-w-[85%] sm:max-w-[75%] md:max-w-[70%] break-words ${getSentimentBubbleStyle(
                    dialogue.sentiment,
                    isSeller
                  )} ${
                    isCurrentTime
                      ? 'ring-2 ring-indigo-500 shadow-lg bg-indigo-950/20'
                      : 'shadow-sm border border-transparent'
                  }`}
                >
                  <p className="text-[13.5px] leading-relaxed text-gray-100 whitespace-pre-wrap font-medium">{dialogue.text}</p>
                  <div className="mt-2.5 flex items-center justify-between text-[9.5px] text-gray-500 border-t border-zinc-500/10 pt-2 opacity-30 group-hover:opacity-100 transition-opacity duration-200">
                    <span className="italic">Saltar reproducción al segundo {formatTime(dialogue.start)}</span>
                    <span className="font-mono bg-[#0f0f11] py-0.5 px-1.5 rounded text-gray-400">Confianza: {Math.round(dialogue.confidence * 100)}%</span>
                  </div>
                </div>

                {(() => {
                  const segmentNotas = notas.filter(n =>
                    n.segmentStart >= dialogue.start && n.segmentEnd <= dialogue.end
                  );
                  const segmentObjeciones = objeciones.filter(o =>
                    o.segmentStart >= dialogue.start && o.segmentEnd <= dialogue.end
                  );
                  return (
                    <div className={`flex flex-col gap-1.5 mt-1.5 ${isSeller ? 'ml-0' : 'mr-0'} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                      {segmentNotas.map(nota => (
                        <div key={nota.id} className="flex items-start gap-2 bg-blue-500/5 border border-blue-500/15 rounded-lg px-3 py-1.5 text-[11px]">
                          <MessageSquare className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                          <span className="text-gray-300 flex-1">{nota.text}</span>
                          <span className="text-[9px] text-gray-500 shrink-0">{nota.supervisorName}</span>
                          <button onClick={() => onDeleteNota(nota.id)} className="text-gray-500 hover:text-rose-400 shrink-0">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {segmentObjeciones.map(obj => (
                        <div key={obj.id} className="flex items-start gap-2 bg-rose-500/5 border border-rose-500/15 rounded-lg px-3 py-1.5 text-[11px]">
                          <Flag className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />
                          <span className="text-gray-300 flex-1">{obj.text}</span>
                          <span className="text-[9px] text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded font-bold uppercase">{obj.tipoObjecion.replace(/_/g, ' ')}</span>
                          <span className="text-[9px] text-gray-500">{obj.supervisorName}</span>
                          <button onClick={() => onDeleteObjecion(obj.id)} className="text-gray-500 hover:text-rose-400 shrink-0">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <div className="flex gap-1.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); onNotaClick(dialogue.start, dialogue.end); }}
                          className="text-[10px] text-blue-400 hover:text-blue-300 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 rounded px-2 py-0.5 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Nota
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onObjecionClick(dialogue.start, dialogue.end); }}
                          className="text-[10px] text-rose-400 hover:text-rose-300 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 rounded px-2 py-0.5 flex items-center gap-1"
                        >
                          <Flag className="w-3 h-3" /> Objeción
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
