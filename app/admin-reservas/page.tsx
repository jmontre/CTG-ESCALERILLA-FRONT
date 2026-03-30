'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
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

  const [reservations, setReservations] = useState<any[]>([]);
  const [season, setSeason]             = useState('verano');
  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()));
  const [loading, setLoading]           = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [savingSeason, setSavingSeason] = useState(false);
  const [message, setMessage]           = useState('');
  const [error, setError]               = useState('');

  useEffect(() => {
    if (!authLoading && (!player || !player.is_admin)) { router.push('/'); return; }
    if (player?.is_admin) {
      loadData();
      api.getSeason().then(d => setSeason(d.season));
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-ctg-light via-white to-ctg-light/50">
      <Header currentPage="admin-reservas" onLoginClick={() => {}} />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-ctg-dark mb-1">Admin Reservas</h1>
          <p className="text-gray-500">Gestión del sistema de reservas de canchas</p>
        </div>

        {message && <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm mb-4">{message}</div>}
        {error   && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm mb-4">{error}</div>}

        {/* Config temporada */}
        <div className="bg-white rounded-xl shadow-card p-6 mb-6">
          <h2 className="text-lg font-bold text-ctg-dark mb-4">⚙️ Configuración</h2>
          <div className="flex items-center gap-4">
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
                {season === 'verano'
                  ? 'Alta demanda: 7:45, 9:30, 18:15, 20:00'
                  : 'Alta demanda: 9:30, 11:15, 16:30, 18:15'}
              </p>
            </div>
          </div>
        </div>

        {/* Filtro por fecha */}
        <div className="bg-white rounded-xl shadow-card p-6 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ctg-green" />
            </div>
            <div className="flex gap-4 text-sm mt-4">
              <span className="text-green-600 font-medium">✅ Activas: {activeReservations.length}</span>
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
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Visita</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Estado</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reservations
                    .sort((a, b) => a.time_slot.localeCompare(b.time_slot))
                    .map(r => (
                      <tr key={r.id} className={r.status === 'cancelled' ? 'opacity-50' : 'hover:bg-gray-50'}>
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
                            {r.is_high_demand && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">🔥 Alta</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {r.has_guest ? (
                            <span className="text-xs">👤 {r.guest_name || 'Sí'}</span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            r.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {r.status === 'active' ? '✅ Activa' : '🚫 Cancelada'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {r.status === 'active' && (
                            <button
                              onClick={() => handleCancelReservation(r.id)}
                              disabled={cancellingId === r.id}
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
      </div>
    </div>
  );
}