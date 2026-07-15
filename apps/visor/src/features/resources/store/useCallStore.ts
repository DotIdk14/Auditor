import { create } from 'zustand';
import type {
  CallStep, Speech, ObjectionResponse, ObjectionCategory, SafeCheckItem, CallNote,
  ActiveTab, CostDecision, ProspectProfile, ValueCheckItem, Motivation, PainPoint,
} from '../types';
import { DEFAULT_PROSPECT_PROFILE, DEFAULT_VALUE_CHECKLIST } from '../types';
import { defaultSpeechSections } from '../data/defaultSpeeches';
import { defaultObjectionCategories } from '../data/defaultObjections';
import { DEFAULT_CALL_STEPS } from '../data/callSteps';
import { generateTags } from '../data/profile/profileEngine';
import {
  getCustomSpeeches, saveCustomSpeeches,
  getCustomObjections, saveCustomObjections,
  getDefaultSpeeches, saveDefaultSpeeches,
  getCallSteps, saveCallSteps,
  getPersistedNotes, getPersistedVariables, getPersistedChecklist,
} from '../utils/localStorage';

interface CallState {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  callSteps: CallStep[];
  currentCallStep: number;
  callCostStep: number;
  callCostDecision: CostDecision;
  callCostReason: string | null;
  visitedSteps: Set<number>;
  showDemoInvite: boolean;
  callInterestDecision: CostDecision;
  callVariables: Record<string, string>;
  showVarsPanel: boolean;

  customSpeeches: Record<string, Speech[]>;
  defaultSpeeches: Record<string, string>;
  customObjections: Record<string, ObjectionResponse[]>;
  completedSpeeches: string[];
  usedResponses: string[];
  expandedSections: string[];

  notes: CallNote[];
  currentNote: string;
  showNotesDrawer: boolean;

  safeChecklist: SafeCheckItem[];
  profileTags: { trabaja: boolean; tieneHijos: boolean; preocupadoCostos: boolean };

  showSpeechModal: boolean;
  editingSpeech: { sectionId: string; speech: Speech } | null;
  speechForm: { title: string; content: string };
  showObjectionModal: boolean;
  editingObjection: { categoryId: string; response: ObjectionResponse } | null;
  objectionForm: { title: string; content: string };
  showAddStepModal: boolean;
  addStepForm: { title: string; content: string; objectionCategoryId: string };
  addStepMode: 'text' | 'objection';
  showNoteModal: boolean;
  noteContent: string;

  goToNextCallStep: () => void;
  goToPrevCallStep: () => void;
  skipCurrentCallStep: () => void;
  resetCall: () => void;
  jumpToAcordar: () => void;
  moveCallStep: (fromIdx: number, direction: 'up' | 'down') => void;
  removeCallStep: (idx: number) => void;
  addCustomStep: () => void;

