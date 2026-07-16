import type { ProspectProfile } from '../types';
import { MOTIVATION_LABELS, PAIN_LABELS, EMOTION_LABELS } from '../types';

export function profileToSpeechVars(profile: ProspectProfile): Record<string, string> {
  const vars: Record<string, string> = {};

  if (profile.motivations.length > 0) {
    vars['MOTIVACIÓN'] = profile.motivations.map(m => MOTIVATION_LABELS[m]).join(', ');
  }

  if (profile.painPoints.length > 0) {
    vars['DOLOR'] = profile.painPoints.map(p => PAIN_LABELS[p]).join(', ');
  }

  vars['SITUACIÓN_LABORAL'] = profile.situation.trabaja ? 'trabaja actualmente' : 'no trabaja';
  vars['TIENE_HIJOS'] = profile.situation.tieneHijos ? 'tiene hijos' : 'sin hijos';

  if (profile.detectedEmotion) {
    vars['EMOCIÓN'] = EMOTION_LABELS[profile.detectedEmotion];
  }

  if (profile.nombre) vars['Nombre'] = profile.nombre;
  if (profile.carrera) vars['Carrera'] = profile.carrera;

  return vars;
}
