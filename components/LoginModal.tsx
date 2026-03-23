'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type View = 'login' | 'forgot';

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [view, setView] = useState<View>('login');

  // Login state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');

  const { login } = useAuth();

  if (!isOpen) return null;

  const handleClose = () => {
    // Reset al cerrar
    setView('login');
    setUsername('');
    setPassword('');
    setError('');
    setForgotUsername('');
    setForgotMessage('');
    setForgotError('');
    onClose();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotMessage('');
    setForgotLoading(true);

    try {
      const data = await api.forgotPassword(forgotUsername);
      setForgotMessage(data.message);
    } catch (err: any) {
      setForgotError(err.message || 'Error al procesar la solicitud');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-scale-in">

        {/* ── LOGIN ── */}
        {view === 'login' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-ctg-dark">Iniciar Sesión</h2>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>

            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Usuario</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ctg-green"
                  required
                />
              </div>

              <div className="mb-2">
                <label className="block text-gray-700 font-medium mb-2">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ctg-green"
                  required
                />
              </div>

              {/* Link olvidé contraseña */}
              <div className="mb-6 text-right">
                <button
                  type="button"
                  onClick={() => { setView('forgot'); setError(''); }}
                  className="text-sm text-ctg-green hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-ctg-green text-white font-bold py-3 rounded-lg hover:bg-ctg-lime transition-colors disabled:opacity-50"
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </button>
            </form>
          </>
        )}

        {/* ── FORGOT PASSWORD ── */}
        {view === 'forgot' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-ctg-dark">Recuperar contraseña</h2>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>

            <p className="text-gray-600 text-sm mb-6">
              Ingresa tu nombre de usuario y te enviaremos un enlace por WhatsApp para restablecer tu contraseña.
            </p>

            {!forgotMessage ? (
              <form onSubmit={handleForgotPassword}>
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">Usuario</label>
                  <input
                    type="text"
                    value={forgotUsername}
                    onChange={(e) => setForgotUsername(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ctg-green"
                    required
                  />
                </div>

                {forgotError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {forgotError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-ctg-green text-white font-bold py-3 rounded-lg hover:bg-ctg-lime transition-colors disabled:opacity-50"
                >
                  {forgotLoading ? 'Enviando...' : 'Enviar enlace por WhatsApp'}
                </button>

                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="w-full mt-3 text-sm text-gray-500 hover:text-ctg-dark"
                >
                  ← Volver al login
                </button>
              </form>
            ) : (
              <div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm mb-6">
                  ✅ {forgotMessage}
                </div>
                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="w-full bg-ctg-green text-white font-bold py-3 rounded-lg hover:bg-ctg-lime transition-colors"
                >
                  Volver al login
                </button>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}