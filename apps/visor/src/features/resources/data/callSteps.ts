import type { CallStep } from '../types';

export const DEFAULT_CALL_STEPS: CallStep[] = [
  { id: 'call_bienvenida', type: 'section', sectionId: 'bienvenida' },
  { id: 'call_sondeo', type: 'section', sectionId: 'sondeo' },
  { id: 'call_personalizar', type: 'section', sectionId: 'personalizar' },
  { id: 'call_costos', type: 'section', sectionId: 'costos' },
  { id: 'call_acordar', type: 'section', sectionId: 'acordar' },
];
