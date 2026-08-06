/**
 * Una lista grandre con todos los nombres de los estudios, sus precios y sus secretos.
 */

import preciosData from './precios/precios_actuales.json';
import ofertaEducativa from './oferta_educativa/oferta_educativa.json';

// Versiones y precio de lista general de referencia
export const BUILD = (preciosData as any).meta?.version || '210';
export const LISTA = 7233; // Precio de lista general de referencia

export interface CatalogItem {
  p: string;
  v: string;
  a: string;
  eje?: number;
  hib?: number;
  jov?: number;
  ucamp?: number;
}

const rawCatalog = (preciosData as any).catalog;

export const CATALOG: Record<string, CatalogItem[]> = {
  "LICENCIATURA": [...(rawCatalog.licenciatura || [])],
  "MAESTRÍA": [...(rawCatalog.maestria || [])],
  "DOCTORADO": [...(rawCatalog.doctorado || [])],
  "MASTER": [...(rawCatalog.master || [])]
};

export const PROG: Record<string, any> = (preciosData as any).pricing_tables_raw?.data || {};

// Initialize UVE if missing
if (!PROG.uve) {
  PROG.uve = {
    niveles: {
      alto: { p: [700, 1400, 1900, 2595, 2595, 2595, 2595, 2595, 2595, 2595, 2595, 2595], pkg: "HS24.LIC.UVE.VOXY.", esc: "—" },
      bajo: { p: [599, 1400, 1900, 2595, 2595, 2595, 2595, 2595, 2595, 2595, 2595, 2595], pkg: "BF24.LIC.UVE.VOXY.", esc: "—" }
    }
  };
}

// Initialize UNICA if missing
if (!PROG.unica) {
  PROG.unica = {
    niveles: {
      alto: { p: [735, 1470, 1995, 2810, 2810, 2810, 2810, 2810, 2810, 2810, 2810, 2810], pkg: "ESC1.LIC.UNICA.VOXY.", esc: "—" },
      bajo: { p: [629, 1470, 1995, 2810, 2810, 2810, 2810, 2810, 2810, 2810, 2810, 2810], pkg: "ESC2.LIC.UNICA.VOXY.", esc: "—" },
      medio: { p: [2810, 2810, 2810, 2810, 2810, 2810, 2810, 2810, 2810, 2810, 2810, 2810], pkg: "LIC.UNICA.VOXY.", esc: "—" } // Mapping flat to medio
    }
  };
}

export const NEW_PROGS = [
  "ARQUITECTURA", "CIBERSEGURIDAD DE SISTEMAS AUTÓNOMOS",
  "DOCTORADO EN CIENCIA DE DATOS E INTELIGENCIA ARTIFICIAL",
  "DOCTORADO EN CIBERSEGURIDAD DE SISTEMAS AUTÓNOMOS",
  "DOCTORADO EN CIBERSEGURIDAD Y GESTIÓN DE RIESGOS DIGITALES",
  "DOCTORADO EN URBANISMO",
  "DOCTORADO EN ALTA DIRECCIÓN Y GOBIERNO CORPORATIVO",
  "DOCTORADO EN JUSTICIA DIGITAL Y CIBERDERECHO",
  "DOCTORADO EN ECONOMÍA PÚBLICA, FISCALIDAD Y GOBERNANZA FINANCIERA",
  "DOCTORADO EN TRANSFORMACIÓN DIGITAL ORGANIZACIONAL",
  "ÉTICA Y GOBERNANZA DE LA INTELIGENCIA ARTIFICIAL", "SOFTWARE PARA ENTRETENIMIENTO DIGITAL",
  "EMPRENDIMIENTO", "RESPONSABILIDAD SOCIAL", "EDUCACIÓN INTELIGENTE Y DISEÑO INSTRUCCIONAL CON INTELIGENCIA ARTIFICIAL",
  "INGENIERÍA EN DESARROLLO DE SOFTWARE", "INTELIGENCIA ARTIFICIAL Y CIENCIA DE DATOS",
  "INGENIERÍA DE DATOS E INFRAESTRUCTURA",
  "DISEÑO Y ANIMACIÓN DIGITAL", "LOGÍSTICA Y CADENA DE SUMINISTRO", "INGENIERÍA EN PROGRAMACIÓN EN LA NUBE",
  "FINANZAS Y ESTRATEGIA FISCAL", "DISEÑO PARA MEDIOS DIGITALES", "INGENIERÍA ROBÓTICA",
  "INGENIERÍA EN LOGÍSTICA Y TRANSPORTE", "INNOVACIÓN EDUCATIVA Y DISEÑO INSTRUCCIONAL",
  "CIBERSEGURIDAD Y RIESGOS EN INTELIGENCIA ARTIFICIAL", "ESTRATEGIA Y TRANSFORMACIÓN DE NEGOCIOS",
  "INGENIERÍA EN TECNOLOGÍA DE VIDEOJUEGOS Y REALIDAD VIRTUAL", "EDUCACIÓN PARA LA SUSTENTABILIDAD",
  "IMPUESTOS", "INNOVACIÓN Y EMPRENDIMIENTO CON INTELIGENCIA ARTIFICIAL", "COMERCIO ELECTRÓNICO Y NEGOCIOS DIGITALES",
  "ALTA DIRECCIÓN Y GOBIERNO CORPORATIVO", "INGENIERÍA EN CIENCIAS DE DATOS E INTELIGENCIA ANALÍTICA",
  "DESARROLLO SUSTENTABLE Y GESTIÓN AMBIENTAL", "INGENIERÍA AMBIENTAL", "AUTOMATIZACIÓN Y ROBÓTICA INDUSTRIAL",
  "MERCADOTECNIA POLÍTICA", "INNOVACIÓN ESTRATÉGICA CON INTELIGENCIA ARTIFICIAL", "AUTOMATIZACIÓN DE PROCESOS Y ANÁLISIS PREDICTIVO",
  "SEGURIDAD INFORMÁTICA", "FINANZAS Y BANCA", "CIBERSEGURIDAD Y GESTIÓN DE RIESGOS DIGITALES",
  "INNOVACIÓN Y TRANSFORMACIÓN DE NEGOCIOS", "URBANISMO", "AGRONEGOCIOS", "DIRECCIÓN DE ARTE",
  "VALUACIÓN INMOBILIARIA", "DESARROLLO DE VIDEOJUEGOS Y REALIDAD EXTENDIDA", "ARQUITECTURA DE SOFTWARE",
  "TECNOLOGÍAS INTERACTIVAS Y VIRTUALES", "INTELIGENCIA ARTIFICIAL", "SOLUCIONES DE INTELIGENCIA ARTIFICIAL PARA NEGOCIOS Y SERVICIOS",
  "INGENIERÍA EN ENERGÍAS RENOVABLES", "INGENIERÍA EN SISTEMAS INTELIGENTES", "EDUCACIÓN", "INTELIGENCIA ARTIFICIAL EN EDUCACIÓN",
  "CIBERSEGURIDAD", "DERECHOS HUMANOS"
];

export const DUR_MAP: Record<string, string> = {
  'lic_intensiva_nuevo': '36 meses (3 años)',
  'lic_completa_nuevo': '44 meses (3 años 8 meses)',
  'lic_super_nuevo': '24 meses (2 años)',
  'mae_maestria_nuevo': '24 meses (2 años)',
  'ms_master_nuevo': '24 meses (2 años)',
  'doc_doctorado_nuevo': '36 meses (3 años)',
  'lic_intensiva_antiguo': '34 meses (2 años 10 meses)',
  'lic_completa_antiguo': '44 meses (3 años 8 meses)',
  'lic_super_antiguo': '24 meses (2 años)',
  'mae_maestria_antiguo': '18 meses (1 año 6 meses)',
  'ms_master_antiguo': '18 meses (1 año 6 meses)',
  'doc_doctorado_antiguo': '24 meses (2 años)'
};

