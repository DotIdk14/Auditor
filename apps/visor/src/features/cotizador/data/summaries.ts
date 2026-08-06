/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const PROGRAM_SUMMARY: Record<string, string> = {
  "Pedagogía": "Este programa está diseñado para formar profesionales capaces de proteger sistemas, información y entornos digitales frente a amenazas tecnológicas cada vez más complejas, integrando estrategias de ciberseguridad, análisis de riesgos e inteligencia artificial. Los estudiantes desarrollarán habilidades en protección de infraestructuras digitales, criptografía, ciberinteligencia, gestión de riesgos tecnológicos y uso ético de la IA, preparándose para responder a los retos actuales del mercado digital.Lo que diferencia a esta licenciatura es su enfoque innovador en la combinación de ciberseguridad e inteligencia artificial, además de incluir optativas especializadas como hackeo ético, cómputo forense, pruebas de penetración e infraestructura segura en la nube. El egresado podrá desarrollarse en áreas como ciberseguridad organizacional, ciberdefensa, ciberinteligencia, gestión de riesgos tecnológicos y seguridad en la nube, accediendo a oportunidades profesionales altamente demandadas en empresas públicas y privadas.",
  "Ingeniería Industrial": "Esta carrera combina conocimientos técnicos de procesos, logística y optimización de recursos, preparando líderes capaces de maximizar la eficiencia operativa y la productividad en empresas de manufactura, servicios y tecnología.",
  "Derecho": "Programa diseñado para formar juristas con visión ética y constructiva, expertos en el nuevo sistema de justicia, capaces de litigar, asesorar y resolver controversias legales en entornos digitales y tradicionales.",
  "Administración": "Formamos administradores visionarios capaces de liderar equipos, gestionar recursos, implementar estrategias de negocio y optimizar la toma de decisiones para el crecimiento organizacional.",
  "Mercadotecnia": "La Licenciatura en Mercadotecnia UTEL desarrolla expertos en comportamiento del consumidor, branding, estrategia digital y posicionamiento de productos, potenciando marcas en mercados altamente competitivos.",
  "Psicología Organizacional": "Enfoque aplicado de la psicología dentro de las empresas; diseña estrategias para mejorar el clima laboral, la selección de talento, la capacitación y el bienestar del capital humano.",
  "Tecnología Educativa": "Especialización enfocada en la creación y aplicación de herramientas digitales para optimizar procesos de enseñanza-aprendizaje, integrando pedagogía y tecnología para contextos digitales.",
  "Educación Y Docencia": "Maestría diseñada para fortalecer las competencias pedagógicas y didácticas, enfocada en la gestión de procesos de enseñanza, el diseño instruccional y la transformación de la práctica docente.",
  "Dirección De Proyectos De Innovación": "Formación de alto nivel para gestionar proyectos complejos que requieran la implementación de soluciones creativas, optimización de metodologías ágiles y liderazgo enfocado en el crecimiento disruptivo."
};

/**
 * Nos da una explicación cortita sobre qué se estudia en cada carrera.
 */
export function getProgramSummary(programName: string): string {
    return PROGRAM_SUMMARY[programName] || "Programa innovador diseñado para potencializar tus habilidades profesionales y prepararte para los retos actuales del mercado laboral.";
}
