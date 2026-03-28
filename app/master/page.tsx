'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { MasterSeason, MasterGroup, MasterMatch } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    A: { bg: 'from-yellow-400 to-yellow-500', border: 'border-yellow-400', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800' },
    B: { bg: 'from-gray-400 to-gray-500', border: 'border-gray-400', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-800' },
    C: { bg: 'from-orange-400 to-orange-500', border: 'border-orange-400', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-800' },
    D: { bg: 'from-green-400 to-green-500', border: 'border-green-400', text: 'text-green-700', badge: 'bg-green-100 text-green-800' },
};
const CATEGORY_NAMES: Record<string, string> = { A: 'Oro', B: 'Plata', C: 'Bronce', D: 'Verde' };

const DAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
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

function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
}

// ── Calendar ─────────────────────────────────────────────────────────────────
function Calendar({ selectedDate, onSelect, minDate, maxDate }: {
    selectedDate: Date | null;
    onSelect: (d: Date) => void;
    minDate: Date;
    maxDate: Date;
}) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [viewYear, setViewYear] = useState(minDate.getFullYear());
    const [viewMonth, setViewMonth] = useState(minDate.getMonth());

    const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
    const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const offset = (firstDay + 6) % 7;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
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
                    const date = new Date(viewYear, viewMonth, day); date.setHours(0, 0, 0, 0);
                    const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
                    const isToday = isSameDay(date, today);
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

// ── Master Schedule Modal ─────────────────────────────────────────────────────
type MasterMatchExt = MasterMatch & { scheduled_date?: string | null };