export interface AccItem {
  id: string;
  name: string;
  price?: number;
  hidden?: boolean;
}

export interface AccGroup {
  cat: string;
  items: AccItem[];
}

export interface AccsStructure {
  included: AccItem[];
  included_online?: AccItem[];
  optional: AccGroup[];
}

export const ACCS: Record<string, AccsStructure> = {
  lic: {
    included: [
      { id: 'voxy', name: 'Inglés Voxy' },
      { id: 'welbe', name: 'Welbe' },
      { id: 'asist', name: 'Asistencia Plus' }
    ],
    optional: [
      {
        cat: 'Accesorio', items: [
          { id: 'tit', name: 'Titulación', price: 195 },
          { id: 'tit50', name: 'Título 50%', price: 165 },
          { id: 'welbep', name: 'Welbe Premium (+$10 upgrade)', price: 10 }
        ]
      },
      {
        cat: 'Experiencia', items: [
          { id: 'ucamp', name: 'U-Camp', price: 110 }
        ]
      },
      {
        cat: 'Plataforma', items: [
          { id: 'utelx', name: 'UTEL X', price: 165 },
        ]
      },
      {
        cat: 'Idioma', items: [
          { id: 'cambridge', name: 'Cambridge', price: 165 },
          { id: 'duolingo', name: 'Duolingo', price: 195 }
        ]
      },
      {
        cat: 'Certificación', items: [
          { id: 'platzi', name: 'Platzi', price: 100 },
          { id: 'coursera', name: 'Coursera', price: 220 },
          { id: 'facebook', name: 'Facebook', price: 195 },
          { id: 'microsoft', name: 'Microsoft', price: 195 },
          { id: 'tableau', name: 'Tableau', price: 195 },
          { id: 'gcloud', name: 'Google Cloud', price: 195 },
          { id: 'gads', name: 'Google Ads', price: 195 },
          { id: 'legal', name: 'Legaltech', price: 195 }
        ]
      }
    ]
  },
  mae: {
    included: [
      { id: 'voxy', name: 'Inglés Voxy' },
      { id: 'welbe', name: 'Welbe' },
      { id: 'asist', name: 'Asistencia Plus' }
    ],
    included_online: [
      { id: 'voxy', name: 'Inglés Voxy' },
      { id: 'welbe', name: 'Welbe' },
      { id: 'platzi', name: 'Platzi' },
      { id: 'asist', name: 'Asistencia Plus' }
    ],
    optional: [
      {
        cat: 'Accesorio', items: [
          { id: 'tit', name: 'Titulación', price: 305 },
          { id: 'tit50', name: 'Título 50%', price: 275 },
          { id: 'welbep', name: 'Welbe Premium (+$10 upgrade)', price: 10 }
        ]
      },
      { cat: 'Experiencia', items: [] },
      {
        cat: 'Plataforma', items: [
          { id: 'utelx', name: 'UTEL X', price: 165 },
        ]
      },
      {
        cat: 'Idioma', items: [
          { id: 'cambridge', name: 'Cambridge', price: 220 },
          { id: 'duolingo', name: 'Duolingo', price: 195 }
        ]
      },
      {
        cat: 'Certificación', items: [
          { id: 'platzi', name: 'Platzi', price: 100 },
          { id: 'facebook', name: 'Facebook', price: 195 },
          { id: 'microsoft', name: 'Microsoft', price: 195 },
          { id: 'tableau', name: 'Tableau', price: 195 },
          { id: 'gcloud', name: 'Google Cloud', price: 195 },
          { id: 'gads', name: 'Google Ads', price: 195 },
          { id: 'legal', name: 'Legaltech', price: 195 }
        ]
      }
    ]
  },
  ms: {
    included: [
      { id: 'voxy', name: 'Inglés Voxy' },
      { id: 'welbe', name: 'Welbe' },
      { id: 'seseje', name: 'Sesión Ejecutiva' },
      { id: 'asist', name: 'Asistencia Plus' }
    ],
    optional: [
      {
        cat: 'Accesorio', items: [
          { id: 'diploma', name: 'Diploma Master', price: 220 }
        ]
      },
      {
        cat: 'Plataforma', items: [
          { id: 'utelx', name: 'UTEL X', price: 165 },
        ]
      },
      {
        cat: 'Idioma', items: [
          { id: 'cambridge', name: 'Cambridge', price: 220 }
        ]
      },
      {
        cat: 'Certificación', items: [
          { id: 'platzi', name: 'Platzi', price: 100 },
          { id: 'microsoft', name: 'Microsoft', price: 195 },
          { id: 'gads', name: 'Google Ads', price: 195 }
        ]
      }
    ]
  },
  doc: {
    included: [
      { id: 'voxy', name: 'Inglés Voxy' },
      { id: 'welbe', name: 'Welbe' },
      { id: 'asist', name: 'Asistencia Plus' }
    ],
    optional: [
      {
        cat: 'Accesorio', items: [
          { id: 'tit', name: 'Titulación', price: 305 }
        ]
      },
      {
        cat: 'Plataforma', items: [
          { id: 'utelx', name: 'UTEL X', price: 165 },
        ]
      },
      {
        cat: 'Idioma', items: [
          { id: 'cambridge', name: 'Cambridge', price: 220 }
        ]
      },
      {
        cat: 'Certificación', items: [
          { id: 'platzi', name: 'Platzi', price: 100 },
          { id: 'coursera', name: 'Coursera', price: 195 },
          { id: 'facebook', name: 'Facebook', price: 195 },
          { id: 'microsoft', name: 'Microsoft', price: 195 },
          { id: 'gads', name: 'Google Ads', price: 195 }
        ]
      }
    ]
  }
};

export const CERT_IDS = ['coursera', 'platzi', 'facebook', 'cifal', 'microsoft', 'tableau', 'gcloud', 'gads', 'legal'];
export const DEFERRED_ACCS = ['ucamp', 'utelx', 'tit', 'tit50', 'tit0_free'];
export const ALWAYS_ACCS = ['diploma', 'platzi'];
export const PLAT_IDS = ['utelx', 'ugen'];
export const IDIOM_IDS = ['cambridge', 'duolingo'];

export const EXP_PRICES: Record<string, number> = { seseje: 165, utelj: 165, hibrid: 340 };
export const EXP_PRICES_MAE: Record<string, number> = { seseje: 165, hibrid: 395 };

