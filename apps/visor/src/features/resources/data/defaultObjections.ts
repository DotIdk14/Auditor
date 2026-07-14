import type { ObjectionCategory } from '../types';

export const objectionReasons = [
  { id: 'precio', label: 'Es muy caro / No alcanza', matchedObjections: ['costos', 'flexibilidad'] },
  { id: 'tiempo', label: 'No tengo tiempo', matchedObjections: ['tiempo', 'modalidad'] },
  { id: 'duda', label: 'Tengo dudas / Necesito pensarlo', matchedObjections: ['duda', 'confianza'] },
  { id: 'otra_opcion', label: 'Ya tengo otra opción', matchedObjections: ['competencia', 'calidad'] },
  { id: 'familia', label: 'Necesito consultarlo con mi familia', matchedObjections: ['familia', 'duda'] },
  { id: 'otro', label: 'Otro motivo', matchedObjections: [] as string[] },
];

export const defaultObjectionCategories: ObjectionCategory[] = [
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
