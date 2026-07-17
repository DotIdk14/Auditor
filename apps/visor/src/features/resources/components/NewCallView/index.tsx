import { CallSidebar } from './CallSidebar';
import { ConversationAssistantGPS } from './ConversationAssistantGPS';

interface Props { darkMode: boolean; }

export function NewCallView({ darkMode }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <CallSidebar darkMode={darkMode} />
      <div className="min-w-0">
        <ConversationAssistantGPS darkMode={darkMode} />
      </div>
    </div>
  );
}