export const INICIO_BY_PROG: Record<string, string[]> = {
  "Administración": ["22/06/2026", "06/07/2026", "20/07/2026", "03/08/2026", "17/08/2026", "31/08/2026", "14/09/2026", "28/09/2026", "12/10/2026", "26/10/2026", "09/11/2026", "23/11/2026", "07/12/2026", "04/01/2027", "18/01/2027", "01/02/2027", "01/03/2027"],
  "Administración De Empresas Turísticas": ["06/07/2026", "03/08/2026", "31/08/2026", "28/09/2026", "26/10/2026", "23/11/2026", "04/01/2027", "01/02/2027", "01/03/2027"],
  "Administración De Instituciones Educativas": ["06/07/2026", "03/08/2026", "31/08/2026", "28/09/2026", "26/10/2026", "23/11/2026", "04/01/2027"],
  "Administración De Negocios": ["22/06/2026", "06/07/2026", "20/07/2026", "03/08/2026", "17/08/2026", "31/08/2026", "14/09/2026", "28/09/2026", "12/10/2026", "26/10/2026", "09/11/2026", "23/11/2026", "07/12/2026", "04/01/2027", "18/01/2027", "01/02/2027", "01/03/2027"],
  "Administración De Negocios - Mba Internacional": ["06/07/2026", "03/08/2026", "31/08/2026", "28/09/2026", "26/10/2026", "23/11/2026", "04/01/2027"],
  "Administración De Negocios Deportivos": ["31/08/2026", "04/01/2027"],
  "Administración De Negocios-Iebs": ["06/07/2026", "03/08/2026", "31/08/2026", "28/09/2026", "26/10/2026", "23/11/2026", "04/01/2027"],
  "Administración De Recursos Humanos": ["22/06/2026", "06/07/2026", "20/07/2026", "03/08/2026", "17/08/2026", "31/08/2026", "14/09/2026", "28/09/2026", "12/10/2026", "26/10/2026", "09/11/2026", "23/11/2026", "07/12/2026", "04/01/2027", "18/01/2027", "01/02/2027", "01/03/2027"],
  "Administración De Riesgos Financieros": ["06/07/2026"],
  "Administración De Tecnologías De La Información": ["22/06/2026", "06/07/2026", "20/07/2026", "03/08/2026", "17/08/2026", "31/08/2026", "14/09/2026", "28/09/2026", "12/10/2026", "26/10/2026", "09/11/2026", "23/11/2026", "07/12/2026", "04/01/2027", "18/01/2027", "01/02/2027", "01/03/2027"],
  "Administración De Ventas": ["06/07/2026", "03/08/2026", "31/08/2026", "28/09/2026", "26/10/2026", "23/11/2026", "04/01/2027", "01/02/2027", "01/03/2027"],
  "Administración En Mercadotecnia Estratégica": ["31/08/2026", "04/01/2027"],
  "Administración Estratégica Empresarial": ["31/08/2026", "04/01/2027"],
  "Administración Pública": ["06/07/2026", "31/08/2026", "26/10/2026", "04/01/2027"],
  "Administración Y Finanzas": ["22/06/2026", "06/07/2026", "20/07/2026", "03/08/2026", "17/08/2026", "31/08/2026", "14/09/2026", "28/09/2026", "12/10/2026", "26/10/2026", "09/11/2026", "23/11/2026", "07/12/2026", "04/01/2027", "18/01/2027", "01/02/2027", "01/03/2027"],
  "Agronegocios": ["06/07/2026", "03/08/2026", "31/08/2026", "28/09/2026", "26/10/2026", "23/11/2026", "04/01/2027", "01/02/2027", "01/03/2027"],
  "Alta Dirección Y Gobierno Corporativo": ["06/07/2026", "31/08/2026"],
  "Arquitectura": ["06/07/2026"],
  "Arquitectura De Software": ["06/07/2026"],
  "Arte Digital Y Multimedia": ["29/06/2026"],
  "Asesoría Empresarial Estratégica": ["06/07/2026"],
  "Auditoría Financiera": ["06/07/2026"],
  "Automatización De Procesos Y Análisis Predictivo": ["06/07/2026"],
  "Automatización Y Robótica Industrial": ["06/07/2026"],
  "Ciberseguridad": ["06/07/2026", "31/08/2026", "26/10/2026", "04/01/2027"],
  "Ciberseguridad De Sistemas Autónomos": ["31/08/2026"],
  "Ciberseguridad Y Gestión De Riesgos Digitales": ["31/08/2026"],
  "Ciberseguridad Y Riesgos En Inteligencia Artificial": ["06/07/2026"],
  "Ciencia De Datos E Inteligencia Artificial": ["31/08/2026"],
  "Ciencia De Datos Para Negocios": ["06/07/2026", "03/08/2026", "31/08/2026", "28/09/2026", "26/10/2026", "23/11/2026", "04/01/2027"],
  "Ciencias Computacionales Y Telecomunicaciones": ["31/08/2026", "04/01/2027"],
  "Ciencias Políticas Y Administración Pública": ["06/07/2026", "03/08/2026", "31/08/2026", "28/09/2026", "26/10/2026", "23/11/2026", "04/01/2027", "01/02/2027", "01/03/2027"],
  "Coaching Integral Y Organizacional": ["06/07/2026", "03/08/2026", "31/08/2026", "28/09/2026", "26/10/2026", "23/11/2026", "04/01/2027"],
  "Comercialización Turística Y Mercados Digitales": ["06/07/2026"],
  "Comercialización Y Dirección De Marcas": ["06/07/2026"],
  "Comercio Electrónico Y Negocios Digitales": ["06/07/2026"],
  "Comercio Internacional": ["06/07/2026", "31/08/2026", "04/01/2027"],
  "Comunicación": ["22/06/2026", "06/07/2026", "20/07/2026", "03/08/2026", "17/08/2026", "31/08/2026", "14/09/2026", "28/09/2026", "12/10/2026", "26/10/2026", "09/11/2026", "23/11/2026", "07/12/2026", "04/01/2027", "18/01/2027", "01/02/2027", "01/03/2027"],
  "Comunicación Corporativa": ["29/06/2026"],
  "Comunicación Digital": ["22/06/2026", "06/07/2026", "20/07/2026", "03/08/2026", "17/08/2026", "31/08/2026", "14/09/2026", "28/09/2026", "12/10/2026", "26/10/2026", "09/11/2026", "23/11/2026", "07/12/2026", "04/01/2027", "18/01/2027", "01/02/2027", "01/03/2027"],
  "Comunicación Organizacional": ["22/06/2026", "06/07/2026", "20/07/2026", "03/08/2026", "17/08/2026", "31/08/2026", "14/09/2026", "28/09/2026", "12/10/2026", "26/10/2026", "09/11/2026", "23/11/2026", "07/12/2026", "04/01/2027", "18/01/2027", "01/02/2027", "01/03/2027"],
  "Comunicación Y Manejo De Redes Sociales": ["06/07/2026"],
  "Comunicación Y Periodismo": ["06/07/2026"],
  "Conciencia Plena Aplicada": ["06/07/2026", "03/08/2026", "31/08/2026", "28/09/2026", "26/10/2026", "23/11/2026", "04/01/2027"],
  "Consultoría Y Desarrollo Empresarial": ["06/07/2026"],
  "Contaduría Pública": ["22/06/2026", "06/07/2026", "20/07/2026", "03/08/2026", "17/08/2026", "31/08/2026", "14/09/2026", "28/09/2026", "12/10/2026", "26/10/2026", "09/11/2026", "23/11/2026", "07/12/2026", "04/01/2027", "18/01/2027", "01/02/2027", "01/03/2027"],
  "Contaduría Y Finanzas": ["22/06/2026", "06/07/2026", "20/07/2026", "03/08/2026", "17/08/2026", "31/08/2026", "14/09/2026", "28/09/2026", "12/10/2026", "26/10/2026", "09/11/2026", "23/11/2026", "07/12/2026", "04/01/2027", "18/01/2027", "01/02/2027", "01/03/2027"],
  "Criminología Y Criminalística": ["22/06/2026", "06/07/2026", "20/07/2026", "03/08/2026", "17/08/2026", "31/08/2026", "14/09/2026", "28/09/2026", "12/10/2026", "26/10/2026", "09/11/2026", "23/11/2026", "07/12/2026", "04/01/2027", "18/01/2027", "01/02/2027", "01/03/2027"],
  "Cultura Y Transformación Digital": ["06/07/2026"],
  "Derecho": ["22/06/2026", "06/07/2026", "20/07/2026", "03/08/2026", "17/08/2026", "31/08/2026", "14/09/2026", "28/09/2026", "12/10/2026", "26/10/2026", "09/11/2026", "23/11/2026", "07/12/2026", "04/01/2027", "18/01/2027", "01/02/2027", "01/03/2027"],
  "Derecho Empresarial": ["22/06/2026", "06/07/2026", "20/07/2026", "03/08/2026", "17/08/2026", "31/08/2026", "14/09/2026", "28/09/2026", "12/10/2026", "26/10/2026", "09/11/2026", "23/11/2026", "07/12/2026", "04/01/2027", "18/01/2027", "01/02/2027", "01/03/2027"],
  "Derecho Internacional": ["22/06/2026", "06/07/2026", "20/07/2026", "03/08/2026", "17/08/2026", "31/08/2026", "14/09/2026", "28/09/2026", "12/10/2026", "26/10/2026", "09/11/2026", "23/11/2026", "07/12/2026", "04/01/2027", "18/01/2027", "01/02/2027", "01/03/2027"],
  "Derecho Procesal Constitucional": ["31/08/2026", "04/01/2027"],
  "Derecho Procesal Penal": ["31/08/2026", "04/01/2027"],
  "Derecho Procesal Y Juicios Orales": ["06/07/2026", "31/08/2026", "26/10/2026", "04/01/2027"],
  "Derechos Humanos": ["06/07/2026", "31/08/2026", "26/10/2026", "04/01/2027"],
  "Desarrollo De Videojuegos Y Realidad Extendida": ["06/07/2026"],
  "Desarrollo Humano": ["31/08/2026"],
  "Desarrollo Sustentable Y Ecoturismo": ["06/07/2026", "03/08/2026", "31/08/2026", "28/09/2026", "26/10/2026", "23/11/2026", "04/01/2027", "01/02/2027", "01/03/2027"],
  "Desarrollo Sustentable Y Gestión Ambiental": ["06/07/2026", "31/08/2026", "26/10/2026", "04/01/2027"],
  "Dirección De Arte": ["06/07/2026", "03/08/2026", "31/08/2026", "28/09/2026", "26/10/2026", "23/11/2026", "04/01/2027", "01/02/2027", "01/03/2027"],
  "Dirección De Empresas Turísticas": ["31/08/2026", "04/01/2027"],
  "Dirección De Negocios De Alimentos Y Bebidas": ["31/08/2026", "04/01/2027"],
  "Dirección De Proyectos De Innovación": ["06/07/2026", "03/08/2026", "31/08/2026", "28/09/2026", "26/10/2026", "23/11/2026", "04/01/2027"],
  "Dirección De Ventas": ["06/07/2026", "03/08/2026", "31/08/2026", "28/09/2026", "26/10/2026", "23/11/2026", "04/01/2027"],
  "Dirección E Ingeniería De Software": ["06/07/2026", "31/08/2026", "26/10/2026", "04/01/2027"],
  "Diseño De Interacción Y Experiencia De Usuario": ["06/07/2026"],
  "Diseño Para Medios Digitales": ["06/07/2026", "31/08/2026", "26/10/2026", "04/01/2027"],
  "Diseño Y Animación Digital": ["06/07/2026", "03/08/2026", "31/08/2026", "28/09/2026", "26/10/2026", "23/11/2026", "04/01/2027", "01/02/2027", "01/03/2027"],
  "Diseño Y Producción De Videojuegos": ["06/07/2026"],
  "Economía Digital Y Nuevas Formas De Mercado": ["06/07/2026"],
  "Economía Pública, Fiscalidad Y Gobernanza Financiera": ["31/08/2026"],
  "Economía Sustentable Y Empresas Responsables": ["06/07/2026"],
  "Economía Y Finanzas": ["06/07/2026", "03/08/2026", "31/08/2026", "28/09/2026", "26/10/2026", "23/11/2026", "04/01/2027", "01/02/2027", "01/03/2027"],
  "Educación": ["06/07/2026", "03/08/2026", "31/08/2026", "28/09/2026", "26/10/2026", "23/11/2026", "04/01/2027"],
  "Educación Inteligente Y Diseño Instruccional Con Inteligencia Artificial": ["06/07/2026"],
  "Educación Para La Sustentabilidad": ["06/07/2026"],
  "Educación Y Docencia": ["06/07/2026", "03/08/2026", "31/08/2026", "28/09/2026", "26/10/2026", "23/11/2026", "04/01/2027"],
  "Emprendimiento": ["06/07/2026", "03/08/2026", "31/08/2026", "28/09/2026", "26/10/2026", "23/11/2026", "04/01/2027", "01/02/2027", "01/03/2027"],
  "Energías Renovables Y Eficiencia Energética": ["06/07/2026", "31/08/2026", "26/10/2026", "04/01/2027"],
  "Estrategia De Comercio Internacional Y Aduanas": ["06/07/2026"],
  "Estrategia Y Transformación De Negocios": ["06/07/2026"],
  "Finanzas": ["06/07/2026", "03/08/2026", "31/08/2026", "28/09/2026", "26/10/2026", "23/11/2026", "04/01/2027"],
  "Finanzas Públicas Y Gestión Gubernamental": ["06/07/2026"],
  "Finanzas Sustentables Y Proyectos De Inversión": ["06/07/2026"],
  "Finanzas Y Banca": ["06/07/2026"],
  "Finanzas Y Estrategia Fiscal": ["06/07/2026"],
  "Gestión Del Cambio Y Transformación Organizacional": ["06/07/2026"],
  "Gestión Del Talento Y Bienestar Organizacional": ["06/07/2026"],
  "Gestión Directiva De Instituciones En Salud": ["06/07/2026", "03/08/2026", "31/08/2026", "28/09/2026", "26/10/2026", "23/11/2026", "04/01/2027"],
  "Gestión E Innovación Tecnológica": ["31/08/2026", "04/01/2027"],
  "Gestión Estratégica Del Capital Humano": ["31/08/2026", "04/01/2027"],
  "Gestión Organizacional Positiva": ["06/07/2026", "31/08/2026", "26/10/2026", "04/01/2027"],
  "Impuestos": ["06/07/2026", "31/08/2026", "26/10/2026", "04/01/2027"],
  "Infraestructura Y Cómputo En La Nube": ["06/07/2026"],
  "Ingeniería Ambiental": ["06/07/2026"],
  "Ingeniería De Datos E Infraestructura": ["06/07/2026"],
  "Ingeniería En Automatización Industrial": ["06/07/2026"],
  "Ingeniería En Ciencias De Datos E Inteligencia Analítica": ["06/07/2026"],
  "Ingeniería En Desarrollo De Software": ["06/07/2026", "03/08/2026", "31/08/2026", "28/09/2026", "26/10/2026", "23/11/2026", "04/01/2027", "01/02/2027", "01/03/2027"],
  "Ingeniería En Energías Renovables": ["06/07/2026", "03/08/2026", "31/08/2026", "28/09/2026", "26/10/2026", "23/11/2026", "04/01/2027", "01/02/2027", "01/03/2027"],
  "Ingeniería En Logística Y Transporte": ["06/07/2026", "03/08/2026", "31/08/2026", "28/09/2026", "26/10/2026", "23/11/2026", "04/01/2027", "01/02/2027", "01/03/2027"],
  "Ingeniería En Programación En La Nube": ["06/07/2026"],
  "Ingeniería En Sistemas Computacionales": ["22/06/2026", "06/07/2026", "20/07/2026", "03/08/2026", "17/08/2026", "31/08/2026", "14/09/2026", "28/09/2026", "12/10/2026", "26/10/2026", "09/11/2026", "23/11/2026", "07/12/2026", "04/01/2027", "18/01/2027", "01/02/2027", "01/03/2027"],
  "Ingeniería En Sistemas Inteligentes": ["06/07/2026"],
  "Ingeniería En Tecnología De Videojuegos Y Realidad Virtual": ["06/07/2026"],
  "Ingeniería Industrial": ["22/06/2026", "06/07/2026", "20/07/2026", "03/08/2026", "17/08/2026", "31/08/2026", "14/09/2026", "28/09/2026", "12/10/2026", "26/10/2026", "09/11/2026", "23/11/2026", "07/12/2026", "04/01/2027", "18/01/2027", "01/02/2027", "01/03/2027"],
  "Ingeniería Industrial Y Administración": ["22/06/2026", "06/07/2026", "20/07/2026", "03/08/2026", "17/08/2026", "31/08/2026", "14/09/2026", "28/09/2026", "12/10/2026", "26/10/2026", "09/11/2026", "23/11/2026", "07/12/2026", "04/01/2027", "18/01/2027", "01/02/2027", "01/03/2027"],
  "Ingeniería Robótica": ["06/07/2026"],
  "Ingeniería Y Tecnología Ambiental": ["06/07/2026", "31/08/2026", "26/10/2026", "04/01/2027"],
  "Innovación Educativa Y Diseño Instruccional": ["06/07/2026"],
  "Innovación En Modelos De Negocio": ["06/07/2026"],
  "Innovación Estratégica Con Inteligencia Artificial": ["06/07/2026"],
  "Innovación Y Emprendimiento Con Inteligencia Artificial": ["06/07/2026"],
  "Innovación Y Transformación De Negocios": ["06/07/2026"],
  "Inteligencia Artificial": ["06/07/2026", "03/08/2026", "31/08/2026", "28/09/2026", "26/10/2026", "23/11/2026", "04/01/2027", "01/02/2027", "01/03/2027"],
  "Inteligencia Artificial Aplicada A Negocios, Industria Y Automatización": ["06/07/2026"],
  "Inteligencia Artificial En Educación": ["06/07/2026"],
  "Inteligencia Artificial Y Ciencia De Datos": ["06/07/2026"],
  "Inteligencia Financiera Y Detección De Fraudes": ["06/07/2026"],
  "Interfaces Inteligentes Y Tecnología Inmersiva": ["06/07/2026"],
  "Justicia Digital Y Ciberderecho": ["31/08/2026"],
  "Logística Y Cadena De Suministro": ["06/07/2026", "31/08/2026", "26/10/2026", "04/01/2027"],
  "Marketing Y Publicidad": ["29/06/2026"],
  "Medios Digitales": ["29/06/2026"],
  "Mercadotecnia": ["22/06/2026", "06/07/2026", "20/07/2026", "03/08/2026", "17/08/2026", "31/08/2026", "14/09/2026", "28/09/2026", "12/10/2026", "26/10/2026", "09/11/2026", "23/11/2026", "07/12/2026", "04/01/2027", "18/01/2027", "01/02/2027", "01/03/2027"],
  "Mercadotecnia Digital Y Comercio Electrónico": ["06/07/2026", "03/08/2026", "31/08/2026", "28/09/2026", "26/10/2026", "23/11/2026", "04/01/2027"],
  "Mercadotecnia Gastronómica Y De Destinos": ["06/07/2026"],
  "Mercadotecnia Política": ["06/07/2026", "31/08/2026", "26/10/2026", "04/01/2027"],
  "Negocios Internacionales": ["22/06/2026", "06/07/2026", "20/07/2026", "03/08/2026", "17/08/2026", "31/08/2026", "14/09/2026", "28/09/2026", "12/10/2026", "26/10/2026", "09/11/2026", "23/11/2026", "07/12/2026", "04/01/2027", "18/01/2027", "01/02/2027", "01/03/2027"],
  "Pedagogía": ["22/06/2026", "06/07/2026", "20/07/2026", "03/08/2026", "17/08/2026", "31/08/2026", "14/09/2026", "28/09/2026", "12/10/2026", "26/10/2026", "09/11/2026", "23/11/2026", "07/12/2026", "04/01/2027", "18/01/2027", "01/02/2027", "01/03/2027"],
  "Psicología": ["29/06/2026", "27/07/2026"],
  "Psicología Organizacional": ["22/06/2026", "06/07/2026", "20/07/2026", "03/08/2026", "17/08/2026", "31/08/2026", "14/09/2026", "28/09/2026", "12/10/2026", "26/10/2026", "09/11/2026", "23/11/2026", "07/12/2026", "04/01/2027", "18/01/2027", "01/02/2027", "01/03/2027"],
  "Psicología Transpersonal": ["31/08/2026"],
  "Publicidad Y Medios": ["06/07/2026"],
  "Responsabilidad Social": ["06/07/2026", "31/08/2026", "26/10/2026", "04/01/2027"],
  "Seguridad Informática": ["06/07/2026", "03/08/2026", "31/08/2026", "28/09/2026", "26/10/2026", "23/11/2026", "04/01/2027", "01/02/2027", "01/03/2027"],
  "Software Para Entretenimiento Digital": ["06/07/2026"],
  "Soluciones De Inteligencia Artificial Para Negocios Y Servicios": ["06/07/2026"],
  "Tecnología Educativa": ["06/07/2026", "03/08/2026", "31/08/2026", "28/09/2026", "26/10/2026", "23/11/2026", "04/01/2027", "01/02/2027", "01/03/2027"],
  "Tecnología Para La Gestión Pública Y Gobierno Digital": ["06/07/2026"],
  "Tecnologías Interactivas Y Experiencia E Interfaz De Usuario": ["06/07/2026"],
  "Tecnologías Interactivas Y Virtuales": ["06/07/2026"],
  "Transformación Digital Empresarial": ["06/07/2026"],
  "Transformación Digital Organizacional": ["31/08/2026"],
  "Urbanismo": ["31/08/2026"],
  "Valuación Inmobiliaria": ["06/07/2026"],
  "Ética Y Gobernanza De La Inteligencia Artificial": ["06/07/2026"]
};

