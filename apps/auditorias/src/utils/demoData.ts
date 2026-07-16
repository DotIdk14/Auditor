import { SalesCall } from '../types';

export function generateDemoCall(): SalesCall {
  const uniqueId = `call_demo_${Date.now()}`;
  const modality = 'LÍNEA';
  const clientName = 'Sofía López';

  return {
    id: uniqueId,
    metadata: {
      fileName: `Llamada_Comercial_Demo_UTEL_${crypto.randomUUID().split("-")[0]}.mp3`,
      url: '',
      size: 4829310,
      duration: 188,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'auditor_sales_prod',
      status: 'completed'
    },
    score: {
      global: 100,
      greeting: 100,
      needDiscovery: 100,
      objectionHandling: 100,
      closingSkills: 100,
      empathy: 100
    },
    analysis: {
      summary: `La conversación de ${clientName} demuestra el perfecto acoplamiento al guion comercial de UTEL de acuerdo con la Rúbrica de Auditoría PCE. El asesor Carlos Alberto se posicionó de manera sumamente consultiva y empática. Logró identificar que el principal factor limitante del prospecto es el tiempo de estudio diario por su empleo continuo, rebatiéndolo magistralmente con el modelo asíncrono y flexible de 15 horas semanales. Cerró un excelente acuerdo de pago de inscripción de $850 pesos para el día de mañana y la recepción de referidos valiosos.`,
      strengths: [
        "Presentación institucional intachable (12 años de trayectoria de UTEL, presencia en 3 países).",
        "Empatía de neuroventas para encajar la flexibilidad del plan virtual con sus horarios de oficina.",
        "Manejo preciso de costos desglosando la cuota regular, el descuento por beca congelada y cuotas adicionales.",
        "Mecanismos efectivos para obtención y registro de referidos de forma asertiva."
      ],
      weaknesses: [
        "Ninguna área de oportunidad crítica. El apego ético y asertividad comercial fueron impecables."
      ],
      nextSteps: [
        "Enviar el correo electrónico formal de cotización comercial personalizada en un plazo menor a 15 minutos.",
        "Verificar la recepción de los documentos (CURP/acta/certificado) por WhatsApp.",
        "Efectuar la llamada de seguimiento a las 11:00 AM de mañana acordada para concretar la matrícula."
      ],
      customerMood: 'interesado',
      salesOutcome: 'interesado_seguimiento',
      utel: {
        totalScore: 10.0,
        isCompliant: true,
        checkedItemsCount: 5,
        modalidadDetectada: 'LÍNEA',
        evaluacion_detallada: {
          "CONOCE A TU CLIENTE": "1.00 pts - Excelente indagación. El asesor recabó edad, ubicación, programa idóneo de interés de forma sumamente prolija.",
          "GENERALIDADES": "1.00 pts - Se transmitió el respaldo institucional oficial (12 años, 3 países, líder virtual) ligándolo con la conveniencia laboral del prospecto.",
          "OFERTA ACADÉMICA": "1.00 pts - Explicación óptima de colegiaturas, beca directa del 35%, cuotas complementarias y compromiso de promedio escolar.",
          "ACUERDOS Y CIERRE": "1.00 pts - Amarró de forma exitosa el envío digital de documentos, coordinó el acuerdo de pago de matrícula y obtuvo la ficha de un referido recomendado.",
          "GESTIÓN Y REGISTRO": "6.00 pts - Servicio excepcional. Se programó el envío por correo la bienvenida formal y se agendó hora matemática para mañana a las 11:00 AM."
        },
        checklist: [
          {
            id: "C1", title: "CONOCE A TU CLIENTE", weight: 1.00, passingThreshold: 0.80, score: 1.00, status: 'passed',
            feedback: "Indagación de perfil del prospecto.",
            subitems: [
              { id: "c1_linea", name: "Interés en línea", weight: 0.20, checked: true },
              { id: "c1_programa", name: "Programa de interés", weight: 0.20, checked: true },
              { id: "c1_demo", name: "Datos demográficos (edad/ubicación/medio)", weight: 0.20, checked: true },
              { id: "c1_ocup", name: "Ocupación/estudios previos", weight: 0.20, checked: true },
              { id: "c1_equiv", name: "Equivalencias", weight: 0.20, checked: true }
            ]
          },
          {
            id: "C2", title: "GENERALIDADES", weight: 1.00, passingThreshold: 0.80, score: 1.00, status: 'passed',
            feedback: "Institucionalidad y modelo educativo.",
            subitems: [
              { id: "c2_num", name: "Numeralia (12+ años, 3 países, egresados)", weight: 0.34, checked: true },
              { id: "c2_mod", name: "Modelo Educativo", weight: 0.33, checked: true },
              { id: "c2_esp", name: "Modalidad específica", weight: 0.33, checked: true }
            ]
          },
          {
            id: "C3", title: "OFERTA ACADÉMICA", weight: 1.00, passingThreshold: 0.80, score: 1.00, status: 'passed',
            feedback: "Información de costos y beneficios.",
            subitems: [
              { id: "c3_costos", name: "Costos", weight: 0.20, checked: true },
              { id: "c3_comp", name: "Complemento de colegiatura", weight: 0.20, checked: true },
              { id: "c3_jor", name: "Jornada", weight: 0.20, checked: true },
              { id: "c3_beca", name: "Vigencia de beca", weight: 0.20, checked: true },
              { id: "c3_ciclos", name: "Ciclos de inicio", weight: 0.20, checked: true }
            ]
          },
          {
            id: "C4", title: "ACUERDOS Y CIERRE", weight: 1.00, passingThreshold: 0.75, score: 1.00, status: 'passed',
            feedback: "Cierre de compromisos.",
            subitems: [
              { id: "c4_res", name: "Resumen de la oferta", weight: 0.25, checked: true },
              { id: "c4_doc", name: "Envío de documentos", weight: 0.25, checked: true },
              { id: "c4_pag", name: "Acuerdos de pago", weight: 0.25, checked: true },
              { id: "c4_ref", name: "Solicitud de referidos", weight: 0.25, checked: true }
            ]
          },
          {
            id: "C5", title: "GESTIÓN Y REGISTRO", weight: 6.00, passingThreshold: 4.00, score: 6.00, status: 'passed',
            feedback: "Cumplimiento de procesos UTEL.",
            subitems: [
              { id: "c5_int", name: "Hablar directamente con el interesado", weight: 1.20, checked: true },
              { id: "c5_tip", name: "Tipificación positiva", weight: 1.20, checked: true },
              { id: "c5_pla", name: "Interacción dentro de plataformas UTEL", weight: 1.20, checked: true },
              { id: "c5_reg", name: "Registro de interacción", weight: 1.20, checked: true },
              { id: "c5_seg", name: "Seguimiento de acuerdos", weight: 1.20, checked: true }
            ]
          }
        ]
      },
      emotionalAnalysis: {
        primaryEmotion: "Interesado",
        emotionalJourney: "Se inició de forma neutral con dudas constructivas sobre cursar en línea y la validez oficial del título, mostrando enorme satisfacción durante el desglose del plan promocional adaptado de colegiaturas, y finalizando con total asertividad en el acuerdo de pago.",
        purchaseAptitudeScore: 98,
        purchaseAptitudeLabel: "Muy Alto",
        barriersToPurchase: [
          "Fricciones potenciales disipadas de inmediato por el asesor sobre los horarios nocturnos de la plataforma y el costo de la matrícula."
        ],
        buyingSignals: [
          "Confirmó poseer listos en formato digital en su celular todos los requisitos solicitados.",
          "Ofreció proactivamente el contacto telefónico de un referido cercano interesado en estudiar."
        ],
        aptitudeReason: "Excelente prospecto para estudiar en línea en UTEL. Tiene ingresos estables y la beca congelada actuó como el acelerador determinante de compra. Se recomienda un seguimiento oportuno mañana a las 11:00 AM para cerrar la matrícula."
      }
    },
    transcription: [
      { speaker: "Vendedor", start: 1.2, end: 6.8, text: "Hola, muy buenos días. Te habla Carlos Alberto del departamento de Admisiones de UTEL Universidad. ¿Con quién tengo el gusto hoy?", sentiment: "positive", confidence: 0.99 },
      { speaker: "Cliente", start: 7.5, end: 12.0, text: "Hola, buenos días Carlos. Habla Sofía López. Vi un anuncio en internet y quería pedir información para la carrera de Licenciatura en Administración de Empresas.", sentiment: "neutral", confidence: 0.98 },
      { speaker: "Vendedor", start: 12.8, end: 25.4, text: "¡Un excelente gusto saludarte, Sofía! Bienvenido a UTEL. Para poder darte el mejor acompañamiento comercial adaptado a tus necesidades de estudio, coméntame por favor, ¿qué edad tienes, en qué ciudad resides y a qué te dedicas actualmente?", sentiment: "positive", confidence: 0.99 },
      { speaker: "Cliente", start: 26.0, end: 36.5, text: "Tengo 24 años, radico en Ciudad de México, y trabajo tiempo completo en una oficina en horario administrativo. Por eso me interesa la opción flexible en formato línea.", sentiment: "neutral", confidence: 0.98 },
      { speaker: "Vendedor", start: 37.2, end: 46.8, text: "Perfecto, estás en el lugar idóneo. Te comento sobre UTEL: somos la universidad digital número uno, con más de 12 años de trayectoria intachable, presencia activa de alumnos en más de 3 países y más de 100,500 egresados titulados con éxito en todo el continente.", sentiment: "positive", confidence: 0.98 },
      { speaker: "Vendedor", start: 47.3, end: 59.8, text: "Nuestro Modelo Educativo está enfocado en adultos que trabajan, por lo que te ofrece flexibilidad total para ingresar a tus asignaturas las 24 horas del día. Recomendamos una jornada promedio de dedicación de unas 15 horas semanales, organizadas a tu propio ritmo para no descuidar tu empleo. ¿Te resulta amigable este esquema?", sentiment: "positive", confidence: 0.99 },
      { speaker: "Cliente", start: 60.5, end: 67.2, text: "La verdad sí, suena ideal. Oye Carlos, ¿y manejan equivalencia o revalidación? Cursé tres semestres de otra licenciatura inconclusa previamente.", sentiment: "neutral", confidence: 0.97 },
      { speaker: "Vendedor", start: 68.0, end: 78.5, text: "¡Qué gran noticia! Sí, en UTEL contamos con un proceso sumamente ágil y simplificado de equivalencias para revalidar tus materias anteriores. Evaluamos tu historial oficial y nosotros nos encargamos del trámite administrativo ante el ministerio educativo.", sentiment: "positive", confidence: 0.99 },
      { speaker: "Cliente", start: 79.2, end: 84.0, text: "Excelente, eso me anima muchísimo. ¿Y respecto a los costos de las mensualidades y otras cuotas adicionales de inscripción cómo están?", sentiment: "positive", confidence: 0.98 }
    ]
  };
}
