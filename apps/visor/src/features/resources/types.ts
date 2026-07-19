// ─── LEGACY (mantener durante transición) ──────────────────────
export interface Speech {
  id: string;
  title: string;
  content: string;
  isCustom?: boolean;
}

export interface SpeechSection {
  id: string;
  icon: string;
  title: string;
  speeches: Speech[];
  flow?: FlowConfig;
}

export interface FlowStep {
  id: string;
  type: 'content' | 'decision';
  title?: string;
  content?: string;
  prompt?: string;
  options?: { label: string; value: string }[];
}

export interface FlowConfig {
  steps: FlowStep[];
}

export interface ObjectionResponse {
  id: string;
  title: string;
  content: string;
  isCustom?: boolean;
}

export interface ObjectionCategory {
  id: string;
  icon: string;
  title: string;
  objection: string;
  responses: ObjectionResponse[];
  psychology?: ObjectionPsychology;
}

export interface CallStep {
  id: string;
  type: 'section' | 'custom';
  sectionId?: string;
  speechId?: string;
  title?: string;
  content?: string;
  customType?: 'text' | 'objection';
  skipped?: boolean;
}

export interface SafeCheckItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface ProfileTags {
  trabaja: boolean;
  tieneHijos: boolean;
  preocupadoCostos: boolean;
}

export interface CallNote {
  id: string;
  content: string;
  timestamp: number;
}

export type ActiveTab = 'speeches' | 'newcall' | 'objections' | 'notes' | 'carreras';

export type CostDecision = 'yes' | 'no' | null;

// ─── NUEVO SISTEMA GPS ─────────────────────────────────────────

export type PsychPrinciple =
  | 'compromiso'
  | 'consistencia'
  | 'reciprocidad'
  | 'prueba_social'
  | 'autoridad'
  | 'contraste'
  | 'visualizacion'
  | 'aversion_perdida'
  | 'costo_oportunidad'
  | 'anclaje'
  | 'escasez'
  | 'empatia'
  | 'identificacion'
  | 'compromiso_social'
  | 'contraprestacion';

export const PRINCIPLE_LABELS: Record<PsychPrinciple, string> = {
  compromiso: 'Compromiso',
  consistencia: 'Consistencia',
  reciprocidad: 'Reciprocidad',
  prueba_social: 'Prueba Social',
  autoridad: 'Autoridad',
  contraste: 'Contraste',
  visualizacion: 'Visualización',
  aversion_perdida: 'Aversión a la Pérdida',
  costo_oportunidad: 'Costo de Oportunidad',
  anclaje: 'Anclaje',
  escasez: 'Escasez',
  empatia: 'Empatía',
  identificacion: 'Identificación',
  compromiso_social: 'Compromiso Social',
  contraprestacion: 'Contraprestación',
};

export const PRINCIPLE_ICONS: Record<PsychPrinciple, string> = {
  compromiso: '🤝',
  consistencia: '🔄',
  reciprocidad: '🎁',
  prueba_social: '👥',
  autoridad: '🛡️',
  contraste: '⚖️',
  visualizacion: '🔮',
  aversion_perdida: '⏳',
  costo_oportunidad: '📊',
  anclaje: 'Anchor',
  escasez: '⏰',
  empatia: '💙',
  identificacion: '🪞',
  compromiso_social: '👨‍👩‍👧',
  contraprestacion: '💎',
};

export type BlockTiming =
  | 'apertura'
  | 'descubrimiento'
  | 'construccion'
  | 'antes_precio'
  | 'post_objecion'
  | 'cierre'
  | 'emocional'
  | 'urgencia';

export const TIMING_LABELS: Record<BlockTiming, string> = {
  apertura: 'Apertura',
  descubrimiento: 'Descubrimiento',
  construccion: 'Construcción de valor',
  antes_precio: 'Antes del precio',
  post_objecion: 'Post-objeción',
  cierre: 'Cierre',
  emocional: 'Emocional',
  urgencia: 'Urgencia',
};

