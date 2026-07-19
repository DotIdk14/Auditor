import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, GraduationCap, BookOpen, DollarSign, CheckCircle2, Star,
  FileText, Image as ImageIcon, ExternalLink, Pencil, Trash2,
} from 'lucide-react';
import type { DegreeProgram } from '../../types';

interface Props {
  program: DegreeProgram | null;
  darkMode: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onEdit: (program: DegreeProgram) => void;
  onDelete: (id: string) => void;
}

export default function ProgramDetail({ program, darkMode, isAdmin, onClose, onEdit, onDelete }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!program) return null;

  const bg = darkMode ? 'bg-[#1c1a18]' : 'bg-white';
  const border = darkMode ? 'border-[#3e382f]' : 'border-[#dfd9cc]';
  const textMain = darkMode ? 'text-stone-200' : 'text-stone-800';
  const textSub = darkMode ? 'text-stone-500' : 'text-stone-400';

  const sectionBox = `rounded-xl border ${border} ${darkMode ? 'bg-[#24211e]' : 'bg-stone-50'}`;

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
        {/* Backdrop */}
        <div className={`absolute inset-0 ${darkMode ? 'bg-black/60' : 'bg-black/30'}`} />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={`relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border ${border} ${bg} shadow-2xl`}
        >
          {/* Header */}
          <div className={`sticky top-0 z-10 flex items-start justify-between p-5 border-b ${border} ${bg}`}>
            <div className="flex items-center gap-3 min-w-0">
              <GraduationCap className={`w-6 h-6 shrink-0 ${darkMode ? 'text-[#d4a373]' : 'text-[#b57b54]'}`} />
              <div className="min-w-0">
                <h2 className={`text-sm font-bold font-display truncate ${textMain}`}>{program.name}</h2>
                <p className={`text-[10px] ${textSub}`}>
                  {program.level === 'licenciatura' ? 'Licenciatura' : program.level === 'maestria' ? 'Maestría' : 'Doctorado'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {isAdmin && (
                <>
                  <button onClick={() => onEdit(program)}
                    className={`p-2 rounded-xl transition-all hover:scale-110 ${
                      darkMode ? 'text-stone-400 hover:text-amber-400' : 'text-stone-500 hover:text-amber-600'
                    }`}>
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(program.id)}
                    className={`p-2 rounded-xl transition-all hover:scale-110 ${
                      darkMode ? 'text-stone-400 hover:text-red-400' : 'text-stone-500 hover:text-red-600'
                    }`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
              <button onClick={onClose}
                className={`p-2 rounded-xl transition-all hover:scale-110 ${
                  darkMode ? 'text-stone-400 hover:text-stone-200' : 'text-stone-500 hover:text-stone-800'
                }`}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Preview (image or PDF embed) */}
            {program.imageUrl ? (
              <div className={`rounded-xl overflow-hidden border ${border}`}>
                <img src={program.imageUrl} alt={program.name} className="w-full object-cover max-h-64" />
              </div>
            ) : program.studyPlan ? (
              <div className={`rounded-xl overflow-hidden border ${border}`}>
                <object
                  data={program.studyPlan}
                  type="application/pdf"
                  className="w-full h-64 pointer-events-none"
                  aria-label={`Plan de estudios de ${program.name}`}
                >
                  <div className={`flex items-center justify-center h-64 ${darkMode ? 'bg-[#24211e]' : 'bg-stone-100'}`}>
                    <FileText className="w-12 h-12 text-red-400/50" />
                  </div>
                </object>
              </div>
            ) : null}

            {/* Description */}
            {program.description && (
              <p className={`text-[11px] leading-relaxed ${textMain}`}>{program.description}</p>
            )}

            {/* Modalities & Durations */}
            {program.modalities && program.modalities.length > 0 && (
              <div className={`p-4 ${sectionBox}`}>
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap className={`w-4 h-4 ${textSub}`} />
                  <h3 className={`text-[11px] font-bold ${textMain}`}>Duración por Modalidad</h3>
                </div>
                <div className="space-y-1.5">
                  {program.modalities.map((m) => (
                    <div key={m.label} className={`flex items-center justify-between px-3 py-2 rounded-xl border text-[10px] ${
                      darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-stone-200'
                    }`}>
                      <span className={`font-bold ${textMain}`}>{m.label}</span>
                      <span className={`font-mono ${textSub}`}>{m.duration}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Study Plan (PDF download) */}
            {program.studyPlan && (
              <div className={`p-4 ${sectionBox}`}>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className={`w-4 h-4 ${textSub}`} />
                  <h3 className={`text-[11px] font-bold ${textMain}`}>Plan de Estudios</h3>
                </div>
                <a
                  href={program.studyPlan}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[10px] font-bold transition-all ${
                    darkMode
                      ? 'bg-[#1c1a18] border-[#3e382f] text-stone-300 hover:bg-[#24211e] hover:border-[#d4a373]'
                      : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50 hover:border-[#b57b54]'
                  }`}
                >
                  <FileText className="w-4 h-4 text-red-400" />
                  Descargar plan de estudios (PDF)
                  <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-50" />
                </a>
              </div>
            )}

            {/* Costs */}
            {program.costs && (
              <div className={`p-4 ${sectionBox}`}>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className={`w-4 h-4 ${textSub}`} />
                  <h3 className={`text-[11px] font-bold ${textMain}`}>Costos</h3>
                </div>
                <p className="text-[10px] leading-relaxed whitespace-pre-line">{program.costs}</p>
              </div>
            )}

            {/* Requirements */}
            {program.requirements && (
              <div className={`p-4 ${sectionBox}`}>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className={`w-4 h-4 ${textSub}`} />
                  <h3 className={`text-[11px] font-bold ${textMain}`}>Requisitos</h3>
                </div>
                <p className="text-[10px] leading-relaxed whitespace-pre-line">{program.requirements}</p>
              </div>
            )}

            {/* Benefits */}
            {program.benefits && (
              <div className={`p-4 ${sectionBox}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Star className={`w-4 h-4 ${textSub}`} />
                  <h3 className={`text-[11px] font-bold ${textMain}`}>Beneficios</h3>
                </div>
                <p className="text-[10px] leading-relaxed whitespace-pre-line">{program.benefits}</p>
              </div>
            )}

            {/* Resources (PDFs, Images, Links) */}
            {program.resources && program.resources.length > 0 && (
              <div className={`p-4 ${sectionBox}`}>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className={`w-4 h-4 ${textSub}`} />
                  <h3 className={`text-[11px] font-bold ${textMain}`}>Materiales</h3>
                </div>
                <div className="space-y-2">
                  {program.resources.map((res) => (
                    <a
                      key={res.id}
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 p-3 rounded-xl border text-[10px] font-bold transition-all ${
                        darkMode
                          ? 'bg-[#1c1a18] border-[#3e382f] text-stone-300 hover:bg-[#24211e] hover:border-[#d4a373]'
                          : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50 hover:border-[#b57b54]'
                      }`}
                    >
                      {res.type === 'pdf' ? <FileText className="w-3.5 h-3.5 text-red-400" />
                        : res.type === 'image' ? <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                        : <ExternalLink className="w-3.5 h-3.5" />}
                      <span className="flex-1 truncate">{res.label}</span>
                      <ExternalLink className="w-3 h-3 shrink-0 opacity-50" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
