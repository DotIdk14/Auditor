// Shared PCE Rubric definitions — single source of truth for UTEL checklist evaluation

export type Modalidad = 'LÍNEA' | 'EJECUTIVA' | 'HÍBRIDA';

export interface PceSubItem {
  id: string;
  name: string;
  weight: number;
}

export interface PceCategory {
  id: string;
  title: string;
  weight: number;
  subitems: PceSubItem[];
  passingThreshold: number;
  defaultFeedback: string;
}

// ── Rubric constants ──────────────────────────────────────────────

export const PCE_CATEGORIES: PceCategory[] = [
  {
    id: "C1",
    title: "CONOCE A TU CLIENTE",
    weight: 1.00,
    passingThreshold: 0.8,
    defaultFeedback: "Indagación de perfil del prospecto.",
    subitems: [
      { id: "c1_linea", name: "Interés en línea", weight: 0.20 },
      { id: "c1_programa", name: "Programa de interés", weight: 0.20 },
      { id: "c1_demo", name: "Datos demográficos (edad/ubicación/medio)", weight: 0.20 },
      { id: "c1_ocup", name: "Ocupación/estudios previos", weight: 0.20 },
      { id: "c1_equiv", name: "Equivalencias", weight: 0.20 },
    ],
  },
  {
    id: "C2",
    title: "GENERALIDADES",
    weight: 1.00,
    passingThreshold: 0.8,
    defaultFeedback: "Institucionalidad y modelo educativo.",
    subitems: [
      { id: "c2_num", name: "Numeralia (12+ años, 3 países, egresados)", weight: 0.34 },
      { id: "c2_mod", name: "Modelo Educativo", weight: 0.33 },
      { id: "c2_esp", name: "Modalidad específica", weight: 0.33 },
    ],
  },
  {
    id: "C3",
    title: "OFERTA ACADÉMICA",
    weight: 1.00,
    passingThreshold: 0.8,
    defaultFeedback: "Información de costos y beneficios.",
    subitems: [
      { id: "c3_costos", name: "Costos", weight: 0.20 },
      { id: "c3_comp", name: "Complemento de colegiatura", weight: 0.20 },
      { id: "c3_jor", name: "Jornada", weight: 0.20 },
      { id: "c3_beca", name: "Vigencia de beca", weight: 0.20 },
      { id: "c3_ciclos", name: "Ciclos de inicio", weight: 0.20 },
    ],
  },
  {
    id: "C4",
    title: "ACUERDOS Y CIERRE",
    weight: 1.00,
    passingThreshold: 0.75,
    defaultFeedback: "Cierre de compromisos.",
    subitems: [
      { id: "c4_res", name: "Resumen de la oferta", weight: 0.25 },
      { id: "c4_doc", name: "Envío de documentos", weight: 0.25 },
      { id: "c4_pag", name: "Acuerdos de pago", weight: 0.25 },
      { id: "c4_ref", name: "Solicitud de referidos", weight: 0.25 },
    ],
  },
  {
    id: "C5",
    title: "GESTIÓN Y REGISTRO",
    weight: 6.00,
    passingThreshold: 4.0,
    defaultFeedback: "Cumplimiento de procesos UTEL.",
    subitems: [
      { id: "c5_int", name: "Hablar directamente con el interesado", weight: 1.20 },
      { id: "c5_tip", name: "Tipificación positiva", weight: 1.20 },
      { id: "c5_pla", name: "Interacción dentro de plataformas UTEL", weight: 1.20 },
      { id: "c5_reg", name: "Registro de interacción", weight: 1.20 },
      { id: "c5_seg", name: "Seguimiento de acuerdos", weight: 1.20 },
    ],
  },
];

export interface CheckedSubItem {
  id: string;
  name: string;
  weight: number;
  checked: boolean;
}

export interface ChecklistItem {
  id: string;
  title: string;
  weight: number;
  passingThreshold: number;
  score: number;
  status: 'passed' | 'failed';
  feedback: string;
  subitems: CheckedSubItem[];
}

export interface PceChecklistResult {
  totalScore: number;
  isCompliant: boolean;
  checkedItemsCount: number;
  modalidadDetectada: Modalidad;
  checklist: ChecklistItem[];
  evaluacion_detallada: Record<string, string>;
}

/**
 * Build the PCE checklist from evaluated subitems and feedback map.
 * This is the single canonical implementation used by all code paths.
 */
