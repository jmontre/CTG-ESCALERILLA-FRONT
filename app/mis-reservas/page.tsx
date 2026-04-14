'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ModifyReservationModal from '@/components/ModifyReservationModal';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

function formatDate(dateStr: string) {
  const datePart = dateStr.split('T')[0];
  const d = new Date(datePart + 'T12:00:00');
  return d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function MisReservasPage() {
  const { player, loading: authLoading } = useAuth();
  const router = useRouter();
  const [reservations, setReservations] = useState<any[]>([]);
  const [allPlayers, setAllPlayers]     = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [modifyingReservation, setModifyingReservation] = useState<any | null>(null);
  const [error, setError]               = useState('');
  const [successMsg, setSuccessMsg]     = useState('');

  useEffect(() => {
    if (!authLoading && !player) { router.push('/'); return; }
    if (player) {
      loadReservations();
      api.getPlayers().then(setAllPlayers);
    }
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
    setSuccessMsg('');
    setCancellingId(id);
    try {
      const result = await api.cancelReservation(id);
      if (result?.late_cancellation) {
        setSuccessMsg(result.message);
      }
      await loadReservations();
    } catch (err: any) {
      setError(err.message || 'Error al cancelar');
    } finally {
      setCancellingId(null);
    }
  };

  const handleModifySuccess = async () => {
    setSuccessMsg('Reserva modificada correctamente.');
    await loadReservations();
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const active = reservations.filter(r => r.status === 'active');
  const past   = reservations.filter(r => r.status !== 'active');

  const playerType = (player as any)?.member_type || 'socio';

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
        {successMsg && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 mb-4">
            {successMsg}
          </div>
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
                    <div className="flex-1 min-w-0">
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
                        {r.partner_name && !r.has_guest && (
                          <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">🤝 Con: {r.partner_name}</span>
                        )}
                        {r.is_challenge && (
                          <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">🎾 Desafío</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      {/* Botón Modificar — solo para reservas normales (no desafíos) */}
                      {!r.is_challenge && (
                        <button
                          onClick={() => { setError(''); setSuccessMsg(''); setModifyingReservation(r); }}
                          disabled={cancellingId === r.id}
                          className="text-xs px-3 py-1.5 border border-ctg-green text-ctg-green rounded-lg hover:bg-ctg-light transition disabled:opacity-50">
                          ✏️ Modificar
                        </button>
                      )}
                      <button
                        onClick={() => handleCancel(r.id)}
                        disabled={cancellingId === r.id}
                        className="text-xs px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition disabled:opacity-50 flex items-center justify-center gap-1">
                        {cancellingId === r.id ? (
                          <>
                            <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin"></div>
                            <span>Cancelando...</span>
                          </>
                        ) : 'Cancelar'}
                      </button>
                    </div>
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
                  {r.cancel_reason && (
                    <p className={`text-xs mt-1 ${r.cancel_reason === 'Cancelación tardía - turno descontado' ? 'text-orange-500 font-medium' : 'text-gray-400'}`}>
                      {r.cancel_reason === 'Cancelación tardía - turno descontado' ? '⚠️ Turno descontado por cancelación tardía' : r.cancel_reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ModifyReservationModal
        isOpen={!!modifyingReservation}
        onClose={() => setModifyingReservation(null)}
        reservation={modifyingReservation}
        playerType={playerType}
        allPlayers={allPlayers}
        currentPlayerId={(player as any)?.id}
        onSuccess={handleModifySuccess}
      />
    </div>
  );
}
