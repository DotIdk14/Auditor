import type { Speech, ObjectionResponse, CallStep } from '../types';

const CUSTOM_SPEECHES_KEY = 'customSpeeches';
const CUSTOM_OBJECTIONS_KEY = 'customObjections';
const DEFAULT_SPEECHES_KEY = 'defaultSpeeches';
const CALL_STEPS_KEY = 'callSteps';

export function getCustomSpeeches(): Record<string, Speech[]> {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_SPEECHES_KEY) || '{}');
  } catch { return {}; }
}

export function saveCustomSpeeches(data: Record<string, Speech[]>): void {
  localStorage.setItem(CUSTOM_SPEECHES_KEY, JSON.stringify(data));
}

export function getCustomObjections(): Record<string, ObjectionResponse[]> {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_OBJECTIONS_KEY) || '{}');
  } catch { return {}; }
}

export function saveCustomObjections(data: Record<string, ObjectionResponse[]>): void {
  localStorage.setItem(CUSTOM_OBJECTIONS_KEY, JSON.stringify(data));
}

export function getDefaultSpeeches(): Record<string, string> {
  try {
    const stored = localStorage.getItem(DEFAULT_SPEECHES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Object.keys(parsed).length > 0) return parsed;
    }
  } catch {}
  return {
    bienvenida: 'apertura',
    sondeo: 'deteccion_necesidades',
    personalizar: 'modalidad_flexibilidad',
    costos: 'costos_inversion',
  };
}

export function saveDefaultSpeeches(data: Record<string, string>): void {
  localStorage.setItem(DEFAULT_SPEECHES_KEY, JSON.stringify(data));
}

export function getCallSteps(): CallStep[] | null {
  try {
    const raw = localStorage.getItem(CALL_STEPS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

export function saveCallSteps(data: CallStep[]): void {
  localStorage.setItem(CALL_STEPS_KEY, JSON.stringify(data));
}

export function getPersistedNotes(): { id: string; content: string; timestamp: number }[] {
  try { return JSON.parse(localStorage.getItem('callNotes') || '[]'); } catch { return []; }
}

export function getPersistedVariables(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem('callVariables') || '{}'); } catch { return {}; }
}

export function getPersistedChecklist(): { id: string; label: string; checked: boolean }[] | null {
  try {
    const raw = localStorage.getItem('safeChecklist');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}
