import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Shield, Coffee } from 'lucide-react';
import { useAuthStore } from '../../auth/authStore';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function LoginPage() {
  const { login, loading, error } = useAuthStore();
  const navigate = useNavigate();
  const btnRef = useRef<HTMLDivElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [gisLoaded, setGisLoaded] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const check = () => {
      if (window.google?.accounts) {
        setGisLoaded(true);
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (res: google.accounts.id.CredentialResponse) => {
            try {
              const resp = await fetch('https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=' + res.credential, { method: 'GET' });
              const info = await resp.json() as { email?: string; name?: string };
              if (info.email) {
                await login(info.email, info.name || info.email.split('@')[0]);
                await new Promise(r => setTimeout(r, 50));
                navigate('/', { replace: true });
              } else {
                setLocalError('No se pudo obtener tu correo electrónico.');
              }
            } catch {
              setLocalError('Error al verificar la identidad de Google.');
            }
          },
        });
        if (btnRef.current) {
          window.google.accounts.id.renderButton(btnRef.current, {
            theme: 'outline',
            size: 'large',
            width: 320,
            text: 'signin_with',
            shape: 'pill',
          });
        }
      } else {
        setTimeout(check, 300);
      }
    };
    check();
  }, [login, navigate]);

  return (
    <main className="min-h-screen w-screen flex items-center justify-center p-4 relative overflow-hidden font-sans bg-[#11100e] text-[#ebe5da] transition-colors duration-300">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-12 items-center relative z-10">

        {/* Left Side: Branding */}
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

        {/* Right Side: Login Card */}
        <div className="col-span-1 md:col-span-5">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="p-8 rounded-[2rem] bg-[#1c1a18] border border-[#2a2622] shadow-2xl relative overflow-hidden"
          >
            <div className="mb-8 text-left">
              <h3 className="text-2xl font-bold text-white mb-2">
                Ingresa
              </h3>
              <p className="text-stone-400 text-sm">Inicia sesión con tu cuenta de Google</p>
            </div>

            {(localError || error) && (
              <div className="mb-5 p-3 bg-red-950/30 border border-red-900/50 rounded-xl text-red-400 text-xs flex gap-2">
                <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{localError || error}</span>
              </div>
            )}

            <div className="flex flex-col items-center gap-4">
              {GOOGLE_CLIENT_ID ? (
                <div ref={btnRef} className="min-h-[44px]" />
              ) : (
                <p className="text-stone-500 text-xs text-center">
                  Google Sign-In no está configurado.<br />
                  Contacta al administrador.
                </p>
              )}

              {loading && !gisLoaded && (
                <div className="flex items-center gap-2 text-stone-400 text-xs">
                  <div className="w-4 h-4 border-2 border-stone-400/30 border-t-stone-400 rounded-full animate-spin" />
                  Cargando...
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
