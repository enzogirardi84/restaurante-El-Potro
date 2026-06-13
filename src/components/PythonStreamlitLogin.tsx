import React, { useState } from 'react';
import { Lock, User, Loader2, ArrowRight } from 'lucide-react';
import ElPatronLogo from './ElPatronLogo';
import { tryGetActiveSupabaseClient } from '../lib/supabaseClient';

interface PythonStreamlitLoginProps {
  onLoginSuccess: () => void;
}

const getLoginConfig = () => {
  const env = (import.meta as any).env;
  return {
    username: String(env.VITE_ADMIN_USERNAME || '').trim().toLowerCase(),
    password: String(env.VITE_ADMIN_PASSWORD || '')
  };
};

export default function PythonStreamlitLogin({ onLoginSuccess }: PythonStreamlitLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const loginConfig = getLoginConfig();
  const isLoginConfigured = Boolean(loginConfig.username && loginConfig.password);

  const executeLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setError(null);
    setIsLoggingIn(true);

    const cleanUsername = username.trim();
    const supabase = tryGetActiveSupabaseClient();

    if (supabase && cleanUsername.includes('@')) {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: cleanUsername,
        password
      });

      if (!authError) {
        onLoginSuccess();
        return;
      }
    }

    if (isLoginConfigured && cleanUsername.toLowerCase() === loginConfig.username && password === loginConfig.password) {
      setTimeout(() => {
        onLoginSuccess();
      }, 700);
      return;
    }

    setIsLoggingIn(false);
    setError(
      isLoginConfigured
        ? 'Credenciales de acceso inválidas. Compruebe los datos e intente nuevamente.'
        : 'Configure Supabase Auth o defina VITE_ADMIN_USERNAME y VITE_ADMIN_PASSWORD en el entorno.'
    );
  };

  return (
    <div className="min-h-screen bg-[#F5F1E9] text-stone-850 font-sans flex items-center justify-center p-4 relative overflow-hidden" id="pos-login-container">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#6B4A35]/5 blur-3xl" />
      <div className="absolute bottom-[-25%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#4A2D1B]/5 blur-3xl" />

      <div className="max-w-md w-full bg-[#FFFDF8] rounded-3xl border border-stone-150 shadow-xl shadow-stone-200/40 p-8 md:p-10 space-y-8 relative z-10">
        <div className="text-center space-y-4 flex flex-col items-center">
          <ElPatronLogo className="w-36 h-36 drop-shadow-md" variant="badge" />
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-[#4A2D1B] tracking-tight">El Patrón Pro</h1>
            <p className="text-[10px] uppercase font-bold text-[#6B4A35] tracking-widest">
              Sistema Gestor Gastronómico
            </p>
          </div>
          <p className="text-xs text-stone-500 font-medium max-w-[280px]">
            Módulo de seguridad para el control operativo de cocina, salón, caja e inventario.
          </p>
        </div>

        {isLoggingIn ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-fadeIn">
            <Loader2 className="w-10 h-10 text-[#4A2D1B] animate-spin" />
            <div className="text-center">
              <h3 className="font-bold text-stone-800 text-sm">Autenticando credenciales...</h3>
              <p className="text-[11px] text-stone-400">Verificando seguridad del enlace local y Supabase</p>
            </div>
          </div>
        ) : (
          <form onSubmit={executeLogin} className="space-y-5">
            {error && (
              <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-2xl flex items-start gap-2.5 animate-fadeIn">
                <div className="text-xs leading-normal font-sans">
                  <p className="font-extrabold text-rose-800">Error de Acceso</p>
                  <p className="text-rose-700/90 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                  Usuario de Turno
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Usuario o email"
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-stone-200 focus:border-[#4A2D1B] focus:ring-1 focus:ring-[#4A2D1B] rounded-xl bg-stone-50/50 focus:outline-none transition-all placeholder:text-stone-300 font-sans font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                  Contraseña de Seguridad
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-stone-200 focus:border-[#4A2D1B] focus:ring-1 focus:ring-[#4A2D1B] rounded-xl bg-stone-50/50 focus:outline-none transition-all placeholder:text-stone-300 font-sans"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="submit"
                className="w-full py-3 px-4 bg-[#4A2D1B] hover:bg-[#6B4A35] text-white font-extrabold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-[#4A2D1B]/10"
              >
                <span>Ingresar al Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        <div className="border-t border-stone-150 pt-5 text-center space-y-2">
          <p className="text-[10px] text-stone-400 font-medium">
            Acceso administrativo protegido por configuración de entorno.
          </p>
        </div>
      </div>

      <div className="absolute bottom-4 left-0 right-0 text-center text-[10px] text-stone-400/80">
        El Patrón Gastronomía Premium S.A. • Terminal POS Autorizada
      </div>
    </div>
  );
}