export type ProfileTag =
  | 'trabaja'
  | 'no_trabaja'
  | 'tiene_hijos'
  | 'sin_hijos'
  | 'preocupado_costos'
  | 'preocupado_tiempo'
  | 'preocupado_calidad'
  | 'quiere_crecer'
  | 'quiere_cambiar'
  | 'quiere_titulo'
  | 'quiere_ascenso'
  | 'quiere_emprender'
  | 'familia_apoyo'
  | 'primera_universidad'
  | 'ya_tiene_opcion'
  | 'motivacion_emocional'
  | 'motivacion_laboral'
  | 'motivacion_personal'
  | 'dudoso'
  | 'resistente';

export type Motivation =
  | 'crecer_laboral'
  | 'mejor_salario'
  | 'cambiar_carrera'
  | 'obtener_titulo'
  | 'familia'
  | 'ascenso'
  | 'emprender'
  | 'superacion_personal'
  | 'requisito_empresa';

export const MOTIVATION_LABELS: Record<Motivation, string> = {
  crecer_laboral: 'Crecer laboralmente',
  mejor_salario: 'Mejor salario',
  cambiar_carrera: 'Cambiar de área',
  obtener_titulo: 'Obtener título',
  familia: 'Familia',
  ascenso: 'Ascenso',
  emprender: 'Emprender',
  superacion_personal: 'Superación personal',
  requisito_empresa: 'Requisito empresa',
};

export const MOTIVATION_ICONS: Record<Motivation, string> = {
  crecer_laboral: '📈',
  mejor_salario: '💰',
  cambiar_carrera: '🔄',
  obtener_titulo: '🎓',
  familia: '👨‍👩‍👧',
  ascenso: '🚀',
  emprender: '💡',
  superacion_personal: '🌟',
  requisito_empresa: '🏢',
};

export type PainPoint =
  | 'no_tiempo'
  | 'no_dinero'
  | 'no_termino_universidad'
  | 'tiene_hijos'
  | 'trabaja'
  | 'quiere_ascender'
  | 'no_sabe_que_estudiar'
  | 'otra_universidad';

export const PAIN_LABELS: Record<PainPoint, string> = {
  no_tiempo: 'No tiene tiempo',
  no_dinero: 'No tiene dinero',
  no_termino_universidad: 'No terminó universidad',
  tiene_hijos: 'Tiene hijos',
  trabaja: 'Trabaja actualmente',
  quiere_ascender: 'Quiere ascender',
  no_sabe_que_estudiar: 'No sabe qué estudiar',
  otra_universidad: 'Ya tiene otra opción',
};

export const PAIN_ICONS: Record<PainPoint, string> = {
  no_tiempo: '⏰',
  no_dinero: '💸',
  no_termino_universidad: '📜',
  tiene_hijos: '👶',
  trabaja: '💼',
  quiere_ascender: '🎯',
  no_sabe_que_estudiar: '❓',
  otra_universidad: '🏫',
};

export type ConcernType =
  | 'precio'
  | 'tiempo'
  | 'calidad'
  | 'confianza'
  | 'modalidad'
  | 'familia';

export type ProspectEmotion =
  | 'interesado'
  | 'emocionado'
  | 'dudoso'
  | 'resistente'
  | 'satisfecho'
  | 'preocupado'
  | 'indiferente';

export const EMOTION_LABELS: Record<ProspectEmotion, string> = {
  interesado: 'Interesado',
  emocionado: 'Emocionado',
  dudoso: 'Dudoso',
  resistente: 'Resistente',
  satisfecho: 'Satisfecho',
  preocupado: 'Preocupado',
  indiferente: 'Indiferente',
};

