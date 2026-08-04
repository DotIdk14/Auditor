import type {
  SalesCall,
  CallAnalysis,
  CallMetadata,
  CallScore,
  TranscriptionUtterance,
  UtelChecklistItem,
  UtelEvaluation,
} from '../types';

// Adapta el objeto de llamada que devuelve el servidor del monorepo
// al contrato `SalesCall` que espera la UI portada de Auditor22.

function normalizeSpeaker(speaker?: string): 'Vendedor' | 'Cliente' {
  const s = (speaker || '').toLowerCase();
  if (
    s.includes('cliente') ||
    s.includes('clien') ||
    s === 'c' ||
    s === '1' ||
    s.includes('prospect')
  ) {
    return 'Cliente';
  }
  return 'Vendedor';
}

function normalizeSentiment(sentiment?: string): 'positive' | 'neutral' | 'negative' {
  if (sentiment === 'positive') return 'positive';
  if (sentiment === 'negative') return 'negative';
  return 'neutral';
}

function normalizeChecklist(raw: any): UtelChecklistItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item: any, i: number) => {
    const weight = typeof item.weight === 'number' ? item.weight : 1;
    const score = typeof item.score === 'number' ? item.score : 0;
    let status: UtelChecklistItem['status'] = 'failed';
    if (item.status === 'passed' || item.status === 'failed' || item.status === 'not_applicable') {
      status = item.status;
    } else {
      status = score >= weight * 0.7 ? 'passed' : 'failed';
    }
    return {
      id: item.id || `C${i + 1}`,
      title: item.title || `Criterio ${i + 1}`,
      weight,
      score,
      status,
      feedback: item.feedback || '',
      subitems: Array.isArray(item.subitems)
        ? item.subitems.map((s: any) => ({
            id: s.id || '',
            name: s.name || '',
            weight: typeof s.weight === 'number' ? s.weight : 0,
            checked: !!s.checked,
            notes: s.notes,
          }))
        : undefined,
    };
  });
}

function normalizeUtel(raw: any): UtelEvaluation | undefined {
  if (!raw || typeof raw !== 'object') return undefined;

  const modalities: UtelEvaluation['modalidadDetectada'][] = [
    'LÍNEA',
    'EJECUTIVA',
    'HÍBRIDA',
    'NO_DETECTADA',
  ];
  const modalidadDetectada = modalities.includes(raw.modalidadDetectada)
    ? raw.modalidadDetectada
    : 'NO_DETECTADA';

  const checklist = normalizeChecklist(raw.checklist);

  return {
    totalScore: typeof raw.totalScore === 'number' ? raw.totalScore : 0,
    isCompliant: !!raw.isCompliant,
    checkedItemsCount:
      typeof raw.checkedItemsCount === 'number' ? raw.checkedItemsCount : checklist.length,
    modalidadDetectada,
    checklist,
    evaluacion_detallada: raw.evaluacion_detallada || {},
  };
}

function normalizeAnalysis(raw: any): CallAnalysis {
  const analysis: CallAnalysis = {
    summary: raw?.summary || 'Sin resumen disponible.',
    strengths: Array.isArray(raw?.strengths) ? raw.strengths : [],
    weaknesses: Array.isArray(raw?.weaknesses) ? raw.weaknesses : [],
    nextSteps: Array.isArray(raw?.nextSteps) ? raw.nextSteps : [],
    customerMood: (['receptivo', 'molesto', 'neutral', 'interesado', 'indiferente'] as const).includes(
      raw?.customerMood,
    )
      ? raw.customerMood
      : 'neutral',
    salesOutcome: (
      ['venta_cerrada', 'interesado_seguimiento', 'no_interesado', 'agenda_demostracion'] as const
    ).includes(raw?.salesOutcome)
      ? raw.salesOutcome
      : 'interesado_seguimiento',
  };

  const utel = normalizeUtel(raw?.utel);
  if (utel) analysis.utel = utel;

  if (raw?.emotionalAnalysis && typeof raw.emotionalAnalysis === 'object') {
    const ea = raw.emotionalAnalysis;
    analysis.emotionalAnalysis = {
      primaryEmotion: ea.primaryEmotion || 'Receptivo / Interesado',
      emotionalJourney: ea.emotionalJourney || 'Estable con propensión positiva.',
      purchaseAptitudeScore:
        typeof ea.purchaseAptitudeScore === 'number' ? ea.purchaseAptitudeScore : 0,
      purchaseAptitudeLabel: (['Muy Alto', 'Alto', 'Medio', 'Bajo', 'Nulo'] as const).includes(
        ea.purchaseAptitudeLabel,
      )
        ? ea.purchaseAptitudeLabel
        : 'Medio',
      barriersToPurchase: Array.isArray(ea.barriersToPurchase) ? ea.barriersToPurchase : [],
      buyingSignals: Array.isArray(ea.buyingSignals) ? ea.buyingSignals : [],
      aptitudeReason: ea.aptitudeReason || '',
    };
  }

  return analysis;
}

