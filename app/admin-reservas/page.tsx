'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

  // Stats
  const [stats, setStats]           = useState<any | null>(null);
  const [statsMonth, setStatsMonth] = useState(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`;
  });
  const [loadingStats, setLoadingStats] = useState(false);
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
      const data = await api.getStats(month);
      setStats(data);
    } catch { setStats(null); }
    finally { setLoadingStats(false); }
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
    if (activeTab === 'stats') loadStats(statsMonth);
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
                      className="px-4 py-2 bg-ctg-dark text-white rounded-lg text-sm font-medium hover:bg-ctg-green transition disabled:opacity-50">
                      {savingBlocks ? 'Guardando...' : '🔒 Guardar bloqueos'}
                    </button>
                    <button onClick={() => setBlockedSlots([])}
                      className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition">
                      Limpiar todo
                    </button>
                    {blockMessage && <span className="text-sm text-green-600">{blockMessage}</span>}
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
                                  className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition disabled:opacity-50">
                                  {cancellingId === r.id ? '...' : 'Cancelar'}
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
        {activeTab === 'stats' && (
          <>
            {/* Selector de mes */}
            <div className="flex items-center gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
                <input type="month" value={statsMonth} onChange={e => setStatsMonth(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ctg-green" />
              </div>
              {stats && <p className="text-sm text-gray-500 mt-5 capitalize">{stats.month_label}</p>}
            </div>

            {loadingStats ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-ctg-green"></div>
              </div>
            ) : !stats ? (
              <div className="text-center py-16 text-gray-400">No hay datos para este mes.</div>
            ) : (
              <div className="space-y-6">

                {/* KPIs principales */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Reservas activas', value: stats.totals.active, icon: '✅', color: 'text-ctg-green' },
                    { label: 'Canceladas', value: stats.totals.cancelled, icon: '🚫', color: 'text-red-500' },
                    { label: 'vs mes anterior', value: `${stats.totals.growth > 0 ? '+' : ''}${stats.totals.growth}%`, icon: stats.totals.growth >= 0 ? '📈' : '📉', color: stats.totals.growth >= 0 ? 'text-ctg-green' : 'text-red-500' },
                    { label: 'Con visita externa', value: stats.guest.count, icon: '👤', color: 'text-purple-600' },
                  ].map((kpi, i) => (
                    <div key={i} className="bg-white rounded-xl shadow-card p-4 text-center">
                      <p className="text-2xl mb-1">{kpi.icon}</p>
                      <p className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
                      <p className="text-xs text-gray-500 mt-1">{kpi.label}</p>
                    </div>
                  ))}
                </div>

                {/* Recaudación visitas + Alta vs Baja + Desafíos */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl shadow-card p-4">
                    <p className="text-sm font-semibold text-gray-500 mb-2">💰 Recaudación visitas</p>
                    <p className="text-3xl font-bold text-ctg-dark">${stats.guest.revenue.toLocaleString('es-CL')}</p>
                    <p className="text-xs text-gray-400 mt-1">{stats.guest.count} visitas × $3.000</p>
                  </div>
                  <div className="bg-white rounded-xl shadow-card p-4">
                    <p className="text-sm font-semibold text-gray-500 mb-2">🔥 Demanda</p>
                    <div className="flex gap-4">
                      <div>
                        <p className="text-2xl font-bold text-orange-500">{stats.demand.high}</p>
                        <p className="text-xs text-gray-400">Alta demanda</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-ctg-green">{stats.demand.low}</p>
                        <p className="text-xs text-gray-400">Baja demanda</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-card p-4">
                    <p className="text-sm font-semibold text-gray-500 mb-2">⚔️ Tipo</p>
                    <div className="flex gap-4">
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{stats.type.challenges}</p>
                        <p className="text-xs text-gray-400">Desafíos</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-ctg-dark">{stats.type.normal}</p>
                        <p className="text-xs text-gray-400">Normales</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reservas por día */}
                <div className="bg-white rounded-xl shadow-card p-5">
                  <h3 className="font-bold text-ctg-dark mb-4">📆 Reservas por día del mes</h3>
                  <div className="flex items-end gap-1 h-24 overflow-x-auto pb-2">
                    {stats.by_day.map((d: any) => {
                      const max = Math.max(...stats.by_day.map((x: any) => x.count), 1);
                      const h   = max > 0 ? Math.max(4, Math.round((d.count / max) * 80)) : 4;
                      return (
                        <div key={d.day} className="flex flex-col items-center gap-1 min-w-[20px]">
                          <span className="text-xs text-gray-500">{d.count > 0 ? d.count : ''}</span>
                          <div style={{ height: `${h}px` }}
                            className={`w-4 rounded-t ${d.count > 0 ? 'bg-ctg-green' : 'bg-gray-100'}`} />
                          <span className="text-[10px] text-gray-400">{d.day}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Por cancha */}
                <div className="bg-white rounded-xl shadow-card p-5">
                  <h3 className="font-bold text-ctg-dark mb-4">🎾 Ocupación por cancha</h3>
                  <div className="space-y-3">
                    {stats.by_court.map((c: any) => (
                      <div key={c.court}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-ctg-dark">{c.court}</span>
                          <span className="text-gray-500">{c.count} reservas · {c.occupancy}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-ctg-green h-2 rounded-full transition-all" style={{ width: `${c.occupancy}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top horarios + Top socios */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-card p-5">
                    <h3 className="font-bold text-ctg-dark mb-4">🕐 Horarios más populares</h3>
                    <div className="space-y-2">
                      {stats.by_slot.slice(0, 6).map((s: any, i: number) => (
                        <div key={s.slot} className="flex items-center gap-3">
                          <span className="text-xs font-bold text-gray-400 w-4">{i+1}</span>
                          <span className="text-sm font-mono text-ctg-dark w-12">{s.slot}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div className="bg-ctg-green h-2 rounded-full"
                              style={{ width: `${stats.by_slot[0].count > 0 ? (s.count / stats.by_slot[0].count) * 100 : 0}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 w-6 text-right">{s.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-card p-5">
                    <h3 className="font-bold text-ctg-dark mb-4">🏆 Socios más activos</h3>
                    <div className="space-y-2">
                      {stats.top_players.slice(0, 8).map((p: any, i: number) => (
                        <div key={p.player_id} className="flex items-center gap-3">
                          <span className={`text-xs font-bold w-4 ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-400' : 'text-gray-300'}`}>{i+1}</span>
                          <span className="text-sm text-ctg-dark flex-1 truncate">{p.name}</span>
                          <span className="text-xs font-bold text-ctg-green">{p.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Lista reservas con visita */}
                {stats.guest.list.length > 0 && (
                  <div className="bg-white rounded-xl shadow-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                      <h3 className="font-bold text-ctg-dark">👤 Reservas con visita externa ({stats.guest.count})</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-600">Socio</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-600">Cancha</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-600">Fecha</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-600">Hora</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-600">Invitado</th>
                            <th className="px-4 py-3 text-right font-medium text-gray-600">Monto</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {stats.guest.list.map((r: any) => (
                            <tr key={r.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-ctg-dark">{r.player_name}</td>
                              <td className="px-4 py-3 text-gray-600">{r.court}</td>
                              <td className="px-4 py-3 text-gray-600">{formatDate(new Date(r.date).toISOString().split('T')[0])}</td>
                              <td className="px-4 py-3 font-mono text-gray-600">{r.time_slot}</td>
                              <td className="px-4 py-3 text-gray-600">{r.guest_name || '—'}</td>
                              <td className="px-4 py-3 text-right font-semibold text-ctg-green">${(r.guest_fee || 3000).toLocaleString('es-CL')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>
            )}
          </>
        )}

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