import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { StickyNote, X, ExternalLink, Clock, User, Plus } from 'lucide-react';
import { useAuthStore } from '../../auth/authStore';
import { api } from '../../lib/api';

interface Nota {
  id: string;
  auditoriaId: string | null;
  callName: string | null;
  supervisorEmail: string;
  supervisorName: string;
  segmentStart: number | null;
  segmentEnd: number | null;
  text: string;
  createdAt: string;
  type: 'quick' | 'audit';
}

interface NotesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
}

function formatTime(seconds: number | null): string {
  if (seconds === null) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

const NOTES_STORAGE_KEY = 'visor_quick_notes';

function loadLocalNotes(): Nota[] {
  try {
    const raw = localStorage.getItem(NOTES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveLocalNotes(notas: Nota[]) {
  try { localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notas)); } catch {}
}

export default function NotesPanel({ isOpen, onClose, darkMode }: NotesPanelProps) {
  const [notas, setNotas] = useState<Nota[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [saving, setSaving] = useState(false);
  const [usingLocal, setUsingLocal] = useState(false);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUsingLocal(false);
    try {
      const { data } = await api.get('/notas');
      const apiNotas = Array.isArray(data) ? data : [];
      setNotas(apiNotas);
      saveLocalNotes(apiNotas);
    } catch {
      const local = loadLocalNotes();
      setNotas(local);
      setUsingLocal(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) fetchNotes();
  }, [isOpen, fetchNotes]);

  const handleSaveNote = async () => {
    const text = newNoteText.trim();
    if (!text) return;

    setSaving(true);
    const newNota: Nota = {
      id: `nota_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      auditoriaId: null,
      callName: null,
      supervisorEmail: user?.email || user?.sub || 'anon',
      supervisorName: user?.displayName || 'Usuario',
      segmentStart: null,
      segmentEnd: null,
      text,
      createdAt: new Date().toISOString(),
      type: 'quick',
    };

    try {
      await api.post('/notas', {
        supervisorEmail: newNota.supervisorEmail,
        supervisorName: newNota.supervisorName,
        text: newNota.text,
      });
    } catch {
      // API fallback — save locally
    }

    const updated = [newNota, ...notas];
    setNotas(updated);
    saveLocalNotes(updated);
    setNewNoteText('');
    setSaving(false);
    setError(null);
  };

  const handleNoteClick = (nota: Nota) => {
    if (nota.type === 'audit' && nota.auditoriaId) {
      onClose();
      navigate(`/auditor/${nota.auditoriaId}`);
    }
  };

  const quickNotas = notas.filter((n) => n.type === 'quick');
  const auditNotas = notas.filter((n) => n.type === 'audit');

  const isDark = darkMode;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className={`fixed bottom-0 left-0 right-0 z-[9999] max-h-[80vh] rounded-t-[24px] overflow-hidden ${
              isDark ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-[#fdfbf7] border-[#dfd9cc]'
            } border shadow-2xl`}
          >
            <div className={`px-6 py-4 flex items-center justify-between border-b ${
              isDark ? 'border-[#3e382f]' : 'border-[#dfd9cc]'
            }`}>
              <div className="flex items-center gap-2.5">
                <StickyNote className={`w-5 h-5 ${isDark ? 'text-[#d4a373]' : 'text-[#b57b54]'}`} />
                <h2 className={`text-sm font-bold ${isDark ? 'text-[#f4f1eb]' : 'text-stone-800'}`}>
                  Notas
                </h2>
                {!loading && (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    isDark ? 'bg-[#24211e] text-stone-400' : 'bg-[#efebe4] text-stone-500'
                  }`}>
                    {notas.length}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-[#24211e] text-stone-400 hover:text-white' : 'hover:bg-[#efebe4] text-stone-500 hover:text-stone-800'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(80vh - 60px)' }}>
              {/* Local storage indicator */}
              {usingLocal && (
                <div className={`mb-4 p-3 rounded-xl text-[9px] font-bold text-center ${
                  isDark ? 'bg-amber-900/20 text-amber-400 border border-amber-800/30' : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  📁 Usando almacenamiento local — las notas no se sincronizan con el servidor
                </div>
              )}
              {/* Note creation */}
              <div className={`mb-6 p-4 rounded-xl border ${
                isDark ? 'bg-[#24211e] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'
              }`}>
                <textarea
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Escribe una nota rápida..."
                  rows={3}
                  className={`w-full p-3 rounded-xl border text-xs focus:outline-none transition-all resize-none ${
                    isDark
                      ? 'bg-[#1c1a18] border-[#3e382f] text-stone-200 placeholder-stone-500 focus:border-[#d4a373]'
                      : 'bg-[#fcfbf9] border-[#dfd9cc] text-stone-800 placeholder-stone-400 focus:border-[#d4a373]'
                  }`}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-[9px] ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                    {user?.displayName || 'Usuario'}
                  </span>
                  <button
                    onClick={handleSaveNote}
                    disabled={saving || !newNoteText.trim()}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer disabled:opacity-40 ${
                      isDark
                        ? 'bg-[#d4a373] text-[#1c1a18] hover:bg-[#e3b88a]'
                        : 'bg-[#b57b54] text-white hover:bg-[#a06a46]'
                    }`}
                  >
                    <Plus className="w-3 h-3" />
                    {saving ? 'Guardando...' : 'Guardar Nota'}
                  </button>
                </div>
              </div>

              {loading && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className={`w-6 h-6 border-2 rounded-full animate-spin ${
                    isDark ? 'border-[#d4a373] border-t-transparent' : 'border-[#b57b54] border-t-transparent'
                  }`} />
                  <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Cargando notas...</p>
                </div>
              )}

              {error && !loading && (
                <div className={`p-4 rounded-xl text-center ${
                  isDark ? 'bg-[#24211e] text-stone-400' : 'bg-[#efebe4] text-stone-500'
                }`}>
                  <p className="text-xs font-medium">Error: {error}</p>
                  <button
                    onClick={fetchNotes}
                    className={`mt-2 text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer ${
                      isDark ? 'bg-[#d4a373] text-[#1c1a18]' : 'bg-[#b57b54] text-white'
                    }`}
                  >
                    Reintentar
                  </button>
                </div>
              )}

              {!loading && !error && notas.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <StickyNote className={`w-10 h-10 ${isDark ? 'text-stone-600' : 'text-stone-300'}`} />
                  <p className={`text-xs font-medium ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    Sin notas aún
                  </p>
                  <p className={`text-[10px] ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                    Las notas aparecerán aquí cuando agregues alguna.
                  </p>
                </div>
              )}

              {!loading && !error && notas.length > 0 && (
                <div className="space-y-6">
                  {quickNotas.length > 0 && (
                    <div>
                      <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${
                        isDark ? 'text-stone-500' : 'text-stone-400'
                      }`}>
                        Notas Rápidas ({quickNotas.length})
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {quickNotas.map((nota) => (
                          <div
                            key={nota.id}
                            className={`rounded-xl border-l-[5px] p-4 shadow-sm ${
                              isDark
                                ? 'bg-[#24211e] border-l-sky-600'
                                : 'bg-white border-l-sky-500'
                            }`}
                          >
                            <p className={`text-xs leading-relaxed line-clamp-3 mb-3 ${
                              isDark ? 'text-[#ebe5da]' : 'text-stone-700'
                            }`}>
                              {nota.text}
                            </p>
                            <div className={`border-t pt-2.5 mt-1 ${
                              isDark ? 'border-[#3e382f]' : 'border-[#dfd9cc]'
                            }`}>
                              <div className="flex items-center gap-1.5 mb-1">
                                <User className={`w-3 h-3 ${isDark ? 'text-stone-500' : 'text-stone-400'} shrink-0`} />
                                <span className={`text-[9px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                                  {nota.supervisorName}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Clock className={`w-3 h-3 ${isDark ? 'text-stone-500' : 'text-stone-400'} shrink-0`} />
                                <span className={`text-[9px] ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                                  {formatDate(nota.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {auditNotas.length > 0 && (
                    <div>
                      <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${
                        isDark ? 'text-stone-500' : 'text-stone-400'
                      }`}>
                        Notas de Auditoría ({auditNotas.length})
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {auditNotas.map((nota) => (
                          <button
                            key={nota.id}
                            onClick={() => handleNoteClick(nota)}
                            className={`group text-left rounded-xl border-l-[5px] p-4 transition-all duration-150 cursor-pointer ${
                              isDark
                                ? 'bg-[#24211e] border-l-[#d4a373] hover:bg-[#2c2824] hover:shadow-lg hover:shadow-black/20'
                                : 'bg-white border-l-[#b57b54] hover:bg-[#FAF6F0] hover:shadow-lg hover:shadow-stone-900/10'
                            } shadow-sm`}
                          >
                            <p className={`text-xs leading-relaxed line-clamp-3 mb-3 ${
                              isDark ? 'text-[#ebe5da]' : 'text-stone-700'
                            }`}>
                              {nota.text}
                            </p>
                            <div className={`border-t pt-2.5 mt-1 ${
                              isDark ? 'border-[#3e382f]' : 'border-[#dfd9cc]'
                            }`}>
                              <div className="flex items-center gap-1.5 mb-1">
                                <ExternalLink className="w-3 h-3 text-[#d4a373] shrink-0" />
                                <span className={`text-[10px] font-semibold truncate ${
                                  isDark ? 'text-[#d4a373]' : 'text-[#b57b54]'
                                }`}>
                                  {nota.callName}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 mb-1">
                                <User className={`w-3 h-3 ${isDark ? 'text-stone-500' : 'text-stone-400'} shrink-0`} />
                                <span className={`text-[9px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                                  {nota.supervisorName}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Clock className={`w-3 h-3 ${isDark ? 'text-stone-500' : 'text-stone-400'} shrink-0`} />
                                <span className={`text-[9px] ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                                  {nota.segmentStart !== null
                                    ? `${formatTime(nota.segmentStart)} — ${formatTime(nota.segmentEnd)} · `
                                    : ''}
                                  {formatDate(nota.createdAt)}
                                </span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
