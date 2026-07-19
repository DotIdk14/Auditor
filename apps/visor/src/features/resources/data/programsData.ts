import type { DegreeProgram, DegreeLevel } from '../types';

function prog(name: string, level: DegreeProgram['level']): DegreeProgram {
  return {
    id: `${level}_${name.toLowerCase().replace(/[^a-záéíóúñ0-9]/g, '_')}`,
    name,
    level,
    description: '',
    duration: '',
    modality: 'En línea',
    imageUrl: '',
    studyPlan: '',
    costs: '',
    requirements: '',
    benefits: '',
    resources: [],
  };
}

const licenciaturas: DegreeProgram[] = [
  'Administración de Empresas',
  'Administración de Recursos Humanos',
  'Administración de Tecnologías de Información',
  'Administración de Ventas',
  'Administración y Finanzas',
  'Ciencias Políticas y Administración Pública',
  'Comunicación',
  'Comunicación Digital',
  'Contaduría Pública',
  'Contaduría y Finanzas',
  'Criminología y Criminalística',
  'Derecho',
  'Ingeniería en Sistemas Computacionales',
  'Ingeniería Industrial',
  'Ingeniería Industrial y Administración',
  'Mercadotecnia',
  'Negocios Internacionales',
  'Pedagogía',
  'Psicología',
  'Psicología Organizacional',
].map(n => prog(n, 'licenciatura'));

const maestrias: DegreeProgram[] = [
  'MBA Internacional',
  'Maestría en Administración de Instituciones Educativas',
  'Maestría en Administración de Negocios',
  'Maestría en Administración de Negocios Deportivos',
  'Maestría en Administración de Recursos Humanos',
  'Maestría en Administración de Tecnologías de la Información',
  'Maestría en Administración en Mercadotecnia Estratégica',
  'Maestría en Administración Pública',
  'Maestría en Alta Dirección y Gobierno Corporativo',
  'Maestría en Ciencia de Datos para Negocios',
  'Maestría en Coaching Integral y Organizacional',
  'Maestría en Comercio Internacional',
  'Maestría en Derecho Procesal Constitucional',
  'Maestría en Derecho Procesal y Juicios Orales',
  'Maestría en Dirección de Empresas Turísticas',
  'Maestría en Dirección de Proyectos de Innovación',
  'Maestría en Dirección de Ventas',
  'Maestría en Educación y Docencia',
  'Maestría en Gestión Estratégica del Capital Humano',
  'Maestría en Gestión Organizacional Positiva',
  'Maestría en Ingeniería y Tecnología Ambiental',
  'Maestría en Mercadotecnia Digital y Comercio Electrónico',
  'Maestría en Mindfulness (Conciencia Plena Aplicada)',
  'Maestría en Psicología Transpersonal',
  'Maestría en Tecnología Educativa',
].map(n => prog(n, 'maestria'));

const doctorados: DegreeProgram[] = [
  'Doctorado en Administración Estratégica Empresarial',
  'Doctorado en Alta Dirección y Gobierno Corporativo',
  'Doctorado en Ciencia de Datos e Inteligencia Artificial',
  'Doctorado en Ciberseguridad y Gestión de Riesgos Digitales',
  'Doctorado en Desarrollo Humano',
  'Doctorado en Educación',
  'Doctorado en Evaluación de Políticas Sociales y Programas Públicos',
  'Doctorado en Gestión e Innovación Tecnológica',
  'Doctorado en Liderazgo Educativo y Gestión Escolar',
  'Doctorado en Políticas Públicas y Gobernanza',
  'Doctorado en Tecnología Educativa e Innovación Didáctica',
].map(n => prog(n, 'doctorado'));

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
