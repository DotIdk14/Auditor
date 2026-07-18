import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useContact, useContactCalls, useContactActivity, useNotes, useCreateNote,
  useInteractions, useCreateInteraction,
} from '../../hooks/useContacts';
import type { ActivityItem } from '../../hooks/useContacts';
import type { InteractionType, InteractionTipificacion, Interaction } from '@auditor/shared-types';
import {
  Phone, Mail, Clock, Star, MessageSquare, AlertCircle, Activity, Send, PhoneCall,
  MailPlus, Users, FileCheck, Building, ArrowUpRight, CalendarClock, X, Link,
  ThumbsUp, ThumbsDown, Lock, Loader2, MessageCircle, Paperclip, File,
  Image, FileText, Trash2,
} from 'lucide-react';
import type { Contact, ContactDisposition } from '@auditor/shared-types';
import { useAuthStore } from '../../auth/authStore';

interface Props {
  contactId: string | null;
  darkMode: boolean;
  onClose: () => void;
  onTipificacion?: (tipificacion: 'positiva' | 'negativa') => void;
}

export default function ContactDetailPanel({ contactId, darkMode, onClose }: Props) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'activity' | 'audits' | 'notes'>('activity');
  const [showInteractionModal, setShowInteractionModal] = useState(false);

  const user = useAuthStore(s => s.user);
  const isAdmin = user?.role === 'admin';
  const { data: contact, isLoading: contactLoading } = useContact(contactId || '');
  const { data: contactCalls = [] } = useContactCalls(contactId || '');
  const { data: activityData } = useContactActivity(contactId || '');
  const activityItems: ActivityItem[] = activityData?.items || [];
  const { data: interactions = [] } = useInteractions(contactId || '');

  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const { data: notes = [] } = useNotes(selectedCallId);
  const createNote = useCreateNote();

  const handleAddNote = async () => {
    if (!selectedCallId || !noteText.trim()) return;
    try {
      await createNote.mutateAsync({ callId: selectedCallId, text: noteText.trim() });
      setNoteText('');
    } catch (err) {
      console.error('[ADD_NOTE] Error:', err);
    }
  };

  const handleAuditClick = (callId: string) => {
    if (!callId) return;
    navigate(`/auditor/${callId}`);
  };

  if (!contactId) return null;

  if (contactLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-[#b57b54]/30 border-t-[#b57b54] rounded-full animate-spin" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <p className="text-sm font-bold text-rose-500">Contacto no encontrado</p>
        </div>
      </div>
    );
  }

  const textMain = darkMode ? 'text-stone-100' : 'text-stone-900';
  const textSub = darkMode ? 'text-stone-300' : 'text-stone-700';
  const textMuted = darkMode ? 'text-stone-500' : 'text-stone-400';

  return (
    <div className="flex-1 overflow-y-auto p-5 pb-32">
      {/* Header with close */}
      <div className="flex items-center justify-between mb-4">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>
          Detalle del contacto
        </span>
        <button onClick={onClose}
          className={`p-1.5 rounded-lg transition-colors ${
            darkMode ? 'hover:bg-[#24211e] text-stone-400 hover:text-stone-200' : 'hover:bg-stone-100 text-stone-500 hover:text-stone-800'
          }`}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Contact Header */}
      <div className={`rounded-[5px] border-[3px] p-5 mb-5 ${
        darkMode ? 'bg-[#24211e] border-[#4a4036] shadow-[4px_4px_0px_#151311]' : 'bg-white border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d]'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-bold ${
            darkMode ? 'bg-[#3e342a] text-[#ffd8b3]' : 'bg-[#faedcd] text-[#b57b54]'
          }`}>
            {contact.full_name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className={`text-base font-bold font-display truncate ${textMain}`}>
              {contact.full_name}
            </h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                contact.status === 'lead' ? 'text-blue-500 border-blue-200' :
                contact.status === 'customer' ? 'text-emerald-500 border-emerald-200' :
                contact.status === 'churned' ? 'text-rose-500 border-rose-200' :
                'text-amber-500 border-amber-200'
              }`}>
                {contact.status}
              </span>
              <DispositionBadge disposition={contact.disposition || 'no_contactado'} locked={contact.disposition_locked} darkMode={darkMode} />
              <span className="text-[9px] text-stone-500">{contact.source}</span>
            </div>
          </div>
        </div>

        {/* Contact Details */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {contact.phone && (
            <div className={`flex items-center gap-2 text-[11px] ${textSub}`}>
              <Phone className="w-3.5 h-3.5 text-stone-400" />
              {contact.phone}
            </div>
          )}
          {contact.email && (
            <div className={`flex items-center gap-2 text-[11px] ${textSub}`}>
              <Mail className="w-3.5 h-3.5 text-stone-400" />
              {contact.email}
            </div>
          )}
          {contact.company && (
            <div className={`flex items-center gap-2 text-[11px] ${textSub}`}>
              <Building className="w-3.5 h-3.5 text-stone-400" />
              {contact.company}
            </div>
          )}
          <div className={`flex items-center gap-2 text-[11px] ${textSub}`}>
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            {new Date(contact.created_at).toLocaleDateString()}
          </div>
          {isAdmin && contact.assigned_to && (
            <div className={`flex items-center gap-2 text-[11px] ${textSub}`}>
              <Users className="w-3.5 h-3.5 text-stone-400" />
              Asignado a: {contact.assignedToName || contact.assigned_to.slice(0, 8)}
            </div>
          )}
          {contact.callback_at && (
            <div className={`flex items-center gap-2 text-[11px] ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
              <CalendarClock className="w-3.5 h-3.5" />
              Callback: {new Date(contact.callback_at).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>

        {/* Add Interaction Button */}
        <button
          onClick={() => setShowInteractionModal(true)}
          className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-[11px] font-bold transition-all ${
            darkMode
              ? 'bg-[#3e342a] border-[#4a4036] text-[#ffd8b3] hover:bg-[#4a4036]'
              : 'bg-[#faedcd] border-[#d4a373] text-[#b57b54] hover:bg-[#ffeec2]'
          }`}
        >
          <Link className="w-3.5 h-3.5" />
          Agregar Interacción
        </button>
      </div>

      {/* Tabs */}
      <div className={`inline-flex p-1 rounded-2xl mb-5 ${darkMode ? 'bg-[#1c1a18] border border-[#3e382f]' : 'bg-stone-50 border border-stone-200'}`}>
        {[
          { id: 'activity', label: 'Actividad', icon: Activity },
          { id: 'audits', label: 'Auditorías', icon: Star },
          { id: 'notes', label: 'Notas', icon: MessageSquare },
        ].map(tab => (
          <button key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
              activeTab === tab.id
                ? darkMode ? 'bg-amber-900/40 text-amber-500 shadow-inner' : 'bg-white text-[#b57b54] shadow-md border border-[#dfd9cc]'
                : darkMode ? 'text-stone-500 hover:text-stone-300' : 'text-stone-500 hover:text-stone-800'
            }`}>
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-3">
        {activeTab === 'activity' && (
          <>
            {/* Interactions */}
            {interactions.length > 0 && (
              <div className="space-y-2 mb-4">
                {interactions.map((interaction: Interaction) => (
                  <InteractionCard key={interaction.id} interaction={interaction} darkMode={darkMode} />
                ))}
              </div>
            )}

            {activityItems.length === 0 && interactions.length === 0 ? (
              <div className="py-10 text-center">
                <Activity className="w-7 h-7 mx-auto text-stone-400 mb-2" />
                <p className="text-[11px] text-stone-500">Sin actividad registrada</p>
              </div>
            ) : (
              <div className="relative pl-5 border-l-2 space-y-3"
                style={{ borderColor: darkMode ? '#3e382f' : '#dfd9cc' }}>
                {activityItems.map((item: ActivityItem) => (
                  <div key={item.id} className="relative">
                    <div className={`absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full border-2 ${
                      item.type === 'audit'
                        ? darkMode ? 'bg-emerald-900 border-emerald-500' : 'bg-emerald-100 border-emerald-500'
                        : darkMode ? 'bg-indigo-900 border-indigo-500' : 'bg-indigo-100 border-indigo-500'
                    }`} />
                    <div
                      className={`p-3 rounded-xl border transition-all ${
                        item.type === 'audit' && item.callId
                          ? 'cursor-pointer hover:shadow-md ' + (darkMode ? 'bg-[#1c1a18] border-[#3e382f] hover:bg-[#24211e] hover:border-emerald-500/50' : 'bg-white border-[#dfd9cc] hover:bg-stone-50 hover:border-emerald-500/50')
                          : darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'
                      }`}
                      onClick={() => { if (item.type === 'audit' && item.callId) handleAuditClick(item.callId); }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {item.type === 'audit' ? (
                          <FileCheck className={`w-3 h-3 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        ) : item.taskType === 'call' ? (
                          <PhoneCall className={`w-3 h-3 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                        ) : item.taskType === 'email' ? (
                          <MailPlus className={`w-3 h-3 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                        ) : item.taskType === 'meeting' ? (
                          <Users className={`w-3 h-3 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                        ) : (
                          <Activity className={`w-3 h-3 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                        )}
                        <span className={`text-[8px] font-bold uppercase px-1 py-0.5 rounded ${
                          item.type === 'audit' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-indigo-900/30 text-indigo-400'
                        }`}>
                          {item.type === 'audit' ? 'Auditoría' : item.taskType || 'Tarea'}
                        </span>
                        {item.type === 'audit' && item.score != null && (
                          <span className={`text-[10px] font-bold ml-auto ${
                            item.score >= 80 ? 'text-emerald-500' : item.score >= 60 ? 'text-amber-500' : 'text-rose-500'
                          }`}>
                            {typeof item.score === 'number' ? item.score.toFixed(1) : item.score}/10
                          </span>
                        )}
                      </div>
                      <span className={`text-[11px] font-bold ${darkMode ? 'text-stone-200' : 'text-stone-700'}`}>
                        {item.title}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className={`w-3 h-3 ${textMuted}`} />
                        <span className={`text-[9px] ${textMuted}`}>
                          {new Date(item.created_at).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {item.type === 'audit' && item.callId && (
                        <div className={`flex items-center gap-1 mt-1.5 pt-1.5 border-t ${
                          darkMode ? 'border-[#3e382f] text-[#d4a373]' : 'border-stone-100 text-[#b57b54]'
                        }`}>
                          <span className="text-[9px] font-bold">Ver análisis completo</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'audits' && (
          <div className="py-10 text-center">
            <Star className="w-7 h-7 mx-auto text-stone-400 mb-2" />
            <p className="text-[11px] text-stone-500">Selecciona una auditoría para ver detalles</p>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-3">
            <div className={`p-4 rounded-xl border ${darkMode ? 'bg-[#24211e] border-[#4a4036]' : 'bg-white border-[#dfd9cc]'}`}>
              <h3 className={`text-[11px] font-bold mb-2 ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>Nueva Nota</h3>
              <select
                value={selectedCallId || ''}
                onChange={(e) => setSelectedCallId(e.target.value || null)}
                className={`w-full border rounded-xl py-2 px-3 text-xs mb-2 focus:outline-none transition-all ${
                  darkMode ? 'bg-[#1c1a18] border-[#3e382f] text-stone-200 focus:border-[#d4a373]' : 'bg-[#fcfbf9] border-[#dfd9cc] text-stone-800 focus:border-[#d4a373]'
                }`}
              >
                <option value="">Selecciona una auditoría...</option>
                {contactCalls.map((call: any) => (
                  <option key={call.id} value={call.id}>
                    Auditoría - {new Date(call.created_at).toLocaleDateString()}
                  </option>
                ))}
              </select>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Escribe tu nota aquí..."
                rows={2}
                className={`w-full border rounded-xl py-2 px-3 text-xs mb-2 focus:outline-none transition-all resize-none ${
                  darkMode ? 'bg-[#1c1a18] border-[#3e382f] text-stone-200 placeholder-stone-500 focus:border-[#d4a373]' : 'bg-[#fcfbf9] border-[#dfd9cc] text-stone-800 placeholder-stone-400 focus:border-[#d4a373]'
                }`}
              />
              <button
                onClick={handleAddNote}
                disabled={createNote.isPending || !selectedCallId || !noteText.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#faedcd] border border-[#d4a373] text-[#b57b54] hover:bg-[#ffeec2] font-bold rounded-xl transition-all text-xs cursor-pointer disabled:opacity-50"
              >
                {createNote.isPending ? (
                  <div className="w-3.5 h-3.5 border-2 border-[#b57b54]/30 border-t-[#b57b54] rounded-full animate-spin" />
                ) : <Send className="w-3 h-3" />}
                {createNote.isPending ? 'Guardando...' : 'Agregar'}
              </button>
            </div>
            {notes.length > 0 && (
              <div className="space-y-2">
                {notes.map((note: any) => (
                  <div key={note.id} className={`p-3 rounded-xl border ${darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'}`}>
                    <p className={`text-[11px] leading-relaxed ${darkMode ? 'text-stone-200' : 'text-stone-700'}`}>{note.text}</p>
                    <div className="flex justify-between mt-1">
                      <p className="text-[9px] text-stone-500">{note.supervisorName}</p>
                      <span className="text-[9px] text-stone-500">{new Date(note.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Interaction Modal */}
      {showInteractionModal && contact && (
        <AddInteractionModal
          contactId={contact.id}
          contactName={contact.full_name}
          darkMode={darkMode}
          onClose={() => setShowInteractionModal(false)}
          onTipificacion={onTipificacion}
        />
      )}
    </div>
  );
}

// ── Disposition Badge ──────────────────────────────────────────────

function DispositionBadge({ disposition, locked, darkMode }: {
  disposition: ContactDisposition;
  locked: boolean;
  darkMode: boolean;
}) {
  const map: Record<ContactDisposition, { bg: string; text: string; label: string }> = {
    no_contactado: { bg: darkMode ? 'bg-rose-900/30' : 'bg-rose-50', text: 'text-rose-500', label: 'No contactado' },
    cuelgue: { bg: darkMode ? 'bg-amber-900/30' : 'bg-amber-50', text: 'text-amber-500', label: 'Cuelgue' },
    evaluando: { bg: darkMode ? 'bg-emerald-900/30' : 'bg-emerald-50', text: 'text-emerald-500', label: 'Evaluando' },
  };
  const s = map[disposition] || map.no_contactado;
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 ${s.bg} ${s.text}`}>
      {locked && <Lock className="w-2 h-2" />}
      {s.label}
    </span>
  );
}

// ── Interaction Card ──────────────────────────────────────────────

function InteractionCard({ interaction, darkMode }: { interaction: Interaction; darkMode: boolean }) {
  const typeConfig: Record<InteractionType, { icon: typeof Phone; color: string; bg: string; label: string }> = {
    llamada: { icon: PhoneCall, color: darkMode ? 'text-blue-400' : 'text-blue-600', bg: 'bg-blue-900/20', label: 'Llamada' },
    correo: { icon: Mail, color: darkMode ? 'text-purple-400' : 'text-purple-600', bg: 'bg-purple-900/20', label: 'Correo' },
    whatsapp: { icon: MessageCircle, color: darkMode ? 'text-emerald-400' : 'text-emerald-600', bg: 'bg-emerald-900/20', label: 'WhatsApp' },
  };
  const config = typeConfig[interaction.type] || typeConfig.llamada;
  const Icon = config.icon;

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType === 'application/pdf') return FileText;
    return File;
  };

  return (
    <div className={`p-3 rounded-xl border ${
      darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'
    }`}>
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`p-1 rounded-lg ${config.bg}`}>
          <Icon className={`w-3 h-3 ${config.color}`} />
        </div>
        <span className={`text-[9px] font-bold uppercase ${config.color}`}>
          {config.label}
        </span>
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
          interaction.tipificacion === 'positiva'
            ? darkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
            : darkMode ? 'bg-rose-900/30 text-rose-400' : 'bg-rose-50 text-rose-600'
        }`}>
          {interaction.tipificacion === 'positiva' ? '+' : '-'}
        </span>
        <span className={`text-[9px] ml-auto ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>
          {new Date(interaction.created_at).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {interaction.notes && (
        <p className={`text-[11px] leading-relaxed mb-2 ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}>
          {interaction.notes}
        </p>
      )}

      {interaction.files && interaction.files.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {interaction.files.map((file, idx) => {
            const FileIcon = getFileIcon(file.type);
            return (
              <a
                key={idx}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[9px] font-bold transition-all ${
                  darkMode
                    ? 'bg-[#24211e] border-[#3e382f] text-stone-400 hover:bg-[#2e2a24]'
                    : 'bg-stone-50 border-stone-200 text-stone-500 hover:bg-stone-100'
                }`}
              >
                <FileIcon className="w-2.5 h-2.5" />
                {file.name.length > 20 ? file.name.slice(0, 20) + '...' : file.name}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Add Interaction Modal ─────────────────────────────────────────

const INTERACTION_TYPES: { key: InteractionType; label: string; icon: typeof Phone; color: string }[] = [
  { key: 'llamada', label: 'Llamada', icon: PhoneCall, color: 'blue' },
  { key: 'correo', label: 'Correo', icon: Mail, color: 'purple' },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'emerald' },
];

function AddInteractionModal({ contactId, contactName, darkMode, onClose, onTipificacion }: {
  contactId: string;
  contactName: string;
  darkMode: boolean;
  onClose: () => void;
  onTipificacion?: (tipificacion: 'positiva' | 'negativa') => void;
}) {
  const [type, setType] = useState<InteractionType>('llamada');
  const [tipificacion, setTipificacion] = useState<InteractionTipificacion>('positiva');
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createInteraction = useCreateInteraction();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selected].slice(0, 10));
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      await createInteraction.mutateAsync({
        contactId,
        type,
        tipificacion,
        notes: notes.trim() || undefined,
        files: files.length > 0 ? files : undefined,
      });
      onTipificacion?.(tipificacion);
      onClose();
    } catch (err) {
      console.error('[ADD_INTERACTION] Error:', err);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType === 'application/pdf') return FileText;
    return File;
  };

  const inputClass = `w-full border rounded-xl py-2 px-3 text-xs focus:outline-none transition-all ${
    darkMode
      ? 'bg-[#1c1a18] border-[#3e382f] text-stone-200 placeholder-stone-600 focus:border-[#d4a373]'
      : 'bg-[#fcfbf9] border-[#dfd9cc] text-stone-800 placeholder-stone-400 focus:border-[#d4a373]'
  }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className={`absolute inset-0 ${darkMode ? 'bg-black/60' : 'bg-black/30'}`} />
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto rounded-2xl border-2 shadow-2xl ${
          darkMode ? 'bg-[#1c1a18] border-[#4a4036]' : 'bg-white border-[#2d2d2d]'
        }`}
      >
        {/* Header */}
        <div className={`sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b backdrop-blur-sm ${
          darkMode ? 'bg-[#1c1a18]/90 border-[#3e382f]' : 'bg-white/90 border-stone-200'
        }`}>
          <div>
            <h3 className={`text-sm font-bold font-display ${darkMode ? 'text-stone-100' : 'text-stone-900'}`}>
              Agregar Interacción
            </h3>
            <p className={`text-[10px] mt-0.5 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
              {contactName}
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
          {/* Type Selector */}
          <div>
            <label className={`text-[10px] font-bold uppercase tracking-wider block mb-2 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
              Tipo de interacción
            </label>
            <div className="grid grid-cols-3 gap-2">
              {INTERACTION_TYPES.map((opt) => {
                const Icon = opt.icon;
                const isActive = type === opt.key;
                const colorMap: Record<string, { active: string; inactive: string }> = {
                  blue: {
                    active: darkMode ? 'bg-blue-900/30 border-blue-500 text-blue-400' : 'bg-blue-50 border-blue-500 text-blue-600',
                    inactive: darkMode ? 'bg-[#24211e] border-[#3e382f] text-stone-400 hover:bg-[#2e2a24]' : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50',
                  },
                  purple: {
                    active: darkMode ? 'bg-purple-900/30 border-purple-500 text-purple-400' : 'bg-purple-50 border-purple-500 text-purple-600',
                    inactive: darkMode ? 'bg-[#24211e] border-[#3e382f] text-stone-400 hover:bg-[#2e2a24]' : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50',
                  },
                  emerald: {
                    active: darkMode ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' : 'bg-emerald-50 border-emerald-500 text-emerald-600',
                    inactive: darkMode ? 'bg-[#24211e] border-[#3e382f] text-stone-400 hover:bg-[#2e2a24]' : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50',
                  },
                };
                const colors = colorMap[opt.color] || colorMap.blue;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setType(opt.key)}
                    className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl border text-[10px] font-bold transition-all ${
                      isActive ? colors.active : colors.inactive
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tipificacion Selector */}
          <div>
            <label className={`text-[10px] font-bold uppercase tracking-wider block mb-2 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
              Tipificación
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTipificacion('positiva')}
                className={`flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border text-[11px] font-bold transition-all ${
                  tipificacion === 'positiva'
                    ? darkMode ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' : 'bg-emerald-50 border-emerald-500 text-emerald-600'
                    : darkMode ? 'bg-[#24211e] border-[#3e382f] text-stone-400 hover:bg-[#2e2a24]' : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                Positiva
              </button>
              <button
                onClick={() => setTipificacion('negativa')}
                className={`flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border text-[11px] font-bold transition-all ${
                  tipificacion === 'negativa'
                    ? darkMode ? 'bg-rose-900/30 border-rose-500 text-rose-400' : 'bg-rose-50 border-rose-500 text-rose-600'
                    : darkMode ? 'bg-[#24211e] border-[#3e382f] text-stone-400 hover:bg-[#2e2a24]' : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'
                }`}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
                Negativa
              </button>
            </div>
            {tipificacion === 'positiva' && (
              <p className={`text-[9px] mt-1.5 ${darkMode ? 'text-emerald-500' : 'text-emerald-600'}`}>
                El contacto pasará a "Evaluando" y no podrá cambiarse sin administrador.
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className={`text-[10px] font-bold uppercase tracking-wider block mb-2 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe la interacción..."
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* File Upload */}
          <div>
            <label className={`text-[10px] font-bold uppercase tracking-wider block mb-2 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
              Evidencia (opcional)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.gif,.doc,.docx,.xls,.xlsx,.mp3,.mp4,.webm"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed text-[11px] font-bold transition-all ${
                darkMode
                  ? 'border-[#3e382f] text-stone-400 hover:border-[#d4a373] hover:text-[#d4a373]'
                  : 'border-stone-300 text-stone-500 hover:border-[#b57b54] hover:text-[#b57b54]'
              }`}
            >
              <Paperclip className="w-3.5 h-3.5" />
              Adjuntar archivos (PDF, imágenes, documentos)
            </button>

            {files.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {files.map((file, idx) => {
                  const FileIcon = getFileIcon(file.type);
                  return (
                    <div key={idx} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
                      darkMode ? 'bg-[#24211e] border-[#3e382f]' : 'bg-stone-50 border-stone-200'
                    }`}>
                      <FileIcon className={`w-3.5 h-3.5 shrink-0 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`} />
                      <span className={`text-[10px] flex-1 truncate ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}>
                        {file.name}
                      </span>
                      <span className={`text-[9px] shrink-0 ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>
                        {(file.size / 1024).toFixed(0)}KB
                      </span>
                      <button onClick={() => removeFile(idx)} className="text-rose-500 hover:text-rose-400">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className={`sticky bottom-0 px-5 py-4 border-t backdrop-blur-sm ${
          darkMode ? 'bg-[#1c1a18]/90 border-[#3e382f]' : 'bg-white/90 border-stone-200'
        }`}>
          <button
            onClick={handleSubmit}
            disabled={createInteraction.isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#faedcd] border border-[#d4a373] text-[#b57b54] hover:bg-[#ffeec2] font-bold rounded-xl transition-all text-xs cursor-pointer disabled:opacity-50"
          >
            {createInteraction.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            {createInteraction.isPending ? 'Guardando...' : 'Guardar Interacción'}
          </button>
        </div>
      </div>
    </div>
  );
}
