import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Shield, Coffee, Mail, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../auth/authStore';

export default function LoginPage() {
  const { login, loading, error } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

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
              <p className="text-stone-400 text-sm">Ingresa tu correo electrónico</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 text-left">
              {(localError || error) && (
                <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-xl text-red-400 text-xs flex gap-2">
                  <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{localError || error}</span>
                </div>
              )}

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
                disabled={loading}
                className="w-full py-4 bg-[#faedcd] hover:bg-[#fff3d6] text-[#4a3219] font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2 mt-8 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-[#4a3219]/30 border-t-[#4a3219] rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Ingresar</span>
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
