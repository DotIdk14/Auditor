import preciosData from '../precios/precios_actuales.json';

export interface PreciosRecord {
  programa: string;
  nivel: string; // This is the valuation (alto, medio, bajo)
  lead: string;
  experiencia: string;
  paquete: string;
  escalonado: string;
  mes_1: number;
  mes_2: number;
  mes_3_en_adelante: number;
  "1er pago"?: number; // Compatibility
  "2do pago"?: number; // Compatibility
  Ticket?: number;     // Compatibility
  Paquete?: number | string; // Compatibility
  Escalonado?: string; // Compatibility
}

// Map the new flat structure to a unified array for compatibility with findPrecioRecord if needed,
// but we'll optimize findPrecioRecord to use the new categories.
const PRICING_FLAT = (preciosData as any).pricing_flat;

/**
 * Normalized comparison helper to find matching programs.
 */
export function normalizeProgramName(text: string): string {
  if (!text) return '';
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[._]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/licenciatura en /g, '')
    .replace(/maestria en /g, '')
    .replace(/doctorado en /g, '')
    .trim();
}

/**
 * Find exact matching price record from the JSON based on program name, level (Nivel), and lead state.
 */
export function findPrecioRecord(
  programName: string,
  nivel: string, // Academic Level (lic, mae, doc)
  lead: string
): any | null {
  const normalizedName = normalizeProgramName(programName);

  // Determine which sub-array to use
  let subArrayKey = "licenciatura";
  const lowerNivel = nivel.toLowerCase();
  if (lowerNivel === 'maestria' || lowerNivel === 'master' || lowerNivel === 'ma' || lowerNivel === 'ms' || lowerNivel === 'masteres') {
    subArrayKey = "maestria";
  } else if (lowerNivel === 'doctorado' || lowerNivel === 'do') {
    subArrayKey = "doctorado";
  }

  const dataset = PRICING_FLAT[subArrayKey] || [];

  // Map Lead to expected string in JSON: "Hot Lead", "RMKT +30", "RMKT +60"
  let jsonLead = "Hot Lead";
  if (lead === 'rmkt30') {
    jsonLead = "RMKT +30";
  } else if (lead === 'rmkt60') {
    jsonLead = "RMKT +60";
  } else if (lead === 'rmkt') {
    jsonLead = "RMKT +30";
  }

  // Filter by lead first and experience "Sin experiencia" (default for basic quote)
  const filterByLeadAndExp = dataset.filter(
    (r: any) => r.lead.toUpperCase() === jsonLead.toUpperCase() && 
               (r.experiencia === "Sin experiencia" || r.experiencia === "Sin Experiencia" || !r.experiencia)
  );

  const performSearch = (list: any[]) => {
    // 1. Exact match
    let m = list.find((r: any) => normalizeProgramName(r.programa) === normalizedName);
    if (m) return m;

    // 2. Partial match
    m = list.find((r: any) => {
      const rNorm = normalizeProgramName(r.programa);
      return normalizedName.includes(rNorm) || rNorm.includes(normalizedName);
    });
    return m;
  };

  let matched = performSearch(filterByLeadAndExp);

  // Fallback to Hot Lead if not found
  if (!matched && jsonLead !== "Hot Lead") {
    const fallbackList = dataset.filter(
      (r: any) => r.lead.toUpperCase() === "HOT LEAD" && 
                 (r.experiencia === "Sin experiencia" || r.experiencia === "Sin Experiencia" || !r.experiencia)
    );
    matched = performSearch(fallbackList);
  }

  if (matched) {
    // Transform to old format expected by quoteEngine.ts
    return {
      ...matched,
      "1er pago": matched.mes_1,
      "2do pago": matched.mes_2,
      "Ticket": matched.mes_3_en_adelante,
      "Paquete": matched.paquete,
      "Escalonado": matched.escalonado
    };
  }

  return null;
}