function MasterScheduleModal({ match, onClose, onSubmit, minDate, maxDate }: {
    match: MasterMatchExt;
    onClose: () => void;
    onSubmit: (isoDate: string) => Promise<void>;
    minDate: Date;
    maxDate: Date;
}) {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const now = new Date();

    const formatDisplay = (d: Date) =>
        d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });

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
        try {
            await onSubmit(final.toISOString());
            onClose();
        } catch (err: any) {
            setError(err.message || 'Error al fijar la fecha.');
        } finally {
            setLoading(false);
        }
    };

    const slots = availableSlots();

    const roundLabel = match.round === 'group' ? 'Round Robin' : 'Semifinal';
    const fmt = (d: Date) => d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' });

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
                    {/* Rango permitido */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-800 flex items-center gap-2">
                        <span>⏰</span>
                        <span>{roundLabel}: <strong>{fmt(minDate)}</strong> — <strong>{fmt(maxDate)}</strong></span>
                    </div>

                    {/* Paso 1 — Fecha */}
                    <div>
                        <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1">
                            <span className="w-5 h-5 rounded-full bg-ctg-green text-white text-xs flex items-center justify-center font-bold">1</span>
                            Selecciona la fecha
                        </p>
                        <div className="border-2 border-gray-100 rounded-xl p-4">
                            <Calendar
                                selectedDate={selectedDate}
                                onSelect={d => { setSelectedDate(d); setSelectedSlot(null); setError(''); }}
                                minDate={minDate}
                                maxDate={maxDate}
                            />
                        </div>
                        {selectedDate && (
                            <p className="text-xs text-ctg-dark font-semibold mt-2 ml-1">📆 {formatDisplay(selectedDate)}</p>
                        )}
                    </div>

                    {/* Paso 2 — Horario */}
                    <div>
                        <p className={`text-sm font-semibold mb-3 flex items-center gap-1 transition ${selectedDate ? 'text-gray-700' : 'text-gray-400'}`}>
                            <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold transition ${selectedDate ? 'bg-ctg-green text-white' : 'bg-gray-200 text-gray-400'}`}>2</span>
                            Selecciona el horario
                        </p>
                        {!selectedDate ? (
                            <div className="rounded-xl border-2 border-dashed border-gray-200 py-6 text-center text-gray-400 text-sm">Primero elige una fecha</div>
                        ) : slots.length === 0 ? (
                            <div className="rounded-xl border-2 border-dashed border-orange-200 py-6 text-center text-orange-500 text-sm">No hay horarios disponibles para este día</div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                {slots.map(slot => (
                                    <button key={slot.start} type="button"
                                        onClick={() => { setSelectedSlot(slot.start); setError(''); }}
                                        className={`py-3 px-2 rounded-xl text-sm font-semibold border-2 transition-all
                      ${selectedSlot === slot.start
                                                ? 'bg-ctg-dark border-ctg-dark text-white shadow-md scale-[1.02]'
                                                : 'bg-ctg-light/40 border-ctg-light text-ctg-dark hover:border-ctg-green hover:bg-ctg-light'}`}>
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

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
                    )}

                    <div className="flex gap-3">
                        <button type="button" onClick={onClose}
                            className="flex-1 px-4 py-2.5 border-2 border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition font-medium">
                            Cancelar
                        </button>
                        <button type="button" onClick={handleSubmit}
                            disabled={loading || !selectedDate || !selectedSlot}
                            className="flex-1 px-4 py-2.5 bg-ctg-green text-white font-bold rounded-xl hover:bg-ctg-lime transition disabled:opacity-40">
                            {loading ? 'Guardando...' : 'Confirmar'}
                        </button>
                    </div>
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
                                    ? <span className="inline-flex w-6 h-6 bg-ctg-green text-white rounded-full items-center justify-center text-xs font-bold">{idx + 1}</span>
                                    : <span className="text-gray-400 text-xs pl-1">{idx + 1}</span>}
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
function MatchCard({ match, currentPlayerId, onSchedule, season }: {
    match: MasterMatchExt;
    currentPlayerId?: string;
    onSchedule: (matchId: string, isoDate: string) => Promise<void>;
    season: MasterSeason;
}) {
    const [showModal, setShowModal] = useState(false);
    const isCompleted = match.status === 'completed';
    const isMyMatch = currentPlayerId && (match.player1_id === currentPlayerId || match.player2_id === currentPlayerId);

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const weekday = d.toLocaleDateString('es-CL', { weekday: 'short' });
        const day = d.getDate();
        const month = d.toLocaleDateString('es-CL', { month: 'short' });
        const hour = d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });
        return `${weekday} ${day} ${month} · ${hour}`;
    };

    // Rango de fechas según round
    const getDateRange = (): { minDate: Date; maxDate: Date } => {
        const now = new Date();

        const toLocalMidnight = (iso: string) => {
            const d = new Date(iso);
            d.setMinutes(d.getMinutes() + d.getTimezoneOffset()); // ajustar UTC → local
            d.setHours(0, 0, 0, 0);
            return d;
        };

        if (match.round === 'group') {
            return {
                minDate: season.round_robin_start ? toLocalMidnight(season.round_robin_start) : now,
                maxDate: season.round_robin_end ? toLocalMidnight(season.round_robin_end) : now,
            };
        }
        if (match.round === 'semifinal') {
            return {
                minDate: season.round_robin_end ? toLocalMidnight(season.round_robin_end) : now,
                maxDate: season.final_date ? toLocalMidnight(season.final_date) : now,
            };
        }
        return { minDate: now, maxDate: now };
    };

    const { minDate, maxDate } = getDateRange();

    return (
        <>
            <div className={`rounded-lg border p-3 ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
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
                        ) : match.scheduled_date ? (
                            <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full">
                                📅 {formatDate(match.scheduled_date)}
                            </span>
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

                {isMyMatch && !isCompleted && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="w-full mt-2 text-xs text-ctg-green border border-ctg-green rounded-lg py-1.5 hover:bg-ctg-green/10 transition"
                    >
                        📅 {match.scheduled_date ? 'Cambiar fecha' : 'Fijar fecha'}
                    </button>
                )}
            </div>

            {showModal && (
                <MasterScheduleModal
                    match={match}
                    onClose={() => setShowModal(false)}
                    onSubmit={(iso) => onSchedule(match.id, iso)}
                    minDate={minDate}
                    maxDate={maxDate}
                />
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
    season: MasterSeason;
    currentPlayerId?: string;
    onRefresh: () => void;
}) {
    const colors = CATEGORY_COLORS[season.category];
    const allMatches = season.groups.flatMap(g => g.matches) as MasterMatchExt[];
    const semiMatches = allMatches.filter(m => m.round === 'semifinal');
    const finalMatches = allMatches.filter(m => m.round === 'final');

    const statusLabel: Record<string, string> = {
        active: '🟢 Round Robin en curso',
        semifinals: '🔵 Semifinales',
        final: '🟡 Final',
        completed: '✅ Completado',
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
                {/* Grupos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {season.groups.map(group => (
                        <div key={group.id} className={`border-2 ${colors.border} rounded-xl overflow-hidden`}>
                            <div className={`${colors.badge} px-4 py-2`}>
                                <h3 className={`font-bold ${colors.text}`}>{group.name}</h3>
                            </div>
                            <StandingsTable group={group} />
                            <div className="px-4 pb-4 space-y-2">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Partidos</p>
                                {(group.matches as MasterMatchExt[])
                                    .filter(m => m.round === 'group')
                                    .map(match => (
                                        <MatchCard
                                            key={match.id}
                                            match={match}
                                            currentPlayerId={currentPlayerId}
                                            onSchedule={handleSchedule}
                                            season={season}
                                        />
                                    ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Semifinales */}
                {['semifinals', 'final', 'completed'].includes(season.status) && semiMatches.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-ctg-dark mb-4">🏅 Semifinales</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {semiMatches.map((m, i) => <BracketMatch key={m.id} match={m} label={`Semifinal ${i + 1}`} />)}
                        </div>
                    </div>
                )}

                {/* Final */}
                {['final', 'completed'].includes(season.status) && finalMatches.length > 0 && (
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
            <Header currentPage="master" onLoginClick={() => { }} />

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
                            {['A', 'B', 'C', 'D'].map(cat => (
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
                    ['A', 'B', 'C', 'D'].map(cat => {
                        const season = seasons.find(s => s.category === cat);
                        if (!season) return (
                            <div key={cat} className={`bg-white rounded-2xl shadow-card p-6 mb-6 border-l-4 ${CATEGORY_COLORS[cat].border} opacity-60`}>
                                <p className={`font-bold ${CATEGORY_COLORS[cat].text}`}>Categoría {cat} — {CATEGORY_NAMES[cat]}</p>
                                <p className="text-sm text-gray-400 mt-1">Torneo no generado aún</p>
                            </div>
                        );
                        return (
                            <CategoryTournament
                                key={cat}
                                season={season}
                                currentPlayerId={player?.id}
                                onRefresh={loadData}
                            />
                        );
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