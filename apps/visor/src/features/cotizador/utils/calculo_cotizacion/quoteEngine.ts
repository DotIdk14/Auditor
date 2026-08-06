import {
  ACCS,
  CERT_IDS,
  DEFERRED_ACCS,
  ALWAYS_ACCS,
  PLAT_IDS,
  IDIOM_IDS,
  CATALOG,
  EXP_PRICES,
  EXP_PRICES_MAE,
  EJE_PKG_MAP,
  HIB_PKG_MAP,
  HIB_ESC_MAP,
  DIP_PRICES,
  LISTA_MAP,
  LISTA,
  PROG
} from '../../data/catalogs';
import {
  fmt,
  getDuracion,
  isBachillerato,
  getIncludedIds,
  getAccTotal,
  calculateBeca,
  getPrice,
  isPlatziVisible
} from './quoteUtils';
import { PreciosConfig } from '../../types';
import { findPrecioRecord } from '../../data/oferta_educativa/oferta_precios';

export interface QuoteInput {
  activeTab: string;
  activeSubTabEN: string;
  selectedProgram: string;
  selectedLead: string;
  selectedStartDate: string;
  selectedZona: string;
  selectedExperiencia: string | null;
  selectedDiplomado: string;
  selectedDiplomadoVariante: string;
  uveVariant: string;
  unicaVariant: string;
  selectedChips: Record<string, boolean>;
  selectedJornada: string;
}

export interface QuoteOutput {
  programName: string;
  academicLevel: string;
  duration: string;
  pkgName: string;
  escName: string;
  becaPercentNum: number;
  priceLista: number;
  rows: Array<{ label: string; base: number; acc: number; total: number; domValue: string }>;
  activeCerts: string[];
  activeAccs: string[];
  finalPrices: number[];
  baseInscripcion: number;
  becaInscripcion: number;
  colRegularVal: number;
  colBecaVal: number;
  compRegularVal: number;
  compBecaVal: number;
}

