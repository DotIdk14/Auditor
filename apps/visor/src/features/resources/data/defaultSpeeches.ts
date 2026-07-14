import type { SpeechSection } from '../types';
import { costFlow } from './costFlow';

export const defaultSpeechSections: SpeechSection[] = [
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
