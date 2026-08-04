import { SpeechesDropdown } from './SpeechesDropdown';

interface Props { darkMode: boolean; }

const COTIZADOR_URL = 'https://cotizador-idk.vercel.app/';

export function NewCallView({ darkMode }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
      <div className="lg:col-span-1 min-w-0 max-h-[calc(100vh-11rem)] overflow-y-auto pr-1 lg:sticky lg:top-2">
        <SpeechesDropdown darkMode={darkMode} />
      </div>
      <div className="lg:col-span-2 min-w-0">
        <div className={`rounded-xl border overflow-hidden h-[calc(100vh-11rem)] lg:sticky lg:top-2 ${darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-stone-200'}`}>
          <iframe
            src={COTIZADOR_URL}
            title="Cotizador"
            className="w-full h-full border-0"
            allow="clipboard-write"
          />
        </div>
      </div>
    </div>
  );
}
