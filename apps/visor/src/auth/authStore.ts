import { create } from 'zustand';
import { api } from '../lib/api';
import type { JWTPayload, UserRole } from '@auditor/shared-types';

// Map Visor's legacy deviceId concept to email for compatibility
const DEVICE_ID_KEY = 'visor_device_id';

interface AuthState {
  user: (JWTPayload & { permissions?: string[]; hierarchy?: { areaId: string | null; teamId: string | null } }) | null;
  accessToken: string | null;
  loading: boolean;
  hydrated: boolean;
  error: string | null;

  login: (email: string, displayName?: string) => Promise<void>;
  loginWithPassword: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  checkSession: () => Promise<void>;
  can: (permission: string) => boolean;
  canViewRole: (targetRole: string) => boolean;
  canViewAgent: (agentHierarchy?: { areaId?: string; teamId?: string; supervisorId?: string }) => boolean;

  // Role conversion helpers
  visorRole: () => string;
  roleLabel: () => string;
}

function mapAuditorRoleToVisor(role: UserRole): string {
  const map: Record<string, string> = {
    admin: 'admin',
    area_manager: 'gerente',
    coordinator: 'coordinador',
    supervisor: 'supervisor',
    agent: 'agente',
    qa: 'auditor',
  };
  return map[role] || role;
}

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: 'Super Admin',
    gerente: 'Gerente de Operaciones',
    coordinador: 'Coordinador de Campaña',
    supervisor: 'Supervisor de Calidad',
    agente: 'Agente',
    auditor: 'Auditor de Calidad',
  };
  return labels[role] || role;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  accessToken: null,
  loading: false,
  hydrated: false,
  error: null,

  login: async (email, displayName) => {
    set({ loading: true, error: null });
    try {
      const res: any = await api.post('/login', {
        email: email.trim().toLowerCase(),
        displayName: displayName || email.split('@')[0],
      });

      const token = res.token;
      const user: JWTPayload = {
        sub: res.sub || email,
        email: email.trim().toLowerCase(),
        displayName: res.username || displayName || email.split('@')[0],
        role: res.role || 'agent',
        areaId: res.areaId || null,
        teamId: res.teamId || null,
      };

      set({
        user: {
          ...user,
          permissions: [],
          hierarchy: { areaId: user.areaId || null, teamId: user.teamId || null },
        },
        accessToken: token,
        loading: false,
        hydrated: true,
      });

      // Store device ID for compatibility
      localStorage.setItem(DEVICE_ID_KEY, email);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Error de inicio de sesión';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  loginWithPassword: async (username, password) => {
    set({ loading: true, error: null });
    try {
      const res: any = await api.post('/login', {
        username,
        password,
        email: username,
      });

      const token = res.token;
      set({
        user: {
          sub: username,
          email: username,
          displayName: res.username || username,
          role: res.role || 'supervisor',
          hierarchy: { areaId: null, teamId: null },
          permissions: [],
        },
        accessToken: token,
        loading: false,
        hydrated: true,
      });
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Credenciales inválidas';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  logout: () => {
    set({ user: null, accessToken: null, hydrated: true, error: null });
    localStorage.removeItem(DEVICE_ID_KEY);
  },

  refresh: async () => {
    try {
      const res: any = await api.post('/verify-session', {
        token: get().accessToken,
      });
      if (res.success && res.user) {
        set({
          user: {
            ...res.user,
            hierarchy: { areaId: res.user.areaId || null, teamId: res.user.teamId || null },
            permissions: [],
          },
        });
      }
    } catch {
      get().logout();
    }
  },

  checkSession: async () => {
    const token = get().accessToken;
    if (!token) {
      set({ hydrated: true });
      return;
    }
    try {
      const res: any = await api.post('/verify-session', { token });
      if (res.success && res.user) {
        set({
          user: {
            ...res.user,
            hierarchy: { areaId: res.user.areaId || null, teamId: res.user.teamId || null },
            permissions: [],
          },
          hydrated: true,
        });
      } else {
        set({ user: null, accessToken: null, hydrated: true });
      }
    } catch {
      set({ user: null, accessToken: null, hydrated: true });
    }
  },

  can: (permission) => {
    const { user } = get();
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.permissions?.includes(permission) ?? false;
  },

  canViewRole: (targetRole) => {
    const { user } = get();
    if (!user) return false;
    const hierarchy = ['admin', 'area_manager', 'coordinator', 'supervisor', 'agent', 'qa'];
    const userIdx = hierarchy.indexOf(user.role);
    const targetIdx = hierarchy.indexOf(targetRole as UserRole);
    if (userIdx === -1) return false;
    // Can view same level or below
    return targetIdx >= userIdx;
  },

  canViewAgent: (agentHierarchy) => {
    const { user } = get();
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (!agentHierarchy) return false;

    const userRole = user.role;
    const userArea = user.areaId;
    const userTeam = user.teamId;

    if (userRole === 'area_manager' || userRole === 'coordinator') {
      return agentHierarchy.areaId === userArea;
    }
    if (userRole === 'supervisor') {
      return agentHierarchy.teamId === userTeam || agentHierarchy.supervisorId === user.sub;
    }
    if (userRole === 'agent') {
      return agentHierarchy.supervisorId === user.sub; // can view own audits
    }
    return false;
  },

  visorRole: () => {
    const { user } = get();
    if (!user) return 'agente';
    return mapAuditorRoleToVisor(user.role);
  },

  roleLabel: () => {
    const { user } = get();
    if (!user) return 'Invitado';
    return getRoleLabel(mapAuditorRoleToVisor(user.role));
  },
}));
