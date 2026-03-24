'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Toast from '@/components/Toast';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Player, Challenge } from '@/types';
import { api } from '@/lib/api';
import AddPlayerModal from '@/components/admin/AddPlayerModal';
import EditPlayerModal from '@/components/admin/EditPlayerModal';
import ChallengeManagementModal from '@/components/admin/ChallengeManagementModal';

export default function AdminPage() {
  const router = useRouter();
  const { player, loading } = useAuth();
  const { toasts, removeToast, success, error } = useToast();

  const [players, setPlayers] = useState<Player[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'players' | 'challenges'>('dashboard');
  const [loadingData, setLoadingData] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!player || !player.is_admin)) { router.push('/'); return; }
    if (player?.is_admin) fetchData();
  }, [player, loading, router]);

  const fetchData = async () => {
    try {
      const [playersData, challengesData] = await Promise.all([
        api.getPlayers(),
        api.getChallenges(),
      ]);
      setPlayers(playersData);
      setChallenges(challengesData);
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleDeletePlayer = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar a ${name}?`)) return;
    try {
      await api.deletePlayer(id);
      await fetchData();
      success(`Jugador ${name} eliminado correctamente.`);
    } catch (err: any) {
      error(err.message || 'Error al eliminar jugador');
    }
  };

  const handleResetImmunity = async (id: string) => {
    try {
      await api.resetImmunity(id);
      await fetchData();
      success('Inmunidad reseteada.');
    } catch (err: any) {
      error(err.message || 'Error al resetear inmunidad');
    }
  };

  const handleResetVulnerability = async (id: string) => {
    try {
      await api.resetVulnerability(id);
      await fetchData();
      success('Vulnerabilidad reseteada.');
    } catch (err: any) {
      error(err.message || 'Error al resetear vulnerabilidad');
    }
  };

  const handleResolveChallenge = async (challengeId: string, winnerId: string, score: string) => {
    try {
      await api.resolveChallenge(challengeId, winnerId, score);
      await fetchData();
      setShowChallengeModal(false);
      setSelectedChallenge(null);
      success('Desafío resuelto correctamente.');
    } catch (err: any) {
      error(err.message || 'Error al resolver desafío');
    }
  };

  const handleCancelChallenge = async (challengeId: string, fromModal = false) => {
    const challenge = challenges.find(c => c.id === challengeId);
    const isCompleted = challenge?.status === 'completed';
    const message = isCompleted
      ? '⚠️ Este desafío ya está completado.\n\nSe revertirán las estadísticas (W-L) pero NO los cambios de ranking.\n\n¿Continuar?'
      : '¿Estás seguro de cancelar este desafío?';
    if (!confirm(message)) return;

    setCancellingId(challengeId);
    try {
      await api.cancelChallenge(challengeId);
      await fetchData();
      if (fromModal) { setShowChallengeModal(false); setSelectedChallenge(null); }
      success('Desafío cancelado correctamente.');
    } catch (err: any) {
      error(err.message || 'Error al cancelar desafío');
    } finally {
      setCancellingId(null);
    }
  };

  const handleForceDelete = async (challengeId: string) => {
    if (!confirm('⚠️ ELIMINAR PERMANENTEMENTE\n\nEsto borrará el desafío de la base de datos sin posibilidad de recuperación.\n\n¿Estás seguro?')) return;

    setDeletingId(challengeId);
    try {
      await api.forceDeleteChallenge(challengeId);
      await fetchData();
      success('Desafío eliminado permanentemente.');
    } catch (err: any) {
      error(err.message || 'Error al eliminar desafío');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExtendDeadline = async (challengeId: string, hours: number, type: 'accept' | 'play') => {
    try {
      await api.extendDeadline(challengeId, hours, type);
      await fetchData();
      setShowChallengeModal(false);
      setSelectedChallenge(null);
      success(`Plazo extendido ${hours} horas correctamente.`);
    } catch (err: any) {
      error(err.message || 'Error al extender plazo');
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      pending:              { label: '⏳ Pendiente',        color: 'bg-yellow-100 text-yellow-700' },
      accepted:             { label: '🎾 Por jugar',        color: 'bg-blue-100 text-blue-700' },
      completed:            { label: '✅ Completado',       color: 'bg-green-100 text-green-700' },
      disputed:             { label: '⚠️ Disputa',          color: 'bg-red-100 text-red-700' },
      cancelled:            { label: '🚫 Cancelado',        color: 'bg-gray-100 text-gray-600' },
      rejected:             { label: '🏆 W.O.',             color: 'bg-green-100 text-green-700' },
      expired_not_accepted: { label: '⏰ Expiró (no resp)', color: 'bg-orange-100 text-orange-700' },
      expired_not_played:   { label: '⏰ Expiró (no jugó)', color: 'bg-orange-100 text-orange-700' },
    };
    const s = map[status] || { label: status, color: 'bg-gray-100 text-gray-600' };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.color}`}>{s.label}</span>;
  };

  const canCancel = (status: string) =>
    ['pending', 'accepted', 'disputed', 'completed'].includes(status);

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ctg-light via-white to-ctg-light/50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-ctg-green"></div>
      </div>
    );
  }

  if (!player?.is_admin) return null;

  const stats = {
    totalPlayers:     players.filter(p => p.position > 0).length,
    activeChallenges: challenges.filter(c => c.status === 'pending' || c.status === 'accepted').length,
    completedMatches: challenges.filter(c => c.status === 'completed').length,
    disputes:         challenges.filter(c => c.status === 'disputed').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ctg-light via-white to-ctg-light/50">
      <Header currentPage="admin" onLoginClick={() => {}} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-ctg-dark mb-2">Panel de Administrador</h1>
          <p className="text-gray-600">Gestión completa de la escalerilla</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {(['dashboard', 'players', 'challenges'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === tab ? 'text-ctg-dark border-b-2 border-ctg-green' : 'text-gray-500 hover:text-ctg-dark'
              }`}
            >
              {tab === 'dashboard' ? '📊 Dashboard' : tab === 'players' ? '👥 Jugadores' : '🎾 Desafíos'}
            </button>
          ))}
        </div>

        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '👥', label: 'Jugadores',       value: stats.totalPlayers,     bg: 'bg-blue-100' },
              { icon: '⏳', label: 'Desafíos Activos', value: stats.activeChallenges, bg: 'bg-amber-100' },
              { icon: '✅', label: 'Partidos Jugados', value: stats.completedMatches, bg: 'bg-green-100' },
              { icon: '⚠️', label: 'Disputas',         value: stats.disputes,         bg: 'bg-red-100' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl shadow-card p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${s.bg} rounded-lg flex items-center justify-center text-2xl`}>{s.icon}</div>
                  <div>
                    <p className="text-gray-500 text-sm">{s.label}</p>
                    <p className="text-3xl font-bold text-ctg-dark">{s.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Players */}
        {activeTab === 'players' && (
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-ctg-dark">Gestión de Jugadores</h2>
              <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-ctg-green text-white rounded-lg hover:bg-ctg-lime transition-colors">
                + Agregar Jugador
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Pos</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Nombre</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Teléfono</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">W-L</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Estado</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {players.filter(p => p.position > 0).map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-ctg-dark">#{p.position}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{p.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{p.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{p.phone || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="text-green-600 font-medium">{p.wins}</span>-
                        <span className="text-red-600 font-medium">{p.losses}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-col gap-1">
                          {p.immune_until && new Date(p.immune_until) > new Date() && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs inline-flex items-center gap-1">
                              🛡️ Inmune
                              <button onClick={() => handleResetImmunity(p.id)} className="ml-1 hover:text-blue-900">×</button>
                            </span>
                          )}
                          {p.vulnerable_until && new Date(p.vulnerable_until) > new Date() && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs inline-flex items-center gap-1">
                              ⚠️ Vulnerable
                              <button onClick={() => handleResetVulnerability(p.id)} className="ml-1 hover:text-orange-900">×</button>
                            </span>
                          )}
                          {(!p.immune_until || new Date(p.immune_until) <= new Date()) &&
                           (!p.vulnerable_until || new Date(p.vulnerable_until) <= new Date()) && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Normal</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <button onClick={() => { setSelectedPlayer(p); setShowEditModal(true); }} className="text-ctg-green hover:text-ctg-dark mr-3">Editar</button>
                        <button onClick={() => handleDeletePlayer(p.id, p.name)} className="text-red-600 hover:text-red-800">Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Challenges */}
        {activeTab === 'challenges' && (
          <div className="bg-white rounded-xl shadow-card p-6">
            <h2 className="text-xl font-bold text-ctg-dark mb-6">Gestión de Desafíos</h2>
            <div className="space-y-3">
              {challenges.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay desafíos registrados</p>
              ) : (
                challenges.map((challenge) => (
                  <div key={challenge.id} className="border border-gray-200 rounded-lg p-4 hover:border-ctg-green/50 transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-medium text-ctg-dark">
                            {challenge.challenger?.name} vs {challenge.challenged?.name}
                          </p>
                          {getStatusBadge(challenge.status)}
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                          <span>📅 {new Date(challenge.created_at).toLocaleDateString('es-CL')}</span>
                          {challenge.final_score && <span>🎾 {challenge.final_score}</span>}
                          {challenge.winner_id && (
                            <span>👑 {challenge.winner_id === challenge.challenger_id ? challenge.challenger?.name : challenge.challenged?.name}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Cancelar — solo en estados activos */}
                        {canCancel(challenge.status) && (
                          <button
                            onClick={() => handleCancelChallenge(challenge.id)}
                            disabled={cancellingId === challenge.id}
                            className="px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition disabled:opacity-50"
                          >
                            {cancellingId === challenge.id ? '...' : '🚫 Cancelar'}
                          </button>
                        )}

                        {/* Eliminar permanentemente */}
                        <button
                          onClick={() => handleForceDelete(challenge.id)}
                          disabled={deletingId === challenge.id}
                          className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                          title="Eliminar permanentemente de la DB"
                        >
                          {deletingId === challenge.id ? '...' : '🗑️'}
                        </button>

                        {/* Gestionar */}
                        <button
                          onClick={() => { setSelectedChallenge(challenge); setShowChallengeModal(true); }}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                            challenge.status === 'disputed'
                              ? 'bg-red-500 text-white hover:bg-red-600'
                              : 'bg-ctg-green text-white hover:bg-ctg-lime'
                          }`}
                        >
                          {challenge.status === 'disputed' ? '⚠️ Resolver' : '⚙️ Gestionar'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddPlayerModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={() => { fetchData(); setShowAddModal(false); }} />
      <EditPlayerModal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedPlayer(null); }} onSuccess={() => { fetchData(); setShowEditModal(false); setSelectedPlayer(null); }} player={selectedPlayer} />
      <ChallengeManagementModal
        isOpen={showChallengeModal}
        onClose={() => { setShowChallengeModal(false); setSelectedChallenge(null); }}
        challenge={selectedChallenge}
        onResolve={handleResolveChallenge}
        onCancel={(id) => handleCancelChallenge(id, true)}
        onExtend={handleExtendDeadline}
      />

      {toasts.map((toast) => (
        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}