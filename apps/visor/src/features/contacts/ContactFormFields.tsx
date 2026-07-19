import { useState } from 'react';
import { useCreateContact } from '../../hooks/useContacts';
import { useAuthStore } from '../../auth/authStore';
import {
  User, Phone, Mail, GraduationCap, BookOpen, Check, CalendarClock, X,
} from 'lucide-react';
import type { ContactDisposition } from '@auditor/shared-types';

interface Props {
  darkMode: boolean;
  onSuccess: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

const EDUCATION_LEVELS = [
  { value: 'licenciatura', label: 'Licenciatura' },
  { value: 'maestria', label: 'Maestría' },
  { value: 'doctorado', label: 'Doctorado' },
];

const EDUCATION_PROGRAMS: Record<string, string[]> = {
  licenciatura: [
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
  ],
  maestria: [
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
  ],
  doctorado: [
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
  ],
};

export default function ContactFormFields({ darkMode, onSuccess, onCancel, showCancel }: Props) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [educationProgram, setEducationProgram] = useState('');
  const [disposition, setDisposition] = useState<ContactDisposition>('no_contactado');
  const [callbackAt, setCallbackAt] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const createContact = useCreateContact();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    const { accessToken, logout } = useAuthStore.getState();
    if (!accessToken) { logout(); return; }
    try {
      setFieldErrors({});
      await createContact.mutateAsync({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        disposition,
        callbackAt: callbackAt ? new Date(callbackAt).toISOString() : undefined,
        metadata: educationLevel ? {
          educationLevel,
          educationProgram: educationProgram || undefined,
        } : undefined,
      });
      setFullName(''); setPhone(''); setEmail('');
      setEducationLevel(''); setEducationProgram('');
      setDisposition('no_contactado'); setCallbackAt(''); setFieldErrors({});
      onSuccess();
    } catch (err: any) {
      if (err?.response?.data?.details) {
        const errors: Record<string, string> = {};
        for (const issue of err.response.data.details) {
          errors[issue.path[0]] = issue.message;
        }
        setFieldErrors(errors);
      } else {
        console.error('[CONTACT_FORM] Error:', err);
      }
    }
  };

  const inputClass = (field?: string) => `w-full border rounded-xl py-2 px-3 text-xs focus:outline-none transition-all ${
    field && fieldErrors[field]
      ? 'border-rose-500 focus:border-rose-500'
      : darkMode
        ? 'border-[#3e382f] focus:border-[#d4a373]'
        : 'border-[#dfd9cc] focus:border-[#d4a373]'
  } ${
    darkMode ? 'bg-[#24211e] text-stone-200 placeholder-stone-600' : 'bg-[#fcfbf9] text-stone-800 placeholder-stone-400'
  }`;

  const errorClass = 'text-[9px] text-rose-500 mt-0.5';
  const programs = educationLevel ? EDUCATION_PROGRAMS[educationLevel] || [] : [];

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <input
          type="text" placeholder="Nombre completo *" value={fullName}
          onChange={(e) => { setFullName(e.target.value); setFieldErrors(prev => { const n = { ...prev }; delete n.fullName; return n; }); }}
          required className={inputClass('fullName')}
        />
        {fieldErrors.fullName && <p className={errorClass}>{fieldErrors.fullName}</p>}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <input type="tel" placeholder="Teléfono" value={phone}
            onChange={(e) => { setPhone(e.target.value); setFieldErrors(prev => { const n = { ...prev }; delete n.phone; return n; }); }}
            className={inputClass('phone')}
          />
          {fieldErrors.phone && <p className={errorClass}>{fieldErrors.phone}</p>}
        </div>
        <div>
          <input type="email" placeholder="Email" value={email}
            onChange={(e) => { setEmail(e.target.value); setFieldErrors(prev => { const n = { ...prev }; delete n.email; return n; }); }}
            className={inputClass('email')}
          />
          {fieldErrors.email && <p className={errorClass}>{fieldErrors.email}</p>}
        </div>
      </div>

      {/* Education Level */}
      <div>
        <div className="flex items-center gap-1 mb-1">
          <GraduationCap className={`w-3 h-3 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`} />
          <label className={`text-[10px] font-bold ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
            Nivel de estudios
          </label>
        </div>
        <select
          value={educationLevel}
          onChange={(e) => { setEducationLevel(e.target.value); setEducationProgram(''); }}
          className={inputClass()}
        >
          <option value="">Seleccionar nivel</option>
          {EDUCATION_LEVELS.map(lvl => (
            <option key={lvl.value} value={lvl.value}>{lvl.label}</option>
          ))}
        </select>
      </div>

      {/* Education Program (dependent on level) */}
      {educationLevel && programs.length > 0 && (
        <div>
          <div className="flex items-center gap-1 mb-1">
            <BookOpen className={`w-3 h-3 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`} />
            <label className={`text-[10px] font-bold ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
              Programa
            </label>
          </div>
          <select
            value={educationProgram}
            onChange={(e) => setEducationProgram(e.target.value)}
            className={inputClass()}
          >
            <option value="">Seleccionar programa</option>
            {programs.map(prog => (
              <option key={prog} value={prog}>{prog}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <select value={disposition} onChange={(e) => setDisposition(e.target.value as ContactDisposition)} className={inputClass()}>
            <option value="no_contactado">No contactado</option>
            <option value="cuelgue">Cuelgue</option>
            <option value="evaluando">Evaluando</option>
          </select>
          {fieldErrors.disposition && <p className={errorClass}>{fieldErrors.disposition}</p>}
        </div>
        {disposition === 'cuelgue' && (
          <div>
            <input type="datetime-local" placeholder="Callback" value={callbackAt}
              onChange={(e) => { setCallbackAt(e.target.value); setFieldErrors(prev => { const n = { ...prev }; delete n.callbackAt; return n; }); }}
              className={inputClass('callbackAt')}
            />
            {fieldErrors.callbackAt && <p className={errorClass}>{fieldErrors.callbackAt}</p>}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        {showCancel && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              darkMode ? 'text-stone-300 hover:bg-[#24211e]' : 'text-stone-500 hover:bg-stone-100'
            }`}
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={createContact.isPending || !fullName.trim()}
          className="flex items-center justify-center gap-1.5 px-5 py-2 bg-[#faedcd] border border-[#d4a373] text-[#b57b54] hover:bg-[#ffeec2] font-bold rounded-xl transition-all text-xs cursor-pointer disabled:opacity-50"
        >
          {createContact.isPending ? (
            <div className="w-3.5 h-3.5 border-2 border-[#b57b54]/30 border-t-[#b57b54] rounded-full animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
          {createContact.isPending ? 'Guardando...' : 'Guardar Contacto'}
        </button>
      </div>

      {createContact.isError && !Object.keys(fieldErrors).length && (
        <p className="text-[10px] text-rose-500 mt-1">Error al guardar. Intenta de nuevo.</p>
      )}
    </form>
  );
}
