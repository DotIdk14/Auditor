import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Phone, Search, ArrowRight, PhoneCall, UserPlus, Loader2 } from 'lucide-react';
import { useContacts, useCreateContact } from '../../hooks/useContacts';
import type { Contact } from '@auditor/shared-types';

interface Props {
  darkMode: boolean;
  onClose: () => void;
  /** If provided, the modal returns the selected contactId instead of navigating */
  onSelect?: (contactId: string) => void;
}

export default function AddCallModal({ darkMode, onClose, onSelect }: Props) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { data: contactsData, isLoading } = useContacts({ search: search || undefined });
  const createContact = useCreateContact();
  const contacts = contactsData?.data || [];

  // Estado para crear nuevo contacto inline
  const [showNewContact, setShowNewContact] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSelectContact = (contact: Contact) => {
    if (onSelect) {
      onSelect(contact.id);
    } else {
      onClose();
      navigate(`/contacts/${contact.id}`);
    }
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || creating) return;
    setCreating(true);
    try {
      const contact = await createContact.mutateAsync({
        fullName: newName.trim(),
        phone: newPhone || undefined,
        email: newEmail || undefined,
      });
      if (onSelect) {
        onSelect(contact.id);
      } else {
        onClose();
        navigate(`/contacts/${contact.id}`);
      }
    } catch (err) {
      console.error('[ADDCALL] Error creating contact:', err);
    } finally {
      setCreating(false);
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
          className={`w-full max-w-lg rounded-[5px] border-[3px] shadow-2xl overflow-hidden ${
            darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'
          }`}
        >
          <div className="p-6 pb-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Phone className={`w-5 h-5 ${darkMode ? 'text-[#d4a373]' : 'text-[#b57b54]'}`} />
                <h2 className={`text-sm font-bold font-display ${darkMode ? 'text-stone-100' : 'text-stone-800'}`}>
                  {onSelect ? 'Asignar contacto a la llamada' : 'Nueva Llamada'}
                </h2>
              </div>
              <button onClick={onClose}
                className={`p-1.5 rounded-lg transition-colors ${
                  darkMode ? 'hover:bg-[#24211e] text-stone-400' : 'hover:bg-stone-100 text-stone-500'
                }`}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {showNewContact ? (
              /* ── Formulario crear nuevo contacto ── */
              <form onSubmit={handleCreateContact} className="space-y-3 mb-4">
                <input
                  type="text"
                  placeholder="Nombre completo *"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition-all ${
                    darkMode
                      ? 'bg-[#24211e] border-[#3e382f] text-stone-200 placeholder-stone-500 focus:border-[#d4a373]'
                      : 'bg-[#fcfbf9] border-[#dfd9cc] text-stone-800 placeholder-stone-400 focus:border-[#d4a373]'
                  }`}
                />
                <input
                  type="tel"
                  placeholder="Teléfono"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition-all ${
                    darkMode
                      ? 'bg-[#24211e] border-[#3e382f] text-stone-200 placeholder-stone-500 focus:border-[#d4a373]'
                      : 'bg-[#fcfbf9] border-[#dfd9cc] text-stone-800 placeholder-stone-400 focus:border-[#d4a373]'
                  }`}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition-all ${
                    darkMode
                      ? 'bg-[#24211e] border-[#3e382f] text-stone-200 placeholder-stone-500 focus:border-[#d4a373]'
                      : 'bg-[#fcfbf9] border-[#dfd9cc] text-stone-800 placeholder-stone-400 focus:border-[#d4a373]'
                  }`}
                />
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewContact(false)}
                    className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      darkMode
                        ? 'bg-[#2a2520] border border-[#3e382f] text-stone-300 hover:bg-[#353028]'
                        : 'bg-white border border-[#dfd9cc] text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !newName.trim()}
                    className="flex-1 py-2 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                    {creating ? 'Creando...' : 'Crear contacto'}
                  </button>
                </div>
              </form>
            ) : (
              /* ── Search ── */
              <div className="relative mb-4">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`} />
                <input
                  type="text"
                  placeholder="Buscar contacto..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`w-full pl-8 pr-3 py-2 rounded-xl border text-xs focus:outline-none transition-all ${
                    darkMode
                      ? 'bg-[#24211e] border-[#3e382f] text-stone-200 placeholder-stone-500 focus:border-[#d4a373]'
                      : 'bg-[#fcfbf9] border-[#dfd9cc] text-stone-800 placeholder-stone-400 focus:border-[#d4a373]'
                  }`}
                />
              </div>
            )}
          </div>

          {/* Contact list */}
          {!showNewContact && (
            <div className="px-6 pb-6 max-h-[350px] overflow-y-auto space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-[#b57b54]/30 border-t-[#b57b54] rounded-full animate-spin" />
                </div>
              ) : contacts.length === 0 ? (
                <div className="py-8 text-center">
                  <PhoneCall className="w-8 h-8 mx-auto text-stone-400 mb-2" />
                  <p className="text-xs text-stone-500 mb-3">Sin contactos encontrados</p>
                  <button
                    onClick={() => setShowNewContact(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#b57b54] hover:underline"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Crear nuevo contacto
                  </button>
                </div>
              ) : (
                <>
                  {contacts.map((contact: Contact) => (
                    <button
                      key={contact.id}
                      onClick={() => handleSelectContact(contact)}
                      className={`w-full p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                        darkMode
                          ? 'bg-[#1c1a18] border-[#3e382f] hover:bg-[#24211e]'
                          : 'bg-white border-[#dfd9cc] hover:bg-stone-50'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        darkMode ? 'bg-[#3e342a] text-[#ffd8b3]' : 'bg-[#faedcd] text-[#b57b54]'
                      }`}>
                        {contact.full_name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className={`text-[11px] font-bold truncate ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                          {contact.full_name}
                        </p>
                        <p className={`text-[9px] truncate ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                          {contact.phone || contact.email || 'Sin contacto'}
                        </p>
                      </div>
                      <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`} />
                    </button>
                  ))}
                  {/* Botón para crear nuevo contacto al final de la lista */}
                  <button
                    onClick={() => setShowNewContact(true)}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                      darkMode
                        ? 'border-dashed border-[#3e382f] text-stone-400 hover:bg-[#24211e] hover:text-[#d4a373]'
                        : 'border-dashed border-[#dfd9cc] text-stone-500 hover:bg-stone-50 hover:text-[#b57b54]'
                    }`}
                  >
                    <UserPlus className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-bold">Crear nuevo contacto</span>
                  </button>
                </>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
