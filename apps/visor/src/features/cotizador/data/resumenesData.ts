import data from './resumenes_programas/RESUMENES.json';
import { ProgramData } from '../types';

export const RESUMENES = data as ProgramData[];

/**
 * Ayuda a que los nombres de los estudios se entiendan mejor aunque tengan acentos.
 */
const normalize = (s: string) => s.toLowerCase()
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/^licenciatura en /gi, "")
  .replace(/^ingenieria en /gi, "")
  .replace(/^ingenieria /gi, "")
  .replace(/^doctorado en /gi, "")
  .trim();

/**
 * Busca un resumen de qué se trata el estudio usando su nombre.
 */
export function findResumen(programName: string): ProgramData | undefined {
  if (!programName) return undefined;
  
  const target = normalize(programName);

  // 1. Try exact match after normalization
  let found = RESUMENES.find(p => normalize(p.programa) === target);
  if (found) return found;

  // 2. Try partial match: JSON contains target
  found = RESUMENES.find(p => {
    const pNorm = normalize(p.programa);
    return pNorm.includes(target) || target.includes(pNorm);
  });
  
  return found;
}
