'use client';
import { CATEGORIES } from '@/lib/ladder';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import LoginPrompt from '@/components/LoginPrompt';
import { MasterSeason, MasterGroup, MasterMatch } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  A: { bg: 'from-yellow-400 to-yellow-500', border: 'border-yellow-400', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800' },
  B: { bg: 'from-gray-400 to-gray-500',     border: 'border-gray-400',   text: 'text-gray-700',   badge: 'bg-gray-100 text-gray-800'   },
  C: { bg: 'from-orange-400 to-orange-500', border: 'border-orange-400', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-800' },
  D: { bg: 'from-green-400 to-green-500',   border: 'border-green-400',  text: 'text-green-700',  badge: 'bg-green-100 text-green-800'  },
};
const CATEGORY_NAMES: Record<string, string> = { A: 'Oro', B: 'Plata', C: 'Bronce', D: 'Verde' };

const DAYS   = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const TIME_SLOTS = [
  { label: '06:00 - 07:30', start: '06:00' },
  { label: '07:45 - 09:15', start: '07:45' },
  { label: '09:30 - 11:00', start: '09:30' },
  { label: '11:15 - 12:45', start: '11:15' },
  { label: '13:00 - 14:30', start: '13:00' },
  { label: '14:45 - 16:15', start: '14:45' },
  { label: '16:30 - 18:00', start: '16:30' },
  { label: '18:15 - 19:45', start: '18:15' },
  { label: '20:00 - 21:30', start: '20:00' },
  { label: '21:45 - 23:15', start: '21:45' },
];

type MasterMatchExt = MasterMatch & { scheduled_date?: string | null; player1_result?: any; player2_result?: any };

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// ── Calendar ──────────────────────────────────────────────────────────────────
function Calendar({ selectedDate, onSelect, minDate, maxDate }: {
  selectedDate: Date | null; onSelect: (d: Date) => void; minDate: Date; maxDate: Date;
}) {
  const today = new Date(); today.setHours(0,0,0,0);
  const [viewYear,  setViewYear]  = useState(minDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(minDate.getMonth());

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1); } else setViewMonth(m => m-1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1); } else setViewMonth(m => m+1); };

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const offset      = (firstDay + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth+1, 0).getDate();
  const cells: (number|null)[] = [...Array(offset).fill(null), ...Array.from({length: daysInMonth}, (_,i) => i+1)];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#152b18] transition text-[#F0F7E8]/60 font-bold">‹</button>
        <span className="font-semibold text-[#F0F7E8] text-sm">{MONTHS[viewMonth]} {viewYear}</span>
        <button type="button" onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#152b18] transition text-[#F0F7E8]/60 font-bold">›</button>
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
          const isDisabled = date < minDate || date > maxDate;
          return (
            <button key={idx} type="button" disabled={isDisabled} onClick={() => onSelect(date)}
              className={`mx-auto w-8 h-8 rounded-full text-sm font-medium flex items-center justify-center transition-all
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

// ── Schedule Modal ────────────────────────────────────────────────────────────
function MasterScheduleModal({ match, onClose, onSubmit, minDate, maxDate }: {
  match: MasterMatchExt; onClose: () => void; onSubmit: (iso: string, courtId: string) => Promise<void>;
  minDate: Date; maxDate: Date;
}) {
  const [courts, setCourts]               = useState<{ id: string; name: string }[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<{ id: string; name: string } | null>(null);
  const [selectedDate, setSelectedDate]   = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot]   = useState<string | null>(null);
  const [availability, setAvailability]   = useState<any | null>(null);
  const [loadingSlots, setLoadingSlots]   = useState(false);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const now = new Date();

  // No permitir fechas pasadas: el mínimo efectivo es el mayor entre el inicio del round y hoy
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const effMinDate = minDate > today ? minDate : today;

  useEffect(() => { api.getCourts().then(setCourts).catch(() => setCourts([])); }, []);

  // Al tener cancha + fecha, consultar disponibilidad real (reservas + bloqueos)
  useEffect(() => {
    if (!selectedCourt || !selectedDate) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    const ymd = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`;
    api.getAvailability(ymd)
      .then(setAvailability)
      .catch(() => setAvailability(null))
      .finally(() => setLoadingSlots(false));
  }, [selectedCourt, selectedDate]);

  const fmt = (d: Date) => d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' });
  const formatDisplay = (d: Date) => d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
  const roundLabel =
    match.round === 'group' ? 'Round Robin'
    : match.round === 'playoff' ? 'Playoff'
    : match.round === 'final' ? 'Final'
    : 'Semifinal';

  // Slots de la cancha elegida: ocupado (reserva/bloqueo) o pasado (hoy) → no disponible
  const getAvailableSlots = () => {
    if (!selectedDate || !selectedCourt) return [];
    const courtSlots = availability?.courts?.find((c: any) => c.id === selectedCourt.id)?.slots || [];
    const highDemand: string[] = availability?.high_demand_slots || [];
    return TIME_SLOTS.map(slot => {
      const courtSlot = courtSlots.find((cs: any) => cs.slot === slot.start);
      const isOccupied = courtSlot ? !courtSlot.available : false;
      const isPast = isSameDay(selectedDate, now) && (() => {
        const [h, m] = slot.start.split(':').map(Number);
        const t = new Date(selectedDate); t.setHours(h, m, 0, 0);
        return t <= now;
      })();
      return { ...slot, available: !isOccupied && !isPast, isHighDemand: highDemand.includes(slot.start) };
    });
  };

  const handleSubmit = async () => {
    setError('');
    if (!selectedCourt) { setError('Debes seleccionar una cancha.'); return; }
    if (!selectedDate || !selectedSlot) { setError('Debes seleccionar fecha y horario.'); return; }
    const [h, m] = selectedSlot.split(':').map(Number);
    const final = new Date(selectedDate); final.setHours(h, m, 0, 0);
    if (final <= now) { setError('El horario seleccionado ya pasó.'); return; }
    if (final > maxDate) { setError('La fecha supera el límite del round.'); return; }
    setLoading(true);
    try { await onSubmit(final.toISOString(), selectedCourt.id); onClose(); }
    catch (err: any) { setError(err.message || 'Error al fijar la fecha.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0f2211] border border-ctg-green/15 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="bg-[#152b18] border-b border-[#1e4020] px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="font-display text-xl font-bold text-[#F0F7E8]">Agendar partido</h2>
            <p className="text-[#F0F7E8]/45 text-sm mt-0.5">{match.player1.name} vs {match.player2.name}</p>
          </div>
          <button onClick={onClose} className="text-[#F0F7E8]/30 hover:text-[#F0F7E8] text-2xl leading-none transition">×</button>
        </div>
        <div className="p-6 space-y-6">
          <div className="bg-amber-900/20 border border-amber-500/20 rounded-xl px-4 py-2 text-sm text-amber-300/80 flex items-center gap-2">
            <span>{roundLabel}:</span>
            <span><strong className="text-amber-300">{fmt(minDate)}</strong> — <strong className="text-amber-300">{fmt(maxDate)}</strong></span>
          </div>

          {/* Paso 1 — Cancha */}
          <div>
            <p className="text-sm font-semibold text-[#F0F7E8]/70 mb-3 flex items-center gap-1">
              <span className="w-5 h-5 rounded-full bg-ctg-green text-[#0a1608] text-xs flex items-center justify-center font-bold">1</span>
              Selecciona la cancha
            </p>
            <div className="grid grid-cols-2 gap-3">
              {courts.map(court => (
                <button key={court.id} type="button" onClick={() => { setSelectedCourt(court); setSelectedSlot(null); setError(''); }}
                  className={'p-3 rounded-xl border-2 text-sm font-semibold transition-all text-center ' +
                    (selectedCourt?.id === court.id
                      ? 'border-ctg-green bg-ctg-green/10 text-ctg-green shadow-[0_0_12px_rgba(139,194,52,.2)]'
                      : 'border-[#1e4020] bg-[#152b18] text-[#F0F7E8]/60 hover:border-ctg-green/40')}>
                  🎾 {court.name}
                </button>
              ))}
            </div>
          </div>

          {/* Paso 2 — Fecha */}
          <div>
            <p className={'text-sm font-semibold mb-3 flex items-center gap-1 ' + (selectedCourt ? 'text-[#F0F7E8]/70' : 'text-[#F0F7E8]/30')}>
              <span className={'w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ' + (selectedCourt ? 'bg-ctg-green text-[#0a1608]' : 'bg-[#152b18] border border-[#1e4020] text-[#F0F7E8]/30')}>2</span>
              Selecciona la fecha
            </p>
            {!selectedCourt ? (
              <div className="rounded-xl border border-dashed border-[#1e4020] py-6 text-center text-[#F0F7E8]/30 text-sm">Primero elige una cancha</div>
            ) : (
              <>
                <div className="border border-[#1e4020] rounded-xl p-4">
                  <Calendar selectedDate={selectedDate} onSelect={d => { setSelectedDate(d); setSelectedSlot(null); setError(''); }} minDate={effMinDate} maxDate={maxDate} />
                </div>
                {selectedDate && <p className="text-xs text-ctg-green font-semibold mt-2 ml-1 capitalize">{formatDisplay(selectedDate)}</p>}
              </>
            )}
          </div>

          {/* Paso 3 — Horario */}
          <div>
            <p className={'text-sm font-semibold mb-3 flex items-center gap-1 ' + (selectedDate ? 'text-[#F0F7E8]/70' : 'text-[#F0F7E8]/30')}>
              <span className={'w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ' + (selectedDate ? 'bg-ctg-green text-[#0a1608]' : 'bg-[#152b18] border border-[#1e4020] text-[#F0F7E8]/30')}>3</span>
              Selecciona el horario
            </p>
            {!selectedDate ? (
              <div className="rounded-xl border border-dashed border-[#1e4020] py-6 text-center text-[#F0F7E8]/30 text-sm">Primero elige una fecha</div>
            ) : loadingSlots ? (
              <div className="text-center py-6"><div className="w-6 h-6 rounded-full border-2 border-ctg-green/20 border-t-ctg-green animate-spin mx-auto" /></div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {getAvailableSlots().map(slot => (
                  <button key={slot.start} type="button" disabled={!slot.available}
                    onClick={() => { if (slot.available) { setSelectedSlot(slot.start); setError(''); } }}
                    className={'py-3 px-2 rounded-xl text-sm font-semibold border-2 transition-all ' +
                      (!slot.available
                        ? 'bg-[#0a1608] border-[#152b18] text-[#F0F7E8]/20 cursor-not-allowed'
                        : selectedSlot === slot.start
                          ? 'bg-ctg-green/10 border-ctg-green text-ctg-green shadow-[0_0_12px_rgba(139,194,52,.2)]'
                          : 'bg-[#152b18] border-[#1e4020] text-[#F0F7E8]/60 hover:border-ctg-green/40')}>
                    <div>{slot.label}</div>
                    {slot.isHighDemand && slot.available && <div className={'text-xs mt-0.5 ' + (selectedSlot === slot.start ? 'text-ctg-green/70' : 'text-orange-400')}>🔥 Alta demanda</div>}
                    {!slot.available && <div className="text-xs mt-0.5 text-[#F0F7E8]/25">Ocupado</div>}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Resumen */}
          {selectedCourt && selectedDate && selectedSlot && (
            <div className="bg-ctg-green/10 border border-ctg-green/20 rounded-xl px-4 py-3 text-sm text-ctg-green font-semibold space-y-1">
              <div>🎾 {selectedCourt.name}</div>
              <div className="capitalize">✓ {formatDisplay(selectedDate)}, {TIME_SLOTS.find(s => s.start === selectedSlot)?.label}</div>
            </div>
          )}
          {error && <div className="bg-red-900/30 border border-red-500/30 text-red-400 rounded-xl p-3 text-sm">{error}</div>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
            <button type="button" onClick={handleSubmit} disabled={loading || !selectedCourt || !selectedDate || !selectedSlot}
              className="btn-primary flex-1">
              {loading ? 'Guardando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Result Modal ──────────────────────────────────────────────────────────────
function MasterResultModal({ match, onClose, onSubmit }: {
  match: MasterMatchExt; onClose: () => void; onSubmit: (winnerId: string, score: string) => Promise<void>;
}) {
  const [set1P1, setSet1P1] = useState(''); const [set1P2, setSet1P2] = useState('');
  const [set2P1, setSet2P1] = useState(''); const [set2P2, setSet2P2] = useState('');
  const [set3P1, setSet3P1] = useState(''); const [set3P2, setSet3P2] = useState('');
  const [stP1,   setStP1]   = useState(''); const [stP2,   setStP2]   = useState('');
  const [hasRetirement, setHasRetirement] = useState(false);
  const [retiredId, setRetiredId] = useState('');
  const [loading, setLoading] = useState(false);

  const p1 = match.player1;
  const p2 = match.player2;
  const hasAnyScore = () => set1P1 !== '' || set1P2 !== '';

  const calculateWinner = (): { winnerId: string; score: string } | null => {
    if (hasRetirement && !hasAnyScore()) {
      if (!retiredId) { alert('Selecciona quién se retiró / hizo W.O.'); return null; }
      return { winnerId: retiredId === p1.id ? p2.id : p1.id, score: 'W.O.' };
    }
    if (!set1P1 || !set1P2) { alert('Debes ingresar al menos el primer set'); return null; }

    const s = [[parseInt(set1P1)||0, parseInt(set1P2)||0], [parseInt(set2P1)||0, parseInt(set2P2)||0],
               [parseInt(set3P1)||0, parseInt(set3P2)||0], [parseInt(stP1)||0, parseInt(stP2)||0]];
    const vals = [[set1P1,set1P2],[set2P1,set2P2],[set3P1,set3P2],[stP1,stP2]];
    let sP1 = 0, sP2 = 0;
    vals.forEach(([a,b], i) => { if (a && b) { if (s[i][0] > s[i][1]) sP1++; else if (s[i][1] > s[i][0]) sP2++; } });

    let winnerId: string;
    if (hasRetirement && retiredId) {
      winnerId = retiredId === p1.id ? p2.id : p1.id;
    } else if (sP1 > sP2) { winnerId = p1.id; }
    else if (sP2 > sP1) { winnerId = p2.id; }
    else { alert('Resultado inválido. Debe haber un ganador.'); return null; }

    const parts: string[] = [];
    vals.forEach(([a,b], i) => { if (a && b) parts.push(i === 3 ? `[${s[i][0]}-${s[i][1]}]` : `${s[i][0]}-${s[i][1]}`); });
    let score = parts.join(', ');
    if (hasRetirement) score += ' (Retiro)';
    return { winnerId, score };
  };

  const handleSubmit = async () => {
    const result = calculateWinner();
    if (!result) return;
    setLoading(true);
    try { await onSubmit(result.winnerId, result.score); onClose(); }
    catch (err: any) { alert(err.message || 'Error al ingresar resultado'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position:'fixed',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.7)',zIndex:99999,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px' }}
      onClick={onClose}>
      <div style={{ backgroundColor:'white',borderRadius:'16px',padding:'32px',maxWidth:'600px',width:'100%',position:'relative',maxHeight:'90vh',overflowY:'auto' }}
        onClick={e => e.stopPropagation()}>
        <button onClick={onClose} disabled={loading}
          style={{ position:'absolute',top:'12px',right:'12px',background:'#1e5128',color:'white',border:'none',borderRadius:'50%',width:'32px',height:'32px',cursor:'pointer',fontSize:'20px',fontWeight:'bold' }}>×</button>

        <h2 style={{ color:'#1e5128',marginBottom:'20px',fontSize:'24px',fontWeight:'bold',textAlign:'center' }}>🏆 Ingresar Resultado</h2>
        <p style={{ textAlign:'center',color:'#666',fontSize:'13px',marginBottom:'20px' }}>{p1.name} vs {p2.name}</p>

        {/* Retiro */}
        <div style={{ marginBottom:'16px' }}>
          <label style={{ display:'flex',alignItems:'center',gap:'10px',cursor:'pointer',padding:'10px',backgroundColor:'#fff3cd',borderRadius:'8px' }}>
            <input type="checkbox" checked={hasRetirement}
              onChange={e => { setHasRetirement(e.target.checked); if (!e.target.checked) setRetiredId(''); }}
              style={{ width:'18px',height:'18px' }} />
            <span style={{ fontSize:'14px',fontWeight:'bold',color:'#856404' }}>⚠️ Hubo retiro / W.O.</span>
          </label>
          {hasRetirement && (
            <div style={{ marginTop:'8px',padding:'10px',backgroundColor:'#fff8e1',borderRadius:'8px' }}>
              <p style={{ fontSize:'12px',color:'#856404',marginBottom:'8px',fontWeight:'bold' }}>¿Quién se retiró?</p>
              <div style={{ display:'flex',gap:'8px' }}>
                {[p1, p2].map(p => (
                  <button key={p.id} onClick={() => setRetiredId(p.id)}
                    style={{ flex:1,padding:'8px',borderRadius:'6px',border:'2px solid',borderColor:retiredId===p.id?'#856404':'#ddd',
                      backgroundColor:retiredId===p.id?'#fff3cd':'white',fontWeight:'bold',cursor:'pointer',fontSize:'12px' }}>
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sets */}
        <table style={{ width:'100%',borderCollapse:'separate',borderSpacing:0,marginBottom:'20px' }}>
          <thead>
            <tr>
              {['Jugador','Set 1','Set 2','Set 3','ST'].map((h,i) => (
                <th key={h} style={{ textAlign:i===0?'left':'center',padding:'10px',backgroundColor:'#f5f5f5',
                  fontWeight:'bold',fontSize:'13px',color:'#666',width:i===0?'auto':'70px',
                  borderTopLeftRadius:i===0?'8px':0,borderTopRightRadius:i===4?'8px':0 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { name:p1.name, vals:[set1P1,set2P1,set3P1,stP1], setters:[setSet1P1,setSet2P1,setSet3P1,setStP1] },
              { name:p2.name, vals:[set1P2,set2P2,set3P2,stP2], setters:[setSet1P2,setSet2P2,setSet3P2,setStP2] },
            ].map((row, ri) => (
              <tr key={ri}>
                <td style={{ padding:'12px',borderBottom:ri===0?'1px solid #e5e5e5':'none',fontWeight:'bold',fontSize:'14px' }}>{row.name}</td>
                {row.vals.map((val, ci) => (
                  <td key={ci} style={{ padding:'6px',borderBottom:ri===0?'1px solid #e5e5e5':'none',textAlign:'center' }}>
                    <input type="number" value={val} onChange={e => row.setters[ci](e.target.value)} min="0" max={ci===3?undefined:'7'}
                      style={{ width:'52px',padding:'6px',fontSize:'16px',fontWeight:'bold',textAlign:'center',borderRadius:'6px',
                        border:`2px solid ${ci===0?'#1e5128':'#ddd'}` }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ backgroundColor:'#f0f9ff',padding:'10px',borderRadius:'8px',marginBottom:'16px',fontSize:'12px',color:'#1e40af' }}>
          💡 Set 1 obligatorio. Para W.O. sin sets, marca retiro y selecciona quién se retiró.
        </div>

        <div style={{ display:'flex',gap:'12px' }}>
          <button onClick={onClose} disabled={loading}
            style={{ flex:1,padding:'12px',backgroundColor:'#6c757d',color:'white',border:'none',borderRadius:'10px',cursor:'pointer',fontSize:'15px',fontWeight:'bold' }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={loading}
            style={{ flex:1,padding:'12px',backgroundColor:'#4e9f3d',color:'white',border:'none',borderRadius:'10px',cursor:loading?'not-allowed':'pointer',fontSize:'15px',fontWeight:'bold' }}>
            {loading ? 'Enviando...' : 'Confirmar Resultado'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Standings Table ───────────────────────────────────────────────────────────
function StandingsTable({ group }: { group: MasterGroup }) {
  const sorted = [...group.players].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    return (b.sets_won - b.sets_lost) - (a.sets_won - a.sets_lost);
  });
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#0a1608]/60">
            <th className="px-3 py-2 text-left font-semibold text-[#F0F7E8]/40 text-xs uppercase tracking-wider">#</th>
            <th className="px-3 py-2 text-left font-semibold text-[#F0F7E8]/40 text-xs uppercase tracking-wider">Jugador</th>
            <th className="px-3 py-2 text-center font-semibold text-[#F0F7E8]/40 text-xs uppercase tracking-wider">PJ</th>
            <th className="px-3 py-2 text-center font-semibold text-ctg-green/70 text-xs uppercase tracking-wider">G</th>
            <th className="px-3 py-2 text-center font-semibold text-red-400/70 text-xs uppercase tracking-wider">P</th>
            <th className="px-3 py-2 text-center font-semibold text-[#F0F7E8]/40 text-xs uppercase tracking-wider">Sets</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e4020]">
          {sorted.map((gp, idx) => (
            <tr key={gp.id} className={idx < 2 ? 'bg-ctg-green/5' : ''}>
              <td className="px-3 py-2">
                {idx < 2
                  ? <span className="inline-flex w-6 h-6 bg-ctg-green text-[#0a1608] rounded-full items-center justify-center text-xs font-bold">{idx+1}</span>
                  : <span className="text-[#F0F7E8]/30 text-xs pl-1">{idx+1}</span>}
              </td>
              <td className="px-3 py-2 text-[#F0F7E8]">{gp.player.name}</td>
              <td className="px-3 py-2 text-center text-[#F0F7E8]/50">{gp.wins + gp.losses}</td>
              <td className="px-3 py-2 text-center text-ctg-green font-bold">{gp.wins}</td>
              <td className="px-3 py-2 text-center text-red-400">{gp.losses}</td>
              <td className="px-3 py-2 text-center text-[#F0F7E8]/40">{gp.sets_won}/{gp.sets_lost}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-[#F0F7E8]/30 px-3 py-2">Clasifican a semifinales (top 2 por grupo)</p>
    </div>
  );
}

// ── Match Card ────────────────────────────────────────────────────────────────
function MatchCard({ match, currentPlayerId, onSchedule, onResult, season }: {
  match: MasterMatchExt;
  currentPlayerId?: string;
  onSchedule: (matchId: string, isoDate: string, courtId: string) => Promise<void>;
  onResult: (matchId: string, winnerId: string, score: string) => Promise<void>;
  season: MasterSeason;
}) {
  const [showSchedule, setShowSchedule] = useState(false);
  const [showResult,   setShowResult]   = useState(false);

  const isCompleted = match.status === 'completed';
  const isMyMatch   = currentPlayerId && (match.player1_id === currentPlayerId || match.player2_id === currentPlayerId);

  // Ya ingresé mi resultado?
  const myResultIngresado = currentPlayerId && (
    (match.player1_id === currentPlayerId && match.player1_result) ||
    (match.player2_id === currentPlayerId && match.player2_result)
  );

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })} · ${d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
  };

  const toLocalMidnight = (iso: string) => {
    const d = new Date(iso);
    d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const getDateRange = () => {
    const now = new Date();
    // El playoff se juega ANTES del round robin: su tope es el inicio del round.
    if (match.round === 'playoff') return {
      minDate: now,
      maxDate: season.round_robin_start ? toLocalMidnight(season.round_robin_start) : now,
    };
    if (match.round === 'group') return {
      minDate: season.round_robin_start ? toLocalMidnight(season.round_robin_start) : now,
      maxDate: season.round_robin_end   ? toLocalMidnight(season.round_robin_end)   : now,
    };
    if (match.round === 'semifinal') return {
      minDate: season.round_robin_end ? toLocalMidnight(season.round_robin_end) : now,
      maxDate: season.final_date      ? toLocalMidnight(season.final_date)      : now,
    };
    return { minDate: now, maxDate: now };
  };

  const { minDate, maxDate } = getDateRange();

  return (
    <>
      <div className={'rounded-xl border p-3 ' +
        (isCompleted ? 'bg-ctg-green/5 border-ctg-green/20' :
         (match as any).status === 'disputed' ? 'bg-red-900/10 border-red-500/20' :
         'bg-[#152b18] border-[#1e4020]')}>
        {/* Players */}
        <div className="flex items-center justify-between">
          <div className="flex-1 text-right">
            <p className={'font-medium text-sm ' + (match.winner_id === match.player1_id ? 'text-ctg-green font-bold' : 'text-[#F0F7E8]/60')}>
              {match.winner_id === match.player1_id && <span className="mr-1">🏆</span>}
              {match.player1.name}
            </p>
          </div>
          <div className="mx-3 text-center min-w-[90px]">
            {isCompleted ? (
              <span className="text-xs font-mono font-bold text-[#F0F7E8]">{match.score}</span>
            ) : (match as any).status === 'disputed' ? (
              <span className="text-xs text-red-400 bg-red-900/30 border border-red-500/20 px-2 py-1 rounded-full">En disputa</span>
            ) : match.scheduled_date ? (
              <span className="text-xs text-blue-300 bg-blue-900/20 border border-blue-500/20 px-2 py-1 rounded-full">{formatDate(match.scheduled_date)}</span>
            ) : (
              <span className="text-xs text-[#F0F7E8]/35 bg-[#0a1608] border border-[#1e4020] px-2 py-1 rounded-full">Por jugar</span>
            )}
          </div>
          <div className="flex-1 text-left">
            <p className={'font-medium text-sm ' + (match.winner_id === match.player2_id ? 'text-ctg-green font-bold' : 'text-[#F0F7E8]/60')}>
              {match.player2.name}
              {match.winner_id === match.player2_id && <span className="ml-1">🏆</span>}
            </p>
          </div>
        </div>

        {/* Buttons — only my match and not completed */}
        {isMyMatch && !isCompleted && (match as any).status !== 'disputed' && (
          <div className="flex gap-2 mt-2">
            <button onClick={() => setShowSchedule(true)}
              className="flex-1 text-xs text-ctg-green border border-ctg-green/40 rounded-lg py-1.5 hover:bg-ctg-green/10 transition">
              {match.scheduled_date ? 'Cambiar fecha' : 'Fijar fecha'}
            </button>
            {!myResultIngresado ? (
              <button onClick={() => setShowResult(true)}
                className="flex-1 text-xs bg-ctg-green text-[#0a1608] rounded-lg py-1.5 hover:bg-ctg-lime transition font-bold">
                Ingresar resultado
              </button>
            ) : (
              <div className="flex-1 text-xs text-center text-ctg-green/60 py-1.5 bg-ctg-green/5 rounded-lg border border-ctg-green/20">
                ✓ Resultado ingresado
              </div>
            )}
          </div>
        )}
      </div>

      {showSchedule && (
        <MasterScheduleModal match={match} onClose={() => setShowSchedule(false)}
          onSubmit={(iso, courtId) => onSchedule(match.id, iso, courtId)} minDate={minDate} maxDate={maxDate} />
      )}
      {showResult && (
        <MasterResultModal match={match} onClose={() => setShowResult(false)}
          onSubmit={(winnerId, score) => onResult(match.id, winnerId, score)} />
      )}
    </>
  );
}

// ── Bracket Match ─────────────────────────────────────────────────────────────
function BracketMatch({ match, label }: { match: MasterMatchExt; label: string }) {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' }) +
      ' · ' + d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });
  };
  return (
    <div className="bg-[#0f2211] border border-ctg-green/20 rounded-xl p-4 border-l-4">
      <p className="text-xs font-bold text-ctg-green mb-3 uppercase tracking-wide">{label}</p>
      <div className="space-y-2">
        {[
          { player: match.player1, isWinner: match.winner_id === match.player1_id },
          { player: match.player2, isWinner: match.winner_id === match.player2_id },
        ].map(({ player, isWinner }, i) => (
          <div key={i} className={'flex items-center justify-between px-3 py-2 rounded-lg ' + (isWinner ? 'bg-ctg-green/10 border border-ctg-green/20' : 'bg-[#152b18]')}>
            <span className={'text-sm ' + (isWinner ? 'text-ctg-green font-bold' : 'text-[#F0F7E8]/60')}>{player?.name ?? '— Por definir —'}</span>
            {isWinner && <span className="text-sm">🏆</span>}
          </div>
        ))}
      </div>
      {match.score && <p className="text-xs text-[#F0F7E8]/40 mt-2 text-center font-mono">{match.score}</p>}
      {match.status === 'pending' && match.scheduled_date && (
        <p className="text-xs text-blue-300/60 mt-2 text-center">{formatDate(match.scheduled_date)}</p>
      )}
      {match.status === 'pending' && !match.scheduled_date && (
        <p className="text-xs text-[#F0F7E8]/30 mt-2 text-center">Por jugar</p>
      )}
    </div>
  );
}

// ── Category Tabs ────────────────────────────────────────────────────────────
function CategoryTabs({ active, onSelect }: { active: string; onSelect: (cat: string) => void }) {
  return (
    <div className="flex justify-center gap-6 sm:gap-8 border-b-2 border-[#1e4020] mb-8 flex-wrap">
      {CATEGORIES.map(cat => {
        const isActive = cat === active;
        return (
          <button key={cat} type="button" onClick={() => onSelect(cat)}
            className={`pb-3 text-sm sm:text-base transition-colors border-b-[3px] -mb-0.5
              ${isActive ? `cat-letter-${cat} border-current font-extrabold` : 'text-[#F0F7E8]/35 border-transparent font-semibold hover:text-[#F0F7E8]/60'}`}>
            Categoría {cat} <span className="font-normal opacity-70">{CATEGORY_NAMES[cat]}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Category Tournament ───────────────────────────────────────────────────────
function CategoryTournament({ season, currentPlayerId, onRefresh }: {
  season: MasterSeason; currentPlayerId?: string; onRefresh: () => void;
}) {
  const colors = CATEGORY_COLORS[season.category];
  const seasonMatches = (season.matches ?? []) as MasterMatchExt[];
  const semiMatches    = seasonMatches.filter(m => m.round === 'semifinal');
  const finalMatches   = seasonMatches.filter(m => m.round === 'final');
  const playoffMatches = seasonMatches.filter(m => m.round === 'playoff');
  const hasBracket     = semiMatches.length > 0;
  // Mientras el playoff está en curso todavía no hay grupos que mostrar.
  const inPlayoffs     = season.status === 'playoffs' && playoffMatches.length > 0;

  const [subTab, setSubTab] = useState<'groups' | 'bracket'>('groups');

  const statusLabel: Record<string, string> = {
    playoffs: '🎯 Playoff de clasificación', active: '🟢 Round Robin en curso',
    semifinals: '🔵 Semifinales', final: '🟡 Final', completed: '✅ Completado',
  };

  const handleSchedule = async (matchId: string, isoDate: string, courtId: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/master/matches/${matchId}/schedule`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ scheduled_date: isoDate, court_id: courtId }),
    });
    if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.message || 'Error al fijar fecha'); }
    onRefresh();
  };

  const handleResult = async (matchId: string, winnerId: string, score: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/master/matches/${matchId}/player-result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ winner_id: winnerId, score }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Error al ingresar resultado');
    }
    onRefresh();
  };

  return (
    <div className="bg-[#0f2211] border border-[#1e4020] rounded-2xl overflow-hidden mb-8">
      <div className={`bg-gradient-to-r ${colors.bg} px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">Categoría {season.category}</h2>
            <p className="text-white/80 text-sm">{CATEGORY_NAMES[season.category]} · {season.name}</p>
          </div>
          <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full font-medium">
            {statusLabel[season.status] || season.status}
          </span>
        </div>
        {season.round_robin_start && (
          <p className="text-white/70 text-xs mt-2">
            Round Robin: {new Date(season.round_robin_start).toLocaleDateString('es-CL')} — {season.round_robin_end ? new Date(season.round_robin_end).toLocaleDateString('es-CL') : '?'}
            {season.final_date && ` · Final: ${new Date(season.final_date).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}`}
          </p>
        )}
      </div>

      <div className="p-6">
        {hasBracket && (
          <div className="flex justify-center gap-3 mb-6">
            <button type="button" onClick={() => setSubTab('groups')}
              className={'px-4 py-1.5 rounded-full text-xs font-bold transition-colors ' +
                (subTab === 'groups' ? 'bg-ctg-green text-[#0a1608]' : 'bg-[#152b18] border border-[#1e4020] text-[#F0F7E8]/50 hover:text-[#F0F7E8]')}>
              Fase de grupos
            </button>
            <button type="button" onClick={() => setSubTab('bracket')}
              className={'px-4 py-1.5 rounded-full text-xs font-bold transition-colors ' +
                (subTab === 'bracket' ? 'bg-ctg-green text-[#0a1608]' : 'bg-[#152b18] border border-[#1e4020] text-[#F0F7E8]/50 hover:text-[#F0F7E8]')}>
              Llaves 🏅
            </button>
          </div>
        )}

        {inPlayoffs && (
          <div className="mb-6">
            <div className="text-center mb-4">
              <h3 className="font-display font-bold text-[#F0F7E8]">Playoff de clasificación</h3>
              <p className="text-xs text-[#F0F7E8]/45 mt-1">
                Los 4 primeros de la categoría ya están en el round robin. Estos 8
                se juegan los 4 cupos restantes a partido único.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {playoffMatches.map(match => (
                <MatchCard key={match.id} match={match} currentPlayerId={currentPlayerId}
                  onSchedule={handleSchedule} onResult={handleResult} season={season} />
              ))}
            </div>
          </div>
        )}

        {!inPlayoffs && (!hasBracket || subTab === 'groups') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {season.groups.map(group => (
              <div key={group.id} className="border border-[#1e4020] bg-[#0a1608]/40 rounded-xl overflow-hidden">
                <div className="bg-[#152b18] border-b border-[#1e4020] px-4 py-2">
                  <h3 className="font-bold text-[#F0F7E8]">{group.name}</h3>
                </div>
                <StandingsTable group={group} />
                <div className="px-4 pb-4 space-y-2">
                  <p className="text-xs font-semibold text-[#F0F7E8]/35 uppercase tracking-wider mb-2">Partidos</p>
                  {(group.matches as MasterMatchExt[]).filter(m => m.round === 'group').map(match => (
                    <MatchCard key={match.id} match={match} currentPlayerId={currentPlayerId}
                      onSchedule={handleSchedule} onResult={handleResult} season={season} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {hasBracket && subTab === 'bracket' && (
          <div>
            <div className="mb-6">
              <h3 className="font-display font-bold text-[#F0F7E8] text-lg mb-4">🏅 Semifinales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {semiMatches.map((m,i) => <BracketMatch key={m.id} match={m} label={`Semifinal ${i+1}`} />)}
              </div>
            </div>

            {finalMatches.length > 0 && (
              <div>
                <h3 className="font-display font-bold text-[#F0F7E8] text-lg mb-4">
                  🏆 Final
                  {season.final_date && (
                    <span className="text-sm font-normal text-[#F0F7E8]/40 ml-2">
                      · {new Date(season.final_date).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                  )}
                </h3>
                <div className="max-w-md mx-auto">
                  {finalMatches.map(m => <BracketMatch key={m.id} match={m} label="Gran Final" />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const VALID_CATEGORIES: string[] = [...CATEGORIES];

function MasterPageContent() {
  const { player, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [seasons, setSeasons] = useState<MasterSeason[]>([]);
  const [loading, setLoading] = useState(true);

  const catParam = searchParams.get('cat') || '';
  const activeCategory = VALID_CATEGORIES.includes(catParam) ? catParam : 'A';

  const ROUND_ROBIN_START = new Date('2026-06-22');
  const isBeforeStart = new Date() < ROUND_ROBIN_START;

  const loadData = () => {
    setLoading(true);
    api.getMaster()
      .then(data => setSeasons(data || []))
      .catch(() => setSeasons([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (authLoading) return;
    if (!player) { setLoading(false); return; }
    loadData();
  }, [authLoading, player?.id]);

  const handleSelectCategory = (cat: string) => {
    router.replace(`/master?cat=${cat}`, { scroll: false });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1608] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-ctg-green/20 border-t-ctg-green animate-spin" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-[#0a1608]">
        <Header onLoginClick={() => {}} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 md:pb-10">
          <LoginPrompt emoji="🏆" message="Inicia sesión para ver el torneo Master y los resultados." />
        </div>
      </div>
    );
  }

  const activeSeason = seasons.find(s => s.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#0a1608]">
      <Header onLoginClick={() => {}} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 md:pb-10">
        <div className="mb-10">
          <p className="text-ctg-green/70 text-xs font-bold uppercase tracking-[0.2em] mb-1">Temporada 2026</p>
          <h1 className="font-display text-4xl font-extrabold text-[#F0F7E8]">Master</h1>
          <div className="flex gap-6 mt-3 text-sm text-[#F0F7E8]/40 flex-wrap">
            <span>Round Robin: 22 Jun — 12 Jul</span>
            <span>Final: Sáb 18 de Julio</span>
          </div>
        </div>

        {isBeforeStart && seasons.length === 0 && (
          <div className="bg-[#0f2211] border border-[#1e4020] rounded-2xl p-12 text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-ctg-green/15 border border-ctg-green/30 flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🏆</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-[#F0F7E8] mb-2">Próximamente</h2>
            <p className="text-[#F0F7E8]/50 mb-4">El Master se habilita el <strong className="text-[#F0F7E8]">22 de junio de 2026</strong></p>
            <p className="text-sm text-[#F0F7E8]/35">Clasifican los 8 primeros de cada categoría (A, B, C y D)</p>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-lg mx-auto">
              {CATEGORIES.map(cat => (
                <div key={cat} className={`rounded-xl p-3 bg-[#152b18] border border-[#1e4020]`}>
                  <p className={`font-display font-black text-lg cat-letter-${cat}`}>Cat. {cat}</p>
                  <p className="text-xs text-[#F0F7E8]/45">{CATEGORY_NAMES[cat]}</p>
                  <p className="text-xs text-[#F0F7E8]/35 mt-1">Top 8</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {seasons.length > 0 ? (
          <>
            <CategoryTabs active={activeCategory} onSelect={handleSelectCategory} />
            {activeSeason ? (
              <CategoryTournament key={activeCategory} season={activeSeason} currentPlayerId={player?.id} onRefresh={loadData} />
            ) : (
              <div className="bg-[#0f2211] border border-[#1e4020] rounded-2xl p-6 mb-6 opacity-50">
                <p className={`font-bold cat-letter-${activeCategory}`}>Categoría {activeCategory} — {CATEGORY_NAMES[activeCategory]}</p>
                <p className="text-sm text-[#F0F7E8]/35 mt-1">Torneo no generado aún</p>
              </div>
            )}
          </>
        ) : !isBeforeStart ? (
          <div className="bg-[#0f2211] border border-[#1e4020] rounded-2xl p-12 text-center">
            <p className="text-[#F0F7E8]/50">No hay torneos generados aún.</p>
            <p className="text-sm text-[#F0F7E8]/30 mt-1">El administrador debe generar los cuadros desde el panel admin.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function MasterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a1608] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-ctg-green/20 border-t-ctg-green animate-spin" />
      </div>
    }>
      <MasterPageContent />
    </Suspense>
  );
}