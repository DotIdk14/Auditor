import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import type { DegreeProgram, DegreeResource, DegreeProgramModality } from '../../types';

interface Props {
  darkMode: boolean;
  program: DegreeProgram | null;
  onSave: (program: DegreeProgram) => void;
  onClose: () => void;
}

const LEVELS: { value: DegreeProgram['level']; label: string }[] = [
  { value: 'licenciatura', label: 'Licenciatura' },
  { value: 'maestria', label: 'Maestría' },
  { value: 'doctorado', label: 'Doctorado' },
];

export default function ProgramForm({ darkMode, program, onSave, onClose }: Props) {
  const [name, setName] = useState('');
  const [level, setLevel] = useState<DegreeProgram['level']>('licenciatura');
  const [description, setDescription] = useState('');
  const [modalities, setModalities] = useState<DegreeProgramModality[]>([
    { label: 'Completa', duration: '3 años 8 meses' },
    { label: 'Intensiva', duration: '2 años 10 meses' },
    { label: 'Superintensiva', duration: '2 años 2 meses' },
  ]);
  const [imageUrl, setImageUrl] = useState('');
  const [studyPlan, setStudyPlan] = useState('');
  const [costs, setCosts] = useState('');
  const [requirements, setRequirements] = useState('');
  const [benefits, setBenefits] = useState('');
  const [resources, setResources] = useState<DegreeResource[]>([]);
  const [newResLabel, setNewResLabel] = useState('');
  const [newResUrl, setNewResUrl] = useState('');
  const [newResType, setNewResType] = useState<DegreeResource['type']>('link');

  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (program) {
      setName(program.name);
      setLevel(program.level);
      setDescription(program.description);
      setModalities(program.modalities && program.modalities.length > 0 ? program.modalities : [
        { label: 'Completa', duration: '3 años 8 meses' },
        { label: 'Intensiva', duration: '2 años 10 meses' },
        { label: 'Superintensiva', duration: '2 años 2 meses' },
      ]);
      setImageUrl(program.imageUrl);
      setStudyPlan(program.studyPlan);
      setCosts(program.costs);
      setRequirements(program.requirements);
      setBenefits(program.benefits);
      setResources(program.resources);
    }
  }, [program]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      id: program?.id || `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim(),
      level,
      description: description.trim(),
      duration: modalities[0]?.duration || '',
      modalities: modalities.filter(m => m.duration.trim()),
      imageUrl: imageUrl.trim(),
      studyPlan: studyPlan.trim(),
      costs: costs.trim(),
      requirements: requirements.trim(),
      benefits: benefits.trim(),
      resources,
    });
  };

  const addResource = () => {
    if (!newResLabel.trim() || !newResUrl.trim()) return;
    setResources(prev => [...prev, {
      id: `res_${Date.now()}`,
      type: newResType,
      label: newResLabel.trim(),
      url: newResUrl.trim(),
    }]);
    setNewResLabel('');
    setNewResUrl('');
  };

  const removeResource = (id: string) => {
    setResources(prev => prev.filter(r => r.id !== id));
  };

  const inputClass = (darkMode: boolean) => `w-full border rounded-xl py-2 px-3 text-xs focus:outline-none transition-all ${
    darkMode
      ? 'bg-[#24211e] border-[#3e382f] text-stone-200 placeholder-stone-600 focus:border-[#d4a373]'
      : 'bg-[#fcfbf9] border-[#dfd9cc] text-stone-800 placeholder-stone-400 focus:border-[#d4a373]'
  }`;

  const bg = darkMode ? 'bg-[#1c1a18]' : 'bg-white';
  const border = darkMode ? 'border-[#3e382f]' : 'border-[#dfd9cc]';

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      >
        <div className={`absolute inset-0 ${darkMode ? 'bg-black/60' : 'bg-black/30'}`} />

        <motion.form
          onSubmit={handleSubmit}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={`relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border ${border} ${bg} shadow-2xl p-5 space-y-4`}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className={`text-sm font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
              {program ? 'Editar Carrera' : 'Nueva Carrera'}
            </h2>
            <button type="button" onClick={onClose}
              className={`p-2 rounded-xl transition-all hover:scale-110 ${
                darkMode ? 'text-stone-400 hover:text-stone-200' : 'text-stone-500 hover:text-stone-800'
              }`}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Name */}
          <div>
            <label className={`text-[10px] font-bold block mb-1 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
              Nombre de la carrera *
            </label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Ej. Administración de Empresas" required className={inputClass(darkMode)} />
          </div>

          {/* Level */}
          <div>
            <label className={`text-[10px] font-bold block mb-1 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>Nivel</label>
            <select value={level} onChange={e => setLevel(e.target.value as DegreeProgram['level'])} className={inputClass(darkMode)}>
              {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>

          {/* Modalities & Durations */}
          <div>
            <label className={`text-[10px] font-bold block mb-1 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>Duración por Modalidad</label>
            <div className="space-y-1.5">
              {modalities.map((m, i) => (
                <div key={m.label} className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold w-28 shrink-0 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>{m.label}</span>
                  <input type="text" value={m.duration}
                    onChange={e => {
                      const next = [...modalities];
                      next[i] = { ...next[i], duration: e.target.value };
                      setModalities(next);
                    }}
                    placeholder="Ej. 3 años 8 meses" className={inputClass(darkMode)} />
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={`text-[10px] font-bold block mb-1 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>Descripción</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={3} className={`${inputClass(darkMode)} resize-none`} />
          </div>

          {/* Image URL */}
          <div>
            <label className={`text-[10px] font-bold block mb-1 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>URL de imagen</label>
            <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)}
              placeholder="https://..." className={inputClass(darkMode)} />
          </div>

          {/* Study Plan (PDF URL) */}
          <div>
            <label className={`text-[10px] font-bold block mb-1 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>Plan de Estudios (URL del PDF)</label>
            <input type="url" value={studyPlan} onChange={e => setStudyPlan(e.target.value)}
              placeholder="https://..." className={inputClass(darkMode)} />
          </div>

          {/* Costs */}
          <div>
            <label className={`text-[10px] font-bold block mb-1 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>Costos</label>
            <textarea value={costs} onChange={e => setCosts(e.target.value)}
              rows={3} className={`${inputClass(darkMode)} resize-none`} />
          </div>

          {/* Requirements */}
          <div>
            <label className={`text-[10px] font-bold block mb-1 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>Requisitos</label>
            <textarea value={requirements} onChange={e => setRequirements(e.target.value)}
              rows={3} className={`${inputClass(darkMode)} resize-none`} />
          </div>

          {/* Benefits */}
          <div>
            <label className={`text-[10px] font-bold block mb-1 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>Beneficios</label>
            <textarea value={benefits} onChange={e => setBenefits(e.target.value)}
              rows={3} className={`${inputClass(darkMode)} resize-none`} />
          </div>

          {/* Resources */}
          <div className={`p-3 rounded-xl border ${border}`}>
            <label className={`text-[10px] font-bold block mb-2 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
              Materiales (PDFs, imágenes, enlaces)
            </label>
            {resources.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {resources.map(r => (
                  <div key={r.id} className={`flex items-center gap-2 p-2 rounded-lg border text-[9px] ${
                    darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-stone-200'
                  }`}>
                    <span className="font-bold truncate flex-1">{r.label}</span>
                    <span className={`px-1.5 py-0.5 rounded-full ${
                      darkMode ? 'bg-[#24211e] text-stone-500' : 'bg-stone-100 text-stone-500'
                    }`}>{r.type}</span>
                    <button type="button" onClick={() => removeResource(r.id)}
                      className="text-red-400 hover:text-red-500 p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-1.5">
              <select value={newResType} onChange={e => setNewResType(e.target.value as DegreeResource['type'])}
                className={`text-[9px] px-2 py-1.5 rounded-lg border ${inputClass(darkMode)} w-16`}>
                <option value="link">URL</option>
                <option value="pdf">PDF</option>
                <option value="image">IMG</option>
              </select>
              <input type="text" value={newResLabel} onChange={e => setNewResLabel(e.target.value)}
                placeholder="Nombre" className={`${inputClass(darkMode)} text-[9px] flex-1 min-w-0`} />
              <input type="url" value={newResUrl} onChange={e => setNewResUrl(e.target.value)}
                placeholder="URL" className={`${inputClass(darkMode)} text-[9px] flex-1 min-w-0`} />
              <button type="button" onClick={addResource}
                className={`px-2 py-1.5 rounded-lg text-[9px] font-bold transition-all ${
                  darkMode ? 'bg-[#d4a373] text-[#1c1a18] hover:bg-[#e8bc94]' : 'bg-[#b57b54] text-white hover:bg-[#d4a373]'
                }`}>+</button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all ${
                darkMode ? 'text-stone-400 hover:bg-[#24211e]' : 'text-stone-500 hover:bg-stone-100'
              }`}>Cancelar</button>
            <button type="submit"
              className="px-5 py-2 bg-[#faedcd] border border-[#d4a373] text-[#b57b54] hover:bg-[#ffeec2] font-bold rounded-xl transition-all text-[10px] cursor-pointer">
              {program ? 'Guardar Cambios' : 'Agregar Carrera'}
            </button>
          </div>
        </motion.form>
      </motion.div>
    </AnimatePresence>
  );
}
