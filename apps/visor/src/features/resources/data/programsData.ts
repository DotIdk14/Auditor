import type { DegreeProgram, DegreeLevel, AreaId } from '../types';

type ProgLevel = DegreeProgram['level'];

const AREA_RULES: [RegExp, AreaId][] = [
  // Ambiente — check before ingenieria (e.g. "Ingeniería Ambiental")
  [/Desarrollo Sustentable|Sustentabilidad|Ambiental|Ecoturismo|Energías Renovables|Responsabilidad Social|Ambientales|Sostenible/i, 'ambiente'],
  // Turismo
  [/Turismo|Gastronom|Hotelera|Alimentos|Bebidas|Eventos Corp|Hospitalidad/i, 'turismo'],
  // Salud
  [/Psicología/i, 'salud'],
  // Ingeniería y Tecnología
  [/Ingeniería|Software|Sistemas Computacionales|Ciberseguridad|Inteligencia Artificial|Ciencia de Datos|Robótica|Automatización|Telecomunicaciones|Infraestructura|Cómputo|Nube|Programación|Logística|Transporte|Calidad y Procesos|Riesgos Tecnol|Digital Organizacional|Digital \- Utel|Transformación Digital/i, 'ingenieria'],
  // Finanzas
  [/Finanzas|Contaduría|Impuestos|Auditoría|Economía|Riesgos Financieros|Inversión|Fiscal/i, 'finanzas'],
  // Educación y Humanidades
  [/Educación|Pedagogía|Docencia|Educativa|Lenguas|Literatura|Historia Pública|Antropología|Estudios Socioculturales|Estudios Interculturales|Diversidad Humana|Estudios Interdisciplinarios|Lengua y Literatura/i, 'educacion'],
  // Ciencias Sociales y Derecho
  [/Derecho|Criminología|Criminalística|Ciencias Políticas|Administración Pública|Políticas Públicas|Gobierno|Seguridad Pública|Justicia|Gobernanza|Análisis Político|Participación Ciudadana|Políticas Sociales|Políticas y Gobierno/i, 'sociales'],
  // Marketing y Comunicación
  [/Mercadotecnia|Marketing|Publicidad|Comunicación|Redes Sociales|Periodismo|Medios Digitales(?![^,]*Lic)|Cultura Digital/i, 'marketing'],
  // Arte y Diseño
  [/Arte|Diseño|Multimedia|Videojuegos|Animación|Arquitectura|Entretenimiento Digital|Tecnologías Interactivas|UX|UI/i, 'arte'],
  // Negocios (catch-all for business-related)
  [/Administración|Negocios|Empresarial|Recursos Humanos|Capital Humano|Coaching|Ventas|MBA|Dirección|Consultoría|Emprendimiento|Comercialización|Mercadotecnia Digital|Gestión Estratégica|Gestión Organizacional|Gestión del Cambio|Gestión del Talento|Alta Dirección|Proyectos de Innovación|Asesoría|Modelos de Negocio|Comercio Internacional|Cultura y Transformación|Gestión Directiva|Instituciones en Salud/i, 'negocios'],
];

function categorize(name: string): AreaId {
  for (const [regex, area] of AREA_RULES) {
    if (regex.test(name)) return area;
  }
  return 'negocios';
}

const MODALITIES = {
  completa: '3 años 8 meses',
  intensiva: '2 años 10 meses',
  superintensiva: '2 años 2 meses',
};

const ALIANZAS = new Set([
  'Licenciatura en Psicología',
  'Licenciatura en Desarrollo Humano',
  'Licenciatura en Medios Digitales',
  'Licenciatura en Arte Digital y Multimedia',
  'Licenciatura en Marketing y Publicidad',
  'Licenciatura en Comunicación Organizacional',
]);

function prog(name: string, level: ProgLevel, studyPlan: string, duration?: string): DegreeProgram {
  const isAlianza = ALIANZAS.has(name);
  const defaultModality = isAlianza ? 'completa' : 'intensiva';
  const modalities = [
    { label: 'Completa', duration: MODALITIES.completa },
    { label: 'Intensiva', duration: MODALITIES.intensiva },
    { label: 'Superintensiva', duration: MODALITIES.superintensiva },
  ];
  return {
    id: genId(name, level),
    name,
    level,
    area: categorize(name),
    description: '',
    duration: duration || MODALITIES[defaultModality],
    modalities,
    imageUrl: '',
    studyPlan,
    costs: '',
    requirements: '',
    benefits: '',
    resources: [],
  };
}

