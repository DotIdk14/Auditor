import React, { useRef, useState, useEffect } from 'react';
import { getAudioFromDB } from '../utils/audioCache';
import { Sparkles, Award, ThumbsUp, ThumbsDown, Calendar, CheckCircle2, GraduationCap } from 'lucide-react';
import { SalesCall, Nota, Objecion, TipoObjecion, Severidad } from '../types';
import { downloadPDFReport, downloadCSVReport, downloadTranscriptionPDF } from '../utils/reportGenerator';
import { API_URL } from '../config';
import AudioPlayer, { AudioPlayerHandle } from './AudioPlayer';
import PceChecklistCard from './PceChecklistCard';
import EmotionalAnalysisCard from './EmotionalAnalysisCard';
import TranscriptionViewer from './TranscriptionViewer';
import AnnotationModal from './AnnotationModal';

interface AuditorDashboardProps {
  activeCall: SalesCall;
}

export default function AuditorDashboard({ activeCall }: AuditorDashboardProps) {
  const audioPlayerRef = useRef<AudioPlayerHandle>(null);

  const [audioUrl, setAudioUrl] = useState<string>(activeCall.metadata.url || '');

  useEffect(() => {
    let active = true;
    let urlToRevoke = '';

    const loadLocalAudio = async () => {
      try {
        const cachedBlob = await getAudioFromDB(activeCall.id);
        if (cachedBlob && active) {
          const localUrl = URL.createObjectURL(cachedBlob);
          urlToRevoke = localUrl;
          setAudioUrl(localUrl);
          return;
        }
      } catch (err) {
        console.error("Error al cargar audio del IndexedDB:", err);
      }

      if (active) {
        setAudioUrl(activeCall.metadata.url || '');
      }
    };

    loadLocalAudio();

    return () => {
      active = false;
      if (urlToRevoke) {
        URL.revokeObjectURL(urlToRevoke);
      }
    };
  }, [activeCall.id, activeCall.metadata.url]);

  const [notas, setNotas] = useState<Nota[]>([]);
  const [objeciones, setObjeciones] = useState<Objecion[]>([]);
  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [annotationType, setAnnotationType] = useState<'nota' | 'objecion'>('nota');
  const [annotationSegment, setAnnotationSegment] = useState<{ start: number; end: number }>({ start: 0, end: 0 });

  const supervisorEmail = localStorage.getItem('utel_supervisor_user') || 'supervisor@utel.mx';
  const supervisorName = localStorage.getItem('utel_supervisor_user') || 'Supervisor';

  useEffect(() => {
    fetch(`${API_URL}/api/llamadas/${activeCall.id}/notas`)
      .then(r => r.json())
      .then(data => setNotas(Array.isArray(data) ? data : []))
      .catch(() => {});
    fetch(`${API_URL}/api/llamadas/${activeCall.id}/objeciones`)
      .then(r => r.json())
      .then(data => setObjeciones(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [activeCall.id]);

  const handleSaveAnnotation = async (data: { text: string; tipoObjecion?: TipoObjecion; severidad?: Severidad }) => {
    const endpoint = annotationType === 'nota' ? 'notas' : 'objeciones';
    const body: any = {
      supervisorEmail,
      supervisorName,
      segmentStart: annotationSegment.start,
      segmentEnd: annotationSegment.end,
    };
    body.text = data.text;
    if (annotationType === 'objecion') {
      body.tipoObjecion = data.tipoObjecion;
      body.severidad = data.severidad;
    }

    try {
      const res = await fetch(`${API_URL}/api/llamadas/${activeCall.id}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const created = await res.json();
        if (annotationType === 'nota') setNotas(prev => [...prev, created]);
        else setObjeciones(prev => [...prev, created]);
      }
    } catch (e) {
      console.error(`Error adding ${annotationType}:`, e);
    }

    setShowAnnotationModal(false);
  };

  const handleDeleteNota = async (notaId: string) => {
    try {
      await fetch(`${API_URL}/api/llamadas/${activeCall.id}/notas/${notaId}`, { method: 'DELETE' });
      setNotas(prev => prev.filter(n => n.id !== notaId));
    } catch (e) {
      console.error('Error deleting nota:', e);
    }
  };

  const handleDeleteObjecion = async (objecionId: string) => {
    try {
      await fetch(`${API_URL}/api/llamadas/${activeCall.id}/objeciones/${objecionId}`, { method: 'DELETE' });
      setObjeciones(prev => prev.filter(o => o.id !== objecionId));
    } catch (e) {
      console.error('Error deleting objecion:', e);
    }
  };

  const openNotaModal = (start: number, end: number) => {
    setAnnotationType('nota');
    setAnnotationSegment({ start, end });
    setShowAnnotationModal(true);
  };

  const openObjecionModal = (start: number, end: number) => {
    setAnnotationType('objecion');
    setAnnotationSegment({ start, end });
    setShowAnnotationModal(true);
  };

  const handleSeekToSentence = (seconds: number) => {
    audioPlayerRef.current?.seekTo(seconds);
  };

  const [playbackTime, setPlaybackTime] = useState(0);

  const utelData = activeCall.analysis.utel;

  const getModelThemeClass = (type: string) => {
    switch (type) {
      case 'LÍNEA':
        return {
          badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          border: 'border-amber-500/20 bg-[#1e1710]/40',
          text: 'text-amber-400'
        };
      case 'EJECUTIVA':
        return {
          badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
          border: 'border-blue-500/20 bg-[#10171e]/40',
          text: 'text-blue-400'
        };
      case 'HÍBRIDA':
        return {
          badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          border: 'border-emerald-500/20 bg-[#101e14]/40',
          text: 'text-emerald-400'
        };
      default:
        return {
          badge: 'bg-zinc-800 text-gray-400 border-zinc-700',
          border: 'border-zinc-800 bg-[#121212]',
          text: 'text-zinc-400'
        };
    }
  };

  const modalidad = utelData?.modalidadDetectada || 'NO_DETECTADA';
  const theme = getModelThemeClass(modalidad);

  const getMoodBadge = (mood: string) => {
    switch (mood) {
      case 'interesado':
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-1 rounded-md font-medium">Interesado / Receptivo</span>;
      case 'receptivo':
        return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs px-2.5 py-1 rounded-md font-medium">Receptivo</span>;
      case 'molesto':
        return <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs px-2.5 py-1 rounded-md font-medium">Molesto / Altiva Tensión</span>;
      default:
        return <span className="bg-zinc-800 text-gray-300 border border-zinc-700 text-xs px-2.5 py-1 rounded-md font-medium">Neutral / Indiferente</span>;
    }
  };

  const getOutcomeBadge = (outcome: string) => {
    switch (outcome) {
      case 'venta_cerrada':
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-3 py-1 rounded-md font-semibold">Venta Cerrada 🎉</span>;
      case 'interesado_seguimiento':
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs px-3 py-1 rounded-md font-semibold">Seguimiento CRM 📅</span>;
      case 'agenda_demostracion':
        return <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs px-3 py-1 rounded-md font-semibold">Demo Agendada 🖥️</span>;
      default:
        return <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs px-3 py-1 rounded-md font-semibold">No Interesado ❌</span>;
    }
  };

  return (
    <div className="flex flex-col gap-8">

      {/* 1. SECCIÓN SUPERIOR: Reproductor de Audio (Izquierda), Rúbrica de Auditoría (Abajo del Reproductor) y Transcripción (Derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Columna Izquierda (5/12): Reproductor de Audio y la Rúbrica Rediseñada abajo */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <AudioPlayer
            ref={audioPlayerRef}
            audioUrl={audioUrl}
            fileName={activeCall.metadata.fileName}
            callId={activeCall.id}
            metadataDuration={activeCall.metadata.duration}
            onDownloadPDF={() => downloadPDFReport(activeCall)}
            onDownloadCSV={() => downloadCSVReport(activeCall)}
            onTimeUpdate={setPlaybackTime}
          />

          <PceChecklistCard
            utelData={utelData}
            globalScore={activeCall.score.global}
          />
        </div>

        {/* Columna Derecha (7/12): Transcripción de Audio */}
        <div className="lg:col-span-7">
          <TranscriptionViewer
            transcription={activeCall.transcription}
            notas={notas}
            objeciones={objeciones}
            playbackTime={playbackTime}
            onSeekTo={handleSeekToSentence}
            onNotaClick={openNotaModal}
            onObjecionClick={openObjecionModal}
            onDeleteNota={handleDeleteNota}
            onDeleteObjecion={handleDeleteObjecion}
            onDownloadTranscript={() => downloadTranscriptionPDF(activeCall)}
          />
        </div>

      </div>

      {/* Separador */}
      <div className="border-t border-[#222222] my-1" />

      {/* 2. SECCIÓN DE RESÚMENES, MODALIDAD Y PSICOLOGÍA */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">

        {/* Lado Izquierdo: Resumen Cognitivo y Modalidad Detectada */}
        <div className="flex flex-col gap-6">
          {/* Resumen Ejecutivo del Auditor */}
          <div className="bg-[#121212] rounded-2xl border border-[#222222] p-6 shadow-sm flex flex-col gap-4" id="cognitive-summary-card">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <h3 className="text-xs uppercase tracking-wider text-gray-400 font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Resumen de Auditoría
              </h3>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed italic flex-1">
              "{activeCall.analysis.summary}"
            </p>

            <div className="grid grid-cols-2 gap-3 mt-1.5 pt-3 border-t border-[#222222]">
              <div>
                <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Temple Cliente</span>
                {getMoodBadge(activeCall.analysis.customerMood)}
              </div>
              <div>
                <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Resultado Comercial</span>
                {getOutcomeBadge(activeCall.analysis.salesOutcome)}
              </div>
            </div>
          </div>

          {/* Modalidad Detectada y Evaluación Detallada */}
          <div className={`rounded-2xl border p-5 shadow-xs flex flex-col gap-3 transition-colors ${theme.border}`} id="modalidad-card">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold font-mono text-gray-400 uppercase tracking-widest flex items-center gap-1">
                <GraduationCap className="w-4 h-4 text-indigo-400 animate-pulse" />
                Análisis de Modalidad
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${theme.badge}`}>
                {modalidad}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <h4 className={`text-sm font-extrabold ${theme.text}`}>
                Justificación de Auditoría
              </h4>
              <div className="text-xs text-gray-300 flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                {utelData?.evaluacion_detallada && Object.entries(utelData.evaluacion_detallada).map(([cat, detail]) => (
                  <div key={cat} className="bg-[#1b1b1b] p-2 rounded-lg border border-[#262626]">
                    <span className="font-bold text-[10px] text-gray-400 block mb-0.5 uppercase">{cat}</span>
                    <span className="text-indigo-200">{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Lado Derecho: Percepción y Comportamiento del Cliente */}
        <EmotionalAnalysisCard
          emotional={activeCall.analysis.emotionalAnalysis}
          score={activeCall.score}
          customerMood={activeCall.analysis.customerMood}
        />

      </div>

      {/* 3. SECCIÓN DE RETROALIMENTACIÓN Y COACHING */}
      <div className="bg-[#121212] rounded-2xl border border-[#222222] p-6 shadow-sm flex flex-col gap-5 w-full" id="advisor-performance-card">
        <div className="border-b border-[#222222] pb-3">
          <h3 className="text-xs uppercase tracking-wider text-gray-400 font-bold flex items-center gap-1.5">
            <Award className="w-4 h-4 text-indigo-400" />
            Coaching de Desempeño Educativo y Áreas de Mejora del Asesor
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="flex flex-col gap-2.5 bg-[#121212]">
            <h4 className="text-xs font-bold text-emerald-450 text-[#00c8a5] flex items-center gap-1 tracking-wider uppercase pb-1 border-b border-emerald-500/10">
              <ThumbsUp className="w-3.5 h-3.5" />
              Fortalezas Auditadas
            </h4>
            <ul className="flex flex-col gap-2">
              {activeCall.analysis.strengths.map((str, i) => (
                <li key={i} className="text-xs text-gray-300 flex items-start gap-1.5">
                  <div className="w-1.5 h-1.5 bg-[#00c8a5] rounded-full mt-1.5 flex-shrink-0" />
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2.5 md:border-l md:border-t-0 border-[#222222] md:pl-6 pt-4 md:pt-0">
            <h4 className="text-xs font-bold text-rose-450 text-rose-400 flex items-center gap-1 tracking-wider uppercase pb-1 border-b border-rose-500/10">
              <ThumbsDown className="w-3.5 h-3.5" />
              Áreas de Oportunidad
            </h4>
            <ul className="flex flex-col gap-2">
              {activeCall.analysis.weaknesses.map((weak, i) => (
                <li key={i} className="text-xs text-gray-300 flex items-start gap-1.5">
                  <div className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1.5 flex-shrink-0" />
                  <span>{weak}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2.5 md:border-l md:border-t-0 border-[#222222] md:pl-6 pt-4 md:pt-0">
            <h4 className="text-xs font-bold text-indigo-400 flex items-center gap-1 tracking-wider uppercase pb-1 border-b border-indigo-500/10">
              <Calendar className="w-3.5 h-3.5" />
              Próximos Pasos Recomendados
            </h4>
            <ul className="flex flex-col gap-2">
              {activeCall.analysis.nextSteps.map((step, i) => (
                <li key={i} className="text-xs text-gray-300 flex items-start gap-1.5 bg-[#181818] p-2.5 rounded-lg border border-[#222222]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Annotation Modal */}
      <AnnotationModal
        isOpen={showAnnotationModal}
        type={annotationType}
        segmentStart={annotationSegment.start}
        segmentEnd={annotationSegment.end}
        onClose={() => setShowAnnotationModal(false)}
        onSave={handleSaveAnnotation}
      />

    </div>
  );
}
