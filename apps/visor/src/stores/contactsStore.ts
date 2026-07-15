import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Contact, ContactDisposition } from '@auditor/shared-types';

const DEMO_CONTACTS: Contact[] = [
  {
    id: 'demo-contact-001',
    full_name: 'María García López',
    phone: '+52 55 1234 5678',
    email: 'maria.garcia@empresa.com',
    company: 'Tech Solutions SA',
    source: 'web',
    status: 'lead',
    disposition: 'no_contactado',
    disposition_locked: false,
    assigned_to: 'admin@test.com',
    area_id: null,
    team_id: null,
    pipeline_id: null,
    stage_id: null,
    metadata: {},
    last_activity_at: null,
    callback_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-contact-002',
    full_name: 'Roberto Díaz Sánchez',
    phone: '+52 55 8765 4321',
    email: 'roberto.diaz@negocios.com',
    company: 'Negocios Globales',
    source: 'outbound',
    status: 'lead',
    disposition: 'no_contactado',
    disposition_locked: false,
    assigned_to: 'admin@test.com',
    area_id: null,
    team_id: null,
    pipeline_id: null,
    stage_id: null,
    metadata: {},
    last_activity_at: null,
    callback_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-contact-003',
    full_name: 'Carlos Rodríguez Martínez',
    phone: '+52 33 9876 5432',
    email: 'carlos.rodriguez@firma.mx',
    company: 'Consultoría Moderna',
    source: 'referral',
    status: 'lead',
    disposition: 'cuelgue',
    disposition_locked: false,
    assigned_to: 'admin@test.com',
    area_id: null,
    team_id: null,
    pipeline_id: null,
    stage_id: null,
    metadata: { notes: 'Se le marcó pero no contestó. Pide que le llamemos mañana por la tarde.' },
    last_activity_at: new Date().toISOString(),
    callback_at: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-contact-004',
    full_name: 'Laura Hernández Ruiz',
    phone: '+52 81 5555 9999',
    email: 'laura.hernandez@corp.com',
    company: 'Corporativo del Norte',
    source: 'inbound',
    status: 'lead',
    disposition: 'cuelgue',
    disposition_locked: false,
    assigned_to: 'admin@test.com',
    area_id: null,
    team_id: null,
    pipeline_id: null,
    stage_id: null,
    metadata: { notes: 'En reunión, pide volver a llamar a las 3pm' },
    last_activity_at: new Date().toISOString(),
    callback_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-contact-005',
    full_name: 'Ana Martínez Fernández',
    phone: '+52 81 5555 1234',
    email: 'ana.martinez@corporativo.com',
    company: 'Corporativo del Norte',
    source: 'outbound',
    status: 'prospect',
    disposition: 'evaluando',
    disposition_locked: true,
    assigned_to: 'admin@test.com',
    area_id: null,
    team_id: null,
    pipeline_id: null,
    stage_id: null,
    metadata: { notes: 'Se le envió catálogo de servicios. Está comparando precios con la competencia.' },
    last_activity_at: new Date().toISOString(),
    callback_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-contact-006',
    full_name: 'Pedro López Gutiérrez',
    phone: '+52 55 1111 2222',
    email: 'pedro.lopez@startup.io',
    company: 'StartupTech',
    source: 'event',
    status: 'prospect',
    disposition: 'evaluando',
    disposition_locked: true,
    assigned_to: 'admin@test.com',
    area_id: null,
    team_id: null,
    pipeline_id: null,
    stage_id: null,
    metadata: { notes: 'Conocido en el evento de tecnología. Le interesó el módulo de auditoría.' },
    last_activity_at: new Date().toISOString(),
    callback_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

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
        if (stored.length === 0) {
          set({ contacts: DEMO_CONTACTS, initialized: true });
        } else {
          // Migrate existing contacts: add disposition_locked if missing
          const migrated = stored.map(c => ({
            ...c,
            disposition_locked: c.disposition_locked ?? (c.disposition === 'evaluando'),
          }));
          set({ contacts: migrated, initialized: true });
        }
      },

      list: (filters) => {
        let items = [...get().contacts];
        if (filters?.search) {
          const s = filters.search.toLowerCase();
          items = items.filter(c =>
            c.full_name.toLowerCase().includes(s) ||
            c.phone?.toLowerCase().includes(s) ||
            c.email?.toLowerCase().includes(s) ||
            c.company?.toLowerCase().includes(s)
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
          company: data.company || null,
          source: 'manual',
          status: (data.status as any) || 'lead',
          disposition: (data.disposition as ContactDisposition) || 'no_contactado',
          disposition_locked: false,
          assigned_to: 'local',
          area_id: null,
          team_id: null,
          pipeline_id: null,
          stage_id: null,
          metadata: {},
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