export function buildChecklist(
  evaluatedSubitems: Record<string, boolean>,
  feedbackMap: Record<string, string>,
  modalidad: Modalidad = 'LÍNEA',
): PceChecklistResult {
  let totalScore = 0;

  const checklist: ChecklistItem[] = PCE_CATEGORIES.map((cat) => {
    const subitems: CheckedSubItem[] = cat.subitems.map((sub) => {
      // For C5 items (except c5_seg), treat missing keys as true (optimistic default)
      // For all others, missing keys are false
      const id = sub.id;
      let checked: boolean;
      if (id.startsWith("c5_") && id !== "c5_seg") {
        checked = evaluatedSubitems[id] ?? true;
      } else {
        checked = !!evaluatedSubitems[id];
      }
      return { ...sub, checked };
    });

    const score = parseFloat(subitems.reduce((acc, s) => acc + (s.checked ? s.weight : 0), 0).toFixed(2));
    totalScore += score;

    return {
      id: cat.id,
      title: cat.title,
      weight: cat.weight,
      passingThreshold: cat.passingThreshold,
      score,
      status: score >= cat.passingThreshold ? 'passed' : 'failed',
      feedback: feedbackMap[cat.title] || cat.defaultFeedback,
      subitems,
    };
  });

  const roundedTotal = parseFloat(totalScore.toFixed(2));

  const evaluacion_detallada: Record<string, string> = {};
  for (const item of checklist) {
    evaluacion_detallada[item.title] = feedbackMap[item.title]
      || `${item.score.toFixed(2)} pts - ${item.feedback}`;
  }

  return {
    totalScore: roundedTotal,
    isCompliant: roundedTotal >= 7.0,
    checkedItemsCount: PCE_CATEGORIES.length,
    modalidadDetectada: modalidad,
    checklist,
    evaluacion_detallada,
  };
}

// ── Heuristic evaluation (keyword-based, no AI required) ──────────

interface TranscriptionSegment {
  text: string;
}

export function evaluateHeuristic(
  transcription: TranscriptionSegment[],
  fullText: string,
): { totalScore: number; isCompliant: boolean; modalidadDetectada: Modalidad; checklist: ChecklistItem[]; evaluacion_detallada: Record<string, string>; emotionalAnalysis: Record<string, unknown> } {

  // Detect modality
  let modalidad: Modalidad = 'LÍNEA';
  if (fullText.includes("ejecutiva") || fullText.includes("networking") || fullText.includes("expertos")) {
    modalidad = 'EJECUTIVA';
  } else if (fullText.includes("híbrida") || fullText.includes("presencial") || fullText.includes("cdmx")) {
    modalidad = 'HÍBRIDA';
  }

  // Build a faux evaluatedSubitems map from keyword matching
  const evaluated: Record<string, boolean> = {};
  const kwMap: Record<string, string[]> = {
    c1_linea: ["línea"],
    c1_programa: ["programa", "licenciatura"],
    c1_demo: ["edad", "dónde"],
    c1_ocup: ["trabajas", "estudió"],
    c1_equiv: ["equivalencia", "revalidar"],
    c2_num: ["12 años", "egresados"],
    c2_mod: ["modelo", "flexibilidad"],
    c2_esp: ["modalidad", modalidad.toLowerCase()],
    c3_costos: ["costo", "precio"],
    c3_comp: ["inscripción", "cuota"],
    c3_jor: ["jornada", "horas"],
    c3_beca: ["beca", "vigencia"],
    c3_ciclos: ["inicio", "lunes"],
    c4_res: ["resumen", "repetir"],
    c4_doc: ["documento", "papeles"],
    c4_pag: ["pago", "compromiso"],
    c4_ref: ["referido", "recomendar"],
    c5_int: [], // always true — handled by buildChecklist default
    c5_tip: [],
    c5_pla: [],
    c5_reg: [],
    c5_seg: ["mañana", "contacto"],
  };

  for (const [key, kws] of Object.entries(kwMap)) {
    if (kws.length === 0) {
      evaluated[key] = true;
    } else {
      evaluated[key] = kws.some((kw) => fullText.includes(kw));
    }
  }

  const result = buildChecklist(evaluated, {}, modalidad);

  const emotionalAnalysis = {
    primaryEmotion: result.totalScore >= 7.0 ? "Interesado y optimista" : "Indiferente y dudoso",
    emotionalJourney: "Inicia con neutralidad al recibir la información institucional y progresa positivamente conforme se aclaran los costos.",
    purchaseAptitudeScore: Math.round(result.totalScore * 10),
    purchaseAptitudeLabel: (result.totalScore >= 8.5 ? "Muy Alto" : result.totalScore >= 6.5 ? "Alto" : result.totalScore >= 4.0 ? "Medio" : "Bajo") as string,
    barriersToPurchase: result.checklist[2]?.score >= 0.8 ? ["Disponibilidad de tiempo para el aula virtual"] : ["Precio de inscripción", "Duda sobre financiamiento de becas"],
    buyingSignals: ["Pregunta detalles de modalidad", "Asiente a los requisitos de documentación", "Quiere comenzar el lunes"],
    aptitudeReason: `El prospecto demostró un nivel de aptitud del ${(result.totalScore * 10).toFixed(0)}% impulsado por su interés en iniciar clases de inmediato.`,
  };

  return {
    totalScore: result.totalScore,
    isCompliant: result.isCompliant,
    modalidadDetectada: modalidad,
    checklist: result.checklist,
    evaluacion_detallada: result.evaluacion_detallada,
    emotionalAnalysis,
  };
}