function normalizeScore(raw: any): CallScore {
  const score = raw?.score || raw || {};
  const global =
    typeof score.global === 'number'
      ? score.global
      : typeof (raw?.utel?.totalScore) === 'number'
        ? Math.round(raw.utel.totalScore * 10)
        : 0;
  return {
    global,
    greeting: typeof score.greeting === 'number' ? score.greeting : 80,
    needDiscovery: typeof score.needDiscovery === 'number' ? score.needDiscovery : 70,
    objectionHandling: typeof score.objectionHandling === 'number' ? score.objectionHandling : 60,
    closingSkills: typeof score.closingSkills === 'number' ? score.closingSkills : 50,
    empathy: typeof score.empathy === 'number' ? score.empathy : 70,
  };
}

function normalizeMetadata(raw: any, id: string): CallMetadata {
  const meta = raw?.metadata || {};
  let status: CallMetadata['status'] = 'completed';
  const rawStatus = String(meta.status || '').toLowerCase();
  if (rawStatus.includes('error') || rawStatus === 'failed') status = 'failed';
  else if (rawStatus.includes('processing') || rawStatus.includes('transcrib')) {
    status = 'processing';
  }
  return {
    fileName: meta.fileName || `Llamada_${id}`,
    url: meta.url || `/api/audio/${id}`,
    size: typeof meta.size === 'number' ? meta.size : 0,
    duration: typeof meta.duration === 'number' ? meta.duration : 0,
    uploadedAt: meta.uploadedAt || new Date().toISOString(),
    uploadedBy: meta.uploadedBy || 'Sistema Automatizado',
    status,
    error: meta.error || null,
  };
}

function normalizeTranscription(raw: any): TranscriptionUtterance[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((u: any) => u && typeof u === 'object' && u.text)
    .map((u: any) => ({
      speaker: normalizeSpeaker(u.speaker),
      start: typeof u.start === 'number' ? u.start : typeof u.seconds === 'number' ? u.seconds : 0,
      end: typeof u.end === 'number' ? u.end : typeof u.seconds === 'number' ? u.seconds : 0,
      text: u.text,
      sentiment: normalizeSentiment(u.sentiment),
      confidence: typeof u.confidence === 'number' ? u.confidence : 0.95,
    }));
}

export function adaptCall(raw: any): SalesCall {
  const id = raw?.id || `call_${Date.now()}`;
  const analysis = normalizeAnalysis(raw?.analysis || raw);
  const score = normalizeScore(raw?.score || raw);
  if (score.global === 0 && analysis.utel) {
    score.global = Math.round(analysis.utel.totalScore * 10);
  }

  return {
    id,
    metadata: normalizeMetadata(raw, id),
    score,
    analysis,
    transcription: normalizeTranscription(raw?.transcription),
    isLocalCacheOnly: !!raw?.isLocalCacheOnly,
    isFromDrive: !!raw?.isFromDrive,
  };
}

export function adaptCallList(raw: any[] | undefined): SalesCall[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(adaptCall);
}
