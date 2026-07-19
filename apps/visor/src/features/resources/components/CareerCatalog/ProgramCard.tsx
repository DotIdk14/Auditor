import { GraduationCap, FileText } from 'lucide-react';
import type { DegreeProgram } from '../../types';

interface Props {
  program: DegreeProgram;
  darkMode: boolean;
  onClick: () => void;
}

const LEVEL_STYLES: Record<string, { border: string; badge: string }> = {
  licenciatura: { border: 'border-blue-500/30', badge: 'bg-blue-500/10 text-blue-400' },
  maestria: { border: 'border-orange-500/30', badge: 'bg-orange-500/10 text-orange-400' },
  doctorado: { border: 'border-red-500/30', badge: 'bg-red-500/10 text-red-400' },
};

const LEVEL_LABELS: Record<string, string> = {
  licenciatura: 'Licenciatura',
  maestria: 'Maestría',
  doctorado: 'Doctorado',
};

export default function ProgramCard({ program, darkMode, onClick }: Props) {
  const style = LEVEL_STYLES[program.level] || LEVEL_STYLES.licenciatura;
  const hasImage = !!program.imageUrl;
  const hasPdf = !!program.studyPlan;

  return (
    <button
      onClick={onClick}
      className={`group relative w-full text-left rounded-xl border-2 overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] ${
        darkMode
          ? `bg-[#1c1a18] ${style.border} hover:border-opacity-60`
          : 'bg-white border-stone-200 hover:border-stone-300 shadow-sm hover:shadow-md'
      }`}
    >
      {/* Preview */}
      <div className={`aspect-[16/9] flex items-center justify-center overflow-hidden ${
        darkMode ? 'bg-[#24211e]' : 'bg-stone-100'
      }`}>
        {hasImage ? (
          <img
            src={program.imageUrl}
            alt={program.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : hasPdf ? (
          <object
            data={program.studyPlan}
            type="application/pdf"
            className="w-full h-full pointer-events-none"
            aria-label={`Plan de estudios de ${program.name}`}
          >
            <div className="flex flex-col items-center justify-center w-full h-full gap-1 opacity-40">
              <FileText className="w-8 h-8 text-red-400" />
              <span className="text-[8px] font-bold">Ver plan de estudios</span>
            </div>
          </object>
        ) : (
          <div className="flex flex-col items-center gap-1 opacity-40">
            <FileText className="w-8 h-8" />
            <span className="text-[8px] font-bold">Sin contenido</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-1.5">
          <GraduationCap className={`w-3.5 h-3.5 shrink-0 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`} />
          <span className={`text-[10px] font-bold leading-tight line-clamp-2 ${
            darkMode ? 'text-stone-200' : 'text-stone-800'
          }`}>
            {program.name}
          </span>
        </div>
        <span className={`inline-block text-[8px] font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
          {LEVEL_LABELS[program.level]}
        </span>
      </div>
    </button>
  );
}
