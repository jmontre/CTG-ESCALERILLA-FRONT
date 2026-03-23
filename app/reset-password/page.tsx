'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('El enlace no es válido o está incompleto.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword(token!, password);
      setSuccess(true);
      // Redirigir al inicio después de 3 segundos
      setTimeout(() => router.push('/'), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ctg-light via-white to-ctg-light/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-card max-w-md w-full p-8 animate-scale-in">

        {/* Logo / título */}
        <div className="text-center mb-8">
          <img
            src="/images/Logo_CTG.png"
            alt="CTG"
            className="h-16 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-ctg-dark">Nueva contraseña</h1>
          <p className="text-gray-500 text-sm mt-1">Club de Tenis Graneros</p>
        </div>

        {success ? (
          <div className="text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-ctg-dark mb-2">¡Contraseña actualizada!</h2>
            <p className="text-gray-600 text-sm mb-6">
              Tu contraseña fue cambiada correctamente. Serás redirigido al inicio en unos segundos.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-ctg-green text-white font-bold rounded-lg hover:bg-ctg-lime transition-colors"
            >
              Ir al inicio
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Nueva contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ctg-green"
                required
                disabled={!token}
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">Confirmar contraseña</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repite la contraseña"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ctg-green"
                required
                disabled={!token}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full bg-ctg-green text-white font-bold py-3 rounded-lg hover:bg-ctg-lime transition-colors disabled:opacity-50"
            >
              {loading ? 'Actualizando...' : 'Cambiar contraseña'}
            </button>

            <div className="mt-4 text-center">
              <Link href="/" className="text-sm text-gray-500 hover:text-ctg-dark">
                ← Volver al inicio
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-ctg-green"></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}