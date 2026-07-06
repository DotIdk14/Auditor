import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Shield, Key, User, ArrowRight, Coffee } from 'lucide-react';
import { useAuthStore } from '../../auth/authStore';

export default function LoginPage() {
  const { login, loginWithPassword, loading, error } = useAuthStore();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!username) {
      setLocalError('Por favor ingresa tu nombre de usuario.');
      return;
    }
    if (!password) {
      setLocalError('Por favor ingresa tu contraseña.');
      return;
    }

    try {
      if (password) {
        await loginWithPassword(username, password);
      } else if (username.includes('@')) {
        await login(username, username.split('@')[0]);
      } else {
        await loginWithPassword(username, password);
      }

      // Leer el estado actualizado del store para verificar consistencia
      const { accessToken } = useAuthStore.getState();
      if (!accessToken) {
        console.error('[LOGIN] Token ausente después de login exitoso');
        return;
      }

      // Pequeña pausa para permitir que persist escriba a sessionStorage
      // antes de navegar, evitando race condition con ProtectedRoute
      await new Promise(resolve => setTimeout(resolve, 50));

      navigate('/', { replace: true });
    } catch (err: any) {
      setLocalError(err.message || 'Error de autenticación');
    }
  };

  return (
    <main className="min-h-screen w-screen flex items-center justify-center p-4 relative overflow-hidden font-sans bg-[#11100e] text-[#ebe5da] transition-colors duration-300">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* Left Side: Branding */}
        <div className="col-span-1 md:col-span-7 space-y-6 text-left pr-0 md:pr-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center bg-[#2a2520] border border-[#3e382f] rounded-lg px-3 py-1.5 gap-2 text-stone-200">
              <Coffee className="w-4 h-4 text-[#d4a373]" />
              <span className="font-bold tracking-wide text-sm flex items-center">
                VISOR <span className="bg-[#d4a373] text-[#4a3219] px-1.5 py-0.5 rounded text-[10px] font-bold ml-2">v2.4 🍵</span>
              </span>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <h2 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight text-white">
              Verifica la calidad de tu equipo
            </h2>
            <p className="text-stone-400 text-base">
              Just vibe
            </p>
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
              <p className="text-stone-400 text-sm">Completa tus credenciales para empezar tu sesión</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-5 text-left">
              {(localError || error) && (
                <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-xl text-red-400 text-xs flex gap-2">
                  <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{localError || error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="login-username" className="text-sm font-semibold flex items-center gap-2 text-stone-300">
                  <User className="w-4 h-4" />
                  <span>Nombre de usuario o email</span>
                </label>
                <input
                  id="login-username"
                  name="username"
                  type="text"
                  placeholder="ej. usuario@correo.com"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setLocalError(null); }}
                  className="w-full bg-[#161412] border border-[#2a2622] focus:border-[#d4a373] focus:ring-1 focus:ring-[#d4a373] rounded-xl py-3.5 px-4 text-sm text-stone-200 placeholder-stone-600 focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="login-password" className="text-sm font-semibold flex items-center gap-2 text-stone-300">
                  <Key className="w-4 h-4" />
                  <span>Contraseña</span>
                </label>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setLocalError(null); }}
                  className="w-full bg-[#161412] border border-[#2a2622] focus:border-[#d4a373] focus:ring-1 focus:ring-[#d4a373] rounded-xl py-3.5 px-4 text-sm text-stone-200 placeholder-stone-600 focus:outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#faedcd] hover:bg-[#fff3d6] text-[#4a3219] font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2 mt-8 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-[#4a3219]/30 border-t-[#4a3219] rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Inicia Sesion</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
