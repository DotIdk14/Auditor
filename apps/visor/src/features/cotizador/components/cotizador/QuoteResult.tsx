/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ACCS,
  CERT_IDS,
  DEFERRED_ACCS,
  ALWAYS_ACCS,
  PLAT_IDS,
  IDIOM_IDS,
  CATALOG,
  getPdfPath,
  EXP_PRICES,
  EXP_PRICES_MAE,
  EJE_PKG_MAP,
  HIB_PKG_MAP,
  HIB_ESC_MAP,
  DIP_PRICES,
  LISTA_MAP,
  LISTA
} from '../../data/catalogs';
import { getProgramSummary } from '../../data/summaries';
import {
  fmt,
  getDuracion,
  isBachillerato,
  getIncludedIds,
  getAccTotal,
  calculateBeca,
  getPrice,
  isPlatziVisible,
  isMercadoUnico,
  isNuevo
} from '../../utils/calculo_cotizacion/quoteUtils';
import { Check, ClipboardList, Info, FileSpreadsheet, Gift, ShieldAlert, Award, Download } from 'lucide-react';
import { ProgramHoverAccordion } from './ProgramHoverAccordion';
import { RESUMENES, findResumen } from '../../data/resumenesData';
import { PreciosConfig } from '../../types';
import { useAuthStore } from '../../../../auth/authStore';
import type { QuoteContactContext } from '../ContactPicker';

export interface QuoteSnapshot {
  programa: string;
  nivel: string;
  jornada: string;
  lead: string;
  zona: string;
  fechaInicio: string;
  experiencia: string | null;
  modalidad: string;
  beneficios: Record<string, unknown>;
  pricing: Record<string, unknown>;
  resumenPrograma: string;
  advisorName: string;
  proposalStatus: 'revision' | 'aprobada';
  createdDate: string;
  expiryDate: string;
}

interface QuoteResultProps {
  activeTab: string;
  activeSubTabEN: string;

  // Selected parameters
  selectedProgram: string;
  selectedLead: string;
  selectedStartDate: string;
  selectedZona: string;
  selectedExperiencia: string | null;
  setSelectedExperiencia: (exp: string | null) => void;

  // Diplomados specific
  selectedDiplomado: string;
  selectedDiplomadoVariante: string;

  // Special variants
  uveVariant: string;
  unicaVariant: string;

  selectedChips: Record<string, boolean>;
  toggleChip: (id: string) => void;

  // Config fields
  domiciliacionPct: number;
  tituloCosto0: boolean;
  platziPreview: boolean;
  precios: PreciosConfig;
  selectedJornada?: string;

  // Save quote
  onSaveQuote?: (snapshot: QuoteSnapshot) => void;
  contactContext?: QuoteContactContext;
}

