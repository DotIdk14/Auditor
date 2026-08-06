/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CATALOG,
  NEW_PROGS,
  INICIO_BY_PROG,
  INICIO_DATES,
  EN_PROGS,
  CatalogItem,
  MERCADO_UNICO_PROGS,
  getDipOptions
} from '../../data/catalogs';
import { isMercadoUnico, isNuevo, getDuracion } from '../../utils/calculo_cotizacion/quoteUtils';
import { Sun, Moon, ExternalLink, RefreshCw, Palette, Check, Sliders, ArrowRightLeft, Sparkles, Settings, Lock } from 'lucide-react';
import { SearchableSelect } from './SearchableSelect';

interface QuoteFormProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeSubTabEN: string;
  setActiveSubTabEN: (tab: string) => void;

  // Selecciones del formulario
  selectedArea: string;
  setSelectedArea: (area: string) => void;
  selectedProgram: string;
  setSelectedProgram: (prog: string) => void;
  selectedLead: string;
  setSelectedLead: (lead: string) => void;
  selectedStartDate: string;
  setSelectedStartDate: (date: string) => void;
  selectedZona: string;
  setSelectedZona: (zona: string) => void;
  selectedExperiencia: string | null;
  setSelectedExperiencia: (exp: string | null) => void;

  // Específicos para Diplomados
  selectedDiplomado: string;
  setSelectedDiplomado: (prog: string) => void;
  selectedDiplomadoVariante: string;
  setSelectedDiplomadoVariante: (v: string) => void;

  // Variantes especiales para UVE / UNICA
  uveVariant: string;
  setUveVariant: (v: string) => void;
  unicaVariant: string;
  setUnicaVariant: (v: string) => void;

  // Acciones globales y exportación
  onExport: () => void;
  onNewQuote?: () => void;
  onOpenAdmin?: () => void;
  onLogout?: () => void;
  domiciliacionPct: number;
  onToggleDomiciliacion?: () => void;

  isDarkTheme?: boolean;
  setIsDarkTheme?: (d: boolean) => void;

  // Personalized Theme
  primaryColor?: string;
  setPrimaryColor?: (color: string) => void;
  isThemePanelOpen?: boolean;
  setIsThemePanelOpen?: (open: boolean) => void;
  colorPresets?: string[];

  selectedJornada?: string;
  setSelectedJornada?: (j: string) => void;
  onlyHeader?: boolean;
  viewMode?: 'individual' | 'double' | 'comparativa';
  setViewMode?: (mode: 'individual' | 'double' | 'comparativa') => void;
}

