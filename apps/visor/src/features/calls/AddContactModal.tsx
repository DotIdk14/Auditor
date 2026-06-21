import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Phone, Mail, Building, Check } from 'lucide-react';
import { useCreateContact } from '../../hooks/useContacts';
import { useAuthStore } from '../../auth/authStore';

interface Props {
  darkMode: boolean;
  onClose: () => void;
}

export default function AddContactModal({ darkMode, onClose }: Props) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [status, setStatus] = useState('lead');

  const createContact = useCreateContact();

  // Estabilizar referencias para evitar que el efecto se dispare en cada render
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Verificar token solo al montar (no en cada render, onClose cambia si es inline)
  useEffect(() => {
    const { accessToken, logout } = useAuthStore.getState();
    if (!accessToken) {
      console.warn('[ADD_CONTACT] Sesión expirada o token faltante. Cerrando modal...');
      onCloseRef.current();
      logout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    // Verificación defensiva: no enviar si no hay token de autenticación
    const { accessToken, logout } = useAuthStore.getState();
    if (!accessToken) {
      console.error('[ADD_CONTACT] No hay token de autenticación. Redirigiendo a login...');
      logout();
      return;
    }

    try {
      await createContact.mutateAsync({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        company: company.trim() || undefined,
        status,
      });
      onClose();
    } catch (err) {
      console.error('[ADD_CONTACT] Error:', err);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`w-full max-w-lg rounded-[5px] border-[3px] p-6 shadow-2xl ${
            darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <User className={`w-5 h-5 ${darkMode ? 'text-[#d4a373]' : 'text-[#b57b54]'}`} />
              <h2 className={`text-sm font-bold font-display ${darkMode ? 'text-stone-100' : 'text-stone-800'}`}>
                Nuevo Contacto
              </h2>
            </div>
            <button onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-[#24211e] text-stone-300' : 'hover:bg-stone-100 text-stone-500'
              }`}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre */}
            <div>
              <label htmlFor="contact-name" className={`text-[10px] font-bold flex items-center gap-1 mb-1 ${darkMode ? 'text-stone-300' : 'text-stone-500'}`}>
                <User className="w-3 h-3" />
                Nombre completo *
              </label>
              <input
                id="contact-name"
                name="name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. Juan Pérez"
                required
                className={`w-full border rounded-xl py-2.5 px-3.5 text-xs focus:outline-none transition-all ${
                  darkMode
                    ? 'bg-[#24211e] border-[#3e382f] text-stone-200 placeholder-stone-600 focus:border-[#d4a373] focus:ring-1 focus:ring-[#d4a373]'
                    : 'bg-[#fcfbf9] border-[#dfd9cc] text-stone-800 placeholder-stone-400 focus:border-[#d4a373] focus:ring-1 focus:ring-[#d4a373]'
                }`}
              />
            </div>

            {/* Teléfono y Email */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="contact-phone" className={`text-[10px] font-bold flex items-center gap-1 mb-1 ${darkMode ? 'text-stone-300' : 'text-stone-500'}`}>
                  <Phone className="w-3 h-3" />
                  Teléfono
                </label>
                <input
                  id="contact-phone"
                  name="tel"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+52 55 1234 5678"
                  className={`w-full border rounded-xl py-2.5 px-3.5 text-xs focus:outline-none transition-all ${
                    darkMode
                      ? 'bg-[#24211e] border-[#3e382f] text-stone-200 placeholder-stone-600 focus:border-[#d4a373] focus:ring-1 focus:ring-[#d4a373]'
                      : 'bg-[#fcfbf9] border-[#dfd9cc] text-stone-800 placeholder-stone-400 focus:border-[#d4a373] focus:ring-1 focus:ring-[#d4a373]'
                  }`}
                />
              </div>
              <div>
                <label htmlFor="contact-email" className={`text-[10px] font-bold flex items-center gap-1 mb-1 ${darkMode ? 'text-stone-300' : 'text-stone-500'}`}>
                  <Mail className="w-3 h-3" />
                  Email
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@email.com"
                  className={`w-full border rounded-xl py-2.5 px-3.5 text-xs focus:outline-none transition-all ${
                    darkMode
                      ? 'bg-[#24211e] border-[#3e382f] text-stone-200 placeholder-stone-600 focus:border-[#d4a373] focus:ring-1 focus:ring-[#d4a373]'
                      : 'bg-[#fcfbf9] border-[#dfd9cc] text-stone-800 placeholder-stone-400 focus:border-[#d4a373] focus:ring-1 focus:ring-[#d4a373]'
                  }`}
                />
              </div>
            </div>

            {/* Empresa */}
            <div>
              <label htmlFor="contact-company" className={`text-[10px] font-bold flex items-center gap-1 mb-1 ${darkMode ? 'text-stone-300' : 'text-stone-500'}`}>
                <Building className="w-3 h-3" />
                Empresa
              </label>
              <input
                id="contact-company"
                name="organization"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Nombre de la empresa"
                className={`w-full border rounded-xl py-2.5 px-3.5 text-xs focus:outline-none transition-all ${
                  darkMode
                    ? 'bg-[#24211e] border-[#3e382f] text-stone-200 placeholder-stone-600 focus:border-[#d4a373] focus:ring-1 focus:ring-[#d4a373]'
                    : 'bg-[#fcfbf9] border-[#dfd9cc] text-stone-800 placeholder-stone-400 focus:border-[#d4a373] focus:ring-1 focus:ring-[#d4a373]'
                }`}
              />
            </div>

            {/* Estado */}
            <div>
              <label htmlFor="contact-status" className={`text-[10px] font-bold mb-1 block ${darkMode ? 'text-stone-300' : 'text-stone-500'}`}>
                Estado
              </label>
              <select
                id="contact-status"
                name="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={`w-full border rounded-xl py-2.5 px-3.5 text-xs focus:outline-none transition-all ${
                  darkMode
                    ? 'bg-[#24211e] border-[#3e382f] text-stone-200 focus:border-[#d4a373] focus:ring-1 focus:ring-[#d4a373]'
                    : 'bg-[#fcfbf9] border-[#dfd9cc] text-stone-800 focus:border-[#d4a373] focus:ring-1 focus:ring-[#d4a373]'
                }`}
              >
                <option value="lead">Lead</option>
                <option value="prospect">Prospect</option>
                <option value="customer">Customer</option>
                <option value="churned">Churned</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  darkMode ? 'text-stone-300 hover:bg-[#24211e]' : 'text-stone-500 hover:bg-stone-100'
                }`}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createContact.isPending || !fullName.trim()}
                className="flex items-center gap-1.5 px-5 py-2 bg-[#faedcd] border border-[#d4a373] text-[#b57b54] hover:bg-[#ffeec2] font-bold rounded-xl transition-all text-xs cursor-pointer disabled:opacity-50"
              >
                {createContact.isPending ? (
                  <div className="w-4 h-4 border-2 border-[#b57b54]/30 border-t-[#b57b54] rounded-full animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                {createContact.isPending ? 'Guardando...' : 'Guardar Contacto'}
              </button>
            </div>

            {createContact.isError && (
              <p className="text-[10px] text-rose-500 mt-2">
                Error al guardar. Intenta de nuevo.
              </p>
            )}
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
