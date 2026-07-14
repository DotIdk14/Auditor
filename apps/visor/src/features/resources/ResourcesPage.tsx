import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquareText, AlertTriangle, StickyNote, Plus, X, CheckCircle2, Circle, ChevronDown, ChevronRight, ChevronLeft, ChevronUp, Pencil, Trash2, AlertCircle, Star, Phone, RotateCcw, ArrowUp, ArrowDown, BookOpen, XCircle } from 'lucide-react';

// ── Data layer (localStorage, ready for Supabase swap) ────────────
const CUSTOM_SPEECHES_KEY = 'customSpeeches';
const CUSTOM_OBJECTIONS_KEY = 'customObjections';
const DEFAULT_SPEECHES_KEY = 'defaultSpeeches';
const CALL_STEPS_KEY = 'callSteps';

function getCustomSpeeches(): Record<string, Speech[]> {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_SPEECHES_KEY) || '{}');
  } catch { return {}; }
}

function saveCustomSpeeches(data: Record<string, Speech[]>): void {
  localStorage.setItem(CUSTOM_SPEECHES_KEY, JSON.stringify(data));
}

function getCustomObjections(): Record<string, ObjectionResponse[]> {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_OBJECTIONS_KEY) || '{}');
  } catch { return {}; }
}

function saveCustomObjections(data: Record<string, ObjectionResponse[]>): void {
  localStorage.setItem(CUSTOM_OBJECTIONS_KEY, JSON.stringify(data));
}

function getDefaultSpeeches(): Record<string, string> {
  try {
    const stored = localStorage.getItem(DEFAULT_SPEECHES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Object.keys(parsed).length > 0) return parsed;
    }
  } catch {}
  return {
    bienvenida: 'apertura',
    sondeo: 'deteccion_necesidades',
    personalizar: 'modalidad_flexibilidad',
    costos: 'costos_inversion',
  };
}

function saveDefaultSpeeches(data: Record<string, string>): void {
  localStorage.setItem(DEFAULT_SPEECHES_KEY, JSON.stringify(data));
}

