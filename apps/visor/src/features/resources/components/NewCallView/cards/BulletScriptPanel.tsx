import { useState, type ReactNode } from 'react';
import type { FlowRecommendation } from '../../../data/engine/flowEngine';
import { renderScriptText } from '../../../utils/renderScriptText';

interface BulletConfig {
  id: string;
  label: string;
  icon: string;
  blockIds: string[];
}

interface CustomPill {
  id: string;
  label: string;
  icon: string;
  render: (darkMode: boolean, callVariables: Record<string, string>) => ReactNode;
}

interface Props {
  tabs: BulletConfig[];
  recommendations: FlowRecommendation[];
  darkMode: boolean;
  callVariables: Record<string, string>;
  customPills?: CustomPill[];
  afterSpeech?: (blockId: string, darkMode: boolean) => ReactNode;
  onTabChange?: (tabId: string) => void;
}

export function BulletScriptPanel({ tabs, recommendations, darkMode, callVariables, customPills, afterSpeech, onTabChange }: Props) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? '');
  const [activeBullet, setActiveBullet] = useState<string | null>(null);

  const tab = tabs.find(t => t.id === activeTab) ?? tabs[0];
  const filtered = recommendations.filter(r =>
    tab ? tab.blockIds.includes(r.block.id) || r.block.id.startsWith('custom_') : true
  );

  const tabCustoms = customPills?.filter(p => p.id.startsWith(`${tab.id}_`) || p.id === '_demo_virtual') ?? [];

  const pills = [
    ...filtered.map(r => ({ type: 'block' as const, id: r.block.id, icon: r.block.icon, label: r.block.title })),
    ...tabCustoms.map(c => ({ type: 'custom' as const, id: c.id, icon: c.icon, label: c.label })),
  ];

  const activeRec = filtered.length > 0
    ? filtered.find(r => r.block.id === activeBullet) ?? filtered[0]
    : null;
  const activeCustom = tabCustoms.find(c => c.id === activeBullet);

  if (!activeBullet && pills.length > 0) {
    setActiveBullet(pills[0].id);
  }

  return (
    <div className={`rounded-xl border p-5 ${darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-stone-200'}`}>
      {/* Tab bar */}
      <div className="flex gap-1 mb-4 border-b pb-2 overflow-x-auto" style={{ borderColor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
        {tabs.map(t => {
          const isActive = activeTab === t.id;
          return (
            <button key={t.id} onClick={() => { setActiveTab(t.id); setActiveBullet(null); onTabChange?.(t.id); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                isActive
                  ? darkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-100 text-amber-700'
                  : darkMode ? 'text-stone-500 hover:text-stone-300 hover:bg-white/5' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'
              }`}>
              <span className="text-sm">{t.icon}</span>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Bullet pills row */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {pills.map(pill => {
          const isActive = activeBullet === pill.id;
          return (
            <button key={pill.id} onClick={() => setActiveBullet(pill.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                isActive
                  ? darkMode ? 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30' : 'bg-amber-100 text-amber-700 ring-1 ring-amber-300'
                  : darkMode ? 'bg-white/5 text-stone-400 hover:bg-white/10 hover:text-stone-200' : 'bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-700'
              }`}>
              <span className="text-sm">{pill.icon}</span>
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* Speech text */}
      <div className={`text-[12px] leading-relaxed p-4 rounded-xl whitespace-pre-line ${
        darkMode ? 'bg-black/30 text-stone-300' : 'bg-stone-50 text-stone-700'
      }`}>
        {pills.length === 0 ? (
          <p className={`text-[11px] text-center ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
            No hay scripts disponibles para esta categoría.
          </p>
        ) : activeCustom ? (
          activeCustom.render(darkMode, callVariables)
        ) : activeRec ? (
          <>
            {renderScriptText(activeRec.block.versions.long, darkMode, callVariables)}
            {afterSpeech?.(activeRec.block.id, darkMode)}
          </>
        ) : null}
      </div>
    </div>
  );
}
