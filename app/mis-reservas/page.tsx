'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

function formatDate(dateStr: string) {
  // Tomar solo la parte de fecha si viene con hora
  const datePart = dateStr.split('T')[0];
  const d = new Date(datePart + 'T12:00:00');
  return d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function MisReservasPage() {
  const { player, loading: authLoading } = useAuth();
  const router = useRouter();
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !player) { router.push('/'); return; }
    if (player) loadReservations();
  }, [player, authLoading]);

  const loadReservations = async () => {
    try {
      const data = await api.getMyReservations();
      setReservations(data);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    setError('');
    setCancellingId(id);
    try {
      await api.cancelReservation(id);
      await loadReservations();
    } catch (err: any) {
      setError(err.message || 'Error al cancelar');
    } finally {
      setCancellingId(null);
    }
  };

  const active   = reservations.filter(r => r.status === 'active');
  const past     = reservations.filter(r => r.status !== 'active');

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-ctg-green"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ctg-light via-white to-ctg-light/50">
      <Header currentPage="escalerilla" onLoginClick={() => {}} />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-ctg-dark mb-1">Mis Reservas</h1>
            <p className="text-gray-500">Historial y reservas activas</p>
          </div>
          <button onClick={() => router.push('/reservar')}
            className="px-4 py-2 bg-ctg-green text-white rounded-lg font-medium hover:bg-ctg-lime transition">
            + Nueva reserva
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-4">{error}</div>
        )}

        {/* Activas */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-ctg-dark mb-4">🟢 Activas ({active.length})</h2>
          {active.length === 0 ? (
            <div className="bg-white rounded-xl shadow-card p-8 text-center text-gray-400">
              No tienes reservas activas.
              <button onClick={() => router.push('/reservar')} className="block mx-auto mt-3 text-ctg-green font-medium">
                Reservar ahora →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {active.map(r => (
                <div key={r.id} className="bg-white rounded-xl shadow-card p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-ctg-dark">{r.court?.name}</p>
                      <p className="text-sm text-gray-600 mt-0.5">{formatDate(r.date)}</p>
                      <p className="text-sm text-gray-600">{r.time_slot} hrs</p>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {r.is_high_demand && (
                          <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">🔥 Alta demanda</span>
                        )}
                        {r.has_guest && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">👤 Visita: {r.guest_name}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleCancel(r.id)}
                      disabled={cancellingId === r.id}
                      className="text-xs px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition disabled:opacity-50 shrink-0">
                      {cancellingId === r.id ? '...' : 'Cancelar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Historial */}
        {past.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-ctg-dark mb-4">📋 Historial</h2>
            <div className="space-y-3">
              {past.map(r => (
                <div key={r.id} className="bg-white rounded-xl shadow-card p-4 opacity-60">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-ctg-dark">{r.court?.name}</p>
                      <p className="text-sm text-gray-600">{formatDate(r.date)} · {r.time_slot} hrs</p>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                      {r.status === 'cancelled' ? '🚫 Cancelada' : '✅ Completada'}
                    </span>
                  </div>
                  {r.cancel_reason && <p className="text-xs text-gray-400 mt-1">{r.cancel_reason}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}