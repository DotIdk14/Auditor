/**
 * Pequeñas reglas mágicas para saber cuánto cuesta cada estudio en UTEL.
 */

import {
  PROG,
  NEW_PROGS,
  MERCADO_UNICO_PROGS,
  DUR_MAP,
  ACCS,
  DEFERRED_ACCS,
  LISTA_MAP,
  LISTA
} from '../../data/catalogs';

// El día que celebramos que Platzi llega a UTEL
export const PLATZI_LAUNCH = new Date('2026-06-01');

// ¿Podemos ver el logo de Platzi? Sí, si ya pasó la fecha o si estamos probando.
export function isPlatziVisible(platziPreview: boolean): boolean {
  return platziPreview || new Date() >= PLATZI_LAUNCH;
}

// ¿Este estudio es nuevecito? Lo revisamos en nuestra lista de estrenos.
export function isNuevo(progName: string): boolean {
  return NEW_PROGS.indexOf(progName.toUpperCase()) >= 0;
}

// ¿Es un bachillerato?
export function isBachillerato(progName: string): boolean {
  return progName.toUpperCase().indexOf('BACHILLERATO') >= 0;
}

// ¿Este estudio tiene el mismo precio para todos (Mercado Único)?
export function isMercadoUnico(progName: string): boolean {
  return MERCADO_UNICO_PROGS.indexOf(progName.toUpperCase()) >= 0;
}

// Ponemos el signo de pesos $ y comas para que el dinero se vea bonito.
export function fmt(n: number): string {
  return '$' + Math.round(n).toLocaleString('es-MX');
}

// ¿Cuánto tiempo va a tardar el alumno en terminar? (Por ejemplo: 3 años).
export function getDuracion(sec: string, agenda: string, progName: string): string {
  if (isBachillerato(progName)) {
    return '2 años 3 meses (27 meses)';
  }
  const upperPro = progName.toUpperCase();

  // Duraciones específicas para Doctorados
  if (sec === 'doc') {
    // Nuevos doctorados 2026 (3 años/36 meses)
    if (
      upperPro.includes('CIENCIA DE DATOS') ||
      upperPro.includes('CIBERSEGURIDAD') ||
      upperPro.includes('URBANISMO') ||
      upperPro.includes('ALTA DIRECCIÓN') ||
      upperPro.includes('JUSTICIA DIGITAL') ||
      upperPro.includes('ECONOMÍA PÚBLICA') ||
      upperPro.includes('TRANSFORMACIÓN DIGITAL') ||
      isNuevo(progName)
    ) {
      return '36 meses (3 años)';
    }
    // Doctorados propios UTEL (2 años)
    return '2 años (24 meses)';
  }

  // Maestría en Psicología Transpersonal (2 años)
  if (sec === 'mae' && upperPro.includes('TRANSPERSONAL')) {
    return '24 meses (2 años)';
  }

  if (sec === 'lic' && (upperPro.includes('PSICOLOGÍA') || upperPro.includes('PSICOLOGIA'))) {
    return '3 años 8 meses (44 meses)';
  }

  const derechoProgs = ['DERECHO', 'DERECHO INTERNACIONAL', 'DERECHO EMPRESARIAL'];
  if (sec === 'lic' && derechoProgs.some(d => upperPro.indexOf(d) >= 0)) {
    return '3 años (36 meses)';
  }
  const unicaProgs = ['UNICA', 'ARTE DIGITAL Y MULTIMEDIA', 'MARKETING Y PUBLICIDAD', 'MEDIOS DIGITALES', 'COMUNICACIÓN CORPORATIVA', 'COMUNICACION CORPORATIVA'];
  if (sec === 'lic' && unicaProgs.some(u => upperPro.indexOf(u) >= 0)) {
    return '3 años (36 meses)';
  }

  const tipo = isNuevo(progName) ? 'nuevo' : 'antiguo';
  let realAgenda = agenda === 'superintensiva' ? 'super' : agenda;

  // Normalización de agenda para Maestría/Master/Doctorado en DUR_MAP
  if (sec === 'mae') {
    realAgenda = 'maestria';
  } else if (sec === 'ms') {
    realAgenda = 'master';
  } else if (sec === 'doc') {
    realAgenda = 'doctorado';
  }

  const key = `${sec}_${realAgenda}_${tipo}`;
  return DUR_MAP[key] || '—';
}

