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

  const isProfe = (player as any)?.member_type === 'profe';

  // Steps: 1=cancha(opcional), 2=fecha/hora, 3=confirmar
  const [step, setStep] = useState<1|2|3>(1);

  // Step 1 — Cancha (opcional)
  const [courts, setCourts]               = useState<any[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<any | null>(null);
  const [anyCourtMode, setAnyCourtMode]   = useState(false); // true = sin preferencia

  // Step 2
  const [selectedDate, setSelectedDate]   = useState<Date | null>(null);
  const [availability, setAvailability]   = useState<any | null>(null);
  const [selectedSlot, setSelectedSlot]   = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots]   = useState(false);

  // Step 3
  const [allPlayers, setAllPlayers]           = useState<any[]>([]);
  const [partnerPlayerId, setPartnerPlayerId] = useState('');
  const [hasGuest, setHasGuest]               = useState(false);
  const [guestName, setGuestName]             = useState('');
  const [schoolName, setSchoolName]           = useState(''); // para profes
  const [submitting, setSubmitting]           = useState(false);
  const [error, setError]                     = useState('');
  const [success, setSuccess]                 = useState(false);
  const [confirmedCourt, setConfirmedCourt]   = useState<any | null>(null); // cancha real asignada

  useEffect(() => {
    api.getCourts().then(setCourts);
    api.getPlayers().then(setAllPlayers);
  }, []);

  // Cargar disponibilidad cuando cambia fecha (si hay cancha seleccionada o modo any)
  useEffect(() => {
    if (!selectedDate) return;
    if (!selectedCourt && !anyCourtMode) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    api.getAvailability(toDateStr(selectedDate))
      .then(data => setAvailability(data))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, selectedCourt, anyCourtMode]);

  const highDemandSlots: string[] = availability?.high_demand_slots || [];
  const dateStr = selectedDate ? toDateStr(selectedDate) : '';

  // Slots para mostrar según modo
  const getSlotsToShow = () => {
    if (!availability) return [];
    if (anyCourtMode) {
      // Mostrar todos los slots — un slot está disponible si AL MENOS una cancha lo tiene libre
      const allSlots = availability.courts[0]?.slots || [];
      return allSlots
        .filter((s: any) => !isSlotPast(dateStr, s.slot))
        .map((s: any) => {
          const availableInAnyCourt = availability.courts.some((c: any) =>
            c.slots.find((cs: any) => cs.slot === s.slot)?.available
          );
          return { ...s, available: availableInAnyCourt };
        });
    } else {
      const courtSlots = availability?.courts?.find((c: any) => c.id === selectedCourt?.id)?.slots || [];
      return courtSlots.filter((s: any) => !isSlotPast(dateStr, s.slot));
    }
  };

  const courtSlots = getSlotsToShow();

  // Encontrar qué cancha asignar automáticamente (modo anyCourtMode)
  const getAutoAssignedCourt = (slot: string) => {
    if (!anyCourtMode || !availability) return selectedCourt;
    for (const court of availability.courts) {
      const s = court.slots.find((cs: any) => cs.slot === slot);
      if (s?.available) return court;
    }
    return null;
  };

  const availablePartners = allPlayers.filter(p =>
    p.id !== player?.id && !p.admin_role && p.member_type !== 'profe'
  );
  const selectedPartnerName = availablePartners.find(p => p.id === partnerPlayerId)?.name || '';
  const schoolNames: string[] = (player as any)?.school_names || [];

  const handleSubmit = async () => {
    if (!player) { setShowLogin(true); return; }
    if (!selectedDate || !selectedSlot) return;

    // Resolver cancha final
    const finalCourt = anyCourtMode ? getAutoAssignedCourt(selectedSlot) : selectedCourt;
    if (!finalCourt) { setError('No hay cancha disponible para ese horario.'); return; }

    // Validaciones según tipo de usuario
    if (!isProfe) {
      if (!hasGuest && !partnerPlayerId) {
        setError('Debes seleccionar con quién vas o marcar que traes un invitado externo.');
        return;
      }
      if (hasGuest && !guestName.trim()) { setError('Ingresa el nombre del invitado.'); return; }
    } else {
      if (!schoolName) { setError('Debes seleccionar el nombre de la escuela.'); return; }
    }

    setSubmitting(true);
    setError('');
    try {
      await api.createReservation({
        court_id:     finalCourt.id,
        date:         toDateStr(selectedDate),
        time_slot:    selectedSlot,
        has_guest:    isProfe ? false : hasGuest,
        guest_name:   isProfe ? undefined : (hasGuest ? guestName.trim() : undefined),
        partner_name: isProfe ? undefined : (!hasGuest && partnerPlayerId ? selectedPartnerName : undefined),
        school_name:  isProfe ? schoolName : undefined,
      });
      setConfirmedCourt(finalCourt);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Error al crear reserva');
    } finally {
      setSubmitting(false);
    }
  };

  const canProceedToStep2 = selectedCourt || anyCourtMode;

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ctg-light via-white to-ctg-light/50">
        <Header currentPage="reservar" onLoginClick={() => setShowLogin(true)} />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-ctg-dark mb-2">¡Reserva confirmada!</h2>
          <p className="text-gray-500 mb-1">{confirmedCourt?.name || selectedCourt?.name}</p>
          <p className="text-gray-500 mb-1">{selectedDate ? formatDate(selectedDate) : ''} · {selectedSlot} hrs</p>
          {isProfe && schoolName && <p className="text-sm text-ctg-green font-semibold mb-1">Escuela {schoolName}</p>}
          {!isProfe && !hasGuest && partnerPlayerId && <p className="text-sm text-gray-400 mb-1">Con: {selectedPartnerName}</p>}
          {!isProfe && hasGuest && <p className="text-sm text-gray-400 mb-1">Visita: {guestName} (+$3.000)</p>}
          <button onClick={() => window.location.reload()}
            className="mt-6 px-6 py-3 bg-ctg-green text-white font-bold rounded-xl hover:bg-ctg-lime transition">
            Hacer otra reserva
          </button>
        </div>
      </div>
    );
  }

  if (authLoading) return null;

  const stepLabels = ['Cancha', 'Fecha y hora', 'Confirmar'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-ctg-light via-white to-ctg-light/50">
      <Header currentPage="reservar" onLoginClick={() => setShowLogin(true)} />

      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-ctg-dark mb-1">Reservar cancha</h1>
          <p className="text-gray-500 text-sm">Club de Tenis Graneros</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-1 mb-8">
          {[1,2,3].map(s => (
            <div key={s} className="flex items-center gap-1">
              <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all
                ${step === s ? 'bg-ctg-green text-white shadow-md' : step > s ? 'bg-ctg-green/30 text-ctg-dark' : 'bg-gray-200 text-gray-400'}`}>
                {s}
              </span>
              <span className={`text-xs ${step === s ? 'text-ctg-dark font-semibold' : 'text-gray-400'}`}>{stepLabels[s-1]}</span>
              {s < 3 && <div className={`w-8 h-0.5 ${step > s ? 'bg-ctg-green' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* ── Step 1 — Cancha (opcional) ── */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-card p-6">
            <h2 className="text-lg font-bold text-ctg-dark mb-1">Selecciona la cancha</h2>
            <p className="text-sm text-gray-400 mb-4">Opcional — puedes dejar que el sistema elija</p>

            <div className="grid grid-cols-2 gap-3 mb-3">
              {courts.map(court => (
                <button key={court.id} onClick={() => { setSelectedCourt(court); setAnyCourtMode(false); }}
                  className={`p-5 rounded-xl border-2 transition-all text-center
                    ${selectedCourt?.id === court.id && !anyCourtMode
                      ? 'border-ctg-green bg-ctg-light/30 shadow-md'
                      : 'border-gray-200 hover:border-ctg-green/50'}`}>
                  <div className="text-3xl mb-1">🎾</div>
                  <p className="font-bold text-ctg-dark text-sm">{court.name}</p>
                </button>
              ))}
            </div>

            {/* Opción sin preferencia */}
            <button onClick={() => { setAnyCourtMode(true); setSelectedCourt(null); }}
              className={`w-full py-3 rounded-xl border-2 text-sm font-medium transition-all mb-4
                ${anyCourtMode ? 'border-ctg-green bg-ctg-light/30 text-ctg-dark shadow-md' : 'border-dashed border-gray-300 text-gray-500 hover:border-ctg-green/50'}`}>
              🎲 Sin preferencia — asignar automáticamente
            </button>

            <button onClick={() => { if (canProceedToStep2) setStep(2); }} disabled={!canProceedToStep2}
              className="w-full py-3 bg-ctg-green text-white font-bold rounded-xl disabled:opacity-40 hover:bg-ctg-lime transition">
              Continuar →
            </button>
          </div>
        )}

        {/* ── Step 2 — Fecha y hora ── */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-ctg-dark">Selecciona la fecha</h2>
                <button onClick={() => setStep(1)} className="text-sm text-ctg-green hover:underline">← Cancha</button>
              </div>
              {/* Badge cancha seleccionada */}
              <div className="mb-3">
                {anyCourtMode
                  ? <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">🎲 Cualquier cancha disponible</span>
                  : <span className="text-xs bg-ctg-light text-ctg-dark px-2 py-1 rounded-full">🎾 {selectedCourt?.name}</span>
                }
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
                      // En modo any, mostrar qué cancha quedará asignada
                      const assignedCourt = anyCourtMode && s.available ? getAutoAssignedCourt(s.slot) : null;
                      return (
                        <button key={s.slot} disabled={!s.available} onClick={() => setSelectedSlot(s.slot)}
                          className={`p-3 rounded-xl border-2 text-sm font-medium transition-all
                            ${!s.available ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                              : isSelected ? 'border-ctg-green bg-ctg-green text-white shadow-md'
                              : 'border-gray-200 hover:border-ctg-green/50 text-ctg-dark'}`}>
                          <div>{s.slot} hrs</div>
                          {isHighDemand && <div className={`text-xs mt-0.5 ${isSelected ? 'text-white/80' : 'text-orange-500'}`}>🔥 Alta demanda</div>}
                          {!s.available && <div className="text-xs mt-0.5 text-gray-400">Ocupado</div>}
                          {assignedCourt && !isSelected && <div className="text-xs mt-0.5 text-gray-400">{assignedCourt.name}</div>}
                          {assignedCourt && isSelected && <div className="text-xs mt-0.5 text-white/80">{assignedCourt.name}</div>}
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

        {/* ── Step 3 — Confirmar ── */}
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
                <span className="font-semibold text-ctg-dark">
                  {anyCourtMode
                    ? selectedSlot ? `${getAutoAssignedCourt(selectedSlot)?.name || '—'} (auto)` : '—'
                    : selectedCourt?.name}
                </span>
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

            {/* ── Cuenta Profe — selector de nombre ── */}
            {isProfe && schoolNames.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la escuela <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {schoolNames.map(name => (
                    <button key={name} type="button" onClick={() => setSchoolName(name)}
                      className={`py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all text-left
                        ${schoolName === name
                          ? 'border-ctg-green bg-ctg-light/30 text-ctg-dark shadow-md'
                          : 'border-gray-200 text-gray-600 hover:border-ctg-green/50'}`}>
                      🎾 Escuela {name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Socio normal — compañero ── */}
            {!isProfe && (
              <div className="mb-6 space-y-3">
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
                    <p className="text-xs text-gray-400 mt-1">Si vas con alguien externo, marca la opción de abajo</p>
                  </div>
                )}

                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                  <input type="checkbox" checked={hasGuest}
                    onChange={e => { setHasGuest(e.target.checked); if (e.target.checked) setPartnerPlayerId(''); }}
                    className="w-4 h-4 accent-ctg-green" />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Voy solo o traigo un invitado externo (+$3.000)</span>
                    <p className="text-xs text-gray-400">Persona que no es socio del club</p>
                  </div>
                </label>

                {hasGuest && (
                  <input type="text" value={guestName} onChange={e => setGuestName(e.target.value)}
                    placeholder="Nombre del invitado"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ctg-green" />
                )}
              </div>
            )}

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