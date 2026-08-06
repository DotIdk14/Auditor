import { useState } from 'react';
import {
  ChevronDown, Plus, Star, Pencil, Trash2, CheckCircle2, Circle,
} from 'lucide-react';
import { useCallStore } from '../../store/useCallStore';
import { renderScriptText } from '../../utils/renderScriptText';
import { blocksBySection } from '../../data/smartBlocks/index';
import { sectionMeta } from '../../data/sections/sectionMeta';
import { PRINCIPLE_LABELS, PRINCIPLE_ICONS, TIMING_LABELS } from '../../types';
import type { SmartBlock, SectionMeta } from '../../types';
import { useLearnedSpeeches } from '../../hooks/useLearnedSpeeches';
import { LearnedSpeechesPanel } from './LearnedSpeechesPanel';
import { findResumen } from '../../../cotizador/data/resumenesData';
import { getProgramSummary } from '../../../cotizador/data/summaries';

interface Props { darkMode: boolean; programName?: string; }

type Tab = 'sections' | 'custom' | 'learned';

interface SpeechItem {
  id: string;
  title: string;
  icon: string;
  content: string;
  sectionId: string;
  sectionTitle: string;
  isCustom: boolean;
  isSmartBlock: boolean;
  objective?: string;
  principle?: SmartBlock['principle'];
  timing?: SmartBlock['timing'];
  followUpQuestions?: string[];
  positiveSignals?: string[];
  negativeSignals?: string[];
}

function blockToItem(block: SmartBlock, section: SectionMeta): SpeechItem {
  return {
    id: block.id,
    title: block.title,
    icon: block.icon,
    content: block.versions.long,
    sectionId: section.id,
    sectionTitle: section.title,
    isCustom: false,
    isSmartBlock: true,
    objective: block.objective,
    principle: block.principle,
    timing: block.timing,
    followUpQuestions: block.followUpQuestions,
    positiveSignals: block.positiveSignals,
    negativeSignals: block.negativeSignals,
  };
}

function customToItem(speech: { id: string; title: string; content: string }, section: SectionMeta): SpeechItem {
  return {
    id: speech.id,
    title: speech.title,
    icon: '✏️',
    content: speech.content,
    sectionId: section.id,
    sectionTitle: section.title,
    isCustom: true,
    isSmartBlock: false,
  };
}

