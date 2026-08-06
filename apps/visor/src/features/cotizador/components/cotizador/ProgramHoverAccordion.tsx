import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info } from 'lucide-react';
import { ProgramData } from '../../types';

interface ProgramHoverAccordionProps {
  programData: ProgramData;
}

// Componente de acordeón que se activa al pasar el mouse, mostrando información detallada del programa
export const ProgramHoverAccordion: React.FC<ProgramHoverAccordionProps> = ({ programData }) => {
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  // Definición de las secciones informativas basadas en los datos del programa
  const sections = [
    { title: 'Profesional', id: 'profesional', content: programData.secciones["2_CAMPOS_DE_DESARROLLO_PROFESIONAL"] },
    { title: 'Perfil egreso', id: 'perfil', content: programData.secciones["3_ACTIVIDADES_CLAVE_A_REALIZAR"] },
    { title: 'Validez y cierre', id: 'validez', content: programData.secciones["4_ARGUMENTOS_DE_CIERRE_Y_VALIDEZ"] },
    {
      title: 'Referidos',
      id: 'referidos',
      content: [
        "<b>Primer momento: Llamada 📞</b>",
        `Además, [Nombre], quiero contarte sobre un beneficio adicional que tienes por ser alumno de la Universidad.`,
        "En Utel contamos con un programa de recompensas por referir personas. Esto significa que, una vez inscrito(a), si recomiendas a un amigo, familiar o conocido y esa persona también se inscribe, puedes recibir <b>hasta $2,000 MXN aplicados directamente a tu colegiatura</b> por cada referido.",
        "👉 Yo personalmente puedo ayudarte a obtener este beneficio.",
        "De las personas que conoces, ¿hay alguien que también tenga interés en seguir estudiando o crecer profesionalmente?",
        "<b>✅ Si responde que sí:</b><br/>¡Excelente! Compárteme, por favor, su nombre y número telefónico para poder brindarle información y ayudarle a dar este gran paso junto contigo.",
        "<b>❌ Si responde que no:</b><br/>No te preocupes 😊. Seguimos en contacto por WhatsApp y, si en estos días llega alguien a tu mente, con muchísimo gusto puedes compartirme sus datos para apoyarle también."
      ]
    }
  ];

  return (
    <div className="flex gap-4 items-center mt-4">
      {sections.map(section => (
        <div key={section.id} className="relative" onMouseEnter={() => setHoveredSection(section.id)} onMouseLeave={() => setHoveredSection(null)}>
           <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 cursor-pointer hover:text-emerald-600 transition-colors">
             <Info className="h-3.5 w-3.5" />
             {section.title}
           </div>

           <AnimatePresence>
             {hoveredSection === section.id && (
               <motion.div
                 initial={{ opacity: 0, y: 5 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: 5 }}
                 className={`absolute z-20 ${section.id === 'referidos' ? 'w-[420px] max-h-[460px] overflow-y-auto' : 'w-80'} p-5 mt-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl`}
               >
                 <h4 className="font-bold text-slate-900 dark:text-white mb-2">{section.title}</h4>
                 <ul className={`text-gray-600 dark:text-slate-300 leading-relaxed space-y-1.5 ${section.id === 'referidos' ? 'list-none pl-0' : 'list-disc pl-4'}`}>
                    {section.content.map((item, idx) => (
                        <li key={idx} className={section.id === 'referidos' ? 'mb-2' : ''} dangerouslySetInnerHTML={{ __html: item }} />
                    ))}
                 </ul>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      ))}
    </div>
  );
};
