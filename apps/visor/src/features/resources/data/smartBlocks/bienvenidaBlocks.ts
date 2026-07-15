import type { SmartBlock } from '../../types';

export const bienvenidaBlocks: SmartBlock[] = [
  {
    id: 'bien_agenda',
    title: 'Agenda de llamada',
    icon: '📋',
    objective: 'Explicar el formato de la llamada, reducir resistencia y obtener permiso para hacer preguntas',
    principle: 'compromiso',
    timing: ['apertura'],
    versions: {
      short: `Hola [Nombre], soy Ian Jarquín, asesor educativo de UTEL. Antes de comenzar, me gustaría comentarte cómo será esta llamada: primero quiero conocerte, después revisaré si puedo ayudarte, y solamente si hace sentido te explicaré cómo funciona UTEL. ¿Te parece bien?`,

      medium: `Hola [Nombre], buen día. Me comunico contigo, ¿verdad? Mucho gusto, soy Ian Jarquín, asesor educativo de UTEL Universidad.

Te contacto porque vi que solicitaste información sobre nuestra Licenciatura en [Carrera].

Antes de comenzar me gustaría comentarte cómo será esta llamada: primero quiero conocer un poco de ti, después revisaré si realmente puedo ayudarte, y solamente si hace sentido para ti te explicaré cómo funciona UTEL.

¿Te parece bien?`,

      long: `Hola [Nombre], ¿cómo te encuentras el día de hoy? Mucho gusto, soy Ian Jarquín, asesor educativo de UTEL Universidad.

Te contacto porque vi que solicitaste información sobre nuestra Licenciatura en [Carrera], ¿correcto?

Antes de comenzar me gustaría comentarte cómo será esta llamada para que ambos estemos en la misma página:

Primero quiero conocer un poco de ti — tus objetivos, tu situación actual, qué es lo que buscas.

Después revisaré si realmente puedo ayudarte con lo que necesitas.

Y solamente si hace sentido para ti, te explicaré cómo funciona UTEL y las opciones que tenemos disponibles.

¿Te parece bien si empezamos así?`,
    },
    followUpQuestions: [
      '¿Te parece bien?',
      '¿Alguna pregunta antes de empezar?',
      '¿Estás en un lugar donde puedas platicar con tranquilidad?',
    ],
    positiveSignals: ['Sí', 'De acuerdo', 'Dale', 'Ok', 'Perfecto', 'Claro'],
    negativeSignals: ['¿Qué quieres venderme?', 'Ya no tengo tiempo', 'No me interesa'],
    nextIfPositive: 'bien_rapport',
    nextIfNegative: 'bien_reiniciar',
    tags: [],
    priority: 5,
  },
  {
    id: 'bien_rapport',
    title: 'Construir rapport',
    icon: '🤝',
    objective: 'Crear conexión humana antes de entrar al negocio',
    principle: 'empatia',
    timing: ['apertura'],
    versions: {
      short: `¿Cómo te encuentras el día de hoy? [Escuchar] Qué bueno, me da gusto.`,

      medium: `¿Cómo te encuentras el día de hoy? [Escuchar]

Qué bueno, me da gusto escucharte. ¿Ya habías tenido oportunidad de platicar con alguien de UTEL antes o sería la primera vez que recibes información?`,

      long: `¿Cómo te encuentras el día de hoy? [Escuchar]

Qué bueno, me da gusto escucharte. ¿Actualmente ya cuentas con tu certificado de bachillerato?

[Escuchar y responder: "Excelente."]

Y cuéntame, ¿esta sería la primera universidad que estás revisando o ya habías solicitado información en alguna otra institución?`,
    },
    followUpQuestions: [
      '¿Cómo te encuentras?',
      '¿Ya habías platicado con alguien de UTEL?',
    ],
    positiveSignals: ['Bien', 'Muy bien', 'Regular', 'Ya hablé antes'],
    negativeSignals: ['Mal', 'No tengo tiempo para esto'],
    nextIfPositive: 'sondeo_motivacion',
    nextIfNegative: 'sondeo_motivacion',
    tags: [],
    priority: 4,
  },
  {
    id: 'bien_reiniciar',
    title: 'Reiniciar con tono casual',
    icon: '🔄',
    objective: 'Recuperar la atención cuando el prospecto muestra resistencia inicial',
    principle: 'empatia',
    timing: ['apertura'],
    versions: {
      short: `Entiendo perfectamente. Solo seré muy breve — quiero conocer tu situación para ver si puedo ayudarte. Si no es buen momento, podemos agendar otra llamada. ¿Qué prefieres?`,

      medium: `Entiendo perfectamente, no quiero quitarte tiempo. Solo seré muy breve: quiero conocer tu situación para ver si realmente puedo ayudarte con algo.

Si no es buen momento, podemos agendar otra llamada más adelante. ¿Qué prefieres?`,

      long: `Entiendo perfectamente, no quiero quitarte tu tiempo. Déjame ser muy breve:

Solo necesito conocer tu situación para ver si puedo ayudarte con algo. Si no es buen momento ahora, podemos agendar otra llamada cuando te sientas cómodo/a.

¿Qué prefieres, platicamos rápido o agendamos para otro momento?`,
    },
    followUpQuestions: [
      '¿Qué prefieres?',
      '¿Platicamos rápido o agendamos?',
    ],
    positiveSignals: ['Dale rápido', 'Ok', 'Platica'],
    negativeSignals: ['No', 'No me interesa', 'Cuelga'],
    nextIfPositive: 'sondeo_motivacion',
    nextIfNegative: 'sondeo_motivacion',
    tags: [],
    priority: 3,
  },
];
