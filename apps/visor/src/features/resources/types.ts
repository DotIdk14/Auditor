export interface Speech {
  id: string;
  title: string;
  content: string;
  isCustom?: boolean;
}

export interface SpeechSection {
  id: string;
  icon: string;
  title: string;
  speeches: Speech[];
  flow?: FlowConfig;
}

export interface FlowStep {
  id: string;
  type: 'content' | 'decision';
  title?: string;
  content?: string;
  prompt?: string;
  options?: { label: string; value: string }[];
}

export interface FlowConfig {
  steps: FlowStep[];
}

export interface ObjectionResponse {
  id: string;
  title: string;
  content: string;
  isCustom?: boolean;
}

export interface ObjectionCategory {
  id: string;
  icon: string;
  title: string;
  objection: string;
  responses: ObjectionResponse[];
}

export interface CallStep {
  id: string;
  type: 'section' | 'custom';
  sectionId?: string;
  speechId?: string;
  title?: string;
  content?: string;
  customType?: 'text' | 'objection';
  skipped?: boolean;
}

export interface SafeCheckItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface ProfileTags {
  trabaja: boolean;
  tieneHijos: boolean;
  preocupadoCostos: boolean;
}

export interface CallNote {
  id: string;
  content: string;
  timestamp: number;
}

export type ActiveTab = 'speeches' | 'newcall' | 'objections' | 'notes';

export type CostDecision = 'yes' | 'no' | null;