export function calculateQuote(
  input: QuoteInput,
  precios: PreciosConfig,
  domiciliacionPct: number,
  platziPreview: boolean,
  tituloCosto0: boolean
): QuoteOutput {
  const {
    activeTab,
    activeSubTabEN,
    selectedProgram,
    selectedLead,
    selectedStartDate,
    selectedZona,
    selectedExperiencia,
    selectedDiplomado,
    selectedDiplomadoVariante,
    uveVariant,
    unicaVariant,
    selectedChips,
    selectedJornada
  } = input;

  const getSectionKey = (): string => {
    if (activeTab === 'en') {
      return activeSubTabEN;
    }
    return activeTab;
  };

  const sec = getSectionKey();
  const isOnline = activeTab !== 'en' && activeTab !== 'dip';

  const getDipOptionsList = () => [
    { value: "Actualización en Gineco-obstetricia para el primer y segundo nivel de atención", dur: "6m" },
    { value: "Actualización en urgencias", dur: "6m" },
    { value: "Administración de los servicios de salud", dur: "6m" },
    { value: "Administración de proyectos", dur: "6m" },
    { value: "Administración financiera", dur: "6m" },
    { value: "Atención del adulto mayor", dur: "6m" },
    { value: "Coaching organizacional", dur: "6m" },
    { value: "Desarrollo e-learning", dur: "6m" },
    { value: "Dirección de operaciones", dur: "6m" },
    { value: "Diversidad y equidad de género", dur: "6m" },
    { value: "Educación en ciencias de la salud", dur: "6m" },
    { value: "Estrategia e innovacción de negocios", dur: "6m" },
    { value: "Gestión Sostenible de la Cadena de Suministro", dur: "6m" },
    { value: "Gestión curricular en educación a distancia", dur: "6m" },
    { value: "Gestión y eficiencia de sistemas energéticos", dur: "6m" },
    { value: "Mindfulness para los individuos y familias", dur: "6m" },
    { value: "Nutrición especial en enfermedades metabólicas", dur: "6m" },
    { value: "Pensamiento crítico e innovación", dur: "6m" },
    { value: "Principios en el Arte Digital y Animación", dur: "6m" },
    { value: "Project management", dur: "6m" },
    { value: "Pruebas Psicológicas para Adultos", dur: "6m" },
    { value: "Rehabilitación del adulto mayor", dur: "6m" },
    { value: "Soft skills y habilidades gerenciales", dur: "6m text-left truncate" },
    { value: "Tanatología", dur: "6m" },
    { value: "Transición y energía sostenible", dur: "6m" },
    { value: "Animación Digital y Creación de Contenidos", dur: "8m" },
    { value: "Análisis Económico Integral", dur: "8m" },
    { value: "Ciencia de datos e inteligencia artificial", dur: "8m" },
    { value: "Contabilidad y Gestión financiera", dur: "8m" },
    { value: "Creatividad visual y comunicación digital", dur: "8m" },
    { value: "Desarrollo de Medios Interactivos", dur: "8m" },
    { value: "Diseño y Desarrollo de Software", dur: "8m" },
    { value: "Diseño y Evaluación en Entornos Digitales", dur: "8m" },
    { value: "Estrategias y Operaciones de Transporte", dur: "8m" },
    { value: "Fuentes y tecnologías de energías renovables", dur: "8m" },
    { value: "Gestión de Calidad y Mantenimiento de Software", dur: "8m" },
    { value: "Gestión de Experiencias de Aprendizaje en Ambientes Virtuales", dur: "8m" },
    { value: "Inteligencia artificial aplicada", dur: "8m" },
    { value: "Métodos Cuantitativos para la Toma de Decisiones", dur: "8m" },
    { value: "Programación y Tecnologías de Redes", dur: "8m" },
    { value: "Tecnologías de la Información Aplicadas a la Logística y el Transporte", dur: "8m" }
  ];

  const currentDipOpt = getDipOptionsList().find(o => o.value === selectedDiplomado);
  const currentDipDur = currentDipOpt?.dur || '6m';

  const catalogKey = activeTab === 'en'
    ? (activeSubTabEN === 'lic' ? 'LICENCIATURA' : 'MAESTRÍA')
    : (activeTab === 'lic' ? 'LICENCIATURA' : activeTab === 'mae' ? 'MAESTRÍA' : 'DOCTORADO');

  const currentProg = CATALOG[catalogKey]?.find(p => p.p === selectedProgram);

  const ingProgs = [
    "INGENIERÍA INDUSTRIAL", "INGENIERÍA EN SISTEMAS COMPUTACIONALES", "INGENIERÍA INDUSTRIAL Y ADMINISTRACIÓN",
    "INGENIERÍA EN LOGÍSTICA Y TRANSPORTE", "INTELIGENCIA ARTIFICIAL", "INGENIERÍA EN ENERGÍAS RENOVABLES",
    "INGENIERÍA EN DESARROLLO DE SOFTWARE", "SEGURIDAD INFORMÁTICA", "INTELIGENCIA ARTIFICIAL APLICADA A NEGOCIOS, INDUSTRIA Y AUTOMATIZACIÓN",
    "ÉTICA Y GOBERNANZA DE LA INTELIGENCIA ARTIFICIAL", "CIBERSEGURIDAD Y RIESGOS EN INTELIGENCIA ARTIFICIAL",
    "INNOVACIÓN Y EMPRENDIMIENTO CON INTELIGENCIA ARTIFICIAL", "INTELIGENCIA ARTIFICIAL EN EDUCACIÓN",
    "INGENIERÍA EN CIENCIAS DE DATOS E INTELIGENCIA ANALÍTICA", "INGENIERÍA EN PROGRAMACIÓN EN LA NUBE",
    "SOFTWARE PARA ENTRETENIMIENTO DIGITAL", "INGENIERÍA EN SISTEMAS INTELIGENTES", "INGENIERÍA EN TECNOLOGÍA DE VIDEOJUEGOS Y REALIDAD VIRTUAL",
    "COMERCIO ELECTRÓNICO Y NEGOCIOS DIGITALES", "TECNOLOGÍAS INTERACTIVAS Y VIRTUALES", "INGENIERÍA AMBIENTAL", "INGENIERÍA ROBÓTICA"
  ];
  const isEngineering = (activeTab === 'lic' || (activeTab === 'en' && activeSubTabEN === 'lic')) && ingProgs.some(p => selectedProgram.toUpperCase().includes(p));

  let progKey = 'online_general';
  if (activeTab === 'lic' || (activeTab === 'en' && activeSubTabEN === 'lic')) {
    if (currentProg?.v === 'arq') progKey = 'arquitectura';
    else if (currentProg?.v === 'rob') progKey = 'robotica';
    else if (currentProg?.v === 'arqsw') progKey = 'arq_software';
    else if (isEngineering) progKey = 'ingenieria';
    else progKey = 'online_general';
  } else if (activeTab === 'mae' || (activeTab === 'en' && activeSubTabEN === 'mae')) {
    progKey = currentProg?.v === 'arqsw' ? 'arq_software' : 'mae_online';
  } else if (activeTab === 'doc') {
    progKey = currentProg?.v === 'doc_esp' ? 'doc_especial' : 'doctorado';
  }

  const isSpecialUVE = (activeTab === 'lic' || (activeTab === 'en' && activeSubTabEN === 'lic')) && (
    selectedProgram.toUpperCase() === 'UVE' || 
    selectedProgram.toUpperCase().indexOf('PSICOLOGÍA') >= 0 || 
    selectedProgram.toUpperCase().indexOf('PSICOLOGIA') >= 0 ||
    selectedProgram.toUpperCase().includes('UVE') ||
    currentProg?.v === 'uve'
  );
  const isSpecialUNICA = (activeTab === 'lic' || (activeTab === 'en' && activeSubTabEN === 'lic')) && (
    selectedProgram.toUpperCase() === 'UNICA' ||
    ['UNICA', 'ARTE DIGITAL Y MULTIMEDIA', 'MARKETING Y PUBLICIDAD', 'MEDIOS DIGITALES', 'COMUNICACIÓN CORPORATIVA', 'COMUNICACION CORPORATIVA'].includes(selectedProgram.toUpperCase()) || 
    (selectedProgram.toUpperCase().includes('UNICA') && !selectedProgram.toUpperCase().includes('COMUNICAC')) ||
    currentProg?.v === 'unica'
  );
  const isBachProg = isBachillerato(selectedProgram);

  let finalPrices: number[] = [];
  let pkgName = '—';
  let escName = '—';
  let becaPercentNum = 0;
  let rawBasePriceMonth3Plus = 0;

  // Real-time lookup inside the unified GDrive pricing catalog JSON chunks
  const matchedRecord = findPrecioRecord(selectedProgram, activeTab === 'en' ? activeSubTabEN : activeTab, selectedLead);

  if (matchedRecord) {
    const baseM1 = matchedRecord["1er pago"];
    const baseM2 = matchedRecord["2do pago"];
    const baseM3Plus = matchedRecord["Ticket"];
    pkgName = matchedRecord.Paquete || '—';
    escName = matchedRecord.Escalonado || '—';

    // Apply any experience extra charge or Platzi offsets if applicable
    let expPrice = 0;
    const isMaeTab = activeTab === 'mae' || (activeTab === 'en' && activeSubTabEN === 'mae');
    const isLicTab = activeTab === 'lic' || (activeTab === 'en' && activeSubTabEN === 'lic');
    if (activeTab !== 'en') {
      if (isLicTab) {
        expPrice = selectedExperiencia ? (EXP_PRICES[selectedExperiencia] || 0) : 0;
      } else if (isMaeTab) {
        expPrice = selectedExperiencia ? (EXP_PRICES_MAE[selectedExperiencia] || 0) : 0;
      }
    } else {
      expPrice = 165;
    }

    let sesejeDiscountMAE = 0;
    if (isMaeTab) {
      const isPlatziActive = isPlatziVisible(platziPreview);
      const sesejeIsSelected = activeTab === 'en' ? true : (selectedExperiencia === 'seseje');
      if (sesejeIsSelected && isPlatziActive) {
        sesejeDiscountMAE = -100;
      }
    }

    const isPlatziOff = isMaeTab && !isPlatziVisible(platziPreview);

    const basePrices = [
      baseM1,
      baseM2,
      ...Array(10).fill(baseM3Plus)
    ];

    finalPrices = basePrices.map((v: number, idx: number) => {
      if (idx >= 2) {
        let res = v + expPrice + sesejeDiscountMAE;
        if (isPlatziOff) {
          res += 120;
        }
        return res;
      } else {
        let res = v + sesejeDiscountMAE;
        if (isPlatziOff) {
          res -= 100;
        }
        return res;
      }
    });

    rawBasePriceMonth3Plus = baseM3Plus;
    const maxPrice = Math.max(...finalPrices);
    const becaCalculated = calculateBeca(maxPrice, pkgName);
    becaPercentNum = becaCalculated.becaPct;
  } else if (isSpecialUVE) {
    const uveData = PROG.uve?.niveles?.[uveVariant] || PROG.uve?.niveles?.alto;
    if (uveData) {
      finalPrices = uveData.p;
      pkgName = uveData.pkg;
      escName = uveData.esc || '—';
    } else {
      // Fallback only if catastrophic error
      finalPrices = [700, 1400, 1900, 2595, 2595, 2595, 2595, 2595, 2595, 2595, 2595, 2595];
      pkgName = 'HS24.LIC.UVE.VOXY.';
    }
    rawBasePriceMonth3Plus = finalPrices[4];
  } else if (isBachProg) {
    finalPrices = [1210, 640, 640, 640, 640, 640, 640, 640, 640, 640, 640, 640];
    pkgName = 'LIC.BACH.UVE';
    rawBasePriceMonth3Plus = 640;
  } else if (isSpecialUNICA) {
    // Mapping UNICA variants
    const levKey = (unicaVariant === 'flat') ? 'medio' : unicaVariant;
    const unicaData = PROG.unica?.niveles?.[levKey] || PROG.unica?.niveles?.[unicaVariant] || PROG.unica?.niveles?.alto;
    
    if (unicaData) {
      finalPrices = unicaData.p;
      pkgName = unicaData.pkg;
      escName = unicaData.esc || '—';
    } else {
      // Fallback only if catastrophic error
      finalPrices = [735, 1470, 1995, 2810, 2810, 2810, 2810, 2810, 2810, 2810, 2810, 2810];
      pkgName = 'ESC1.LIC.UNICA.VOXY.';
    }
    rawBasePriceMonth3Plus = finalPrices[4];
  } else if (currentProg?.v === 'unag') {
    const isDocPage = activeTab === 'doc';
    const numPrice = isDocPage ? 4770 : 3020;
    finalPrices = Array(12).fill(numPrice);
    pkgName = isDocPage ? 'DO.UNAG.BASICO.2.15.21' : 'MA.UNAG.BASICO.2.15.21';
    rawBasePriceMonth3Plus = numPrice;
  } else if (activeTab === 'dip') {
    const rawDipData = DIP_PRICES[currentDipDur]?.[currentDipDur === '6m' ? 'esc1' : selectedDiplomadoVariante];
    if (rawDipData) {
      finalPrices = rawDipData.p;
      pkgName = rawDipData.pkg;
      rawBasePriceMonth3Plus = finalPrices[finalPrices.length - 1];
    }
  } else {
    const realLeadKey = selectedLead === 'rmkt' ? 'rmkt30' : selectedLead;
    const isLicTab = activeTab === 'lic' || (activeTab === 'en' && activeSubTabEN === 'lic');
    const realZonaLead = (selectedZona !== 'std' && isLicTab) ? selectedZona : realLeadKey;
    const e = getPrice(progKey, currentProg?.v || 'medio', realZonaLead, selectedJornada, isEngineering);

    if (e) {
      pkgName = e.pkg;
      escName = e.esc;

      if (activeTab === 'en') {
        const enMap = EJE_PKG_MAP[e.pkg];
        if (enMap) {
          pkgName = enMap.pkg;
          escName = enMap.esc || '—';
        }
      }

      if (selectedExperiencia === 'hibrid' && activeTab !== 'en') {
        if (HIB_PKG_MAP[e.pkg]) {
          pkgName = HIB_PKG_MAP[e.pkg];
        }
        if (HIB_ESC_MAP[e.pkg]) {
          escName = HIB_ESC_MAP[e.pkg];
        }
      }

      let expPrice = 0;
      const isMaeTab = activeTab === 'mae' || (activeTab === 'en' && activeSubTabEN === 'mae');
      if (activeTab !== 'en') {
        if (isLicTab) {
          expPrice = selectedExperiencia ? (EXP_PRICES[selectedExperiencia] || 0) : 0;
        } else if (isMaeTab) {
          expPrice = selectedExperiencia ? (EXP_PRICES_MAE[selectedExperiencia] || 0) : 0;
        }
      } else {
        expPrice = 165;
      }

      let sesejeDiscountMAE = 0;
      if (isMaeTab) {
        const isPlatziActive = isPlatziVisible(platziPreview);
        const sesejeIsSelected = activeTab === 'en' ? true : (selectedExperiencia === 'seseje');
        if (sesejeIsSelected && isPlatziActive) {
          sesejeDiscountMAE = -100;
        }
      }

      const isPlatziOff = isMaeTab && !isPlatziVisible(platziPreview);

      finalPrices = e.p.map((v: number, idx: number) => {
        if (idx >= 2) {
          let res = v + expPrice + sesejeDiscountMAE;
          if (isPlatziOff) {
            res += 120;
          }
          return res;
        } else {
          let res = v + sesejeDiscountMAE;
          if (isPlatziOff) {
            res -= 100;
          }
          return res;
        }
      });

      rawBasePriceMonth3Plus = e.p[2];
      const maxPrice = Math.max(...finalPrices);
      const becaCalculated = calculateBeca(maxPrice, e.pkg);
      becaPercentNum = becaCalculated.becaPct;
    }
  }

  const incList = getIncludedIds(sec, isOnline, platziPreview, selectedExperiencia === 'seseje' || activeTab === 'en');
  const accTotalSum = getAccTotal(sec, isOnline, false, selectedChips, platziPreview, selectedExperiencia === 'seseje' || activeTab === 'en');
  const accTotalSum12 = getAccTotal(sec, isOnline, true, selectedChips, platziPreview, selectedExperiencia === 'seseje' || activeTab === 'en');

  const maxPriceForDeferred = finalPrices.length > 0 ? Math.max(...finalPrices) : 0;

  const rows: Array<{ label: string; base: number; acc: number; total: number; domValue: string }> = [];
  let index = 0;
  while (index < finalPrices.length) {
    const pVal = finalPrices[index];
    if (index === 0) {
      const tot = pVal + accTotalSum12;
      rows.push({
        label: 'Mes 1',
        base: pVal,
        acc: accTotalSum12,
        total: tot,
        domValue: '—'
      });
      index++;
    } else if (index === 1) {
      const tot = pVal + accTotalSum12;
      rows.push({
        label: 'Mes 2',
        base: pVal,
        acc: accTotalSum12,
        total: tot,
        domValue: '—'
      });
      index++;
    } else {
      let lastIdx = index;
      while (lastIdx + 1 < finalPrices.length && finalPrices[lastIdx + 1] === pVal) {
        lastIdx++;
      }
      const isLastPrice = pVal === maxPriceForDeferred;
      const rowAcc = isLastPrice ? accTotalSum : Math.max(0, accTotalSum12);
      const totalRowVal = pVal + rowAcc;
      const domValueNum = Math.round(totalRowVal * (1 - domiciliacionPct / 100));

      if (lastIdx === finalPrices.length - 1) {
        rows.push({
          label: 'Mes ' + (index + 1) + ' en adelante',
          base: pVal,
          acc: rowAcc,
          total: totalRowVal,
          domValue: fmt(domValueNum)
        });
      } else {
        const rangeLabel = index === lastIdx ? 'Mes ' + (index + 1) : 'Mes ' + (index + 1) + ' al ' + (lastIdx + 1);
        rows.push({
          label: rangeLabel,
          base: pVal,
          acc: rowAcc,
          total: totalRowVal,
          domValue: fmt(domValueNum)
        });
      }
      index = lastIdx + 1;
    }
  }

  const programName = activeTab === 'dip' ? selectedDiplomado : selectedProgram;
  const academicLevel = activeTab === 'dip' 
    ? 'Diplomado' 
    : { lic: 'Licenciatura', mae: 'Maestría', ms: 'Master UTEL', doc: 'Doctorado', en: 'Ejecutiva Nativa' }[activeTab] || 'Licenciatura';

  const duration = activeTab === 'dip' 
    ? (currentDipDur === '6m' ? '6 meses' : '8 meses')
    : getDuracion(sec, selectedJornada, selectedProgram);

  const priceLista = (pkgName && LISTA_MAP[pkgName]) || LISTA;

  const activeCerts: string[] = [];
  const activeAccs: string[] = [];
  const allAccs = ACCS[sec];

  if (allAccs) {
    const findName = (id: string) => {
      const item = allAccs.included.find(x => x.id === id) || 
                   (allAccs.included_online?.find(x => x.id === id)) ||
                   (id === 'coursera' ? { name: 'Coursera' } : null);
      if (item) return item.name;
      
      let foundName = '';
      allAccs.optional.forEach(grp => {
        const o = grp.items.find(x => x.id === id);
        if (o) foundName = o.name;
      });
      return foundName || id;
    };

    incList.forEach(id => {
      const name = findName(id);
      if (['voxy', 'platzi', 'coursera', 'ucamp'].includes(id)) {
        activeCerts.push(name);
      } else {
        activeAccs.push(name);
      }
    });

    allAccs.optional.forEach(grp => {
      grp.items.forEach(item => {
        if (selectedChips[item.id] === true && !incList.includes(item.id)) {
          if (grp.cat === 'Certificación' || grp.cat === 'Experiencia') {
            activeCerts.push(item.name);
          } else {
            activeAccs.push(item.name);
          }
        }
      });
    });
  }

  return {
    programName,
    academicLevel,
    duration,
    pkgName,
    escName,
    becaPercentNum,
    priceLista,
    rows,
    activeCerts,
    activeAccs,
    finalPrices,
    baseInscripcion: precios.inscripcion,
    becaInscripcion: 0,
    colRegularVal: priceLista,
    colBecaVal: rows[rows.length - 1]?.total || finalPrices[finalPrices.length - 1] || 1904,
    compRegularVal: (activeTab === 'dip' || isBachProg || isSpecialUVE) ? 0 : 2000,
    compBecaVal: (activeTab === 'dip' || isBachProg || isSpecialUVE) ? 0 : (sec === 'lic' ? 1100 : 1200)
  };
}
