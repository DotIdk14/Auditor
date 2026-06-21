import React, { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Play, Volume2, Sparkles } from 'lucide-react';

export interface AudioPlayerHandle {
  seekTo: (seconds: number) => void;
}

interface AudioPlayerProps {
  audioUrl: string;
  fileName: string;
  callId: string;
  metadataDuration: number;
  onDownloadPDF?: () => void;
  onDownloadCSV?: () => void;
  onTimeUpdate?: (time: number) => void;
}

const AudioPlayer = forwardRef<AudioPlayerHandle, AudioPlayerProps>(({
  audioUrl, fileName, callId, metadataDuration, onDownloadPDF, onDownloadCSV, onTimeUpdate
}, ref) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useImperativeHandle(ref, () => ({
    seekTo(seconds: number) {
      if (audioRef.current) {
        audioRef.current.currentTime = seconds;
        audioRef.current.play().catch(e => console.log('Audio play action context required: ', e));
        setIsPlaying(true);
      }
    }
  }));

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      setPlaybackTime(time);
      onTimeUpdate?.(time);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const formatTime = (timeInSeconds: number) => {
    if (timeInSeconds === undefined || timeInSeconds === null || isNaN(timeInSeconds)) return "0:00";
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[#111111] text-white rounded-2xl p-6 shadow-md border border-[#222222] flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">AUDITORÍA DE CANAL ACTIVO UTEL</span>
          <h3 className="text-sm font-semibold text-white truncate max-w-xs">{fileName}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-indigo-500/25 text-indigo-300 border border-indigo-500/40">
            {callId}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 py-2">
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          className="hidden"
          controls
        />

        <div className="flex items-center gap-4 w-full">
          <button
            onClick={() => {
              if (audioRef.current) {
                if (isPlaying) {
                  audioRef.current.pause();
                  setIsPlaying(false);
                } else {
                  audioRef.current.play().catch(e => console.log('Audio play action context required: ', e));
                  setIsPlaying(true);
                }
              }
            }}
            className="w-12 h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 shrink-0"
            title={isPlaying ? "Pausar" : "Reproducir audio"}
            id="audio-play-button"
          >
            {isPlaying ? (
              <div className="flex gap-1.5 items-center justify-center">
                <span className="w-1.5 h-4 bg-white rounded-xs animate-bounce" />
                <span className="w-1.5 h-4 bg-white rounded-xs animate-bounce [animation-delay:0.15s]" />
              </div>
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <div className="flex-1 flex items-center gap-2">
            <span className="text-xs text-gray-400 font-mono">{formatTime(playbackTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={playbackTime}
              onChange={(e) => {
                if (audioRef.current) {
                  audioRef.current.currentTime = parseFloat(e.target.value);
                  setPlaybackTime(parseFloat(e.target.value));
                }
              }}
              className="flex-1 accent-indigo-550 h-1 rounded-lg cursor-pointer opacity-80"
              id="playback-slider"
            />
            <span className="text-xs text-gray-400 font-mono">{formatTime(duration || metadataDuration)}</span>
          </div>
        </div>

        <div className="flex justify-between items-center w-full text-xs text-gray-400 border-t border-[#222222] pt-3">
          <div className="flex items-center gap-1.5 opacity-60">
            <Volume2 className="w-4 h-4" />
            <span className="font-mono">Estéreo</span>
          </div>
          <div className="text-[10px] text-gray-500 font-mono">
            Duración: {Math.round(duration || metadataDuration)}s
          </div>
        </div>
      </div>

      <div className="px-3 py-2 bg-[#1a1a1a]/60 rounded-lg border border-[#222222] text-[11px] flex items-center gap-2 text-gray-400">
        <Sparkles className="w-4 h-4 text-violet-400 flex-shrink-0 animate-pulse" />
        <span>Haz clic en los enunciados de la transcripción a la derecha para reproducir desde ese segundo.</span>
      </div>

      {onDownloadPDF || onDownloadCSV ? (
        <div className="flex flex-col gap-2 pt-3 border-t border-[#222222]/80">
          <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase block mb-1">EXPORTACIÓN DE AUDITORÍA</span>
          <div className="grid grid-cols-2 gap-3">
            {onDownloadPDF && (
              <button
                onClick={onDownloadPDF}
                className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-xl border border-rose-500/15 bg-rose-500/5 hover:bg-rose-500/15 hover:border-rose-500/30 text-rose-400 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                id="download-pdf-report-btn"
                title="Descargar reporte detallado en PDF para imprimir o compartir"
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <span>PDF Completo</span>
              </button>
            )}
            {onDownloadCSV && (
              <button
                onClick={onDownloadCSV}
                className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-xl border border-[#00c8a5]/15 bg-[#00c8a5]/5 hover:bg-[#00c8a5]/15 hover:border-[#00c8a5]/30 text-[#00c8a5] transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                id="download-csv-report-btn"
                title="Descargar datos estructurados en formato CSV para MS Excel o Google Sheets"
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125V3.375m1.125 16.25h1.5m-1.5 0h1.5m0 0h1.5m0 0h1.5m0 0H6.75m10.5 0h1.5m-1.5 0h1.5m0 0h1.5m0 0H18m-11.25 0V6.75m0 0A1.125 1.125 0 018.25 5.625h7.5a1.125 1.125 0 011.125 1.125v12.75" />
                </svg>
                <span>CSV de Datos</span>
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
});

AudioPlayer.displayName = 'AudioPlayer';
export default AudioPlayer;
