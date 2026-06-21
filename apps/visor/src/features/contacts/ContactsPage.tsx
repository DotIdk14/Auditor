import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { useContacts } from '../../hooks/useContacts';
import { useAuthStore } from '../../auth/authStore';
import { motion } from 'motion/react';
import { Search, Phone, Mail, Plus, User, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import type { Contact } from '@auditor/shared-types';

export default function ContactsPage() {
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: contactsData, isLoading } = useContacts({ search: searchTerm || undefined });
  const contacts = contactsData?.data || [];

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Contact List */}
      <div className={`w-[380px] shrink-0 border-r overflow-y-auto ${
        darkMode ? 'border-[#3e382f]' : 'border-[#dfd9cc]'
      }`}>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className={`text-sm font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
              👤 Contactos
            </h2>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              darkMode ? 'border-[#3e382f] text-stone-400' : 'border-[#dfd9cc] text-stone-500'
            }`}>
              {contacts.length}
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`} />
            <input
              type="text"
              placeholder="Buscar contactos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-8 pr-3 py-2 rounded-xl border text-xs focus:outline-none transition-all ${
                darkMode ? 'bg-[#24211e] border-[#3e382f] text-stone-200 placeholder-stone-500 focus:border-[#d4a373]' : 'bg-white border-[#dfd9cc] text-stone-800 placeholder-stone-400 focus:border-[#d4a373]'
              }`}
            />
          </div>

          {/* Contact List */}
          <div className="space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-[#b57b54]/30 border-t-[#b57b54] rounded-full animate-spin" />
              </div>
            ) : contacts.length === 0 ? (
              <div className="py-12 text-center">
                <AlertCircle className="w-8 h-8 mx-auto text-stone-400 mb-2" />
                <p className="text-xs text-stone-500">Sin contactos encontrados</p>
              </div>
            ) : (
              contacts.map((contact: Contact) => (
                <button
                  key={contact.id}
                  onClick={() => navigate(`/contacts/${contact.id}`)}
                  className={`w-full p-3 rounded-xl border text-left transition-all ${
                    darkMode ? 'bg-[#1c1a18] border-[#3e382f] hover:bg-[#24211e]' : 'bg-white border-[#dfd9cc] hover:bg-stone-50'
                  }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                      darkMode ? 'bg-[#3e342a] text-[#ffd8b3]' : 'bg-[#faedcd] text-[#b57b54]'
                    }`}>
                      {contact.full_name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[11px] font-bold truncate ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                        {contact.full_name}
                      </p>
                      <p className={`text-[9px] truncate ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                        {contact.phone || contact.email || 'Sin contacto'}
                      </p>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`} />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full border ${
                      contact.status === 'lead' ? 'text-blue-500 border-blue-200 dark:border-blue-800' :
                      contact.status === 'customer' ? 'text-emerald-500 border-emerald-200 dark:border-emerald-800' :
                      contact.status === 'churned' ? 'text-rose-500 border-rose-200 dark:border-rose-800' :
                      'text-amber-500 border-amber-200 dark:border-amber-800'
                    }`}>
                      {contact.status}
                    </span>
                    <span className="text-[8px] text-stone-400">{contact.created_at?.split('T')[0]}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right: Empty State - Select a contact */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
            darkMode ? 'bg-[#24211e]' : 'bg-stone-100'
          }`}>
            <User className={`w-8 h-8 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`} />
          </div>
          <h3 className={`text-sm font-bold font-display ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}>
            Selecciona un contacto
          </h3>
          <p className={`text-[11px] max-w-xs ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
            Elige un contacto de la lista para ver su detalle, historial de llamadas y auditorías.
          </p>
        </div>
      </div>
    </div>
  );
}
