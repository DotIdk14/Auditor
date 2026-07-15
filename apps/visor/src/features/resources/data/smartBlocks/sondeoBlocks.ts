import type { SmartBlock } from '../../types';

export const sondeoBlocks: SmartBlock[] = [
  {
    id: 'sondeo_motivacion',
    title: 'Descubrir motivación',
    icon: '🎯',
    objective: 'Entender POR QUÉ el prospecto busca una licenciatura en este momento',
    principle: 'empatia',
    timing: ['descubrimiento'],
    versions: {
      short: `Perfecto. Para poder recomendarte mejor, cuéntame: ¿qué fue lo que te motivó a buscar una licenciatura en este momento?`,

      medium: `Perfecto, gracias por compartirme eso. Para poder recomendarte mejor la opción, me gustaría conocer un poco más de ti.

¿Qué fue lo que te motivó a buscar una licenciatura en este momento?`,

      long: `Perfecto, gracias por compartirme eso. Para poder recomendarte mejor la opción, me gustaría conocer un poco más de ti.

¿Qué fue lo que te motivó a buscar una licenciatura en este momento?

[Escuchar y responder: "Entiendo."]

¿La idea de estudiar esta carrera va más enfocada a crecer laboralmente, cambiar de área, mejorar tus oportunidades o es principalmente un objetivo personal de obtener tu título?`,
    },
    followUpQuestions: [
      '¿Qué te motivó a buscar una licenciatura?',
      '¿Es más para crecer, cambiar de área o obtener tu título?',
      '¿Qué te gustaría que cambiara para ti en el futuro?',
    ],
    positiveSignals: ['Sí', 'Exacto', 'Eso busco', 'Justamente', 'Nunca lo había pensado'],
    negativeSignals: ['No sé', 'No estoy seguro', 'Solo quiero ver opciones'],
    nextIfPositive: 'sondeo_situacion',
    nextIfNegative: 'sondeo_situacion',
    tags: [],
    priority: 5,
  },
  {
    id: 'sondeo_situacion',
    title: 'Situación actual',
    icon: '🏠',
    objective: 'Obtener datos concretos: trabajo, familia, tiempo disponible',
    principle: 'reciprocidad',
    timing: ['descubrimiento'],
    versions: {
      short: `Y actualmente, ¿te encuentras trabajando, estudiando o realizando alguna otra actividad?`,

      medium: `Y actualmente, ¿te encuentras trabajando, estudiando o realizando alguna otra actividad?

[Escuchar]

¿Y actualmente tienes familia, hijos?`,

      long: `Y actualmente, ¿te encuentras trabajando, estudiando o realizando alguna otra actividad?

[Escuchar y responder: "Perfecto."]

¿Tienes hijos o familia que dependa de ti?

[Escuchar]

¿Y esta sería la primera universidad que estás revisando o ya habías solicitado información en alguna otra institución?`,
    },
    followUpQuestions: [
      '¿Trabajas actualmente?',
      '¿Tienes hijos?',
      '¿Es la primera universidad que revisas?',
    ],
    positiveSignals: ['Trabajo tiempo completo', 'Sí, tengo familia', 'Es la primera vez'],
    negativeSignals: ['No quiero responder', '¿Para qué necesitas saber?'],
    nextIfPositive: 'sondeo_dolor',
    nextIfNegative: 'sondeo_dolor',
    tags: [],
    priority: 5,
  },
  {
    id: 'sondeo_dolor',
    title: 'Detectar dolor',
    icon: '🔴',
    objective: 'Identificar el obstáculo principal que le impide al prospecto avanzar',
    principle: 'compromiso',
    timing: ['descubrimiento'],
    versions: {
      short: `Cuéntame, ¿cuál ha sido el mayor obstáculo que has encontrado para estudiar?`,

      medium: `Cuéntame, pensando en tu situación actual, ¿cuál ha sido el mayor obstáculo que has encontrado para estudiar?

[Escuchar]

¿Eso significa que la falta de tiempo, el dinero o la incertidumbre de qué carrera elegir han sido los principales?`,

      long: `Cuéntame, pensando en tu situación actual, ¿cuál ha sido el mayor obstáculo que has encontrado para estudiar?

[Escuchar]

Entiendo. ¿Y pensando a futuro, si en algunos años ya tuvieras tu título profesional y la preparación que buscas, qué te gustaría que cambiara para ti a nivel laboral, económico o personal?

[Escuchar]

Justamente por eso quiero conocerte mejor, para ver cómo podemos ayudarte a superar ese obstáculo.`,
    },
    followUpQuestions: [
      '¿Cuál ha sido el mayor obstáculo?',
      '¿Qué cambiaría en tu vida con un título?',
      '¿Qué te frena para dar el paso?',
    ],
    positiveSignals: ['Eso es exactamente', 'Justamente', 'No lo había pensado así', 'Tienes razón'],
    negativeSignals: ['No lo sé', 'Simplemente no puedo', 'Es complicado'],
    nextIfPositive: 'sondeo_futuro',
    nextIfNegative: 'sondeo_futuro',
    tags: [],
    priority: 5,
  },
  {
    id: 'sondeo_futuro',
    title: 'Visualizar el futuro',
    icon: '🔮',
    objective: 'Hacer que el prospecto visualice lo que ganaría con un título',
    principle: 'visualizacion',
    timing: ['descubrimiento'],
    versions: {
      short: `Y pensando a futuro, ¿qué te gustaría que cambiara para ti a nivel laboral o personal?`,

      medium: `Y pensando a futuro, si en algunos años ya tuvieras tu título profesional, ¿qué te gustaría que cambiara para ti?`,

      long: `Y pensando a futuro, si en algunos años ya tuvieras tu título profesional y la preparación que buscas, ¿qué te gustaría que cambiara para ti a nivel laboral, económico o personal?

[Escuchar]

Eso suena muy bien. ¿Y quién sería la persona más orgullosa de verte graduado/a?`,
    },
    followUpQuestions: [
      '¿Qué cambiaría en tu vida con un título?',
      '¿Quién sería el más orgulloso de verte graduado?',
      '¿Dónde te ves en 5 años?',
    ],
    positiveSignals: ['Cambiaría todo', 'Mi familia', 'Mis hijos', 'Yo mismo'],
    negativeSignals: ['No lo sé', 'No he pensado en eso'],
    nextIfPositive: 'sondeo_perfil_completo',
    nextIfNegative: 'sondeo_perfil_completo',
    tags: [],
    priority: 4,
  },
  {
    id: 'sondeo_perfil_completo',
    title: 'Confirmar perfil',
    icon: '✅',
    objective: 'Resumir lo escuchado y confirmar que se entendió correctamente',
    principle: 'consistencia',
    timing: ['descubrimiento'],
    versions: {
      short: `Perfecto, entonces me queda claro que buscas [MOTIVACIÓN]. ¿Correcto?`,

      medium: `Perfecto, entonces me queda claro que [resumen de lo escuchado]. ¿Correcto?

Muy bien, con esa información puedo ayudarte mejor.`,

      long: `Perfecto, entonces me queda claro que [resumen de lo escuchado]. La motivación principal es [MOTIVACIÓN] y el mayor obstáculo es [DOLOR]. ¿Correcto?

Muy bien, con esa información puedo ayudarte a ver exactamente cómo UTEL puede resolver lo que buscas.

¿Te parece si revisamos juntos cómo funcionaría la carrera para tu caso específico?`,
    },
    followUpQuestions: [
      '¿Correcto?',
      '¿Algo más que quiera agregar?',
      '¿Te parece si revisamos cómo funcionaría para ti?',
    ],
    positiveSignals: ['Correcto', 'Exacto', 'Sí', 'Tal cual'],
    negativeSignals: ['Bueno, más o menos', 'No exactamente'],
    nextIfPositive: 'persuasion_tiempo',
    nextIfNegative: 'persuasion_tiempo',
    tags: [],
    priority: 4,
  },
];
