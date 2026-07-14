import { useCallStore } from '../../store/useCallStore';
import { CheckCircle2, XCircle } from 'lucide-react';

interface Props {
  darkMode: boolean;
  label: string;
  sublabel?: string;
}

export function InterestDecision({ darkMode, label, sublabel }: Props) {
  const { callInterestDecision, setCallInterestDecision, jumpToAcordar } = useCallStore();

  if (callInterestDecision === null) {
    return (
      <div className={`rounded-2xl border-[2px] p-4 ${darkMode ? 'bg-[#24211e] border-amber-800/30' : 'bg-amber-50/50 border-amber-200'}`}>
        <p className={`text-[11px] font-bold font-display mb-3 ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
          {label}
        </p>
        {sublabel && (
          <p className={`text-[9px] mb-4 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>{sublabel}</p>
        )}
        <div className="flex gap-3">
          <button onClick={() => { setCallInterestDecision('yes'); jumpToAcordar(); }}
            className="flex-1 py-3 rounded-xl bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-400 text-[11px] font-bold hover:bg-emerald-500/30 transition-all">
            SÍ — Le interesa
          </button>
          <button onClick={() => { setCallInterestDecision('no'); jumpToAcordar(); }}
            className="flex-1 py-3 rounded-xl bg-red-500/20 border-2 border-red-500/40 text-red-400 text-[11px] font-bold hover:bg-red-500/30 transition-all">
            NO — No le interesa
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl ${
      callInterestDecision === 'yes'
        ? darkMode ? 'bg-emerald-950/20 border border-emerald-800/30' : 'bg-emerald-50 border border-emerald-200'
        : darkMode ? 'bg-red-950/20 border border-red-800/30' : 'bg-red-50 border border-red-200'
    }`}>
      {callInterestDecision === 'yes' ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
      <div>
        <p className={`text-[10px] font-bold ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
          {callInterestDecision === 'yes' ? 'SÍ — Confirma interés' : 'NO — No le interesa'}
        </p>
        <p className={`text-[8px] mt-0.5 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>Saltado a Acordar</p>
      </div>
    </div>
  );
}