export const INICIO_DATES: Record<string, string[]> = {
  "lic": ["22/06/2026", "29/06/2026", "06/07/2026", "20/07/2026", "27/07/2026", "03/08/2026", "17/08/2026", "31/08/2026", "14/09/2026", "28/09/2026", "12/10/2026", "26/10/2026", "09/11/2026", "23/11/2026", "07/12/2026"],
  "mae": ["08/06/2026", "06/07/2026", "13/07/2026", "03/08/2026", "31/08/2026", "28/09/2026", "26/10/2026", "23/11/2026"],
  "ms": ["06/07/2026", "03/08/2026", "31/08/2026", "28/09/2026", "26/10/2026", "23/11/2026"],
  "doc": ["06/07/2026", "03/08/2026", "31/08/2026", "28/09/2026", "26/10/2026", "23/11/2026"],
  "dip": ["29/06/2026", "27/07/2026"]
};

export const LISTA_MAP: Record<string, number> = {
  'P2.LI.INT.': 7240, 'P5.LI.INT.': 7240, 'P8.LI.INT.': 7240, 'P14.LI.INT.': 7240, 'P11.LI.INT.': 7240,
  'P3.LI.INT.': 7240, 'P6.LI.INT.': 7240, 'P9.LI.INT.': 7240, 'P15.LI.INT.': 7240, 'P12.LI.INT.': 7240,
  'P4.LI.INT.': 7240, 'P7.LI.INT.': 7240, 'P10.LI.INT.': 7240, 'P16.LI.INT.': 7240, 'P13.LI.INT.': 7240,
  'P7.NOR.LI.INT.': 7240, 'P7.SUR.LI.INT.': 7240,
  'P6.MA.': 7610, 'P8.MA.': 7610, 'P10.MA.': 7610, 'P12.MA.': 7610,
  'P7.MA.': 7610, 'P9.MA.': 7610, 'P11.MA.': 7610, 'P13.MA.': 7610, 'P1.MA.': 7610,
  'P14.DO.4.10.26': 7720, 'P10.DO.4.10.26': 7720, 'P6.DO.4.10.26': 7720, 'P12.DO.4.10.26': 7720,
  'P15.DO.4.10.26': 7720, 'P11.DO.4.10.26': 7720, 'P7.DO.4.10.26': 7720, 'P13.DO.4.10.26': 7720,
  'P7.MS.': 7610, 'P9.MS.': 7610, 'P11.MS.': 7610, 'P13.MS.': 7610,
  'P8.MS.': 7610, 'P10.MS.': 7610, 'P12.MS.': 7610, 'P14.MS.': 7610,
  'ESC1.LIC.UNICA.VOXY.': 3200, 'ESC2.LIC.UNICA.VOXY.': 3200, 'LIC.UNICA.VOXY.': 3200,
  'HS24.LIC.UVE.VOXY.': 4820, 'BF24.LIC.UVE.VOXY.': 4820,
  'LIC.BACH.UVE': 2450,
  'MA.UNAG.BASICO.2.15.21': 4190, 'DO.UNAG.BASICO.2.15.21': 6620
};

