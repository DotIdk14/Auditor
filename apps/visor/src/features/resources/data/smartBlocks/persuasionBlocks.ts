import type { SmartBlock } from '../../types';

export const persuasionBlocks: SmartBlock[] = [
  {
    id: 'persu_tiempo',
    title: 'El tiempo va a pasar',
    icon: '⏳',
    objective: 'Generar urgencia: el tiempo pasa de cualquier forma, la diferencia es si tienes título o no',
    principle: 'costo_oportunidad',
    timing: ['emocional', 'antes_precio'],
    versions: {
      short: `[Nombre], el tiempo va a pasar de cualquier forma. La diferencia es si en 3 años tienes tu título o no.

¿Qué cambiaría para ti tenerlo?`,

      medium: `[Nombre], hay algo que me gustaría que pensaras.

El tiempo va a pasar de cualquier forma — 3 años van a pasar sin importar lo que hagas.

La diferencia es si en 3 años tienes tu título profesional o si sigues en la misma situación.

¿Qué cambiaría para ti tenerlo?`,

      long: `[Nombre], hay algo que me gustaría que pensaras un momento.

El tiempo va a pasar de cualquier forma — 3 años van a pasar sin importar lo que hagas. Puedes seguir exactamente donde estás, o puedes aprovechar ese tiempo para obtener tu título profesional.

Imagina dentro de 3 años: ¿dónde te gustaría estar? ¿Con título, con mejores oportunidades, con más ingresos? ¿O en la misma situación en la que estás hoy?

La inversión de tiempo es la misma. La diferencia es el resultado.

¿Qué cambiaría para ti tener tu título?`,
    },
    followUpQuestions: [
      '¿Qué cambiaría para ti tener tu título?',
      '¿Dónde te gustaría estar en 3 años?',
      '¿Vale la pena invertir ese tiempo?',
    ],
    positiveSignals: ['Cambiaría todo', 'Tienes razón', 'No lo había pensado así', 'Eso es verdad'],
    negativeSignals: ['Ya lo sé', 'Pero no tengo tiempo', 'Es complicado'],
    nextIfPositive: 'persu_graduacion',
    nextIfNegative: 'persu_futuro',
    tags: ['preocupado_tiempo', 'trabaja'],
    priority: 5,
  },
  {
    id: 'persu_graduacion',
    title: 'Imaginar la graduación',
    icon: '🎓',
    objective: 'Hacer que visualice el momento de graduación con sus seres queridos',
    principle: 'visualizacion',
    timing: ['emocional'],
    versions: {
      short: `Imagínate el día de tu graduación. Tu familia orgullosa, tu título en la pared.

¿Quién sería la persona más orgullosa de verte graduado/a?`,

      medium: `Imagínate el día de tu graduación.

Estás ahí, con tu birrete, tu familia orgullosa mirándote, tu título en la pared. Tu mamá, tu papá, tus hijos — todos celebrando lo que lograste.

¿Quién sería la persona más orgullosa de verte graduado/a?`,

      long: `Imagínate el día de tu graduación.

Estás ahí, con tu birrete, tu toga, el auditorio lleno. Tu familia mirándote desde las gradas. Tu mamá con lágrimas en los ojos. Tus hijos orgullosos.

Te llaman por tu nombre, caminas al escenario, recibes tu título. En ese momento sabes que todo el esfuerzo valió la pena.

¿Quién sería la persona más orgullosa de verte graduado/a?

[Escuchar]

Esa persona está esperando verte lograrlo. Cada día que pasa es un día menos para llegar a ese momento.`,
    },
    followUpQuestions: [
      '¿Quién sería el más orgulloso?',
      '¿Cómo te sentirías en ese momento?',
      '¿Vale la pena esforzarte para llegar ahí?',
    ],
    positiveSignals: ['Mi mamá', 'Mis hijos', 'Yo mismo', 'Eso suena increíble', 'Sí'],
    negativeSignals: ['No sé', 'No había pensado en eso', 'Es difícil imaginarlo'],
    nextIfNegative: 'persu_futuro',
    nextIfPositive: 'persu_futuro',
    tags: ['familia_apoyo', 'quiere_titulo'],
    priority: 5,
  },
  {
    id: 'persu_futuro',
    title: '¿Qué pasa si no haces nada?',
    icon: '🔴',
    objective: 'Activar aversión a la pérdida mostrando las consecuencias de no actuar',
    principle: 'aversion_perdida',
    timing: ['emocional', 'urgencia'],
    versions: {
      short: `[Nombre], ¿qué pasa si no haces nada? ¿Dónde estarás en 3 años?

[Escuchar]

¿Eso es donde quieres estar?`,

      medium: `[Nombre], hay algo que me gustaría que pensaras.

¿Qué pasa si no haces nada? Si no empiezas ahora, ¿dónde estarás en 3 años?

[Escuchar]

¿Eso es donde quieres estar? Porque la diferencia entre hacer algo y no hacer nada es enorme.`,

      long: `[Nombre], hay algo que me gustaría que pensaras con honestidad.

¿Qué pasa si no haces nada? Si no empiezas tu carrera ahora, ¿dónde estarás en 3 años?

[Escuchar]

¿Eso es donde quieres estar? Porque la realidad es esta: el tiempo va a pasar de todas formas. Pero sin título, las puertas que hoy están cerradas van a seguir cerradas.

Con título, esas puertas se abren. Sin título, se siguen cerrando.

¿Qué prefieres? ¿Estar del lado de las puertas abiertas o de las cerradas?`,
    },
    followUpQuestions: [
      '¿Dónde estarás en 3 años si no haces nada?',
      '¿Eso es donde quieres estar?',
      '¿Qué prefieres?',
    ],
    positiveSignals: ['No, no quiero eso', 'Tienes razón', 'Debo hacer algo', 'Es verdad'],
    negativeSignals: ['Ya lo sé', 'Pero es difícil', 'No puedo ahora'],
    nextIfPositive: 'persu_letra',
    nextIfNegative: 'persu_letra',
    tags: ['preocupado_tiempo', 'dudoso', 'resistente'],
    priority: 5,
  },
  {
    id: 'persu_letra',
    title: 'Carta a tu yo del futuro',
    icon: '💌',
    objective: 'Generar compromiso personal a través de una reflexión profunda',
    principle: 'compromiso_social',
    timing: ['emocional', 'cierre'],
    versions: {
      short: `¿Qué le dirías a tu yo del futuro si decides no hacerlo?

[Escuchar]

¿Y qué le dirías si SÍ lo haces?`,

      medium: `¿Qué le dirías a tu yo del futuro si decides no empezar tu carrera?

[Escuchar]

¿Y qué le dirías si SÍ lo haces? Porque la diferencia entre esas dos respuestas es exactamente lo que estás decidiendo ahora.`,

      long: `Hay algo que me gustaría que hicieras.

Cierra los ojos un momento e imagina a tu yo del futuro, dentro de 5 años.

¿Qué le dirías si decides no empezar tu carrera? Si hoy decides que no, ¿qué le dirías a esa persona?

[Escuchar]

Ahora imagina al contrario: tu yo del futuro dentro de 5 años con título, con melhores oportunidades, con más ingresos. ¿Qué le dirías?

[Escuchar]

La diferencia entre esas dos respuestas es exactamente lo que estás decidiendo en este momento.

¿Qué prefieres que sea tu realidad?`,
    },
    followUpQuestions: [
      '¿Qué le dirías a tu yo del futuro?',
      '¿Qué prefieres que sea tu realidad?',
      '¿Estás listo para dar el paso?',
    ],
    positiveSignals: ['Le diría que gracias', 'Lo haría', 'Sí, quiero eso', 'Es verdad'],
    negativeSignals: ['No sé qué decirle', 'Es difícil', 'No estoy listo'],
    nextIfPositive: 'persu_titulo',
    nextIfNegative: 'persu_titulo',
    tags: ['motivacion_emocional', 'motivacion_personal'],
    priority: 4,
  },
  {
    id: 'persu_titulo',
    title: 'No es solo un título',
    icon: '🏆',
    objective: 'Repositionar el título como puerta a oportunidades, no como documento',
    principle: 'costo_oportunidad',
    timing: ['emocional', 'antes_precio'],
    versions: {
      short: `No es solo un título. Es la puerta a ese ascenso, a ese mejor salario, a esa oportunidad que hoy no puedes tener.`,

      medium: `No es solo un título. Es la puerta a ese ascenso que llevas buscando, a ese mejor salario, a esa oportunidad que hoy no puedes tener sin él.

Es la diferencia entre ser candidato y ser seleccionado.`,

      long: `No es solo un título. Es mucho más que eso.

Es la puerta a ese ascenso que llevas buscando. A ese mejor salario. A esa oportunidad laboral que hoy no puedes tener sin él.

Es la diferencia entre ser candidato y ser seleccionado. Entre ganar X y ganar 2X. Entre quedarte donde estás o avanzar.

¿Cuánto crees que ganarías más con título? ¿$5,000? ¿$10,000 al mes? Multiplícalo por 12 meses y por 30 años de carrera laboral.

¿Cuánto es eso? Y对比 con lo que cuesta la carrera.

¿No crees que vale la pena?`,
    },
    followUpQuestions: [
      '¿Cuánto crees que ganarías más con título?',
      '¿No crees que vale la pena?',
      '¿Estás listo para dar el paso?',
    ],
    positiveSignals: ['Sí', 'Tienes razón', 'Tiene sentido', 'Eso es verdad', 'Vale la pena'],
    negativeSignals: ['No sé', 'Pero el dinero...', 'No estoy seguro'],
    nextIfPositive: 'costos_checklist',
    nextIfNegative: 'costos_checklist',
    tags: ['quiere_crecer', 'quiere_ascenso', 'motivacion_laboral'],
    priority: 4,
  },
  {
    id: 'persu_orgullo',
    title: '¿Quién sería el más orgulloso?',
    icon: '👨‍👩‍👧',
    objective: 'Activar motivación familiar y compromiso social',
    principle: 'compromiso_social',
    timing: ['emocional', 'cierre'],
    versions: {
      short: `¿Quién sería la persona más orgullosa de verte titulado?

[Escuchar]

Hazlo por esa persona.`,

      medium: `¿Quién sería la persona más orgullosa de verte titulado/a?

[Escuchar]

Esa persona está esperando verte lograrlo. Hazlo por ella.`,

      long: `¿Quién sería la persona más orgullosa de verte titulado/a?

[Escuchar]

Esa persona te está viendo ahora mismo, esperando que des el paso. Cada día que pasa es un día más de espera para ella.

¿Qué le dirías? ¿Le dirías "lo voy a hacer" o le dirías "todavía no"?

Hazlo por esa persona. Hazlo por ti. El momento es ahora.`,
    },
    followUpQuestions: [
      '¿Quién sería el más orgulloso?',
      '¿Qué le dirías?',
      '¿Lo vas a hacer por esa persona?',
    ],
    positiveSignals: ['Mi mamá', 'Mis hijos', 'Lo voy a hacer', 'Sí', 'Tengo que hacerlo'],
    negativeSignals: ['No sé', 'Es complicado', 'No puedo'],
    nextIfPositive: 'costos_checklist',
    nextIfNegative: 'costos_checklist',
    tags: ['familia_apoyo', 'quiere_titulo'],
    priority: 4,
  },
];
