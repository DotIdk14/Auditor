import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Shield, Coffee, Mail, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../auth/authStore';
import { insforge } from '../../lib/insforge';

export default function LoginPage() {
  const { login, loading, error } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState(false);

  // Handle OAuth redirect — InsForge SDK auto-detects insforge_code and exchanges it
  useEffect(() => {
    const code = searchParams.get('insforge_code');
    if (!code) return;

    setOauthLoading(true);
    // The SDK creates the session; then we get the user and call our login API
    insforge.auth.getCurrentUser().then(async ({ data, error: authError }) => {
      if (authError || !data?.user?.email) {
        setLocalError('Error al autenticar con Google. Intenta de nuevo.');
        setOauthLoading(false);
        return;
      }

      try {
        const userEmail = data.user.email;
        const userName = data.user.profile?.name || userEmail.split('@')[0];
        await login(userEmail, userName);
        navigate('/', { replace: true });
      } catch (err: any) {
        setLocalError(err.message || 'Error de autenticación');
      } finally {
        setOauthLoading(false);
      }
    });
  }, []);

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    setOauthLoading(true);
    try {
      const { data, error: oauthError } = await insforge.auth.signInWithOAuth('google', {
        redirectTo: window.location.origin + '/login',
      });
      // SPA mode redirects automatically — code below runs if skipBrowserRedirect
      if (oauthError) {
        const msg = typeof oauthError === 'string' ? oauthError : (oauthError as any).message || 'Error al iniciar OAuth';
        setLocalError(msg);
        setOauthLoading(false);
      }
    } catch (err: any) {
      setLocalError(err.message || 'Error al conectar con Google');
      setOauthLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!email) {
      setLocalError('Ingresa tu correo electrónico.');
      return;
    }
    try {
      await login(email.trim(), email.trim().split('@')[0]);
      await new Promise(r => setTimeout(r, 50));
      navigate('/', { replace: true });
    } catch (err: any) {
      setLocalError(err.message || 'Error de autenticación');
    }
  };

  const isLoading = loading || oauthLoading;

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
              <p className="text-stone-400 text-sm">Accede con tu cuenta Google o con tu correo</p>
            </div>

            {oauthLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-[#d4a373]/30 border-t-[#d4a373] rounded-full animate-spin" />
                <span className="ml-3 text-sm text-stone-400">Autenticando...</span>
              </div>
            )}

            {!oauthLoading && (
              <>
                {/* Google Sign-In button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-3.5 bg-white hover:bg-gray-100 text-gray-800 font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-3 mb-5 cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>Continuar con Google</span>
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px bg-[#2a2622]" />
                  <span className="text-[10px] text-stone-500 font-medium uppercase tracking-wider">O con correo</span>
                  <div className="flex-1 h-px bg-[#2a2622]" />
                </div>
              </>
            )}

            {(localError || error) && !oauthLoading && (
              <div className="mb-5 p-3 bg-red-950/30 border border-red-900/50 rounded-xl text-red-400 text-xs flex gap-2">
                <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{typeof (localError || error) === 'string' ? (localError || error) : 'Error de autenticación'}</span>
              </div>
            )}

            {!oauthLoading && (
              <form onSubmit={handleSubmit} className="space-y-5 text-left">
                <div className="space-y-2">
                  <label htmlFor="login-email" className="text-sm font-semibold flex items-center gap-2 text-stone-300">
                    <Mail className="w-4 h-4" />
                    <span>Correo electrónico</span>
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    placeholder="ej. usuario@correo.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setLocalError(null); }}
                    className="w-full bg-[#161412] border border-[#2a2622] focus:border-[#d4a373] focus:ring-1 focus:ring-[#d4a373] rounded-xl py-3.5 px-4 text-sm text-stone-200 placeholder-stone-600 focus:outline-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-[#faedcd] hover:bg-[#fff3d6] text-[#4a3219] font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2 mt-8 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-[#4a3219]/30 border-t-[#4a3219] rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Ingresar</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </main>
  );
}
