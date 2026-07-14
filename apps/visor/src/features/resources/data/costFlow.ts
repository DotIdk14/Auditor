import type { FlowConfig } from '../types';

export const costFlow: FlowConfig = {
  steps: [
    {
      id: 'ancla_precio',
      type: 'content',
      title: 'Precio Lista (Anclaje)',
      content: `Primero te platicaré sobre el precio lista, o sea, sin ningún tipo de descuento para que puedas ver la diferencia.\n\nColegiatura: $7,240 MXN\nInscripción: $1,000 MXN\nComplemento de Carrera: $2,000 MXN\n\n¿Qué te parece?`
    },
    {
      id: 'precio_beca',
      type: 'content',
      title: 'Precio Beca (Tu beneficio)',
      content: `Ahora te platico tu beca asignada.\n\nColegiatura: $2,419 MXN\nInscripción: ANULADA\nComplemento de Carrera: $1,000 MXN`
    },
    {
      id: 'referidos',
      type: 'content',
      title: 'Programa de Referidos',
      content: `Y algo que mucha gente no sabe: UTEL tiene un programa de referidos. Si conoces a alguien que también esté buscando estudiar una licenciatura, puedes referirlo y ambos reciben beneficios.\n\n¿Tienes alguien cercano que podría estar interesado en estudiar? Un familiar, un amigo o un compañero de trabajo?\n\n[Escuchar]\n\nEs una excelente forma de que ambos obtengan un beneficio adicional mientras ayudas a alguien a dar el paso hacia su educación superior.`
    },
    {
      id: 'beneficio_platzi',
      type: 'content',
      title: 'Beneficios Platzi + UTEL',
      content: `Además del precio, hay algo que quiero que sepas: UTEL tiene una alianza estratégica con Platzi. Esto significa que durante tu carrera tendrás acceso a contenido exclusivo, herramientas y metodologías de Platzi integradas en tu plan de estudios.\n\n¿Qué implica esto para ti?\n\n• Acceso a cursos y recursos de Platzi durante la carrera\n• Metodología práctica enfocada en el mundo real\n• Certificaciones que valoran las empresas\n• Comunidad de profesionistas y mentores\n\nEs un valor agregado que no todas las universidades ofrecen. ¿Qué te parece?`
    },
    {
      id: 'filtro',
      type: 'decision',
      prompt: '¿Se adapta a lo que buscas?',
      options: [
        { label: 'SÍ', value: 'yes' },
        { label: 'NO', value: 'no' }
      ]
    }
  ]
};
