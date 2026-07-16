import React, { useState } from 'react';
import { MessageSquare, Flag } from 'lucide-react';
import { TipoObjecion, Severidad } from '../types';
import FloatingWindow from './FloatingWindow';

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

  const formatTime = (t: number) => {
    if (t === undefined || t === null || isNaN(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return m + ":" + s.toString().padStart(2, '0');
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
    <FloatingWindow
      isOpen={isOpen}
      onClose={onClose}
      title={type === 'nota' ? 'Agregar Nota' : 'Marcar Objeción'}
      icon={type === 'nota'
        ? <MessageSquare className="w-4 h-4 text-blue-400" />
        : <Flag className="w-4 h-4 text-rose-400" />
      }
      defaultWidth={400}
    >
      <div className="p-5">
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
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white border border-zinc-700 rounded-lg">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={type === 'nota' ? !notaText.trim() : !objecionText.trim()}
            className={'px-4 py-2 text-xs font-bold rounded-lg disabled:opacity-40 ' + (type === 'nota' ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-rose-600 hover:bg-rose-500 text-white')}
          >
            Guardar
          </button>
        </div>
      </div>
    </FloatingWindow>
  );
}
