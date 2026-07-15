import type { ProspectProfile, ProfileTag, Motivation, PainPoint } from '../../types';

const MOTIVATION_TAG_MAP: Record<Motivation, ProfileTag[]> = {
  crecer_laboral: ['quiere_crecer', 'motivacion_laboral'],
  mejor_salario: ['quiere_crecer', 'motivacion_laboral'],
  cambiar_carrera: ['quiere_cambiar', 'motivacion_laboral'],
  obtener_titulo: ['quiere_titulo', 'motivacion_personal'],
  familia: ['familia_apoyo', 'motivacion_personal'],
  ascenso: ['quiere_ascenso', 'motivacion_laboral'],
  emprender: ['quiere_emprender', 'motivacion_laboral'],
  superacion_personal: ['motivacion_personal'],
  requisito_empresa: ['motivacion_laboral'],
};

const PAIN_TAG_MAP: Record<PainPoint, ProfileTag[]> = {
  no_tiempo: ['preocupado_tiempo'],
  no_dinero: ['preocupado_costos'],
  no_termino_universidad: ['primera_universidad'],
  tiene_hijos: ['tiene_hijos'],
  trabaja: ['trabaja'],
  quiere_ascender: ['quiere_ascenso'],
  no_sabe_que_estudiar: ['quiere_cambiar'],
  otra_universidad: ['ya_tiene_opcion'],
};

export function generateTags(profile: ProspectProfile): ProfileTag[] {
  const tags = new Set<ProfileTag>();

  for (const m of profile.motivations) {
    for (const t of MOTIVATION_TAG_MAP[m] || []) tags.add(t);
  }

  for (const p of profile.painPoints) {
    for (const t of PAIN_TAG_MAP[p] || []) tags.add(t);
  }

  if (profile.situation.trabaja) tags.add('trabaja');
  else tags.add('no_trabaja');

  if (profile.situation.tieneHijos) tags.add('tiene_hijos');
  else tags.add('sin_hijos');

  if (profile.situation.primeraUniversidad) tags.add('primera_universidad');
  if (profile.situation.tieneOtraOpcion) tags.add('ya_tiene_opcion');

  if (profile.situation.preocupacionPrincipal) {
    const worryTag: Record<string, ProfileTag> = {
      precio: 'preocupado_costos',
      tiempo: 'preocupado_tiempo',
      calidad: 'preocupado_calidad',
    };
    const t = worryTag[profile.situation.preocupacionPrincipal];
    if (t) tags.add(t);
  }

  if (profile.detectedEmotion === 'dudoso' || profile.detectedEmotion === 'resistente') {
    tags.add('motivacion_emocional');
  }

  return [...tags];
}

export function matchScore(blockTags: ProfileTag[], profileTags: ProfileTag[]): number {
  if (blockTags.length === 0) return 1;
  let matches = 0;
  for (const bt of blockTags) {
    if (profileTags.includes(bt)) matches++;
  }
  return matches / blockTags.length;
}
