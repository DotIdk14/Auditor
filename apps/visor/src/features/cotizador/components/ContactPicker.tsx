import { useState, useEffect } from 'react';
import { Search, Loader2, X, Trash2, UserPlus, Users } from 'lucide-react';
import { apiClient } from '../../../lib/api';
import type { Contact } from '@auditor/shared-types';

export interface QuoteContactContext {
  mode: 'existing' | 'new';
  contact?: Contact | null;
  fullName?: string;
  phone?: string;
  email?: string;
}

interface Props {
  darkMode: boolean;
  value: QuoteContactContext;
  onChange: (ctx: QuoteContactContext) => void;
}

export function ContactPicker({ darkMode, value, onChange }: Props) {
  const [mode, setMode] = useState<'existing' | 'new'>(value.mode || 'existing');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Contact[]>([]);
  const [searching, setSearching] = useState(false);

  const selectedContact = value.mode === 'existing' ? value.contact : null;

  // Debounced search
  useEffect(() => {
    if (mode !== 'existing' || !search.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      apiClient.get<{ data: Contact[] }>('/contacts', { search: search.trim(), pageSize: 8 })
        .then(res => setResults(res.data || []))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 400);
    return () => clearTimeout(t);
  }, [search, mode]);

  const inputClass = `w-full border rounded-xl py-2 px-3 text-xs focus:outline-none transition-all ${
    darkMode
      ? 'bg-[#1c1a18] border-[#3e382f] text-stone-200 placeholder-stone-600 focus:border-[#d4a373]'
      : 'bg-[#fcfbf9] border-[#dfd9cc] text-stone-800 placeholder-stone-400 focus:border-[#d4a373]'
  }`;

  return (
    <div className={`rounded-xl border p-4 ${darkMode ? 'bg-[#24211e] border-[#4a4036]' : 'bg-white border-stone-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className={`w-4 h-4 ${darkMode ? 'text-amber-400' : 'text-[#b57b54]'}`} />
          <span className={`text-[11px] font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
            Contacto
          </span>
        </div>
        <div className="inline-flex rounded-lg border text-[10px] font-bold p-0.5">
          <button onClick={() => { setMode('existing'); onChange({ mode: 'existing' }); }}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              mode === 'existing'
                ? darkMode ? 'bg-amber-900/40 text-amber-400' : 'bg-white text-[#b57b54] shadow-sm'
                : darkMode ? 'text-stone-500' : 'text-stone-400'
            }`}>
            Existente
          </button>
          <button onClick={() => { setMode('new'); onChange({ mode: 'new' }); }}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              mode === 'new'
                ? darkMode ? 'bg-amber-900/40 text-amber-400' : 'bg-white text-[#b57b54] shadow-sm'
                : darkMode ? 'text-stone-500' : 'text-stone-400'
            }`}>
            Nuevo
          </button>
        </div>
      </div>

      {mode === 'existing' ? (
        selectedContact ? (
          <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${
            darkMode ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-emerald-50 border-emerald-200'
          }`}>
            <div>
              <p className={`text-[12px] font-bold ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                {selectedContact.full_name}
              </p>
              <p className={`text-[10px] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                {selectedContact.phone || selectedContact.email || 'Sin contacto'}
              </p>
            </div>
            <button onClick={() => onChange({ mode: 'existing', contact: null })}
              className={`p-1.5 rounded-lg ${darkMode ? 'text-stone-500 hover:text-rose-400' : 'text-stone-400 hover:text-rose-600'}`}
              title="Quitar contacto">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar contacto por nombre, teléfono o email..."
                className={`${inputClass} pl-9`}
              />
            </div>
            {searching && (
              <div className="flex justify-center py-2">
                <Loader2 className={`w-4 h-4 animate-spin ${darkMode ? 'text-stone-500' : 'text-stone-400'}`} />
              </div>
            )}
            {results.length > 0 && (
              <div className={`max-h-44 overflow-y-auto rounded-xl border divide-y ${
                darkMode ? 'border-[#3e382f] divide-[#3e382f]' : 'border-stone-200 divide-stone-100'
              }`}>
                {results.map(c => (
                  <button key={c.id} onClick={() => { onChange({ mode: 'existing', contact: c }); setResults([]); setSearch(''); }}
                    className={`w-full text-left px-3 py-2.5 transition-colors ${
                      darkMode ? 'hover:bg-[#1c1a18]' : 'hover:bg-stone-50'
                    }`}>
                    <p className={`text-[11px] font-bold ${darkMode ? 'text-stone-200' : 'text-stone-700'}`}>
                      {c.full_name}
                    </p>
                    <p className={`text-[9px] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                      {c.phone || c.email || 'Sin contacto'}
                    </p>
                  </button>
                ))}
              </div>
            )}
            {!searching && search.trim() && results.length === 0 && (
              <p className={`text-[9px] text-center py-2 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                Sin resultados. Cambia a "Nuevo" para crearlo.
              </p>
            )}
          </div>
        )
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[9px] mb-1">
            <UserPlus className={`w-3 h-3 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`} />
            <span className={darkMode ? 'text-stone-500' : 'text-stone-400'}>
              Se creará al guardar la cotización.
            </span>
          </div>
          <input
            value={value.fullName || ''}
            onChange={(e) => onChange({ ...value, fullName: e.target.value })}
            placeholder="Nombre completo *"
            className={inputClass}
          />
          <input
            value={value.phone || ''}
            onChange={(e) => onChange({ ...value, phone: e.target.value })}
            placeholder="Teléfono"
            className={inputClass}
          />
          <input
            value={value.email || ''}
            onChange={(e) => onChange({ ...value, email: e.target.value })}
            placeholder="Email"
            className={inputClass}
          />
        </div>
      )}
    </div>
  );
}