function getCallSteps(): CallStep[] | null {
  try {
    const raw = localStorage.getItem(CALL_STEPS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveCallSteps(data: CallStep[]): void {
  localStorage.setItem(CALL_STEPS_KEY, JSON.stringify(data));
}

// ── Types ─────────────────────────────────────────────────────────
interface Speech {
  id: string;
  title: string;
  content: string;
  isCustom?: boolean;
}

interface SpeechSection {
  id: string;
  icon: string;
  title: string;
  speeches: Speech[];
  flow?: FlowConfig;
}

interface FlowStep {
  id: string;
  type: 'content' | 'decision';
  title?: string;
  content?: string;
  prompt?: string;
  options?: { label: string; value: string }[];
}

interface FlowConfig {
  steps: FlowStep[];
}

interface ObjectionResponse {
  id: string;
  title: string;
  content: string;
  isCustom?: boolean;
}

interface ObjectionCategory {
  id: string;
  icon: string;
  title: string;
  objection: string;
  responses: ObjectionResponse[];
}

interface CallStep {
  id: string;
  type: 'section' | 'custom';
  sectionId?: string;
  speechId?: string;
  title?: string;
  content?: string;
  customType?: 'text' | 'objection';
  skipped?: boolean;
}

// ── Cost flow ─────────────────────────────────────────────────────
const costFlow: FlowConfig = {
  steps: [
    {
      id: 'ancla_precio',
      type: 'content',
      title: 'Precio Lista (Anclaje)',
      content: `Primero te platicaré sobre el precio lista, o sea, sin ningún tipo de descuento para que puedas ver la diferencia.\n\nColegiatura: $7,240 MXN\nInscripción: $1,000 MXN\nComplemento de Carrera: $2,000 MXN\n\n¿Qué te parece?`
    },
    {
      id: 'precio_beca',
      type: 'content',
      title: 'Precio Beca (Tu beneficio)',
      content: `Ahora te platico tu beca asignada.\n\nColegiatura: $2,419 MXN\nInscripción: ANULADA\nComplemento de Carrera: $1,000 MXN`
    },
    {
      id: 'referidos',
      type: 'content',
      title: 'Programa de Referidos',
      content: `Y algo que mucha gente no sabe: UTEL tiene un programa de referidos. Si conoces a alguien que también esté buscando estudiar una licenciatura, puedes referirlo y ambos reciben beneficios.\n\n¿Tienes alguien cercano que podría estar interesado en estudiar? Un familiar, un amigo o un compañero de trabajo?\n\n[Escuchar]\n\nEs una excelente forma de que ambos obtengan un beneficio adicional mientras ayudas a alguien a dar el paso hacia su educación superior.`
    },
    {
      id: 'beneficio_platzi',
      type: 'content',
      title: 'Beneficios Platzi + UTEL',
      content: `Además del precio, hay algo que quiero que sepas: UTEL tiene una alianza estratégica con Platzi. Esto significa que durante tu carrera tendrás acceso a contenido exclusivo, herramientas y metodologías de Platzi integradas en tu plan de estudios.\n\n¿Qué implica esto para ti?\n\n• Acceso a cursos y recursos de Platzi durante la carrera\n• Metodología práctica enfocada en el mundo real\n• Certificaciones que valoran las empresas\n• Comunidad de profesionistas y mentores\n\nEs un valor agregado que no todas las universidades ofrecen. ¿Qué te parece?`
    },
    {
      id: 'filtro',
      type: 'decision',
      prompt: '¿Se adapta a lo que buscas?',
      options: [
        { label: 'SÍ', value: 'yes' },
        { label: 'NO', value: 'no' }
      ]
    }
  ]
};

// ── Closing flow (success) ────────────────────────────────────────
const closingFlowSuccess: FlowStep = {
  id: 'cierre_exito',
  type: 'content',
  title: '¡Perfecto! Siguiente paso',
  content: `¡Perfecto! Para tu inscripción, necesitamos lo siguiente:\n\n• Documentos digitales (título, acta de nacimiento, CURP)\n• Solicitud de admisión (la genero yo con tus datos)\n• Primera colegiatura\n\n¿Tienes alguna duda sobre el proceso?`
};

// ── Objection reasons (dropdown for NO path) ──────────────────────
const objectionReasons = [
  { id: 'precio', label: 'Es muy caro / No alcanza', matchedObjections: ['costos', 'flexibilidad'] },
  { id: 'tiempo', label: 'No tengo tiempo', matchedObjections: ['tiempo', 'modalidad'] },
  { id: 'duda', label: 'Tengo dudas / Necesito pensarlo', matchedObjections: ['duda', 'confianza'] },
  { id: 'otra_opcion', label: 'Ya tengo otra opción', matchedObjections: ['competencia', 'calidad'] },
  { id: 'familia', label: 'Necesito consultarlo con mi familia', matchedObjections: ['familia', 'duda'] },
  { id: 'otro', label: 'Otro motivo', matchedObjections: [] as string[] },
];

// ── Default objection categories ──────────────────────────────────
const defaultObjectionCategories: ObjectionCategory[] = [
  {
    id: 'costos',
    icon: '💰',
    title: 'Es muy caro',
    objection: '"Es muy caro / No alcanza con mi presupuesto"',
    responses: [
      { id: 'costos_1', title: 'Facilidades de pago', content: 'Entiendo su perspectiva. Permítame mostrarle las facilidades de pago con las que contamos. Puede iniciar con un pago inicial muy accesible y el resto en mensualidades que se ajustan a su presupuesto.' },
      { id: 'costos_2', title: 'Beca reduce el costo', content: 'Lo que sucede es que muchos ven el precio completo, pero con la beca que usted tiene asignada la colegiatura baja significativamente. Además, el pago lo puede dividir en quincenas sin intereses adicionales.' },
    ]
  },
  {
    id: 'duda',
    icon: '🤔',
    title: 'Déjame pensarlo',
    objection: '"Déjame pensarlo / Necesito tiempo para decidir"',
    responses: [
      { id: 'duda_1', title: 'Agendar seguimiento', content: 'Por supuesto, es una decisión importante. ¿Qué tal si agendamos una llamada para resolver cualquier duda que surja? Mientras tanto, le envío la información por correo para que pueda revisarla con calma.' },
      { id: 'duda_2', title: 'Resumen de beneficios', content: 'Claro, tómate tu tiempo. Lo que sí me gustaría que sepas es que las becas tienen un periodo de vigencia. ¿Te parece si te doy un resumen de los puntos clave para que los tengas claros mientras decides?' },
    ]
  },
  {
    id: 'tiempo',
    icon: '⏰',
    title: 'No tengo tiempo',
    objection: '"No tengo tiempo para estudiar / Estoy muy ocupado"',
    responses: [
      { id: 'tiempo_1', title: 'Flexibilidad total', content: 'Justamente por eso UTEL es ideal. Nacimos como universidad en línea, todo está diseñado para personas que trabajan y tienen familia. Tú organizas tus horarios, no nosotros.' },
      { id: 'tiempo_2', title: 'Clases 24/7', content: 'Entiendo perfectamente. La mayoría de nuestros estudiantes trabajan tiempo completo. Con clases grabadas que puedes ver a cualquier hora y materiales disponibles 24/7, tú defines cuándo estudiar.' },
    ]
  },
  {
    id: 'modalidad',
    icon: '🖥️',
    title: 'No me convence la modalidad',
    objection: '"Prefiero una universidad presencial / No me gusta en línea"',
    responses: [
      { id: 'modalidad_1', title: 'Nacimos en línea', content: 'Lo entiendo, muchas personas piensan eso al principio. Pero déjeme comentarle que UTEL no es una universidad tradicional adaptada a línea, nacimos así. Nuestro aula virtual tiene tutorías en vivo, grupos de estudio y acompañamiento personalizado.' },
      { id: 'modalidad_2', title: 'Acompañamiento vivo', content: 'Es una preocupación muy válida. Sin embargo, nuestro modelo incluye webinarios ao vivo, tutorías personalizadas y un gestor académico que te acompaña durante toda la carrera. No estarás solo en el proceso.' },
    ]
  },
  {
    id: 'competencia',
    icon: '🔄',
    title: 'Ya tengo otra opción',
    objection: '"Ya estoy inscrito en otra universidad / Ya tengo otra opción"',
    responses: [
      { id: 'competencia_1', title: 'Comparar beneficios', content: 'Me alegra que estés explorando opciones. ¿Qué es lo que más te ha gustado de esa universidad? Quizás UTEL puede ofrecerte algo similar con la ventaja de la flexibilidad y las becas disponibles.' },
      { id: 'competencia_2', title: 'Ventajas UTEL', content: 'Perfecto, tener opciones es bueno. Lo que te puedo decir es que UTEL cuenta con Reconocimiento de Validez Oficial, aulas virtuales 24/7 y becas que hacen la inversión más accesible. ¿Te gustaría comparar?' },
    ]
  },
  {
    id: 'confianza',
    icon: '🛡️',
    title: 'No conozco UTEL',
    objection: '"No conozco la universidad / ¿Es de fiar?"',
    responses: [
      { id: 'confianza_1', title: 'Trayectoria y RVOE', content: 'UTEL es una universidad con más de 15 años de trayectoria, con Reconocimiento de Validez Oficial de Estudios (RVOE) por la SEP. Cientos de egresados ya ejercen profesionalmente con nuestro título.' },
      { id: 'confianza_2', title: 'Acreditación internacional', content: 'Es normal tener esa duda. UTEL es la universidad en línea más grande de México. Contamos con acreditación internacional y nuestro título tiene la misma validez que cualquier universidad presencial.' },
    ]
  },
  {
    id: 'calidad',
    icon: '⭐',
    title: '¿La educación es buena?',
    objection: '"¿La educación en línea es realmente buena?"',
    responses: [
      { id: 'calidad_1', title: 'Docentes en activo', content: 'Nuestros egresados tienen las mismas competencias que cualquier profesional. El modelo educativo está diseñado para que apliques lo que aprendes directamente en tu trabajo. Además, contamos con docentes en activo en el sector.' },
      { id: 'calidad_2', title: 'Modelo práctico', content: 'La educación en línea de UTEL no es simplemente contenido grabado. Tenemos seguimiento personalizado, evaluaciones constantes y un modelo pedagógico que asegura que realmente aprendas y no solo "pases materias".' },
    ]
  },
  {
    id: 'familia',
    icon: '👥',
    title: 'Necesito consultarlo',
    objection: '"Necesito consultarlo con mi familia / pareja"',
    responses: [
      { id: 'familia_1', title: 'Resumen para compartir', content: 'Por supuesto, es una decisión importante y es bueno contar con el apoyo de tu familia. ¿Te gustaría que te prepare un resumen con los puntos clave que puedas compartir con ellos? También podemos hacer una llamada juntos si lo prefieres.' },
      { id: 'familia_2', title: 'Enviar información', content: 'Totalmente de acuerdo. Muchos de nuestros estudiantes comenzaron así. Te puedo enviar toda la información por correo para que la revisen con calma. ¿Quién más estaría involucrado en la decisión?' },
    ]
  },
];

// ── Default speeches ──────────────────────────────────────────────
const defaultSpeechSections: SpeechSection[] = [
  {
    id: 'bienvenida',
    icon: '👋',
    title: 'Bienvenida / Abrir',
    speeches: [
      {
        id: 'apertura',
        title: 'Apertura',
        content: `Hola, buen día/tarde/noche. ¿Me comunico con [Nombre]? Mucho gusto, soy Ian Jarquín, asesor educativo de UTEL Universidad. ¿Cómo te encuentras el día de hoy?\n\n[Escuchar y responder: "Qué bueno, me da gusto escucharte."]\n\nTe contacto porque vi que solicitaste información sobre nuestra Licenciatura en [Carrera], ¿correcto?\n\n[Escuchar y responder: "Perfecto."]\n\nPara brindarte mejor atención, dime, ¿actualmente ya cuentas con tu certificado de bachillerato?\n\n[Escuchar y responder: "Excelente."]\n\nY cuéntame, ¿esta sería la primera universidad que estás revisando o ya habías solicitado información en alguna otra institución?`
      }
    ]
  },
  {
    id: 'sondeo',
    icon: '🔍',
    title: 'Sondeo / Aprender',
    speeches: [
      {
        id: 'deteccion_necesidades',
        title: 'Detección de Necesidades',
        content: `Perfecto, gracias por compartirme eso. Para poder recomendarte mejor la opción, me gustaría conocer un poco más de ti. ¿Qué fue lo que te motivó a buscar una licenciatura en este momento?\n\n[Escuchar y responder: "Entiendo."]\n\nY actualmente, ¿te encuentras trabajando, estudiando o realizando alguna otra actividad?\n\n[Escuchar y responder: "Perfecto."]\n\n¿La idea de estudiar esta carrera va más enfocada a crecer laboralmente, cambiar de área, mejorar tus oportunidades o es principalmente un objetivo personal de obtener tu título?\n\n[Escuchar y responder: "Muy bien."]\n\nY pensando a futuro, si en algunos años ya tuvieras tu título profesional y la preparación que buscas, ¿qué te gustaría que cambiara para ti a nivel laboral, económico o personal?`
      }
    ]
  },
  {
    id: 'personalizar',
    icon: '⚡',
    title: 'Personalizar / Asesorar',
    speeches: [
      {
        id: 'modalidad_flexibilidad',
        title: 'Modalidad y Flexibilidad UTEL',
        content: `Excelente, me gusta porque tienes claro lo que buscas alcanzar. Por lo que me comentas, considero que UTEL puede ser una opción que se adapte muy bien a tu situación. Algo importante es que nosotros nacimos como universidad en línea; no tuvimos que adaptarnos después a esta modalidad, sino que todos nuestros procesos fueron diseñados para personas que trabajan, tienen familia o necesitan flexibilidad.\n\nActualmente contamos con aula virtual disponible las 24 horas, clases y materiales en línea, actividades organizadas durante la semana y acceso desde celular, tablet o computadora, sin necesidad de trasladarte a un campus.\n\nDe hecho, para entender cómo podrías organizarlo: Si tú pudieras diseñar tu horario ideal para estudiar, ¿en qué momento del día crees que podrías dedicarle tiempo a tu carrera?\n\n[Escuchar]\n\nJustamente esa es una de las ventajas: tú adaptas la universidad a tu rutina, no tu rutina a la universidad.`
      },
      {
        id: 'explicacion_licenciatura',
        title: 'Explicación de la Licenciatura',
        content: `Ahora sí, déjame platicarte un poco más sobre la Licenciatura en [Carrera]. Tiene una duración aproximada de [duración]. El plan de estudios está diseñado para que avances desarrollando conocimientos y competencias que puedas aplicar en el área profesional.\n\nDentro de la carrera podrás encontrar temas clave como: [Materia o área 1], [Materia o área 2], [Materia o área 3] y [Materia o área 4]. Lo interesante es que desde los primeros periodos empiezas a desarrollar habilidades que puedes aplicar en proyectos personales o laborales.\n\nMe comentabas que buscabas la licenciatura por [RESPUESTA DE SONDEO], ¿verdad?`
      },
      {
        id: 'validez_titulacion',
        title: 'Validez Oficial y Titulación',
        content: `UTEL cuenta con Reconocimiento de Validez Oficial de Estudios (RVOE), por lo que tus estudios tienen respaldo oficial en México. Al concluir tu trayectoria académica podrás iniciar tu proceso de titulación de acuerdo con los requisitos del programa.\n\nPara ti, ¿qué tan importante es que la universidad tenga validez oficial y que puedas obtener un título profesional?`
      },
      {
        id: 'acompanamiento_academico',
        title: 'Acompañamiento Académico',
        content: `Perfecto. Otro punto importante es que durante la carrera no estarás solo. Tendrás el acompañamiento constante de docentes, un gestor académico, el área de éxito estudiantil y un equipo de revisión académica. La idea es que tengas apoyo durante todo el proceso y puedas avanzar correctamente.`
      },
    ]
  },
  {
    id: 'costos',
    icon: '💰',
    title: 'Oferta Económica / Alianza Platzi',
    speeches: [
      {
        id: 'costos_inversion',
        title: 'Inversión vs. Beneficio',
        content: `Muchas personas solo ven el costo, pero yo te invito a que lo veas como una inversión. ¿Cuánto crees que ganas actualmente sin título? Y con título, ¿cuánto podrías estar ganando?\n\nLa diferencia entre lo que inviertes y lo que puedes llegar a ganar en unos años es significativa. No es un gasto, es la inversión más importante que puedes hacer en ti mismo.\n\n¿Has pensado en cuánto te gustaría ganar en los próximos 3-5 años?`
      }
    ],
    flow: costFlow
  },
  {
    id: 'acordar',
    icon: '📝',
    title: 'Acordar (cierre)',
    speeches: []
  }
];

// ── Helpers ───────────────────────────────────────────────────────
const ALL_SECTIONS = defaultSpeechSections;

const DEFAULT_CALL_STEPS: CallStep[] = [
  { id: 'call_bienvenida', type: 'section', sectionId: 'bienvenida' },
  { id: 'call_sondeo', type: 'section', sectionId: 'sondeo' },
  { id: 'call_personalizar', type: 'section', sectionId: 'personalizar' },
  { id: 'call_costos', type: 'section', sectionId: 'costos' },
  { id: 'call_acordar', type: 'section', sectionId: 'acordar' },
];

// ── Component ─────────────────────────────────────────────────────
export default function ResourcesPage() {
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();

  const [activeTab, setActiveTab] = useState<'speeches' | 'newcall' | 'objections' | 'notes'>('speeches');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [completedSpeeches, setCompletedSpeeches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('completedSpeeches') || '[]'); } catch { return []; }
  });
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const [customSpeeches, setCustomSpeeches] = useState<Record<string, Speech[]>>(getCustomSpeeches);
  const [showSpeechModal, setShowSpeechModal] = useState(false);
  const [editingSpeech, setEditingSpeech] = useState<{ sectionId: string; speech: Speech } | null>(null);
  const [speechForm, setSpeechForm] = useState({ title: '', content: '' });

  const [defaultSpeeches, setDefaultSpeeches] = useState<Record<string, string>>(getDefaultSpeeches);

  const [customObjections, setCustomObjections] = useState<Record<string, ObjectionResponse[]>>(getCustomObjections);
  const [showObjectionModal, setShowObjectionModal] = useState(false);
  const [editingObjection, setEditingObjection] = useState<{ categoryId: string; response: ObjectionResponse } | null>(null);
  const [objectionForm, setObjectionForm] = useState({ title: '', content: '' });
  const [usedResponses, setUsedResponses] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('usedResponses') || '[]'); } catch { return []; }
  });

  // Legacy flow state (kept for compatibility)
  const [costStep, setCostStep] = useState(0);
  const [costDecision, setCostDecision] = useState<'yes' | 'no' | null>(null);
  const [costReason, setCostReason] = useState<string | null>(null);

  // Call flow state
  const [callSteps, setCallSteps] = useState<CallStep[]>(() => {
    return getCallSteps() || [...DEFAULT_CALL_STEPS];
  });
  const [currentCallStep, setCurrentCallStep] = useState(0);
  const [callCostStep, setCallCostStep] = useState(0);
  const [callCostDecision, setCallCostDecision] = useState<'yes' | 'no' | null>(null);
  const [callCostReason, setCallCostReason] = useState<string | null>(null);
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([0]));
  const [showDemoInvite, setShowDemoInvite] = useState(false);

  // Call variables (editable per call)
  const [callVariables, setCallVariables] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('callVariables') || '{}'); } catch { return {}; }
  });
  const [showVarsPanel, setShowVarsPanel] = useState(false);

  // Interest decision after personalizar
  const [callInterestDecision, setCallInterestDecision] = useState<'yes' | 'no' | null>(null);

  // Notes drawer state
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const [notes, setNotes] = useState<{id: string, content: string, timestamp: number}[]>(() => {
    try { return JSON.parse(localStorage.getItem('callNotes') || '[]'); } catch { return []; }
  });
  const [currentNote, setCurrentNote] = useState('');

  // Add step modal
  const [showAddStepModal, setShowAddStepModal] = useState(false);
  const [addStepForm, setAddStepForm] = useState({ title: '', content: '', objectionCategoryId: '' });
  const [addStepMode, setAddStepMode] = useState<'text' | 'objection'>('text');

  // ── Effects ───────────────────────────────────────────────────
  useEffect(() => { localStorage.setItem('completedSpeeches', JSON.stringify(completedSpeeches)); }, [completedSpeeches]);
  useEffect(() => { localStorage.setItem('usedResponses', JSON.stringify(usedResponses)); }, [usedResponses]);
  useEffect(() => { saveDefaultSpeeches(defaultSpeeches); }, [defaultSpeeches]);
  useEffect(() => { saveCallSteps(callSteps); }, [callSteps]);
  useEffect(() => { localStorage.setItem('callNotes', JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem('callVariables', JSON.stringify(callVariables)); }, [callVariables]);

  // ── Computed ──────────────────────────────────────────────────
  const getMergedObjections = useCallback((): ObjectionCategory[] => {
    return defaultObjectionCategories.map(cat => ({
      ...cat,
      responses: [
        ...cat.responses,
        ...(customObjections[cat.id] || []).map(r => ({ ...r, isCustom: true }))
      ]
    }));
  }, [customObjections]);

  const mergedObjections = getMergedObjections();

  const getSectionSpeeches = useCallback((sectionId: string): Speech[] => {
    const section = defaultSpeechSections.find(s => s.id === sectionId);
    if (!section) return [];
    return [
      ...section.speeches,
      ...(customSpeeches[sectionId] || []).map(s => ({ ...s, isCustom: true }))
    ];
  }, [customSpeeches]);

  const callTotalSteps = callSteps.length;
  const callProgress = callTotalSteps > 0 ? Math.round(((currentCallStep + 1) / callTotalSteps) * 100) : 0;

  const allSectionsMerged = ALL_SECTIONS.map(section => {
    const allSpeeches = [
      ...section.speeches,
      ...(customSpeeches[section.id] || []).map(s => ({ ...s, isCustom: true }))
    ];
    const defaultId = defaultSpeeches[section.id];
    if (defaultId) {
      const defaultIdx = allSpeeches.findIndex(s => s.id === defaultId);
      if (defaultIdx > 0) {
        const [def] = allSpeeches.splice(defaultIdx, 1);
        allSpeeches.unshift(def);
      }
    }
    return { ...section, speeches: allSpeeches };
  });

  const catalogTotalSpeeches = allSectionsMerged.reduce((acc, s) => acc + s.speeches.length, 0);
  const catalogCompletedCount = allSectionsMerged.reduce(
    (acc, s) => acc + s.speeches.filter(speech => completedSpeeches.includes(speech.id)).length, 0
  );
  const sectionsWithFavorite = allSectionsMerged.filter(s => defaultSpeeches[s.id]).length;

  const safeCallStep = callSteps[currentCallStep] || callSteps[0];

  // ── Handlers ──────────────────────────────────────────────────
  const toggleSpeech = (id: string) => {
    setCompletedSpeeches(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const toggleUsedResponse = (id: string) => {
    setUsedResponses(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => prev.includes(sectionId) ? prev.filter(s => s !== sectionId) : [...prev, sectionId]);
  };

  const setDefaultSpeech = (sectionId: string, speechId: string) => {
    setDefaultSpeeches(prev => {
      const updated = { ...prev };
      if (updated[sectionId] === speechId) { delete updated[sectionId]; } else { updated[sectionId] = speechId; }
      return updated;
    });
  };

  const handleResetAll = () => {
    setCompletedSpeeches([]);
    setCostStep(0);
    setCostDecision(null);
    setCostReason(null);
    setUsedResponses([]);
  };

  const openCreateModal = (sectionId: string) => {
    setEditingSpeech({ sectionId, speech: { id: '', title: '', content: '' } });
    setSpeechForm({ title: '', content: '' });
    setShowSpeechModal(true);
  };

  const openEditModal = (sectionId: string, speech: Speech) => {
    setEditingSpeech({ sectionId, speech });
    setSpeechForm({ title: speech.title, content: speech.content });
    setShowSpeechModal(true);
  };

  const handleSaveSpeech = () => {
    if (!editingSpeech || !speechForm.title.trim() || !speechForm.content.trim()) return;
    const { sectionId, speech } = editingSpeech;
    const updated = { ...customSpeeches };
    if (speech.id && speech.isCustom) {
      updated[sectionId] = (updated[sectionId] || []).map(s =>
        s.id === speech.id ? { ...s, title: speechForm.title, content: speechForm.content } : s
      );
    } else {
      const newSpeech: Speech = {
        id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title: speechForm.title, content: speechForm.content, isCustom: true
      };
      updated[sectionId] = [...(updated[sectionId] || []), newSpeech];
    }
    setCustomSpeeches(updated);
    saveCustomSpeeches(updated);
    setShowSpeechModal(false);
    setEditingSpeech(null);
    setSpeechForm({ title: '', content: '' });
  };

  const handleDeleteSpeech = (sectionId: string, speechId: string) => {
    const updated = { ...customSpeeches };
    updated[sectionId] = (updated[sectionId] || []).filter(s => s.id !== speechId);
    setCustomSpeeches(updated);
    saveCustomSpeeches(updated);
    setCompletedSpeeches(prev => prev.filter(id => id !== speechId));
  };

  const openCreateObjectionModal = (categoryId: string) => {
    setEditingObjection({ categoryId, response: { id: '', title: '', content: '' } });
    setObjectionForm({ title: '', content: '' });
    setShowObjectionModal(true);
  };

  const openEditObjectionModal = (categoryId: string, response: ObjectionResponse) => {
    setEditingObjection({ categoryId, response });
    setObjectionForm({ title: response.title, content: response.content });
    setShowObjectionModal(true);
  };

  const handleSaveObjection = () => {
    if (!editingObjection || !objectionForm.title.trim() || !objectionForm.content.trim()) return;
    const { categoryId, response } = editingObjection;
    const updated = { ...customObjections };
    if (response.id && response.isCustom) {
      updated[categoryId] = (updated[categoryId] || []).map(r =>
        r.id === response.id ? { ...r, title: objectionForm.title, content: objectionForm.content } : r
      );
    } else {
      const newResponse: ObjectionResponse = {
        id: `custom_obj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title: objectionForm.title, content: objectionForm.content, isCustom: true
      };
      updated[categoryId] = [...(updated[categoryId] || []), newResponse];
    }
    setCustomObjections(updated);
    saveCustomObjections(updated);
    setShowObjectionModal(false);
    setEditingObjection(null);
    setObjectionForm({ title: '', content: '' });
  };

  const handleDeleteObjection = (categoryId: string, responseId: string) => {
    const updated = { ...customObjections };
    updated[categoryId] = (updated[categoryId] || []).filter(r => r.id !== responseId);
    setCustomObjections(updated);
    saveCustomObjections(updated);
    setUsedResponses(prev => prev.filter(id => id !== responseId));
  };

  const checkObjectionRelevance = (catId: string, reason: string | null): boolean => {
    if (!reason) return false;
    const r = objectionReasons.find(rs => rs.id === reason);
    return r?.matchedObjections.includes(catId) ?? false;
  };

  const isObjectionRelevant = (catId: string) => checkObjectionRelevance(catId, costReason);

  // Script text renderer: substitutes variables, then formats ¿preguntas? → bold, [unfilled vars] → tags
  const renderScriptText = (text: string | undefined): React.ReactNode[] => {
    if (!text) return [];
    // Step 1: substitute variables from callVariables
    let substituted = text;
    Object.entries(callVariables).forEach(([key, value]) => {
      if (value.trim()) {
        substituted = substituted.split(`[${key}]`).join(value.trim());
      }
    });
    const parts: React.ReactNode[] = [];
    const regex = /(\[.*?\]|¿.*?\?)/g;
    let lastIndex = 0;
    let match;
    let key = 0;
    while ((match = regex.exec(substituted)) !== null) {
      if (match.index > lastIndex) parts.push(substituted.slice(lastIndex, match.index));
      const token = match[0];
      if (token.startsWith('[')) {
        parts.push(
          <span key={key++} className={`inline-block px-1.5 py-0.5 mx-0.5 rounded text-[9px] font-bold ${
            darkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-700'
          }`}>{token}</span>
        );
      } else {
        parts.push(
          <span key={key++} className={`font-bold ${darkMode ? 'text-stone-100' : 'text-stone-900'}`}>
            {token}
          </span>
        );
      }
      lastIndex = match.index + token.length;
    }
    if (lastIndex < substituted.length) parts.push(substituted.slice(lastIndex));
    return parts;
  };

  const getSortedObjections = useCallback((reason?: string | null): ObjectionCategory[] => {
    if (!reason) return mergedObjections;
    return [...mergedObjections].sort((a, b) => {
      const r = objectionReasons.find(rs => rs.id === reason);
      if (!r) return 0;
      return (r.matchedObjections.includes(a.id) ? -1 : 0) - (r.matchedObjections.includes(b.id) ? -1 : 0);
    });
  }, [mergedObjections]);

  // ── Call flow navigation ─────────────────────────────────────
  const goToNextCallStep = () => {
    if (currentCallStep < callSteps.length - 1) {
      setVisitedSteps(prev => new Set([...prev, currentCallStep]));
      setCurrentCallStep(prev => prev + 1);
      setCallCostStep(0);
      setShowDemoInvite(false);
    }
  };

  const goToPrevCallStep = () => {
    if (currentCallStep > 0) {
      setVisitedSteps(prev => new Set([...prev, currentCallStep]));
      setCurrentCallStep(prev => prev - 1);
      setCallCostStep(0);
      setShowDemoInvite(false);
    }
  };

  const skipCurrentCallStep = () => {
    setCallSteps(prev => prev.map((s, i) => i === currentCallStep ? { ...s, skipped: true } : s));
    goToNextCallStep();
  };

  const resetCall = () => {
    setCallSteps([...DEFAULT_CALL_STEPS]);
    setCurrentCallStep(0);
    setCallCostStep(0);
    setCallCostDecision(null);
    setCallCostReason(null);
    setVisitedSteps(new Set([0]));
    setShowDemoInvite(false);
    setCallInterestDecision(null);
  };

  const jumpToAcordar = () => {
    const acordarIdx = callSteps.findIndex(s => s.type === 'section' && s.sectionId === 'acordar');
    if (acordarIdx >= 0) {
      setVisitedSteps(prev => new Set([...prev, currentCallStep]));
      setCurrentCallStep(acordarIdx);
      setCallCostStep(0);
      setShowDemoInvite(false);
    }
  };

  const moveCallStep = (fromIdx: number, direction: 'up' | 'down') => {
    const toIdx = direction === 'up' ? fromIdx - 1 : fromIdx + 1;
    if (toIdx < 0 || toIdx >= callSteps.length) return;
    setCallSteps(prev => {
      const next = [...prev];
      [next[fromIdx], next[toIdx]] = [next[toIdx], next[fromIdx]];
      return next;
    });
    if (currentCallStep === fromIdx) setCurrentCallStep(toIdx);
    else if (currentCallStep === toIdx) setCurrentCallStep(fromIdx);
  };

  const removeCallStep = (idx: number) => {
    setCallSteps(prev => prev.filter((_, i) => i !== idx));
    if (currentCallStep >= idx && currentCallStep > 0) setCurrentCallStep(prev => prev - 1);
  };

  const addCustomStep = () => {
    if (addStepMode === 'text') {
      if (!addStepForm.title.trim() || !addStepForm.content.trim()) return;
      const newStep: CallStep = {
        id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type: 'custom', title: addStepForm.title, content: addStepForm.content, customType: 'text',
      };
      const insertIdx = currentCallStep + 1;
      setCallSteps(prev => [...prev.slice(0, insertIdx), newStep, ...prev.slice(insertIdx)]);
    } else {
      if (!addStepForm.objectionCategoryId || !addStepForm.content.trim()) return;
      const cat = defaultObjectionCategories.find(c => c.id === addStepForm.objectionCategoryId);
      const newStep: CallStep = {
        id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type: 'custom', title: addStepForm.title || `Objeción: ${cat?.title || ''}`,
        content: addStepForm.content, customType: 'objection',
      };
      const insertIdx = currentCallStep + 1;
      setCallSteps(prev => [...prev.slice(0, insertIdx), newStep, ...prev.slice(insertIdx)]);
    }
    setShowAddStepModal(false);
    setAddStepForm({ title: '', content: '', objectionCategoryId: '' });
  };

  // ── Render helpers ────────────────────────────────────────────
  const inputCls = darkMode
    ? 'bg-[#24211e] border-[#3e382f] text-stone-200 placeholder-stone-500 focus:border-[#d4a373]'
    : 'bg-[#fcfbf9] border-[#dfd9cc] text-stone-800 placeholder-stone-400 focus:border-[#d4a373]';

  const tabs = [
    { id: 'speeches', label: 'Speeches', icon: BookOpen },
    { id: 'newcall', label: 'Nueva Llamada', icon: Phone },
    { id: 'objections', label: 'Manejo Objeciones', icon: AlertTriangle },
    { id: 'notes', label: 'Mis Notas', icon: StickyNote },
  ];

  return (
    <div className="h-full overflow-y-auto p-6 pb-32">
      <h2 className={`text-lg font-bold font-display mb-6 ${darkMode ? 'text-stone-100' : 'text-stone-900'}`}>
        📚 Centro de Recursos
      </h2>

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <div className={`inline-flex p-1 rounded-2xl mb-8 ${darkMode ? 'bg-[#1c1a18] border border-[#3e382f]' : 'bg-stone-50 border border-stone-200'}`}>
        {tabs.map(tab => (
          <button key={tab.id}
            onClick={() => tab.id === 'notes' ? setShowNotesDrawer(true) : setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold transition-all ${
              activeTab === tab.id
                ? darkMode ? 'bg-amber-900/40 text-amber-500 shadow-inner' : 'bg-white text-[#b57b54] shadow-md border border-[#dfd9cc]'
                : darkMode ? 'text-stone-500 hover:text-stone-300' : 'text-stone-500 hover:text-stone-800'
            }`}>
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* ── SPEECHES TAB (CATALOG) ──────────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════ */}
      {activeTab === 'speeches' && (
        <div className="space-y-4">
          <div className={`flex items-center justify-between p-4 rounded-2xl border ${
            darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'
          }`}>
            <div className="space-y-1">
              <p className={`text-[11px] font-bold ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                Catálogo de Speeches
              </p>
              <p className={`text-[9px] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                {catalogCompletedCount} / {catalogTotalSpeeches} speeches completados · {sectionsWithFavorite} / {allSectionsMerged.length} secciones con favorito
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-24 h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-[#24211e]' : 'bg-stone-100'}`}>
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${catalogTotalSpeeches > 0 ? (catalogCompletedCount / catalogTotalSpeeches) * 100 : 0}%` }} />
              </div>
              {catalogCompletedCount > 0 && (
                <button onClick={handleResetAll}
                  className={`text-[9px] font-bold px-3 py-1.5 rounded-xl border transition-all ${
                    darkMode ? 'border-red-900/40 text-red-400 hover:bg-red-950/20' : 'border-red-200 text-red-500 hover:bg-red-50'
                  }`}>
                  Reiniciar
                </button>
              )}
            </div>
          </div>

          {allSectionsMerged.map((section) => {
            const isExpanded = expandedSections.includes(section.id);
            const sectionCompleted = section.speeches.length > 0 && section.speeches.every(s => completedSpeeches.includes(s.id));
            const sectionProgress = section.speeches.filter(s => completedSpeeches.includes(s.id)).length;
            return (
              <div key={section.id} className={`rounded-2xl border overflow-hidden transition-all ${
                sectionCompleted
                  ? darkMode ? 'bg-emerald-950/10 border-emerald-800/30' : 'bg-emerald-50/50 border-emerald-200'
                  : darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'
              }`}>
                <button onClick={() => toggleSection(section.id)}
                  className={`w-full flex items-center justify-between p-4 transition-all ${
                    darkMode ? 'hover:bg-[#24211e]' : 'hover:bg-stone-50'
                  }`}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{section.icon}</span>
                    <div className="text-left">
                      <h3 className={`text-xs font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                        {section.title}
                      </h3>
                      <p className={`text-[9px] mt-0.5 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                        {sectionProgress} / {section.speeches.length} speeches
                      </p>
                    </div>
                    {sectionCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-1" />}
                  </div>
                  <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className={`w-4 h-4 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`} />
                  </motion.div>
                </button>
                {isExpanded && (
                  <div className={`border-t ${darkMode ? 'border-[#3e382f]' : 'border-[#dfd9cc]'}`}>
                    <div className="p-4 space-y-3">
                      {section.speeches.map((speech) => {
                        const isCompleted = completedSpeeches.includes(speech.id);
                        const isCustom = speech.isCustom === true;
                        const isDefault = defaultSpeeches[section.id] === speech.id;
                        return (
                          <div key={speech.id} className={`rounded-xl border-[2px] p-4 transition-all ${
                            isCustom ? 'border-dashed ' : ''
                          }${
                            isCompleted ? darkMode ? 'bg-emerald-950/15 border-emerald-800/30' : 'bg-emerald-50/60 border-emerald-200'
                            : isCustom ? darkMode ? 'bg-[#24211e] border-amber-800/40' : 'bg-stone-50 border-amber-300'
                            : darkMode ? 'bg-[#24211e] border-[#4a4036]' : 'bg-stone-50 border-stone-200'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <h4 className={`text-[11px] font-bold font-display ${isCompleted ? 'line-through opacity-60' : ''} ${
                                  darkMode ? 'text-stone-200' : 'text-stone-800'
                                }`}>{speech.title}</h4>
                                {isDefault && (
                                  <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${
                                    darkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                                  }`}>⭐ Predeterminado</span>
                                )}
                                {isCustom && (
                                  <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${
                                    darkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'
                                  }`}>MI speech</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <button onClick={() => setDefaultSpeech(section.id, speech.id)}
                                  className={`p-1 rounded-lg transition-all hover:scale-110 ${
                                    isDefault ? 'text-yellow-500'
                                    : darkMode ? 'text-stone-500 hover:text-yellow-400' : 'text-stone-400 hover:text-yellow-500'
                                  }`} title={isDefault ? 'Quitar como predeterminado' : 'Marcar como predeterminado'}>
                                  <Star className={`w-3.5 h-3.5 ${isDefault ? 'fill-yellow-500' : ''}`} />
                                </button>
                                {isCustom && (
                                  <>
                                    <button onClick={() => openEditModal(section.id, speech)}
                                      className={`p-1 rounded-lg transition-all hover:scale-110 ${
                                        darkMode ? 'text-stone-500 hover:text-amber-400' : 'text-stone-400 hover:text-amber-600'
                                      }`}><Pencil className="w-3 h-3" /></button>
                                    <button onClick={() => handleDeleteSpeech(section.id, speech.id)}
                                      className={`p-1 rounded-lg transition-all hover:scale-110 ${
                                        darkMode ? 'text-stone-500 hover:text-red-400' : 'text-stone-400 hover:text-red-600'
                                      }`}><Trash2 className="w-3 h-3" /></button>
                                  </>
                                )}
                                <button onClick={() => toggleSpeech(speech.id)}
                                  className={`p-1 rounded-lg transition-all hover:scale-110 ${
                                    isCompleted ? 'text-emerald-500'
                                    : darkMode ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600'
                                  }`}>
                                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                            <div className={`text-[10px] leading-relaxed p-3 rounded-lg whitespace-pre-line ${
                              isCompleted ? darkMode ? 'bg-emerald-950/10 text-stone-500' : 'bg-emerald-50/40 text-stone-500'
                              : darkMode ? 'bg-[#1c1a18] text-stone-400' : 'bg-white text-stone-600'
                            }`}>{renderScriptText(speech.content)}</div>
                          </div>
                        );
                      })}
                      <button onClick={() => openCreateModal(section.id)}
                        className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed text-[10px] font-bold transition-all ${
                          darkMode ? 'border-[#4a4036] text-stone-500 hover:border-amber-800/40 hover:text-amber-400'
                          : 'border-stone-200 text-stone-400 hover:border-amber-300 hover:text-amber-600'
                        }`}>
                        <Plus className="w-3.5 h-3.5" /> Agregar speech
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* ── NEW CALL TAB (DYNAMIC FLOW) ─────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════ */}
      {activeTab === 'newcall' && (
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left: Mini-map */}
          <div className="w-full lg:w-72 shrink-0">
            <div className={`rounded-2xl border p-3 ${darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'}`}>
              <div className="flex items-center justify-between mb-3">
                <p className={`text-[10px] font-bold ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                  Mapa de la llamada
                </p>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>{callProgress}%</span>
                  <button onClick={resetCall} className={`p-1 rounded-lg transition-all hover:scale-110 ${
                    darkMode ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600'
                  }`} title="Reiniciar llamada"><RotateCcw className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden mb-3 ${darkMode ? 'bg-[#24211e]' : 'bg-stone-100'}`}>
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${callProgress}%` }} />
              </div>
              <div className="space-y-1">
                {callSteps.map((step, idx) => {
                  const isCurrent = idx === currentCallStep;
                  const isCompleted = step.skipped || visitedSteps.has(idx) || idx < currentCallStep;
                  const section = step.type === 'section' ? defaultSpeechSections.find(s => s.id === step.sectionId) : null;
                  const icon = step.type === 'custom' ? '✏️' : (section?.icon || '📋');
                  const title = step.type === 'custom' ? (step.title || 'Paso personalizado') : (section?.title || step.sectionId || '');
                  const isCostos = step.type === 'section' && step.sectionId === 'costos';
                  return (
                    <div key={step.id} className={`flex items-center gap-1.5 rounded-xl p-2 transition-all ${
                      isCurrent ? darkMode ? 'bg-amber-900/30 border border-amber-800/40' : 'bg-amber-50 border border-amber-200'
                      : isCompleted ? darkMode ? 'bg-emerald-950/10' : 'bg-emerald-50/50' : ''
                    }`}>
                      <button onClick={() => { setVisitedSteps(prev => new Set([...prev, currentCallStep])); setCurrentCallStep(idx); if (isCostos) setCallCostStep(0); }}
                        className="flex items-center gap-1.5 flex-1 min-w-0 text-left">
                        <span className={`shrink-0 ${
                          isCurrent ? 'text-amber-500' : isCompleted ? 'text-emerald-500' : darkMode ? 'text-stone-600' : 'text-stone-300'
                        }`}>
                          {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : isCurrent ? <ChevronRight className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                        </span>
                        <span className="text-sm shrink-0">{icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className={`text-[9px] font-bold truncate ${
                            isCurrent ? darkMode ? 'text-amber-400' : 'text-amber-700'
                            : isCompleted ? darkMode ? 'text-stone-400' : 'text-stone-500'
                            : darkMode ? 'text-stone-300' : 'text-stone-700'
                          }`}>{title}</p>
                          {isCostos && !isCompleted && callCostDecision === null && currentCallStep === idx && (
                            <p className={`text-[7px] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                              Paso {callCostStep + 1} de 4
                            </p>
                          )}
                        </div>
                      </button>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button onClick={() => moveCallStep(idx, 'up')} disabled={idx === 0}
                          className={`p-0.5 rounded transition-all disabled:opacity-20 ${
                            darkMode ? 'text-stone-600 hover:text-stone-300' : 'text-stone-300 hover:text-stone-600'
                          }`}><ArrowUp className="w-2.5 h-2.5" /></button>
                        <button onClick={() => moveCallStep(idx, 'down')} disabled={idx === callSteps.length - 1}
                          className={`p-0.5 rounded transition-all disabled:opacity-20 ${
                            darkMode ? 'text-stone-600 hover:text-stone-300' : 'text-stone-300 hover:text-stone-600'
                          }`}><ArrowDown className="w-2.5 h-2.5" /></button>
                        {step.type === 'custom' && (
                          <button onClick={() => removeCallStep(idx)}
                            className={`p-0.5 rounded transition-all ${
                              darkMode ? 'text-stone-600 hover:text-red-400' : 'text-stone-300 hover:text-red-500'
                            }`}><Trash2 className="w-2.5 h-2.5" /></button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button onClick={() => setShowAddStepModal(true)}
                className={`w-full mt-2 flex items-center justify-center gap-1.5 p-2 rounded-xl border-2 border-dashed text-[9px] font-bold transition-all ${
                  darkMode ? 'border-[#4a4036] text-stone-500 hover:border-amber-800/40 hover:text-amber-400'
                  : 'border-stone-200 text-stone-400 hover:border-amber-300 hover:text-amber-600'
                }`}>
                <Plus className="w-3 h-3" /> Agregar paso
              </button>
            </div>
          </div>

          {/* Right: Current step content */}
          <div className="flex-1 min-w-0">
            {safeCallStep && (() => {
              const currentStep = safeCallStep;

              if (currentStep.type === 'section') {
                const section = defaultSpeechSections.find(s => s.id === currentStep.sectionId);
                const speeches = getSectionSpeeches(currentStep.sectionId || '');

                return (
                  <div className="space-y-4">
                    <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{section?.icon || '📋'}</span>
                        <div>
                          <h3 className={`text-xs font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                            {section?.title || currentStep.sectionId}
                          </h3>
                          <p className={`text-[9px] mt-0.5 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                            Paso {currentCallStep + 1} de {callSteps.length}
                            {currentStep.skipped && <span className="ml-2 text-amber-500 font-bold">· Saltado</span>}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ── Variables de Llamada ─────────────────── */}
                    <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'}`}>
                      <button onClick={() => setShowVarsPanel(v => !v)}
                        className={`w-full flex items-center justify-between p-4 text-left transition-all ${darkMode ? 'hover:bg-[#24211e]' : 'hover:bg-stone-50'}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">✏️</span>
                          <span className={`text-[10px] font-bold font-display ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                            Variables de Llamada
                          </span>
                          {Object.values(callVariables).filter(v => v.trim()).length > 0 && (
                            <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                              {Object.values(callVariables).filter(v => v.trim()).length} configuradas
                            </span>
                          )}
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform ${showVarsPanel ? 'rotate-180' : ''} ${darkMode ? 'text-stone-500' : 'text-stone-400'}`} />
                      </button>
                      <AnimatePresence>
                        {showVarsPanel && (
                          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                            className="overflow-hidden">
                            <div className={`px-4 pb-4 pt-0 grid grid-cols-2 gap-3 border-t ${darkMode ? 'border-[#3e382f]' : 'border-stone-200'}`}>
                              {[
                                { key: 'Nombre', label: 'Nombre del cliente', placeholder: 'Ej: María López' },
                                { key: 'Carrera', label: 'Carrera', placeholder: 'Ej: Administración de Empresas' },
                              ].map(v => (
                                <div key={v.key}>
                                  <label className={`block text-[8px] font-bold mb-1 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                                    {v.label}
                                  </label>
                                  <input type="text" placeholder={v.placeholder}
                                    value={callVariables[v.key] || ''}
                                    onChange={(e) => setCallVariables(prev => ({ ...prev, [v.key]: e.target.value }))}
                                    className={`w-full px-2.5 py-1.5 rounded-lg border text-[10px] focus:outline-none transition-all ${
                                      callVariables[v.key]?.trim()
                                        ? darkMode ? 'bg-amber-950/10 border-amber-800/30 text-stone-200 placeholder-stone-600 focus:border-amber-700/50'
                                          : 'bg-amber-50/50 border-amber-200 text-stone-800 placeholder-stone-400 focus:border-amber-400'
                                        : darkMode ? 'bg-[#24211e] border-[#3e382f] text-stone-300 placeholder-stone-600 focus:border-[#d4a373]'
                                          : 'bg-[#fcfbf9] border-[#dfd9cc] text-stone-800 placeholder-stone-400 focus:border-[#d4a373]'
                                    }`}
                                  />
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {(() => {
                      if (currentStep.sectionId === 'personalizar' && speeches.length > 0) {
                        return (
                          <div className="space-y-3">
                            <p className={`text-[9px] font-bold ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                              Todos los beneficios que se le otorgan al cliente:
                            </p>
                            {speeches.map(speech => {
                              const isFav = defaultSpeeches['personalizar'] === speech.id;
                              const isCustom = speech.isCustom === true;
                              return (
                                <div key={speech.id} className={`rounded-xl border-[2px] p-4 ${isFav ? darkMode ? 'bg-[#24211e] border-emerald-800/30' : 'bg-emerald-50/50 border-emerald-200' : darkMode ? 'bg-[#24211e] border-[#4a4036]' : 'bg-stone-50 border-stone-200'}`}>
                                  <div className="flex items-center gap-2 mb-2">
                                    {isFav && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 shrink-0" />}
                                    <h4 className={`text-[11px] font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>{speech.title}</h4>
                                    {isCustom && (
                                      <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>MI speech</span>
                                    )}
                                  </div>
                                   <div className={`text-[10px] leading-relaxed p-3 rounded-lg whitespace-pre-line ${darkMode ? 'bg-[#1c1a18] text-stone-400' : 'bg-white text-stone-600'}`}>{renderScriptText(speech.content)}</div>
                                </div>
                              );
                            })}
                            {/* ── Interest Decision after Personalizar ── */}
                            {callInterestDecision === null && (
                              <div className={`rounded-2xl border-[2px] p-4 ${darkMode ? 'bg-[#24211e] border-amber-800/30' : 'bg-amber-50/50 border-amber-200'}`}>
                                <p className={`text-[11px] font-bold font-display mb-3 ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                                  ¿Le interesa continuar?
                                </p>
                                <p className={`text-[9px] mb-4 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                                  Selecciona SÍ o NO para continuar al cierre.
                                </p>
                                <div className="flex gap-3">
                                  <button onClick={() => { setCallInterestDecision('yes'); jumpToAcordar(); }}
                                    className="flex-1 py-3 rounded-xl bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-400 text-[11px] font-bold hover:bg-emerald-500/30 transition-all">
                                    SÍ — Le interesa
                                  </button>
                                  <button onClick={() => { setCallInterestDecision('no'); jumpToAcordar(); }}
                                    className="flex-1 py-3 rounded-xl bg-red-500/20 border-2 border-red-500/40 text-red-400 text-[11px] font-bold hover:bg-red-500/30 transition-all">
                                    NO — No le interesa
                                  </button>
                                </div>
                              </div>
                            )}
                            {callInterestDecision !== null && (
                              <div className={`flex items-center gap-3 p-4 rounded-xl ${callInterestDecision === 'yes'
                                ? darkMode ? 'bg-emerald-950/20 border border-emerald-800/30' : 'bg-emerald-50 border border-emerald-200'
                                : darkMode ? 'bg-red-950/20 border border-red-800/30' : 'bg-red-50 border border-red-200'
                              }`}>
                                {callInterestDecision === 'yes' ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                                <div>
                                  <p className={`text-[10px] font-bold ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                                    {callInterestDecision === 'yes' ? 'SÍ — Confirma interés' : 'NO — No le interesa'}
                                  </p>
                                  <p className={`text-[8px] mt-0.5 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                                    Saltado a Acordar
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }
                      const favId = currentStep.sectionId ? defaultSpeeches[currentStep.sectionId] : undefined;
                      const favSpeech = favId ? speeches.find(s => s.id === favId) : null;
                      if (favSpeech) {
                        return (
                          <div className="space-y-3">
                            <div className={`rounded-xl border-[2px] p-4 ${darkMode ? 'bg-[#24211e] border-emerald-800/30' : 'bg-emerald-50/50 border-emerald-200'}`}>
                              <div className="flex items-center gap-2 mb-2">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <p className={`text-[11px] font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                                  {favSpeech.title}
                                </p>
                                {favSpeech.isCustom && (
                                  <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>MI speech</span>
                                )}
                              </div>
                               <div className={`text-[10px] leading-relaxed p-3 rounded-lg whitespace-pre-line ${darkMode ? 'bg-[#1c1a18] text-stone-400' : 'bg-white text-stone-600'}`}>{renderScriptText(favSpeech.content)}</div>
                            </div>
                            {/* ── Sondeo Response Selector ── */}
                            {currentStep.sectionId === 'sondeo' && (
                              <div className={`rounded-2xl border-[2px] p-4 ${darkMode ? 'bg-[#24211e] border-amber-800/30' : 'bg-amber-50/50 border-amber-200'}`}>
                                <p className={`text-[11px] font-bold font-display mb-1 ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                                  ¿Qué respondió el cliente?
                                </p>
                                <p className={`text-[8px] mb-3 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                                  Selecciona la motivación principal. Se usará en el speech de Personalizar.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {[
                                    'Crecer laboralmente',
                                    'Cambiar de área',
                                    'Mejorar oportunidades',
                                    'Objetivo personal / obtener título',
                                    'Apoyo familiar',
                                    'Promoción o ascenso',
                                  ].map(option => {
                                    const isSelected = callVariables['RESPUESTA DE SONDEO'] === option;
                                    return (
                                      <button key={option}
                                        onClick={() => setCallVariables(prev => ({ ...prev, 'RESPUESTA DE SONDEO': isSelected ? '' : option }))}
                                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 text-[11px] font-bold transition-all ${
                                          isSelected
                                            ? darkMode ? 'bg-amber-900/50 border-amber-600 text-amber-200 shadow-lg shadow-amber-900/20 scale-105' : 'bg-amber-100 border-amber-500 text-amber-800 shadow-lg shadow-amber-200/40 scale-105'
                                            : darkMode ? 'bg-[#1c1a18] border-[#3e382f] text-stone-400 hover:border-amber-800/40 hover:text-amber-400'
                                              : 'bg-white border-stone-200 text-stone-500 hover:border-amber-300 hover:text-amber-700'
                                        }`}>
                                        {isSelected ? <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> : <Circle className="w-3 h-3 shrink-0" />}
                                        {option}
                                      </button>
                                    );
                                  })}
                                </div>
                                {callVariables['RESPUESTA DE SONDEO']?.trim() && (
                                  <p className={`text-[8px] mt-2 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                                    Se sustituirá <span className="font-bold text-amber-500">[RESPUESTA DE SONDEO]</span> en los scripts de Personalizar.
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      }
                      return (
                        <div className={`flex items-center gap-3 p-4 rounded-xl ${darkMode ? 'bg-[#24211e]' : 'bg-stone-50'}`}>
                          <AlertCircle className={`w-5 h-5 shrink-0 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`} />
                          <p className={`text-[11px] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                            No hay favorito en esta sección. Selecciona uno en la pestaña <span className="font-bold">Speeches</span>.
                          </p>
                        </div>
                      );
                    })()}

                    {currentStep.sectionId === 'costos' && (
                      <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'}`}>
                        <p className={`text-[10px] font-bold mb-3 ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}>
                          Flujo de Costos
                        </p>
                        <AnimatePresence mode="wait">
                          {callCostStep === 0 && callCostDecision === null && (
                            <motion.div key="cs0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                              <div className={`rounded-xl border-[2px] p-5 ${darkMode ? 'bg-[#24211e] border-[#4a4036]' : 'bg-stone-50 border-stone-200'}`}>
                                <div className="flex items-center gap-2 mb-3">
                                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${darkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>PASO 1 DE 5</span>
                                  <h4 className={`text-xs font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>{costFlow.steps[0].title}</h4>
                                </div>
                                <p className={`text-[11px] font-bold mb-3 ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}>¿Tienes dónde tomar nota?</p>
                                <div className={`text-[11px] leading-relaxed p-4 rounded-lg whitespace-pre-line ${darkMode ? 'bg-[#1c1a18] text-stone-400' : 'bg-white text-stone-600'}`}>{renderScriptText(costFlow.steps[0].content)}</div>
                                <div className="grid grid-cols-3 gap-2 mt-4">
                                  {[{ label: 'Colegiatura', value: '$7,240' }, { label: 'Inscripción', value: '$1,000' }, { label: 'Complemento', value: '$2,000' }].map((item) => (
                                    <div key={item.label} className={`text-center p-2 rounded-lg border ${darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-stone-200'}`}>
                                      <p className={`text-[8px] font-bold ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>{item.label}</p>
                                      <p className={`text-sm font-black ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>{item.value}</p>
                                    </div>
                                  ))}
                                </div>
                                <button onClick={() => setCallCostStep(1)} className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#faedcd] border border-[#d4a373] text-[#b57b54] text-[10px] font-bold hover:bg-[#ffeec2] transition-all">
                                  Siguiente <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </motion.div>
                          )}
                          {callCostStep === 1 && callCostDecision === null && (
                            <motion.div key="cs1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                              <div className={`rounded-xl border-[2px] p-5 ${darkMode ? 'bg-[#24211e] border-[#4a4036]' : 'bg-stone-50 border-stone-200'}`}>
                                <div className="flex items-center gap-2 mb-3">
                                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${darkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>PASO 2 DE 5</span>
                                  <h4 className={`text-xs font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>{costFlow.steps[1].title}</h4>
                                </div>
                                <div className={`text-[11px] leading-relaxed p-4 rounded-lg whitespace-pre-line ${darkMode ? 'bg-[#1c1a18] text-stone-400' : 'bg-white text-stone-600'}`}>{renderScriptText(costFlow.steps[1].content)}</div>
                                <div className="grid grid-cols-3 gap-2 mt-4">
                                  {[{ label: 'Colegiatura', old: '$7,240', value: '$2,419' }, { label: 'Inscripción', old: '$1,000', value: 'ANULADA' }, { label: 'Complemento', old: '$2,000', value: '$1,000' }].map((item) => (
                                    <div key={item.label} className={`text-center p-2 rounded-lg border ${darkMode ? 'bg-emerald-950/20 border-emerald-800/30' : 'bg-emerald-50 border-emerald-200'}`}>
                                      <p className={`text-[8px] font-bold ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>{item.label}</p>
                                      <p className={`text-[9px] line-through ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>{item.old}</p>
                                      <p className={`text-sm font-black ${item.value === 'ANULADA' ? 'text-red-500 line-through' : 'text-emerald-600'}`}>{item.value}</p>
                                    </div>
                                  ))}
                                </div>
                                <button onClick={() => setCallCostStep(2)} className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#faedcd] border border-[#d4a373] text-[#b57b54] text-[10px] font-bold hover:bg-[#ffeec2] transition-all">
                                  Siguiente <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </motion.div>
                          )}
                          {callCostStep === 2 && callCostDecision === null && (
                            <motion.div key="cs2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                              <div className={`rounded-xl border-[2px] p-5 ${darkMode ? 'bg-[#24211e] border-[#4a4036]' : 'bg-stone-50 border-stone-200'}`}>
                                <div className="flex items-center gap-2 mb-3">
                                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${darkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>PASO 3 DE 5</span>
                                  <h4 className={`text-xs font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>{costFlow.steps[2].title}</h4>
                                </div>
                                <div className={`text-[11px] leading-relaxed p-4 rounded-lg whitespace-pre-line ${darkMode ? 'bg-[#1c1a18] text-stone-400' : 'bg-white text-stone-600'}`}>{renderScriptText(costFlow.steps[2].content)}</div>
                                <div className="grid grid-cols-2 gap-2 mt-4">
                                  {[{ icon: '🎁', label: 'Tú recibes un beneficio' }, { icon: '👥', label: 'Tu referido también recibe uno' }].map((item) => (
                                    <div key={item.label} className={`flex items-center gap-2 p-2 rounded-lg border ${darkMode ? 'bg-purple-950/20 border-purple-800/30' : 'bg-purple-50 border-purple-200'}`}>
                                      <span className="text-sm">{item.icon}</span>
                                      <p className={`text-[9px] font-bold ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>{item.label}</p>
                                    </div>
                                  ))}
                                </div>
                                <button onClick={() => setCallCostStep(3)} className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#faedcd] border border-[#d4a373] text-[#b57b54] text-[10px] font-bold hover:bg-[#ffeec2] transition-all">
                                  Siguiente <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </motion.div>
                          )}
                          {callCostStep === 3 && callCostDecision === null && (
                            <motion.div key="cs3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                              <div className={`rounded-xl border-[2px] p-5 ${darkMode ? 'bg-[#24211e] border-[#4a4036]' : 'bg-stone-50 border-stone-200'}`}>
                                <div className="flex items-center gap-2 mb-3">
                                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>PASO 4 DE 5</span>
                                  <h4 className={`text-xs font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>{costFlow.steps[3].title}</h4>
                                </div>
                                <div className={`text-[11px] leading-relaxed p-4 rounded-lg whitespace-pre-line ${darkMode ? 'bg-[#1c1a18] text-stone-400' : 'bg-white text-stone-600'}`}>{renderScriptText(costFlow.steps[3].content)}</div>
                                <div className="grid grid-cols-2 gap-2 mt-4">
                                  {[{ icon: '📚', label: 'Cursos exclusivos de Platzi' }, { icon: '🎯', label: 'Metodología práctica' }, { icon: '🏆', label: 'Certificaciones laborales' }, { icon: '🤝', label: 'Comunidad y mentores' }].map((item) => (
                                    <div key={item.label} className={`flex items-center gap-2 p-2 rounded-lg border ${darkMode ? 'bg-blue-950/20 border-blue-800/30' : 'bg-blue-50 border-blue-200'}`}>
                                      <span className="text-sm">{item.icon}</span>
                                      <p className={`text-[9px] font-bold ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>{item.label}</p>
                                    </div>
                                  ))}
                                </div>
                                <button onClick={() => setCallCostStep(4)} className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#faedcd] border border-[#d4a373] text-[#b57b54] text-[10px] font-bold hover:bg-[#ffeec2] transition-all">
                                  Siguiente <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </motion.div>
                          )}
                          {callCostStep === 4 && callCostDecision === null && (
                            <motion.div key="cs4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                              <div className={`rounded-xl border-[2px] p-8 text-center ${darkMode ? 'bg-[#24211e] border-amber-800/40' : 'bg-amber-50 border-amber-200'}`}>
                                <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${darkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>PASO 5 DE 5</span>
                                <p className={`text-lg font-black font-display mt-4 mb-6 ${darkMode ? 'text-stone-100' : 'text-stone-900'}`}>{costFlow.steps[4].prompt}</p>
                                <div className="flex items-center justify-center gap-4">
                                  <button onClick={() => { setCallCostDecision('yes'); jumpToAcordar(); }}
                                    className="px-8 py-3 rounded-xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-500 transition-all hover:scale-105 shadow-lg shadow-emerald-900/30">SÍ</button>
                                  <button onClick={() => { setCallCostDecision('no'); jumpToAcordar(); }}
                                    className={`px-8 py-3 rounded-xl text-sm font-black transition-all hover:scale-105 border-2 ${
                                      darkMode ? 'border-red-800/40 text-red-400 hover:bg-red-950/30' : 'border-red-200 text-red-600 hover:bg-red-50'
                                    }`}>NO</button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                          {callCostDecision !== null && (
                            <motion.div key="csdone" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}
                              className={`flex items-center gap-3 p-3 rounded-xl ${darkMode ? 'bg-emerald-950/10' : 'bg-emerald-50/50'}`}>
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                              <div>
                                <p className={`text-[11px] font-bold ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>Sección completada</p>
                                <p className={`text-[9px] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                                  Respuesta: {callCostDecision === 'yes' ? 'SÍ — Confirma interés' : `NO — ${callCostReason ? objectionReasons.find(r => r.id === callCostReason)?.label : 'Requiere seguimiento'}`}
                                </p>
                              </div>
                              <button onClick={() => { setCallCostStep(0); setCallCostDecision(null); setCallCostReason(null); }}
                                className={`ml-auto text-[9px] font-bold px-2 py-1 rounded-lg border transition-all ${
                                  darkMode ? 'border-[#3e382f] text-stone-400 hover:text-stone-200' : 'border-stone-200 text-stone-500 hover:text-stone-700'
                                }`}>Repetir</button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {currentStep.sectionId === 'acordar' && (() => {
                      const acordarDecision = callInterestDecision || (callCostDecision === 'yes' ? 'yes' as const : callCostDecision === 'no' ? 'no' as const : null);
                      const acordarReason = callCostReason;
                      return (
                      <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'}`}>
                        <AnimatePresence mode="wait">
                          {acordarDecision === null && (
                            <motion.div key="acdprompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                              <div className={`rounded-xl border-[2px] p-5 ${darkMode ? 'bg-[#24211e] border-amber-800/30' : 'bg-amber-50/50 border-amber-200'}`}>
                                <p className={`text-[11px] font-bold font-display mb-3 ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                                  ¿Cómo terminó la conversación?
                                </p>
                                <div className="flex gap-3">
                                  <button onClick={() => { setCallInterestDecision('yes'); }}
                                    className="flex-1 py-3 rounded-xl bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-400 text-[11px] font-bold hover:bg-emerald-500/30 transition-all">
                                    SÍ — Le interesa
                                  </button>
                                  <button onClick={() => { setCallInterestDecision('no'); }}
                                    className="flex-1 py-3 rounded-xl bg-red-500/20 border-2 border-red-500/40 text-red-400 text-[11px] font-bold hover:bg-red-500/30 transition-all">
                                    NO — No le interesa
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                          {acordarDecision === 'yes' && (
                            <motion.div key="acy" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-3">
                              <div className={`rounded-xl border-[2px] p-5 ${darkMode ? 'bg-[#24211e] border-emerald-800/30' : 'bg-emerald-50/50 border-emerald-200'}`}>
                                <div className="flex items-center gap-2 mb-3">
                                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${darkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>CIERRE EXITOSO</span>
                                </div>
                                <div className={`text-[11px] leading-relaxed p-4 rounded-lg whitespace-pre-line ${darkMode ? 'bg-[#1c1a18] text-stone-400' : 'bg-white text-stone-600'}`}>{renderScriptText(closingFlowSuccess.content)}</div>
                                <div className="mt-4 space-y-2">
                                  {['Documentos digitales (título, acta de nacimiento, CURP)', 'Solicitud de admisión', 'Primera colegiatura'].map((item, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${darkMode ? 'border-emerald-700' : 'border-emerald-400'}`}>
                                        <span className="text-emerald-500 text-[8px]">✓</span>
                                      </div>
                                      <span className={`text-[10px] ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>{item}</span>
                                    </div>
                                  ))}
                                </div>
                               </div>
                               {/* Demo toggle */}
                               {!showDemoInvite ? (
                                 <button onClick={() => setShowDemoInvite(true)}
                                   className={`w-full p-3 rounded-xl border-[2px] border-dashed text-center transition-all ${
                                     darkMode ? 'border-blue-800/40 bg-blue-950/10 text-blue-400 hover:bg-blue-950/20'
                                     : 'border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-50'
                                   }`}>
                                   <span className="text-[10px] font-bold font-display">🖥️ ¿Invitar a Demo?</span>
                                   <p className={`text-[8px] mt-1 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                                     Opcional — Mostrar para agendar demostración de aula virtual
                                   </p>
                                 </button>
                               ) : (
                                 <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                   className={`rounded-xl border-[2px] p-5 ${darkMode ? 'bg-[#24211e] border-blue-800/30' : 'bg-blue-50/50 border-blue-200'}`}>
                                   <div className="flex items-center justify-between mb-3">
                                     <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>INVITACIÓN</span>
                                     <button onClick={() => setShowDemoInvite(false)}
                                       className={`text-[8px] px-2 py-0.5 rounded-lg ${darkMode ? 'text-stone-500 hover:bg-[#1c1a18]' : 'text-stone-400 hover:bg-stone-100'}`}>
                                       Cerrar
                                     </button>
                                   </div>
                                <p className={`text-[11px] font-bold font-display mb-2 ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                                  🖥️ Demostración de Aula Virtual
                                </p>
                                <div className={`text-[10px] leading-relaxed p-4 rounded-lg whitespace-pre-line ${darkMode ? 'bg-[#1c1a18] text-stone-400' : 'bg-white text-stone-600'}`}>
{`Además de esta llamada, te invito a una demostración en vivo del aula virtual. 

En esta sesión un docente te muestra cómo funcionan las clases en tiempo real: cómo accedes a los materiales, participas en clase, entregas tareas y consultas al profesor.

Es la mejor forma de que veas con tus propios ojos cómo serán tus clases. 

¿Te gustaría agendarla?`}
                                </div>
                                <div className="flex items-center gap-2 mt-3">
                                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${darkMode ? 'bg-blue-950/30' : 'bg-blue-100'}`}>
                                    <span className="text-xs">👨‍🏫</span>
                                    <span className={`text-[9px] font-bold ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>Impartida por docente</span>
                                  </div>
                                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${darkMode ? 'bg-blue-950/30' : 'bg-blue-100'}`}>
                                    <span className="text-xs">⏱️</span>
                                    <span className={`text-[9px] font-bold ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>~30 min</span>
                                   </div>
                                 </div>
                               </motion.div>
                              )}
                            </motion.div>
                          )}
                          {acordarDecision === 'no' && acordarReason === null && (
                            <motion.div key="acnr" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                              <div className={`rounded-xl border-[2px] p-5 ${darkMode ? 'bg-[#24211e] border-amber-800/30' : 'bg-amber-50/50 border-amber-200'}`}>
                                <p className={`text-sm font-black font-display mb-2 ${darkMode ? 'text-stone-100' : 'text-stone-900'}`}>¿Cuál es la razón?</p>
                                <p className={`text-[10px] mb-4 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>Selecciona el motivo para ver las objeciones más relevantes primero.</p>
                                <div className="space-y-2">
                                  {objectionReasons.map((reason) => (
                                    <button key={reason.id} onClick={() => setCallCostReason(reason.id)}
                                      className={`w-full text-left p-3 rounded-xl border-2 text-[11px] font-bold transition-all ${
                                        darkMode ? 'border-[#4a4036] text-stone-300 hover:border-amber-800/40 hover:text-amber-400 hover:bg-amber-950/20'
                                        : 'border-stone-200 text-stone-600 hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50'
                                      }`}>{reason.label}</button>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                          {acordarDecision === 'no' && acordarReason !== null && (
                            <motion.div key="acno" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${darkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>OBJECIONES DISPONIBLES</span>
                                <span className={`text-[9px] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                                  Razón: {objectionReasons.find(r => r.id === acordarReason)?.label}
                                </span>
                              </div>
                              {getSortedObjections(acordarReason).map((cat) => {
                                const relevant = checkObjectionRelevance(cat.id, acordarReason);
                                return (
                                  <div key={cat.id} className={`rounded-xl border-[2px] p-4 ${
                                    relevant ? darkMode ? 'bg-amber-950/20 border-amber-800/40' : 'bg-amber-50 border-amber-300'
                                    : darkMode ? 'bg-[#24211e] border-[#4a4036]' : 'bg-stone-50 border-stone-200'
                                  }`}>
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-sm">{cat.icon}</span>
                                      <h4 className={`text-[11px] font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>{cat.title}</h4>
                                      {relevant && (
                                        <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-200 text-amber-700'}`}>Relevante</span>
                                      )}
                                    </div>
                                    <p className={`text-[9px] italic mb-2 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>{cat.objection}</p>
                                    {cat.responses.map((resp) => (
                                      <div key={resp.id} className="mb-2 last:mb-0">
                                        <p className={`text-[9px] font-bold mb-1 ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>{resp.title}</p>
                                        <div className={`text-[10px] leading-relaxed p-3 rounded-lg whitespace-pre-line ${darkMode ? 'bg-[#1c1a18] text-stone-400' : 'bg-white text-stone-600'}`}>{resp.content}</div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      );
                    })()}

                    <div className={`flex items-center gap-2 pt-4 border-t ${darkMode ? 'border-[#3e382f]' : 'border-[#dfd9cc]'}`}>
                      <button onClick={goToPrevCallStep} disabled={currentCallStep === 0}
                        className={`flex items-center gap-1 px-3 py-2 rounded-xl border text-[10px] font-bold transition-all disabled:opacity-30 ${
                          darkMode ? 'border-[#3e382f] text-stone-300 hover:bg-[#24211e]' : 'border-[#dfd9cc] text-stone-600 hover:bg-stone-50'
                        }`}>
                        <ChevronLeft className="w-3 h-3" /> Anterior
                      </button>
                      <button onClick={skipCurrentCallStep}
                        className={`px-3 py-2 rounded-xl border text-[10px] font-bold transition-all ${
                          darkMode ? 'border-amber-800/40 text-amber-400 hover:bg-amber-950/20' : 'border-amber-200 text-amber-700 hover:bg-amber-50'
                        }`}>Saltar</button>
                      <button onClick={currentCallStep === callSteps.length - 1 ? undefined : goToNextCallStep}
                        disabled={currentCallStep === callSteps.length - 1}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#faedcd] border border-[#d4a373] text-[#b57b54] text-[10px] font-bold hover:bg-[#ffeec2] transition-all disabled:opacity-50">
                        {currentCallStep === callSteps.length - 1 ? 'Completar' : <>Siguiente <ChevronRight className="w-3 h-3" /></>}
                      </button>
                    </div>
                  </div>
                );
              }

              // Custom step
              return (
                <div className="space-y-4">
                  <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className={`text-xs font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                          {currentStep.title || 'Paso personalizado'}
                        </h3>
                        <p className={`text-[9px] mt-0.5 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                          Paso {currentCallStep + 1} de {callSteps.length}
                        </p>
                      </div>
                      <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${
                        darkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {currentStep.customType === 'objection' ? 'Objeción' : 'Texto libre'}
                      </span>
                    </div>
                  </div>
                  <div className={`rounded-xl border-[2px] p-4 ${darkMode ? 'bg-[#24211e] border-[#4a4036]' : 'bg-stone-50 border-stone-200'}`}>
                    <div className={`text-[10px] leading-relaxed whitespace-pre-line ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                      {currentStep.content}
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 pt-4 border-t ${darkMode ? 'border-[#3e382f]' : 'border-[#dfd9cc]'}`}>
                    <button onClick={goToPrevCallStep} disabled={currentCallStep === 0}
                      className={`flex items-center gap-1 px-3 py-2 rounded-xl border text-[10px] font-bold transition-all disabled:opacity-30 ${
                        darkMode ? 'border-[#3e382f] text-stone-300 hover:bg-[#24211e]' : 'border-[#dfd9cc] text-stone-600 hover:bg-stone-50'
                      }`}>
                      <ChevronLeft className="w-3 h-3" /> Anterior
                    </button>
                    <button onClick={skipCurrentCallStep}
                      className={`px-3 py-2 rounded-xl border text-[10px] font-bold transition-all ${
                        darkMode ? 'border-amber-800/40 text-amber-400 hover:bg-amber-950/20' : 'border-amber-200 text-amber-700 hover:bg-amber-50'
                      }`}>Saltar</button>
                    <button onClick={currentCallStep === callSteps.length - 1 ? undefined : goToNextCallStep}
                      disabled={currentCallStep === callSteps.length - 1}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#faedcd] border border-[#d4a373] text-[#b57b54] text-[10px] font-bold hover:bg-[#ffeec2] transition-all disabled:opacity-50">
                      {currentCallStep === callSteps.length - 1 ? 'Completar' : <>Siguiente <ChevronRight className="w-3 h-3" /></>}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* ── OBJECTIONS TAB ──────────────────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════ */}
      {activeTab === 'objections' && (
        <div className="space-y-4">
          <div className={`flex items-center justify-between p-4 rounded-2xl border ${
            darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'
          }`}>
            <div className="space-y-1">
              <p className={`text-[11px] font-bold ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>Manejo de Objeciones</p>
              <p className={`text-[9px] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                {usedResponses.length} respuestas utilizadas · {defaultObjectionCategories.length} categorías
              </p>
            </div>
            {usedResponses.length > 0 && (
              <button onClick={() => setUsedResponses([])}
                className={`text-[9px] font-bold px-3 py-1.5 rounded-xl border transition-all ${
                  darkMode ? 'border-red-900/40 text-red-400 hover:bg-red-950/20' : 'border-red-200 text-red-500 hover:bg-red-50'
                }`}>Limpiar</button>
            )}
          </div>
          {mergedObjections.map((cat) => {
            const isExpanded = expandedSections.includes(`obj_${cat.id}`);
            const relevant = isObjectionRelevant(cat.id);
            return (
              <div key={cat.id} className={`rounded-2xl border overflow-hidden transition-all ${
                relevant ? darkMode ? 'bg-amber-950/10 border-amber-800/30' : 'bg-amber-50/50 border-amber-200'
                : darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'
              }`}>
                <button onClick={() => toggleSection(`obj_${cat.id}`)}
                  className={`w-full flex items-center justify-between p-4 transition-all ${darkMode ? 'hover:bg-[#24211e]' : 'hover:bg-stone-50'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{cat.icon}</span>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-xs font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>{cat.title}</h3>
                        {relevant && (
                          <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-200 text-amber-700'}`}>Relevante</span>
                        )}
                      </div>
                      <p className={`text-[9px] mt-0.5 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>{cat.responses.length} respuestas</p>
                    </div>
                  </div>
                  <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className={`w-4 h-4 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`} />
                  </motion.div>
                </button>
                {isExpanded && (
                  <div className={`border-t ${darkMode ? 'border-[#3e382f]' : 'border-[#dfd9cc]'}`}>
                    <div className="p-4">
                      <div className={`text-[10px] italic p-3 rounded-lg mb-4 ${darkMode ? 'bg-[#24211e] text-stone-400' : 'bg-stone-50 text-stone-500'}`}>
                        {cat.objection}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {cat.responses.map((resp) => {
                          const isUsed = usedResponses.includes(resp.id);
                          const isCustom = resp.isCustom === true;
                          return (
                            <div key={resp.id} className={`rounded-xl border-[2px] p-4 transition-all flex flex-col ${
                              isCustom ? 'border-dashed ' : ''
                            }${
                              isUsed ? darkMode ? 'bg-emerald-950/15 border-emerald-800/30' : 'bg-emerald-50/60 border-emerald-200'
                              : isCustom ? darkMode ? 'bg-[#24211e] border-amber-800/40' : 'bg-stone-50 border-amber-300'
                              : darkMode ? 'bg-[#24211e] border-[#4a4036]' : 'bg-stone-50 border-stone-200'
                            }`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <h4 className={`text-[11px] font-bold font-display truncate ${isUsed ? 'line-through opacity-60' : ''} ${
                                    darkMode ? 'text-stone-200' : 'text-stone-800'
                                  }`}>{resp.title}</h4>
                                  {isCustom && (
                                    <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                                      darkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'
                                    }`}>MI objeción</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {isCustom && (
                                    <>
                                      <button onClick={() => openEditObjectionModal(cat.id, resp)}
                                        className={`p-1 rounded-lg transition-all hover:scale-110 ${darkMode ? 'text-stone-500 hover:text-amber-400' : 'text-stone-400 hover:text-amber-600'}`}>
                                        <Pencil className="w-3 h-3" />
                                      </button>
                                      <button onClick={() => handleDeleteObjection(cat.id, resp.id)}
                                        className={`p-1 rounded-lg transition-all hover:scale-110 ${darkMode ? 'text-stone-500 hover:text-red-400' : 'text-stone-400 hover:text-red-600'}`}>
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </>
                                  )}
                                  <button onClick={() => toggleUsedResponse(resp.id)}
                                    className={`p-1 rounded-lg transition-all hover:scale-110 ${
                                      isUsed ? 'text-emerald-500' : darkMode ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600'
                                    }`}>
                                    {isUsed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                                  </button>
                                </div>
                              </div>
                              <div className={`text-[10px] leading-relaxed p-3 rounded-lg whitespace-pre-line flex-1 ${
                                isUsed ? darkMode ? 'bg-emerald-950/10 text-stone-500' : 'bg-emerald-50/40 text-stone-500'
                                : darkMode ? 'bg-[#1c1a18] text-stone-400' : 'bg-white text-stone-600'
                              }`}>{resp.content}</div>
                            </div>
                          );
                        })}
                      </div>
                      <button onClick={() => openCreateObjectionModal(cat.id)}
                        className={`w-full mt-3 flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed text-[10px] font-bold transition-all ${
                          darkMode ? 'border-[#4a4036] text-stone-500 hover:border-amber-800/40 hover:text-amber-400'
                          : 'border-stone-200 text-stone-400 hover:border-amber-300 hover:text-amber-600'
                        }`}>
                        <Plus className="w-3.5 h-3.5" /> Agregar objeción
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* ── NOTES TAB ───────────────────────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════ */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <button onClick={() => setShowNotesDrawer(true)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
              darkMode ? 'border-[#3e382f] text-stone-300 hover:bg-[#24211e]' : 'border-[#dfd9cc] text-stone-600 hover:bg-stone-50'
            }`}>
            <Plus className="w-4 h-4" /> Nueva Nota
          </button>
          <p className={`text-[10px] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
            Haz clic en "Nueva Nota" o en el botón de Notas en la barra de tabs para abrir el panel de notas.
          </p>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* ── NOTES DRAWER ────────────────────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showNotesDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowNotesDrawer(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed top-0 right-0 h-full w-80 z-50 shadow-2xl flex flex-col ${
                darkMode ? 'bg-[#1c1a18] border-l border-[#3e382f]' : 'bg-white border-l border-stone-200'
              }`}
            >
              <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-[#3e382f]' : 'border-stone-200'}`}>
                <h3 className={`text-sm font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                  📝 Notas de la Llamada
                </h3>
                <button onClick={() => setShowNotesDrawer(false)}
                  className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-[#24211e] text-stone-400' : 'hover:bg-stone-100 text-stone-500'}`}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className={`p-4 border-b ${darkMode ? 'border-[#3e382f]' : 'border-stone-200'}`}>
                <textarea
                  value={currentNote}
                  onChange={(e) => setCurrentNote(e.target.value)}
                  placeholder="Escribe tu nota aquí..."
                  rows={4}
                  className={`w-full p-3 rounded-xl border text-xs focus:outline-none transition-all resize-none ${
                    darkMode ? 'bg-[#24211e] border-[#3e382f] text-stone-200 placeholder-stone-500 focus:border-[#d4a373]'
                    : 'bg-[#fcfbf9] border-[#dfd9cc] text-stone-800 placeholder-stone-400 focus:border-[#d4a373]'
                  }`}
                />
                <button onClick={() => { if (currentNote.trim()) { setNotes(prev => [{ id: Date.now().toString(), content: currentNote.trim(), timestamp: Date.now() }, ...prev]); setCurrentNote(''); } }}
                  className={`w-full mt-2 py-2 rounded-xl border text-[10px] font-bold transition-all ${
                    darkMode ? 'bg-amber-900/30 border-amber-800/40 text-amber-400 hover:bg-amber-900/50'
                    : 'bg-[#faedcd] border-[#d4a373] text-[#b57b54] hover:bg-[#ffeec2]'
                  }`}>
                  Guardar Nota
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {notes.length === 0 ? (
                  <p className={`text-center text-[10px] py-8 ${darkMode ? 'text-stone-600' : 'text-stone-300'}`}>
                    Sin notas aún
                  </p>
                ) : notes.map(note => (
                  <div key={note.id} className={`p-3 rounded-xl border ${darkMode ? 'bg-amber-900/10 border-amber-900/20' : 'bg-amber-50 border-amber-100'}`}>
                    <p className={`text-[10px] leading-relaxed ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                      {note.content}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-[8px] text-stone-400">{new Date(note.timestamp).toLocaleString()}</p>
                      <button onClick={() => setNotes(prev => prev.filter(n => n.id !== note.id))}
                        className="text-[8px] text-red-400 hover:text-red-300">Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* ── MODALS ──────────────────────────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════ */}

      {/* ── Speech Modal ───────────────────────────────────────── */}
      {showSpeechModal && editingSpeech && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => { setShowSpeechModal(false); setEditingSpeech(null); }} />
          <div className={`relative w-full max-w-lg rounded-2xl border shadow-2xl p-6 ${darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-sm font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                {editingSpeech.speech.id && editingSpeech.speech.isCustom ? '✏️ Editar Speech' : '➕ Nuevo Speech'}
              </h3>
              <button onClick={() => { setShowSpeechModal(false); setEditingSpeech(null); }}
                className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-[#24211e] text-stone-400' : 'hover:bg-stone-100 text-stone-500'}`}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Título del speech..."
                value={speechForm.title} onChange={(e) => setSpeechForm(prev => ({ ...prev, title: e.target.value }))}
                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition-all ${inputCls}`} />
              <textarea placeholder="Escribe el contenido del speech aquí..."
                value={speechForm.content} onChange={(e) => setSpeechForm(prev => ({ ...prev, content: e.target.value }))} rows={10}
                className={`w-full p-3 rounded-xl border text-xs focus:outline-none transition-all resize-none ${inputCls}`} />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => { setShowSpeechModal(false); setEditingSpeech(null); }}
                className={`px-4 py-2 rounded-xl border text-[10px] font-bold ${darkMode ? 'border-[#3e382f] text-stone-300' : 'border-[#dfd9cc] text-stone-600'}`}>
                Cancelar
              </button>
              <button onClick={handleSaveSpeech} disabled={!speechForm.title.trim() || !speechForm.content.trim()}
                className="px-4 py-2 rounded-xl bg-[#faedcd] border border-[#d4a373] text-[#b57b54] text-[10px] font-bold hover:bg-[#ffeec2] disabled:opacity-40 disabled:cursor-not-allowed">
                {editingSpeech.speech.id && editingSpeech.speech.isCustom ? 'Guardar Cambios' : 'Crear Speech'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Objection Modal ────────────────────────────────────── */}
      {showObjectionModal && editingObjection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => { setShowObjectionModal(false); setEditingObjection(null); }} />
          <div className={`relative w-full max-w-lg rounded-2xl border shadow-2xl p-6 ${darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-sm font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                {editingObjection.response.id && editingObjection.response.isCustom ? '✏️ Editar Objeción' : '➕ Nueva Respuesta'}
              </h3>
              <button onClick={() => { setShowObjectionModal(false); setEditingObjection(null); }}
                className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-[#24211e] text-stone-400' : 'hover:bg-stone-100 text-stone-500'}`}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <p className={`text-[10px] ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                Categoría: <span className="font-bold">{defaultObjectionCategories.find(c => c.id === editingObjection.categoryId)?.title}</span>
              </p>
              <input type="text" placeholder="Título de la respuesta (ej: Facilidades de pago)"
                value={objectionForm.title} onChange={(e) => setObjectionForm(prev => ({ ...prev, title: e.target.value }))}
                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition-all ${inputCls}`} />
              <textarea placeholder="Escribe la respuesta a la objeción..."
                value={objectionForm.content} onChange={(e) => setObjectionForm(prev => ({ ...prev, content: e.target.value }))} rows={8}
                className={`w-full p-3 rounded-xl border text-xs focus:outline-none transition-all resize-none ${inputCls}`} />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => { setShowObjectionModal(false); setEditingObjection(null); }}
                className={`px-4 py-2 rounded-xl border text-[10px] font-bold ${darkMode ? 'border-[#3e382f] text-stone-300' : 'border-[#dfd9cc] text-stone-600'}`}>
                Cancelar
              </button>
              <button onClick={handleSaveObjection} disabled={!objectionForm.title.trim() || !objectionForm.content.trim()}
                className="px-4 py-2 rounded-xl bg-[#faedcd] border border-[#d4a373] text-[#b57b54] text-[10px] font-bold hover:bg-[#ffeec2] disabled:opacity-40 disabled:cursor-not-allowed">
                {editingObjection.response.id && editingObjection.response.isCustom ? 'Guardar Cambios' : 'Crear Respuesta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Note Modal ─────────────────────────────────────────── */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowNoteModal(false)} />
          <div className={`relative w-full max-w-lg rounded-2xl border shadow-2xl p-6 ${darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-sm font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>📝 Nueva Nota</h3>
              <button onClick={() => setShowNoteModal(false)}
                className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-[#24211e] text-stone-400' : 'hover:bg-stone-100 text-stone-500'}`}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea placeholder="Escribe tu nota aquí..."
              value={noteContent} onChange={(e) => setNoteContent(e.target.value)} rows={5}
              className={`w-full p-3 rounded-xl border text-xs focus:outline-none transition-all resize-none ${inputCls}`} />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowNoteModal(false)}
                className={`px-4 py-2 rounded-xl border text-[10px] font-bold ${darkMode ? 'border-[#3e382f] text-stone-300' : 'border-[#dfd9cc] text-stone-600'}`}>
                Cancelar
              </button>
              <button className="px-4 py-2 rounded-xl bg-[#faedcd] border border-[#d4a373] text-[#b57b54] text-[10px] font-bold hover:bg-[#ffeec2]">
                Guardar Nota
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Step Modal ─────────────────────────────────────── */}
      {showAddStepModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowAddStepModal(false)} />
          <div className={`relative w-full max-w-lg rounded-2xl border shadow-2xl p-6 ${darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-sm font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                ➕ Agregar Paso
              </h3>
              <button onClick={() => setShowAddStepModal(false)}
                className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-[#24211e] text-stone-400' : 'hover:bg-stone-100 text-stone-500'}`}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className={`flex rounded-xl border overflow-hidden mb-4 ${darkMode ? 'border-[#3e382f]' : 'border-[#dfd9cc]'}`}>
              <button onClick={() => setAddStepMode('text')}
                className={`flex-1 py-2 text-[10px] font-bold transition-all ${
                  addStepMode === 'text'
                    ? darkMode ? 'bg-amber-900/40 text-amber-400' : 'bg-[#faedcd] text-[#b57b54]'
                    : darkMode ? 'text-stone-500' : 'text-stone-400'
                }`}>Texto Libre</button>
              <button onClick={() => setAddStepMode('objection')}
                className={`flex-1 py-2 text-[10px] font-bold transition-all ${
                  addStepMode === 'objection'
                    ? darkMode ? 'bg-amber-900/40 text-amber-400' : 'bg-[#faedcd] text-[#b57b54]'
                    : darkMode ? 'text-stone-500' : 'text-stone-400'
                }`}>Elegir Objeción</button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Título del paso..."
                value={addStepForm.title} onChange={(e) => setAddStepForm(prev => ({ ...prev, title: e.target.value }))}
                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition-all ${inputCls}`} />
              {addStepMode === 'objection' && (
                <select value={addStepForm.objectionCategoryId}
                  onChange={(e) => setAddStepForm(prev => ({ ...prev, objectionCategoryId: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition-all ${inputCls}`}>
                  <option value="">Seleccionar categoría...</option>
                  {defaultObjectionCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.title}</option>
                  ))}
                </select>
              )}
              <textarea
                placeholder={addStepMode === 'text' ? 'Escribe el contenido del paso...' : 'Selecciona la respuesta a usar...'}
                value={addStepForm.content} onChange={(e) => setAddStepForm(prev => ({ ...prev, content: e.target.value }))} rows={8}
                className={`w-full p-3 rounded-xl border text-xs focus:outline-none transition-all resize-none ${inputCls}`} />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowAddStepModal(false)}
                className={`px-4 py-2 rounded-xl border text-[10px] font-bold ${darkMode ? 'border-[#3e382f] text-stone-300' : 'border-[#dfd9cc] text-stone-600'}`}>
                Cancelar
              </button>
              <button onClick={addCustomStep}
                disabled={addStepMode === 'text' ? (!addStepForm.title.trim() || !addStepForm.content.trim()) : (!addStepForm.objectionCategoryId || !addStepForm.content.trim())}
                className="px-4 py-2 rounded-xl bg-[#faedcd] border border-[#d4a373] text-[#b57b54] text-[10px] font-bold hover:bg-[#ffeec2] disabled:opacity-40 disabled:cursor-not-allowed">
                Agregar Paso
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
