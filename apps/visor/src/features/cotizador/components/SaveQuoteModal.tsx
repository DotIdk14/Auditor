import { useState, useEffect, useMemo } from 'react';
import { X, Search, Loader2, CheckCircle2, Send, Trash2 } from 'lucide-react';
import { apiClient } from '../../../lib/api';
import { useCallStore } from '../../resources/store/useCallStore';
import type { QuoteSnapshot } from './cotizador/QuoteResult';
import type { Contact } from '@auditor/shared-types';
import type { QuoteContactContext } from './ContactPicker';

interface Props {
  darkMode: boolean;
  snapshot: QuoteSnapshot | null;
  contactContext?: QuoteContactContext;
  onClose: () => void;
  onSaved?: () => void;
}

interface UsedSelectable {
  id: string;
  title: string;
  content?: string;
  sectionId?: string;
  categoryId?: string;
}

export function SaveQuoteModal({ darkMode, snapshot, contactContext, onClose, onSaved }: Props) {
  const [mode, setMode] = useState<'existing' | 'new'>(contactContext?.mode || 'existing');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(
    contactContext?.mode === 'existing' ? contactContext.contact ?? null : null
  );
  const [searching, setSearching] = useState(false);

  // New contact fields
  const [fullName, setFullName] = useState(contactContext?.fullName || '');
  const [phone, setPhone] = useState(contactContext?.phone || '');
  const [email, setEmail] = useState(contactContext?.email || '');
  const [notes, setNotes] = useState('');

  // Auto-captured speeches & objections (editable)
  const [speeches, setSpeeches] = useState<UsedSelectable[]>([]);
  const [objections, setObjections] = useState<UsedSelectable[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pull used items from the call store when the modal opens
  useEffect(() => {
    if (!snapshot) return;
    const store = useCallStore.getState();
    const sections = store.getAllSectionsMerged();
    const speechById = new Map<string, UsedSelectable>();
    sections.forEach(sec => {
      sec.speeches.forEach(s => {
        speechById.set(s.id, { id: s.id, title: s.title, content: s.content, sectionId: sec.id });
      });
    });
    const objectionById = new Map<string, UsedSelectable>();
    store.getMergedObjections().forEach(cat => {
      cat.responses.forEach(r => {
        objectionById.set(r.id, { id: r.id, title: r.title, content: r.content, categoryId: cat.id });
      });
    });

    const usedSpeeches = store.completedSpeeches
      .map(id => speechById.get(id))
      .filter((x): x is UsedSelectable => Boolean(x));
    const usedObjections = store.usedResponses
      .map(id => objectionById.get(id))
      .filter((x): x is UsedSelectable => Boolean(x));

    setSpeeches(usedSpeeches);
    setObjections(usedObjections);
  }, [snapshot]);

  // Debounced contact search
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

  if (!snapshot) return null;

  const toggleSpeech = (id: string) =>
    setSpeeches(prev => prev.filter(s => s.id !== id));
  const toggleObjection = (id: string) =>
    setObjections(prev => prev.filter(o => o.id !== id));

  const handleSave = async () => {
    setError(null);
    const payload: Record<string, unknown> = {
      contactId: mode === 'existing' ? selectedContact?.id : undefined,
      contact: mode === 'new' ? { fullName, phone, email } : undefined,
      quote: {
        programa: snapshot.programa,
        nivel: snapshot.nivel,
        jornada: snapshot.jornada,
        lead: snapshot.lead,
        zona: snapshot.zona,
        fechaInicio: snapshot.fechaInicio,
        experiencia: snapshot.experiencia,
        modalidad: snapshot.modalidad,
        beneficios: snapshot.beneficios,
        pricing: snapshot.pricing,
        resumenPrograma: snapshot.resumenPrograma,
        advisorName: snapshot.advisorName,
        proposalStatus: snapshot.proposalStatus,
        usedSpeeches: speeches,
        usedObjections: objections,
        notes: notes.trim() || null,
      },
      interaction: {
        type: 'llamada',
        tipo: 'Cotización enviada',
        notes: notes.trim() || null,
      },
    };

    if (mode === 'existing' && !selectedContact) {
      setError('Selecciona un contacto o cambia a "Nuevo contacto".');
      return;
    }
    if (mode === 'new' && !fullName.trim()) {
      setError('Escribe el nombre del contacto.');
      return;
    }

    setSaving(true);
    try {
      await apiClient.post('/cotizaciones', payload);
      setSaved(true);
      onSaved?.();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Error al guardar la cotización.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = `w-full border rounded-xl py-2 px-3 text-xs focus:outline-none transition-all ${
    darkMode
      ? 'bg-[#1c1a18] border-[#3e382f] text-stone-200 placeholder-stone-600 focus:border-[#d4a373]'
      : 'bg-[#fcfbf9] border-[#dfd9cc] text-stone-800 placeholder-stone-400 focus:border-[#d4a373]'
  }`;

  const pricing = snapshot.pricing as Record<string, any>;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={onClose}>
      <div className={`absolute inset-0 ${darkMode ? 'bg-black/60' : 'bg-black/30'}`} />
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto rounded-2xl border-2 shadow-2xl ${
          darkMode ? 'bg-[#1c1a18] border-[#4a4036]' : 'bg-white border-[#2d2d2d]'
        }`}
      >
        {/* Header */}
        <div className={`sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b backdrop-blur-sm ${
          darkMode ? 'bg-[#1c1a18]/90 border-[#3e382f]' : 'bg-white/90 border-stone-200'
        }`}>
          <div>
            <h3 className={`text-sm font-bold font-display ${darkMode ? 'text-stone-100' : 'text-stone-900'}`}>
              Guardar Cotización
            </h3>
            <p className={`text-[10px] mt-0.5 font-bold truncate max-w-[300px] ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
              {snapshot.programa}
            </p>
          </div>
          <button onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-[#24211e] text-stone-400' : 'hover:bg-stone-100 text-stone-500'
            }`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Quote summary */}
          <div className={`rounded-xl border p-3 ${darkMode ? 'bg-[#24211e] border-[#4a4036]' : 'bg-stone-50 border-stone-200'}`}>
            <div className="flex flex-wrap gap-1.5">
              {snapshot.nivel && (
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                  {snapshot.nivel}
                </span>
              )}
              {snapshot.jornada && (
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${darkMode ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                  {snapshot.jornada}
                </span>
              )}
              {snapshot.modalidad && (
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${darkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
                  {snapshot.modalidad}
                </span>
              )}
              {typeof pricing?.cuotaBeca === 'number' && (
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${darkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                  ${Number(pricing.cuotaBeca).toLocaleString('es-MX')}/mes
                </span>
              )}
              {typeof pricing?.becaPct === 'number' && (
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${darkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
                  {pricing.becaPct}% beca
                </span>
              )}
              {snapshot.fechaInicio && (
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-stone-100 text-stone-500'}`}>
                  Inicio: {snapshot.fechaInicio}
                </span>
              )}
            </div>
            {snapshot.advisorName && (
              <p className={`text-[9px] mt-1.5 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                Asesor: <span className="font-bold">{snapshot.advisorName}</span>
              </p>
            )}
          </div>

          {/* Contact selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                Contacto
              </label>
              <div className="inline-flex rounded-lg border text-[10px] font-bold p-0.5">
                <button onClick={() => setMode('existing')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    mode === 'existing'
                      ? darkMode ? 'bg-amber-900/40 text-amber-400' : 'bg-white text-[#b57b54] shadow-sm'
                      : darkMode ? 'text-stone-500' : 'text-stone-400'
                  }`}>
                  Existente
                </button>
                <button onClick={() => setMode('new')}
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
              <div>
                {selectedContact ? (
                  <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${
                    darkMode ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-emerald-50 border-emerald-200'
                  }`}>
                    <div>
                      <p className={`text-[11px] font-bold ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                        {selectedContact.full_name}
                      </p>
                      <p className={`text-[9px] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                        {selectedContact.phone || selectedContact.email || 'Sin contacto'}
                      </p>
                    </div>
                    <button onClick={() => setSelectedContact(null)}
                      className={`p-1.5 rounded-lg ${darkMode ? 'text-stone-500 hover:text-rose-400' : 'text-stone-400 hover:text-rose-600'}`}>
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`} />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nombre, teléfono o email..."
                        className={`${inputClass} pl-9`}
                      />
                    </div>
                    {searching && (
                      <div className="flex justify-center py-3">
                        <Loader2 className={`w-4 h-4 animate-spin ${darkMode ? 'text-stone-500' : 'text-stone-400'}`} />
                      </div>
                    )}
                    {results.length > 0 && (
                      <div className={`max-h-48 overflow-y-auto rounded-xl border divide-y ${
                        darkMode ? 'border-[#3e382f] divide-[#3e382f]' : 'border-stone-200 divide-stone-100'
                      }`}>
                        {results.map(c => (
                          <button key={c.id} onClick={() => { setSelectedContact(c); setResults([]); }}
                            className={`w-full text-left px-3 py-2.5 transition-colors ${
                              darkMode ? 'hover:bg-[#24211e]' : 'hover:bg-stone-50'
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
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nombre completo *"
                  className={inputClass}
                />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Teléfono"
                  className={inputClass}
                />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className={inputClass}
                />
              </div>
            )}
          </div>

          {/* Used speeches & objections (editable) */}
          {(speeches.length > 0 || objections.length > 0) && (
            <div>
              <label className={`text-[10px] font-bold uppercase tracking-wider block mb-2 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                Speeches y objeciones usados ({speeches.length + objections.length})
              </label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {speeches.map(s => (
                  <div key={s.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
                    darkMode ? 'bg-[#24211e] border-[#3e382f]' : 'bg-stone-50 border-stone-200'
                  }`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    <span className={`text-[10px] flex-1 truncate ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}>
                      🗣️ {s.title}
                    </span>
                    <button onClick={() => toggleSpeech(s.id)}
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg ${darkMode ? 'text-stone-500 hover:text-rose-400' : 'text-stone-400 hover:text-rose-600'}`}>
                      Quitar
                    </button>
                  </div>
                ))}
                {objections.map(o => (
                  <div key={o.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
                    darkMode ? 'bg-[#24211e] border-[#3e382f]' : 'bg-stone-50 border-stone-200'
                  }`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    <span className={`text-[10px] flex-1 truncate ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}>
                      💬 {o.title}
                    </span>
                    <button onClick={() => toggleObjection(o.id)}
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg ${darkMode ? 'text-stone-500 hover:text-rose-400' : 'text-stone-400 hover:text-rose-600'}`}>
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className={`text-[10px] font-bold uppercase tracking-wider block mb-2 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
              Notas de la llamada (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Resumen de la conversación, objeciones atendidas, próximo paso..."
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          {error && (
            <div className={`text-[10px] font-bold px-3 py-2 rounded-xl border ${
              darkMode ? 'bg-rose-950/30 border-rose-900/50 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-600'
            }`}>
              {error}
            </div>
          )}

          {saved && (
            <div className={`text-[11px] font-bold px-3 py-2.5 rounded-xl border flex items-center gap-2 ${
              darkMode ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
            }`}>
              <CheckCircle2 className="w-4 h-4" />
              Cotización guardada y registrada en la actividad del contacto.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`sticky bottom-0 px-5 py-4 border-t backdrop-blur-sm ${
          darkMode ? 'bg-[#1c1a18]/90 border-[#3e382f]' : 'bg-white/90 border-stone-200'
        }`}>
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all text-xs cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar Cotización'}
          </button>
        </div>
      </div>
    </div>
  );
}
