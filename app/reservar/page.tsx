'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import LoginModal from '@/components/LoginModal';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { toDateStr } from '@/lib/utils';

const DAYS   = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function formatDate(d: Date) {
  return d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
}
function isSlotPast(dateStr: string, slot: string): boolean {
  const [h, m] = slot.split(':').map(Number);
  const slotTime = new Date(dateStr + 'T00:00:00');
  slotTime.setHours(h, m, 0, 0);
  return slotTime <= new Date();
}

const CheckIcon = () => (
  <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 13l4 4L19 7" />
  </svg>
);
const CalIcon = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2zM8 3v4M16 3v4" />
  </svg>
);

function StepIndicator({ step }: { step: number }) {
  const labels = ['Cancha', 'Fecha y hora', 'Confirmar'];
  return (
    <div className="flex items-center gap-1.5">
      {labels.map((label, i) => {
        const n = i + 1;
        const status = n < step ? 'done' : n === step ? 'active' : 'future';
        return (
          <div key={n} className="flex items-center gap-1.5 flex-1 last:flex-initial">
            <div className="flex flex-col items-center">
              <div className={'w-9 h-9 rounded-full font-bold text-sm flex items-center justify-center transition-all ' +
                (status === 'active' ? 'bg-ctg-green text-[#0a1608] shadow-[0_0_15px_rgba(139,194,52,.4)]' :
                 status === 'done'   ? 'bg-ctg-green/25 text-ctg-green' :
                 'bg-[#152b18] border border-[#1e4020] text-[#F0F7E8]/30')}>
                {status === 'done' ? <CheckIcon /> : n}
              </div>
              <div className={'text-xs font-medium mt-1.5 ' + (status === 'active' ? 'text-ctg-green' : status === 'done' ? 'text-[#F0F7E8]/55' : 'text-[#F0F7E8]/30')}>
                {label}
              </div>
            </div>
            {n < labels.length && (
              <div className={'h-0.5 flex-1 mt-[-18px] rounded-full ' + (n < step ? 'bg-ctg-green/60' : 'bg-[#1e4020]')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Calendar({ selectedDate, onSelect }: { selectedDate: Date | null; onSelect: (d: Date) => void }) {
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
  const today = new Date(todayStr + 'T00:00:00');
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
        <button type="button" onClick={prevMonth}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#152b18] transition text-[#F0F7E8]/60 text-lg font-bold">‹</button>
        <span className="font-semibold text-[#F0F7E8] text-sm">{MONTHS[viewMonth]} {viewYear}</span>
        <button type="button" onClick={nextMonth}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#152b18] transition text-[#F0F7E8]/60 text-lg font-bold">›</button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => <div key={d} className="text-center text-xs font-semibold text-[#F0F7E8]/35 py-1">{d}</div>)}
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
                ${isSelected ? 'bg-ctg-green text-[#0a1608] shadow-[0_0_12px_rgba(139,194,52,.4)]'
                  : isToday && !isDisabled ? 'border-2 border-ctg-green text-ctg-green'
                  : isDisabled ? 'text-[#F0F7E8]/20 cursor-not-allowed'
                  : 'text-[#F0F7E8]/70 hover:bg-[#152b18]'}`}>
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SummaryRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[#F0F7E8]/50">{label}</span>
      <span className={'text-[#F0F7E8] font-semibold ' + (mono ? 'font-mono' : '')}>{value}</span>
    </div>
  );
}

export default function ReservarPage() {
  const { player, loading: authLoading, refreshPlayer } = useAuth();
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);

  const isProfe = (player as any)?.member_type === 'profe';

  const [step, setStep] = useState<1|2|3>(1);

  // Step 1
  const [courts, setCourts]               = useState<any[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<any | null>(null);
  const [anyCourtMode, setAnyCourtMode]   = useState(false);

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
  const [schoolName, setSchoolName]           = useState('');
  const [submitting, setSubmitting]           = useState(false);
  const [formError, setFormError]             = useState('');
  const [success, setSuccess]                 = useState(false);
  const [confirmedCourt, setConfirmedCourt]   = useState<any | null>(null);

  useEffect(() => {
    api.getCourts().then(setCourts);
    api.getPlayers().then(setAllPlayers);
  }, []);

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

  const getSlotsToShow = () => {
    if (!availability) return [];
    if (anyCourtMode) {
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

    const finalCourt = anyCourtMode ? getAutoAssignedCourt(selectedSlot) : selectedCourt;
    if (!finalCourt) { setFormError('No hay cancha disponible para ese horario.'); return; }

    if (!isProfe) {
      if (!hasGuest && !partnerPlayerId) {
        setFormError('Debes seleccionar con quién vas o marcar que traes un invitado externo.');
        return;
      }
      if (hasGuest && !guestName.trim()) { setFormError('Ingresa el nombre del invitado.'); return; }
    } else {
      if (!schoolName) { setFormError('Debes seleccionar el nombre de la escuela.'); return; }
    }

    setSubmitting(true);
    setFormError('');
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
      setFormError(err.message || 'Error al crear reserva');
    } finally {
      setSubmitting(false);
    }
  };

  const canProceedToStep2 = selectedCourt || anyCourtMode;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a1608] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-ctg-green/20 border-t-ctg-green animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a1608]">
        <Header onLoginClick={() => setShowLogin(true)} />
        <div className="max-w-md mx-auto px-4 pt-28 pb-24 text-center">
          <div className="bg-[#0f2211] border border-ctg-green/20 rounded-2xl p-10 animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-ctg-green/15 border border-ctg-green/40 flex items-center justify-center mx-auto mb-6 animate-glow-pulse">
              <div className="w-14 h-14 rounded-full bg-ctg-green flex items-center justify-center text-[#0a1608]">
                <CheckIcon />
              </div>
            </div>
            <h2 className="font-display text-3xl font-bold text-[#F0F7E8]">¡Reserva confirmada!</h2>
            <p className="text-[#F0F7E8]/55 text-sm mt-2 mb-6">Tu cancha está reservada. Te esperamos.</p>
            <div className="bg-[#152b18] border border-[#1e4020] rounded-xl p-5 text-left space-y-2 mb-6">
              <SummaryRow label="Cancha" value={confirmedCourt?.name || selectedCourt?.name || '—'} />
              <SummaryRow label="Fecha" value={selectedDate ? formatDate(selectedDate) : '—'} />
              <SummaryRow label="Hora" value={selectedSlot ? `${selectedSlot} hrs` : '—'} mono />
              {isProfe && schoolName && <SummaryRow label="Escuela" value={schoolName} />}
              {!isProfe && !hasGuest && partnerPlayerId && <SummaryRow label="Compañero" value={selectedPartnerName} />}
              {!isProfe && hasGuest && <SummaryRow label="Invitado" value={`${guestName} (+$3.000)`} />}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setSuccess(false); setStep(1); setSelectedCourt(null); setAnyCourtMode(false); setSelectedDate(null); setSelectedSlot(null); setPartnerPlayerId(''); setGuestName(''); setHasGuest(false); setSchoolName(''); }}
                className="btn-ghost flex-1">
                Otra reserva
              </button>
              <button onClick={() => router.push('/mis-reservas')} className="btn-primary flex-1">
                Mis reservas
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1608]">
      <Header onLoginClick={() => setShowLogin(true)} />

      <div className="max-w-lg mx-auto px-4 pt-28 pb-24 md:pb-10">
        <div className="mb-8">
          <p className="text-ctg-green/70 text-xs font-bold uppercase tracking-[0.2em] mb-1">Tres pasos · confirmación inmediata</p>
          <h1 className="font-display text-3xl font-extrabold text-[#F0F7E8]">Reservar cancha</h1>
        </div>

        <StepIndicator step={step} />

        <div className="mt-8 animate-fade-in" key={step}>
          {/* ── Step 1 — Cancha ── */}
          {step === 1 && (
            <div className="bg-[#0f2211] border border-[#1e4020] rounded-2xl p-6">
              <h2 className="font-display text-xl font-bold text-[#F0F7E8] mb-1">Elige una cancha</h2>
              <p className="text-[#F0F7E8]/45 text-sm mb-5">Puedes dejar "sin preferencia" si te da igual</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {courts.map(court => (
                  <button key={court.id} onClick={() => { setSelectedCourt(court); setAnyCourtMode(false); }}
                    className={'p-5 rounded-xl border-2 transition-all text-center ' +
                      (selectedCourt?.id === court.id && !anyCourtMode
                        ? 'bg-ctg-green/10 border-ctg-green/60 shadow-[0_0_20px_rgba(139,194,52,.15)]'
                        : 'bg-[#152b18] border-[#1e4020] hover:border-ctg-green/35')}>
                    <div className={'w-14 h-14 rounded-xl border-2 mx-auto flex items-center justify-center font-display font-black text-2xl transition ' +
                      (selectedCourt?.id === court.id && !anyCourtMode
                        ? 'border-ctg-green text-ctg-green'
                        : 'border-ctg-green/35 text-ctg-green/70')}>
                      {court.name.replace(/\D/g, '')}
                    </div>
                    <div className="font-semibold text-[#F0F7E8] text-sm mt-3">{court.name}</div>
                    {court.surface && <div className="text-[#F0F7E8]/45 text-xs mt-0.5">{court.surface}</div>}
                  </button>
                ))}
              </div>
              <button onClick={() => { setAnyCourtMode(true); setSelectedCourt(null); }}
                className={'mt-1 w-full rounded-xl border-2 border-dashed text-sm font-medium py-3 transition ' +
                  (anyCourtMode
                    ? 'border-ctg-green/55 bg-ctg-green/5 text-ctg-green'
                    : 'border-[#1e4020] text-[#F0F7E8]/45 hover:border-ctg-green/35 hover:text-[#F0F7E8]/70')}>
                Sin preferencia · cualquier cancha disponible
              </button>
            </div>
          )}

          {/* ── Step 2 — Fecha y hora ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="bg-[#0f2211] border border-[#1e4020] rounded-2xl p-4 md:p-6">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h2 className="font-display text-xl font-bold text-[#F0F7E8]">Fecha</h2>
                  {(selectedCourt || anyCourtMode) && (
                    <span className="bg-ctg-green/10 text-ctg-green text-xs rounded-full px-3 py-1 border border-ctg-green/25">
                      {anyCourtMode ? 'Sin preferencia' : selectedCourt?.name}
                    </span>
                  )}
                </div>
                <Calendar selectedDate={selectedDate} onSelect={setSelectedDate} />
                {selectedDate && (
                  <div className="text-ctg-green text-xs font-semibold mt-3 capitalize flex items-center gap-1.5">
                    <CalIcon />
                    {formatDate(selectedDate)}
                  </div>
                )}
              </div>

              {selectedDate && (
                <div className="bg-[#0f2211] border border-[#1e4020] rounded-2xl p-4 md:p-6">
                  <h2 className="font-display text-xl font-bold text-[#F0F7E8] mb-4">Horario</h2>
                  {loadingSlots ? (
                    <div className="flex justify-center py-8">
                      <div className="w-8 h-8 rounded-full border-2 border-ctg-green/20 border-t-ctg-green animate-spin" />
                    </div>
                  ) : courtSlots.length === 0 ? (
                    <div className="text-center py-8 text-[#F0F7E8]/40 text-sm">No hay horarios disponibles para este día.</div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {courtSlots.map((s: any) => {
                        const isHighDemand  = highDemandSlots.includes(s.slot);
                        const isSelected    = selectedSlot === s.slot;
                        const assignedCourt = anyCourtMode && s.available ? getAutoAssignedCourt(s.slot) : null;
                        return (
                          <button key={s.slot} disabled={!s.available} onClick={() => setSelectedSlot(s.slot)}
                            className={'p-3 rounded-xl border-2 text-sm font-medium transition-all ' +
                              (!s.available
                                ? 'border-[#1e4020] bg-[#152b18]/50 text-[#F0F7E8]/20 cursor-not-allowed'
                                : isSelected
                                ? 'border-ctg-green bg-ctg-green/10 text-ctg-green shadow-[0_0_15px_rgba(139,194,52,.2)]'
                                : 'border-[#1e4020] bg-[#152b18] hover:border-ctg-green/40 text-[#F0F7E8]/80')}>
                            <div className="font-mono">{s.slot}</div>
                            {isHighDemand && <div className={`text-xs mt-0.5 ${isSelected ? 'text-ctg-green/80' : 'text-orange-400'}`}>🔥 Alta demanda</div>}
                            {!s.available && <div className="text-xs mt-0.5">Ocupado</div>}
                            {assignedCourt && <div className={`text-xs mt-0.5 ${isSelected ? 'text-ctg-green/70' : 'text-[#F0F7E8]/35'}`}>{assignedCourt.name}</div>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Step 3 — Confirmar ── */}
          {step === 3 && (
            <div className="bg-[#0f2211] border border-[#1e4020] rounded-2xl p-6">
              <h2 className="font-display text-xl font-bold text-[#F0F7E8] mb-6">Confirmar reserva</h2>

              <div className="bg-[#152b18] border border-[#1e4020] rounded-xl p-4 mb-6 space-y-2">
                <SummaryRow
                  label="Cancha"
                  value={anyCourtMode
                    ? selectedSlot ? `${getAutoAssignedCourt(selectedSlot)?.name || '—'} (auto)` : '—'
                    : selectedCourt?.name || '—'}
                />
                <SummaryRow label="Fecha" value={selectedDate ? formatDate(selectedDate) : '—'} />
                <SummaryRow label="Horario" value={selectedSlot ? `${selectedSlot} hrs` : '—'} mono />
                {selectedSlot && highDemandSlots.includes(selectedSlot) && (
                  <SummaryRow label="Turno" value="🔥 Alta demanda" />
                )}
              </div>

              {/* Profe — selector de escuela */}
              {isProfe && schoolNames.length > 0 && (
                <div className="mb-6">
                  <label className="label block mb-2">Nombre de la escuela <span className="text-red-400">*</span></label>
                  <div className="grid grid-cols-2 gap-2">
                    {schoolNames.map(name => (
                      <button key={name} type="button" onClick={() => setSchoolName(name)}
                        className={'py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all text-left ' +
                          (schoolName === name
                            ? 'border-ctg-green bg-ctg-green/10 text-ctg-green'
                            : 'border-[#1e4020] bg-[#152b18] text-[#F0F7E8]/60 hover:border-ctg-green/40')}>
                        Escuela {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Socio normal — compañero */}
              {!isProfe && (
                <div className="mb-6 space-y-3">
                  {!hasGuest && (
                    <div>
                      <label className="label block mb-1.5">¿Con quién vas? <span className="text-red-400">*</span></label>
                      <select value={partnerPlayerId} onChange={e => setPartnerPlayerId(e.target.value)} className="select w-full">
                        <option value="">— Selecciona un socio —</option>
                        {availablePartners.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <p className="text-xs text-[#F0F7E8]/35 mt-1">Si vas con alguien externo, marca la opción de abajo</p>
                    </div>
                  )}

                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-[#1e4020] bg-[#152b18] hover:border-ctg-green/25 transition">
                    <input type="checkbox" checked={hasGuest}
                      onChange={e => { setHasGuest(e.target.checked); if (e.target.checked) setPartnerPlayerId(''); }}
                      className="w-4 h-4 accent-ctg-green" />
                    <div>
                      <span className="text-sm font-medium text-[#F0F7E8]/80">Voy solo o traigo un invitado externo (+$3.000)</span>
                      <p className="text-xs text-[#F0F7E8]/35">Persona que no es socio del club</p>
                    </div>
                  </label>

                  {hasGuest && (
                    <input type="text" value={guestName} onChange={e => setGuestName(e.target.value)}
                      placeholder="Nombre del invitado"
                      className="field w-full" />
                  )}
                </div>
              )}

              {!player && (
                <div className="bg-amber-900/20 border border-amber-500/20 text-amber-300/80 rounded-xl p-3 text-sm mb-4">
                  Debes iniciar sesión para reservar.
                </div>
              )}

              {formError && (
                <div className="bg-red-900/30 border border-red-500/30 text-red-400 rounded-xl p-3 text-sm mb-4">{formError}</div>
              )}
            </div>
          )}

          {formError && step < 3 && (
            <div className="bg-red-900/30 border border-red-500/30 text-red-400 rounded-xl p-3 text-sm mt-4">{formError}</div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button onClick={() => { setFormError(''); setStep(s => (s - 1) as 1|2|3); }} className="btn-ghost flex-1">
                ← Atrás
              </button>
            )}
            {step === 1 && (
              <button onClick={() => { if (!canProceedToStep2) { setFormError('Selecciona una cancha o "sin preferencia"'); return; } setFormError(''); setStep(2); }}
                className="btn-primary flex-1 py-3">
                Continuar
              </button>
            )}
            {step === 2 && (
              <button onClick={() => { if (!selectedDate || !selectedSlot) { setFormError('Selecciona fecha y horario'); return; } setFormError(''); setStep(3); }}
                className="btn-primary flex-1 py-3">
                Continuar
              </button>
            )}
            {step === 3 && (
              <button onClick={player ? handleSubmit : () => setShowLogin(true)} disabled={submitting}
                className="btn-primary flex-1 py-3">
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#0a1608] border-t-transparent rounded-full animate-spin" />
                    Reservando...
                  </span>
                ) : player ? 'Confirmar reserva' : 'Iniciar sesión para reservar'}
              </button>
            )}
          </div>
        </div>
      </div>

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} onSuccess={() => { setShowLogin(false); refreshPlayer(); }} />
    </div>
  );
}