export const MERCADO_UNICO_PROGS = [
  'INTELIGENCIA ARTIFICIAL APLICADA A NEGOCIOS, INDUSTRIA Y AUTOMATIZACIÓN',
  'ÉTICA Y GOBERNANZA DE LA INTELIGENCIA ARTIFICIAL',
  'EDUCACIÓN PARA LA SUSTENTABILIDAD'
];

export const HIB_ESC_MAP: Record<string, string> = {
  'P2.LI.INT.': 'P61.INT2M', 'P5.LI.INT.': 'P61.INT2M', 'P8.LI.INT.': 'P61.INT2M',
  'P3.LI.INT.': 'P61.INT2M', 'P6.LI.INT.': 'P61.INT2M', 'P9.LI.INT.': 'P61.INT2M',
  'P4.LI.INT.': 'P61.INT2M', 'P7.LI.INT.': 'P61.INT2M', 'P10.LI.INT.': 'P61.INT2M',
  'P14.LI.INT.': 'P67.INT2M', 'P15.LI.INT.': 'P67.INT2M', 'P16.LI.INT.': 'P67.INT2M',
  'P11.LI.INT.': 'P65.INT2M', 'P12.LI.INT.': 'P65.INT2M', 'P13.LI.INT.': 'P65.INT2M',
  // MAE híbrida esc
  'P6.MA.': 'P5.MAE2M', 'P8.MA.': 'P5.MAE2M', 'P10.MA.': 'P5.MAE2M', 'P12.MA.': 'P5.MAE2M',
  'P7.MA.': 'P5.MAE2M', 'P9.MA.': 'P5.MAE2M', 'P11.MA.': 'P5.MAE2M', 'P13.MA.': 'P5.MAE2M'
};

