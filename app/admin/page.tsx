'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { Player, Challenge } from '@/types';
import { api } from '@/lib/api';
import AddPlayerModal from '@/components/admin/AddPlayerModal';
import EditPlayerModal from '@/components/admin/EditPlayerModal';
import ChallengeManagementModal from '@/components/admin/ChallengeManagementModal';

export default function AdminPage() {
  const router = useRouter();
  const { player, loading } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'players' | 'challenges'>('dashboard');
  const [loadingData, setLoadingData] = useState(true);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  useEffect(() => {
    if (!loading && (!player || !player.is_admin)) {
      router.push('/');
      return;
    }

    if (player?.is_admin) {
      fetchData();
    }
  }, [player, loading, router]);

  const fetchData = async () => {
    try {
      const [playersData, challengesData] = await Promise.all([
        api.getPlayers(),
        api.getChallenges(),
      ]);

      setPlayers(playersData);
      setChallenges(challengesData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleDeletePlayer = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar a ${name}?`)) return;

    try {
      await api.deletePlayer(id);
      await fetchData();
      alert('Jugador eliminado correctamente');
    } catch (error) {
      alert('Error al eliminar jugador');
    }
  };

  const handleResetImmunity = async (id: string) => {
    try {
      await api.resetImmunity(id);
      await fetchData();
      alert('Inmunidad reseteada');
    } catch (error) {
      alert('Error al resetear inmunidad');
    }
  };

  const handleResetVulnerability = async (id: string) => {
    try {
      await api.resetVulnerability(id);
      await fetchData();
      alert('Vulnerabilidad reseteada');
    } catch (error) {
      alert('Error al resetear vulnerabilidad');
    }
  };

  const handleResolveChallenge = async (challengeId: string, winnerId: string, score: string) => {
    try {
      await api.resolveChallenge(challengeId, winnerId, score);
      await fetchData();
      setShowChallengeModal(false);
      setSelectedChallenge(null);
      alert('Desafío resuelto correctamente');
    } catch (error) {
      alert('Error al resolver desafío');
    }
  };

  const handleCancelChallenge = async (challengeId: string) => {
    try {
      await api.cancelChallenge(challengeId);
      await fetchData();
      setShowChallengeModal(false);
      setSelectedChallenge(null);
      alert('Desafío cancelado correctamente');
    } catch (error) {
      alert('Error al cancelar desafío');
    }
  };

  const handleExtendDeadline = async (challengeId: string, hours: number, type: 'accept' | 'play') => {
    try {
      await api.extendDeadline(challengeId, hours, type);
      await fetchData();
      setShowChallengeModal(false);
      setSelectedChallenge(null);
      alert(`Plazo extendido ${hours} horas correctamente`);
    } catch (error) {
      alert('Error al extender plazo');
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ctg-light via-white to-ctg-light/50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-ctg-green"></div>
      </div>
    );
  }

  if (!player?.is_admin) {
    return null;
  }

  const stats = {
    totalPlayers: players.filter(p => p.position > 0).length,
    activeChallenges: challenges.filter(c => c.status === 'pending' || c.status === 'accepted').length,
    completedMatches: challenges.filter(c => c.status === 'completed').length,
    disputes: challenges.filter(c => c.status === 'disputed').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ctg-light via-white to-ctg-light/50">
      <Header currentPage="admin" onLoginClick={() => {}} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-ctg-dark mb-2">Panel de Administrador</h1>
          <p className="text-gray-600">Gestión completa de la escalerilla</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'dashboard'
                ? 'text-ctg-dark border-b-2 border-ctg-green'
                : 'text-gray-500 hover:text-ctg-dark'
            }`}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => setActiveTab('players')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'players'
                ? 'text-ctg-dark border-b-2 border-ctg-green'
                : 'text-gray-500 hover:text-ctg-dark'
            }`}
          >
            👥 Jugadores
          </button>
          <button
            onClick={() => setActiveTab('challenges')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'challenges'
                ? 'text-ctg-dark border-b-2 border-ctg-green'
                : 'text-gray-500 hover:text-ctg-dark'
            }`}
          >
            🎾 Desafíos
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-card p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">👥</div>
                <div>
                  <p className="text-gray-500 text-sm">Total Jugadores</p>
                  <p className="text-3xl font-bold text-ctg-dark">{stats.totalPlayers}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center text-2xl">⏳</div>
                <div>
                  <p className="text-gray-500 text-sm">Desafíos Activos</p>
                  <p className="text-3xl font-bold text-ctg-dark">{stats.activeChallenges}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">✅</div>
                <div>
                  <p className="text-gray-500 text-sm">Partidos Jugados</p>
                  <p className="text-3xl font-bold text-ctg-dark">{stats.completedMatches}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-2xl">⚠️</div>
                <div>
                  <p className="text-gray-500 text-sm">Disputas</p>
                  <p className="text-3xl font-bold text-ctg-dark">{stats.disputes}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Players Tab */}
        {activeTab === 'players' && (
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-ctg-dark">Gestión de Jugadores</h2>
              <button 
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-ctg-green text-white rounded-lg hover:bg-ctg-lime transition-colors"
              >
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
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <span className="text-green-600 font-medium">{p.wins}</span>-
                        <span className="text-red-600 font-medium">{p.losses}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-col gap-1">
                          {p.immune_until && new Date(p.immune_until) > new Date() && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs inline-flex items-center gap-1">
                              🛡️ Inmune
                              <button onClick={() => handleResetImmunity(p.id)} className="ml-1 hover:text-blue-900" title="Quitar inmunidad">×</button>
                            </span>
                          )}
                          {p.vulnerable_until && new Date(p.vulnerable_until) > new Date() && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs inline-flex items-center gap-1">
                              ⚠️ Vulnerable
                              <button onClick={() => handleResetVulnerability(p.id)} className="ml-1 hover:text-orange-900" title="Quitar vulnerabilidad">×</button>
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

        {/* Challenges Tab */}
        {activeTab === 'challenges' && (
          <div className="bg-white rounded-xl shadow-card p-6">
            <h2 className="text-xl font-bold text-ctg-dark mb-6">Gestión de Desafíos</h2>
            
            <div className="space-y-4">
              {challenges.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay desafíos registrados</p>
              ) : (
                challenges.map((challenge) => (
                  <div key={challenge.id} className="border border-gray-200 rounded-lg p-4 hover:border-ctg-green transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-ctg-dark">
                          {challenge.challenger?.name} vs {challenge.challenged?.name}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Estado: <span className={`font-medium ${challenge.status === 'disputed' ? 'text-red-600' : ''}`}>{challenge.status}</span>
                        </p>
                        {challenge.final_score && (
                          <p className="text-sm text-gray-600">
                            Resultado: <span className="font-medium">{challenge.final_score}</span>
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Creado: {new Date(challenge.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedChallenge(challenge);
                            setShowChallengeModal(true);
                          }}
                          className={`px-3 py-1 text-sm rounded ${
                            challenge.status === 'disputed'
                              ? 'bg-red-500 text-white hover:bg-red-600'
                              : 'bg-ctg-green text-white hover:bg-ctg-lime'
                          }`}
                        >
                          {challenge.status === 'disputed' ? 'Resolver Disputa' : 'Gestionar'}
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
      <AddPlayerModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          fetchData();
          setShowAddModal(false);
        }}
      />

      <EditPlayerModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedPlayer(null);
        }}
        onSuccess={() => {
          fetchData();
          setShowEditModal(false);
          setSelectedPlayer(null);
        }}
        player={selectedPlayer}
      />

      <ChallengeManagementModal
        isOpen={showChallengeModal}
        onClose={() => {
          setShowChallengeModal(false);
          setSelectedChallenge(null);
        }}
        challenge={selectedChallenge}
        onResolve={handleResolveChallenge}
        onCancel={handleCancelChallenge}
        onExtend={handleExtendDeadline}
      />
    </div>
  );
}
