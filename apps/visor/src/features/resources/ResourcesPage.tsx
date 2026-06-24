import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Image, MessageSquareText, AlertTriangle, StickyNote, Copy, Plus, X } from 'lucide-react';

export default function ResourcesPage() {
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const [activeTab, setActiveTab] = useState<'images' | 'speech' | 'objections' | 'notes'>('images');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteContent, setNoteContent] = useState('');

  const tabs = [
    { id: 'images', label: 'Imágenes', icon: Image },
    { id: 'speech', label: 'Speech Ventas', icon: MessageSquareText },
    { id: 'objections', label: 'Manejo Objeciones', icon: AlertTriangle },
    { id: 'notes', label: 'Mis Notas', icon: StickyNote },
  ];

  return (
    <div className="h-full overflow-y-auto p-6 pb-32">
      <h2 className={`text-lg font-bold font-display mb-6 ${darkMode ? 'text-stone-100' : 'text-stone-900'}`}>
        📚 Centro de Recursos
      </h2>

      {/* Tabs */}
      <div className={`inline-flex p-1 rounded-2xl mb-8 ${darkMode ? 'bg-[#1c1a18] border border-[#3e382f]' : 'bg-stone-50 border border-stone-200'}`}>
        {tabs.map(tab => (
          <button key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold transition-all ${
              activeTab === tab.id
                ? darkMode ? 'bg-amber-900/40 text-amber-500 shadow-inner' : 'bg-white text-[#b57b54] shadow-md border border-[#dfd9cc]'
                : darkMode ? 'text-stone-500 hover:text-stone-300' : 'text-stone-500 hover:text-stone-800'
            }`}>
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'images' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((img) => (
            <div key={img} className={`group relative rounded-xl overflow-hidden border cursor-pointer transition-all hover:scale-[1.02] ${
              darkMode ? 'border-[#3e382f]' : 'border-[#dfd9cc]'
            }`}>
              <div className={`aspect-square flex items-center justify-center ${darkMode ? 'bg-[#24211e]' : 'bg-stone-100'}`}>
                <Image className={`w-8 h-8 ${darkMode ? 'text-stone-600' : 'text-stone-300'}`} />
              </div>
              <div className={`p-2 ${darkMode ? 'bg-[#1c1a18]' : 'bg-white'}`}>
                <p className={`text-[9px] font-bold truncate ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                  Recurso visual {img}
                </p>
                <button className="text-[8px] text-[#b57b54] hover:underline mt-1">Copiar Link</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'speech' && (
        <div className="space-y-4 max-w-2xl">
          {[
            {
              id: 'apertura',
              icono: '🎯',
              titulo: 'Apertura',
              contenido: `Hola, buen día/tarde/noche. ¿Me comunico con [Nombre]? Mucho gusto, soy Ian Jarquín, asesor educativo de UTEL Universidad. ¿Cómo te encuentras el día de hoy?

[Escuchar y responder: "Qué bueno, me da gusto escucharte."]

Te contacto porque vi que solicitaste información sobre nuestra Licenciatura en [Carrera], ¿correcto?

[Escuchar y responder: "Perfecto."]

Para brindarte mejor atención, dime, ¿actualmente ya cuentas con tu certificado de bachillerato?

[Escuchar y responder: "Excelente."]

Y cuéntame, ¿esta sería la primera universidad que estás revisando o ya habías solicitado información en alguna otra institución?`
            },
            {
              id: 'deteccion_necesidades',
              icono: '🔍',
              titulo: 'Detección de Necesidades',
              contenido: `Perfecto, gracias por compartirme eso. Para poder recomendarte mejor la opción, me gustaría conocer un poco más de ti. ¿Qué fue lo que te motivó a buscar una licenciatura en este momento?

[Escuchar y responder: "Entiendo."]

Y actualmente, ¿te encuentras trabajando, estudiando o realizando alguna otra actividad?

[Escuchar y responder: "Perfecto."]

¿La idea de estudiar esta carrera va más enfocada a crecer laboralmente, cambiar de área, mejorar tus oportunidades o es principalmente un objetivo personal de obtener tu título?

[Escuchar y responder: "Muy bien."]

Y pensando a futuro, si en algunos años ya tuvieras tu título profesional y la preparación que buscas, ¿qué te gustaría que cambiara para ti a nivel laboral, económico o personal?`
            },
            {
              id: 'modalidad_flexibilidad',
              icono: '⚡',
              titulo: 'Modalidad y Flexibilidad UTEL',
              contenido: `Excelente, me gusta porque tienes claro lo que buscas alcanzar. Por lo que me comentas, considero que UTEL puede ser una opción que se adapte muy bien a tu situación. Algo importante es que nosotros nacimos como universidad en línea; no tuvimos que adaptarnos después a esta modalidad, sino que todos nuestros procesos fueron diseñados para personas que trabajan, tienen familia o necesitan flexibilidad.

Actualmente contamos con aula virtual disponible las 24 horas, clases y materiales en línea, actividades organizadas durante la semana y acceso desde celular, tablet o computadora, sin necesidad de trasladarte a un campus.

De hecho, para entender cómo podrías organizarlo: Si tú pudieras diseñar tu horario ideal para estudiar, ¿en qué momento del día crees que podrías dedicarle tiempo a tu carrera?

[Escuchar]

Justamente esa es una de las ventajas: tú adaptas la universidad a tu rutina, no tu rutina a la universidad.`
            },
            {
              id: 'explicacion_licenciatura',
              icono: '📚',
              titulo: 'Explicación de la Licenciatura',
              contenido: `Ahora sí, déjame platicarte un poco más sobre la Licenciatura en [Carrera]. Tiene una duración aproximada de [duración]. El plan de estudios está diseñado para que avances desarrollando conocimientos y competencias que puedas aplicar en el área profesional.

Dentro de la carrera podrás encontrar temas clave como: [Materia o área 1], [Materia o área 2], [Materia o área 3] y [Materia o área 4]. Lo interesante es que desde los primeros periodos empiezas a desarrollar habilidades que puedes aplicar en proyectos personales o laborales.

Me comentabas que buscabas la licenciatura por [RESPUESTA DE SONDEO], ¿verdad?`
            },
            {
              id: 'validez_titulacion',
              icono: '🎓',
              titulo: 'Validez Oficial y Titulación',
              contenido: `UTEL cuenta con Reconocimiento de Validez Oficial de Estudios (RVOE), por lo que tus estudios tienen respaldo oficial en México. Al concluir tu trayectoria académica podrás iniciar tu proceso de titulación de acuerdo con los requisitos del programa.

Para ti, ¿qué tan importante es que la universidad tenga validez oficial y que puedas obtener un título profesional?`
            },
            {
              id: 'acompanamiento_academico',
              icono: '🤝',
              titulo: 'Acompañamiento Académico',
              contenido: `Perfecto. Otro punto importante es que durante la carrera no estarás solo. Tendrás el acompañamiento constante de docentes, un gestor académico, el área de éxito estudiantil y un equipo de revisión académica. La idea es que tengas apoyo durante todo el proceso y puedas avanzar correctamente.`
            },
            {
              id: 'beneficio_platzi',
              icono: '🚀',
              titulo: 'Beneficio Platzi',
              contenido: `Además, actualmente nuestros estudiantes cuentan con un beneficio adicional al iniciar clases: acceso a una membresía de Platzi sin costo extra. ¿Ya conocías Platzi?

• Si responde SÍ: Excelente, entonces ya sabes el valor que tiene complementar una carrera con cursos de inteligencia artificial, liderazgo, programación, idiomas, marketing y muchas otras áreas.
• Si responde NO: Platzi es una plataforma educativa reconocida en Latinoamérica que sirve como complemento para fortalecer habilidades adicionales mientras estudias.

¿Consideras que algo así podría ayudarte a complementar tu perfil profesional?`
            },
            {
              id: 'costos_inversion',
              icono: '💰',
              titulo: 'Costos e Inversión',
              contenido: `Y ahora sí, te comparto la parte de inversión. Los costos de lista son de $2,000 MXN para la inscripción, una colegiatura mensual de $7,490 MXN y un complemento académico de $2,000 MXN cada 4 meses.

Sin embargo, actualmente contamos con un beneficio de beca cercano al 50%, por lo que el costo final disminuye considerablemente. Para revisar exactamente cómo quedaría en tu caso, necesito validar tus datos y revisar la beca disponible.`
            },
            {
              id: 'cierre_pasos',
              icono: '📝',
              titulo: 'Cierre y Siguiente Paso',
              contenido: `Para apoyarte con tu proceso necesito generar tu registro y revisar tu beneficio. Los datos que necesito son tu nombre completo, CURP, correo electrónico y un número alterno de contacto.

Respecto al inicio de clases tenemos estas fechas disponibles: [FECHAS]. ¿Cuál de estas opciones se ajusta mejor a tus planes?

[Tomar datos]

Perfecto, [Nombre]. Antes de finalizar, quiero asegurarme de resolver cualquier duda. ¿Qué información te gustaría tener clara para sentirte completamente seguro(a) de avanzar?`
            },
            {
              id: 'referidos',
              icono: '👥',
              titulo: 'Programa de Referidos',
              contenido: `Por cierto, [Nombre], antes de finalizar quiero comentarte un beneficio adicional que tienes como alumno UTEL. Contamos con un programa de recomendación: si conoces a alguien que también quiera estudiar y se inscribe con nosotros, puedes recibir hasta $2,000 MXN aplicados a tu colegiatura por cada referido.

De hecho, pensando en tu círculo cercano: ¿Hay alguien que también esté buscando estudiar, terminar una carrera o mejorar profesionalmente?

• Si responde SÍ: ¡Excelente! Compárteme su nombre y número y con gusto le brindo la información para apoyarlo.
• Si responde NO: No pasa nada, [Nombre]. Si después recuerdas a alguien, me lo puedes compartir por WhatsApp y con gusto lo apoyo.`
            }
          ].map((speech) => (
            <div key={speech.id} className={`rounded-[5px] border-[3px] p-6 ${
              darkMode ? 'bg-[#24211e] border-[#4a4036] shadow-[4px_4px_0px_#151311]' : 'bg-white border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d]'
            }`}>
              <h3 className={`text-sm font-bold font-display mb-3 ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                {speech.icono} {speech.titulo}
              </h3>
              <div className={`text-[11px] leading-relaxed p-3 rounded-xl whitespace-pre-line ${
                darkMode ? 'bg-[#1c1a18] text-stone-400' : 'bg-stone-50 text-stone-600'
              }`}>
                {speech.contenido}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'objections' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
          <div className={`rounded-[5px] border-[3px] p-6 ${
            darkMode ? 'bg-[#24211e] border-[#4a4036] shadow-[4px_4px_0px_#151311]' : 'bg-white border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d]'
          }`}>
            <h3 className={`text-sm font-bold font-display mb-2 ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
              💰 "Es muy caro"
            </h3>
            <p className={`text-[10px] leading-relaxed ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
              "Entiendo su perspectiva. Permítame mostrarle las facilidades de pago con las que contamos.
              Puede iniciar con un pago inicial muy accesible y el resto en mensualidades que se ajustan a su presupuesto."
            </p>
          </div>

          <div className={`rounded-[5px] border-[3px] p-6 ${
            darkMode ? 'bg-[#24211e] border-[#4a4036] shadow-[4px_4px_0px_#151311]' : 'bg-white border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d]'
          }`}>
            <h3 className={`text-sm font-bold font-display mb-2 ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
              🤔 "Déjame pensarlo"
            </h3>
            <p className={`text-[10px] leading-relaxed ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
              "Por supuesto, es una decisión importante. ¿Qué tal si agendamos una llamada para 
              resolver cualquier duda que surja? Mientras tanto, le envío la información por correo para que 
              pueda revisarla con calma."
            </p>
          </div>
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="space-y-4">
          <button onClick={() => setShowNoteModal(true)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
              darkMode ? 'border-[#3e382f] text-stone-300 hover:bg-[#24211e]' : 'border-[#dfd9cc] text-stone-600 hover:bg-stone-50'
            }`}>
            <Plus className="w-4 h-4" />
            Nueva Nota
          </button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((note) => (
              <div key={note} className={`p-4 rounded-xl border ${
                darkMode ? 'bg-amber-900/10 border-amber-900/20' : 'bg-amber-50 border-amber-100'
              }`}>
                <p className={`text-[10px] leading-relaxed ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                  Nota de ejemplo #{note}: Recordar seguir el protocolo de saludo institucional 
                  en todas las llamadas.
                </p>
                <p className="text-[8px] text-stone-400 mt-2">Hace {note} día(s)</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowNoteModal(false)} />
          <div className={`relative w-full max-w-lg rounded-2xl border shadow-2xl p-6 ${
            darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-sm font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                📝 Nueva Nota
              </h3>
              <button onClick={() => setShowNoteModal(false)}
                className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-[#24211e] text-stone-400' : 'hover:bg-stone-100 text-stone-500'}`}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              placeholder="Escribe tu nota aquí..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              rows={5}
              className={`w-full p-3 rounded-xl border text-xs focus:outline-none transition-all resize-none ${
                darkMode ? 'bg-[#24211e] border-[#3e382f] text-stone-200 placeholder-stone-500 focus:border-[#d4a373]' : 'bg-[#fcfbf9] border-[#dfd9cc] text-stone-800 placeholder-stone-400 focus:border-[#d4a373]'
              }`}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowNoteModal(false)}
                className={`px-4 py-2 rounded-xl border text-[10px] font-bold ${
                  darkMode ? 'border-[#3e382f] text-stone-300' : 'border-[#dfd9cc] text-stone-600'
                }`}>
                Cancelar
              </button>
              <button className="px-4 py-2 rounded-xl bg-[#faedcd] border border-[#d4a373] text-[#b57b54] text-[10px] font-bold hover:bg-[#ffeec2]">
                Guardar Nota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
