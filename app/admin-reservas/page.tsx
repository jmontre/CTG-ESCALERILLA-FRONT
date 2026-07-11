'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import Header from '@/components/Header';
import EditUserModal from '@/components/admin/EditUserModal';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { toDateStr } from '@/lib/utils';

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminReservasPage() {
  const { player, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'reservas' | 'usuarios' | 'stats'>('reservas');

  // Reservas
  const [reservations, setReservations] = useState<any[]>([]);
  const [season, setSeason]             = useState('verano');
  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()));
  const [loading, setLoading]           = useState(true);
  const [cancellingId, setCancellingId]     = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  // Bloqueos
  const [courts, setCourts]             = useState<any[]>([]);
  const [blockDate, setBlockDate]       = useState(toDateStr(new Date()));
  const [blockCourt, setBlockCourt]     = useState('');
  const [blockedSlots, setBlockedSlots] = useState<string[]>([]);
  const [blockReason, setBlockReason]   = useState('');
  const [savingBlocks, setSavingBlocks] = useState(false);
  const [blockMessage, setBlockMessage] = useState('');
  const [loadingBlocks, setLoadingBlocks] = useState(false);

  // Cobro de luz
  const [lightDate, setLightDate]       = useState(toDateStr(new Date()));
  const [lightSlots, setLightSlots]     = useState<string[]>([]);
  const [lightAmount, setLightAmount]   = useState(3000);
  const [savingLight, setSavingLight]   = useState(false);
  const [loadingLight, setLoadingLight] = useState(false);
  const [lightMessage, setLightMessage] = useState('');

  // Stats
  const [stats, setStats]           = useState<any | null>(null);
  const [statsMonth, setStatsMonth] = useState(() =>
    new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' }).substring(0, 7)
  );
  const [loadingStats, setLoadingStats] = useState(false);
  const [lightSummary, setLightSummary] = useState<any | null>(null);
  const [guestPage, setGuestPage] = useState(0);
  const [savingSeason, setSavingSeason] = useState(false);
  const [message, setMessage]           = useState('');
  const [error, setError]               = useState('');

  // Usuarios
  const [allPlayers, setAllPlayers]     = useState<any[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [searchQuery, setSearchQuery]   = useState('');
  const [showAddUser, setShowAddUser]   = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<any | null>(null);
  const [newUser, setNewUser]           = useState({ name: '', email: '', phone: '', username: '', password: '', member_type: 'socio', parent_id: '' });
  const [savingUser, setSavingUser]     = useState(false);
  const [userMessage, setUserMessage]   = useState('');
  const [userError, setUserError]       = useState('');

  useEffect(() => {
    if (!authLoading && (!player || !player.is_admin)) { router.push('/'); return; }
    if (player?.is_admin) {
      loadData();
      api.getSeason().then(d => setSeason(d.season));
      loadPlayers();
      api.getCourts().then(data => { setCourts(data); if (data.length > 0) setBlockCourt(data[0].id); });
    }
  }, [player, authLoading]);

  useEffect(() => {
    if (player?.is_admin) loadReservations();
  }, [selectedDate]);

  const loadData = async () => {
    await loadReservations();
    setLoading(false);
  };

  const loadReservations = async () => {
    const data = await api.getAllReservations(selectedDate);
    setReservations(data);
  };

  const loadPlayers = async () => {
    setLoadingPlayers(true);
    try {
      const all = await api.getAllPlayersAdmin();
      if (all) {
        setAllPlayers(all);
      } else {
        setAllPlayers(await api.getPlayers());
      }
    } finally {
      setLoadingPlayers(false);
    }
  };

  const loadStats = async (month: string) => {
    setLoadingStats(true);
    try {
      const [statsData, lightData] = await Promise.all([
        api.getStats(month),
        api.getLightSummary(month),
      ]);
      setStats(statsData);
      setLightSummary(lightData);
    } catch { setStats(null); setLightSummary(null); }
    finally { setLoadingStats(false); }
  };

  const loadLightConfig = async (date: string) => {
    setLoadingLight(true);
    try {
      const data = await api.getLightConfig(date);
      if (data) {
        setLightSlots(data.time_slots || []);
        setLightAmount(data.amount_per_slot ?? 3000);
      }
    } finally { setLoadingLight(false); }
  };

  const handleSaveLightConfig = async () => {
    setSavingLight(true);
    setLightMessage('');
    try {
      await api.saveLightConfig({ date: lightDate, time_slots: lightSlots, amount_per_slot: lightAmount });
      setLightMessage('Cobro de luz guardado.');
      setTimeout(() => setLightMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al guardar cobro de luz');
      setTimeout(() => setError(''), 4000);
    }
    finally { setSavingLight(false); }
  };

  const toggleLightSlot = (slot: string) => {
    setLightSlots(prev => prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]);
  };

  const loadBlocks = async (courtId: string, date: string) => {
    if (!courtId) return;
    setLoadingBlocks(true);
    try {
      const data = await api.getBlocks(date);
      const courtBlocks = data.filter((b: any) => b.court_id === courtId);
      setBlockedSlots(courtBlocks.map((b: any) => b.time_slot).filter(Boolean));
      setBlockReason(courtBlocks[0]?.reason || '');
    } finally { setLoadingBlocks(false); }
  };

  const handleSaveBlocks = async () => {
    setSavingBlocks(true);
    setBlockMessage('');
    try {
      await api.saveBlocks({ court_id: blockCourt, date: blockDate, slots: blockedSlots, reason: blockReason || undefined });
      setBlockMessage('Bloqueos guardados correctamente.');
      setTimeout(() => setBlockMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al guardar bloqueos');
      setTimeout(() => setError(''), 4000);
    }
    finally { setSavingBlocks(false); }
  };

  const toggleSlot = (slot: string) => {
    setBlockedSlots(prev => prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]);
  };

  useEffect(() => {
    if (activeTab === 'reservas' && blockCourt) loadBlocks(blockCourt, blockDate);
  }, [blockCourt, blockDate, activeTab]);

  useEffect(() => {
    if (activeTab === 'reservas') loadLightConfig(lightDate);
  }, [lightDate, activeTab]);

  useEffect(() => {
    if (activeTab === 'stats') {
      setGuestPage(0);
      loadStats(statsMonth);
    }
  }, [activeTab, statsMonth]);

  const handleCancelReservation = async (id: string) => {
    setConfirmCancelId(null);
    setCancellingId(id);
    try {
      await api.adminCancelReservation(id, 'Cancelada por administrador');
      await loadReservations();
      setMessage('Reserva cancelada.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al cancelar');
    } finally {
      setCancellingId(null);
    }
  };

  const handleSetSeason = async (newSeason: string) => {
    setSavingSeason(true);
    try {
      await api.adminSetSeason(newSeason);
      setSeason(newSeason);
      setMessage(`Temporada actualizada a ${newSeason}.`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar temporada');
    } finally {
      setSavingSeason(false);
    }
  };

  const handleToggleDebt = async (playerId: string, currentDebt: boolean) => {
    try {
      await api.updatePlayer(playerId, { has_debt: !currentDebt });
      await loadPlayers();
      setUserMessage(`Deuda ${!currentDebt ? 'activada' : 'desactivada'}.`);
      setTimeout(() => setUserMessage(''), 3000);
    } catch (err: any) {
      setUserError(err.message || 'Error');
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.username || !newUser.password) {
      setUserError('Nombre, email, usuario y contraseña son obligatorios.');
      return;
    }
    setSavingUser(true);
    setUserError('');
    try {
      await api.createPlayer({
        ...newUser,
        position: null, // sin posición en escalerilla
        parent_id: newUser.parent_id || null,
      });
      setUserMessage('Usuario creado correctamente.');
      setShowAddUser(false);
      setNewUser({ name: '', email: '', phone: '', username: '', password: '', member_type: 'socio', parent_id: '' });
      await loadPlayers();
      setTimeout(() => setUserMessage(''), 3000);
    } catch (err: any) {
      setUserError(err.message || 'Error al crear usuario');
    } finally {
      setSavingUser(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0a1608] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-ctg-green/20 border-t-ctg-green animate-spin" />
      </div>
    );
  }

  if (!player?.is_admin) return null;

  const activeReservations    = reservations.filter(r => r.status === 'active');
  const cancelledReservations = reservations.filter(r => r.status === 'cancelled');
  const completedReservations = reservations.filter(r => r.status === 'completed');

  const filteredPlayers = allPlayers.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const socios = allPlayers.filter(p => (p as any).member_type !== 'hijo_socio' && !p.admin_role);

  return (
    <div className="min-h-screen bg-[#0a1608]">
      <Header onLoginClick={() => {}} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 md:pb-10">
        <div className="mb-8">
          <div className="text-ctg-green text-xs uppercase tracking-[0.28em] font-bold mb-2">Administración</div>
          <h1 className="font-display font-extrabold text-[#F0F7E8] text-4xl md:text-5xl tracking-tight leading-[1.02]">Panel <span className="text-ctg-green">Reservas</span></h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-[#0f2211] border border-[#1e4020] rounded-2xl p-1.5 overflow-x-auto">
          {(['reservas', 'usuarios', 'stats'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={activeTab === tab
                ? 'px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition bg-ctg-green text-[#0a1608]'
                : 'px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition text-[#F0F7E8]/60 hover:text-[#F0F7E8] hover:bg-ctg-green/8'}>
              {tab === 'reservas' ? 'Reservas' : tab === 'usuarios' ? 'Usuarios' : 'Estadísticas'}
            </button>
          ))}
        </div>

        {/* ── TAB RESERVAS ── */}
        {activeTab === 'reservas' && (
          <>
            {message && <div className="bg-ctg-green/10 border border-ctg-green/20 rounded-xl p-3 text-ctg-green text-sm mb-4">{message}</div>}
            {error   && <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm mb-4">{error}</div>}

            {/* Config temporada */}
            <div className="bg-[#0f2211] border border-[#1e4020] rounded-2xl p-6 mb-6">
              <h2 className="font-display font-bold text-[#F0F7E8] text-xl mb-4">⚙️ Configuración</h2>
              <div>
                <p className="label mb-2">Temporada activa</p>
                <div className="flex gap-2">
                  {['verano', 'invierno'].map(s => (
                    <button key={s} onClick={() => handleSetSeason(s)} disabled={savingSeason || season === s}
                      className={s === season
                        ? 'px-4 py-2.5 rounded-xl text-sm font-semibold capitalize transition bg-ctg-green text-[#0a1608] disabled:opacity-100'
                        : 'px-4 py-2.5 rounded-xl text-sm font-semibold capitalize transition border border-[#1e4020] text-[#F0F7E8]/60 hover:text-[#F0F7E8] hover:border-ctg-green/40 disabled:opacity-50'}>
                      {s === 'verano' ? '☀️ Verano' : '❄️ Invierno'}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[#F0F7E8]/40 mt-3">
                  {season === 'verano' ? 'Alta demanda: 7:45, 9:30, 18:15, 20:00' : 'Alta demanda: 9:30, 11:15, 16:30, 18:15'}
                </p>
              </div>
            </div>

            {/* Bloqueos de canchas */}
            <div className="bg-[#0f2211] border border-[#1e4020] rounded-2xl p-6 mb-6">
              <h2 className="font-display font-bold text-[#F0F7E8] text-xl mb-4">🔒 Bloquear horarios</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="label block mb-1.5">Cancha</label>
                  <select value={blockCourt} onChange={e => setBlockCourt(e.target.value)} className="select w-full">
                    {courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label block mb-1.5">Fecha</label>
                  <input type="date" value={blockDate} onChange={e => setBlockDate(e.target.value)} className="field w-full" />
                </div>
                <div>
                  <label className="label block mb-1.5">Motivo (opcional)</label>
                  <input type="text" value={blockReason} onChange={e => setBlockReason(e.target.value)}
                    placeholder="Ej: Mantenimiento" className="field w-full" />
                </div>
              </div>

              {loadingBlocks ? (
                <div className="text-center py-4"><div className="w-6 h-6 rounded-full border-2 border-ctg-green/20 border-t-ctg-green animate-spin mx-auto" /></div>
              ) : (
                <>
                  <p className="text-xs text-[#F0F7E8]/40 mb-3">Selecciona los horarios a bloquear:</p>
                  <div className="flex gap-2 mb-3">
                    <button type="button" onClick={() => setBlockedSlots(['06:00','07:45','09:30','11:15','13:00','14:45','16:30','18:15','20:00','21:45'])}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-red-500/12 border border-red-500/35 text-red-400 hover:bg-red-500/20 transition">
                      🔒 Bloquear día completo
                    </button>
                    <button type="button" onClick={() => setBlockedSlots([])}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-ctg-green/10 border border-ctg-green/30 text-ctg-green hover:bg-ctg-green/20 transition">
                      🔓 Desbloquear todo
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
                    {['06:00','07:45','09:30','11:15','13:00','14:45','16:30','18:15','20:00','21:45'].map(slot => {
                      const blocked = blockedSlots.includes(slot);
                      return (
                        <button key={slot} type="button" onClick={() => toggleSlot(slot)}
                          className={'h-11 rounded-lg text-xs font-mono font-bold border transition ' + (
                            blocked
                              ? 'bg-red-500/12 border-red-500/35 text-red-400'
                              : 'bg-[#152b18] border-[#1e4020] text-[#F0F7E8]/70 hover:border-ctg-green/50')}>
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <button onClick={handleSaveBlocks} disabled={savingBlocks} className="btn-primary disabled:opacity-50">
                      {savingBlocks ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          Guardando...
                        </>
                      ) : '💾 Guardar cambios'}
                    </button>
                    {blockMessage && <span className="text-sm text-ctg-green">{blockMessage}</span>}
                    {blockedSlots.length > 0 && (
                      <span className="text-xs text-red-400 font-medium">{blockedSlots.length} horario(s) bloqueado(s)</span>
                    )}
                    {blockedSlots.length === 0 && (
                      <span className="text-xs text-ctg-green font-medium">Sin bloqueos</span>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Cobro de luz */}
            <div className="bg-[#0f2211] border border-[#1e4020] rounded-2xl p-6 mb-6">
              <h2 className="font-display font-bold text-[#F0F7E8] text-xl mb-4">💡 Cobro de luz</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="label block mb-1.5">Fecha</label>
                  <input type="date" value={lightDate} onChange={e => setLightDate(e.target.value)} className="field w-full" />
                </div>
                <div>
                  <label className="label block mb-1.5">Monto por horario ($)</label>
                  <input type="number" value={lightAmount} onChange={e => setLightAmount(Number(e.target.value))} min={0} step={500}
                    className="field w-full" />
                </div>
              </div>
              {loadingLight ? (
                <div className="text-center py-4"><div className="w-6 h-6 rounded-full border-2 border-amber-400/20 border-t-amber-400 animate-spin mx-auto" /></div>
              ) : (
                <>
                  <p className="text-xs text-[#F0F7E8]/40 mb-3">Selecciona los horarios donde se cobra luz:</p>
                  <div className="flex gap-2 mb-3">
                    <button type="button" onClick={() => setLightSlots(['06:00','07:45','09:30','11:15','13:00','14:45','16:30','18:15','20:00','21:45'])}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-amber-500/12 border border-amber-500/35 text-amber-400 hover:bg-amber-500/20 transition">
                      💡 Todos los horarios
                    </button>
                    <button type="button" onClick={() => setLightSlots([])}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold border border-[#1e4020] text-[#F0F7E8]/50 hover:text-[#F0F7E8] hover:border-ctg-green/30 transition">
                      Limpiar
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
                    {['06:00','07:45','09:30','11:15','13:00','14:45','16:30','18:15','20:00','21:45'].map(slot => {
                      const active = lightSlots.includes(slot);
                      return (
                        <button key={slot} type="button" onClick={() => toggleLightSlot(slot)}
                          className={'h-11 rounded-lg text-xs font-mono font-bold border transition ' + (
                            active
                              ? 'bg-amber-500/12 border-amber-500/35 text-amber-400'
                              : 'bg-[#152b18] border-[#1e4020] text-[#F0F7E8]/70 hover:border-ctg-green/50')}>
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <button onClick={handleSaveLightConfig} disabled={savingLight} className="btn-primary disabled:opacity-50">
                      {savingLight ? (
                        <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>Guardando...</>
                      ) : '💾 Guardar cobro de luz'}
                    </button>
                    {lightMessage && <span className="text-sm text-ctg-green">{lightMessage}</span>}
                    {lightSlots.length > 0 && (
                      <span className="chip chip-warning">💡 {lightSlots.length} horario(s) con cobro · ${(lightAmount * lightSlots.length).toLocaleString('es-CL')} posible</span>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Filtro fecha */}
            <div className="bg-[#0f2211] border border-[#1e4020] rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <label className="label block mb-1.5">Fecha</label>
                  <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="field" />
                </div>
                <div className="flex gap-4 text-sm mt-5 flex-wrap">
                  <span className="text-ctg-green font-medium">✅ Activas: {activeReservations.length}</span>
                  <span className="text-blue-400 font-medium">🏁 Completadas: {completedReservations.length}</span>
                  <span className="text-[#F0F7E8]/35">🚫 Canceladas: {cancelledReservations.length}</span>
                </div>
              </div>
            </div>

            {/* Tabla reservas */}
            <div className="bg-[#0f2211] border border-[#1e4020] rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[#1e4020]">
                <h2 className="font-display font-bold text-[#F0F7E8] text-xl">Reservas — {formatDate(selectedDate)}</h2>
              </div>
              {reservations.length === 0 ? (
                <div className="p-12 text-center text-[#F0F7E8]/35">No hay reservas para esta fecha.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#152b18] text-[#F0F7E8]/45 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Hora</th>
                        <th className="px-4 py-3 text-left font-semibold">Cancha</th>
                        <th className="px-4 py-3 text-left font-semibold">Socio</th>
                        <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                        <th className="px-4 py-3 text-left font-semibold">Con quién</th>
                        <th className="px-4 py-3 text-left font-semibold">Estado</th>
                        <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e4020]">
                      {reservations
                        .sort((a, b) => a.time_slot.localeCompare(b.time_slot))
                        .map(r => (
                          <tr key={r.id} className={r.status === 'active' ? 'hover:bg-ctg-green/4 transition-colors' : 'opacity-40'}>
                            <td className="px-4 py-3 font-mono font-bold text-ctg-green">{r.time_slot}</td>
                            <td className="px-4 py-3 text-[#F0F7E8]/70">{r.court?.name}</td>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-[#F0F7E8]">{r.player?.name}</p>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1 flex-wrap">
                                <span className={`chip ${r.player?.member_type === 'hijo_socio' ? 'chip-purple' : 'chip-info'}`}>
                                  {r.player?.member_type === 'hijo_socio' ? 'Hijo' : 'Socio'}
                                </span>
                                {r.is_high_demand && <span className="chip chip-warning">🔥 Alta</span>}
                                {r.is_challenge && <span className="chip chip-info">⚔️ Desafío</span>}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-[#F0F7E8]/50 text-xs">
                              {r.partner_name ? `🤝 ${r.partner_name}` : r.has_guest ? `👤 ${r.guest_name || 'Visita'}` : '—'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`chip ${
                                r.status === 'active'    ? 'chip-success'  :
                                r.status === 'completed' ? 'chip-info'     :
                                                           'chip-muted'
                              }`}>
                                {r.status === 'active' ? '✅ Activa' : r.status === 'completed' ? '🏁 Completada' : '🚫 Cancelada'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {r.status === 'active' && (
                                confirmCancelId === r.id ? (
                                  <div className="flex items-center gap-1.5 ml-auto justify-end">
                                    <span className="text-xs text-[#F0F7E8]/40">¿Confirmar?</span>
                                    <button onClick={() => handleCancelReservation(r.id)} className="btn-danger text-xs px-2.5 py-1.5">
                                      Sí
                                    </button>
                                    <button onClick={() => setConfirmCancelId(null)} className="btn-ghost text-xs px-2.5 py-1.5">
                                      No
                                    </button>
                                  </div>
                                ) : (
                                  <button onClick={() => setConfirmCancelId(r.id)} disabled={cancellingId === r.id}
                                    className="btn-danger text-xs px-2.5 py-1.5 disabled:opacity-50 ml-auto flex items-center gap-1">
                                    {cancellingId === r.id ? (
                                      <>
                                        <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
                                        <span>Cancelando...</span>
                                      </>
                                    ) : 'Cancelar'}
                                  </button>
                                )
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── TAB USUARIOS ── */}
        {activeTab === 'usuarios' && (
          <>
            {userMessage && <div className="bg-ctg-green/10 border border-ctg-green/20 rounded-xl p-3 text-ctg-green text-sm mb-4">{userMessage}</div>}
            {userError   && <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm mb-4">{userError}</div>}

            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o email..." className="field w-72" />
              <button onClick={() => setShowAddUser(!showAddUser)} className="btn-primary">
                + Nuevo usuario
              </button>
            </div>

            {/* Formulario nuevo usuario */}
            {showAddUser && (
              <div className="bg-[#0f2211] border border-ctg-green/30 rounded-2xl p-6 mb-6">
                <h3 className="font-display font-bold text-[#F0F7E8] text-lg mb-4">Nuevo usuario de reservas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {[
                    { label: 'Nombre', key: 'name', type: 'text', placeholder: 'Nombre completo' },
                    { label: 'Email', key: 'email', type: 'email', placeholder: 'email@ejemplo.com' },
                    { label: 'Teléfono', key: 'phone', type: 'tel', placeholder: '+56912345678' },
                    { label: 'Usuario', key: 'username', type: 'text', placeholder: 'nombre.apellido' },
                    { label: 'Contraseña', key: 'password', type: 'password', placeholder: 'Mínimo 6 caracteres' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="label block mb-1.5">{field.label}</label>
                      <input type={field.type} placeholder={field.placeholder}
                        value={(newUser as any)[field.key]}
                        onChange={e => setNewUser({...newUser, [field.key]: e.target.value})}
                        className="field w-full" />
                    </div>
                  ))}
                  <div>
                    <label className="label block mb-1.5">Tipo de socio</label>
                    <select value={newUser.member_type} onChange={e => setNewUser({...newUser, member_type: e.target.value, parent_id: ''})}
                      className="select w-full">
                      <option value="socio">Socio</option>
                      <option value="hijo_socio">Hijo de socio</option>
                      <option value="profe">Profe / Escuela</option>
                    </select>
                  </div>
                  {newUser.member_type === 'hijo_socio' && (
                    <div>
                      <label className="label block mb-1.5">Socio padre</label>
                      <select value={newUser.parent_id} onChange={e => setNewUser({...newUser, parent_id: e.target.value})}
                        className="select w-full">
                        <option value="">— Seleccionar —</option>
                        {socios.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowAddUser(false)} className="btn-ghost">Cancelar</button>
                  <button onClick={handleCreateUser} disabled={savingUser} className="btn-primary disabled:opacity-50">
                    {savingUser ? 'Creando...' : 'Crear usuario'}
                  </button>
                </div>
              </div>
            )}

            {/* Lista usuarios */}
            <div className="bg-[#0f2211] border border-[#1e4020] rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[#1e4020] flex items-center justify-between">
                <h2 className="font-display font-bold text-[#F0F7E8] text-xl">Usuarios ({filteredPlayers.length})</h2>
                <span className="text-xs text-[#F0F7E8]/40">
                  {allPlayers.filter(p => !(p as any).position).length} sin escalerilla
                </span>
              </div>
              {loadingPlayers ? (
                <div className="p-8 text-center"><div className="w-8 h-8 rounded-full border-2 border-ctg-green/20 border-t-ctg-green animate-spin mx-auto" /></div>
              ) : filteredPlayers.length === 0 ? (
                <div className="p-8 text-center text-[#F0F7E8]/35">No se encontraron usuarios.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#152b18] text-[#F0F7E8]/45 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                        <th className="px-4 py-3 text-left font-semibold">Email / Teléfono</th>
                        <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                        <th className="px-4 py-3 text-left font-semibold">Escalerilla</th>
                        <th className="px-4 py-3 text-left font-semibold">Deuda</th>
                        <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e4020]">
                      {filteredPlayers.map(p => (
                        <tr key={p.id} className="hover:bg-ctg-green/4 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-[#F0F7E8]">{p.name}</p>
                            {p.admin_role && <span className="text-xs text-ctg-green">Admin</span>}
                          </td>
                          <td className="px-4 py-3 text-[#F0F7E8]/50">
                            <p>{p.email}</p>
                            {p.phone && <p className="text-xs">{p.phone}</p>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`chip ${(p as any).member_type === 'hijo_socio' ? 'chip-purple' : 'chip-info'}`}>
                              {(p as any).member_type === 'hijo_socio' ? 'Hijo' : 'Socio'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {p.position
                              ? <span className="text-sm font-mono font-bold text-ctg-green">#{p.position}</span>
                              : <span className="text-xs text-[#F0F7E8]/35">Solo reservas</span>}
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => handleToggleDebt(p.id, (p as any).has_debt)}
                              className={`chip cursor-pointer hover:opacity-80 transition ${(p as any).has_debt ? 'chip-danger' : 'chip-muted'}`}>
                              {(p as any).has_debt ? '⚠️ Con deuda' : 'Sin deuda'}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => setEditingPlayer(p)} className="btn-ghost text-xs px-2.5 py-1.5">
                              Editar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── TAB STATS ── */}
        {activeTab === 'stats' && (() => {
          // ── KPIs derivados ──
          const cancelRate = stats
            ? Math.round((stats.totals.cancelled_normal ?? 0) / Math.max((stats.totals.normal + (stats.totals.cancelled_normal ?? 0)), 1) * 100)
            : 0;
          const highDemandRate = stats
            ? Math.round(stats.demand.high / Math.max(stats.demand.high + stats.demand.low, 1) * 100)
            : 0;
          const guestRate = stats
            ? Math.round(stats.guest.count / Math.max(stats.totals.normal, 1) * 100)
            : 0;
          const activeDays = stats
            ? stats.by_day.filter((d: any) => d.count > 0).length
            : 0;
          const avgPerDay = stats && activeDays > 0
            ? (stats.totals.normal / activeDays).toFixed(1)
            : '0';
          const topCourt = stats?.by_court?.reduce((a: any, b: any) => a.count_normal > b.count_normal ? a : b, { court: '—', count_normal: 0 });
          const topSlot  = stats?.by_slot?.[0];

          // ── Exportar XLSX (Cancha 1, Cancha 2, Luz) solo reservas normales ──
          const handleExportXLSX = async () => {
            if (!stats) return;
            try {
              const allReservations = await api.getReservationsByMonth(stats.month);
              const wb = XLSX.utils.book_new();
              const resHeaders = ['Socio', 'Tipo de socio', 'Fecha', 'Horario', 'Alta demanda', 'Con visita', 'Invitado', 'Compañero', 'Estado', 'Monto visita'];
              const toRow = (r: any) => [
                r.player?.name || '',
                r.player?.member_type === 'socio' ? 'Socio' : r.player?.member_type === 'hijo_socio' ? 'Hijo de socio' : r.player?.member_type === 'profe' ? 'Profe/Escuela' : 'Visita',
                new Date(r.date).toLocaleDateString('es-CL'),
                r.time_slot,
                r.is_high_demand ? 'Sí' : 'No',
                r.has_guest ? 'Sí' : 'No',
                r.guest_name || '',
                r.partner_name || '',
                r.status === 'active' ? 'Activa' : r.status === 'completed' ? 'Completada' : 'Cancelada',
                r.has_guest ? (r.guest_fee || 3000) : '',
              ];
              ['Cancha 1', 'Cancha 2'].forEach(courtName => {
                const rows = allReservations.filter((r: any) => r.court?.name === courtName && !r.is_challenge);
                const courtRevenue = rows.filter((r: any) => r.has_guest).reduce((s: number, r: any) => s + (r.guest_fee || 3000), 0);
                const data = [
                  resHeaders,
                  ...rows.map(toRow),
                  [],
                  ['', '', '', '', '', '', '', '', 'TOTAL VISITAS', courtRevenue],
                ];
                XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), courtName);
              });
              // Hoja Luz
              if (lightSummary?.by_day?.length > 0) {
                const lightHeaders = ['Fecha', 'Horarios con luz', 'Monto por horario', 'Reservas cobradas', 'Total día'];
                const lightRows = lightSummary.by_day.map((d: any) => [
                  d.date,
                  d.time_slots.join(', '),
                  d.amount_per_slot,
                  d.count,
                  d.revenue,
                ]);
                const lightData = [
                  lightHeaders,
                  ...lightRows,
                  [],
                  ['', '', '', 'TOTAL LUZ', lightSummary.total_revenue],
                ];
                XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(lightData), 'Luz');
              }
              XLSX.writeFile(wb, `CTG_Reservas_${stats.month}.xlsx`);
            } catch {
              alert('Error al exportar Excel. Intenta de nuevo.');
            }
          };

          // ── Exportar CSV (Cancha 1, Cancha 2, Luz — solo reservas normales) ──
          const handleExportCSV = async () => {
            if (!stats) return;
            try {
              const allReservations = await api.getReservationsByMonth(stats.month);
              const headers = ['Socio', 'Tipo de socio', 'Fecha', 'Horario', 'Alta demanda', 'Con visita', 'Invitado', 'Compañero', 'Estado', 'Monto visita'];
              const toRow = (r: any): (string | number | boolean)[] => [
                r.player?.name || '',
                r.player?.member_type === 'socio' ? 'Socio' : r.player?.member_type === 'hijo_socio' ? 'Hijo de socio' : r.player?.member_type === 'profe' ? 'Profe/Escuela' : 'Visita',
                new Date(r.date).toLocaleDateString('es-CL'),
                r.time_slot,
                r.is_high_demand ? 'Sí' : 'No',
                r.has_guest ? 'Sí' : 'No',
                r.guest_name || '',
                r.partner_name || '',
                r.status === 'active' ? 'Activa' : r.status === 'completed' ? 'Completada' : 'Cancelada',
                r.has_guest ? (r.guest_fee || 3000) : '',
              ];
              const encodeRow = (r: (string | number | boolean)[]) =>
                r.map((v: string | number | boolean) => `"${String(v).replace(/"/g, '""')}"`).join(',');
              const courtSections = ['Cancha 1', 'Cancha 2'].map(courtName => {
                const courtRows = allReservations.filter((r: any) => r.court?.name === courtName && !r.is_challenge);
                const courtRevenue = courtRows.filter((r: any) => r.has_guest).reduce((s: number, r: any) => s + (r.guest_fee || 3000), 0);
                return [
                  `"${courtName}"`,
                  encodeRow(headers),
                  ...courtRows.map(toRow).map(encodeRow),
                  `"","","","","","","","","Total visitas","${courtRevenue}"`,
                ].join('\n');
              });
              const lightSection = lightSummary?.by_day?.length > 0 ? [
                '"LUZ"',
                '"Fecha","Horarios con luz","Monto por horario","Reservas cobradas","Total día"',
                ...lightSummary.by_day.map((d: any) =>
                  `"${d.date}","${d.time_slots.join(', ')}","${d.amount_per_slot}","${d.count}","${d.revenue}"`
                ),
                `"","","","Total luz","${lightSummary.total_revenue}"`,
              ].join('\n') : null;
              const allSections = [...courtSections, ...(lightSection ? [lightSection] : [])];
              const csv = '\uFEFF' + allSections.join('\n\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url  = URL.createObjectURL(blob);
              const a    = document.createElement('a');
              a.href     = url;
              a.download = `CTG_Reservas_${stats.month}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            } catch {
              alert('Error al exportar CSV. Intenta de nuevo.');
            }
          };

          return (
            <>
              {/* Header con filtros y export */}
              <div className="bg-[#0f2211] border border-[#1e4020] rounded-2xl p-5 mb-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div className="flex items-end gap-4">
                    <div>
                      <label className="label block mb-1.5">Mes</label>
                      <input type="month" value={statsMonth} onChange={e => setStatsMonth(e.target.value)} className="field" />
                    </div>
                    {stats && (
                      <p className="font-display font-bold text-[#F0F7E8] text-lg capitalize pb-0.5">{stats.month_label}</p>
                    )}
                  </div>
                  {stats && (
                    <div className="flex gap-2">
                      <button onClick={handleExportCSV} className="btn-ghost text-sm">
                        <span>⬇</span> CSV
                      </button>
                      <button onClick={handleExportXLSX} className="btn-primary text-sm">
                        <span>📊</span> Excel (.xlsx)
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {loadingStats ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-10 h-10 rounded-full border-2 border-ctg-green/20 border-t-ctg-green animate-spin" />
                </div>
              ) : !stats ? (
                <div className="text-center py-20 text-[#F0F7E8]/35 text-lg">No hay datos para este mes.</div>
              ) : (
                <div className="space-y-6">

                  {/* ── BLOQUE 1: KPIs principales (2 filas × 4) ── */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Fila 1 */}
                    <div className="bg-[#0f2211] border border-[#1e4020] rounded-2xl p-5 border-l-4 border-l-ctg-green">
                      <p className="text-[10px] uppercase tracking-wider text-[#F0F7E8]/40 font-semibold mb-1">Reservas normales</p>
                      <p className="font-display font-black text-3xl text-ctg-green">{stats.totals.normal}</p>
                      <p className="text-xs text-[#F0F7E8]/40 mt-2 flex items-center gap-1">
                        <span className="text-red-400 font-semibold">{stats.totals.cancelled_normal ?? 0} canceladas</span>
                        <span>·</span>
                        <span>{cancelRate}% tasa</span>
                      </p>
                    </div>
                    <div className="bg-[#0f2211] border border-[#1e4020] rounded-2xl p-5 border-l-4 border-l-orange-400">
                      <p className="text-[10px] uppercase tracking-wider text-[#F0F7E8]/40 font-semibold mb-1">Alta demanda</p>
                      <p className="font-display font-black text-3xl text-orange-400">{stats.demand.high}</p>
                      <p className="text-xs text-[#F0F7E8]/40 mt-2">{highDemandRate}% de reservas normales</p>
                    </div>
                    <div className={`bg-[#0f2211] border border-[#1e4020] rounded-2xl p-5 border-l-4 ${stats.totals.growth >= 0 ? 'border-l-ctg-green' : 'border-l-red-400'}`}>
                      <p className="text-[10px] uppercase tracking-wider text-[#F0F7E8]/40 font-semibold mb-1">vs mes anterior</p>
                      <p className={`font-display font-black text-3xl ${stats.totals.growth >= 0 ? 'text-ctg-green' : 'text-red-400'}`}>
                        {stats.totals.growth > 0 ? '+' : ''}{stats.totals.growth}%
                      </p>
                      <p className="text-xs text-[#F0F7E8]/40 mt-2">reservas normales</p>
                    </div>

                    {/* Fila 2 */}
                    <div className="bg-[#0f2211] border border-[#1e4020] rounded-2xl p-5 border-l-4 border-l-purple-400">
                      <p className="text-[10px] uppercase tracking-wider text-[#F0F7E8]/40 font-semibold mb-1">Visitas externas</p>
                      <p className="font-display font-black text-3xl text-purple-400">{stats.guest.count}</p>
                      <p className="text-xs text-[#F0F7E8]/40 mt-2">{guestRate}% · ${(stats.guest.revenue || 0).toLocaleString('es-CL')} recaudado</p>
                    </div>
                    <div className="bg-[#0f2211] border border-[#1e4020] rounded-2xl p-5 border-l-4 border-l-[#1e4020]">
                      <p className="text-[10px] uppercase tracking-wider text-[#F0F7E8]/40 font-semibold mb-1">Promedio / día activo</p>
                      <p className="font-display font-black text-3xl text-[#F0F7E8]">{avgPerDay}</p>
                      <p className="text-xs text-[#F0F7E8]/40 mt-2">{activeDays} días con actividad</p>
                    </div>
                    <div className="bg-[#0f2211] border border-[#1e4020] rounded-2xl p-5 border-l-4 border-l-amber-400">
                      <p className="text-[10px] uppercase tracking-wider text-[#F0F7E8]/40 font-semibold mb-1">💡 Cobro de luz</p>
                      <p className="font-display font-black text-3xl text-amber-400">${((lightSummary?.total_revenue || 0) / 1000).toFixed(0)}k</p>
                      <p className="text-xs text-[#F0F7E8]/40 mt-2">${(lightSummary?.total_revenue || 0).toLocaleString('es-CL')} · {lightSummary?.by_day?.length ?? 0} días</p>
                    </div>
                    <div className="bg-[#0f2211] border border-[#1e4020] rounded-2xl p-5 border-l-4 border-l-teal-400">
                      <p className="text-[10px] uppercase tracking-wider text-[#F0F7E8]/40 font-semibold mb-1">Horario peak</p>
                      <p className="font-display font-black text-3xl text-teal-400">{topSlot?.slot ?? '—'}</p>
                      <p className="text-xs text-[#F0F7E8]/40 mt-2">{topSlot?.count ?? 0} reservas</p>
                    </div>
                  </div>

                  {/* ── BLOQUE 2: Por tipo de socio ── */}
                  <div className="bg-[#0f2211] border border-[#1e4020] rounded-2xl p-5">
                    <h3 className="text-xs font-bold text-[#F0F7E8]/40 uppercase tracking-wider mb-4">Reservas normales por tipo de socio</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { key: 'socio',      label: 'Socios',          bar: 'bg-ctg-green',   text: 'text-ctg-green'  },
                        { key: 'hijo_socio', label: 'Hijos de socios', bar: 'bg-blue-400',    text: 'text-blue-400'   },
                        { key: 'profe',      label: 'Profes/Escuelas', bar: 'bg-emerald-400', text: 'text-emerald-400'},
                        { key: 'visita',     label: 'Visitas',         bar: 'bg-purple-400',  text: 'text-purple-400' },
                      ].map(({ key, label, bar, text }) => {
                        const val = stats.by_member_type?.[key] ?? 0;
                        const pct = Math.round(val / Math.max(stats.totals.normal, 1) * 100);
                        return (
                          <div key={key} className="bg-[#152b18] border border-[#1e4020] rounded-xl p-4">
                            <p className={`text-2xl font-extrabold ${text}`}>{val}</p>
                            <p className="text-xs text-[#F0F7E8]/40 mt-0.5 font-medium">{label}</p>
                            <div className="mt-2 h-1.5 bg-[#0f2211] rounded-full overflow-hidden">
                              <div className={`h-full ${bar} rounded-full`} style={{ width: `${pct}%` }} />
                            </div>
                            <p className="text-[10px] text-[#F0F7E8]/30 mt-1">{pct}% del total</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── BLOQUE 3: Gráfico por día ── */}
                  <div className="bg-[#0f2211] border border-[#1e4020] rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-display font-bold text-[#F0F7E8]">Reservas normales por día del mes</h3>
                      <div className="flex gap-4 text-xs text-[#F0F7E8]/40">
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-ctg-green inline-block"></span>Normales</span>
                      </div>
                    </div>
                    {(() => {
                      const maxAll = Math.max(...stats.by_day.map((x: any) => x.count), 1);
                      return (
                        <div className="flex gap-[3px] overflow-x-auto pt-1 pb-1">
                          {stats.by_day.map((d: any) => {
                            const hN = d.count > 0 ? Math.max(4, Math.round((d.count / maxAll) * 80)) : 0;
                            return (
                              <div key={d.day}
                                title={`Día ${d.day}: ${d.count} reservas normales`}
                                className="group flex flex-col items-center cursor-default"
                                style={{ minWidth: '18px' }}>
                                <span className={`text-[9px] font-bold transition-opacity ${d.count > 0 ? 'text-[#F0F7E8]/50 group-hover:text-[#F0F7E8]' : 'opacity-0'}`} style={{ height: '13px', lineHeight: '13px' }}>
                                  {d.count || ''}
                                </span>
                                <div className="relative" style={{ height: '80px', width: '100%' }}>
                                  {d.count === 0 && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-[#1e4020]" style={{ height: '3px', borderRadius: '2px 2px 0 0' }} />
                                  )}
                                  {hN > 0 && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-ctg-green"
                                      style={{ height: `${hN}px`, borderRadius: '2px 2px 0 0' }} />
                                  )}
                                </div>
                                <span className={`text-[9px] mt-0.5 ${d.count > 0 ? 'text-[#F0F7E8]/60 font-semibold' : 'text-[#F0F7E8]/20'}`}>
                                  {d.day}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* ── BLOQUE 4: Por cancha ── */}
                  <div className="bg-[#0f2211] border border-[#1e4020] rounded-2xl p-5">
                    <h3 className="font-display font-bold text-[#F0F7E8] mb-4">Ocupación por cancha</h3>
                    <div className="space-y-4">
                      {stats.by_court.map((c: any) => {
                        return (
                          <div key={c.court}>
                            <div className="flex justify-between items-baseline mb-1">
                              <span className="font-semibold text-[#F0F7E8]">{c.court}</span>
                              <span className="text-sm text-[#F0F7E8]/50">{c.count_normal ?? 0} reservas normales</span>
                            </div>
                            <div className="w-full bg-[#152b18] rounded-full h-3 overflow-hidden">
                              <div className="bg-ctg-green h-full transition-all rounded-full" style={{ width: `${c.occupancy ?? 0}%` }} />
                            </div>
                            <p className="mt-1 text-xs text-[#F0F7E8]/40">{c.occupancy ?? 0}% ocupación total</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── BLOQUE 5: Horarios + Top socios ── */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="bg-[#0f2211] border border-[#1e4020] rounded-2xl p-5">
                      <h3 className="font-display font-bold text-[#F0F7E8] mb-4">Horarios más reservados <span className="text-xs text-[#F0F7E8]/40 font-normal">(normales)</span></h3>
                      <div className="space-y-3">
                        {stats.by_slot.map((s: any, i: number) => {
                          const pct = stats.by_slot[0]?.count > 0 ? Math.round(s.count / stats.by_slot[0].count * 100) : 0;
                          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
                          return (
                            <div key={s.slot} className="flex items-center gap-3">
                              <span className="w-6 text-center text-sm">{medal ?? <span className="text-xs text-[#F0F7E8]/25 font-bold">{i+1}</span>}</span>
                              <span className="font-mono text-sm font-bold text-[#F0F7E8] w-12">{s.slot}</span>
                              <div className="flex-1 h-2 bg-[#152b18] rounded-full overflow-hidden">
                                <div className="h-full bg-ctg-green rounded-full transition-all" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-sm font-bold text-[#F0F7E8]/60 w-6 text-right">{s.count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-[#0f2211] border border-[#1e4020] rounded-2xl p-5">
                      <h3 className="font-display font-bold text-[#F0F7E8] mb-4">Socios más activos <span className="text-xs text-[#F0F7E8]/40 font-normal">(normales)</span></h3>
                      <div className="space-y-2">
                        {stats.top_players.map((p: any, i: number) => {
                          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
                          const maxC = stats.top_players[0]?.count ?? 1;
                          return (
                            <div key={p.player_id} className="flex items-center gap-3">
                              <span className="w-6 text-center text-sm">{medal ?? <span className="text-xs text-[#F0F7E8]/25 font-bold">{i+1}</span>}</span>
                              <span className="text-sm text-[#F0F7E8] flex-1 truncate font-medium">{p.name}</span>
                              <div className="w-16 h-1.5 bg-[#152b18] rounded-full overflow-hidden">
                                <div className="h-full bg-ctg-green rounded-full" style={{ width: `${Math.round(p.count / maxC * 100)}%` }} />
                              </div>
                              <span className="text-sm font-bold text-ctg-green w-5 text-right">{p.count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* ── BLOQUE 6: Visitas por socio + Hijos ── */}
                  {((stats.guest.by_player?.length > 0) || (stats.hijos_socio?.by_player?.length > 0)) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {stats.guest.by_player?.length > 0 && (
                        <div className="bg-[#0f2211] border border-[#1e4020] rounded-2xl p-5">
                          <h3 className="font-display font-bold text-[#F0F7E8] mb-4">Visitas externas por socio</h3>
                          <div className="space-y-2">
                            {stats.guest.by_player.map((p: any, i: number) => (
                              <div key={p.player_id} className="flex items-center gap-3 py-1 border-b border-[#1e4020] last:border-0">
                                <span className="text-xs font-bold text-[#F0F7E8]/25 w-4">{i+1}</span>
                                <span className="text-sm text-[#F0F7E8] flex-1 truncate">{p.name}</span>
                                <span className="chip chip-purple">{p.count}x</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {stats.hijos_socio?.by_player?.length > 0 && (
                        <div className="bg-[#0f2211] border border-[#1e4020] rounded-2xl p-5">
                          <h3 className="font-display font-bold text-[#F0F7E8] mb-4">Hijos de socios</h3>
                          <div className="space-y-2">
                            {stats.hijos_socio.by_player.map((p: any, i: number) => (
                              <div key={p.player_id} className="flex items-center gap-3 py-1 border-b border-[#1e4020] last:border-0">
                                <span className="text-xs font-bold text-[#F0F7E8]/25 w-4">{i+1}</span>
                                <span className="text-sm text-[#F0F7E8] flex-1 truncate">{p.name}</span>
                                <span className="chip chip-info">{p.count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── BLOQUE 7: Detalle visitas externas ── */}
                  {stats.guest.list?.length > 0 && (() => {
                    const GUESTS_PER_PAGE = 10;
                    const totalGuestPages = Math.ceil(stats.guest.list.length / GUESTS_PER_PAGE);
                    const pageData = stats.guest.list.slice(guestPage * GUESTS_PER_PAGE, (guestPage + 1) * GUESTS_PER_PAGE);
                    return (
                      <div className="bg-[#0f2211] border border-[#1e4020] rounded-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-[#1e4020] flex items-center justify-between">
                          <h3 className="font-display font-bold text-[#F0F7E8]">Detalle visitas externas</h3>
                          <span className="chip chip-purple">{stats.guest.count} visitas · ${(stats.guest.revenue || 0).toLocaleString('es-CL')}</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-[#152b18] text-[#F0F7E8]/45 text-xs uppercase tracking-wider">
                              <tr>
                                <th className="px-4 py-3 text-left font-semibold">Socio</th>
                                <th className="px-4 py-3 text-left font-semibold">Cancha</th>
                                <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                                <th className="px-4 py-3 text-left font-semibold">Hora</th>
                                <th className="px-4 py-3 text-left font-semibold">Invitado</th>
                                <th className="px-4 py-3 text-right font-semibold">Monto</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1e4020]">
                              {pageData.map((r: any) => (
                                <tr key={r.id} className="hover:bg-ctg-green/4 transition-colors">
                                  <td className="px-4 py-3 font-medium text-[#F0F7E8]">{r.player_name}</td>
                                  <td className="px-4 py-3 text-[#F0F7E8]/60">{r.court}</td>
                                  <td className="px-4 py-3 text-[#F0F7E8]/50 text-xs">{new Date(r.date).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                                  <td className="px-4 py-3 font-mono font-bold text-[#F0F7E8]/70">{r.time_slot}</td>
                                  <td className="px-4 py-3 text-[#F0F7E8]/60">{r.guest_name || <span className="text-[#F0F7E8]/25">—</span>}</td>
                                  <td className="px-4 py-3 text-right font-bold text-ctg-green">${(r.guest_fee || 3000).toLocaleString('es-CL')}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-[#152b18] border-t-2 border-[#1e4020]">
                              <tr>
                                <td colSpan={5} className="px-4 py-3 text-sm font-bold text-[#F0F7E8]/60">Total recaudado</td>
                                <td className="px-4 py-3 text-right text-base font-extrabold text-ctg-green">${(stats.guest.revenue || 0).toLocaleString('es-CL')}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                        {totalGuestPages > 1 && (
                          <div className="flex items-center justify-between px-5 py-3 border-t border-[#1e4020] bg-[#152b18]">
                            <span className="text-xs text-[#F0F7E8]/40">
                              {guestPage * GUESTS_PER_PAGE + 1}–{Math.min((guestPage + 1) * GUESTS_PER_PAGE, stats.guest.list.length)} de {stats.guest.list.length} visitas
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setGuestPage(p => Math.max(0, p - 1))}
                                disabled={guestPage === 0}
                                className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40"
                              >
                                ← Anterior
                              </button>
                              <span className="text-xs text-[#F0F7E8]/40">{guestPage + 1} / {totalGuestPages}</span>
                              <button
                                onClick={() => setGuestPage(p => Math.min(totalGuestPages - 1, p + 1))}
                                disabled={guestPage >= totalGuestPages - 1}
                                className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40"
                              >
                                Siguiente →
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* ── BLOQUE 8: Cobro de luz ── */}
                  {lightSummary && lightSummary.by_day?.length > 0 && (
                    <div className="bg-[#0f2211] border border-[#1e4020] rounded-2xl overflow-hidden">
                      <div className="px-5 py-4 border-b border-[#1e4020] flex items-center justify-between">
                        <h3 className="font-display font-bold text-[#F0F7E8]">💡 Cobro de luz</h3>
                        <span className="chip chip-warning">
                          Total: ${(lightSummary.total_revenue || 0).toLocaleString('es-CL')}
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-[#152b18] text-[#F0F7E8]/45 text-xs uppercase tracking-wider">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                              <th className="px-4 py-3 text-left font-semibold">Horarios con luz</th>
                              <th className="px-4 py-3 text-right font-semibold">$/horario</th>
                              <th className="px-4 py-3 text-right font-semibold">Reservas</th>
                              <th className="px-4 py-3 text-right font-semibold">Total día</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1e4020]">
                            {lightSummary.by_day.map((d: any) => (
                              <tr key={d.date} className="hover:bg-ctg-green/4 transition-colors">
                                <td className="px-4 py-3 text-[#F0F7E8]/60 text-xs">{new Date(d.date + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap gap-1">
                                    {d.time_slots.map((s: string) => (
                                      <span key={s} className="text-xs bg-amber-500/12 border border-amber-500/30 text-amber-400 px-1.5 py-0.5 rounded font-mono">{s}</span>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right text-[#F0F7E8]/60">${d.amount_per_slot.toLocaleString('es-CL')}</td>
                                <td className="px-4 py-3 text-right font-bold text-[#F0F7E8]/70">{d.count}</td>
                                <td className="px-4 py-3 text-right font-bold text-amber-400">${d.revenue.toLocaleString('es-CL')}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-[#152b18] border-t-2 border-[#1e4020]">
                            <tr>
                              <td colSpan={4} className="px-4 py-3 text-sm font-bold text-[#F0F7E8]/60">Total recaudado (luz)</td>
                              <td className="px-4 py-3 text-right text-base font-extrabold text-amber-400">${(lightSummary.total_revenue || 0).toLocaleString('es-CL')}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </>
          );
        })()}
      </div>

      <EditUserModal
        isOpen={!!editingPlayer}
        onClose={() => setEditingPlayer(null)}
        onSuccess={() => { loadPlayers(); setEditingPlayer(null); setUserMessage('Usuario actualizado.'); setTimeout(() => setUserMessage(''), 3000); }}
        player={editingPlayer}
        allPlayers={allPlayers}
      />
    </div>
  );
}
