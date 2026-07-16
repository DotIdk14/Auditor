import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Shield, Coffee, Mail, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../auth/authStore';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '703833866895-ktjlej45ulmuor5nouqsth9um2n45293.apps.googleusercontent.com';

function decodeGoogleCredential(credential: string): { email: string; name: string } {
  try {
    const payload = JSON.parse(atob(credential.split('.')[1]));
    return { email: payload.email || '', name: payload.name || payload.email?.split('@')[0] || '' };
  } catch {
    return { email: '', name: '' };
  }
}

export default function LoginPage() {
  const { login, loading, error } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [gisReady, setGisReady] = useState(false);
  const [gisLoading, setGisLoading] = useState(false);
  const btnRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (document.querySelector('script[src*="accounts.google.com/gsi"]')) return;
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    document.body.appendChild(s);
  }, []);

  useEffect(() => {
    const poll = setInterval(() => {
      if (window.google?.accounts?.id && btnRef.current && !initializedRef.current) {
        clearInterval(poll);
        initializedRef.current = true;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (res) => {
            if (!res?.credential) { setLocalError('No se recibió credencial de Google.'); setGisLoading(false); return; }
            const { email: gEmail, name: gName } = decodeGoogleCredential(res.credential);
            if (!gEmail) { setLocalError('No se pudo obtener tu correo de Google.'); setGisLoading(false); return; }
            login(gEmail, gName).then(() => navigate('/', { replace: true })).catch((e: any) => {
              setLocalError(e.message || 'Error de autenticación con Google');
            }).finally(() => setGisLoading(false));
          },
        });
        window.google.accounts.id.renderButton(btnRef.current, {
          theme: 'outline', size: 'large', width: 288, text: 'continue_with', shape: 'rectangular',
        });
        setGisReady(true);
      }
    }, 200);
    return () => clearInterval(poll);
  }, [login, navigate]);

  const handleGoogleFallback = () => {
    setLocalError(null);
    setGisLoading(true);
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      setLocalError('Google Sign-In no disponible. Intenta con correo electrónico.');
      setGisLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!email) { setLocalError('Ingresa tu correo electrónico.'); return; }
    try {
      await login(email.trim(), email.trim().split('@')[0]);
      navigate('/', { replace: true });
    } catch (err: any) {
      setLocalError(err.message || 'Error de autenticación');
    }
  };

  const isLoading = loading || gisLoading;

  return (
    <main className="min-h-screen w-screen flex items-center justify-center p-4 relative overflow-hidden font-sans bg-[#11100e] text-[#ebe5da] transition-colors duration-300">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-12 items-center relative z-10">

        <div className="col-span-1 md:col-span-7 space-y-6 text-left pr-0 md:pr-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center bg-[#2a2520] border border-[#3e382f] rounded-lg px-3 py-1.5 gap-2 text-stone-200">
              <Coffee className="w-4 h-4 text-[#d4a373]" />
              <span className="font-bold tracking-wide text-sm flex items-center">
                VISOR <span className="bg-[#d4a373] text-[#4a3219] px-1.5 py-0.5 rounded text-[10px] font-bold ml-2">v2.4</span>
              </span>
            </div>
          </div>
          <div className="space-y-2 mt-4">
            <h2 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight text-white">
              Verifica la calidad de tu equipo
            </h2>
          </div>
        </div>

        <div className="col-span-1 md:col-span-5">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="p-8 rounded-[2rem] bg-[#1c1a18] border border-[#2a2622] shadow-2xl relative overflow-hidden"
          >
            <div className="mb-6 text-left">
              <h3 className="text-2xl font-bold text-white mb-2">Ingresa</h3>
              <p className="text-stone-400 text-sm">Accede con tu cuenta Google o con tu correo</p>
            </div>

            {/* GIS rendered button */}
            <div className="flex justify-center mb-5"><div ref={btnRef} /></div>

            {/* Fallback: show custom button while GIS not yet ready */}
            {!gisReady && !gisLoading && (
              <button type="button" onClick={handleGoogleFallback}
                className="w-full py-3.5 bg-white hover:bg-gray-100 text-gray-800 font-semibold rounded-xl text-sm flex items-center justify-center gap-3 mb-5 cursor-pointer"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continuar con Google
              </button>
            )}

            {gisLoading && (
              <div className="flex items-center justify-center py-3 mb-5 gap-2">
                <div className="w-5 h-5 border-2 border-[#d4a373]/30 border-t-[#d4a373] rounded-full animate-spin" />
                <span className="text-xs text-stone-400">Autenticando...</span>
              </div>
            )}

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-[#2a2622]" />
              <span className="text-[10px] text-stone-500 font-medium uppercase tracking-wider">O con correo</span>
              <div className="flex-1 h-px bg-[#2a2622]" />
            </div>

            {(localError || error) && (
              <div className="mb-5 p-3 bg-red-950/30 border border-red-900/50 rounded-xl text-red-400 text-xs flex gap-2">
                <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{typeof (localError || error) === 'string' ? (localError || error) : 'Error de autenticación'}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 text-left">
              <div className="space-y-2">
                <label htmlFor="login-email" className="text-sm font-semibold flex items-center gap-2 text-stone-300">
                  <Mail className="w-4 h-4" />
                  <span>Correo electrónico</span>
                </label>
                <input id="login-email" type="email" placeholder="ej. usuario@correo.com"
                  value={email} onChange={(e) => { setEmail(e.target.value); setLocalError(null); }}
                  className="w-full bg-[#161412] border border-[#2a2622] focus:border-[#d4a373] focus:ring-1 focus:ring-[#d4a373] rounded-xl py-3.5 px-4 text-sm text-stone-200 placeholder-stone-600 focus:outline-none transition-colors"
                />
              </div>
              <button type="submit" disabled={isLoading}
                className="w-full py-4 bg-[#faedcd] hover:bg-[#fff3d6] text-[#4a3219] font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2 mt-8 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-[#4a3219]/30 border-t-[#4a3219] rounded-full animate-spin" />
                ) : (
                  <><span>Ingresar</span><ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