  toggleSpeech: (id: string) => void;
  toggleUsedResponse: (id: string) => void;
  toggleSection: (sectionId: string) => void;
  setDefaultSpeech: (sectionId: string, speechId: string) => void;
  setCallVariables: (updater: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  setShowVarsPanel: (v: boolean | ((prev: boolean) => boolean)) => void;
  setShowDemoInvite: (v: boolean) => void;

  openCreateSpeechModal: (sectionId: string) => void;
  openEditSpeechModal: (sectionId: string, speech: Speech) => void;
  handleSaveSpeech: () => void;
  handleDeleteSpeech: (sectionId: string, speechId: string) => void;

  openCreateObjectionModal: (categoryId: string) => void;
  openEditObjectionModal: (categoryId: string, response: ObjectionResponse) => void;
  handleSaveObjection: () => void;
  handleDeleteObjection: (categoryId: string, responseId: string) => void;

  setCallCostStep: (v: number) => void;
  setCallCostDecision: (v: CostDecision) => void;
  setCallCostReason: (v: string | null) => void;
  setCallInterestDecision: (v: CostDecision) => void;

  addNote: (content: string) => void;
  deleteNote: (id: string) => void;
  setCurrentNote: (v: string) => void;
  setShowNotesDrawer: (v: boolean) => void;
  setShowNoteModal: (v: boolean) => void;
  setNoteContent: (v: string) => void;

  toggleSafeCheck: (id: string) => void;
  toggleProfileTag: (key: 'trabaja' | 'tieneHijos' | 'preocupadoCostos') => void;

  setShowAddStepModal: (v: boolean) => void;
  setAddStepForm: (v: { title: string; content: string; objectionCategoryId: string }) => void;
  setAddStepMode: (v: 'text' | 'objection') => void;
  setEditingSpeech: (v: { sectionId: string; speech: Speech } | null) => void;
  setSpeechForm: (v: { title: string; content: string }) => void;
  setEditingObjection: (v: { categoryId: string; response: ObjectionResponse } | null) => void;
  setObjectionForm: (v: { title: string; content: string }) => void;

  resetAll: () => void;

  getMergedObjections: () => ObjectionCategory[];
  getSectionSpeeches: (sectionId: string) => Speech[];
  getAllSectionsMerged: () => (typeof defaultSpeechSections[number] & { speeches: Speech[] })[];
  getCallProgress: () => number;
  getSafeCallStep: () => CallStep;

  // ─── GPS STATE ─────────────────────────────────────────
  profile: ProspectProfile;
  updateProfile: (updates: Partial<ProspectProfile>) => void;
  updateProfileSituation: (updates: Partial<ProspectProfile['situation']>) => void;
  toggleMotivation: (m: Motivation) => void;
  togglePainPoint: (p: PainPoint) => void;
  regenerateTags: () => void;

  usedBlockIds: string[];
  markBlockUsed: (blockId: string) => void;
  markBlockSignal: (blockId: string, signal: 'positive' | 'negative') => void;
  blockSignals: Record<string, 'positive' | 'negative'>;

  valueChecklist: ValueCheckItem[];
  toggleValueCheck: (id: string) => void;

  callCostReasonGPS: string | null;
  setCallCostReasonGPS: (v: string | null) => void;

  convictionLevel: number | null;
  setConvictionLevel: (v: number | null) => void;
}

const DEFAULT_SAFE_CHECKLIST: SafeCheckItem[] = [
  { id: 'certificado', label: 'Certificado', checked: false },
  { id: 'tiempo', label: 'Tiempo disponible', checked: false },
  { id: 'motivacion', label: 'Motivación', checked: false },
  { id: 'nombre', label: 'Nombre', checked: false },
  { id: 'carrera', label: 'Carrera', checked: false },
];

export const useCallStore = create<CallState>((set, get) => ({
  activeTab: 'speeches',
  setActiveTab: (tab) => set({ activeTab: tab }),

  callSteps: getCallSteps() || [...DEFAULT_CALL_STEPS],
  currentCallStep: 0,
  callCostStep: 0,
  callCostDecision: null,
  callCostReason: null,
  visitedSteps: new Set([0]),
  showDemoInvite: false,
  callInterestDecision: null,
  callVariables: getPersistedVariables(),
  showVarsPanel: false,

  customSpeeches: getCustomSpeeches(),
  defaultSpeeches: getDefaultSpeeches(),
  customObjections: getCustomObjections(),
  completedSpeeches: (() => { try { return JSON.parse(localStorage.getItem('completedSpeeches') || '[]'); } catch { return []; } })(),
  usedResponses: (() => { try { return JSON.parse(localStorage.getItem('usedResponses') || '[]'); } catch { return []; } })(),
  expandedSections: [],

  notes: getPersistedNotes(),
  currentNote: '',
  showNotesDrawer: false,

  safeChecklist: getPersistedChecklist() || DEFAULT_SAFE_CHECKLIST,
  profileTags: { trabaja: false, tieneHijos: false, preocupadoCostos: false },

  showSpeechModal: false,
  editingSpeech: null,
  speechForm: { title: '', content: '' },
  showObjectionModal: false,
  editingObjection: null,
  objectionForm: { title: '', content: '' },
  showAddStepModal: false,
  addStepForm: { title: '', content: '', objectionCategoryId: '' },
  addStepMode: 'text',
  showNoteModal: false,
  noteContent: '',

  goToNextCallStep: () => {
    const { currentCallStep, callSteps } = get();
    if (currentCallStep < callSteps.length - 1) {
      set(s => ({
        visitedSteps: new Set([...s.visitedSteps, s.currentCallStep]),
        currentCallStep: s.currentCallStep + 1,
        callCostStep: 0,
        showDemoInvite: false,
      }));
    }
  },

  goToPrevCallStep: () => {
    const { currentCallStep } = get();
    if (currentCallStep > 0) {
      set(s => ({
        visitedSteps: new Set([...s.visitedSteps, s.currentCallStep]),
        currentCallStep: s.currentCallStep - 1,
        callCostStep: 0,
        showDemoInvite: false,
      }));
    }
  },

  skipCurrentCallStep: () => {
    const { currentCallStep } = get();
    set(s => ({
      callSteps: s.callSteps.map((step, i) => i === s.currentCallStep ? { ...step, skipped: true } : step),
    }));
    get().goToNextCallStep();
  },

  resetCall: () => {
    set({
      callSteps: [...DEFAULT_CALL_STEPS],
      currentCallStep: 0,
      callCostStep: 0,
      callCostDecision: null,
      callCostReason: null,
      visitedSteps: new Set([0]),
      showDemoInvite: false,
      callInterestDecision: null,
      profile: { ...DEFAULT_PROSPECT_PROFILE },
      usedBlockIds: [],
      blockSignals: {},
      valueChecklist: [...DEFAULT_VALUE_CHECKLIST],
      callCostReasonGPS: null,
      convictionLevel: null,
    });
  },

  jumpToAcordar: () => {
    const { callSteps, currentCallStep } = get();
    const acordarIdx = callSteps.findIndex(s => s.type === 'section' && s.sectionId === 'acordar');
    if (acordarIdx >= 0) {
      set(s => ({
        visitedSteps: new Set([...s.visitedSteps, s.currentCallStep]),
        currentCallStep: acordarIdx,
        callCostStep: 0,
        showDemoInvite: false,
      }));
    }
  },

  moveCallStep: (fromIdx, direction) => {
    const toIdx = direction === 'up' ? fromIdx - 1 : fromIdx + 1;
    const { callSteps, currentCallStep } = get();
    if (toIdx < 0 || toIdx >= callSteps.length) return;
    const next = [...callSteps];
    [next[fromIdx], next[toIdx]] = [next[toIdx], next[fromIdx]];
    const updates: Partial<CallState> = { callSteps: next };
    if (currentCallStep === fromIdx) updates.currentCallStep = toIdx;
    else if (currentCallStep === toIdx) updates.currentCallStep = fromIdx;
    set(updates);
  },

  removeCallStep: (idx) => {
    const { currentCallStep } = get();
    set(s => ({
      callSteps: s.callSteps.filter((_, i) => i !== idx),
      currentCallStep: currentCallStep >= idx && currentCallStep > 0 ? currentCallStep - 1 : currentCallStep,
    }));
  },

  addCustomStep: () => {
    const { addStepMode, addStepForm, currentCallStep } = get();
    if (addStepMode === 'text') {
      if (!addStepForm.title.trim() || !addStepForm.content.trim()) return;
      const newStep: CallStep = {
        id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type: 'custom', title: addStepForm.title, content: addStepForm.content, customType: 'text',
      };
      const insertIdx = currentCallStep + 1;
      set(s => ({ callSteps: [...s.callSteps.slice(0, insertIdx), newStep, ...s.callSteps.slice(insertIdx)] }));
    } else {
      if (!addStepForm.objectionCategoryId || !addStepForm.content.trim()) return;
      const cat = defaultObjectionCategories.find(c => c.id === addStepForm.objectionCategoryId);
      const newStep: CallStep = {
        id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type: 'custom', title: addStepForm.title || `Objeción: ${cat?.title || ''}`,
        content: addStepForm.content, customType: 'objection',
      };
      const insertIdx = currentCallStep + 1;
      set(s => ({ callSteps: [...s.callSteps.slice(0, insertIdx), newStep, ...s.callSteps.slice(insertIdx)] }));
    }
    set({ showAddStepModal: false, addStepForm: { title: '', content: '', objectionCategoryId: '' } });
  },

  toggleSpeech: (id) => {
    set(s => ({
      completedSpeeches: s.completedSpeeches.includes(id)
        ? s.completedSpeeches.filter(x => x !== id)
        : [...s.completedSpeeches, id],
    }));
    localStorage.setItem('completedSpeeches', JSON.stringify(
      get().completedSpeeches
    ));
  },

  toggleUsedResponse: (id) => {
    set(s => ({
      usedResponses: s.usedResponses.includes(id)
        ? s.usedResponses.filter(x => x !== id)
        : [...s.usedResponses, id],
    }));
    localStorage.setItem('usedResponses', JSON.stringify(get().usedResponses));
  },

  toggleSection: (sectionId) => {
    set(s => ({
      expandedSections: s.expandedSections.includes(sectionId)
        ? s.expandedSections.filter(x => x !== sectionId)
        : [...s.expandedSections, sectionId],
    }));
  },

  setDefaultSpeech: (sectionId, speechId) => {
    set(s => {
      const updated = { ...s.defaultSpeeches };
      if (updated[sectionId] === speechId) delete updated[sectionId];
      else updated[sectionId] = speechId;
      saveDefaultSpeeches(updated);
      return { defaultSpeeches: updated };
    });
  },

  setCallVariables: (updater) => {
    set(s => {
      const newVars = typeof updater === 'function' ? updater(s.callVariables) : updater;
      localStorage.setItem('callVariables', JSON.stringify(newVars));
      return { callVariables: newVars };
    });
  },

  setShowVarsPanel: (v) => set(s => ({ showVarsPanel: typeof v === 'function' ? v(s.showVarsPanel) : v })),
  setShowDemoInvite: (v) => set({ showDemoInvite: v }),

  openCreateSpeechModal: (sectionId) => {
    set({
      editingSpeech: { sectionId, speech: { id: '', title: '', content: '' } },
      speechForm: { title: '', content: '' },
      showSpeechModal: true,
    });
  },

  openEditSpeechModal: (sectionId, speech) => {
    set({
      editingSpeech: { sectionId, speech },
      speechForm: { title: speech.title, content: speech.content },
      showSpeechModal: true,
    });
  },

  handleSaveSpeech: () => {
    const { editingSpeech, speechForm, customSpeeches } = get();
    if (!editingSpeech || !speechForm.title.trim() || !speechForm.content.trim()) return;
    const { sectionId, speech } = editingSpeech;
    const updated = { ...customSpeeches };
    if (speech.id && speech.isCustom) {
      updated[sectionId] = (updated[sectionId] || []).map(s =>
        s.id === speech.id ? { ...s, title: speechForm.title, content: speechForm.content } : s
      );
    } else {
      const newSpeech: Speech = {
        id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title: speechForm.title, content: speechForm.content, isCustom: true,
      };
      updated[sectionId] = [...(updated[sectionId] || []), newSpeech];
    }
    saveCustomSpeeches(updated);
    set({ customSpeeches: updated, showSpeechModal: false, editingSpeech: null, speechForm: { title: '', content: '' } });
  },

  handleDeleteSpeech: (sectionId, speechId) => {
    const updated = { ...get().customSpeeches };
    updated[sectionId] = (updated[sectionId] || []).filter(s => s.id !== speechId);
    saveCustomSpeeches(updated);
    set(s => ({
      customSpeeches: updated,
      completedSpeeches: s.completedSpeeches.filter(id => id !== speechId),
    }));
  },

  openCreateObjectionModal: (categoryId) => {
    set({
      editingObjection: { categoryId, response: { id: '', title: '', content: '' } },
      objectionForm: { title: '', content: '' },
      showObjectionModal: true,
    });
  },

  openEditObjectionModal: (categoryId, response) => {
    set({
      editingObjection: { categoryId, response },
      objectionForm: { title: response.title, content: response.content },
      showObjectionModal: true,
    });
  },

  handleSaveObjection: () => {
    const { editingObjection, objectionForm, customObjections } = get();
    if (!editingObjection || !objectionForm.title.trim() || !objectionForm.content.trim()) return;
    const { categoryId, response } = editingObjection;
    const updated = { ...customObjections };
    if (response.id && response.isCustom) {
      updated[categoryId] = (updated[categoryId] || []).map(r =>
        r.id === response.id ? { ...r, title: objectionForm.title, content: objectionForm.content } : r
      );
    } else {
      const newResponse: ObjectionResponse = {
        id: `custom_obj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title: objectionForm.title, content: objectionForm.content, isCustom: true,
      };
      updated[categoryId] = [...(updated[categoryId] || []), newResponse];
    }
    saveCustomObjections(updated);
    set({ customObjections: updated, showObjectionModal: false, editingObjection: null, objectionForm: { title: '', content: '' } });
  },

  handleDeleteObjection: (categoryId, responseId) => {
    const updated = { ...get().customObjections };
    updated[categoryId] = (updated[categoryId] || []).filter(r => r.id !== responseId);
    saveCustomObjections(updated);
    set(s => ({
      customObjections: updated,
      usedResponses: s.usedResponses.filter(id => id !== responseId),
    }));
  },

  setCallCostStep: (v) => set({ callCostStep: v }),
  setCallCostDecision: (v) => set({ callCostDecision: v }),
  setCallCostReason: (v) => set({ callCostReason: v }),
  setCallInterestDecision: (v) => set({ callInterestDecision: v }),

  addNote: (content) => {
    const newNote: CallNote = { id: Date.now().toString(), content: content.trim(), timestamp: Date.now() };
    set(s => {
      const updated = [newNote, ...s.notes];
      localStorage.setItem('callNotes', JSON.stringify(updated));
      return { notes: updated, currentNote: '' };
    });
  },

  deleteNote: (id) => {
    set(s => {
      const updated = s.notes.filter(n => n.id !== id);
      localStorage.setItem('callNotes', JSON.stringify(updated));
      return { notes: updated };
    });
  },

  setCurrentNote: (v) => set({ currentNote: v }),
  setShowNotesDrawer: (v) => set({ showNotesDrawer: v }),
  setShowNoteModal: (v) => set({ showNoteModal: v }),
  setNoteContent: (v) => set({ noteContent: v }),

  toggleSafeCheck: (id) => {
    set(s => {
      const updated = s.safeChecklist.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      );
      localStorage.setItem('safeChecklist', JSON.stringify(updated));
      return { safeChecklist: updated };
    });
  },

  toggleProfileTag: (key) => {
    set(s => ({
      profileTags: { ...s.profileTags, [key]: !s.profileTags[key] },
    }));
  },

  setShowAddStepModal: (v) => set({ showAddStepModal: v }),
  setAddStepForm: (v) => set({ addStepForm: v }),
  setAddStepMode: (v) => set({ addStepMode: v }),
  setEditingSpeech: (v) => set({ editingSpeech: v }),
  setSpeechForm: (v) => set({ speechForm: v }),
  setEditingObjection: (v) => set({ editingObjection: v }),
  setObjectionForm: (v) => set({ objectionForm: v }),

  resetAll: () => {
    set({ completedSpeeches: [], usedResponses: [] });
    localStorage.setItem('completedSpeeches', '[]');
    localStorage.setItem('usedResponses', '[]');
  },

  getMergedObjections: () => {
    const { customObjections } = get();
    return defaultObjectionCategories.map(cat => ({
      ...cat,
      responses: [
        ...cat.responses,
        ...(customObjections[cat.id] || []).map(r => ({ ...r, isCustom: true })),
      ],
    }));
  },

  getSectionSpeeches: (sectionId) => {
    const { customSpeeches } = get();
    const section = defaultSpeechSections.find(s => s.id === sectionId);
    if (!section) return [];
    return [
      ...section.speeches,
      ...(customSpeeches[sectionId] || []).map(s => ({ ...s, isCustom: true })),
    ];
  },

  getAllSectionsMerged: () => {
    const { customSpeeches, defaultSpeeches } = get();
    return defaultSpeechSections.map(section => {
      const allSpeeches = [
        ...section.speeches,
        ...(customSpeeches[section.id] || []).map(s => ({ ...s, isCustom: true })),
      ];
      const defaultId = defaultSpeeches[section.id];
      if (defaultId) {
        const defaultIdx = allSpeeches.findIndex(s => s.id === defaultId);
        if (defaultIdx > 0) {
          const [def] = allSpeeches.splice(defaultIdx, 1);
          allSpeeches.unshift(def);
        }
      }
      return { ...section, speeches: allSpeeches };
    });
  },

  getCallProgress: () => {
    const { callSteps, currentCallStep } = get();
    return callSteps.length > 0 ? Math.round(((currentCallStep + 1) / callSteps.length) * 100) : 0;
  },

  getSafeCallStep: () => {
    const { callSteps, currentCallStep } = get();
    return callSteps[currentCallStep] || callSteps[0];
  },

  // ─── GPS STATE ─────────────────────────────────────────
  profile: { ...DEFAULT_PROSPECT_PROFILE },
  updateProfile: (updates) => set(s => {
    const newProfile = { ...s.profile, ...updates };
    newProfile.generatedTags = generateTags(newProfile);
    return { profile: newProfile };
  }),
  updateProfileSituation: (updates) => set(s => {
    const newProfile = { ...s.profile, situation: { ...s.profile.situation, ...updates } };
    newProfile.generatedTags = generateTags(newProfile);
    return { profile: newProfile };
  }),
  toggleMotivation: (m) => set(s => {
    const exists = s.profile.motivations.includes(m);
    const newMotivations = exists
      ? s.profile.motivations.filter(x => x !== m)
      : [...s.profile.motivations, m];
    const newProfile = { ...s.profile, motivations: newMotivations };
    newProfile.generatedTags = generateTags(newProfile);
    return { profile: newProfile };
  }),
  togglePainPoint: (p) => set(s => {
    const exists = s.profile.painPoints.includes(p);
    const newPainPoints = exists
      ? s.profile.painPoints.filter(x => x !== p)
      : [...s.profile.painPoints, p];
    const newProfile = { ...s.profile, painPoints: newPainPoints };
    newProfile.generatedTags = generateTags(newProfile);
    return { profile: newProfile };
  }),
  regenerateTags: () => set(s => ({
    profile: { ...s.profile, generatedTags: generateTags(s.profile) },
  })),

  usedBlockIds: [],
  markBlockUsed: (blockId) => set(s => ({
    usedBlockIds: s.usedBlockIds.includes(blockId)
      ? s.usedBlockIds
      : [...s.usedBlockIds, blockId],
  })),
  markBlockSignal: (blockId, signal) => set(s => ({
    blockSignals: { ...s.blockSignals, [blockId]: signal },
    usedBlockIds: s.usedBlockIds.includes(blockId)
      ? s.usedBlockIds
      : [...s.usedBlockIds, blockId],
  })),
  blockSignals: {},

  valueChecklist: [...DEFAULT_VALUE_CHECKLIST],
  toggleValueCheck: (id) => set(s => ({
    valueChecklist: s.valueChecklist.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ),
  })),

  callCostReasonGPS: null,
  setCallCostReasonGPS: (v) => set({ callCostReasonGPS: v }),

  convictionLevel: null,
  setConvictionLevel: (v) => set({ convictionLevel: v }),
}));
