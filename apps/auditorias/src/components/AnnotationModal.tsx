import React, { useState } from 'react';
import { X, MessageSquare, Flag } from 'lucide-react';
import { TipoObjecion, Severidad } from '../types';

interface AnnotationModalProps {
  isOpen: boolean;
  type: 'nota' | 'objecion';
  segmentStart: number;
  segmentEnd: number;
  onClose: () => void;
  onSave: (data: { text: string; tipoObjecion?: TipoObjecion; severidad?: Severidad }) => void;
}

export default function AnnotationModal({
  isOpen, type, segmentStart, segmentEnd, onClose, onSave
}: AnnotationModalProps) {
  const [notaText, setNotaText] = useState('');
  const [objecionText, setObjecionText] = useState('');
  const [objecionTipo, setObjecionTipo] = useState<TipoObjecion>('otro');
  const [objecionSeveridad, setObjecionSeveridad] = useState<Severidad>('media');

  if (!isOpen) return null;

  const formatTime = (timeInSeconds: number) => {
    if (timeInSeconds === undefined || timeInSeconds === null || isNaN(timeInSeconds)) return "0:00";
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSave = () => {
    onSave({
      text: type === 'nota' ? notaText : objecionText,
      ...(type === 'objecion' ? { tipoObjecion: objecionTipo, severidad: objecionSeveridad } : {})
    });
    setNotaText('');
    setObjecionText('');
    setObjecionTipo('otro');
    setObjecionSeveridad('media');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#181818] border border-[#333333] rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            {type === 'nota' ? (
              <><MessageSquare className="w-4 h-4 text-blue-400" /> Agregar Nota</>
            ) : (
              <><Flag className="w-4 h-4 text-rose-400" /> Marcar Objeción</>
            )}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-[10px] text-gray-500 font-mono mb-4">
          Segmento: {formatTime(segmentStart)} – {formatTime(segmentEnd)}
        </div>

        {type === 'objecion' && (
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Tipo</label>
              <select
                value={objecionTipo}
                onChange={e => setObjecionTipo(e.target.value as TipoObjecion)}
                className="w-full bg-[#111] border border-zinc-700 rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-rose-500"
              >
                <option value="tono_inadecuado">Tono Inadecuado</option>
                <option value="info_erronea">Info Errénea</option>
                <option value="proceso_omitido">Proceso Omitido</option>
                <option value="oportunidad_perdida">Oportunidad Perdida</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Severidad</label>
              <select
                value={objecionSeveridad}
                onChange={e => setObjecionSeveridad(e.target.value as Severidad)}
                className="w-full bg-[#111] border border-zinc-700 rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-rose-500"
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
            </div>
          </div>
        )}

        <textarea
          value={type === 'nota' ? notaText : objecionText}
          onChange={e => type === 'nota' ? setNotaText(e.target.value) : setObjecionText(e.target.value)}
          placeholder={type === 'nota' ? 'Escribe tu nota sobre este segmento...' : 'Describe la objeción detectada...'}
          className="w-full bg-[#111] border border-zinc-700 rounded-lg px-3 py-2.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500 resize-none h-24"
        />

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white border border-zinc-700 rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={type === 'nota' ? !notaText.trim() : !objecionText.trim()}
            className={`px-4 py-2 text-xs font-bold rounded-lg disabled:opacity-40 ${
              type === 'nota'
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-rose-600 hover:bg-rose-500 text-white'
            }`}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
