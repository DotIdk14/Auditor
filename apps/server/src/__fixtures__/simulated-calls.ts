// Fixture: high-fidelity simulated sales calls for demo/testing purposes.
// Extracted from server.ts to reduce its size.
// Multiple demo scenarios are available:
//   - "excelente":  llamada impecable (venta cerrada, 10.0 pts)
//   - "regular":    llamada con fallas parciales (seguimiento, ~6.4 pts)
//   - "deficiente": llamada con objeciones mal manejadas (no interesado, ~3.6 pts)

import type { TranscriptionUtterance } from '../types.js';

export type DemoScenario = 'excelente' | 'regular' | 'deficiente';

export const DEMO_SCENARIOS: DemoScenario[] = ['excelente', 'regular', 'deficiente'];

export function isDemoScenario(value: unknown): value is DemoScenario {
  return typeof value === 'string' && (DEMO_SCENARIOS as string[]).includes(value);
}

interface SimulatedCallParams {
  originalName: string;
  fileSize: number;
  uniqueId: string;
}

interface CallAnalysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  nextSteps: string[];
  customerMood: 'receptivo' | 'molesto' | 'neutral' | 'interesado' | 'indiferente';
  salesOutcome: 'venta_cerrada' | 'interesado_seguimiento' | 'no_interesado' | 'agenda_demostracion';
  utel: unknown;
  emotionalAnalysis: {
    primaryEmotion: string;
    emotionalJourney: string;
    purchaseAptitudeScore: number;
    purchaseAptitudeLabel: string;
    barriersToPurchase: string[];
    buyingSignals: string[];
    aptitudeReason: string;
  };
}

interface CallScore {
  global: number;
  greeting: number;
  needDiscovery: number;
  objectionHandling: number;
  closingSkills: number;
  empathy: number;
}

interface CallMetadata {
  fileName: string;
  url: string;
  size: number;
  duration: number;
  uploadedAt: string;
  uploadedBy: string;
  status: 'completed';
}

export interface SimulatedCall {
  id: string;
  metadata: CallMetadata;
  score: CallScore;
  analysis: CallAnalysis;
  transcription: TranscriptionUtterance[];
}

type Modality = 'LÍNEA' | 'EJECUTIVA' | 'HÍBRIDA';

interface ScenarioContext {
  modality: Modality;
  program: string;
  clientName: string;
}

function resolveContext(originalName: string): ScenarioContext {
  const nameLower = originalName.toLowerCase();
  if (nameLower.includes('ejecut') || nameLower.includes('exec') || nameLower.includes('negoci') || nameLower.includes('mba')) {
    return { modality: 'EJECUTIVA', program: 'Maestría en Dirección de Negocios (MBA)', clientName: 'Alejandro Ruiz' };
  }
  if (nameLower.includes('hibrid') || nameLower.includes('presenc') || nameLower.includes('ing') || nameLower.includes('sistem') || nameLower.includes('tech')) {
    return { modality: 'HÍBRIDA', program: 'Ingeniería en Sistemas Computacionales', clientName: 'Mateo Silva' };
  }
  return { modality: 'LÍNEA', program: 'Licenciatura en Administración de Empresas', clientName: 'Sofía López' };
}

