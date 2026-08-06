import { useState, useEffect } from 'react';
import { Search, Loader2, Trash2, UserPlus, Users } from 'lucide-react';
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
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Contact[]>([]);
  const [searching, setSearching] = useState(false);

  const selectedContact = value.mode === 'existing' ? value.contact : null;
  const isNewMode = value.mode === 'new';

  // Debounced search (solo busca: no crea nada aquí)
  useEffect(() => {
    if (selectedContact || isNewMode || !search.trim()) {
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
  }, [search, isNewMode, selectedContact]);

  const startNew = () => {
    onChange({ mode: 'new', fullName: search.trim() });
  };

  const inputClass = `w-full border rounded-xl py-2 px-3 text-xs focus:outline-none transition-all ${
    darkMode
      ? 'bg-[#1c1a18] border-[#3e382f] text-stone-200 placeholder-stone-600 focus:border-[#d4a373]'
      : 'bg-[#fcfbf9] border-[#dfd9cc] text-stone-800 placeholder-stone-400 focus:border-[#d4a373]'
  }`;

  return (
    <div className={`rounded-xl border p-4 ${darkMode ? 'bg-[#24211e] border-[#4a4036]' : 'bg-white border-stone-200'}`}>
      <div className="flex items-center gap-2 mb-3">
        <Users className={`w-4 h-4 ${darkMode ? 'text-amber-400' : 'text-[#b57b54]'}`} />
        <span className={`text-[11px] font-bold font-display ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
          Contacto
        </span>
      </div>

      {selectedContact ? (
        <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${
          darkMode ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-emerald-50 border-emerald-200'
        }`}>
          <div>
            <p className={`text-[12px] font-bold ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
              {selectedContact.full_name}
            </p>
            <p className={`text-[10px] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
              {selectedContact.phone || selectedContact.email || 'Contacto existente'}
            </p>
          </div>
          <button
            onClick={() => onChange({ mode: 'existing', contact: null })}
            className={`p-1.5 rounded-lg ${darkMode ? 'text-stone-500 hover:text-rose-400' : 'text-stone-400 hover:text-rose-600'}`}
            title="Quitar contacto"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : isNewMode ? (
        <div className="space-y-2">
          <div className="relative">
            <UserPlus className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`} />
            <input
              autoFocus
              value={value.fullName || ''}
              onChange={(e) => onChange({ mode: 'new', fullName: e.target.value })}
              placeholder="Nombre del nuevo contacto *"
              className={`${inputClass} pl-9`}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-[9px] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
              Se creará al guardar la cotización.
            </span>
            <button
              onClick={() => { onChange({ mode: 'existing', contact: null }); setSearch(''); }}
              className={`text-[9px] font-bold ${darkMode ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600'}`}
            >
              Cancelar
            </button>
          </div>
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
                <button
                  key={c.id}
                  onClick={() => { onChange({ mode: 'existing', contact: c }); setResults([]); setSearch(''); }}
                  className={`w-full text-left px-3 py-2.5 transition-colors ${
                    darkMode ? 'hover:bg-[#1c1a18]' : 'hover:bg-stone-50'
                  }`}
                >
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
          {/* Agregar nuevo contacto inline en la misma barra de búsqueda */}
          <button
            onClick={startNew}
            className={`w-full flex items-center gap-2 rounded-xl border border-dashed px-3 py-2.5 text-left transition-colors ${
              darkMode
                ? 'border-[#4a4036] text-stone-300 hover:border-amber-700/60 hover:bg-amber-950/20'
                : 'border-stone-300 text-stone-600 hover:border-[#d4a373] hover:bg-amber-50'
            }`}
          >
            <UserPlus className={`w-3.5 h-3.5 ${darkMode ? 'text-amber-400' : 'text-[#b57b54]'}`} />
            <span className="text-[11px] font-bold">
              {search.trim()
                ? <>Agregar nuevo contacto <span className="opacity-70">"{search.trim()}"</span></>
                : 'Agregar nuevo contacto'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
