import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User } from 'lucide-react';
import { useAuthStore } from '../../auth/authStore';
import ContactFormFields from '../contacts/ContactFormFields';

interface Props {
  darkMode: boolean;
  onClose: () => void;
}

export default function AddContactModal({ darkMode, onClose }: Props) {
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

          <ContactFormFields
            darkMode={darkMode}
            onSuccess={onClose}
            onCancel={onClose}
            showCancel
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