export function generateHighFidelitySimulatedCall(
  originalName: string,
  fileSize: number,
  uniqueId: string,
  scenario: DemoScenario = 'excelente',
): SimulatedCall {
  const params: SimulatedCallParams = { originalName, fileSize, uniqueId };
  switch (scenario) {
    case 'regular':
      return buildRegularCall(params);
    case 'deficiente':
      return buildDeficientCall(params);
    case 'excelente':
    default:
      return buildExcellentCall(params);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// ESCENARIO "EXCELENTE" — llamada impecable según la matriz PCE
// ────────────────────────────────────────────────────────────────────────────
function buildExcellentCall({ originalName, fileSize, uniqueId }: SimulatedCallParams): SimulatedCall {
  const { program, clientName, modality } = resolveContext(originalName);
  const modalityLower = modality.toLowerCase();

  const transcription: TranscriptionUtterance[] = [
    { speaker: "Vendedor", start: 1.2, end: 6.8, text: `Hola, muy buenos días. Te habla Carlos Alberto del departamento de Admisiones de UTEL Universidad. ¿Con quién tengo el gusto hoy?`, sentiment: "positive", confidence: 0.99 },
    { speaker: "Cliente", start: 7.5, end: 12.0, text: `Hola, buenos días Carlos. Habla ${clientName}. Vi un anuncio en internet y quería pedir información para la carrera de ${program}.`, sentiment: "neutral", confidence: 0.98 },
    { speaker: "Vendedor", start: 12.8, end: 25.4, text: `¡Un excelente gusto saludarte, ${clientName}! Bienvenido a UTEL. Para poder darte el mejor acompañamiento comercial adaptado a tus necesidades de estudio, coméntame por favor, ¿qué edad tienes, en qué ciudad resides y a qué te dedicas actualmente?`, sentiment: "positive", confidence: 0.99 },
    { speaker: "Cliente", start: 26.0, end: 36.5, text: `Tengo 24 años, radico en Ciudad de México, y trabajo tiempo completo en una oficina en horario administrativo. Por eso me interesa la opción flexible en formato ${modalityLower}.`, sentiment: "neutral", confidence: 0.98 },
    { speaker: "Vendedor", start: 37.2, end: 46.8, text: `Perfecto, estás en el lugar idóneo. Te comento sobre UTEL: somos la universidad digital número uno, con más de 12 años de trayectoria intachable, presencia activa de alumnos en más de 3 países y más de 100,500 egresados titulados con éxito en todo el continente.`, sentiment: "positive", confidence: 0.98 },
    { speaker: "Vendedor", start: 47.3, end: 59.8, text: `Nuestro Modelo Educativo está enfocado en adultos que trabajan, por lo que te ofrece flexibilidad total para ingresar a tus asignaturas las 24 horas del día. Recomendamos una jornada promedio de dedicación de unas 15 horas semanales, organizadas a tu propio ritmo para no descuidar tu empleo. ¿Te resulta amigable este esquema?`, sentiment: "positive", confidence: 0.99 },
    { speaker: "Cliente", start: 60.5, end: 67.2, text: `La verdad sí, suena ideal. Oye Carlos, ¿y manejan equivalencia o revalidación? Cursé tres semestres de otra licenciatura inconclusa previamente.`, sentiment: "neutral", confidence: 0.97 },
    { speaker: "Vendedor", start: 68.0, end: 78.5, text: `¡Qué gran noticia! Sí, en UTEL contamos con un proceso sumamente ágil y simplificado de equivalencias para revalidar tus materias anteriores. Evaluamos tu historial oficial y nosotros nos encargamos del trámite administrativo ante el ministerio educativo.`, sentiment: "positive", confidence: 0.99 },
    { speaker: "Cliente", start: 79.2, end: 84.0, text: `Excelente, eso me anima muchísimo. ¿Y respecto a los costos de las mensualidades y otras cuotas adicionales de inscripción cómo están?`, sentiment: "positive", confidence: 0.98 },
    { speaker: "Vendedor", start: 84.8, end: 99.5, text: `Claro que sí, ${clientName}. La colegiatura normal regular es de 3,600 pesos al mes. Sin embargo, para este ciclo que inicia, el comité te otorgó una beca de apoyo del 35 por ciento. Con esto, tu colegiatura queda fija y congelada en solo 2,340 pesos mensuales.`, sentiment: "positive", confidence: 0.99 },
    { speaker: "Vendedor", start: 100.0, end: 112.5, text: `Esta beca de estudio se mantiene constante si conservas un promedio mínimo cuatrimestral de ocho de calificación. Adicionalmente, el complemento de colegiatura consiste solo en un pago de inscripción único por cuatrimestre de 850 pesos y una reinscripción de 600 pesos de forma habitual. ¿Cómo ves esta inversión mensual?`, sentiment: "positive", confidence: 0.98 },
    { speaker: "Cliente", start: 113.2, end: 119.8, text: `Es un precio estupendo, muy accesible para mí. ¿La vigencia de la beca cubre todo el plan escolar? ¿Y en qué fechas inician los ciclos escolares?`, sentiment: "positive", confidence: 0.99 },
    { speaker: "Vendedor", start: 120.5, end: 132.4, text: `Efectivamente, su vigencia es de toda tu carrera escolar si conservas el promedio mínimo de ocho. Y el próximo ciclo de inicio de clases formal es este lunes que viene. Por lo mismo, te sugiero hacer tu registro hoy para apartar tu cupo en aula virtual.`, sentiment: "positive", confidence: 0.99 },
    { speaker: "Cliente", start: 133.0, end: 138.5, text: `Me parece perfecto. Quiero formalizarlo. ¿Me envías los informes y el detalle de documentos que debo mandarte?`, sentiment: "positive", confidence: 0.99 },
    { speaker: "Vendedor", start: 139.2, end: 151.8, text: `Con muchísimo gusto. Te haré un resumen exacto con las condiciones comerciales pactadas y el envío de un correo electrónico institucional hoy mismo. Para la admisión requiero tu acta de nacimiento, CURP y certificado de estudios previos en foto o formato PDF por WhatsApp. ¿Podrías hacérmelos llegar el día de hoy?`, sentiment: "positive", confidence: 0.98 },
    { speaker: "Cliente", start: 152.5, end: 156.8, text: `Sí, claro, los tengo en formato PDF en mi celular. Ahora mismo te los mando por WhatsApp.`, sentiment: "positive", confidence: 0.99 },
    { speaker: "Vendedor", start: 157.5, end: 168.2, text: `Excelente atención. Vamos a fijar tu acuerdo de pago de la inscripción de 850 pesos para mañana por la mañana mediante depósito o transferencia para formalizar tu ciclo. Por cierto ${clientName}, ¿tendrás de casualidad dos referidos, amigos o compañeros que también necesiten estudiar en línea para extenderles este beneficio de beca?`, sentiment: "positive", confidence: 0.98 },
    { speaker: "Cliente", start: 168.8, end: 174.5, text: `Claro. Mi compañero de trabajo quería titularse de administración igual de forma flexible para ascender laboralmente. Te paso su celular en un momento.`, sentiment: "positive", confidence: 0.99 },
    { speaker: "Vendedor", start: 175.2, end: 184.0, text: `Muchísimas gracias. Procedo al registro. Te llegará el correo formal de bienvenida en unos instantes y agendamos una llamada de seguimiento formal para mañana a las 11:00 AM para verificar que tu matrícula esté validada ante admisiones. ¡Un gran honor darte la bienvenida a UTEL Universidad, ${clientName}!`, sentiment: "positive", confidence: 0.99 },
    { speaker: "Cliente", start: 184.6, end: 188.0, text: `Al contrario, gracias a ti Carlos por tu asesoramiento. Hablamos mañana a las once. Lindo día.`, sentiment: "positive", confidence: 0.99 },
  ];

  const utelResult = {
    totalScore: 10.0,
    isCompliant: true,
    checkedItemsCount: 5,
    modalidadDetectada: modality,
    evaluacion_detallada: {
      "CONOCE A TU CLIENTE": "1.00 pts - Excelente indagación. El asesor recabó edad, ubicación, programa idóneo de interés de forma sumamente prolija.",
      "GENERALIDADES": "1.00 pts - Se transmitió el respaldo institucional oficial (12 años, 3 países, líder virtual) ligándolo con la conveniencia laboral del prospecto.",
      "OFERTA ACADÉMICA": "1.00 pts - Explicación óptima de colegiaturas, beca directa del 35%, cuotas complementarias y compromiso de promedio escolar.",
      "ACUERDOS Y CIERRE": "1.00 pts - Amarró de forma exitosa el envío digital de documentos, coordinó el acuerdo de pago de matrícula y obtuvo la ficha de un referido recomendado.",
      "GESTIÓN Y REGISTRO": "6.00 pts - Servicio excepcional. Se programó el envío por correo la bienvenida formal y se agendó hora matemática para mañana a las 11:00 AM.",
    },
    checklist: [
      { id: "C1", title: "CONOCE A TU CLIENTE", weight: 1.00, passingThreshold: 0.80, score: 1.00, status: 'passed' as const, feedback: "Indagación de perfil del prospecto.", subitems: [
        { id: "c1_linea", name: "Interés en línea", weight: 0.20, checked: true },
        { id: "c1_programa", name: "Programa de interés", weight: 0.20, checked: true },
        { id: "c1_demo", name: "Datos demográficos (edad/ubicación/medio)", weight: 0.20, checked: true },
        { id: "c1_ocup", name: "Ocupación/estudios previos", weight: 0.20, checked: true },
        { id: "c1_equiv", name: "Equivalencias", weight: 0.20, checked: true },
      ] },
      { id: "C2", title: "GENERALIDADES", weight: 1.00, passingThreshold: 0.80, score: 1.00, status: 'passed' as const, feedback: "Institucionalidad y modelo educativo.", subitems: [
        { id: "c2_num", name: "Numeralia (12+ años, 3 países, egresados)", weight: 0.34, checked: true },
        { id: "c2_mod", name: "Modelo Educativo", weight: 0.33, checked: true },
        { id: "c2_esp", name: "Modalidad específica", weight: 0.33, checked: true },
      ] },
      { id: "C3", title: "OFERTA ACADÉMICA", weight: 1.00, passingThreshold: 0.80, score: 1.00, status: 'passed' as const, feedback: "Información de costos y beneficios.", subitems: [
        { id: "c3_costos", name: "Costos", weight: 0.20, checked: true },
        { id: "c3_comp", name: "Complemento de colegiatura", weight: 0.20, checked: true },
        { id: "c3_jor", name: "Jornada", weight: 0.20, checked: true },
        { id: "c3_beca", name: "Vigencia de beca", weight: 0.20, checked: true },
        { id: "c3_ciclos", name: "Ciclos de inicio", weight: 0.20, checked: true },
      ] },
      { id: "C4", title: "ACUERDOS Y CIERRE", weight: 1.00, passingThreshold: 0.75, score: 1.00, status: 'passed' as const, feedback: "Cierre de compromisos.", subitems: [
        { id: "c4_res", name: "Resumen de la oferta", weight: 0.25, checked: true },
        { id: "c4_doc", name: "Envío de documentos", weight: 0.25, checked: true },
        { id: "c4_pag", name: "Acuerdos de pago", weight: 0.25, checked: true },
        { id: "c4_ref", name: "Solicitud de referidos", weight: 0.25, checked: true },
      ] },
      { id: "C5", title: "GESTIÓN Y REGISTRO", weight: 6.00, passingThreshold: 4.00, score: 6.00, status: 'passed' as const, feedback: "Cumplimiento de procesos UTEL.", subitems: [
        { id: "c5_int", name: "Hablar directamente con el interesado", weight: 1.20, checked: true },
        { id: "c5_tip", name: "Tipificación positiva", weight: 1.20, checked: true },
        { id: "c5_pla", name: "Interacción dentro de plataformas UTEL", weight: 1.20, checked: true },
        { id: "c5_reg", name: "Registro de interacción", weight: 1.20, checked: true },
        { id: "c5_seg", name: "Seguimiento de acuerdos", weight: 1.20, checked: true },
      ] },
    ],
  };

  return {
    id: uniqueId,
    metadata: {
      fileName: originalName,
      url: `/api/audio/${uniqueId}`,
      size: fileSize,
      duration: 188,
      uploadedAt: new Date().toISOString(),
      uploadedBy: "auditor_sales_prod",
      status: "completed",
    },
    score: {
      global: 100,
      greeting: 100,
      needDiscovery: 100,
      objectionHandling: 100,
      closingSkills: 100,
      empathy: 100,
    },
    analysis: {
      summary: `La conversación de ${clientName} demuestra el perfecto acoplamiento al guion comercial de UTEL de acuerdo con la Rúbrica de Auditoría PCE. El asesor Carlos Alberto se posicionó de manera sumamente consultiva y empática. Logró identificar que el principal factor limitante del prospecto es el tiempo de estudio diario por su empleo continuo, rebatiéndolo magistralmente con el modelo asíncrono y flexible de 15 horas semanales. Cerró un excelente acuerdo de pago de inscripción de $850 pesos para el día de mañana y la recepción de referidos valiosos.`,
      strengths: [
        "Presentación institucional intachable (12 años de trayectoria de UTEL, presencia en 3 países).",
        "Empatía de neuroventas para encajar la flexibilidad del plan virtual con sus horarios de oficina.",
        "Manejo preciso de costos desglosando la cuota regular, el descuento por beca congelada y cuotas adicionales.",
        "Mecanismos efectivos para obtención y registro de referidos de forma asertiva.",
      ],
      weaknesses: ["Ninguna área de oportunidad crítica. El apego ético y asertividad comercial fueron impecables."],
      nextSteps: [
        "Enviar el correo electrónico formal de cotización comercial personalizada en un plazo menor a 15 minutos.",
        "Verificar la recepción de los documentos (CURP/acta/certificado) por WhatsApp.",
        "Efectuar la llamada de seguimiento a las 11:00 AM de mañana acordada para concretar la matrícula.",
      ],
      customerMood: "interesado",
      salesOutcome: "venta_cerrada",
      utel: utelResult,
      emotionalAnalysis: {
        primaryEmotion: "Interesado",
        emotionalJourney: `Se inició de forma neutral con dudas constructivas sobre la modalidad y la validez oficial, mostrando enorme satisfacción durante el desglose del plan promocional adaptado de colegiaturas, y finalizando con total asertividad en el acuerdo de pago.`,
        purchaseAptitudeScore: 98,
        purchaseAptitudeLabel: "Muy Alto",
        barriersToPurchase: [`Fricciones potenciales disipadas de inmediato por el asesor sobre horarios, validez oficial y costo de matrícula.`],
        buyingSignals: [
          "Confirmó poseer listos en formato digital en su celular todos los requisitos solicitados.",
          "Ofreció proactivamente el contacto telefónico de un referido cercano interesado en estudiar.",
        ],
        aptitudeReason: `Excelente prospecto para estudiar en línea en UTEL. Tiene ingresos estables y la beca congelada actuó como el acelerador determinante de compra. Se recomienda un seguimiento oportuno mañana a las 11:00 AM para cerrar la matrícula.`,
      },
    },
    transcription,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// ESCENARIO "REGULAR" — llamada con fallas parciales (indagación y cierre débiles)
// ────────────────────────────────────────────────────────────────────────────
function buildRegularCall({ originalName, fileSize, uniqueId }: SimulatedCallParams): SimulatedCall {
  const { program, clientName, modality } = resolveContext(originalName);
  const modalityLower = modality.toLowerCase();

  const transcription: TranscriptionUtterance[] = [
    { speaker: "Vendedor", start: 1.0, end: 6.2, text: `Hola, buenas tardes. Habla Mariana del área de Admisiones de UTEL. ¿Cómo te encuentras el día de hoy?`, sentiment: "positive", confidence: 0.98 },
    { speaker: "Cliente", start: 6.9, end: 11.5, text: `Hola Mariana, bien, gracias. Me interesa la carrera de ${program}. Quería saber más sobre costos y horarios.`, sentiment: "neutral", confidence: 0.97 },
    { speaker: "Vendedor", start: 12.2, end: 21.8, text: `Claro que sí. UTEL es una universidad 100% en línea con más de 12 años de experiencia. Tenemos modalidad ${modalityLower} muy flexible para que puedas estudiar mientras trabajas.`, sentiment: "positive", confidence: 0.98 },
    { speaker: "Cliente", start: 22.4, end: 27.6, text: `Sí, me llama la atención. ¿Y qué precios manejan? ¿Hay algún plan de pago?`, sentiment: "neutral", confidence: 0.97 },
    { speaker: "Vendedor", start: 28.3, end: 38.0, text: `Los costos dependen del plan, pero están alrededor de entre 3,000 y 4,000 pesos al mes. Todo depende del programa y si aplica alguna promoción.`, sentiment: "neutral", confidence: 0.96 },
    { speaker: "Cliente", start: 38.7, end: 43.4, text: `Entiendo. ¿Y hay becas o descuentos disponibles en este momento?`, sentiment: "neutral", confidence: 0.97 },
    { speaker: "Vendedor", start: 44.0, end: 51.5, text: `Puede haber algún apoyo dependiendo del ciclo y del promedio. Te puedo mandar más información por correo para que lo revises con calma.`, sentiment: "neutral", confidence: 0.95 },
    { speaker: "Cliente", start: 52.1, end: 58.3, text: `Y las clases, ¿son en vivo o grabadas? Necesito algo que se acomode a mi trabajo de 8 a 6.`, sentiment: "neutral", confidence: 0.97 },
    { speaker: "Vendedor", start: 59.0, end: 67.4, text: `Es un modelo asíncrono, las clases quedan grabadas y tú ingresas a la plataforma a la hora que gustes. Es bastante cómodo para gente que trabaja.`, sentiment: "positive", confidence: 0.97 },
    { speaker: "Cliente", start: 68.1, end: 73.0, text: `Se escucha bien, pero quiero comparar un par de opciones antes de decidir. ¿Me puedes dar un desglose exacto de lo que pagaría?`, sentiment: "neutral", confidence: 0.96 },
    { speaker: "Vendedor", start: 73.7, end: 81.2, text: `Te lo puedo enviar por correo hoy mismo. De igual forma quedo atenta si tienes más dudas, y me gustaría agendar una llamada la próxima semana para ver tu decisión.`, sentiment: "neutral", confidence: 0.96 },
    { speaker: "Cliente", start: 81.9, end: 85.6, text: `Va, me parece bien. Te doy mi correo y espero la información. Gracias.`, sentiment: "neutral", confidence: 0.97 },
  ];

  const utelResult = {
    totalScore: 6.4,
    isCompliant: false,
    checkedItemsCount: 2,
    modalidadDetectada: modality,
    evaluacion_detallada: {
      "CONOCE A TU CLIENTE": "0.60 pts - Indagación insuficiente. El asesor no preguntó edad, ubicación, ocupación ni estudios previos del prospecto antes de ofrecer el programa.",
      "GENERALIDADES": "0.80 pts - Se mencionó la trayectoria de UTEL y la flexibilidad, aunque sin datos verificables ni cifras institucionales.",
      "OFERTA ACADÉMICA": "0.60 pts - Información de costos vaga (rangos amplios) y sin desglose de becas, cuotas de inscripción ni vigencia de beneficios.",
      "ACUERDOS Y CIERRE": "0.50 pts - No hubo cierre. Solo se comprometió a enviar información por correo sin confirmar fecha de seguimiento ni datos de contacto de forma estructurada.",
      "GESTIÓN Y REGISTRO": "3.90 pts - No se registró interacción, no se solicitó documentación y el seguimiento quedó sin agendar formalmente en el CRM.",
    },
    checklist: [
      { id: "C1", title: "CONOCE A TU CLIENTE", weight: 1.00, passingThreshold: 0.80, score: 0.60, status: 'failed' as const, feedback: "El asesor saltó directo al pitch sin indagar el perfil del prospecto.", subitems: [
        { id: "c1_linea", name: "Interés en línea", weight: 0.20, checked: true },
        { id: "c1_programa", name: "Programa de interés", weight: 0.20, checked: true },
        { id: "c1_demo", name: "Datos demográficos (edad/ubicación/medio)", weight: 0.20, checked: false },
        { id: "c1_ocup", name: "Ocupación/estudios previos", weight: 0.20, checked: false },
        { id: "c1_equiv", name: "Equivalencias", weight: 0.20, checked: false },
      ] },
      { id: "C2", title: "GENERALIDADES", weight: 1.00, passingThreshold: 0.80, score: 0.80, status: 'passed' as const, feedback: "Se mencionó la trayectoria y la modalidad flexible, aunque sin numeralia verificable.", subitems: [
        { id: "c2_num", name: "Numeralia (12+ años, 3 países, egresados)", weight: 0.34, checked: true },
        { id: "c2_mod", name: "Modelo Educativo", weight: 0.33, checked: true },
        { id: "c2_esp", name: "Modalidad específica", weight: 0.33, checked: false },
      ] },
      { id: "C3", title: "OFERTA ACADÉMICA", weight: 1.00, passingThreshold: 0.80, score: 0.60, status: 'failed' as const, feedback: "Costos en rangos amplios sin desglose de becas ni cuotas adicionales.", subitems: [
        { id: "c3_costos", name: "Costos", weight: 0.20, checked: true },
        { id: "c3_comp", name: "Complemento de colegiatura", weight: 0.20, checked: false },
        { id: "c3_jor", name: "Jornada", weight: 0.20, checked: true },
        { id: "c3_beca", name: "Vigencia de beca", weight: 0.20, checked: false },
        { id: "c3_ciclos", name: "Ciclos de inicio", weight: 0.20, checked: false },
      ] },
      { id: "C4", title: "ACUERDOS Y CIERRE", weight: 1.00, passingThreshold: 0.75, score: 0.50, status: 'failed' as const, feedback: "No se concretó ningún acuerdo comercial estructurado.", subitems: [
        { id: "c4_res", name: "Resumen de la oferta", weight: 0.25, checked: true },
        { id: "c4_doc", name: "Envío de documentos", weight: 0.25, checked: false },
        { id: "c4_pag", name: "Acuerdos de pago", weight: 0.25, checked: false },
        { id: "c4_ref", name: "Solicitud de referidos", weight: 0.25, checked: false },
      ] },
      { id: "C5", title: "GESTIÓN Y REGISTRO", weight: 6.00, passingThreshold: 4.00, score: 3.90, status: 'failed' as const, feedback: "El seguimiento quedó pendiente y no se registró la interacción en las plataformas.", subitems: [
        { id: "c5_int", name: "Hablar directamente con el interesado", weight: 1.20, checked: true },
        { id: "c5_tip", name: "Tipificación positiva", weight: 1.20, checked: false },
        { id: "c5_pla", name: "Interacción dentro de plataformas UTEL", weight: 1.20, checked: false },
        { id: "c5_reg", name: "Registro de interacción", weight: 1.20, checked: false },
        { id: "c5_seg", name: "Seguimiento de acuerdos", weight: 1.20, checked: true },
      ] },
    ],
  };

  return {
    id: uniqueId,
    metadata: {
      fileName: originalName,
      url: `/api/audio/${uniqueId}`,
      size: fileSize,
      duration: 86,
      uploadedAt: new Date().toISOString(),
      uploadedBy: "auditor_sales_prod",
      status: "completed",
    },
    score: {
      global: 64,
      greeting: 80,
      needDiscovery: 60,
      objectionHandling: 50,
      closingSkills: 50,
      empathy: 70,
    },
    analysis: {
      summary: `La llamada de ${clientName} muestra un cumplimiento parcial de la Rúbrica PCE. La asesora Mariana dio una bienvenida cordial y explicó de forma general el modelo flexible de UTEL, pero omitió la indagación del perfil del prospecto, dio información de costos vaga y no cerró ningún acuerdo comercial. El prospecto mostró interés genuino, pero se fue sin compromiso claro, quedando solo un envío de información por correo sin fecha de seguimiento agendada.`,
      strengths: [
        "Bienvenida cordial y profesional al inicio de la llamada.",
        "Explicación general de la modalidad flexible acorde al estilo de vida del prospecto.",
        "El prospecto quedó con disposición de revisar la información enviada.",
      ],
      weaknesses: [
        "Falta de indagación del perfil (edad, ocupación, estudios previos).",
        "Información de costos vaga sin desglose de becas ni cuotas.",
        "No se concretó un cierre ni se agendó seguimiento formal.",
        "No se registró la interacción en las plataformas de UTEL.",
      ],
      nextSteps: [
        "Enviar el desglose exacto de costos y becas por correo en un plazo menor a 24 horas.",
        "Agendar una llamada de seguimiento con fecha y hora confirmadas.",
        "Levantar el registro de la interacción y tipificar al prospecto en el CRM.",
      ],
      customerMood: "neutral",
      salesOutcome: "interesado_seguimiento",
      utel: utelResult,
      emotionalAnalysis: {
        primaryEmotion: "Neutral / Dudoso",
        emotionalJourney: `El prospecto mostró interés genuino en la modalidad flexible, pero la falta de datos concretos sobre costos y becas mantuvo un tono neutral y dubitativo durante toda la llamada.`,
        purchaseAptitudeScore: 55,
        purchaseAptitudeLabel: "Medio",
        barriersToPurchase: [
          "Falta de claridad en el costo real y las cuotas adicionales.",
          "Dudas sobre becas y promociones sin respuesta concreta.",
          "No se estableció un sentido de urgencia ni un siguiente paso claro.",
        ],
        buyingSignals: [
          "El prospecto preguntó activamente por costos, becas y modalidad.",
          "Aceptó compartir su correo para recibir la información.",
        ],
        aptitudeReason: `Prospecto con disposición media. Requiere un seguimiento con información concreta y un cierre guiado para elevar su intención de compra.`,
      },
    },
    transcription,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// ESCENARIO "DEFICIENTE" — llamada con objeciones mal manejadas
// ────────────────────────────────────────────────────────────────────────────
function buildDeficientCall({ originalName, fileSize, uniqueId }: SimulatedCallParams): SimulatedCall {
  const { program, clientName, modality } = resolveContext(originalName);
  const modalityLower = modality.toLowerCase();

  const transcription: TranscriptionUtterance[] = [
    { speaker: "Vendedor", start: 0.8, end: 5.5, text: `Buenas. ¿Luis? Te habla de UTEL, ¿te interesa estudiar una carrera?`, sentiment: "neutral", confidence: 0.95 },
    { speaker: "Cliente", start: 6.1, end: 11.4, text: `Hola. En realidad quería información de ${program}. ¿Las clases son presenciales o cómo funcionan?`, sentiment: "neutral", confidence: 0.97 },
    { speaker: "Vendedor", start: 12.0, end: 19.8, text: `Mira, todos nuestros programas tienen validez oficial. Pero el cupo se cierra hoy, así que si quieres entrar tienes que inscribirte ya.`, sentiment: "negative", confidence: 0.94 },
    { speaker: "Cliente", start: 20.4, end: 25.2, text: `Pero no me has dicho si es presencial o en línea. Eso es importante para mí.`, sentiment: "negative", confidence: 0.96 },
    { speaker: "Vendedor", start: 25.9, end: 33.0, text: `Es en modalidad ${modalityLower}, como te dije. No te preocupes por eso. Lo importante es que te apartes tu lugar hoy mismo.`, sentiment: "negative", confidence: 0.93 },
    { speaker: "Cliente", start: 33.7, end: 39.1, text: `Oye, con calma. Primero quiero saber cuánto cuesta y qué incluye. No me han dicho ni el precio.`, sentiment: "negative", confidence: 0.96 },
    { speaker: "Vendedor", start: 39.8, end: 47.2, text: `Son costos manejables, te lo aseguro. Pero si no te inscribes hoy pierdes la beca. Son decisiones rápidas.`, sentiment: "neutral", confidence: 0.92 },
    { speaker: "Cliente", start: 47.9, end: 55.6, text: `Pues mira, no me has resuelto ninguna duda y me parece muy caro sin saber siquiera el precio exacto. Prefiero buscar otra opción.`, sentiment: "negative", confidence: 0.98 },
    { speaker: "Vendedor", start: 56.3, end: 62.0, text: `Como quieras, pero la educación también cuesta. Si no puedes, pues no es para ti.`, sentiment: "negative", confidence: 0.91 },
    { speaker: "Cliente", start: 62.7, end: 66.4, text: `No gracias. Buen día.`, sentiment: "negative", confidence: 0.97 },
  ];

  const utelResult = {
    totalScore: 3.6,
    isCompliant: false,
    checkedItemsCount: 0,
    modalidadDetectada: modality,
    evaluacion_detallada: {
      "CONOCE A TU CLIENTE": "0.40 pts - No hubo indagación del prospecto. El asesor ignoró por completo el perfil, edad, ocupación y necesidades del cliente.",
      "GENERALIDADES": "0.60 pts - La presentación institucional fue ausente; solo se mencionó la validez oficial sin respaldo ni datos verificables.",
      "OFERTA ACADÉMICA": "0.50 pts - No se desglosaron costos, becas ni cuotas. El precio se manejó de forma evasiva con presión para inscribirse.",
      "ACUERDOS Y CIERRE": "0.30 pts - No hubo cierre comercial; la presión por inscribirse generó rechazo y el prospecto terminó la llamada.",
      "GESTIÓN Y REGISTRO": "1.80 pts - No se registró interacción, no se solicitó documentación y se perdió por completo la oportunidad de seguimiento.",
    },
    checklist: [
      { id: "C1", title: "CONOCE A TU CLIENTE", weight: 1.00, passingThreshold: 0.80, score: 0.40, status: 'failed' as const, feedback: "No se realizó indagación alguna del perfil del prospecto.", subitems: [
        { id: "c1_linea", name: "Interés en línea", weight: 0.20, checked: false },
        { id: "c1_programa", name: "Programa de interés", weight: 0.20, checked: true },
        { id: "c1_demo", name: "Datos demográficos (edad/ubicación/medio)", weight: 0.20, checked: false },
        { id: "c1_ocup", name: "Ocupación/estudios previos", weight: 0.20, checked: false },
        { id: "c1_equiv", name: "Equivalencias", weight: 0.20, checked: false },
      ] },
      { id: "C2", title: "GENERALIDADES", weight: 1.00, passingThreshold: 0.80, score: 0.60, status: 'failed' as const, feedback: "Presentación institucional ausente sin datos de respaldo.", subitems: [
        { id: "c2_num", name: "Numeralia (12+ años, 3 países, egresados)", weight: 0.34, checked: false },
        { id: "c2_mod", name: "Modelo Educativo", weight: 0.33, checked: true },
        { id: "c2_esp", name: "Modalidad específica", weight: 0.33, checked: false },
      ] },
      { id: "C3", title: "OFERTA ACADÉMICA", weight: 1.00, passingThreshold: 0.80, score: 0.50, status: 'failed' as const, feedback: "Costos evasivos sin desglose y presión indebida por la beca.", subitems: [
        { id: "c3_costos", name: "Costos", weight: 0.20, checked: false },
        { id: "c3_comp", name: "Complemento de colegiatura", weight: 0.20, checked: false },
        { id: "c3_jor", name: "Jornada", weight: 0.20, checked: false },
        { id: "c3_beca", name: "Vigencia de beca", weight: 0.20, checked: true },
        { id: "c3_ciclos", name: "Ciclos de inicio", weight: 0.20, checked: false },
      ] },
      { id: "C4", title: "ACUERDOS Y CIERRE", weight: 1.00, passingThreshold: 0.75, score: 0.30, status: 'failed' as const, feedback: "Cierre inexistente; la presión generó rechazo y abandono.", subitems: [
        { id: "c4_res", name: "Resumen de la oferta", weight: 0.25, checked: false },
        { id: "c4_doc", name: "Envío de documentos", weight: 0.25, checked: false },
        { id: "c4_pag", name: "Acuerdos de pago", weight: 0.25, checked: false },
        { id: "c4_ref", name: "Solicitud de referidos", weight: 0.25, checked: false },
      ] },
      { id: "C5", title: "GESTIÓN Y REGISTRO", weight: 6.00, passingThreshold: 4.00, score: 1.80, status: 'failed' as const, feedback: "Sin registro de interacción ni seguimiento; oportunidad comercial perdida.", subitems: [
        { id: "c5_int", name: "Hablar directamente con el interesado", weight: 1.20, checked: true },
        { id: "c5_tip", name: "Tipificación positiva", weight: 1.20, checked: false },
        { id: "c5_pla", name: "Interacción dentro de plataformas UTEL", weight: 1.20, checked: false },
        { id: "c5_reg", name: "Registro de interacción", weight: 1.20, checked: false },
        { id: "c5_seg", name: "Seguimiento de acuerdos", weight: 1.20, checked: false },
      ] },
    ],
  };

  return {
    id: uniqueId,
    metadata: {
      fileName: originalName,
      url: `/api/audio/${uniqueId}`,
      size: fileSize,
      duration: 67,
      uploadedAt: new Date().toISOString(),
      uploadedBy: "auditor_sales_prod",
      status: "completed",
    },
    score: {
      global: 36,
      greeting: 50,
      needDiscovery: 30,
      objectionHandling: 20,
      closingSkills: 30,
      empathy: 40,
    },
    analysis: {
      summary: `La llamada de ${clientName} fue deficiente en prácticamente todos los rubros de la Rúbrica PCE. El asesor no saludó cordialmente, ignoró las dudas del prospecto sobre la modalidad, presionó para inscribirse sin dar información de costos y terminó perdiendo al cliente con una frase hostil. La oportunidad comercial no solo no se cerró, sino que se generó una mala experiencia de marca.`,
      strengths: ["Únicamente se detectó que el prospecto fue contactado directamente por el interesado."],
      weaknesses: [
        "Saludo impersonal y sin protocolo de bienvenida.",
        "No se atendieron las dudas del prospecto (modalidad, costos).",
        "Presión indebida para inscribirse el mismo día.",
        "Manejo de objeción nulo y respuesta hostil al rechazo.",
        "Sin registro de interacción ni seguimiento posterior.",
      ],
      nextSteps: [
        "Capacitar al asesor en técnicas de indagación y manejo de objeciones.",
        "Revisar el guion de bienvenida y protocolo de venta consultiva.",
        "Implementar control de calidad y monitoreo de llamadas para este asesor.",
      ],
      customerMood: "molesto",
      salesOutcome: "no_interesado",
      utel: utelResult,
      emotionalAnalysis: {
        primaryEmotion: "Molesto / Rechazo",
        emotionalJourney: `El prospecto inició con interés genuino por resolver dudas, pero la presión del asesor y la evasión de costos generaron frustración creciente que terminó en rechazo y finalización de la llamada.`,
        purchaseAptitudeScore: 15,
        purchaseAptitudeLabel: "Bajo",
        barriersToPurchase: [
          "Falta de respuesta concreta sobre la modalidad de estudio.",
          "Presión indebida para inscribirse sin información de precios.",
          "Manejo hostil de la objeción de costos.",
        ],
        buyingSignals: ["El prospecto preguntó por modalidad y costos, mostrando interés inicial."],
        aptitudeReason: `Prospecto con intención inicial de compra que se perdió por un mal manejo comercial. Requiere un acercamiento de recuperación con información clara y sin presión.`,
      },
    },
    transcription,
  };
}
