import type { SmartBlock } from '../../types';

export const costosBlocks: SmartBlock[] = [
  {
    id: 'costos_checklist',
    title: 'Checklist de Valor PRECIO',
    icon: '📋',
    objective: 'Verificar que se construyó valor suficiente ANTES de hablar de precio',
    principle: 'anclaje',
    timing: ['antes_precio'],
    versions: {
      short: `Antes de hablarte del precio, déjame verificar que te expliqué todo lo importante.`,

      medium: `Antes de hablarte del precio, déjame verificar que te expliqué todo lo importante:
✅ Modalidad
✅ Validez
✅ Flexibilidad
✅ Duración
✅ Acompañamiento
✅ Beneficio personalizado

Si falta algo, mejor lo revisamos antes de continuar.`,

      long: `Antes de hablarte del precio, quiero asegurarme de que tengas toda la información importante:

✅ Modalidad — UTEL nació como universidad en línea
✅ Validez — Contamos con RVOE
✅ Flexibilidad — Aula virtual 24/7, tú defines tu horario
✅ Duración — [duración de la carrera]
✅ Acompañamiento — Gestor académico y docentes dedicados
✅ Beneficio personalizado — [beneficio según su perfil]

Si falta algo de esto, mejor lo revisamos antes de continuar, porque no quiero que el precio sea lo único que recuerdes. Quiero que veas el valor completo.

¿Hay algo que quieras que te explique mejor?`,
    },
    followUpQuestions: [
      '¿Hay algo que quieras que te explique mejor?',
      '¿Sientes que tienes toda la información?',
      '¿Te parece si revisamos la inversión?',
    ],
    positiveSignals: ['Sí, todo claro', 'Perfecto', 'Adelante', 'Dale'],
    negativeSignals: ['No me quedó claro X', '¿Y si...?', 'Todavía no sé'],
    nextIfPositive: 'costos_pre_precio',
    nextIfNegative: 'costos_pre_precio',
    tags: [],
    priority: 5,
  },
  {
    id: 'costos_pre_precio',
    title: 'Pre-precio (transición)',
    icon: '➡️',
    objective: 'Preparar el terreno para que el precio no sea un shock',
    principle: 'anclaje',
    timing: ['antes_precio'],
    versions: {
      short: `No quiero hablarte todavía del descuento. Primero quiero que veas el costo real para que podamos comparar.`,

      medium: `No quiero hablarte todavía del descuento. Primero quiero enseñarte el costo real de la universidad para que podamos comparar.

Así vas a entender exactamente cuánto estás ahorrando.`,

      long: `No quiero hablarte todavía del descuento. Primero quiero enseñarte el costo real de la universidad para que podamos comparar.

Muchas personas solo ven el precio final, pero yo quiero que veas la diferencia entre lo que cuesta sin beca y lo que cuesta con ella.

Así vas a entender exactamente cuánto estás ahorrando y por qué esta oportunidad es especial.

¿Listo?`,
    },
    followUpQuestions: [
      '¿Listo?',
      '¿Quieres ver la comparación?',
      '¿Te parece?',
    ],
    positiveSignals: ['Sí', 'Dale', 'Listo', 'Ok'],
    negativeSignals: ['No sé si...', 'Pero el precio...', '¿Cuánto cuesta?'],
    nextIfPositive: 'costos_ancla',
    nextIfNegative: 'costos_ancla',
    tags: [],
    priority: 5,
  },
  {
    id: 'costos_ancla',
    title: 'Precio Lista (Anclaje)',
    icon: '💰',
    objective: 'Establecer el precio alto como punto de referencia antes del descuento',
    principle: 'anclaje',
    timing: ['antes_precio'],
    versions: {
      short: `El precio lista de la Licenciatura en [Carrera] es:
• Colegiatura: $7,240 MXN
• Inscripción: $1,000 MXN
• Complemento: $2,000 MXN

¿Qué te parece?`,

      medium: `Primero te platicaré sobre el precio lista, o sea, sin ningún tipo de descuento para que puedas ver la diferencia.

• Colegiatura: $7,240 MXN
• Inscripción: $1,000 MXN
• Complemento de Carrera: $2,000 MXN

Eso es lo que costaría sin la beca que tenemos disponible.

¿Qué te parece?

[Escuchar]`,

      long: `Primero te platicaré sobre el precio lista, o sea, sin ningún tipo de descuento para que puedas ver la diferencia.

• Colegiatura: $7,240 MXN al mes
• Inscripción: $1,000 MXN
• Complemento de Carrera: $2,000 MXN

Eso es lo que costaría la carrera sin ningún tipo de descuento o beca.

¿Qué te parece?

[Escuchar]

Ahora te platico la buena noticia: con la beca que tenemos disponible para ti, todo cambia.`,
    },
    followUpQuestions: [
      '¿Qué te parece?',
      '¿Te parece alto?',
      '¿Quieres ver cuánto bajaría con la beca?',
    ],
    positiveSignals: ['Es mucho', 'Ok', 'Ya veo', 'Entiendo'],
    negativeSignals: ['Es caro', 'No tengo eso', 'No alcanza'],
    nextIfPositive: 'costos_beca',
    nextIfNegative: 'costos_beca',
    tags: [],
    priority: 5,
  },
  {
    id: 'costos_beca',
    title: 'Precio Beca (Tu beneficio)',
    icon: '🎓',
    objective: 'Mostrar el contraste dramático entre precio lista y precio beca',
    principle: 'contraste',
    timing: ['antes_precio'],
    versions: {
      short: `Con la beca que tienes:
• Colegiatura: $2,419 MXN (antes $7,240)
• Inscripción: ANULADA
• Complemento: $1,000 MXN

Eso es un ahorro de más del 60%.`,

      medium: `Ahora te platico tu beca asignada:

• Colegiatura: $2,419 MXN (antes $7,240) — ahorras $4,821 al mes
• Inscripción: ANULADA — ahorras $1,000
• Complemento de Carrera: $1,000 MXN

Eso es un ahorro de más del 60% en tu colegiatura.

¿Qué差异 ves entre el precio lista y tu beca?`,

      long: `Ahora te platico tu beca asignada:

• Colegiatura: $2,419 MXN (antes $7,240) — ahorras $4,821 al mes
• Inscripción: ANULADA — ahorras $1,000
• Complemento de Carrera: $1,000 MXN

Comparalo con el precio lista:
$7,240 → $2,419. Eso es un ahorro de más del 60%.

Además, el pago lo puedes dividir en quincenas sin intereses adicionales.

¿Qué差异 ves entre el precio lista y tu beca?

[Escuchar]

Exacto. Y esto es solo el precio. Recuerda que con tu carrera también recibes acceso a Platzi, acompañamiento docente y un título con validez oficial.`,
    },
    followUpQuestions: [
      '¿Qué差异 ves entre el precio lista y tu beca?',
      '¿Te parece más accesible así?',
      '¿Sabías que puedes pagar en quincenas?',
    ],
    positiveSignals: ['Es mucho menos', 'Sí, ahora sí', 'Me gusta', 'Tiene sentido', 'Es accesible'],
    negativeSignals: ['Aún así es mucho', 'No tengo para eso', 'Puedo pagarlo en parcialidades?'],
    nextIfPositive: 'costos_referidos',
    nextIfNegative: 'costos_referidos',
    tags: ['preocupado_costos'],
    priority: 5,
  },
  {
    id: 'costos_referidos',
    title: 'Programa de Referidos',
    icon: '👥',
    objective: 'Ofrecer beneficio adicional y generar reciprocidad',
    principle: 'reciprocidad',
    timing: ['antes_precio'],
    versions: {
      short: `Y algo que mucha gente no sabe: UTEL tiene un programa de referidos. Si conoces a alguien que también esté buscando estudiar, ambos reciben beneficios.

¿Tienes alguien cercano que podría estar interesado?`,

      medium: `Y algo que mucha gente no sabe: UTEL tiene un programa de referidos.

Si conoces a alguien que también esté buscando estudiar una licenciatura, puedes referirlo y ambos reciben beneficios adicionales.

¿Tienes alguien cercano que podría estar interesado en estudiar? Un familiar, un amigo o un compañero de trabajo?

[Escuchar]

Es una excelente forma de que ambos obtengan un beneficio adicional mientras ayudas a alguien a dar el paso hacia su educación superior.`,

      long: `Y algo que mucha gente no sabe: UTEL tiene un programa de referidos.

Si conoces a alguien que también esté buscando estudiar una licenciatura, puedes referirlo y ambos reciben beneficios adicionales.

¿Tienes alguien cercano que podría estar interesado en estudiar? Un familiar, un amigo o un compañero de trabajo?

[Escuchar]

Es una excelente forma de que ambos obtengan un beneficio adicional mientras ayudas a alguien a dar el paso hacia su educación superior.

¿Te gustaría que te explique cómo funciona el programa?`,
    },
    followUpQuestions: [
      '¿Tienes alguien que podría estar interesado?',
      '¿Te gustaría referir a alguien?',
      '¿Cómo funciona el programa?',
    ],
    positiveSignals: ['Sí, tengo alguien', 'Me interesa', 'Buen idea', 'Podría referir'],
    negativeSignals: ['No conozco a nadie', 'No sé', 'Después'],
    nextIfPositive: 'costos_platzi',
    nextIfNegative: 'costos_platzi',
    tags: [],
    priority: 3,
  },
  {
    id: 'costos_platzi',
    title: 'Beneficios Platzi + UTEL',
    icon: '🎯',
    objective: 'Agregar valor percibido antes de la decisión final',
    principle: 'reciprocidad',
    timing: ['antes_precio'],
    versions: {
      short: `Además del precio, UTEL tiene una alianza con Platzi. Esto significa acceso a contenido exclusivo, metodología práctica y certificaciones laborales durante tu carrera.`,

      medium: `Además del precio, hay algo que quiero que sepas: UTEL tiene una alianza estratégica con Platzi.

Esto significa que durante tu carrera tendrás acceso a contenido exclusivo, herramientas y metodologías de Platzi integradas en tu plan de estudios.

¿Qué implica esto para ti?
• Cursos y recursos de Platzi durante la carrera
• Metodología práctica enfocada en el mundo real
• Certificaciones que valoran las empresas
• Comunidad de profesionistas y mentores

Es un valor agregado que no todas las universidades ofrecen. ¿Qué te parece?`,

      long: `Además del precio, hay algo que quiero que sepas: UTEL tiene una alianza estratégica con Platzi.

Esto significa que durante tu carrera tendrás acceso a contenido exclusivo, herramientas y metodologías de Platzi integradas en tu plan de estudios.

¿Qué implica esto para ti?

• Cursos exclusivos de Platzi
• Metodología práctica enfocada en el mundo real
• Certificaciones laborales que valoran las empresas
• Comunidad de profesionistas y mentores
• Acceso a herramientas actualizadas del mercado

Es como recibir dos formaciones en una: tu licenciatura + las habilidades prácticas de Platzi.

¿Qué te parece?`,
    },
    followUpQuestions: [
      '¿Qué te parece?',
      '¿Te gustaría tener acceso a Platzi?',
      '¿Ves el valor agregado?',
    ],
    positiveSignals: ['Me gusta', 'Bueno', 'Eso es un plus', 'Sí', 'Tiene sentido'],
    negativeSignals: ['No me interesa Platzi', 'No sé', 'Ok'],
    nextIfPositive: 'costos_decision',
    nextIfNegative: 'costos_decision',
    tags: [],
    priority: 3,
  },
  {
    id: 'costos_decision',
    title: 'Decisión SÍ/NO',
    icon: '⚖️',
    objective: 'Obtener una decisión clara del prospecto sobre la inversión',
    principle: 'compromiso',
    timing: ['cierre'],
    versions: {
      short: `¿Se adapta a lo que buscas?`,

      medium: `¿Se adapta a lo que buscas? ¿Te gustaría comenzar con tu inscripción?`,

      long: `¿Se adapta a lo que buscas? ¿Te gustaría comenzar con tu inscripción?

Recuerda que con la beca que tienes, la colegiatura baja a $2,419 y la inscripción está anulada.

¿Te gustaría comenzar?`,
    },
    followUpQuestions: [
      '¿Se adapta a lo que buscas?',
      '¿Te gustaría comenzar?',
      '¿Hay algo que te frene?',
    ],
    positiveSignals: ['SÍ', 'Sí, me gustaría', 'Dale', 'Perfecto', 'Comenzamos'],
    negativeSignals: ['NO', 'No estoy seguro', 'Déjame pensarlo', 'Es caro'],
    nextIfPositive: 'acordar_exito',
    nextIfNegative: 'acordar_no',
    tags: [],
    priority: 5,
  },
];
