import { useState, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { useAuthStore } from '../../auth/authStore';
import { useAssignContact } from '../../hooks/useCalls';
import AddCallModal from '../calls/AddCallModal';
import { motion, AnimatePresence } from 'motion/react';
import {
  Headphones, Upload, Plus, Star, Clock,
  FileAudio, Sparkles, ArrowRight, CheckCircle2,
  AlertCircle, BarChart, Loader2, X, Music, UserPlus
} from 'lucide-react';
import type { CallItem } from '@auditor/shared-types';

export default function AuditorDashboardPage() {
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const qc = useQueryClient();

  // ── Cargar llamadas (todas, incluídas las completadas) ──
  const { data: calls = [], isLoading, error } = useQuery({
    queryKey: ['calls', 'all'],
    queryFn: () => apiClient.get<CallItem[]>('/visor/calls'),
    enabled: !!user,
  });

  // ── Cargar demo ──
  const loadDemo = useMutation({
    mutationFn: () => apiClient.post('/cargar-demo'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calls'] });
    },
  });

  // ── Estado para asignar contacto después de subir ──
  const [pendingCallId, setPendingCallId] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const assignContact = useAssignContact();
  const [assigningContact, setAssigningContact] = useState(false);

  // ── Estado para carga de archivos ──
  const [showUploader, setShowUploader] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isWav = file.name.endsWith('.wav');
    const isMpeg = file.name.endsWith('.mpeg') || file.name.endsWith('.mpg');
    const isMp3 = file.name.endsWith('.mp3') || file.type === 'audio/mpeg';

    if (!isMp3 && !isWav && !isMpeg) {
      setUploadError('Formato no soportado. Usa .mp3, .wav o .mpeg');
      return;
    }

    setUploadError(null);
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploadError(null);
    setUploadProgress(10);
    setUploadStatus('Subiendo archivo al servidor...');

    try {
      // Subir el archivo al servidor
      const formData = new FormData();
      formData.append('audio', selectedFile);
      const resp = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await resp.json();

      // Si el servidor no tiene API keys configuradas, fallback a demo
      if (!resp.ok && (
        data?.error?.includes('ASSEMBLYAI_API_KEY') ||
        data?.error?.includes('OPENROUTER_API_KEY') ||
        data?.error?.includes('not configured')
      )) {
        setUploadStatus('API de transcripción no disponible — usando modo demostración...');
        await new Promise(r => setTimeout(r, 1000));
        setUploadProgress(50);
        await new Promise(r => setTimeout(r, 800));

        // Llamar a cargar-demo como fallback
        const demoResp = await fetch('/api/cargar-demo', {
          method: 'POST',
        });
        if (!demoResp.ok) throw new Error('No se pudo generar una llamada de demostración');
        const demoCall = await demoResp.json();

        setUploadProgress(100);
        setUploadStatus('¡Llamada de demostración generada!');

        setTimeout(() => {
          qc.invalidateQueries({ queryKey: ['calls'] });
          setSelectedFile(null);
          setUploadProgress(null);
          setUploadStatus('');
          setShowUploader(false);
          navigate(`/auditor/${demoCall.id}`);
        }, 800);
        return;
      }

      if (!resp.ok) throw new Error(data.error || 'Error al subir archivo');

      const callId: string = data.callId;
      if (!callId) throw new Error('No se pudo obtener un ID de llamada');

      setUploadProgress(50);
      setUploadStatus('Procesando audio en AssemblyAI (STT)...');

      // Polling para transcripción
      let pollCount = 0;
      const maxPolls = 120;
      let completedCall: any = null;

      while (pollCount < maxPolls) {
        await new Promise(r => setTimeout(r, 5000));
        pollCount++;

        const statusResp = await fetch(`/api/transcript/${callId}`);
        if (!statusResp.ok) {
          if (pollCount > 5) throw new Error('Error al consultar estado de transcripción');
          continue;
        }

        const statusData = await statusResp.json();
        if (statusData.status === 'completed') {
          completedCall = statusData.call;
          break;
        } else if (statusData.status === 'error') {
          throw new Error(statusData.error || 'Error en transcripción');
        }

        setUploadProgress(Math.min(50 + Math.floor(pollCount * 0.4), 90));
      }

      if (!completedCall) {
        throw new Error('La transcripción está tomando más tiempo del esperado.');
      }

      setUploadProgress(100);
      setUploadStatus('¡Llamada procesada exitosamente!');

      // No navegamos aún — primero pedimos al usuario que asigne un contacto
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ['calls'] });
        setSelectedFile(null);
        setUploadProgress(null);
        setUploadStatus('');
        setShowUploader(false);
        // Mostrar modal para seleccionar o crear contacto
        setPendingCallId(completedCall.id || callId);
        setShowContactModal(true);
      }, 500);

    } catch (err: any) {
      console.error('Error cargando llamada:', err);
      // Último recurso: si todo falla, intentar demo
      if (!err.message?.includes('ASSEMBLYAI') && !err.message?.includes('OPENROUTER')) {
        setUploadError(err.message || 'Error al procesar la llamada');
        setUploadProgress(null);
        setUploadStatus('');
      } else {
        // Fallback a demo también para otros errores de configuración
        setUploadProgress(60);
        setUploadStatus('Usando modo demostración...');
        try {
          const demoResp = await fetch('/api/cargar-demo', { method: 'POST' });
          if (demoResp.ok) {
            const demoCall = await demoResp.json();
            setUploadProgress(100);
            setTimeout(() => {
              qc.invalidateQueries({ queryKey: ['calls'] });
              setSelectedFile(null);
              setUploadProgress(null);
              setUploadStatus('');
              setShowUploader(false);
              navigate(`/auditor/${demoCall.id}`);
            }, 800);
            return;
          }
        } catch {}
        setUploadError('No hay API de transcripción configurada. Usa "Cargar Demo" para probar.');
        setUploadProgress(null);
        setUploadStatus('');
      }
    }
  };

  const cancelUpload = () => {
    setSelectedFile(null);
    setUploadProgress(null);
    setUploadStatus('');
    setUploadError(null);
    setShowUploader(false);
  };

  // ── Manejar selección de contacto después del upload ──
  const handleContactSelected = async (contactId: string) => {
    if (!pendingCallId || assigningContact) return;
    setAssigningContact(true);
    try {
      await assignContact.mutateAsync({ callId: pendingCallId, contactId });
      // Ahora que el contacto está asignado y guardado en DB, navegar
      navigate(`/auditor/${pendingCallId}`);
    } catch (err: any) {
      console.error('Error al asignar contacto:', err);
      setUploadError('Error al asignar contacto: ' + (err.message || 'Error desconocido'));
      setShowContactModal(false);
    } finally {
      setAssigningContact(false);
      setPendingCallId(null);
    }
  };

  const handleCancelAssign = () => {
    setShowContactModal(false);
    setPendingCallId(null);
  };

  // Filtrar solo auditorías completadas para el historial
  const completedAudits = calls.filter((c: CallItem) => c.status === 'completada');
  const pendingAudits = calls.filter((c: CallItem) => c.status !== 'completada');

  // ── Color de score ──
  const scoreColor = (score?: number | null) => {
    if (!score) return 'text-stone-400';
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-rose-400';
  };

  const scoreBg = (score?: number | null) => {
    if (!score) return 'bg-stone-800/50';
    if (score >= 80) return 'bg-emerald-900/30 border-emerald-700/40';
    if (score >= 60) return 'bg-amber-900/30 border-amber-700/40';
    return 'bg-rose-900/30 border-rose-700/40';
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl font-bold font-display ${darkMode ? 'text-stone-100' : 'text-stone-800'}`}>
            Panel de Auditoría
          </h1>
          <p className={`text-xs mt-0.5 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
            Revisa y gestiona las auditorías de calidad
          </p>
        </div>

        {/* Acciones rápidas */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowUploader(!showUploader); setSelectedFile(null); setUploadError(null); }}
            disabled={!!uploadProgress}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              showUploader
                ? darkMode
                  ? 'bg-indigo-900/30 border border-indigo-600/40 text-indigo-400'
                  : 'bg-indigo-100 border border-indigo-300 text-indigo-700'
                : darkMode
                  ? 'bg-[#2a2520] border border-[#3e382f] text-stone-200 hover:bg-[#353028]'
                  : 'bg-white border border-[#dfd9cc] text-stone-700 hover:bg-[#FAF6F0]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            {showUploader ? 'Cerrar Cargador' : 'Cargar Llamada'}
          </button>
          <button
            onClick={() => loadDemo.mutate()}
            disabled={loadDemo.isPending}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              darkMode
                ? 'bg-[#2a2520] border border-[#3e382f] text-stone-200 hover:bg-[#353028]'
                : 'bg-white border border-[#dfd9cc] text-stone-700 hover:bg-[#FAF6F0]'
            }`}
          >
            {loadDemo.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-[#d4a373]" />
            )}
            {loadDemo.isPending ? 'Cargando...' : 'Cargar Demo'}
          </button>
        </div>
      </div>

      {/* ── Cargador de archivos inline ── */}
      <AnimatePresence>
        {showUploader && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className={`overflow-hidden rounded-2xl border ${
              darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'
            }`}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Music className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                  <h3 className={`text-sm font-bold font-display ${darkMode ? 'text-stone-100' : 'text-stone-800'}`}>
                    Cargar llamada para auditar
                  </h3>
                </div>
                <button
                  onClick={cancelUpload}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    darkMode ? 'hover:bg-[#2e2a24] text-stone-400' : 'hover:bg-stone-100 text-stone-500'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!selectedFile && uploadProgress === null && (
                <div className="space-y-4">
                  {/* Drop zone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                      darkMode
                        ? 'border-[#3e382f] hover:border-indigo-500/50 hover:bg-[#24211e]'
                        : 'border-[#dfd9cc] hover:border-indigo-400/50 hover:bg-stone-50'
                    }`}
                  >
                    <Upload className={`w-8 h-8 mx-auto mb-3 ${darkMode ? 'text-stone-600' : 'text-stone-400'}`} />
                    <p className={`text-xs font-bold mb-1 ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                      Selecciona un archivo de audio
                    </p>
                    <p className={`text-[10px] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                      MP3, WAV o MPEG · Arrastra o haz clic para elegir
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".mp3,.wav,.mpeg,.mpg,audio/mpeg,audio/wav"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              )}

              {/* Archivo seleccionado - confirmar subida */}
              {selectedFile && uploadProgress === null && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border ${
                    darkMode ? 'bg-[#24211e] border-[#3e382f]' : 'bg-stone-50 border-[#dfd9cc]'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileAudio className={`w-8 h-8 shrink-0 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                        <div className="overflow-hidden">
                          <p className={`text-sm font-bold truncate ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                            {selectedFile.name}
                          </p>
                          <p className={`text-[10px] font-mono mt-0.5 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                            {formatBytes(selectedFile.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedFile(null)}
                        className={`text-[10px] px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          darkMode
                            ? 'text-rose-400 hover:bg-rose-900/20'
                            : 'text-rose-600 hover:bg-rose-50'
                        }`}
                      >
                        Cambiar
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleUpload}
                    className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Iniciar Transcripción y Auditoría
                  </button>
                </div>
              )}

              {/* Progreso de subida */}
              {uploadProgress !== null && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono tracking-wider ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                      {uploadStatus}
                    </span>
                    <span className="text-xs font-bold text-indigo-500">{uploadProgress}%</span>
                  </div>
                  <div className={`w-full rounded-full h-2 overflow-hidden ${
                    darkMode ? 'bg-[#2e2a24]' : 'bg-stone-200'
                  }`}>
                    <div
                      className="bg-gradient-to-r from-indigo-600 to-indigo-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className={`text-[10px] text-center ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                    {uploadProgress < 40
                      ? 'Subiendo archivo al servidor...'
                      : uploadProgress < 80
                      ? 'Procesando audio en la nube...'
                      : 'Finalizando auditoría...'}
                  </p>
                </div>
              )}

              {/* Error */}
              {uploadError && (
                <div className={`mt-4 p-3 rounded-xl border text-xs flex items-start gap-2 ${
                  darkMode ? 'bg-rose-900/20 border-rose-800/40 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-600'
                }`}>
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal de selección de contacto después del upload ── */}
      {showContactModal && pendingCallId && (
        <>
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay semi-transparente con loader si está asignando */}
            {assigningContact && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]">
                <div className="bg-white dark:bg-[#1c1a18] rounded-2xl p-8 text-center space-y-3 shadow-2xl border dark:border-[#3e382f]">
                  <Loader2 className="w-8 h-8 animate-spin text-[#d4a373] mx-auto" />
                  <p className="text-sm font-bold text-stone-700 dark:text-stone-300">
                    Asignando contacto y guardando auditoría...
                  </p>
                  <p className="text-xs text-stone-500">La llamada se asociará al contacto seleccionado</p>
                </div>
              </div>
            )}
            <AddCallModal
              darkMode={darkMode}
              onClose={handleCancelAssign}
              onSelect={handleContactSelected}
            />
          </div>
        </>
      )}

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: llamadas pendientes */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
            darkMode ? 'text-stone-400' : 'text-stone-500'
          }`}>
            <Clock className="w-3.5 h-3.5" />
            Pendientes ({pendingAudits.length})
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className={`w-6 h-6 animate-spin ${darkMode ? 'text-stone-400' : 'text-stone-500'}`} />
            </div>
          ) : pendingAudits.length === 0 ? (
            <div className={`rounded-xl border p-6 text-center ${
              darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'
            }`}>
              <Headphones className={`w-8 h-8 mx-auto mb-2 ${darkMode ? 'text-stone-600' : 'text-stone-400'}`} />
              <p className={`text-xs font-medium ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                No hay llamadas pendientes
              </p>
              <p className={`text-[10px] mt-1 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                Carga una llamada de demo para empezar
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingAudits.slice(0, 10).map((call: CallItem) => (
                <motion.button
                  key={call.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => navigate(`/auditor/${call.id}`)}
                  className={`w-full text-left rounded-xl border p-3 transition-all cursor-pointer ${
                    darkMode
                      ? 'bg-[#1c1a18] border-[#3e382f] hover:border-[#d4a373]/50 hover:bg-[#24211e]'
                      : 'bg-white border-[#dfd9cc] hover:border-[#d4a373]/50 hover:bg-[#fcfbf9]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold truncate ${darkMode ? 'text-stone-200' : 'text-stone-700'}`}>
                      {call.shortName || call.title}
                    </span>
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                      call.status === 'por_auditar'
                        ? 'bg-amber-900/30 text-amber-400'
                        : 'bg-blue-900/30 text-blue-400'
                    }`}>
                      {call.status === 'por_auditar' ? 'Por auditar' : 'En revisión'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-stone-500">
                    <span>{call.agent}</span>
                    <span>•</span>
                    <span>{call.category}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Columna derecha: historial de auditorías */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
            darkMode ? 'text-stone-400' : 'text-stone-500'
          }`}>
            <BarChart className="w-3.5 h-3.5" />
            Historial de Auditorías ({completedAudits.length})
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className={`w-6 h-6 animate-spin ${darkMode ? 'text-stone-400' : 'text-stone-500'}`} />
            </div>
          ) : completedAudits.length === 0 ? (
            <div className={`rounded-xl border p-8 text-center ${
              darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'
            }`}>
              <FileAudio className={`w-10 h-10 mx-auto mb-3 ${darkMode ? 'text-stone-600' : 'text-stone-400'}`} />
              <p className={`text-sm font-bold ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                Aún no hay auditorías completadas
              </p>
              <p className={`text-xs mt-1 max-w-sm mx-auto ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                Las llamadas auditadas aparecerán aquí con su puntuación y detalles. 
                Usa el botón "Cargar Demo" para probar con datos de ejemplo.
              </p>
              <button
                onClick={() => loadDemo.mutate()}
                disabled={loadDemo.isPending}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#faedcd] border border-[#d4a373] text-[#b57b54] hover:bg-[#ffeec2] font-bold rounded-xl transition-all text-xs cursor-pointer disabled:opacity-50"
              >
                {loadDemo.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                Cargar llamada de demostración
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {completedAudits.map((call: CallItem, idx: number) => (
                <motion.button
                  key={call.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => navigate(`/auditor/${call.id}`)}
                  className={`text-left rounded-xl border p-4 transition-all cursor-pointer group ${
                    darkMode
                      ? 'bg-[#1c1a18] border-[#3e382f] hover:border-[#d4a373]/50 hover:bg-[#24211e]'
                      : 'bg-white border-[#dfd9cc] hover:border-[#d4a373]/50 hover:bg-[#fcfbf9]'
                  }`}
                >
                  {/* Score badge */}
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${scoreBg(call.score)}`}>
                      <span className={`text-lg font-black ${scoreColor(call.score)}`}>
                        {call.score ?? '—'}
                      </span>
                    </div>
                    <CheckCircle2 className={`w-4 h-4 ${darkMode ? 'text-stone-600' : 'text-stone-400'}`} />
                  </div>

                  {/* Info */}
                  <h3 className={`text-sm font-bold truncate ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                    {call.shortName || call.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-stone-500">
                    <span>{call.agent}</span>
                    <span>•</span>
                    <span className={`px-1.5 py-0.5 rounded font-bold ${
                      call.category === 'CALIDAD' ? 'bg-emerald-900/30 text-emerald-400' :
                      call.category === 'EXPERIENCIA' ? 'bg-blue-900/30 text-blue-400' :
                      'bg-purple-900/30 text-purple-400'
                    }`}>
                      {call.category}
                    </span>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#3e382f]/30">
                    <span className={`text-[10px] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                      {call.date ? new Date(call.date).toLocaleDateString('es-ES') : '—'}
                    </span>
                    <span className={`text-[10px] font-bold flex items-center gap-0.5 transition-colors ${
                      darkMode ? 'text-stone-500 group-hover:text-[#d4a373]' : 'text-stone-400 group-hover:text-[#b57b54]'
                    }`}>
                      Ver detalles
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          )}

          {/* Feedback de error */}
          {error && (
            <div className={`p-4 rounded-xl border ${
              darkMode ? 'bg-rose-900/20 border-rose-800/40 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-600'
            }`}>
              <p className="text-xs font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                Error al cargar auditorías
              </p>
              <p className="text-[10px] mt-1 opacity-80">{(error as any)?.message || 'Intenta de nuevo más tarde'}</p>
            </div>
          )}

          {/* Demo feedback */}
          {loadDemo.isSuccess && (
            <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              darkMode ? 'bg-emerald-900/20 border-emerald-800/40 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
            }`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Llamada de demostración cargada exitosamente
            </div>
          )}

          {loadDemo.isError && (
            <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              darkMode ? 'bg-rose-900/20 border-rose-800/40 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-600'
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              Error al cargar demo: {(loadDemo.error as any)?.message || 'Intenta de nuevo'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
