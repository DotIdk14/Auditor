import { SpeechesDropdown } from './SpeechesDropdown';
import { CotizadorModule } from '../../../cotizador/CotizadorModule';

interface Props { darkMode: boolean; }

export function NewCallView({ darkMode }: Props) {
  return (
    <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-stone-200'}`}>
      <CotizadorModule darkMode={darkMode} speechesPanel={<SpeechesDropdown darkMode={darkMode} />} />
    </div>
  );
}
