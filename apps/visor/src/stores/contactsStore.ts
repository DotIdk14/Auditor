import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Contact, ContactDisposition } from '@auditor/shared-types';

interface ContactsState {
  contacts: Contact[];
  initialized: boolean;
  init: () => void;
  list: (filters?: { search?: string; disposition?: ContactDisposition }) => Contact[];
  get: (id: string) => Contact | undefined;
  create: (data: {
    fullName: string;
    phone?: string;
    email?: string;
    company?: string;
    status?: string;
    disposition?: string;
    callbackAt?: string;
    metadata?: Record<string, unknown>;
  }) => Contact;
  update: (id: string, data: Partial<Contact>) => Contact | undefined;
  remove: (id: string) => boolean;
}

export const useContactsStore = create<ContactsState>()(
  persist(
    (set, get) => ({
      contacts: [],
      initialized: false,

      init: () => {
        if (get().initialized) return;
        const stored = get().contacts;
        if (stored.length > 0) {
          const migrated = stored.map(c => ({
            ...c,
            disposition_locked: c.disposition_locked ?? (c.disposition === 'evaluando'),
          }));
          set({ contacts: migrated, initialized: true });
        } else {
          set({ initialized: true });
        }
      },

      list: (filters) => {
        let items = [...get().contacts];
        if (filters?.search) {
          const s = filters.search.toLowerCase();
          items = items.filter(c =>
            c.full_name?.toLowerCase().includes(s) ||
            c.phone?.toLowerCase().includes(s) ||
            c.email?.toLowerCase().includes(s) ||
            c.company?.toLowerCase().includes(s) ||
            (typeof c.metadata?.educationProgram === 'string' && c.metadata.educationProgram.toLowerCase().includes(s))
          );
        }
        if (filters?.disposition) {
          items = items.filter(c => c.disposition === filters.disposition);
        }
        items.sort((a, b) => {
          const aDate = a.last_activity_at || a.created_at;
          const bDate = b.last_activity_at || b.created_at;
          return new Date(bDate).getTime() - new Date(aDate).getTime();
        });
        return items;
      },

      get: (id) => get().contacts.find(c => c.id === id),

      create: (data) => {
        const now = new Date().toISOString();
        const contact: Contact = {
          id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          full_name: data.fullName,
          phone: data.phone || null,
          email: data.email || null,
          company: (data.metadata as any)?.educationProgram || data.company || null,
          source: 'manual',
          status: (data.status as any) || 'lead',
          disposition: (data.disposition as ContactDisposition) || 'no_contactado',
          disposition_locked: false,
          assigned_to: 'local',
          area_id: null,
          team_id: null,
          pipeline_id: null,
          stage_id: null,
          metadata: data.metadata || {},
          last_activity_at: now,
          callback_at: data.callbackAt || null,
          created_at: now,
          updated_at: now,
        };
        set(state => ({ contacts: [contact, ...state.contacts] }));
        return contact;
      },

      update: (id, data) => {
        const idx = get().contacts.findIndex(c => c.id === id);
        if (idx === -1) return undefined;
        const existing = get().contacts[idx];
        const updated = { ...existing, ...data, updated_at: new Date().toISOString() };
        set(state => {
          const contacts = [...state.contacts];
          contacts[idx] = updated;
          return { contacts };
        });
        return updated;
      },

      remove: (id) => {
        const len = get().contacts.length;
        set(state => ({ contacts: state.contacts.filter(c => c.id !== id) }));
        return get().contacts.length < len;
      },
    }),
    {
      name: 'visor-contacts',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ contacts: state.contacts }),
    }
  )
);
