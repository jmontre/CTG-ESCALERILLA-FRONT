'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import LoginModal from '@/components/LoginModal';
import { api } from '@/lib/api';

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

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
    const today = new Date();
    if (toDateStr(d) === toDateStr(today)) return 'Hoy';
    return d.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ctg-light via-white to-ctg-light/50">
      <Header currentPage="fixture-reservas" onLoginClick={() => setShowLogin(true)} />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-ctg-dark mb-1">📅 Reservas</h1>
          <p className="text-gray-500">Disponibilidad de canchas — Club de Tenis Graneros</p>
        </div>

        {/* Day tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {days.map(d => {
            const isSelected = toDateStr(d) === toDateStr(selectedDate);
            return (
              <button key={toDateStr(d)} onClick={() => setSelectedDate(d)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition
                  ${isSelected ? 'bg-ctg-green text-white shadow-md' : 'bg-white text-gray-600 hover:bg-ctg-light shadow-sm'}`}>
                {dayLabel(d)}
              </button>
            );
          })}
        </div>

        <p className="text-sm text-gray-500 mb-6 capitalize">{formatDateHeader(toDateStr(selectedDate))}</p>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-ctg-green"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availability?.courts?.map((court: any) => {
              const occupiedSlots = court.slots.filter((s: any) => !s.available && !isPast(s.slot));
              return (
                <div key={court.id} className="bg-white rounded-2xl shadow-card overflow-hidden">
                  <div className="bg-ctg-dark px-5 py-3 flex items-center justify-between">
                    <div>
                      <h2 className="text-white font-bold text-lg">🎾 {court.name}</h2>
                      <p className="text-white/60 text-xs">
                        {availability.season === 'verano' ? '☀️ Verano' : '❄️ Invierno'}
                      </p>
                    </div>
                    <span className="text-white/60 text-xs">{occupiedSlots.length} reservas</span>
                  </div>

                  {occupiedSlots.length === 0 ? (
                    <div className="px-5 py-8 text-center text-gray-400 text-sm">Sin reservas para este día</div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {occupiedSlots.map((s: any) => {
                        const isHighDemand  = availability.high_demand_slots?.includes(s.slot);
                        const isChallenge   = s.reservation?.is_challenge;
                        return (
                          <div key={s.slot} className={`flex items-center justify-between px-5 py-3 ${isChallenge ? 'bg-blue-50/50' : ''}`}>
                            {/* Hora */}
                            <div className="flex items-center gap-2 min-w-[80px]">
                              <span className="text-sm font-mono font-bold text-ctg-dark">{s.slot}</span>
                              {isHighDemand && <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">🔥</span>}
                            </div>

                            {/* Info */}
                            <div className="flex-1 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {isChallenge && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">⚔️ Desafío</span>
                                )}
                                <p className="text-sm font-semibold text-ctg-dark">{s.reservation?.player_name}</p>
                              </div>
                              {s.reservation?.partner_name && (
                                <p className="text-xs text-gray-500">
                                  {isChallenge ? 'vs' : 'con'} {s.reservation.partner_name}
                                </p>
                              )}
                              {!isChallenge && s.reservation?.has_guest && (
                                <p className="text-xs text-gray-400">
                                  + visita{s.reservation?.guest_name ? `: ${s.reservation.guest_name}` : ''}
                                </p>
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
          <a href="/reservar" className="inline-block px-6 py-3 bg-ctg-green text-white font-bold rounded-xl hover:bg-ctg-lime transition shadow-md">
            + Hacer una reserva
          </a>
        </div>
      </div>

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} onSuccess={() => setShowLogin(false)} />
    </div>
  );
}