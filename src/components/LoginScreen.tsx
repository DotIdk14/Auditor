import React, { useState } from 'react';
import { Lock, ShieldAlert, BadgeCheck, Loader2, Mail, Eye, EyeOff } from 'lucide-react';
import { emailPasswordSignIn } from '../lib/firebase';
import { API_URL } from '../config';

interface LoginScreenProps {
  onLoginSuccess: (token: string, username: string) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Ingresa tu correo y contraseña.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const user = await emailPasswordSignIn(email, password);

      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0],
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        onLoginSuccess(data.token, data.username);
      } else {
        setErrorMessage(data.error || 'Correo no autorizado.');
      }
    } catch (firebaseErr: any) {
      // Fallback: backend directo si Firebase Auth falla
      try {
        const backendResp = await fetch(`${API_URL}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email,
            username: email.split('@')[0],
            password: password,
          }),
        });
        const backendData = await backendResp.json();
        if (backendResp.ok && backendData.success) {
          onLoginSuccess(backendData.token, backendData.username);
          return;
        }
        setErrorMessage(backendData.error || 'Credenciales inválidas.');
      } catch {
        setErrorMessage('Error de conexión con el servidor de autenticación.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 font-sans flex items-center justify-center p-4 md:p-8 select-none relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[500px] h-[350px] md:h-[500px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />
      
      <div className="w-full max-w-md bg-[#121212] border border-[#222222] rounded-3xl p-6 md:p-8 shadow-2xl relative z-10 animate-fadeIn">
        
        {/* Brand identity */}
        <div className="flex flex-col items-center text-center gap-3 mb-8">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20 border border-indigo-500/30">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
              Auditor Cognitivo PCE
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-mono font-bold px-2 py-0.5 rounded-full border border-indigo-500/20">
                PRO v1.0.1
              </span>
            </h1>
            <p className="text-xs text-gray-400 mt-1 max-w-[280px] mx-auto">
              Portal de Calidad y Calificación de Asesoría Telefónica
            </p>
          </div>
        </div>

        {/* Admin login badge */}
        <div className="bg-[#181818] border border-zinc-800 rounded-2xl p-4 mb-6 text-xs text-gray-400 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-indigo-400 flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase">
              Inicio de Sesión de Administrador <BadgeCheck className="w-3.5 h-3.5 inline text-indigo-400" />
            </span>
            <p className="leading-relaxed">
              Ingresa con tu correo electrónico y contraseña autorizada para acceder al panel de auditoría.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl p-4 mb-5 text-xs font-semibold flex flex-col gap-2 animate-shake">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="text-[10px] text-gray-400 tracking-wider font-mono font-bold uppercase block mb-1.5 ml-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@correo.com"
                className="w-full bg-[#181818] border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-gray-400 tracking-wider font-mono font-bold uppercase block mb-1.5 ml-1">
              Contraseña
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full bg-[#181818] border border-zinc-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-gray-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 text-xs font-bold transition-all shadow-md active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verificando...</span>
              </>
            ) : (
              <span>Iniciar Sesión</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-5 border-t border-[#222222] text-center">
          <span className="text-[9.5px] text-zinc-600 font-mono">
            Portal de Administrador Protegido 2026
          </span>
        </div>
      </div>
    </div>
  );
}