export const EMOTION_ICONS: Record<ProspectEmotion, string> = {
  interesado: '🙂',
  emocionado: '🤩',
  dudoso: '🤔',
  resistente: '😤',
  satisfecho: '😊',
  preocupado: '😟',
  indiferente: '😐',
};

// ─── SMART BLOCK ───────────────────────────────────────────────

export interface SmartBlock {
  id: string;
  title: string;
  icon: string;
  objective: string;
  principle: PsychPrinciple;
  timing: BlockTiming[];
  versions: {
    short: string;
    medium: string;
    long: string;
  };
  followUpQuestions: string[];
  positiveSignals: string[];
  negativeSignals: string[];
  nextIfPositive: string;
  nextIfNegative: string;
  tags: ProfileTag[];
  priority: 1 | 2 | 3 | 4 | 5;
  used?: boolean;
}

// ─── SECTION META ──────────────────────────────────────────────

export interface SectionMeta {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  objective: string;
  targetEmotion: string;
  requiredInfo: string[];
  estimatedMinutes: number;
  impactLevel: 'bajo' | 'medio' | 'alto' | 'critico';
  blockIds: string[];
  skippable: boolean;
}

// ─── PROSPECT PROFILE ──────────────────────────────────────────

export interface ProspectProfile {
  nombre: string;
  carrera: string;
  motivations: Motivation[];
  painPoints: PainPoint[];
  situation: {
    trabaja: boolean;
    tieneHijos: boolean;
    tieneOtraOpcion: boolean;
    primeraUniversidad: boolean;
    preocupacionPrincipal: ConcernType | null;
  };
  detectedEmotion: ProspectEmotion | null;
  interestLevel: number | null;
  decision: CostDecision;
  rejectionReason: string | null;
  generatedTags: ProfileTag[];
}

export const DEFAULT_PROSPECT_PROFILE: ProspectProfile = {
  nombre: '',
  carrera: '',
  motivations: [],
  painPoints: [],
  situation: {
    trabaja: false,
    tieneHijos: false,
    tieneOtraOpcion: false,
    primeraUniversidad: false,
    preocupacionPrincipal: null,
  },
  detectedEmotion: null,
  interestLevel: null,
  decision: null,
  rejectionReason: null,
  generatedTags: [],
};

// ─── OBJECTION PSYCHOLOGY ──────────────────────────────────────

export interface ObjectionPsychology {
  realMeaning: string;
  emotionBehind: string;
  dontSay: string;
  recommendedSpeech: string;
  followUpQuestion: string;
  afterResponse: string;
}

// ─── VALUE CHECKLIST ───────────────────────────────────────────

export interface ValueCheckItem {
  id: string;
  label: string;
  checked: boolean;
}

export const DEFAULT_VALUE_CHECKLIST: ValueCheckItem[] = [
  { id: 'modalidad', label: 'Modalidad explicada', checked: false },
  { id: 'validez', label: 'Validez oficial explicada', checked: false },
  { id: 'flexibilidad', label: 'Flexibilidad explicada', checked: false },
  { id: 'duracion', label: 'Duración explicada', checked: false },
  { id: 'acompanamiento', label: 'Acompañamiento explicado', checked: false },
  { id: 'beneficio_personalizado', label: 'Beneficio personalizado según perfil', checked: false },
];

// ─── DEGREE CATALOG ──────────────────────────────────────────────

export type DegreeLevelType = 'licenciatura' | 'maestria' | 'doctorado';

export interface DegreeResource {
  id: string;
  type: 'image' | 'pdf' | 'link';
  label: string;
  url: string;
}

export interface DegreeProgram {
  id: string;
  name: string;
  level: DegreeLevelType;
  description: string;
  duration: string;
  modality: string;
  imageUrl: string;
  studyPlan: string;
  costs: string;
  requirements: string;
  benefits: string;
  resources: DegreeResource[];
}

export interface DegreeLevel {
  id: DegreeLevelType;
  label: string;
  icon: string;
  programs: DegreeProgram[];
}
