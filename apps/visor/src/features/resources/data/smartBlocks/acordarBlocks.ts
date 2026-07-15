import type { SmartBlock } from '../../types';

export const acordarBlocks: SmartBlock[] = [
  {
    id: 'acordar_exito',
    title: 'Confirmación y Cierre',
    icon: '🎉',
    objective: 'Confirmar decisión, establecer siguiente paso concreto, cerrar con seguridad',
    principle: 'compromiso',
    timing: ['cierre'],
    versions: {
      short: `¡Perfecto! Para tu inscripción necesitamos:
• Documentos digitales (título, acta de nacimiento, CURP)
• Solicitud de admisión (la genero yo con tus datos)
• Primera colegiatura

¿Tienes alguna duda sobre el proceso?`,

      medium: `¡Perfecto! Para tu inscripción, necesitamos lo siguiente:

• Documentos digitales (título, acta de nacimiento, CURP)
• Solicitud de admisión (la genero yo con tus datos)
• Primera colegiatura

¿Tienes alguna duda sobre el proceso?

[Escuchar]

Muy bien, te voy a enviar toda la información por correo para que la tengas a la mano.

¿Qué día te gustaría comenzar?`,

      long: `¡Perfecto! Para tu inscripción, necesitamos lo siguiente:

• Documentos digitales (título, acta de nacimiento, CURP)
• Solicitud de admisión (la genero yo con tus datos)
• Primera colegiatura

¿Tienes alguna duda sobre el proceso?

[Escuchar]

Muy bien. Te voy a enviar toda la información por correo para que la tengas a la mano. Además, tu gestor académico te contactará para darte la bienvenida.

¿Qué día te gustaría comenzar?

Recuerda que tienes acceso a Platzi desde el primer día y tu gestor te acompañará durante todo el proceso.

¡Bienvenido a UTEL, [Nombre]! 🎉`,
    },
    followUpQuestions: [
      '¿Tienes alguna duda sobre el proceso?',
      '¿Qué día te gustaría comenzar?',
      '¿Necesitas algo más?',
    ],
    positiveSignals: ['Perfecto', 'Genial', 'No tengo dudas', 'Empezamos', 'Gracias'],
    negativeSignals: ['Tengo una duda', 'Espera', 'No estoy seguro todavía'],
    nextIfPositive: '',
    nextIfNegative: '',
    tags: [],
    priority: 5,
  },
  {
    id: 'acordar_no',
    title: 'Manejo del NO',
    icon: '🔄',
    objective: 'No perder la oportunidad: indagar la razón real y ofrecer alternativas',
    principle: 'empatia',
    timing: ['cierre'],
    versions: {
      short: `Entiendo perfectamente. ¿Me podrías decir cuál es la razón principal?

[Escuchar]

Gracias por ser honesto/a. Déjame ver qué podemos hacer.`,

      medium: `Entiendo perfectamente, no hay ninguna presión. ¿Me podrías decir cuál es la razón principal por la que no te decides?

[Escuchar]

Gracias por ser honesto/a. Eso es algo que puedo ayudarte a resolver. Déjame ver qué podemos hacer.`,

      long: `Entiendo perfectamente, no hay ninguna presión. Es una decisión importante y quiero que te sientas cómodo/a.

¿Me podrías decir cuál es la razón principal por la que no te decides?

[Escuchar]

Gracias por ser honesto/a. Eso es algo que puedo ayudarte a resolver.

¿Qué tal si agendamos una llamada para cuando tengas más claridad? Mientras tanto, te envío toda la información por correo para que la revises con calma.

¿Te parece bien?`,
    },
    followUpQuestions: [
      '¿Cuál es la razón principal?',
      '¿Qué te frena?',
      '¿Qué podemos hacer para resolverlo?',
    ],
    positiveSignals: ['Es el precio', 'No tengo tiempo', 'Déjame pensarlo', 'Es la modalidad'],
    negativeSignals: ['No sé', 'Solo no quiero', 'No me interesa nada'],
    nextIfPositive: 'acordar_seguimiento',
    nextIfNegative: 'acordar_seguimiento',
    tags: [],
    priority: 5,
  },
  {
    id: 'acordar_seguimiento',
    title: 'Agendar Seguimiento',
    icon: '📅',
    objective: 'Mantener la puerta abierta y establecer un seguimiento concreto',
    principle: 'compromiso',
    timing: ['cierre'],
    versions: {
      short: `¿Qué tal si agendamos una llamada para [fecha]? Te envío la información por correo mientras tanto.`,

      medium: `¿Qué tal si agendamos una llamada para resolver cualquier duda que surja? Mientras tanto, te envío la información por correo para que puedas revisarla con calma.

¿Qué día te vendría bien?`,

      long: `¿Qué tal si agendamos una llamada para resolver cualquier duda que surja? Mientras tanto, te envío la información por correo para que puedas revisarla con calma y la compartas con quien necesites.

¿Qué día te vendría bien que te vuelva a llamar?

[Escuchar]

Perfecto, te confirmo por correo. Recuerda que la beca que tienes tiene vigencia, así que no dejes pasar mucho tiempo.

Fue un gusto platicar contigo, [Nombre]. ¡Espero verte pronto en UTEL!`,
    },
    followUpQuestions: [
      '¿Qué día te vendría bien?',
      '¿Te envío la información por correo?',
      '¿Hay algo más que pueda ayudarte?',
    ],
    positiveSignals: ['Ok', 'Dale', 'Perfecto', 'Sí, agenda', 'Gracias'],
    negativeSignals: ['No sé si voy a llamar', 'No me llames', 'No estoy interesado'],
    nextIfPositive: '',
    nextIfNegative: '',
    tags: [],
    priority: 4,
  },
  {
    id: 'acordar_escalacion',
    title: 'Escala de Convicción',
    icon: '📊',
    objective: 'Medir el nivel real de interés y descubrir objeciones ocultas',
    principle: 'compromiso',
    timing: ['cierre'],
    versions: {
      short: `Del 1 al 10, ¿qué tan convencido/a te sientes de que UTEL es la opción correcta para ti?`,

      medium: `Del 1 al 10, ¿qué tan convencido/a te sientes de que UTEL es la opción correcta para ti?

[Escuchar]

¿Qué te frena del [respuesta] al 10?

[Escuchar]`,

      long: `Del 1 al 10, ¿qué tan convencido/a te sientes de que UTEL es la opción correcta para ti?

[Escuchar]

¿Qué te frena del [respuesta] al 10?

[Escuchar]

Eso tiene solución. Déjame mostrarte...

[Resolver objeción específica]

Ahora, ¿subirías eso a un [respuesta + 1]?

[Escuchar]

Perfecto. ¿Entonces estamos listos para comenzar?`,
    },
    followUpQuestions: [
      '¿Qué tan convencido/a te sientes del 1 al 10?',
      '¿Qué te frena del [X] al 10?',
      '¿Subirías eso con esto?',
    ],
    positiveSignals: ['8+', '9', '10', 'Muy convencido'],
    negativeSignals: ['3', '4', '5', 'No mucho', 'Tengo dudas'],
    nextIfPositive: 'acordar_exito',
    nextIfNegative: 'acordar_no',
    tags: [],
    priority: 4,
  },
];
