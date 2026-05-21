'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type View = 'login' | 'forgot';

const CloseIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

function LogoMark({ size = 44 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size, filter: 'drop-shadow(0 0 8px rgba(139,194,52,.55))' }}>
      <svg viewBox="0 0 40 40" width={size} height={size}>
        <circle cx="20" cy="20" r="18" fill="#8BC234" />
        <path d="M3 20 Q20 6 37 20" stroke="#0a1608" strokeWidth="1.8" fill="none" />
        <path d="M3 20 Q20 34 37 20" stroke="#0a1608" strokeWidth="1.8" fill="none" />
      </svg>
    </div>
  );
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [view, setView] = useState<View>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');

  const { login } = useAuth();

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') handleClose(); }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  function handleClose() {
    setView('login');
    setUsername(''); setPassword(''); setLoginError('');
    setForgotUsername(''); setForgotMessage(''); setForgotError('');
    onClose();
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      await login(username, password);
      onSuccess();
    } catch (err: any) {
      setLoginError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setForgotError(''); setForgotMessage('');
    setForgotLoading(true);
    try {
      const data = await api.forgotPassword(forgotUsername);
      setForgotMessage(data.message);
    } catch (err: any) {
      setForgotError(err.message || 'Error al procesar la solicitud');
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-8 animate-fade-in">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-md animate-scale-in">
        <div className="bg-[#0f2211] border border-ctg-green/15 rounded-2xl shadow-2xl shadow-black/60 p-8 relative overflow-hidden">
          {/* Glow */}
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full pointer-events-none"
               style={{ background: 'radial-gradient(circle, rgba(139,194,52,.18), transparent 70%)' }} />

          {/* Close */}
          <button onClick={handleClose} className="absolute top-4 right-4 text-[#F0F7E8]/40 hover:text-[#F0F7E8] transition">
            <CloseIcon />
          </button>

          {/* Logo + title */}
          <div className="flex flex-col items-center mb-6 relative">
            <LogoMark size={44} />
            <h2 className="font-display text-2xl font-bold text-[#F0F7E8] mt-3">
              {view === 'login' ? 'Iniciar Sesión' : 'Recuperar contraseña'}
            </h2>
            <p className="text-[#F0F7E8]/45 text-sm mt-1">
              {view === 'login' ? 'Bienvenido de vuelta al club' : 'Te enviaremos un enlace por WhatsApp'}
            </p>
          </div>

          {/* Login form */}
          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4 relative">
              <div>
                <label className="label block mb-1.5">Usuario</label>
                <input
                  className="field"
                  type="text"
                  placeholder="tu_usuario"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label">Contraseña</label>
                  <button
                    type="button"
                    onClick={() => { setView('forgot'); setLoginError(''); }}
                    className="text-ctg-green/70 hover:text-ctg-green text-xs transition"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <input
                  className="field"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              {loginError && (
                <div className="bg-red-900/30 border border-red-500/30 text-red-400 rounded-xl p-3 text-sm">
                  {loginError}
                </div>
              )}
              <button type="submit" disabled={loginLoading} className="btn-primary w-full py-3">
                {loginLoading ? 'Iniciando sesión…' : 'Entrar al club'}
              </button>
            </form>
          )}

          {/* Forgot password form */}
          {view === 'forgot' && (
            <div className="relative">
              {!forgotMessage ? (
                <form onSubmit={handleForgot} className="space-y-4">
                  <p className="text-[#F0F7E8]/55 text-sm">
                    Ingresa tu usuario y te enviaremos un enlace por WhatsApp para restablecer tu contraseña.
                  </p>
                  <div>
                    <label className="label block mb-1.5">Usuario</label>
                    <input
                      className="field"
                      type="text"
                      placeholder="tu_usuario"
                      value={forgotUsername}
                      onChange={e => setForgotUsername(e.target.value)}
                      required
                      autoComplete="username"
                    />
                  </div>
                  {forgotError && (
                    <div className="bg-red-900/30 border border-red-500/30 text-red-400 rounded-xl p-3 text-sm">
                      {forgotError}
                    </div>
                  )}
                  <button type="submit" disabled={forgotLoading} className="btn-primary w-full py-3">
                    {forgotLoading ? 'Enviando…' : 'Enviar enlace por WhatsApp'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setView('login')}
                    className="text-[#F0F7E8]/50 hover:text-[#F0F7E8] text-sm transition w-full text-center"
                  >
                    ← Volver a iniciar sesión
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="bg-ctg-green/10 border border-ctg-green/30 text-ctg-green rounded-xl p-3 text-sm">
                    {forgotMessage}
                  </div>
                  <button
                    type="button"
                    onClick={() => setView('login')}
                    className="btn-primary w-full py-3"
                  >
                    Volver al login
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