// Esta parte es la que muestra cuánto dinero tiene que pagar el alumno al final.
export const QuoteResult: React.FC<QuoteResultProps> = ({
  activeTab,
  activeSubTabEN,
  selectedProgram,
  selectedLead,
  selectedStartDate,
  selectedZona,
  selectedExperiencia,
  setSelectedExperiencia,
  selectedDiplomado,
  selectedDiplomadoVariante,
  uveVariant,
  unicaVariant,
  selectedChips,
  toggleChip,
  domiciliacionPct,
  tituloCosto0,
  platziPreview,
  precios,
  selectedJornada = 'intensiva',
  onSaveQuote,
  contactContext
}) => {
  // Estado para la gestión de la propuesta académica: 'revision' o 'aprobada'
  const [proposalStatus, setProposalStatus] = useState<'revision' | 'aprobada'>('revision');
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalHtmlContent, setProposalHtmlContent] = useState('');
  const loggedUser = useAuthStore((s) => s.user);
  const [advisorName, setAdvisorName] = useState<string>(loggedUser?.displayName || '');
  const isTit0FreeActive = tituloCosto0;

  // Auto-asignar el nombre del asesor desde el usuario logueado (login)
  React.useEffect(() => {
    if (loggedUser?.displayName) {
      setAdvisorName(loggedUser.displayName);
    }
  }, [loggedUser?.displayName]);

  // Fecha de cotización y vigencia de 2 días o hasta hoy 23:59 si título gratis está activo
  const [createdDateStr, setCreatedDateStr] = useState('');
  const [expiryDateStr, setExpiryDateStr] = useState('');

  React.useEffect(() => {
    const today = new Date();
    const isTit0 = isTit0FreeActive;
    const validityDate = isTit0 ? today : new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
    const formatDateSp = (d: Date) => {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };
    setCreatedDateStr(formatDateSp(today));
    setExpiryDateStr(isTit0 ? `${formatDateSp(today)} (hoy antes de las 23:59)` : formatDateSp(validityDate));
  }, [isTit0FreeActive]);

  // Determinar la clave de la sección actual (separa nivel de modalidad)
  const getSectionKey = (): string => {
    if (activeTab === 'en') {
      return activeSubTabEN;
    }
    return activeTab;
  };

  const sec = getSectionKey();
  const isOnline = activeTab !== 'en' && activeTab !== 'dip'; // normal tabs are online

  const getDipOptions = () => [
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
    { value: "Soft skills y habilidades gerenciales", dur: "6m" },
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

  const currentDipOpt = getDipOptions().find(o => o.value === selectedDiplomado);
  const currentDipDur = currentDipOpt?.dur || '6m';

  // Get catalog details
  const catalogKey = activeTab === 'en'
    ? (activeSubTabEN === 'lic' ? 'LICENCIATURA' : 'MAESTRÍA')
    : (activeTab === 'lic' ? 'LICENCIATURA' : activeTab === 'mae' ? 'MAESTRÍA' : 'DOCTORADO');

  const currentProg = CATALOG[catalogKey]?.find(p => p.p === selectedProgram);

  // Auto-U-Camp logic: true for engineering lic
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

  // Determine pricing key
  let progKey = 'online_general';
  if (activeTab === 'lic' || (activeTab === 'en' && activeSubTabEN === 'lic')) {
    if (currentProg?.v === 'arq') progKey = 'arquitectura';
    else if (currentProg?.v === 'rob') progKey = 'robotica';
    else if (currentProg?.v === 'arqsw') progKey = 'arq_software';
    else if (ingProgs.some(p => selectedProgram.toUpperCase().indexOf(p) >= 0)) progKey = 'ingenieria';
    else progKey = 'online_general';
  } else if (activeTab === 'mae' || (activeTab === 'en' && activeSubTabEN === 'mae')) {
    progKey = currentProg?.v === 'arqsw' ? 'arq_software' : 'mae_online';
  } else if (activeTab === 'doc') {
    progKey = currentProg?.v === 'doc_esp' ? 'doc_especial' : 'doctorado';
  }

  // Handle special UV / UNICA variants
  const isSpecialUVE = (activeTab === 'lic' || (activeTab === 'en' && activeSubTabEN === 'lic')) && (
    selectedProgram.toUpperCase() === 'UVE' || 
    selectedProgram.toUpperCase().includes('PSICOLOGÍA') || 
    selectedProgram.toUpperCase().includes('PSICOLOGIA') || 
    selectedProgram.toUpperCase().includes('UVE') ||
    currentProg?.v === 'uve'
  );
  const isSpecialUNICA = (activeTab === 'lic' || (activeTab === 'en' && activeSubTabEN === 'lic')) && (['UNICA', 'ARTE DIGITAL Y MULTIMEDIA', 'MARKETING Y PUBLICIDAD', 'MEDIOS DIGITALES', 'COMUNICACIÓN CORPORATIVA'].includes(selectedProgram.toUpperCase()) || (selectedProgram.toUpperCase().includes('UNICA') && !selectedProgram.toUpperCase().includes('COMUNICAC')));
  const isBachProg = isBachillerato(selectedProgram);

  // Compute prices & table outputs
  let finalPrices: number[] = [];
  let pkgName = '—';
  let escName = '—';
  let becaPercentNum = 0;
  let rawBasePriceMonth3Plus = 0;

  // Handle special cases
  if (isSpecialUVE) {
    const pricesMap: Record<string, number[]> = {
      alto: [700, 1400, 1900, 2595, 2595, 2595, 2595, 2595, 2595, 2595, 2595, 2595],
      bajo: [599, 1400, 1900, 2595, 2595, 2595, 2595, 2595, 2595, 2595, 2595, 2595]
    };
    finalPrices = pricesMap[uveVariant] || pricesMap.alto;
    pkgName = uveVariant === 'alto' ? 'HS24.LIC.UVE.VOXY.' : 'BF24.LIC.UVE.VOXY.';
    rawBasePriceMonth3Plus = finalPrices[4];
    becaPercentNum = Math.round((1 - rawBasePriceMonth3Plus / (LISTA_MAP[pkgName] || 4820)) * 100);
  } else if (isBachProg) {
    // Bachillerato UVE fixed pricing ($1,210 Mes 1, $640 rest)
    finalPrices = [1210, 640, 640, 640, 640, 640, 640, 640, 640, 640, 640, 640];
    pkgName = 'LIC.BACH.UVE';
    rawBasePriceMonth3Plus = 640;
    becaPercentNum = Math.round((1 - 640 / (LISTA_MAP[pkgName] || 2450)) * 100);
  } else if (isSpecialUNICA) {
    const pricesMap: Record<string, number[]> = {
      alto: [735, 1470, 1995, 2810, 2810, 2810, 2810, 2810, 2810, 2810, 2810, 2810],
      bajo: [629, 1470, 1995, 2810, 2810, 2810, 2810, 2810, 2810, 2810, 2810, 2810],
      flat: [2810, 2810, 2810, 2810, 2810, 2810, 2810, 2810, 2810, 2810, 2810, 2810]
    };
    finalPrices = pricesMap[unicaVariant] || pricesMap.alto;
    pkgName = unicaVariant === 'alto' ? 'ESC1.LIC.UNICA.VOXY.'
      : unicaVariant === 'bajo' ? 'ESC2.LIC.UNICA.VOXY.'
      : 'LIC.UNICA.VOXY.';
    rawBasePriceMonth3Plus = finalPrices[4];
    const listPrice = LISTA_MAP[pkgName] || 3200;
    becaPercentNum = Math.round((1 - rawBasePriceMonth3Plus / listPrice) * 100);
  } else if (currentProg?.v === 'unag') {
    // UNAG special fijo price
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
    // Normal Flow
    const realLeadKey = selectedLead === 'rmkt' ? 'rmkt30' : selectedLead;
    const isLic = () => activeTab === 'lic' || (activeTab === 'en' && activeSubTabEN === 'lic');
    const realZonaLead = (selectedZona !== 'std' && isLic()) ? selectedZona : realLeadKey;
    const e = getPrice(progKey, currentProg?.v || 'medio', realZonaLead, selectedJornada, isEngineering);

    if (e) {
      pkgName = e.pkg;
      escName = e.esc;

      // Handle override for Ejecutiva Nativa (col P y Q del Excel)
      if (activeTab === 'en') {
        const enMap = EJE_PKG_MAP[e.pkg];
        if (enMap) {
          pkgName = enMap.pkg;
          escName = enMap.esc || '—';
        }
      }

      // Handle Híbrida/Experiencia overrides
      if (selectedExperiencia === 'hibrid' && activeTab !== 'en') {
        if (HIB_PKG_MAP[e.pkg]) {
          pkgName = HIB_PKG_MAP[e.pkg];
        }
        if (HIB_ESC_MAP[e.pkg]) {
          escName = HIB_ESC_MAP[e.pkg];
        }
      }

      // Apply base pricing with additional experience addon if appropriate
      let expPrice = 0;
      const isMae = () => activeTab === 'mae' || (activeTab === 'en' && activeSubTabEN === 'mae');
      if (activeTab !== 'en') {
        if (isLic()) {
          expPrice = selectedExperiencia ? (EXP_PRICES[selectedExperiencia] || 0) : 0;
        } else if (isMae()) {
          expPrice = selectedExperiencia ? (EXP_PRICES_MAE[selectedExperiencia] || 0) : 0;
        }
      } else {
        // Ejecutiva Nativa siempre incluye +165 desde el mes 3+
        expPrice = 165;
      }

      // Special MAE adjustments for Platzi vs Coursera Swap
      let sesejeDiscountMAE = 0;
      if (isMae()) {
        const isPlatziActive = isPlatziVisible(platziPreview);
        const sesejeIsSelected = activeTab === 'en' ? true : (selectedExperiencia === 'seseje');
        if (sesejeIsSelected && isPlatziActive) {
          sesejeDiscountMAE = -100; // Platzi ($100) not included for seseje
        }
      }

      const isPlatziOff = isMae() && !isPlatziVisible(platziPreview);

      finalPrices = e.p.map((v: number, idx: number) => {
        if (idx >= 2) {
          // Month 3+
          let res = v + expPrice + sesejeDiscountMAE;
          if (isPlatziOff) {
            res += 120; // +120 Coursera fee swaps
          }
          return res;
        } else {
          // Month 1-2
          let res = v + sesejeDiscountMAE;
          if (isPlatziOff) {
            res -= 100; // -100 swap adjustments
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

  // Pre-calculate accessory values
  const incList = getIncludedIds(sec, isOnline, platziPreview, selectedExperiencia === 'seseje' || activeTab === 'en');
  let accTotalSum = getAccTotal(sec, isOnline, false, selectedChips, platziPreview, selectedExperiencia === 'seseje' || activeTab === 'en');
  let accTotalSum12 = getAccTotal(sec, isOnline, true, selectedChips, platziPreview, selectedExperiencia === 'seseje' || activeTab === 'en');

  // Bachillerato has NO supplements/accessories according to user instructions
  if (isBachProg) {
    accTotalSum = 0;
    accTotalSum12 = 0;
  }

  // Find the last (highest) price — deferred accs only apply from that point
  const maxPriceForDeferred = finalPrices.length > 0 ? Math.max(...finalPrices) : 0;

  // Grouped accessories for UI mapping
  const accCategoryList = ACCS[sec] || { included: [], optional: [] };

  // Calculate Table lines
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

  // Find final month values
  const finalRow = rows[rows.length - 1];
  const lastBase = finalRow?.base || 0;
  const lastAcc = finalRow?.acc || 0;
  const lastTotal = finalRow?.total || 0;

  // Extract selected optional items that are not included
  const optionalItems: Array<{ id: string; name: string; price: number }> = [];
  if (activeTab !== 'pu') {
    accCategoryList.optional?.forEach(group => {
      group.items.forEach(item => {
        if (selectedChips[item.id] === true && !incList.includes(item.id)) {
          optionalItems.push({
            id: item.id,
            name: item.name,
            price: item.price || 0
          });
        }
      });
    });
  }

  // Check if current page is Pagos Únicos
  if (activeTab === 'pu') {
    return renderPagosUnicos();
  }

  if (!currentProg && activeTab !== 'dip') {
    return (
      <div className="bg-white border rounded-xl p-8 text-center text-gray-400">
        Seleccione un programa válido para cotizar.
      </div>
    );
  }

  // Print Summary Download script using highly polished UTEL style matching user's image
  const triggerPrintDraft = () => {
    const progName = activeTab === 'dip' ? selectedDiplomado : selectedProgram;
    const academicLevel = activeTab === 'dip' 
      ? 'Diplomado' 
      : { lic: 'Licenciatura', mae: 'Maestría', ms: 'Master UTEL', doc: 'Doctorado' }[sec] || 'Licenciatura';
    
    const today = new Date();
    const validityDate = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
    const formatDateSp = (d: Date) => {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };
    const printCreatedDate = createdDateStr || formatDateSp(today);
    const printExpiryDate = expiryDateStr || formatDateSp(validityDate);

    const contactName = contactContext
      ? contactContext.mode === 'new'
        ? (contactContext.fullName || '').trim()
        : (contactContext.contact?.full_name || '').trim()
      : '';

    const startDateVal = selectedStartDate || 'Inmediato';
    const durationVal = activeTab === 'dip' 
      ? (currentDipDur === '6m' ? '6 meses' : '8 meses')
      : getDuracion(sec, selectedJornada, selectedProgram);

    const matriculaVal = "SN/M";
    const inscRegularVal = 2000;
    const inscBecaVal = isBachProg ? 1210 : 0;
    const colRegularVal = (pkgName && LISTA_MAP[pkgName]) || LISTA;
    const colBecaVal = isBachProg ? 640 : (rows[rows.length - 1]?.total || finalPrices[finalPrices.length - 1] || 1904);
    const compRegularVal = (activeTab === 'dip' || isBachProg || isSpecialUVE) ? 0 : 2000;
    const compBecaVal = (activeTab === 'dip' || isBachProg || isSpecialUVE) ? 0 : (sec === 'lic' ? 1100 : 1200);

    const formattedInscReg = fmt(inscRegularVal);
    const formattedInscBec = inscBecaVal === 0 ? '$0' : fmt(inscBecaVal);
    const formattedColReg = fmt(colRegularVal);
    const formattedColBec = fmt(colBecaVal);
    const formattedCompReg = activeTab === 'dip' ? 'No aplica' : fmt(compRegularVal);
    const formattedCompBec = activeTab === 'dip' ? 'No aplica' : fmt(compBecaVal);

    const colBecaDomVal = Math.round(colBecaVal * (1 - domiciliacionPct / 100));
    const formattedColBecDom = fmt(colBecaDomVal);

    const savingsVal = Math.max(0, colRegularVal - colBecaVal);
    const exactDiscountPercent = colRegularVal > 0 ? ((1 - colBecaVal / colRegularVal) * 100) : 0;
    const finalDiscountPercent = parseFloat(exactDiscountPercent.toFixed(1));

    const incIds = getIncludedIds(sec, isOnline, platziPreview, selectedExperiencia === 'seseje' || activeTab === 'en');
    const allAccs = ACCS[sec];
    
    const activeIconsAndCerts: string[] = [];
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

      incIds.forEach(id => {
        const name = findName(id);
        activeIconsAndCerts.push(name);
      });

      allAccs.optional.forEach(grp => {
        grp.items.forEach(item => {
          if (selectedChips[item.id] === true && !incIds.includes(item.id)) {
            activeIconsAndCerts.push(item.name);
          }
        });
      });
    }

    if (activeTab === 'dip') {
      activeIconsAndCerts.push('Inscripción Standard');
    }

    const programName = activeTab === 'dip' ? selectedDiplomado : selectedProgram;
    const resSummary = findResumen(programName);
    const careerSummaryText = resSummary?.secciones["1_EL_GANCHO"] || getProgramSummary(programName) || 'Plan de estudios enfocado en el desarrollo de competencias clave para destacar profesionalmente en el ámbito de tu interés académico con visión internacional.';

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Propuesta Académica UTEL - ${progName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
          @page {
            size: A4;
            margin: 0;
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            font-family: 'Inter', -apple-system, sans-serif; 
            background: #fdfdfd; 
            color: #1A2530;
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 10px;
          }
          .page {
            width: 210mm;
            min-height: 294mm;
            padding: 18px 24px;
            margin: 0 auto;
            background: white;
            position: relative;
            box-shadow: 0 4px 20px rgba(0,0,0,0.05);
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            gap: 8px;
            border-radius: 4px;
          }
          
          /* UTEL Top Border Card */
          .top-header-info {
            border: 1.5px solid #39b54a;
            border-radius: 12px;
            padding: 8px 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: relative;
            background: #ffffff;
          }
          .logo-container {
            width: 105px;
          }
          .logo-container img {
            width: 100%;
            height: auto;
            display: block;
          }
          .meta-details {
            text-align: center;
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1px;
          }
          .meta-details .meta-advisor {
            font-size: 11.5px;
            color: #39b54a;
            font-weight: 800;
            margin-bottom: 1px;
          }
          .meta-details .meta-advisor span {
            color: #1a1a1a;
            font-weight: 600;
          }
          .meta-details .meta-contact {
            font-size: 11.5px;
            color: #39b54a;
            font-weight: 800;
            margin-bottom: 1px;
          }
          .meta-details .meta-contact span {
            color: #1a1a1a;
            font-weight: 600;
          }
          .meta-details .meta-title {
            font-size: 9.5px;
            color: #39b54a;
            font-weight: 800;
            text-transform: uppercase;
          }
          .meta-details .meta-prog {
            font-size: 11px;
            color: #1a1a1a;
            font-weight: 800;
            text-transform: uppercase;
            max-width: 420px;
            text-align: center;
            line-height: 1.15;
          }
          .meta-details .meta-dur-title {
            font-size: 9.5px;
            color: #39b54a;
            font-weight: 800;
            margin-top: 1px;
          }
          .meta-details .meta-dur-val {
            font-size: 10.5px;
            color: #555555;
            font-weight: 600;
          }
          .meta-details .meta-start-title {
            font-size: 9.5px;
            color: #39b54a;
            font-weight: 800;
            margin-top: 1px;
          }
          .meta-details .meta-start-val {
            font-size: 10.5px;
            color: #1a1a1a;
            font-weight: 700;
          }

          /* Column Container for tables */
          .pricing-grid {
            display: grid;
            grid-template-columns: 1fr 1.1fr;
            gap: 12px;
          }

          /* List price card */
          .card-list-price {
            background: #ededed;
            border: 1.5px solid #dddddd;
            border-radius: 12px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            position: relative;
          }
          .card-list-price .header {
            background: #dddddd;
            color: #1c2430;
            text-align: center;
            padding: 6px 10px;
            font-size: 12px;
            font-weight: 900;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          .card-list-price .body {
            background: #ffffff;
            padding: 8px 12px;
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-around;
            gap: 3px;
          }
          .item-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 4px 0;
            border-bottom: 1px solid #eeeeee;
          }
          .item-row:last-child {
            border-bottom: none;
          }
          .item-left {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .icon-circle {
            background: #eaeaea;
            width: 22px;
            height: 22px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            color: #666666;
          }
          .icon-circle.green {
            background: #eef8f1;
            color: #39b54a;
          }
          .item-lbl {
            font-size: 10px;
            font-weight: 700;
            color: #333333;
            max-width: 155px;
            line-height: 1.15;
          }
          .item-val {
            font-size: 11.5px;
            font-weight: 800;
            color: #111111;
          }
          .item-val.green-bold {
            font-size: 12.5px;
            font-weight: 850;
            color: #39b54a;
          }
          .item-val.green-large {
            font-size: 17px;
            font-weight: 950;
            color: #39b54a;
            position: relative;
          }
          /* Simple yellow ray accents */
          .rays-accent::after {
            content: '⚡';
            position: absolute;
            top: -4px;
            right: -11px;
            font-size: 9px;
            transform: rotate(15deg);
            color: #ffde17;
          }

          .card-footer-price {
            background: #ededed;
            padding: 6px;
            text-align: center;
            border-top: 1px solid #dddddd;
          }
          .card-footer-price .lbl {
            font-size: 9px;
            font-weight: 700;
            color: #555555;
            margin-bottom: 1px;
          }
          .card-footer-price .val {
            font-size: 17px;
            font-weight: 900;
            color: #1a1a1a;
            text-decoration: line-through;
            text-decoration-color: #d9534f;
            text-decoration-thickness: 1.5px;
          }

          /* Beca approved card */
          .card-beca-price {
            background: #39b54a;
            border: 1.5px solid #39b54a;
            border-radius: 12px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            position: relative;
            box-shadow: 0 2px 8px rgba(57,181,74,0.06);
          }
          /* Ribbon star badge on top right */
          .star-ribbon {
            position: absolute;
            top: 0;
            right: 15px;
            background: #ffcc00;
            color: white;
            text-align: center;
            padding: 6px 6px 8px 6px;
            font-size: 11px;
            border-bottom-left-radius: 4px;
            border-bottom-right-radius: 4px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            z-index: 10;
          }
          .card-beca-price .header {
            background: #39b54a;
            color: #ffffff;
            text-align: center;
            padding: 6px 12px;
            position: relative;
          }
          .card-beca-price .header .sub {
            font-size: 9px;
            font-weight: 900;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            opacity: 0.95;
          }
          .card-beca-price .header .main {
            font-size: 13px;
            font-weight: 950;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            margin-top: 1px;
          }
          .card-beca-price .body {
            background: #ffffff;
            padding: 8px 12px;
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-around;
            gap: 3px;
          }
          .card-beca-price .footer {
            background: #39b54a;
            padding: 6px;
            text-align: center;
            color: white;
          }
          .card-beca-price .footer .lbl {
            font-size: 9px;
            font-weight: 800;
            opacity: 0.95;
            margin-bottom: 1px;
          }
          .card-beca-price .footer .val {
            font-size: 19px;
            font-weight: 900;
          }

          /* Yellow Ahorras Bar */
          .yellow-savings-bar {
            background: #ffde17;
            border-radius: 12px;
            padding: 6px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 2px 4px rgba(252,223,23,0.1);
          }
          .savings-left {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .tag-container {
            background: #39b54a;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1.5px solid white;
          }
          .tag-icon {
            color: white;
            font-size: 12px;
            font-weight: bold;
          }
          .savings-info {
            display: flex;
            flex-direction: column;
          }
          .savings-info .lbl {
            font-size: 9.5px;
            font-weight: 900;
            color: #1a1a1a;
            letter-spacing: 0.5px;
          }
          .savings-info .val {
            font-size: 15px;
            font-weight: 900;
            color: #39b54a;
          }
          .savings-info .val span {
            font-size: 9px;
            color: #1a1a1a;
            font-weight: 700;
            margin-left: 2px;
          }
          .discount-dashed-box {
            border: 1.5px dashed #39b54a;
            border-radius: 8px;
            padding: 4px 10px;
            text-align: center;
            background: rgba(255,255,255,0.4);
          }
          .discount-dashed-box .top {
            font-size: 8.5px;
            font-weight: 800;
            color: #111111;
            text-transform: uppercase;
          }
          .discount-dashed-box .mid {
            font-size: 15px;
            font-weight: 900;
            color: #39b54a;
          }
          .discount-dashed-box .bot {
            font-size: 8.5px;
            font-weight: 800;
            color: #111111;
            text-transform: uppercase;
          }

          /* Bottom Info Cards */
          .bottom-info-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            align-items: start;
          }
          .green-accent-card {
            background: #f2faf4;
            border: 1.5px solid #39b54a;
            border-radius: 12px;
            padding: 8px 12px;
            display: flex;
            flex-direction: column;
            gap: 4px;
            min-height: auto;
          }
          .section-title {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 11.5px;
            font-weight: 800;
            color: #111111;
            border-bottom: 1px solid rgba(57,181,74,0.12);
            padding-bottom: 3px;
          }
          .circle-star {
            background: #39b54a;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 9px;
          }
          .benefits-grid {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .benefit-item-row {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 9.5px;
            color: #333333;
            font-weight: 600;
          }
          .benefit-item-row span.bullet {
            color: #39b54a;
            font-weight: bold;
          }
          .career-summary-text {
            font-size: 9.5px;
            line-height: 1.3;
            color: #444444;
            font-weight: 500;
          }

          /* Footer disclaimer style */
          .proposal-disclaimer {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            margin-top: auto;
            border-top: 1px dashed rgba(0,0,0,0.08);
            padding-top: 6px;
          }
          .disclaimer-icon {
            background: #39b54a;
            min-width: 14px;
            height: 14px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 8px;
            font-weight: bold;
          }
          .disclaimer-text {
            font-size: 8px;
            color: #666666;
            line-height: 1.3;
            font-weight: 500;
          }

          /* Special promotions banners styling */
          .special-promos-container {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .gold-special-banner {
            background: linear-gradient(135deg, #fffcf0 0%, #fff3cf 100%);
            border: 2px solid #dfa510;
            border-radius: 14px;
            padding: 10px 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 4px 12px rgba(223,165,16,0.1);
            text-align: left;
          }
          .gold-icon {
            font-size: 24px;
            line-height: 1;
          }
          .gold-text-container {
            flex: 1;
            text-align: left;
          }
          .gold-title {
            font-size: 11px;
            font-weight: 900;
            color: #bd8605;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          .gold-subtitle {
            font-size: 10px;
            font-weight: 700;
            color: #6d4e02;
            line-height: 1.3;
            margin-top: 1px;
          }

          .blue-special-banner {
            background: linear-gradient(135deg, #f2f7ff 0%, #e1eefd 100%);
            border: 2px solid #2f80ed;
            border-radius: 14px;
            padding: 10px 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 4px 12px rgba(47,128,237,0.1);
            text-align: left;
          }
          .blue-icon {
            font-size: 24px;
            line-height: 1;
          }
          .blue-text-container {
            flex: 1;
            text-align: left;
          }
          .blue-title {
            font-size: 11px;
            font-weight: 900;
            color: #2f80ed;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          .blue-subtitle {
            font-size: 10px;
            font-weight: 700;
            color: #1b4d93;
            line-height: 1.3;
            margin-top: 1px;
          }

          @media print {
            body { background: white; padding: 0; margin: 0; }
            .page { 
              box-shadow: none; 
              padding: 6mm 10mm; 
              margin: 0; 
              width: 210mm; 
              height: 297mm; 
              min-height: 297mm; 
              max-height: 297mm; 
              box-sizing: border-box; 
              overflow: hidden;
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
              gap: 8px;
              page-break-after: avoid; 
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <!-- TOP HEADER UTEL CONTAINER -->
          <div class="top-header-info">
            <div class="logo-container">
              <img src="https://cmsutel.s3.amazonaws.com/Group_710dc02780.svg" alt="UTEL Logo" />
            </div>
            <div class="meta-details">
              <div class="meta-advisor">Asesor: <span>${advisorName}</span></div>
              ${contactName ? `<div class="meta-contact">Cliente: <span>${contactName}</span></div>` : ''}
              <div class="meta-title">Programa de interés:</div>
              <div class="meta-prog">${progName}</div>
              <div class="meta-dur-title">Duración:</div>
              <div class="meta-dur-val">(${durationVal})</div>
              <div class="meta-start-title">Inicio de ciclo:</div>
              <div class="meta-start-val" style="margin-bottom: 2px;">${startDateVal}</div>
              <div style="font-size: 8px; font-weight: 850; color: #d9534f; text-transform: uppercase; border: 1.2px solid #ffa3a3; background: #fff5f5; padding: 1.5px 6px; border-radius: 4px; display: inline-block;">
                ⏱ Vigencia: ${isTit0FreeActive ? 'Hoy (antes de 23:59)' : '2 días'} (Hasta ${printExpiryDate})
              </div>
            </div>
          </div>

          <!-- PREMIUM BENEFITS / CONVENIOS ESPECIALES -->
          ${(isTit0FreeActive || domiciliacionPct > 0) ? `
          <div style="display: grid; ${(isTit0FreeActive && domiciliacionPct > 0) ? 'grid-template-columns: 1fr 1fr; gap: 8px;' : 'grid-template-columns: 1fr;'} margin-top: 2px; margin-bottom: 2px; width: 100%;">
            ${isTit0FreeActive ? `
              <!-- GOLD PREMIUM SPECIAL BADGE: TITULACIÓN GRATIS -->
              <div style="background: linear-gradient(135deg, #FFF9E6 0%, #FFF0C2 100%); border: 1.5px solid #FFCC00; border-radius: 8px; padding: 4px 10px; display: flex; align-items: center; justify-content: space-between; gap: 8px; box-shadow: 0 2px 8px rgba(255, 204, 0, 0.05); font-family: 'Inter', sans-serif; text-align: left;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <div style="background: #FFCC00; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; box-shadow: 0 1px 3px rgba(255,204,0,0.3);">
                    🏆
                  </div>
                  <div style="text-align: left;">
                    <div style="font-size: 9.5px; font-weight: 900; color: #7A5C00; text-transform: uppercase; letter-spacing: 0.5px;">Beneficio Extraordinario Activo</div>
                    <div style="font-size: 9px; font-weight: 700; color: #5C4600; margin-top: 0.5px; line-height: 1.15;">¡Trámite de Titulación Oficial 100% Bonificado (Costo $0)!</div>
                  </div>
                </div>
                <div style="background: #FFCC00; color: #3E3000; font-size: 7.5px; font-weight: 900; padding: 2px 5px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;">
                  ¡Ahorras $18,000!
                </div>
              </div>
            ` : ''}

            ${domiciliacionPct > 0 ? `
              <!-- BLUE PREMIUM SPECIAL BADGE: DOMICILIACIÓN ACTIVA -->
              <div style="background: linear-gradient(135deg, #F2F7FF 0%, #E1EEFD 100%); border: 1.5px solid #2F80ED; border-radius: 8px; padding: 4px 10px; display: flex; align-items: center; justify-content: space-between; gap: 8px; box-shadow: 0 2px 8px rgba(47, 128, 237, 0.05); font-family: 'Inter', sans-serif; text-align: left;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <div style="background: #2F80ED; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; box-shadow: 0 1px 3px rgba(47,128,237,0.3); color: white;">
                    💳
                  </div>
                  <div style="text-align: left;">
                    <div style="font-size: 9.5px; font-weight: 900; color: #1B4D93; text-transform: uppercase; letter-spacing: 0.5px;">Descuento por Domiciliación Activo</div>
                    <div style="font-size: 9px; font-weight: 700; color: #153c73; margin-top: 0.5px; line-height: 1.15;">¡Tarifa preferencial fija aprobada por Tarjeta Bancaria!</div>
                  </div>
                </div>
                <div style="background: #2F80ED; color: #FFFFFF; font-size: 7.5px; font-weight: 900; padding: 2px 5px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;">
                  -${domiciliacionPct}% ADICIONAL
                </div>
              </div>
            ` : ''}
          </div>
          ` : ''}

          <!-- PRICING CARDS ROW -->
          <div class="pricing-grid">
            <!-- CARD 1: PRECIO DE LISTA -->
            <div class="card-list-price">
              <div class="header">PRECIO DE LISTA</div>
              <div class="body">
                <div class="item-row">
                  <div class="item-left">
                    <div class="icon-circle">📋</div>
                    <span class="item-lbl">Inscripción</span>
                  </div>
                  <span class="item-val">${formattedInscReg}</span>
                </div>
                <div class="item-row">
                  <div class="item-left">
                    <div class="icon-circle">📅</div>
                    <span class="item-lbl">Mensualidad</span>
                  </div>
                  <span class="item-val">${formattedColReg}</span>
                </div>
                ${(!isBachProg && !isSpecialUVE && activeTab !== 'dip') ? `
                <div class="item-row">
                  <div class="item-left">
                    <div class="icon-circle">👥</div>
                    <span class="item-lbl">Complemento a la colegiatura</span>
                  </div>
                  <span class="item-val">${formattedCompReg}</span>
                </div>
                ` : ''}
              </div>
              <div class="card-footer-price">
                <div class="lbl">Precio mensual total</div>
                <div class="val">${isBachProg ? formattedColReg : formattedColReg}</div>
              </div>
            </div>

            <!-- CARD 2: TU BECA APROBADA -->
            <div class="card-beca-price">
              <div class="star-ribbon">★</div>
              <div class="header">
                <div class="sub">TU BECA APROBADA</div>
                <div class="main">PRECIO DE BECA</div>
              </div>
              <div class="body">
                <div class="item-row">
                  <div class="item-left">
                    <div class="icon-circle green">📋</div>
                    <span class="item-lbl">Inscripción</span>
                  </div>
                  <span class="item-val green-bold">${(isBachProg || inscBecaVal > 0) ? formattedInscBec : 'GRATIS'}</span>
                </div>
                <div class="item-row">
                  <div class="item-left">
                    <div class="icon-circle green">📅</div>
                    <span class="item-lbl">Mensualidad</span>
                  </div>
                  <span class="item-val green-large rays-accent">${formattedColBec}</span>
                </div>
                ${domiciliacionPct > 0 ? `
                <div class="item-row" style="background: rgba(47,128,237,0.06); border: 1.5px dashed #2f80ed; padding: 3px 6px; border-radius: 6px; margin-top: 2px; margin-bottom: 2px;">
                  <div class="item-left">
                    <div class="icon-circle" style="background:#2f80ed; color:white; font-size:8px; width:16px; height:16px; border-radius:50%; display:flex; align-items:center; justify-content:center;">💳</div>
                    <span class="item-lbl" style="font-weight: 800; color: #1b4d93; font-size: 9.5px;">Mensualidad con Domiciliación</span>
                  </div>
                  <span class="item-val green-bold" style="color: #2F80ED; font-size: 12.5px; font-weight: 950; text-shadow: none;">${formattedColBecDom}</span>
                </div>
                ` : ''}
                ${(!isBachProg && !isSpecialUVE && activeTab !== 'dip') ? `
                <div class="item-row">
                  <div class="item-left">
                    <div class="icon-circle green">👥</div>
                    <span class="item-lbl">Complemento a la colegiatura</span>
                  </div>
                  <span class="item-val green-bold">${formattedCompBec}</span>
                </div>
                ` : ''}
              </div>
              <div class="footer" style="padding-bottom: 8px;">
                <div class="lbl">Precio mensual total</div>
                <div class="val">${formattedColBec}</div>
                ${domiciliacionPct > 0 ? `
                  <div style="font-size: 9px; margin-top: 3px; font-weight: 900; background: #e3f2fd; color: #1565c0; border: 1.5px solid #90caf9; padding: 2px 6px; border-radius: 4px; display: inline-block;">
                    💳 Con Domiciliación Activa (${domiciliacionPct}%): <strong style="font-weight: 950; font-size: 9.5px; color: #0d47a1;">${formattedColBecDom}</strong>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>

          <!-- YELLOW SAVINGS BAR -->
          <div class="yellow-savings-bar">
            <div class="savings-left">
              <div class="tag-container">
                <span class="tag-icon">$</span>
              </div>
              <div class="savings-info">
                <div class="lbl">¡AHORRAS!</div>
                <div class="val">${fmt(savingsVal)} <span>AL MES</span></div>
              </div>
            </div>
            <div class="discount-dashed-box">
              <div class="top">Esto representa un</div>
              <div class="mid">${finalDiscountPercent}%</div>
              <div class="bot">DE DESCUENTO</div>
            </div>
          </div>

          <!-- BOTTOM SECTIONS -->
          <div class="bottom-info-section">
            <!-- 1: BENEFICIOS / EXPERIENCIAS -->
            <div class="green-accent-card">
              <div class="section-title">
                <div class="circle-star">★</div>
                Beneficios/Experiencias
              </div>
              <div class="benefits-grid">
                <!-- Beneficios Incluidos / Base -->
                <div style="font-size: 10px; font-weight: 900; color: #111111; margin-top: 2px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">BENEFICIOS INCLUIDOS</div>
                <div class="benefit-item-row">
                  <span class="bullet">✔</span>
                  <span>Asesores 24/7</span>
                </div>
                <div class="benefit-item-row">
                  <span class="bullet">✔</span>
                  <span>Titulación directa</span>
                </div>
                <div class="benefit-item-row">
                  <span class="bullet">✔</span>
                  <span>${isBachProg ? 'Inscripción Preferencial' : 'Inscripción gratis'}</span>
                </div>
                <div class="benefit-item-row">
                  <span class="bullet">✔</span>
                  <span>Asesor de empleabilidad virtual</span>
                </div>
                <div class="benefit-item-row">
                  <span class="bullet">✔</span>
                  <span>Bolsa de trabajo Nacional e Internacional</span>
                </div>

                ${domiciliacionPct > 0 ? `
                <div class="benefit-item-row" style="background: rgba(57,181,74,0.06); padding: 1.5px 4px; border-radius: 4px; margin-left: -4px; margin-top: 1px; margin-bottom: 1px; font-size: 9.5px;">
                  <span class="bullet" style="color: #39b54a; font-weight: bold; margin-right: 2px;">✔</span>
                  <span style="font-weight: 700; color: #111111;">Beca por Domiciliación de Pago (${domiciliacionPct}%) Activo</span>
                </div>
                ` : ''}

                ${isTit0FreeActive ? `
                <div class="benefit-item-row" style="background: #FFFBF0; border: 1px solid #FFEBB3; padding: 2px 6px; border-radius: 4px; margin-top: 2px; margin-bottom: 1px; box-shadow: 0 1px 2px rgba(255,204,0,0.03); display: flex; align-items: center; gap: 4px; font-size: 9.5px;">
                  <span style="font-size: 9px;">🏆</span>
                  <span style="font-weight: 800; color: #7A5C00;">¡Costo de Titulación Oficial BONIFICADO (GRATIS)!</span>
                </div>
                ` : ''}

                <!-- Beneficios Adicionales (Selected ones like Platzi, Coursera, etc.) -->
                <div style="font-size: 10px; font-weight: 900; color: #111111; margin-top: 8px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px dashed rgba(57,181,74,0.2); padding-top: 6px;">BENEFICIOS ADICIONALES</div>
                ${activeIconsAndCerts.length > 0 ? activeIconsAndCerts.map(c => `
                  <div class="benefit-item-row">
                    <span class="bullet">✔</span>
                    <span>${c}</span>
                  </div>
                `).join('') : '<div class="career-summary-text" style="color: #777; font-size: 10px;">Inscripción estándar sin adicionales</div>'}
              </div>
            </div>

            <!-- 2: RESUMEN DE LA CARRERA + ADVERTENCIA DE VIGENCIA -->
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <!-- RESUMEN DE LA CARRERA -->
              <div class="green-accent-card" style="flex: 1; min-height: auto;">
                <div class="section-title">
                  <div class="circle-star">🎓</div>
                  Resumen de la carrera
                </div>
                <div class="career-summary-text">
                  ${careerSummaryText}
                </div>
              </div>

              <!-- CARD DE VIGENCIA DE LA COTIZACIÓN (Espacio Blanco derecho) -->
              <div style="background: linear-gradient(135deg, #FFF6F6 0%, #FFF1F1 100%); border: 1.5px solid #ffa3a3; border-color: rgba(217, 83, 79, 0.45); border-radius: 12px; padding: 10px 14px; display: flex; flex-direction: column; gap: 5px; box-shadow: 0 2px 6px rgba(217, 83, 79, 0.04);">
                <div style="display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 850; color: #d9534f; border-bottom: 1px solid rgba(217, 83, 79, 0.15); padding-bottom: 4px; text-transform: uppercase; letter-spacing: 0.3px;">
                  <span style="background: #d9534f; color: white; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9.5px; line-height: 1;">⏱</span>
                  Vigencia de Cotización
                </div>
                <div style="font-size: 9.5px; font-weight: 700; color: #b73a3a; line-height: 1.4;">
                  Esta cotización especial y sus descuentos asignados son válidos únicamente ${isTit0FreeActive ? '<strong style="font-weight: 950; color: #d9534f; text-decoration: underline;">hoy hasta las 23:59</strong>' : 'por <strong style="font-weight: 950; color: #d9534f; text-decoration: underline;">2 días naturales</strong> a partir de hoy'}.
                </div>
                <div style="font-size: 9px; color: #555555; line-height: 1.4; font-weight: 600;">
                  📅 Fecha de Emisión: <b style="color: #333;">${printCreatedDate}</b><br>
                  🛑 Fecha de Vencimiento: <span style="font-weight: 900; color: #d9534f; background: rgba(217,83,79,0.06); padding: 1px 4px; border-radius: 3px;">${printExpiryDate}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- DISCLAIMER NOTICE -->
          <div class="proposal-disclaimer">
            <div class="disclaimer-icon">i</div>
            <div class="disclaimer-text">
              Valores referenciales e informativos. No constituye una oferta comercial obligatoria.<br>
              <b>La presente cotización únicamente tiene una validez de ${isTit0FreeActive ? 'hoy hasta las 23:59' : '2 días naturales a partir de la fecha de su realización'} (${printCreatedDate}), expirando el ${printExpiryDate}.</b><br>
              A partir del 13° mes, se aplicará un ajuste por incremento anual de entre el 3% y el 5%.
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Store the HTML content and show the modal
    setProposalHtmlContent(htmlContent);
    setShowProposalModal(true);
  };

  function isLic() {
    return activeTab === 'lic' || (activeTab === 'en' && activeSubTabEN === 'lic');
  }

  function isMae() {
    return activeTab === 'mae' || (activeTab === 'en' && activeSubTabEN === 'mae');
  }

  // Lógica de compatibilidad y restricciones de accesorios, certificaciones e idiomas
  function listIncludesPlatformOrLanguageConflict(itemId: string): { isBlocked: boolean; reason: string } {
    let countCerts = 0;
    let countIdioms = 0;

    // Platzi se incluye por defecto en MAE Online excepto para modalidad Ejecutiva
    const isPlatziActiveInMAEOnline = isMae() && isPlatziVisible(platziPreview) && selectedExperiencia !== 'seseje';

    // Contar certificaciones e idiomas ya seleccionados
    CERT_IDS.forEach(id => {
      if (selectedChips[id] && !incList.includes(id)) countCerts++;
    });

    IDIOM_IDS.forEach(id => {
      if (selectedChips[id]) countIdioms++;
    });

    const isCert = CERT_IDS.includes(itemId);
    const isIdiom = IDIOM_IDS.includes(itemId);
    const maxCerts = isLic() ? 2 : 1;

    // Regla: Solo se permite 1 idioma adicional (Duolingo o Cambridge)
    if (isIdiom && selectedChips[itemId] === false) {
      if (countIdioms >= 1) {
        return { isBlocked: true, reason: 'Solo 1 idioma adicional' };
      }
    }

    // Regla: Límite de certificaciones según el nivel académico
    if (isCert && selectedChips[itemId] === false) {
      if (countCerts >= maxCerts) {
        return { isBlocked: true, reason: `Máx. ${maxCerts} certificación${maxCerts > 1 ? 'es' : ''}` };
      }
    }

    // Coursera es una plataforma global que bloquea otras certificaciones individuales
    if (selectedChips['coursera'] === true && itemId !== 'coursera') {
      if (isCert) {
        return { isBlocked: true, reason: 'Incompatible con Coursera' };
      }
    }

    // Inverso: Si se quiere elegir Coursera, hay que desmarcar otras primero
    if (itemId === 'coursera' && selectedChips['coursera'] === false) {
      if (countCerts > 0) {
        return { isBlocked: true, reason: 'Limpia otras certs primero' };
      }
    }

    // Platzi en MAE Online bloquea la selección manual de otras plataformas por conflictos de beca
    if (isPlatziActiveInMAEOnline && isCert && itemId !== 'platzi') {
      return { isBlocked: true, reason: 'MAE Online incluye Platzi' };
    }

    // Welbe Premium reemplaza a la versión estándar (no pueden coexistir)
    if (itemId === 'welbe' && selectedChips['welbep'] === true) {
      return { isBlocked: true, reason: 'Upgraded a Premium' };
    }

    // Opciones de titulación mutuamente excluyentes
    if (itemId === 'tit' && selectedChips['tit50'] === true) {
      return { isBlocked: true, reason: 'Ya elegiste Título 50%' };
    }
    if (itemId === 'tit50' && selectedChips['tit'] === true) {
      return { isBlocked: true, reason: 'Ya elegiste Titulación' };
    }

    return { isBlocked: false, reason: '' };
  }

  function renderPagosUnicos() {
    const groups = [
      {
        title: 'Licenciaturas',
        items: [
          { l: 'Online — Mayor', lista: 200530, pago: 74300, pkg: 'LI.UNICO.' },
          { l: 'Ejecutivas', lista: 200530, pago: 82200, pkg: 'LI.HIBRIDO.UNICO.' },
          { l: 'Joven', lista: 200530, pago: 82200, pkg: 'LI.HIBRIDO.UNICO.' },
          { l: 'Híbrida', lista: 200530, pago: 87900, pkg: 'LI.HIBRIDO.UNICO.' },
          { l: 'Derecho — Mayor', lista: 231010, pago: 83000, pkg: 'LI.UNICO.DERECHO.' },
          { l: 'Derecho — Ejecutivas', lista: 231010, pago: 91900, pkg: 'LI.DERECHO.HIBRIDO.UNICO.' },
          { l: 'Derecho — Joven', lista: 231010, pago: 91900, pkg: 'LI.DERECHO.HIBRIDO.UNICO.' },
          { l: 'Derecho — Híbrida', lista: 231010, pago: 97400, pkg: 'LI.DERECHO.HIBRIDO.UNICO.' }
        ]
      },
      {
        title: 'Maestrías',
        items: [
          { l: 'Online / Mayor — 18M', lista: 136980, pago: 47700, pkg: 'MA.UNICO.' },
          { l: 'Online / Mayor — 24M', lista: 136980, pago: 63600, pkg: 'MA.UNICO.' },
          { l: 'Ejecutivas — 18M', lista: 136980, pago: 49800, pkg: 'MA.HIBRIDO.UNICO.' }
        ]
      }
    ];

    return (
      <div className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-sm rounded-xl p-6 transition-all duration-300">
        <h2 className="text-xl font-bold text-gray-800 dark:text-slate-200 mb-2">Pagos Únicos Vigentes</h2>
        <p className="text-sm text-gray-400 dark:text-slate-400 mb-6">Precios preferenciales para liquidaciones o pagos en una sola exhibición.</p>

        <div className="space-y-8">
          {groups.map((group, grpIdx) => (
            <div key={grpIdx}>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 dark:text-slate-550 mb-4 border-b border-gray-100 dark:border-slate-800 pb-2">{group.title}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {group.items.map((item, itemIdx) => {
                  const becaVal = item.lista > 0 ? Math.round((1 - item.pago / item.lista) * 100) : 0;
                  return (
                    <div key={itemIdx} className="bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/80 rounded-xl p-4 flex flex-col justify-between hover:shadow-xs transition-shadow">
                      <div>
                        <div className="text-xs font-bold text-gray-800 dark:text-slate-200 mb-1">{item.l}</div>
                        <div className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-400 tracking-tight">{fmt(item.pago)}</div>
                        <div className="text-[11px] text-gray-400 dark:text-slate-400 mt-1 flex justify-between">
                          <span>Lista: {fmt(item.lista)}</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Beca {becaVal}%</span>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-slate-700">
                        <div className="text-[9px] font-mono text-gray-400 dark:text-slate-500 truncate mb-1">Paquete: {item.pkg}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">✓ Voxy</span>
                          <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">✓ Asistencia</span>
                          <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold">✓ Titulación</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Build snapshot of the current quote for saving
  const buildSnapshot = (): QuoteSnapshot => {
    const programName = activeTab === 'dip' ? selectedDiplomado : selectedProgram;
    const nivelLabel = activeTab === 'dip' ? 'Diplomado'
      : { lic: 'Licenciatura', mae: 'Maestría', ms: 'Master UTEL', doc: 'Doctorado' }[sec] || 'Licenciatura';
    const modalidadLabel = activeTab === 'en' ? 'Ejecutiva (en línea)'
      : activeTab === 'pu' ? 'Pagos Únicos'
      : activeTab === 'dip' ? 'Diplomado (en línea)'
      : isOnline ? 'En línea' : 'Modalidad especial';

    const res = findResumen(programName);
    const resumenPrograma = res?.secciones["1_EL_GANCHO"] || getProgramSummary(programName) || '';
    const precioLista = (pkgName && LISTA_MAP[pkgName]) || LISTA;
    const cuotaBeca = rows.length > 0 ? rows[rows.length - 1].total : (finalPrices[finalPrices.length - 1] || 0);
    const ahorroMensual = Math.max(0, precioLista - cuotaBeca);

    return {
      programa: programName,
      nivel: nivelLabel,
      jornada: selectedJornada,
      lead: selectedLead,
      zona: selectedZona,
      fechaInicio: selectedStartDate,
      experiencia: selectedExperiencia,
      modalidad: modalidadLabel,
      beneficios: {
        incluidos: incList,
        opcionales: optionalItems,
        domiciliacionPct,
        tituloCosto0,
        platziPreview,
      },
      pricing: {
        filas: rows,
        paquete: pkgName,
        escalonado: escName,
        becaPct: becaPercentNum,
        domiciliacionPct,
        precioLista,
        cuotaBeca,
        ahorroMensual,
      },
      resumenPrograma,
      advisorName,
      proposalStatus,
      createdDate: createdDateStr,
      expiryDate: expiryDateStr,
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6"
    >      {/* LEFT COLUMN: TABLE OF PAYMENTS */}
      <div className="lg:col-span-2 space-y-6">
        {/* CHOSEN PROGRAM INFO & PDF DOWNLOAD HEADER */}
        <div className="bg-slate-50/70 dark:bg-slate-900/60 shadow-xs border border-gray-200 dark:border-slate-800 p-5 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-indigo-700 dark:text-indigo-400 tracking-wider flex items-center gap-1.5 select-none">
              <span>{activeTab === 'dip' ? 'DIPLOMADO DE INTERÉS' : 'PROGRAMA DE INTERÉS'}</span>
              <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
            </span>
            <h2 className="text-base md:text-lg font-black text-gray-855 dark:text-slate-100 uppercase tracking-tight">
              {activeTab === 'dip' ? selectedDiplomado : selectedProgram}
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 dark:text-slate-400 pt-0.5">
              <span className="flex items-center gap-1">
                <span className="font-extrabold text-gray-400 dark:text-slate-500">Nivel académico:</span>
                <span className="uppercase font-bold text-gray-700 dark:text-slate-300">
                  {activeTab === 'lic' ? 'Licenciatura' : 
                   activeTab === 'mae' ? 'Maestría' : 
                   activeTab === 'ms' ? 'Master UTEL' : 
                   activeTab === 'doc' ? 'Doctorado' : 
                   activeTab === 'dip' ? 'Diplomado' :
                   activeTab === 'pu' ? 'Pago Único' :
                   activeTab === 'en' ? `Ejecutiva (${activeSubTabEN === 'lic' ? 'Licenciatura' : activeSubTabEN === 'mae' ? 'Maestría' : 'Master'})` : 'N/A'}
                </span>
              </span>
              {selectedStartDate && (
                <span className="flex items-center gap-1">
                  <span className="font-extrabold text-gray-400 dark:text-slate-500">Inicio de ciclo:</span>
                  <span className="font-bold text-gray-700 dark:text-slate-300">{selectedStartDate}</span>
                </span>
              )}
            </div>
          </div>
          {(activeTab === 'dip' ? selectedDiplomado : selectedProgram) && (() => {
            const path = getPdfPath(activeTab === 'dip' ? selectedDiplomado : selectedProgram, activeTab === 'en' ? activeSubTabEN : activeTab);
            return path ? (
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href={path}
                target="_blank"
                referrerPolicy="no-referrer"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-95 shrink-0"
              >
                <Download className="h-4 w-4" />
                <span>Ver Plan de Estudios (PDF)</span>
              </motion.a>
            ) : null;
          })()}
        </div>

        {/* COTIZACIÓN VIGENCIA DE 2 DÍAS BANNER */}
        {createdDateStr && expiryDateStr && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-3.5 rounded-xl flex items-center gap-3 text-amber-900 dark:text-amber-300 shadow-3xs"
          >
            <div className="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 p-2 rounded-lg shrink-0">
              <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-300" />
            </div>
            <div className="text-xs leading-relaxed">
              <span className="font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-400 mr-2">Vigencia Limitada:</span>
              Esta cotización especial y sus descuentos asignados son válidos únicamente {isTit0FreeActive ? <strong className="font-black text-amber-900 dark:text-amber-200">hoy hasta las 23:59</strong> : <>por <strong className="font-black text-amber-900 dark:text-amber-200">2 días naturales</strong> a partir de hoy</>}, con fecha de vencimiento el <strong className="font-black text-amber-950 dark:text-amber-100 bg-amber-100/50 dark:bg-amber-900/40 px-1.5 py-0.5 rounded">{expiryDateStr}</strong> (F. Emisión: {createdDateStr}).
            </div>
          </motion.div>
        )}

        {/* PAYMENTS CARD */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-6 shadow-sm overflow-hidden transition-colors">
          
          {/* PROGRAM SUMMARY SECTION */}
          <div className="mb-6 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Resumen del Programa
            </h4>
            {(() => {
              const programName = activeTab === 'dip' ? selectedDiplomado : selectedProgram;
              const res = findResumen(programName);
              return (
                <>
                  <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed mb-4">
                    {res?.secciones["1_EL_GANCHO"] || getProgramSummary(programName)}
                  </p>
                  {res && (
                    <ProgramHoverAccordion 
                      programData={res} 
                    />
                  )}
                </>
              );
            })()}
          </div>

          <div className="flex items-center justify-between mb-4 flex-wrap gap-2 pt-1 border-b border-gray-100 dark:border-slate-800 pb-3">

            <h3 className="text-md font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <ClipboardList className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Estructura de Cuotas Mensuales
            </h3>

            {/* PROPUESTA DOWNLOAD BUTTON AND STATE STATUS TOGGLE */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700 px-3 py-1 rounded-lg">
                <span className="text-[10px] font-extrabold text-gray-400 dark:text-slate-450 uppercase tracking-wider">Asesor:</span>
                <input
                  type="text"
                  value={advisorName}
                  readOnly
                  title={advisorName || 'Nombre de asesor'}
                  className="bg-transparent text-xs font-bold text-gray-800 dark:text-slate-200 border-none p-0 focus:ring-0 focus:outline-none w-32 placeholder-gray-400 cursor-default"
                  placeholder="Nombre de asesor"
                />
              </div>

              <span className="text-[10px] font-extrabold text-gray-400 dark:text-slate-400 uppercase tracking-wider font-mono">Propuesta:</span>
              <div className="inline-flex rounded-lg border border-gray-200 dark:border-slate-700 p-0.5 bg-gray-50 dark:bg-slate-800 text-xs relative">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setProposalStatus('revision')}
                  className={`px-3 py-1 font-bold rounded-md transition-all cursor-pointer relative z-10 ${
                    proposalStatus === 'revision'
                      ? 'text-amber-800 dark:text-amber-300'
                      : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
                  }`}
                >
                  En Revisión
                  {proposalStatus === 'revision' && (
                    <motion.div
                      layoutId="proposalStatusBg"
                      className="absolute inset-0 bg-amber-100 dark:bg-amber-950/40 rounded-md shadow-xs -z-1"
                    />
                  )}
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setProposalStatus('aprobada')}
                  className={`px-3 py-1 font-bold rounded-md transition-all cursor-pointer relative z-10 ${
                    proposalStatus === 'aprobada'
                      ? 'text-emerald-800 dark:text-emerald-300'
                      : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
                  }`}
                >
                  Aprobada
                  {proposalStatus === 'aprobada' && (
                    <motion.div
                      layoutId="proposalStatusBg"
                      className="absolute inset-0 bg-emerald-100 dark:bg-emerald-950/40 rounded-md shadow-xs -z-1"
                    />
                  )}
                </motion.button>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={triggerPrintDraft}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-1.5 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Descargar propuesta
              </motion.button>

              {onSaveQuote && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSaveQuote(buildSnapshot())}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-1.5 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <Check className="h-4 w-4" />
                  Guardar cotización
                </motion.button>
              )}
            </div>
          </div>

          {/* TABLE CONTAINER */}
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-800">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-800">
                  <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">Periodo</th>
                  <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-slate-405">Cuota Base</th>
                  <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-slate-405">Complementos</th>
                  <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-bold">Subtotal</th>
                  <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-bold bg-indigo-50/20 dark:bg-indigo-950/20">Con Domiciliación</th>
                  <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-slate-505 font-mono">Paquete</th>
                  <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-slate-505 font-mono">Escalonado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80">
                {rows.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50/40 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3 font-semibold text-blue-600 dark:text-blue-400 text-xs">{row.label}</td>
                    <td className="px-4 py-3 text-indigo-600 dark:text-indigo-400 font-bold">{fmt(row.base)}</td>
                    <td className="px-4 py-3 text-indigo-500 dark:text-indigo-300 font-medium">
                      {row.acc > 0 ? `+${fmt(row.acc)}` : '—'}
                    </td>
                    <td className="px-4 py-3 font-extrabold text-blue-700 dark:text-blue-200">{fmt(row.total)}</td>
                    <td className="px-4 py-3 font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50/10 dark:bg-indigo-950/10">{row.domValue}</td>
                    <td className="px-4 py-3 text-[10px] text-gray-450 dark:text-slate-500 font-mono select-all">{pkgName}</td>
                    <td className="px-4 py-3 text-[10px] text-gray-455 dark:text-slate-500 font-mono select-all">
                      {escName || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* DYNAMIC LISTA AND BECA ACCENTS */}
          {activeTab !== 'dip' && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 bg-gray-50 dark:bg-slate-800/60 rounded-lg p-3 border border-gray-200 dark:border-slate-700 text-xs text-gray-500 dark:text-slate-400 font-medium gap-2">
              <div className="flex items-center gap-1.5">
                <Gift className="h-4 w-4 text-emerald-500" />
                <span>Beca estimada sobre Lista:</span>
                <strong className="text-emerald-700 dark:text-emerald-400 text-sm font-bold">{becaPercentNum}%</strong>
              </div>
              <div className="text-gray-400 dark:text-slate-500">
                Precio de Lista Oficial: <strong>{fmt((pkgName && LISTA_MAP[pkgName]) || LISTA)}</strong>
              </div>
            </div>
          )}

          {/* COMPLEMENTO COLEGIATURA EXPLAINER */}
          {!isBachProg && !isSpecialUVE && activeTab !== 'dip' && (
            <div className="mt-4 bg-amber-50/60 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/30 rounded-lg p-3 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-1.5">
              <Info className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <strong>📋 Complemento de Colegiatura Obligatorio:</strong>{' '}
                <strong className="text-amber-805 dark:text-amber-400">{sec === 'lic' ? '$1,100' : '$1,200'}</strong>{' '}
                se cobra cada 4 meses automáticamente desglosado en el calendario escolar.
              </div>
            </div>
          )}
        </div>

        {/* PROPOSAL MODAL */}
        <AnimatePresence>
          {showProposalModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 dark:bg-black/70 flex items-center justify-center z-50 p-6"
              onClick={() => setShowProposalModal(false)}
            >
              <motion.div
                  initial={{ scale: 1, opacity: 1 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.98, opacity: 0 }}
                  className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-[1200px] w-[98%] max-h-[96vh] overflow-hidden flex flex-col p-6"
                  onClick={(e) => e.stopPropagation()}
                >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 sticky top-0 z-10">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Propuesta Académica</h2>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        // Download as HTML
                        const blob = new Blob([proposalHtmlContent], { type: 'text/html;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        const progName = activeTab === 'dip' ? selectedDiplomado : selectedProgram;
                        link.href = url;
                        link.download = `Propuesta_${progName}_${new Date().toISOString().split('T')[0]}.html`;
                        link.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg"
                    >
                      Descargar HTML
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        // Print as PDF
                        const iframe = document.createElement('iframe');
                        iframe.style.display = 'none';
                        document.body.appendChild(iframe);
                        iframe.contentDocument?.write(proposalHtmlContent);
                        iframe.contentDocument?.close();
                        iframe.onload = () => {
                          iframe.contentWindow?.print();
                          setTimeout(() => document.body.removeChild(iframe), 1000);
                        };
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg"
                    >
                      Imprimir / PDF
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowProposalModal(false)}
                      className="px-3 py-1.5 bg-gray-300 hover:bg-gray-400 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-900 dark:text-white text-sm font-semibold rounded-lg"
                    >
                      Cerrar
                    </motion.button>
                  </div>
                </div>

                {/* Modal Body - IFrame for HTML content */}
                <div className="flex-1 overflow-auto p-2">
                  <iframe
                    key={proposalHtmlContent}
                    srcDoc={proposalHtmlContent}
                    className="w-full h-[84vh] border-0"
                    title="Propuesta Académica"
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* COMBINATION RULES AND NOTES EXCEPT FOR DIPLOMADS */}
        {activeTab !== 'dip' && (
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-3 flex items-center gap-1">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              Reglas de combinación y elegibilidad UTEL
            </h4>
            <ul className="text-xs text-gray-600 dark:text-slate-300 space-y-2 list-disc pl-5">
              <li>Solo se autoriza <strong>1 idioma adicional</strong> por plan (Cambridge o Duolingo).</li>
              <li>Máximo de <strong>2 certificaciones adicionales</strong> para Licenciaturas / <strong>1</strong> para Posgrados.</li>
              <li>La asignación de <strong>Coursera / Platzi</strong> inactiva otras credenciales por empalme académico.</li>
              <li>Programas del área de ingeniería incorporan la experiencia <strong>U-Camp automáticamente</strong> desde el mes 3 sin recargo adicional.</li>
            </ul>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: ACCESSORIES CHIPS & FINAL BOX */}
      <div className="space-y-6">
        {/* ACCESSORIES PANEL */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-400 dark:text-slate-400">Accesorios & Certificaciones</h3>

          {/* AUTO-INCLUDED BASE ACCESSORIES */}
          <div className="space-y-2">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-slate-500">Incluido en tu matrícula base</div>
            <div className="flex flex-wrap gap-1.5">
              {incList.map(id => {
                const isPlatziAndOff = id === 'platzi' && !isPlatziVisible(platziPreview);
                if (isPlatziAndOff) return null;

                const nameLabel = id === 'voxy' ? 'Inglés Voxy' : id === 'welbe' ? 'Welbe' : id === 'platzi' ? 'Platzi' : id === 'coursera' ? 'Coursera' : 'Asistencia Plus';
                return (
                  <span key={id} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30">
                    <Check className="h-3 w-3 mr-1" />
                    {nameLabel}
                  </span>
                );
              })}

              {/* Platzi auto included/selected */}
              {selectedChips['platzi'] === true && !incList.includes('platzi') && (
                <span key="platzi-auto" className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/30 animate-pulse">
                  <Check className="h-3 w-3 mr-1" />
                  Platzi (Auto)
                </span>
              )}

              {/* Title 0 if enabled */}
              {isTit0FreeActive && (
                <span key="tit0" className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 animate-pulse">
                  <Gift className="h-3 w-3 mr-1 text-emerald-600 dark:text-emerald-400" />
                  Título Costo $0
                </span>
              )}
            </div>
          </div>

          {/* MODALITY / EXPERIENCE SELECTION INTEGRATED HERE */}
          {activeTab !== 'en' && activeTab !== 'pu' && activeTab !== 'dip' && currentProg && (() => {
            const opts = [];
            if (isLic()) {
              if (currentProg.eje) opts.push({ id: 'seseje', label: 'Ejecutiva', price: 165 });
              if (currentProg.jov) opts.push({ id: 'utelj', label: 'Utel Joven', price: 165 });
              if (currentProg.hib) opts.push({ id: 'hibrid', label: 'Híbrida', price: 340 });
            } else if (isMae()) {
              if (currentProg.eje) opts.push({ id: 'seseje', label: 'Ejecutiva', price: 165 });
              if (currentProg.hib) opts.push({ id: 'hibrid', label: 'Híbrida', price: 395 });
            }

            if (opts.length === 0) return null;

            return (
              <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-slate-500">Modalidad / Experiencia</div>
                <div className="flex flex-wrap gap-1.5">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedExperiencia(null)}
                    className={`inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      selectedExperiencia === null
                        ? 'bg-indigo-600 text-white border-indigo-700'
                        : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer'
                    }`}
                  >
                    Estándar (Online)
                  </motion.button>
                  {opts.map(opt => (
                    <motion.button
                      key={opt.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedExperiencia(opt.id)}
                      className={`inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        selectedExperiencia === opt.id
                          ? 'bg-indigo-600 text-white border-indigo-700'
                          : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer'
                      }`}
                    >
                      <div className="flex flex-col text-left">
                        <span>{opt.label}</span>
                        <span className={`text-[10px] font-light ${selectedExperiencia === opt.id ? 'text-indigo-100' : 'text-gray-400 dark:text-slate-500'}`}>
                          +{fmt(opt.price)}/m
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* OPTIONAL UPGRADES BY SECTION */}
          {accCategoryList.optional?.map((group, grpIdx) => {
            // Check if Coursera blocks certifications
            const isCourseraSelectedAndNotCurrentGroup = selectedChips['coursera'] === true;

            return (
              <div key={grpIdx} className="space-y-2">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-slate-500">{group.cat}</div>
                <div className="flex flex-wrap gap-1.5">
                  {group.items.map(item => {
                    if (incList.includes(item.id)) return null;
                    if (item.id === 'platzi' && !isPlatziVisible(platziPreview)) return null;

                    // Compute conflict blocks
                    const { isBlocked, reason } = listIncludesPlatformOrLanguageConflict(item.id);
                    const isSelected = selectedChips[item.id] === true;

                    // Color variants
                    let chipStyle = "";
                    if (isSelected) {
                      chipStyle = "bg-indigo-600 text-white border-indigo-700 dark:bg-indigo-600 dark:border-indigo-700";
                    } else if (isBlocked) {
                      chipStyle = "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50 dark:bg-slate-800/40 dark:text-slate-500 dark:border-slate-800";
                    } else {
                      chipStyle = "bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer";
                    }

                    return (
                      <motion.button
                        layout
                        whileHover={!isBlocked || isSelected ? { scale: 1.02 } : {}}
                        whileTap={!isBlocked || isSelected ? { scale: 0.98 } : {}}
                        key={item.id}
                        disabled={isBlocked && !isSelected}
                        onClick={() => toggleChip(item.id)}
                        className={`inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all text-left ${chipStyle}`}
                        title={isBlocked ? reason : `Agregar ${item.name}`}
                      >
                        <div className="flex flex-col">
                          <span>{item.name}</span>
                          <span className={`text-[10px] font-light ${isSelected ? 'text-indigo-100' : 'text-gray-400 dark:text-slate-500'}`}>
                            {isBlocked ? reason : `+${fmt(item.price || 0)}/m`}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
