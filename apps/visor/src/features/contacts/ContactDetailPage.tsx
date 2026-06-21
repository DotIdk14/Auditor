import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { useContact, useContactCalls } from '../../hooks/useContacts';
import { ArrowLeft, Phone, Mail, Calendar, Clock, Star, MessageSquare, AlertCircle, Activity } from 'lucide-react';
import type { Contact } from '@auditor/shared-types';

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'activity' | 'audits' | 'notes'>('activity');

  const { data: contact, isLoading: contactLoading } = useContact(id || '');
  const { data: contactCalls = [] } = useContactCalls(id || '');

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
            {contactCalls.length === 0 ? (
              <div className="py-12 text-center">
                <Activity className="w-8 h-8 mx-auto text-stone-400 mb-2" />
                <p className="text-xs text-stone-500">Sin actividad registrada</p>
              </div>
            ) : (
              contactCalls.map((call: any) => (
                <div key={call.id} className={`p-4 rounded-xl border ${
                  darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-[11px] font-bold ${darkMode ? 'text-stone-200' : 'text-stone-700'}`}>
                      Auditoría - {new Date(call.created_at).toLocaleDateString()}
                    </span>
                    {call.score && (
                      <span className="text-[11px] font-bold text-emerald-500">{call.score}/10</span>
                    )}
                  </div>
                </div>
              ))
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
          <div className="py-12 text-center">
            <MessageSquare className="w-8 h-8 mx-auto text-stone-400 mb-2" />
            <p className="text-xs text-stone-500">Sin notas registradas</p>
          </div>
        )}
      </div>
    </div>
  );
}
