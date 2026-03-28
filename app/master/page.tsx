'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { MasterSeason, MasterGroup, MasterMatch, Player } from '@/types';
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
        <button type="button" onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-ctg-light transition text-ctg-dark font-bold">‹</button>
        <span className="font-semibold text-ctg-dark text-sm">{MONTHS[viewMonth]} {viewYear}</span>
        <button type="button" onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-ctg-light transition text-ctg-dark font-bold">›</button>
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
          const isDisabled = date < minDate || date > maxDate;
          return (
            <button key={idx} type="button" disabled={isDisabled} onClick={() => onSelect(date)}
              className={`mx-auto w-8 h-8 rounded-full text-sm font-medium flex items-center justify-center transition-all
                ${isSelected ? 'bg-ctg-dark text-white shadow-md'
                  : isToday && !isDisabled ? 'border-2 border-ctg-green text-ctg-dark hover:bg-ctg-light'
                  : isDisabled ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-ctg-light'}`}>
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
  match: MasterMatchExt; onClose: () => void; onSubmit: (iso: string) => Promise<void>;
  minDate: Date; maxDate: Date;
}) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const now = new Date();

  const fmt = (d: Date) => d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' });
  const formatDisplay = (d: Date) => d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
  const roundLabel = match.round === 'group' ? 'Round Robin' : 'Semifinal';

  const availableSlots = () => {
    if (!selectedDate) return TIME_SLOTS;
    if (!isSameDay(selectedDate, now)) return TIME_SLOTS;
    return TIME_SLOTS.filter(s => {
      const [h, m] = s.start.split(':').map(Number);
      const t = new Date(selectedDate); t.setHours(h, m, 0, 0);
      return t > now;
    });
  };

  const handleSubmit = async () => {
    setError('');
    if (!selectedDate || !selectedSlot) { setError('Debes seleccionar fecha y horario.'); return; }
    const [h, m] = selectedSlot.split(':').map(Number);
    const final = new Date(selectedDate); final.setHours(h, m, 0, 0);
    if (final <= now) { setError('El horario seleccionado ya pasó.'); return; }
    if (final > maxDate) { setError('La fecha supera el límite del round.'); return; }
    setLoading(true);
    try { await onSubmit(final.toISOString()); onClose(); }
    catch (err: any) { setError(err.message || 'Error al fijar la fecha.'); }
    finally { setLoading(false); }
  };

  const slots = availableSlots();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-scale-in overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="bg-ctg-dark px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-white">📅 Agendar partido</h2>
            <p className="text-ctg-light text-sm mt-0.5">{match.player1.name} vs {match.player2.name}</p>
          </div>
          <button onClick={onClose} className="text-ctg-light hover:text-white text-2xl leading-none">×</button>
        </div>
        <div className="p-6 space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-800 flex items-center gap-2">
            <span>⏰</span>
            <span>{roundLabel}: <strong>{fmt(minDate)}</strong> — <strong>{fmt(maxDate)}</strong></span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1">
              <span className="w-5 h-5 rounded-full bg-ctg-green text-white text-xs flex items-center justify-center font-bold">1</span>
              Selecciona la fecha
            </p>
            <div className="border-2 border-gray-100 rounded-xl p-4">
              <Calendar selectedDate={selectedDate} onSelect={d => { setSelectedDate(d); setSelectedSlot(null); setError(''); }} minDate={minDate} maxDate={maxDate} />
            </div>
            {selectedDate && <p className="text-xs text-ctg-dark font-semibold mt-2 ml-1">📆 {formatDisplay(selectedDate)}</p>}
          </div>
          <div>
            <p className={`text-sm font-semibold mb-3 flex items-center gap-1 ${selectedDate ? 'text-gray-700' : 'text-gray-400'}`}>
              <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${selectedDate ? 'bg-ctg-green text-white' : 'bg-gray-200 text-gray-400'}`}>2</span>
              Selecciona el horario
            </p>
            {!selectedDate ? (
              <div className="rounded-xl border-2 border-dashed border-gray-200 py-6 text-center text-gray-400 text-sm">Primero elige una fecha</div>
            ) : slots.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-orange-200 py-6 text-center text-orange-500 text-sm">No hay horarios disponibles</div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {slots.map(slot => (
                  <button key={slot.start} type="button" onClick={() => { setSelectedSlot(slot.start); setError(''); }}
                    className={`py-3 px-2 rounded-xl text-sm font-semibold border-2 transition-all
                      ${selectedSlot === slot.start ? 'bg-ctg-dark border-ctg-dark text-white shadow-md' : 'bg-ctg-light/40 border-ctg-light text-ctg-dark hover:border-ctg-green'}`}>
                    {slot.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedDate && selectedSlot && (
            <div className="bg-ctg-light/60 rounded-xl px-4 py-3 text-sm text-ctg-dark font-semibold flex items-center gap-2">
              <span>✅</span>
              <span>{formatDisplay(selectedDate)}, {TIME_SLOTS.find(s => s.start === selectedSlot)?.label}</span>
            </div>
          )}
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border-2 border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition font-medium">Cancelar</button>
            <button type="button" onClick={handleSubmit} disabled={loading || !selectedDate || !selectedSlot}
              className="flex-1 px-4 py-2.5 bg-ctg-green text-white font-bold rounded-xl hover:bg-ctg-lime transition disabled:opacity-40">
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
          <tr className="bg-gray-50">
            <th className="px-3 py-2 text-left font-semibold text-gray-600">#</th>
            <th className="px-3 py-2 text-left font-semibold text-gray-600">Jugador</th>
            <th className="px-3 py-2 text-center font-semibold text-gray-600">PJ</th>
            <th className="px-3 py-2 text-center font-semibold text-green-600">G</th>
            <th className="px-3 py-2 text-center font-semibold text-red-500">P</th>
            <th className="px-3 py-2 text-center font-semibold text-gray-600">Sets</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sorted.map((gp, idx) => (
            <tr key={gp.id} className={idx < 2 ? 'bg-ctg-light/30 font-medium' : ''}>
              <td className="px-3 py-2">
                {idx < 2
                  ? <span className="inline-flex w-6 h-6 bg-ctg-green text-white rounded-full items-center justify-center text-xs font-bold">{idx+1}</span>
                  : <span className="text-gray-400 text-xs pl-1">{idx+1}</span>}
              </td>
              <td className="px-3 py-2 text-ctg-dark">{gp.player.name}</td>
              <td className="px-3 py-2 text-center text-gray-600">{gp.wins + gp.losses}</td>
              <td className="px-3 py-2 text-center text-green-600 font-bold">{gp.wins}</td>
              <td className="px-3 py-2 text-center text-red-500">{gp.losses}</td>
              <td className="px-3 py-2 text-center text-gray-500">{gp.sets_won}/{gp.sets_lost}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-gray-400 px-3 py-2">🟢 Clasifican a semifinales</p>
    </div>
  );
}

// ── Match Card ────────────────────────────────────────────────────────────────
function MatchCard({ match, currentPlayerId, onSchedule, onResult, season }: {
  match: MasterMatchExt;
  currentPlayerId?: string;
  onSchedule: (matchId: string, isoDate: string) => Promise<void>;
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
      <div className={`rounded-lg border p-3 ${isCompleted ? 'bg-green-50 border-green-200' : (match as any).status === 'disputed' ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
        {/* Jugadores */}
        <div className="flex items-center justify-between">
          <div className="flex-1 text-right">
            <p className={`font-medium text-sm ${match.winner_id === match.player1_id ? 'text-ctg-dark font-bold' : 'text-gray-600'}`}>
              {match.winner_id === match.player1_id && <span className="mr-1">🏆</span>}
              {match.player1.name}
            </p>
          </div>
          <div className="mx-3 text-center min-w-[90px]">
            {isCompleted ? (
              <span className="text-xs font-bold text-ctg-dark">{match.score}</span>
            ) : (match as any).status === 'disputed' ? (
              <span className="text-xs text-red-600 font-medium bg-red-100 px-2 py-1 rounded-full">⚠️ Disputa</span>
            ) : match.scheduled_date ? (
              <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full">📅 {formatDate(match.scheduled_date)}</span>
            ) : (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Por jugar</span>
            )}
          </div>
          <div className="flex-1 text-left">
            <p className={`font-medium text-sm ${match.winner_id === match.player2_id ? 'text-ctg-dark font-bold' : 'text-gray-600'}`}>
              {match.player2.name}
              {match.winner_id === match.player2_id && <span className="ml-1">🏆</span>}
            </p>
          </div>
        </div>

        {/* Botones — solo si es mi partido y no está completado */}
        {isMyMatch && !isCompleted && (match as any).status !== 'disputed' && (
          <div className="flex gap-2 mt-2">
            <button onClick={() => setShowSchedule(true)}
              className="flex-1 text-xs text-ctg-green border border-ctg-green rounded-lg py-1.5 hover:bg-ctg-green/10 transition">
              📅 {match.scheduled_date ? 'Cambiar fecha' : 'Fijar fecha'}
            </button>
            {!myResultIngresado ? (
              <button onClick={() => setShowResult(true)}
                className="flex-1 text-xs bg-ctg-green text-white rounded-lg py-1.5 hover:bg-ctg-lime transition font-medium">
                🎾 Ingresar resultado
              </button>
            ) : (
              <div className="flex-1 text-xs text-center text-gray-400 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                ✓ Resultado ingresado
              </div>
            )}
          </div>
        )}
      </div>

      {showSchedule && (
        <MasterScheduleModal match={match} onClose={() => setShowSchedule(false)}
          onSubmit={(iso) => onSchedule(match.id, iso)} minDate={minDate} maxDate={maxDate} />
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
    <div className="bg-white rounded-xl shadow-card p-4 border-l-4 border-ctg-green">
      <p className="text-xs font-bold text-ctg-green mb-3 uppercase tracking-wide">{label}</p>
      <div className="space-y-2">
        {[
          { player: match.player1, isWinner: match.winner_id === match.player1_id },
          { player: match.player2, isWinner: match.winner_id === match.player2_id },
        ].map(({ player, isWinner }, i) => (
          <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg ${isWinner ? 'bg-ctg-light/60 font-bold' : 'bg-gray-50'}`}>
            <span className="text-sm text-ctg-dark">{player?.name ?? '— Por definir —'}</span>
            {isWinner && <span className="text-sm">🏆</span>}
          </div>
        ))}
      </div>
      {match.score && <p className="text-xs text-gray-500 mt-2 text-center">{match.score}</p>}
      {match.status === 'pending' && match.scheduled_date && (
        <p className="text-xs text-blue-500 mt-2 text-center">📅 {formatDate(match.scheduled_date)}</p>
      )}
      {match.status === 'pending' && !match.scheduled_date && (
        <p className="text-xs text-gray-400 mt-2 text-center">Por jugar</p>
      )}
    </div>
  );
}

// ── Category Tournament ───────────────────────────────────────────────────────
function CategoryTournament({ season, currentPlayerId, onRefresh }: {
  season: MasterSeason; currentPlayerId?: string; onRefresh: () => void;
}) {
  const colors = CATEGORY_COLORS[season.category];
  const allMatches   = season.groups.flatMap(g => g.matches) as MasterMatchExt[];
  const semiMatches  = allMatches.filter(m => m.round === 'semifinal');
  const finalMatches = allMatches.filter(m => m.round === 'final');

  const statusLabel: Record<string, string> = {
    active: '🟢 Round Robin en curso', semifinals: '🔵 Semifinales',
    final: '🟡 Final', completed: '✅ Completado',
  };

  const handleSchedule = async (matchId: string, isoDate: string) => {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/master/matches/${matchId}/schedule`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ scheduled_date: isoDate }),
    });
    if (!res.ok) throw new Error('Error al fijar fecha');
    onRefresh();
  };

  const handleResult = async (matchId: string, winnerId: string, score: string) => {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/master/matches/${matchId}/player-result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ winner_id: winnerId, score }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Error al ingresar resultado');
    }
    onRefresh();
  };

  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden mb-8">
      <div className={`bg-gradient-to-r ${colors.bg} px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Categoría {season.category}</h2>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {season.groups.map(group => (
            <div key={group.id} className={`border-2 ${colors.border} rounded-xl overflow-hidden`}>
              <div className={`${colors.badge} px-4 py-2`}>
                <h3 className={`font-bold ${colors.text}`}>{group.name}</h3>
              </div>
              <StandingsTable group={group} />
              <div className="px-4 pb-4 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Partidos</p>
                {(group.matches as MasterMatchExt[]).filter(m => m.round === 'group').map(match => (
                  <MatchCard key={match.id} match={match} currentPlayerId={currentPlayerId}
                    onSchedule={handleSchedule} onResult={handleResult} season={season} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {['semifinals','final','completed'].includes(season.status) && semiMatches.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-ctg-dark mb-4">🏅 Semifinales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {semiMatches.map((m,i) => <BracketMatch key={m.id} match={m} label={`Semifinal ${i+1}`} />)}
            </div>
          </div>
        )}

        {['final','completed'].includes(season.status) && finalMatches.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-ctg-dark mb-4">
              🏆 Final
              {season.final_date && (
                <span className="text-sm font-normal text-gray-500 ml-2">
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
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MasterPage() {
  const { player } = useAuth();
  const [seasons, setSeasons] = useState<MasterSeason[]>([]);
  const [loading, setLoading] = useState(true);

  const ROUND_ROBIN_START = new Date('2026-06-22');
  const isBeforeStart = new Date() < ROUND_ROBIN_START;

  const loadData = () => {
    setLoading(true);
    api.getMaster()
      .then(data => setSeasons(data || []))
      .catch(() => setSeasons([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ctg-light via-white to-ctg-light/50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-ctg-green"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ctg-light via-white to-ctg-light/50">
      <Header currentPage="master" onLoginClick={() => {}} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-ctg-dark mb-2">🏆 Master</h1>
          <p className="text-gray-500 text-lg">Final de Temporada 2026 — 1er Semestre</p>
          <div className="flex justify-center gap-6 mt-4 text-sm text-gray-500 flex-wrap">
            <span>📅 Round Robin: 22 Jun — 10 Jul</span>
            <span>🎾 Final: Sábado 18 de Julio</span>
          </div>
        </div>

        {isBeforeStart && seasons.length === 0 && (
          <div className="bg-white rounded-2xl shadow-card p-12 text-center mb-8">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-2xl font-bold text-ctg-dark mb-2">Próximamente</h2>
            <p className="text-gray-500 mb-4">El Master se habilita el <strong>22 de junio de 2026</strong></p>
            <p className="text-sm text-gray-400">Clasifican los 8 primeros de cada categoría (A, B, C y D)</p>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-lg mx-auto">
              {['A','B','C','D'].map(cat => (
                <div key={cat} className={`rounded-xl p-3 ${CATEGORY_COLORS[cat].badge}`}>
                  <p className={`font-bold text-lg ${CATEGORY_COLORS[cat].text}`}>Cat. {cat}</p>
                  <p className="text-xs opacity-75">{CATEGORY_NAMES[cat]}</p>
                  <p className="text-xs opacity-75 mt-1">Top 8</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {seasons.length > 0 ? (
          ['A','B','C','D'].map(cat => {
            const season = seasons.find(s => s.category === cat);
            if (!season) return (
              <div key={cat} className={`bg-white rounded-2xl shadow-card p-6 mb-6 border-l-4 ${CATEGORY_COLORS[cat].border} opacity-60`}>
                <p className={`font-bold ${CATEGORY_COLORS[cat].text}`}>Categoría {cat} — {CATEGORY_NAMES[cat]}</p>
                <p className="text-sm text-gray-400 mt-1">Torneo no generado aún</p>
              </div>
            );
            return <CategoryTournament key={cat} season={season} currentPlayerId={player?.id} onRefresh={loadData} />;
          })
        ) : !isBeforeStart ? (
          <div className="bg-white rounded-2xl shadow-card p-12 text-center">
            <p className="text-gray-500">No hay torneos generados aún.</p>
            <p className="text-sm text-gray-400 mt-1">El administrador debe generar los cuadros desde el panel admin.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}