// Buscamos cuánto cuesta específicamente cada clase en nuestra lista de precios.
export function getPrice(progKey: string, nivel: string, lead: string, jornada?: string, isIng?: boolean): any {
  const pr = PROG[progKey];
  if (!pr) return null;
  let nd;
  if (pr.intensiva || pr.completa || pr.super || pr.superintensiva) {
    const jor = jornada || 'intensiva';
    // Map UI values ("superintensiva") to data keys ("super" or "superintensiva")
    let realJor = jor;
    if (jor === 'superintensiva') {
      if (pr.super) realJor = 'super';
      else if (pr.superintensiva) realJor = 'superintensiva';
    } else if (jor === 'super') {
      if (pr.superintensiva && !pr.super) realJor = 'superintensiva';
      else if (pr.super) realJor = 'super';
    }
    
    // Lazy clone from intensiva if specific modality does not exist yet
    if (!pr[realJor]) {
      try {
        pr[realJor] = JSON.parse(JSON.stringify(pr.intensiva));
      } catch (e) {
        pr[realJor] = pr.intensiva;
      }
    }
    
    const jorData = pr[realJor] || pr.intensiva;
    if (realJor === 'completa' && jorData && !jorData.niveles) {
      return jorData[lead] || jorData.hot || jorData.rmkt || null;
    }
    nd = jorData.niveles?.[nivel] || jorData.niveles?.alto || jorData;
  } else {
    nd = pr.niveles?.[nivel] || pr.niveles?.alto || pr;
  }

  // Si nd ya tiene la propiedad 'p', es el objeto final (caso superintensiva)
  if (nd && nd.p) return nd;

  return nd[lead] || nd.hot || null;
}

// Estas son las cosas que ya vienen de regalo con el estudio (como inglés o cursos).
export function getIncludedIds(sec: string, isOnline: boolean, platziPreview: boolean = false, isSeseje: boolean = false): string[] {
  const accs = ACCS[sec];
  if (!accs) return [];
  let list = (sec === 'mae' && isOnline) ? (accs.included_online || accs.included) : accs.included;

  // Lógica de reemplazo dinámica: Si Platzi no está activo, incluimos Coursera
  if (sec === 'mae' && isOnline) {
    const isPlatziActive = isPlatziVisible(platziPreview);
    if (!isPlatziActive) {
      list = list.filter(x => x.id !== 'platzi');
      if (!list.some(x => x.id === 'coursera')) {
        list = [...list, { id: 'coursera', name: 'Coursera' }];
      }
    }
    if (isSeseje) {
      // Los programas ejecutivos no incluyen Platzi en niveles de Maestría
      list = list.filter(x => x.id !== 'platzi');
    }
  }

  return list.map(x => x.id);
}

// Sumamos el costo de todos los regalitos extra que el alumno quiera comprar.
export function getAccTotal(
  sec: string,
  isOnline: boolean,
  excludeDeferred: boolean,
  selectedChips: Record<string, boolean>,
  platziPreview: boolean = false,
  isSeseje: boolean = false
): number {
  let total = 0;
  const accs = ACCS[sec];
  if (!accs) return 0;
  const incIds = getIncludedIds(sec, isOnline, platziPreview, isSeseje);

  accs.optional.forEach(grp => {
    grp.items.forEach(item => {
      if (item.hidden) return;
      if (selectedChips[item.id] === true && !incIds.includes(item.id)) {
        if (excludeDeferred && DEFERRED_ACCS.includes(item.id)) return;
        total += item.price || 0;
      }
    });
  });
  return total;
}

// Calculamos cuánto descuento (beca) le estamos dando al alumno.
export function calculateBeca(maxPrice: number, pkg: string): { becaPct: number; priceLista: number } {
  const lista = (pkg && LISTA_MAP[pkg]) || LISTA;
  const b = lista > 0 ? Math.max(0, 1 - maxPrice / lista) : 0;
  return {
    becaPct: parseFloat((b * 100).toFixed(1)),
    priceLista: lista
  };
}
