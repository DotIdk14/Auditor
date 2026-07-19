import { useState, useMemo } from 'react';
import { Plus, GraduationCap } from 'lucide-react';
import { DEFAULT_DEGREE_LEVELS } from '../../data/programsData';
import { getDegreeCatalog, saveDegreeCatalog } from '../../utils/localStorage';
import type { DegreeProgram } from '../../types';
import ProgramCard from './ProgramCard';
import ProgramDetail from './ProgramDetail';
import ProgramForm from './ProgramForm';

interface Props {
  darkMode: boolean;
}

const LEVEL_ORDER: Record<string, number> = { licenciatura: 0, maestria: 1, doctorado: 2 };

export default function CareerCatalog({ darkMode }: Props) {
  const [customPrograms, setCustomPrograms] = useState<Record<string, DegreeProgram>>(() => getDegreeCatalog());
  const [selectedProgram, setSelectedProgram] = useState<DegreeProgram | null>(null);
  const [editingProgram, setEditingProgram] = useState<DegreeProgram | null>(null);
  const [showForm, setShowForm] = useState(false);

  const allLevels = useMemo(() => {
    return DEFAULT_DEGREE_LEVELS.map(level => {
      const merged = level.programs.map(p => customPrograms[p.id] || p);
      return {
        ...level,
        programs: merged,
      };
    });
  }, [customPrograms]);

  const mergedPrograms = useMemo(() => {
    const map: Record<string, DegreeProgram> = {};
    for (const level of allLevels) {
      for (const p of level.programs) {
        map[p.id] = p;
      }
    }
    return map;
  }, [allLevels]);

  const handleSave = (program: DegreeProgram) => {
    const updated = { ...customPrograms, [program.id]: program };
    setCustomPrograms(updated);
    saveDegreeCatalog(updated);
    setShowForm(false);
    setEditingProgram(null);
    setSelectedProgram(program);
  };

  const handleDelete = (id: string) => {
    const updated = { ...customPrograms };
    delete updated[id];
    setCustomPrograms(updated);
    saveDegreeCatalog(updated);
    setSelectedProgram(null);
  };

  const totalPrograms = allLevels.reduce((acc, l) => acc + l.programs.length, 0);
  const filledCount = Object.values(mergedPrograms).filter(p => p.description || p.studyPlan || p.imageUrl).length;

  const textMuted = darkMode ? 'text-stone-500' : 'text-stone-400';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`flex items-center justify-between p-4 rounded-2xl border ${
        darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'
      }`}>
        <div className="space-y-1">
          <p className={`text-[11px] font-bold flex items-center gap-1.5 ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
            <GraduationCap className={`w-4 h-4 ${darkMode ? 'text-[#d4a373]' : 'text-[#b57b54]'}`} />
            Catálogo de Carreras
          </p>
          <p className={`text-[9px] ${textMuted}`}>
            {filledCount} / {totalPrograms} carreras con información
          </p>
        </div>
        <button onClick={() => { setEditingProgram(null); setShowForm(true); }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold transition-all ${
            darkMode
              ? 'bg-[#24211e] text-[#d4a373] hover:bg-[#2e2a24] border border-[#3e382f]'
              : 'bg-[#faedcd] text-[#b57b54] hover:bg-[#ffeec2] border border-[#dfd9cc]'
          }`}>
          <Plus className="w-3 h-3" /> Agregar
        </button>
      </div>

      {/* Levels */}
      {allLevels
        .sort((a, b) => LEVEL_ORDER[a.id] - LEVEL_ORDER[b.id])
        .map((level) => (
        <div key={level.id}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">{level.icon}</span>
            <h3 className={`text-[11px] font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
              {level.label}
            </h3>
            <span className={`text-[9px] ${textMuted}`}>({level.programs.length})</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {level.programs.map(program => (
              <ProgramCard
                key={program.id}
                program={program}
                darkMode={darkMode}
                onClick={() => setSelectedProgram(program)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Detail modal */}
      <ProgramDetail
        program={selectedProgram}
        darkMode={darkMode}
        onClose={() => setSelectedProgram(null)}
        onEdit={(p) => { setEditingProgram(p); setShowForm(true); setSelectedProgram(null); }}
        onDelete={handleDelete}
      />

      {/* Form modal */}
      {showForm && (
        <ProgramForm
          darkMode={darkMode}
          program={editingProgram}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingProgram(null); }}
        />
      )}
    </div>
  );
}
