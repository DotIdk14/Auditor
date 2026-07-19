import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useContacts } from '../../hooks/useContacts';
import {
  Search, Plus, User, ChevronRight, AlertCircle,
  X, Check, CalendarClock, PhoneOff, PhoneCall, FlaskConical, Lock,
  ThumbsUp, ThumbsDown, Filter,
} from 'lucide-react';
import type { Contact, ContactDisposition, InteractionTipo } from '@auditor/shared-types';
import { POSITIVE_TIPOS, NEGATIVE_TIPOS, ALL_TIPOS } from '@auditor/shared-types';
import ContactDetailPanel from './ContactDetailPanel';
import ContactFormFields from './ContactFormFields';

const DISPOSITION_TABS: { key: ContactDisposition | 'all'; label: string; icon: typeof User }[] = [
  { key: 'all', label: 'Todos', icon: User },
  { key: 'no_contactado', label: 'No Contactados', icon: PhoneOff },
  { key: 'cuelgue', label: 'Cuelgues', icon: PhoneCall },
  { key: 'evaluando', label: 'Evaluando', icon: FlaskConical },
];

function DispositionBadge({ disposition, locked, darkMode }: { disposition: ContactDisposition; locked?: boolean; darkMode: boolean }) {
  const map: Record<ContactDisposition, { bg: string; text: string; label: string }> = {
    no_contactado: { bg: darkMode ? 'bg-rose-900/30' : 'bg-rose-50', text: 'text-rose-500', label: 'No contactado' },
    cuelgue: { bg: darkMode ? 'bg-amber-900/30' : 'bg-amber-50', text: 'text-amber-500', label: 'Cuelgue' },
    evaluando: { bg: darkMode ? 'bg-emerald-900/30' : 'bg-emerald-50', text: 'text-emerald-500', label: 'Evaluando' },
  };
  const s = map[disposition] || map.no_contactado;
  return (
    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 ${s.bg} ${s.text}`}>
      {locked && <Lock className="w-2 h-2" />}
      {s.label}
    </span>
  );
}

export default function ContactsPage() {
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<ContactDisposition | 'all'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [tipoFilter, setTipoFilter] = useState<InteractionTipo | undefined>(undefined);
  const [showTipoFilter, setShowTipoFilter] = useState(false);

  const dispositionFilter = activeTab === 'all' ? undefined : activeTab;
  const { data: contactsData, isLoading } = useContacts({
    search: searchTerm || undefined,
    disposition: dispositionFilter as any,
    tipo: tipoFilter,
  });
  const contacts = contactsData?.data || [];

  const { data: allContacts } = useContacts({ pageSize: 100 });
  const allItems = allContacts?.data || [];
  const counts: Record<string, number> = {
    all: allItems.length,
    no_contactado: allItems.filter((c: Contact) => c.disposition === 'no_contactado').length,
    cuelgue: allItems.filter((c: Contact) => c.disposition === 'cuelgue').length,
    evaluando: allItems.filter((c: Contact) => c.disposition === 'evaluando').length,
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Contact List */}
      <div className={`w-[380px] shrink-0 border-r overflow-y-auto ${
        darkMode ? 'border-[#3e382f]' : 'border-[#dfd9cc]'
      }`}>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className={`text-sm font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
              Contactos
            </h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                showCreateForm
                  ? 'bg-rose-900/30 text-rose-400'
                  : darkMode
                    ? 'bg-[#24211e] text-[#d4a373] hover:bg-[#2e2a24] border border-[#3e382f]'
                    : 'bg-[#faedcd] text-[#b57b54] hover:bg-[#ffeec2] border border-[#dfd9cc]'
              }`}
            >
              {showCreateForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
              {showCreateForm ? 'Cerrar' : 'Nuevo'}
            </button>
          </div>

          {showCreateForm && (
            <div className={`p-3 rounded-xl border ${
              darkMode ? 'bg-[#24211e] border-[#4a4036]' : 'bg-stone-50 border-[#dfd9cc]'
            }`}>
              <ContactFormFields darkMode={darkMode} onSuccess={() => setShowCreateForm(false)} />
            </div>
          )}

          <div className="flex gap-1 p-1 rounded-xl overflow-x-auto">
            {DISPOSITION_TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? darkMode ? 'bg-[#3e342a] text-[#ffd8b3]' : 'bg-[#faedcd] text-[#b57b54]'
                      : darkMode ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-700'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {tab.label}
                  <span className={`text-[8px] font-mono px-1 py-0 rounded ${
                    isActive
                      ? darkMode ? 'bg-[#4a4036] text-[#ffd8b3]' : 'bg-white text-[#b57b54]'
                      : darkMode ? 'bg-[#24211e] text-stone-500' : 'bg-stone-100 text-stone-400'
                  }`}>
                    {counts[tab.key] || 0}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tipificacion Filter */}
          <div>
            <button
              onClick={() => setShowTipoFilter(!showTipoFilter)}
              className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider transition-all ${
                tipoFilter ? 'text-[#b57b54]' : darkMode ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-700'
              }`}
            >
              <Filter className="w-3 h-3" />
              {tipoFilter ? `Filtrado: ${tipoFilter}` : 'Filtrar por tipificación'}
              {tipoFilter && (
                <button onClick={(e) => { e.stopPropagation(); setTipoFilter(undefined); }}
                  className={`ml-1 p-0.5 rounded-full ${darkMode ? 'hover:bg-[#24211e]' : 'hover:bg-stone-100'}`}>
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </button>

            {showTipoFilter && (
              <div className={`mt-2 p-2 rounded-xl border space-y-2 ${darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'}`}>
                <div>
                  <p className={`text-[8px] font-bold flex items-center gap-1 mb-1 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    <ThumbsUp className="w-2.5 h-2.5" />
                    Positivas
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {POSITIVE_TIPOS.map((opt) => (
                      <button key={opt} onClick={() => { setTipoFilter(tipoFilter === opt ? undefined : opt); setShowTipoFilter(false); }}
                        className={`text-[8px] font-bold px-2 py-1 rounded-lg border transition-all ${
                          tipoFilter === opt
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : darkMode ? 'bg-[#24211e] border-[#3e382f] text-stone-400 hover:bg-[#2e2a24]' : 'bg-stone-50 border-stone-200 text-stone-500 hover:bg-stone-100'
                        }`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className={`text-[8px] font-bold flex items-center gap-1 mb-1 ${darkMode ? 'text-rose-400' : 'text-rose-600'}`}>
                    <ThumbsDown className="w-2.5 h-2.5" />
                    Negativas
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {NEGATIVE_TIPOS.map((opt) => (
                      <button key={opt} onClick={() => { setTipoFilter(tipoFilter === opt ? undefined : opt); setShowTipoFilter(false); }}
                        className={`text-[8px] font-bold px-2 py-1 rounded-lg border transition-all ${
                          tipoFilter === opt
                            ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                            : darkMode ? 'bg-[#24211e] border-[#3e382f] text-stone-400 hover:bg-[#2e2a24]' : 'bg-stone-50 border-stone-200 text-stone-500 hover:bg-stone-100'
                        }`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`} />
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-8 pr-3 py-2 rounded-xl border text-xs focus:outline-none transition-all ${
                darkMode ? 'bg-[#24211e] border-[#3e382f] text-stone-200 placeholder-stone-500 focus:border-[#d4a373]' : 'bg-white border-[#dfd9cc] text-stone-800 placeholder-stone-400 focus:border-[#d4a373]'
              }`}
            />
          </div>

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
              contacts.map((contact: Contact) => {
                const isSelected = selectedContactId === contact.id;
                return (
                  <button
                    key={contact.id}
                    onClick={() => setSelectedContactId(isSelected ? null : contact.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? darkMode ? 'bg-[#2e2a24] border-[#d4a373]' : 'bg-[#faedcd] border-[#b57b54]'
                        : darkMode ? 'bg-[#1c1a18] border-[#3e382f] hover:bg-[#24211e]' : 'bg-white border-[#dfd9cc] hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                        isSelected
                          ? darkMode ? 'bg-[#4a4036] text-[#ffd8b3]' : 'bg-[#d4a373] text-white'
                          : darkMode ? 'bg-[#3e342a] text-[#ffd8b3]' : 'bg-[#faedcd] text-[#b57b54]'
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
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isSelected ? 'rotate-90' : ''} ${darkMode ? 'text-stone-500' : 'text-stone-400'}`} />
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <DispositionBadge disposition={contact.disposition || 'no_contactado'} locked={contact.disposition_locked} darkMode={darkMode} />
                      {contact.callback_at && (
                        <span className={`text-[8px] flex items-center gap-0.5 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                          <CalendarClock className="w-2.5 h-2.5" />
                          {new Date(contact.callback_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                      <span className={`text-[8px] ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>
                        {contact.created_at?.split('T')[0]}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Right: Detail Panel */}
      {selectedContactId ? (
        <ContactDetailPanel
          contactId={selectedContactId}
          darkMode={darkMode}
          onClose={() => setSelectedContactId(null)}
          onTipificacion={(tip) => setActiveTab(tip === 'positiva' ? 'evaluando' : 'cuelgue')}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${darkMode ? 'bg-[#24211e]' : 'bg-stone-100'}`}>
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
      )}
    </div>
  );
}


