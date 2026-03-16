'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { Challenge, Player } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function HistorialPage() {
  const router = useRouter();
  const { player: currentPlayer, loading: authLoading } = useAuth();
  
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [filteredChallenges, setFilteredChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'ganados' | 'perdidos'>('todos');
  const [filterDate, setFilterDate] = useState<'all' | 'week' | 'month' | 'year'>('all');

  useEffect(() => {
    // Redirigir si no está logueado o si es admin
    if (!authLoading) {
      if (!currentPlayer) {
        router.push('/');
        return;
      }
      if (currentPlayer.is_admin) {
        router.push('/admin');
        return;
      }
    }

    if (currentPlayer && !currentPlayer.is_admin) {
      loadHistory(currentPlayer.id);
    }
  }, [currentPlayer, authLoading, router]);

  useEffect(() => {
    applyFilters();
  }, [challenges, searchTerm, filterStatus, filterDate]);

  const loadHistory = async (playerId: string) => {
    try {
      const allChallenges = await api.getChallenges();
      
      // Filtrar solo partidos completados del jugador actual
      const myCompletedChallenges = allChallenges.filter(
        (c) =>
          (c.challenger_id === playerId || c.challenged_id === playerId) &&
          c.status === 'completed'
      );

      // Ordenar por fecha más reciente
      myCompletedChallenges.sort((a, b) => {
        const dateA = new Date(a.played_at || a.resolved_at || a.created_at).getTime();
        const dateB = new Date(b.played_at || b.resolved_at || b.created_at).getTime();
        return dateB - dateA;
      });

      setChallenges(myCompletedChallenges);
    } catch (error) {
      console.error('Error al cargar historial:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (!currentPlayer) return;

    let filtered = [...challenges];

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter((c) => {
        const rival =
          c.challenger_id === currentPlayer.id
            ? c.challenged?.name || ''
            : c.challenger?.name || '';
        return rival.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Filtro por resultado
    if (filterStatus !== 'todos') {
      filtered = filtered.filter((c) => {
        const won = c.winner_id === currentPlayer.id;
        return filterStatus === 'ganados' ? won : !won;
      });
    }

    // Filtro por fecha
    if (filterDate !== 'all') {
      const now = new Date();
      const filterTime = {
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000,
        year: 365 * 24 * 60 * 60 * 1000,
      }[filterDate];

      filtered = filtered.filter((c) => {
        const date = new Date(c.played_at || c.resolved_at || c.created_at);
        return now.getTime() - date.getTime() <= filterTime;
      });
    }

    setFilteredChallenges(filtered);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ctg-light via-white to-ctg-light/50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-ctg-green"></div>
      </div>
    );
  }

  // No renderizar si es admin o no está logueado
  if (!currentPlayer || currentPlayer.is_admin) {
    return null;
  }

  const stats = {
    total: challenges.length,
    wins: challenges.filter((c) => c.winner_id === currentPlayer.id).length,
    losses: challenges.filter((c) => c.winner_id !== currentPlayer.id).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ctg-light via-white to-ctg-light/50">
      <Header currentPage="historial" onLoginClick={() => {}} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-ctg-dark mb-2">Mi Historial</h1>
          <p className="text-gray-600">Revisa todos tus partidos jugados</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
                🎾
              </div>
              <div>
                <p className="text-gray-500 text-sm">Partidos Totales</p>
                <p className="text-3xl font-bold text-ctg-dark">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
                ✅
              </div>
              <div>
                <p className="text-gray-500 text-sm">Ganados</p>
                <p className="text-3xl font-bold text-ctg-green">{stats.wins}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-2xl">
                ❌
              </div>
              <div>
                <p className="text-gray-500 text-sm">Perdidos</p>
                <p className="text-3xl font-bold text-red-600">{stats.losses}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-card p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar rival
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nombre del rival..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ctg-green"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resultado
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ctg-green"
              >
                <option value="todos">Todos</option>
                <option value="ganados">Ganados</option>
                <option value="perdidos">Perdidos</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período
              </label>
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ctg-green"
              >
                <option value="all">Todo el tiempo</option>
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
                <option value="year">Último año</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de partidos */}
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          {filteredChallenges.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No se encontraron partidos
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredChallenges.map((challenge) => {
                const isWinner = challenge.winner_id === currentPlayer.id;
                const rival =
                  challenge.challenger_id === currentPlayer.id
                    ? challenge.challenged
                    : challenge.challenger;

                return (
                  <div
                    key={challenge.id}
                    className={`p-6 ${
                      isWinner ? 'bg-green-50' : 'bg-red-50'
                    } hover:bg-opacity-75 transition-colors`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-2xl ${
                              isWinner ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {isWinner ? '✅' : '❌'}
                          </span>
                          <div>
                            <p className="font-medium text-gray-900">
                              vs {rival?.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(
                                challenge.played_at ||
                                  challenge.resolved_at ||
                                  challenge.created_at
                              ).toLocaleDateString('es-CL', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {challenge.final_score || 'Sin resultado'}
                        </p>
                        <p
                          className={`text-sm font-medium ${
                            isWinner ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {isWinner ? 'Victoria' : 'Derrota'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