export function SpeechesDropdown({ darkMode, programName }: Props) {
  const {
    completedSpeeches, expandedSections, defaultSpeeches: defaults, callVariables,
    customSpeeches, toggleSection, toggleSpeech, setDefaultSpeech,
    openCreateSpeechModal, openEditSpeechModal, handleDeleteSpeech,
  } = useCallStore();

  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<Tab>('sections');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const { data: learnedData } = useLearnedSpeeches();
  const learnedCount = learnedData?.speeches?.length || 0;

  const sections = sectionMeta.map(section => {
    const builtins = (blocksBySection[section.id] || []).map(b => blockToItem(b, section));
    const customs = (customSpeeches[section.id] || []).map(s => customToItem(s, section));
    const defaultId = defaults[section.id];
    if (defaultId) {
      const idx = builtins.findIndex(i => i.id === defaultId);
      if (idx > 0) {
        const [def] = builtins.splice(idx, 1);
        builtins.unshift(def);
      }
    }
    return { section, builtins, customs };
  });

  const totalBuiltins = sections.reduce((acc, s) => acc + s.builtins.length, 0);
  const totalCustom = sections.reduce((acc, s) => acc + s.customs.length, 0);

  const toggleExpanded = (id: string) => setExpandedItem(prev => prev === id ? null : id);

  const renderItem = (item: SpeechItem, showSectionLabel = false) => {
    const isExpanded = expandedItem === item.id;
    const isCompleted = completedSpeeches.includes(item.id);
    const isDefault = defaults[item.sectionId] === item.id;
    const container = `rounded-xl border-[2px] transition-all ${item.isCustom ? 'border-dashed ' : ''}${
      isCompleted
        ? darkMode ? 'bg-emerald-950/15 border-emerald-800/30' : 'bg-emerald-50/60 border-emerald-200'
        : item.isCustom
          ? darkMode ? 'bg-[#24211e] border-amber-800/40' : 'bg-stone-50 border-amber-300'
          : darkMode ? 'bg-[#24211e] border-[#4a4036]' : 'bg-stone-50 border-stone-200'
    }`;

    return (
      <div key={item.id} className={container}>
        <div className="flex items-center gap-2 p-2.5">
          <button onClick={() => toggleExpanded(item.id)} className="flex-1 flex items-center gap-2 min-w-0 text-left">
            <span className="text-sm">{item.icon}</span>
            <div className="min-w-0">
              <p className={`text-[10px] font-bold font-display truncate ${isCompleted ? 'line-through opacity-60 ' : ''}${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                {item.title}
              </p>
              {showSectionLabel && (
                <p className={`text-[8px] truncate ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>{item.sectionTitle}</p>
              )}
            </div>
          </button>
          <div className="flex items-center gap-0.5 shrink-0">
            <button onClick={() => setDefaultSpeech(item.sectionId, item.id)}
              className={`p-1 rounded-lg transition-all hover:scale-110 ${isDefault ? 'text-yellow-500' : darkMode ? 'text-stone-500 hover:text-yellow-400' : 'text-stone-400 hover:text-yellow-500'}`}
              title={isDefault ? 'Quitar como predeterminado' : 'Marcar como predeterminado'}>
              <Star className={`w-3 h-3 ${isDefault ? 'fill-yellow-500' : ''}`} />
            </button>
            {item.isCustom && (
              <>
                <button onClick={() => openEditSpeechModal(item.sectionId, { id: item.id, title: item.title, content: item.content })}
                  className={`p-1 rounded-lg transition-all hover:scale-110 ${darkMode ? 'text-stone-500 hover:text-amber-400' : 'text-stone-400 hover:text-amber-600'}`}
                  title="Editar speech"><Pencil className="w-3 h-3" /></button>
                <button onClick={() => handleDeleteSpeech(item.sectionId, item.id)}
                  className={`p-1 rounded-lg transition-all hover:scale-110 ${darkMode ? 'text-stone-500 hover:text-red-400' : 'text-stone-400 hover:text-red-600'}`}
                  title="Eliminar speech"><Trash2 className="w-3 h-3" /></button>
              </>
            )}
            <button onClick={() => toggleSpeech(item.id)}
              className={`p-1 rounded-lg transition-all hover:scale-110 ${isCompleted ? 'text-emerald-500' : darkMode ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600'}`}
              title={isCompleted ? 'Marcar como pendiente' : 'Marcar como usado'}>
              {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className={`px-3 pb-3 pt-2 border-t ${darkMode ? 'border-[#3e382f]' : 'border-stone-200'}`}>
            {item.isSmartBlock && item.objective && (
              <p className={`text-[8px] font-bold mb-2 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                🎯 {item.objective}
              </p>
            )}
            <div className={`text-[10px] leading-relaxed p-3 rounded-lg whitespace-pre-line ${
              isCompleted
                ? darkMode ? 'bg-emerald-950/10 text-stone-500' : 'bg-emerald-50/40 text-stone-500'
                : darkMode ? 'bg-[#1c1a18] text-stone-400' : 'bg-white text-stone-600'
            }`}>
              {renderScriptText(item.content, darkMode, callVariables)}
            </div>
            {item.isSmartBlock && !isCompleted && (
              <div className="mt-2 space-y-1.5">
                {item.principle && (
                  <div className="flex flex-wrap gap-1">
                    <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                      {PRINCIPLE_ICONS[item.principle]} {PRINCIPLE_LABELS[item.principle]}
                    </span>
                    {item.timing && item.timing.length > 0 && (
                      <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
                        ⏰ {item.timing.map(t => TIMING_LABELS[t]).join(', ')}
                      </span>
                    )}
                  </div>
                )}
                {item.followUpQuestions && item.followUpQuestions.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className={`text-[7px] font-bold ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>❓</span>
                    {item.followUpQuestions.map((q, qi) => (
                      <span key={qi} className={`text-[7px] px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-cyan-900/20 text-cyan-400' : 'bg-cyan-50 text-cyan-700'}`}>{q}</span>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {item.positiveSignals && item.positiveSignals.length > 0 && (
                    <div className="flex flex-wrap gap-1 items-center">
                      <span className={`text-[7px] font-bold ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>✅</span>
                      {item.positiveSignals.map((s, si) => (
                        <span key={si} className={`text-[7px] px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-emerald-900/20 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>{s}</span>
                      ))}
                    </div>
                  )}
                  {item.negativeSignals && item.negativeSignals.length > 0 && (
                    <div className="flex flex-wrap gap-1 items-center">
                      <span className={`text-[7px] font-bold ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>⛔</span>
                      {item.negativeSignals.map((s, si) => (
                        <span key={si} className={`text-[7px] px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-700'}`}>{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const tabBtn = (active: boolean) => `flex-1 px-2 py-1.5 rounded-lg text-[9px] font-bold transition-all ${
    active
      ? darkMode ? 'bg-amber-900/40 text-amber-400' : 'bg-white text-[#b57b54] shadow-sm border border-[#dfd9cc]'
      : darkMode ? 'text-stone-500 hover:text-stone-300' : 'text-stone-500 hover:text-stone-800'
  }`;

  return (
    <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'}`}>
      <button onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between p-3 transition-all ${darkMode ? 'hover:bg-[#24211e]' : 'hover:bg-stone-50'}`}>
        <div className="flex items-center gap-2">
          <span className="text-sm">🗣️</span>
          <span className={`text-[10px] font-bold font-display ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>Speeches</span>
          <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
            {totalBuiltins + totalCustom}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''} ${darkMode ? 'text-stone-500' : 'text-stone-400'}`} />
      </button>

      {open && (
        <div className={`border-t ${darkMode ? 'border-[#3e382f]' : 'border-stone-200'}`}>
          <div className="flex gap-1 p-2">
            <button onClick={() => setTab('sections')} className={tabBtn(tab === 'sections')}>
              Speeches ({totalBuiltins})
            </button>
            <button onClick={() => setTab('custom')} className={tabBtn(tab === 'custom')}>
              Personalizados ({totalCustom})
            </button>
            <button onClick={() => setTab('learned')} className={tabBtn(tab === 'learned')}>
              IA Top ventas ({learnedCount})
            </button>
          </div>

          {tab === 'sections' && (
            <div className="p-3 pt-0 space-y-2 max-h-[50vh] overflow-y-auto">
              {programName && (
                <div className={`rounded-xl border p-3 ${darkMode ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-emerald-50 border-emerald-200'}`}>
                  <p className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                    ✨ Recomendadas para este programa
                  </p>
                  <p className={`text-[9px] font-bold mb-1 ${darkMode ? 'text-stone-200' : 'text-stone-700'}`}>
                    {programName}
                  </p>
                  <p className={`text-[9px] leading-relaxed mb-2 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                    {(() => {
                      const res = findResumen(programName);
                      const hook = res?.secciones?.["1_EL_GANCHO"];
                      return hook || getProgramSummary(programName) || '';
                    })()}
                  </p>
                  {(() => {
                    const keywords = programName.toLowerCase().split(' ').filter(w => w.length > 3);
                    const matched = sections.flatMap(s =>
                      s.builtins.filter(item => {
                        const haystack = `${item.title} ${item.content} ${item.sectionTitle}`.toLowerCase();
                        return keywords.some(k => haystack.includes(k));
                      })
                    ).slice(0, 4);
                    return matched.length > 0 ? (
                      <div className="space-y-1.5">
                        <p className={`text-[8px] font-bold ${darkMode ? 'text-emerald-500' : 'text-emerald-600'}`}>
                          Speeches alineados al tema:
                        </p>
                        {matched.map(item => (
                          <div key={item.id}
                            onClick={() => toggleExpanded(item.id)}
                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border cursor-pointer ${
                              darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-stone-200'
                            }`}>
                            <span className="text-sm">{item.icon}</span>
                            <div className="min-w-0 flex-1">
                              <p className={`text-[9px] font-bold truncate ${darkMode ? 'text-stone-200' : 'text-stone-700'}`}>
                                {item.title}
                              </p>
                              <p className={`text-[7px] truncate ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                                {item.sectionTitle}
                              </p>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleSpeech(item.id); }}
                              className={`p-1 rounded-lg hover:scale-110 transition-all ${
                                completedSpeeches.includes(item.id) ? 'text-emerald-500' : darkMode ? 'text-stone-500' : 'text-stone-400'
                              }`}
                            >
                              {completedSpeeches.includes(item.id)
                                ? <CheckCircle2 className="w-3 h-3" />
                                : <Circle className="w-3 h-3" />}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
              {sections.map(({ section, builtins }) => {
                const isExpanded = expandedSections.includes(section.id);
                return (
                  <div key={section.id} className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-zinc-900/50 border-white/5' : 'bg-white/50 border-stone-200'}`}>
                    <button onClick={() => toggleSection(section.id)}
                      className={`w-full flex items-center justify-between p-2.5 transition-all ${darkMode ? 'hover:bg-[#24211e]' : 'hover:bg-stone-50'}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span>{section.icon}</span>
                        <span className={`text-[10px] font-bold font-display truncate ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>{section.title}</span>
                        <span className={`text-[8px] font-bold shrink-0 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>{builtins.length}</span>
                      </div>
                      <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''} ${darkMode ? 'text-stone-500' : 'text-stone-400'}`} />
                    </button>
                    {isExpanded && (
                      <div className={`border-t p-2 space-y-2 ${darkMode ? 'border-[#3e382f]' : 'border-stone-200'}`}>
                        {builtins.length === 0 ? (
                          <p className={`text-[9px] text-center py-3 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                            Sin speeches en esta sección.
                          </p>
                        ) : (
                          builtins.map(item => renderItem(item))
                        )}
                        <button onClick={() => openCreateSpeechModal(section.id)}
                          className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 border-dashed text-[9px] font-bold transition-all ${
                            darkMode ? 'border-[#4a4036] text-stone-500 hover:border-amber-800/40 hover:text-amber-400'
                            : 'border-stone-200 text-stone-400 hover:border-amber-300 hover:text-amber-600'
                          }`}>
                          <Plus className="w-3 h-3" /> Agregar speech
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'custom' && (
            <div className="p-3 pt-0 space-y-3 max-h-[50vh] overflow-y-auto">
              {totalCustom === 0 ? (
                <p className={`text-[10px] text-center py-6 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                  Aún no hay speeches personalizados.
                </p>
              ) : (
                sections.filter(s => s.customs.length > 0).map(({ section, customs }) => (
                  <div key={section.id}>
                    <p className={`text-[9px] font-bold mb-1.5 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                      {section.icon} {section.title}
                    </p>
                    <div className="space-y-2">
                      {customs.map(item => renderItem(item, true))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'learned' && (
            <LearnedSpeechesPanel darkMode={darkMode} />
          )}
        </div>
      )}
    </div>
  );
}
