import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CATALOG, LISTA, LISTA_MAP, PROG, ACCS, EJE_PKG_MAP, HIB_PKG_MAP, HIB_ESC_MAP } from './data/catalogs';
import { getPrice } from './utils/calculo_cotizacion/quoteUtils';
import { QuoteForm } from './components/cotizador/QuoteForm';
import { QuoteResult } from './components/cotizador/QuoteResult';
import { QuoteComparator } from './components/cotizador/QuoteComparator';
import { CompetitorComparison } from './components/cotizador/CompetitorComparison';
import { MonitorPlay, UsersRound, Maximize2, Minimize2, X, Briefcase, RefreshCw, ExternalLink } from 'lucide-react';
import { FloatingChatButton } from './components/ia_asistente/FloatingChatButton';
import { AdminScreen } from './components/administracion/AdminScreen';
import type { PreciosConfig, AppConfig } from './types';
import { api } from '../../lib/api';
import { useAuthStore } from '../../auth/authStore';

// Helper to generate a simple tint/shade (simplified for CSS variables)
const generateShades = (hex: string) => {
  return {
    '--primary-50': `${hex}10`, // 10% opacity
    '--primary-100': `${hex}25`,
    '--primary-400': hex,
    '--primary-500': hex,
    '--primary-600': hex,
    '--primary-700': hex,
    '--primary-900': hex,
  };
};

const COLOR_PRESETS = [
  '#39B54A', // Utel Green
  '#2563EB', // Blue
  '#7C3AED', // Violet
  '#DB2777', // Pink
  '#EA580C', // Orange
  '#059669', // Emerald
  '#DC2626', // Red
  '#0891B2', // Cyan
];

interface CotizadorModuleProps {
  darkMode: boolean;
}

