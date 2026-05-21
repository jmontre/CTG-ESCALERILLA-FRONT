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
  const [errorMsg, setErrorMsg]         = useState('');
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
    } finally { setLoading(false); }
  };

  const handleCancel = async (id: string) => {
    setErrorMsg(''); setSuccessMsg('');
    setCancellingId(id);
    try {
      const result = await api.cancelReservation(id);
      if (result?.late_cancellation) setSuccessMsg(result.message);
      await loadReservations();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al cancelar');
    } finally { setCancellingId(null); }
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
      <div className="min-h-screen bg-[#0a1608] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-ctg-green/20 border-t-ctg-green animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1608]">
      <Header onLoginClick={() => {}} />

      <div className="max-w-2xl mx-auto px-4 pt-28 pb-24 md:pb-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-ctg-green/70 text-xs font-bold uppercase tracking-[0.2em] mb-1">Reservas</p>
            <h1 className="font-display text-3xl font-extrabold text-[#F0F7E8]">Mis Reservas</h1>
          </div>
          <button onClick={() => router.push('/reservar')} className="btn-primary">
            + Nueva
          </button>
        </div>

        {errorMsg && (
          <div className="bg-red-900/30 border border-red-500/30 text-red-400 rounded-xl p-3 text-sm mb-4">{errorMsg}</div>
        )}
        {successMsg && (
          <div className="bg-amber-900/20 border border-amber-500/20 text-amber-300/80 rounded-xl p-3 text-sm mb-4">{successMsg}</div>
        )}

        {/* Active */}
        <div className="mb-8">
          <h2 className="font-semibold text-[#F0F7E8]/70 text-sm uppercase tracking-wider mb-4">
            Activas <span className="text-[#F0F7E8]/40">({active.length})</span>
          </h2>
          {active.length === 0 ? (
            <div className="bg-[#0f2211] border border-[#1e4020] rounded-xl p-8 text-center">
              <p className="text-[#F0F7E8]/35 text-sm">No tienes reservas activas.</p>
              <button onClick={() => router.push('/reservar')} className="mt-3 text-ctg-green text-sm font-medium hover:text-ctg-lime transition">
                Reservar ahora →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {active.map(r => (
                <div key={r.id} className="bg-[#0f2211] border border-[#1e4020] rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#F0F7E8]">{r.court?.name}</p>
                      <p className="text-sm text-[#F0F7E8]/55 mt-0.5 capitalize">{formatDate(r.date)}</p>
                      <p className="text-sm font-mono text-ctg-green/80">{r.time_slot} hrs</p>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {r.is_high_demand && (
                          <span className="chip chip-warning text-[10px]">🔥 Alta demanda</span>
                        )}
                        {r.has_guest && (
                          <span className="chip chip-info text-[10px]">Visita: {r.guest_name}</span>
                        )}
                        {r.partner_name && !r.has_guest && (
                          <span className="chip chip-success text-[10px]">Con: {r.partner_name}</span>
                        )}
                        {r.is_challenge && (
                          <span className="chip chip-info text-[10px]">Desafío</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      {!r.is_challenge && (
                        <button
                          onClick={() => { setErrorMsg(''); setSuccessMsg(''); setModifyingReservation(r); }}
                          disabled={cancellingId === r.id}
                          className="text-xs px-3 py-1.5 border border-ctg-green/40 text-ctg-green rounded-lg hover:bg-ctg-green/10 transition disabled:opacity-50">
                          Modificar
                        </button>
                      )}
                      <button
                        onClick={() => handleCancel(r.id)}
                        disabled={cancellingId === r.id}
                        className="text-xs px-3 py-1.5 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-900/20 transition disabled:opacity-50 flex items-center justify-center gap-1">
                        {cancellingId === r.id ? (
                          <>
                            <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                            Cancelando...
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

        {/* History */}
        {past.length > 0 && (
          <div>
            <h2 className="font-semibold text-[#F0F7E8]/70 text-sm uppercase tracking-wider mb-4">
              Historial <span className="text-[#F0F7E8]/40">({past.length})</span>
            </h2>
            <div className="space-y-3">
              {past.map(r => (
                <div key={r.id} className="bg-[#0f2211] border border-[#1e4020] rounded-xl p-4 opacity-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-[#F0F7E8]">{r.court?.name}</p>
                      <p className="text-sm text-[#F0F7E8]/50 capitalize">{formatDate(r.date)} · <span className="font-mono">{r.time_slot}</span> hrs</p>
                    </div>
                    <span className={'text-xs px-2 py-1 rounded-full border ' +
                      (r.status === 'cancelled'
                        ? 'bg-red-900/20 border-red-500/20 text-red-400'
                        : 'bg-ctg-green/10 border-ctg-green/20 text-ctg-green')}>
                      {r.status === 'cancelled' ? 'Cancelada' : 'Completada'}
                    </span>
                  </div>
                  {r.cancel_reason && (
                    <p className={`text-xs mt-1.5 ${r.cancel_reason === 'Cancelación tardía - turno descontado' ? 'text-amber-400/70' : 'text-[#F0F7E8]/30'}`}>
                      {r.cancel_reason === 'Cancelación tardía - turno descontado'
                        ? 'Turno descontado por cancelación tardía'
                        : r.cancel_reason}
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
