'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import Header from '@/components/Header';
import EditUserModal from '@/components/admin/EditUserModal';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

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
  const [cancellingId, setCancellingId] = useState<string | null>(null);

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
  const [statsMonth, setStatsMonth] = useState(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`;
  });
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
      const data = await api.getPlayers();
      // Incluir TODOS los jugadores incluyendo los sin posición
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/players/all`).catch(() => null);
      if (res?.ok) {
        const all = await res.json();
        setAllPlayers(all);
      } else {
        setAllPlayers(data);
      }
    } finally {
      setLoadingPlayers(false);
    }
  };

  const loadStats = async (month: string) => {
    setLoadingStats(true);
    try {
      const [statsData, lightRes] = await Promise.all([
        api.getStats(month),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/reservations/light-summary?month=${month}`),
      ]);
      setStats(statsData);
      setLightSummary(lightRes.ok ? await lightRes.json() : null);
    } catch { setStats(null); setLightSummary(null); }
    finally { setLoadingStats(false); }
  };

  const loadLightConfig = async (date: string) => {
    setLoadingLight(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reservations/light-config?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setLightSlots(data.time_slots || []);
        setLightAmount(data.amount_per_slot ?? 3000);
      }
    } finally { setLoadingLight(false); }
  };

  const handleSaveLightConfig = async () => {
    setSavingLight(true);
    setLightMessage('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reservations/light-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: lightDate, time_slots: lightSlots, amount_per_slot: lightAmount }),
      });
      if (res.ok) {
        setLightMessage('Cobro de luz guardado.');
        setTimeout(() => setLightMessage(''), 3000);
      }
    } finally { setSavingLight(false); }
  };

  const toggleLightSlot = (slot: string) => {
    setLightSlots(prev => prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]);
  };

  const loadBlocks = async (courtId: string, date: string) => {
    if (!courtId) return;
    setLoadingBlocks(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reservations/blocks?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        const courtBlocks = data.filter((b: any) => b.court_id === courtId);
        setBlockedSlots(courtBlocks.map((b: any) => b.time_slot).filter(Boolean));
        setBlockReason(courtBlocks[0]?.reason || '');
      }
    } finally { setLoadingBlocks(false); }
  };

  const handleSaveBlocks = async () => {
    setSavingBlocks(true);
    setBlockMessage('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reservations/blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ court_id: blockCourt, date: blockDate, slots: blockedSlots, reason: blockReason || undefined }),
      });
      if (res.ok) {
        setBlockMessage('Bloqueos guardados correctamente.');
        setTimeout(() => setBlockMessage(''), 3000);
      }
    } finally { setSavingBlocks(false); }
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
    if (!confirm('¿Cancelar esta reserva?')) return;
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-ctg-green"></div>
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
    <div className="min-h-screen bg-gradient-to-br from-ctg-light via-white to-ctg-light/50">
      <Header currentPage="admin-reservas" onLoginClick={() => {}} />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-ctg-dark mb-1">Admin Reservas</h1>
          <p className="text-gray-500">Gestión del sistema de reservas de canchas</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {(['reservas', 'usuarios', 'stats'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium transition-colors capitalize ${
                activeTab === tab ? 'text-ctg-dark border-b-2 border-ctg-green' : 'text-gray-500 hover:text-ctg-dark'
              }`}>
              {tab === 'reservas' ? '📅 Reservas' : tab === 'usuarios' ? '👥 Usuarios' : '📊 Stats'}
            </button>
          ))}
        </div>

        {/* ── TAB RESERVAS ── */}
        {activeTab === 'reservas' && (
          <>
            {message && <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm mb-4">{message}</div>}
            {error   && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm mb-4">{error}</div>}

            {/* Config temporada */}
            <div className="bg-white rounded-xl shadow-card p-6 mb-6">
              <h2 className="text-lg font-bold text-ctg-dark mb-4">⚙️ Configuración</h2>
              <div>
                <p className="text-sm text-gray-500 mb-2">Temporada activa</p>
                <div className="flex gap-2">
                  {['verano', 'invierno'].map(s => (
                    <button key={s} onClick={() => handleSetSeason(s)} disabled={savingSeason || season === s}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition capitalize
                        ${season === s ? 'bg-ctg-green text-white shadow-md' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                      {s === 'verano' ? '☀️ Verano' : '❄️ Invierno'}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {season === 'verano' ? 'Alta demanda: 7:45, 9:30, 18:15, 20:00' : 'Alta demanda: 9:30, 11:15, 16:30, 18:15'}
                </p>
              </div>
            </div>

            {/* Bloqueos de canchas */}
            <div className="bg-white rounded-xl shadow-card p-6 mb-6">
              <h2 className="text-lg font-bold text-ctg-dark mb-4">🔒 Bloquear horarios</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cancha</label>
                  <select value={blockCourt} onChange={e => setBlockCourt(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ctg-green">
                    {courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                  <input type="date" value={blockDate} onChange={e => setBlockDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ctg-green" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motivo (opcional)</label>
                  <input type="text" value={blockReason} onChange={e => setBlockReason(e.target.value)}
                    placeholder="Ej: Mantenimiento"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ctg-green" />
                </div>
              </div>

              {loadingBlocks ? (
                <div className="text-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-ctg-green mx-auto"></div></div>
              ) : (
                <>
                  <p className="text-xs text-gray-500 mb-3">Selecciona los horarios a bloquear:</p>
                  <div className="flex gap-2 mb-3">
                    <button type="button" onClick={() => setBlockedSlots(['06:00','07:45','09:30','11:15','13:00','14:45','16:30','18:15','20:00','21:45'])}
                      className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium">
                      🔒 Bloquear día completo
                    </button>
                    <button type="button" onClick={() => setBlockedSlots([])}
                      className="text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition font-medium">
                      🔓 Desbloquear todo
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
                    {['06:00','07:45','09:30','11:15','13:00','14:45','16:30','18:15','20:00','21:45'].map(slot => (
                      <label key={slot} className={`flex items-center gap-2 p-2 rounded-lg border-2 cursor-pointer transition text-sm font-medium
                        ${blockedSlots.includes(slot) ? 'border-red-400 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                        <input type="checkbox" checked={blockedSlots.includes(slot)} onChange={() => toggleSlot(slot)}
                          className="accent-red-500" />
                        {slot}
                      </label>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={handleSaveBlocks} disabled={savingBlocks}
                      className="px-4 py-2 bg-ctg-dark text-white rounded-lg text-sm font-medium hover:bg-ctg-green transition disabled:opacity-50 flex items-center gap-2">
                      {savingBlocks ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Guardando...
                        </>
                      ) : '💾 Guardar cambios'}
                    </button>
                    {blockMessage && <span className="text-sm text-green-600">{blockMessage}</span>}
                    {blockedSlots.length > 0 && (
                      <span className="text-xs text-red-600 font-medium">{blockedSlots.length} horario(s) bloqueado(s)</span>
                    )}
                    {blockedSlots.length === 0 && (
                      <span className="text-xs text-green-600 font-medium">Sin bloqueos</span>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Cobro de luz */}
            <div className="bg-white rounded-xl shadow-card p-6 mb-6">
              <h2 className="text-lg font-bold text-ctg-dark mb-4">💡 Cobro de luz</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                  <input type="date" value={lightDate} onChange={e => setLightDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monto por horario ($)</label>
                  <input type="number" value={lightAmount} onChange={e => setLightAmount(Number(e.target.value))} min={0} step={500}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                </div>
              </div>
              {loadingLight ? (
                <div className="text-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-yellow-400 mx-auto"></div></div>
              ) : (
                <>
                  <p className="text-xs text-gray-500 mb-3">Selecciona los horarios donde se cobra luz:</p>
                  <div className="flex gap-2 mb-3">
                    <button type="button" onClick={() => setLightSlots(['06:00','07:45','09:30','11:15','13:00','14:45','16:30','18:15','20:00','21:45'])}
                      className="text-xs px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition font-medium">
                      💡 Todos los horarios
                    </button>
                    <button type="button" onClick={() => setLightSlots([])}
                      className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition font-medium">
                      Limpiar
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
                    {['06:00','07:45','09:30','11:15','13:00','14:45','16:30','18:15','20:00','21:45'].map(slot => (
                      <label key={slot} className={`flex items-center gap-2 p-2 rounded-lg border-2 cursor-pointer transition text-sm font-medium
                        ${lightSlots.includes(slot) ? 'border-yellow-400 bg-yellow-50 text-yellow-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                        <input type="checkbox" checked={lightSlots.includes(slot)} onChange={() => toggleLightSlot(slot)}
                          className="accent-yellow-500" />
                        {slot}
                      </label>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={handleSaveLightConfig} disabled={savingLight}
                      className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 transition disabled:opacity-50 flex items-center gap-2">
                      {savingLight ? (
                        <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Guardando...</>
                      ) : '💾 Guardar cobro de luz'}
                    </button>
                    {lightMessage && <span className="text-sm text-green-600">{lightMessage}</span>}
                    {lightSlots.length > 0 && (
                      <span className="text-xs text-yellow-600 font-medium">💡 {lightSlots.length} horario(s) con cobro · ${(lightAmount * lightSlots.length).toLocaleString('es-CL')} posible</span>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Filtro fecha */}
            <div className="bg-white rounded-xl shadow-card p-6 mb-6">
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                  <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ctg-green" />
                </div>
                <div className="flex gap-4 text-sm mt-4">
                  <span className="text-green-600 font-medium">✅ Activas: {activeReservations.length}</span>
                  <span className="text-blue-500 font-medium">🏁 Completadas: {completedReservations.length}</span>
                  <span className="text-gray-400">🚫 Canceladas: {cancelledReservations.length}</span>
                </div>
              </div>
            </div>

            {/* Tabla reservas */}
            <div className="bg-white rounded-xl shadow-card overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-ctg-dark">Reservas — {formatDate(selectedDate)}</h2>
              </div>
              {reservations.length === 0 ? (
                <div className="p-12 text-center text-gray-400">No hay reservas para esta fecha.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Hora</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Cancha</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Socio</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Tipo</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Con quién</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Estado</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-600">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {reservations
                        .sort((a, b) => a.time_slot.localeCompare(b.time_slot))
                        .map(r => (
                          <tr key={r.id} className={r.status === 'active' ? 'hover:bg-gray-50' : 'opacity-50'}>
                            <td className="px-4 py-3 font-mono font-bold text-ctg-dark">{r.time_slot}</td>
                            <td className="px-4 py-3 text-gray-700">{r.court?.name}</td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-ctg-dark">{r.player?.name}</p>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1 flex-wrap">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${r.player?.member_type === 'hijo_socio' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                  {r.player?.member_type === 'hijo_socio' ? 'Hijo' : 'Socio'}
                                </span>
                                {r.is_high_demand && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">🔥 Alta</span>}
                                {r.is_challenge && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">⚔️ Desafío</span>}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-600 text-xs">
                              {r.partner_name ? `🤝 ${r.partner_name}` : r.has_guest ? `👤 ${r.guest_name || 'Visita'}` : '—'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                r.status === 'active'    ? 'bg-green-100 text-green-700'  :
                                r.status === 'completed' ? 'bg-blue-100 text-blue-600'    :
                                                           'bg-gray-100 text-gray-500'
                              }`}>
                                {r.status === 'active' ? '✅ Activa' : r.status === 'completed' ? '🏁 Completada' : '🚫 Cancelada'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {r.status === 'active' && (
                                <button onClick={() => handleCancelReservation(r.id)} disabled={cancellingId === r.id}
                                  className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition disabled:opacity-50 flex items-center gap-1 ml-auto">
                                  {cancellingId === r.id ? (
                                    <>
                                      <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin"></div>
                                      <span>Cancelando...</span>
                                    </>
                                  ) : 'Cancelar'}
                                </button>
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
            {userMessage && <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm mb-4">{userMessage}</div>}
            {userError   && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm mb-4">{userError}</div>}

            <div className="flex items-center justify-between mb-4">
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o email..."
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ctg-green w-72" />
              <button onClick={() => setShowAddUser(!showAddUser)}
                className="px-4 py-2 bg-ctg-green text-white rounded-lg text-sm font-medium hover:bg-ctg-lime transition">
                + Nuevo usuario
              </button>
            </div>

            {/* Formulario nuevo usuario */}
            {showAddUser && (
              <div className="bg-white rounded-xl shadow-card p-6 mb-6 border-2 border-ctg-green/30">
                <h3 className="font-bold text-ctg-dark mb-4">Nuevo usuario de reservas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {[
                    { label: 'Nombre', key: 'name', type: 'text', placeholder: 'Nombre completo' },
                    { label: 'Email', key: 'email', type: 'email', placeholder: 'email@ejemplo.com' },
                    { label: 'Teléfono', key: 'phone', type: 'tel', placeholder: '+56912345678' },
                    { label: 'Usuario', key: 'username', type: 'text', placeholder: 'nombre.apellido' },
                    { label: 'Contraseña', key: 'password', type: 'password', placeholder: 'Mínimo 6 caracteres' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                      <input type={field.type} placeholder={field.placeholder}
                        value={(newUser as any)[field.key]}
                        onChange={e => setNewUser({...newUser, [field.key]: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ctg-green" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de socio</label>
                    <select value={newUser.member_type} onChange={e => setNewUser({...newUser, member_type: e.target.value, parent_id: ''})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ctg-green">
                      <option value="socio">Socio</option>
                      <option value="hijo_socio">Hijo de socio</option>
                      <option value="profe">Profe / Escuela</option>
                    </select>
                  </div>
                  {newUser.member_type === 'hijo_socio' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Socio padre</label>
                      <select value={newUser.parent_id} onChange={e => setNewUser({...newUser, parent_id: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ctg-green">
                        <option value="">— Seleccionar —</option>
                        {socios.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowAddUser(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancelar</button>
                  <button onClick={handleCreateUser} disabled={savingUser}
                    className="px-4 py-2 bg-ctg-green text-white rounded-lg text-sm font-medium disabled:opacity-50">
                    {savingUser ? 'Creando...' : 'Crear usuario'}
                  </button>
                </div>
              </div>
            )}

            {/* Lista usuarios */}
            <div className="bg-white rounded-xl shadow-card overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-ctg-dark">Usuarios ({filteredPlayers.length})</h2>
                <span className="text-xs text-gray-400">
                  {allPlayers.filter(p => !(p as any).position).length} sin escalerilla
                </span>
              </div>
              {loadingPlayers ? (
                <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-ctg-green mx-auto"></div></div>
              ) : filteredPlayers.length === 0 ? (
                <div className="p-8 text-center text-gray-400">No se encontraron usuarios.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Nombre</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Email / Teléfono</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Tipo</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Escalerilla</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Deuda</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-600">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredPlayers.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-ctg-dark">{p.name}</p>
                            {p.admin_role && <span className="text-xs text-ctg-green">Admin</span>}
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            <p>{p.email}</p>
                            {p.phone && <p className="text-xs">{p.phone}</p>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${(p as any).member_type === 'hijo_socio' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                              {(p as any).member_type === 'hijo_socio' ? 'Hijo' : 'Socio'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {p.position
                              ? <span className="text-xs bg-ctg-light text-ctg-dark px-2 py-0.5 rounded-full">#{p.position}</span>
                              : <span className="text-xs text-gray-400">Solo reservas</span>}
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => handleToggleDebt(p.id, (p as any).has_debt)}
                              className={`text-xs px-3 py-1 rounded-full font-medium transition ${
                                (p as any).has_debt
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                              }`}>
                              {(p as any).has_debt ? '⚠️ Con deuda' : 'Sin deuda'}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => setEditingPlayer(p)}
                              className="text-xs px-3 py-1.5 bg-ctg-green/10 text-ctg-green rounded-lg hover:bg-ctg-green/20 transition font-medium">
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
      </div>

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
              const allRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reservations?month=${stats.month}`);
              if (!allRes.ok) throw new Error();
              const allReservations = await allRes.json();
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
              const allRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reservations?month=${stats.month}`);
              if (!allRes.ok) throw new Error();
              const allReservations = await allRes.json();
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
              <div className="bg-white rounded-xl shadow-card p-5 mb-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div className="flex items-end gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Mes</label>
                      <input type="month" value={statsMonth} onChange={e => setStatsMonth(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ctg-green" />
                    </div>
                    {stats && (
                      <p className="text-lg font-bold text-ctg-dark capitalize pb-0.5">{stats.month_label}</p>
                    )}
                  </div>
                  {stats && (
                    <div className="flex gap-2">
                      <button onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2 border-2 border-ctg-green text-ctg-green rounded-lg text-sm font-semibold hover:bg-ctg-light transition">
                        <span>⬇</span> CSV
                      </button>
                      <button onClick={handleExportXLSX}
                        className="flex items-center gap-2 px-4 py-2 bg-ctg-green text-white rounded-lg text-sm font-semibold hover:bg-ctg-lime transition">
                        <span>📊</span> Excel (.xlsx)
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {loadingStats ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-ctg-green"></div>
                </div>
              ) : !stats ? (
                <div className="text-center py-20 text-gray-400 text-lg">No hay datos para este mes.</div>
              ) : (
                <div className="space-y-6">

                  {/* ── BLOQUE 1: KPIs principales (2 filas × 4) ── */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Fila 1 */}
                    <div className="bg-white rounded-2xl shadow-card p-5 border-l-4 border-ctg-green">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Reservas normales</p>
                      <p className="text-4xl font-extrabold text-ctg-green">{stats.totals.normal}</p>
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <span className="text-red-400 font-semibold">{stats.totals.cancelled_normal ?? 0} canceladas</span>
                        <span>·</span>
                        <span>{cancelRate}% tasa</span>
                      </p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-card p-5 border-l-4 border-orange-400">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Alta demanda</p>
                      <p className="text-4xl font-extrabold text-orange-500">{stats.demand.high}</p>
                      <p className="text-xs text-gray-400 mt-2">{highDemandRate}% de reservas normales</p>
                    </div>
                    <div className={`bg-white rounded-2xl shadow-card p-5 border-l-4 ${stats.totals.growth >= 0 ? 'border-ctg-green' : 'border-red-400'}`}>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">vs mes anterior</p>
                      <p className={`text-4xl font-extrabold ${stats.totals.growth >= 0 ? 'text-ctg-green' : 'text-red-500'}`}>
                        {stats.totals.growth > 0 ? '+' : ''}{stats.totals.growth}%
                      </p>
                      <p className="text-xs text-gray-400 mt-2">reservas normales</p>
                    </div>

                    {/* Fila 2 */}
                    <div className="bg-white rounded-2xl shadow-card p-5 border-l-4 border-purple-400">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Visitas externas</p>
                      <p className="text-4xl font-extrabold text-purple-600">{stats.guest.count}</p>
                      <p className="text-xs text-gray-400 mt-2">{guestRate}% · ${(stats.guest.revenue || 0).toLocaleString('es-CL')} recaudado</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-card p-5 border-l-4 border-ctg-dark">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Promedio / día activo</p>
                      <p className="text-4xl font-extrabold text-ctg-dark">{avgPerDay}</p>
                      <p className="text-xs text-gray-400 mt-2">{activeDays} días con actividad</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-card p-5 border-l-4 border-yellow-400">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">💡 Cobro de luz</p>
                      <p className="text-4xl font-extrabold text-yellow-500">${((lightSummary?.total_revenue || 0) / 1000).toFixed(0)}k</p>
                      <p className="text-xs text-gray-400 mt-2">${(lightSummary?.total_revenue || 0).toLocaleString('es-CL')} · {lightSummary?.by_day?.length ?? 0} días</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-card p-5 border-l-4 border-teal-400">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Horario peak</p>
                      <p className="text-4xl font-extrabold text-teal-600">{topSlot?.slot ?? '—'}</p>
                      <p className="text-xs text-gray-400 mt-2">{topSlot?.count ?? 0} reservas</p>
                    </div>
                  </div>

                  {/* ── BLOQUE 2: Por tipo de socio ── */}
                  <div className="bg-white rounded-2xl shadow-card p-5">
                    <h3 className="font-bold text-gray-500 mb-4 text-sm uppercase tracking-wide">Reservas normales por tipo de socio</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { key: 'socio',      label: 'Socios',          bar: 'bg-ctg-green',   text: 'text-ctg-green'  },
                        { key: 'hijo_socio', label: 'Hijos de socios', bar: 'bg-blue-400',    text: 'text-blue-600'   },
                        { key: 'profe',      label: 'Profes/Escuelas', bar: 'bg-emerald-400', text: 'text-emerald-600'},
                        { key: 'visita',     label: 'Visitas',         bar: 'bg-purple-400',  text: 'text-purple-600' },
                      ].map(({ key, label, bar, text }) => {
                        const val = stats.by_member_type?.[key] ?? 0;
                        const pct = Math.round(val / Math.max(stats.totals.normal, 1) * 100);
                        return (
                          <div key={key} className="bg-gray-50 rounded-xl p-4">
                            <p className={`text-2xl font-extrabold ${text}`}>{val}</p>
                            <p className="text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
                            <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className={`h-full ${bar} rounded-full`} style={{ width: `${pct}%` }} />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">{pct}% del total</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── BLOQUE 3: Gráfico por día ── */}
                  <div className="bg-white rounded-2xl shadow-card p-5">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-bold text-ctg-dark">Reservas normales por día del mes</h3>
                      <div className="flex gap-4 text-xs text-gray-500">
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
                                <span className={`text-[9px] font-bold transition-opacity ${d.count > 0 ? 'text-gray-500 group-hover:text-ctg-dark' : 'opacity-0'}`} style={{ height: '13px', lineHeight: '13px' }}>
                                  {d.count || ''}
                                </span>
                                <div className="relative" style={{ height: '80px', width: '100%' }}>
                                  {d.count === 0 && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-gray-100" style={{ height: '3px', borderRadius: '2px 2px 0 0' }} />
                                  )}
                                  {hN > 0 && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-ctg-green"
                                      style={{ height: `${hN}px`, borderRadius: '2px 2px 0 0' }} />
                                  )}
                                </div>
                                <span className={`text-[9px] mt-0.5 ${d.count > 0 ? 'text-gray-600 font-semibold' : 'text-gray-300'}`}>
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
                  <div className="bg-white rounded-2xl shadow-card p-5">
                    <h3 className="font-bold text-ctg-dark mb-4">Ocupación por cancha</h3>
                    <div className="space-y-4">
                      {stats.by_court.map((c: any) => {
                        return (
                          <div key={c.court}>
                            <div className="flex justify-between items-baseline mb-1">
                              <span className="font-semibold text-ctg-dark">{c.court}</span>
                              <span className="text-sm text-gray-500">{c.count_normal ?? 0} reservas normales</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                              <div className="bg-ctg-green h-full transition-all rounded-full" style={{ width: `${c.occupancy ?? 0}%` }} />
                            </div>
                            <p className="mt-1 text-xs text-gray-400">{c.occupancy ?? 0}% ocupación total</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── BLOQUE 5: Horarios + Top socios ── */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="bg-white rounded-2xl shadow-card p-5">
                      <h3 className="font-bold text-ctg-dark mb-4">Horarios más reservados <span className="text-xs text-gray-400 font-normal">(normales)</span></h3>
                      <div className="space-y-3">
                        {stats.by_slot.map((s: any, i: number) => {
                          const pct = stats.by_slot[0]?.count > 0 ? Math.round(s.count / stats.by_slot[0].count * 100) : 0;
                          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
                          return (
                            <div key={s.slot} className="flex items-center gap-3">
                              <span className="w-6 text-center text-sm">{medal ?? <span className="text-xs text-gray-300 font-bold">{i+1}</span>}</span>
                              <span className="font-mono text-sm font-bold text-ctg-dark w-12">{s.slot}</span>
                              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-ctg-green rounded-full transition-all" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-sm font-bold text-gray-600 w-6 text-right">{s.count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-card p-5">
                      <h3 className="font-bold text-ctg-dark mb-4">Socios más activos <span className="text-xs text-gray-400 font-normal">(normales)</span></h3>
                      <div className="space-y-2">
                        {stats.top_players.map((p: any, i: number) => {
                          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
                          const maxC = stats.top_players[0]?.count ?? 1;
                          return (
                            <div key={p.player_id} className="flex items-center gap-3">
                              <span className="w-6 text-center text-sm">{medal ?? <span className="text-xs text-gray-300 font-bold">{i+1}</span>}</span>
                              <span className="text-sm text-ctg-dark flex-1 truncate font-medium">{p.name}</span>
                              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
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
                        <div className="bg-white rounded-2xl shadow-card p-5">
                          <h3 className="font-bold text-ctg-dark mb-4">Visitas externas por socio</h3>
                          <div className="space-y-2">
                            {stats.guest.by_player.map((p: any, i: number) => (
                              <div key={p.player_id} className="flex items-center gap-3 py-1 border-b border-gray-50 last:border-0">
                                <span className="text-xs font-bold text-gray-300 w-4">{i+1}</span>
                                <span className="text-sm text-ctg-dark flex-1 truncate">{p.name}</span>
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">{p.count}x</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {stats.hijos_socio?.by_player?.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-card p-5">
                          <h3 className="font-bold text-ctg-dark mb-4">Hijos de socios</h3>
                          <div className="space-y-2">
                            {stats.hijos_socio.by_player.map((p: any, i: number) => (
                              <div key={p.player_id} className="flex items-center gap-3 py-1 border-b border-gray-50 last:border-0">
                                <span className="text-xs font-bold text-gray-300 w-4">{i+1}</span>
                                <span className="text-sm text-ctg-dark flex-1 truncate">{p.name}</span>
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">{p.count}</span>
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
                      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                          <h3 className="font-bold text-ctg-dark">Detalle visitas externas</h3>
                          <span className="text-xs bg-purple-100 text-purple-700 font-bold px-2.5 py-1 rounded-full">{stats.guest.count} visitas · ${(stats.guest.revenue || 0).toLocaleString('es-CL')}</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                              <tr>
                                <th className="px-4 py-3 text-left font-semibold">Socio</th>
                                <th className="px-4 py-3 text-left font-semibold">Cancha</th>
                                <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                                <th className="px-4 py-3 text-left font-semibold">Hora</th>
                                <th className="px-4 py-3 text-left font-semibold">Invitado</th>
                                <th className="px-4 py-3 text-right font-semibold">Monto</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {pageData.map((r: any) => (
                                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-4 py-3 font-medium text-ctg-dark">{r.player_name}</td>
                                  <td className="px-4 py-3 text-gray-600">{r.court}</td>
                                  <td className="px-4 py-3 text-gray-600 text-xs">{new Date(r.date).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                                  <td className="px-4 py-3 font-mono font-bold text-gray-700">{r.time_slot}</td>
                                  <td className="px-4 py-3 text-gray-600">{r.guest_name || <span className="text-gray-300">—</span>}</td>
                                  <td className="px-4 py-3 text-right font-bold text-ctg-green">${(r.guest_fee || 3000).toLocaleString('es-CL')}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                              <tr>
                                <td colSpan={5} className="px-4 py-3 text-sm font-bold text-gray-600">Total recaudado</td>
                                <td className="px-4 py-3 text-right text-base font-extrabold text-ctg-green">${(stats.guest.revenue || 0).toLocaleString('es-CL')}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                        {totalGuestPages > 1 && (
                          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
                            <span className="text-xs text-gray-500">
                              {guestPage * GUESTS_PER_PAGE + 1}–{Math.min((guestPage + 1) * GUESTS_PER_PAGE, stats.guest.list.length)} de {stats.guest.list.length} visitas
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setGuestPage(p => Math.max(0, p - 1))}
                                disabled={guestPage === 0}
                                className="px-3 py-1 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-white transition-colors"
                              >
                                ← Anterior
                              </button>
                              <span className="text-xs text-gray-400">{guestPage + 1} / {totalGuestPages}</span>
                              <button
                                onClick={() => setGuestPage(p => Math.min(totalGuestPages - 1, p + 1))}
                                disabled={guestPage >= totalGuestPages - 1}
                                className="px-3 py-1 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-white transition-colors"
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
                    <div className="bg-white rounded-2xl shadow-card overflow-hidden">
                      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-bold text-ctg-dark">💡 Cobro de luz</h3>
                        <span className="text-xs bg-yellow-100 text-yellow-700 font-bold px-2.5 py-1 rounded-full">
                          Total: ${(lightSummary.total_revenue || 0).toLocaleString('es-CL')}
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                              <th className="px-4 py-3 text-left font-semibold">Horarios con luz</th>
                              <th className="px-4 py-3 text-right font-semibold">$/horario</th>
                              <th className="px-4 py-3 text-right font-semibold">Reservas</th>
                              <th className="px-4 py-3 text-right font-semibold">Total día</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {lightSummary.by_day.map((d: any) => (
                              <tr key={d.date} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-gray-600 text-xs">{new Date(d.date + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap gap-1">
                                    {d.time_slots.map((s: string) => (
                                      <span key={s} className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-mono">{s}</span>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right text-gray-600">${d.amount_per_slot.toLocaleString('es-CL')}</td>
                                <td className="px-4 py-3 text-right font-bold text-gray-700">{d.count}</td>
                                <td className="px-4 py-3 text-right font-bold text-yellow-600">${d.revenue.toLocaleString('es-CL')}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                            <tr>
                              <td colSpan={4} className="px-4 py-3 text-sm font-bold text-gray-600">Total recaudado (luz)</td>
                              <td className="px-4 py-3 text-right text-base font-extrabold text-yellow-600">${(lightSummary.total_revenue || 0).toLocaleString('es-CL')}</td>
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