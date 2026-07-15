import { CallSidebar } from './CallSidebar';
import { ConversationAssistantGPS } from './ConversationAssistantGPS';

interface Props { darkMode: boolean; }

export function NewCallView({ darkMode }: Props) {
  return (
    <div className="flex flex-col lg:flex-row gap-4">
      <CallSidebar darkMode={darkMode} />
      <div className="flex-1 min-w-0">
        <ConversationAssistantGPS darkMode={darkMode} />
      </div>
    </div>
  );
}
