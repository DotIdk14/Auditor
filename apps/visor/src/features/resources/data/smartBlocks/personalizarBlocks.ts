import type { SmartBlock } from '../../types';

export const personalizarBlocks: SmartBlock[] = [
  {
    id: 'pers_modalidad',
    title: 'Modalidad y Flexibilidad',
    icon: '💻',
    objective: 'Crear confianza en la modalidad en línea y demostrar que se adapta a su vida',
    principle: 'identificacion',
    timing: ['construccion'],
    versions: {
      short: `UTEL nacimos como universidad en línea; no nos tuvimos que adaptar después. Contamos con aula virtual 24 horas, clases en línea y acceso desde celular, tablet o computadora, sin necesidad de trasladarte a un campus.

Justamente esa es una ventaja: tú adaptas la universidad a tu rutina, no tu rutina a la universidad.`,

      medium: `Excelente, me gusta porque tienes claro lo que buscas alcanzar. Por lo que me comentas, considero que UTEL puede ser una opción que se adapte muy bien a tu situación.

Algo importante es que nosotros nacimos como universidad en línea; no tuvimos que adaptarnos después a esta modalidad, sino que todos nuestros procesos fueron diseñados para personas que trabajan, tienen familia o necesitan flexibilidad.

Actualmente contamos con aula virtual disponible las 24 horas, clases y materiales en línea, actividades organizadas durante la semana y acceso desde celular, tablet o computadora, sin necesidad de trasladarte a un campus.

De hecho, para entender cómo podrías organizarlo: Si tú pudieras diseñar tu horario ideal para estudiar, ¿en qué momento del día crees que podrías dedicarle tiempo a tu carrera?

[Escuchar]

Justamente esa es una de las ventajas: tú adaptas la universidad a tu rutina, no tu rutina a la universidad.`,

      long: `Excelente, me gusta porque tienes claro lo que buscas alcanzar. Por lo que me comentas, considero que UTEL puede ser una opción que se adapte muy bien a tu situación.

Algo importante es que nosotros nacimos como universidad en línea; no tuvimos que adaptarnos después a esta modalidad, sino que todos nuestros procesos fueron diseñados para personas que trabajan, tienen familia o necesitan flexibilidad.

Actualmente contamos con:
• Aula virtual disponible las 24 horas
• Clases y materiales en línea
• Actividades organizadas durante la semana
• Acceso desde celular, tablet o computadora
• Sin necesidad de trasladarte a un campus

De hecho, para entender cómo podrías organizarlo: Si tú pudieras diseñar tu horario ideal para estudiar, ¿en qué momento del día crees que podrías dedicarle tiempo a tu carrera?

[Escuchar]

Justamente esa es una de las ventajas: tú adaptas la universidad a tu rutina, no tu rutina a la universidad.

¿Te gustaría que te muestre cómo funciona el aula virtual?`,
    },
    followUpQuestions: [
      '¿En qué momento del día podrías dedicarle tiempo?',
      '¿Te gustaría que te muestre cómo funciona el aula?',
      '¿Eso resolvería el problema del tiempo?',
    ],
    positiveSignals: ['Sí', 'Exacto', 'Eso busco', 'Justamente', 'Nunca lo había pensado', 'Me gusta'],
    negativeSignals: ['Hmm', 'No sé', 'Prefiero presencial', 'No me convence'],
    nextIfPositive: 'pers_validez',
    nextIfNegative: 'pers_acompanamiento',
    tags: ['trabaja', 'preocupado_tiempo', 'tiene_hijos'],
    priority: 5,
  },
  {
    id: 'pers_validez',
    title: 'Validez Oficial y Titulación',
    icon: '🎓',
    objective: 'Eliminar duda sobre la validez del título y generar seguridad',
    principle: 'autoridad',
    timing: ['construccion'],
    versions: {
      short: `UTEL cuenta con Reconocimiento de Validez Oficial de Estudios (RVOE), por lo que tus estudios tienen respaldo oficial en México.

Para ti, ¿qué tan importante es que la universidad tenga validez oficial?`,

      medium: `UTEL cuenta con Reconocimiento de Validez Oficial de Estudios (RVOE), por lo que tus estudios tienen respaldo oficial en México. Al concluir tu trayectoria académica podrás iniciar tu proceso de titulación de acuerdo con los requisitos del programa.

Esto significa que tu título tiene la misma validez que el de cualquier universidad presencial.

Para ti, ¿qué tan importante es que la universidad tenga validez oficial y que puedas obtener un título profesional?`,

      long: `UTEL cuenta con Reconocimiento de Validez Oficial de Estudios (RVOE) por la SEP, por lo que tus estudios tienen respaldo oficial en México. Al concluir tu trayectoria académica podrás iniciar tu proceso de titulación de acuerdo con los requisitos del programa.

Esto significa que tu título tiene la misma validez que el de cualquier universidad presencial.

Además, contamos con acreditación internacional y somos la universidad en línea más grande de México, con miles de egresados que ya ejercen profesionalmente.

Para ti, ¿qué tan importante es que la universidad tenga validez oficial y que puedas obtener un título profesional?

[Escuchar]

Exacto, y eso es algo que no todas las instituciones en línea pueden ofrecerte.`,
    },
    followUpQuestions: [
      '¿Qué tan importante es la validez oficial para ti?',
      '¿Sabías que UTEL tiene RVOE?',
      '¿Eso te da más confianza?',
    ],
    positiveSignals: ['Muy importante', 'Sí', 'Exacto', 'Eso busco', 'Me da confianza'],
    negativeSignals: ['No sabía', 'Hmm', 'No lo había pensado'],
    nextIfPositive: 'pers_acompanamiento',
    nextIfNegative: 'pers_acompanamiento',
    tags: ['primera_universidad', 'preocupado_calidad'],
    priority: 5,
  },
  {
    id: 'pers_acompanamiento',
    title: 'Acompañamiento Académico',
    icon: '🤝',
    objective: 'Demostrar que el prospecto no estará solo en el proceso',
    principle: 'prueba_social',
    timing: ['construccion'],
    versions: {
      short: `Durante la carrera no estarás solo. Tendrás docentes, un gestor académico y el área de éxito estudiantil acompañándote en todo momento.`,

      medium: `Otro punto importante es que durante la carrera no estarás solo. Tendrás el acompañamiento constante de docentes, un gestor académico, el área de éxito estudiantil y un equipo de revisión académica.

La idea es que tengas apoyo durante todo el proceso y puedas avanzar correctamente.

¿Qué tan importante para ti es contar con ese acompañamiento?`,

      long: `Otro punto importante es que durante la carrera no estarás solo. Tendrás:
• Acompañamiento constante de docentes
• Un gestor académico dedicado
• El área de éxito estudiantil
• Un equipo de revisión académica

La idea es que tengas apoyo durante todo el proceso y puedas avanzar correctamente.

Nuestros estudiantes no se sienten solos. Siempre hay alguien que los guía, resuelve dudas y los motiva a seguir.

¿Qué tan importante para ti es contar con ese acompañamiento?

[Escuchar]

Exacto, y eso marca la diferencia entre una universidad en línea donde te sientes perdido y una donde realmente sientes que estás avanzando.`,
    },
    followUpQuestions: [
      '¿Qué tan importante es el acompañamiento para ti?',
      '¿Eso te daría más seguridad?',
      '¿Sabías que UTEL tiene gestor académico dedicado?',
    ],
    positiveSignals: ['Muy importante', 'Sí', 'Eso me gustaría', 'Me da seguridad'],
    negativeSignals: ['No sé', 'No lo había pensado', 'Supongo que sí'],
    nextIfPositive: 'pers_licenciatura',
    nextIfNegative: 'pers_licenciatura',
    tags: ['primera_universidad', 'preocupado_calidad'],
    priority: 4,
  },
  {
    id: 'pers_licenciatura',
    title: 'Explicación de la Licenciatura',
    icon: '📚',
    objective: 'Presentar la carrera de forma concreta y conectar con su motivación',
    principle: 'identificacion',
    timing: ['construccion'],
    versions: {
      short: `Ahora sí, la Licenciatura en [Carrera] tiene una duración de [duración]. El plan está diseñado para que avances desarrollando conocimientos aplicables desde el primer periodo.`,

      medium: `Ahora sí, déjame platicarte un poco más sobre la Licenciatura en [Carrera].

Tiene una duración aproximada de [duración]. El plan de estudios está diseñado para que avances desarrollando conocimientos y competencias que puedas aplicar en el área profesional.

Dentro de la carrera podrás encontrar temas clave como: [tema 1], [tema 2], [tema 3] y [tema 4].

Me comentabas que buscabas la licenciatura por [RESPUESTA DE SONDEO], ¿verdad?

[Escuchar]

Justamente esta carrera te permite desarrollar esas competencias desde los primeros periodos.`,

      long: `Ahora sí, déjame platicarte un poco más sobre la Licenciatura en [Carrera].

Tiene una duración aproximada de [duración]. El plan de estudios está diseñado para que avances desarrollando conocimientos y competencias que puedas aplicar en el área profesional.

Dentro de la carrera podrás encontrar temas clave como: [tema 1], [tema 2], [tema 3] y [tema 4]. Lo interesante es que desde los primeros periodos empiezas a desarrollar habilidades que puedes aplicar en proyectos personales o laborales.

Me comentabas que buscabas la licenciatura por [RESPUESTA DE SONDEO], ¿verdad?

[Escuchar]

Justamente esta carrera te permite desarrollar esas competencias. ¿Qué temas son los que más te llaman la atención?`,
    },
    followUpQuestions: [
      '¿Qué temas te llaman más la atención?',
      '¿Esto se alinea con lo que buscas?',
      '¿Te gustaría saber más sobre algún área específica?',
    ],
    positiveSignals: ['Sí', 'Exactamente', 'Eso busco', 'Me interesa', 'Suena bien'],
    negativeSignals: ['No sé', 'Hmm', 'No estoy seguro'],
    nextIfPositive: 'pers_beneficio_personalizado',
    nextIfNegative: 'pers_beneficio_personalizado',
    tags: [],
    priority: 4,
  },
  {
    id: 'pers_beneficio_personalizado',
    title: 'Beneficio Personalizado',
    icon: '🎁',
    objective: 'Cerrar la personalización con un beneficio único según su perfil',
    principle: 'contraprestacion',
    timing: ['construccion'],
    versions: {
      short: `[BENEFICIO SEGÚN PERFIL]

¿Cómo ves eso? ¿Hace sentido para ti?`,

      medium: `[BENEFICIO SEGÚN PERFIL]

¿Qué opinas? ¿Eso resolvería parte de lo que buscas?`,

      long: `[BENEFICIO SEGÚN PERFIL]

¿Qué opinas? ¿Eso resolvería parte de lo que buscas?

Justamente eso es lo que quería mostrarte: UTEL no solo ofrece una carrera, ofrece una solución completa para personas como tú.

¿Te gustaría que revisemos juntos la inversión?`,
    },
    followUpQuestions: [
      '¿Cómo ves eso?',
      '¿Eso resolvería lo que buscas?',
      '¿Hace sentido para ti?',
      '¿Te gustaría revisar la inversión?',
    ],
    positiveSignals: ['Sí', 'Me gusta', 'Perfecto', 'Eso es', 'Tiene sentido'],
    negativeSignals: ['No sé', 'Todavía no estoy seguro', 'Déjame pensarlo'],
    nextIfPositive: 'costos_checklist',
    nextIfNegative: 'costos_checklist',
    tags: [],
    priority: 3,
  },
];
