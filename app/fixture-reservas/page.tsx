'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import LoginModal from '@/components/LoginModal';
import { api } from '@/lib/api';
import { toDateStr } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

function formatDateHeader(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function getDayTabs() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

export default function FixtureReservasPage() {
  const { refreshPlayer } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availability, setAvailability] = useState<any | null>(null);
  const [loading, setLoading]           = useState(true);
  const [showLogin, setShowLogin]       = useState(false);
  const days = getDayTabs();

  useEffect(() => {
    setLoading(true);
    api.getAvailability(toDateStr(selectedDate))
      .then(data => setAvailability(data))
      .finally(() => setLoading(false));
  }, [selectedDate]);

  const isPast = (slot: string) => {
    const [h, m] = slot.split(':').map(Number);
    const t = new Date(toDateStr(selectedDate) + 'T00:00:00');
    t.setHours(h, m, 0, 0);
    return t <= new Date();
  };

  const dayLabel = (d: Date) => {
    if (toDateStr(d) === toDateStr(new Date())) return 'Hoy';
    return d.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#0a1608]">
      <Header onLoginClick={() => setShowLogin(true)} />

      <div className="max-w-5xl mx-auto px-4 pt-28 pb-24 md:pb-10">
        <div className="mb-6">
          <p className="text-ctg-green/70 text-xs font-bold uppercase tracking-[0.2em] mb-1">Club de Tenis Graneros</p>
          <h1 className="font-display text-3xl font-extrabold text-[#F0F7E8]">Disponibilidad de Canchas</h1>
        </div>

        {/* Day tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {days.map(d => {
            const isSelected = toDateStr(d) === toDateStr(selectedDate);
            return (
              <button key={toDateStr(d)} onClick={() => setSelectedDate(d)}
                className={'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ' +
                  (isSelected
                    ? 'bg-ctg-green text-[#0a1608] shadow-[0_0_12px_rgba(139,194,52,.3)]'
                    : 'bg-[#0f2211] border border-[#1e4020] text-[#F0F7E8]/60 hover:text-[#F0F7E8] hover:border-ctg-green/30')}>
                {dayLabel(d)}
              </button>
            );
          })}
        </div>

        <p className="text-sm text-[#F0F7E8]/45 mb-6 capitalize">{formatDateHeader(toDateStr(selectedDate))}</p>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 rounded-full border-2 border-ctg-green/20 border-t-ctg-green animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availability?.courts?.map((court: any) => {
              const isToday = toDateStr(selectedDate) === toDateStr(new Date());
              const occupiedSlots = court.slots.filter((s: any) => {
                if (s.available) return false;
                if (!isToday && isPast(s.slot)) return false;
                return true;
              });
              return (
                <div key={court.id} className="bg-[#0f2211] border border-[#1e4020] rounded-2xl overflow-hidden">
                  <div className="bg-[#152b18] border-b border-[#1e4020] px-5 py-3 flex items-center justify-between">
                    <div>
                      <h2 className="text-[#F0F7E8] font-bold">{court.name}</h2>
                      <p className="text-[#F0F7E8]/40 text-xs">
                        {availability.season === 'verano' ? 'Temporada verano' : 'Temporada invierno'}
                      </p>
                    </div>
                    <span className="text-[#F0F7E8]/40 text-xs">{occupiedSlots.length} reservas</span>
                  </div>

                  {occupiedSlots.length === 0 ? (
                    <div className="px-5 py-8 text-center text-[#F0F7E8]/30 text-sm">Sin reservas para este día</div>
                  ) : (
                    <div className="divide-y divide-[#1e4020]">
                      {occupiedSlots.map((s: any) => {
                        const isHighDemand = availability.high_demand_slots?.includes(s.slot);
                        const isChallenge  = s.reservation?.is_challenge;
                        const isBlocked    = !s.reservation;
                        return (
                          <div key={s.slot}
                            className={'flex items-center justify-between px-5 py-3 transition-colors ' +
                              (isToday && isPast(s.slot) ? 'opacity-35' : '') +
                              (isChallenge ? ' bg-blue-900/10' : '') +
                              (isBlocked ? ' bg-[#152b18]/40' : '')}>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono font-bold text-[#F0F7E8]">{s.slot}</span>
                              {isHighDemand && (
                                <span className="text-xs bg-orange-900/40 text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded-full">🔥</span>
                              )}
                            </div>
                            <div className="text-right">
                              {isBlocked ? (
                                <>
                                  <p className="text-sm font-semibold text-[#F0F7E8]/50">Bloqueado</p>
                                  {s.block_reason && <p className="text-xs text-[#F0F7E8]/30">{s.block_reason}</p>}
                                </>
                              ) : (
                                <>
                                  <div className="flex items-center justify-end gap-2">
                                    {isChallenge && (
                                      <span className="text-xs bg-blue-900/40 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded-full">Desafío</span>
                                    )}
                                    <p className="text-sm font-semibold text-[#F0F7E8]">{s.reservation.player_name}</p>
                                  </div>
                                  {s.reservation.partner_name && (
                                    <p className="text-xs text-[#F0F7E8]/45">
                                      {isChallenge ? 'vs' : 'con'} {s.reservation.partner_name}
                                    </p>
                                  )}
                                  {s.reservation.school_name && (
                                    <p className="text-xs text-ctg-green/70">Escuela {s.reservation.school_name}</p>
                                  )}
                                  {!isChallenge && s.reservation.has_guest && (
                                    <p className="text-xs text-[#F0F7E8]/35">
                                      + visita{s.reservation.guest_name ? `: ${s.reservation.guest_name}` : ''}
                                    </p>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 text-center">
          <a href="/reservar" className="btn-primary inline-flex">
            + Hacer una reserva
          </a>
        </div>
      </div>

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)}
        onSuccess={() => { setShowLogin(false); refreshPlayer(); }} />
    </div>
  );
}
