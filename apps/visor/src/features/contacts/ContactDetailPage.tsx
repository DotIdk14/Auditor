import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { useContact, useContactCalls, useContactActivity, useNotes, useCreateNote } from '../../hooks/useContacts';
import type { ActivityItem } from '../../hooks/useContacts';
import { ArrowLeft, Phone, Mail, Calendar, Clock, Star, MessageSquare, AlertCircle, Activity, Send, Trash2, PhoneCall, MailPlus, Users, FileCheck, Building } from 'lucide-react';
import type { Contact } from '@auditor/shared-types';

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'activity' | 'audits' | 'notes'>('activity');

  const { data: contact, isLoading: contactLoading } = useContact(id || '');
  const { data: contactCalls = [] } = useContactCalls(id || '');
  const { data: activityData } = useContactActivity(id || '');
  const activityItems: ActivityItem[] = activityData?.items || [];

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

  if (contactLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#b57b54]/30 border-t-[#b57b54] rounded-full animate-spin" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <p className="text-sm font-bold text-rose-500">Contacto no encontrado</p>
          <button onClick={() => navigate('/contacts')} className="text-xs font-bold text-[#b57b54] hover:underline">
            Volver a contactos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 pb-32">
      {/* Back button */}
      <button onClick={() => navigate('/contacts')}
        className={`flex items-center gap-1.5 text-[11px] font-bold mb-4 transition-colors ${
          darkMode ? 'text-stone-400 hover:text-stone-200' : 'text-stone-500 hover:text-stone-800'
        }`}>
        <ArrowLeft className="w-3.5 h-3.5" />
        Volver a contactos
      </button>

      {/* Contact Header */}
      <div className={`rounded-[5px] border-[3px] p-6 mb-6 ${
        darkMode ? 'bg-[#24211e] border-[#4a4036] shadow-[4px_4px_0px_#151311]' : 'bg-white border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d]'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold ${
            darkMode ? 'bg-[#3e342a] text-[#ffd8b3]' : 'bg-[#faedcd] text-[#b57b54]'
          }`}>
            {contact.full_name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div className="flex-1">
            <h2 className={`text-lg font-bold font-display ${darkMode ? 'text-stone-100' : 'text-stone-900'}`}>
              {contact.full_name}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                contact.status === 'lead' ? 'text-blue-500 border-blue-200 dark:border-blue-800' :
                contact.status === 'customer' ? 'text-emerald-500 border-emerald-200 dark:border-emerald-800' :
                contact.status === 'churned' ? 'text-rose-500 border-rose-200 dark:border-rose-800' :
                'text-amber-500 border-amber-200 dark:border-amber-800'
              }`}>
                {contact.status}
              </span>
              <span className="text-[9px] text-stone-500">{contact.source}</span>
            </div>
          </div>
        </div>

        {/* Contact Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {contact.phone && (
            <div className={`flex items-center gap-2 text-[11px] ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
              <Phone className="w-3.5 h-3.5 text-stone-400" />
              {contact.phone}
            </div>
          )}
          {contact.email && (
            <div className={`flex items-center gap-2 text-[11px] ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
              <Mail className="w-3.5 h-3.5 text-stone-400" />
              {contact.email}
            </div>
          )}
          {contact.company && (
            <div className={`flex items-center gap-2 text-[11px] ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              {contact.company}
            </div>
          )}
          <div className={`flex items-center gap-2 text-[11px] ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            Creado: {new Date(contact.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={`inline-flex p-1 rounded-2xl mb-6 ${darkMode ? 'bg-[#1c1a18] border border-[#3e382f]' : 'bg-stone-50 border border-stone-200'}`}>
        {[
          { id: 'activity', label: 'Actividad', icon: Activity },
          { id: 'audits', label: 'Auditorías', icon: Star },
          { id: 'notes', label: 'Notas', icon: MessageSquare },
        ].map(tab => (
          <button key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold transition-all ${
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
            {activityItems.length === 0 ? (
              <div className="py-12 text-center">
                <Activity className="w-8 h-8 mx-auto text-stone-400 mb-2" />
                <p className="text-xs text-stone-500">Sin actividad registrada</p>
              </div>
            ) : (
              <div className="relative pl-6 border-l-2 space-y-4"
                style={{ borderColor: darkMode ? '#3e382f' : '#dfd9cc' }}>
                {activityItems.map((item: ActivityItem) => (
                  <div key={item.id} className="relative">
                    {/* Timeline dot */}
                    <div className={`absolute -left-[25px] top-1 w-3 h-3 rounded-full border-2 ${
                      item.type === 'audit'
                        ? darkMode ? 'bg-emerald-900 border-emerald-500' : 'bg-emerald-100 border-emerald-500'
                        : darkMode ? 'bg-indigo-900 border-indigo-500' : 'bg-indigo-100 border-indigo-500'
                    }`} />

                    <div className={`p-4 rounded-xl border transition-all hover:shadow-sm ${
                      darkMode ? 'bg-[#1c1a18] border-[#3e382f] hover:bg-[#24211e]' : 'bg-white border-[#dfd9cc] hover:bg-stone-50'
                    }`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        {/* Icono según tipo */}
                        {item.type === 'audit' ? (
                          <FileCheck className={`w-3.5 h-3.5 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        ) : item.taskType === 'call' ? (
                          <PhoneCall className={`w-3.5 h-3.5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                        ) : item.taskType === 'email' ? (
                          <MailPlus className={`w-3.5 h-3.5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                        ) : item.taskType === 'meeting' ? (
                          <Users className={`w-3.5 h-3.5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                        ) : item.taskType === 'demo' ? (
                          <Building className={`w-3.5 h-3.5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                        ) : (
                          <Activity className={`w-3.5 h-3.5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                        )}

                        {/* Tipo badge */}
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          item.type === 'audit'
                            ? 'bg-emerald-900/30 text-emerald-400'
                            : 'bg-indigo-900/30 text-indigo-400'
                        }`}>
                          {item.type === 'audit' ? 'Auditoría' : item.taskType || 'Tarea'}
                        </span>

                        {/* Score para auditorías */}
                        {item.type === 'audit' && item.score != null && (
                          <span className={`text-[10px] font-bold ml-auto ${
                            item.score >= 80 ? 'text-emerald-500' : item.score >= 60 ? 'text-amber-500' : 'text-rose-500'
                          }`}>
                            {typeof item.score === 'number' ? item.score.toFixed(1) : item.score}/10
                          </span>
                        )}

                        {/* Status para tareas */}
                        {item.type === 'task' && (
                          <span className={`text-[9px] font-bold uppercase ml-auto px-1.5 py-0.5 rounded ${
                            item.status === 'completed'
                              ? 'bg-emerald-900/30 text-emerald-400'
                              : item.status === 'in_progress'
                              ? 'bg-amber-900/30 text-amber-400'
                              : item.status === 'cancelled'
                              ? 'bg-rose-900/30 text-rose-400'
                              : 'bg-blue-900/30 text-blue-400'
                          }`}>
                            {item.status === 'pending' ? 'Pendiente'
                              : item.status === 'in_progress' ? 'En progreso'
                              : item.status === 'completed' ? 'Completada'
                              : item.status === 'cancelled' ? 'Cancelada'
                              : item.status}
                          </span>
                        )}
                      </div>

                      {/* Título */}
                      <span className={`text-[11px] font-bold ${darkMode ? 'text-stone-200' : 'text-stone-700'}`}>
                        {item.title}
                      </span>

                      {/* Descripción (solo tareas) */}
                      {item.type === 'task' && item.description && (
                        <p className={`text-[10px] mt-1 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                          {item.description}
                        </p>
                      )}

                      {/* Fecha */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <Clock className={`w-3 h-3 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`} />
                        <span className={`text-[9px] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                          {new Date(item.created_at).toLocaleString('es-ES', {
                            day: 'numeric', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                        {item.type === 'task' && item.priority && (
                          <span className={`text-[8px] font-bold uppercase ml-2 px-1 rounded ${
                            item.priority === 'high' || item.priority === 'urgent'
                              ? 'bg-rose-900/30 text-rose-400'
                              : item.priority === 'low'
                              ? 'bg-stone-900/30 text-stone-400'
                              : 'bg-amber-900/30 text-amber-400'
                          }`}>
                            {item.priority}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'audits' && (
          <div className="py-12 text-center">
            <Star className="w-8 h-8 mx-auto text-stone-400 mb-2" />
            <p className="text-xs text-stone-500">Selecciona una auditoría para ver detalles</p>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-4">
            {/* Note Form */}
            <div className={`p-5 rounded-xl border ${
              darkMode ? 'bg-[#24211e] border-[#4a4036]' : 'bg-white border-[#dfd9cc]'
            }`}>
              <h3 className={`text-[11px] font-bold mb-3 ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                Nueva Nota
              </h3>
              <select
                value={selectedCallId || ''}
                onChange={(e) => setSelectedCallId(e.target.value || null)}
                className={`w-full border rounded-xl py-2 px-3 text-xs mb-3 focus:outline-none transition-all ${
                  darkMode
                    ? 'bg-[#1c1a18] border-[#3e382f] text-stone-200 focus:border-[#d4a373]'
                    : 'bg-[#fcfbf9] border-[#dfd9cc] text-stone-800 focus:border-[#d4a373]'
                }`}
              >
                <option value="">Selecciona una auditoría...</option>
                {contactCalls.map((call: any) => (
                  <option key={call.id} value={call.id}>
                    Auditoría - {new Date(call.created_at).toLocaleDateString()} {call.score ? `(${call.score}/10)` : ''}
                  </option>
                ))}
              </select>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Escribe tu nota aquí..."
                rows={3}
                className={`w-full border rounded-xl py-2 px-3 text-xs mb-3 focus:outline-none transition-all resize-none ${
                  darkMode
                    ? 'bg-[#1c1a18] border-[#3e382f] text-stone-200 placeholder-stone-500 focus:border-[#d4a373]'
                    : 'bg-[#fcfbf9] border-[#dfd9cc] text-stone-800 placeholder-stone-400 focus:border-[#d4a373]'
                }`}
              />
              <button
                onClick={handleAddNote}
                disabled={createNote.isPending || !selectedCallId || !noteText.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#faedcd] border border-[#d4a373] text-[#b57b54] hover:bg-[#ffeec2] font-bold rounded-xl transition-all text-xs cursor-pointer disabled:opacity-50"
              >
                {createNote.isPending ? (
                  <div className="w-4 h-4 border-2 border-[#b57b54]/30 border-t-[#b57b54] rounded-full animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                {createNote.isPending ? 'Guardando...' : 'Agregar Nota'}
              </button>
              {createNote.isError && (
                <p className="text-[10px] text-rose-500 mt-2">Error al guardar la nota</p>
              )}
            </div>

            {/* Notes List */}
            {notes.length === 0 ? (
              <div className="py-12 text-center">
                <MessageSquare className="w-8 h-8 mx-auto text-stone-400 mb-2" />
                <p className="text-xs text-stone-500">
                  {selectedCallId ? 'Sin notas para esta auditoría' : 'Selecciona una auditoría para ver notas'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {notes.map((note: any) => (
                  <div key={note.id} className={`p-3 rounded-xl border ${
                    darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'
                  }`}>
                    <div className="flex justify-between items-start">
                      <p className={`text-[11px] leading-relaxed ${darkMode ? 'text-stone-200' : 'text-stone-700'}`}>
                        {note.text}
                      </p>
                      <span className="text-[9px] text-stone-500 shrink-0 ml-2">
                        {new Date(note.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[9px] text-stone-500 mt-1">{note.supervisorName}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
