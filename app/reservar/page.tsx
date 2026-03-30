'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import LoginModal from '@/components/LoginModal';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

const DAYS   = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatDate(d: Date) {
  return d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function isSlotPast(dateStr: string, slot: string): boolean {
  const [h, m] = slot.split(':').map(Number);
  const slotTime = new Date(dateStr + 'T00:00:00');
  slotTime.setHours(h, m, 0, 0);
  return slotTime <= new Date();
}

function Calendar({ selectedDate, onSelect }: { selectedDate: Date | null; onSelect: (d: Date) => void }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y=>y-1); } else setViewMonth(m=>m-1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y=>y+1); } else setViewMonth(m=>m+1); };

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const offset      = (firstDay + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth+1, 0).getDate();
  const cells: (number|null)[] = [...Array(offset).fill(null), ...Array.from({length:daysInMonth},(_,i)=>i+1)];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={prevMonth} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition font-bold text-gray-600">‹</button>
        <span className="font-semibold text-gray-800">{MONTHS[viewMonth]} {viewYear}</span>
        <button type="button" onClick={nextMonth} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition font-bold text-gray-600">›</button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />;
          const date = new Date(viewYear, viewMonth, day); date.setHours(0,0,0,0);
          const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
          const isToday    = isSameDay(date, today);
          const isDisabled = date < today;
          return (
            <button key={idx} type="button" disabled={isDisabled} onClick={() => onSelect(date)}
              className={`mx-auto w-9 h-9 rounded-full text-sm font-medium flex items-center justify-center transition-all
                ${isSelected ? 'bg-ctg-green text-white shadow-md'
                  : isToday && !isDisabled ? 'border-2 border-ctg-green text-ctg-dark'
                  : isDisabled ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'}`}>
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ReservarPage() {
  const { player, loading: authLoading } = useAuth();
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);

  const [step, setStep] = useState<1|2|3>(1);

  // Step 1
  const [courts, setCourts]           = useState<any[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<any | null>(null);

  // Step 2
  const [selectedDate, setSelectedDate]   = useState<Date | null>(null);
  const [availability, setAvailability]   = useState<any | null>(null);
  const [selectedSlot, setSelectedSlot]   = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots]   = useState(false);

  // Step 3
  const [allPlayers, setAllPlayers]       = useState<any[]>([]);
  const [partnerPlayerId, setPartnerPlayerId] = useState('');  // socio seleccionado
  const [hasGuest, setHasGuest]           = useState(false);
  const [guestName, setGuestName]         = useState('');
  const [submitting, setSubmitting]       = useState(false);
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState(false);

  useEffect(() => {
    api.getCourts().then(setCourts);
    api.getPlayers().then(setAllPlayers);
  }, []);

  useEffect(() => {
    if (!selectedDate || !selectedCourt) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    api.getAvailability(toDateStr(selectedDate))
      .then(data => setAvailability(data))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, selectedCourt]);

  const allCourtSlots  = availability?.courts?.find((c: any) => c.id === selectedCourt?.id)?.slots || [];
  const highDemandSlots: string[] = availability?.high_demand_slots || [];
  const dateStr = selectedDate ? toDateStr(selectedDate) : '';
  const courtSlots = allCourtSlots.filter((s: any) => !isSlotPast(dateStr, s.slot));

  // Compañeros disponibles: socios activos, excluir el jugador actual y admins puros
  const availablePartners = allPlayers.filter(p =>
    p.id !== player?.id &&
    !p.admin_role
  );
  const selectedPartnerName = availablePartners.find(p => p.id === partnerPlayerId)?.name || '';

  const handleSubmit = async () => {
    if (!player) { setShowLogin(true); return; }
    if (!selectedCourt || !selectedDate || !selectedSlot) return;
    if (!hasGuest && !partnerPlayerId) { setError('Debes seleccionar con quién vas o marcar que traes un invitado externo.'); return; }
    if (hasGuest && !guestName.trim()) { setError('Ingresa el nombre del invitado.'); return; }

    setSubmitting(true);
    setError('');
    try {
      await api.createReservation({
        court_id:     selectedCourt.id,
        date:         toDateStr(selectedDate),
        time_slot:    selectedSlot,
        has_guest:    hasGuest,
        guest_name:   hasGuest ? guestName.trim() : undefined,
        partner_name: !hasGuest && partnerPlayerId ? selectedPartnerName : undefined,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Error al crear reserva');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ctg-light via-white to-ctg-light/50">
        <Header currentPage="reservar" onLoginClick={() => setShowLogin(true)} />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-ctg-dark mb-2">¡Reserva confirmada!</h2>
          <p className="text-gray-500 mb-2">{selectedCourt?.name}</p>
          <p className="text-gray-500 mb-2">{selectedDate ? formatDate(selectedDate) : ''} · {selectedSlot} hrs</p>
          {!hasGuest && partnerPlayerId && <p className="text-sm text-gray-400 mb-2">Con: {selectedPartnerName}</p>}
          {hasGuest && <p className="text-sm text-gray-400 mb-2">Visita: {guestName} — $3.000</p>}
          <div className="flex gap-3 justify-center mt-4">
            <button onClick={() => router.push('/mis-reservas')} className="px-6 py-2 bg-ctg-green text-white rounded-lg font-medium">Ver mis reservas</button>
            <button onClick={() => { setSuccess(false); setStep(1); setSelectedCourt(null); setSelectedDate(null); setSelectedSlot(null); setHasGuest(false); setGuestName(''); setPartnerPlayerId(''); }}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600">Nueva reserva</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ctg-light via-white to-ctg-light/50">
      <Header currentPage="reservar" onLoginClick={() => setShowLogin(true)} />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-ctg-dark mb-1">Reservar cancha</h1>
          <p className="text-gray-500">Club de Tenis Graneros</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1,2,3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                ${step >= s ? 'bg-ctg-green text-white' : 'bg-gray-200 text-gray-400'}`}>{s}</div>
              <span className={`text-sm ${step >= s ? 'text-ctg-dark font-medium' : 'text-gray-400'}`}>
                {s === 1 ? 'Cancha' : s === 2 ? 'Fecha y hora' : 'Confirmar'}
              </span>
              {s < 3 && <div className={`flex-1 h-0.5 w-8 ${step > s ? 'bg-ctg-green' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1 — Cancha */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-card p-6">
            <h2 className="text-lg font-bold text-ctg-dark mb-4">Selecciona la cancha</h2>
            <div className="grid grid-cols-2 gap-4">
              {courts.map(court => (
                <button key={court.id} onClick={() => setSelectedCourt(court)}
                  className={`p-6 rounded-xl border-2 transition-all text-center
                    ${selectedCourt?.id === court.id ? 'border-ctg-green bg-ctg-light/30 shadow-md' : 'border-gray-200 hover:border-ctg-green/50'}`}>
                  <div className="text-3xl mb-2">🎾</div>
                  <p className="font-bold text-ctg-dark">{court.name}</p>
                </button>
              ))}
            </div>
            <button onClick={() => { if (selectedCourt) setStep(2); }} disabled={!selectedCourt}
              className="w-full mt-6 py-3 bg-ctg-green text-white font-bold rounded-xl disabled:opacity-40 hover:bg-ctg-lime transition">
              Continuar →
            </button>
          </div>
        )}

        {/* Step 2 — Fecha y hora */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-ctg-dark">Selecciona la fecha</h2>
                <button onClick={() => setStep(1)} className="text-sm text-ctg-green hover:underline">← Cambiar cancha</button>
              </div>
              <Calendar selectedDate={selectedDate} onSelect={setSelectedDate} />
              {selectedDate && <p className="text-xs text-ctg-dark font-semibold mt-3">📆 {formatDate(selectedDate)}</p>}
            </div>

            {selectedDate && (
              <div className="bg-white rounded-2xl shadow-card p-6">
                <h2 className="text-lg font-bold text-ctg-dark mb-4">Selecciona el horario</h2>
                {loadingSlots ? (
                  <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-ctg-green mx-auto"></div></div>
                ) : courtSlots.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">No hay horarios disponibles para este día.</div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {courtSlots.map((s: any) => {
                      const isHighDemand = highDemandSlots.includes(s.slot);
                      const isSelected   = selectedSlot === s.slot;
                      return (
                        <button key={s.slot} disabled={!s.available} onClick={() => setSelectedSlot(s.slot)}
                          className={`p-3 rounded-xl border-2 text-sm font-medium transition-all
                            ${!s.available ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                              : isSelected ? 'border-ctg-green bg-ctg-green text-white shadow-md'
                              : 'border-gray-200 hover:border-ctg-green/50 text-ctg-dark'}`}>
                          <div>{s.slot} hrs</div>
                          {isHighDemand && <div className={`text-xs mt-0.5 ${isSelected ? 'text-white/80' : 'text-orange-500'}`}>🔥 Alta demanda</div>}
                          {!s.available && <div className="text-xs mt-0.5 text-gray-400">Ocupado</div>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <button onClick={() => { if (selectedDate && selectedSlot) setStep(3); }} disabled={!selectedDate || !selectedSlot}
              className="w-full py-3 bg-ctg-green text-white font-bold rounded-xl disabled:opacity-40 hover:bg-ctg-lime transition">
              Continuar →
            </button>
          </div>
        )}

        {/* Step 3 — Confirmar */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-ctg-dark">Confirmar reserva</h2>
              <button onClick={() => setStep(2)} className="text-sm text-ctg-green hover:underline">← Atrás</button>
            </div>

            {/* Resumen */}
            <div className="bg-ctg-light/50 rounded-xl p-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Cancha</span>
                <span className="font-semibold text-ctg-dark">{selectedCourt?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Fecha</span>
                <span className="font-semibold text-ctg-dark">{selectedDate ? formatDate(selectedDate) : ''}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Horario</span>
                <span className="font-semibold text-ctg-dark">{selectedSlot} hrs</span>
              </div>
              {selectedSlot && highDemandSlots.includes(selectedSlot) && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Turno</span>
                  <span className="font-semibold text-orange-500">🔥 Alta demanda</span>
                </div>
              )}
            </div>

            {/* Compañero */}
            <div className="mb-6 space-y-3">
              {/* Dropdown socio — solo si no hay invitado */}
              {!hasGuest && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ¿Con quién vas? <span className="text-red-500">*</span>
                  </label>
                  <select value={partnerPlayerId} onChange={e => setPartnerPlayerId(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ctg-green
                      ${!partnerPlayerId ? 'border-gray-300' : 'border-ctg-green'}`}>
                    <option value="">— Selecciona un socio —</option>
                    {availablePartners.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">Si vas solo o con alguien externo, marca la opción de abajo</p>
                </div>
              )}

              {/* Checkbox invitado externo */}
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                <input type="checkbox" checked={hasGuest}
                  onChange={e => { setHasGuest(e.target.checked); if (e.target.checked) setPartnerPlayerId(''); }}
                  className="w-4 h-4 accent-ctg-green" />
                <div>
                  <span className="text-sm font-medium text-gray-700">Traigo un invitado externo (+$3.000)</span>
                  <p className="text-xs text-gray-400">Persona que no es socio del club</p>
                </div>
              </label>

              {hasGuest && (
                <input type="text" value={guestName} onChange={e => setGuestName(e.target.value)}
                  placeholder="Nombre del invitado"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ctg-green" />
              )}
            </div>

            {!player && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700 mb-4">
                ⚠️ Debes iniciar sesión para reservar.
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-4">{error}</div>
            )}

            <button onClick={player ? handleSubmit : () => setShowLogin(true)} disabled={submitting}
              className="w-full py-3 bg-ctg-green text-white font-bold rounded-xl hover:bg-ctg-lime transition disabled:opacity-50">
              {submitting ? 'Reservando...' : player ? 'Confirmar reserva' : 'Iniciar sesión para reservar'}
            </button>
          </div>
        )}
      </div>

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} onSuccess={() => setShowLogin(false)} />
    </div>
  );
}