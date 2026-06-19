import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export { isSignInWithEmailLink };

const provider = new GoogleAuthProvider();
// Scope para acceso de creación y lectura de archivos propios y lectura general para importación
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/drive.readonly');
provider.addScope('https://www.googleapis.com/auth/drive.metadata.readonly');


let isSigningIn = false;
let cachedAccessToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('utel_google_drive_token') : null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
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
    localStorage.setItem('utel_google_drive_token', cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Error al iniciar sesión con Google:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const logoutGoogle = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  localStorage.removeItem('utel_google_drive_token');
};

export const emailPasswordSignIn = async (email: string, password: string): Promise<User> => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
};

export const emailPasswordSignUp = async (email: string, password: string): Promise<User> => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
};

export const firebaseSignOut = async () => {
  cachedAccessToken = null;
  localStorage.removeItem('utel_google_drive_token');
  await signOut(auth);
};

const EMAIL_LINK_KEY = 'utel_email_for_signin';
const APP_URL = typeof window !== 'undefined'
  ? window.location.origin
  : 'https://auditor-olive.vercel.app';

export const sendEmailSignInLink = async (email: string): Promise<void> => {
  const actionCodeSettings = {
    url: APP_URL,
    handleCodeInApp: true,
  };
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  localStorage.setItem(EMAIL_LINK_KEY, email);
};

export const completeEmailSignIn = async (): Promise<User | null> => {
  if (!isSignInWithEmailLink(auth, window.location.href)) return null;
  const email = localStorage.getItem(EMAIL_LINK_KEY);
  if (!email) {
    const userEmail = window.prompt('Por favor ingresa tu correo para confirmar el inicio de sesión:');
    if (!userEmail) return null;
    const result = await signInWithEmailLink(auth, userEmail, window.location.href);
    localStorage.removeItem(EMAIL_LINK_KEY);
    return result.user;
  }
  const result = await signInWithEmailLink(auth, email, window.location.href);
  localStorage.removeItem(EMAIL_LINK_KEY);
  return result.user;
};
