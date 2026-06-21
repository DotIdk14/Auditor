import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Shield, Key, Sparkles, User, ArrowRight, Coffee, Heart } from 'lucide-react';
import { useAuthStore } from '../../auth/authStore';

export default function LoginPage() {
  const { login, loginWithPassword, loading, error } = useAuthStore();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const demoProfiles = [
    { label: 'Admin 👑', username: 'admin@visor.com', role: 'admin', desc: 'Ver todo el sistema', color: 'from-amber-200 to-amber-300 text-amber-900' },
    { label: 'Gerente Ventas 📈', username: 'sofia@visor.com', role: 'gerente', desc: 'Campañas / Retención', color: 'from-peach-100 to-peach-200 text-stone-800' },
    { label: 'Gerente Soporte 🎧', username: 'marcos@visor.com', role: 'gerente', desc: 'Auditoría de Soporte', color: 'from-sky-100 to-sky-250 text-sky-900' },
    { label: 'Coordinador 📋', username: 'zakir@visor.com', role: 'coordinador', desc: 'Coordinador Comercial', color: 'from-indigo-100 to-indigo-200 text-indigo-900' },
    { label: 'Supervisor 🔍', username: 'bagas@visor.com', role: 'supervisor', desc: 'Controles de Calidad', color: 'from-purple-100 to-purple-200 text-purple-900' },
    { label: 'Agente Ventas 🗣️', username: 'leonardo@visor.com', role: 'agente', desc: 'Agente Comercial', color: 'from-emerald-100 to-emerald-250 text-emerald-900' },
  ];

  const handleQuickSelect = (profile: typeof demoProfiles[0]) => {
    setUsername(profile.username);
    setPassword('123');
    setLocalError(null);
  };

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
      // Try email/password mode if it looks like an email
      if (username.includes('@')) {
        await login(username, username.split('@')[0]);
      } else {
        await loginWithPassword(username, password);
      }
      navigate('/');
    } catch (err: any) {
      setLocalError(err.message || 'Error de autenticación');
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-4 relative overflow-hidden font-sans bg-[#FAF7F2] dark:bg-[#141210] text-stone-800 dark:text-[#ebe5da] transition-colors duration-300">
      {/* Background warm cloud bubbles */}
      <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full blur-[140px] pointer-events-none bg-orange-100/40 dark:bg-amber-950/10" />
      <div className="absolute bottom-[-10%] right-[-1%] w-[60%] h-[60%] rounded-full blur-[120px] pointer-events-none bg-purple-100/30 dark:bg-stone-900/40" />
      <div className="absolute top-[30%] right-[30%] w-[300px] h-[300px] rounded-full blur-[100px] pointer-events-none bg-amber-100/30 dark:bg-amber-900/10" />

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Side: Branding */}
        <div className="col-span-1 md:col-span-6 space-y-6 text-left pr-0 md:pr-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black shadow-md border bg-[#ffcbaf] dark:bg-stone-800 border-[#e3dec3] dark:border-stone-700 text-orange-950 dark:text-[#d4a373]">
              <Coffee className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-2xl tracking-wide flex items-center gap-1.5 text-stone-900 dark:text-[#f4f1eb]">
              VISOR <span className="text-[10px] bg-[#d4a373] text-white px-2 py-0.5 rounded font-mono">v2.4 🍵</span>
            </span>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold font-display leading-tight tracking-tight text-stone-900 dark:text-white">
              Análisis de Canales de Voz Cozy Studio ✨
            </h2>
            <p className="text-stone-600 text-sm leading-relaxed max-w-md">
              Un rincón tranquilo para auditar llamadas, dialogar con el equipo, revisar matrices de calidad y calibrar grabaciones en un entorno tipo Notion.
            </p>
          </div>

          {/* Quick Access */}
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-1.5 text-[#b57b54] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span>Acceso Rápido de Prueba (Demo Notebook)</span>
            </div>
            <p className="text-[11px] text-stone-500">Haz clic en cualquiera de estos perfiles para inicializar tu espacio de trabajo:</p>
            
            <div className="grid grid-cols-2 gap-2.5">
              {demoProfiles.map((p) => {
                const isSelected = username === p.username;
                return (
                  <button
                    key={p.username}
                    type="button"
                    onClick={() => handleQuickSelect(p)}
                    className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                      isSelected
                        ? 'bg-[#fffdf8] dark:bg-stone-800 border-[#d4a373] shadow-md ring-1 ring-[#d4a373]'
                        : 'bg-white dark:bg-[#1c1a18] border-[#dfd9cc] dark:border-[#3e382f] hover:bg-[#FAF6F0] dark:hover:bg-[#24211e] hover:border-stone-400 shadow-xs'
                    }`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-[11px] font-bold ${isSelected ? 'text-[#b57b54]' : 'text-stone-800 dark:text-stone-200'}`}>
                        {p.label}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-[#fbcfe8]" />
                    </div>
                    <p className="text-[9px] text-stone-500 line-clamp-1 group-hover:text-stone-700 transition-colors">{p.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="col-span-1 md:col-span-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="p-8 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.3)] backdrop-blur-md relative overflow-hidden border bg-white/95 dark:bg-[#1c1a18]/95 border-[#dfd9cc] dark:border-[#3e382f]"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#faedcd] dark:bg-stone-700" />

            <div className="mb-6 text-left">
              <h3 className="text-xl font-bold font-display flex items-center gap-1.5 text-stone-900 dark:text-stone-100">
                Ingreso al Portal 🌸
              </h3>
              <p className="text-stone-500 text-xs mt-1">Completa tus credenciales para empezar tu sesión</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
              {(localError || error) && (
                <div className="p-3 bg-amber-50 border border-[#dfd9cc] rounded-xl text-[#b57b54] text-xs leading-relaxed flex gap-2">
                  <Shield className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <span>{localError || error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold flex items-center gap-1 text-stone-600 dark:text-stone-400">
                  <User className="w-3.5 h-3.5 text-stone-500" />
                  <span>Nombre de usuario o email</span>
                </label>
                <input
                  type="text"
                  placeholder="ej. admin@visor.com, sofia"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setLocalError(null); }}
                  className="w-full border focus:ring-1 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none transition-all bg-[#fcfbf9] dark:bg-[#24211e] border-[#dfd9cc] dark:border-[#3e382f] focus:border-[#d4a373] focus:ring-[#d4a373] text-stone-800 dark:text-stone-200 placeholder-stone-400 dark:placeholder-stone-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold flex items-center gap-1 text-stone-600 dark:text-stone-400">
                  <Key className="w-3.5 h-3.5 text-stone-500" />
                  <span>Contraseña</span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setLocalError(null); }}
                  className="w-full border focus:ring-1 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none transition-all bg-[#fcfbf9] dark:bg-[#24211e] border-[#dfd9cc] dark:border-[#3e382f] focus:border-[#d4a373] focus:ring-[#d4a373] text-stone-800 dark:text-stone-200 placeholder-stone-400 dark:placeholder-stone-600"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#faedcd] border border-[#d4a373] text-[#b57b54] hover:bg-[#ffeec2] font-bold rounded-xl shadow-xs transition-all text-xs flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#b57b54]/30 border-t-[#b57b54] rounded-full animate-spin" />
                    <span>Cargando tu estudio...</span>
                  </>
                ) : (
                  <>
                    <span>Entrar de Forma Segura ☕</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 border-t border-stone-100 pt-4 text-center">
              <span className="text-[10px] text-stone-500 flex items-center justify-center gap-1">
                Hecho con amor y calidez <Heart className="w-3 h-3 text-red-400 fill-red-400" /> para grabaciones asertivas.
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
