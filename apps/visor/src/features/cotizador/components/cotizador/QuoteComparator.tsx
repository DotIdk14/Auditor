import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { calculateQuote, QuoteInput, QuoteOutput } from '../../utils/calculo_cotizacion/quoteEngine';
import { CATALOG, INICIO_DATES, EN_PROGS, ACCS } from '../../data/catalogs';
import { getIncludedIds } from '../../utils/calculo_cotizacion/quoteUtils';
import { SearchableSelect } from './SearchableSelect';
import { PreciosConfig } from '../../types';
import { 
  ArrowRightLeft, 
  Copy, 
  PlusCircle, 
  Check, 
  CheckCircle2, 
  Award, 
  RotateCw, 
  ChevronRight, 
  Info,
  Sliders,
  DollarSign,
  TrendingDown,
  Gift,
  AlertCircle
} from 'lucide-react';

// Format currency helper
const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-MX');

interface QuoteComparatorProps {
  // Config fields
  domiciliacionPct: number;
  tituloCosto0: boolean;
  platziPreview: boolean;
  precios: PreciosConfig;
  
  // Current active single calculator states (so advisor can import them)
  currentCalculatorState: {
    activeTab: string;
    activeSubTabEN: string;
    selectedProgram: string;
    selectedLead: string;
    selectedStartDate: string;
    selectedZona: string;
    selectedExperiencia: string | null;
    selectedChips: Record<string, boolean>;
    selectedJornada: string;
    uveVariant: string;
    unicaVariant: string;
    selectedDiplomado: string;
    selectedDiplomadoVariante: string;
  };

  // Callback to sync a config back to the main single calculator
  onSyncToMain: (config: {
    activeTab: string;
    activeSubTabEN: string;
    selectedProgram: string;
    selectedLead: string;
    selectedStartDate: string;
    selectedZona: string;
    selectedExperiencia: string | null;
    selectedChips: Record<string, boolean>;
    selectedJornada: string;
    uveVariant: string;
    unicaVariant: string;
    selectedDiplomado: string;
    selectedDiplomadoVariante: string;
  }) => void;
}