export const HIB_PKG_MAP: Record<string, string> = {
  'P10.MA.': 'P7.MAE2M',
  'P11.MA.': 'P7.MAE2M'
};

export interface EjePkgMapEntry {
  pkg: string;
  esc: string;
}

export const EJE_PKG_MAP: Record<string, EjePkgMapEntry> = {
  'P2.LI.INT.': { 'pkg': 'P2.LIEJE.INT.', 'esc': 'P14.INT2M' },
  'P5.LI.INT.': { 'pkg': 'P5.LIEJE.INT.', 'esc': 'P14.INT2M' },
  'P8.LI.INT.': { 'pkg': 'P8.LIEJE.INT.', 'esc': 'P14.INT2M' },
  'P14.LI.INT.': { 'pkg': 'P11.LIEJE.INT.', 'esc': '' },
  'P11.LI.INT.': { 'pkg': 'P11.LIEJE.INT.', 'esc': '' },
  'P3.LI.INT.': { 'pkg': 'P3.LIEJE.INT.', 'esc': 'P14.INT2M' },
  'P6.LI.INT.': { 'pkg': 'P6.LIEJE.INT.', 'esc': 'P14.INT2M' },
  'P9.LI.INT.': { 'pkg': 'P9.LIEJE.INT.', 'esc': 'P14.INT2M' },
  'P15.LI.INT.': { 'pkg': 'P12.LIEJE.INT.', 'esc': '' },
  'P12.LI.INT.': { 'pkg': 'P12.LIEJE.INT.', 'esc': '' },
  'P4.LI.INT.': { 'pkg': 'P4.LIEJE.INT.', 'esc': 'P14.INT2M' },
  'P7.LI.INT.': { 'pkg': 'P7.LIEJE.INT.', 'esc': 'P14.INT2M' },
  'P10.LI.INT.': { 'pkg': 'P10.LIEJE.INT.', 'esc': 'P14.INT2M' },
  'P16.LI.INT.': { 'pkg': 'P13.LIEJE.INT.', 'esc': '' },
  'P13.LI.INT.': { 'pkg': 'P13.LIEJE.INT.', 'esc': '' },
  'P6.MA.': { 'pkg': 'P5.MAEJE.', 'esc': 'P14.MAE2M' },
  'P8.MA.': { 'pkg': 'P7.MAEJE.', 'esc': 'P14.MAE2M' },
  'P10.MA.': { 'pkg': 'P9.MAEJE.', 'esc': 'P14.MAE2M' },
  'P12.MA.': { 'pkg': 'P11.MAEJE.', 'esc': 'P14.MAE2M' },
  'P7.MA.': { 'pkg': 'P6.MAEJE.', 'esc': 'P14.MAE2M' },
  'P9.MA.': { 'pkg': 'P8.MAEJE.', 'esc': 'P14.MAE2M' },
  'P11.MA.': { 'pkg': 'P10.MAEJE.', 'esc': 'P14.MAE2M' },
  'P13.MA.': { 'pkg': 'P12.MAEJE.', 'esc': 'P14.MAE2M' }
};

