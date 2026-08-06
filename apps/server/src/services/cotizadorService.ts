import { insforge, insforgeAdmin } from "./insforge.js";

export interface CotizadorSettings {
  domiciliacion: number;
  tituloCosto0: boolean;
  platziPreview: boolean;
  primaryColor: string;
  firmaCopiar: boolean;
  bloquearInspeccion: boolean;
  precios: Record<string, unknown> | null;
  prog: Record<string, unknown> | null;
  accs: Record<string, unknown> | null;
}

export const COTIZADOR_SETTINGS_DEFAULTS: CotizadorSettings = {
  domiciliacion: 5,
  tituloCosto0: false,
  platziPreview: false,
  primaryColor: "#39B54A",
  firmaCopiar: false,
  bloquearInspeccion: false,
  precios: null,
  prog: null,
  accs: null,
};

// Caché en memoria (fallback cuando InsForge no está configurado o falla)
let settingsMemory: CotizadorSettings = { ...COTIZADOR_SETTINGS_DEFAULTS };

function parseJsonb(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (typeof value === "object") return value as Record<string, unknown>;
  return null;
}

function rowToSettings(row: any): CotizadorSettings {
  return {
    domiciliacion: typeof row.domiciliacion === "number" ? row.domiciliacion : 5,
    tituloCosto0: Boolean(row.titulo_costo_0 ?? false),
    platziPreview: Boolean(row.platzi_preview ?? false),
    primaryColor: row.primary_color || "#39B54A",
    firmaCopiar: Boolean(row.firma_copiar ?? false),
    bloquearInspeccion: Boolean(row.bloquear_inspeccion ?? false),
    precios: parseJsonb(row.precios),
    prog: parseJsonb(row.prog),
    accs: parseJsonb(row.accs),
  };
}

export async function getCotizadorSettings(): Promise<CotizadorSettings> {
  if (process.env.INSFORGE_BASE_URL) {
    try {
      const { data, error } = await insforge.database
        .from("cotizador_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) return settingsMemory;
      if (data) {
        settingsMemory = { ...settingsMemory, ...rowToSettings(data) };
        return settingsMemory;
      }
    } catch (err: any) {
      console.warn("[COTIZADOR] Error reading settings from DB:", err.message);
    }
  }
  return settingsMemory;
}

// Merge parcial: actualiza solo los campos provistos y hace upsert de la fila completa
export async function upsertCotizadorSettings(
  partial: Partial<CotizadorSettings>,
): Promise<CotizadorSettings> {
  const current = await getCotizadorSettings();
  const next: CotizadorSettings = {
    ...current,
    ...partial,
  };
  settingsMemory = next;

  if (!process.env.INSFORGE_BASE_URL) return next;

  try {
    const client = insforgeAdmin?.database || insforge.database;
    const { error } = await client.from("cotizador_settings").upsert({
      id: 1,
      domiciliacion: next.domiciliacion,
      titulo_costo_0: next.tituloCosto0,
      platzi_preview: next.platziPreview,
      primary_color: next.primaryColor,
      firma_copiar: next.firmaCopiar,
      bloquear_inspeccion: next.bloquearInspeccion,
      precios: next.precios,
      prog: next.prog,
      accs: next.accs,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      console.warn("[COTIZADOR] Error saving settings to DB:", error.message);
    }
  } catch (err: any) {
    console.warn("[COTIZADOR] Error saving settings to DB:", err.message);
  }
  return next;
}
