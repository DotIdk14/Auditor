import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { useAuditFull } from '../../hooks/useAudits';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play, Pause, SkipBack, Download, FileText, FileSpreadsheet,
  ChevronDown, ChevronRight, CheckCircle2, AlertCircle, AlertTriangle,
  Lightbulb, Target, ArrowRight, Mic, User, MessageSquare,
  BrainCircuit, TrendingUp, TrendingDown, Minus, Sparkles, Star
} from 'lucide-react';
import type { AuditFullResponse, DialogueUtterance, RubricItem } from '@auditor/shared-types';

export default function AuditorPage() {
  const { callId } = useParams<{ callId: string }>();
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const navigate = useNavigate();
  
  const { data: auditData, isLoading, error } = useAuditFull(callId || 'default');
  
  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Rubric accordion
  const [expandedRubric, setExpandedRubric] = useState<string | null>(null);
  
  // Active transcript utterance (synced with audio)
  const [activeUtteranceIndex, setActiveUtteranceIndex] = useState<number>(-1);
  
  // Annotation modal
  const [annotationTarget, setAnnotationTarget] = useState<number | null>(null);
  const [annotationText, setAnnotationText] = useState('');
  const [annotationCategory, setAnnotationCategory] = useState('Buena Práctica');

  // Simulated audio - in production this would be a real audio element
  useEffect(() => {
    if (auditData?.audioUrl) {
      const audio = new Audio(auditData.audioUrl);
      audioRef.current = audio;
      audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
        // Find active utterance based on current time
        const idx = auditData.transcription.findIndex(
          (u: DialogueUtterance) => u.seconds <= audio.currentTime && 
          (auditData.transcription.indexOf(u) === auditData.transcription.length - 1 || 
           auditData.transcription[auditData.transcription.indexOf(u) + 1].seconds > audio.currentTime)
        );
        if (idx >= 0) setActiveUtteranceIndex(idx);
      });
      return () => { audio.pause(); audio.src = ''; };
    }
  }, [auditData?.audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    }
    // Find and highlight the clicked utterance
    const idx = auditData?.transcription.findIndex(
      (u: DialogueUtterance) => u.seconds <= seconds
    );
    if (idx !== undefined && idx >= 0) setActiveUtteranceIndex(idx);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-[#b57b54]/30 border-t-[#b57b54] rounded-full animate-spin mx-auto" />
          <p className={`text-xs font-bold ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
            Cargando auditoría...
          </p>
        </div>
      </div>
    );
  }

  if (error || !auditData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <p className="text-sm font-bold text-rose-500">Error al cargar la auditoría</p>
          <button onClick={() => navigate('/')}
            className="text-xs font-bold text-[#b57b54] hover:underline">
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const { audit, transcription, rubric, coaching, insights } = auditData;

  return (
    <div className="h-full overflow-y-auto p-4 pb-32">
      <div className="grid grid-cols-12 gap-4 h-full">
        
        {/* LEFT PANEL: Audio Player + Rubric + Coaching */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          
          {/* Audio Player */}
          <div className={`rounded-[5px] border-[3px] p-5 ${
            darkMode ? 'bg-[#24211e] border-[#4a4036] shadow-[4px_4px_0px_#151311]' : 'bg-white border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d]'
          }`}>
            <h3 className={`text-sm font-bold font-display mb-4 ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
              🎧 Reproductor de Audio
            </h3>
            
            {/* File Info */}
            <div className={`text-[10px] font-mono space-y-1 mb-4 p-3 rounded-xl ${
              darkMode ? 'bg-[#1c1a18] text-stone-400' : 'bg-stone-50 text-stone-500'
            }`}>
              <div className="flex justify-between">
                <span>Archivo:</span>
                <span className="font-bold">{audit.fileName}</span>
              </div>
              <div className="flex justify-between">
                <span>Tracker ID:</span>
                <span className="font-bold">{audit.trackerId}</span>
              </div>
              <div className="flex justify-between">
                <span>Duración:</span>
                <span className="font-bold">{formatTime(audit.durationSec)}</span>
              </div>
              <div className="flex justify-between">
                <span>Calidad:</span>
                <span className="font-bold text-emerald-500">Estéreo 44.1kHz</span>
              </div>
            </div>

            {/* Waveform / Seek Bar */}
            <div className="relative mb-4">
              <div className={`h-16 rounded-xl relative overflow-hidden ${
                darkMode ? 'bg-[#1c1a18]' : 'bg-stone-100'
              }`}>
                {/* Simulated waveform bars */}
                <div className="absolute inset-0 flex items-center justify-between px-2 gap-[2px]">
                  {Array.from({ length: 80 }).map((_, i) => (
                    <div key={i}
                      className={`w-[3px] rounded-full transition-all duration-100 ${
                        (i / 80) * 100 <= progress ? 'bg-[#d4a373]' : darkMode ? 'bg-stone-700' : 'bg-stone-200'
                      }`}
                      style={{ height: `${20 + Math.random() * 60}%` }}
                    />
                  ))}
                </div>
                {/* Progress overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#d4a373]/20 to-transparent"
                  style={{ width: `${progress}%` }} />
              </div>
              
              {/* Seek input */}
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <button onClick={togglePlay}
                className={`p-3 rounded-xl border transition-all ${
                  darkMode ? 'bg-[#1c1a18] border-[#3e382f] text-stone-200 hover:bg-[#2e2a24]' : 'bg-white border-[#dfd9cc] text-stone-700 hover:bg-stone-50'
                }`}>
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-bold ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                  {formatTime(currentTime)} / {formatTime(audit.durationSec)}
                </span>
              </div>

              <div className="flex gap-1">
                <button className={`p-2 rounded-lg border transition-all ${
                  darkMode ? 'border-[#3e382f] text-stone-400 hover:bg-[#2e2a24]' : 'border-[#dfd9cc] text-stone-500 hover:bg-stone-50'
                }`}>
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Rubric */}
          <RubricSection
            rubric={rubric}
            score={audit.score}
            darkMode={darkMode}
            expandedRubric={expandedRubric}
            setExpandedRubric={setExpandedRubric}
          />

          {/* Coaching */}
          <CoachingSection coaching={coaching} darkMode={darkMode} />
        </div>

        {/* RIGHT PANEL: Transcription + Insights */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          
          {/* Transcription */}
          <div className={`rounded-[5px] border-[3px] p-5 ${
            darkMode ? 'bg-[#24211e] border-[#4a4036] shadow-[4px_4px_0px_#151311]' : 'bg-white border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d]'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-sm font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                📝 Transcripción Cronológica
              </h3>
              <div className="flex gap-2">
                <button className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold ${
                  darkMode ? 'border-[#3e382f] text-stone-300 hover:bg-[#2e2a24]' : 'border-[#dfd9cc] text-stone-600 hover:bg-stone-50'
                }`}>
                  <FileText className="w-3.5 h-3.5" />
                  PDF
                </button>
                <button className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold ${
                  darkMode ? 'border-[#3e382f] text-stone-300 hover:bg-[#2e2a24]' : 'border-[#dfd9cc] text-stone-600 hover:bg-stone-50'
                }`}>
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  CSV
                </button>
              </div>
            </div>

            <p className={`text-[10px] font-medium mb-4 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
              💡 Haz clic en cualquier enunciado para saltar a ese momento del audio
            </p>

            {/* Transcript bubbles */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {transcription.map((utterance: DialogueUtterance, index: number) => (
                <button
                  key={index}
                  onClick={() => handleSeek(utterance.seconds)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    activeUtteranceIndex === index
                      ? darkMode ? 'bg-[#3e342a] border-[#d4a373] shadow-md' : 'bg-[#faedcd] border-[#d4a373] shadow-md'
                      : darkMode ? 'bg-[#1c1a18] border-[#3e382f] hover:bg-[#2e2a24]' : 'bg-white border-[#dfd9cc] hover:bg-stone-50'
                  }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold ${
                        utterance.speaker === 'Vendedor'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                      }`}>
                        {utterance.speaker === 'Vendedor' ? 'V' : 'C'}
                      </span>
                      <span className={`text-[10px] font-bold ${
                        utterance.speaker === 'Vendedor' ? 'text-blue-600' : 'text-rose-600'
                      }`}>
                        {utterance.speaker}
                      </span>
                      <span className="text-[9px] font-mono text-stone-500">{utterance.time}</span>
                    </div>
                    <SentimentBadge sentiment={utterance.sentiment} darkMode={darkMode} />
                  </div>
                  <p className={`text-xs leading-relaxed ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                    {utterance.text}
                  </p>
                  {utterance.confidence && (
                    <div className="mt-1.5 flex items-center gap-1">
                      <div className={`h-1 rounded-full flex-1 max-w-[80px] ${darkMode ? 'bg-stone-700' : 'bg-stone-200'}`}>
                        <div className="h-1 rounded-full bg-emerald-500" style={{ width: `${utterance.confidence}%` }} />
                      </div>
                      <span className="text-[8px] font-mono text-stone-500">{utterance.confidence}%</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Insights grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Summary */}
            <div className={`rounded-[5px] border-[3px] p-5 ${
              darkMode ? 'bg-[#24211e] border-[#4a4036] shadow-[4px_4px_0px_#151311]' : 'bg-white border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d]'
            }`}>
              <h4 className={`text-xs font-bold font-display mb-3 flex items-center gap-1.5 ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                <BrainCircuit className="w-4 h-4 text-purple-500" />
                Resumen de Auditoría
              </h4>
              <p className={`text-[11px] leading-relaxed ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                {audit.summary}
              </p>
            </div>

            {/* Client Perception */}
            <div className={`rounded-[5px] border-[3px] p-5 ${
              darkMode ? 'bg-[#24211e] border-[#4a4036] shadow-[4px_4px_0px_#151311]' : 'bg-white border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d]'
            }`}>
              <h4 className={`text-xs font-bold font-display mb-3 flex items-center gap-1.5 ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                <User className="w-4 h-4 text-blue-500" />
                Percepción del Cliente
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px]">
                  <span className="text-stone-500">Intención de compra:</span>
                  <span className="font-bold">{insights.clientPerception.purchaseIntentPct}%</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-stone-500">Sentimiento:</span>
                  <span className="font-bold">{insights.clientPerception.sentimentLabel}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-stone-500">Temple:</span>
                  <span className="font-bold">{insights.clientPerception.temper}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-stone-500">Camino cognitivo:</span>
                  <span className="font-bold">{insights.clientPerception.cognitivePath}</span>
                </div>
              </div>
            </div>

            {/* Purchase Signals */}
            {insights.purchaseSignals.length > 0 && (
              <div className={`rounded-[5px] border-[3px] p-5 ${
                darkMode ? 'bg-[#24211e] border-[#4a4036] shadow-[4px_4px_0px_#151311]' : 'bg-white border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d]'
              }`}>
                <h4 className={`text-xs font-bold font-display mb-3 flex items-center gap-1.5 ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  Señales de Compra
                </h4>
                <div className="space-y-1.5">
                  {insights.purchaseSignals.map((signal: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className={darkMode ? 'text-stone-300' : 'text-stone-600'}>{signal}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Objections */}
            {insights.objections.length > 0 && (
              <div className={`rounded-[5px] border-[3px] p-5 ${
                darkMode ? 'bg-[#24211e] border-[#4a4036] shadow-[4px_4px_0px_#151311]' : 'bg-white border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d]'
              }`}>
                <h4 className={`text-xs font-bold font-display mb-3 flex items-center gap-1.5 ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  Objeciones / Barreras
                </h4>
                <div className="space-y-1.5">
                  {insights.objections.map((obj: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-[11px]">
                      <Minus className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <span className={darkMode ? 'text-stone-300' : 'text-stone-600'}>{obj}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Coaching Section */}
          <CoachingSection coaching={coaching} darkMode={darkMode} detailed />
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function SentimentBadge({ sentiment, darkMode }: { sentiment: DialogueUtterance['sentiment']; darkMode: boolean }) {
  const colors: Record<string, string> = {
    normal: darkMode ? 'bg-amber-900/30 text-amber-300 border-amber-800/30' : 'bg-amber-50 text-amber-700 border-amber-200',
    objection: darkMode ? 'bg-rose-900/30 text-rose-300 border-rose-800/30' : 'bg-rose-50 text-rose-700 border-rose-200',
    positive: darkMode ? 'bg-emerald-900/30 text-emerald-300 border-emerald-800/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  return (
    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${colors[sentiment.type] || colors.normal}`}>
      {sentiment.label}
    </span>
  );
}

function RubricSection({ rubric, score, darkMode, expandedRubric, setExpandedRubric }: any) {
  return (
    <div className={`rounded-[5px] border-[3px] p-5 ${
      darkMode ? 'bg-[#24211e] border-[#4a4036] shadow-[4px_4px_0px_#151311]' : 'bg-white border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d]'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
          📋 Rúbrica PCE
        </h3>
        <div className="flex items-center gap-2">
          <div className="relative w-10 h-10">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3"
                className={darkMode ? 'text-stone-700' : 'text-stone-200'} />
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#d4a373" strokeWidth="3"
                strokeDasharray={`${(score / 10) * 100} ${100 - (score / 10) * 100}`}
                strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-black">
              {score.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {rubric.map((item: RubricItem, i: number) => (
          <div key={i} className={`rounded-xl border overflow-hidden ${
            darkMode ? 'border-[#3e382f]' : 'border-[#dfd9cc]'
          }`}>
            <button
              onClick={() => setExpandedRubric(expandedRubric === item.title ? null : item.title)}
              className={`w-full flex items-center justify-between p-3 text-left transition-all ${
                darkMode ? 'hover:bg-[#1c1a18]' : 'hover:bg-stone-50'
              }`}>
              <div className="flex items-center gap-2">
                {item.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                {item.status === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                {item.status === 'danger' && <AlertCircle className="w-4 h-4 text-rose-500" />}
                <span className={`text-[11px] font-bold ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                  {item.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-bold ${
                  item.status === 'success' ? 'text-emerald-500' :
                  item.status === 'warning' ? 'text-amber-500' : 'text-rose-500'
                }`}>
                  {item.points}/{item.maxPoints}
                </span>
                {expandedRubric === item.title ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </div>
            </button>
            {expandedRubric === item.title && (
              <div className={`px-3 pb-3 space-y-1 ${darkMode ? 'bg-[#1c1a18]' : 'bg-stone-50'}`}>
                {item.details.map((detail: string, j: number) => (
                  <p key={j} className="text-[10px] leading-relaxed text-stone-500 pl-6">
                    • {detail}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CoachingSection({ coaching, darkMode, detailed }: any) {
  if (!coaching) return null;
  return (
    <div className={`rounded-[5px] border-[3px] p-5 ${
      darkMode ? 'bg-[#24211e] border-[#4a4036] shadow-[4px_4px_0px_#151311]' : 'bg-white border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d]'
    }`}>
      <h3 className={`text-sm font-bold font-display mb-4 flex items-center gap-1.5 ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
        <Lightbulb className="w-4 h-4 text-amber-500" />
        {detailed ? 'Coaching de Desempeño Detallado' : 'Coaching de Desempeño'}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Strengths */}
        <div className={`p-3 rounded-xl border ${darkMode ? 'bg-emerald-900/10 border-emerald-900/20' : 'bg-emerald-50 border-emerald-100'}`}>
          <h4 className="text-[10px] font-black uppercase tracking-wider text-emerald-600 mb-2">👍 Fortalezas</h4>
          <ul className="space-y-1">
            {coaching.strengths?.map((s: string, i: number) => (
              <li key={i} className="text-[10px] leading-relaxed text-stone-600 dark:text-stone-400 flex items-start gap-1.5">
                <Star className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                {s}
              </li>
            ))}
          </ul>
        </div>

        {/* Improvements */}
        <div className={`p-3 rounded-xl border ${darkMode ? 'bg-amber-900/10 border-amber-900/20' : 'bg-amber-50 border-amber-100'}`}>
          <h4 className="text-[10px] font-black uppercase tracking-wider text-amber-600 mb-2">👎 Áreas de Oportunidad</h4>
          <ul className="space-y-1">
            {coaching.improvements?.map((s: string, i: number) => (
              <li key={i} className="text-[10px] leading-relaxed text-stone-600 dark:text-stone-400 flex items-start gap-1.5">
                <Target className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                {s}
              </li>
            ))}
          </ul>
        </div>

        {/* Next Steps */}
        <div className={`p-3 rounded-xl border ${darkMode ? 'bg-blue-900/10 border-blue-900/20' : 'bg-blue-50 border-blue-100'}`}>
          <h4 className="text-[10px] font-black uppercase tracking-wider text-blue-600 mb-2">➡️ Próximos Pasos</h4>
          <ul className="space-y-1">
            {coaching.nextSteps?.map((s: string, i: number) => (
              <li key={i} className="text-[10px] leading-relaxed text-stone-600 dark:text-stone-400 flex items-start gap-1.5">
                <ArrowRight className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
