import { create } from 'zustand';
import type { JWTPayload } from '@/api/types';
import api, { clearToken, setToken } from '@/api/client';

// ---------------------------------------------------------------------------
// Token helpers
// ---------------------------------------------------------------------------

const TOKEN_KEY = 'crm_token';

/**
 * Retrieve the stored token (synchronous, safe).
 */
function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Decode the JWT payload without verifying the signature (client-side only).
 * Returns `null` for malformed tokens.
 */
function decodeJwtPayload(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    // The payload is the second part, base64url-encoded
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as JWTPayload;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

export interface AuthState {
  token: string | null;
  user: JWTPayload | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, displayName: string) => Promise<void>;
  logout: () => void;
  checkSession: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // ── login ──────────────────────────────────────────────────────────────
  login: async (email: string, displayName: string) => {
    set({ isLoading: true, error: null });

    try {
      const res = await api.post<{ token: string }>('/api/login', {
        email,
        displayName,
      });

      const { token } = res.data;

      // Persist to localStorage
      setToken(token);

      // Decode and store user info
      const user = decodeJwtPayload(token);

      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err: unknown) {
      clearToken();
      const message =
        err instanceof Error
          ? err.message
          : 'Ocurrió un error durante el inicio de sesión';
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: message,
      });
    }
  },

  // ── logout ─────────────────────────────────────────────────────────────
  logout: () => {
    clearToken();
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  // ── checkSession ──────────────────────────────────────────────────────
  checkSession: async () => {
    // Already resolved in this session – skip to avoid unnecessary calls
    if (get().isAuthenticated && get().token) return;

    const token = readToken();
    if (!token) {
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      return;
    }

    set({ isLoading: true });

    try {
      // Verify the token with the server
      await api.post('/api/verify-session', null, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Decode the local token for user info (server already confirmed it)
      const user = decodeJwtPayload(token);

      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch {
      // Token is invalid or expired – clean up
      clearToken();
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },
}));