export function CotizadorModule({ darkMode }: CotizadorModuleProps) {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Botones para elegir qué nivel estudiar (prepa, uni, maestría)
  const [activeTab, setActiveTab] = useState<string>('lic');
  const [activeSubTabEN, setActiveSubTabEN] = useState<string>('lic');

  // Selecciones del formulario y automatización de U-Camp para ingenierías
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedLead, setSelectedLead] = useState<string>('hot');
  const [selectedStartDate, setSelectedStartDate] = useState<string>('18/05/2026');
  const [selectedZona, setSelectedZona] = useState<string>('std');
  const [selectedExperiencia, setSelectedExperiencia] = useState<string | null>(null);
  const [selectedJornada, setSelectedJornada] = useState<string>('intensiva');
  const [viewMode, setViewMode] = useState<'individual' | 'double' | 'comparativa'>('individual');

  const handleSyncToMain = (config: any) => {
    setActiveTab(config.activeTab);
    setActiveSubTabEN(config.activeSubTabEN);
    setSelectedProgram(config.selectedProgram);
    setSelectedLead(config.selectedLead);
    setSelectedStartDate(config.selectedStartDate);
    setSelectedZona(config.selectedZona);
    setSelectedExperiencia(config.selectedExperiencia);

    // Set selected chips
    const secKey = config.activeTab === 'en' ? config.activeSubTabEN : config.activeTab;
    setSelectedChips(prev => ({
      ...prev,
      [secKey]: config.selectedChips
    }));

    setSelectedJornada(config.selectedJornada);
    setUveVariant(config.uveVariant);
    setUnicaVariant(config.unicaVariant);
    setSelectedDiplomado(config.selectedDiplomado);
    setSelectedDiplomadoVariante(config.selectedDiplomadoVariante);

    // Switch back to single/standard calculator mode so the advisor can view/profile
    setViewMode('individual');
  };

  // Al seleccionar cualquier programa, agregamos Platzi automáticamente por defecto
  useEffect(() => {
    if (selectedProgram) {
      const secKey = activeTab === 'en' ? activeSubTabEN : activeTab;
      setSelectedChips((prev) => {
        const sectionObj = prev[secKey] || {};
        // Se activa Platzi de forma automática al elegir cualquier programa
        return {
          ...prev,
          [secKey]: {
            ...sectionObj,
            platzi: true,
            platziAuto: true
          }
        };
      });
    }
  }, [selectedProgram, activeTab, activeSubTabEN]);

  // Forzar Jornada Intensiva para UNICA y UVE
  useEffect(() => {
    const isLic = activeTab === 'lic' || (activeTab === 'en' && activeSubTabEN === 'lic');
    if (isLic && selectedProgram) {
      const isSpecialUVE = (selectedProgram.toUpperCase() === 'UVE' || selectedProgram.toUpperCase() === 'PSICOLOGÍA' || selectedProgram.toUpperCase().includes('UVE'));
      const isSpecialUNICA = (['UNICA', 'ARTE DIGITAL Y MULTIMEDIA', 'MARKETING Y PUBLICIDAD', 'MEDIOS DIGITALES', 'COMUNICACIÓN CORPORATIVA'].includes(selectedProgram.toUpperCase()) || (selectedProgram.toUpperCase().includes('UNICA') && !selectedProgram.toUpperCase().includes('COMUNICAC')));
      if (isSpecialUVE || isSpecialUNICA) {
        setSelectedJornada('intensiva');
      }
    }
  }, [selectedProgram, activeTab, activeSubTabEN]);

  // Diplomados specific
  const [selectedDiplomado, setSelectedDiplomado] = useState<string>("Actualización en Gineco-obstetricia para el primer y segundo nivel de atención");
  const [selectedDiplomadoVariante, setSelectedDiplomadoVariante] = useState<string>("esc1");

  // Special variants
  const [uveVariant, setUveVariant] = useState<string>('alto');
  const [unicaVariant, setUnicaVariant] = useState<string>('alto');

  // States for external links modal
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [isMaximized, setIsMaximized] = useState(false);

  const openPortal = (url: string) => {
    setActiveUrl(url);
    setIframeKey(prev => prev + 1);
  };

  // --- Theme/Color Settings (Public) ---
  const [isThemePanelOpen, setIsThemePanelOpen] = useState(false);

  // Selected optional chips per section
  const [selectedChips, setSelectedChips] = useState<Record<string, Record<string, boolean>>>({
    lic: {},
    mae: {},
    ms: {},
    doc: {}
  });

  // --- Configuración dinámica del administrador y pantallas ---
  const [currentScreen, setCurrentScreen] = useState<'calculator' | 'admin'>('calculator');
  const [adminConfig, setAdminConfig] = useState<AppConfig>({
    domiciliacion: 5,
    tituloCosto0: false,
    platziPreview: false,
    primaryColor: '#39B54A',
    firmaCopiar: false,
    bloquearInspeccion: false
  });

  // Apply Palette colors (scoped to este módulo, no toca :root global del visor)
  useEffect(() => {
    const root = wrapperRef.current || document.documentElement;
    const colors = generateShades(adminConfig.primaryColor);

    Object.entries(colors).forEach(([variable, value]) => {
      root.style.setProperty(variable, value);
    });
  }, [adminConfig.primaryColor]);

  const [precios, setPrecios] = useState<PreciosConfig>(() => {
    const cached = localStorage.getItem('utel_precios');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }
    return {
      inscripcion: 1500,
      mensualidad: 2470,
      cuotaSep: 500,
      seguro: 100
    };
  });

  const [matrixRevision, setMatrixRevision] = useState(0);

  // Guardar precios base cuando cambien
  useEffect(() => {
    localStorage.setItem('utel_precios', JSON.stringify(precios));
  }, [precios]);

  // Cargar matriz custom (PROG) y precios base del servidor al inicio si existen
  useEffect(() => {
    // 1. Cargar rápido del caché de LocalStorage para respuesta instantánea
    const cachedProg = localStorage.getItem('utel_custom_prog');
    if (cachedProg) {
      try {
        const parsed = JSON.parse(cachedProg);
        Object.assign(PROG, parsed);
        setMatrixRevision(prev => prev + 1);
      } catch (e) {}
    }

    const cachedAccs = localStorage.getItem('utel_custom_accs');
    if (cachedAccs) {
      try {
        const parsed = JSON.parse(cachedAccs);
        Object.assign(ACCS, parsed);
        setMatrixRevision(prev => prev + 1);
      } catch (e) {}
    }

    // 2. Fetch en segundo plano desde el servidor para sincronizar precios reales
    api.get('/cotizador/settings')
      .then((res) => {
        const data = res.data?.settings;
        if (data) {
          if (data.precios) {
            setPrecios(data.precios);
            localStorage.setItem('utel_precios', JSON.stringify(data.precios));
          }
          if (data.prog) {
            Object.assign(PROG, data.prog);
            localStorage.setItem('utel_custom_prog', JSON.stringify(data.prog));
            setMatrixRevision(prev => prev + 1);
          }
          if (data.accs) {
            Object.assign(ACCS, data.accs);
            localStorage.setItem('utel_custom_accs', JSON.stringify(data.accs));
            setMatrixRevision(prev => prev + 1);
          }
        }
      })
      .catch((err) => {
        console.warn('No se pudo conectar al servidor para obtener precios sincronizados. Usando caché local.', err);
      });
  }, []);

  const handleMatrixEdit = () => {
    localStorage.setItem('utel_custom_prog', JSON.stringify(PROG));
    setMatrixRevision(prev => prev + 1);
  };

  const handleSaveToServer = async (): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      await api.post('/cotizador/settings', {
        precios,
        prog: PROG,
        accs: ACCS
      });
      return { success: true, message: '¡Precios y matriz guardados permanentemente en el servidor!' };
    } catch (error: any) {
      console.error('Error saving prices to server:', error);
      return { success: false, error: error?.response?.data?.error || error?.message || 'Error de conexión con el servidor.' };
    }
  };

  // Cargar configuración (local primero, luego sincronizar con el servidor)
  useEffect(() => {
    // Config setup from LocalStorage first
    const cachedCfg = localStorage.getItem('utel_cfg');
    if (cachedCfg) {
      try {
        const c = JSON.parse(cachedCfg);
        setAdminConfig({
          domiciliacion: c.dom ?? 5,
          tituloCosto0: c.tit0 ?? false,
          platziPreview: c.plat ?? false,
          primaryColor: c.primaryColor ?? '#39B54A',
          firmaCopiar: c.firmaCopiar ?? false,
          bloquearInspeccion: c.bloquearInspeccion ?? false
        });
      } catch (e) {}
    }

    // Sincronizar de forma segura con el servidor (InsForge)
    api.get('/cotizador/settings')
      .then((res) => {
        const data = res.data?.settings;
        if (data) {
          const dom = data.domiciliacion ?? 5;
          const tit0 = data.tituloCosto0 ?? false;
          const plat = data.platziPreview ?? false;
          const fCopiar = data.firmaCopiar ?? false;
          const bInspeccion = data.bloquearInspeccion ?? false;
          setAdminConfig({
            domiciliacion: dom,
            tituloCosto0: tit0,
            platziPreview: plat,
            primaryColor: data.primaryColor ?? '#39B54A',
            firmaCopiar: fCopiar,
            bloquearInspeccion: bInspeccion
          });
          localStorage.setItem('utel_cfg', JSON.stringify({
            dom,
            tit0,
            plat,
            primaryColor: data.primaryColor ?? '#39B54A',
            firmaCopiar: fCopiar,
            bloquearInspeccion: bInspeccion
          }));
        }
      })
      .catch(() => {});
  }, []);

  // Bloquear clic derecho (menú contextual) y combinaciones de teclas de inspección para proteger contra la vista directa de código
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (!adminConfig.bloquearInspeccion) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!adminConfig.bloquearInspeccion) return;

      // Bloquear tecla F12
      if (e.key === 'F12') {
        e.preventDefault();
        return;
      }
      // Bloquear Ctrl+Shift+I (Inspeccionar), Ctrl+Shift+C (Inspeccionar elemento), Ctrl+Shift+J (Consola), Ctrl+U (Ver código fuente), Ctrl+S (Guardar)
      if (
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'C' || e.key === 'c' || e.key === 'J' || e.key === 'j')) ||
        (e.ctrlKey && (e.key === 'U' || e.key === 'u' || e.key === 'S' || e.key === 's'))
      ) {
        e.preventDefault();
        return;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [adminConfig.bloquearInspeccion]);

  // Guardar configuración admin en el servidor (persistencia vía InsForge)
  const saveAdminSettings = (
    domVal: number,
    titVal: boolean,
    platVal: boolean,
    colorVal: string,
    firmaCopiarVal: boolean = adminConfig.firmaCopiar ?? false,
    bloquearInspeccionVal: boolean = adminConfig.bloquearInspeccion ?? false
  ) => {
    const nextCfg = {
      dom: domVal,
      tit0: titVal,
      plat: platVal,
      primaryColor: colorVal,
      firmaCopiar: firmaCopiarVal,
      bloquearInspeccion: bloquearInspeccionVal
    };
    setAdminConfig({
      domiciliacion: domVal,
      tituloCosto0: titVal,
      platziPreview: platVal,
      primaryColor: colorVal,
      firmaCopiar: firmaCopiarVal,
      bloquearInspeccion: bloquearInspeccionVal
    });
    localStorage.setItem('utel_cfg', JSON.stringify(nextCfg));

    api.post('/cotizador/settings', {
      domiciliacion: domVal,
      tituloCosto0: titVal,
      platziPreview: platVal,
      primaryColor: colorVal,
      firmaCopiar: firmaCopiarVal,
      bloquearInspeccion: bloquearInspeccionVal
    })
      .then(() => {})
      .catch(() => {});
  };

  const handleNewQuote = () => {
    setActiveTab('lic');
    setActiveSubTabEN('lic');
    setSelectedArea('');
    setSelectedProgram('');
    setSelectedLead('hot');
    setSelectedStartDate('18/05/2026');
    setSelectedZona('std');
    setSelectedExperiencia(null);
    setSelectedJornada('intensiva');
    setSelectedChips({
      lic: {},
      mae: {},
      ms: {},
      doc: {}
    });
    setUveVariant('alto');
    setUnicaVariant('alto');
    setSelectedDiplomado("Actualización en Gineco-obstetricia para el primer y segundo nivel de atención");
    setSelectedDiplomadoVariante("esc1");
    setViewMode('individual');
  };

  // Manejo del cambio de complementos (chips) por sección educativa
  const handleToggleChip = (chipId: string) => {
    const secKey = activeTab === 'en' ? activeSubTabEN : activeTab;
    setSelectedChips(prev => {
      const sectionObj = prev[secKey] || {};
      const nextVal = !sectionObj[chipId];

      const updatedSec = { ...sectionObj, [chipId]: nextVal };

      // Si el usuario cambia manualmente U-Camp, deshabilitamos el flag de selección automática
      if (chipId === 'ucamp') {
        updatedSec['ucampAuto'] = false;
      }

      // Si el usuario cambia manualmente Platzi, deshabilitamos el flag de selección automática
      if (chipId === 'platzi') {
        updatedSec['platziAuto'] = false;
      }

      // Lógica exclusiva para Welbe Premium
      if (chipId === 'welbep') {
        updatedSec['welbe_opted_out'] = nextVal;
      }

      // Exclusividad mutua para las experiencias (Ejecutiva, Joven, Híbrida)
      const expIds = ['seseje', 'utelj', 'hibrid'];
      if (expIds.includes(chipId) && nextVal === true) {
        expIds.forEach(eid => {
          if (eid !== chipId) {
            updatedSec[eid] = false;
          }
        });
      }

      return {
        ...prev,
        [secKey]: updatedSec
      };
    });
  };

  // exportAllData extracts direct list and formats as flat JSON payload
  const handleExportData = () => {
    const V_LIC_TO_PROG = (v: string, progName: string): string | null => {
      const n = progName.toUpperCase();
      if (v === 'arq') return 'arquitectura';
      if (v === 'rob') return 'robotica';
      if (v === 'uve') return 'uve';
      if (v === 'unica') return 'unica';
      if (v === 'arqsw') return null;
      if (n.includes('ARQUITECTURA')) return 'arquitectura';
      if (n.includes('ROB')) return 'robotica';
      if (n.includes('INGENIER')) return 'ingenieria';
      return 'online_general';
    };

    const buildFlatRows = (
      nivelLabel: string,
      progName: string,
      area: string,
      progKey: string | null,
      leads: Array<{ k: string; label: string }>,
      experiencias: Array<{ k: string | null; label: string; price: number }>,
      domPct: number
    ) => {
      const rows: any[] = [];
      if (!progKey || PROG[progKey] === 'special') return rows;

      leads.forEach(lead => {
        const e = getPrice(progKey, nivelLabel, lead.k, 'intensiva', false);
        if (!e) return;

        experiencias.forEach(exp => {
          const prices = e.p.map((v: number, i: number) => {
            return i >= 2 ? v + (exp.price || 0) : v;
          });
          const maxP = Math.max(...prices);
          const lista = (e.pkg && LISTA_MAP[e.pkg]) || LISTA;
          const beca = lista > 0 ? Math.max(0, 1 - maxP / lista) : 0;
          const ejeMap = EJE_PKG_MAP[e.pkg] || null;
          const hibPkg = HIB_PKG_MAP[e.pkg] || e.pkg;
          const hibEsc = HIB_ESC_MAP[e.pkg] || e.esc;

          rows.push({
            nivel: nivelLabel,
            programa: progName,
            area: area,
            lead: lead.label,
            experiencia: exp.label,
            paquete: e.pkg,
            escalonado: e.esc,
            paquete_ejecutivo: ejeMap ? ejeMap.pkg : null,
            escalonado_ejecutivo: ejeMap ? (ejeMap.esc || null) : null,
            paquete_hibrido: hibPkg !== e.pkg ? hibPkg : e.pkg,
            escalonado_hibrido: hibEsc !== e.esc ? hibEsc : e.esc,
            precio_lista: lista,
            beca_pct: parseFloat((beca * 100).toFixed(1)),
            mes_1: prices[0],
            mes_2: prices[1],
            mes_3_en_adelante: prices[4] || prices[2],
            domiciliacion_pct: domPct,
            con_domiciliacion: parseFloat((maxP * (1 - domPct / 100)).toFixed(0))
          });
        });
      });
      return rows;
    };

    const domPct = adminConfig.domiciliacion;
    const export_rows_lic: any[] = [];
    const export_rows_mae: any[] = [];
    const export_rows_doc: any[] = [];

    // LIC
    const licLeads = [{ k: 'hot', label: 'Hot Lead' }, { k: 'rmkt30', label: 'RMKT +30' }, { k: 'rmkt60', label: 'RMKT +60' }];
    const licExps = [
      { k: null, label: 'Sin experiencia', price: 0 },
      { k: 'seseje', label: 'Ejecutiva', price: 165 },
      { k: 'utelj', label: 'Utel Joven', price: 165 },
      { k: 'hibrid', label: 'Híbrida', price: 340 }
    ];
    (CATALOG['LICENCIATURA'] || []).forEach(item => {
      const nk = item.v;
      const key = V_LIC_TO_PROG(nk, item.p);
      if (nk === 'uve' || nk === 'unica') return;
      const niveles = nk === 'arq' || nk === 'rob' ? ['alto'] : ['alto', 'medio', 'bajo'];
      niveles.forEach(niv => {
        const rows = buildFlatRows(niv, item.p, item.a, key, licLeads, licExps, domPct);
        rows.forEach(r => {
          r.nivel_detected = niv;
          export_rows_lic.push(r);
        });
      });
    });

    // MAE
    const maeLeads = [{ k: 'hot', label: 'Hot Lead' }, { k: 'rmkt30', label: 'RMKT +30' }];
    const maeExps = [
      { k: null, label: 'Sin experiencia', price: 0 },
      { k: 'seseje', label: 'Ejecutiva', price: 165 },
      { k: 'hibrid', label: 'Híbrida', price: 395 }
    ];
    (CATALOG['MAESTRÍA'] || []).forEach(item => {
      const nk = item.v;
      if (nk === 'unag') return;
      const key = nk === 'arqsw' ? 'arq_software' : 'mae_online';
      const niveles = nk === 'arqsw' ? ['alto'] : ['alto', 'medio', 'bajo'];
      niveles.forEach(niv => {
        const rows = buildFlatRows(niv, item.p, item.a, key, maeLeads, maeExps, domPct);
        rows.forEach(r => {
          r.nivel_detected = niv;
          export_rows_mae.push(r);
        });
      });
    });

    // DOC
    const docLeads = [{ k: 'hot', label: 'Hot Lead' }, { k: 'rmkt', label: 'RMKT' }];
    const docExps = [{ k: null, label: 'Sin experiencia', price: 0 }];
    (CATALOG['DOCTORADO'] || []).forEach(item => {
      const key = item.v === 'doc_esp' ? 'doc_especial' : 'doctorado';
      const niveles = ['alto', 'medio', 'bajo'];
      niveles.forEach(niv => {
        const rows = buildFlatRows(niv, item.p, item.a, key, docLeads, docExps, domPct);
        rows.forEach(r => {
          r.nivel_detected = niv;
          export_rows_doc.push(r);
        });
      });
    });

    const finalExportObj = {
      meta: {
        descripcion: 'Exportación completa de datos — Calculadora Plan de Beca',
        version: '2.1',
        fecha_exportacion: new Date().toISOString().slice(0, 10),
        domiciliacion_pct: domPct,
        titulo_costo_0: adminConfig.tituloCosto0
      },
      catalog: {
        licenciatura: CATALOG['LICENCIATURA'],
        maestria: CATALOG['MAESTRÍA'],
        doctorado: CATALOG['DOCTORADO']
      },
      pricing_flat: {
        licenciatura: export_rows_lic,
        maestria: export_rows_mae,
        doctorado: export_rows_doc
      }
    };

    const blob = new Blob([JSON.stringify(finalExportObj, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `utel_precios_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const getFilteredChips = (): Record<string, boolean> => {
    const secKey = activeTab === 'en' ? activeSubTabEN : activeTab;
    const chips = selectedChips[secKey] || {};
    // Exclude auto flags so they are not rendered
    const { ucampAuto, platziAuto, ...rest } = chips;
    return rest;
  };

  return (
    <div
      ref={wrapperRef}
      className="cotizador-app h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 text-gray-800 dark:text-slate-100 pb-16 transition-colors duration-200"
    >
      {currentScreen === 'admin' && isAdmin ? (
        <AdminScreen
          config={adminConfig}
          precios={precios}
          onSave={(dom, tit0, plat, primaryColor, fCopiar, bInspeccion) => {
            saveAdminSettings(dom, tit0, plat, primaryColor, fCopiar, bInspeccion);
          }}
          setPrecios={setPrecios}
          onClose={() => setCurrentScreen('calculator')}
          passwordValidation={() => true}
          initialAuthenticated={isAdmin}
          onMatrixEdit={handleMatrixEdit}
          onSaveToServer={handleSaveToServer}
          isDarkTheme={darkMode}
          setIsDarkTheme={() => {}}
        />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key="app-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4"
          >
            {/* CORE CALCULATOR FORM */}
            <QuoteForm
              activeTab={activeTab}
              setActiveTab={(tab) => {
                setActiveTab(tab);
                setSelectedArea('');
              }}
              activeSubTabEN={activeSubTabEN}
              setActiveSubTabEN={(subTab) => {
                setActiveSubTabEN(subTab);
                setSelectedArea('');
              }}
              selectedArea={selectedArea}
              setSelectedArea={setSelectedArea}
              selectedProgram={selectedProgram}
              setSelectedProgram={setSelectedProgram}
              selectedLead={selectedLead}
              setSelectedLead={setSelectedLead}
              selectedStartDate={selectedStartDate}
              setSelectedStartDate={setSelectedStartDate}
              selectedZona={selectedZona}
              setSelectedZona={setSelectedZona}
              selectedExperiencia={selectedExperiencia}
              setSelectedExperiencia={setSelectedExperiencia}
              selectedDiplomado={selectedDiplomado}
              setSelectedDiplomado={setSelectedDiplomado}
              selectedDiplomadoVariante={selectedDiplomadoVariante}
              setSelectedDiplomadoVariante={setSelectedDiplomadoVariante}
              uveVariant={uveVariant}
              setUveVariant={setUveVariant}
              unicaVariant={unicaVariant}
              setUnicaVariant={setUnicaVariant}
              onExport={handleExportData}
              onNewQuote={handleNewQuote}
              onOpenAdmin={isAdmin ? () => setCurrentScreen('admin') : undefined}
              onLogout={() => {}}
              domiciliacionPct={adminConfig.domiciliacion}
              onToggleDomiciliacion={() => {
                const nextDom = adminConfig.domiciliacion === 10 ? 5 : 10;
                saveAdminSettings(nextDom, adminConfig.tituloCosto0, adminConfig.platziPreview, adminConfig.primaryColor);
              }}
              primaryColor={adminConfig.primaryColor}
              setPrimaryColor={(color) => saveAdminSettings(adminConfig.domiciliacion, adminConfig.tituloCosto0, adminConfig.platziPreview, color)}
              isThemePanelOpen={isThemePanelOpen}
              setIsThemePanelOpen={setIsThemePanelOpen}
              colorPresets={COLOR_PRESETS}
              isDarkTheme={darkMode}
              setIsDarkTheme={undefined}
              selectedJornada={selectedJornada}
              setSelectedJornada={setSelectedJornada}
              onlyHeader={viewMode !== 'individual'}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />

            <AnimatePresence mode="wait">
              {viewMode === 'comparativa' ? (
                <motion.div
                  key="mode-comparativa"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  transition={{ duration: 0.3 }}
                >
                  <CompetitorComparison />
                </motion.div>
              ) : viewMode === 'double' ? (
                <motion.div
                  key="mode-comparator"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  transition={{ duration: 0.3 }}
                >
                  <QuoteComparator
                    domiciliacionPct={adminConfig.domiciliacion}
                    tituloCosto0={adminConfig.tituloCosto0}
                    platziPreview={adminConfig.platziPreview}
                    precios={precios}
                    currentCalculatorState={{
                      activeTab,
                      activeSubTabEN,
                      selectedProgram,
                      selectedLead,
                      selectedStartDate,
                      selectedZona,
                      selectedExperiencia,
                      selectedChips: getFilteredChips(),
                      selectedJornada,
                      uveVariant,
                      unicaVariant,
                      selectedDiplomado,
                      selectedDiplomadoVariante
                    }}
                    onSyncToMain={handleSyncToMain}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="mode-classic"
                  initial={{ opacity: 0, y: -15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <QuoteResult
                    activeTab={activeTab}
                    activeSubTabEN={activeSubTabEN}
                    selectedProgram={selectedProgram}
                    selectedLead={selectedLead}
                    selectedStartDate={selectedStartDate}
                    selectedZona={selectedZona}
                    selectedExperiencia={selectedExperiencia}
                    setSelectedExperiencia={setSelectedExperiencia}
                    selectedDiplomado={selectedDiplomado}
                    selectedDiplomadoVariante={selectedDiplomadoVariante}
                    uveVariant={uveVariant}
                    unicaVariant={unicaVariant}
                    selectedChips={getFilteredChips()}
                    toggleChip={handleToggleChip}
                    domiciliacionPct={adminConfig.domiciliacion}
                    tituloCosto0={adminConfig.tituloCosto0}
                    platziPreview={adminConfig.platziPreview}
                    precios={precios}
                    selectedJornada={selectedJornada}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Floating Action Buttons (Left) */}
            <div className="fixed left-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-40">
              <div className="relative group/btn1 flex items-center">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openPortal('https://docs.google.com/forms/d/e/1FAIpQLSeMHdj48X09WEh6EBoAHsQPMYTfky5nz40uno2ag7AtO_KtEg/viewform?embedded=true')}
                  className="h-14 w-14 flex items-center justify-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-full shadow-xl hover:border-blue-500/50 transition-all cursor-pointer z-10 flex cursor-pointer text-inherit"
                >
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-2.5 rounded-full text-blue-600 dark:text-blue-400">
                    <MonitorPlay className="h-6 w-6" />
                  </div>
                </motion.button>
                <div className="absolute left-[calc(100%+12px)] opacity-0 group-hover/btn1:opacity-100 translate-x-2 group-hover/btn1:translate-x-0 transition-all duration-200 pointer-events-none">
                  <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg whitespace-nowrap">
                    Generar Demo
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-y-[6px] border-y-transparent border-r-[6px] border-r-slate-900 dark:border-r-white" />
                  </div>
                </div>
              </div>

              <div className="relative group/btn2 flex items-center">
                <motion.a
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  href="https://referidos.utel.edu.mx/auth-colaborador"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-14 w-14 flex items-center justify-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-full shadow-xl hover:border-emerald-500/50 transition-all cursor-pointer z-10 flex cursor-pointer text-inherit"
                >
                  <div className="bg-emerald-50 dark:bg-emerald-900/30 p-2.5 rounded-full text-emerald-600 dark:text-emerald-400">
                    <UsersRound className="h-6 w-6" />
                  </div>
                </motion.a>
                <div className="absolute left-[calc(100%+12px)] opacity-0 group-hover/btn2:opacity-100 translate-x-2 group-hover/btn2:translate-x-0 transition-all duration-200 pointer-events-none">
                  <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg whitespace-nowrap">
                    Referidos
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-y-[6px] border-y-transparent border-r-[6px] border-r-slate-900 dark:border-r-white" />
                  </div>
                </div>
              </div>

              <div className="relative group/btn3 flex items-center">
                <motion.a
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  href="https://salesmanager.s4learning.com/ras_web/mexico/vistas/login.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-14 w-14 flex items-center justify-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-full shadow-xl hover:border-violet-500/50 transition-all cursor-pointer z-10 flex cursor-pointer text-inherit"
                >
                  <div className="bg-violet-50 dark:bg-violet-900/30 p-2.5 rounded-full text-violet-600 dark:text-violet-400">
                    <Briefcase className="h-6 w-6" />
                  </div>
                </motion.a>
                <div className="absolute left-[calc(100%+12px)] opacity-0 group-hover/btn3:opacity-100 translate-x-2 group-hover/btn3:translate-x-0 transition-all duration-200 pointer-events-none">
                  <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg whitespace-nowrap">
                    Sales Manager
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-y-[6px] border-y-transparent border-r-[6px] border-r-slate-900 dark:border-r-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* System iFrame Modal */}
            <AnimatePresence>
              {activeUrl && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className={`transition-all duration-300 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden border border-gray-200 dark:border-slate-800 flex flex-col ${isMaximized ? 'fixed inset-0 w-full h-full rounded-none z-[60]' : 'w-full max-w-5xl h-[85vh] rounded-3xl'}`}
                  >
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                        <h3 className="font-bold text-gray-800 dark:text-slate-100 uppercase text-xs tracking-widest">Portal Externo UTEL</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setIframeKey(prev => prev + 1)}
                          className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm text-gray-600 dark:text-slate-300"
                          title="Recargar Portal"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </motion.button>
                        <motion.a
                          href={activeUrl!}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 transition-colors shadow-sm flex items-center justify-center cursor-pointer"
                          title="Abrir en pestaña nueva"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </motion.a>
                        <button
                          onClick={() => setIsMaximized(!isMaximized)}
                          className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                          title={isMaximized ? "Restaurar" : "Maximizar"}
                        >
                          {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => { setActiveUrl(null); setIsMaximized(false); }}
                          className="p-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors shadow-sm"
                          title="Cerrar"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="bg-white flex-1 relative">
                      <iframe
                        key={iframeKey}
                        src={activeUrl!}
                        className="absolute inset-0 w-full h-full border-0"
                        title="Contenido Externo"
                        allow="camera; microphone; geolocation; clipboard-write; display-capture"
                      />
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* SYSTEM DISCLAIMER MARGIN */}
            <footer className="text-center mt-12 text-[10px] text-gray-450 dark:text-slate-500 max-w-2xl mx-auto leading-relaxed border-t border-gray-200/50 dark:border-slate-800/80 pt-6">
              <div className="font-semibold text-gray-400/80 dark:text-slate-500 mb-1">CONFIDENCIAL — Solo para uso interno del equipo de admisiones UTEL</div>
              <div className="mb-2">
                Desarrollado por: <span className="font-bold text-gray-500 dark:text-slate-400">Ian Emiliano Jarquín Hernández</span> (ianidk1@gmail.com)
                <br/>
                Co-creación y validación: <span className="font-bold text-gray-500 dark:text-slate-400">Angel Didier Zuñiga Blanco</span> (andizuniga07@gmail.com)
              </div>
              Este simulador no constituye un documento oficial ni tiene carácter legal. Los precios mostrados son meramente orientativos y pueden estar sujetos a cambios según la normativa interna de la institución.
            </footer>

            {/* CHATBOT */}
            <FloatingChatButton />
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
