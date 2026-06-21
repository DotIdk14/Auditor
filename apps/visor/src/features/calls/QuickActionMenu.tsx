import { Headphones, PhoneForwarded, UserPlus, BarChart, StickyNote, PhoneCall, FolderHeart } from 'lucide-react';

interface Props {
  isAgent: boolean;
  darkMode: boolean;
  onNewAudit: () => void;
  onNewCall: () => void;
  onAddContact: () => void;
  onOpenMetrics: () => void;
}

export default function QuickActionMenu({ isAgent, darkMode, onNewAudit, onNewCall, onAddContact, onOpenMetrics }: Props) {
  const cardClass = `w-20 h-20 sm:w-24 sm:h-24 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 border-[3px] border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d] sm:shadow-[6px_6px_0px_#2d2d2d] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_#2d2d2d] group ${
    darkMode ? 'bg-[#1c1a18] text-stone-300 border-[#4a4036] shadow-[4px_4px_0px_#151311] hover:shadow-[8px_8px_0px_#151311] hover:text-white' : 'bg-white text-stone-700 hover:text-white'
  }`;

  const agentActions = [
    { icon: UserPlus, label: 'Contacto', onClick: onAddContact, hoverBg: 'hover:bg-rose-500', roundTL: true },
    { icon: StickyNote, label: 'Nota', onClick: () => {}, hoverBg: 'hover:bg-blue-500', roundTR: true },
    { icon: PhoneCall, label: 'Llamada', onClick: onNewCall, hoverBg: 'hover:bg-amber-500', roundBL: true },
    { icon: FolderHeart, label: 'Recursos', onClick: () => {}, hoverBg: 'hover:bg-emerald-500', roundBR: true },
  ];

  const managerActions = [
    { icon: Headphones, label: 'Auditar', onClick: onNewAudit, hoverBg: 'hover:bg-purple-500', roundTL: true },
    { icon: PhoneForwarded, label: 'Llamada', onClick: onNewCall, hoverBg: 'hover:bg-blue-500', roundTR: true },
    { icon: UserPlus, label: 'Contacto', onClick: onAddContact, hoverBg: 'hover:bg-amber-500', roundBL: true },
    { icon: BarChart, label: 'Métricas', onClick: onOpenMetrics, hoverBg: 'hover:bg-emerald-500', roundBR: true },
  ];

  const actions = isAgent ? agentActions : managerActions;

  return (
    <div className={`flex flex-col md:flex-row items-center justify-between gap-8 p-6 md:p-8 rounded-[2rem] border ${
      darkMode ? 'bg-stone-800 border-stone-700' : 'bg-stone-200 border-stone-300'
    }`}>
      <div className="flex-1 space-y-2 text-center md:text-left">
        <h1 className={`text-5xl md:text-6xl font-display tracking-tight leading-none ${darkMode ? 'text-white' : 'text-stone-900'}`}>
          ¿Qué haremos<br />hoy?
        </h1>
        <p className={`text-sm max-w-sm mt-3 mx-auto md:mx-0 font-medium ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
          Selecciona una acción rápida para comenzar a gestionar tus interacciones.
        </p>
      </div>

      <div className="flex flex-col gap-3 shrink-0">
        <div className="flex flex-row gap-3">
          {actions.slice(0, 2).map((action, i) => (
            <button key={i} onClick={action.onClick}
              className={`${cardClass} ${action.hoverBg} ${action.roundTL ? 'rounded-tl-[3rem]' : 'rounded-tr-[3rem]'} rounded-tr-[5px] rounded-bl-[5px] rounded-br-[5px]`}>
              <action.icon className="w-8 h-8 transition-colors" />
              <span className="text-[11px] font-ngaco tracking-[0.05em] uppercase text-center px-1 leading-tight">{action.label}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-row gap-3">
          {actions.slice(2, 4).map((action, i) => (
            <button key={i} onClick={action.onClick}
              className={`${cardClass} ${action.hoverBg} ${action.roundBL ? 'rounded-bl-[3rem]' : 'rounded-br-[3rem]'} rounded-tl-[5px] rounded-tr-[5px] rounded-br-[5px]`}>
              <action.icon className="w-8 h-8 transition-colors" />
              <span className="text-[11px] font-bold tracking-[0.05em] uppercase text-center px-1 leading-tight">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