function genId(name: string, level: string): string {
  return level + '_' + name.toLowerCase()
    .replace(/[^a-z0-9áéíóúñü]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

const licenciaturas: DegreeProgram[] = [
  prog(`Ingeniería en Sistemas Computacionales`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Lic_Sistemas_Computacionales_d9a24615f1.pdf`),
  prog(`Ingeniería Industrial`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Lic_ingenieria_Industrial_1_compressed_24bfe80601.pdf`),
  prog(`Ingeniería Industrial y Administración`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Lic_Ing_Industrialy_Admin_65755e07ed.pdf`),
  prog(`Ingeniería en Desarrollo de Software`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Lic_Ingenieria_Desarrollo_De_Software_8ad3d28d93.pdf`),
  prog(`Ingeniería en Energías Renovables`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Lic_Ingenieria_Energias_Renovables_c82ce0efdf.pdf`),
  prog(`Ingeniería en Logística y Transporte`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Lic_Ingenieria_Logistica_Transporte_67546df959.pdf`),
  prog(`Inteligencia Artificial`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Lic_Inteligencia_Artificial_dfe7f635b1.pdf`),
  prog(`Seguridad Informática`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Lic_Seguridad_Informatica_0068610e3e.pdf`),
  prog(`Licenciatura en Tecnologías Interactivas y Experiencia eInterfaz de Usuario`, 'licenciatura', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Licenciatura_en__Tecnolog%C3%ADas_Interactivas_y_Experiencia_e_Interfaz_de_Usuario_Nuevos_Programas_Bloque_2_1779921112517_928475.pdf`),
  prog(`Licenciatura en Software para Entretenimiento Digital`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Universidad_Editorial_Mx_Licenciatura_Software_Para_Entretenimiento_Digital_FT_40834e1ab2.pdf`),
  prog(`Licenciatura en Ciberseguridad y Riesgos en Inteligencia Artificial`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Universidad_Editorial_Mx_Licenciatura_Ciberseguridady_Riesgos_En_Inteligencia_Artificial_FT_774ae9f9e9.pdf`),
  prog(`Licenciatura en Ingeniería Ambiental`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Universidad_Editorial_Mx_Licenciatura_Ingenieria_Ambiental_FT_afda2bd77b.pdf`),
  prog(`Licenciatura en Inteligencia Artificial y Ciencia de Datos`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Universidad_Editorial_Mx_Licenciatura_Inteligencia_Artificialy_Cienciade_Datos_FT_d92b253666.pdf`),
  prog(`Licenciatura en Ética y Gobernanza de la Inteligencia Artificial`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Universidad_Editorial_Mx_Licenciatura_Eticay_Gobernanzadela_Inteligencia_Artificial_FT_d6579329a5.pdf`),
  prog(`Licenciatura en Innovación y Emprendimiento con Inteligencia Artificial`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Universidad_Editorial_Mx_Licenciatura_Innovaciony_Emprendimientocon_Inteligencia_Artificial_FT_2e762d2e71.pdf`),
  prog(`Licenciatura en Inteligencia Artificial Aplicada a Negocios, Industria y Automatización`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Universidad_Editorial_Mx_Licenciatura_Inteligencia_Artificial_Aplicadaa_Negocios_Industriay_Automatizacion_FT_0525deb805.pdf`),
  prog(`Licenciatura en Ingeniería en Ciencia de Datos e Inteligencia Analítica`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Universidad_Editorial_Mx_Licenciatura_Ingenieria_Cienciade_Datose_Inteligencia_Analitica_FT_f681b50180.pdf`),
  prog(`Licenciatura en Ingeniería en Tecnología de Videojuegos y Realidad Virtual`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Universidad_Editorial_Mx_Licenciatura_Ingenieria_Tecnologiade_Videojuegosy_Realidad_Virtual_FT_f10bf5a66e.pdf`),
  prog(`Licenciatura en Ingeniería Robótica`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Universidad_Editorial_Mx_Licenciatura_Ingenieria_Robotica_FT_3a52cfcd75.pdf`),
  prog(`Licenciatura en Ingeniería en Programación en la Nube`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Universidad_Editorial_Mx_Licenciatura_Ingenieria_Programacionenla_Nube_FT_5683d364ce.pdf`),
  prog(`Licenciatura en Ingeniería en Sistemas Inteligentes`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Universidad_Editorial_Mx_Licenciatura_Ingenieria_Sistemas_Inteligentes_FT_1a60cbeb8d.pdf`),
  prog(`Licenciatura en Diseño y Producción de Videojuegos`, 'licenciatura', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Licenciatura_en__Dise%C3%B1o_y_Producci%C3%B3n_de_Videojuegos_Nuevos_Programas_Bloque_2_1779202973030_333315.pdf`),
  prog(`Licenciatura en Tecnologías Interactivas y Experiencia e Interfaz de Usuario`, 'licenciatura', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Licenciatura_en__Tecnolog%C3%ADas_Interactivas_y_Experiencia_e_Interfaz_de_Usuario_Nuevos_Programas_Bloque_2_1779202954593_132830.pdf`),
  prog(`Licenciatura en Ingeniería en Automatización Industrial`, 'licenciatura', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Licenciatura_en__Ingenier%C3%ADa_en_Automatizaci%C3%B3n_Industrial_Nuevos_Programas_Bloque_2_1779202875180_598576.pdf`),
  prog(`Licenciatura en Medios Digitales`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Lic_Medios_Digitales_eeb2e7e6f4.pdf`),
  prog(`Licenciatura en Marketing y Publicidad`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Lic_Marketingy_Publicidad_c9f53d21bd.pdf`),
  prog(`Licenciatura en Contaduría Pública`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Lic_Contaduria_Publica_fe1486cbdb.pdf`),
  prog(`Licenciatura en Administración`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Lic_Administracion_457cde47fb.pdf`),
  prog(`Licenciatura en Administración de Empresas Turísticas`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Lic_Administracionde_Empresas_Turisticas_273dfd42c9.pdf`),
  prog(`Licenciatura en Administración de Tecnologías de Información`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Lic_Admin_Tec_DE_Info_1edaf645f8.pdf`),
  prog(`Licenciatura en Administración de Recursos Humanos`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Lic_Admin_RRHH_27ccf0858f.pdf`),
  prog(`Licenciatura en Administración de Negocios`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Lic_Admin_Negocios_e1b22e92c9.pdf`),
  prog(`Licenciatura en Negocios Internacionales`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Lic_Negocios_Internacionales_df658a0d3f.pdf`),
  prog(`Licenciatura en Contaduría y Finanzas`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Lic_Contaduria_Finanzas_18fffec214.pdf`),
  prog(`Licenciatura en Mercadotecnia`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Lic_Mercadotecnia_5dd0a7dc87.pdf`),
  prog(`Licenciatura en Administración y Finanzas`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Lic_Administracion_2_80d370dee7.pdf`),
  prog(`Licenciatura en Administración de Ventas`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Lic_Admin_Ventas_ae72a3bb34.pdf`),
  prog(`Licenciatura en Economía y Finanzas`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Lic_Economia_Y_Finanzas_cdf7d1009d.pdf`),
  prog(`Licenciatura en Agronegocios`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Lic_Agronegocios_be27999612.pdf`),
  prog(`Licenciatura en Emprendimiento`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_MX_Fichas_Tecnicas_Prog_Eje_Lic_Emprendimiento_65d9364401.pdf`),
  prog(`Licenciatura en Finanzas y Estrategia Fiscal`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Universidad_Editorial_Mx_Licenciatura_Finanzasy_Estrategia_Fiscal_FT_7d185759a6.pdf`),
  prog(`Licenciatura en Innovación y Transformación de Negocios`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Universidad_Editorial_Mx_Licenciatura_Innovaciony_Transformacionde_Negocios_FT_cce777d6bf.pdf`),
  prog(`Licenciatura en Estrategia y Transformación de Negocios`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Universidad_Editorial_Mx_Licenciatura_Estrategiay_Transformacionde_Negocios_FT_5c19e393c1.pdf`),
  prog(`Licenciatura en Comercialización y Dirección de Marcas`, 'licenciatura', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Licenciatura_en__Comercializaci%C3%B3n_y_Direcci%C3%B3n_de_Marcas_Nuevos_Programas_Bloque_2_1779202963656_377975.pdf`),
  prog(`Licenciatura en Consultoría y Desarrollo Empresarial`, 'licenciatura', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Licenciatura_en__Consultor%C3%ADa_y_Desarrollo_Empresarial_Nuevos_Programas_Bloque_2_1779202945655_32159.pdf`),
  prog(`Licenciatura en Comercialización Turística y Mercados Digitales`, 'licenciatura', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Licenciatura_en__Comercializaci%C3%B3n_Tur%C3%ADstica_y_Mercados_Digitales_Nuevos_Programas_Bloque_2_1779202936491_969483.pdf`),
  prog(`Licenciatura en Comercio Internacional`, 'licenciatura', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Licenciatura_en__Comercio_Internacional_Nuevos_Programas_Bloque_2_1779202927023_294263.pdf`),
  prog(`Licenciatura en Publicidad y Medios`, 'licenciatura', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Licenciatura_en__Publicidad_y_Medios_Nuevos_Programas_Bloque_2_1779202917924_199009.pdf`),
  prog(`Licenciatura en Administración de Negocios Gastronómicos`, 'licenciatura', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Licenciatura_en__Administraci%C3%B3n_de_Negocios_Gastron%C3%B3micos_Nuevos_Programas_Bloque_2_1779202907968_591940.pdf`),
  prog(`Licenciatura en Gestión Empresarial y Logística`, 'licenciatura', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Licenciatura_en__Gesti%C3%B3n_Empresarial_y_Log%C3%ADstica_Nuevos_Programas_Bloque_3_1782419167652_100837.pdf`),
  prog(`Licenciatura en Administración Pública y Políticas Económicas`, 'licenciatura', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Licenciatura_en__Administraci%C3%B3n_P%C3%BAblica_y_Pol%C3%ADticas_Econ%C3%B3micas_Nuevos_Programas_Bloque_3_1782419100104_501540.pdf`),
  prog(`Licenciatura en Gastronomía Sustentable y Cultura Alimentaria`, 'licenciatura', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Licenciatura_en__Gastronom%C3%ADa_Sustentable_y_Cultura_Alimentaria_Nuevos_Programas_Bloque_3_1782419126884_264375.pdf`),
  prog(`Licenciatura en Dirección Hotelera y Experiencia del Cliente`, 'licenciatura', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Licenciatura_en__Direcci%C3%B3n_Hotelera_y_Experiencia_del_Cliente_Nuevos_Programas_Bloque_3_1782419011473_621422.pdf`),
  prog(`Licenciatura en Dirección de Operaciones Empresariales`, 'licenciatura', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Licenciatura_en__Direcci%C3%B3n_de_Operaciones_Empresariales_Nuevos_Programas_Bloque_3_1782419154946_491745.pdf`),
  prog(`Licenciatura en Desarrollo Sustentable y Ecoturismo`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Lic_Desarrollo_Sustentabley_Ecoturismo_a29d06337e.pdf`),
  prog(`Licenciatura en Pedagogía`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Lic_Pedagogia_fe576a9722.pdf`),
  prog(`Licenciatura en Tecnología Educativa`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Lic_en_Tecnologia_Educativa_793382b821.pdf`),
  prog(`Licenciatura en Educación para la Sustentabilidad`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Universidad_Editorial_Mx_Licenciatura_Educacion_Para_La_Sustentabilidad_FT_cbe92e220b.pdf`),
  prog(`Licenciatura en Inteligencia Artificial en Educación`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Universidad_Editorial_Mx_Licenciatura_Inteligencia_Artificialen_Educacion_FT_49f0aaee94.pdf`),
  prog(`Licenciatura en Gestión de Políticas y Gobierno`, 'licenciatura', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Licenciatura_en__Gesti%C3%B3n_de_Pol%C3%ADticas_y_Gobierno_Nuevos_Programas_Bloque_3_1782419030249_426689.pdf`),
  prog(`Licenciatura en Seguridad Pública y Gobernabilidad Democrática`, 'licenciatura', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Licenciatura_en__Seguridad_P%C3%BAblica_y_Gobernabilidad_Democr%C3%A1tica_Nuevos_Programas_Bloque_3_1782419074536_840072.pdf`),
  prog(`Licenciatura en Lenguas Extranjeras`, 'licenciatura', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Licenciatura_en__Lenguas_Extranjeras_Nuevos_Programas_Bloque_3_1782418972507_856712.pdf`),
  prog(`Licenciatura en Estudios Socioculturales`, 'licenciatura', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Licenciatura_en__Estudios_Socioculturales_Nuevos_Programas_Bloque_3_1782418987072_656434.pdf`),
  prog(`Licenciatura en Lengua y Literatura`, 'licenciatura', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Licenciatura_en__Lengua_y_Literatura_Nuevos_Programas_Bloque_3_1782419045161_986608.pdf`),
  prog(`Licenciatura en Antropología y Diversidad Cultural`, 'licenciatura', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Licenciatura_en__Antropolog%C3%ADa_y_Diversidad_Cultural_Nuevos_Programas_Bloque_3_1782419060460_938696.pdf`),
  prog(`Licenciatura en Arte Digital y Multimedia`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Lic_Arte_Digitaly_Multimedia_1d380e0d05.pdf`),
  prog(`Licenciatura en Comunicación Digital`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Lic_Comunicacion_Digital_98c68b7314.pdf`),
  prog(`Licenciatura en Comunicación`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Lic_Comunicacion_e69ee1618e.pdf`),
  prog(`Licenciatura en Comunicación Organizacional`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Lic_Comunicacion_Organizacional_c795c49f91.pdf`),
  prog(`Licenciatura en Dirección de Arte`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Lic_Direccion_De_Arte_d37575c530.pdf`),
  prog(`Licenciatura en Diseño y Animación Digital`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Lic_Diseno_Animacion_Digital_bfec925cfa.pdf`),
  prog(`Licenciatura en Arquitectura`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Universidad_Editorial_Mx_Licenciatura_Arquitectura_FT_d0afabe2dc.pdf`),
  prog(`Licenciatura en Comunicación y Manejo de Redes Sociales`, 'licenciatura', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Licenciatura_en__Comunicaci%C3%B3n_y_manejo_de_Redes_Sociales_Nuevos_Programas_Bloque_2_1779202897141_285024.pdf`),
  prog(`Licenciatura en Comunicación y Periodismo`, 'licenciatura', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Licenciatura_en__Comunicaci%C3%B3n_y_Periodismo_Nuevos_Programas_Bloque_2_1779202886839_172722.pdf`),
  prog(`Licenciatura en Criminología y Criminalística`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Lic_Criminologiay_Criminalistica_3248aeb79c.pdf`),
  prog(`Licenciatura en Derecho`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Lic_Derecho_8b884c2b4f.pdf`),
  prog(`Licenciatura en Derecho Internacional`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Lic_Derecho_Internacional_36b609aa99.pdf`),
  prog(`Licenciatura en Derecho Empresarial`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Lic_Derecho_Empresarial_ca1006342e.pdf`),
  prog(`Licenciatura en Ciencias Políticas y Administración Pública`, 'licenciatura', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Lic_Ciencias_Politicasy_Administracion_Publica_a4c8141bf7.pdf`),
  prog(`Licenciatura en Psicología`, 'licenciatura', ``),
  prog(`Licenciatura en Psicología Organizacional`, 'licenciatura', ``),
];

const maestrias: DegreeProgram[] = [
  prog(`Maestría en Ciencia de Datos para Negocios`, 'maestria', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Maestria_Ciencia_De_Datos_Para_Negocios_dc30e407fe.pdf`),
  prog(`Maestría en Ingeniería y Tecnología Ambiental`, 'maestria', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Maestria_Ingenieria_Tecnologia_Ambiental_84dc872bb1.pdf`),
  prog(`Maestría en Dirección e Ingeniería de Software`, 'maestria', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Maestria_Direccion_Ingenieria_De_Software_a015b5d785.pdf`),
  prog(`Maestría en Ciencias Computacionales y Telecomunicaciones`, 'maestria', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Maestria_Ciencias_Computacionales_Telecomunicaciones_32b90f3463.pdf`),
  prog(`Maestría en Ciberseguridad`, 'maestria', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Mae_Ciberseguridad_34606f7656.pdf`),
  prog(`Maestría en Innovación Estratégica con Inteligencia Artificial`, 'maestria', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Universidad_Editorial_Mx_Maestria_Innovacion_Estrategicacon_Inteligencia_Artificial_FT_e89aa6e054.pdf`),
  prog(`Maestría en Soluciones de Inteligencia Artificial para Negocios y Servicios`, 'maestria', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Universidad_Editorial_Mx_Maestria_Solucionesde_Inteligencia_Artificialpara_Negociosy_Servicios_FT_77eb8c43b9.pdf`),
  prog(`Maestría en Automatización y Robótica Industrial`, 'maestria', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Universidad_Editorial_Mx_Maestria_Automatizaciony_Robotica_Industrial_FT_a2b44cdc75.pdf`),
  prog(`Maestría en Arquitectura de Software`, 'maestria', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Universidad_Editorial_Mx_Maestria_Arquitecturade_Software_FT_9dc5562efa.pdf`),
  prog(`Maestría en Ingeniería de Datos e Infraestructura`, 'maestria', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Universidad_Editorial_Mx_Maestria_Ingenieriade_Datose_Infraestructura_FT_0515445840.pdf`),
  prog(`Maestría en Infraestructura y Cómputo en la Nube`, 'maestria', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Maestria_en__Infraestructura_y_C%C3%B3mputo_en_la_Nube_Nuevos_Programas_Bloque_2_1779211102468_280015.pdf`),
  prog(`Maestría en Interfaces Inteligentes y Tecnología Inmersiva`, 'maestria', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Maestria_en__Interfaces_Inteligentes_y_Tecnolog%C3%ADa_Inmersiva_Nuevos_Programas_Bloque_2_1779211091380_966430.pdf`),
  prog(`Maestría en Gestión de la Calidad y Procesos Industriales`, 'maestria', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Maestria_en__Gesti%C3%B3n_de_la_Calidad_y_Procesos_Industriales_Nuevos_Programas_Bloque_3_1782419292924_840486.pdf`),
  prog(`Maestría en Evaluación de Riesgos Tecnológicos y Resiliencia Operativa`, 'maestria', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Maestria_en__Evaluaci%C3%B3n_de_Riesgos_Tecnol%C3%B3gicos_y_Resiliencia_Operativa_Nuevos_Programas_Bloque_3_1782419422971_841657.pdf`),
  prog(`Maestría en Gestión de Riesgos Ambientales`, 'maestria', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Maestria_en__Gesti%C3%B3n_de_Riesgos_Ambientales_Nuevos_Programas_Bloque_3_1782419409915_380209.pdf`),
  prog(`MBA Internacional`, 'maestria', `https://cmsutel.s3.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Maestr_a_Administracion_De_Negocios_mar24_compressed_50f45c7fd0.pdf`),
  prog(`Maestría en Administración de Negocios Deportivos`, 'maestria', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Maestria_Administracion_De_Negocios_Deportivos_0bd8015017.pdf`),
  prog(`Maestría en Mercadotecnia Digital y Comercio Electrónico`, 'maestria', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Maestria_Mercadotecnia_Digital_Comercio_Electronico_e2b197d82e.pdf`),
  prog(`Maestría en Administración de Recursos Humanos`, 'maestria', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Maestria_Administracion_De_RRHH_bf0973a9a2.pdf`),
  prog(`Maestría en Administración de Tecnologías de la Información`, 'maestria', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Maestria_Administracion_De_Tecnologias_De_La_Info_80229e16c8.pdf`),
  prog(`Maestría en Dirección de Ventas`, 'maestria', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Maestria_Direccion_De_Ventas_fe9118a542.pdf`),
  prog(`Maestría en Administración en Mercadotecnia Estratégica`, 'maestria', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Maestria_Administracion_Mercadotecnia_Estrategica_d554867895.pdf`),
  prog(`Maestría en Administración Pública`, 'maestria', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Maestria_Administracion_Publica_50a4512507.pdf`),
  prog(`Maestría en Coaching Integral y Organizacional`, 'maestria', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Maestria_Coaching_Integral_Organizacional_4f95cce107.pdf`),
  prog(`Maestría en Comercio Internacional`, 'maestria', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Maestria_Comercio_Internacional_c174892a10.pdf`),
  prog(`Maestría en Gestión Estratégica del Capital Humano`, 'maestria', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Maestria_Gestion_Estrategica_Capital_Humano_b67d01cf38.pdf`),
  prog(`Maestría en Gestión Organizacional Positiva`, 'maestria', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Maestria_Gestion_Organizacional_Positiva_a1517450cc.pdf`),
  prog(`Maestría en Finanzas`, 'maestria', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Maestria_Finanzas_f720a26e9c.pdf`),
  prog(`Maestría en Impuestos`, 'maestria', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Mae_Impuestos_534f2d4aa5.pdf`),
  prog(`Maestría en Administración de Instituciones Educativas`, 'maestria', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Maestria_Administracion_De_Instituciones_Educativas_26622862dd.pdf`),
  prog(`Maestría en Alta Dirección y Gobierno Corporativo`, 'maestria', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Universidad_Editorial_Mx_Maestria_Alta_Direcciony_Gobierno_Corporativo_FT_d3a3d982f5.pdf`),
  prog(`Maestría en Dirección de Proyectos de Innovación`, 'maestria', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Maestria_Direccion_De_Proyectos_De_Innovacion_dc88094a6a.pdf`),
  prog(`Maestría en Gestión Directiva de Instituciones en Salud`, 'maestria', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Maestria_Gestion_Directivade_Institucionesde_Salud_c24e223693.pdf`),
  prog(`Maestría en Logística y Cadena de Suministro`, 'maestria', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Mae_Logistica_Cadena_Suministro_115bf52dfd.pdf`),
  prog(`Maestría en Asesoría Empresarial Estratégica`, 'maestria', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Maestria_en__Asesor%C3%ADa_Empresarial_Estrat%C3%A9gica_Nuevos_Programas_Bloque_2_1779211227285_74347.pdf`),
  prog(`Maestría en Inteligencia Financiera y Detección de Fraudes`, 'maestria', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Maestria_en__Inteligencia_Financiera_y_Detecci%C3%B3n_de_Fraudes_Nuevos_Programas_Bloque_2_1779211278648_50587.pdf`),
  prog(`Maestría en Administración de Riesgos Financieros`, 'maestria', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Maestria_en__Administraci%C3%B3n_de_Riesgos_Financieros_Nuevos_Programas_Bloque_2_1779211269491_379208.pdf`),
  prog(`Maestría en Innovación en Modelos de Negocio`, 'maestria', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Maestria_en__Innovaci%C3%B3n_en_Modelos_de_Negocio_Nuevos_Programas_Bloque_2_1779211259548_865861.pdf`),
  prog(`Maestría en Finanzas Sustentables y Proyectos de Inversión`, 'maestria', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Maestria_en__Finanzas_Sustentables_y_Proyectos_de_Inversi%C3%B3n_Nuevos_Programas_Bloque_2_1779211249408_34954.pdf`),
  prog(`Maestría en Economía Digital y Nuevas Formas de Mercado`, 'maestria', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Maestria_en__Econom%C3%ADa_Digital_y_Nuevas_Formas_de_Mercado_Nuevos_Programas_Bloque_2_1779211239556_567828.pdf`),
  prog(`Maestría en Auditoría Financiera`, 'maestria', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Maestria_en__Auditor%C3%ADa_Financiera_Nuevos_Programas_Bloque_2_1779211218540_123349.pdf`),
  prog(`Maestría en Finanzas Públicas y Gestión Gubernamental`, 'maestria', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Maestria_en__Finanzas_P%C3%BAblicas_y_Gesti%C3%B3n_Gubernamental_Nuevos_Programas_Bloque_2_1779211206697_190031.pdf`),
  prog(`Maestría en Economía Sustentable y Empresas Responsables`, 'maestria', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Maestria_en__Econom%C3%ADa_Sustentable_y_Empresas_Responsables_Nuevos_Programas_Bloque_2_1779211197475_763206.pdf`),
  prog(`Maestría en Estrategias de Comercio Internacional y Aduanas`, 'maestria', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Maestria_en__Estrategias_de_Comercio_Internacional_y_Aduanas_Nuevos_Programas_Bloque_2_1779211188560_852568.pdf`),
  prog(`Maestría en Cultura y Transformación Digital - Utel`, 'maestria', `https://utel.edu.mx/maestria-en-cultura-y-transformacion-digital?srsltid=AfmBOoq51lxt_aWPhVN7XK6mJvNHyIK42_0FpVMUEawNNbFnusYJPvQn`),
  prog(`Maestría en Gestión del Cambio y Transformación Organizacional`, 'maestria', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Maestria_en__Gesti%C3%B3n_del_Cambio_y_Transformaci%C3%B3n_Organizacional_Nuevos_Programas_Bloque_2_1779211140715_449263.pdf`),
  prog(`Maestría en Gestión del Talento y Bienestar Organizacional`, 'maestria', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Maestria_en__Gesti%C3%B3n_del_Talento_y_Bienestar_Organizacional_Nuevos_Programas_Bloque_2_1779211122551_558635.pdf`),
  prog(`Maestría en Tecnología para la Gestión Pública y Gobierno Digital`, 'maestria', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Maestria_en__Tecnolog%C3%ADa_para_la_Gesti%C3%B3n_P%C3%BAblica_y_Gobierno_Digital_Nuevos_Programas_Bloque_2_1779211112883_242783.pdf`),
  prog(`Maestría en Educación y Docencia`, 'maestria', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Maestria_Educaciony_Docencia_33dcdc003a.pdf`),
  prog(`Maestría en Tecnología Educativa`, 'maestria', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Maestria_Tecnologia_Educativa_c563cccf58.pdf`),
  prog(`Maestría en Desarrollo Sustentable y Gestión Ambiental`, 'maestria', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Mae_Desarrollo_Sustentable_Gestion_Ambiental_efbdc0fa74.pdf`),
  prog(`Maestría en Responsabilidad Social`, 'maestria', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Mae_Responsabilidad_Social_d9f8ccaa29.pdf`),
  prog(`Maestría en Innovación Educativa y Diseño Instruccional`, 'maestria', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Universidad_Editorial_Mx_Maestria_Innovacion_Educativay_Diseno_Instruccional_FT_3b1609caa9.pdf`),
  prog(`Maestría en Educación Inteligente y Diseño Instruccional con Inteligencia Artificial`, 'maestria', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Universidad_Editorial_Mx_Maestria_Educacion_Inteligentey_Diseno_Instruccionalcon_Inteligencia_Artificial_FT_eefef3d612.pdf`),
  prog(`Maestría en Energías Renovables y Eficiencia Energética`, 'maestria', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Universidad_Editorial_Mx_Maestria_Educacion_Inteligentey_Diseno_Instruccionalcon_Inteligencia_Artificial_FT_eefef3d612.pdf`),
  prog(`Maestría en Análisis Político y Opinión Pública`, 'maestria', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Maestria_en__An%C3%A1lisis_Pol%C3%ADtico_y_Opini%C3%B3n_P%C3%BAblica_Nuevos_Programas_Bloque_3_1782419278070_368536.pdf`),
  prog(`Maestría en Historia Pública y Educación Patrimonial`, 'maestria', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Maestria_en__Historia_P%C3%BAblica_y_Educaci%C3%B3n_Patrimonial_Nuevos_Programas_Bloque_3_1782419381449_202146.pdf`),
  prog(`Maestría en Comunicación Social y Participación Ciudadana`, 'maestria', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Maestria_en__Comunicaci%C3%B3n_Social_y_Participaci%C3%B3n_Ciudadana_Nuevos_Programas_Bloque_3_1782419310263_479672.pdf`),
  prog(`Maestría en Educación Inclusiva y Diversidad`, 'maestria', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Maestria_en__Educaci%C3%B3n_Inclusiva_y_Diversidad_Nuevos_Programas_Bloque_3_1782419463139_218138.pdf`),
  prog(`Maestría en Justicia Social y Transformación Comunitaria`, 'maestria', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Maestria_en__Justicia_Social_y_Transformaci%C3%B3n_Comunitaria_Nuevos_Programas_Bloque_3_1782419349390_665938.pdf`),
  prog(`Maestría en Dirección de Empresas Turísticas`, 'maestria', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Maestria_Direccionde_Empresas_Turisticas_4ce142e492.pdf`),
  prog(`Maestría en Dirección de Negocios de Alimentos y Bebidas`, 'maestria', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Maestria_Direccionde_Negociosde_Alimentosy_Bebidas_ec12ea2930.pdf`),
  prog(`Maestría en Turismo Digital y Gestión de Plataformas`, 'maestria', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Maestria_en__Turismo_Digital_y_Gesti%C3%B3n_de_Plataformas_Nuevos_Programas_Bloque_3_1782419199911_371812.pdf`),
  prog(`Maestría en Dirección Estratégica de Hospitalidad y Bienestar`, 'maestria', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Maestria_en__Direcci%C3%B3n_Estrat%C3%A9gica_de_Hospitalidad_y_Bienestar_Nuevos_Programas_Bloque_3_1782419442583_187990.pdf`),
  prog(`Maestría en Organización de Eventos Corporativos y Convenciones`, 'maestria', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Maestria_en__Organizaci%C3%B3n_de_Eventos_Corporativos_y_Convenciones_Nuevos_Programas_Bloque_3_1782419261868_967466.pdf`),
  prog(`Maestría en Planeación Turística y Desarrollo Regional`, 'maestria', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Maestria_en__Planeaci%C3%B3n_Tur%C3%ADstica_y_Desarrollo_Regional_Nuevos_Programas_Bloque_3_1782419395265_811690.pdf`),
];

const doctorados: DegreeProgram[] = [
  prog(`Doctorado en Ciencia de Datos e Inteligencia Artificial`, 'doctorado', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Universidad_Editorial_Mx_Doctorado_Cienciade_Datose_Inteligencia_Artificial_FT_350899c42a.pdf`),
  prog(`Doctorado en Ciberseguridad de Sistemas Autónomos`, 'doctorado', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Universidad_Editorial_Mx_Doctorado_Ciberseguridadde_Sistemas_Autonomos_FT_8aa66c0d04.pdf`),
  prog(`Doctorado en Ciberseguridad y Gestión de Riesgos Digitales`, 'doctorado', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Universidad_Editorial_Mx_Doctorado_Ciberseguridady_Gestionde_Riesgos_Digitales_FT_7af690caaf.pdf`),
  prog(`Doctorado en Administración Estratégica Empresarial`, 'doctorado', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Doctorado_Administracion_Estrategica_Empresarial_0ff92591e0.pdf`),
  prog(`Doctorado en Alta Dirección y Gobierno Corporativo`, 'doctorado', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Universidad_Editorial_Mx_Doctorado_Alta_Direcciony_Gobierno_Corporativo_FT_36e8f6d5ab.pdf`),
  prog(`Doctorado en Gestión e Innovación Tecnológica`, 'doctorado', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Doctorado_Gestion_Innovacion_Tecnologica_65ca219f70.pdf`),
  prog(`Doctorado en Economía Pública, Fiscalidad y Gobernanza Financiera`, 'doctorado', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Doctorado_en__Econom%C3%ADa_P%C3%BAblica,_Fiscalidad_y_Gobernanza_Financiera_Nuevos_Programas_Bloque_2_1779211633531_273538.pdf`),
  prog(`Doctorado en Transformación Digital Organizacional`, 'doctorado', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Doctorado_en__Transformaci%C3%B3n_Digital_Organizacional_Nuevos_Programas_Bloque_2_1779211624408_425620.pdf`),
  prog(`Doctorado en Desarrollo Sostenible y Gestión Ambiental`, 'doctorado', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Doctorado_en__Desarrollo_Sostenible_y_Gesti%C3%B3n_Ambiental_Nuevos_Programas_Bloque_3_1782419888859_154149.pdf`),
  prog(`Doctorado en Calidad y Sostenibilidad Organizacional`, 'doctorado', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Doctorado_en__Calidad_y_Sostenibilidad_Organizacional_Nuevos_Programas_Bloque_3_1782419871948_488301.pdf`),
  prog(`Doctorado en Educación`, 'doctorado', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Doctorado_Educacion_113e9f679b.pdf`),
  prog(`Doctorado en Tecnología Educativa e Innovación Didáctica`, 'doctorado', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Doctorado_en__Tecnolog%C3%ADa_Educativa_e_Innovaci%C3%B3n_Did%C3%A1ctica_Nuevos_Programas_Bloque_3_1782419837856_343328.pdf`),
  prog(`Doctorado en Evaluación de Políticas Sociales y Programas Públicos`, 'doctorado', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Doctorado_en__Evaluaci%C3%B3n_de_Pol%C3%ADticas_Sociales_y_Programas_P%C3%BAblicos_Nuevos_Programas_Bloque_3_1782419851831_546462.pdf`),
  prog(`Doctorado en Liderazgo Educativo y Gestión Escolar`, 'doctorado', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Doctorado_en__Liderazgo_Educativo_y_Gesti%C3%B3n_Escolar_Nuevos_Programas_Bloque_3_1782419793982_583418.pdf`),
  prog(`Doctorado en Políticas Públicas y Gobernanza`, 'doctorado', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Doctorado_en__Pol%C3%ADticas_P%C3%BAblicas_y_Gobernanza_Nuevos_Programas_Bloque_3_1782419903721_316923.pdf`),
  prog(`Doctorado en Estudios Interculturales y Diversidad Humana`, 'doctorado', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Doctorado_en__Estudios_Interculturales_y_Diversidad_Humana_Nuevos_Programas_Bloque_3_1782419822968_976270.pdf`),
  prog(`Doctorado en Estudios Interdisciplinarios sobre América Latina`, 'doctorado', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Doctorado_en__Estudios_Interdisciplinarios_sobre_Am%C3%A9rica_Latina_Nuevos_Programas_Bloque_3_1782419810569_450407.pdf`),
  prog(`Doctorado en Derecho`, 'doctorado', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Doctorado_Derecho_548bd3ee4a.pdf`),
  prog(`Doctorado en Justicia Digital y Ciberderecho`, 'doctorado', `https://dbyiwwn1ggdry.cloudfront.net/generador-de-fichas-pdf-dev/MX_Doctorado_en__Justicia_Digital_y_Ciberderecho_Nuevos_Programas_Bloque_2_1779211642198_474519.pdf`),
  prog(`Doctorado en Urbanismo`, 'doctorado', `https://cmsutel.s3.us-east-1.amazonaws.com/Utel_Universidad_Editorial_Mx_Doctorado_Urbanismo_FT_9636ece9e8.pdf`),
  prog(`Doctorado en Desarrollo Humano`, 'doctorado', `https://cmsutel.s3.amazonaws.com/Utel_Mx_Fichas_Tecnicas_Doctorado_Desarrollo_Humano_12a469616c.pdf`),
];

export const DEFAULT_DEGREE_LEVELS: DegreeLevel[] = [
  {
    id: 'licenciatura',
    label: 'Licenciaturas',
    icon: '🔵',
    programs: licenciaturas,
  },
  {
    id: 'maestria',
    label: 'Maestrías',
    icon: '🟠',
    programs: maestrias,
  },
  {
    id: 'doctorado',
    label: 'Doctorados',
    icon: '🔴',
    programs: doctorados,
  },
];
