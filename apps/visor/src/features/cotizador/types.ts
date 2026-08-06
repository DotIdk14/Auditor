// Define la estructura de las secciones de resúmenes educativos
export interface SectionData {
  "1_EL_GANCHO": string;
  "2_CAMPOS_DE_DESARROLLO_PROFESIONAL": string[];
  "3_ACTIVIDADES_CLAVE_A_REALIZAR": string[];
  "4_ARGUMENTOS_DE_CIERRE_Y_VALIDEZ": string[];
}

// Interfaz para la información completa de un programa de estudio
export interface ProgramData {
  programa: string;
  secciones: SectionData;
}

// Configuración de los costos base (Precios para administradores)
export interface PreciosConfig {
  inscripcion: number;
  mensualidad: number;
  cuotaSep: number;
  seguro: number;
}

export interface AppConfig {
  domiciliacion: number;
  tituloCosto0: boolean;
  platziPreview: boolean;
  primaryColor: string;
  firmaCopiar?: boolean;
  bloquearInspeccion?: boolean;
}