export const QuoteForm: React.FC<QuoteFormProps> = ({
  activeTab,
  setActiveTab,
  activeSubTabEN,
  setActiveSubTabEN,
  selectedArea,
  setSelectedArea,
  selectedProgram,
  setSelectedProgram,
  selectedLead,
  setSelectedLead,
  selectedStartDate,
  setSelectedStartDate,
  selectedZona,
  setSelectedZona,
  selectedExperiencia,
  setSelectedExperiencia,
  selectedDiplomado,
  setSelectedDiplomado,
  selectedDiplomadoVariante,
  setSelectedDiplomadoVariante,
  uveVariant,
  setUveVariant,
  unicaVariant,
  setUnicaVariant,
  onExport,
  onNewQuote,
  onOpenAdmin,
  onLogout,
  domiciliacionPct,
  onToggleDomiciliacion,
  isDarkTheme,
  setIsDarkTheme,
  primaryColor,
  setPrimaryColor,
  isThemePanelOpen,
  setIsThemePanelOpen,
  colorPresets,
  selectedJornada = 'intensiva',
  setSelectedJornada = () => {},
  onlyHeader = false,
  viewMode,
  setViewMode
}) => {
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);

  // Determinar qué lista mostrar según la pestaña activa y filtros
  const obtenerClaveCatalogo = (): string => {
    if (activeTab === 'en') {
      return activeSubTabEN === 'lic' ? 'LICENCIATURA' : activeSubTabEN === 'mae' ? 'MAESTRÍA' : 'MASTER';
    }
    return activeTab === 'lic' ? 'LICENCIATURA' : activeTab === 'mae' ? 'MAESTRÍA' : activeTab === 'ms' ? 'MASTER' : 'DOCTORADO';
  };

  const claveCatalogo = obtenerClaveCatalogo();
  const programasBrutos = CATALOG[claveCatalogo] || [];

  // Filtrar programas por área si la pestaña activa es lic o mae
  const filtradoPorArea = programasBrutos.filter(p => {
    if ((activeTab === 'lic' || (activeTab === 'en' && activeSubTabEN === 'lic')) && selectedArea) {
      return p.a === selectedArea;
    }
    if ((activeTab === 'mae' || (activeTab === 'en' && activeSubTabEN === 'mae')) && selectedArea) {
      return p.a === selectedArea;
    }
    return true;
  });

  // Si Ejecutiva Nativa o modalidad ejecutiva está activa, filtrar solo programas válidos
  const programasFinales = filtradoPorArea.filter(p => {
    // Caso 1: Pestaña Ejecutiva Nativa
    if (activeTab === 'en') {
      const permitidos = EN_PROGS[activeSubTabEN] || [];
      return permitidos.includes(p.p);
    }
    // Caso 2: Pestaña normal pero con Modalidad Ejecutiva seleccionada en el Chip de Experiencia
    if (selectedExperiencia === 'seseje') {
      const subClave = activeTab === 'lic' ? 'lic' : activeTab === 'mae' ? 'mae' : '';
      if (subClave) {
        const permitidos = EN_PROGS[subClave] || [];
        return permitidos.includes(p.p);
      }
    }
    return true;
  });

  // Actualizar valores por defecto cuando cambia la pestaña activa o la lista de programas
  useEffect(() => {
    if (selectedProgram === '') {
      return; // Si el programa se borró o se limpió explícitamente, lo dejamos vacío
    }
    if (programasFinales.length > 0) {
      // Verificar si el programa seleccionado actual existe en la lista final
      const existe = programasFinales.some(p => p.p === selectedProgram);
      if (!existe) {
        setSelectedProgram('');
      }
    } else {
      setSelectedProgram('');
    }
  }, [activeTab, activeSubTabEN, selectedArea, selectedExperiencia]);

  // Obtener áreas distintas para filtrar
  const areasDistintas = Array.from(new Set(programasBrutos.map(p => p.a))).sort();

  // Obtener detalles del programa actual
  const datosProgActual = programasFinales.find(p => p.p === selectedProgram);
  const nivelDetectado = datosProgActual ? datosProgActual.v : 'medio';

  // Obtener fechas de inicio para el programa actual
  const fechasInicioPrograma = selectedProgram ? (INICIO_BY_PROG[selectedProgram] || []) : [];

  // Ayudante de distintivo de nivel
  const renderDistintivoNivel = (nivel: string) => {
    const clavesEspeciales = ['arq', 'arqsw', 'doc_esp', 'unico', 'uve', 'unag'];
    if (clavesEspeciales.includes(nivel)) {
      return <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Alianza / Especial</span>;
    }
    if (nivel === 'alto') {
      return <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Pricing Alto</span>;
    }
    if (nivel === 'bajo') {
      return <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">Pricing Bajo</span>;
    }
    return <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">Pricing Medio</span>;
  };

  const esLic = activeTab === 'lic' || (activeTab === 'en' && activeSubTabEN === 'lic');
  const esMae = activeTab === 'mae' || (activeTab === 'en' && activeSubTabEN === 'mae');

  const compIsSpecialUVE = esLic && (selectedProgram?.toUpperCase() === 'UVE' || selectedProgram?.toUpperCase() === 'PSICOLOGÍA' || selectedProgram?.toUpperCase().includes('UVE'));
  const compIsSpecialUNICA = esLic && (['UNICA', 'ARTE DIGITAL Y MULTIMEDIA', 'MARKETING Y PUBLICIDAD', 'MEDIOS DIGITALES', 'COMUNICACIÓN CORPORATIVA'].includes(selectedProgram?.toUpperCase()) || (selectedProgram?.toUpperCase().includes('UNICA') && !selectedProgram?.toUpperCase().includes('COMUNICAC')));
  const isUnicaOrUve = compIsSpecialUVE || compIsSpecialUNICA;

  // Diplomado seleccionado
  const opcionDipActual = esModoDiplomado() ? getDipOptions().find(o => o.value === selectedDiplomado) : null;
  const duracionDipActual = opcionDipActual?.dur || '6m';

  function esModoDiplomado() {
    return activeTab === 'dip';
  }

  // Manejar elección de programa
  const seleccionarOpcion = (prog: CatalogItem) => {
    setSelectedProgram(prog.p);
  };

  return (
    <div className="w-full text-gray-800 dark:text-slate-100">
      {/* HEADER BAR */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-6 py-4 sticky top-0 z-30 shadow-xs mb-6 rounded-b-xl transition-colors duration-200">
        <div className="flex items-center space-x-3 mb-2 md:mb-0">
          <div className="flex items-center gap-2">
            <img src="https://cmsutel.s3.amazonaws.com/Group_710dc02780.svg" alt="UTEL Logo" className="h-8 w-auto" referrerPolicy="no-referrer" />
          </div>
          <div className="h-4 w-[1px] bg-gray-300 dark:bg-slate-700"></div>
          <span className="text-gray-400 dark:text-slate-500 text-xs font-semibold tracking-wider">
            v2.1
          </span>
        </div>

        {/* VIEW MODE SWITCHER IN THE NAV BAR */}
        {viewMode && setViewMode && (
          <div className="flex justify-center my-3 md:my-0">
            <div className="inline-flex p-1 bg-gray-150/80 dark:bg-slate-950/60 rounded-xl border border-gray-200 dark:border-slate-800/80">
              <button
                onClick={() => setViewMode('individual')}
                className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'individual'
                    ? 'bg-indigo-600 text-white shadow-sm font-extrabold'
                    : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                <Sliders className="h-3.5 w-3.5" /> Cotizador
              </button>
              <button
                onClick={() => setViewMode('double')}
                className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'double'
                    ? 'bg-indigo-600 text-white shadow-sm font-extrabold'
                    : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                <ArrowRightLeft className="h-3.5 w-3.5" /> Comparador
              </button>
              <button
                onClick={() => setViewMode('comparativa')}
                className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'comparativa'
                    ? 'bg-indigo-600 text-white shadow-sm font-extrabold'
                    : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" /> Comparativa
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {onToggleDomiciliacion ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggleDomiciliacion}
              className="text-xs bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-full font-bold border border-emerald-200 dark:border-emerald-900/40 flex items-center gap-1.5 transition-colors cursor-pointer select-none"
              title="Cambiar domiciliación (5% / 10%)"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Domiciliación {domiciliacionPct}%</span>
            </motion.button>
          ) : (
            <span className="text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-full font-semibold border border-emerald-100 dark:border-emerald-900/40 flex items-center gap-1">
              <span>Domiciliación {domiciliacionPct}%</span>
            </span>
          )}

          {/* Public Theme Picker */}
          {setIsThemePanelOpen && (
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsThemePanelOpen(!isThemePanelOpen)}
                className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-center shadow-2xs ${
                  isThemePanelOpen 
                    ? 'bg-indigo-600 text-white border-indigo-700' 
                    : 'bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400'
                }`}
                title="Personalizar Tema"
              >
                <Palette className="h-4 w-4" />
              </motion.button>

              <AnimatePresence>
                {isThemePanelOpen && setPrimaryColor && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsThemePanelOpen(false)}
                      className="fixed inset-0 z-40"
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-2xl z-50 p-4"
                    >
                      <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-3">Color de Marca</h4>
                      <div className="grid grid-cols-4 gap-2 mb-4">
                        {colorPresets?.map(color => (
                          <button
                            key={color}
                            onClick={() => setPrimaryColor(color)}
                            className="h-10 w-full rounded-lg border-2 border-transparent hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center relative overflow-hidden"
                            style={{ backgroundColor: color }}
                          >
                            {primaryColor === color && (
                              <Check className="h-5 w-5 text-white drop-shadow-md" />
                            )}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Color Personalizado</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="h-10 w-10 min-w-[40px] cursor-pointer bg-transparent border-0 outline-none p-0 overflow-hidden rounded-lg"
                          />
                          <input 
                            type="text" 
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="text-xs font-mono flex-1 bg-gray-50 dark:bg-slate-800 border-0 rounded-lg p-2 text-center"
                          />
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}

          {setIsDarkTheme && (
            <motion.button
              whileHover={{ scale: 1.1, rotate: 10 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsDarkTheme(!isDarkTheme)}
              className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 text-gray-550 dark:text-slate-350 transition-all cursor-pointer flex items-center justify-center active:scale-95 shadow-2xs"
              title={isDarkTheme ? "Cambiar a formato claro" : "Cambiar a formato oscuro"}
            >
              {isDarkTheme ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-indigo-600" />}
            </motion.button>
          )}

          {onLogout && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onLogout}
              className="p-2 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-slate-800 dark:hover:bg-red-950/20 border border-red-200 dark:border-slate-700 text-red-650 dark:text-red-400 transition-all cursor-pointer flex items-center justify-center shadow-2xs"
              title="Cerrar Sesión (Bloquear)"
            >
              <Lock className="h-4 w-4" />
            </motion.button>
          )}

          {onOpenAdmin && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onOpenAdmin}
              className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 transition-all cursor-pointer flex items-center justify-center shadow-2xs"
              title="Administración"
            >
              <Settings className="h-4 w-4" />
            </motion.button>
          )}

          {onExport && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onExport}
              className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 transition-all cursor-pointer flex items-center justify-center shadow-2xs"
              title="Exportar Datos"
            >
              <ExternalLink className="h-4 w-4" />
            </motion.button>
          )}

          {onNewQuote && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onNewQuote}
              className="text-xs bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold px-4 py-2 rounded-lg border border-indigo-200 dark:border-indigo-900/40 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Nueva Cotización
            </motion.button>
          )}
        </div>
      </header>

      {!onlyHeader && (
        <>

      {/* SUB-TABS FOR EJECUTIVA TAB ONLY */}
      {activeTab === 'en' && (
        <div className="flex gap-2 max-w-md mx-auto mb-6 bg-gray-100 dark:bg-slate-800 p-1 rounded-lg transition-colors">
          {[
            { id: 'lic', label: 'Licenciatura' },
            { id: 'mae', label: 'Maestría' }
          ].map(subTab => (
            <motion.button
              key={subTab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setActiveSubTabEN(subTab.id);
                setSelectedArea('');
                setSelectedExperiencia(null);
              }}
              className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-md transition-all cursor-pointer relative ${
                activeSubTabEN === subTab.id
                  ? 'text-blue-700 dark:text-blue-400'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
              }`}
            >
              {subTab.label}
              {activeSubTabEN === subTab.id && (
                <motion.div
                  layoutId="activeSubTab"
                  className="absolute inset-0 bg-white dark:bg-slate-900 rounded-md shadow-xs -z-1"
                />
              )}
            </motion.button>
          ))}
        </div>
      )}

      {/* FILTERS CARD */}
      <motion.div 
        layout
        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-6 shadow-sm mb-6 transition-colors"
      >
        <AnimatePresence mode="wait">
          {activeTab === 'pu' ? (
            <motion.div 
              key="pu-filters"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
            <div className="flex flex-col min-w-[200px]">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1.5 flex items-center gap-1">
                <span>🎓 Nivel Académico</span>
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              </label>
              <select
                value={activeTab}
                onChange={(e) => {
                  setActiveTab(e.target.value);
                  setSelectedArea('');
                  setSelectedExperiencia(null);
                }}
                className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-slate-200 outline-none focus:border-indigo-500 transition-all font-bold cursor-pointer"
              >
                <option value="lic">Licenciaturas</option>
                <option value="mae">Maestrías</option>
                <option value="doc">Doctorado</option>
                <option value="pu">Pagos Únicos</option>
                <option value="dip">Diplomados</option>
                <option value="en">Ejecutiva</option>
              </select>
            </div>
            <div className="p-3 bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-100/30 dark:border-indigo-900/10 rounded-xl text-xs text-indigo-650 dark:text-indigo-400 font-medium">
              💡 <strong>Pagos Únicos:</strong> No se requieren filtros para esta modalidad. Revisa las tablas y resultados comparativos abajo.
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="standard-filters"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
          >
            {/* 1. ACADEMIC LEVEL SELECTOR (NOW FIRST) */}
            <div className="flex flex-col">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1.5 flex items-center gap-1 font-sans">
                <span>🎓 Nivel Académico</span>
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              </label>
              <select
                value={activeTab}
                onChange={(e) => {
                  setActiveTab(e.target.value);
                  setSelectedArea('');
                  setSelectedExperiencia(null);
                }}
                className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-slate-200 outline-none focus:border-indigo-500 transition-all font-bold cursor-pointer"
              >
                <option value="lic">Licenciaturas</option>
                <option value="mae">Maestrías</option>
                <option value="doc">Doctorado</option>
                <option value="pu">Pagos Únicos</option>
                <option value="dip">Diplomados</option>
                <option value="en">Ejecutiva</option>
              </select>
            </div>

            {/* 2. PROGRAM SELECTOR PER LEVEL */}
            {activeTab !== 'dip' && (
              <div className="flex flex-col col-span-1 sm:col-span-2">
                <SearchableSelect
                  label={`Programa de ${activeTab === 'lic' ? 'Licenciatura' : activeTab === 'mae' ? 'Maestría' : activeTab === 'doc' ? 'Doctorado' : 'Interés'}`}
                  options={programasFinales}
                  value={selectedProgram}
                  onChange={(val) => setSelectedProgram(val)}
                  placeholder="Escribe para buscar..."
                />
              </div>
            )}

            {activeTab === 'dip' && (
              <div className="flex flex-col col-span-1 sm:col-span-2">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1.5">Programa</label>
                <select
                  value={selectedDiplomado}
                  onChange={(e) => setSelectedDiplomado(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-slate-200 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <optgroup label="6 meses">
                    {getDipOptions().filter(o => o.dur === '6m').map(o => (
                      <option key={o.value} value={o.value}>{o.value}</option>
                    ))}
                  </optgroup>
                  <optgroup label="8 meses">
                    {getDipOptions().filter(o => o.dur === '8m').map(o => (
                      <option key={o.value} value={o.value}>{o.value}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
            )}

            {/* 3. JORNADA - Only for Licenciaturas */}
            {esLic && (
              <div className="flex flex-col">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1.5">Jornada</label>
                <select 
                  value={selectedJornada}
                  onChange={(e) => setSelectedJornada(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-slate-200 outline-none focus:border-indigo-500 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={isUnicaOrUve}
                >
                  <option value="intensiva">Jornada Intensiva</option>
                  {!isUnicaOrUve && <option value="completa">Jornada Completa</option>}
                  {!isUnicaOrUve && <option value="superintensiva">Jornada Superintensiva</option>}
                </select>
              </div>
            )}

            {/* DIPLOMADO DURACIÓN - ONLY ON DIP TAB */}
            {activeTab === 'dip' && (
              <div className="flex flex-col">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-450 mb-1.5">Duración</label>
                <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm font-semibold text-indigo-700 dark:text-indigo-400 text-center h-[38px] flex items-center justify-center">
                  {duracionDipActual === '6m' ? '6 meses' : '8 meses'}
                </div>
              </div>
            )}

            {/* DIPLOMADO VARIANTE (ESCALONADOS) - ONLY ON DIP TAB */}
            {activeTab === 'dip' && (
              <div className="flex flex-col col-span-1 sm:col-span-2">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-450 mb-1.5">Variante</label>
                <select
                  value={selectedDiplomadoVariante}
                  onChange={(e) => setSelectedDiplomadoVariante(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-slate-200 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                >
                  {duracionDipActual === '6m' ? (
                    <option value="esc1">Escalonado (mes 1: $699, mes 2: $1.699)</option>
                  ) : (
                    <>
                      <option value="esc1">Escalonado 1 (mes 1-2: $1,000)</option>
                      <option value="esc2">Escalonado 2 (mes 1: $699, mes 2: $1,199)</option>
                    </>
                  )}
                </select>
              </div>
            )}

            {/* 4. FECHA DE INICIO */}
            {activeTab !== 'dip' && (
              <div className="flex flex-col">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1.5">Fecha de inicio</label>
                <select
                  value={selectedStartDate}
                  onChange={(e) => setSelectedStartDate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-slate-200 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="">— Seleccionar —</option>
                  {fechasInicioPrograma.map(date => (
                    <option key={date} value={date}>{date}</option>
                  ))}
                  {/* Default backfills if none */}
                  {fechasInicioPrograma.length === 0 && (INICIO_DATES[activeTab === 'en' ? activeSubTabEN : activeTab] || []).map(date => (
                    <option key={date} value={date}>{date}</option>
                  ))}
                </select>
              </div>
            )}

            {/* 5. LEAD FILTER - Hidden for Diplomados */}
            {activeTab !== 'dip' && (
              <div className="flex flex-col">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1.5">Lead</label>
                <select
                  value={selectedLead}
                  onChange={(e) => setSelectedLead(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-slate-200 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="hot">Hot Lead</option>
                  {esLic ? (
                    <>
                      <option value="rmkt30">RMKT +30 días</option>
                      <option value="rmkt60">RMKT +60 días</option>
                    </>
                  ) : (
                    <option value="rmkt">RMKT</option>
                  )}
                </select>
              </div>
            )}

            {/* DETECTED PRICING LEVEL BADGE */}
            {activeTab !== 'dip' && (
              <div className="flex flex-col justify-end pb-1 h-full min-h-[50px]">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1.5">Pricing del Plan</label>
                <div className="flex items-center gap-2">
                  {renderDistintivoNivel(nivelDetectado)}
                </div>
              </div>
            )}
          </motion.div>
        )}
        </AnimatePresence>
      </motion.div>
        </>
      )}

    </div>
  );
};
