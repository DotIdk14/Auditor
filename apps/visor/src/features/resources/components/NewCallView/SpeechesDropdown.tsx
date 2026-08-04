import { useState } from 'react';
import {
  ChevronDown, Plus, Star, Pencil, Trash2, CheckCircle2, Circle,
} from 'lucide-react';
import { useCallStore } from '../../store/useCallStore';
import { renderScriptText } from '../../utils/renderScriptText';
import { blocksBySection } from '../../data/smartBlocks/index';
import { sectionMeta } from '../../data/sections/sectionMeta';
import { objectionReasons } from '../../data/defaultObjections';
import { PRINCIPLE_LABELS, PRINCIPLE_ICONS, TIMING_LABELS } from '../../types';
import type { SmartBlock, SectionMeta, ObjectionCategory, ObjectionResponse } from '../../types';

interface Props { darkMode: boolean; }

type Tab = 'sections' | 'custom' | 'objections';

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

export function SpeechesDropdown({ darkMode }: Props) {
  const {
    completedSpeeches, expandedSections, defaultSpeeches: defaults, callVariables,
    customSpeeches, toggleSection, toggleSpeech, setDefaultSpeech,
    openCreateSpeechModal, openEditSpeechModal, handleDeleteSpeech,
    usedResponses, callCostReason, getMergedObjections,
    toggleUsedResponse, openCreateObjectionModal, openEditObjectionModal, handleDeleteObjection,
  } = useCallStore();

  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<Tab>('sections');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

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
  const mergedObjections = getMergedObjections();
  const totalObjections = mergedObjections.reduce((acc, c) => acc + c.responses.length, 0);

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

  const renderObjectionResponse = (cat: ObjectionCategory, resp: ObjectionResponse) => {
    const isUsed = usedResponses.includes(resp.id);
    const isCustom = resp.isCustom === true;
    const isExpanded = expandedItem === resp.id;
    const container = `rounded-xl border-[2px] transition-all ${isCustom ? 'border-dashed ' : ''}${
      isUsed
        ? darkMode ? 'bg-emerald-950/15 border-emerald-800/30' : 'bg-emerald-50/60 border-emerald-200'
        : isCustom
          ? darkMode ? 'bg-[#24211e] border-amber-800/40' : 'bg-stone-50 border-amber-300'
          : darkMode ? 'bg-[#24211e] border-[#4a4036]' : 'bg-stone-50 border-stone-200'
    }`;

    return (
      <div key={resp.id} className={container}>
        <div className="flex items-center gap-2 p-2.5">
          <button onClick={() => toggleExpanded(resp.id)} className="flex-1 flex items-center gap-2 min-w-0 text-left">
            <span className="text-sm">{isCustom ? '✏️' : '💬'}</span>
            <p className={`text-[10px] font-bold font-display truncate ${isUsed ? 'line-through opacity-60 ' : ''}${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
              {resp.title}
            </p>
          </button>
          <div className="flex items-center gap-0.5 shrink-0">
            {isCustom && (
              <>
                <button onClick={() => openEditObjectionModal(cat.id, resp)}
                  className={`p-1 rounded-lg transition-all hover:scale-110 ${darkMode ? 'text-stone-500 hover:text-amber-400' : 'text-stone-400 hover:text-amber-600'}`}
                  title="Editar objeción"><Pencil className="w-3 h-3" /></button>
                <button onClick={() => handleDeleteObjection(cat.id, resp.id)}
                  className={`p-1 rounded-lg transition-all hover:scale-110 ${darkMode ? 'text-stone-500 hover:text-red-400' : 'text-stone-400 hover:text-red-600'}`}
                  title="Eliminar objeción"><Trash2 className="w-3 h-3" /></button>
              </>
            )}
            <button onClick={() => toggleUsedResponse(resp.id)}
              className={`p-1 rounded-lg transition-all hover:scale-110 ${isUsed ? 'text-emerald-500' : darkMode ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600'}`}
              title={isUsed ? 'Marcar como no usada' : 'Marcar como usada'}>
              {isUsed ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className={`px-3 pb-3 pt-2 border-t ${darkMode ? 'border-[#3e382f]' : 'border-stone-200'}`}>
            <div className={`text-[10px] leading-relaxed p-3 rounded-lg whitespace-pre-line ${
              isUsed
                ? darkMode ? 'bg-emerald-950/10 text-stone-500' : 'bg-emerald-50/40 text-stone-500'
                : darkMode ? 'bg-[#1c1a18] text-stone-400' : 'bg-white text-stone-600'
            }`}>
              {resp.content}
            </div>
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
            <button onClick={() => setTab('objections')} className={tabBtn(tab === 'objections')}>
              Objeciones ({totalObjections})
            </button>
          </div>

          {tab === 'sections' && (
            <div className="p-3 pt-0 space-y-2 max-h-[50vh] overflow-y-auto">
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

          {tab === 'objections' && (
            <div className="p-3 pt-0 space-y-2 max-h-[50vh] overflow-y-auto">
              {mergedObjections.map(cat => {
                const isExpanded = expandedSections.includes(`obj_${cat.id}`);
                const relevant = callCostReason ? (objectionReasons.find(r => r.id === callCostReason)?.matchedObjections.includes(cat.id) ?? false) : false;
                return (
                  <div key={cat.id} className={`rounded-xl border overflow-hidden ${
                    relevant
                      ? darkMode ? 'bg-amber-950/10 border-amber-800/30' : 'bg-amber-50/50 border-amber-200'
                      : darkMode ? 'bg-zinc-900/50 border-white/5' : 'bg-white/50 border-stone-200'
                  }`}>
                    <button onClick={() => toggleSection(`obj_${cat.id}`)}
                      className={`w-full flex items-center justify-between p-2.5 transition-all ${darkMode ? 'hover:bg-[#24211e]' : 'hover:bg-stone-50'}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span>{cat.icon}</span>
                        <span className={`text-[10px] font-bold font-display truncate ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>{cat.title}</span>
                        {relevant && <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${darkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-200 text-amber-700'}`}>Relevante</span>}
                        <span className={`text-[8px] font-bold shrink-0 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>{cat.responses.length}</span>
                      </div>
                      <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''} ${darkMode ? 'text-stone-500' : 'text-stone-400'}`} />
                    </button>
                    {isExpanded && (
                      <div className={`border-t p-2 space-y-2 ${darkMode ? 'border-[#3e382f]' : 'border-stone-200'}`}>
                        <div className={`text-[9px] italic p-2.5 rounded-lg ${darkMode ? 'bg-[#24211e] text-stone-400' : 'bg-stone-50 text-stone-500'}`}>
                          {cat.objection}
                        </div>
                        {cat.responses.map(resp => renderObjectionResponse(cat, resp))}
                        <button onClick={() => openCreateObjectionModal(cat.id)}
                          className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 border-dashed text-[9px] font-bold transition-all ${
                            darkMode ? 'border-[#4a4036] text-stone-500 hover:border-amber-800/40 hover:text-amber-400'
                            : 'border-stone-200 text-stone-400 hover:border-amber-300 hover:text-amber-600'
                          }`}>
                          <Plus className="w-3 h-3" /> Agregar objeción
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
