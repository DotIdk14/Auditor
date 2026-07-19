import { useState, useMemo, useCallback } from 'react';
import { Plus, GraduationCap, Search, ChevronDown } from 'lucide-react';
import { DEFAULT_DEGREE_LEVELS } from '../../data/programsData';
import { getDegreeCatalog, saveDegreeCatalog } from '../../utils/localStorage';
import { useAuthStore } from '../../../../auth/authStore';
import { AREAS, AREA_IDS } from '../../types';
import type { DegreeProgram, AreaId } from '../../types';
import ProgramCard from './ProgramCard';
import ProgramDetail from './ProgramDetail';
import ProgramForm from './ProgramForm';

interface Props {
  darkMode: boolean;
}

const LEVEL_ORDER: Record<string, number> = { licenciatura: 0, maestria: 1, doctorado: 2 };

type ExpandedSet = Set<string>;

export default function CareerCatalog({ darkMode }: Props) {
  const [customPrograms, setCustomPrograms] = useState<Record<string, DegreeProgram>>(() => getDegreeCatalog());
  const [selectedProgram, setSelectedProgram] = useState<DegreeProgram | null>(null);
  const [editingProgram, setEditingProgram] = useState<DegreeProgram | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expanded, setExpanded] = useState<ExpandedSet>(new Set());

  const isAdmin = useAuthStore(s => s.user?.role === 'admin');

  const allLevels = useMemo(() => {
    return DEFAULT_DEGREE_LEVELS.map(level => {
      const merged = level.programs.map(p => customPrograms[p.id] || p);
      return { ...level, programs: merged };
    });
  }, [customPrograms]);

  const mergedPrograms = useMemo(() => {
    const map: Record<string, DegreeProgram> = {};
    for (const level of allLevels)
      for (const p of level.programs)
        map[p.id] = p;
    return map;
  }, [allLevels]);

  // Group programs by area within each level
  const levelsByArea = useMemo(() => {
    return allLevels.map(level => {
      const groups: { area: AreaId; programs: DegreeProgram[] }[] = [];
      for (const areaId of AREA_IDS) {
        const progs = level.programs.filter(p => p.area === areaId);
        if (progs.length > 0) groups.push({ area: areaId, programs: progs });
      }
      return { ...level, groups };
    });
  }, [allLevels]);

  // Filter groups by search
  const filteredLevels = useMemo(() => {
    if (!searchTerm.trim()) return levelsByArea;
    const s = searchTerm.toLowerCase();
    return levelsByArea
      .map(level => ({
        ...level,
        groups: level.groups
          .map(g => ({ ...g, programs: g.programs.filter(p => p.name.toLowerCase().includes(s)) }))
          .filter(g => g.programs.length > 0),
      }))
      .filter(level => level.groups.length > 0);
  }, [levelsByArea, searchTerm]);

  const toggleArea = useCallback((key: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

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
  const border = darkMode ? 'border-[#3e382f]' : 'border-[#dfd9cc]';
  const inputClass = `w-full pl-8 pr-3 py-2 rounded-xl border text-xs focus:outline-none transition-all ${
    darkMode ? 'bg-[#24211e] border-[#3e382f] text-stone-200 placeholder-stone-500 focus:border-[#d4a373]' : 'bg-white border-[#dfd9cc] text-stone-800 placeholder-stone-400 focus:border-[#d4a373]'
  }`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`flex items-center justify-between p-4 rounded-2xl border ${border} ${
        darkMode ? 'bg-[#1c1a18]' : 'bg-white'
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
        {isAdmin && (
          <button onClick={() => { setEditingProgram(null); setShowForm(true); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold transition-all ${
              darkMode
                ? 'bg-[#24211e] text-[#d4a373] hover:bg-[#2e2a24] border border-[#3e382f]'
                : 'bg-[#faedcd] text-[#b57b54] hover:bg-[#ffeec2] border border-[#dfd9cc]'
            }`}>
            <Plus className="w-3 h-3" /> Agregar
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`} />
        <input
          type="text"
          placeholder="Buscar carrera por nombre..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Levels with collapsible areas */}
      {filteredLevels
        .sort((a, b) => LEVEL_ORDER[a.id] - LEVEL_ORDER[b.id])
        .map(level => (
        <div key={level.id}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">{level.icon}</span>
            <h3 className={`text-[11px] font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
              {level.label}
            </h3>
            <span className={`text-[9px] ${textMuted}`}>
              ({level.groups.reduce((s, g) => s + g.programs.length, 0)})
            </span>
          </div>

          <div className="space-y-2">
            {level.groups.map(group => {
              const key = `${level.id}_${group.area}`;
              const areaInfo = AREAS[group.area];
              const isOpen = expanded.has(key);

              return (
                <div key={key} className={`rounded-xl border ${border} overflow-hidden`}>
                  {/* Area header (always rendered) */}
                  <button
                    onClick={() => toggleArea(key)}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-left transition-all hover:bg-opacity-80 ${
                      darkMode ? 'bg-[#1c1a18] hover:bg-[#24211e]' : 'bg-stone-50 hover:bg-stone-100'
                    }`}
                  >
                    <span className="text-sm">{areaInfo.icon}</span>
                    <span className={`text-[10px] font-bold flex-1 ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                      {areaInfo.label}
                    </span>
                    <span className={`text-[9px] ${textMuted} mr-1`}>{group.programs.length}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''} ${textMuted}`} />
                  </button>

                  {/* Cards (only rendered when open) */}
                  {isOpen && (
                    <div className={`p-3 ${darkMode ? 'bg-[#24211e]' : 'bg-white'}`}>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {group.programs.map(program => (
                          <ProgramCard
                            key={program.id}
                            program={program}
                            darkMode={darkMode}
                            onClick={() => setSelectedProgram(program)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {filteredLevels.length === 0 && (
        <div className="py-12 text-center">
          <p className={`text-[11px] ${textMuted}`}>Sin resultados para "{searchTerm}"</p>
        </div>
      )}

      {/* Detail modal */}
      <ProgramDetail
        program={selectedProgram}
        darkMode={darkMode}
        isAdmin={isAdmin}
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
