import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useContacts, useCreateContact } from '../../hooks/useContacts';
import { useAuthStore } from '../../auth/authStore';
import {
  Search, Plus, User, ChevronRight, AlertCircle,
  X, Check, CalendarClock, UserPlus, PhoneOff, PhoneCall, FlaskConical, Lock,
} from 'lucide-react';
import type { Contact, ContactDisposition } from '@auditor/shared-types';
import ContactDetailPanel from './ContactDetailPanel';

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

  const dispositionFilter = activeTab === 'all' ? undefined : activeTab;
  const { data: contactsData, isLoading } = useContacts({
    search: searchTerm || undefined,
    disposition: dispositionFilter as any,
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

          {showCreateForm && <InlineCreateForm darkMode={darkMode} onCreated={() => setShowCreateForm(false)} />}

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

// ── Inline Create Form ──────────────────────────────────────────────

function InlineCreateForm({ darkMode, onCreated }: { darkMode: boolean; onCreated: () => void }) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [disposition, setDisposition] = useState<ContactDisposition>('no_contactado');
  const [callbackAt, setCallbackAt] = useState('');
  const createContact = useCreateContact();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    const { accessToken, logout } = useAuthStore.getState();
    if (!accessToken) { logout(); return; }
    try {
      await createContact.mutateAsync({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        company: company.trim() || undefined,
        disposition,
        callbackAt: callbackAt ? new Date(callbackAt).toISOString() : undefined,
      });
      setFullName(''); setPhone(''); setEmail(''); setCompany('');
      setDisposition('no_contactado'); setCallbackAt('');
      onCreated();
    } catch (err) {
      console.error('[CREATE_CONTACT] Error:', err);
    }
  };

  const inputClass = `w-full border rounded-xl py-2 px-3 text-xs focus:outline-none transition-all ${
    darkMode
      ? 'bg-[#24211e] border-[#3e382f] text-stone-200 placeholder-stone-600 focus:border-[#d4a373]'
      : 'bg-[#fcfbf9] border-[#dfd9cc] text-stone-800 placeholder-stone-400 focus:border-[#d4a373]'
  }`;

  return (
    <form onSubmit={handleSubmit} className={`p-3 rounded-xl border space-y-3 ${
      darkMode ? 'bg-[#24211e] border-[#4a4036]' : 'bg-stone-50 border-[#dfd9cc]'
    }`}>
      <div className="flex items-center gap-1.5 mb-1">
        <UserPlus className={`w-3.5 h-3.5 ${darkMode ? 'text-[#d4a373]' : 'text-[#b57b54]'}`} />
        <span className={`text-[10px] font-bold ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>Nuevo Contacto</span>
      </div>
      <input type="text" placeholder="Nombre completo *" value={fullName} onChange={(e) => setFullName(e.target.value)} required className={inputClass} />
      <div className="grid grid-cols-2 gap-2">
        <input type="tel" placeholder="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
      </div>
      <input type="text" placeholder="Empresa" value={company} onChange={(e) => setCompany(e.target.value)} className={inputClass} />
      <div className="grid grid-cols-2 gap-2">
        <select value={disposition} onChange={(e) => setDisposition(e.target.value as ContactDisposition)} className={inputClass}>
          <option value="no_contactado">No contactado</option>
          <option value="cuelgue">Cuelgue</option>
          <option value="evaluando">Evaluando</option>
        </select>
        {disposition === 'cuelgue' && (
          <input type="datetime-local" placeholder="Callback" value={callbackAt} onChange={(e) => setCallbackAt(e.target.value)} className={inputClass} />
        )}
      </div>
      <button
        type="submit"
        disabled={createContact.isPending || !fullName.trim()}
        className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-[#faedcd] border border-[#d4a373] text-[#b57b54] hover:bg-[#ffeec2] font-bold rounded-xl transition-all text-xs cursor-pointer disabled:opacity-50"
      >
        {createContact.isPending ? (
          <div className="w-3.5 h-3.5 border-2 border-[#b57b54]/30 border-t-[#b57b54] rounded-full animate-spin" />
        ) : (
          <Check className="w-3.5 h-3.5" />
        )}
        {createContact.isPending ? 'Guardando...' : 'Guardar'}
      </button>
      {createContact.isError && (
        <p className="text-[10px] text-rose-500">Error al guardar. Intenta de nuevo.</p>
      )}
    </form>
  );
}