export const EN_PROGS: Record<string, string[]> = {
  lic: [
    'Ingeniería Industrial', 'Ingeniería en Sistemas Computacionales', 'Ingeniería Industrial y Administración',
    'Administración', 'Mercadotecnia', 'Administración de Negocios', 'Administración de Recursos Humanos',
    'Administración de Tecnologías de Información', 'Administración de Ventas', 'Administración y Finanzas',
    'Contaduría Pública', 'Contaduría y Finanzas', 'Negocios Internacionales', 'Pedagogía',
    'Psicología Organizacional', 'Derecho', 'Comunicación', 'Comunicación Digital',
    'Ciencias Políticas y Administración Pública', 'Criminología y Criminalística',
    'Desarrollo Sustentable y Ecoturismo', 'Derecho Empresarial', 'Comunicación Organizacional',
    'Inteligencia Artificial Aplicada a Negocios, Industria y Automatización', 'Ética y Gobernanza de la Inteligencia Artificial',
    'Ciberseguridad y Riesgos en Inteligencia Artificial', 'Innovación y Emprendimiento con Inteligencia Artificial',
    'Inteligencia Artificial y Ciencia de Datos', 'Inteligencia Artificial en Educación',
    'Licenciatura en Ingeniería en Ciencia de Datos e Inteligencia Analítica', 'Ingeniería en Programación en la Nube',
    'Software para Entretenimiento Digital', 'Ingeniería en Sistemas Inteligentes',
    'Finanzas y Banca', 'Innovación y Transformación de Negocios', 'Finanzas y Estrategia Fiscal',
    'Estrategia y Transformación de Negocios', 'Ingeniería en Tecnología de Videojuegos y Realidad Virtual',
    'Comercio Electrónico y Negocios Digitales', 'Tecnologías Interactivas y Virtuales',
    'Ingeniería Ambiental', 'Educación para la Sustentabilidad'
  ],
  mae: [
    'Maestría en Administración de Negocios', 'Maestría en Coaching Integral y Organizacional',
    'Maestría en Gestión Organizacional Positiva', 'Maestría en Mercadotecnia Digital y Comercio Electrónico',
    'Maestría en Administración de Recursos Humanos', 'Maestría en Administración de Instituciones Educativas',
    'Maestría en Administración de Tecnologías de la Información', 'Maestría en Dirección de Ventas',
    'Maestría en Gestión Estratégica del Capital Humano', 'Maestría en Educación y Docencia',
    'Maestría en Derecho Procesal y Juicios Orales', 'Maestría en Mindfulness (Conciencia Plena Aplicada)',
    'Maestría en Ingeniería y Tecnología Ambiental', 'Maestría en Ciencia de Datos para Negocios',
    'Maestría en Dirección de Proyectos de Innovación', 'Maestría en Dirección e Ingeniería de Software',
    'Maestría en Gestión Directiva de Instituciones en Salud'
  ],
  ms: [
    'Administración De Negocios Deportivos', 'Administración En Mercadotecnia Estratégica',
    'Administración Pública', 'Comercio Internacional',
    'Derecho Procesal Constitucional (Modalidad Ejecutiva)', 'Derecho Procesal Penal',
    'Dirección De Empresas Turísticas', 'Dirección De Negocios De Alimentos Y Bebidas',
    'Dirección De Proyectos De Innovación', 'Finanzas', 'Tecnología Educativa'
  ]
};

export const DIP_PRICES: Record<string, any> = {
  '6m': {
    esc1: { pkg: 'ESC7.DIP.6.10.25', p: [699, 1699, 2400, 2400, 2400, 2400], total: 11998 },
    esc2: { pkg: 'ESC7.DIP.6.10.25', p: [699, 1699, 2400, 2400, 2400, 2400], total: 11998 }
  },
  '8m': {
    esc1: { pkg: 'ESC1.DIP.8.10.25', p: [1000, 1000, 2100, 2100, 2100, 2100, 2100, 2100], total: 14600 },
    esc2: { pkg: 'ESC3.DIP.8.10.25', p: [699, 1199, 1999, 1999, 1999, 1999, 1999, 1999], total: 13892 }
  }
};

/**
 * Normalized comparison helper
 */
function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Automap areas and value levels for newly synced GDrive programs
 */
function detectAreaAndVal(name: string): { a: string, v: string } {
  const norm = name.toLowerCase();
  
  let a = "Ingeniería y Tecnología";
  let v = "medio";

  if (norm.includes("derecho") || norm.includes("justicia") || norm.includes("criminolog")) {
    a = "Derecho y Justicia Digital";
    v = "alto";
  } else if (norm.includes("administr") || norm.includes("negocio") || norm.includes("ventas") || norm.includes("comercio") || norm.includes("emprendi")) {
    a = "Negocios, Innovación y Liderazgo";
    v = "medio";
  } else if (norm.includes("recurso") || norm.includes("capital") || norm.includes("organizacio")) {
    a = "Capital Humano y Transformación Organizacional";
    v = "bajo";
  } else if (norm.includes("finanza") || norm.includes("contad") || norm.includes("econom")) {
    a = "Finanzas y Economía";
    v = "medio";
  } else if (norm.includes("psicolog") || norm.includes("salud") || norm.includes("mindful") || norm.includes("conciencia")) {
    a = "Ciencias de la Salud";
    v = "medio";
  } else if (norm.includes("pedagog") || norm.includes("educa") || norm.includes("docen")) {
    a = "Ciencias Sociales y Humanidades";
    v = "bajo";
  } else if (norm.includes("comunicac") || norm.includes("disen") || norm.includes("videojuego")) {
    a = "Diseño y Comunicación";
    v = "medio";
  } else if (norm.includes("sistemas") || norm.includes("compu") || norm.includes("ciberseguridad") || norm.includes("datos") || norm.includes("artificial") || norm.includes("tecno") || norm.includes("predict")) {
    a = "Ingeniería y Tecnología";
    v = "alto";
  }

  return { a, v };
}

// FASE 6 - INTERFAZ / DINAMISMO DERECHO
// Dynamic catalog merging to auto-inject synced careers from oferta_educativa.json on startup!
try {
  const staticLic = CATALOG["LICENCIATURA"] || [];
  const dynamicLic = (ofertaEducativa as any)["Licenciaturas y Bachillerato"] || [];
  dynamicLic.forEach((item: any) => {
    const targetNorm = normalizeText(item.nombre);
    const exists = staticLic.some((st: any) => normalizeText(st.p) === targetNorm);
    if (!exists) {
      const info = detectAreaAndVal(item.nombre);
      staticLic.push({
        p: item.nombre,
        v: info.v,
        a: info.a,
        eje: 1,
        hib: 1,
        jov: 1,
        ucamp: 1
      });
    }
  });

  const staticMae = CATALOG["MAESTRÍA"] || [];
  const dynamicMae = (ofertaEducativa as any)["Maestrías"] || [];
  dynamicMae.forEach((item: any) => {
    const prefixedName = `Maestría en ${item.nombre}`;
    const targetNorm = normalizeText(prefixedName);
    const exists = staticMae.some((st: any) => normalizeText(st.p) === targetNorm);
    if (!exists) {
      const info = detectAreaAndVal(item.nombre);
      staticMae.push({
        p: prefixedName,
        v: info.v,
        a: info.a,
        eje: 1,
        hib: 1,
        jov: 1,
        ucamp: 1
      });
    }
  });

  const staticMaeInt = CATALOG["MASTER"] || [];
  const dynamicMaeInt = (ofertaEducativa as any)["Máster Internacionales"] || [];
  dynamicMaeInt.forEach((item: any) => {
    const targetNorm = normalizeText(item.nombre);
    const exists = staticMaeInt.some((st: any) => normalizeText(st.p) === targetNorm);
    if (!exists) {
      const info = detectAreaAndVal(item.nombre);
      staticMaeInt.push({
        p: item.nombre,
        v: info.v,
        a: info.a,
        eje: 1,
        hib: 1,
        jov: 1,
        ucamp: 1
      });
    }
  });

  const staticDoc = CATALOG["DOCTORADO"] || [];
  const dynamicDoc = (ofertaEducativa as any)["Doctorados"] || [];
  dynamicDoc.forEach((item: any) => {
    const prefixedName = `Doctorado en ${item.nombre}`;
    const targetNorm = normalizeText(prefixedName);
    const exists = staticDoc.some((st: any) => normalizeText(st.p) === targetNorm);
    if (!exists) {
      const info = detectAreaAndVal(item.nombre);
      staticDoc.push({
        p: prefixedName,
        v: info.v,
        a: info.a,
        eje: 1,
        hib: 1,
        jov: 1,
        ucamp: 1
      });
    }
  });
} catch (mergeErr) {
  console.error("Error merging dynamic catalog:", mergeErr);
}