export const QuoteComparator: React.FC<QuoteComparatorProps> = ({
  domiciliacionPct,
  tituloCosto0,
  platziPreview,
  precios,
  currentCalculatorState,
  onSyncToMain
}) => {
  // Option A configuration states
  const [configA, setConfigA] = useState<QuoteInput>({
    activeTab: 'lic',
    activeSubTabEN: 'lic',
    selectedProgram: 'Pedagogía',
    selectedLead: 'hot',
    selectedStartDate: '18/05/2026',
    selectedZona: 'std',
    selectedExperiencia: null,
    selectedDiplomado: 'Actualización en Gineco-obstetricia para el primer y segundo nivel de atención',
    selectedDiplomadoVariante: 'esc1',
    uveVariant: 'alto',
    unicaVariant: 'alto',
    selectedChips: {},
    selectedJornada: 'intensiva'
  });

  // Option B configuration states
  const [configB, setConfigB] = useState<QuoteInput>({
    activeTab: 'mae',
    activeSubTabEN: 'lic',
    selectedProgram: 'Maestría en Automatización y Robótica Industrial',
    selectedLead: 'hot',
    selectedStartDate: '18/05/2026',
    selectedZona: 'std',
    selectedExperiencia: null,
    selectedDiplomado: 'Actualización en Gineco-obstetricia para el primer y segundo nivel de atención',
    selectedDiplomadoVariante: 'esc1',
    uveVariant: 'alto',
    unicaVariant: 'alto',
    selectedChips: {},
    selectedJornada: 'intensiva'
  });

  // Load main calculator states into A initially
  useEffect(() => {
    // Basic clone helper
    const mainConfig: QuoteInput = {
      activeTab: currentCalculatorState.activeTab,
      activeSubTabEN: currentCalculatorState.activeSubTabEN,
      selectedProgram: currentCalculatorState.selectedProgram,
      selectedLead: currentCalculatorState.selectedLead,
      selectedStartDate: currentCalculatorState.selectedStartDate,
      selectedZona: currentCalculatorState.selectedZona,
      selectedExperiencia: currentCalculatorState.selectedExperiencia,
      selectedDiplomado: currentCalculatorState.selectedDiplomado,
      selectedDiplomadoVariante: currentCalculatorState.selectedDiplomadoVariante,
      uveVariant: currentCalculatorState.uveVariant,
      unicaVariant: currentCalculatorState.unicaVariant,
      selectedChips: { ...currentCalculatorState.selectedChips },
      selectedJornada: currentCalculatorState.selectedJornada
    };
    setConfigA(mainConfig);

    // Let Option B start as Maestría equivalent or simply different program for clean side-by-side presentation
    setConfigB({
      ...mainConfig,
      activeTab: mainConfig.activeTab === 'lic' ? 'mae' : 'lic',
      selectedProgram: mainConfig.activeTab === 'lic' 
        ? 'Maestría en Automatización y Robótica Industrial' 
        : 'Administración',
      selectedChips: {}
    });
  }, []);

  // Sync Option values based on changes
  const updateConfig = (option: 'A' | 'B', field: keyof QuoteInput, value: any) => {
    const isA = option === 'A';
    const config = isA ? configA : configB;
    const setConfig = isA ? setConfigA : setConfigB;

    let updated = { ...config, [field]: value };

    // Reset program if academic level changed
    if (field === 'activeTab') {
      const newTab = value as string;
      const subTab = config.activeSubTabEN;
      const cKey = newTab === 'en'
        ? (subTab === 'lic' ? 'LICENCIATURA' : 'MAESTRÍA')
        : (newTab === 'lic' ? 'LICENCIATURA' : newTab === 'mae' ? 'MAESTRÍA' : 'DOCTORADO');
      
      const progs = CATALOG[cKey] || [];
      if (progs.length > 0) {
        updated.selectedProgram = progs[0].p;
      } else {
        updated.selectedProgram = '';
      }
      updated.selectedChips = {};
      updated.selectedExperiencia = null;
    }

    const isLic = updated.activeTab === 'lic' || (updated.activeTab === 'en' && updated.activeSubTabEN === 'lic');
    if (isLic && updated.selectedProgram) {
      const isSpecialUVE = (updated.selectedProgram.toUpperCase() === 'UVE' || updated.selectedProgram.toUpperCase() === 'PSICOLOGÍA' || updated.selectedProgram.toUpperCase().includes('UVE'));
      const isSpecialUNICA = (['UNICA', 'ARTE DIGITAL Y MULTIMEDIA', 'MARKETING Y PUBLICIDAD', 'MEDIOS DIGITALES', 'COMUNICACIÓN CORPORATIVA'].includes(updated.selectedProgram.toUpperCase()) || (updated.selectedProgram.toUpperCase().includes('UNICA') && !updated.selectedProgram.toUpperCase().includes('COMUNICAC')));
      if (isSpecialUVE || isSpecialUNICA) {
        updated.selectedJornada = 'intensiva';
      }
    }

    setConfig(updated);
  };

  // Helper to toggle chips on comparison card
  const toggleOptionChip = (option: 'A' | 'B', chipId: string) => {
    const isA = option === 'A';
    const config = isA ? configA : configB;
    const setConfig = isA ? setConfigA : setConfigB;

    const currentChips = { ...config.selectedChips };
    currentChips[chipId] = !currentChips[chipId];

    // Exclusividad mutua para las experiencias (Ejecutiva, Joven, Híbrida)
    const expIds = ['seseje', 'utelj', 'hibrid'];
    if (expIds.includes(chipId) && currentChips[chipId] === true) {
      expIds.forEach(eid => {
        if (eid !== chipId) {
          currentChips[eid] = false;
        }
      });
    }

    setConfig({ ...config, selectedChips: currentChips });
  };

  // Action helpers
  const importMainToOption = (option: 'A' | 'B') => {
    const setConfig = option === 'A' ? setConfigA : setConfigB;
    setConfig({
      activeTab: currentCalculatorState.activeTab,
      activeSubTabEN: currentCalculatorState.activeSubTabEN,
      selectedProgram: currentCalculatorState.selectedProgram,
      selectedLead: currentCalculatorState.selectedLead,
      selectedStartDate: currentCalculatorState.selectedStartDate,
      selectedZona: currentCalculatorState.selectedZona,
      selectedExperiencia: currentCalculatorState.selectedExperiencia,
      selectedDiplomado: currentCalculatorState.selectedDiplomado,
      selectedDiplomadoVariante: currentCalculatorState.selectedDiplomadoVariante,
      uveVariant: currentCalculatorState.uveVariant,
      unicaVariant: currentCalculatorState.unicaVariant,
      selectedChips: { ...currentCalculatorState.selectedChips },
      selectedJornada: currentCalculatorState.selectedJornada
    });
  };

  const copyAtoB = () => {
    setConfigB({
      ...configA,
      selectedChips: { ...configA.selectedChips }
    });
  };

  const copyBtoA = () => {
    setConfigA({
      ...configB,
      selectedChips: { ...configB.selectedChips }
    });
  };

  const syncWinnerToMain = (option: 'A' | 'B') => {
    const config = option === 'A' ? configA : configB;
    onSyncToMain(config);
  };

  // Compute results
  const resultA = calculateQuote(configA, precios, domiciliacionPct, platziPreview, tituloCosto0);
  const resultB = calculateQuote(configB, precios, domiciliacionPct, platziPreview, tituloCosto0);

  // Helper list of academic levels
  const academicTabs = [
    { id: 'lic', label: 'Licenciatura' },
    { id: 'mae', label: 'Maestría' },
    { id: 'ms', label: 'Master UTEL' },
    { id: 'doc', label: 'Doctorado' },
    { id: 'en', label: 'Ejecutiva Nativa' },
    { id: 'dip', label: 'Diplomado' }
  ];

  // Render options program list
  const getProgramsForConfig = (config: QuoteInput) => {
    const { activeTab, activeSubTabEN } = config;
    const cKey = activeTab === 'en'
      ? (activeSubTabEN === 'lic' ? 'LICENCIATURA' : 'MAESTRÍA')
      : (activeTab === 'lic' ? 'LICENCIATURA' : activeTab === 'mae' ? 'MAESTRÍA' : activeTab === 'ms' ? 'MASTER' : 'DOCTORADO');
    
    let list = CATALOG[cKey] || [];
    
    if (activeTab === 'en') {
      const permitidos = EN_PROGS[activeSubTabEN] || [];
      return list.filter(p => permitidos.includes(p.p));
    }
    return list;
  };

  // Accessories matching level
  const getAccessoriesForSec = (sec: string) => {
    const all = ACCS[sec];
    if (!all) return [];
    
    // Flatten optional items
    const items: Array<{ id: string; name: string; price: number; desc?: string }> = [];
    all.optional.forEach(grp => {
      grp.items.forEach(it => {
        if (!it.hidden) {
          items.push({ id: it.id, name: it.name, price: it.price || 0 });
        }
      });
    });
    return items;
  };

  const showAccessoriesToggle = (option: 'A' | 'B') => {
    const config = option === 'A' ? configA : configB;
    const sec = config.activeTab === 'en' ? config.activeSubTabEN : config.activeTab;
    const list = getAccessoriesForSec(sec);

    if (list.length === 0) return <p className="text-xs text-gray-400 italic">No aplica complementos</p>;

    const isLic = config.activeTab === 'lic' || (config.activeTab === 'en' && config.activeSubTabEN === 'lic');
    
    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {list.map(item => {
          // Special restrictions check (copied from QuoteResult rules)
          const isSelected = config.selectedChips[item.id] === true;
          const isIncluded = getIncludedIds(sec, config.activeTab !== 'en' && config.activeTab !== 'dip', platziPreview, config.selectedExperiencia === 'seseje' || config.activeTab === 'en').includes(item.id);
          
          if (isIncluded) {
            return (
              <span key={item.id} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold px-2.5 py-1 rounded-full border border-dashed border-slate-300 dark:border-slate-700 flex items-center gap-1 opacity-70">
                ✓ {item.name} (Incluido)
              </span>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => toggleOptionChip(option, item.id)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all border cursor-pointer flex items-center gap-1 ${
                isSelected
                  ? 'bg-indigo-500 text-white border-indigo-600 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-800 hover:border-gray-400 dark:hover:border-slate-600'
              }`}
            >
              {isSelected ? '✓ ' : '+ '}
              {item.name} {item.price > 0 && `(+$${item.price})`}
            </button>
          );
        })}
      </div>
    );
  };

  const renderConfigSection = (option: 'A' | 'B') => {
    const isA = option === 'A';
    const config = isA ? configA : configB;
    const progs = getProgramsForConfig(config);

    const compIsSpecialUVE = (config.activeTab === 'lic' || (config.activeTab === 'en' && config.activeSubTabEN === 'lic')) && (config.selectedProgram?.toUpperCase() === 'UVE' || config.selectedProgram?.toUpperCase() === 'PSICOLOGÍA' || config.selectedProgram?.toUpperCase().includes('UVE'));
    const compIsSpecialUNICA = (config.activeTab === 'lic' || (config.activeTab === 'en' && config.activeSubTabEN === 'lic')) && (['UNICA', 'ARTE DIGITAL Y MULTIMEDIA', 'MARKETING Y PUBLICIDAD', 'MEDIOS DIGITALES', 'COMUNICACIÓN CORPORATIVA'].includes(config.selectedProgram?.toUpperCase()) || (config.selectedProgram?.toUpperCase().includes('UNICA') && !config.selectedProgram?.toUpperCase().includes('COMUNICAC')));
    const compIsUnicaOrUve = compIsSpecialUVE || compIsSpecialUNICA;

    return (
      <div className="space-y-4 bg-gray-50/50 dark:bg-slate-900/40 p-5 rounded-2xl border border-gray-150 dark:border-slate-800/85">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black px-2.5 py-1 bg-slate-200 dark:bg-slate-850 rounded-lg text-slate-700 dark:text-slate-300 tracking-widest uppercase">
            PARÁMETROS OPCIÓN {option}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => importMainToOption(option)}
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 cursor-pointer flex items-center gap-0.5"
              title="Importar la configuración seleccionada actualmente en el simulador principal"
            >
              <RotateCw className="h-3 w-3" /> Importar Inicial
            </button>
          </div>
        </div>

        {/* Nivel Académico */}
        <div>
          <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-450 dark:text-slate-500 mb-1.5 block">Nivel Académico / Modalidad</label>
          <div className="grid grid-cols-3 gap-1">
            {academicTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => updateConfig(option, 'activeTab', tab.id)}
                className={`text-[10px] font-bold py-2 rounded-lg transition-all border cursor-pointer truncate px-1 text-center ${
                  config.activeTab === tab.id
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-md font-extrabold'
                    : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-300 hover:border-gray-300 dark:hover:border-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sub-Tab EJECUTIVA */}
        {config.activeTab === 'en' && (
          <div className="pt-1">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-450 dark:text-slate-500 mb-1 block">Subnivel Ejecutiva</label>
            <div className="flex gap-2">
              {['lic', 'mae'].map(sub => (
                <button
                  key={sub}
                  onClick={() => updateConfig(option, 'activeSubTabEN', sub)}
                  className={`text-[10px] flex-1 font-bold py-1.5 rounded-lg border cursor-pointer text-center ${
                    config.activeSubTabEN === sub
                      ? 'bg-indigo-150 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-300 dark:border-indigo-800'
                      : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400'
                  }`}
                >
                  {sub === 'lic' ? 'Licenciatura Ejecutiva' : 'Maestría Ejecutiva'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Programa */}
        {config.activeTab !== 'dip' ? (
          <div>
            <SearchableSelect
              options={progs}
              value={config.selectedProgram}
              onChange={(v) => updateConfig(option, 'selectedProgram', v)}
              label="Programa de Estudio"
              placeholder="Buscar y seleccionar programa..."
            />
          </div>
        ) : (
          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-450 dark:text-slate-500 mb-1 block">Diplomado Ofertado</label>
            <select
              value={config.selectedProgram}
              onChange={(e) => updateConfig(option, 'selectedProgram', e.target.value)}
              className="w-full h-[38px] bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {[
                "Actualización en Gineco-obstetricia para el primer y segundo nivel de atención",
                "Actualización en urgencias",
                "Administración de los servicios de salud",
                "Administración de proyectos",
                "Administración financiera",
                "Atención del adulto mayor",
                "Coaching organizacional",
                "Desarrollo e-learning",
                "Dirección de operaciones",
                "Diversidad y equidad de género",
                "Educación en ciencias de la salud",
                "Estrategia e innovacción de negocios",
                "Gestión Sostenible de la Cadena de Suministro",
                "Gestión curricular en educación a distancia",
                "Gestión y eficiencia de sistemas energéticos",
                "Mindfulness para los individuos y familias",
                "Nutrición especial en enfermedades metabólicas",
                "Pensamiento crítico e innovación",
                "Principios en el Arte Digital y Animación",
                "Project management",
                "Pruebas Psicológicas para Adultos",
                "Rehabilitación del adulto mayor",
                "Soft skills y habilidades gerenciales",
                "Tanatología",
                "Transición y energía sostenible",
                "Animación Digital y Creación de Contenidos",
                "Análisis Económico Integral",
                "Ciencia de datos e inteligencia artificial",
                "Contabilidad y Gestión financiera",
                "Creatividad visual y comunicación digital",
                "Desarrollo de Medios Interactivos",
                "Diseño y Desarrollo de Software",
                "Diseño y Evaluación en Entornos Digitales",
                "Estrategias y Operaciones de Transporte",
                "Fuentes y tecnologías de energías renovables",
                "Gestión de Calidad y Mantenimiento de Software",
                "Gestión de Experiencias de Aprendizaje en Ambientes Virtuales",
                "Inteligencia artificial aplicada",
                "Métodos Cuantitativos para la Toma de Decisiones",
                "Programación y Tecnologías de Redes",
                "Tecnologías de la Información Aplicadas a la Logística y el Transporte"
              ].map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        )}

        {/* Tipo de Lead / Antigüedad CRM */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-450 dark:text-slate-500 mb-1.5 block">Tipo de Lead (CRM)</label>
            <select
              value={config.selectedLead}
              onChange={(e) => updateConfig(option, 'selectedLead', e.target.value)}
              className="w-full h-[38px] bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-850 dark:text-slate-100 outline-none"
            >
              <option value="hot">Hot Lead (Reciente)</option>
              <option value="rmkt30">RMKT +30 días</option>
              <option value="rmkt60">RMKT +60 días</option>
              <option value="crm">Sincronizado CRM</option>
            </select>
          </div>

          {/* Experiencia (Only if available) */}
          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-450 dark:text-slate-500 mb-1.5 block">Modalidad Experiencia</label>
            <select
              value={config.selectedExperiencia || ''}
              onChange={(e) => updateConfig(option, 'selectedExperiencia', e.target.value === '' ? null : e.target.value)}
              className="w-full h-[38px] bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-gray-850 dark:text-slate-100 outline-none"
              disabled={config.activeTab === 'en' || config.activeTab === 'dip' || config.activeTab === 'doc'}
            >
              <option value="">Sin experiencia (Nativa Online)</option>
              <option value="seseje">Ejecutiva (SES/EJE)</option>
              {(config.activeTab === 'lic' || (config.activeTab === 'en' && config.activeSubTabEN === 'lic')) && (
                <option value="utelj">UTEL Joven</option>
              )}
              <option value="hibrid">Híbrida Presencial</option>
            </select>
          </div>
        </div>

        {/* Jornada / Horarios de estudio */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-450 dark:text-slate-500 mb-1.5 block">Jornada / Agenda</label>
            <select
              value={config.selectedJornada}
              onChange={(e) => updateConfig(option, 'selectedJornada', e.target.value)}
              className="w-full h-[38px] bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-850 dark:text-slate-100 outline-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={config.activeTab === 'dip' || config.activeTab === 'doc' || compIsUnicaOrUve}
            >
              <option value="intensiva">Intensiva (Por defecto)</option>
              {!compIsUnicaOrUve && <option value="completa">Completa / Tradicional</option>}
              {!compIsUnicaOrUve && <option value="super">Súper Intensiva</option>}
            </select>
          </div>

          {/* Fecha de Inicio */}
          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-450 dark:text-slate-500 mb-1.5 block">Ciclo de Inicio</label>
            <select
              value={config.selectedStartDate}
              onChange={(e) => updateConfig(option, 'selectedStartDate', e.target.value)}
              className="w-full h-[38px] bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-850 dark:text-slate-100 outline-none"
            >
              {(INICIO_DATES[config.activeTab === 'en' ? config.activeSubTabEN : config.activeTab] || []).map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Complementos (Chips checkbox toggles) */}
        <div>
          <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-450 dark:text-slate-500 mb-1 block">Adicionales / Complementos</label>
          {showAccessoriesToggle(option)}
        </div>
      </div>
    );
  };

  const getBecaTextClass = (pct: number) => {
    if (pct >= 60) return 'text-emerald-600 dark:text-emerald-400 font-extrabold';
    if (pct >= 40) return 'text-blue-600 dark:text-blue-400 font-extrabold';
    return 'text-amber-600 dark:text-amber-400 font-extrabold';
  };

  return (
    <div className="w-full bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-900 rounded-3xl shadow-xl p-6 transition-colors duration-200">
      
      {/* COMPARATOR ACTIONS BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-150 dark:border-slate-850 pb-5 mb-6 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg text-indigo-600 dark:text-indigo-400">
              <ArrowRightLeft className="h-5 w-5" />
            </span>
            <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Comparador de Cotizaciones UTEL</h2>
          </div>
          <p className="text-xs text-gray-400 dark:text-slate-400 mt-1">Establece dos escenarios independientes lado a lado para convencer al estudiante mostrándole opciones complementarias de becas, agendas, o programas.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={copyAtoB}
            className="text-xs bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 font-extrabold px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-800 cursor-pointer flex items-center gap-1.5"
            title="Copiar todos los valores de la opción A a la opción B"
          >
            <Copy className="h-3.5 w-3.5" /> Copiar A ➔ B
          </button>
          
          <button
            onClick={copyBtoA}
            className="text-xs bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 font-extrabold px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-800 cursor-pointer flex items-center gap-1.5"
            title="Copiar todos los valores de la opción B a la opción A"
          >
            <Copy className="h-3.5 w-3.5 rotate-180" /> Copiar B ➔ A
          </button>
        </div>
      </div>

      {/* TWO SELECTORS SIDE-BY-SIDE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {renderConfigSection('A')}
        {renderConfigSection('B')}
      </div>

      {/* COMPARATIVE METRICS & METRICS TABLE */}
      <div className="border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/30">
        <div className="bg-slate-100 dark:bg-slate-850 border-b border-gray-150 dark:border-slate-800 px-6 py-4">
          <h3 className="font-black text-xs tracking-widest text-slate-700 dark:text-slate-300 uppercase">TABLA COMPARATIVA DE COTIZACIÓN</h3>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-250 dark:border-slate-800">
                <th className="py-4 px-6 text-left font-black text-slate-500 dark:text-slate-450 uppercase text-[10px] tracking-wider w-1/3">CONCEPTO / BENEFICIO</th>
                <th className="py-4 px-6 text-center text-indigo-700 dark:text-indigo-400 font-black tracking-widest text-lg bg-indigo-50/20 dark:bg-indigo-950/10">OPCIÓN A</th>
                <th className="py-4 px-6 text-center text-indigo-700 dark:text-indigo-400 font-black tracking-widest text-lg">OPCIÓN B</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 dark:divide-slate-850/60 font-medium text-gray-800 dark:text-slate-200">
              
              {/* Program & level */}
              <tr>
                <td className="py-4 px-6 text-left text-xs font-bold text-gray-500 dark:text-slate-400">Programa Académico</td>
                <td className="py-4 px-6 text-center bg-indigo-50/15 dark:bg-indigo-950/5">
                  <div className="font-extrabold text-sm text-gray-900 dark:text-white uppercase leading-tight">{resultA.programName}</div>
                  <div className="text-[10px] font-black tracking-widest text-indigo-600 dark:text-indigo-400 mt-1 uppercase">{resultA.academicLevel}</div>
                </td>
                <td className="py-4 px-6 text-center">
                  <div className="font-extrabold text-sm text-gray-900 dark:text-white uppercase leading-tight">{resultB.programName}</div>
                  <div className="text-[10px] font-black tracking-widest text-indigo-600 dark:text-indigo-400 mt-1 uppercase">{resultB.academicLevel}</div>
                </td>
              </tr>

              {/* Duración */}
              <tr>
                <td className="py-4 px-6 text-left text-xs font-bold text-gray-500 dark:text-slate-400">Duración y Jornada</td>
                <td className="py-4 px-6 text-center text-xs font-bold bg-indigo-50/15 dark:bg-indigo-950/5">
                  <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{resultA.duration}</span>
                  <div className="text-[9px] font-extrabold uppercase mt-1 tracking-wider text-gray-400">Jornada: {configA.selectedJornada}</div>
                </td>
                <td className="py-4 px-6 text-center text-xs font-bold">
                  <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{resultB.duration}</span>
                  <div className="text-[9px] font-extrabold uppercase mt-1 tracking-wider text-gray-400">Jornada: {configB.selectedJornada}</div>
                </td>
              </tr>

              {/* Beca Aplicada */}
              <tr>
                <td className="py-4 px-6 text-left text-xs font-bold text-gray-500 dark:text-slate-400">Porcentaje de Beca</td>
                <td className="py-4 px-6 text-center text-base bg-indigo-50/15 dark:bg-indigo-950/5">
                  <span className={`px-3 py-1 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 relative ${getBecaTextClass(resultA.becaPercentNum)}`}>
                    {resultA.becaPercentNum}% Beca
                  </span>
                </td>
                <td className="py-4 px-6 text-center text-base">
                  <span className={`px-3 py-1 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 relative ${getBecaTextClass(resultB.becaPercentNum)}`}>
                    {resultB.becaPercentNum}% Beca
                  </span>
                </td>
              </tr>

              {/* Costo Inscripción */}
              <tr>
                <td className="py-4 px-6 text-left text-xs font-bold text-gray-500 dark:text-slate-400">Inscripción Inicial</td>
                <td className="py-4 px-6 text-center bg-indigo-50/15 dark:bg-indigo-950/5">
                  <div className="text-gray-400 line-through text-xs">{fmt(resultA.baseInscripcion)}</div>
                  <div className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">PROMO: $0 (100% Condonado)</div>
                </td>
                <td className="py-4 px-6 text-center">
                  <div className="text-gray-400 line-through text-xs">{fmt(resultB.baseInscripcion)}</div>
                  <div className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">PROMO: $0 (100% Condonado)</div>
                </td>
              </tr>

              {/* Pago Mensual regular */}
              <tr>
                <td className="py-4 px-6 text-left text-xs font-bold text-gray-500 dark:text-slate-400">Mensualidad de Lista (Sin Beca)</td>
                <td className="py-4 px-6 text-center font-mono font-extrabold text-gray-500/70 bg-indigo-50/15 dark:bg-indigo-950/5">
                  {fmt(resultA.colRegularVal)}
                </td>
                <td className="py-4 px-6 text-center font-mono font-extrabold text-gray-500/70">
                  {fmt(resultB.colRegularVal)}
                </td>
              </tr>

              {/* Esquema de Mensualidades Detallado */}
              <tr>
                <td className="py-4 px-6 text-left text-xs font-bold text-gray-500 dark:text-slate-400 font-semibold vertical-align-top">
                  Estructura Mensual (Con Beca + Extras)
                  <p className="text-[10px] font-normal text-gray-400 italic mt-1 leading-snug">Detalle escalonado mes a mes incluyendo complementos seleccionados.</p>
                </td>
                <td className="py-4 px-6 text-center bg-indigo-50/15 dark:bg-indigo-950/5">
                  <div className="space-y-1">
                    {resultA.rows.map((row) => (
                      <div key={row.label} className="flex justify-between items-center text-xs border-b border-dashed border-gray-200 dark:border-slate-800 py-1 px-2 font-semibold">
                        <span className="text-gray-500 dark:text-slate-400">{row.label}:</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{fmt(row.total)}</span>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="py-4 px-6 text-center">
                  <div className="space-y-1">
                    {resultB.rows.map((row) => (
                      <div key={row.label} className="flex justify-between items-center text-xs border-b border-dashed border-gray-200 dark:border-slate-800 py-1 px-2 font-semibold">
                        <span className="text-gray-500 dark:text-slate-400">{row.label}:</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{fmt(row.total)}</span>
                      </div>
                    ))}
                  </div>
                </td>
              </tr>

              {/* Mensualidad con Domiciliación */}
              <tr>
                <td className="py-4 px-6 text-left text-xs font-bold text-gray-550 dark:text-slate-350 focus:outline-none">
                  Última colegiatura con Domiciliación ({domiciliacionPct}%)
                  <p className="text-[10px] font-normal text-gray-400 italic leading-snug">Precio preferente al domiciliar a tarjeta.</p>
                </td>
                <td className="py-4 px-6 text-center bg-indigo-50/25 dark:bg-indigo-950/10">
                  <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tight">
                    {resultA.rows[resultA.rows.length - 1]?.domValue || '—'}
                  </div>
                </td>
                <td className="py-4 px-6 text-center">
                  <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tight">
                    {resultB.rows[resultB.rows.length - 1]?.domValue || '—'}
                  </div>
                </td>
              </tr>

              {/* Cuota de Titulación */}
              {configA.activeTab !== 'dip' || configB.activeTab !== 'dip' ? (
                <tr>
                  <td className="py-4 px-6 text-left text-xs font-bold text-gray-500 dark:text-slate-400">Garantía de Titulación Inicial</td>
                  <td className="py-4 px-6 text-center text-xs font-bold bg-indigo-50/15 dark:bg-indigo-950/5">
                    {tituloCosto0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Gratis ($0)
                      </span>
                    ) : (
                      <span className="text-gray-650 dark:text-slate-350">Incluido en Plan de Beca Oficial</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center text-xs font-bold">
                    {tituloCosto0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Gratis ($0)
                      </span>
                    ) : (
                      <span className="text-gray-650 dark:text-slate-350">Incluido en Plan de Beca Oficial</span>
                    )}
                  </td>
                </tr>
              ) : null}

              {/* Certificaciones y Accesorios */}
              <tr>
                <td className="py-4 px-6 text-left text-xs font-bold text-gray-500 dark:text-slate-400">
                  Beneficios y Certicaciones
                </td>
                <td className="py-4 px-6 text-center bg-indigo-50/15 dark:bg-indigo-950/5">
                  <div className="flex flex-wrap justify-center gap-1">
                    {resultA.activeCerts.concat(resultA.activeAccs).length > 0 ? (
                      resultA.activeCerts.concat(resultA.activeAccs).map((c, i) => (
                        <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-950/40">
                          ✓ {c}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 italic text-xs">Ninguno seleccionado</span>
                    )}
                  </div>
                </td>
                <td className="py-4 px-6 text-center">
                  <div className="flex flex-wrap justify-center gap-1">
                    {resultB.activeCerts.concat(resultB.activeAccs).length > 0 ? (
                      resultB.activeCerts.concat(resultB.activeAccs).map((c, i) => (
                        <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-950/40">
                          ✓ {c}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 italic text-xs">Ninguno seleccionado</span>
                    )}
                  </div>
                </td>
              </tr>

              {/* Botones de Acción */}
              <tr>
                <td className="py-4 px-6 text-left text-xs font-black text-gray-650 dark:text-slate-350">Seleccionar Opción Ganadora</td>
                <td className="py-5 px-6 text-center bg-indigo-50/25 dark:bg-indigo-950/10">
                  <button
                    onClick={() => syncWinnerToMain('A')}
                    className="cursor-pointer font-extrabold w-full py-2.5 rounded-xl text-xs bg-indigo-650 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
                    title="Transferir esta cotización completa a los indicadores principales del cotizador para imprimir ó descargar PDF"
                  >
                    <Check className="h-4 w-4" /> Aplicar Opción A al Cotizador
                  </button>
                </td>
                <td className="py-5 px-6 text-center">
                  <button
                    onClick={() => syncWinnerToMain('B')}
                    className="cursor-pointer font-extrabold w-full py-2.5 rounded-xl text-xs bg-indigo-650 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
                    title="Transferir esta cotización completa a los indicadores principales del cotizador para imprimir ó descargar PDF"
                  >
                    <Check className="h-4 w-4" /> Aplicar Opción B al Cotizador
                  </button>
                </td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>
      
      {/* QUICK GUIDE INSTRUCTION */}
      <div className="flex items-start gap-2.5 bg-indigo-50/30 dark:bg-indigo-950/15 border border-indigo-100/60 dark:border-indigo-900/30 p-4 mt-6 rounded-2xl">
        <Info className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-800/80 dark:text-indigo-300/80 leading-relaxed">
          <span className="font-extrabold text-indigo-900 dark:text-indigo-200">Consejo de Admisión:</span> Puedes jugar alternando las jornadas (ej: Súper Intensiva vs Intensiva) para mostrarle al alumno un esquema que reduce la beca pero acorta la duración del plan de estudios casi a la mitad. Una vez que el alumno se decida por un plan de costos, haz clic en <span className="font-bold">"Aplicar Opción al Cotizador"</span> para que se cargue en el panel de control oficial. Esto te habilitará para descargar e imprimir el Resumen Oficial de Beca en formato de propuesta de admisión oficial.
        </div>
      </div>

    </div>
  );
};
