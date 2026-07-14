import type { FlowStep } from '../types';

export const closingFlowSuccess: FlowStep = {
  id: 'cierre_exito',
  type: 'content',
  title: '¡Perfecto! Siguiente paso',
  content: `¡Perfecto! Para tu inscripción, necesitamos lo siguiente:\n\n• Documentos digitales (título, acta de nacimiento, CURP)\n• Solicitud de admisión (la genero yo con tus datos)\n• Primera colegiatura\n\n¿Tienes alguna duda sobre el proceso?`
};
