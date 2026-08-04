import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { firebaseConfig } from './firebaseConfig';

// Este módulo se usa ÚNICAMENTE para obtener el token OAuth de Google Drive.
// La autenticación del monorepo (InsForge/JWT) vive en src/auth/authStore.

const TOKEN_KEY = 'utel_google_drive_token';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Scope para acceso de creación y lectura de archivos propios y lectura general para importación
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/drive.readonly');
provider.addScope('https://www.googleapis.com/auth/drive.metadata.readonly');

// Tokens de servicios en sessionStorage (postura de seguridad del monorepo)
const storage = typeof window !== 'undefined' ? window.sessionStorage : null;

export const getDriveToken = (): string | null => {
  if (!storage) return null;
  return storage.getItem(TOKEN_KEY);
};

export const setDriveToken = (token: string): void => {
  storage?.setItem(TOKEN_KEY, token);
};

export const removeDriveToken = (): void => {
  storage?.removeItem(TOKEN_KEY);
};

let isSigningIn = false;
let cachedAccessToken: string | null = getDriveToken();

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void,
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Google.');
    }

    cachedAccessToken = credential.accessToken;
    setDriveToken(cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Error al iniciar sesión con Google:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const logoutGoogle = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  removeDriveToken();
};