/**
 * FASE 5 - CONECTAR DESCARGAS
 * Automatically retrieves folder download path for a given level and carrera name from oferta_educativa.json
 */
export function descargarPrograma(nivel: string, carrera: string): string | null {
  if (!carrera) return null;
  const normalizedLevel = nivel.toLowerCase();
  
  // Map level to keys
  let primaryKeys: string[] = [];
  if (normalizedLevel.includes("lic")) {
    primaryKeys = ["Licenciaturas y Bachillerato"];
  } else if (normalizedLevel.includes("mae") || normalizedLevel.includes("maestria")) {
    primaryKeys = ["Maestrías"];
  } else if (normalizedLevel.includes("mas") || normalizedLevel.includes("master")) {
    primaryKeys = ["Máster Internacionales", "Maestrías"];
  } else if (normalizedLevel.includes("doc") || normalizedLevel.includes("doctorado")) {
    primaryKeys = ["Doctorados"];
  } else {
    primaryKeys = ["Licenciaturas y Bachillerato", "Maestrías", "Máster Internacionales", "Doctorados"];
  }

  const allKeys = ["Licenciaturas y Bachillerato", "Maestrías", "Máster Internacionales", "Doctorados"];
  const searchSequence = [...primaryKeys, ...allKeys.filter((k) => !primaryKeys.includes(k))];

  const targetNorm = normalizeText(carrera);
  
  // Helper to remove prefixes for robust matching
  const cleanAcademicText = (txt: string) => {
    return normalizeText(txt)
      .replace(/^(licenciaturaen|licenciatura|maestriaen|maestria|masterinternacionalen|masteren|master|doctoradoen|doctorado|bachilleratogeneral|bachillerato)/g, "")
      .trim();
  };

  const targetClean = cleanAcademicText(carrera);

  try {
    for (const key of searchSequence) {
      const list = (ofertaEducativa as any)[key] || [];
      
      // 1. Exact match (normalized)
      const exactMatch = list.find((item: any) => normalizeText(item.nombre) === targetNorm);
      if (exactMatch) return exactMatch.url;

      // 2. Cleaned academic text match
      if (targetClean.length > 2) {
        const cleanMatch = list.find((item: any) => cleanAcademicText(item.nombre) === targetClean);
        if (cleanMatch) return cleanMatch.url;
      }

      // 3. Substring match
      const containsMatch = list.find((item: any) => {
        const itemNorm = normalizeText(item.nombre);
        const itemClean = cleanAcademicText(item.nombre);
        return itemNorm.includes(targetNorm) || itemClean.includes(targetClean);
      });
      if (containsMatch) return containsMatch.url;

      // 4. Reverse substring match
      const reverseContainsMatch = list.find((item: any) => {
        const itemNorm = normalizeText(item.nombre);
        const itemClean = cleanAcademicText(item.nombre);
        return targetNorm.includes(itemNorm) || (itemClean.length > 2 && targetClean.includes(itemClean));
      });
      if (reverseContainsMatch) return reverseContainsMatch.url;
    }
  } catch (err) {
    console.error("Error looking up pdf in descargarPrograma:", err);
  }
  return null;
}

/**
 * Opciones de Diplomados (6 y 8 meses)
 */
export function getDipOptions() {
  return [
    // 6 meses
    { value: "Actualización en Gineco-obstetricia para el primer y segundo nivel de atención", dur: "6m" },
    { value: "Actualización en urgencias", dur: "6m" },
    { value: "Administración de los servicios de salud", dur: "6m" },
    { value: "Administración de proyectos", dur: "6m" },
    { value: "Administración financiera", dur: "6m" },
    { value: "Atención del adulto mayor", dur: "6m" },
    { value: "Coaching organizacional", dur: "6m" },
    { value: "Desarrollo e-learning", dur: "6m" },
    { value: "Dirección de operaciones", dur: "6m" },
    { value: "Diversidad y equidad de género", dur: "6m" },
    { value: "Educación en ciencias de la salud", dur: "6m" },
    { value: "Estrategia e innovacción de negocios", dur: "6m" },
    { value: "Gestión Sostenible de la Cadena de Suministro", dur: "6m" },
    { value: "Gestión curricular en educación a distancia", dur: "6m" },
    { value: "Gestión y eficiencia de sistemas energéticos", dur: "6m" },
    { value: "Mindfulness para los individuos y familias", dur: "6m" },
    { value: "Nutrición especial en enfermedades metabólicas", dur: "6m" },
    { value: "Pensamiento crítico e innovación", dur: "6m" },
    { value: "Principios en el Arte Digital y Animación", dur: "6m" },
    { value: "Project management", dur: "6m" },
    { value: "Pruebas Psicológicas para Adultos", dur: "6m" },
    { value: "Rehabilitación del adulto mayor", dur: "6m" },
    { value: "Soft skills y habilidades gerenciales", dur: "6m" },
    { value: "Tanatología", dur: "6m" },
    { value: "Transición y energía sostenible", dur: "6m" },
    // 8 meses
    { value: "Animación Digital y Creación de Contenidos", dur: "8m" },
    { value: "Análisis Económico Integral", dur: "8m" },
    { value: "Ciencia de datos e inteligencia artificial", dur: "8m" },
    { value: "Contabilidad y Gestión financiera", dur: "8m" },
    { value: "Creatividad visual y comunicación digital", dur: "8m" },
    { value: "Desarrollo de Medios Interactivos", dur: "8m" },
    { value: "Diseño y Desarrollo de Software", dur: "8m" },
    { value: "Diseño y Evaluación en Entornos Digitales", dur: "8m" },
    { value: "Estrategias y Operaciones de Transporte", dur: "8m" },
    { value: "Fuentes y tecnologías de energías renovables", dur: "8m" },
    { value: "Gestión de Calidad y Mantenimiento de Software", dur: "8m" },
    { value: "Gestión de Experiencias de Aprendizaje en Ambientes Virtuales", dur: "8m" },
    { value: "Inteligencia artificial aplicada", dur: "8m" },
    { value: "Métodos Cuantitativos para la Toma de Decisiones", dur: "8m" },
    { value: "Programación y Tecnologías de Redes", dur: "8m" },
    { value: "Tecnologías de la Información Aplicadas a la Logística y el Transporte", dur: "8m" }
  ];
}

/**
 * Returns the absolute URL pathway to the PDF prospectus
 * based on the provided program name and optional academic level.
 */
export function getPdfPath(programName: string | null | undefined, academicLevel?: string): string | null {
  if (!programName) return null;
  const clean = programName.trim();
  if (!clean) return null;

  // Try dynamic lookup via descargarPrograma first!
  const dynamicPath = descargarPrograma(academicLevel || 'lic', clean);
  if (dynamicPath) {
    return dynamicPath;
  }

  // Backup and backward compatibility search parameters fallback
  let subDir = 'IAN';
  if (academicLevel) {
      const lvl = academicLevel.toLowerCase();
      if (lvl.includes('lic')) subDir = 'licenciatura';
      else if (lvl.includes('mae')) subDir = 'maestria';
      else if (lvl.includes('doc')) subDir = 'doctorado';
      else if (lvl.includes('ms')) subDir = 'master';
      else if (lvl.includes('dip')) subDir = 'diplomado';
  }

  // Returns original filename format if absolutely not found in JSON
  const filename = `${clean.replace(/\s+/g, '_')}.pdf`;
  return `/pdfs/${subDir}/${filename}`;
}

