import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Star, 
  Check, 
  Plus, 
  HelpCircle, 
  Award, 
  AlertTriangle, 
  ShieldCheck, 
  Smartphone, 
  HeartHandshake, 
  BookOpen, 
  DollarSign, 
  CheckCircle2, 
  TrendingDown, 
  Sparkles,
  Bookmark,
  GraduationCap
} from 'lucide-react';

interface UniversityData {
  name: string;
  durationText: string;
  pagoMensual: string;
  becaDescuento: string;
  modeloEducativo: string;
  duracionPromedio: string;
  beneficiosDestacados: string;
  complementosExtras: string[];
  idealPara: string;
  condiciones: {
    noBeca: string;
    riesgos: string;
    impactoAnual: string;
  };
  veredicto: string;
  veredictoType: 'good' | 'brand' | 'prestige' | 'international' | 'eco' | 'utel';
  isUtel?: boolean;
}

export const CompetitorComparison: React.FC = () => {
  const [filterCompetitor, setFilterCompetitor] = useState<string>('all');

  const universities: UniversityData[] = [
    {
      name: 'UNITEC',
      durationText: '3 años (Intensiva)',
      pagoMensual: '$1,800',
      becaDescuento: '60% beca académica',
      modeloEducativo: 'En línea',
      duracionPromedio: '3 años',
      beneficiosDestacados: 'Opción balanceada',
      complementosExtras: [],
      idealPara: 'Quien busca equilibrio',
      condiciones: {
        noBeca: 'Sin beca, el costo mensual aprox. es de $4,500 MXN',
        riesgos: 'La beca puede disminuir o cancelarse por bajo promedio, materias reprobadas, adeudos o incumplimiento de requisitos.',
        impactoAnual: 'Impacto anual: +$32,400 MXN aprox.'
      },
      veredicto: 'Buena opción',
      veredictoType: 'good'
    },
    {
      name: 'UNITEC',
      durationText: '4 años (Jornada completa)',
      pagoMensual: '$1,245',
      becaDescuento: '60% beca académica',
      modeloEducativo: 'En línea',
      duracionPromedio: '4 años',
      beneficiosDestacados: 'Opción balanceada',
      complementosExtras: [],
      idealPara: 'Quien busca equilibrio',
      condiciones: {
        noBeca: 'Sin beca, el costo mensual aprox. es de $3,110 MXN',
        riesgos: 'La beca puede disminuir o cancelarse por bajo promedio, materias reprobadas, adeudos o incumplimiento de requisitos.',
        impactoAnual: 'Impacto anual: +$22,380 MXN aprox.'
      },
      veredicto: 'Buena opción',
      veredictoType: 'good'
    },
    {
      name: 'UVM',
      durationText: '3 - 4 años',
      pagoMensual: '$1,895',
      becaDescuento: '75% descuento*',
      modeloEducativo: 'En línea',
      duracionPromedio: '3 - 4 años',
      beneficiosDestacados: 'Marca reconocida',
      complementosExtras: [],
      idealPara: 'Quien busca prestigio y respaldo',
      condiciones: {
        noBeca: 'Sin descuento, el costo mensual aprox. es de $7,580 MXN',
        riesgos: 'El descuento puede perderse por bajo rendimiento académico, adeudos o incumplir políticas institucionales.',
        impactoAnual: 'Impacto anual: +$68,220 MXN aprox.'
      },
      veredicto: 'Opción de marca',
      veredictoType: 'brand'
    },
    {
      name: 'TECmilenio',
      durationText: '3 - 4 años',
      pagoMensual: '$3,200 - $5,800',
      becaDescuento: '35% - 60%',
      modeloEducativo: 'Flexible: en vivo + en línea',
      duracionPromedio: '3 - 4 años',
      beneficiosDestacados: 'Prestigio y tecnología',
      complementosExtras: ['Acompañamiento'],
      idealPara: 'Quien busca experiencia tecnológica y prestigio',
      condiciones: {
        noBeca: 'Sin beca, el costo mensual puede ir de $5,900 a $11,600 MXN',
        riesgos: 'La beca puede disminuir o cancelarse por bajo promedio, adeudos o incumplimiento de requisitos.',
        impactoAnual: 'Impacto anual: +$32,400 a $69,600 MXN'
      },
      veredicto: 'Prestigio alto',
      veredictoType: 'prestige'
    },
    {
      name: 'UNIR',
      durationText: '3 - 4 años',
      pagoMensual: '$2,400 - $3,000',
      becaDescuento: '40% - 60%',
      modeloEducativo: 'En línea',
      duracionPromedio: '3 - 4 años',
      beneficiosDestacados: 'Opción internacional',
      complementosExtras: [],
      idealPara: 'Quien busca estudios internacionales en línea',
      condiciones: {
        noBeca: 'Sin beca, el costo mensual puede ir de $4,000 a $7,500 MXN',
        riesgos: 'La beca puede perderse por bajo rendimiento, impago o incumplimiento de políticas.',
        impactoAnual: 'Impacto anual: +$19,200 a $54,000 MXN'
      },
      veredicto: 'Buena opción internacional',
      veredictoType: 'international'
    },
    {
      name: 'UIN',
      durationText: '3 - 4 años',
      pagoMensual: '$2,300 - $3,800',
      becaDescuento: '40% - 65%',
      modeloEducativo: 'En línea',
      duracionPromedio: '3 - 4 años',
      beneficiosDestacados: 'Opción económica',
      complementosExtras: [],
      idealPara: 'Quien busca economía y flexibilidad',
      condiciones: {
        noBeca: 'Sin beca, el costo mensual puede ir de $4,100 a $10,800 MXN.',
        riesgos: 'La beca puede perderse por bajo promedio, adeudos o incumplimiento de requisitos.',
        impactoAnual: 'Impacto anual: +$21,600 a $84,000 MXN'
      },
      veredicto: 'Buena opción económica',
      veredictoType: 'eco'
    },
    {
      name: 'utel',
      durationText: '3 años',
      pagoMensual: 'Desde $1,564',
      becaDescuento: 'Hasta 70% + 10% por domiciliación',
      modeloEducativo: 'En línea',
      duracionPromedio: '3 años',
      beneficiosDestacados: 'Título sin costo (Ahorro aproximado de $17,000 MXN)',
      complementosExtras: ['Asistencia Universitaria', 'Welbe', 'Platzi', 'Inglés'],
      idealPara: 'Quien busca profesionalización, crecimiento laboral y visión internacional',
      condiciones: {
        noBeca: 'Beca garantizada durante toda la carrera al cumplir con tu avance académico y pagos puntuales.',
        riesgos: 'No se reduce la beca por promedio. Sin costos ocultos ni incrementos por reinscripción.',
        impactoAnual: 'Mensualidad accesible y estable de principio a fin.'
      },
      veredicto: 'La propuesta más competitiva',
      veredictoType: 'utel',
      isUtel: true
    }
  ];

  const filteredUniversities = filterCompetitor === 'all' 
    ? universities 
    : universities.filter(u => u.isUtel || u.name.toLowerCase() === filterCompetitor.toLowerCase());

  const getVeredictoStyles = (type: string) => {
    switch (type) {
      case 'utel':
        return 'bg-emerald-500 text-white font-extrabold px-3 py-1.5 rounded-xl flex items-center justify-center gap-1 shadow-sm';
      case 'prestige':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1';
      case 'brand':
        return 'bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 border border-orange-200 dark:border-orange-900/40 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1';
      case 'international':
        return 'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400 border border-sky-200 dark:border-sky-900/40 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1';
      case 'eco':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1';
      default:
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1';
    }
  };

  return (
    <div className="w-full space-y-8" id="competitor-comparison-root">
      
      {/* HEADER BANNER DESIGN */}
      <div className="relative bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl overflow-hidden">
        {/* Abstract background graphics */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl -mb-20"></div>
        
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 z-10">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-extrabold uppercase tracking-widest mb-3">
              <Sparkles className="h-3.5 w-3.5" /> Plan Comparativo Oficial
            </span>
            <h1 className="text-2xl sm:text-3.5xl font-black tracking-tight leading-tight uppercase font-sans">
              UTEL: La Mejor Inversión
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm font-semibold tracking-wide uppercase mt-1">
              Para tu futuro profesional • Análisis de valor frente a competidores
            </p>
          </div>
          
          {/* Green Title highlight */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center gap-3 w-full md:w-auto">
            <div className="p-3 bg-emerald-500/30 rounded-xl text-white">
              <GraduationCap className="h-8 w-8" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-200">Título sin Costo</div>
              <div className="text-xl font-black text-white">Ahorra Aprox.</div>
              <div className="text-xl font-black text-amber-300 font-mono leading-none">$17,000 MXN</div>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER BUTTONS & TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 px-6 py-4 rounded-2xl border border-gray-150 dark:border-slate-800 shadow-sm">
        <div>
          <h3 className="font-extrabold text-xs tracking-widest text-gray-500 dark:text-slate-400 uppercase">Filtro de Comparación</h3>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Compara a UTEL directamente contra una institución específica o míralas todas juntas.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'all', label: 'Ver Todo' },
            { id: 'unitec', label: 'vs UNITEC' },
            { id: 'uvm', label: 'vs UVM' },
            { id: 'tecmilenio', label: 'vs TECmilenio' },
            { id: 'unir', label: 'vs UNIR' },
            { id: 'uin', label: 'vs UIN' },
          ].map(it => (
            <button
              key={it.id}
              onClick={() => setFilterCompetitor(it.id)}
              className={`text-xs font-extrabold px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                filterCompetitor === it.id
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                  : 'bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-350 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              {it.label}
            </button>
          ))}
        </div>
      </div>

      {/* COMPARATIVE DESKTOP GRID/TABLE */}
      <div className="border border-gray-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-md bg-white dark:bg-slate-900/40">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/70 text-slate-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800 font-extrabold uppercase tracking-wide">
                <th className="py-4 px-3 text-left pl-6 font-black uppercase text-[10px] w-[13%]">Universidad</th>
                <th className="py-4 px-3 text-center font-black uppercase text-[10px] w-[9%]">Pago Mensual</th>
                <th className="py-4 px-3 text-center font-black uppercase text-[10px] w-[12%]">Beca / Descuento</th>
                <th className="py-4 px-3 text-center font-black uppercase text-[10px] w-[9%]">Modelo Educativo</th>
                <th className="py-4 px-3 text-center font-black uppercase text-[10px] w-[9%] flex-row">Duración</th>
                <th className="py-4 px-3 text-left font-black uppercase text-[10px] w-[11%]">Beneficios destacados</th>
                <th className="py-4 px-3 text-left font-black uppercase text-[10px] w-[11%]">Complementos / Extras</th>
                <th className="py-4 px-3 text-left font-black uppercase text-[10px] w-[11%]">Ideal Para</th>
                <th className="py-4 px-3 text-left font-black uppercase text-[10px] w-[17%]">Condiciones Importantes (Si pierdes la beca)</th>
                <th className="py-4 px-4 text-center pr-6 font-black uppercase text-[10px] w-[8%]">Veredicto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 dark:divide-slate-850/60 font-medium">
              
              {filteredUniversities.map((uni, idx) => {
                const rowKey = `${uni.name}-${uni.durationText}`;
                
                return (
                  <tr 
                    key={rowKey}
                    className={`transition-all ${
                      uni.isUtel 
                        ? 'bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-950 dark:text-emerald-100' 
                        : 'hover:bg-slate-50/50 dark:hover:bg-slate-950/20 text-gray-705 dark:text-slate-200'
                    }`}
                  >
                    {/* UNIVERSIDAD */}
                    <td className={`py-4 px-3 pl-6 font-bold text-left align-middle ${uni.isUtel ? 'bg-emerald-500/10 dark:bg-emerald-950/20' : ''}`}>
                      <div className="flex flex-col gap-0.5">
                        <span className={`text-sm ${uni.isUtel ? 'text-emerald-700 dark:text-emerald-300 font-black text-lg' : 'text-slate-800 dark:text-white font-extrabold'}`}>
                          {uni.isUtel ? 'utel' : uni.name}
                        </span>
                        {uni.isUtel && (
                          <span className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-600 dark:text-emerald-400 leading-none">UNIVERSIDAD</span>
                        )}
                        <span className="text-[10px] text-gray-400 dark:text-slate-400 leading-tight font-medium mt-0.5">
                          {uni.durationText}
                        </span>
                      </div>
                    </td>

                    {/* PAGO MENSUAL */}
                    <td className="py-4 px-3 text-center align-middle font-mono font-black text-sm">
                      <span className={uni.isUtel ? 'text-emerald-700 dark:text-emerald-300 text-base' : ''}>{uni.pagoMensual}</span>
                      {uni.isUtel && (
                        <div className="text-[8px] font-normal font-sans text-emerald-600 dark:text-emerald-400 mt-1 uppercase leading-tight">*el precio varía según el programa</div>
                      )}
                    </td>

                    {/* BECA / DESCUENTO */}
                    <td className="py-4 px-3 text-center align-middle font-black">
                      <span className={uni.isUtel ? 'text-emerald-600 dark:text-emerald-400 text-sm' : 'text-blue-600 dark:text-blue-400'}>
                        {uni.becaDescuento}
                      </span>
                    </td>

                    {/* MODELO EDUCATIVO */}
                    <td className="py-4 px-3 text-center align-middle">
                      <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-[10px]">
                        {uni.modeloEducativo}
                      </span>
                    </td>

                    {/* DURACION PROMEDIO */}
                    <td className="py-4 px-3 text-center align-middle font-bold text-gray-700 dark:text-slate-350">
                      {uni.duracionPromedio}
                    </td>

                    {/* BENEFICIOS DESTACADOS */}
                    <td className="py-4 px-3 text-left align-middle font-bold">
                      <span className={uni.isUtel ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-900 dark:text-white'}>
                        {uni.beneficiosDestacados}
                      </span>
                    </td>

                    {/* COMPLEMENTOS / EXTRAS */}
                    <td className="py-4 px-3 text-left align-middle">
                      {uni.complementosExtras.length === 0 ? (
                        <span className="text-gray-400 dark:text-slate-600">—</span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {uni.complementosExtras.map((item, i) => (
                            <span 
                              key={i} 
                              className={`inline-flex items-center gap-0.5 text-[9px] font-extrabold uppercase tracking-wide leading-tight ${
                                uni.isUtel 
                                  ? 'text-emerald-600 dark:text-emerald-400' 
                                  : 'text-gray-600 dark:text-slate-300'
                              }`}
                            >
                              <span className="text-emerald-500 font-black">✔</span> {item}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* IDEAL PARA */}
                    <td className="py-4 px-3 text-left align-middle text-gray-600 dark:text-slate-300 leading-relaxed">
                      {uni.idealPara}
                    </td>

                    {/* CONDICIONES IMPORTANTES */}
                    <td className="py-4 px-3 text-left align-middle space-y-1.5 pr-2">
                      {uni.isUtel ? (
                        <div className="space-y-1 text-emerald-800 dark:text-emerald-200">
                          <div className="flex items-start gap-1">
                            <span className="text-emerald-600 shrink-0 font-bold mt-0.5">✓</span>
                            <span className="text-[10px] font-bold leading-tight">{uni.condiciones.noBeca}</span>
                          </div>
                          <div className="flex items-start gap-1">
                            <span className="text-emerald-600 shrink-0 font-bold mt-0.5">✓</span>
                            <span className="text-[10px] leading-tight">{uni.condiciones.riesgos}</span>
                          </div>
                          <div className="flex items-start gap-1">
                            <span className="text-emerald-600 shrink-0 font-bold mt-0.5">✓</span>
                            <span className="text-[10px] font-black leading-tight text-emerald-700 dark:text-emerald-300">{uni.condiciones.impactoAnual}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1 text-gray-500 dark:text-slate-400">
                          <div className="text-[10px] leading-tight">• {uni.condiciones.noBeca}</div>
                          <div className="text-[10px] leading-tight">• {uni.condiciones.riesgos}</div>
                          <div className="text-[10px] font-extrabold text-red-600 dark:text-red-400 leading-tight mt-1">{uni.condiciones.impactoAnual}</div>
                        </div>
                      )}
                    </td>

                    {/* VEREDICTO */}
                    <td className={`py-4 px-4 text-center pr-6 align-middle ${uni.isUtel ? 'bg-emerald-500/10 dark:bg-emerald-950/20' : ''}`}>
                      <div className="flex justify-center">
                        {uni.isUtel ? (
                          <div className="flex flex-col items-center gap-1.5">
                            <div className="h-8 w-8 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-md">
                              <Check className="h-4 w-4 stroke-[3]" />
                            </div>
                            <span className="text-[10px] uppercase font-black tracking-widest text-emerald-600 dark:text-emerald-400 leading-tight w-24 text-center">
                              La propuesta más competitiva
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-center justify-center">
                            {uni.veredictoType === 'brand' ? (
                              <span className={getVeredictoStyles(uni.veredictoType)}>
                                <Star className="h-3 w-3 fill-orange-500 text-orange-500" /> {uni.veredicto}
                              </span>
                            ) : uni.veredictoType === 'prestige' ? (
                              <span className={getVeredictoStyles(uni.veredictoType)}>
                                <Award className="h-3 w-3 text-rose-500" /> {uni.veredicto}
                              </span>
                            ) : uni.veredictoType === 'international' ? (
                              <span className={getVeredictoStyles(uni.veredictoType)}>
                                <ShieldCheck className="h-3 w-3 text-sky-500" /> {uni.veredicto}
                              </span>
                            ) : uni.veredictoType === 'eco' ? (
                              <span className={getVeredictoStyles(uni.veredictoType)}>
                                <TrendingDown className="h-3 w-3 text-emerald-500" /> {uni.veredicto}
                              </span>
                            ) : (
                              <span className={getVeredictoStyles(uni.veredictoType)}>
                                <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> {uni.veredicto}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}

            </tbody>
          </table>
        </div>
      </div>

      {/* ADDITIONAL BENEFITS CARDS SECTION (Matching image bottom block) */}
      <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-150 dark:border-emerald-900/50 rounded-full text-xs font-black uppercase tracking-wider">
            Exclusivo UTEL
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-2 text-gray-950 dark:text-white uppercase font-sans tracking-tight">
            Beneficios Adicionales Incluidos
          </h2>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 max-w-lg mx-auto">Estas ventajas vienen incluidas en tu inscripción regular sin costo adicional.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-gray-100 dark:border-slate-850 hover:border-emerald-500/25 transition-all">
            <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-4">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <h4 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-tight">
              Asistencia Universitaria
            </h4>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 leading-relaxed">
              Apoyo integral para continuar tus estudios sin retraso en caso de fallecimiento del tutor u otra eventualidad familiar. Estudiarás con respaldo total.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-gray-100 dark:border-slate-850 hover:border-emerald-500/25 transition-all">
            <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-4">
              <Smartphone className="h-5 w-5" />
            </div>
            <h4 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-tight">
              Welbe Salud Integral
            </h4>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 leading-relaxed">
              App de asistencia médica, telemedicina gratuita las 24 horas y descuentos exclusivos en consultas especializadas, laboratorios y farmacias.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-gray-100 dark:border-slate-850 hover:border-emerald-500/25 transition-all">
            <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-4">
              <BookOpen className="h-5 w-5" />
            </div>
            <h4 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-tight">
              Platzi Premium
            </h4>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 leading-relaxed">
              Plataforma complementaria para desarrollar habilidades tecnológicas y gerenciales prácticas, alineadas con las demandas reales del mercado laboral actual.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-gray-100 dark:border-slate-850 hover:border-emerald-500/25 transition-all">
            <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-4">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h4 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-tight">
              Inversión Protegida
            </h4>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 leading-relaxed">
              En UTEL tu inversión en educación está protegida y optimizada desde el primer día. Plan de costos totalmente transparente sin incrementos de sorpresa.
            </p>
          </div>
        </div>
      </div>

      {/* COMPACT TERMS FOOTNOTES */}
      <div className="flex flex-col sm:flex-row justify-between text-[10px] text-gray-400 dark:text-slate-500 leading-normal gap-2 border-t border-gray-200/40 dark:border-slate-800/60 pt-4 px-2">
        <div>*Descuento de colegiatura sujeto a condiciones de la oferta de cada universidad.</div>
        <div className="sm:text-right">*Precios actualizados en mayo 2024. Pueden variar según regulaciones y políticas de cada institución escolar.</div>
      </div>

    </div>
  );
};
