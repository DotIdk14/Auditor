import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { publicApi } from '../lib/api';
import type { JWTPayload, UserRole } from '@auditor/shared-types';

const DEVICE_ID_KEY = 'visor_device_id';

interface AuthState {
  user: (JWTPayload & { permissions?: string[]; hierarchy?: { areaId: string | null; teamId: string | null } }) | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;

  login: (email: string, displayName?: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  checkSession: () => Promise<void>;
  can: (permission: string) => boolean;
  canViewRole: (targetRole: string) => boolean;
  canViewAgent: (agentHierarchy?: { areaId?: string; teamId?: string; supervisorId?: string }) => boolean;

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

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
  user: null,
  accessToken: null,
  loading: false,
  error: null,

  login: async (email, displayName) => {
    set({ loading: true, error: null });
    try {
      const res: any = await publicApi.post('/login', {
        email: email.trim().toLowerCase(),
        displayName: displayName || email.split('@')[0],
      });

      const body = res.data;
      const token = body.token;
      const user: JWTPayload = {
        sub: body.sub || email,
        email: email.trim().toLowerCase(),
        displayName: body.username || displayName || email.split('@')[0],
        role: body.role || 'agent',
        areaId: body.areaId || null,
        teamId: body.teamId || null,
      };

      set({
        user: {
          ...user,
          permissions: [],
          hierarchy: { areaId: user.areaId || null, teamId: user.teamId || null },
        },
        accessToken: token,
        loading: false,
      });

      // Store device ID for compatibility
      localStorage.setItem(DEVICE_ID_KEY, email);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Error de inicio de sesión';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  logout: () => {
    set({ user: null, accessToken: null, error: null });
    localStorage.removeItem(DEVICE_ID_KEY);
  },

  refresh: async () => {
    const currentToken = get().accessToken;
    if (!currentToken) return;

    try {
      const { data } = await publicApi.post<{
        success: boolean;
        token: string;
        user: {
          sub: string;
          email: string;
          displayName: string;
          role: string;
          areaId?: string | null;
          teamId?: string | null;
        };
      }>('/refresh-token', { token: currentToken });

      if (data.success && data.token) {
        set({
          accessToken: data.token,
          user: {
            sub: data.user.sub,
            email: data.user.email,
            displayName: data.user.displayName,
            role: data.user.role as any,
            areaId: data.user.areaId ?? null,
            teamId: data.user.teamId ?? null,
            hierarchy: {
              areaId: data.user.areaId ?? null,
              teamId: data.user.teamId ?? null,
            },
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
    const currentUser = get().user;
    if (!token) {
      return;
    }
    try {
      const res: any = await publicApi.post('/verify-session', { token });
      if (res.success && res.user) {
        set({
          user: {
            ...res.user,
            role: res.user.role || currentUser?.role || 'agent',
            hierarchy: { areaId: res.user.areaId || null, teamId: res.user.teamId || null },
            permissions: [],
          },
        });
      } else {
        set({ user: currentUser });
      }
    } catch {
      // No desloguear - preservar estado actual
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
    if (!user) {
      console.warn('[VISOR_ROLE] user es null, defaulting a agente');
      return 'agente';
    }
    const mapped = mapAuditorRoleToVisor(user.role);
    console.log(`[VISOR_ROLE] role=${user.role} mapped=${mapped}`);
    return mapped;
  },

  roleLabel: () => {
    const { user } = get();
    if (!user) return 'Invitado';
    return getRoleLabel(mapAuditorRoleToVisor(user.role));
  },
}),
{
  name: 'visor-auth',
  storage: createJSONStorage(() => sessionStorage),
  // Solo persistimos accessToken y user (no loading, error)
  partialize: (state) => ({
    accessToken: state.accessToken,
    user: state.user,
  }),
},
));
