import { useState } from 'react';
import type { FlowRecommendation } from '../../../data/engine/flowEngine';
import type { ProspectProfile, Motivation, PainPoint } from '../../../types';
import { BulletScriptPanel } from '../cards/BulletScriptPanel';
import { ProfileBuilder } from '../cards/ProfileBuilder';
import { profileToSpeechVars } from '../../../utils/profileToSpeechVars';

interface Props {
  recommendations: FlowRecommendation[];
  darkMode: boolean;
  callVariables: Record<string, string>;
  profile: ProspectProfile;
  onUpdate: (updates: Partial<ProspectProfile>) => void;
  onUpdateSituation: (updates: Partial<ProspectProfile['situation']>) => void;
  onToggleMotivation: (m: Motivation) => void;
  onTogglePain: (p: PainPoint) => void;
}

const SONDEO_TABS = [
  { id: 'motivacion', label: 'Motivación', icon: '🎯', blockIds: ['sondeo_motivacion'] },
  { id: 'situacion', label: 'Situación', icon: '🏠', blockIds: ['sondeo_situacion'] },
  { id: 'dolor-futuro', label: 'Dolor + Futuro', icon: '🔴', blockIds: ['sondeo_dolor', 'sondeo_futuro', 'sondeo_perfil_completo'] },
];

const TAB_TO_SECTION: Record<string, 'motivacion' | 'situacion' | 'dolor-futuro'> = {
  motivacion: 'motivacion',
  situacion: 'situacion',
  'dolor-futuro': 'dolor-futuro',
};

export function SondeoSection({
  recommendations, darkMode, callVariables, profile,
  onUpdate, onUpdateSituation, onToggleMotivation, onTogglePain,
}: Props) {
  const [activeTab, setActiveTab] = useState('motivacion');

  const mergedVars = { ...callVariables, ...profileToSpeechVars(profile) };
  const profileSection = TAB_TO_SECTION[activeTab] ?? undefined;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left column: Scripts with bullet tabs */}
      <div className="lg:col-span-2 space-y-4">
        <BulletScriptPanel
          tabs={SONDEO_TABS}
          recommendations={recommendations}
          darkMode={darkMode}
          callVariables={mergedVars}
          onTabChange={setActiveTab}
        />
      </div>

      {/* Right column: Prospect metadata */}
      <div className="space-y-3 sticky top-4 self-start max-h-[calc(100vh-12rem)] overflow-y-auto">
        <ProfileBuilder
          profile={profile}
          darkMode={darkMode}
          onUpdate={onUpdate}
          onUpdateSituation={onUpdateSituation}
          onToggleMotivation={onToggleMotivation}
          onTogglePain={onTogglePain}
          section={profileSection}
        />
      </div>
    </div>
  );
}
