import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { useContact } from '../../hooks/useContacts';
import ContactDetailPanel from './ContactDetailPanel';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const navigate = useNavigate();
  const { isLoading } = useContact(id || '');

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#b57b54]/30 border-t-[#b57b54] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <button onClick={() => navigate('/contacts')}
        className={`flex items-center gap-1.5 text-[11px] font-bold m-5 mb-0 transition-colors ${
          darkMode ? 'text-stone-400 hover:text-stone-200' : 'text-stone-500 hover:text-stone-800'
        }`}>
        <ArrowLeft className="w-3.5 h-3.5" />
        Volver a contactos
      </button>
      <ContactDetailPanel
        contactId={id || null}
        darkMode={darkMode}
        onClose={() => navigate('/contacts')}
      />
    </div>
  );
}
