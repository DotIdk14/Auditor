import React, { useState } from 'react';
import { Upload, FileAudio, Check, AlertCircle, Play, RefreshCw, Folder } from 'lucide-react';
import { SalesCall } from '../types';
import { saveAudioToDB } from '../utils/audioCache';
import { API_URL } from '../config';
import { generateDemoCall } from '../utils/demoData';
import FileDropzone from './FileDropzone';
import DriveExplorer from './DriveExplorer';

interface AudioUploadProps {
  onUploadSuccess: (newCall: SalesCall) => void;
}

export default function AudioUpload({ onUploadSuccess }: AudioUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  const [showDriveExplorer, setShowDriveExplorer] = useState(false);
  const [isDriveLoading, setIsDriveLoading] = useState(false);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const generateUniqueId = (fileName: string): string => {
    const timestamp = Date.now();
    const cleanName = fileName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 8);
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `call_${cleanName}_${timestamp}_${randomSuffix}`;
  };

  const handleLoadDemo = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoadingDemo(true);
    setUploadError(null);
    try {
      const response = await fetch(`${API_URL}/api/cargar-demo`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Servidor no disponible');
      const data = await response.json();
      onUploadSuccess(data);
    } catch {
      console.warn("Backend no disponible, usando demo local");
      const localDemo = generateDemoCall();
      onUploadSuccess(localDemo);
    } finally {
      setIsLoadingDemo(false);
    }
  };

  const handleFileSelection = (file: File) => {
    const isWav = file.name.endsWith('.wav');
    const isMpeg = file.name.endsWith('.mpeg') || file.name.endsWith('.mpg');
    const isMp3 = file.name.endsWith('.mp3') || file.type === 'audio/mpeg' || file.type === 'audio/mp3';

    if (!isMp3 && !isWav && !isMpeg) {
      setUploadError('Formato no soportado. Por favor, selecciona únicamente archivos de audio (.mp3, .mpeg o .wav)');
      return;
    }

    setUploadError(null);
    setSelectedFile(file);
    const uniqueId = generateUniqueId(file.name);
    setGeneratedId(uniqueId);
  };

  const startAnalysis = async () => {
    if (!selectedFile) return;

    setUploadError(null);
    setUploadProgress(15);

    try {
      const makeRequest = async (): Promise<{ callId: string }> => {
        try {
          const urlResp = await fetch(`${API_URL}/api/upload-url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: selectedFile.name }),
          });
          if (urlResp.ok) {
            const { presignedUrl } = await urlResp.json();
            const uploadResp = await fetch(presignedUrl, {
              method: 'PUT',
              body: selectedFile,
              headers: { 'Content-Type': selectedFile.type || 'audio/mpeg' },
            });
            const uploadResult = await uploadResp.json();
            const actualBlobUrl = uploadResult.url;
            const resp = await fetch(`${API_URL}/api/process-blob`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ blobUrl: actualBlobUrl, fileName: selectedFile.name }),
            });
            const data = await resp.json();
            if (!resp.ok) throw new Error(data.error || 'Error en process-blob');
            return { callId: data.callId };
          }
        } catch { /* fall through to fallback */ }
        const formData = new FormData();
        formData.append('audio', selectedFile);
        const resp = await fetch(`${API_URL}/api/upload`, {
          method: 'POST',
          body: formData,
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || 'Error en upload');
        return { callId: data.callId };
      };

      const { callId } = await makeRequest();
      setUploadProgress(40);

      let pollCount = 0;
      const maxPolls = 120;
      let completedCall: any = null;

      while (pollCount < maxPolls) {
        await new Promise(r => setTimeout(r, 5000));
        pollCount++;

        const statusResp = await fetch(`${API_URL}/api/transcript/${callId}`);
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

        setUploadProgress(Math.min(40 + Math.floor(pollCount * 0.5), 85));
      }

      if (!completedCall) {
        throw new Error('La transcripción está tomando más tiempo del esperado. Intenta de nuevo.');
      }

      try {
        await saveAudioToDB(completedCall.id, selectedFile);
      } catch (dbErr) {
        console.error("Error al persistir audio en IndexedDB local:", dbErr);
      }

      setUploadProgress(100);
      setTimeout(() => {
        onUploadSuccess(completedCall);
        setUploadProgress(null);
        setSelectedFile(null);
        setGeneratedId(null);
      }, 700);

    } catch (err: any) {
      console.error("Error cargando llamada:", err);
      setUploadError(err.message || 'Error de red o procesamiento fallido.');
      setUploadProgress(null);
    }
  };

  const cancelSelection = () => {
    setSelectedFile(null);
    setGeneratedId(null);
    setUploadError(null);
  };

  const handleDriveImport = async () => {
    let accessToken = localStorage.getItem('utel_google_drive_token');

    if (!accessToken) {
      setUploadError(null);
      setIsDriveLoading(true);
      try {
        const { googleSignIn } = await import('../lib/firebase');
        const res = await googleSignIn();
        if (res?.accessToken) {
          accessToken = res.accessToken;
        } else {
          setUploadError('No se pudo conectar con Google Drive. Intenta de nuevo.');
          setIsDriveLoading(false);
          return;
        }
      } catch {
        setUploadError('Error al iniciar sesión con Google para acceder a Drive.');
        setIsDriveLoading(false);
        return;
      }
      setIsDriveLoading(false);
    }

    setShowDriveExplorer(true);
  };

  const importFileFromDrive = async (fileId: string, fileName: string) => {
    let accessToken = localStorage.getItem('utel_google_drive_token');
    if (!accessToken) return;

    setShowDriveExplorer(false);
    setUploadProgress(10);

    try {
      const response = await fetch(`${API_URL}/api/drive-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId,
          fileName,
          accessToken,
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Error al importar de Drive.');
      }

      const completedCall = await response.json();
      onUploadSuccess(completedCall);
      setUploadProgress(null);
    } catch (err: any) {
      setUploadError(err.message);
      setUploadProgress(null);
    }
  };

  return (
    <div className="bg-[#121212] rounded-2xl border border-[#222222] p-6 shadow-sm">
      <h2 className="text-base font-semibold text-white tracking-tight mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5 text-indigo-400" />
        Auditoría de Llamada de Ventas
      </h2>

      {!selectedFile && (
        <div className="space-y-4">
          <FileDropzone onFileSelected={handleFileSelection} isLoading={false} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={handleDriveImport}
              disabled={isDriveLoading || isLoadingDemo}
              className="px-4 py-2.5 bg-[#121212] hover:bg-[#1a1a1a] text-gray-300 border border-zinc-800 hover:border-zinc-700 rounded-xl text-[11px] font-bold tracking-wide transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Folder className={`w-3.5 h-3.5 text-amber-500 ${isDriveLoading ? 'animate-pulse' : ''}`} />
              {isDriveLoading ? 'Conectando...' : 'Importar de Drive'}
            </button>
            <button
              type="button"
              onClick={handleLoadDemo}
              disabled={isLoadingDemo || isDriveLoading}
              className="px-4 py-2.5 bg-indigo-600/10 hover:bg-indigo-600/20 active:scale-[0.98] text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 hover:border-indigo-500/40 rounded-xl text-[11px] font-bold tracking-wide transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <FileAudio className={`w-3.5 h-3.5 ${isLoadingDemo ? 'animate-spin' : ''}`} />
              {isLoadingDemo ? 'Generando...' : 'Llamada de Prueba'}
            </button>
          </div>
        </div>
      )}

      {selectedFile && uploadProgress === null && (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-4 bg-[#181818] border border-zinc-800 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg flex-shrink-0">
                <FileAudio className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-gray-200 truncate pr-4">{selectedFile.name}</p>
                <p className="text-xs text-mono text-gray-500 mt-0.5">{formatBytes(selectedFile.size)}</p>
              </div>
            </div>
            <button
              onClick={cancelSelection}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium px-3 py-1.5 hover:bg-rose-950/20 rounded-lg transition-colors border border-transparent hover:border-rose-900/30"
            >
              Cambiar Archivo
            </button>
          </div>

          <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-xl flex items-center gap-3">
            <RefreshCw className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-indigo-300">Análisis por OpenRouter (IA Cloud)</p>
              <p className="text-[10px] text-indigo-400/70">AssemblyAI transcribe el audio + OpenRouter realiza la auditoría PCE</p>
            </div>
          </div>

          <button
            onClick={startAnalysis}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-[0.99] text-white py-3 px-4 rounded-xl text-xs font-bold tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            <Play className="w-4 h-4 fill-current" />
            Iniciar Transcripción y Auditoría
          </button>
        </div>
      )}

      {uploadProgress !== null && (
        <div className="p-8 border border-zinc-800 bg-[#161616] rounded-xl text-center space-y-4 animate-pulse">
          <div className="flex items-center justify-between mb-1 max-w-md mx-auto">
            <span className="text-[10px] uppercase font-mono tracking-wider text-gray-500">PROCE_LLAMADA_STAGED</span>
            <span className="text-xs font-bold text-indigo-400">{uploadProgress}%</span>
          </div>
          <div className="w-full max-w-md mx-auto bg-[#1e1e1e] rounded-full h-2 overflow-hidden border border-zinc-800">
            <div
              className="bg-indigo-550 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          {generatedId && (
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-500 font-mono">
              <Check className="w-3 h-3 text-emerald-400" />
              ID: <span className="font-bold text-gray-400">{generatedId}</span>
            </div>
          )}
          <div className="space-y-1">
            <p className="text-xs text-gray-300 font-medium flex items-center justify-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              {uploadProgress < 40
                ? 'Subiendo archivo y enviando a transcripción...'
                : uploadProgress < 80
                ? 'Procesando audio en AssemblyAI (STT)...'
                : 'Ejecutando auditoría y análisis emocional...'}
            </p>
            <p className="text-[11px] text-gray-500">
              Esta operación puede tomar de 30 a 60 segundos dependiendo de la duración del audio.
            </p>
          </div>
        </div>
      )}

      {showDriveExplorer && (
        <DriveExplorer
          onImportFromDrive={importFileFromDrive}
          isImporting={null}
          onClose={() => setShowDriveExplorer(false)}
        />
      )}

      {uploadError && (
        <div id="upload-error-box" className="mt-4 p-3 bg-rose-950/20 text-rose-400 border border-rose-900/30 text-xs rounded-lg flex items-start gap-2 max-w-full overflow-hidden break-words leading-relaxed">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span className="flex-1">{uploadError}</span>
        </div>
      )}
    </div>
  );
}
